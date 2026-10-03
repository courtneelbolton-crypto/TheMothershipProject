function renderHotspotZones(){
  const svg=hotspotSvg();if(!svg)return;svg.innerHTML='';
  const section=hotspotOverlaySection();

  hotspotZones.filter(z=>z.page===section&&z.points.length===4).forEach(zone=>{
    const poly=document.createElementNS(HOTSPOT_NS,'polygon');
    poly.setAttribute('points',hotspotPointString(zone.points));
    poly.setAttribute('class','site-hotspot-zone display-'+zone.display+(zone.id===activeHotspotId?' is-selected':''));
    poly.style.setProperty('--hotspot-outline-colour',zone.color||'#cc3c3a');
    poly.style.setProperty('--hotspot-fill-colour',zone.fillColor||'#cc3c3a');
    const lineWidth=Math.max(.5,Math.min(8,+zone.outlineWidth||1.5));
    poly.style.setProperty('--hotspot-line-width',lineWidth);
    poly.style.setProperty('--hotspot-line-hover-width',Math.min(10,lineWidth+1.5));
    const alpha=Math.max(0,Math.min(1,(+zone.fillOpacity||0)/100));
    poly.style.setProperty('--hotspot-fill-alpha',String(alpha));
    poly.style.setProperty('--hotspot-fill-alpha-hover',String(alpha));
    poly.dataset.hotspotId=zone.id;

    poly.addEventListener('pointerenter',e=>{if(!hotspotDrawMode&&!hotspotCornerDrag&&!hotspotZoneDrag)hotspotTooltip(e,zone)});
    poly.addEventListener('pointermove',e=>{if(!hotspotDrawMode&&!hotspotCornerDrag&&!hotspotZoneDrag)hotspotTooltip(e,zone)});
    poly.addEventListener('pointerleave',()=>hotspotTooltip(null,null));
    poly.addEventListener('pointerdown',e=>{
      if(document.body.classList.contains('hotspot-editing')&&hotspotInteractionMode==='zone'){
        beginHotspotZoneDrag(e,zone)
      }
    });
    poly.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      if(hotspotSuppressZoneClick){hotspotSuppressZoneClick=false;return}
      if(document.body.classList.contains('hotspot-editing')){
        activeHotspotId=zone.id;syncHotspotEditorUI();renderHotspotZones();return
      }
      if(!hotspotDrawMode)openHotspotZone(zone)
    });
    svg.appendChild(poly);

    if(document.body.classList.contains('hotspot-editing')&&zone.id===activeHotspotId&&!hotspotDrawMode){
      zone.points.forEach((p,i)=>createHotspotPlus(svg,p,i,{zone}))
    }
  });

  if(hotspotDrawMode&&hotspotDraftPoints.length){
    const draft=document.createElementNS(HOTSPOT_NS,'polyline');
    draft.setAttribute('points',hotspotPointString(hotspotDraftPoints));
    draft.setAttribute('class','hotspot-draft-line');
    svg.appendChild(draft);
    hotspotDraftPoints.forEach((p,i)=>createHotspotPlus(svg,p,i,{draft:true}))
  }
  updateHotspotOverlayVisibility()
}
function hotspotSuspendForCamera(ms=900){
  clearTimeout(hotspotCameraTimer);hotspotCameraSuspended=ms>0;updateHotspotOverlayVisibility();
  hotspotCameraTimer=setTimeout(()=>{hotspotCameraSuspended=false;renderHotspotZones()},Math.max(0,ms))
}
function hotspotStatus(msg){const el=document.getElementById('hotspotStatus');if(el)el.textContent=msg}
function syncHotspotEditorUI(){
  const select=document.getElementById('hotspotSelect');if(!select)return;
  hotspotPopupFrameOptions();

  const page=hotspotEditorPage();hotspotEditorSection=page;
  const pageZones=hotspotZones.filter(z=>z.page===page),keep=activeHotspotId;
  select.innerHTML='<option value="">— NEW / NONE —</option>'+pageZones.map(z=>
    '<option value="'+z.id.replace(/"/g,'&quot;')+'">'+String(z.label||'CLICKABLE AREA').replace(/</g,'&lt;')+'</option>'
  ).join('');
  if(pageZones.some(z=>z.id===keep))select.value=keep;
  else if(keep){activeHotspotId='';select.value=''}

  const z=currentHotspotZone(),set=(id,v)=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=v==null?'':v};
  const op=document.getElementById('hotspotFillOpacityValue'),
        ow=document.getElementById('hotspotOutlineWidthValue'),
        cw=document.getElementById('hotspotCornerWidthValue'),
        ch=document.getElementById('hotspotCornerHeightValue');

  if(z){
    set('hotspotShape',z.shape);set('hotspotLabel',z.label);set('hotspotAction',z.action);set('hotspotTarget',z.target);
    set('hotspotDisplay','hover');set('hotspotColor',z.color);set('hotspotFillColor',z.fillColor);
    set('hotspotOutlineWidth',z.outlineWidth);if(ow)ow.textContent=(Math.round(z.outlineWidth*100)/100)+' PX';
    set('hotspotFillOpacity',z.fillOpacity);if(op)op.textContent=Math.round(z.fillOpacity)+'%';
    set('hotspotCornerShape',z.cornerShape);set('hotspotCornerColor',z.cornerColor);
    set('hotspotCornerWidth',z.cornerWidth);if(cw)cw.textContent=Math.round(z.cornerWidth);
    set('hotspotCornerHeight',z.cornerHeight);if(ch)ch.textContent=Math.round(z.cornerHeight);
    set('hotspotKicker',z.kicker);set('hotspotTitle',z.title);set('hotspotText',z.text);set('hotspotButton',z.button);
    set('hotspotPopupFrame',z.popupFrameId);set('hotspotImageMode',z.imageMode);
    hotspotSetDraftImage(z.customImage||'');
    hotspotStatus((z.label||'ZONE')+' · 4 POINTS · '+String(z.action).toUpperCase())
  }else{
    set('hotspotShape','rectangle');set('hotspotLabel','');set('hotspotAction','navigate');set('hotspotTarget',page);
    set('hotspotDisplay','hover');set('hotspotColor','#cc3c3a');set('hotspotFillColor','#cc3c3a');
    set('hotspotOutlineWidth',1.5);if(ow)ow.textContent='1.5 PX';
    set('hotspotFillOpacity',18);if(op)op.textContent='18%';
    set('hotspotCornerShape','plus');set('hotspotCornerColor','#ffffff');
    set('hotspotCornerWidth',9);if(cw)cw.textContent='9';
    set('hotspotCornerHeight',9);if(ch)ch.textContent='9';
    set('hotspotKicker',(SITE_SECTION_META[page]?.number||'01')+' · '+(SITE_SECTION_META[page]?.label||'VENUE'));
    set('hotspotTitle','');set('hotspotText','');set('hotspotButton','VIEW SECTION');
    set('hotspotPopupFrame','');set('hotspotImageMode','none');hotspotSetDraftImage('');
    hotspotStatus(pageZones.length?pageZones.length+' zone'+(pageZones.length===1?'':'s')+' on '+(SITE_SECTION_META[page]?.label||page):'No interactive zones on this page yet.')
  }
  renderHotspotZones()
}
function hotspotDetailsFromUI(zone){
  if(!zone)return;
  const val=id=>document.getElementById(id)?.value||'';
  zone.page=hotspotEditorPage();
  zone.shape=val('hotspotShape')==='perspective'?'perspective':(val('hotspotShape')==='square'?'square':'rectangle');
  zone.label=val('hotspotLabel').trim()||'CLICKABLE AREA';
  zone.action=V170_ZONE_ONLY_MODE?'navigate':(['popup','navigate','both'].includes(val('hotspotAction'))?val('hotspotAction'):'popup');
  zone.target=SITE_SECTION_META[val('hotspotTarget')]?val('hotspotTarget'):zone.page;
  zone.display='hover';
  zone.color=val('hotspotColor')||'#cc3c3a';
  zone.outlineWidth=Math.max(.5,Math.min(8,+val('hotspotOutlineWidth')||1.5));
  zone.fillColor=val('hotspotFillColor')||'#cc3c3a';
  zone.fillOpacity=V170_ZONE_ONLY_MODE?0:Math.max(0,Math.min(100,+val('hotspotFillOpacity')||0));
  zone.cornerShape=val('hotspotCornerShape')==='x'?'x':'plus';
  zone.cornerWidth=Math.max(3,Math.min(30,+val('hotspotCornerWidth')||9));
  zone.cornerHeight=Math.max(3,Math.min(30,+val('hotspotCornerHeight')||9));
  zone.cornerColor=val('hotspotCornerColor')||'#ffffff';
  zone.kicker=val('hotspotKicker').trim()||((SITE_SECTION_META[zone.page]?.number||'01')+' · '+(SITE_SECTION_META[zone.page]?.label||'VENUE'));
  zone.title=val('hotspotTitle').trim()||zone.label;
  zone.text=val('hotspotText').trim();
  zone.button=val('hotspotButton').trim();
  zone.popupFrameId=val('hotspotPopupFrame');
  zone.imageMode=['none','frame','custom'].includes(val('hotspotImageMode'))?val('hotspotImageMode'):'none';
  zone.customImage=hotspotDraftImageData||'';
  if(zone.points.length===4)zone.points=hotspotRectPoints(zone.points,zone.shape)
}
function applyHotspotDetails(){
  const z=currentHotspotZone();if(!z){hotspotStatus('Create or choose a zone first.');return}
  hotspotDetailsFromUI(z);persistHotspotZones();syncHotspotEditorUI();renderHotspotZones();flashEditor('Interactive zone updated')
}
function hotspotGoToPageFrame(){
  const page=hotspotEditorPage();hotspotEditorSection=page;
  document.body.classList.add('hotspot-editing');setHotspotInteractionMode('zone',{announce:false});
  if(mode2d)setMode(false);
  siteGoCamera(page,true);renderHotspotZones();
  hotspotStatus('Editing '+(SITE_SECTION_META[page]?.label||page)+' zones · 3D + PERSPECTIVE supported · select a saved zone or draw a new 4-point area')
}
function startHotspotDrawing(makeNew=false){
  const page=hotspotEditorPage();hotspotEditorSection=page;
  if(mode2d)setMode(false);setHotspotInteractionMode('zone',{announce:false});

  let z=currentHotspotZone();hotspotDrawWasNew=false;
  if(makeNew||!z){
    z=normaliseHotspotZone({
      page,target:page,shape:document.getElementById('hotspotShape')?.value||'rectangle',
      label:'CLICKABLE AREA',action:'popup',display:'hover',
      color:'#cc3c3a',outlineWidth:1.5,fillColor:'#cc3c3a',fillOpacity:18,
      cornerShape:'plus',cornerWidth:9,cornerHeight:9,cornerColor:'#ffffff',points:[]
    });
    hotspotZones.push(z);activeHotspotId=z.id;hotspotDrawWasNew=true
  }

  hotspotDetailsFromUI(z);
  hotspotDraftOriginal=z.points.map(p=>p.slice());
  hotspotDraftPoints=[];hotspotDrawMode=true;
  document.body.classList.add('hotspot-editing','hotspot-drawing');
  syncHotspotEditorUI();renderHotspotZones();
  hotspotStatus('DRAWING IN '+(cinematicPerspective?'PERSPECTIVE':'3D')+' · click exactly 4 corner points · '+(z.shape==='perspective'?'the zone will follow those points exactly':'the finished zone will snap to a '+z.shape.toUpperCase()))
}
function undoHotspotPoint(){
  if(!hotspotDrawMode||!hotspotDraftPoints.length)return;
  hotspotDraftPoints.pop();renderHotspotZones();
  hotspotStatus('DRAWING · '+hotspotDraftPoints.length+'/4 points')
}
function finishHotspotDrawing(){
  const z=currentHotspotZone();if(!hotspotDrawMode||!z)return;
  if(hotspotDraftPoints.length!==4){hotspotStatus('Add exactly 4 corner points before finishing.');return}
  z.points=hotspotRectPoints(hotspotDraftPoints,z.shape);
  hotspotDrawMode=false;hotspotDraftPoints=[];hotspotDraftOriginal=null;hotspotDrawWasNew=false;
  document.body.classList.remove('hotspot-drawing');
  persistHotspotZones();syncHotspotEditorUI();renderHotspotZones();
  hotspotStatus((z.label||'ZONE')+' saved · drag the + corners to resize')
}
function cancelHotspotDrawing(){
  if(!hotspotDrawMode)return;
  const z=currentHotspotZone();
  if(z){
    if(hotspotDrawWasNew)hotspotZones=hotspotZones.filter(x=>x.id!==z.id);
    else z.points=Array.isArray(hotspotDraftOriginal)?hotspotDraftOriginal.map(p=>p.slice()):z.points
  }
  hotspotDrawMode=false;hotspotDraftPoints=[];hotspotDraftOriginal=null;hotspotDrawWasNew=false;
  document.body.classList.remove('hotspot-drawing');
  activeHotspotId=hotspotZones.some(x=>x.id===activeHotspotId)?activeHotspotId:'';
  syncHotspotEditorUI();renderHotspotZones();hotspotStatus('Drawing cancelled')
}
function deleteHotspotZone(){
  const z=currentHotspotZone();if(!z)return;
  hotspotZones=hotspotZones.filter(x=>x.id!==z.id);activeHotspotId='';hotspotDrawMode=false;hotspotDraftPoints=[];
  document.body.classList.remove('hotspot-drawing');
  persistHotspotZones();syncHotspotEditorUI();renderHotspotZones();flashEditor('Interactive zone deleted')
}

function v170SimplifyHotspotBuilder(){
  const apply=document.getElementById('hotspotApply');if(apply)apply.textContent='SAVE ZONE';
  const st=document.getElementById('hotspotStatus');if(st&&!hotspotZones.length)st.textContent='Draw a 4-point zone, add hover text and choose the page it opens.';
  const note=document.querySelector('#hotspotZoneBuilder .builder-note');if(note)note.innerHTML='<b>ZONE WORKFLOW:</b> choose which page the zone appears on, draw / move its four points, add the hover label, and choose the page it opens. Use <b>MOVE VIEW / CAMERA</b> to reposition the 3D or Perspective view without changing the zone.';
}

function initHotspotZoneEditor(){
  v170SimplifyHotspotBuilder();
  const svg=hotspotSvg();if(!svg||svg.dataset.bound==='1')return;svg.dataset.bound='1';
  const on=(id,ev,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener(ev,fn)};

  on('hotspotEditZoneMode','click',()=>setHotspotInteractionMode('zone'));
  on('hotspotMoveViewMode','click',()=>setHotspotInteractionMode('view'));
  on('hotspotPage','change',e=>{hotspotEditorSection=e.target.value||'venue';activeHotspotId='';syncHotspotEditorUI()});
  on('hotspotSelect','change',e=>{activeHotspotId=e.target.value||'';syncHotspotEditorUI()});
  on('hotspotPreviewFrame','click',hotspotGoToPageFrame);
  on('hotspotNewDraw','click',()=>startHotspotDrawing(true));
  on('hotspotRedraw','click',()=>startHotspotDrawing(false));
  on('hotspotUndoPoint','click',undoHotspotPoint);
  on('hotspotFinishDraw','click',finishHotspotDrawing);
  on('hotspotCancelDraw','click',cancelHotspotDrawing);
  on('hotspotApply','click',applyHotspotDetails);
  on('hotspotDelete','click',deleteHotspotZone);
  on('hotspotUploadImage','click',hotspotUploadImage);
  on('hotspotClearImage','click',hotspotClearImage);
  on('hotspotImageInput','change',hotspotReadImageFile);

  on('hotspotOutlineWidth','input',e=>{
    const n=Math.max(.5,Math.min(8,+e.target.value||1.5));
    const out=document.getElementById('hotspotOutlineWidthValue');if(out)out.textContent=(Math.round(n*100)/100)+' PX';
    const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.outlineWidth=n;renderHotspotZones()}
  });
  on('hotspotFillOpacity','input',e=>{
    const n=Math.max(0,Math.min(100,+e.target.value||0));
    const out=document.getElementById('hotspotFillOpacityValue');if(out)out.textContent=Math.round(n)+'%';
    const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.fillOpacity=n;renderHotspotZones()}
  });
  on('hotspotCornerWidth','input',e=>{
    const n=Math.max(3,Math.min(30,+e.target.value||9));
    const out=document.getElementById('hotspotCornerWidthValue');if(out)out.textContent=Math.round(n);
    const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.cornerWidth=n;renderHotspotZones()}
  });
  on('hotspotCornerHeight','input',e=>{
    const n=Math.max(3,Math.min(30,+e.target.value||9));
    const out=document.getElementById('hotspotCornerHeightValue');if(out)out.textContent=Math.round(n);
    const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.cornerHeight=n;renderHotspotZones()}
  });
  on('hotspotCornerShape','change',e=>{const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.cornerShape=e.target.value==='x'?'x':'plus';renderHotspotZones()}});
  on('hotspotCornerColor','input',e=>{const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.cornerColor=e.target.value;renderHotspotZones()}});
  on('hotspotColor','input',e=>{const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.color=e.target.value;renderHotspotZones()}});
  on('hotspotFillColor','input',e=>{const z=currentHotspotZone();if(z&&!hotspotDrawMode){z.fillColor=e.target.value;renderHotspotZones()}});
  on('hotspotShape','change',e=>{
    const z=currentHotspotZone();if(z&&z.points.length===4&&!hotspotDrawMode){
      z.shape=e.target.value==='perspective'?'perspective':(e.target.value==='square'?'square':'rectangle');
      z.points=hotspotRectPoints(z.points,z.shape);renderHotspotZones()
    }
  });

  svg.addEventListener('click',e=>{
    if(!hotspotDrawMode)return;
    e.preventDefault();e.stopPropagation();
    if(hotspotDraftPoints.length>=4)return;
    hotspotDraftPoints.push([
      clampHotspot01(e.clientX/Math.max(1,innerWidth)),
      clampHotspot01(e.clientY/Math.max(1,innerHeight))
    ]);
    renderHotspotZones();
    if(hotspotDraftPoints.length===4)finishHotspotDrawing();
    else hotspotStatus('DRAWING · '+hotspotDraftPoints.length+'/4 points')
  });

  svg.addEventListener('pointermove',e=>{
    if(hotspotZoneDrag){moveHotspotZoneDrag(e);return}
    if(!hotspotCornerDrag)return;
    const z=hotspotZones.find(x=>x.id===hotspotCornerDrag.zoneId);if(!z)return;
    dragHotspotCorner(
      z,hotspotCornerDrag.index,
      e.clientX/Math.max(1,innerWidth),
      e.clientY/Math.max(1,innerHeight)
    );
    renderHotspotZones()
  });
  const finishZonePointer=e=>{
    if(hotspotZoneDrag){finishHotspotZoneDrag();return}
    if(!hotspotCornerDrag)return;
    try{svg.releasePointerCapture?.(hotspotCornerDrag.pointerId)}catch(_){}
    hotspotCornerDrag=null;document.body.classList.remove('hotspot-corner-dragging');
    persistHotspotZones();renderHotspotZones();hotspotStatus('Zone resized · corner markers remain editable')
  };
  svg.addEventListener('pointerup',finishZonePointer);
  svg.addEventListener('pointercancel',finishZonePointer);

  // Hold SPACE while adjusting a zone to temporarily pass all input through
  // to the underlying 3D camera, then release to continue zone editing.
  window.addEventListener('keydown',e=>{
    if(e.code!=='Space'||e.repeat||!editMode||!document.body.classList.contains('hotspot-editing'))return;
    const tag=(document.activeElement?.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||tag==='select'||document.activeElement?.isContentEditable)return;
    if(hotspotDrawMode||hotspotCornerDrag||hotspotZoneDrag)return;
    e.preventDefault();
    hotspotModeBeforeSpace=hotspotInteractionMode;
    hotspotSpaceMoveActive=true;
    setHotspotInteractionMode('view',{announce:false});
    hotspotStatus('SPACE HELD · MOVE VIEW / CAMERA · release SPACE to continue editing the zone')
  });
  window.addEventListener('keyup',e=>{
    if(e.code!=='Space'||!hotspotSpaceMoveActive)return;
    e.preventDefault();
    hotspotSpaceMoveActive=false;
    setHotspotInteractionMode(hotspotModeBeforeSpace||'zone')
  });

  window.addEventListener('resize',renderHotspotZones,{passive:true});
  window.addEventListener('scroll',updateHotspotOverlayVisibility,{passive:true});
  setHotspotInteractionMode('zone',{announce:false});
  syncHotspotEditorUI()
}


let pageModularLayout={};
let pageModuleDragKey='';
let pageModuleDragElement=null;
let pageModuleImageTargetKey='';

function pageModuleSlug(value){
  return String(value||'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,72)
}
function pageModuleParentSlug(card){
  const p=card?.parentElement;if(!p)return 'group';
  const preferred=[...p.classList].find(c=>
    /(?:grid|wrap|content|types|detail|statement|directory|features)/i.test(c) &&
    c!=='site-content-card'
  );
  return pageModuleSlug(preferred||p.id||p.tagName||'group')||'group'
}
function pageModuleKey(card){
  if(!card)return '';
  const section=inlinePageSectionForElement?.(card)||'venue';
  const blockId=card.dataset?.performanceBlockId||'';
  if(blockId)return section+'::custom::'+blockId;

  if(!card.dataset.pageModuleStableId){
    const parent=card.parentElement;
    const siblings=parent
      ?[...parent.children].filter(el=>el.classList?.contains('site-content-card'))
      :[];
    const index=Math.max(0,siblings.indexOf(card));
    const signature=[...card.classList]
      .filter(c=>c!=='site-content-card'&&c!=='page-hover-card'&&!c.startsWith('page-'))
      .sort().join('-');
    card.dataset.pageModuleStableId=
      pageModuleParentSlug(card)+'::'+(pageModuleSlug(signature)||'module')+'::'+index
  }
  return section+'::static::'+card.dataset.pageModuleStableId
}
function capturePageModularLayoutState(){
  return JSON.parse(JSON.stringify(pageModularLayout||{}))
}
function applyPageModularLayoutState(saved){
  pageModularLayout=saved&&typeof saved==='object'?JSON.parse(JSON.stringify(saved)):{};
  Object.values(pageModularLayout).forEach(rec=>{
    if(!rec||typeof rec!=='object')return;
    if(typeof rec.ownRow!=='boolean')rec.ownRow=false;
    if(typeof rec.group!=='string')rec.group='';
    if(typeof rec.image!=='string')rec.image=''
  });
  applyPageModularLayout?.()
}
function loadLocalPageModularLayoutState(){
  try{
    const raw=localStorage.getItem('mothershipPageModularLayoutV1');
    applyPageModularLayoutState(raw?JSON.parse(raw):{})
  }catch(e){applyPageModularLayoutState({})}
}
function persistPageModularLayout(){
  try{
    localStorage.setItem('mothershipPageModularLayoutV1',JSON.stringify(capturePageModularLayoutState()))
  }catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}

function pageModuleGroupKey(parent){
  if(!parent)return '';
  const section=inlinePageSectionForElement?.(parent)||(siteActiveSection||'venue');
  const cls=[...parent.classList]
    .filter(c=>c!=='page-modular-grid'&&!c.startsWith('page-module-'))
    .sort().join('-');
  const slug=pageModuleSlug(cls||parent.id||parent.tagName||'group')||'group';
  return section+'::group::'+slug
}
function pageModuleScopeForCard(card){
  if(!card?.closest)return null;
  return card.closest('.overview-rollup-section') ||
    card.closest('.site-section[data-site-section]') ||
    null
}
function pageModuleScopes(root=document){
  const scopes=new Set();

  if(root?.matches?.('.overview-rollup-section,.site-section[data-site-section]')){
    scopes.add(root)
  }
  if(root?.matches?.('.site-content-card')){
    const scope=pageModuleScopeForCard(root);
    if(scope)scopes.add(scope)
  }

  root?.querySelectorAll?.('.site-section[data-site-section],.overview-rollup-section')
    .forEach(scope=>scopes.add(scope));

  return [...scopes]
}
function pageModuleCardsInScope(scope){
  if(!scope?.querySelectorAll)return [];
  return [...scope.querySelectorAll('.site-content-card')]
    .filter(card=>pageModuleScopeForCard(card)===scope)
}
function pageModuleGroupMap(scope){
  const map=new Map();
  const parents=new Set();

  pageModuleCardsInScope(scope).forEach(card=>{
    if(card.parentElement)parents.add(card.parentElement)
  });

  parents.forEach(parent=>{
    const key=pageModuleGroupKey(parent);
    if(key&&!map.has(key))map.set(key,parent)
  });
  return map
}
function dedupePageContentModules(root=document){
  pageModuleScopes(root).forEach(scope=>{
    const seen=new Set();
    pageModuleCardsInScope(scope).forEach(card=>{
      const key=pageModuleKey(card);
      if(!key)return;

      // Exact same stable module appearing twice inside the same real page/mirror
      // is an accidental clone. Keep the first copy only.
      if(seen.has(key)){
        card.remove();
        return
      }
      seen.add(key)
    })
  })
}
function applyPageModuleImage(card,rec){
  if(!card)return;
  let wrap=[...card.children].find(el=>el.classList?.contains('page-module-attached-image'))||null;
  if(rec?.image){
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='page-module-attached-image';
      const img=document.createElement('img');
      img.alt='Section image';
      wrap.appendChild(img);
      const first=[...card.children].find(el=>
        !el.classList?.contains('page-module-controls') &&
        !el.classList?.contains('page-detail-section-control')
      );
      card.insertBefore(wrap,first||card.firstChild)
    }
    const img=wrap.querySelector('img');
    if(img&&img.src!==rec.image)img.src=rec.image
  }else if(wrap){
    wrap.remove()
  }
}
function choosePageModuleImage(card){
  if(!card)return;
  const rec=ensurePageModuleRecord(card,{enable:true});if(!rec)return;
  pageModuleImageTargetKey=pageModuleKey(card);
  const input=document.getElementById('pageModuleImageFile');
  if(input){input.value='';input.click()}
}
function removePageModuleImage(card){
  if(!card)return;
  const rec=ensurePageModuleRecord(card,{enable:true});if(!rec)return;
  rec.image='';
  applyPageModularLayout?.();
  persistPageModularLayout()
}

function pageModuleDefaultSpan(card){
  if(!card)return 12;
  if(
    card.classList.contains('wide') ||
    card.classList.contains('hire-wide-card') ||
    card.classList.contains('hire-request-card') ||
    card.classList.contains('marketing-support-card') ||
    card.classList.contains('venue-key-features-card') ||
    card.classList.contains('venue-our-venue-card')
  )return 12;

  const parent=card.parentElement;
  const cards=parent?[...parent.children].filter(x=>x.classList?.contains('site-content-card')):[];
  if(cards.length===3)return 4;
  if(cards.length>=2)return 6;
  return 12
}
function ensurePageModuleRecord(card,{enable=false}={}){
  const key=pageModuleKey(card);if(!key)return null;
  if(!pageModularLayout[key]){
    pageModularLayout[key]={
      span:pageModuleDefaultSpan(card),
      order:null,
      separator:true,
      ownRow:false,
      group:'',
      image:'',
      enabled:false
    }
  }
  if(enable)pageModularLayout[key].enabled=true;
  return pageModularLayout[key]
}
function pageModuleGroupCards(card){
  const parent=card?.parentElement;if(!parent)return [];
  return [...parent.children].filter(el=>el.classList?.contains('site-content-card'))
}
function initialisePageModuleGroup(card){
  const cards=pageModuleGroupCards(card);
  cards.forEach((c,i)=>{
    const rec=ensurePageModuleRecord(c,{enable:true});
    if(!rec)return;
    if(rec.order==null)rec.order=i;
    if(!rec.group)rec.group=pageModuleGroupKey(c.parentElement)
  })
}

function enforceTruePageModularGrids(root=document){
  if(!root?.querySelectorAll)return;
  const parents=new Set();

  root.querySelectorAll('.site-content-card').forEach(card=>{
    if(card.parentElement)parents.add(card.parentElement)
  });

  parents.forEach(parent=>{
    const cards=[...parent.children].filter(el=>el.classList?.contains('site-content-card'));
    if(!cards.length)return;
    const enabled=cards.some(card=>pageModularLayout[pageModuleKey(card)]?.enabled);
    if(enabled)parent.classList.add('page-modular-grid')
  })
}

function applyPageModularLayout(root=document){
  if(!root?.querySelectorAll)return;

  // Clean any accidental duplicates left by an earlier editor run first.
  dedupePageContentModules(root);

  pageModuleScopes(root).forEach(scope=>{
    let cards=pageModuleCardsInScope(scope);
    if(!cards.length)return;

    let groupMap=pageModuleGroupMap(scope);

    // Apply saved group movement ONLY inside this page instance.
    cards.forEach(card=>{
      const key=pageModuleKey(card);if(!key)return;
      card.dataset.pageModuleKey=key;
      const rec=pageModularLayout[key];

      if(rec?.group){
        const dest=groupMap.get(rec.group);
        const destScope=dest?.closest?.('.overview-rollup-section') ||
          dest?.closest?.('.site-section[data-site-section]') ||
          null;
        if(dest&&dest!==card.parentElement&&destScope===scope){
          dest.appendChild(card)
        }
      }
    });

    // Re-read this scope after movement and de-dupe again.
    dedupePageContentModules(scope);
    cards=pageModuleCardsInScope(scope);
    groupMap=pageModuleGroupMap(scope);

    cards.forEach(card=>{
      const key=pageModuleKey(card);if(!key)return;
      card.dataset.pageModuleKey=key;
      const rec=pageModularLayout[key];

      card.classList.toggle('page-separator-hidden',rec?.separator===false);
      card.classList.toggle('page-module-own-row',rec?.ownRow===true);
      card.style.removeProperty('--page-module-span');

      if(rec?.enabled){
        card.style.setProperty('--page-module-span',String(Math.max(3,Math.min(12,+rec.span||6))))
      }

      applyPageModuleImage(card,rec);

      if(document.body.classList.contains('page-details-edit-mode')){
        let controls=[...card.children].find(el=>el.classList?.contains('page-module-controls'))||null;
        if(!controls){
          controls=document.createElement('div');
          controls.className='page-module-controls';
          controls.innerHTML=
            '<button type="button" class="page-module-move" draggable="true" title="Drag this section anywhere within this page">MOVE</button>'+
            '<select class="page-module-width" title="Module width">'+
              '<option value="3">25%</option>'+
              '<option value="4">33%</option>'+
              '<option value="6">50%</option>'+
              '<option value="8">67%</option>'+
              '<option value="9">75%</option>'+
              '<option value="12">100%</option>'+
            '</select>'+
            '<button type="button" class="page-module-own-row" title="Reserve this whole row for this module">OWN ROW</button>'+
            '<button type="button" class="page-module-image" title="Add or replace an image in this section">IMAGE</button>'+
            '<button type="button" class="page-module-remove-image" title="Remove section image">REMOVE IMAGE</button>'+
            '<button type="button" class="page-module-line" title="Toggle separator lines">REMOVE LINES</button>';
          card.appendChild(controls)
        }

        const record=ensurePageModuleRecord(card);
        if(record&&!record.group)record.group=pageModuleGroupKey(card.parentElement);

        const moveHandle=controls.querySelector('.page-module-move');
        if(moveHandle){
          moveHandle.draggable=true;
          moveHandle.setAttribute('draggable','true');
        }

        const width=controls.querySelector('.page-module-width');
        if(width)width.value=String(record.span||pageModuleDefaultSpan(card));

        const own=controls.querySelector('.page-module-own-row');
        if(own){
          const isOwn=record.ownRow===true;
          own.textContent=isOwn?'SHARE ROW':'OWN ROW';
          own.classList.toggle('active',isOwn)
        }

        const imageBtn=controls.querySelector('.page-module-image');
        if(imageBtn){
          imageBtn.textContent=record.image?'CHANGE IMAGE':'IMAGE';
          imageBtn.classList.toggle('has-image',!!record.image)
        }
        const removeImage=controls.querySelector('.page-module-remove-image');
        if(removeImage)removeImage.style.display=record.image?'inline-block':'none';

        const line=controls.querySelector('.page-module-line');
        if(line){
          const off=record.separator===false;
          line.textContent=off?'ADD LINES':'REMOVE LINES';
          line.classList.toggle('page-module-line-off',off)
        }
      }else{
        [...card.children]
          .filter(el=>el.classList?.contains('page-module-controls'))
          .forEach(el=>el.remove())
      }
    });

    const parents=new Set(cards.map(c=>c.parentElement).filter(Boolean));
    parents.forEach(parent=>{
      // Parent can contain children from only this scope.
      const group=[...parent.children]
        .filter(c=>c.classList?.contains('site-content-card') && pageModuleScopeForCard(c)===scope);

      const enabled=group.some(c=>pageModularLayout[pageModuleKey(c)]?.enabled);
      parent.classList.toggle('page-modular-grid',enabled);

      if(enabled){
        group.sort((a,b)=>{
          const ar=pageModularLayout[pageModuleKey(a)]||{};
          const br=pageModularLayout[pageModuleKey(b)]||{};
          const ao=Number.isFinite(+ar.order)?+ar.order:9999;
          const bo=Number.isFinite(+br.order)?+br.order:9999;
          return ao-bo
        }).forEach(c=>parent.appendChild(c))
      }
    });

    applyPageInlineStylesToDom?.(scope)
  });

  dedupePageContentModules(root);
  enforceTruePageModularGrids?.(root)
}
function setPageModuleWidth(card,span){
  if(!card)return;
  initialisePageModuleGroup(card);
  const rec=ensurePageModuleRecord(card,{enable:true});if(!rec)return;
  rec.span=Math.max(3,Math.min(12,+span||6));

  // Width and row behaviour are separate. Changing to 50%, 33%, etc does
  // not force OWN ROW, so the block can sit beside another module.
  applyPageModularLayout?.();
  applyPageSpacingToDom?.();
  persistPageModularLayout();

  const scope=pageModuleScopeForCard(card);
  if(scope?.dataset?.siteSection&&scope.dataset.siteSection!=='explore'){
    renderOverviewRollup?.();
    applyPageModularLayout?.()
  }
}

function togglePageModuleOwnRow(card){
  if(!card)return;
  initialisePageModuleGroup(card);
  const rec=ensurePageModuleRecord(card,{enable:true});if(!rec)return;
  rec.ownRow=rec.ownRow!==true;
  applyPageModularLayout?.();
  applyPageSpacingToDom?.();
  persistPageModularLayout();

  const scope=pageModuleScopeForCard(card);
  if(scope?.dataset?.siteSection&&scope.dataset.siteSection!=='explore'){
    renderOverviewRollup?.();
    applyPageModularLayout?.()
  }
}

function togglePageModuleSeparator(card){
  if(!card)return;
  const rec=ensurePageModuleRecord(card);if(!rec)return;
  rec.separator=rec.separator===false?true:false;
  applyPageModularLayout?.();
  persistPageModularLayout()
}

function pairPageModules(dragged,target){
  if(!dragged||!target)return;

  initialisePageModuleGroup(dragged);
  initialisePageModuleGroup(target);

  const a=ensurePageModuleRecord(dragged,{enable:true});
  const b=ensurePageModuleRecord(target,{enable:true});
  if(!a||!b)return;

  // Pairing always means both are allowed to share a row.
  a.ownRow=false;
  b.ownRow=false;

  let aSpan=Math.max(3,Math.min(12,+a.span||pageModuleDefaultSpan(dragged)||6));
  let bSpan=Math.max(3,Math.min(12,+b.span||pageModuleDefaultSpan(target)||6));

  // If the saved widths cannot coexist, start from an even 50/50 pair.
  // Users can then change either side to 25/75, 33/67, etc.
  if(aSpan+bSpan>12 || aSpan===12 || bSpan===12){
    aSpan=6;
    bSpan=6
  }

  a.span=aSpan;
  b.span=bSpan;
  a.enabled=true;
  b.enabled=true
}
function pageModuleDropSide(target,event){
  if(!target||!event)return 'after';
  const rect=target.getBoundingClientRect();
  return event.clientX < rect.left + rect.width/2 ? 'before' : 'after'
}

function savePageModuleOrder(parent){
  if(!parent)return;
  const cards=[...parent.children].filter(c=>c.classList?.contains('site-content-card'));
  cards.forEach((card,i)=>{
    const rec=ensurePageModuleRecord(card,{enable:true});
    if(rec){
      rec.order=i;
      rec.group=pageModuleGroupKey(parent)
    }
  });
  persistPageModularLayout()
}
function clearPageModuleDropClasses(root=document){
  root.querySelectorAll?.(
    '.page-module-drop-before,.page-module-drop-after,.page-module-dragging,.page-module-cross-drop,.page-module-pair-left,.page-module-pair-right'
  ).forEach(el=>el.classList.remove(
    'page-module-drop-before','page-module-drop-after','page-module-dragging','page-module-cross-drop','page-module-pair-left','page-module-pair-right'
  ))
}

function activePageDetailsSection(){
  return siteActiveSection&&PERFORMANCE_PAGE_SECTION_IDS?.[siteActiveSection]
    ?siteActiveSection
    :(currentPerformancePageSection?.()||'venue')
}
function addPageDetailsSection(kind='text'){
  ensurePerformancePageState();
  const section=activePageDetailsSection();
  const block=performancePageNewBlock(kind==='image'?'image':'card');

  if(kind==='image'){
    block.title='New image section';
    block.body=''
  }else{
    block.title='New section';
    block.body='Click this text to edit the section.'
  }
  block.width='full';
  performancePageState[section].blocks.push(block);
  activePerformancePageBlockId=block.id;

  const key=section+'::custom::'+block.id;
  pageModularLayout[key]={
    span:12,order:9999,separator:true,ownRow:true,
    group:'',image:'',enabled:true
  };

  renderPerformancePage(section);
  renderOverviewRollup?.();
  applyPageDetailSectionVisibility?.();
  applyPageModularLayout?.();
  applyPageInlineStylesToDom?.();
  persistPageModularLayout();
  saveLocalEditState?.(false);
  syncPerformancePageBuilderUI?.();

  setTimeout(()=>{
    const card=[...document.querySelectorAll('.performance-custom-card')]
      .find(c=>c.dataset.performanceBlockId===block.id && !c.closest('.overview-rollup-section'));
    if(card){
      card.scrollIntoView({block:'center',behavior:'auto'});
      if(kind==='image')choosePageModuleImage(card)
    }
  },40)
}
function handlePageModuleImageFile(file){
  if(!file||!pageModuleImageTargetKey)return;
  if(file.size>3000000){
    flashEditor?.('Image is over 3 MB · use a smaller image for the embedded venue pack');
    return
  }
  const rec=pageModularLayout[pageModuleImageTargetKey];
  if(!rec)return;
  const reader=new FileReader();
  reader.onload=()=>{
    rec.image=String(reader.result||'');
    rec.enabled=true;
    applyPageModularLayout?.();
    renderOverviewRollup?.();
    applyPageModularLayout?.();
    persistPageModularLayout();
    flashEditor?.('Section image embedded')
  };
  reader.readAsDataURL(file)
}

let pageHiddenSections={};

function capturePageHiddenSectionState(){
  return JSON.parse(JSON.stringify(pageHiddenSections||{}))
}
function applyPageHiddenSectionState(saved){
  pageHiddenSections=saved&&typeof saved==='object'?JSON.parse(JSON.stringify(saved)):{};
  applyPageDetailSectionVisibility?.()
}
function loadLocalPageHiddenSectionState(){
  try{
    const raw=localStorage.getItem('mothershipPageHiddenSectionsV1');
    applyPageHiddenSectionState(raw?JSON.parse(raw):{})
  }catch(e){applyPageHiddenSectionState({})}
}
function pageDetailSectionKey(card){return pageModuleKey(card)}
function applyPageDetailSectionVisibility(root=document){
  if(!root?.querySelectorAll)return;
  const cards=[];
  if(root.matches?.('.site-content-card'))cards.push(root);
  root.querySelectorAll?.('.site-content-card').forEach(card=>cards.push(card));

  cards.forEach(card=>{
    const key=pageDetailSectionKey(card);if(!key)return;
    card.dataset.pageDetailSectionKey=key;
    const hidden=pageHiddenSections[key]===true;
    card.classList.toggle('page-detail-section-hidden',hidden);

    let btn=[...card.children].find(el=>el.classList?.contains('page-detail-section-control'))||null;
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='page-detail-section-control';
      card.appendChild(btn)
    }
    btn.dataset.sectionKey=key;
    btn.textContent=hidden?'RESTORE SECTION':'DELETE SECTION';
    btn.title=hidden?'Restore this section':'Hide this entire section from Performance Mode'
  });
  applyPageModularLayout?.(root);
  refreshPageEmptyFlow?.(root);
  syncRestoreHiddenControl?.()
}

function persistPageHiddenSections(){
  try{
    localStorage.setItem('mothershipPageHiddenSectionsV1',JSON.stringify(capturePageHiddenSectionState()))
  }catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}

let pageDetailsEditMode=false;


let pageFrameState={widthPct:86};

function capturePageFrameState(){
  return {widthPct:Math.max(60,Math.min(100,+pageFrameState?.widthPct||86))}
}
function applyPageFrameState(saved){
  const pct=Math.max(60,Math.min(100,+saved?.widthPct||86));
  pageFrameState={widthPct:pct};
  applyPageFrameToDom?.();
  syncPageWidthControl?.()
}
function loadLocalPageFrameState(){
  try{
    const raw=localStorage.getItem('mothershipPageFrameV1');
    applyPageFrameState(raw?JSON.parse(raw):{widthPct:86})
  }catch(e){
    applyPageFrameState({widthPct:86})
  }
}
function applyPageFrameToDom(){
  const site=document.getElementById('promoterSite');if(!site)return;
  const pct=Math.max(60,Math.min(100,+pageFrameState?.widthPct||86));
  const gutter=Math.max(0,(100-pct)/2);
  site.style.setProperty('--page-content-width',String(pct));
  site.style.setProperty('--page-side-gutter',gutter+'%')
}
function syncPageWidthControl(){
  const input=document.getElementById('pageWidthInput');if(!input)return;
  input.value=String(Math.round(Math.max(60,Math.min(100,+pageFrameState?.widthPct||86))))
}
function setSharedPageWidth(value){
  const pct=Math.max(60,Math.min(100,+value||86));
  pageFrameState.widthPct=pct;
  applyPageFrameToDom?.();
  renderOverviewRollup?.();
  applyPageFrameToDom?.();
  try{localStorage.setItem('mothershipPageFrameV1',JSON.stringify(capturePageFrameState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}
function resetSharedPageWidth(){
  pageFrameState.widthPct=86;
  applyPageFrameToDom?.();
  renderOverviewRollup?.();
  applyPageFrameToDom?.();
  syncPageWidthControl?.();
  try{localStorage.setItem('mothershipPageFrameV1',JSON.stringify(capturePageFrameState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}

let pageSpacingState={};

function capturePageSpacingState(){
  return JSON.parse(JSON.stringify(pageSpacingState||{}))
}
function applyPageSpacingState(saved){
  pageSpacingState=saved&&typeof saved==='object'?JSON.parse(JSON.stringify(saved)):{};
  applyPageSpacingToDom?.();
  syncPageGapControl?.()
}
function loadLocalPageSpacingState(){
  try{
    const raw=localStorage.getItem('mothershipPageSpacingV1');
    applyPageSpacingState(raw?JSON.parse(raw):{})
  }catch(e){applyPageSpacingState({})}
}
function pageGapForSection(section){
  const value=pageSpacingState?.[section];
  return Number.isFinite(+value)?Math.max(0,Math.min(180,+value)):null
}
function applyPageGapToElement(el,section){
  if(!el)return;
  const gap=pageGapForSection(section);
  const custom=gap!=null;
  el.dataset.pageGapCustom=custom?'1':'0';
  if(custom)el.style.setProperty('--page-section-gap',gap+'px');
  else el.style.removeProperty('--page-section-gap')
}
function applyPageSpacingToDom(root=document){
  const sections=['explore','venue','hire','production','marketing','past','contact'];

  sections.forEach(section=>{
    const sec=performancePageSectionElement?.(section);
    if(sec&&(root===document||root===sec||root.contains?.(sec)||sec.contains?.(root))){
      applyPageGapToElement(sec,section)
    }
  });

  root.querySelectorAll?.('.overview-rollup-section[data-overview-section]').forEach(wrap=>{
    applyPageGapToElement(wrap,wrap.dataset.overviewSection)
  });

  const overview=document.getElementById('siteOverviewContent');
  if(overview&&(root===document||root===overview||root.contains?.(overview)||overview.contains?.(root))){
    applyPageGapToElement(overview,'explore')
  }
}
function currentPageSpacingSection(){
  return (typeof siteActiveSection!=='undefined'&&siteActiveSection)
    ?siteActiveSection
    :(currentPerformancePageSection?.()||'venue')
}
function syncPageGapControl(){
  const input=document.getElementById('pageGapInput');
  const reset=document.getElementById('pageGapReset');
  if(!input)return;
  const section=currentPageSpacingSection();
  const gap=pageGapForSection(section);
  input.value=gap==null?'':String(Math.round(gap));
  input.placeholder='AUTO';
  if(reset)reset.classList.toggle('active',gap!=null)
}
function setCurrentPageGap(value){
  const section=currentPageSpacingSection();
  const n=+value;
  if(!Number.isFinite(n))return;
  pageSpacingState[section]=Math.max(0,Math.min(180,n));
  applyPageSpacingToDom?.();
  renderOverviewRollup?.();
  applyPageSpacingToDom?.();
  syncPageGapControl();
  try{localStorage.setItem('mothershipPageSpacingV1',JSON.stringify(capturePageSpacingState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}
function resetCurrentPageGap(){
  const section=currentPageSpacingSection();
  delete pageSpacingState[section];
  applyPageSpacingToDom?.();
  renderOverviewRollup?.();
  applyPageSpacingToDom?.();
  syncPageGapControl();
  try{localStorage.setItem('mothershipPageSpacingV1',JSON.stringify(capturePageSpacingState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}

let pageInlineStyles={};
let pageTextStyleTargetKey='';


function pageVisibleTextIsEmpty(el){
  return !String(el?.textContent||'').replace(/\s+/g,' ').trim()
}
function refreshPageEmptyFlow(root=document){
  if(!root?.querySelectorAll)return;

  const textSelector=[
    '.site-card-kicker','h3','.custom-stat',
    '.bsmnt-card-copy p','.bsmnt-card-copy li',
    ':scope > p',':scope > ul li'
  ].join(',');

  root.querySelectorAll('.site-content-card').forEach(card=>{
    const fields=[...card.querySelectorAll(textSelector)]
      .filter(el=>!el.closest('.page-module-controls,.page-detail-section-control'));
    card.classList.toggle(
      'page-card-has-deleted-text',
      fields.some(pageVisibleTextIsEmpty)
    );
  });

  root.querySelectorAll('.bsmnt-card-title,.bsmnt-card-copy').forEach(wrap=>{
    const meaningfulText=String(wrap.textContent||'').replace(/\s+/g,' ').trim();
    const hasMedia=!!wrap.querySelector('img,video,a.custom-link,button');
    wrap.classList.toggle('page-empty-copy-wrap',!meaningfulText&&!hasMedia)
  });

  root.querySelectorAll('.bsmnt-card-copy ul').forEach(ul=>{
    const hasText=[...ul.querySelectorAll('li')].some(li=>!pageVisibleTextIsEmpty(li));
    ul.classList.toggle('page-empty-copy-wrap',!hasText)
  })
}

function capturePageInlineStyleState(){
  return JSON.parse(JSON.stringify(pageInlineStyles||{}))
}
function applyPageInlineStyleState(saved){
  pageInlineStyles=saved&&typeof saved==='object'?JSON.parse(JSON.stringify(saved)):{};
  applyPageInlineStylesToDom?.()
}
function loadLocalPageInlineStyleState(){
  try{
    const raw=localStorage.getItem('mothershipPageInlineStylesV1');
    applyPageInlineStyleState(raw?JSON.parse(raw):{})
  }catch(e){applyPageInlineStyleState({})}
}
function inlinePageTextRole(el){
  if(!el)return '';
  if(el.id==='siteSectionCoverKicker')return 'cover-kicker';
  if(el.id==='siteSectionCoverTitle')return 'cover-title';
  if(el.id==='siteSectionCoverText')return 'cover-intro';
  if(el.classList.contains('site-section-number')||el.classList.contains('overview-rollup-kicker'))return 'kicker';
  if(el.classList.contains('site-section-intro'))return 'intro';
  if(el.classList.contains('site-card-kicker'))return 'card-kicker';
  if(el.classList.contains('custom-stat'))return 'stat';
  if(el.matches('h2'))return 'h2';
  if(el.matches('h3'))return 'h3';
  const card=el.closest?.('.site-content-card');
  if(el.matches('p')){
    const i=card?[...card.querySelectorAll('p')].indexOf(el):0;
    return 'p:'+Math.max(0,i)
  }
  if(el.matches('li')){
    const i=card?[...card.querySelectorAll('li')].indexOf(el):0;
    return 'li:'+Math.max(0,i)
  }
  return ''
}
function inlinePageStyleKey(el){
  if(!el)return '';
  const section=inlinePageSectionForElement?.(el)||(siteActiveSection||'venue');
  if(el.closest?.('#siteSectionCover')){
    return section+'::header::'+inlinePageTextRole(el)
  }
  const roll=el.closest?.('.overview-rollup-head');
  if(roll)return section+'::header::'+inlinePageTextRole(el);
  const panel=el.closest?.('.site-info-title-panel');
  if(panel)return section+'::header::'+inlinePageTextRole(el);

  const card=el.closest?.('.site-content-card');
  const role=inlinePageTextRole(el);
  if(card&&role)return pageModuleKey(card)+'::text::'+role;
  return ''
}
function pageInlineStyleTargets(root=document){
  if(!root?.querySelectorAll)return [];
  const selector=[
    '#siteSectionCoverKicker','#siteSectionCoverTitle','#siteSectionCoverText',
    '.site-info-title-panel .site-section-number','.site-info-title-panel h2',
    '.site-info-title-panel .site-section-intro',
    '.overview-rollup-head .overview-rollup-kicker','.overview-rollup-head h3',
    '.overview-rollup-head p',
    '.site-content-card .site-card-kicker','.site-content-card h3',
    '.site-content-card .custom-stat','.site-content-card p','.site-content-card li'
  ].join(',');
  const arr=[];
  if(root.matches?.(selector))arr.push(root);
  root.querySelectorAll(selector).forEach(el=>arr.push(el));
  return arr
}
function applyPageInlineStylesToDom(root=document){
  pageInlineStyleTargets(root).forEach(el=>{
    const key=inlinePageStyleKey(el);if(!key)return;
    el.dataset.pageTextStyleKey=key;
    const rec=pageInlineStyles[key];
    if(rec&&Number.isFinite(+rec.fontSizePx)&&+rec.fontSizePx>0){
      el.style.setProperty('font-size',Math.max(6,Math.min(120,+rec.fontSizePx))+'px','important')
    }else{
      el.style.removeProperty('font-size')
    }
  })
}
function syncPageTextSizeControl(el=null){
  const input=document.getElementById('pageTextSizeInput');if(!input)return;
  if(el)pageTextStyleTargetKey=inlinePageStyleKey(el);
  const rec=pageTextStyleTargetKey?pageInlineStyles[pageTextStyleTargetKey]:null;
  if(rec&&Number.isFinite(+rec.fontSizePx)){
    input.value=Math.round(+rec.fontSizePx)
  }else if(el){
    input.value=Math.round(parseFloat(getComputedStyle(el).fontSize)||16)
  }else{
    input.value=''
  }
}
function setSelectedPageTextSize(value){
  if(!pageTextStyleTargetKey){
    flashEditor?.('Click the text you want to resize first');
    return
  }
  const px=Math.max(6,Math.min(120,+value||0));
  if(!px)return;
  pageInlineStyles[pageTextStyleTargetKey]={...(pageInlineStyles[pageTextStyleTargetKey]||{}),fontSizePx:px};
  applyPageInlineStylesToDom?.();
  try{localStorage.setItem('mothershipPageInlineStylesV1',JSON.stringify(capturePageInlineStyleState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}
