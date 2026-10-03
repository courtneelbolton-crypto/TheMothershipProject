/* V102 · promoter minisite navigation · metadata initialised earlier in V123 */
let sitePreviewReady=false,siteLastHoverRoot=null;

function sitePreviewActive(){return (experienceMode==='performance'||pageDetailsEditMode)&&document.body.classList.contains('site-preview')}
function setSiteDocumentScrolling(on){
  if(V170_ZONE_ONLY_MODE){document.documentElement.style.overflowY='hidden';document.body.style.overflowY='hidden';window.scrollTo(0,0);return}
  document.documentElement.style.overflowY=on?'auto':'hidden';
  document.body.style.overflowY=on?'auto':'hidden';
  if(!on)window.scrollTo(0,0)
}
function siteFrameByWords(words=[]){
  const lower=words.map(s=>String(s).toLowerCase());
  return cameraFrames.find(f=>lower.some(w=>String(f.name||'').toLowerCase().includes(w)))||null
}
function siteAutoFrameForRoot(root,distance=5.7,side=.0){
  if(!root)return null;root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return null;
  const c=box.getCenter(new THREE.Vector3()),room=new THREE.Vector3(0,0,0),toward=room.clone().sub(c);toward.y=0;
  if(toward.lengthSq()<.15)toward.set(0,0,1);toward.normalize();
  const right=new THREE.Vector3(toward.z,0,-toward.x);
  const pos=c.clone().addScaledVector(toward,distance).addScaledVector(right,side);
  pos.y=Math.max(.82,Math.min(1.18,c.y+.25));
  const d=c.clone().sub(pos).normalize(),yaw=Math.atan2(d.x,d.z),pitch=Math.asin(Math.max(-.42,Math.min(.26,d.y)));
  return {position:pos.toArray(),yaw,pitch,fov:62}
}
function siteNamedRoot(patterns=[]){
  const rx=new RegExp(patterns.join('|'),'i'),pool=[...editorRoots,...builderObjects];
  return pool.find(o=>o&&o.visible!==false&&rx.test([o.userData?.editName,o.userData?.buildItem,o.userData?.buildCategory,o.userData?.assetData?.kind].filter(Boolean).join(' ')))||null
}
function siteFrameForSection(section){
  const assigned=v170PageAssignedFrame?.(section);if(assigned)return assigned;
  if(section==='explore'){
    return siteFrameByWords(['venue'])||siteFrameByWords(['cover','overview','hero'])||cameraFrames.find(f=>f.id===cameraCoverFrameId)||CINEMATIC_PERSPECTIVE_VIEW
  }
  if(section==='venue'){
    return siteFrameByWords(['venue','amenities','bar','lounge'])||siteAutoFrameForRoot(typeof upperBar!=='undefined'?upperBar:null,6.0,.45)||CINEMATIC_PERSPECTIVE_VIEW
  }
  if(section==='hire'){
    return siteFrameByWords(['hire','stage','dj'])||siteAutoFrameForRoot(typeof stage!=='undefined'?stage:null,6.2,.4)||CINEMATIC_PERSPECTIVE_VIEW
  }
  if(section==='production'){
    return siteFrameByWords(['production','foh','sound'])||siteAutoFrameForRoot(typeof foh!=='undefined'?foh:null,4.8,-.5)||CINEMATIC_PERSPECTIVE_VIEW
  }
  if(section==='marketing'){
    const r=siteNamedRoot(['poster','artwork','frame','mural']);return siteFrameByWords(['marketing','poster','art'])||siteAutoFrameForRoot(r,4.5,.4)||CINEMATIC_PERSPECTIVE_VIEW
  }
  if(section==='past'){
    const r=siteNamedRoot(['poster','archive','artwork','mural']);return siteFrameByWords(['past','archive','events','poster'])||siteAutoFrameForRoot(r,4.7,-.4)||CINEMATIC_PERSPECTIVE_VIEW
  }
  if(section==='contact'){
    return siteFrameByWords(['contact','entrance','merch'])||siteAutoFrameForRoot(typeof merch!=='undefined'?merch:null,4.8,.25)||CINEMATIC_PERSPECTIVE_VIEW
  }
  const customName=SITE_SECTION_META[section]?.label||'';
  return (customName?siteFrameByWords([customName]):null)||cameraFrames.find(f=>f.id===cameraCoverFrameId)||CINEMATIC_PERSPECTIVE_VIEW
}
function siteGoCamera(section,animate=true){
  const f=siteFrameForSection(section);if(!f)return;
  hotspotSuspendForCamera?.(animate?650:0);
  if(f.id)loadCameraFrame(f.id,animate);else if(animate)startCameraViewTween(f,620);else applyCameraViewState({mode:'perspective',...f},false)
}
function siteSetActiveNav(section){
  siteActiveSection=section;
  document.querySelectorAll('[data-site-target]').forEach(b=>b.classList.toggle('active',b.dataset.siteTarget===section));
  syncPageGapControl?.();
  syncRestoreHiddenControl?.();
  const detailsDock=document.getElementById('pageDetailsEditDock');
  if(detailsDock)detailsDock.dataset.activePage=section;
  renderHotspotZones?.()
}
function siteInfoPageData(section){
  ensurePerformancePageState?.();
  const d=performancePageState?.[section]||{};
  const meta=SITE_SECTION_META[section]||SITE_SECTION_META.explore;
  return {
    kicker:d.kicker||((meta.number||'00')+' · '+(meta.label||'OVERVIEW')),
    heading:d.heading||meta.title||meta.label||'THE MOTHERSHIP',
    intro:d.intro||meta.text||''
  }
}
function ensureSiteInfoTitlePanel(section){
  const sec=performancePageSectionElement(section);if(!sec)return null;
  let panel=sec.querySelector(':scope > .site-info-title-panel');
  if(!panel){
    panel=document.createElement('div');panel.className='site-info-title-panel';
    const textWrap=document.createElement('div');textWrap.className='site-info-title-copy';
    let kicker,h,intro;
    if(section==='explore'){
      kicker=document.createElement('div');kicker.className='site-section-number';
      h=document.createElement('h2');
      intro=document.createElement('p');intro.className='site-section-intro';
    }else{
      kicker=sec.querySelector(':scope > .site-section-number')||document.createElement('div');
      h=sec.querySelector(':scope > h2')||document.createElement('h2');
      intro=sec.querySelector(':scope > .site-section-intro')||document.createElement('p');
      kicker.classList.add('site-section-number');intro.classList.add('site-section-intro');
    }
    textWrap.append(kicker,h,intro);
    const back=document.createElement('button');back.type='button';back.className='site-info-back-button';back.textContent='BACK TO VENUE ↑';
    back.addEventListener('click',()=>siteCloseInfo());
    panel.append(textWrap,back);sec.prepend(panel)
  }
  const d=siteInfoPageData(section),k=panel.querySelector('.site-section-number'),h=panel.querySelector('h2'),p=panel.querySelector('.site-section-intro');
  if(k)k.textContent=d.kicker;if(h)h.textContent=d.heading;if(p)p.textContent=d.intro;
  return panel
}
function syncSiteInfoTitlePanels(){Object.keys(PERFORMANCE_PAGE_SECTION_IDS).forEach(ensureSiteInfoTitlePanel)}
function siteShowSection(section){
  sitePanelSection=section;
  document.querySelectorAll('.site-section[data-site-section]').forEach(el=>{
    el.classList.toggle('active-panel',el.dataset.siteSection===section);
  });
  ensureSiteInfoTitlePanel(section)
}
function siteSetSectionCover(section){
  const open=section!=='explore';
  document.body.classList.toggle('section-cover-open',open);
  const cover=document.getElementById('siteSectionCover');
  if(cover)cover.setAttribute('aria-hidden',open?'false':'true');
  if(!open)return;
  const meta=SITE_SECTION_META[section]||SITE_SECTION_META.venue;
  const pageData=(typeof performancePageState!=='undefined'&&performancePageState?.[section])?performancePageState[section]:null;
  const kicker=document.getElementById('siteSectionCoverKicker');
  const title=document.getElementById('siteSectionCoverTitle');
  const copy=document.getElementById('siteSectionCoverText');
  const btn=document.getElementById('siteSectionCoverInfo');
  if(kicker)kicker.textContent=pageData?.kicker??(meta.number+' · '+meta.label);
  if(title)title.textContent=pageData?.heading??(meta.title||meta.label);
  if(copy)copy.textContent=pageData?.intro??(meta.text||'');
  if(btn){btn.dataset.section=section;btn.textContent='READ MORE ↓'}
  siteUpdateReadMoreButton?.();
}
let siteReadMoreAnimation=null;
function siteActiveInfoElement(){
  const meta=SITE_SECTION_META[siteActiveSection];
  return meta?document.getElementById(meta.element):null
}
function siteUpdateExpandedInfoHeader(){
  const meta=SITE_SECTION_META[siteActiveSection]||SITE_SECTION_META.explore;
  const k=document.getElementById('siteExpandedInfoKicker'),t=document.getElementById('siteExpandedInfoTitle'),h=document.getElementById('siteExpandedInfoHeader');
  if(k)k.textContent=meta.number+' · '+meta.label;
  if(t)t.textContent=meta.title||meta.label;
  if(h)h.setAttribute('aria-hidden',document.body.classList.contains('site-info-expanded')?'false':'true')
}

function siteDetailsScrollProgress(){
  if(!document.body.classList.contains('site-info-expanded'))return 0;
  const el=siteActiveInfoElement?.();if(!el)return 0;
  const top=el.getBoundingClientRect().top+(window.scrollY||0);
  const travel=Math.max(1,el.offsetHeight-Math.min(window.innerHeight*.55,420));
  return Math.max(0,Math.min(1,((window.scrollY||0)-top)/travel))
}
function updateSiteBackToVenueChip(){
  const btn=document.getElementById('siteBackToVenueChip');if(!btn)return;
  const active=sitePreviewActive?.() &&
    document.body.classList.contains('site-info-expanded') &&
    siteDetailsScrollProgress()>=.25;
  btn.classList.toggle('show',!!active)
}

let sitePageScrollAnimation=null;
function siteScrollDuration(section=siteActiveSection){return section==='production'?760:680}
function siteSmoothPageScrollTo(targetY,{duration=680,done=null}={}){
  if(sitePageScrollAnimation){cancelAnimationFrame(sitePageScrollAnimation);sitePageScrollAnimation=null}
  const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  const target=Math.max(0,Math.min(max,+targetY||0));
  const start=window.scrollY||0,change=target-start;
  if(Math.abs(change)<2||duration<=0){window.scrollTo(0,target);if(done)done();return}
  const t0=performance.now(),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const tick=now=>{
    const t=Math.max(0,Math.min(1,(now-t0)/duration));
    window.scrollTo(0,start+change*ease(t));
    if(t<1)sitePageScrollAnimation=requestAnimationFrame(tick);
    else{sitePageScrollAnimation=null;if(done)done()}
  };
  sitePageScrollAnimation=requestAnimationFrame(tick)
}
function siteInfoTargetY(section=siteActiveSection){
  const el=SITE_SECTION_META[section]?document.getElementById(SITE_SECTION_META[section].element):siteActiveInfoElement();
  if(!el)return 0;
  const header=document.getElementById('siteHeader');
  const offset=(header?.offsetHeight||46);
  return Math.max(0,el.getBoundingClientRect().top+window.scrollY-offset)
}
function siteUpdateReadMoreButton(){
  const btn=document.getElementById('siteSectionCoverInfo');if(btn)btn.textContent='READ MORE ↓';
  const overviewBtn=document.getElementById('siteScrollCue');if(overviewBtn)overviewBtn.textContent=siteActiveSection==='explore'?'SCROLL TO VENUE ↓':'READ MORE ↓';
  siteUpdateExpandedInfoHeader()
}
function siteMeasurePeekHeight(){}
function siteOpenInfoPeek(){
  const el=siteActiveInfoElement();if(!el)return;
  ensureSiteInfoTitlePanel(siteActiveSection);
  document.body.classList.remove('site-info-peek','site-readmore-scrolling');
  document.body.classList.add('site-info-expanded');
  siteUpdateReadMoreButton();
  siteSmoothPageScrollTo(siteInfoTargetY(siteActiveSection),{duration:siteScrollDuration(siteActiveSection)})
}
function siteExpandInfo(){siteOpenInfoPeek()}
function siteCloseInfo({instant=false}={}){
  bsmntHideHoverImmediate();bsmntResetSmoothScroll(null);
  if(sitePageScrollAnimation){cancelAnimationFrame(sitePageScrollAnimation);sitePageScrollAnimation=null}
  document.body.classList.remove('site-info-expanded','site-info-peek','site-readmore-scrolling','site-returning-hero');
  document.body.style.removeProperty('--site-info-peek-height');
  window.scrollTo({top:0,left:0,behavior:'auto'});
  siteUpdateReadMoreButton();
  updateSiteBackToVenueChip?.();
  markRenderDirty(220)
}
function siteReadMore(section=siteActiveSection){
  if(V170_ZONE_ONLY_MODE)return;
  if(section!==siteActiveSection){siteNavigate(section,{scroll:false,camera:true});setTimeout(()=>siteReadMore(section),390);return}
  siteOpenInfoPeek()
}
function siteRevealVenueCover(){siteNavigate('venue',{scroll:false,camera:true})}
function siteNavigate(section,{scroll=false,camera=true}={}){
  if(V170_ZONE_ONLY_MODE)scroll=false;
  clearPopupFrameReturn?.();
  bsmntHideHoverImmediate();bsmntResetSmoothScroll(null);
  if(siteReadMoreAnimation){cancelAnimationFrame(siteReadMoreAnimation);siteReadMoreAnimation=null}
  section=SITE_SECTION_META[section]?section:'explore';
  const sameSection=section===siteActiveSection;
  if(sameSection&&(document.body.classList.contains('site-info-peek')||document.body.classList.contains('site-info-expanded'))){siteCloseInfo();return}
  siteCloseInfo({instant:true});
  if(window.scrollY!==0)window.scrollTo({top:0,behavior:'auto'});
  siteSetActiveNav(section);
  siteShowSection(section);
  siteSetSectionCover(section);
  siteUpdateExpandedInfoHeader();
  if(camera)siteGoCamera(section,true);
  if(scroll&&section!=='explore')setTimeout(()=>siteOpenInfoPeek(),380);
}
function siteObjectAutoMeta(root){
  if(!root)return null;
  const info=root.userData?.info||{},t=[info.title,root.userData?.editName,root.userData?.buildItem,root.userData?.assetData?.kind].filter(Boolean).join(' ').toLowerCase();
  if(/foh|production|console|sound/.test(t))return {section:'production',index:'06',title:'PRODUCTION / FOH'};
  if(/stage|dj booth|djbooth/.test(t))return {section:'hire',index:'08',title:'STAGE / LAYOUTS'};
  if(/upper bar|lower bar|\bbar\b/.test(t))return {section:'venue',index:'05',title:'BAR SERVICES'};
  if(/merch|coat/.test(t))return {section:'venue',index:'04',title:'MERCH / COAT CHECK'};
  if(/green room/.test(t))return {section:'venue',index:'11',title:'GREEN ROOM'};
  if(/smok|ramp/.test(t))return {section:'venue',index:'10',title:'ACCESS / SMOKING'};
  if(/poster|mural|artwork|art /.test(t))return {section:'past',index:'03',title:'PAST EVENTS'};
  if(/inventory|gear|backline/.test(t))return {section:'production',index:'07',title:'BACKLINE + GEAR'};
  if(/couch|lounge|sofa|curtain/.test(t))return {section:'venue',index:'09',title:'LOUNGE / CURTAINS'};
  if(/entrance|door|contact/.test(t))return {section:'contact',index:'13',title:'CONTACT / ACCESS'};
  if(info&&info.title)return {section:'venue',index:'01',title:String(info.title).toUpperCase()};
  return null
}

function objectPopupIsActiveOnCurrentPage(root){
  const cfg=root?.userData?.sitePopup;
  if(!cfg?.enabled)return false;
  const normal=normaliseObjectPopupConfig(cfg,root);
  return normal.activePage===(typeof siteActiveSection!=='undefined'?siteActiveSection:'explore')
}
function objectPopupAutoFocusFrame(root){
  if(!root)return null;
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  if(box.isEmpty())return null;
  const size=box.getSize(new THREE.Vector3());
  const longest=Math.max(size.x,size.y,size.z,.35);
  const distance=Math.max(2.65,Math.min(6.6,longest*2.05+2.15));
  const frame=siteAutoFrameForRoot(root,distance,.18);
  if(!frame)return null;
  frame.fov=Math.max(48,Math.min(61,55+Math.min(6,longest)));
  return frame
}

function siteObjectMeta(root){
  if(V170_ZONE_ONLY_MODE)return null;
  if(!root)return null;
  const cfg=root.userData?.sitePopup;
  if(cfg?.enabled){
    if(!objectPopupIsActiveOnCurrentPage(root))return null;
    const normal=normaliseObjectPopupConfig(cfg,root),section=SITE_SECTION_META[normal.section]?normal.section:'venue';
    const hoverText=String(normal.hover||normal.title||root.userData?.editName||'VENUE DETAIL').trim();
    return {section,index:SITE_SECTION_META[section]?.number||'01',title:hoverText.toUpperCase(),custom:true,hoverText}
  }
  return siteObjectAutoMeta(root)
}
function siteUpdateHover(e,root){
  const tip=document.getElementById('siteHoverLabel');if(!tip)return;
  if(!sitePreviewActive()){tip.style.display='none';tip.style.transform='none';return}
  const m=siteObjectMeta(root);siteLastHoverRoot=root||null;
  if(!m){tip.style.display='none';tip.style.transform='none';return}
  tip.innerHTML='<b>'+m.index+'</b>'+m.title;
  tip.style.display='block';
  positionSiteHoverLabel(e,tip)
}
function siteOpenObject(root){
  if(V170_ZONE_ONLY_MODE)return false;
  const custom=root?.userData?.sitePopup;
  if(custom?.enabled){
    if(!objectPopupIsActiveOnCurrentPage(root))return false;
    return openObjectPopupDrawer(root,normaliseObjectPopupConfig(custom,root))
  }
  clearPopupFrameReturn?.();
  const m=siteObjectMeta(root);if(!m)return false;
  const d=root.userData?.info||{},drawer=document.getElementById('siteObjectDrawer');
  document.getElementById('siteDrawerIndex').textContent=m.index+' · '+SITE_SECTION_META[m.section].label;
  document.getElementById('siteDrawerTitle').textContent=d.title||m.title;
  document.getElementById('siteDrawerText').textContent=d.desc||'Click through for the full venue-pack information connected to this part of the room.';
  const go=document.getElementById('siteDrawerGo');go.dataset.section=m.section;go.textContent='VIEW SECTION →';go.style.display='inline-block';
  renderSavedFramePreview('','','none');
  drawer.classList.add('show');return true
}
function siteFocusObject(kind){
  let root=null;
  if(kind==='stage')root=typeof stage!=='undefined'?stage:null;
  if(kind==='foh')root=typeof foh!=='undefined'?foh:null;
  if(kind==='bar')root=typeof upperBar!=='undefined'?upperBar:null;
  if(kind==='green')root=siteNamedRoot(['green room']);
  const f=siteAutoFrameForRoot(root,kind==='stage'?6.0:4.7,0);if(f){window.scrollTo({top:0,behavior:'auto'});startCameraViewTween(f,1050)}
}
function setSitePreviewState(on){
  document.body.classList.toggle('site-preview',!!on);document.body.classList.remove('site-lighting-open','site-info-peek','site-info-expanded','site-readmore-scrolling','hotspot-drawing');
  if(on)document.body.classList.remove('hotspot-editing');
  setSiteDocumentScrolling(!!on);
  const tip=document.getElementById('siteHoverLabel'),drawer=document.getElementById('siteObjectDrawer');
  if(tip)tip.style.display='none';
  if(drawer)drawer.classList.remove('show');
  if(on){
    siteSetSectionCover('explore');
    window.scrollTo(0,0);
    siteSetActiveNav('explore');
    siteShowSection('explore');
    setTimeout(()=>siteGoCamera('explore',true),60);
  }else{
    siteSetSectionCover('explore');
    siteShowSection('explore');
  }
  const inlineEditing=!!on&&pageInlineOwnerEnabled?.();
  document.body.classList.toggle('inline-page-text-active',inlineEditing);
  if(!inlineEditing&&inlinePageTextActiveEl)finishInlinePageTextEdit();
  if(inlineEditing){initInlinePageTextEditor?.();applyPageInlineEditsToDom?.()}
  renderHotspotZones?.();updateHotspotOverlayVisibility?.()
}

document.body.classList.add("v258-page-details-only");
/* Public navigation, event layouts, page details, home startup, DJ booth and performance lock. */
/* V254: edit-mode lock removed. Public mode remains the startup mode, but Edit Mode is available on demand. */
;
(function(){
  const TYPES=['Band / Live Performance','DJ / Stage','DJ / 360','Empty Stage'];
  const STORAGE_KEY='mothershipEventStageDefaultsV1';
  const $=id=>document.getElementById(id);
  const clone=v=>JSON.parse(JSON.stringify(v||{}));
  let defaults={};
  let activeType='DJ / Stage';
  let v238StageDjIds=new Set();
  let v239StageDjGroupIds=new Set();

  const pool=()=>{try{return typeof rawPresetPool==='function'?rawPresetPool():((typeof builderObjects!=='undefined'?builderObjects:[])||[])}catch(e){return []}};
  const kindOf=o=>{try{return typeof rootAssetKindForLayer==='function'?String(rootAssetKindForLayer(o)||''):String(o?.userData?.assetData?.kind||'')}catch(e){return String(o?.userData?.assetData?.kind||'')}};
  const textOf=o=>String([o?.userData?.editName,o?.userData?.buildItem,o?.userData?.builderType,kindOf(o)].filter(Boolean).join(' ')).toLowerCase();
  const isDj=o=>{const k=kindOf(o),t=textOf(o);return ['djBooth','djBoothSideTable','djBoothMonitor','djBoothSideSpeaker'].includes(k)||(t.includes('dj')&&t.includes('booth'))};
  const isBand=o=>{const k=kindOf(o),t=textOf(o);return ['guitar','bassGuitar','drumKit','micStand','guitarAmpStack','bassAmpStack','wedgeMonitor'].includes(k)||t.includes('band gear')||t.includes('backline')};
  const keepEventRoot=o=>!!o;
  const eventRoots=()=>pool().filter(o=>isDj(o)||isBand(o)||o?.userData?.v184EventLayoutMember===true);
  const editId=o=>String(o?.userData?.editId||o?.userData?.id||'');

  function v238StateIsDj(s){
    const k=String(s?.kind||s?.record?.asset?.kind||'');
    const n=String(s?.name||s?.record?.name||'').toLowerCase();
    return ['djBooth','djBoothSideTable','djBoothMonitor','djBoothSideSpeaker'].includes(k)
      || (n.includes('dj')&&n.includes('booth'))
  }

  function v238StateIsBandGear(s){
    const k=String(s?.kind||s?.record?.asset?.kind||'');
    return ['guitar','bassGuitar','drumKit','micStand','guitarAmpStack','bassAmpStack','wedgeMonitor'].includes(k)
  }

  function v238VisibleStates(snap){
    return Array.isArray(snap?.objects)?snap.objects.filter(s=>s?.v!==false):[]
  }

  function v238RefreshStageDjIds(source){
    const snap=source?.['DJ / Stage'];
    v238StageDjIds=new Set(
      v238VisibleStates(snap)
        .filter(v238StateIsDj)
        .map(s=>String(s?.id||''))
        .filter(Boolean)
    );

    // V239: also cache the actual grouped root ids for the permanent / stage booth,
    // so we can hide the whole booth root even if the scene is currently using a
    // transformed or duplicated root object rather than the exact leaf object ids.
    v239StageDjGroupIds=new Set();
    try{
      const stagePos=v238VisibleStates(snap)
        .filter(v238StateIsDj)
        .map(s=>Array.isArray(s?.p)?s.p:null)
        .filter(Boolean);
      const stageBoothXs=stagePos.map(p=>+p[0]).filter(Number.isFinite);
      const cutoff=stageBoothXs.length?Math.max(...stageBoothXs)+0.75:-4.5;
      pool().forEach(o=>{
        const gid=String(o?.userData?.groupId||o?.userData?.group||'');
        const eid=editId(o);
        const k=kindOf(o);
        const px=+o?.position?.x;
        const isStageBoothLeaf=v238StageDjIds.has(eid);
        const looksLikeStageBooth=(v238StateIsDj({kind:k,name:String(o?.userData?.editName||o?.userData?.buildItem||'')}) && Number.isFinite(px) && px<=cutoff);
        if(gid && (isStageBoothLeaf||looksLikeStageBooth))v239StageDjGroupIds.add(gid)
      })
    }catch(e){}
  }

  function v238SnapshotLooksHealthy(type,snap,bootDefaults){
    if(!snap||!Array.isArray(snap.objects))return false;
    const vis=v238VisibleStates(snap);
    const dj=vis.filter(v238StateIsDj);
    const band=vis.filter(v238StateIsBandGear);

    if(type==='Band / Live Performance'){
      // Band layout must contain actual band gear and no DJ booth.
      return band.length>0 && dj.length===0
    }
    if(type==='DJ / Stage'){
      return dj.length>0
    }
    if(type==='DJ / 360'){
      // 360 must retain its own DJ setup, but never the stage booth IDs.
      const stageIds=new Set(
        v238VisibleStates(bootDefaults?.['DJ / Stage'])
          .filter(v238StateIsDj)
          .map(s=>String(s?.id||''))
      );
      return dj.length>0 && !dj.some(s=>stageIds.has(String(s?.id||'')))
    }
    if(type==='Empty Stage'){
      // "Band gear storage" is not a stage instrument kind, so it is allowed.
      return dj.length===0 && band.length===0
    }
    return true
  }

  function v238HideDefaultStageDjBooth(type){
    if(type==='DJ / Stage')return;
    if(!v238StageDjIds.size||!v239StageDjGroupIds.size)v238RefreshStageDjIds(defaults);
    if(!v238StageDjIds.size&&!v239StageDjGroupIds.size)return;

    const hideNode=node=>{
      if(!node)return;
      node.visible=false;
      try{node.traverse?.(child=>{child.visible=false})}catch(e){}
    };

    pool().forEach(o=>{
      const eid=editId(o);
      const gid=String(o?.userData?.groupId||o?.userData?.group||'');
      const name=String(o?.userData?.editName||o?.userData?.buildItem||'');
      const k=kindOf(o);
      const px=+o?.position?.x;
      const looksLikeStageBooth=v238StateIsDj({kind:k,name:name}) && Number.isFinite(px) && px<=-4.5;
      if(v238StageDjIds.has(eid) || (gid&&v239StageDjGroupIds.has(gid)) || looksLikeStageBooth){
        hideNode(o)
      }
      try{
        o.traverse?.(child=>{
          const ceid=String(child?.userData?.editId||child?.userData?.id||'');
          const cgid=String(child?.userData?.groupId||child?.userData?.group||'');
          const cname=String(child?.userData?.editName||child?.userData?.buildItem||'');
          const ck=String(child?.userData?.assetData?.kind||'');
          const cpx=+child?.position?.x;
          const childLooksLikeStageBooth=v238StateIsDj({kind:ck,name:cname}) && Number.isFinite(cpx) && cpx<=-4.5;
          if(v238StageDjIds.has(ceid) || (cgid&&v239StageDjGroupIds.has(cgid)) || childLooksLikeStageBooth){
            child.visible=false
          }
        })
      }catch(e){}
    });
    mark()
  }

  window.v238HideDefaultStageDjBooth=v238HideDefaultStageDjBooth;

  function commitGroup(){try{if(typeof activeGroupId!=='undefined'&&activeGroupId&&typeof releaseActiveGroupPivot==='function')releaseActiveGroupPivot(true)}catch(e){}}
  function mark(){try{if(typeof markRenderDirty==='function')markRenderDirty(180)}catch(e){}}
  function setDirty(){try{if(typeof setProjectDirty==='function'&&typeof projectReady!=='undefined'&&projectReady)setProjectDirty(true)}catch(e){}}
  function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(defaults))}catch(e){}setDirty()}

  function objectState(o){
    let record=null;
    try{if(typeof captureBuilderObject==='function')record=captureBuilderObject(o)}catch(e){}
    return {
      id:editId(o),kind:kindOf(o),name:String(o?.userData?.editName||o?.userData?.buildItem||''),
      p:[+o.position.x||0,+o.position.y||0,+o.position.z||0],
      r:[+o.rotation.x||0,+o.rotation.y||0,+o.rotation.z||0,o.rotation.order||'XYZ'],
      s:[+o.scale.x||1,+o.scale.y||1,+o.scale.z||1],v:o.visible!==false,
      record:record?clone(record):null
    };
  }
  function findStateObject(s,used){
    const all=pool();let o=null;
    if(s.id)o=all.find(x=>editId(x)===s.id&&!used.has(x));
    if(!o&&s.kind)o=all.find(x=>kindOf(x)===s.kind&&!used.has(x));
    if(!o&&s.name){const n=String(s.name).toLowerCase();o=all.find(x=>String(x?.userData?.editName||x?.userData?.buildItem||'').toLowerCase()===n&&!used.has(x))}
    return o||null;
  }

  function capture(type){
    commitGroup();const roots=eventRoots();
    roots.forEach(o=>{if(o?.userData)o.userData.v184EventLayoutMember=true});
    return {version:2,type,savedAt:new Date().toISOString(),objects:roots.map(objectState)};
  }
  function hasDefault(type){return !!(defaults[type]&&+defaults[type].version>=1&&Array.isArray(defaults[type].objects))}

  function applyVisibilityFallback(type){
    const roots=eventRoots();
    roots.forEach(o=>{
      if(type==='Band / Live Performance')o.visible=isBand(o);
      else if(type==='DJ / Stage'||type==='DJ / 360')o.visible=isDj(o);
      else o.visible=false;
    });
    v238HideDefaultStageDjBooth(type)
  }

  function applySnapshot(snap,type,{quiet=false}={}){
    type=TYPES.includes(type)?type:'DJ / Stage';commitGroup();activeType=type;
    if(!snap||!Array.isArray(snap.objects)){applyVisibilityFallback(type);syncUi();mark();return false}
    eventRoots().forEach(o=>o.visible=false);
    const used=new Set();
    snap.objects.forEach(s=>{
      let o=findStateObject(s,used);
      if(!o&&s.record&&typeof buildSavedBuilderRecord==='function'){
        try{const rec=clone(s.record);rec.v=s.v!==false;rec.eventLayoutMember=true;o=buildSavedBuilderRecord(rec)}
        catch(e){console.warn('Could not restore saved event item',s?.name,e)}
      }
      if(!o)return;used.add(o);if(o.userData)o.userData.v184EventLayoutMember=true;
      if(Array.isArray(s.p))o.position.set(+s.p[0]||0,+s.p[1]||0,+s.p[2]||0);
      if(Array.isArray(s.r))o.rotation.set(+s.r[0]||0,+s.r[1]||0,+s.r[2]||0,s.r[3]||'XYZ');
      if(Array.isArray(s.s))o.scale.set(Number.isFinite(+s.s[0])?+s.s[0]:1,Number.isFinite(+s.s[1])?+s.s[1]:1,Number.isFinite(+s.s[2])?+s.s[2]:1);
      o.visible=s.v!==false;try{o.updateMatrixWorld(true)}catch(e){}
    });

    // Layout has now been restored exactly. Remove only the stage/default
    // booth where requested; the separate DJ / 360 setup remains untouched.
    v238HideDefaultStageDjBooth(type);

    const sel=$('v175EventOption');if(sel&&sel.value!==type)sel.value=type;
    document.querySelectorAll('[data-v175-event]').forEach(b=>b.classList.toggle('active',b.dataset.v175Event===type));
    syncUi();mark();if(!quiet)stageMessage(type+' · saved layout loaded · '+snap.objects.length+' event items restored.');return true
  }

  function applyDefault(type,{quiet=false}={}){
    type=TYPES.includes(type)?type:'DJ / Stage';activeType=type;
    const snap=defaults[type];
    if(!hasDefault(type)){applyVisibilityFallback(type);syncUi();mark();if(!quiet)stageMessage(type+' · no saved default yet. Arrange it, then SAVE CURRENT AS DEFAULT.');return false}
    return applySnapshot(snap,type,{quiet})
  }

  function saveDefault(opts={}){
    const type=TYPES.includes(opts.type)?opts.type:($('v175EventOption')?.value||activeType||'DJ / Stage');
    activeType=type;
    defaults[type]=capture(type);persist();
    if(!opts.lightweight){try{if(typeof saveLocalEditState==='function')saveLocalEditState(false)}catch(e){}}
    syncUi();mark();
    if(!opts.quiet)stageMessage(type+' · SAVED LAYOUT UPDATED · '+defaults[type].objects.length+' event items stored.');
    return clone(defaults[type]);
  }
  function loadDefault(){applyDefault($('v175EventOption')?.value||activeType)}
  function stageMessage(msg){const e=$('v175StageStatus');if(e)e.textContent=msg}

  function syncUi(){
    const type=$('v175EventOption')?.value||activeType||TYPES[0];
    activeType=type;
    const saved=hasDefault(type),st=$('v176DefaultStatus'),load=$('v176LoadDefault'),save=$('v176SaveDefault');
    if(st){st.textContent=type.toUpperCase()+(saved?' · SAVED LAYOUT · LAST EDIT KEPT':' · NOT SAVED YET');st.classList.toggle('saved',saved)}
    if(load)load.disabled=!saved;
    if(save)save.textContent='SAVE '+short(type)+' LAYOUT NOW';
    document.querySelectorAll('[data-v176-performance-event]').forEach(b=>{
      const t=b.dataset.v176PerformanceEvent,ok=hasDefault(t);
      b.disabled=!ok;b.classList.toggle('saved',ok);b.classList.toggle('active',t===activeType&&ok);
      b.title=ok?'Load saved '+t+' stage layout':'Save a '+t+' default in Edit Mode first';
    });
    const ps=$('v176PerformanceStatus');if(ps)ps.textContent=hasDefault(activeType)?short(activeType)+' LOADED':'SAVE DEFAULTS IN EDIT MODE';
  }
  function short(t){return t==='Band / Live Performance'?'BAND / LIVE':t==='Empty Stage'?'EMPTY STAGE':t.toUpperCase()}

  function hideExactOverlapDuplicates(){
    // Old buggy versions could leave two identical stage props in exactly the same place.
    // Keep every intentional moved duplicate; only hide a later object if kind + transform are virtually identical.
    const roots=eventRoots(),seen=[];
    const near=(a,b)=>Math.abs(a-b)<0.002;
    roots.forEach(o=>{
      const dup=seen.find(x=>kindOf(x)===kindOf(o)&&near(x.position.x,o.position.x)&&near(x.position.y,o.position.y)&&near(x.position.z,o.position.z)&&near(x.rotation.y,o.rotation.y)&&near(x.scale.x,o.scale.x)&&near(x.scale.z,o.scale.z));
      if(dup){o.visible=false;o.userData=o.userData||{};o.userData.v176HiddenOverlapDuplicate=true}else seen.push(o);
    });
  }

  function loadStoredDefaults(){
    let boot=null,local=null;
    try{
      if(typeof BOOT_PROJECT_STATE!=='undefined'&&BOOT_PROJECT_STATE&&BOOT_PROJECT_STATE.v176StageDefaults){
        boot=BOOT_PROJECT_STATE.v176StageDefaults
      }
    }catch(e){}
    try{local=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(e){}

    defaults={};
    let repaired=false;

    // The embedded HTML defaults are the clean known-good reference.
    // Keep a valid newer local edit, but reject local snapshots where the
    // wrong booth leaked into Band / 360 / Empty or the layout was wiped.
    TYPES.forEach(type=>{
      const a=boot&&boot[type],b=local&&local[type];
      const localHealthy=v238SnapshotLooksHealthy(type,b,boot);

      if(a&&b&&localHealthy){
        const at=Date.parse(a.savedAt||0)||0,bt=Date.parse(b.savedAt||0)||0;
        defaults[type]=clone(bt>=at?b:a)
      }else if(b&&localHealthy){
        defaults[type]=clone(b)
      }else if(a){
        defaults[type]=clone(a);
        if(b)repaired=true
      }else if(b){
        defaults[type]=clone(b)
      }
    });

    v238RefreshStageDjIds(boot||defaults);

    // Repair the browser copy only when it was demonstrably invalid.
    if(repaired){
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(defaults))}catch(e){}
    }
  }

  // Include defaults in normal SAVE PROJECT / exported editable HTML without adding any heavy scene capture to ordinary editing.
  try{
    if(typeof captureProjectState==='function'){
      const baseCapture=captureProjectState;
      captureProjectState=function(){const p=baseCapture();p.v176StageDefaults=clone(defaults);return p};
    }
    if(typeof applyProjectState==='function'){
      const baseApply=applyProjectState;
      applyProjectState=function(p){const r=baseApply(p);if(p&&p.v176StageDefaults){defaults=clone(p.v176StageDefaults);persist();syncUi()}return r};
    }
  }catch(e){console.warn('Stage-default project hooks unavailable',e)}

  function onEditTypeChosen(type){
    activeType=type;
    // V175's listener runs first and performs only a cheap visibility switch.
    // Then we recall the saved transform, if one exists. No object creation, project serialization, or venue rebuild.
    if(hasDefault(type))requestAnimationFrame(()=>applyDefault(type,{quiet:true}));
    else requestAnimationFrame(syncUi);
  }

  function init(){
    loadStoredDefaults();hideExactOverlapDuplicates();activeType='DJ / Stage';
    const select=$('v175EventOption');
    if(select){select.value='DJ / Stage';select.addEventListener('change',e=>onEditTypeChosen(e.target.value))}
    document.querySelectorAll('[data-v175-event]').forEach(b=>b.classList.toggle('active',b.dataset.v175Event==='DJ / Stage'));
    document.querySelectorAll('[data-v175-event]').forEach(b=>b.addEventListener('click',()=>onEditTypeChosen(b.dataset.v175Event)));
    $('v176SaveDefault')?.addEventListener('click',()=>saveDefault({quiet:false,lightweight:false}));
    $('v176LoadDefault')?.addEventListener('click',loadDefault);
    syncUi();
    requestAnimationFrame(()=>{if(hasDefault('DJ / Stage'))applyDefault('DJ / Stage',{quiet:true});else applyVisibilityFallback('DJ / Stage')});
  }

  function eventLabel(t){return t==='Band / Live Performance'?'BAND / LIVE':t==='DJ / Stage'?'DJ / STAGE':t==='DJ / 360'?'DJ / 360':'EMPTY STAGE'}
  function updateV177EditUi(){
    const type=$('v175EventOption')?.value||activeType||TYPES[0],lab=eventLabel(type),tag=$('v177EditingType'),btn=$('v177EditEventLayout');
    if(tag)tag.textContent=lab;if(btn)btn.textContent='EDIT '+lab+' LAYOUT';
  }
  function enterEventLayoutEdit(){
    const type=$('v175EventOption')?.value||activeType||TYPES[0];activeType=type;
    try{
      if(typeof window.v178EnterEventLayoutEdit==='function'){window.v178EnterEventLayoutEdit(type,hasDefault(type)?()=>applyDefault(type,{quiet:true}):()=>applyVisibilityFallback(type));updateV177EditUi();return}
    }catch(e){console.warn(e)}
    try{if(typeof setExperienceMode==='function')setExperienceMode('edit');else if(typeof setEditMode==='function')setEditMode(true)}catch(e){}
    try{if(typeof setEditMode==='function'&&!document.body.classList.contains('edit-on'))setEditMode(true)}catch(e){}
    try{if(typeof layoutLocked!=='undefined'&&layoutLocked&&typeof setLayoutLocked==='function')setLayoutLocked(false,false)}catch(e){}
    if(hasDefault(type))applyDefault(type,{quiet:true});else{applyVisibilityFallback(type);syncUi();mark()}
    requestAnimationFrame(()=>{
      const roots=eventRoots().filter(o=>o.visible!==false);
      let pick=null;if(type==='Band / Live Performance')pick=roots.find(isBand)||null;else if(type==='DJ / Stage'||type==='DJ / 360')pick=roots.find(isDj)||null;
      if(pick){try{if(typeof selectEdit==='function')selectEdit(pick)}catch(e){}}
      try{$('v175StageManager')?.scrollIntoView({behavior:'auto',block:'start'})}catch(e){}
      stageMessage('EDITING '+type.toUpperCase()+' · move / rotate the visible gear, add anything missing, then SAVE / REPLACE THIS EVENT TYPE DEFAULT below.');
      updateV177EditUi();
    });
  }
  function cleanupRuntimeStructuralDuplicates(){
    try{
      if(typeof builderObjects==='undefined')return;
      const stageItems=builderObjects.filter(o=>o&&o.userData&&((o.userData.solidData&&o.userData.solidData.role==='stage')||String(o.userData.editName||'').toLowerCase().startsWith('stage · editable')));
      const fohItems=builderObjects.filter(o=>o&&o.userData&&((o.userData.solidData&&o.userData.solidData.role==='foh')||String(o.userData.editName||'').toLowerCase().startsWith('foh booth · editable')));
      const choose=arr=>arr.find(o=>o.userData.builderType==='platform'&&o.visible!==false)||[...arr].reverse().find(o=>o.visible!==false)||arr[0]||null;
      const keepStage=choose(stageItems),keepFoh=choose(fohItems);
      [...stageItems,...fohItems].forEach(o=>{if(o!==keepStage&&o!==keepFoh&&typeof removeDynamicRoot==='function')removeDynamicRoot(o)});
      if(typeof stage!=='undefined'&&stage&&keepStage)stage.visible=false;if(typeof foh!=='undefined'&&foh&&keepFoh)foh.visible=false;
      mark();
    }catch(e){console.warn('V177 structural cleanup',e)}
  }
  // V184 bridge for frame/submenu event layouts.
  window.v184CaptureEventLayoutSnapshot=function(type){
    type=TYPES.includes(type)?type:(activeType||'DJ / Stage');
    if(type===activeType||$('v175EventOption')?.value===type)return clone(capture(type));
    return hasDefault(type)?clone(defaults[type]):null;
  };
  window.v184GetEventTypeDefault=type=>hasDefault(type)?clone(defaults[type]):null;
  window.v184HasEventTypeDefault=type=>hasDefault(type);
  window.v184ApplyEventLayoutSnapshot=function(snap,type,opts={}){return applySnapshot(clone(snap),type||snap?.type||'DJ / Stage',{quiet:opts.quiet!==false})};
  window.v184ApplyEventTypeDefault=function(type,opts={}){return applyDefault(type||'DJ / Stage',{quiet:opts.quiet!==false})};
  window.v184SaveCurrentEventDefault=function(type,opts={}){if(type&&TYPES.includes(type)){activeType=type;const sel=$('v175EventOption');if(sel)sel.value=type}return saveDefault({...opts,type:activeType})};
  window.v184GetActiveEventType=()=>activeType||$('v175EventOption')?.value||'DJ / Stage';

  $('v177EditEventLayout')?.addEventListener('click',enterEventLayoutEdit);
  $('v175EventOption')?.addEventListener('change',()=>requestAnimationFrame(updateV177EditUi));
  document.querySelectorAll('[data-v175-event]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(updateV177EditUi)));
  cleanupRuntimeStructuralDuplicates();updateV177EditUi();
  init();
})();
;
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(n,a,b,f)=>{n=Number(n);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):f};
  const hex=(v,f)=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v):f;
  let activeSubmenuId='',accordionOpenPage='';

  function ensureState(){
    if(!pageTabState||typeof pageTabState!=='object')return;
    if(!pageTabState.submenus||typeof pageTabState.submenus!=='object')pageTabState.submenus={};
    (pageTabState.order||[]).forEach(id=>{if(!Array.isArray(pageTabState.submenus[id]))pageTabState.submenus[id]=[]});
    pageTabState.menuStyle=v171NormaliseMenuStyle(pageTabState.menuStyle||{});
  }
  function submenus(page){ensureState();return Array.isArray(pageTabState.submenus?.[page])?pageTabState.submenus[page]:[]}
  function nextId(){return 'submenu_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6)}
  function currentPage(){return $('v183SubmenuPage')?.value||$('v170PageSelect')?.value||siteActiveSection||v170EnabledPageIds()[0]||''}
  function currentSub(){const page=currentPage(),id=$('v183SubmenuSelect')?.value||'';return submenus(page).find(x=>x.id===id)||null}

  function v235ReturnCollapsedPageToMain3D(page){
    // Venue Areas has its own pseudo-2D presentation mode. Do not force that
    // special 2D view into 3D merely because the accordion was collapsed.
    const venueStill2D=
      page==='venue' &&
      typeof venuePreferredMode!=='undefined' &&
      venuePreferredMode==='2d';

    if(venueStill2D)return;

    try{
      // Use the page's assigned/main camera logic, not the submenu frame.
      siteGoCamera(page,true)
    }catch(e){
      try{
        const frame=v170PageAssignedFrame?.(page);
        if(frame?.id)loadCameraFrame(frame.id,true)
      }catch(_){}
    }
  }
  function frameExists(id){return !!id&&cameraFrames.some(f=>f.id===id)}
  function frameName(id){return cameraFrames.find(f=>f.id===id)?.name||''}
  function setStatus(msg,kind=''){const e=$('v183SubmenuStatus');if(!e)return;e.textContent=msg;e.className='v183-submenu-state'+(kind?' '+kind:'')}

  // Extend the existing menu-style state without breaking older saved projects.
  const baseNormalise=v171NormaliseMenuStyle;
  v171NormaliseMenuStyle=function(v){
    v=v&&typeof v==='object'?v:{};
    const b=baseNormalise(v);
    return {...b,
      submenuTextSize:clamp(v.submenuTextSize,9,24,13),
      submenuText:hex(v.submenuText,'#aeb3bc'),
      submenuActive:hex(v.submenuActive,b.accent||'#ff514f'),
      accordion:v.accordion!==false
    };
  };

  function applyExtraStyle(st){
    st=v171NormaliseMenuStyle(st);
    const nav=$('siteNav');
    if(nav){
      nav.style.setProperty('--v183-submenu-size',st.submenuTextSize+'px');
      nav.style.setProperty('--v183-submenu-text',st.submenuText);
      nav.style.setProperty('--v183-submenu-active',st.submenuActive);
      nav.classList.toggle('v183-always-open',!st.accordion);
    }
  }

  const baseApply=v171ApplyMenuStyle;
  v171ApplyMenuStyle=function(style=pageTabState?.menuStyle){
    const st=v171NormaliseMenuStyle(style);if(pageTabState)pageTabState.menuStyle=st;
    baseApply(st);applyExtraStyle(st)
  };

  const baseSyncControls=v171SyncMenuControls;
  v171SyncMenuControls=function(){
    baseSyncControls();
    const st=v171NormaliseMenuStyle(pageTabState?.menuStyle);
    const set=(id,v)=>{const e=$(id);if(e&&document.activeElement!==e)e.value=v};
    set('v183SubmenuTextSize',st.submenuTextSize);
    set('v183SubmenuText',st.submenuText);
    set('v183SubmenuActive',st.submenuActive);
    set('v183AccordionMode',st.accordion?'accordion':'expanded');
    if($('v183SubmenuTextSizeValue'))$('v183SubmenuTextSizeValue').textContent=Math.round(st.submenuTextSize)+' PX';
  };

  v171ReadMenuControls=function(){
    return v171NormaliseMenuStyle({
      width:$('v171MenuWidth')?.value,
      textSize:$('v171MenuTextSize')?.value,
      opacity:$('v171MenuOpacity')?.value,
      bg:$('v171MenuBg')?.value,
      text:$('v171MenuText')?.value,
      accent:$('v171MenuAccent')?.value,
      submenuTextSize:$('v183SubmenuTextSize')?.value,
      submenuText:$('v183SubmenuText')?.value,
      submenuActive:$('v183SubmenuActive')?.value,
      accordion:$('v183AccordionMode')?.value!=='expanded'
    });
  };

  function syncNavState(){
    const nav=$('siteNav');if(!nav)return;
    const st=v171NormaliseMenuStyle(pageTabState?.menuStyle);
    nav.classList.toggle('v183-always-open',!st.accordion);
    nav.querySelectorAll('.v183-nav-item').forEach(item=>{
      const page=item.dataset.page;
      const shouldOpen=!st.accordion || accordionOpenPage===page || (page===siteActiveSection&&activeSubmenuId);
      item.classList.toggle('open',!!shouldOpen);
    });
    nav.querySelectorAll('.v183-submenu-link').forEach(b=>b.classList.toggle('active',b.dataset.submenuId===activeSubmenuId));
  }

  function goSubmenu(page,s){
    if(!s)return;
    if(siteActiveSection!==page)siteNavigate(page,{scroll:false,camera:false});
    else siteSetActiveNav(page);
    activeSubmenuId=s.id;accordionOpenPage=page;syncNavState();
    if(frameExists(s.frameId)){
      hotspotSuspendForCamera?.(650);loadCameraFrame(s.frameId,true);
    }else{
      setStatus('This submenu is not linked to a saved frame yet.','warn')
    }
  }

  // Replace only the DOM-building part of the nav. Existing page state/camera functions stay untouched.
  v170RebuildNav=function(){
    const nav=$('siteNav');if(!nav)return;
    ensureState();
    const enabled=v170EnabledPageIds();v170RefreshPageNumbering();nav.innerHTML='';
    enabled.forEach(id=>{
      const list=submenus(id);
      const item=document.createElement('div');item.className='v183-nav-item';item.dataset.page=id;

      const b=document.createElement('button');b.type='button';
      b.className='site-nav-link '+(list.length?'v183-has-submenu':'v183-no-submenu')+(id===siteActiveSection?' active':'');
      b.dataset.siteTarget=id;b.textContent=v170PageName(id);
      b.addEventListener('click',e=>{
        const st=v171NormaliseMenuStyle(pageTabState?.menuStyle);
        const isOpen=item.classList.contains('open');
        const label=String(v170PageName(id)||'').toLowerCase();
        const eventParent=list.some(s=>!!s.eventType)||((label.includes('stage')&&label.includes('event')));
        activeSubmenuId='';
        if(eventParent&&list.length){
          if(siteActiveSection!==id)siteSetActiveNav(id);
          const collapsing=st.accordion&&isOpen;
          accordionOpenPage=collapsing?'':id;
          syncNavState();
          if(collapsing)v235ReturnCollapsedPageToMain3D(id);
          return;
        }
        if(st.accordion&&list.length&&id===siteActiveSection&&isOpen){
          accordionOpenPage='';
          syncNavState();
          v235ReturnCollapsedPageToMain3D(id);
          return;
        }
        accordionOpenPage=list.length?id:'';
        siteNavigate(id,{scroll:false,camera:true});syncNavState()
      });
      item.appendChild(b);

      if(list.length){
        const sub=document.createElement('div');sub.className='v183-submenu';sub.setAttribute('role','group');
        list.forEach(s=>{
          const sb=document.createElement('button');sb.type='button';sb.className='v183-submenu-link';
          sb.dataset.submenuId=s.id;sb.dataset.parentPage=id;sb.dataset.frameId=s.frameId||'';
          sb.textContent=s.title||frameName(s.frameId)||'VIEW';
          sb.title=frameExists(s.frameId)?'Go to '+(frameName(s.frameId)||sb.textContent):'Choose a saved frame for this submenu';
          sb.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();goSubmenu(id,s)});
          sub.appendChild(sb)
        });
        item.appendChild(sub)
      }
      nav.appendChild(item)
    });
    if(!enabled.includes(siteActiveSection)&&enabled.length){siteActiveSection=enabled[0];sitePanelSection=enabled[0]}
    if(!accordionOpenPage)accordionOpenPage=siteActiveSection;
    applyExtraStyle(pageTabState.menuStyle);syncNavState();
    v170RefreshPageControls();v170RefreshHotspotPageOptions();v171SyncMenuPreview?.();refreshEditor(false)
  };

  const baseSetActive=siteSetActiveNav;
  siteSetActiveNav=function(section){
    baseSetActive(section);
    activeSubmenuId='';
    if(v171NormaliseMenuStyle(pageTabState?.menuStyle).accordion)accordionOpenPage=section;
    syncNavState()
  };

  // The editor preview now mirrors the accordion hierarchy.
  v171SyncMenuPreview=function(){
    const el=$('v171MenuPreview');if(!el)return;ensureState();
    const st=v171NormaliseMenuStyle(pageTabState?.menuStyle),rgb=v171HexToRgb(st.bg);
    el.style.background=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(.2,st.opacity/100)})`;
    el.style.maxWidth=Math.min(st.width,354)+'px';
    const pages=v170EnabledPageIds().slice(0,4);
    let html='';
    pages.forEach((id,i)=>{
      html+=`<button type="button" class="v183-preview-main" style="font-size:${Math.max(12,Math.min(28,st.textSize*.72))}px;color:${i===0?st.accent:st.text}">${esc(v170PageName(id))}</button>`;
      if(i===0){
        submenus(id).slice(0,4).forEach((s,j)=>{
          html+=`<button type="button" class="v183-preview-sub" style="font-size:${Math.max(9,Math.min(18,st.submenuTextSize*.88))}px;color:${j===0?st.submenuActive:st.submenuText}">${esc(s.title||frameName(s.frameId)||'SUBMENU')}</button>`
        })
      }
    });
    el.innerHTML=html
  };

  function refreshFrames(){
    const sel=$('v183SubmenuFrame');if(!sel)return;
    const keep=sel.value||currentSub()?.frameId||'';
    sel.innerHTML='<option value="">— CHOOSE A SAVED FRAME —</option>'+cameraFrames.map(f=>
      `<option value="${esc(f.id)}">${esc(f.name||'Frame')} · ${esc(String(f.mode||'perspective').toUpperCase())}${f.eventType?' · '+esc(String(f.eventType).toUpperCase()):''}</option>`
    ).join('');
    if(frameExists(keep))sel.value=keep;
    else if(keep){const o=document.createElement('option');o.value=keep;o.textContent='MISSING FRAME · '+keep;o.disabled=true;sel.appendChild(o);sel.value=keep}
  }

  function refreshEditor(preserve=true){
    const pageSel=$('v183SubmenuPage');if(!pageSel)return;ensureState();
    const pages=v170EnabledPageIds(),oldPage=pageSel.value,preferred=preserve&&pages.includes(oldPage)?oldPage:(pages.includes($('v170PageSelect')?.value)?$('v170PageSelect').value:(pages.includes(siteActiveSection)?siteActiveSection:pages[0]));
    pageSel.innerHTML=pages.map(id=>`<option value="${esc(id)}">${esc(v170PageName(id))}</option>`).join('');
    if(preferred)pageSel.value=preferred;

    const list=submenus(pageSel.value),subSel=$('v183SubmenuSelect');
    const oldSub=preserve?subSel?.value:'';
    if(subSel){
      subSel.innerHTML='<option value="">— NEW SUBMENU —</option>'+list.map((s,i)=>`<option value="${esc(s.id)}">${String(i+1).padStart(2,'0')} · ${esc(s.title||frameName(s.frameId)||'UNTITLED')}</option>`).join('');
      if(list.some(s=>s.id===oldSub))subSel.value=oldSub
    }
    refreshFrames();
    const s=currentSub(),title=$('v183SubmenuTitle'),frame=$('v183SubmenuFrame');
    if(title&&document.activeElement!==title)title.value=s?.title||'';
    if(frame&&s?.frameId&&frameExists(s.frameId))frame.value=s.frameId;
    if($('v183SaveSubmenu'))$('v183SaveSubmenu').disabled=!s;
    if($('v183DeleteSubmenu'))$('v183DeleteSubmenu').disabled=!s;
    if($('v183SubmenuUp'))$('v183SubmenuUp').disabled=!s||list.indexOf(s)<=0;
    if($('v183SubmenuDown'))$('v183SubmenuDown').disabled=!s||list.indexOf(s)<0||list.indexOf(s)>=list.length-1;
    if(s)setStatus((s.title||'SUBMENU')+(frameExists(s.frameId)?' · LINKED TO '+frameName(s.frameId):' · CHOOSE A FRAME'),'saved');
    else setStatus('New submenu · enter a title and choose a saved Story / Frame View.')
    v171SyncMenuControls();v171SyncMenuPreview()
  }

  function addSubmenu(){
    const page=currentPage(),title=String($('v183SubmenuTitle')?.value||'').trim().slice(0,48),frameId=$('v183SubmenuFrame')?.value||'';
    if(!page)return;
    if(!frameId){setStatus('Choose a saved page view frame first.','warn');return}
    const s={id:nextId(),title:title||frameName(frameId)||'VIEW',frameId};
    submenus(page).push(s);persistPageTabState();v170RebuildNav();$('v183SubmenuPage').value=page;refreshEditor(false);$('v183SubmenuSelect').value=s.id;refreshEditor(true);setStatus(s.title+' · submenu added.','saved')
  }
  function saveSubmenu(){
    const page=currentPage(),s=currentSub();if(!s){setStatus('Choose a saved submenu first, or press + ADD SUBMENU.','warn');return}
    const title=String($('v183SubmenuTitle')?.value||'').trim().slice(0,48),frameId=$('v183SubmenuFrame')?.value||'';
    if(!frameId){setStatus('Choose a saved page view frame first.','warn');return}
    s.title=title||frameName(frameId)||s.title||'VIEW';s.frameId=frameId;
    persistPageTabState();v170RebuildNav();$('v183SubmenuPage').value=page;refreshEditor(false);$('v183SubmenuSelect').value=s.id;refreshEditor(true);setStatus(s.title+' · submenu saved.','saved')
  }
  function deleteSubmenu(){
    const page=currentPage(),s=currentSub();if(!s)return;
    pageTabState.submenus[page]=submenus(page).filter(x=>x.id!==s.id);
    if(activeSubmenuId===s.id)activeSubmenuId='';
    persistPageTabState();v170RebuildNav();$('v183SubmenuPage').value=page;refreshEditor(false);setStatus('Submenu deleted.')
  }
  function moveSubmenu(dir){
    const page=currentPage(),s=currentSub(),list=submenus(page);if(!s)return;
    const i=list.indexOf(s),j=i+dir;if(i<0||j<0||j>=list.length)return;
    [list[i],list[j]]=[list[j],list[i]];persistPageTabState();v170RebuildNav();$('v183SubmenuPage').value=page;refreshEditor(false);$('v183SubmenuSelect').value=s.id;refreshEditor(true)
  }

  function bind(){
    $('v183SubmenuPage')?.addEventListener('change',()=>refreshEditor(false));
    $('v183SubmenuSelect')?.addEventListener('change',()=>refreshEditor(true));
    $('v183AddSubmenu')?.addEventListener('click',addSubmenu);
    $('v183SaveSubmenu')?.addEventListener('click',saveSubmenu);
    $('v183DeleteSubmenu')?.addEventListener('click',deleteSubmenu);
    $('v183SubmenuUp')?.addEventListener('click',()=>moveSubmenu(-1));
    $('v183SubmenuDown')?.addEventListener('click',()=>moveSubmenu(1));
    $('v170PageSelect')?.addEventListener('change',()=>{if($('v183SubmenuPage')){$('v183SubmenuPage').value=$('v170PageSelect').value;refreshEditor(false)}});

    ['v183SubmenuTextSize','v183SubmenuText','v183SubmenuActive'].forEach(id=>{
      $(id)?.addEventListener('input',()=>v171UpdateMenuFromUI({persist:false}));
      $(id)?.addEventListener('change',()=>v171UpdateMenuFromUI({persist:true}))
    });
    $('v183AccordionMode')?.addEventListener('change',()=>{
      v171UpdateMenuFromUI({persist:true});
      if(v171NormaliseMenuStyle(pageTabState.menuStyle).accordion&&!accordionOpenPage)accordionOpenPage=siteActiveSection;
      syncNavState()
    });
  }

  // Keep submenu frame choices synced whenever Story / Frame Views change.
  const baseSyncCameraFrameUI=syncCameraFrameUI;
  syncCameraFrameUI=function(){const r=baseSyncCameraFrameUI();refreshFrames();refreshEditor(true);return r};

  ensureState();bind();
  accordionOpenPage=siteActiveSection;
  pageTabState.menuStyle=v171NormaliseMenuStyle(pageTabState.menuStyle);
  v171ApplyMenuStyle(pageTabState.menuStyle);
  v170RebuildNav();
  refreshEditor(false);
})();
;
(function(){
  try{
    const baseSetExperienceMode=setExperienceMode;
    setExperienceMode=function(mode){
      const r=baseSetExperienceMode(mode);
      if(mode==='performance'){
        requestAnimationFrame(()=>{
          try{window.v184ApplyEventTypeDefault?.('DJ / Stage',{quiet:true,performanceDefault:true})}catch(e){}
        })
      }
      return r
    }
  }catch(e){}
})();
;
(function(){
  const $=id=>document.getElementById(id);
  const b3=$('v190VenueView3D');
  const b2=$('v190VenueView2D');

  let venueFrameId='';
  let venue2DFocus=null;
  let venuePreferredMode='3d';

  function frameById(id){
    try{return (cameraFrames||[]).find(f=>f&&f.id===id)||null}catch(e){return null}
  }

  // The uploaded save contains an older Venue Areas frame id. Resolve it
  // against the actual current frame list, then fall back to the saved VENUE
  // camera by name. This is the key fix for main-page 2D.
  function venueMainFrame(){
    try{
      const assigned=
        pageTabState?.pages?.venue?.frameId ||
        BOOT_PROJECT_STATE?.pageTabs?.pages?.venue?.frameId ||
        '';
      const direct=frameById(assigned);
      if(direct)return direct;

      const exact=(cameraFrames||[]).find(f=>
        String(f?.name||'').trim().toLowerCase()==='venue'
      );
      if(exact)return exact;

      if(typeof siteFrameByWords==='function'){
        const byWords=siteFrameByWords(['venue']);
        if(byWords)return byWords
      }
    }catch(e){}
    return null
  }

  function venueMainFrameId(){
    return venueMainFrame()?.id||''
  }

  function isVenueSubmenuButton(el){
    return !!el &&
      el.classList?.contains('v183-submenu-link') &&
      el.dataset?.parentPage==='venue' &&
      !!el.dataset?.frameId
  }

  function syncButtons(){
    b3?.classList.toggle('active',venuePreferredMode==='3d');
    b2?.classList.toggle('active',venuePreferredMode==='2d');
  }

  function showVenueToggle(frameId){
    venueFrameId=frameId||venueMainFrameId()||'';
    venue2DFocus=null;
    document.body.classList.add('v190-venue-submenu-active');
    syncButtons()
  }

  function showForVenueSubmenu(button){
    if(!isVenueSubmenuButton(button))return;
    showVenueToggle(button.dataset.frameId||'')
  }

  function showForVenueMain(){
    const mainId=venueMainFrameId();
    showVenueToggle(mainId);

    // Main Venue Areas overview never carries a subsection highlight.
    clearZoneHighlight();
    requestAnimationFrame(clearZoneHighlight);

    // V234 · If the Venue Areas accordion is being collapsed while in 3D,
    // return to the MAIN Venue Areas saved 3D frame instead of leaving the
    // camera on the previously selected room/submenu frame.
    if(venuePreferredMode==='3d' && mainId){
      requestAnimationFrame(()=>{
        try{
          originalLoadCameraFrame(mainId,true)
        }catch(e){
          try{loadCameraFrame(mainId,true)}catch(_){}
        }
      })
    }
  }

  // HOME is intentionally the same venue overview camera as clicking
  // THE MOTHERSHIP, but it has no scroll-down Page Details sheet.
  function showForHome(){
    showVenueToggle(venueMainFrameId());
    try{
      if(typeof deactivateDetails==='function')deactivateDetails()
    }catch(e){}
    document.body.classList.remove('v194-submenu-details-active');
  }

  function hideVenueToggle(){
    document.body.classList.remove('v190-venue-submenu-active');
    venueFrameId='';
    venue2DFocus=null;
    syncButtons()
  }

  function calculate2DFocus(frame){
    if(!frame)return null;
    if(Array.isArray(frame.target)){
      return {x:+frame.target[0]||0,z:+frame.target[2]||0}
    }
    if(Array.isArray(frame.position)){
      const yaw=Number.isFinite(+frame.yaw)?+frame.yaw:0;
      const pitch=Number.isFinite(+frame.pitch)?+frame.pitch:0;
      const cp=Math.cos(pitch);
      return {
        x:(+frame.position[0]||0)+Math.sin(yaw)*cp*3.4,
        z:(+frame.position[2]||0)+Math.cos(yaw)*cp*3.4
      }
    }
    return null
  }

  let venueMorphToken=0;
  let venueMorphTimer=null;
  let venue2DPanRaf=0;
  let fixed2DPlan=null;
  let last3DPoseBefore2D=null;
  let last3DOrbitBefore2D=null;
  let venue2DActive=false;
  let fixed2DOrbit=null;
  let zoneOverlayGroup=null;
  let zoneLabelEl=null;
  const MORPH_DURATION=680;
  const PAN_2D_DURATION=920;

  // V226 · calibrated zone shapes + per-zone editable placement.
  const V226_ZONE_PATHS={
    'smokers courtyard':{path:'M755 50 H1517 V258 H755 Z',label:[1136,72]},
    'green room':{path:'M1362 253 H1664 V586 H1362 Z',label:[1676,340]},
    'main bar / dancefloor':{path:'M624 606 L1569 587 V766 H1723 V1014 H559 Z',label:[1575,630]},
    'stage':{path:'M222 599 L431 599 C456 634 477 691 523 691 C566 691 601 626 638 599 L557 1029 H276 Z',label:[72,695]},
    'right lounge':{path:'M363 1026 H671 V1298 H363 Z',label:[250,1365]},
    'bar 2':{path:'M672 1135 H995 V1333 H672 Z',label:[775,1365]},
    'left lounge':{path:'M944 1003 H1297 V1336 H944 Z',label:[1308,1190]}
  };

  const V226_ZONE_MATRIX={
    a:.729920254,b:-.000013305,
    c:-.000695989,d:.729704229,
    e:201.068782,f:-140.386929
  };
  const V226_ZONE_STORE='mothershipVenueZoneOffsetsV226';
  const V226_VW=2048,V226_VH=1126;

  let zoneOffsets={};
  let activeZoneKey='';
  let activeZoneFrameId='';
  let zoneSvg=null;
  let zoneGroup=null;
  let dimHoleGroup=null;
  let activeZonePath=null;
  let dimHolePath=null;
  let dimRect=null;
  let zoneDrag=null;

  function normaliseZoneOffsets(s){
    const out={};
    Object.keys(V226_ZONE_PATHS).forEach(k=>{
      const v=s?.offsets?.[k]||s?.[k]||{};
      out[k]={dx:Number.isFinite(+v.dx)?+v.dx:0,dy:Number.isFinite(+v.dy)?+v.dy:0}
    });
    return out
  }

  function loadZoneOffsets(){
    let raw=window.__pendingVenueZoneHighlightState||null;
    if(!raw){
      try{raw=JSON.parse(localStorage.getItem(V226_ZONE_STORE)||'null')}catch(e){}
    }
    zoneOffsets=normaliseZoneOffsets(raw);
    window.__pendingVenueZoneHighlightState=null
  }

  function persistZoneOffsets(mark=true){
    const state={version:1,offsets:JSON.parse(JSON.stringify(zoneOffsets))};
    try{localStorage.setItem(V226_ZONE_STORE,JSON.stringify(state))}catch(e){}
    if(mark&&typeof setProjectDirty==='function')setProjectDirty(true);
    return state
  }

  window.captureVenueZoneHighlightState=()=>({
    version:1,
    offsets:JSON.parse(JSON.stringify(zoneOffsets))
  });

  window.applyVenueZoneHighlightState=s=>{
    zoneOffsets=normaliseZoneOffsets(s);
    persistZoneOffsets(false);
    applyActiveZonePlacement();
    syncZoneEditorUI()
  };

  function zoneInfo(frameId){
    const safeId=String(frameId||'').replace(/"/g,'\\"');
    const btn=document.querySelector('.v183-submenu-link[data-parent-page="venue"][data-frame-id="'+safeId+'"]');
    const name=String(btn?.textContent||'').trim();
    return {name:name||'VENUE AREA',key:name.toLowerCase()}
  }

  function zoneOffset(key){
    return zoneOffsets[key]||(zoneOffsets[key]={dx:0,dy:0})
  }

  function zoneBaseTransform(key){
    const q=V226_ZONE_MATRIX,o=zoneOffset(key);
    return 'matrix('+q.a+' '+q.b+' '+q.c+' '+q.d+' '+(q.e+o.dx)+' '+(q.f+o.dy)+')'
  }

  function zoneCameraScale(){
    if(!venue2DActive||!fixed2DOrbit)return 1;
    const baseR=Math.max(.0001,+fixed2DOrbit.radius||1);
    const nowR=Math.max(.0001,+radius||baseR);
    const baseF=Math.max(1,+fixed2DOrbit.fov||45);
    const nowF=Math.max(1,+persp.fov||baseF);
    const baseSpan=baseR*Math.tan(THREE.MathUtils.degToRad(baseF)/2);
    const nowSpan=nowR*Math.tan(THREE.MathUtils.degToRad(nowF)/2);
    return Math.max(.12,Math.min(8,baseSpan/Math.max(.0001,nowSpan)))
  }

  function zoneTransform(key){
    const s=zoneCameraScale();
    const cx=V226_VW*.5,cy=V226_VH*.5;
    // At s=1 this is EXACTLY the old V228 transform, so the current
    // highlight placement does not move. Scroll-zoom only changes scale.
    return 'translate('+cx+' '+cy+') scale('+s+') translate('+-cx+' '+-cy+') '+zoneBaseTransform(key)
  }

  function ensureZoneOverlay(){
    if(zoneSvg&&document.body.contains(zoneSvg))return zoneSvg;

    document.getElementById('v226ZoneOverlay')?.remove();
    document.getElementById('v226ZoneLabel')?.remove();

    const NS='http://www.w3.org/2000/svg';
    zoneSvg=document.createElementNS(NS,'svg');
    zoneSvg.id='v226ZoneOverlay';
    zoneSvg.setAttribute('viewBox','0 0 '+V226_VW+' '+V226_VH);
    zoneSvg.setAttribute('preserveAspectRatio','none');
    zoneSvg.style.cssText=[
      'position:fixed','inset:0','width:100vw','height:100vh',
      'z-index:25','pointer-events:none','display:none','overflow:visible'
    ].join(';');

    const defs=document.createElementNS(NS,'defs');
    const mask=document.createElementNS(NS,'mask');
    mask.id='v226VenueDimMask';
    mask.setAttribute('maskUnits','userSpaceOnUse');
    mask.setAttribute('x','0');mask.setAttribute('y','0');
    mask.setAttribute('width',String(V226_VW));mask.setAttribute('height',String(V226_VH));

    const maskBg=document.createElementNS(NS,'rect');
    maskBg.setAttribute('x','0');maskBg.setAttribute('y','0');
    maskBg.setAttribute('width',String(V226_VW));maskBg.setAttribute('height',String(V226_VH));
    maskBg.setAttribute('fill','#fff');
    mask.appendChild(maskBg);

    dimHoleGroup=document.createElementNS(NS,'g');
    dimHolePath=document.createElementNS(NS,'path');
    dimHolePath.setAttribute('fill','#000');
    dimHoleGroup.appendChild(dimHolePath);
    mask.appendChild(dimHoleGroup);
    defs.appendChild(mask);
    zoneSvg.appendChild(defs);

    // Slightly dim everything except the selected venue area.
    dimRect=document.createElementNS(NS,'rect');
    dimRect.setAttribute('x','0');dimRect.setAttribute('y','0');
    dimRect.setAttribute('width',String(V226_VW));dimRect.setAttribute('height',String(V226_VH));
    dimRect.setAttribute('fill','rgba(0,0,0,.30)');
    dimRect.setAttribute('mask','url(#v226VenueDimMask)');
    dimRect.style.pointerEvents='none';
    zoneSvg.appendChild(dimRect);

    zoneGroup=document.createElementNS(NS,'g');

    activeZonePath=document.createElementNS(NS,'path');
    activeZonePath.setAttribute('fill','rgba(255,255,255,.12)');
    activeZonePath.setAttribute('stroke','rgba(255,255,255,.98)');
    activeZonePath.setAttribute('stroke-width','2');
    activeZonePath.setAttribute('vector-effect','non-scaling-stroke');
    activeZonePath.setAttribute('stroke-linejoin','round');
    activeZonePath.setAttribute('stroke-linecap','round');
    activeZonePath.style.pointerEvents='all';
    activeZonePath.style.cursor='move';

    zoneGroup.appendChild(activeZonePath);
    zoneSvg.appendChild(zoneGroup);
    document.body.appendChild(zoneSvg);

    activeZonePath.addEventListener('pointerdown',e=>{
      if(!isZoneEditMode()||!activeZoneKey)return;
      e.preventDefault();e.stopPropagation();
      const o=zoneOffset(activeZoneKey);
      zoneDrag={
        key:activeZoneKey,
        x:e.clientX,y:e.clientY,
        dx:o.dx,dy:o.dy,
        pointerId:e.pointerId
      };
      try{activeZonePath.setPointerCapture(e.pointerId)}catch(_){}
    });

    return zoneSvg
  }

  function transformZonePoint(x,y,key=activeZoneKey){
    const q=V226_ZONE_MATRIX,o=zoneOffset(key);
    let px=q.a*x+q.c*y+q.e+o.dx;
    let py=q.b*x+q.d*y+q.f+o.dy;
    const s=zoneCameraScale();
    const cx=V226_VW*.5,cy=V226_VH*.5;
    px=cx+(px-cx)*s;
    py=cy+(py-cy)*s;
    return {x:px,y:py}
  }

  function ensureZoneLabel(){
    if(zoneLabelEl&&document.body.contains(zoneLabelEl))return zoneLabelEl;
    zoneLabelEl=document.createElement('div');
    zoneLabelEl.id='v226ZoneLabel';
    zoneLabelEl.style.cssText=[
      'position:fixed','z-index:29','pointer-events:none','display:none',
      'padding:6px 9px','border:1px solid rgba(255,255,255,.94)',
      'border-radius:4px','background:rgba(7,8,10,.76)','color:#fff',
      '-webkit-backdrop-filter:blur(8px)','backdrop-filter:blur(8px)',
      'font:700 8px/1.2 IBM Plex Mono,Consolas,monospace',
      'letter-spacing:.6px','text-transform:uppercase','white-space:nowrap',
      'box-shadow:0 8px 20px rgba(0,0,0,.24)'
    ].join(';');
    document.body.appendChild(zoneLabelEl);
    return zoneLabelEl
  }

  function isZoneEditMode(){
    try{return experienceMode==='edit'||document.body.classList.contains('edit-on')}catch(e){
      return document.body.classList.contains('edit-on')
    }
  }

  function applyActiveZonePlacement(){
    if(!activeZoneKey||!V226_ZONE_PATHS[activeZoneKey])return;
    const tr=zoneTransform(activeZoneKey);
    if(zoneGroup)zoneGroup.setAttribute('transform',tr);
    if(dimHoleGroup)dimHoleGroup.setAttribute('transform',tr);

    const zone=V226_ZONE_PATHS[activeZoneKey];
    const lp=transformZonePoint(zone.label[0],zone.label[1],activeZoneKey);
    if(zoneLabelEl){
      zoneLabelEl.style.left=(lp.x/V226_VW*100)+'vw';
      zoneLabelEl.style.top=(lp.y/V226_VH*100)+'vh'
    }
  }

  function clearZoneHighlight(){
    activeZoneKey='';
    activeZoneFrameId='';
    if(zoneSvg)zoneSvg.style.display='none';
    if(activeZonePath)activeZonePath.removeAttribute('d');
    if(dimHolePath)dimHolePath.removeAttribute('d');
    if(zoneLabelEl)zoneLabelEl.style.display='none';
    syncZoneEditorUI();
    markRenderDirty?.(100)
  }

  function showZoneHighlight(frameId){
    if(venuePreferredMode!=='2d'||!venue2DActive||!frameId){clearZoneHighlight();return}
    const info=zoneInfo(frameId);
    const zone=V226_ZONE_PATHS[info.key];
    if(!zone){clearZoneHighlight();return}

    activeZoneKey=info.key;
    activeZoneFrameId=frameId;

    const svg=ensureZoneOverlay();
    activeZonePath.setAttribute('d',zone.path);
    dimHolePath.setAttribute('d',zone.path);
    applyActiveZonePlacement();
    svg.style.display='block';

    const label=ensureZoneLabel();
    label.textContent=info.name;
    label.style.display='block';
    applyActiveZonePlacement();

    syncZoneEditorUI();
    markRenderDirty?.(160)
  }

  function updateZoneLabelPosition(){applyActiveZonePlacement()}

  window.addEventListener('pointermove',e=>{
    if(!zoneDrag)return;
    e.preventDefault();
    const s=Math.max(.0001,zoneCameraScale());
    const sx=(V226_VW/Math.max(1,innerWidth))/s;
    const sy=(V226_VH/Math.max(1,innerHeight))/s;
    const o=zoneOffset(zoneDrag.key);
    o.dx=zoneDrag.dx+(e.clientX-zoneDrag.x)*sx;
    o.dy=zoneDrag.dy+(e.clientY-zoneDrag.y)*sy;
    applyActiveZonePlacement();
    syncZoneEditorUI();
    markRenderDirty?.(100)
  },{passive:false});

  window.addEventListener('pointerup',e=>{
    if(!zoneDrag)return;
    if(e.pointerId!==zoneDrag.pointerId)return;
    zoneDrag=null;
    persistZoneOffsets(true);
    syncZoneEditorUI()
  },{passive:true});

  loadZoneOffsets();
  // Keep the overlay attached to the venue during scroll zoom without
  // recalibrating or changing its saved position.
  try{
    const v230BaseUpdateCamera=updateCamera;
    updateCamera=function(){
      const result=v230BaseUpdateCamera.apply(this,arguments);
      if(venue2DActive&&activeZoneKey&&zoneSvg&&zoneSvg.style.display!=='none'){
        applyActiveZonePlacement()
      }
      return result
    }
  }catch(e){console.warn('V230 highlight zoom lock unavailable',e)}

  window.addEventListener('resize',()=>{
    if(venue2DActive&&activeZoneKey){
      requestAnimationFrame(applyActiveZonePlacement)
    }
  },{passive:true});


  function stopVenueMorph(){
    venueMorphToken++;
    if(venueMorphTimer){clearTimeout(venueMorphTimer);venueMorphTimer=null}
    if(venue2DPanRaf){cancelAnimationFrame(venue2DPanRaf);venue2DPanRaf=0}
    try{cameraViewTween=null}catch(e){}
  }

  function orbitFrameAsPerspective(frame){
    if(!frame||frame.mode!=='3d'||!Array.isArray(frame.target))return null;
    const t=new THREE.Vector3(...frame.target);
    const r=+frame.radius||25.5;
    const th=Number.isFinite(+frame.theta)?+frame.theta:Math.PI*.25;
    const ph=Number.isFinite(+frame.phi)?+frame.phi:Math.PI*.31;
    const pos=new THREE.Vector3(
      t.x+r*Math.sin(ph)*Math.sin(th),
      t.y+r*Math.cos(ph),
      t.z+r*Math.sin(ph)*Math.cos(th)
    );
    const dir=t.clone().sub(pos).normalize();
    return {
      position:pos.toArray(),
      yaw:Math.atan2(dir.x,dir.z),
      pitch:Math.asin(Math.max(-.999,Math.min(.999,dir.y))),
      fov:+frame.fov||45
    }
  }

  function coreVenueBounds(){
    try{
      venue.updateMatrixWorld(true);

      const candidates=[];
      try{
        for(const o of (editorRoots||[])){
          const n=String(o?.userData?.editName||'').trim().toLowerCase();
          const t=String(o?.userData?.builderType||'').trim().toLowerCase();
          if(
            n==='main floor custom' ||
            n==='main floor' ||
            (t==='platform' && n.includes('main floor'))
          ) candidates.push(o)
        }
      }catch(e){}

      try{
        for(const o of (builderObjects||[])){
          const n=String(o?.userData?.editName||'').trim().toLowerCase();
          if(n==='main floor custom'||n==='main floor')candidates.push(o)
        }
      }catch(e){}

      const unique=[...new Set(candidates)];
      const floor=unique.find(o=>o&&o.visible!==false)||unique[0];

      if(floor){
        floor.updateMatrixWorld(true);
        const b=new THREE.Box3().setFromObject(floor);
        if(!b.isEmpty()){
          const s=b.getSize(new THREE.Vector3());
          b.min.x-=Math.max(.45,s.x*.035);
          b.max.x+=Math.max(.45,s.x*.035);
          b.min.z-=Math.max(.45,s.z*.045);
          b.max.z+=Math.max(.45,s.z*.045);
          return b
        }
      }

      const b=new THREE.Box3();
      let found=false;
      venue.traverse(o=>{
        if(!o||o.visible===false||!o.isMesh||!o.geometry)return;
        if(o.userData?.v202SelectionProxy)return;
        if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
        const gb=o.geometry.boundingBox;
        if(!gb||gb.isEmpty())return;
        const wb=gb.clone().applyMatrix4(o.matrixWorld);
        const cc=wb.getCenter(new THREE.Vector3());
        if(cc.x>11.6)return;
        b.union(wb);found=true
      });
      return found?b:null
    }catch(e){
      return null
    }
  }

  function compute2DPlan(frame){
    const main=venueMainFrame();
    const isMain=!!main&&frame?.id===main.id;

    if(isMain){
      const W=Math.max(1,innerWidth),H=Math.max(1,innerHeight);
      const header=document.getElementById('siteHeader');
      const hr=header?.getBoundingClientRect?.();

      const left=Math.max(W*.275,390);
      const right=W-Math.max(40,W*.078);
      const top=Math.max(H*.075,hr&&hr.height>20?hr.bottom+18:0);
      const bottom=H-Math.max(28,H*.055);

      const safeW=Math.max(240,right-left);
      const safeH=Math.max(240,bottom-top);
      const safeCX=(left+right)/2;
      const safeCY=(top+bottom)/2;

      const box=coreVenueBounds();
      if(box&&!box.isEmpty()){
        const c=box.getCenter(new THREE.Vector3());
        const size=box.getSize(new THREE.Vector3());
        const innerPad=.95;
        const fracW=Math.max(.15,(safeW/W)*innerPad);
        const fracH=Math.max(.15,(safeH/H)*innerPad);
        const aspect=W/H;

        const fullWorldH=Math.max(
          Math.max(.5,size.z)/fracH,
          Math.max(.5,size.x)/(fracW*aspect)
        );
        const fullWorldW=fullWorldH*aspect;
        const zoom=Math.max(.35,Math.min(12,(orthoSize*2)/fullWorldH));

        return {
          isMain:true,
          target:new THREE.Vector3(
            c.x-((safeCX-W/2)/W)*fullWorldW,
            0,
            c.z-((safeCY-H/2)/H)*fullWorldH
          ),
          zoom
        }
      }
    }

    const focus=calculate2DFocus(frame)||{x:target.x,z:target.z};
    return {
      isMain:false,
      target:new THREE.Vector3(focus.x,0,focus.z),
      zoom:3.15
    }
  }

  function overheadPerspectiveForPlan(plan,fov=38,yawOverride=null){
    const visibleWorldH=(orthoSize*2)/Math.max(.01,plan.zoom);
    const rad=THREE.MathUtils.degToRad(fov);
    const height=Math.max(3.5,visibleWorldH/(2*Math.tan(rad/2)));
    return {
      position:[plan.target.x,height,plan.target.z],
      // Keep the current heading. Only the pitch/tilt changes.
      yaw:Number.isFinite(yawOverride)?yawOverride:0,
      pitch:-Math.PI/2,
      fov
    }
  }

  function currentPerspectiveMatched2DPlan(){
    // Preserve apparent scale + centre when entering 2D.
    const lookTarget=target.clone();
    let dist=12;
    try{dist=Math.max(3,persp.position.distanceTo(lookTarget))}catch(e){}
    const fov=Math.max(24,Math.min(80,+persp.fov||45));
    const visibleWorldH=Math.max(2,2*dist*Math.tan(THREE.MathUtils.degToRad(fov)/2));
    const zoom=Math.max(.40,Math.min(12,(orthoSize*2)/visibleWorldH));
    return {
      isMain:true,
      target:new THREE.Vector3(lookTarget.x,0,lookTarget.z),
      zoom
    }
  }

  function captureCurrentViewPivot(){
    const pivot=target.clone();
    const pos=persp.position.clone();
    const offset=pos.clone().sub(pivot);
    const dist=Math.max(3,offset.length());

    // Keep the movement subtle: only a tiny anticlockwise heading correction.
    const yawNow=Math.atan2(offset.x,offset.z);
    const yawTop=yawNow-THREE.MathUtils.degToRad(3.2);

    return {pivot,pos,dist,yawNow,yawTop}
  }

  function pivotTopPose(pivotData,fov){
    const plan=currentPerspectiveMatched2DPlan();
    const visibleWorldH=(orthoSize*2)/Math.max(.01,plan.zoom);
    const rad=THREE.MathUtils.degToRad(fov);
    const height=Math.max(3.5,visibleWorldH/(2*Math.tan(rad/2)));

    // Directly above the SAME invisible pivot point.
    const pos=new THREE.Vector3(
      pivotData.pivot.x,
      pivotData.pivot.y+height,
      pivotData.pivot.z
    );

    return {
      plan,
      pose:{
        position:pos.toArray(),
        yaw:pivotData.yawTop,
        pitch:-Math.PI/2,
        fov
      }
    }
  }

  function adoptCurrentPerspectiveCamera(){
    // Preserve the exact currently-rendered perspective pose before a tween.
    mode2d=false;
    cinematicPerspective=true;
    camera=persp;
    transform.camera=camera;
    perspectivePosition.copy(persp.position);
    const d=new THREE.Vector3();
    persp.getWorldDirection(d);
    perspectiveYaw=Math.atan2(d.x,d.z);
    perspectivePitch=Math.asin(Math.max(-.999,Math.min(.999,d.y)));
    syncViewModeButtons();
    updateTransformAxes()
  }

  function startVenue2DPan(plan,duration=PAN_2D_DURATION){
    if(!plan||!plan.target)return false;

    // Stay in genuine orthographic 2D for the entire page-to-page move.
    if(!mode2d){
      mode2d=true;
      cinematicPerspective=false;
      camera=ortho;
      transform.camera=camera;
      syncViewModeButtons();
      updateTransformAxes()
    }

    if(venue2DPanRaf){
      cancelAnimationFrame(venue2DPanRaf);
      venue2DPanRaf=0
    }

    const token=venueMorphToken;
    const fromTarget=target.clone();
    const toTarget=plan.target.clone();
    const fromZoom=Math.max(.01,+orthoZoom||1);
    const toZoom=Math.max(.01,+plan.zoom||1);
    const start=(window.performance&&performance.now)?performance.now():Date.now();

    const tick=now=>{
      if(token!==venueMorphToken){
        venue2DPanRaf=0;
        return
      }

      const q=Math.max(0,Math.min(1,(now-start)/duration));
      const e=easeCinematic(q);

      target.lerpVectors(fromTarget,toTarget,e);

      // Interpolate zoom logarithmically so zoom-in and zoom-out feel equally
      // smooth rather than accelerating differently in each direction.
      orthoZoom=fromZoom*Math.pow(toZoom/fromZoom,e);

      updateCamera();

      if(q<1){
        venue2DPanRaf=requestAnimationFrame(tick)
      }else{
        venue2DPanRaf=0;
        target.copy(toTarget);
        orthoZoom=toZoom;
        updateCamera();
        syncButtons();
        if(typeof syncCameraFrameUI==='function')syncCameraFrameUI();
        if(typeof syncPerformanceDock==='function')syncPerformanceDock();
        markRenderDirty(260)
      }
    };

    markRenderDirty(duration+180);
    venue2DPanRaf=requestAnimationFrame(tick);
    return true
  }

  function finishAs2D(plan,token){
    if(token!==venueMorphToken)return;
    cameraViewTween=null;
    mode2d=true;
    cinematicPerspective=false;
    camera=ortho;
    transform.camera=camera;
    target.copy(plan.target);
    orthoZoom=plan.zoom;
    fixed2DPlan={target:plan.target.clone(),zoom:plan.zoom};
    syncViewModeButtons();
    updateTransformAxes();
    updateCamera();
    syncButtons();
    updateZoneLabelPosition();
    if(typeof syncCameraFrameUI==='function')syncCameraFrameUI();
    if(typeof syncPerformanceDock==='function')syncPerformanceDock();
    markRenderDirty(320)
  }

  function finishAsCaptured3D(pose,token){
    if(token!==venueMorphToken||!pose)return;
    cameraViewTween=null;
    mode2d=false;
    cinematicPerspective=true;
    camera=persp;
    transform.camera=camera;
    perspectivePosition.fromArray(pose.position);
    perspectiveYaw=pose.yaw;
    perspectivePitch=pose.pitch;
    persp.fov=pose.fov;
    persp.updateProjectionMatrix();
    syncViewModeButtons();
    updateTransformAxes();
    updateCamera();
    syncButtons();
    if(typeof syncCameraFrameUI==='function')syncCameraFrameUI();
    if(typeof syncPerformanceDock==='function')syncPerformanceDock();
    markRenderDirty(260)
  }

  function finishAs3D(frame,token){
    if(token!==venueMorphToken)return;
    cameraViewTween=null;
    mode2d=false;
    cinematicPerspective=false;
    camera=persp;
    transform.camera=camera;
    if(Array.isArray(frame.target))target.fromArray(frame.target);
    radius=+frame.radius||25.5;
    theta=Number.isFinite(+frame.theta)?+frame.theta:Math.PI*.25;
    phi=Number.isFinite(+frame.phi)?+frame.phi:Math.PI*.31;
    persp.fov=+frame.fov||45;
    persp.updateProjectionMatrix();
    syncViewModeButtons();
    updateTransformAxes();
    updateCamera();
    syncButtons();
    if(typeof syncCameraFrameUI==='function')syncCameraFrameUI();
    if(typeof syncPerformanceDock==='function')syncPerformanceDock();
    markRenderDirty(320)
  }

  function captureOrbitFor2D(){
    return {
      target:target.clone(),
      radius:+radius||25.5,
      theta:+theta||0,
      phi:+phi||Math.PI*.31,
      fov:+persp.fov||45
    }
  }

  function orbitTopDestination(start){
    // V225 · keep V224's matched end frame, add 10% zoom-out + 50px extra down, but during the same single orbit
    // nudge the whole pseudo-2D composition 55 px right and 125 px down
    // without changing the final size or camera angle.

    const finalRadius=start.radius*.91*1.10;
    const finalTheta=0;
    const finalPhi=.022;
    const finalFov=start.fov;

    const finalTarget=start.target.clone();

    // Convert the requested screen-space offset into a world-space truck/pedestal
    // at the final view. This keeps the scale and angle intact.
    const viewH=2*finalRadius*Math.tan(THREE.MathUtils.degToRad(finalFov)/2);
    const viewW=viewH*(Math.max(1,innerWidth)/Math.max(1,innerHeight));
    const dxWorld=viewW*(55/Math.max(1,innerWidth));
    const dyWorld=viewH*(175/Math.max(1,innerHeight));

    const offset=new THREE.Vector3(
      finalRadius*Math.sin(finalPhi)*Math.sin(finalTheta),
      finalRadius*Math.cos(finalPhi),
      finalRadius*Math.sin(finalPhi)*Math.cos(finalTheta)
    );

    const camPos=finalTarget.clone().add(offset);
    const zAxis=camPos.clone().sub(finalTarget).normalize(); // camera backward
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),zAxis).normalize();
    const upVec=new THREE.Vector3().crossVectors(zAxis,right).normalize();

    // Move the CAMERA/TARGET rig so the venue appears right/down on screen.
    finalTarget
      .addScaledVector(right,-dxWorld)
      .addScaledVector(upVec,dyWorld);

    return {
      target:finalTarget,
      radius:finalRadius,
      theta:finalTheta,
      phi:finalPhi,
      fov:finalFov
    }
  }

  function canonicalVenue2DOrbit(){
    const main=venueMainFrame();
    if(!main || !Array.isArray(main.target))return null;

    // IMPORTANT: derive the 2D landing from the saved VENUE/HOME frame,
    // never from the room/submenu camera currently being viewed.
    const homeStart={
      target:new THREE.Vector3(
        +main.target[0]||0,
        Number.isFinite(+main.target[1])?+main.target[1]:.35,
        +main.target[2]||0
      ),
      radius:Math.max(4.2,Math.min(45,+main.radius||25.5)),
      theta:Number.isFinite(+main.theta)?+main.theta:Math.PI*.25,
      phi:Math.max(.12,Math.min(1.42,Number.isFinite(+main.phi)?+main.phi:Math.PI*.31)),
      fov:Math.max(30,Math.min(80,+main.fov||45))
    };

    const d=orbitTopDestination(homeStart);
    return {
      target:d.target.clone(),
      radius:d.radius,
      theta:d.theta,
      phi:d.phi,
      fov:d.fov
    }
  }


  function handoffOrbitTo2D(dest,token){
    if(token!==venueMorphToken)return;
    cameraViewTween=null;
    mode2d=true;
    cinematicPerspective=false;
    camera=ortho;
    transform.camera=camera;
    target.copy(dest.target);
    orthoZoom=dest.orthoZoom;
    fixed2DPlan={target:dest.target.clone(),zoom:dest.orthoZoom};
    syncViewModeButtons();
    updateTransformAxes();
    updateCamera();
    syncButtons();
    if(typeof syncCameraFrameUI==='function')syncCameraFrameUI();
    if(typeof syncPerformanceDock==='function')syncPerformanceDock();
    markRenderDirty(260)
  }

  function handoff2DToOrbit(state,token){
    if(token!==venueMorphToken)return;
    cameraViewTween=null;
    mode2d=false;
    cinematicPerspective=false;
    camera=persp;
    transform.camera=camera;
    target.copy(state.target);
    radius=state.radius;
    theta=state.theta;
    phi=state.phi;
    persp.fov=state.fov;
    persp.updateProjectionMatrix();
    syncViewModeButtons();
    updateTransformAxes();
    updateCamera();
    syncButtons();
    markRenderDirty(260)
  }

  function apply3D(animate=true){
    const main=venueMainFrame();
    if(!venueFrameId&&main)venueFrameId=main.id;
    const frame=frameById(venueFrameId)||main;
    if(!frame)return false;

    try{
      stopVenueMorph();
      clearZoneHighlight();
      const token=venueMorphToken;

      const selectedVenueFrame=frameById(venueFrameId);
      const selectedIsVenueSubmenu=
        !!selectedVenueFrame &&
        !!main &&
        selectedVenueFrame.id!==main.id;

      if(selectedIsVenueSubmenu){
        // V233 · When a highlighted Venue Area is being viewed in 2D,
        // pressing 3D goes to THAT page's saved 3D frame rather than
        // reversing back to the camera that originally entered 2D.
        venue2DActive=false;
        last3DOrbitBefore2D=null;

        mode2d=false;
        camera=persp;
        transform.camera=camera;
        syncViewModeButtons();
        updateTransformAxes();

        const loaded=originalLoadCameraFrame(selectedVenueFrame.id,animate);
        syncButtons();
        return loaded!==false
      }

      if(last3DOrbitBefore2D){
        const original={
          target:last3DOrbitBefore2D.target.clone(),
          radius:last3DOrbitBefore2D.radius,
          theta:last3DOrbitBefore2D.theta,
          phi:last3DOrbitBefore2D.phi,
          fov:last3DOrbitBefore2D.fov
        };

        venue2DActive=false;

        if(!animate){
          mode2d=false;
          cinematicPerspective=false;
          camera=persp;
          transform.camera=camera;
          target.copy(original.target);
          radius=original.radius;
          theta=original.theta;
          phi=original.phi;
          persp.fov=original.fov;
          persp.updateProjectionMatrix();
          syncViewModeButtons();
          updateTransformAxes();
          updateCamera();
          syncButtons();
          last3DOrbitBefore2D=null;
          return true
        }

        // Reverse the exact same orbit path. No camera switch.
        mode2d=false;
        cinematicPerspective=false;
        camera=persp;
        transform.camera=camera;
        syncViewModeButtons();
        updateTransformAxes();

        startCamera3DViewTween({
          target:original.target.toArray(),
          radius:original.radius,
          theta:original.theta,
          phi:original.phi,
          fov:original.fov
        },MORPH_DURATION);

        venueMorphTimer=setTimeout(()=>{
          if(token!==venueMorphToken)return;
          target.copy(original.target);
          radius=original.radius;
          theta=original.theta;
          phi=original.phi;
          persp.fov=original.fov;
          persp.updateProjectionMatrix();
          updateCamera();
          last3DOrbitBefore2D=null;
          syncButtons()
        },MORPH_DURATION+12);

        return true
      }

      originalLoadCameraFrame(venueFrameId,animate);
      syncButtons();
      return true
    }catch(e){
      console.warn('Venue V221 2D->3D single-orbit transition failed',e);
      return false
    }
  }

  function apply2D(frameId=venueFrameId,animate=true){
    const main=venueMainFrame();
    let frame=frameById(frameId);
    if(!frame)frame=main;
    if(!frame)return false;

    try{
      venueFrameId=frame.id||frameId||'';
      try{activeCameraFrameId=frame.id}catch(e){}

      // Once in the 2D presentation state, the floor plan NEVER moves when
      // selecting Venue Areas. Only the white overlay changes.
      if(venue2DActive){
        if(fixed2DOrbit){
          mode2d=false;
          cinematicPerspective=false;
          camera=persp;
          transform.camera=camera;
          target.copy(fixed2DOrbit.target);
          radius=fixed2DOrbit.radius;
          theta=fixed2DOrbit.theta;
          phi=fixed2DOrbit.phi;
          persp.fov=fixed2DOrbit.fov;
          persp.updateProjectionMatrix();
          updateCamera()
        }
        if(main&&frame.id===main.id)clearZoneHighlight();
        else showZoneHighlight(frame.id);
        syncButtons();
        return true
      }

      stopVenueMorph();
      clearZoneHighlight();
      const token=venueMorphToken;

      // Start exactly from the saved HOME 3D orbit.
      if(cinematicPerspective){
        originalLoadCameraFrame(venueFrameId,false)
      }

      mode2d=false;
      cinematicPerspective=false;
      camera=persp;
      transform.camera=camera;
      syncViewModeButtons();
      updateTransformAxes();

      const start=captureOrbitFor2D();

      // V232: the 2D end pose is ALWAYS the original VENUE/HOME-derived
      // landing. A room/submenu 3D camera is allowed to be the START of
      // the transition, but it can never redefine the 2D zoom or position.
      if(!fixed2DOrbit){
        fixed2DOrbit=canonicalVenue2DOrbit()
      }

      const home2D=fixed2DOrbit || canonicalVenue2DOrbit() || orbitTopDestination(start);
      const dest={
        target:home2D.target.clone(),
        radius:home2D.radius,
        theta:home2D.theta,
        phi:home2D.phi,
        fov:home2D.fov
      };

      last3DOrbitBefore2D={
        target:start.target.clone(),
        radius:start.radius,
        theta:start.theta,
        phi:start.phi,
        fov:start.fov
      };

      if(!animate){
        target.copy(dest.target);
        radius=dest.radius;
        theta=dest.theta;
        phi=dest.phi;
        persp.fov=dest.fov;
        persp.updateProjectionMatrix();
        venue2DActive=true;
        updateCamera();
        syncButtons();
        if(!main||frame.id!==main.id)showZoneHighlight(frame.id);
        return true
      }

      // ONE uninterrupted movement:
      // tilt + straighten + modest framing adjustment all share the SAME
      // easing curve. There is no second camera/frame change afterwards.
      startCamera3DViewTween({
        target:dest.target.toArray(),
        radius:dest.radius,
        theta:dest.theta,
        phi:dest.phi,
        fov:dest.fov
      },MORPH_DURATION);

      venueMorphTimer=setTimeout(()=>{
        if(token!==venueMorphToken)return;

        // Do NOT switch cameras here. The perspective/orbit camera is already
        // the final 2D-looking view, so there is nothing left to snap.
        target.copy(dest.target);
        radius=dest.radius;
        theta=dest.theta;
        phi=dest.phi;
        persp.fov=dest.fov;
        persp.updateProjectionMatrix();
        venue2DActive=true;
        updateCamera();
        syncButtons();

        if(!main||frame.id!==main.id){
          showZoneHighlight(frame.id)
        }
      },MORPH_DURATION+12);

      syncButtons();
      return true
    }catch(e){
      console.warn('Venue V221 3D->2D single-orbit transition failed',e);
      return false
    }
  }

  const originalLoadCameraFrame=loadCameraFrame;
  loadCameraFrame=function(id,animate=true){
    const venue2DRequest=
      venuePreferredMode==='2d' &&
      document.body.classList.contains('performance-mode') &&
      document.body.classList.contains('v190-venue-submenu-active') &&
      !!venueFrameId &&
      id===venueFrameId;

    if(venue2DRequest)return apply2D(id,true);

    // Any ordinary frame load is a 3D camera action. Never leave a 2D
    // highlight floating over that 3D view.
    if(venue2DActive){
      venue2DActive=false;
      clearZoneHighlight()
    }
    return originalLoadCameraFrame(id,animate)
  };

  b3?.addEventListener('click',()=>{
    // venueFrameId deliberately stays on the selected Venue Areas page.
    // apply3D uses it to choose that page's own saved 3D frame.
    venuePreferredMode='3d';
    venue2DActive=false;
    clearZoneHighlight();
    apply3D(true)
  });

  b2?.addEventListener('click',()=>{
    venuePreferredMode='2d';
    apply2D(venueFrameId,true)
  });

  // Capture before the normal navigation code runs.
  document.addEventListener('click',e=>{
    const venueSub=e.target?.closest?.('.v183-submenu-link[data-parent-page="venue"]');
    if(venueSub){
      showForVenueSubmenu(venueSub);
      return
    }

    const venueMain=e.target?.closest?.('.site-nav-link[data-site-target="venue"]');
    if(venueMain){
      showForVenueMain();
      return
    }

    // Clicking THE MOTHERSHIP is HOME. Keep 2D/3D available there.
    if(e.target?.closest?.('#siteBrand')){
      showForHome();
      return
    }

    if(e.target?.closest?.('.v183-submenu-link') ||
       e.target?.closest?.('.site-nav-link') ||
       e.target?.closest?.('[data-site-jump]')){
      hideVenueToggle()
    }
  },true);

  if(typeof syncViewModeButtons==='function'){
    const originalSyncViewModeButtons=syncViewModeButtons;
    syncViewModeButtons=function(){
      const r=originalSyncViewModeButtons.apply(this,arguments);
      if(document.body.classList.contains('v190-venue-submenu-active'))syncButtons();
      return r
    }
  }

  function frameIdForZoneKey(key){
    const buttons=[...document.querySelectorAll('.v183-submenu-link[data-parent-page="venue"][data-frame-id]')];
    const hit=buttons.find(b=>String(b.textContent||'').trim().toLowerCase()===key);
    return hit?.dataset?.frameId||''
  }

  function applyFixed2DOrbitForEditor(){
    if(!fixed2DOrbit){
      fixed2DOrbit=canonicalVenue2DOrbit()
    }
    if(!fixed2DOrbit)return;

    venue2DActive=true;
    venuePreferredMode='2d';
    mode2d=false;cinematicPerspective=false;camera=persp;transform.camera=camera;
    target.copy(fixed2DOrbit.target);
    radius=fixed2DOrbit.radius;theta=fixed2DOrbit.theta;phi=fixed2DOrbit.phi;
    persp.fov=fixed2DOrbit.fov;persp.updateProjectionMatrix();
    syncViewModeButtons();updateTransformAxes();updateCamera();syncButtons()
  }

  function previewZoneForEditor(key){
    if(!V226_ZONE_PATHS[key])return;
    applyFixed2DOrbitForEditor();
    const frameId=frameIdForZoneKey(key);
    if(frameId){
      venueFrameId=frameId;
      showZoneHighlight(frameId)
    }
  }

  function syncZoneEditorUI(){
    const sel=document.getElementById('v226ZoneSelect');
    const xi=document.getElementById('v226ZoneX');
    const yi=document.getElementById('v226ZoneY');
    const st=document.getElementById('v226ZoneStatus');
    if(!sel)return;

    const key=(activeZoneKey&&V226_ZONE_PATHS[activeZoneKey])
      ? activeZoneKey
      : (sel.value||Object.keys(V226_ZONE_PATHS)[0]);
    if(activeZoneKey&&V226_ZONE_PATHS[activeZoneKey]&&sel.value!==activeZoneKey){
      sel.value=activeZoneKey
    }
    const o=zoneOffset(key);
    if(xi&&document.activeElement!==xi)xi.value=Math.round(o.dx*10)/10;
    if(yi&&document.activeElement!==yi)yi.value=Math.round(o.dy*10)/10;
    if(st){
      st.textContent=(activeZoneKey
        ? activeZoneKey.toUpperCase()+' · DRAG THE WHITE AREA DIRECTLY, OR USE X / Y + NUDGE'
        : 'SELECT AN AREA → SHOW / EDIT AREA · OFFSETS SAVE WITH THE PROJECT')
    }
  }

  function setZoneOffsetFromInputs(){
    const sel=document.getElementById('v226ZoneSelect');
    if(!sel)return;
    const key=sel.value;
    const o=zoneOffset(key);
    const x=+document.getElementById('v226ZoneX')?.value;
    const y=+document.getElementById('v226ZoneY')?.value;
    if(Number.isFinite(x))o.dx=x;
    if(Number.isFinite(y))o.dy=y;
    if(activeZoneKey===key)applyActiveZonePlacement();
    persistZoneOffsets(true);
    syncZoneEditorUI()
  }

  function nudgeZone(dx,dy){
    const sel=document.getElementById('v226ZoneSelect');
    if(!sel)return;
    const key=sel.value;
    const o=zoneOffset(key);
    o.dx+=dx;o.dy+=dy;
    if(activeZoneKey!==key)previewZoneForEditor(key);
    else applyActiveZonePlacement();
    persistZoneOffsets(true);
    syncZoneEditorUI()
  }

  function buildZoneHighlightEditor(){
    const editor=document.getElementById('editor');
    if(!editor||document.getElementById('v226ZoneHighlightEditor'))return;

    const box=document.createElement('div');
    box.className='builder-box';
    box.id='v226ZoneHighlightEditor';
    box.innerHTML=`
      <div class="builder-title"><span>2D AREA HIGHLIGHTS</span><span>DRAG · NUDGE · SAVE</span></div>
      <div class="builder-note">
        Position the white Venue Areas highlights precisely. In Edit Mode, use
        <b>SHOW / EDIT AREA</b>, then drag the white outline directly over the floor plan
        or use the X / Y and nudge controls.
      </div>
      <div class="perf-page-fields">
        <label class="perf-page-field full">
          <span>AREA</span>
          <select id="v226ZoneSelect">
            ${Object.keys(V226_ZONE_PATHS).map(k=>`<option value="${k}">${k.toUpperCase()}</option>`).join('')}
          </select>
        </label>
        <label class="perf-page-field"><span>X OFFSET</span><input id="v226ZoneX" type="number" step="1" value="0"></label>
        <label class="perf-page-field"><span>Y OFFSET</span><input id="v226ZoneY" type="number" step="1" value="0"></label>
      </div>
      <div class="builder-grid two">
        <button class="edit-btn small active" id="v226ZonePreview" type="button">SHOW / EDIT AREA</button>
        <button class="edit-btn small" id="v226ZoneApplyXY" type="button">APPLY X / Y</button>
      </div>
      <div class="v226-nudge-grid">
        <button class="edit-btn small" data-v226-nudge="-10,0">← 10</button>
        <button class="edit-btn small" data-v226-nudge="0,-10">↑ 10</button>
        <button class="edit-btn small" data-v226-nudge="10,0">10 →</button>
        <button class="edit-btn small" data-v226-nudge="-1,0">← 1</button>
        <button class="edit-btn small" data-v226-nudge="0,10">↓ 10</button>
        <button class="edit-btn small" data-v226-nudge="1,0">1 →</button>
      </div>
      <div class="builder-grid two" style="margin-top:8px">
        <button class="edit-btn small" id="v226ZoneReset" type="button">RESET AREA</button>
        <button class="edit-btn small danger" id="v226ZoneResetAll" type="button">RESET ALL</button>
      </div>
      <div class="v226-zone-status" id="v226ZoneStatus">SELECT AN AREA → SHOW / EDIT AREA</div>
    `;

    const jump=document.getElementById('v172EditorJumps');
    if(jump&&jump.parentNode)jump.parentNode.insertBefore(box,jump.nextSibling);
    else editor.insertBefore(box,editor.firstChild);

    const sel=document.getElementById('v226ZoneSelect');
    sel?.addEventListener('change',()=>{
      const key=sel.value;
      previewZoneForEditor(key);
      syncZoneEditorUI();
    });
    document.getElementById('v226ZonePreview')?.addEventListener('click',()=>previewZoneForEditor(sel.value));
    document.getElementById('v226ZoneApplyXY')?.addEventListener('click',setZoneOffsetFromInputs);
    document.getElementById('v226ZoneX')?.addEventListener('change',setZoneOffsetFromInputs);
    document.getElementById('v226ZoneY')?.addEventListener('change',setZoneOffsetFromInputs);

    box.querySelectorAll('[data-v226-nudge]').forEach(btn=>btn.addEventListener('click',()=>{
      const [dx,dy]=btn.dataset.v226Nudge.split(',').map(Number);
      nudgeZone(dx,dy)
    }));

    document.getElementById('v226ZoneReset')?.addEventListener('click',()=>{
      const key=sel.value;zoneOffsets[key]={dx:0,dy:0};
      if(activeZoneKey!==key)previewZoneForEditor(key);else applyActiveZonePlacement();
      persistZoneOffsets(true);syncZoneEditorUI()
    });

    document.getElementById('v226ZoneResetAll')?.addEventListener('click',()=>{
      zoneOffsets=normaliseZoneOffsets(null);
      if(activeZoneKey)applyActiveZonePlacement();
      persistZoneOffsets(true);syncZoneEditorUI()
    });

    syncZoneEditorUI()
  }

  // If Edit is entered while the visitor is already looking at the 2D plan,
  // keep that exact view so the highlight can be positioned against it.
  document.getElementById('modeEditBtn')?.addEventListener('click',()=>{
    const keep2D=venue2DActive&&!!fixed2DOrbit;
    requestAnimationFrame(()=>{
      if(keep2D){
        applyFixed2DOrbitForEditor();
        if(activeZoneFrameId)showZoneHighlight(activeZoneFrameId)
      }
      buildZoneHighlightEditor();
  requestAnimationFrame(()=>{
    if(!fixed2DOrbit){
      try{fixed2DOrbit=canonicalVenue2DOrbit()}catch(e){}
    }
  });


      syncZoneEditorUI()
    })
  });

  document.getElementById('modePerformanceBtn')?.addEventListener('click',()=>{
    document.body.classList.remove('v226-zone-editing');

    // The core Performance Mode can load a saved 3D camera frame. Reconcile
    // the highlight only after that has completed.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(venuePreferredMode==='2d' && venue2DActive && fixed2DOrbit){
        applyFixed2DOrbitForEditor();
        if(activeZoneFrameId){
          showZoneHighlight(activeZoneFrameId)
        }else{
          clearZoneHighlight()
        }
      }else{
        venue2DActive=false;
        clearZoneHighlight()
      }
    }))
  });

  buildZoneHighlightEditor();

  function v238ForcePerformanceEditLook(){
    try{
      if(!document.body.classList.contains('performance-mode'))return;

      // Match the neutral Edit Mode renderer/look instead of switching to the
      // brighter Performance quality look.
      if(typeof applyMothershipNightLook==='function')applyMothershipNightLook(false);
      if(typeof applyPerformanceProfile==='function'){
        const editProfile=performancePreviewSnapshot?.profile||'fast';
        applyPerformanceProfile(editProfile,false)
      }

      // Performance groups, haze, bar lights, fixtures and LED strips OFF.
      if(typeof allPerformanceLightsOff==='function')allPerformanceLightsOff();
      if(typeof applyBarLightsEnabled==='function')applyBarLightsEnabled(false);

      // Use the same complete light-off treatment as Edit Mode. This catches
      // room/venue lights and any miscellaneous lights not owned by the
      // performance group controller, plus LED strips and fixture glows.
      if(typeof applyEditLightsOff==='function')applyEditLightsOff(true);

      // Keep haze/fog at the same neutral level as the Edit lights-off view.
      if(typeof performanceHazeEnabled!=='undefined')performanceHazeEnabled=false;
      if(scene?.fog)scene.fog.density=viewTheme==='light'?.0025:.004;

      if(typeof syncPerformanceDock==='function')syncPerformanceDock();
      markRenderDirty?.(450)
    }catch(e){
      console.warn('V237 edit-like Performance lighting failed',e)
    }
  }

  try{
    const v238BaseSetExperienceMode=setExperienceMode;
    setExperienceMode=function(mode){
      // If Edit Mode had its lights restored/on before entering Performance,
      // remember that so returning to Edit restores that exact state.
      const restoreEditLightsOn=
        mode==='edit' &&
        !!performancePreviewSnapshot &&
        performancePreviewSnapshot.editWasOff===false;

      const result=v238BaseSetExperienceMode.apply(this,arguments);

      if(mode==='performance'){
        // Run after the core Performance setup and again after delayed
        // page/layout defaults, so nothing can quietly switch lights back on.
        requestAnimationFrame(()=>requestAnimationFrame(v238ForcePerformanceEditLook));
        setTimeout(v238ForcePerformanceEditLook,120);
        setTimeout(v238ForcePerformanceEditLook,360)
      }else if(mode==='edit' && restoreEditLightsOn){
        // applyEditLightsOff(true) is used while Performance is active.
        // If the user's Edit view was originally lit, restore it cleanly.
        requestAnimationFrame(()=>{
          try{
            if(typeof applyEditLightsOff==='function'&&editLightsOff){
              applyEditLightsOff(false)
            }
          }catch(e){}
        })
      }
      return result
    }
  }catch(e){
    console.warn('V237 experience-mode lighting hook unavailable',e)
  }

  document.getElementById('modePerformanceBtn')?.addEventListener('click',()=>{
    requestAnimationFrame(()=>requestAnimationFrame(v238ForcePerformanceEditLook));
    setTimeout(v238ForcePerformanceEditLook,120);
    setTimeout(v238ForcePerformanceEditLook,360)
  });

  // Public helpers for the startup runtime below.
  window.__mshipV210HomeView=showForHome;
  window.__mshipV210VenueMainView=showForVenueMain;
  window.__mshipV210ApplyVenue2D=apply2D;

  syncButtons();
})();
;
(function(){
  const $=id=>document.getElementById(id);
  const STORE='mothershipPageDetailsV207';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const MAIN_PREFIX='main::';
  let state={version:2,sourceBuild:272,savedAt:'',pages:{}};
  const DETAIL_PAGE_IDS=['submenu_mtzy00w8_xj0c','submenu_mtzyx7bz_wcw6','submenu_mtzyxmsx_n043','submenu_mtzyya1i_zn2r'];
  const DETAIL_PAGE_SET=new Set(DETAIL_PAGE_IDS);
  let activePageId='';
  let editorPageId='';
  let activeBlockId='';
  let liveSelection={kind:'page',part:'heading',blockId:''};
  let dragBlockId='';
  let liveOpen=false;
  let pageUndoHistory=[];
  let pageRedoHistory=[];
  let pageHistoryRestoring=false;
  const PAGE_HISTORY_LIMIT=80;

  function esc(s){
    return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  }

  function pageName(parent){
    try{
      return pageTabState?.pages?.[parent]?.name ||
             (typeof v170PageName==='function'?v170PageName(parent):parent)
    }catch(e){return parent}
  }

  function allContentTargets(){
    const out=[];
    try{
      const order=pageTabState?.order||[];
      order.forEach(parent=>{
        const pg=pageTabState?.pages?.[parent];
        if(!pg || pg.enabled===false)return;
        const label=pageName(parent);
        out.push({
          id:MAIN_PREFIX+parent,
          parent,
          parentLabel:label,
          title:label,
          frameId:pg.frameId||'',
          isMain:true
        });
        const list=pageTabState?.submenus?.[parent]||[];
        list.forEach(s=>out.push({
          id:s.id,
          parent,
          parentLabel:label,
          title:s.title||'SUBMENU',
          frameId:s.frameId||'',
          eventType:s.eventType||'',
          isMain:false
        }));
      })
    }catch(e){}
    const allowed=new Set([
      'submenu_mtzy00w8_xj0c', // Green Room
      'submenu_mtzyx7bz_wcw6', // Audio
      'submenu_mtzyxmsx_n043', // Lighting
      'submenu_mtzyya1i_zn2r'  // Visuals
    ]);
    return out.filter(item=>allowed.has(item.id))
  }

  function contentMeta(id){
    return allContentTargets().find(s=>s.id===id)||null
  }

  function freshPage(meta){
    return {
      id:meta?.id||'',
      parent:meta?.parent||'',
      title:meta?.title||'PAGE DETAILS',
      intro:'',
      columns:2,
      headingSize:62,
      headingColor:'#f1f1ef',
      headingBold:true,
      headingUnderline:false,
      headingPosition:'left',
      headingCols:8,
      introEnabled:false,
      introUnderline:false,
      introCols:4,
      introSize:17,
      introColor:'#b8b8b5',
      glassWidth:98,
      glassCentered:false,
      glassOffsetX:0,
      lockPreviewWidth:true,
      previewCanvasWidth:1280,
      panelTopVh:100,
      elementGap:28,
      audioHeroTitleSize:188,
      audioHeroIntroSize:29,
      audioHeroIntroWidth:720,
      audioHeroKickerSize:14,
      audioHeroSmallSize:14,
      audioHeroButtonScale:100,
      audioHeroButtonTextSize:14,
      audioHeroBottomSpace:70,
      audioHeroKickerGap:20,
      audioHeroTitleGap:18,
      audioHeroColumnGap:64,
      audioHeroSideTop:56,
      audioHeroButtonPadY:16,
      audioHeroButtonPadX:22,
      audioHeroKicker:'03 · PRODUCTION GUIDE',
      audioHeroButtonText:'DOWNLOAD PDF',
      audioHeroSideLabels:['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING'],
      enabled:false,
      blocks:[]
    }
  }

  function freshBlock(type='text'){
    return {
      id:'detail_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),
      type,
      zone:'content',
      span:type==='image'?2:1,
      headerSpan:4,
      gridStart:0,
      gridSpan:type==='image'?6:(type==='divider'?12:4),
      gridRow:0,
      blockHeight:0,
      dividerLength:100,
      dividerThickness:1,
      dividerColor:'#4b4b4b',
      dividerAlign:'left',
      ruledRows:false,
      rowsBesideImage:false,
      stackBelowPrevious:false,
      stackParentId:'',
      title:'',
      body:'',
      titleSize:28,
      bodySize:15,
      color:'#e2e2df',
      bold:true,
      titleUnderline:false,
      bodyUnderline:false,
      listArrows:true,
      topLine:true,
      numberVisible:true,
      numberText:'',
      numberSize:7,
      numberColor:'#4c4c4b',
      rowPadding:10,
      rowMinHeight:0,
      listGap:0,
      listLineHeight:1.2,
      titleContentGap:4,
      blockGap:0,
      subsections:[],
      subheadingSize:9,
      subheadingColor:'#838380',
      subheadingTextGap:3,
      subsectionGap:6,
      subsectionLayout:'stack',
      boxEnabled:false,
      boxRadius:32,
      boxPadding:24,
      boxBorderWidth:1,
      boxBorderColor:'#3d3d3d',
      boxBorderOpacity:100,
      boxBackground:'#0b0b0c',
      boxOpacity:60,
      cardWidth:100,
      cardRowSpan:1,
      cardAlign:'left',
      cardMode:'grid',
      groupMembers:[],
      groupExtraWidth:0,
      groupExtraHeight:0,
      areaLeft:0,
      cardOffsetX:0,
      areaTop:0,
      areaWidth:100,
      areaHeight:320,
      areaAutoFitHeight:false,
      image:'',
      ratio:'landscape'
    }
  }

  function normaliseBlock(b){
    b=b&&typeof b==='object'?b:{};
    const type=['text','image','mixed','divider','sectioncard'].includes(b.type)?b.type:'text';
    const zone=b.zone==='header'?'header':'content';
    return {
      ...freshBlock(type),...b,
      type,
      zone,
      span:Math.max(1,Math.min(4,+b.span||1)),
      headerSpan:Math.max(2,Math.min(12,+b.headerSpan||4)),
      gridStart:Math.max(0,Math.min(12,+b.gridStart||0)),
      gridSpan:Math.max(1,Math.min(12,+b.gridSpan||(+b.headerSpan||(+b.span||1)*3)||4)),
      gridRow:Math.max(0,Math.min(40,+b.gridRow||0)),
      blockHeight:Math.max(0,Math.min(1800,+b.blockHeight||0)),
      dividerLength:Math.max(5,Math.min(100,+b.dividerLength||100)),
      dividerThickness:Math.max(1,Math.min(20,+b.dividerThickness||1)),
      dividerColor:/^#[0-9a-f]{6}$/i.test(b.dividerColor||'')?b.dividerColor:'#4b4b4b',
      dividerAlign:['left','center','right'].includes(b.dividerAlign)?b.dividerAlign:'left',
      ruledRows:b.ruledRows===true,
      rowsBesideImage:b.rowsBesideImage===true,
      stackBelowPrevious:b.stackBelowPrevious===true,
      stackParentId:String(b.stackParentId||''),
      title:String(b.title||''),
      body:String(b.body||''),
      titleSize:Math.max(11,Math.min(72,+b.titleSize||28)),
      bodySize:Math.max(9,Math.min(40,+b.bodySize||15)),
      color:/^#[0-9a-f]{6}$/i.test(b.color||'')?b.color:'#e2e2df',
      bold:b.bold!==false,
      titleUnderline:b.titleUnderline===true,
      bodyUnderline:b.bodyUnderline===true,
      listArrows:b.listArrows!==false,
      topLine:b.topLine!==false,
      numberVisible:b.numberVisible!==false,
      numberText:String(b.numberText||'').slice(0,8),
      numberSize:Math.max(5,Math.min(32,Number.isFinite(+b.numberSize)?+b.numberSize:7)),
      numberColor:/^#[0-9a-f]{6}$/i.test(b.numberColor||'')?b.numberColor:'#4c4c4b',
      rowPadding:Math.max(0,Math.min(40,Number.isFinite(+b.rowPadding)?+b.rowPadding:10)),
      rowMinHeight:Math.max(0,Math.min(60,Number.isFinite(+b.rowMinHeight)?+b.rowMinHeight:0)),
      listGap:Math.max(0,Math.min(40,Number.isFinite(+b.listGap)?+b.listGap:0)),
      listLineHeight:Math.max(.95,Math.min(2.2,Number.isFinite(+b.listLineHeight)?+b.listLineHeight:1.2)),
      titleContentGap:Math.max(0,Math.min(50,Number.isFinite(+b.titleContentGap)?+b.titleContentGap:4)),
      blockGap:Math.max(-80,Math.min(300,Number.isFinite(+b.blockGap)?+b.blockGap:0)),
      subsections:Array.isArray(b.subsections)?b.subsections.slice(0,12).map(s=>({title:String(s?.title||''),text:String(s?.text||'')})):[],
      subheadingSize:Math.max(8,Math.min(48,Number.isFinite(+b.subheadingSize)?+b.subheadingSize:9)),
      subheadingColor:/^#[0-9a-f]{6}$/i.test(b.subheadingColor||'')?b.subheadingColor:'#838380',
      subheadingTextGap:Math.max(0,Math.min(30,Number.isFinite(+b.subheadingTextGap)?+b.subheadingTextGap:3)),
      subsectionGap:Math.max(0,Math.min(40,Number.isFinite(+b.subsectionGap)?+b.subsectionGap:6)),
      subsectionLayout:['stack','2','3','4','auto'].includes(String(b.subsectionLayout||''))?String(b.subsectionLayout):'stack',
      boxEnabled:b.boxEnabled===true,
      boxRadius:Math.max(0,Math.min(80,+b.boxRadius||32)),
      boxPadding:Math.max(0,Math.min(80,Number.isFinite(+b.boxPadding)?+b.boxPadding:24)),
      boxBorderWidth:Math.max(0,Math.min(8,Number.isFinite(+b.boxBorderWidth)?+b.boxBorderWidth:1)),
      boxBorderColor:/^#[0-9a-f]{6}$/i.test(b.boxBorderColor||'')?b.boxBorderColor:'#3d3d3d',
      boxBorderOpacity:Math.max(0,Math.min(100,Number.isFinite(+b.boxBorderOpacity)?+b.boxBorderOpacity:100)),
      boxBackground:/^#[0-9a-f]{6}$/i.test(b.boxBackground||'')?b.boxBackground:'#0b0b0c',
      boxOpacity:Math.max(0,Math.min(100,Number.isFinite(+b.boxOpacity)?+b.boxOpacity:60)),
      cardWidth:Math.max(5,Math.min(300,Number.isFinite(+b.cardWidth)?+b.cardWidth:100)),
      cardRowSpan:Math.max(1,Math.min(12,Number.isFinite(+b.cardRowSpan)?+b.cardRowSpan:1)),
      cardAlign:['left','center','right'].includes(b.cardAlign)?b.cardAlign:'left',
      cardMode:['area','group'].includes(b.cardMode)?b.cardMode:'grid',
      groupMembers:Array.isArray(b.groupMembers)?b.groupMembers.map(String).filter(Boolean).slice(0,60):[],
      groupExtraWidth:Math.max(0,Math.min(800,Number.isFinite(+b.groupExtraWidth)?+b.groupExtraWidth:0)),
      groupExtraHeight:Math.max(0,Math.min(1200,Number.isFinite(+b.groupExtraHeight)?+b.groupExtraHeight:0)),
      areaLeft:Math.max(-200,Math.min(200,Number.isFinite(+b.areaLeft)?+b.areaLeft:0)),
      cardOffsetX:Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0)),
      areaTop:Math.max(0,Math.min(5000,Number.isFinite(+b.areaTop)?+b.areaTop:0)),
      areaWidth:Math.max(5,Math.min(300,Number.isFinite(+b.areaWidth)?+b.areaWidth:100)),
      areaHeight:Math.max(40,Math.min(3000,Number.isFinite(+b.areaHeight)?+b.areaHeight:320)),
      areaAutoFitHeight:b.areaAutoFitHeight===true,
      image:String(b.image||''),
      ratio:['landscape','square','portrait','wide'].includes(b.ratio)?b.ratio:'landscape'
    }
  }

  function normalisePage(p,meta){
    const base=freshPage(meta);
    p=p&&typeof p==='object'?p:{};
    const intro=String(p.intro||'');
    let headingPosition=['left','center','right','full'].includes(p.headingPosition)?p.headingPosition:'left';
    let headingCols=Math.max(4,Math.min(12,+p.headingCols||8));
    if(headingPosition==='full')headingCols=12;
    return {
      ...base,...p,
      id:meta?.id||p.id||'',
      parent:meta?.parent||p.parent||'',
      title:Object.prototype.hasOwnProperty.call(p,'title')?String(p.title):String(meta?.title||base.title),
      intro,
      columns:Math.max(2,Math.min(4,+p.columns||2)),
      headingSize:Math.max(24,Math.min(110,+p.headingSize||62)),
      headingColor:/^#[0-9a-f]{6}$/i.test(p.headingColor||'')?p.headingColor:'#f1f1ef',
      headingBold:p.headingBold!==false,
      headingUnderline:p.headingUnderline===true,
      headingPosition,
      headingCols,
      introEnabled:typeof p.introEnabled==='boolean'?p.introEnabled:!!intro.trim(),
      introUnderline:p.introUnderline===true,
      introCols:Math.max(2,Math.min(12,+p.introCols||4)),
      introSize:Math.max(10,Math.min(46,+p.introSize||17)),
      introColor:/^#[0-9a-f]{6}$/i.test(p.introColor||'')?p.introColor:'#b8b8b5',
      glassWidth:Math.max(50,Math.min(100,+p.glassWidth||98)),
      glassCentered:p.glassCentered===true,
      glassOffsetX:Math.max(-1200,Math.min(1200,Number.isFinite(+p.glassOffsetX)?+p.glassOffsetX:0)),
      lockPreviewWidth:p.lockPreviewWidth!==false,
      previewCanvasWidth:Math.max(900,Math.min(1800,Number.isFinite(+p.previewCanvasWidth)?+p.previewCanvasWidth:1280)),
      panelTopVh:Math.max(0,Math.min(125,+p.panelTopVh||100)),
      elementGap:Math.max(0,Math.min(120,Number.isFinite(+p.elementGap)?+p.elementGap:28)),
      audioHeroTitleSize:Math.max(72,Math.min(260,Number.isFinite(+p.audioHeroTitleSize)?+p.audioHeroTitleSize:188)),
      audioHeroIntroSize:Math.max(12,Math.min(60,Number.isFinite(+p.audioHeroIntroSize)?+p.audioHeroIntroSize:29)),
      audioHeroIntroWidth:Math.max(220,Math.min(1000,Number.isFinite(+p.audioHeroIntroWidth)?+p.audioHeroIntroWidth:720)),
      audioHeroKickerSize:Math.max(8,Math.min(32,Number.isFinite(+p.audioHeroKickerSize)?+p.audioHeroKickerSize:14)),
      audioHeroSmallSize:Math.max(8,Math.min(28,Number.isFinite(+p.audioHeroSmallSize)?+p.audioHeroSmallSize:14)),
      audioHeroButtonScale:Math.max(60,Math.min(180,Number.isFinite(+p.audioHeroButtonScale)?+p.audioHeroButtonScale:100)),
      audioHeroButtonTextSize:Math.max(8,Math.min(32,Number.isFinite(+p.audioHeroButtonTextSize)?+p.audioHeroButtonTextSize:14)),
      audioHeroBottomSpace:Math.max(0,Math.min(400,Number.isFinite(+p.audioHeroBottomSpace)?+p.audioHeroBottomSpace:70)),
      audioHeroKickerGap:Math.max(0,Math.min(100,Number.isFinite(+p.audioHeroKickerGap)?+p.audioHeroKickerGap:20)),
      audioHeroTitleGap:Math.max(0,Math.min(120,Number.isFinite(+p.audioHeroTitleGap)?+p.audioHeroTitleGap:18)),
      audioHeroColumnGap:Math.max(10,Math.min(180,Number.isFinite(+p.audioHeroColumnGap)?+p.audioHeroColumnGap:64)),
      audioHeroSideTop:Math.max(0,Math.min(220,Number.isFinite(+p.audioHeroSideTop)?+p.audioHeroSideTop:56)),
      audioHeroButtonPadY:Math.max(6,Math.min(40,Number.isFinite(+p.audioHeroButtonPadY)?+p.audioHeroButtonPadY:16)),
      audioHeroButtonPadX:Math.max(8,Math.min(60,Number.isFinite(+p.audioHeroButtonPadX)?+p.audioHeroButtonPadX:22)),
      audioHeroKicker:String(p.audioHeroKicker||'03 · PRODUCTION GUIDE').slice(0,80),
      audioHeroButtonText:String(p.audioHeroButtonText||'DOWNLOAD PDF').slice(0,60),
      audioHeroSideLabels:(Array.isArray(p.audioHeroSideLabels)?p.audioHeroSideLabels:[]).concat(['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING']).slice(0,5).map((x,i)=>String(x||['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING'][i]).slice(0,60)),
      enabled:p.enabled===true,
      blocks:Array.isArray(p.blocks)?p.blocks.map(normaliseBlock):[]
    }
  }

  function getPage(id,create=true){
    if(!id)return null;
    const meta=contentMeta(id);
    if(!meta)return null;
    if(!state.pages[id]&&create)state.pages[id]=freshPage(meta);
    const page=state.pages[id];
    if(!page)return null;

    /* V266 IMPORTANT:
       Keep the page object and each existing block object stable in memory.
       Older builds replaced state.pages[id] every time getPage() was called.
       A control could therefore obtain a block reference, call currentEditorPage()
       again, and then edit an orphaned copy that was no longer inside state.
       Normalise values IN PLACE instead, so every UI control edits the exact
       object that render/persist will use. */
    const existingBlocks=Array.isArray(page.blocks)?page.blocks:[];
    const normalised=normalisePage(page,meta);
    Object.keys(normalised).forEach(key=>{
      if(key!=='blocks')page[key]=normalised[key]
    });
    page.blocks=existingBlocks.map(block=>{
      if(!block||typeof block!=='object')return normaliseBlock(block);
      const clean=normaliseBlock(block);
      Object.assign(block,clean);
      return block
    });
    return page
  }

  function pageDetailsEnabled(id){
    return !!(id&&DETAIL_PAGE_SET.has(id)&&state.pages&&state.pages[id]&&state.pages[id].enabled===true)
  }

  function currentEditorPage(){
    editorPageId=$('v194DetailsSubmenu')?.value||editorPageId;
    return getPage(editorPageId,true)
  }

  function currentBlock(){
    const p=currentEditorPage();
    return p?.blocks?.find(b=>b.id===activeBlockId)||null
  }

  function persist(markDirty=true){
    state.savedAt=new Date().toISOString();
    try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){}
    if(markDirty){
      try{if(typeof setProjectDirty==='function')setProjectDirty(true)}catch(e){}
    }
  }

  function capturePageHistorySnapshot(){
    return {
      state:clone(state),
      editorPageId:editorPageId||$('v194DetailsSubmenu')?.value||'',
      activePageId:activePageId||'',
      activeBlockId:activeBlockId||'',
      liveSelection:clone(liveSelection||{kind:'page',part:'heading',blockId:''})
    }
  }

  function samePageHistorySnapshot(a,b){
    if(!a||!b)return false;
    try{return JSON.stringify(a.state)===JSON.stringify(b.state)}catch(e){return false}
  }

  function syncPageHistoryButtons(){
    const u=$('v260PageUndo'),r=$('v260PageRedo');
    if(u)u.disabled=!pageUndoHistory.length;
    if(r)r.disabled=!pageRedoHistory.length
  }

  function rememberPageHistory(){
    if(pageHistoryRestoring)return;
    const snap=capturePageHistorySnapshot();
    const last=pageUndoHistory[pageUndoHistory.length-1];
    if(last&&samePageHistorySnapshot(last,snap))return;
    pageUndoHistory.push(snap);
    if(pageUndoHistory.length>PAGE_HISTORY_LIMIT)pageUndoHistory.shift();
    pageRedoHistory.length=0;
    syncPageHistoryButtons()
  }

  function restorePageHistorySnapshot(snap,label){
    if(!snap)return;
    pageHistoryRestoring=true;
    try{
      state={version:2,sourceBuild:+snap.state?.sourceBuild||272,savedAt:snap.state?.savedAt||'',pages:clone(snap.state?.pages||{})};
      editorPageId=contentMeta(snap.editorPageId)?snap.editorPageId:(allContentTargets()[0]?.id||'');
      activeBlockId=snap.activeBlockId||'';
      liveSelection=clone(snap.liveSelection||{kind:'page',part:'heading',blockId:''});
      refreshPageSelect(editorPageId);
      if($('v194DetailsSubmenu'))$('v194DetailsSubmenu').value=editorPageId;
      syncPageEditor();
      activePageId=liveOpen?editorPageId:(contentMeta(snap.activePageId)?snap.activePageId:'');
      persist(false);
      if(liveOpen||activePageId)renderActiveDetails();
      else renderActiveDetails();
      updateSelectionUI();
      try{if(typeof setProjectDirty==='function')setProjectDirty(true)}catch(e){}
      setStatus(label)
    }finally{
      pageHistoryRestoring=false;
      syncPageHistoryButtons()
    }
  }

  function undoPageDetails(){
    if(!pageUndoHistory.length){setStatus('NOTHING TO UNDO');return}
    pageRedoHistory.push(capturePageHistorySnapshot());
    if(pageRedoHistory.length>PAGE_HISTORY_LIMIT)pageRedoHistory.shift();
    restorePageHistorySnapshot(pageUndoHistory.pop(),'UNDO')
  }

  function redoPageDetails(){
    if(!pageRedoHistory.length){setStatus('NOTHING TO REDO');return}
    pageUndoHistory.push(capturePageHistorySnapshot());
    if(pageUndoHistory.length>PAGE_HISTORY_LIMIT)pageUndoHistory.shift();
    restorePageHistorySnapshot(pageRedoHistory.pop(),'REDO')
  }

  function loadInitial(){
    let boot=null,local=null;
    try{
      if(typeof BOOT_PROJECT_STATE!=='undefined'&&BOOT_PROJECT_STATE?.v194SubmenuDetails){
        boot=BOOT_PROJECT_STATE.v194SubmenuDetails
      }
    }catch(e){}
    try{local=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
    const bt=Date.parse(boot?.savedAt||0)||0;
    const lt=Date.parse(local?.savedAt||0)||0;
    const bb=+boot?.sourceBuild||0;
    const lb=+local?.sourceBuild||0;
    let incoming=null;
    if(boot&&local){
      if(bb>lb)incoming=boot;
      else if(lb>bb)incoming=local;
      else incoming=lt>=bt?local:boot;
    }else incoming=local||boot;
    if(incoming&&typeof incoming==='object'){
      state={version:2,sourceBuild:+incoming.sourceBuild||bb||332,savedAt:incoming.savedAt||'',pages:clone(incoming.pages||{})}
    }
  }

  function refreshPageSelect(prefer){
    const sel=$('v194DetailsSubmenu');if(!sel)return;
    const items=DETAIL_PAGE_IDS.map(id=>contentMeta(id)).filter(Boolean);
    const keep=prefer||sel.value||editorPageId||items[0]?.id||'';
    sel.innerHTML=`<optgroup label="PAGE DETAILS">${items.map(item=>`<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('')}</optgroup>`;
    sel.value=items.some(s=>s.id===keep)?keep:(items[0]?.id||'');
    editorPageId=sel.value;
  }

  function syncPageEditor(){
    const p=currentEditorPage();if(!p)return;
    $('v194PageHeading').value=p.title||'';
    $('v194PageIntro').value=p.intro||'';
    $('v194PageColumns').value=String(p.columns||2);
    $('v194HeadingSize').value=p.headingSize||62;
    $('v194HeadingColor').value=p.headingColor||'#f1f1ef';
    $('v194HeadingBold').checked=p.headingBold!==false;
    if($('v284HeadingUnderline'))$('v284HeadingUnderline').checked=p.headingUnderline===true;
    if($('v259HeadingPosition'))$('v259HeadingPosition').value=p.headingPosition||'left';
    if($('v261HeadingCols'))$('v261HeadingCols').value=String(p.headingCols||8);
    if($('v261IntroCols'))$('v261IntroCols').value=String(p.introCols||4);
    const detailsEditor=$('v194SubmenuDetailsEditor');
    detailsEditor?.classList.toggle('v261-intro-off',p.introEnabled!==true);
    detailsEditor?.classList.toggle('v324-audio-page',editorPageId==='submenu_mtzyx7bz_wcw6');
    const introToggle=$('v261IntroToggle');
    if(introToggle){
      introToggle.textContent=p.introEnabled===true?'REMOVE INTRO FROM LAYOUT':'+ ADD INTRO TO HEADER';
      introToggle.classList.toggle('active',p.introEnabled!==true);
    }
    $('v194IntroSize').value=p.introSize||17;
    $('v194IntroColor').value=p.introColor||'#b8b8b5';
    if($('v284IntroUnderline'))$('v284IntroUnderline').checked=p.introUnderline===true;
    const gw=Math.max(50,Math.min(100,+p.glassWidth||98));
    if($('v258GlassWidth'))$('v258GlassWidth').value=String(gw);
    if($('v258GlassWidthNumber'))$('v258GlassWidthNumber').value=String(gw);
    if($('v258GlassWidthValue'))$('v258GlassWidthValue').textContent=Math.round(gw)+'%';
    const gx=Math.max(-1200,Math.min(1200,Number.isFinite(+p.glassOffsetX)?+p.glassOffsetX:0));
    if($('v312GlassCentered'))$('v312GlassCentered').checked=p.glassCentered===true;
    if($('v312GlassShiftX'))$('v312GlassShiftX').value=String(gx);
    if($('v312GlassShiftValue'))$('v312GlassShiftValue').textContent=(gx>0?'+':'')+Math.round(gx)+'px';
    const pw=Math.max(900,Math.min(1800,Number.isFinite(+p.previewCanvasWidth)?+p.previewCanvasWidth:1280));
    if($('v309LockPreviewWidth'))$('v309LockPreviewWidth').checked=p.lockPreviewWidth!==false;
    if($('v309PreviewWidth'))$('v309PreviewWidth').value=String(pw);
    if($('v309PreviewWidthNumber'))$('v309PreviewWidthNumber').value=String(pw);
    if($('v309PreviewWidthValue'))$('v309PreviewWidthValue').textContent=Math.round(pw)+'px';
    const pt=Math.max(0,Math.min(125,+p.panelTopVh||100));
    if($('v272PanelTop'))$('v272PanelTop').value=String(pt);
    if($('v272PanelTopNumber'))$('v272PanelTopNumber').value=String(pt);
    if($('v272PanelTopValue'))$('v272PanelTopValue').textContent=Math.round(pt)+'vh';
    const eg=Math.max(0,Math.min(120,Number.isFinite(+p.elementGap)?+p.elementGap:28));
    if($('v272ElementGap'))$('v272ElementGap').value=String(eg);
    if($('v272ElementGapNumber'))$('v272ElementGapNumber').value=String(eg);
    if($('v272ElementGapValue'))$('v272ElementGapValue').textContent=Math.round(eg)+'px';
    if($('v324AudioTitleSize'))$('v324AudioTitleSize').value=p.audioHeroTitleSize||188;
    if($('v324AudioIntroSize'))$('v324AudioIntroSize').value=p.audioHeroIntroSize||29;
    if($('v328AudioIntroWidth'))$('v328AudioIntroWidth').value=p.audioHeroIntroWidth||720;
    if($('v328AudioKickerSize'))$('v328AudioKickerSize').value=p.audioHeroKickerSize||14;
    if($('v324AudioSmallSize'))$('v324AudioSmallSize').value=p.audioHeroSmallSize||14;
    if($('v329AudioButtonScale'))$('v329AudioButtonScale').value=p.audioHeroButtonScale||100;
    if($('v330AudioButtonTextSize'))$('v330AudioButtonTextSize').value=p.audioHeroButtonTextSize||14;
    if($('v330AudioBottomSpace'))$('v330AudioBottomSpace').value=Number.isFinite(+p.audioHeroBottomSpace)?+p.audioHeroBottomSpace:70;
    if($('v324AudioKickerGap'))$('v324AudioKickerGap').value=p.audioHeroKickerGap||20;
    if($('v324AudioTitleGap'))$('v324AudioTitleGap').value=p.audioHeroTitleGap||18;
    if($('v324AudioColumnGap'))$('v324AudioColumnGap').value=p.audioHeroColumnGap||64;
    if($('v324AudioSideTop'))$('v324AudioSideTop').value=p.audioHeroSideTop||56;
    if($('v324AudioButtonPadY'))$('v324AudioButtonPadY').value=p.audioHeroButtonPadY||16;
    if($('v324AudioButtonPadX'))$('v324AudioButtonPadX').value=p.audioHeroButtonPadX||22;
    if($('v327AudioKickerText'))$('v327AudioKickerText').value=p.audioHeroKicker||'03 · PRODUCTION GUIDE';
    if($('v327AudioIntroText'))$('v327AudioIntroText').value=p.intro||'';
    if($('v327AudioButtonText'))$('v327AudioButtonText').value=p.audioHeroButtonText||'DOWNLOAD PDF';
    const v327Labels=(Array.isArray(p.audioHeroSideLabels)?p.audioHeroSideLabels:[]).concat(['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING']);
    for(let i=1;i<=5;i++){
      const el=$('v327AudioSide'+i);
      if(el)el.value=v327Labels[i-1]||'';
    }
    syncBlockSelect();
    setStatus()
  }

  function syncBlockSelect(){
    const p=currentEditorPage(),sel=$('v194BlockSelect');if(!p||!sel)return;
    if(!p.blocks.some(b=>b.id===activeBlockId))activeBlockId=p.blocks[0]?.id||'';
    sel.innerHTML=p.blocks.length
      ?p.blocks.map((b,i)=>{
        const blockName=b.type==='sectioncard'?(b.cardMode==='area'?'AREA BOX':(b.cardMode==='group'?'GROUPED SECTION':'SECTION CARD')):(b.title||b.type||'BLOCK');
        return `<option value="${esc(b.id)}">${b.zone==='header'?'HEADER':'CONTENT'} · ${String(i+1).padStart(2,'0')} · ${esc(String(blockName).toUpperCase())}</option>`
      }).join('')
      :'<option value="">— NO BLOCKS YET —</option>';
    sel.value=activeBlockId;
    syncBlockEditor()
  }

  function syncBlockWidthOptions(b,p){
    const sel=$('v194BlockSpan'),label=$('v261BlockWidthLabel');
    if(!sel)return;
    sel.innerHTML=Array.from({length:12},(_,i)=>i+1)
      .map(n=>`<option value="${n}">${n} / 12</option>`).join('');
    if(!b){
      sel.value='4';
      if(label)label.textContent='WIDTH · 12 COL GRID';
      return
    }
    b.gridSpan=Math.max(1,Math.min(12,+b.gridSpan||(+b.headerSpan||(+b.span||1)*3)||4));
    sel.value=String(b.gridSpan);
    if(label)label.textContent='WIDTH · 12 COL GRID';
  }

  function renderSubsectionEditor(b){
    const wrap=$('v289SubsectionsList');if(!wrap)return;
    const items=Array.isArray(b?.subsections)?b.subsections:[];
    if(!b){wrap.innerHTML='';return}
    if(!items.length){
      wrap.innerHTML='<div class="v289-sub-empty">NO SUBHEADINGS YET · USE + ADD SUBHEADING</div>';
      return
    }
    wrap.innerHTML=items.map((s,i)=>`<div class="v289-sub-edit" data-v289-sub-index="${i}">
      <input type="text" maxlength="90" data-v289-sub-title="${i}" value="${esc(s.title||'')}" placeholder="SUBHEADING · EG. GUITAR">
      <button type="button" class="v289-sub-remove" data-v289-remove-sub="${i}" title="Remove subheading">×</button>
      <textarea rows="3" data-v289-sub-text="${i}" placeholder="Text or list rows beneath this subheading">${esc(s.text||'')}</textarea>
    </div>`).join('')
  }

  function addSubsection(){
    const b=currentBlock();if(!b)return;
    if(!Array.isArray(b.subsections))b.subsections=[];
    if(b.subsections.length>=12){setStatus('MAX 12 SUBHEADINGS');return}
    b.subsections.push({title:'',text:''});
    persist();renderSubsectionEditor(b);renderActiveDetails();
    requestAnimationFrame(()=>$('v289SubsectionsList')?.querySelector(`[data-v289-sub-title="${b.subsections.length-1}"]`)?.focus());
    setStatus('SUBHEADING ADDED')
  }

  function renderGroupMembersEditor(b){
    const wrap=$('v293GroupMembersList');if(!wrap)return;
    if(!b||b.type!=='sectioncard'||b.cardMode!=='group'){wrap.innerHTML='';return}
    const p=currentEditorPage();
    const members=new Set(Array.isArray(b.groupMembers)?b.groupMembers:[]);
    const items=(p?.blocks||[]).filter(x=>x&&x.id!==b.id&&x.zone!=='header'&&x.type!=='sectioncard');
    if(!items.length){wrap.innerHTML='<div class="v293-group-empty">NO CONTENT ROWS AVAILABLE YET</div>';return}
    wrap.innerHTML=items.map(x=>{
      const label=String(x.title||x.type||'UNTITLED').replace(/[<>]/g,'');
      const row=(+x.gridRow||0)?`ROW ${+x.gridRow}`:'AUTO ROW';
      const col=(+x.gridStart||0)?`COL ${+x.gridStart}`:'AUTO COL';
      return `<label class="v293-member-row"><input type="checkbox" data-v293-member="${esc(x.id)}" ${members.has(x.id)?'checked':''}><span>${esc(label)}</span><small>${row} · ${col}</small></label>`
    }).join('')
  }

  function syncBlockEditor(){
    const b=currentBlock();
    const disabled=!b;
    ['v261BlockZone','v194BlockType','v194BlockSpan','v194ImageRatio','v194BlockTitle','v194BlockBody',
     'v194BlockTitleSize','v306TitleContentGap','v194BlockBodySize','v294SubheadingSize','v294SubheadingColor','v305SubheadingTextGap','v305SubsectionGap','v332SubsectionLayout','v296RowPadding','v306RowMinHeight','v305CompactPreset','v303ListGap','v303ListLineHeight','v296GroupExtraWidth','v296GroupExtraHeight','v283BlockHeight','v288DividerLength','v288DividerThickness','v288DividerColor','v288DividerAlign','v194BlockColor','v194BlockBold','v284BlockTitleUnderline','v284BlockBodyUnderline','v267BlockTitleArrow','v300TopLine','v300NumberVisible','v303NumberText','v300NumberSize','v300NumberColor','v271BlockStart','v271BlockRow','v271RuledRows','v289ListArrows','v289AddSubsection','v289BoxEnabled','v289BoxRadius','v289BoxPadding','v289BoxBorderWidth','v289BoxBorderColor','v290BorderOpacity','v289BoxBackground','v289BoxOpacity','v290CardWidth','v290CardRowSpan','v290CardAlign','v292CardMode','v298CardOffsetX','v299MoveLeft50','v299MoveLeft10','v299MoveRight10','v299MoveRight50','v299ResetOffset','v292AreaLeft','v292AreaTop','v292AreaWidth','v292AreaHeight','v307AreaAutoFitHeight','v311HeightMinus10','v311HeightMinus1','v311HeightPlus1','v311HeightPlus10','v285RowsBesideImage','v285AddSideRow','v286StackBelowPrevious','v287StackParent',
     'v194PhotoInput','v194ApplyBlock','v194BlockUp','v194BlockDown',
     'v194DuplicateBlock','v194DeleteBlock','v194ClearPhoto'
    ].forEach(id=>{const el=$(id);if(el)el.disabled=disabled});
    const detailsEditor=$('v194SubmenuDetailsEditor');
    detailsEditor?.classList.toggle('v261-no-block',!b);
    detailsEditor?.classList.toggle('v261-block-text',!!b&&b.type==='text');
    detailsEditor?.classList.toggle('v261-block-image',!!b&&b.type==='image');
    detailsEditor?.classList.toggle('v261-block-mixed',!!b&&b.type==='mixed');
    detailsEditor?.classList.toggle('v288-block-divider',!!b&&b.type==='divider');
    detailsEditor?.classList.toggle('v290-block-sectioncard',!!b&&b.type==='sectioncard');
    detailsEditor?.classList.toggle('v292-card-area',!!b&&b.type==='sectioncard'&&b.cardMode==='area');
    detailsEditor?.classList.toggle('v293-card-group',!!b&&b.type==='sectioncard'&&b.cardMode==='group');
    if(!b){
      if($('v261BlockZone'))$('v261BlockZone').value='content';
      syncBlockWidthOptions(null,currentEditorPage());
      $('v194BlockTitle').value='';
      $('v194BlockBody').value='';
      if($('v267BlockTitleArrow'))$('v267BlockTitleArrow').checked=true;
      if($('v300TopLine'))$('v300TopLine').checked=true;
      if($('v300NumberVisible'))$('v300NumberVisible').checked=true;
      if($('v303NumberText'))$('v303NumberText').value='';
      if($('v300NumberSize'))$('v300NumberSize').value='7';
      if($('v300NumberColor'))$('v300NumberColor').value='#4c4c4b';
      if($('v271BlockStart'))$('v271BlockStart').value='0';
      if($('v271BlockRow'))$('v271BlockRow').value='0';
      if($('v283BlockHeight'))$('v283BlockHeight').value='0';
      if($('v288DividerLength'))$('v288DividerLength').value='100';
      if($('v288DividerThickness'))$('v288DividerThickness').value='1';
      if($('v288DividerColor'))$('v288DividerColor').value='#4b4b4b';
      if($('v288DividerAlign'))$('v288DividerAlign').value='left';
      if($('v284BlockTitleUnderline'))$('v284BlockTitleUnderline').checked=false;
      if($('v284BlockBodyUnderline'))$('v284BlockBodyUnderline').checked=false;
      if($('v271RuledRows'))$('v271RuledRows').checked=false;
      if($('v289ListArrows'))$('v289ListArrows').checked=true;
      if($('v296RowPadding'))$('v296RowPadding').value='10';
      if($('v306RowMinHeight'))$('v306RowMinHeight').value='0';
      if($('v306TitleContentGap'))$('v306TitleContentGap').value='4';
      if($('v303ListGap'))$('v303ListGap').value='0';
      if($('v303ListLineHeight'))$('v303ListLineHeight').value='1.2';
      if($('v302BlockGap'))$('v302BlockGap').value='0';
      if($('v296GroupExtraWidth'))$('v296GroupExtraWidth').value='0';
      if($('v296GroupExtraHeight'))$('v296GroupExtraHeight').value='0';
      if($('v294SubheadingSize'))$('v294SubheadingSize').value='9';
      if($('v294SubheadingColor'))$('v294SubheadingColor').value='#838380';
      if($('v305SubheadingTextGap'))$('v305SubheadingTextGap').value='3';
      if($('v305SubsectionGap'))$('v305SubsectionGap').value='6';
      if($('v332SubsectionLayout'))$('v332SubsectionLayout').value='stack';
      if($('v289BoxEnabled'))$('v289BoxEnabled').checked=false;
      if($('v289BoxRadius'))$('v289BoxRadius').value='32';
      if($('v289BoxPadding'))$('v289BoxPadding').value='24';
      if($('v289BoxBorderWidth'))$('v289BoxBorderWidth').value='1';
      if($('v289BoxBorderColor'))$('v289BoxBorderColor').value='#3d3d3d';
      if($('v290BorderOpacity'))$('v290BorderOpacity').value='100';
      if($('v290CardWidth'))$('v290CardWidth').value='100';
      if($('v290CardRowSpan'))$('v290CardRowSpan').value='1';
      if($('v290CardAlign'))$('v290CardAlign').value='left';
      if($('v292CardMode'))$('v292CardMode').value='grid';
      if($('v298CardOffsetX'))$('v298CardOffsetX').value='0';
      if($('v299OffsetReadout'))$('v299OffsetReadout').textContent='0 PX';
      if($('v292AreaLeft'))$('v292AreaLeft').value='0';
      if($('v292AreaTop'))$('v292AreaTop').value='0';
      if($('v292AreaWidth'))$('v292AreaWidth').value='100';
      if($('v292AreaHeight'))$('v292AreaHeight').value='320';
      if($('v311HeightReadout'))$('v311HeightReadout').textContent='320 PX';
      if($('v307AreaAutoFitHeight'))$('v307AreaAutoFitHeight').checked=false;
      if($('v290HeightLabel'))$('v290HeightLabel').textContent='BOX HEIGHT · PX';
      if($('v289BoxBackground'))$('v289BoxBackground').value='#0b0b0c';
      if($('v289BoxOpacity'))$('v289BoxOpacity').value='75';
      renderSubsectionEditor(null);
      renderGroupMembersEditor(null);
      if($('v285RowsBesideImage'))$('v285RowsBesideImage').checked=false;
      if($('v286StackBelowPrevious'))$('v286StackBelowPrevious').checked=false;
      if($('v287StackParent')){$('v287StackParent').innerHTML='<option value="">AUTO — PREVIOUS BLOCK IN SAME COLUMN</option>';$('v287StackParent').value='';}
      $('v194PhotoPreviewWrap')?.classList.remove('has-photo');
      $('v194PhotoPreview')?.removeAttribute('src');
      return
    }
    if($('v261BlockZone'))$('v261BlockZone').value=b.zone||'content';
    $('v194BlockType').value=b.type;
    syncBlockWidthOptions(b,currentEditorPage());
    $('v194ImageRatio').value=b.ratio||'landscape';
    $('v194BlockTitle').value=b.title||'';
    $('v194BlockBody').value=b.body||'';
    $('v194BlockTitleSize').value=b.titleSize||28;
    $('v194BlockBodySize').value=b.bodySize||15;
    if($('v283BlockHeight'))$('v283BlockHeight').value=String(Math.max(0,Math.min(1800,+b.blockHeight||0)));
    if($('v288DividerLength'))$('v288DividerLength').value=String(Math.max(5,Math.min(100,+b.dividerLength||100)));
    if($('v288DividerThickness'))$('v288DividerThickness').value=String(Math.max(1,Math.min(20,+b.dividerThickness||1)));
    if($('v288DividerColor'))$('v288DividerColor').value=/^#[0-9a-f]{6}$/i.test(b.dividerColor||'')?b.dividerColor:'#4b4b4b';
    if($('v288DividerAlign'))$('v288DividerAlign').value=['left','center','right'].includes(b.dividerAlign)?b.dividerAlign:'left';
    $('v194BlockColor').value=b.color||'#e2e2df';
    $('v194BlockBold').checked=b.bold!==false;
    if($('v284BlockTitleUnderline'))$('v284BlockTitleUnderline').checked=b.titleUnderline===true;
    if($('v284BlockBodyUnderline'))$('v284BlockBodyUnderline').checked=b.bodyUnderline===true;
    if($('v267BlockTitleArrow'))$('v267BlockTitleArrow').checked=b.titleArrow!==false;
    if($('v300TopLine'))$('v300TopLine').checked=b.topLine!==false;
    if($('v300NumberVisible'))$('v300NumberVisible').checked=b.numberVisible!==false;
    if($('v303NumberText'))$('v303NumberText').value=String(b.numberText||'');
    if($('v300NumberSize'))$('v300NumberSize').value=String(Math.max(5,Math.min(32,Number.isFinite(+b.numberSize)?+b.numberSize:7)));
    if($('v300NumberColor'))$('v300NumberColor').value=/^#[0-9a-f]{6}$/i.test(b.numberColor||'')?b.numberColor:'#4c4c4b';
    if($('v271BlockStart'))$('v271BlockStart').value=String(Math.max(0,Math.min(12,+b.gridStart||0)));
    if($('v271BlockRow'))$('v271BlockRow').value=String(Math.max(0,Math.min(40,+b.gridRow||0)));
    if($('v271RuledRows'))$('v271RuledRows').checked=b.ruledRows===true;
    if($('v289ListArrows'))$('v289ListArrows').checked=b.listArrows!==false;
    if($('v296RowPadding'))$('v296RowPadding').value=String(Math.max(0,Math.min(40,Number.isFinite(+b.rowPadding)?+b.rowPadding:10)));
    if($('v306RowMinHeight'))$('v306RowMinHeight').value=String(Math.max(0,Math.min(60,Number.isFinite(+b.rowMinHeight)?+b.rowMinHeight:0)));
    if($('v306TitleContentGap'))$('v306TitleContentGap').value=String(Math.max(0,Math.min(50,Number.isFinite(+b.titleContentGap)?+b.titleContentGap:4)));
    if($('v303ListGap'))$('v303ListGap').value=String(Math.max(0,Math.min(40,Number.isFinite(+b.listGap)?+b.listGap:0)));
    if($('v303ListLineHeight'))$('v303ListLineHeight').value=String(Math.max(.95,Math.min(2.2,Number.isFinite(+b.listLineHeight)?+b.listLineHeight:1.2)));
    if($('v302BlockGap'))$('v302BlockGap').value=String(Math.max(-80,Math.min(300,Number.isFinite(+b.blockGap)?+b.blockGap:0)));
    if($('v296GroupExtraWidth'))$('v296GroupExtraWidth').value=String(Math.max(0,Math.min(800,Number.isFinite(+b.groupExtraWidth)?+b.groupExtraWidth:0)));
    if($('v296GroupExtraHeight'))$('v296GroupExtraHeight').value=String(Math.max(0,Math.min(1200,Number.isFinite(+b.groupExtraHeight)?+b.groupExtraHeight:0)));
    if($('v294SubheadingSize'))$('v294SubheadingSize').value=String(Math.max(8,Math.min(48,Number.isFinite(+b.subheadingSize)?+b.subheadingSize:9)));
    if($('v294SubheadingColor'))$('v294SubheadingColor').value=/^#[0-9a-f]{6}$/i.test(b.subheadingColor||'')?b.subheadingColor:'#838380';
    if($('v305SubheadingTextGap'))$('v305SubheadingTextGap').value=String(Math.max(0,Math.min(30,Number.isFinite(+b.subheadingTextGap)?+b.subheadingTextGap:3)));
    if($('v305SubsectionGap'))$('v305SubsectionGap').value=String(Math.max(0,Math.min(40,Number.isFinite(+b.subsectionGap)?+b.subsectionGap:6)));
    if($('v332SubsectionLayout'))$('v332SubsectionLayout').value=['stack','2','3','4','auto'].includes(String(b.subsectionLayout||''))?String(b.subsectionLayout):'stack';
    if($('v289BoxEnabled'))$('v289BoxEnabled').checked=b.type==='sectioncard'||b.boxEnabled===true;
    if($('v289BoxRadius'))$('v289BoxRadius').value=String(Math.max(0,Math.min(80,+b.boxRadius||32)));
    if($('v289BoxPadding'))$('v289BoxPadding').value=String(Math.max(0,Math.min(80,Number.isFinite(+b.boxPadding)?+b.boxPadding:24)));
    if($('v289BoxBorderWidth'))$('v289BoxBorderWidth').value=String(Math.max(0,Math.min(8,Number.isFinite(+b.boxBorderWidth)?+b.boxBorderWidth:1)));
    if($('v289BoxBorderColor'))$('v289BoxBorderColor').value=/^#[0-9a-f]{6}$/i.test(b.boxBorderColor||'')?b.boxBorderColor:'#3d3d3d';
    if($('v290BorderOpacity'))$('v290BorderOpacity').value=String(Math.max(0,Math.min(100,Number.isFinite(+b.boxBorderOpacity)?+b.boxBorderOpacity:100)));
    if($('v290CardWidth'))$('v290CardWidth').value=String(Math.max(5,Math.min(300,Number.isFinite(+b.cardWidth)?+b.cardWidth:100)));
    if($('v290CardRowSpan'))$('v290CardRowSpan').value=String(Math.max(1,Math.min(12,Number.isFinite(+b.cardRowSpan)?+b.cardRowSpan:1)));
    if($('v290CardAlign'))$('v290CardAlign').value=['left','center','right'].includes(b.cardAlign)?b.cardAlign:'left';
    if($('v292CardMode'))$('v292CardMode').value=['area','group'].includes(b.cardMode)?b.cardMode:'grid';
    if($('v298CardOffsetX'))$('v298CardOffsetX').value=String(Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0)));
    if($('v299OffsetReadout')){
      const ox=Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0));
      $('v299OffsetReadout').textContent=(ox>0?'+':'')+ox+' PX';
    }
    if($('v292AreaLeft'))$('v292AreaLeft').value=String(Math.max(-200,Math.min(200,Number.isFinite(+b.areaLeft)?+b.areaLeft:0)));
    if($('v292AreaTop'))$('v292AreaTop').value=String(Math.max(0,Math.min(5000,Number.isFinite(+b.areaTop)?+b.areaTop:0)));
    if($('v292AreaWidth'))$('v292AreaWidth').value=String(Math.max(5,Math.min(300,Number.isFinite(+b.areaWidth)?+b.areaWidth:100)));
    const v311h=Math.max(40,Math.min(3000,Number.isFinite(+b.areaHeight)?+b.areaHeight:320));
    if($('v292AreaHeight'))$('v292AreaHeight').value=String(v311h);
    if($('v311HeightReadout'))$('v311HeightReadout').textContent=Math.round(v311h)+' PX';
    if($('v307AreaAutoFitHeight'))$('v307AreaAutoFitHeight').checked=b.areaAutoFitHeight===true;
    if($('v290HeightLabel'))$('v290HeightLabel').textContent=b.type==='sectioncard'?(b.cardMode==='area'?'AREA BOX HEIGHT IS BELOW':(b.cardMode==='group'?'GROUP HEIGHT · AUTO':'CARD MIN HEIGHT · PX')):'BOX HEIGHT · PX';
    if($('v289BoxBackground'))$('v289BoxBackground').value=/^#[0-9a-f]{6}$/i.test(b.boxBackground||'')?b.boxBackground:'#0b0b0c';
    if($('v289BoxOpacity'))$('v289BoxOpacity').value=String(Math.max(0,Math.min(100,Number.isFinite(+b.boxOpacity)?+b.boxOpacity:75)));
    renderSubsectionEditor(b);
    renderGroupMembersEditor(b);
    if($('v285RowsBesideImage'))$('v285RowsBesideImage').checked=b.rowsBesideImage===true;
    if($('v286StackBelowPrevious'))$('v286StackBelowPrevious').checked=b.stackBelowPrevious===true;
    if($('v287StackParent')){
      const sel=$('v287StackParent');
      const page=currentEditorPage();
      const opts=['<option value="">AUTO — PREVIOUS BLOCK IN SAME COLUMN</option>'];
      (page?.blocks||[]).filter(x=>x&&x.id!==b.id&&x.zone!=='header').forEach(x=>{
        const label=(x.title||'UNTITLED BLOCK').replace(/[<>]/g,'');
        opts.push(`<option value="${esc(x.id)}">${esc(label)}</option>`);
      });
      sel.innerHTML=opts.join('');
      sel.value=(b.stackParentId&&[...sel.options].some(o=>o.value===b.stackParentId))?b.stackParentId:'';
    }
    const wrap=$('v194PhotoPreviewWrap'),img=$('v194PhotoPreview');
    wrap?.classList.toggle('has-photo',!!b.image);
    if(b.image&&img)img.src=b.image;else img?.removeAttribute('src')
  }

  function selectionLabel(){
    const meta=contentMeta(editorPageId);
    const b=currentBlock();
    if(liveSelection.kind==='page'){
      return `${meta?.title||'PAGE'} · ${liveSelection.part==='heading'?'PAGE TITLE':'INTRO TEXT'}`
    }
    return `${b?.title||'MODULE'} · ${
      liveSelection.part==='title'?'BLOCK TITLE':
      liveSelection.part==='body'?'BLOCK TEXT':
      liveSelection.part==='bullet'?'BULLET ITEM':
      liveSelection.part==='subheading'?'SUBHEADING':
      liveSelection.part==='subtext'?'SUBHEADING TEXT':
      'MODULE'
    }`
  }

  function selectedTextBinding(){
    const p=currentEditorPage();
    if(!p)return null;
    if(liveSelection.kind==='page'){
      if(liveSelection.part==='heading')return {kind:'heading',label:'PAGE TITLE',value:String(p.title||'')};
      if(liveSelection.part==='intro')return {kind:'intro',label:'INTRO TEXT',value:String(p.intro||'')};
      return null
    }
    const b=currentBlock();if(!b)return null;
    if(liveSelection.part==='title')return {kind:'block-title',label:'BLOCK TITLE',value:String(b.title||'')};
    if(liveSelection.part==='body')return {kind:'block-body',label:'BLOCK TEXT',value:String(b.body||'')};
    if(liveSelection.part==='bullet'){
      const rows=String(b.body||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)
        .map(x=>x.replace(/^(?:[*•-]\s+)/,'').trim());
      const idx=Math.max(0,+liveSelection.bulletIndex||0);
      return {kind:'bullet',label:'BULLET ITEM',value:String(rows[idx]||'')};
    }
    if(liveSelection.part==='subheading'){
      const idx=Math.max(0,+liveSelection.subIndex||0);
      return {kind:'subheading',label:'SUBHEADING',value:String(b.subsections?.[idx]?.title||'')};
    }
    if(liveSelection.part==='subtext'){
      const idx=Math.max(0,+liveSelection.subIndex||0),rowIdx=Math.max(0,+liveSelection.subRowIndex||0);
      const rows=String(b.subsections?.[idx]?.text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
      return {kind:'subtext',label:'SUBHEADING TEXT',value:String(rows[rowIdx]||'')};
    }
    return null
  }

  let v262QuickTextSyncing=false;
  function syncQuickTextEditor(){
    const ta=$('v262SelectedText'),lab=$('v262SelectedTextLabel'),clear=$('v262ClearText'),hint=$('v262TextHint');
    if(!ta)return;
    const binding=selectedTextBinding();
    v262QuickTextSyncing=true;
    try{
      if(!binding){
        ta.value='';ta.disabled=true;if(clear)clear.disabled=true;
        if(lab)lab.textContent='SELECT TEXT ON PAGE';
        if(hint)hint.textContent='CLICK A TITLE OR BODY TEXT AREA FIRST';
      }else{
        if(document.activeElement!==ta)ta.value=binding.value;
        ta.disabled=false;if(clear)clear.disabled=false;
        if(lab)lab.textContent=binding.label;
        if(hint)hint.textContent='TYPE HERE OR DIRECTLY ON THE PAGE · AUTO-SAVES';
      }
    }finally{v262QuickTextSyncing=false}
  }

  function applySelectedTextValue(value,{render=true,status='AUTO-SAVED TEXT'}={}){
    const p=currentEditorPage();if(!p)return;
    const text=String(value??'').replace(/\r/g,'');
    p.enabled=true;
    if(liveSelection.kind==='page'&&liveSelection.part==='heading'){
      p.title=text;
      if($('v194PageHeading'))$('v194PageHeading').value=text;
    }else if(liveSelection.kind==='page'&&liveSelection.part==='intro'){
      p.intro=text;
      p.introEnabled=!!text.trim();
      if($('v194PageIntro'))$('v194PageIntro').value=text;
    }else{
      activeBlockId=liveSelection.blockId||activeBlockId;
      const b=p.blocks.find(x=>x.id===activeBlockId);if(!b)return;
      if(liveSelection.part==='title'){
        b.title=text;
        if($('v194BlockTitle'))$('v194BlockTitle').value=text;
      }else if(liveSelection.part==='body'){
        b.body=text.replace(/\n{3,}/g,'\n\n');
        if($('v194BlockBody'))$('v194BlockBody').value=b.body;
      }else if(liveSelection.part==='bullet'){
        const rows=String(b.body||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)
          .map(x=>x.replace(/^(?:[*•-]\s+)/,'').trim());
        const idx=Math.max(0,+liveSelection.bulletIndex||0);
        if(text.trim())rows[idx]=text.trim();
        else rows.splice(idx,1);
        b.body=rows.map(row=>'* '+row).join('\n');
        liveSelection.bulletIndex=Math.min(idx,Math.max(0,rows.length-1));
        if($('v194BlockBody'))$('v194BlockBody').value=b.body;
      }else if(liveSelection.part==='subheading'){
        const idx=Math.max(0,+liveSelection.subIndex||0);
        if(!Array.isArray(b.subsections))b.subsections=[];
        if(!b.subsections[idx])b.subsections[idx]={title:'',text:''};
        b.subsections[idx].title=text.trim();
        renderSubsectionEditor(b);
      }else if(liveSelection.part==='subtext'){
        const idx=Math.max(0,+liveSelection.subIndex||0),rowIdx=Math.max(0,+liveSelection.subRowIndex||0);
        if(!Array.isArray(b.subsections))b.subsections=[];
        if(!b.subsections[idx])b.subsections[idx]={title:'',text:''};
        const rows=String(b.subsections[idx].text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
        if(text.trim())rows[rowIdx]=text.trim(); else rows.splice(rowIdx,1);
        b.subsections[idx].text=rows.join('\n');
        liveSelection.subRowIndex=Math.min(rowIdx,Math.max(0,rows.length-1));
        renderSubsectionEditor(b);
      }else return;
    }
    persist();
    if(render)renderActiveDetails();
    setStatus(status);
    syncQuickTextEditor()
  }

  function updateSelectionUI(){
    const box=$('v199LiveSelection');
    syncQuickTextEditor();
    if(box)box.textContent='SELECTED · '+selectionLabel()+' · CHANGES APPLY LIVE';
    document.querySelectorAll('.v199-live-selected').forEach(el=>el.classList.remove('v199-live-selected'));
    if(!liveOpen)return;
    if(liveSelection.kind==='page'){
      const el=liveSelection.part==='intro'?$('v194DetailsIntro'):$('v194DetailsHeading');
      el?.classList.add('v199-live-selected')
    }else if(activeBlockId){
      const module=document.querySelector(`.v194-detail-module[data-block-id="${CSS.escape(activeBlockId)}"]`);
      if(liveSelection.part==='title')module?.querySelector('h3')?.classList.add('v199-live-selected');
      else if(liveSelection.part==='body')module?.querySelector('.v197-body,.v197-spec-list')?.classList.add('v199-live-selected');
      else if(liveSelection.part==='bullet')module?.querySelector(`[data-live-part="bullet"][data-live-bullet-index="${Math.max(0,+liveSelection.bulletIndex||0)}"]`)?.classList.add('v199-live-selected');
      else if(liveSelection.part==='subheading')module?.querySelector(`[data-live-part="subheading"][data-live-sub-index="${Math.max(0,+liveSelection.subIndex||0)}"]`)?.classList.add('v199-live-selected');
      else if(liveSelection.part==='subtext')module?.querySelector(`[data-live-part="subtext"][data-live-sub-index="${Math.max(0,+liveSelection.subIndex||0)}"][data-live-sub-row-index="${Math.max(0,+liveSelection.subRowIndex||0)}"]`)?.classList.add('v199-live-selected');
      else module?.classList.add('v199-live-selected')
    }
  }

  function setStatus(extra=''){
    const p=currentEditorPage(),st=$('v194DetailsStatus');if(!st||!p)return;
    const meta=contentMeta(editorPageId);
    const headerCount=p.blocks.filter(b=>b.zone==='header').length;
    const contentCount=p.blocks.length-headerCount;
    st.textContent=(meta?.title||p.title||'PAGE').toUpperCase()+
      ` · 12 COL GRID · ${headerCount} HEADER / ${contentCount} CONTENT MODULE${contentCount===1?'':'S'}`+
      (p.enabled===true?' · DETAILS ON':' · DETAILS OFF UNTIL EDITED')+
      (extra?' · '+extra:'');
    if(extra){
      st.classList.add('v266-applied');
      clearTimeout(setStatus._t);
      setStatus._t=setTimeout(()=>st.classList.remove('v266-applied'),650)
    }
  }

  function applyPageFromControls(render=true){
    const p=currentEditorPage();if(!p)return;
    p.enabled=true;
    if(liveOpen)activePageId=editorPageId;
    p.title=$('v194PageHeading').value;
    p.intro=$('v194PageIntro').value;
    p.columns=Math.max(2,Math.min(4,+$('v194PageColumns').value||2));
    p.headingSize=Math.max(24,Math.min(110,+$('v194HeadingSize').value||62));
    p.headingColor=$('v194HeadingColor').value||'#f1f1ef';
    p.headingBold=$('v194HeadingBold').checked;
    p.headingUnderline=$('v284HeadingUnderline')?.checked===true;
    p.headingPosition=$('v259HeadingPosition')?.value||'left';
    p.headingCols=Math.max(4,Math.min(12,+$('v261HeadingCols')?.value||8));
    if(p.headingPosition==='full')p.headingCols=12;
    p.introCols=Math.max(2,Math.min(12,+$('v261IntroCols')?.value||4));
    p.introSize=Math.max(10,Math.min(46,+$('v194IntroSize').value||17));
    p.introColor=$('v194IntroColor').value||'#b8b8b5';
    p.introUnderline=$('v284IntroUnderline')?.checked===true;
    if(editorPageId==='submenu_mtzyx7bz_wcw6'){
      p.audioHeroTitleSize=Math.max(72,Math.min(260,+$('v324AudioTitleSize')?.value||188));
      p.audioHeroIntroSize=Math.max(12,Math.min(60,+$('v324AudioIntroSize')?.value||29));
      p.audioHeroIntroWidth=Math.max(220,Math.min(1000,+$('v328AudioIntroWidth')?.value||720));
      p.audioHeroKickerSize=Math.max(8,Math.min(32,+$('v328AudioKickerSize')?.value||14));
      p.audioHeroSmallSize=Math.max(8,Math.min(28,+$('v324AudioSmallSize')?.value||14));
      p.audioHeroButtonScale=Math.max(60,Math.min(180,+$('v329AudioButtonScale')?.value||100));
      p.audioHeroButtonTextSize=Math.max(8,Math.min(32,+$('v330AudioButtonTextSize')?.value||14));
      p.audioHeroBottomSpace=Math.max(0,Math.min(400,Number.isFinite(+$('v330AudioBottomSpace')?.value)?+$('v330AudioBottomSpace').value:70));
      p.audioHeroKickerGap=Math.max(0,Math.min(100,+$('v324AudioKickerGap')?.value||20));
      p.audioHeroTitleGap=Math.max(0,Math.min(120,+$('v324AudioTitleGap')?.value||18));
      p.audioHeroColumnGap=Math.max(10,Math.min(180,+$('v324AudioColumnGap')?.value||64));
      p.audioHeroSideTop=Math.max(0,Math.min(220,+$('v324AudioSideTop')?.value||56));
      p.audioHeroButtonPadY=Math.max(6,Math.min(40,+$('v324AudioButtonPadY')?.value||16));
      p.audioHeroButtonPadX=Math.max(8,Math.min(60,+$('v324AudioButtonPadX')?.value||22));
      p.audioHeroKicker=String($('v327AudioKickerText')?.value||'03 · PRODUCTION GUIDE').slice(0,80);
      p.audioHeroButtonText=String($('v327AudioButtonText')?.value||'DOWNLOAD PDF').slice(0,60);
      p.audioHeroSideLabels=[1,2,3,4,5].map((i,idx)=>String($('v327AudioSide'+i)?.value||['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING'][idx]).slice(0,60));
      p.intro=String($('v327AudioIntroText')?.value||$('v194PageIntro')?.value||'');
      p.introEnabled=true;
      if($('v194PageIntro'))$('v194PageIntro').value=p.intro;
    }
    persist();
    if(render)renderActiveDetails();
    setStatus('LIVE')
  }

  function applyBlockFromControls(render=true){
    const p=currentEditorPage();if(!p)return;
    activeBlockId=$('v194BlockSelect')?.value||activeBlockId;
    const b=p.blocks.find(x=>x.id===activeBlockId);if(!b)return;
    p.enabled=true;
    activePageId=liveOpen?editorPageId:activePageId;
    b.zone=$('v261BlockZone')?.value==='header'?'header':'content';
    b.type=$('v194BlockType').value||'text';
    if(b.type==='sectioncard')b.boxEnabled=true;
    b.gridStart=Math.max(0,Math.min(12,+$('v271BlockStart')?.value||0));
    b.gridSpan=Math.max(1,Math.min(12,+$('v194BlockSpan').value||4));
    b.gridRow=Math.max(0,Math.min(40,+$('v271BlockRow')?.value||0));
    b.headerSpan=b.gridSpan;
    b.span=Math.max(1,Math.min(4,Math.ceil(b.gridSpan/3)));
    b.ratio=$('v194ImageRatio').value||'landscape';
    b.title=$('v194BlockTitle').value;
    b.body=$('v194BlockBody').value;
    b.titleSize=Math.max(11,Math.min(72,+$('v194BlockTitleSize').value||28));
    b.bodySize=Math.max(9,Math.min(40,+$('v194BlockBodySize').value||15));
    b.blockHeight=Math.max(0,Math.min(1800,+$('v283BlockHeight')?.value||0));
    b.dividerLength=Math.max(5,Math.min(100,+$('v288DividerLength')?.value||100));
    b.dividerThickness=Math.max(1,Math.min(20,+$('v288DividerThickness')?.value||1));
    b.dividerColor=$('v288DividerColor')?.value||'#4b4b4b';
    b.dividerAlign=['left','center','right'].includes($('v288DividerAlign')?.value)?$('v288DividerAlign').value:'left';
    b.color=$('v194BlockColor').value||'#e2e2df';
    b.bold=$('v194BlockBold').checked;
    b.titleUnderline=$('v284BlockTitleUnderline')?.checked===true;
    b.bodyUnderline=$('v284BlockBodyUnderline')?.checked===true;
    b.titleArrow=$('v267BlockTitleArrow')?$('v267BlockTitleArrow').checked:(b.titleArrow!==false);
    b.topLine=$('v300TopLine')?$('v300TopLine').checked:(b.topLine!==false);
    b.numberVisible=$('v300NumberVisible')?$('v300NumberVisible').checked:(b.numberVisible!==false);
    b.numberText=String($('v303NumberText')?.value||'').slice(0,8);
    b.numberSize=Math.max(5,Math.min(32,Number.isFinite(+$('v300NumberSize')?.value)?+$('v300NumberSize').value:7));
    b.numberColor=$('v300NumberColor')?.value||'#4c4c4b';
    b.ruledRows=$('v271RuledRows')?$('v271RuledRows').checked:(b.ruledRows===true);
    b.listArrows=$('v289ListArrows')?$('v289ListArrows').checked:(b.listArrows!==false);
    b.rowPadding=Math.max(0,Math.min(40,Number.isFinite(+$('v296RowPadding')?.value)?+$('v296RowPadding').value:10));
    b.rowMinHeight=Math.max(0,Math.min(60,Number.isFinite(+$('v306RowMinHeight')?.value)?+$('v306RowMinHeight').value:0));
    b.titleContentGap=Math.max(0,Math.min(50,Number.isFinite(+$('v306TitleContentGap')?.value)?+$('v306TitleContentGap').value:4));
    b.listGap=Math.max(0,Math.min(40,Number.isFinite(+$('v303ListGap')?.value)?+$('v303ListGap').value:0));
    b.listLineHeight=Math.max(.95,Math.min(2.2,Number.isFinite(+$('v303ListLineHeight')?.value)?+$('v303ListLineHeight').value:1.2));
    b.blockGap=Math.max(-80,Math.min(300,Number.isFinite(+$('v302BlockGap')?.value)?+$('v302BlockGap').value:0));
    b.groupExtraWidth=Math.max(0,Math.min(800,Number.isFinite(+$('v296GroupExtraWidth')?.value)?+$('v296GroupExtraWidth').value:0));
    b.groupExtraHeight=Math.max(0,Math.min(1200,Number.isFinite(+$('v296GroupExtraHeight')?.value)?+$('v296GroupExtraHeight').value:0));
    b.subheadingSize=Math.max(8,Math.min(48,Number.isFinite(+$('v294SubheadingSize')?.value)?+$('v294SubheadingSize').value:9));
    b.subheadingColor=$('v294SubheadingColor')?.value||'#838380';
    b.subheadingTextGap=Math.max(0,Math.min(30,Number.isFinite(+$('v305SubheadingTextGap')?.value)?+$('v305SubheadingTextGap').value:3));
    b.subsectionGap=Math.max(0,Math.min(40,Number.isFinite(+$('v305SubsectionGap')?.value)?+$('v305SubsectionGap').value:6));
    b.subsectionLayout=['stack','2','3','4','auto'].includes(String($('v332SubsectionLayout')?.value||''))?String($('v332SubsectionLayout').value):'stack';
    b.boxEnabled=$('v289BoxEnabled')?.checked===true;
    b.boxRadius=Math.max(0,Math.min(80,+$('v289BoxRadius')?.value||0));
    b.boxPadding=Math.max(0,Math.min(80,Number.isFinite(+$('v289BoxPadding')?.value)?+$('v289BoxPadding').value:24));
    b.boxBorderWidth=Math.max(0,Math.min(8,Number.isFinite(+$('v289BoxBorderWidth')?.value)?+$('v289BoxBorderWidth').value:1));
    b.boxBorderColor=$('v289BoxBorderColor')?.value||'#3d3d3d';
    b.boxBorderOpacity=Math.max(0,Math.min(100,Number.isFinite(+$('v290BorderOpacity')?.value)?+$('v290BorderOpacity').value:100));
    b.cardWidth=Math.max(5,Math.min(300,Number.isFinite(+$('v290CardWidth')?.value)?+$('v290CardWidth').value:100));
    b.cardRowSpan=Math.max(1,Math.min(12,Number.isFinite(+$('v290CardRowSpan')?.value)?+$('v290CardRowSpan').value:1));
    b.cardAlign=['left','center','right'].includes($('v290CardAlign')?.value)?$('v290CardAlign').value:'left';
    b.cardMode=['area','group'].includes($('v292CardMode')?.value)?$('v292CardMode').value:'grid';
    b.cardOffsetX=Math.max(-3000,Math.min(3000,Number.isFinite(+$('v298CardOffsetX')?.value)?+$('v298CardOffsetX').value:0));
    b.areaLeft=Math.max(-200,Math.min(200,Number.isFinite(+$('v292AreaLeft')?.value)?+$('v292AreaLeft').value:0));
    b.areaTop=Math.max(0,Math.min(5000,Number.isFinite(+$('v292AreaTop')?.value)?+$('v292AreaTop').value:0));
    b.areaWidth=Math.max(5,Math.min(300,Number.isFinite(+$('v292AreaWidth')?.value)?+$('v292AreaWidth').value:100));
    b.areaHeight=Math.max(40,Math.min(3000,Number.isFinite(+$('v292AreaHeight')?.value)?+$('v292AreaHeight').value:320));
    b.areaAutoFitHeight=$('v307AreaAutoFitHeight')?$('v307AreaAutoFitHeight').checked:(b.areaAutoFitHeight===true);
    b.boxBackground=$('v289BoxBackground')?.value||'#0b0b0c';
    b.boxOpacity=Math.max(0,Math.min(100,Number.isFinite(+$('v289BoxOpacity')?.value)?+$('v289BoxOpacity').value:75));
    if(b.type==='sectioncard'){b.boxEnabled=true;b.title='';b.body='';b.titleArrow=false;b.ruledRows=false;b.rowsBesideImage=false;b.stackBelowPrevious=false;b.stackParentId='';b.zone='content';if(!Array.isArray(b.groupMembers))b.groupMembers=[];}
    b.rowsBesideImage=b.type==='mixed'&&($('v285RowsBesideImage')?$('v285RowsBesideImage').checked:(b.rowsBesideImage===true));
    b.stackBelowPrevious=b.zone==='content'&&($('v286StackBelowPrevious')?$('v286StackBelowPrevious').checked:(b.stackBelowPrevious===true));
    b.stackParentId=b.zone==='content'?String($('v287StackParent')?.value||''):'';
    if(b.stackParentId){
      const parent=p.blocks.find(x=>x.id===b.stackParentId&&x.zone!=='header');
      if(parent&&parent.id!==b.id){
        b.gridStart=Math.max(0,Math.min(12,+parent.gridStart||0));
        b.gridSpan=Math.max(1,Math.min(12,+parent.gridSpan||(+parent.headerSpan||(+parent.span||1)*3)||4));
        b.headerSpan=b.gridSpan;
        b.span=Math.max(1,Math.min(4,Math.ceil(b.gridSpan/3)));
        b.gridRow=0;
        b.stackBelowPrevious=true;
      }
    }
    persist();
    syncBlockEditor();
    if(render)renderActiveDetails();
    setStatus('LIVE')
  }

  function addBlock(type,zone='content',cardMode='grid'){
    const p=currentEditorPage();if(!p)return;
    p.enabled=true;
    const b=freshBlock(type);
    b.zone=zone==='header'?'header':'content';
    b.titleArrow=true;
    b.ruledRows=false;
    b.rowsBesideImage=false;
    b.stackBelowPrevious=false;
    b.gridStart=b.zone==='header'?7:0;
    b.gridSpan=type==='image'?6:(type==='mixed'?8:((type==='divider'||type==='sectioncard')?12:6));
    b.gridRow=b.zone==='header'?2:0;
    if(type==='text'){b.title=b.zone==='header'?'NEW HEADER MODULE':'NEW TEXT SECTION';b.body='Click this text on the live page to edit it.'}
    if(type==='image'){b.span=Math.min(2,p.columns)}
    if(type==='mixed'){b.title=b.zone==='header'?'NEW HEADER MODULE':'NEW SECTION';b.body='Click this text on the live page to edit it.';b.span=Math.min(2,p.columns)}
    if(type==='divider'){b.title='';b.body='';b.titleArrow=false;b.numberVisible=false;b.ruledRows=false;b.blockHeight=0;b.dividerLength=100;b.dividerThickness=1;b.dividerColor='#4b4b4b';b.dividerAlign='left';b.span=4}
    if(type==='sectioncard'){b.title='';b.body='';b.titleArrow=false;b.numberVisible=false;b.ruledRows=false;b.blockHeight=cardMode==='group'?0:260;b.gridStart=1;b.gridSpan=12;b.gridRow=1;b.span=4;b.boxEnabled=true;b.boxRadius=30;b.boxPadding=cardMode==='group'?24:0;b.boxBorderWidth=1;b.boxBorderColor='#3d3d3d';b.boxBorderOpacity=85;b.boxBackground='#0b0b0c';b.boxOpacity=58;b.cardWidth=100;b.cardRowSpan=1;b.cardAlign='left';b.cardMode=cardMode==='area'?'area':(cardMode==='group'?'group':'grid');b.groupMembers=[];b.groupExtraWidth=0;b.groupExtraHeight=0;b.cardOffsetX=0;b.areaLeft=0;b.areaTop=0;b.areaWidth=100;b.areaHeight=320;b.areaAutoFitHeight=false}
    if(b.zone==='header'){
      if(p.headingPosition==='full')p.headingPosition='left';
      if((+p.headingCols||8)>10)p.headingCols=8;
      const available=Math.max(2,12-(+p.headingCols||8));
      b.gridStart=Math.min(12,Math.max(1,(+p.headingCols||6)+1));
      b.gridSpan=Math.max(2,Math.min(12-b.gridStart+1,available));
      b.headerSpan=b.gridSpan;
      b.gridRow=2;
    }
    p.blocks.push(b);
    activeBlockId=b.id;
    liveSelection={kind:'block',part:'module',blockId:b.id};
    persist();syncPageEditor();syncBlockSelect();renderActiveDetails();updateSelectionUI()
  }

  function addNewRow(){
    const p=currentEditorPage();if(!p)return;
    p.enabled=true;
    const content=p.blocks.filter(b=>b.zone!=='header');
    let maxRow=0;
    content.forEach((b,idx)=>{
      const r=Math.max(0,+b.gridRow||0);
      if(r>maxRow)maxRow=r;
      else if(r===0)maxRow=Math.max(maxRow,idx+1);
    });
    const nextRow=Math.max(1,Math.min(40,maxRow+1));
    const b=freshBlock('text');
    b.zone='content';
    b.type='text';
    b.gridStart=1;
    b.gridSpan=12;
    b.gridRow=nextRow;
    b.span=4;
    b.headerSpan=12;
    b.ruledRows=false;
    b.titleArrow=true;
    b.topLine=false;
    b.title='NEW ROW';
    b.body='Click this text on the live page to edit it.';
    p.blocks.push(b);
    activeBlockId=b.id;
    liveSelection={kind:'block',part:'module',blockId:b.id};
    persist();syncPageEditor();syncBlockSelect();renderActiveDetails();updateSelectionUI();
    setStatus('ROW '+nextRow+' ADDED');
  }

  function addSideRowToCurrentMixed(){
    const p=currentEditorPage(),b=currentBlock();
    if(!p||!b||b.type!=='mixed'){setStatus('SELECT A TEXT + PHOTO BLOCK');return}
    rememberPageHistory();
    p.enabled=true;
    b.rowsBesideImage=true;
    const rows=String(b.body||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)
      .map(x=>x.replace(/^(?:[*•-]\s+)/,'').trim());
    rows.push('NEW ROW');
    b.body=rows.join('\n');
    activeBlockId=b.id;
    liveSelection={kind:'block',part:'bullet',blockId:b.id,bulletIndex:rows.length-1};
    persist();syncBlockEditor();renderActiveDetails();updateSelectionUI();
    setStatus('SIDE ROW ADDED');
    requestAnimationFrame(()=>{
      const el=document.querySelector(`.v194-detail-module[data-block-id="${CSS.escape(b.id)}"] [data-live-part="bullet"][data-live-bullet-index="${rows.length-1}"]`);
      if(el&&liveOpen){try{el.focus();document.getSelection()?.selectAllChildren(el)}catch(e){}}
    })
  }

  function moveBlock(dir){
    const p=currentEditorPage();if(!p)return;
    const i=p.blocks.findIndex(b=>b.id===activeBlockId);if(i<0)return;
    const j=i+dir;if(j<0||j>=p.blocks.length)return;
    [p.blocks[i],p.blocks[j]]=[p.blocks[j],p.blocks[i]];
    persist();syncBlockSelect();renderActiveDetails();updateSelectionUI()
  }

  function moveBlockTo(blockId,targetId){
    const p=currentEditorPage();if(!p||blockId===targetId)return;
    const i=p.blocks.findIndex(b=>b.id===blockId);
    const j=p.blocks.findIndex(b=>b.id===targetId);
    if(i<0||j<0)return;
    const [moved]=p.blocks.splice(i,1);
    const target=p.blocks.findIndex(b=>b.id===targetId);
    p.blocks.splice(target<0?p.blocks.length:target,0,moved);
    activeBlockId=blockId;
    persist();syncBlockSelect();renderActiveDetails();updateSelectionUI()
  }

  function changeSpan(delta){
    const p=currentEditorPage();if(!p)return;
    const b=p.blocks.find(x=>x.id===activeBlockId);if(!b)return;
    b.gridSpan=Math.max(1,Math.min(12,(+b.gridSpan||4)+delta));
    b.headerSpan=b.gridSpan;
    b.span=Math.max(1,Math.min(4,Math.ceil(b.gridSpan/3)));
    syncBlockWidthOptions(b,p);
    persist();renderActiveDetails();updateSelectionUI()
  }

  function toggleBlockZone(){
    const p=currentEditorPage();if(!p)return;
    const b=p.blocks.find(x=>x.id===activeBlockId);if(!b)return;
    b.zone=b.zone==='header'?'content':'header';
    if(b.zone==='header'){
      if(p.headingPosition==='full')p.headingPosition='left';
      if((+p.headingCols||8)>8)p.headingCols=6;
      if(!(+b.gridStart))b.gridStart=7;
      if(!(+b.gridRow))b.gridRow=2;
      if(!(+b.gridSpan))b.gridSpan=6;
    }else{
      b.gridRow=0;
      if(!(+b.gridSpan))b.gridSpan=6;
    }
    b.headerSpan=b.gridSpan;
    b.span=Math.max(1,Math.min(4,Math.ceil((+b.gridSpan||4)/3)));
    persist();syncPageEditor();syncBlockEditor();renderActiveDetails();updateSelectionUI()
  }

  function duplicateBlock(){
    const p=currentEditorPage();if(!p)return;
    const b=p.blocks.find(x=>x.id===activeBlockId);if(!b)return;
    const c=clone(b);
    c.id='detail_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
    c.title=(c.title||'BLOCK')+' COPY';
    const i=p.blocks.findIndex(x=>x.id===b.id);
    p.blocks.splice(i+1,0,c);activeBlockId=c.id;
    liveSelection={kind:'block',part:'module',blockId:c.id};
    persist();syncBlockSelect();renderActiveDetails();updateSelectionUI()
  }

  function deleteBlock(){
    const p=currentEditorPage();if(!p)return;
    const i=p.blocks.findIndex(b=>b.id===activeBlockId);if(i<0)return;
    p.blocks.splice(i,1);
    activeBlockId=p.blocks[Math.min(i,p.blocks.length-1)]?.id||'';
    liveSelection=activeBlockId?{kind:'block',part:'module',blockId:activeBlockId}:{kind:'page',part:'heading',blockId:''};
    persist();syncBlockSelect();renderActiveDetails();updateSelectionUI()
  }

  function renderActiveDetails(){
    // V266: live editor always renders the page selected in the Page Details panel.
    const id=liveOpen?(editorPageId||activePageId):(activePageId||editorPageId);
    const p=getPage(id,false);
    const panel=$('v194SubmenuDetailsPanel');
    const grid=$('v194DetailsGrid');
    const head=panel?.querySelector?.('.v194-details-head');
    if(!panel||!grid||!head)return;

    if(!id){
      panel.removeAttribute('data-page-id');
      panel.removeAttribute('data-v309-lock-width');
      panel.removeAttribute('data-v312-glass-centered');
      panel.style.removeProperty('--v312-glass-shift-x');
      document.body.removeAttribute('data-v309-lock-width');
      document.body.style.removeProperty('--v309-preview-canvas-width');
      grid.innerHTML='';
      head.querySelectorAll('.v261-header-module').forEach(el=>el.remove());
      return
    }

    const meta=contentMeta(id);
    const data=p||freshPage(meta);
    panel.dataset.pageId=id;
    panel.dataset.v259HeadingPosition=data.headingPosition||'left';
    panel.dataset.v261HeaderGrid='1';
    panel.dataset.v281PageId=id;
    const v309Lock=data.lockPreviewWidth!==false;
    const v309Width=Math.max(900,Math.min(1800,Number.isFinite(+data.previewCanvasWidth)?+data.previewCanvasWidth:1280));
    panel.dataset.v309LockWidth=v309Lock?'1':'0';
    panel.dataset.v312GlassCentered=data.glassCentered===true?'1':'0';
    panel.dataset.v327AudioKicker=String(data.audioHeroKicker||'03 · PRODUCTION GUIDE');
    panel.dataset.v327AudioIntro=String(data.intro||'');
    panel.dataset.v327AudioButton=String(data.audioHeroButtonText||'DOWNLOAD PDF');
    const v327SideLabels=(Array.isArray(data.audioHeroSideLabels)?data.audioHeroSideLabels:[]).concat(['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING']).slice(0,5);
    for(let i=0;i<5;i++)panel.dataset['v327AudioSide'+(i+1)]=String(v327SideLabels[i]||'');
    panel.style.setProperty('--v312-glass-shift-x',Math.max(-1200,Math.min(1200,Number.isFinite(+data.glassOffsetX)?+data.glassOffsetX:0))+'px');
    panel.style.setProperty('--v309-preview-canvas-width',v309Width+'px');
    document.body.dataset.v309LockWidth=v309Lock?'1':'0';
    document.body.style.setProperty('--v309-preview-canvas-width',v309Width+'px');
    panel.style.setProperty('--v258-glass-width',Math.max(50,Math.min(100,+data.glassWidth||98))+'%');
    const panelTop=Math.max(0,Math.min(125,+data.panelTopVh||100));
    const elementGap=Math.max(0,Math.min(120,Number.isFinite(+data.elementGap)?+data.elementGap:28));
    panel.style.setProperty('margin-top',(panelTop-100)+'vh','important');
    panel.style.setProperty('--v272-element-gap',elementGap+'px');
    panel.style.setProperty('--v324-audio-title-size',Math.max(72,Math.min(260,Number.isFinite(+data.audioHeroTitleSize)?+data.audioHeroTitleSize:188))+'px');
    panel.style.setProperty('--v324-audio-intro-size',Math.max(12,Math.min(60,Number.isFinite(+data.audioHeroIntroSize)?+data.audioHeroIntroSize:29))+'px');
    panel.style.setProperty('--v328-audio-intro-width',Math.max(220,Math.min(1000,Number.isFinite(+data.audioHeroIntroWidth)?+data.audioHeroIntroWidth:720))+'px');
    panel.style.setProperty('--v328-audio-kicker-size',Math.max(8,Math.min(32,Number.isFinite(+data.audioHeroKickerSize)?+data.audioHeroKickerSize:14))+'px');
    panel.style.setProperty('--v324-audio-small-size',Math.max(8,Math.min(28,Number.isFinite(+data.audioHeroSmallSize)?+data.audioHeroSmallSize:14))+'px');
    panel.style.setProperty('--v329-audio-button-scale',Math.max(.60,Math.min(1.80,(Number.isFinite(+data.audioHeroButtonScale)?+data.audioHeroButtonScale:100)/100)));
    panel.style.setProperty('--v330-audio-button-text-size',Math.max(8,Math.min(32,Number.isFinite(+data.audioHeroButtonTextSize)?+data.audioHeroButtonTextSize:14))+'px');
    panel.style.setProperty('--v330-audio-bottom-space',Math.max(0,Math.min(400,Number.isFinite(+data.audioHeroBottomSpace)?+data.audioHeroBottomSpace:70))+'px');
    panel.style.setProperty('--v324-audio-kicker-gap',Math.max(0,Math.min(100,Number.isFinite(+data.audioHeroKickerGap)?+data.audioHeroKickerGap:20))+'px');
    panel.style.setProperty('--v324-audio-title-gap',Math.max(0,Math.min(120,Number.isFinite(+data.audioHeroTitleGap)?+data.audioHeroTitleGap:18))+'px');
    panel.style.setProperty('--v324-audio-column-gap',Math.max(10,Math.min(180,Number.isFinite(+data.audioHeroColumnGap)?+data.audioHeroColumnGap:64))+'px');
    panel.style.setProperty('--v324-audio-side-top',Math.max(0,Math.min(220,Number.isFinite(+data.audioHeroSideTop)?+data.audioHeroSideTop:56))+'px');
    panel.style.setProperty('--v324-audio-button-pad-y',Math.max(6,Math.min(40,Number.isFinite(+data.audioHeroButtonPadY)?+data.audioHeroButtonPadY:16))+'px');
    panel.style.setProperty('--v324-audio-button-pad-x',Math.max(8,Math.min(60,Number.isFinite(+data.audioHeroButtonPadX)?+data.audioHeroButtonPadX:22))+'px');

    const heading=$('v194DetailsHeading');
    const intro=$('v194DetailsIntro');
    $('v194DetailsKicker').textContent=(meta?.isMain?'MAIN PAGE':(meta?.parentLabel||'PAGE DETAILS')).toUpperCase();
    heading.textContent=(data.title!==undefined&&data.title!==null)?String(data.title):String(meta?.title||'');
    heading.style.fontSize=(data.headingSize||62)+'px';
    heading.style.setProperty('--v197-page-heading',(data.headingSize||62)+'px');
    heading.style.color=data.headingColor||'#f1f1ef';
    heading.style.fontWeight=data.headingBold===false?'400':'700';
    heading.style.textDecoration=data.headingUnderline===true?'underline':'none';
    heading.style.textUnderlineOffset=data.headingUnderline===true?'.12em':'';
    heading.style.textDecorationThickness=data.headingUnderline===true?'0.06em':'';

    const headerBlocks=(data.blocks||[]).filter(b=>b.zone==='header');
    let headingCols=Math.max(4,Math.min(12,+data.headingCols||8));
    if(data.headingPosition==='full')headingCols=12;
    let headingStart=1;
    if(data.headingPosition==='center')headingStart=Math.floor((12-headingCols)/2)+1;
    if(data.headingPosition==='right')headingStart=13-headingCols;
    heading.style.setProperty('grid-column',`${headingStart} / span ${headingCols}`,'important');
    heading.style.setProperty('grid-row','2','important');

    intro.textContent=data.intro||'';
    const introOn=data.introEnabled===true;
    intro.style.display=introOn?'block':'none';
    intro.style.minHeight='';
    intro.style.fontSize=(data.introSize||17)+'px';
    intro.style.color=data.introColor||'#b8b8b5';
    intro.style.textDecoration=data.introUnderline===true?'underline':'none';
    intro.style.textUnderlineOffset=data.introUnderline===true?'.14em':'';
    intro.style.textDecorationThickness=data.introUnderline===true?'0.06em':'';
    if(introOn){
      const introCols=Math.max(2,Math.min(12,+data.introCols||4));
      let introStart=1,introRow=2;
      if(headerBlocks.length){
        // Header modules get first claim on the row beside the title.
        // The optional intro drops neatly below instead of blocking that space.
        introStart=Math.floor((12-introCols)/2)+1;
        introRow=3;
      }else if(data.headingPosition==='left' && headingStart+headingCols-1+introCols<=12){
        introStart=headingStart+headingCols;
      }else if(data.headingPosition==='right' && headingStart-introCols>=1){
        introStart=headingStart-introCols;
      }else{
        introStart=Math.floor((12-introCols)/2)+1;
        introRow=3;
      }
      intro.style.setProperty('grid-column',`${introStart} / span ${introCols}`,'important');
      intro.style.setProperty('grid-row',String(introRow),'important');
    }else{
      intro.style.removeProperty('grid-column');
      intro.style.removeProperty('grid-row');
    }

    const cols=12;
    grid.style.setProperty('--v194-cols','12');

    const safeBreaks=s=>esc(String(s||'')).replace(/\n/g,'<br>');
    const liveRender=liveOpen &&
      document.body.classList.contains('v199-live-details-edit') &&
      !document.body.classList.contains('performance-mode') &&
      !document.body.classList.contains('site-preview');

    const blockMarkup=(b,zone)=>{
      const headerZone=zone==='header';
      const span=Math.max(1,Math.min(12,+b.gridSpan||(+b.headerSpan||(+b.span||1)*3)||4));
      const startCol=Math.max(0,Math.min(12,+b.gridStart||0));
      const rowNo=Math.max(0,Math.min(40,+b.gridRow||0));
      const blockHeight=Math.max(0,Math.min(1800,+b.blockHeight||0));
      const isDivider=b.type==='divider';
      const isSectionCard=b.type==='sectioncard';
      const isAreaCard=isSectionCard&&b.cardMode==='area';
      const isGroupCard=isSectionCard&&b.cardMode==='group';
      const hasImg=!!b.image&&(b.type==='image'||b.type==='mixed');
      const rawBody=String(b.body||'').trim();
      const hasText=!['image','divider'].includes(b.type)&&(b.title||rawBody||liveOpen);
      const paragraphs=rawBody?rawBody.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean):[];
      const bulletLines=rawBody?rawBody.split(/\n+/).map(x=>x.trim()).filter(Boolean):[];
      const bulletLike=bulletLines.length>=2&&bulletLines.every(x=>/^(?:[*•-]\s+)/.test(x));
      const sideRows=b.type==='mixed'&&b.rowsBesideImage===true;
      const ruledRows=b.ruledRows===true||sideRows;
      const colonCount=paragraphs.filter(x=>x.includes(':')).length;
      const specLike=!headerZone&&!bulletLike&&!ruledRows&&paragraphs.length>=2 && colonCount>=Math.ceil(paragraphs.length*.45);
      const dense=rawBody.length>260||paragraphs.length>=5||bulletLines.length>=7;
      const statement=!headerZone&&!specLike&&!bulletLike&&!ruledRows&&!dense&&b.type==='text'&&rawBody.length>0&&rawBody.length<=165&&(+b.bodySize||15)>=17;
      const hasSubsections=Array.isArray(b.subsections)&&b.subsections.some(sub=>String(sub?.title||'').trim()||String(sub?.text||'').trim());
      const v313HoverableContent=!headerZone&&!isSectionCard&&!isDivider&&!hasImg&&b.type!=='image'&&(rawBody.length>0||hasSubsections);

      const classes=[
        'v194-detail-module',
        'v271-grid-module',
        'type-'+esc(b.type),
        'ratio-'+esc(b.ratio||'landscape'),
        headerZone?'v261-header-module':'',
        b.titleArrow===false?'v267-no-title-arrow':'',
        b.titleUnderline===true?'v284-title-underline':'',
        b.bodyUnderline===true?'v284-body-underline':'',
        b.listArrows===false?'v289-no-list-arrows':'',
        b.topLine===false?'v300-no-top-line':'',
        b.numberVisible===false?'v300-hide-number':'',
        String(b.numberText||'').trim()?'v303-custom-number':'',
        (b.boxEnabled===true||isSectionCard)?'v289-boxed':'',
        isSectionCard?'v290-card-'+(['left','center','right'].includes(b.cardAlign)?b.cardAlign:'left'):'',
        isAreaCard?'v292-area-card':'',
        isGroupCard?'v293-group-card':'',
        ruledRows?'v271-ruled-rows':'',
        sideRows?'v285-side-rows':'',
        specLike?'v197-spec':'',
        dense?'v197-dense':'',
        statement?'v197-statement':'',
        liveRender?'v199-live-module':'',
        v313HoverableContent?'v313-hoverable-content':''
      ].filter(Boolean).join(' ');

      let bodyMarkup='';
      if(hasText){
        if(bulletLike||ruledRows){
          const rows=bulletLines.map(row=>row.replace(/^(?:[*•-]\s+)/,'').trim()).filter(Boolean);
          bodyMarkup=`<div class="v197-spec-list v265-bullet-list">${
            rows.map((row,idx)=>`<div class="v197-spec-row">${b.listArrows===false?'':`<span class="v197-spec-arrow">↳</span>`}<span class="v265-bullet-text" data-live-part="bullet" data-live-bullet-index="${idx}">${safeBreaks(row)}</span></div>`).join('')
          }</div>`;
        }else if(specLike&&!liveRender){
          bodyMarkup=`<div class="v197-spec-list">${
            paragraphs.map(row=>`<div class="v197-spec-row">${b.listArrows===false?'':`<span class="v197-spec-arrow">↳</span>`}<span>${safeBreaks(row)}</span></div>`).join('')
          }</div>`;
        }else if(rawBody || (liveRender && !(Array.isArray(b.subsections)&&b.subsections.length))){
          bodyMarkup=`<p class="v197-body" data-live-part="body">${safeBreaks(rawBody)}</p>`;
        }
      }

      const v332SubsectionLayout=['stack','2','3','4','auto'].includes(String(b.subsectionLayout||''))?String(b.subsectionLayout):'stack';
      const subsectionMarkup=!isDivider&&Array.isArray(b.subsections)&&b.subsections.length?`<div class="v289-subsections v332-layout-${esc(v332SubsectionLayout)}">${b.subsections.map((sub,subIndex)=>{
        const subTitle=String(sub?.title||'').trim();
        const subText=String(sub?.text||'').trim();
        if(!subTitle&&!subText)return '';
        const subLines=subText?subText.split(/\n+/).map(x=>x.trim()).filter(Boolean):[];
        const subRows=subLines.length?`<div class="v289-subtext">${subLines.map((line,rowIndex)=>`<div class="v197-spec-row">${b.listArrows===false?'':`<span class="v197-spec-arrow">↳</span>`}<span class="v289-subtext-row" data-live-part="subtext" data-live-sub-index="${subIndex}" data-live-sub-row-index="${rowIndex}">${safeBreaks(line)}</span></div>`).join('')}</div>`:'';
        return `<section class="v289-subsection" data-v289-subsection="${subIndex}">${subTitle?`<h4 class="v289-subheading" data-live-part="subheading" data-live-sub-index="${subIndex}">${esc(subTitle)}</h4>`:''}${subRows}</section>`
      }).join('')}</div>`:'';

      const dividerMarkup=isDivider?`<div class="v288-divider-wrap v288-align-${esc(b.dividerAlign||'left')}"><span class="v288-divider-line" style="width:${Math.max(5,Math.min(100,+b.dividerLength||100))}%;height:${Math.max(1,Math.min(20,+b.dividerThickness||1))}px;background:${esc(b.dividerColor||'#4b4b4b')}"></span></div>`:'';

      const tools=liveRender?`<div class="v199-module-tools">
        <button type="button" data-v199-action="drag" draggable="true" title="Drag module">↕ MOVE</button>
        <button type="button" data-v199-action="zone" title="${headerZone?'Move below header':'Move beside title'}">${headerZone?'↓ CONTENT':'↑ HEADER'}</button>
        <button type="button" data-v199-action="narrow" title="Narrower">− WIDTH</button>
        <button type="button" data-v199-action="wider" title="Wider">+ WIDTH</button>
      </div>`:'';

      const colStart=startCol>0?Math.min(startCol,Math.max(1,13-span)):0;
      const rowSpan=isSectionCard?Math.max(1,Math.min(12,+b.cardRowSpan||1)):1;
      const rowStyle=isSectionCard
        ?(rowNo>0?`grid-row:${rowNo} / span ${rowSpan} !important;`:`grid-row:span ${rowSpan} !important;`)
        :(rowNo>0?`grid-row:${rowNo} !important;`:'');
      const areaStyle=isAreaCard
        ?`position:absolute !important;left:calc(${Math.max(-200,Math.min(200,Number.isFinite(+b.areaLeft)?+b.areaLeft:0))}% + ${Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0))}px) !important;top:${Math.max(0,Math.min(5000,Number.isFinite(+b.areaTop)?+b.areaTop:0))}px !important;width:${Math.max(5,Math.min(300,Number.isFinite(+b.areaWidth)?+b.areaWidth:100))}% !important;height:${Math.max(40,Math.min(3000,Number.isFinite(+b.areaHeight)?+b.areaHeight:320))}px !important;min-height:0 !important;grid-column:auto !important;grid-row:auto !important;`
        :'';
      const groupStyle=isGroupCard
        ?`position:absolute !important;left:0 !important;top:0 !important;width:100px !important;height:80px !important;min-height:0 !important;grid-column:auto !important;grid-row:auto !important;`
        :'';
      const widthStyle=isAreaCard?areaStyle:(isGroupCard?groupStyle:((colStart>0
        ?`grid-column:${colStart} / span ${span} !important;`
        :`grid-column:span ${span} !important;`)+
        rowStyle+
        (blockHeight>0?`min-height:${blockHeight}px !important;`:'')+
        `--v261-header-span:${span};`+
        (isSectionCard?`transform:translateX(${Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0))}px) !important;`:'') ));
      return `<article class="${classes}" data-block-id="${esc(b.id)}" data-v303-number="${esc(String(b.numberText||'').trim())}" data-v311-manual-height="${(isSectionCard&&b.cardMode==='area'&&b.areaAutoFitHeight!==true)?'1':'0'}" data-zone="${headerZone?'header':'content'}" data-span="${span}" data-v271-start="${colStart||'auto'}" data-v271-row="${rowNo||'auto'}" data-v292-area-top="${isAreaCard?Math.max(0,Math.min(5000,Number.isFinite(+b.areaTop)?+b.areaTop:0)):''}" data-v292-area-height="${isAreaCard?Math.max(40,Math.min(3000,Number.isFinite(+b.areaHeight)?+b.areaHeight:320)):''}" style="
          ${widthStyle}
          --v197-color:${esc(b.color||'#e2e2df')};
          --v197-title-size:${+b.titleSize||28}px;
          --v197-body-size:${+b.bodySize||15}px;
          --v197-title-weight:${b.bold===false?400:700};
          --v300-number-size:${Math.max(5,Math.min(32,Number.isFinite(+b.numberSize)?+b.numberSize:7))}px;
          --v300-number-color:${esc(b.numberColor||'#4c4c4b')};
          --v294-subheading-size:${Math.max(8,Math.min(48,Number.isFinite(+b.subheadingSize)?+b.subheadingSize:9))}px;
          --v294-subheading-color:${esc(b.subheadingColor||'#838380')};
          --v305-subheading-text-gap:${Math.max(0,Math.min(30,Number.isFinite(+b.subheadingTextGap)?+b.subheadingTextGap:3))}px;
          --v305-subsection-gap:${Math.max(0,Math.min(40,Number.isFinite(+b.subsectionGap)?+b.subsectionGap:6))}px;
          --v296-row-pad:${Math.max(0,Math.min(40,Number.isFinite(+b.rowPadding)?+b.rowPadding:10))}px;
          --v306-row-min-height:${Math.max(0,Math.min(60,Number.isFinite(+b.rowMinHeight)?+b.rowMinHeight:0))}px;
          --v306-title-content-gap:${Math.max(0,Math.min(50,Number.isFinite(+b.titleContentGap)?+b.titleContentGap:4))}px;
          --v303-list-gap:${Math.max(0,Math.min(40,Number.isFinite(+b.listGap)?+b.listGap:0))}px;
          --v303-list-line-height:${Math.max(.95,Math.min(2.2,Number.isFinite(+b.listLineHeight)?+b.listLineHeight:1.2))};
          margin-bottom:${Math.max(-80,Math.min(300,Number.isFinite(+b.blockGap)?+b.blockGap:0))}px;
          --v289-box-radius:${Math.max(0,Math.min(80,+b.boxRadius||32))}px;
          --v289-box-padding:${Math.max(0,Math.min(80,Number.isFinite(+b.boxPadding)?+b.boxPadding:24))}px;
          --v289-box-border-width:${Math.max(0,Math.min(8,Number.isFinite(+b.boxBorderWidth)?+b.boxBorderWidth:1))}px;
          --v289-box-border:${esc(b.boxBorderColor||'#3d3d3d')};
          --v290-border-opacity:${Math.max(0,Math.min(100,Number.isFinite(+b.boxBorderOpacity)?+b.boxBorderOpacity:100))}%;
          --v290-card-width:${Math.max(5,Math.min(300,Number.isFinite(+b.cardWidth)?+b.cardWidth:100))}%;
          --v290-card-height:${Math.max(0,+b.blockHeight||0)>0?Math.min(1800,+b.blockHeight)+'px':'220px'};
          --v289-box-bg:${esc(b.boxBackground||'#0b0b0c')};
          --v289-box-opacity:${Math.max(0,Math.min(100,Number.isFinite(+b.boxOpacity)?+b.boxOpacity:75))}%;
        ">
        ${tools}
        ${isSectionCard&&liveRender?`<div class="v290-card-placeholder">${isAreaCard?'AREA BOX':(isGroupCard?'GROUPED SECTION':'SECTION CARD')} · CLICK TO EDIT</div>`:''}
        ${dividerMarkup}
        ${hasImg?`<img src="${esc(b.image)}" alt="${esc(b.title||meta?.title||'Venue image')}" data-live-part="image">`:''}
        ${(!isSectionCard&&(liveRender||b.title))?`<h3 data-live-part="title">${esc(b.title||'')}</h3>`:''}
        ${subsectionMarkup}
        ${bodyMarkup}
      </article>`
    };

    head.querySelectorAll('.v261-header-module').forEach(el=>el.remove());
    if(headerBlocks.length){
      head.insertAdjacentHTML('beforeend',headerBlocks.map(b=>blockMarkup(b,'header')).join(''))
    }
    const contentBlocks=(data.blocks||[]).filter(b=>b.zone!=='header');
    const contentMap=new Map(contentBlocks.map(b=>[b.id,b]));
    const indexMap=new Map(contentBlocks.map((b,i)=>[b.id,i]));
    const effectiveKey=b=>{
      const span=Math.max(1,Math.min(12,+b.gridSpan||(+b.headerSpan||(+b.span||1)*3)||4));
      const start=Math.max(0,Math.min(12,+b.gridStart||0));
      return `${start}|${span}`
    };

    // V287: explicit STACK UNDER takes priority. This avoids relying on source order.
    const parentOf={};
    contentBlocks.filter(b=>b.type!=='sectioncard').forEach(b=>{
      const pid=String(b.stackParentId||'');
      if(pid&&pid!==b.id&&contentMap.has(pid)&&contentMap.get(pid)?.type!=='sectioncard')parentOf[b.id]=pid;
    });

    // Backwards-compatible AUTO mode: determine the visual previous block in the same column.
    const columns={};
    contentBlocks.forEach((b,i)=>{
      if(b.type==='sectioncard')return;
      const key=effectiveKey(b);
      (columns[key]||(columns[key]=[])).push({b,i});
    });
    Object.values(columns).forEach(items=>{
      items.sort((a,c)=>{
        const ar=+a.b.gridRow||0, cr=+c.b.gridRow||0;
        if(ar&&cr&&ar!==cr)return ar-cr;
        if(ar&&!cr)return -1;
        if(!ar&&cr)return 1;
        return a.i-c.i;
      });
      let prev=null;
      items.forEach(({b})=>{
        if(!parentOf[b.id]&&b.stackBelowPrevious===true&&prev)parentOf[b.id]=prev.id;
        prev=b;
      });
    });

    const rootOf=id=>{
      let cur=id, seen=new Set();
      while(parentOf[cur]&&contentMap.has(parentOf[cur])&&!seen.has(cur)){
        seen.add(cur);cur=parentOf[cur]
      }
      return cur
    };
    const depthOf=id=>{
      let d=0,cur=id,seen=new Set();
      while(parentOf[cur]&&contentMap.has(parentOf[cur])&&!seen.has(cur)&&d<50){
        seen.add(cur);cur=parentOf[cur];d++
      }
      return d
    };
    const groups={};
    contentBlocks.forEach(b=>{
      if(b.type==='sectioncard')return;
      if(parentOf[b.id]){
        const root=rootOf(b.id);
        if(!groups[root])groups[root]=[];
        const rb=contentMap.get(root);
        if(rb&&!groups[root].some(x=>x.id===rb.id))groups[root].push(rb);
        if(!groups[root].some(x=>x.id===b.id))groups[root].push(b);
      }
    });
    Object.keys(groups).forEach(root=>{
      groups[root].sort((a,c)=>depthOf(a.id)-depthOf(c.id)||(indexMap.get(a.id)||0)-(indexMap.get(c.id)||0));
    });

    const emitted=new Set();
    const contentMarkup=[];
    contentBlocks.forEach(b=>{
      const root=parentOf[b.id]?rootOf(b.id):(groups[b.id]?b.id:'');
      if(root){
        if(emitted.has(root))return;
        emitted.add(root);
        const members=groups[root]||[b];
        const first=members[0];
        const span=Math.max(1,Math.min(12,+first.gridSpan||(+first.headerSpan||(+first.span||1)*3)||4));
        const startCol=Math.max(0,Math.min(12,+first.gridStart||0));
        const rowNo=Math.max(0,Math.min(40,+first.gridRow||0));
        const colStart=startCol>0?Math.min(startCol,Math.max(1,13-span)):0;
        const wrapperStyle=(colStart>0
          ?`grid-column:${colStart} / span ${span} !important;`
          :`grid-column:span ${span} !important;`)+
          (rowNo>0?`grid-row:${rowNo} !important;`:'');
        contentMarkup.push(`<div class="v286-column-stack" data-v286-stack-root="${esc(root)}" style="${wrapperStyle}">${members.map(x=>blockMarkup(x,'content')).join('')}</div>`);
      }else{
        contentMarkup.push(blockMarkup(b,'content'));
      }
    });
    grid.innerHTML=contentMarkup.join('');

    v307AutoFitAreaCards();
    requestAnimationFrame(v307AutoFitAreaCards);

    // AREA BOXES are absolute background layers, so reserve enough content height for them.
    let v292AreaBottom=0;
    grid.querySelectorAll('.type-sectioncard.v292-area-card').forEach(el=>{
      const top=Number(el.dataset.v292AreaTop)||el.offsetTop||0;
      const height=Number(el.dataset.v292AreaHeight)||el.offsetHeight||0;
      v292AreaBottom=Math.max(v292AreaBottom,top+height);
    });
    if(v292AreaBottom>0)grid.style.minHeight=Math.max(grid.scrollHeight,v292AreaBottom)+'px';
    else grid.style.removeProperty('min-height');

    v293PositionGroupedSections();
    requestAnimationFrame(v293PositionGroupedSections);
    requestAnimationFrame(()=>requestAnimationFrame(v313SetupPreviewSectionHover));
    requestAnimationFrame(()=>window.v324SyncAudioHero?.());
    applyLiveEditableState();
    updateSelectionUI()
  }



  function v313ClearSectionHover(){
    const grid=$('v194DetailsGrid');if(!grid)return;
    if(grid._v313PointerMove)grid.removeEventListener('pointermove',grid._v313PointerMove);
    if(grid._v313PointerLeave)grid.removeEventListener('pointerleave',grid._v313PointerLeave);
    grid._v313PointerMove=null;
    grid._v313PointerLeave=null;
    grid.querySelectorAll('.v313-section-hover-frame,.v315-content-hover-overlay').forEach(el=>el.remove());
    grid.querySelectorAll('.v313-section-title-active').forEach(el=>el.classList.remove('v313-section-title-active'));
    grid.querySelectorAll('.v317-section-border-active').forEach(el=>el.classList.remove('v317-section-border-active'));
    grid._v313Sections=[];
    grid._v315HoverTarget=null;
  }

  function v313SetupPreviewSectionHover(){
    const grid=$('v194DetailsGrid');
    if(!grid)return;
    v313ClearSectionHover();

    const id=activePageId||editorPageId;
    const previewMode=document.body.classList.contains('performance-mode') &&
      document.body.classList.contains('site-preview') &&
      !document.body.classList.contains('v199-live-details-edit');

    if(!previewMode||id!=='submenu_mtzyx7bz_wcw6')return;

    const byId=bid=>grid.querySelector(`.v194-detail-module[data-block-id="${CSS.escape(bid)}"]`);
    const gridRect=grid.getBoundingClientRect();

    const unionRect=(els,pad=0)=>{
      const rects=els.filter(Boolean).map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
      if(!rects.length)return null;
      const left=Math.min(...rects.map(r=>r.left))-gridRect.left-pad;
      const top=Math.min(...rects.map(r=>r.top))-gridRect.top-pad;
      const right=Math.max(...rects.map(r=>r.right))-gridRect.left+pad;
      const bottom=Math.max(...rects.map(r=>r.bottom))-gridRect.top+pad;
      return {left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
    };

    const areaRect=(areaId,inset=1)=>{
      const el=byId(areaId);if(!el)return null;
      const r=el.getBoundingClientRect();
      return {
        left:r.left-gridRect.left+inset,
        top:r.top-gridRect.top+inset,
        width:Math.max(1,r.width-(inset*2)),
        height:Math.max(1,r.height-(inset*2))
      };
    };

    /* Large section geometry. */
    const backlineRect=unionRect([
      byId('detail_mu940atq_ftwd9'),
      byId('seed_house_dj_equipment'),
      byId('detail_mu9bg8m2_bzzkd'),
      byId('seed_band_backline'),
      byId('seed_microphones_stands')
    ],22);

    const sections=[
      {
        key:'audio-system',
        titleId:'detail_mu93ucvk_8n3fu',
        borderSourceId:'detail_mu9slp6o_yhttu',
        rect:areaRect('detail_mu9slp6o_yhttu',1)
      },
      {
        key:'backline',
        titleId:'detail_mu940atq_ftwd9',
        borderSourceId:null,
        rect:backlineRect
      },
      {
        key:'venue-access',
        titleId:'detail_mu9zb6k0_fsefx',
        borderSourceId:'detail_mu9p09f3_wyxs1',
        rect:areaRect('detail_mu9p09f3_wyxs1',1)
      }
    ].filter(s=>s.rect);

    sections.forEach(section=>{
      const frame=document.createElement('div');
      frame.className='v313-section-hover-frame '+(section.borderSourceId?'v317-existing-border-helper':'v317-backline-frame');
      frame.dataset.v313Section=section.key;
      frame.style.left=section.rect.left+'px';
      frame.style.top=section.rect.top+'px';
      frame.style.width=section.rect.width+'px';
      frame.style.height=section.rect.height+'px';
      frame.style.borderRadius='5px';
      grid.appendChild(frame);
      section.frame=frame;
      section.titleEl=section.titleId?byId(section.titleId):null;
      section.borderEl=section.borderSourceId?byId(section.borderSourceId):null;
      section.borderEl?.classList.add('v317-existing-section-border');
    });

    /* One shared content overlay prevents the skew caused by per-module
       pseudo-elements and old minimum-height/padding rules. */
    const contentOverlay=document.createElement('div');
    contentOverlay.className='v315-content-hover-overlay';
    grid.appendChild(contentOverlay);

    /* Band and Mics already have dedicated visible Area Boxes. For those,
       use the real border geometry exactly. */
    const exactBorderMap={
      'seed_band_backline':'detail_mu9tnrz4_hbieu',
      'seed_microphones_stands':'detail_mu9p0p4w_5zb3v'
    };
    const sharedDjStageCardId='detail_mu9trblm_kwoo6';

    const visibleMeaningfulChildren=el=>{
      const selectors=[
        ':scope > h3',
        ':scope > .v197-body',
        ':scope > .v197-spec-list',
        ':scope > .v289-subsections'
      ];
      return selectors.flatMap(sel=>[...el.querySelectorAll(sel)]).filter(node=>{
        const cs=getComputedStyle(node);
        const r=node.getBoundingClientRect();
        if(cs.display==='none'||cs.visibility==='hidden'||r.width<=0||r.height<=0)return false;
        if(node.classList.contains('v197-body')&&!String(node.textContent||'').trim())return false;
        return true;
      });
    };

    const preciseContentRect=el=>{
      const moduleRect=el.getBoundingClientRect();
      const blockId=el.dataset.blockId||'';
      const exactCardId=exactBorderMap[blockId];

      /* DJ + Stage Monitoring share one rounded card.
         Use the shared card's exact inside left/right edges, then split the
         vertical space using the live positions of the two content modules.
         This prevents either hover wash from drifting a few pixels sideways. */
      if(blockId==='seed_house_dj_equipment'||blockId==='detail_mu9bg8m2_bzzkd'){
        const card=byId(sharedDjStageCardId);
        const dj=byId('seed_house_dj_equipment');
        const stage=byId('detail_mu9bg8m2_bzzkd');
        if(card&&dj&&stage){
          const cr=card.getBoundingClientRect();
          const dr=dj.getBoundingClientRect();
          const sr=stage.getBoundingClientRect();

          const insideLeft=cr.left-gridRect.left+1;
          const insideRight=cr.right-gridRect.left-1;

          /* Split halfway through the actual visual gap between DJ and Stage. */
          const split=(dr.bottom+sr.top)/2;

          let top,bottom;
          if(blockId==='seed_house_dj_equipment'){
            top=cr.top-gridRect.top+1;
            bottom=Math.min(split,cr.bottom-1)-gridRect.top;
          }else{
            top=Math.max(split,cr.top+1)-gridRect.top;
            /* Only highlight the Stage Monitoring content area, not the
               unused blank lower half of the shared card. */
            const meaningful=visibleMeaningfulChildren(stage);
            const stageContentBottom=meaningful.length
              ? Math.max(...meaningful.map(n=>n.getBoundingClientRect().bottom))+10
              : sr.bottom;
            bottom=Math.min(stageContentBottom,cr.bottom-1)-gridRect.top;
          }

          return {
            left:insideLeft,
            top,
            width:Math.max(1,insideRight-insideLeft),
            height:Math.max(1,bottom-top)
          };
        }
      }

      /* If this content has its own actual visible border box, follow that
         box exactly, inset by 1px so the wash never sits over the stroke. */
      if(exactCardId){
        const card=byId(exactCardId);
        if(card){
          const r=card.getBoundingClientRect();
          return {
            left:r.left-gridRect.left+1,
            top:r.top-gridRect.top+1,
            width:Math.max(1,r.width-2),
            height:Math.max(1,r.height-2)
          };
        }
      }

      const meaningful=visibleMeaningfulChildren(el);
      if(!meaningful.length)return null;

      const rects=meaningful.map(node=>node.getBoundingClientRect());
      const contentTop=Math.min(...rects.map(r=>r.top));
      const contentBottom=Math.max(...rects.map(r=>r.bottom));

      /* Keep the full column width, but only the vertical height actually
         occupied by the title/list/subsections. This removes phantom empty
         space from legacy min-height/grid sizing. */
      let left=moduleRect.left-gridRect.left;
      let right=moduleRect.right-gridRect.left;
      let top=Math.min(moduleRect.top,contentTop)-gridRect.top;
      let bottom=Math.min(moduleRect.bottom,contentBottom+10)-gridRect.top;

      /* Clamp the highlight to its large section frame if one is underneath,
         so it can never bleed outside the section border. */
      const cx=(moduleRect.left+moduleRect.right)/2;
      const cy=(contentTop+contentBottom)/2;
      for(const section of sections){
        const sr=section.frame.getBoundingClientRect();
        if(cx>=sr.left&&cx<=sr.right&&cy>=sr.top&&cy<=sr.bottom){
          left=Math.max(left,sr.left-gridRect.left+2);
          right=Math.min(right,sr.right-gridRect.left-2);
          top=Math.max(top,sr.top-gridRect.top+2);
          bottom=Math.min(bottom,sr.bottom-gridRect.top-2);
          break;
        }
      }

      return {
        left,
        top,
        width:Math.max(1,right-left),
        height:Math.max(1,bottom-top)
      };
    };

    const setContentHover=target=>{
      if(!target){
        contentOverlay.classList.remove('v315-active');
        grid._v315HoverTarget=null;
        return;
      }
      const rect=preciseContentRect(target);
      if(!rect){
        contentOverlay.classList.remove('v315-active');
        grid._v315HoverTarget=null;
        return;
      }
      contentOverlay.style.left=rect.left+'px';
      contentOverlay.style.top=rect.top+'px';
      contentOverlay.style.width=rect.width+'px';
      contentOverlay.style.height=rect.height+'px';
      contentOverlay.style.borderRadius='5px';
      contentOverlay.classList.add('v315-active');
      grid._v315HoverTarget=target;
    };

    const setActiveSection=active=>{
      sections.forEach(s=>{
        const on=s===active;
        s.frame?.classList.toggle('v313-section-active',on);
        s.titleEl?.classList.toggle('v313-section-title-active',on);
        s.borderEl?.classList.toggle('v317-section-border-active',on);
      });
    };

    const pointerMove=e=>{
      const x=e.clientX,y=e.clientY;

      let activeSection=null;
      for(const s of sections){
        const r=s.frame.getBoundingClientRect();
        if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){activeSection=s;break}
      }
      setActiveSection(activeSection);

      const hoverTarget=e.target.closest?.('.v194-detail-module.v313-hoverable-content');
      if(hoverTarget&&grid.contains(hoverTarget)){
        if(grid._v315HoverTarget!==hoverTarget)setContentHover(hoverTarget);
      }else{
        setContentHover(null);
      }
    };

    const pointerLeave=()=>{
      setActiveSection(null);
      setContentHover(null);
    };

    grid._v313Sections=sections;
    grid._v313PointerMove=pointerMove;
    grid._v313PointerLeave=pointerLeave;
    grid.addEventListener('pointermove',pointerMove);
    grid.addEventListener('pointerleave',pointerLeave);
  }

  function v307AutoFitAreaCards(){
    const id=liveOpen?(editorPageId||activePageId):(activePageId||editorPageId);
    const p=getPage(id,false),grid=$('v194DetailsGrid');
    if(!p||!grid)return;
    const gridRect=grid.getBoundingClientRect();

    (p.blocks||[]).filter(b=>b.type==='sectioncard'&&b.cardMode==='area'&&b.areaAutoFitHeight===true).forEach(b=>{
      const card=grid.querySelector(`.v194-detail-module[data-block-id="${CSS.escape(b.id)}"]`);
      if(!card)return;

      const cardRect=card.getBoundingClientRect();
      const candidates=[...grid.querySelectorAll('.v194-detail-module:not(.type-sectioncard)')].filter(el=>{
        const r=el.getBoundingClientRect();
        if(r.width<=0||r.height<=0)return false;
        const xOverlap=Math.max(0,Math.min(cardRect.right,r.right)-Math.max(cardRect.left,r.left));
        const xRatio=xOverlap/Math.max(1,Math.min(cardRect.width,r.width));
        const cy=(r.top+r.bottom)/2;
        return xRatio>=0.38 && cy>=cardRect.top-24 && cy<=cardRect.bottom+24;
      });

      if(!candidates.length)return;

      const rects=candidates.map(el=>el.getBoundingClientRect());
      const pad=Math.max(0,Math.min(80,Number.isFinite(+b.boxPadding)?+b.boxPadding:24));
      const top=Math.min(...rects.map(r=>r.top))-gridRect.top-pad;
      const bottom=Math.max(...rects.map(r=>r.bottom))-gridRect.top+pad;
      const safeTop=Math.max(0,top);
      const safeHeight=Math.max(40,bottom-safeTop);

      card.style.setProperty('top',safeTop+'px','important');
      card.style.setProperty('height',safeHeight+'px','important');
      card.dataset.v292AreaTop=String(safeTop);
      card.dataset.v292AreaHeight=String(safeHeight);
    });
  }

  function v293PositionGroupedSections(){
    const id=liveOpen?(editorPageId||activePageId):(activePageId||editorPageId);
    const p=getPage(id,false),grid=$('v194DetailsGrid');
    if(!p||!grid)return;
    const gridRect=grid.getBoundingClientRect();
    (p.blocks||[]).filter(b=>b.type==='sectioncard'&&b.cardMode==='group').forEach(b=>{
      const card=grid.querySelector(`.v194-detail-module[data-block-id="${CSS.escape(b.id)}"]`);if(!card)return;
      const ids=Array.isArray(b.groupMembers)?b.groupMembers:[];
      const els=ids.map(mid=>grid.querySelector(`.v194-detail-module[data-block-id="${CSS.escape(mid)}"]`)).filter(Boolean);
      if(!els.length){card.style.setProperty('left','0px','important');card.style.setProperty('top','0px','important');card.style.setProperty('width','220px','important');card.style.setProperty('height','80px','important');return}
      const rects=els.map(el=>el.getBoundingClientRect());
      const pad=Math.max(0,Math.min(80,Number.isFinite(+b.boxPadding)?+b.boxPadding:24));
      const extraW=Math.max(0,Math.min(800,Number.isFinite(+b.groupExtraWidth)?+b.groupExtraWidth:0));
      const extraH=Math.max(0,Math.min(1200,Number.isFinite(+b.groupExtraHeight)?+b.groupExtraHeight:0));
      const memberLeft=Math.min(...rects.map(r=>r.left))-gridRect.left;
      const memberTop=Math.min(...rects.map(r=>r.top))-gridRect.top;
      const memberRight=Math.max(...rects.map(r=>r.right))-gridRect.left;
      const memberBottom=Math.max(...rects.map(r=>r.bottom))-gridRect.top;
      const rawLeft=memberLeft-pad-(extraW/2);
      const rawTop=memberTop-pad-(extraH/2);
      const left=rawLeft+Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0));
      const top=Math.max(0,rawTop);
      const right=memberRight+pad+(extraW/2);
      const bottom=memberBottom+pad+(extraH/2);
      card.style.setProperty('left',left+'px','important');card.style.setProperty('top',top+'px','important');card.style.setProperty('width',Math.max(40,right-left)+'px','important');card.style.setProperty('height',Math.max(40,bottom-top)+'px','important');
      els.forEach(el=>el.classList.add('v293-group-member'))
    })
  }


  let v313ResizeTimer=0;
  const v313RefreshSectionHover=()=>{
    clearTimeout(v313ResizeTimer);
    v313ResizeTimer=setTimeout(()=>v313SetupPreviewSectionHover(),80);
  };
  window.addEventListener('resize',v313RefreshSectionHover);
  window.addEventListener('scroll',v313RefreshSectionHover,{passive:true});

  function activateContentPage(id,scrollTop=true){
    if(!DETAIL_PAGE_SET.has(id)){
      deactivateDetails();
      return
    }
    const meta=contentMeta(id);
    if(!meta){
      activePageId='';
      if(!liveOpen)document.body.classList.remove('v194-submenu-details-active');
      return
    }

    // V259: Page Details exist only for Green Room, Audio, Lighting and Visuals.
    // Editing content on one of those pages enables its public scroll-down sheet.
    // public scroll-down glass sheet. Editing/adding content enables a page.
    editorPageId=id;
    refreshPageSelect(id);
    syncPageEditor();

    if(!pageDetailsEnabled(id)){
      activePageId='';
      if(!liveOpen)document.body.classList.remove('v194-submenu-details-active');
      return
    }

    activePageId=id;
    document.body.classList.add('v194-submenu-details-active');
    renderActiveDetails();
    if(scrollTop){
      try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
    }
  }

  function deactivateDetails(){
    activePageId='';
    if(!liveOpen)document.body.classList.remove('v194-submenu-details-active');
  }

  function setGlassWidthForCurrentPage(value){
    const p=currentEditorPage();if(!p)return;
    const width=Math.max(50,Math.min(100,+value||98));
    p.glassWidth=width;
    if($('v258GlassWidth'))$('v258GlassWidth').value=String(width);
    if($('v258GlassWidthNumber'))$('v258GlassWidthNumber').value=String(width);
    if($('v258GlassWidthValue'))$('v258GlassWidthValue').textContent=Math.round(width)+'%';
    persist();
    renderActiveDetails();
  }

  function resetGlassWidthForCurrentPage(){setGlassWidthForCurrentPage(98)}

  function setGlassCenteredForCurrentPage(on){
    const p=currentEditorPage();if(!p)return;
    p.glassCentered=!!on;
    if($('v312GlassCentered'))$('v312GlassCentered').checked=!!on;
    persist();renderActiveDetails();
  }

  function setGlassOffsetXForCurrentPage(value){
    const p=currentEditorPage();if(!p)return;
    let x=+value;if(!Number.isFinite(x))x=0;
    x=Math.max(-1200,Math.min(1200,x));
    p.glassOffsetX=x;
    if($('v312GlassShiftX'))$('v312GlassShiftX').value=String(x);
    if($('v312GlassShiftValue'))$('v312GlassShiftValue').textContent=(x>0?'+':'')+Math.round(x)+'px';
    persist();renderActiveDetails();
  }

  function nudgeGlassOffsetX(delta){
    const p=currentEditorPage();if(!p)return;
    const current=Math.max(-1200,Math.min(1200,Number.isFinite(+p.glassOffsetX)?+p.glassOffsetX:0));
    setGlassOffsetXForCurrentPage(current+delta);
  }

  function centerWholeGlassBox(){
    const p=currentEditorPage();if(!p)return;
    p.glassCentered=true;
    p.glassOffsetX=0;
    if($('v312GlassCentered'))$('v312GlassCentered').checked=true;
    if($('v312GlassShiftX'))$('v312GlassShiftX').value='0';
    if($('v312GlassShiftValue'))$('v312GlassShiftValue').textContent='0px';
    persist();renderActiveDetails();
    setStatus('WHOLE GLASS BOX CENTERED');
  }

  function setPreviewWidthForCurrentPage(value){
    const p=currentEditorPage();if(!p)return;
    let width=+value;if(!Number.isFinite(width))width=1280;
    width=Math.max(900,Math.min(1800,width));
    p.previewCanvasWidth=width;
    if($('v309PreviewWidth'))$('v309PreviewWidth').value=String(width);
    if($('v309PreviewWidthNumber'))$('v309PreviewWidthNumber').value=String(width);
    if($('v309PreviewWidthValue'))$('v309PreviewWidthValue').textContent=Math.round(width)+'px';
    persist();renderActiveDetails();
  }
  function setPreviewWidthLockForCurrentPage(on){
    const p=currentEditorPage();if(!p)return;
    p.lockPreviewWidth=!!on;
    if($('v309LockPreviewWidth'))$('v309LockPreviewWidth').checked=!!on;
    persist();renderActiveDetails();
  }
  function resetPreviewWidthForCurrentPage(){setPreviewWidthForCurrentPage(1280)}

  function setPanelTopForCurrentPage(value){
    const p=currentEditorPage();if(!p)return;
    const top=Math.max(0,Math.min(125,Number.isFinite(+value)?+value:100));
    p.panelTopVh=top;
    if($('v272PanelTop'))$('v272PanelTop').value=String(top);
    if($('v272PanelTopNumber'))$('v272PanelTopNumber').value=String(top);
    if($('v272PanelTopValue'))$('v272PanelTopValue').textContent=Math.round(top)+'vh';
    persist();renderActiveDetails();
  }
  function resetPanelTopForCurrentPage(){setPanelTopForCurrentPage(100)}

  function setElementGapForCurrentPage(value){
    const p=currentEditorPage();if(!p)return;
    let gap=+value;if(!Number.isFinite(gap))gap=28;
    gap=Math.max(0,Math.min(120,gap));
    p.elementGap=gap;
    if($('v272ElementGap'))$('v272ElementGap').value=String(gap);
    if($('v272ElementGapNumber'))$('v272ElementGapNumber').value=String(gap);
    if($('v272ElementGapValue'))$('v272ElementGapValue').textContent=Math.round(gap)+'px';
    persist();renderActiveDetails();
  }
  function resetElementGapForCurrentPage(){setElementGapForCurrentPage(28)}

  function selectEditorPage(id){
    refreshPageSelect(id);
    editorPageId=$('v194DetailsSubmenu')?.value||id||'';
    activePageId=editorPageId;
    activeBlockId='';
    liveSelection={kind:'page',part:'heading',blockId:''};
    syncPageEditor();
    if(liveOpen)renderActiveDetails()
  }

  function syncLiveEditorToggle(){
    const btn=$('v200LiveEditorToggle');
    const label=$('v200LiveEditorToggleLabel');
    if(btn){
      btn.classList.toggle('on',!!liveOpen);
      btn.setAttribute('aria-pressed',liveOpen?'true':'false');
    }
    if(label)label.textContent=liveOpen
      ?'LIVE PAGE EDITOR · ON · CLICK TO RETURN TO FLOOR PLAN'
      :'LIVE PAGE EDITOR · OFF';
    const secondary=$('v194PreviewPage');
    if(secondary)secondary.textContent=liveOpen?'RETURN TO FLOOR PLAN':'OPEN LIVE EDITOR';
  }

  function openLiveEditor(){
    if(liveOpen){syncLiveEditorToggle();return}
    liveOpen=true;
    document.body.classList.add('v199-live-details-edit','v194-submenu-details-active');
    activePageId=editorPageId||$('v194DetailsSubmenu')?.value||'';
    renderActiveDetails();
    syncLiveEditorToggle();
    setTimeout(()=>$('v194SubmenuDetailsPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),60)
  }

  function closeLiveEditor(){
    if(!liveOpen){syncLiveEditorToggle();return}
    liveOpen=false;
    document.body.classList.remove('v199-live-details-edit');
    document.body.classList.remove('v194-submenu-details-active');

    // Return immediately to the normal floor-plan editing canvas.
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
    try{if(typeof markRenderDirty==='function')markRenderDirty(300)}catch(e){}

    renderActiveDetails();
    syncLiveEditorToggle()
  }

  function toggleLiveEditor(){
    if(liveOpen)closeLiveEditor();
    else openLiveEditor();
  }

  function applyLiveEditableState(){
    const panel=$('v194SubmenuDetailsPanel');if(!panel)return;
    const liveRender=liveOpen &&
      document.body.classList.contains('v199-live-details-edit') &&
      !document.body.classList.contains('performance-mode') &&
      !document.body.classList.contains('site-preview');
    panel.classList.toggle('v199-live-active',liveRender);
    const heading=$('v194DetailsHeading'),intro=$('v194DetailsIntro');
    const editableValue=liveRender?'plaintext-only':'false';
    if(heading){
      heading.setAttribute('contenteditable',editableValue);
      heading.dataset.livePagePart='heading';
      heading.spellcheck=false
    }
    if(intro){
      intro.setAttribute('contenteditable',editableValue);
      intro.dataset.livePagePart='intro';
      intro.spellcheck=false
    }
    panel.querySelectorAll('.v199-live-module h3,.v199-live-module .v197-body,.v199-live-module [data-live-part="bullet"],.v199-live-module .v289-subheading,.v199-live-module [data-live-part="subtext"]').forEach(el=>{
      el.setAttribute('contenteditable',editableValue);
      el.spellcheck=false
    })
  }

  function selectLiveTarget(el){
    if(!liveOpen||!el)return;
    const pagePart=el.dataset?.livePagePart;
    if(pagePart){
      liveSelection={kind:'page',part:pagePart,blockId:''};
      activeBlockId='';
      syncPageEditor();updateSelectionUI();return
    }
    const module=el.closest?.('.v194-detail-module[data-block-id]');
    if(!module)return;
    activeBlockId=module.dataset.blockId||'';
    const part=el.dataset?.livePart||(
      el.closest?.('[data-live-part]')?.dataset?.livePart
    )||'module';
    const bulletIndex=part==='bullet'?Math.max(0,parseInt(el.dataset?.liveBulletIndex||'0',10)||0):null;
    const subIndex=(part==='subheading'||part==='subtext')?Math.max(0,parseInt(el.dataset?.liveSubIndex||'0',10)||0):null;
    const subRowIndex=part==='subtext'?Math.max(0,parseInt(el.dataset?.liveSubRowIndex||'0',10)||0):null;
    liveSelection={kind:'block',part,blockId:activeBlockId,bulletIndex,subIndex,subRowIndex};
    syncBlockSelect();updateSelectionUI()
  }

  function commitLiveText(el){
    if(!liveOpen||!el)return;
    const p=currentEditorPage();if(!p)return;
    p.enabled=true;
    const typed=String(el.innerText||'').replace(/\u00a0/g,' ').replace(/\r/g,'');
    if(el.dataset?.livePagePart==='heading'){
      p.title=typed;
      $('v194PageHeading').value=p.title;
      persist();setStatus('AUTO-SAVED TITLE');syncQuickTextEditor();return
    }
    if(el.dataset?.livePagePart==='intro'){
      p.intro=typed;
      p.introEnabled=!!typed.trim();
      $('v194PageIntro').value=p.intro;
      persist();setStatus(typed.trim()?'AUTO-SAVED INTRO':'INTRO CLEARED');syncQuickTextEditor();return
    }
    const module=el.closest?.('.v194-detail-module[data-block-id]');
    if(!module)return;
    const b=p.blocks.find(x=>x.id===module.dataset.blockId);if(!b)return;
    if(el.dataset?.livePart==='title'){
      b.title=typed;
      $('v194BlockTitle').value=b.title
    }else if(el.dataset?.livePart==='body'){
      b.body=typed.replace(/\n{3,}/g,'\n\n');
      $('v194BlockBody').value=b.body
    }else if(el.dataset?.livePart==='bullet'){
      const bulletTexts=Array.from(module.querySelectorAll('[data-live-part="bullet"]'))
        .map(node=>String(node.innerText||'').replace(/\u00a0/g,' ').replace(/\r/g,'').trim())
        .filter(Boolean);
      b.body=bulletTexts.map(row=>' * '+row).join('\n').replace(/^ \*/gm,'*');
      $('v194BlockBody').value=b.body;
      liveSelection.bulletIndex=Math.max(0,parseInt(el.dataset?.liveBulletIndex||'0',10)||0)
    }else if(el.dataset?.livePart==='subheading'){
      const idx=Math.max(0,parseInt(el.dataset?.liveSubIndex||'0',10)||0);
      if(!Array.isArray(b.subsections))b.subsections=[];
      if(!b.subsections[idx])b.subsections[idx]={title:'',text:''};
      b.subsections[idx].title=typed.trim();
      liveSelection.subIndex=idx;
      renderSubsectionEditor(b)
    }else if(el.dataset?.livePart==='subtext'){
      const idx=Math.max(0,parseInt(el.dataset?.liveSubIndex||'0',10)||0);
      const rowIdx=Math.max(0,parseInt(el.dataset?.liveSubRowIndex||'0',10)||0);
      if(!Array.isArray(b.subsections))b.subsections=[];
      if(!b.subsections[idx])b.subsections[idx]={title:'',text:''};
      const rows=String(b.subsections[idx].text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
      if(typed.trim())rows[rowIdx]=typed.trim(); else rows.splice(rowIdx,1);
      b.subsections[idx].text=rows.join('\n');
      liveSelection.subIndex=idx;liveSelection.subRowIndex=Math.min(rowIdx,Math.max(0,rows.length-1));
      renderSubsectionEditor(b)
    }
    persist();setStatus('AUTO-SAVED TEXT');syncQuickTextEditor()
  }

  function handlePhoto(file){
    const p=currentEditorPage();if(!p||!file)return;
    const blockId=activeBlockId;
    if(!p.blocks.some(x=>x.id===blockId))return;
    if(file.size>3500000){
      setStatus('PHOTO TOO LARGE · USE UNDER 3.5 MB');
      $('v194PhotoInput').value='';return
    }
    const reader=new FileReader();
    reader.onload=()=>{
      const livePage=currentEditorPage();if(!livePage)return;
      const b=livePage.blocks.find(x=>x.id===blockId);if(!b)return;
      livePage.enabled=true;
      b.image=String(reader.result||'');
      if(b.type==='text')b.type='mixed';
      persist();syncBlockEditor();renderActiveDetails();setStatus('PHOTO ADDED')
    };
    reader.readAsDataURL(file)
  }

  function bindLiveControl(id,fn,event='input'){
    $(id)?.addEventListener(event,()=>{
      fn();
      if(liveOpen)updateSelectionUI()
    })
  }

  function init(){
    loadInitial();
    refreshPageSelect();
    editorPageId=$('v194DetailsSubmenu')?.value||'';
    activePageId=editorPageId;
    syncPageEditor();
    syncPageHistoryButtons();

    $('v260PageUndo')?.addEventListener('click',undoPageDetails);
    $('v260PageRedo')?.addEventListener('click',redoPageDetails);

    $('v262SelectedText')?.addEventListener('focus',()=>{if(!v262QuickTextSyncing)rememberPageHistory()});
    $('v262SelectedText')?.addEventListener('input',e=>{
      if(v262QuickTextSyncing)return;
      applySelectedTextValue(e.target.value,{render:true,status:'AUTO-SAVED TEXT'})
    });
    $('v262ClearText')?.addEventListener('click',()=>{
      if(!selectedTextBinding())return;
      rememberPageHistory();
      applySelectedTextValue('',{render:true,status:'TEXT CLEARED'});
      const ta=$('v262SelectedText');if(ta){ta.value='';try{ta.focus({preventScroll:true})}catch(e){ta.focus()}}
    });

    $('v194DetailsSubmenu')?.addEventListener('change',()=>{
      selectEditorPage($('v194DetailsSubmenu').value);
      if(liveOpen)renderActiveDetails()
    });

    // V260: capture the Page Details state BEFORE a user edit starts.
    // Text/range/colour fields are grouped by focus session, so Undo removes
    // the whole typing/dragging change instead of stepping back one character.
    const detailsEditor=$('v194SubmenuDetailsEditor');
    detailsEditor?.addEventListener('focusin',e=>{
      const el=e.target;
      if(!el||el.id==='v194DetailsSubmenu'||el.id==='v260PageUndo'||el.id==='v260PageRedo')return;
      if(el.matches?.('input,textarea,select'))rememberPageHistory()
    },true);
    detailsEditor?.addEventListener('pointerdown',e=>{
      const btn=e.target.closest?.('button');
      if(!btn||btn.id==='v260PageUndo'||btn.id==='v260PageRedo'||btn.id==='v200LiveEditorToggle'||btn.id==='v194PreviewPage')return;
      rememberPageHistory()
    },true);

    // Page controls update immediately.
    ['v194PageHeading','v194PageIntro','v194HeadingSize','v194HeadingColor','v194IntroSize','v194IntroColor',
      'v324AudioTitleSize','v324AudioIntroSize','v328AudioIntroWidth','v328AudioKickerSize','v324AudioSmallSize','v329AudioButtonScale','v330AudioButtonTextSize','v330AudioBottomSpace','v324AudioKickerGap',
      'v324AudioTitleGap','v324AudioColumnGap','v324AudioSideTop','v324AudioButtonPadY','v324AudioButtonPadX',
      'v327AudioKickerText','v327AudioIntroText','v327AudioButtonText',
      'v327AudioSide1','v327AudioSide2','v327AudioSide3','v327AudioSide4','v327AudioSide5']
      .forEach(id=>bindLiveControl(id,()=>applyPageFromControls(true)));
    ['v194PageColumns','v194HeadingBold','v284HeadingUnderline','v284IntroUnderline','v259HeadingPosition','v261HeadingCols','v261IntroCols']
      .forEach(id=>bindLiveControl(id,()=>applyPageFromControls(true),'change'));

    $('v194ApplyPage')?.addEventListener('click',()=>applyPageFromControls(true));
    $('v258GlassWidth')?.addEventListener('input',e=>setGlassWidthForCurrentPage(e.target.value));
    $('v258GlassWidthNumber')?.addEventListener('change',e=>setGlassWidthForCurrentPage(e.target.value));
    $('v258GlassWidthReset')?.addEventListener('click',resetGlassWidthForCurrentPage);
    $('v312GlassCentered')?.addEventListener('change',e=>setGlassCenteredForCurrentPage(e.target.checked));
    $('v312CenterGlassNow')?.addEventListener('click',centerWholeGlassBox);
    $('v312GlassShiftX')?.addEventListener('input',e=>setGlassOffsetXForCurrentPage(e.target.value));
    $('v312ShiftLeft50')?.addEventListener('click',()=>nudgeGlassOffsetX(-50));
    $('v312ShiftLeft10')?.addEventListener('click',()=>nudgeGlassOffsetX(-10));
    $('v312ShiftRight10')?.addEventListener('click',()=>nudgeGlassOffsetX(10));
    $('v312ShiftRight50')?.addEventListener('click',()=>nudgeGlassOffsetX(50));
    $('v312GlassShiftReset')?.addEventListener('click',()=>setGlassOffsetXForCurrentPage(0));
    $('v309LockPreviewWidth')?.addEventListener('change',e=>setPreviewWidthLockForCurrentPage(e.target.checked));
    $('v309PreviewWidth')?.addEventListener('input',e=>setPreviewWidthForCurrentPage(e.target.value));
    $('v309PreviewWidthNumber')?.addEventListener('change',e=>setPreviewWidthForCurrentPage(e.target.value));
    $('v309PreviewWidthReset')?.addEventListener('click',resetPreviewWidthForCurrentPage);
    $('v272PanelTop')?.addEventListener('input',e=>setPanelTopForCurrentPage(e.target.value));
    $('v272PanelTopNumber')?.addEventListener('change',e=>setPanelTopForCurrentPage(e.target.value));
    $('v272PanelTopReset')?.addEventListener('click',resetPanelTopForCurrentPage);
    $('v272ElementGap')?.addEventListener('input',e=>setElementGapForCurrentPage(e.target.value));
    $('v272ElementGapNumber')?.addEventListener('change',e=>setElementGapForCurrentPage(e.target.value));
    $('v272ElementGapReset')?.addEventListener('click',resetElementGapForCurrentPage);
    $('v194PreviewPage')?.addEventListener('click',toggleLiveEditor);
    $('v200LiveEditorToggle')?.addEventListener('click',toggleLiveEditor);
    $('v261IntroToggle')?.addEventListener('click',()=>{
      const p=currentEditorPage();if(!p)return;
      p.enabled=true;
      p.introEnabled=!p.introEnabled;
      persist();syncPageEditor();renderActiveDetails();
      setStatus(p.introEnabled?'INTRO ON':'INTRO REMOVED')
    });
    $('v261AddHeaderModule')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('text','header')});
    $('v271AddHeaderPhoto')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('image','header')});

    $('v194AddText')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('text')});
    $('v194AddPhoto')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('image')});
    $('v194AddMixed')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('mixed')});
    $('v288AddDivider')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('divider')});
    $('v290AddSectionCard')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('sectioncard','content','grid')});
    $('v292AddAreaCard')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('sectioncard','content','area')});
    $('v293AddGroupSection')?.addEventListener('click',()=>{if(!liveOpen)openLiveEditor();addBlock('sectioncard','content','group');setStatus('GROUP SECTION ADDED · TICK MEMBERS BELOW')});
    $('v293GroupMembersList')?.addEventListener('change',e=>{
      const input=e.target.closest?.('[data-v293-member]');if(!input)return;
      const b=currentBlock();if(!b||b.type!=='sectioncard'||b.cardMode!=='group')return;
      const checked=[...$('v293GroupMembersList').querySelectorAll('[data-v293-member]:checked')].map(x=>x.dataset.v293Member).filter(Boolean);
      b.groupMembers=[...new Set(checked)];persist();renderActiveDetails();renderGroupMembersEditor(b);setStatus(`${b.groupMembers.length} ROW${b.groupMembers.length===1?'':'S'} GROUPED`)
    });
    window.addEventListener('resize',()=>requestAnimationFrame(v293PositionGroupedSections),{passive:true});
  $('v282AddRow')?.addEventListener('click',addNewRow);

    $('v194BlockSelect')?.addEventListener('change',()=>{
      activeBlockId=$('v194BlockSelect').value;
      liveSelection={kind:'block',part:'module',blockId:activeBlockId};
      syncBlockEditor();updateSelectionUI()
    });

    $('v261BlockZone')?.addEventListener('change',()=>{
      const p=currentEditorPage(),b=currentBlock();if(!p||!b)return;
      b.zone=$('v261BlockZone').value==='header'?'header':'content';
      if(b.zone==='header'){
        b.stackBelowPrevious=false;
        b.stackParentId='';
        if(p.headingPosition==='full')p.headingPosition='left';
        if((+p.headingCols||8)>8)p.headingCols=6;
        if(!(+b.gridStart))b.gridStart=7;
        if(!(+b.gridRow))b.gridRow=2;
      }else if(b.gridRow===2){
        b.gridRow=0;
      }
      persist();syncPageEditor();syncBlockEditor();renderActiveDetails();updateSelectionUI()
    });


    // Block controls update immediately.

    const adjustCardOffset=(delta,reset=false)=>{
      const b=currentBlock();
      if(!b||b.type!=='sectioncard')return;
      const cur=Math.max(-3000,Math.min(3000,Number.isFinite(+b.cardOffsetX)?+b.cardOffsetX:0));
      b.cardOffsetX=reset?0:Math.max(-3000,Math.min(3000,cur+delta));
      if($('v298CardOffsetX'))$('v298CardOffsetX').value=String(b.cardOffsetX);
      if($('v299OffsetReadout'))$('v299OffsetReadout').textContent=(b.cardOffsetX>0?'+':'')+b.cardOffsetX+' PX';
      persist();renderActiveDetails();syncBlockEditor();
    };
    $('v299MoveLeft50')?.addEventListener('click',()=>adjustCardOffset(-50));
    $('v299MoveLeft10')?.addEventListener('click',()=>adjustCardOffset(-10));
    $('v299MoveRight10')?.addEventListener('click',()=>adjustCardOffset(10));
    $('v299MoveRight50')?.addEventListener('click',()=>adjustCardOffset(50));
    $('v299ResetOffset')?.addEventListener('click',()=>adjustCardOffset(0,true));
    $('v298CardOffsetX')?.addEventListener('input',()=>{
      const v=Math.max(-3000,Math.min(3000,Number.isFinite(+$('v298CardOffsetX')?.value)?+$('v298CardOffsetX').value:0));
      if($('v299OffsetReadout'))$('v299OffsetReadout').textContent=(v>0?'+':'')+v+' PX';
    });


    $('v305CompactPreset')?.addEventListener('click',()=>{
      const b=currentBlock();
      if(!b||b.type==='divider'||b.type==='sectioncard')return;
      b.rowPadding=1;
      b.rowMinHeight=0;
      b.listGap=0;
      b.listLineHeight=1.0;
      b.titleContentGap=1;
      b.subheadingTextGap=0;
      b.subsectionGap=2;
      if(b.boxEnabled)b.boxPadding=Math.min(12,Number.isFinite(+b.boxPadding)?+b.boxPadding:12);
      if($('v296RowPadding'))$('v296RowPadding').value='1';
      if($('v306RowMinHeight'))$('v306RowMinHeight').value='0';
      if($('v303ListGap'))$('v303ListGap').value='0';
      if($('v303ListLineHeight'))$('v303ListLineHeight').value='1';
      if($('v306TitleContentGap'))$('v306TitleContentGap').value='1';
      if($('v305SubheadingTextGap'))$('v305SubheadingTextGap').value='0';
      if($('v305SubsectionGap'))$('v305SubsectionGap').value='2';
      if($('v289BoxPadding')&&b.boxEnabled)$('v289BoxPadding').value=String(b.boxPadding);
      persist();renderActiveDetails();syncBlockEditor();
    });

    ['v194BlockTitle','v194BlockBody','v194BlockTitleSize','v306TitleContentGap','v194BlockBodySize','v303NumberText','v300NumberSize','v300NumberColor','v294SubheadingSize','v294SubheadingColor','v305SubheadingTextGap','v305SubsectionGap','v332SubsectionLayout','v296RowPadding','v306RowMinHeight','v303ListGap','v303ListLineHeight','v302BlockGap','v296GroupExtraWidth','v296GroupExtraHeight','v283BlockHeight','v288DividerLength','v288DividerThickness','v288DividerColor','v194BlockColor','v289BoxRadius','v289BoxPadding','v289BoxBorderWidth','v289BoxBorderColor','v290BorderOpacity','v289BoxBackground','v289BoxOpacity','v290CardWidth','v290CardRowSpan','v298CardOffsetX','v292AreaLeft','v292AreaTop','v292AreaWidth','v307AreaAutoFitHeight']
      .forEach(id=>bindLiveControl(id,()=>applyBlockFromControls(true)));
    const v311SetExactAreaHeight=(delta=null)=>{
      const b=currentBlock();
      if(!b||b.type!=='sectioncard'||b.cardMode!=='area')return;
      let h=Math.max(40,Math.min(3000,Number.isFinite(+b.areaHeight)?+b.areaHeight:320));
      if(delta!==null)h=Math.max(40,Math.min(3000,h+delta));
      b.areaHeight=h;
      b.areaAutoFitHeight=false;
      if($('v292AreaHeight'))$('v292AreaHeight').value=String(h);
      if($('v311HeightReadout'))$('v311HeightReadout').textContent=Math.round(h)+' PX';
      if($('v307AreaAutoFitHeight'))$('v307AreaAutoFitHeight').checked=false;
      persist();renderActiveDetails();syncBlockEditor();
    };
    $('v311HeightMinus10')?.addEventListener('click',()=>v311SetExactAreaHeight(-10));
    $('v311HeightMinus1')?.addEventListener('click',()=>v311SetExactAreaHeight(-1));
    $('v311HeightPlus1')?.addEventListener('click',()=>v311SetExactAreaHeight(1));
    $('v311HeightPlus10')?.addEventListener('click',()=>v311SetExactAreaHeight(10));
    $('v292AreaHeight')?.addEventListener('input',()=>{
      const b=currentBlock();
      if(!b||b.type!=='sectioncard'||b.cardMode!=='area')return;
      const h=Math.max(40,Math.min(3000,Number.isFinite(+$('v292AreaHeight').value)?+$('v292AreaHeight').value:320));
      b.areaHeight=h;
      b.areaAutoFitHeight=false;
      if($('v311HeightReadout'))$('v311HeightReadout').textContent=Math.round(h)+' PX';
      if($('v307AreaAutoFitHeight'))$('v307AreaAutoFitHeight').checked=false;
      persist();renderActiveDetails();
    });

    ['v194BlockType','v194BlockSpan','v194ImageRatio','v194BlockBold','v284BlockTitleUnderline','v284BlockBodyUnderline','v267BlockTitleArrow','v300TopLine','v300NumberVisible','v271BlockStart','v271BlockRow','v271RuledRows','v289ListArrows','v289BoxEnabled','v290CardAlign','v292CardMode','v285RowsBesideImage','v286StackBelowPrevious','v287StackParent','v288DividerAlign']
      .forEach(id=>bindLiveControl(id,()=>applyBlockFromControls(true),'change'));
    $('v285AddSideRow')?.addEventListener('click',addSideRowToCurrentMixed);
    $('v289AddSubsection')?.addEventListener('click',addSubsection);
    $('v289SubsectionsList')?.addEventListener('input',e=>{
      const b=currentBlock();if(!b)return;
      const titleEl=e.target.closest?.('[data-v289-sub-title]');
      const textEl=e.target.closest?.('[data-v289-sub-text]');
      const el=titleEl||textEl;if(!el)return;
      const idx=+(titleEl?titleEl.dataset.v289SubTitle:textEl.dataset.v289SubText);
      if(!Number.isInteger(idx)||idx<0)return;
      if(!Array.isArray(b.subsections))b.subsections=[];
      if(!b.subsections[idx])b.subsections[idx]={title:'',text:''};
      if(titleEl)b.subsections[idx].title=titleEl.value;
      if(textEl)b.subsections[idx].text=textEl.value;
      persist();renderActiveDetails();setStatus('LIVE')
    });
    $('v289SubsectionsList')?.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-v289-remove-sub]');if(!btn)return;
      const b=currentBlock();if(!b||!Array.isArray(b.subsections))return;
      const idx=+btn.dataset.v289RemoveSub;if(!Number.isInteger(idx)||idx<0||idx>=b.subsections.length)return;
      b.subsections.splice(idx,1);persist();renderSubsectionEditor(b);renderActiveDetails();setStatus('SUBHEADING REMOVED')
    });

    $('v194ApplyBlock')?.addEventListener('click',()=>applyBlockFromControls(true));
    $('v194BlockUp')?.addEventListener('click',()=>moveBlock(-1));
    $('v194BlockDown')?.addEventListener('click',()=>moveBlock(1));
    $('v194DuplicateBlock')?.addEventListener('click',duplicateBlock);
    $('v194DeleteBlock')?.addEventListener('click',deleteBlock);

    $('v194PhotoInput')?.addEventListener('change',e=>{
      const f=e.target.files?.[0];if(f)handlePhoto(f);e.target.value=''
    });
    $('v194ClearPhoto')?.addEventListener('click',()=>{
      const p=currentEditorPage();if(!p)return;
      const b=p.blocks.find(x=>x.id===activeBlockId);if(!b)return;
      b.image='';persist();syncBlockEditor();renderActiveDetails();setStatus('PHOTO CLEARED')
    });

    // V272: public Page Details belong ONLY to their matching submenu.
    // Green Room opens Green Room details; Audio opens Audio details; etc.
    // Main navigation and every unrelated submenu close the scroll sheet.
    document.addEventListener('click',e=>{
      const sub=e.target?.closest?.('.v183-submenu-link');
      if(sub){
        const id=sub.dataset.submenuId||'';
        if(DETAIL_PAGE_SET.has(id))activateContentPage(id,true);
        else deactivateDetails();
        return
      }
      const main=e.target?.closest?.('.site-nav-link[data-site-target]');
      if(main){
        deactivateDetails();
        return
      }
      if(e.target?.closest?.('#siteBrand,[data-site-jump]')&&!e.target.closest?.('[data-jump="v194SubmenuDetailsEditor"]')){
        deactivateDetails()
      }
    },true);

    // Clicking PAGE DETAILS shortcut opens live mode without a preview round-trip.
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('[data-jump="v194SubmenuDetailsEditor"]')){
        if(!liveOpen)setTimeout(openLiveEditor,70)
      }
    },true);

    // Live selection + inline text editing.
    const panel=$('v194SubmenuDetailsPanel');
    panel?.addEventListener('focusin',e=>{
      if(liveOpen&&(e.target?.isContentEditable||e.target?.getAttribute?.('contenteditable')==='plaintext-only'))rememberPageHistory()
    },true);
    panel?.addEventListener('dragstart',e=>{
      if(liveOpen&&e.target.closest?.('[data-v199-action="drag"]'))rememberPageHistory()
    },true);
    panel?.addEventListener('pointerdown',e=>{
      if(liveOpen&&e.target.closest?.('[data-v199-action="narrow"],[data-v199-action="wider"],[data-v199-action="zone"]'))rememberPageHistory()
    },true);

    panel?.addEventListener('pointerdown',e=>{
      if(!liveOpen)return;
      const handle=e.target.closest?.('[data-v199-action="drag"]');
      if(handle){
        dragBlockId=handle.closest('.v194-detail-module')?.dataset.blockId||'';
        return
      }
      const action=e.target.closest?.('[data-v199-action]');
      if(action){
        const module=action.closest('.v194-detail-module');
        if(module){
          activeBlockId=module.dataset.blockId||'';
          liveSelection={kind:'block',part:'module',blockId:activeBlockId};
          syncBlockSelect();
          if(action.dataset.v199Action==='narrow')changeSpan(-1);
          if(action.dataset.v199Action==='wider')changeSpan(1);
          if(action.dataset.v199Action==='zone')toggleBlockZone();
        }
        e.preventDefault();e.stopPropagation();return
      }
      // Do not select text targets on pointerdown: letting the browser finish
      // its native pointer action first makes the caret/selection reliable.
    });

    panel?.addEventListener('click',e=>{
      if(!liveOpen)return;
      const placeholder=e.target.closest?.('.v290-card-placeholder');
      if(placeholder){
        const module=placeholder.closest('.v194-detail-module[data-block-id]');
        if(module){
          activeBlockId=module.dataset.blockId||'';
          liveSelection={kind:'block',part:'module',blockId:activeBlockId};
          syncBlockSelect();updateSelectionUI();setStatus('SECTION SELECTED · EDIT CONTROLS IN PANEL');
        }
        e.preventDefault();e.stopPropagation();return
      }
      const editable=e.target.closest?.('[contenteditable="true"],[contenteditable="plaintext-only"]');
      if(!editable)return;
      selectLiveTarget(editable);
      try{editable.focus({preventScroll:true})}catch(err){editable.focus()}
    });

    let v259TextSaveTimer=0;
    panel?.addEventListener('input',e=>{
      if(!liveOpen||!(e.target?.isContentEditable||e.target?.getAttribute?.('contenteditable')==='plaintext-only'))return;
      clearTimeout(v259TextSaveTimer);
      const target=e.target;
      v259TextSaveTimer=setTimeout(()=>{
        if(target?.isConnected)commitLiveText(target)
      },90)
    });

    panel?.addEventListener('focusout',e=>{
      if(liveOpen&&(e.target?.isContentEditable||e.target?.getAttribute?.('contenteditable')==='plaintext-only')){
        clearTimeout(v259TextSaveTimer);
        commitLiveText(e.target)
      }
    });

    panel?.addEventListener('keydown',e=>{
      if(!liveOpen||!(e.target?.isContentEditable||e.target?.getAttribute?.('contenteditable')==='plaintext-only'))return;
      if(e.key==='Escape'){
        e.target.blur();e.preventDefault()
      }
    });

    document.addEventListener('keydown',e=>{
      const mod=e.metaKey||e.ctrlKey;
      const key=String(e.key||'').toLowerCase();
      const inEditor=!!e.target?.closest?.('#v194SubmenuDetailsEditor');
      const inLive=liveOpen&&!!e.target?.closest?.('#v194SubmenuDetailsPanel');
      if(mod&&(inEditor||inLive)&&(key==='z'||key==='y')){
        if(inLive&&(e.target?.isContentEditable||e.target?.getAttribute?.('contenteditable')==='plaintext-only')){
          clearTimeout(v259TextSaveTimer);
          commitLiveText(e.target)
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        if(key==='y'||(key==='z'&&e.shiftKey))redoPageDetails();
        else undoPageDetails();
        return
      }
      if(e.key==='Escape'&&liveOpen&&!(e.target?.isContentEditable||e.target?.getAttribute?.('contenteditable')==='plaintext-only')){
        closeLiveEditor();
      }
    },true);

    panel?.addEventListener('dragstart',e=>{
      const handle=e.target.closest?.('[data-v199-action="drag"]');
      if(!handle){e.preventDefault();return}
      const module=handle.closest('.v194-detail-module');
      dragBlockId=module?.dataset.blockId||'';
      if(!dragBlockId){e.preventDefault();return}
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',dragBlockId)}catch(err){}
      module.classList.add('v199-dragging')
    });
    panel?.addEventListener('dragend',()=>{
      panel.querySelectorAll('.v199-dragging,.v199-drop-target').forEach(el=>el.classList.remove('v199-dragging','v199-drop-target'));
      dragBlockId=''
    });
    panel?.addEventListener('dragover',e=>{
      if(!dragBlockId)return;
      const target=e.target.closest?.('.v194-detail-module[data-block-id]');
      if(!target||target.dataset.blockId===dragBlockId)return;
      e.preventDefault();
      panel.querySelectorAll('.v199-drop-target').forEach(el=>el.classList.remove('v199-drop-target'));
      target.classList.add('v199-drop-target')
    });
    panel?.addEventListener('drop',e=>{
      if(!dragBlockId)return;
      const target=e.target.closest?.('.v194-detail-module[data-block-id]');
      if(!target)return;
      e.preventDefault();
      moveBlockTo(dragBlockId,target.dataset.blockId)
    });

    if(typeof v170RebuildNav==='function'){
      const baseRebuild=v170RebuildNav;
      v170RebuildNav=function(){
        const r=baseRebuild.apply(this,arguments);
        refreshPageSelect(editorPageId);
        return r
      }
    }

    if(typeof captureProjectState==='function'){
      const baseCapture=captureProjectState;
      captureProjectState=function(){
        const p=baseCapture();
        p.v194SubmenuDetails=clone(state);
        return p
      }
    }
    if(typeof applyProjectState==='function'){
      const baseApply=applyProjectState;
      applyProjectState=function(p){
        const r=baseApply(p);
        if(p?.v194SubmenuDetails){
          state=clone(p.v194SubmenuDetails);
          persist(false);
          refreshPageSelect(editorPageId);
          syncPageEditor();
          renderActiveDetails()
        }
        return r
      }
    }

    // Performance always closes the live content editor.
    // EDIT returns to the normal floor-plan editor; Page Details can then be
    // toggled ON explicitly whenever required.
    $('modePerformanceBtn')?.addEventListener('click',closeLiveEditor,true);
    $('siteEditBtn')?.addEventListener('click',closeLiveEditor,true);

    // V277 · SAVE now creates a JSON backup; LOAD JSON restores that project later.
    const v275Status=$('v275SaveStatus');
    function v275FlashSaveStatus(message,kind){
      if(!v275Status)return;
      v275Status.textContent=message;
      v275Status.classList.remove('saved','exported','loaded');
      if(kind)v275Status.classList.add(kind);
      clearTimeout(v275Status._resetTimer);
      v275Status._resetTimer=setTimeout(()=>{
        v275Status.textContent='AUTO-SAVE IS ON · SAVE + JSON CREATES A DOWNLOADABLE BACKUP';
        v275Status.classList.remove('saved','exported','loaded')
      },3200)
    }
    function v277JsonFilename(){
      const d=new Date();
      const stamp=d.toISOString().replace(/[:.]/g,'-');
      return 'MOTHERSHIP_VENUE_PACK_BACKUP_'+stamp+'.json'
    }
    $('v275SaveEdits')?.addEventListener('click',()=>{
      try{
        state.sourceBuild=332;
        persist(false);
        if(typeof captureProjectState!=='function')throw new Error('Project capture unavailable');
        const project=captureProjectState();
        project.savedAt=new Date().toISOString();
        let browserSaved=true;
        try{localStorage.setItem('mothershipFloorplanProjectV4',JSON.stringify(project))}catch(e){browserSaved=false}
        if(typeof downloadBlobFile!=='function')throw new Error('Download function unavailable');
        downloadBlobFile(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),v277JsonFilename());
        try{if(typeof setProjectDirty==='function')setProjectDirty(false)}catch(e){}
        setStatus('JSON BACKUP SAVED');
        v275FlashSaveStatus(browserSaved?'✓ SAVED · JSON BACKUP DOWNLOADED':'✓ JSON DOWNLOADED · BROWSER CACHE FULL','saved')
      }catch(e){
        console.error('V277 save/json failed',e);
        v275FlashSaveStatus('SAVE FAILED · '+(e?.message||'UNKNOWN ERROR'),'')
      }
    });
    $('v277LoadJson')?.addEventListener('click',()=>$('v277JsonInput')?.click());
    $('v277JsonInput')?.addEventListener('change',async e=>{
      const file=e.target.files&&e.target.files[0];
      if(!file)return;
      try{
        if(typeof importProjectFile!=='function')throw new Error('Project import unavailable');
        await importProjectFile(file);
        setStatus('JSON LOADED');
        v275FlashSaveStatus('⇧ JSON LOADED · PROJECT RESTORED','loaded');
        try{updateSelectionUI();syncLiveEditorToggle()}catch(err){}
      }catch(err){
        console.error('V277 load/json failed',err);
        v275FlashSaveStatus('LOAD FAILED · '+(err?.message||'INVALID JSON'),'')
      }finally{
        e.target.value=''
      }
    });
    $('v275ExportHtml')?.addEventListener('click',()=>{
      try{
        state.sourceBuild=332;
        persist(false);
        if(typeof downloadEditedHTML!=='function')throw new Error('Export function unavailable');
        downloadEditedHTML();
        setStatus('EXPORTED HTML');
        v275FlashSaveStatus('⇩ EDITED HTML EXPORTED','exported')
      }catch(e){
        console.error('V277 export failed',e);
        v275FlashSaveStatus('EXPORT FAILED · '+(e?.message||'UNKNOWN ERROR'),'')
      }
    });

    // Keep Page Details editor itself visible and sync the toggle state.
    updateSelectionUI();
    syncLiveEditorToggle()
  }


  // V270 · stable bridge for the persistent EDIT PAGE ↔ PREVIEW switch.
  // Keep these helpers inside the Page Details runtime so they use the same
  // live state/references as the editor itself.
  window.__mshipV270PageDetails={
    getPageId:()=>editorPageId||activePageId||$('v194DetailsSubmenu')?.value||'',
    enterEdit:()=>{
      const id=editorPageId||activePageId||$('v194DetailsSubmenu')?.value||'';
      if(id){
        editorPageId=id;
        activePageId=id;
        refreshPageSelect(id);
        syncPageEditor();
      }
      openLiveEditor();
      return id
    },
    enterPreview:()=>{
      const id=editorPageId||activePageId||$('v194DetailsSubmenu')?.value||'';
      if(liveOpen)closeLiveEditor();
      if(id&&DETAIL_PAGE_SET.has(id)){
        editorPageId=id;
        activePageId=id;
        refreshPageSelect(id);
        syncPageEditor();
        activateContentPage(id,false);
      }else{
        deactivateDetails();
      }
      return id
    }
  };

  window.captureV194SubmenuDetailsState=()=>clone(state);
  window.applyV194SubmenuDetailsState=incoming=>{
    if(!incoming||typeof incoming!=='object')return;
    state={version:2,sourceBuild:+incoming.sourceBuild||272,savedAt:incoming.savedAt||'',pages:clone(incoming.pages||{})};
    persist(false);
    refreshPageSelect(editorPageId);
    syncPageEditor();
    if(activePageId||liveOpen)renderActiveDetails();
    pageUndoHistory.length=0;
    pageRedoHistory.length=0;
    syncPageHistoryButtons();
  };

  init();
})();
;
(function(){
  let ran=false;
  function boot(){
    if(ran)return;
    ran=true;
    try{
      if(typeof setExperienceMode==='function')setExperienceMode('performance');
    }catch(e){}
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});
  }else{
    setTimeout(boot,0);
  }
})();
;
(function(){
  function cleanHome(){
    try{
      // Same navigation function used by THE MOTHERSHIP brand button.
      if(typeof siteNavigate==='function'){
        siteNavigate('explore',{scroll:false,camera:true})
      }
    }catch(e){}

    try{
      if(typeof deactivateDetails==='function')deactivateDetails()
    }catch(e){}

    document.body.classList.remove(
      'v194-submenu-details-active',
      'v199-live-details-edit',
      'site-info-expanded',
      'site-info-peek',
      'site-readmore-scrolling'
    );

    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}

    try{window.__mshipV210HomeView?.()}catch(e){}
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(cleanHome,0),{once:true})
  }else{
    setTimeout(cleanHome,0)
  }

  // V208's performance-only startup has a few delayed kicks. Run after them
  // as well so a restored class can never reopen Page Details on home.
  window.addEventListener('load',()=>setTimeout(cleanHome,80),{once:true});
  setTimeout(cleanHome,260);
  setTimeout(cleanHome,900);
})();
;
(function(){
  const HIDE_TYPES=new Set([
    'Band / Live Performance',
    'DJ / 360',
    'Empty Stage'
  ]);

  const DJ_KINDS=new Set([
    'djBooth',
    'djBoothSideTable',
    'djBoothMonitor',
    'djBoothSideSpeaker'
  ]);

  let permanentBooth=[];
  let stageBoothIds=new Set();
  let stageBoothGroupIds=new Set();
  let captured=false;

  function sceneRoots(){
    const all=[];
    try{
      if(typeof editorRoots!=='undefined'&&Array.isArray(editorRoots))all.push(...editorRoots)
    }catch(e){}
    try{
      if(typeof builderObjects!=='undefined'&&Array.isArray(builderObjects))all.push(...builderObjects)
    }catch(e){}
    const seen=new Set();
    return all.filter(o=>{
      if(!o||seen.has(o))return false;
      seen.add(o);
      return true
    })
  }

  function editId(o){
    return String(o?.userData?.editId||o?.userData?.id||'')
  }

  function groupId(o){
    return String(o?.userData?.groupId||o?.userData?.group||'')
  }

  function kindOf(o){
    try{
      if(typeof rootAssetKindForLayer==='function'){
        const k=String(rootAssetKindForLayer(o)||'');
        if(k)return k
      }
    }catch(e){}
    return String(o?.userData?.assetData?.kind||'')
  }

  function nameOf(o){
    return String(o?.userData?.editName||o?.userData?.buildItem||'')
  }

  function isDjPart(o){
    const k=kindOf(o);
    const n=nameOf(o).toLowerCase();
    return DJ_KINDS.has(k) || (n.includes('dj')&&(n.includes('booth')||n.includes('monitor')||n.includes('side table')))
  }

  function readStageIdentityFromEmbeddedDefault(){
    try{
      const snap=BOOT_PROJECT_STATE?.v176StageDefaults?.['DJ / Stage'];
      const states=Array.isArray(snap?.objects)?snap.objects:[];
      states.forEach(s=>{
        const k=String(s?.kind||s?.record?.asset?.kind||'');
        const n=String(s?.name||s?.record?.name||'').toLowerCase();
        const dj=DJ_KINDS.has(k)||(n.includes('dj')&&(n.includes('booth')||n.includes('monitor')||n.includes('side table')));
        if(!dj||s?.v===false)return;
        if(s?.id)stageBoothIds.add(String(s.id));
        const gid=String(s?.record?.group||s?.record?.groupId||'');
        if(gid)stageBoothGroupIds.add(gid)
      })
    }catch(e){}
  }

  function candidateStageBooth(o){
    if(!o||!isDjPart(o))return false;
    const id=editId(o),gid=groupId(o),x=+o?.position?.x;
    if(stageBoothIds.has(id))return true;
    if(gid&&stageBoothGroupIds.has(gid))return true;

    // The permanent booth is the DJ booth physically on the stage at the
    // left/rear stage position. The 360 booth lives much further toward the
    // dancefloor, so this keeps the two setups separate.
    return Number.isFinite(x)&&x<=-4.5
  }

  function captureNodeVisibility(root){
    const nodes=[];
    try{
      root.traverse?.(node=>nodes.push({node,visible:node.visible!==false}))
    }catch(e){
      nodes.push({node:root,visible:root.visible!==false})
    }
    return nodes
  }

  function capturePermanentBooth(){
    if(captured)return permanentBooth.length>0;
    readStageIdentityFromEmbeddedDefault();

    const roots=sceneRoots().filter(o=>candidateStageBooth(o)&&o.visible!==false);
    if(!roots.length)return false;

    permanentBooth=roots.map(root=>({
      root,
      p:[root.position.x,root.position.y,root.position.z],
      r:[root.rotation.x,root.rotation.y,root.rotation.z,root.rotation.order||'XYZ'],
      s:[root.scale.x,root.scale.y,root.scale.z],
      nodes:captureNodeVisibility(root)
    }));
    captured=true;
    return true
  }

  function ensureCaptured(){
    if(capturePermanentBooth())return true;
    return false
  }

  function hideNodeTree(root){
    if(!root)return;
    root.visible=false;
    try{root.traverse?.(node=>{node.visible=false})}catch(e){}
  }

  function hidePermanentBooth(){
    if(!ensureCaptured())return false;
    permanentBooth.forEach(s=>hideNodeTree(s.root));
    try{markRenderDirty?.(220)}catch(e){}
    return true
  }

  function hideAllStageBoothCandidates(){
    sceneRoots().forEach(o=>{
      if(candidateStageBooth(o))hideNodeTree(o)
    })
  }

  function restoreOriginalPermanentBooth(){
    if(!ensureCaptured())return false;

    // First keep stray duplicate stage-booth instances off. Then restore only
    // the exact booth objects that were visible in the original default view.
    hideAllStageBoothCandidates();

    permanentBooth.forEach(s=>{
      const o=s.root;
      if(!o)return;
      try{
        o.position.set(s.p[0],s.p[1],s.p[2]);
        o.rotation.set(s.r[0],s.r[1],s.r[2],s.r[3]);
        o.scale.set(s.s[0],s.s[1],s.s[2]);
        s.nodes.forEach(n=>{if(n.node)n.node.visible=n.visible});
        o.updateMatrixWorld?.(true)
      }catch(e){}
    });
    try{markRenderDirty?.(260)}catch(e){}
    return true
  }

  function restoreNormalDjStageState(){
    // Reset all event gear to the saved DJ / STAGE layout, then explicitly put
    // back the ORIGINAL permanent booth captured from the venue's default view.
    // No camera function is called here.
    try{
      window.v184ApplyEventTypeDefault?.('DJ / Stage',{
        quiet:true,
        v244NormalVenue:true
      })
    }catch(e){}
    restoreOriginalPermanentBooth();

    const sel=document.getElementById('v175EventOption');
    if(sel)sel.value='DJ / Stage';
    document.querySelectorAll('[data-v175-event]').forEach(b=>{
      b.classList.toggle('active',b.dataset.v175Event==='DJ / Stage')
    })
  }

  function enforceEventType(type){
    if(HIDE_TYPES.has(type)){
      hidePermanentBooth();
    }else if(type==='DJ / Stage'){
      restoreOriginalPermanentBooth();
    }
  }

  // Capture the permanent booth BEFORE any special event view can alter it.
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      if(!capturePermanentBooth()){
        setTimeout(capturePermanentBooth,120);
        setTimeout(capturePermanentBooth,360)
      }
    })
  });

  // Event submenu camera frames already load the correct saved event layout.
  // Apply only the temporary permanent-booth override after that load.
  try{
    const baseLoadCameraFrame=loadCameraFrame;
    loadCameraFrame=function(id,animate=true){
      const f=(typeof cameraFrames!=='undefined'?cameraFrames:[]).find(x=>x?.id===id);
      const eventType=String(f?.eventType||'');
      const result=baseLoadCameraFrame.apply(this,arguments);

      if(HIDE_TYPES.has(eventType)){
        enforceEventType(eventType);
        requestAnimationFrame(()=>enforceEventType(eventType))
      }else if(eventType==='DJ / Stage'){
        restoreOriginalPermanentBooth();
        requestAnimationFrame(restoreOriginalPermanentBooth)
      }
      return result
    }
  }catch(e){
    console.warn('V244 camera-frame booth override unavailable',e)
  }

  // Collapsing STAGE / EVENT OPTIONS means the event preview has ended.
  // Restore the normal DJ / STAGE object state before the existing camera
  // returns to the main Stage/Event frame.
  try{
    const originalCollapseReturn=v235ReturnCollapsedPageToMain3D;
    v235ReturnCollapsedPageToMain3D=function(page){
      if(page==='production')restoreNormalDjStageState();
      return originalCollapseReturn.apply(this,arguments)
    }
  }catch(e){
    // v235ReturnCollapsedPageToMain3D is closure-scoped in some builds; the
    // delegated click handler below covers that case.
  }

  // Any main-menu click is no longer one of the three special event subviews.
  // Non-production submenu clicks and HOME also restore the normal booth.
  document.addEventListener('click',e=>{
    const main=e.target?.closest?.('.site-nav-link');
    if(main){
      requestAnimationFrame(restoreNormalDjStageState);
      return
    }

    const sub=e.target?.closest?.('.v183-submenu-link');
    if(sub){
      const parent=String(sub.dataset.parentPage||'');
      if(parent!=='production'){
        requestAnimationFrame(restoreNormalDjStageState)
      }
      return
    }

    if(e.target?.closest?.('#siteBrand')){
      requestAnimationFrame(restoreNormalDjStageState)
    }
  },false);

  // Normal section navigation can also happen programmatically.
  try{
    const baseSiteNavigate=siteNavigate;
    siteNavigate=function(section,opts={}){
      const result=baseSiteNavigate.apply(this,arguments);
      if(section!=='production')restoreNormalDjStageState();
      return result
    }
  }catch(e){
    console.warn('V244 normal-page booth restore unavailable',e)
  }

  // Edit-mode event-type buttons follow the same temporary visibility rule.
  document.querySelectorAll('[data-v175-event]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const type=String(btn.dataset.v175Event||'');
      requestAnimationFrame(()=>enforceEventType(type))
    })
  });
  document.getElementById('v175EventOption')?.addEventListener('change',e=>{
    const type=String(e.target.value||'');
    requestAnimationFrame(()=>enforceEventType(type))
  });

  // Performance mode itself is a normal venue entry point. Existing V184
  // logic loads DJ / STAGE; this final restore puts back the original booth
  // identity/visibility if an event preview had hidden it.
  document.getElementById('modePerformanceBtn')?.addEventListener('click',()=>{
    requestAnimationFrame(()=>requestAnimationFrame(restoreNormalDjStageState))
  });
})();
;
(function(){
  function startInPerformance(){
    try{
      if(typeof setExperienceMode==='function' &&
         (typeof experienceMode==='undefined'||experienceMode!=='performance')){
        setExperienceMode('performance')
      }
    }catch(e){}
  }
  // Keep the same delayed public startup behaviour that preserved V253's opening view.
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      requestAnimationFrame(()=>requestAnimationFrame(startInPerformance))
    },{once:true})
  }else{
    requestAnimationFrame(()=>requestAnimationFrame(startInPerformance))
  }
  setTimeout(startInPerformance,120);
  setTimeout(startInPerformance,360);
})();


(function(){
  const edit=document.getElementById('siteEditBtn');
  const exit=document.getElementById('v254ViewPack');
  edit?.addEventListener('click',()=>{
    try{setExperienceMode('edit')}catch(e){try{setEditMode(true)}catch(_){} }
  });
  exit?.addEventListener('click',()=>{
    try{setExperienceMode('performance')}catch(e){try{setEditMode(false)}catch(_){} }
  });
})();


(()=>{
  const AUDIO_ID='submenu_mtzyx7bz_wcw6';
  const PANEL='#v194SubmenuDetailsPanel';
  const PDF_TARGET='https://drive.google.com/drive/folders/1zZlAW4UqWGYmV-QFZx-SvDrpBYrNxWCJ?usp=drive_link';
  const TARGETS=[
    'detail_mu9slp6o_yhttu',
    'detail_mu9zb6k0_fsefx',
    'detail_mu940atq_ftwd9',
    'detail_mu9c8w2z_fkk0c',
    'seed_soundcheck_changeovers'
  ];
  const DEFAULT_SIDE=['SOUND SYSTEM','STAGE SPECS','BACKLINE','LOAD-IN & ACCESS','AUDIO RECORDING'];

  const val=(panel,key,fallback='')=>{
    const v=panel?.dataset?.[key];
    return String(v==null||v===''?fallback:v);
  };
  const sideLabels=panel=>DEFAULT_SIDE.map((fallback,i)=>val(panel,'v327AudioSide'+(i+1),fallback));

  function inAudioPreview(panel){
    return !!panel && panel.dataset.v281PageId===AUDIO_ID &&
      document.body.classList.contains('performance-mode') &&
      document.body.classList.contains('site-preview') &&
      document.body.classList.contains('v194-submenu-details-active') &&
      !document.body.classList.contains('v199-live-details-edit');
  }

  function inAudioEdit(panel){
    return !!panel && panel.dataset.v281PageId===AUDIO_ID &&
      document.body.classList.contains('v199-live-details-edit') &&
      !document.body.classList.contains('performance-mode') &&
      !document.body.classList.contains('site-preview');
  }

  function focusControl(id){
    const el=document.getElementById(id);
    if(!el)return;
    el.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>{el.focus();if(typeof el.select==='function')el.select()},180);
  }

  function removePreview(head){
    head?.querySelector('.v326-audio-display')?.remove();
    head?.classList.remove('v326-audio-hero-host');
  }

  function removeEditHelpers(head){
    head?.querySelectorAll('.v327-audio-edit-side,.v327-audio-edit-button').forEach(el=>el.remove());
  }

  function renderEditHelpers(panel,head){
    removePreview(head);
    const kicker=panel.querySelector('#v194DetailsKicker');
    const intro=panel.querySelector('#v194DetailsIntro');

    if(kicker){
      kicker.textContent=val(panel,'v327AudioKicker','03 · PRODUCTION GUIDE');
      kicker.style.cursor='text';
      kicker.onclick=()=>focusControl('v327AudioKickerText');
    }
    if(intro){
      const copy=val(panel,'v327AudioIntro','');
      intro.textContent=copy;
      intro.style.display='block';
      intro.style.cursor='text';
      intro.onclick=()=>focusControl('v327AudioIntroText');
    }

    let aside=head.querySelector('.v327-audio-edit-side');
    if(!aside){
      aside=document.createElement('aside');
      aside.className='v327-audio-edit-side';
      aside.innerHTML='<span class="v327-audio-edit-side-line" aria-hidden="true"></span><nav class="v327-audio-edit-nav"></nav>';
      head.appendChild(aside);
    }
    const nav=aside.querySelector('.v327-audio-edit-nav');
    nav.innerHTML='';
    sideLabels(panel).forEach((label,i)=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=label;
      btn.title='Edit this side-panel label';
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();focusControl('v327AudioSide'+(i+1))};
      nav.appendChild(btn);
    });

    let button=head.querySelector('.v327-audio-edit-button');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='v327-audio-edit-button';
      button.onclick=e=>{e.preventDefault();e.stopPropagation();focusControl('v327AudioButtonText')};
      head.appendChild(button);
    }
    button.textContent=val(panel,'v327AudioButton','DOWNLOAD PDF')+'  →';
  }

  function renderPreview(panel,head){
    removeEditHelpers(head);
    head.classList.add('v326-audio-hero-host');

    const originalHeading=panel.querySelector('#v194DetailsHeading');
    const title=(originalHeading?.textContent||'AUDIO').trim()||'AUDIO';

    let display=head.querySelector('.v326-audio-display');
    if(!display){
      display=document.createElement('div');
      display.className='v326-audio-display';
      display.innerHTML=''
        + '<div class="v326-audio-main">'
        +   '<div class="v326-audio-kicker"></div>'
        +   '<div class="v326-audio-title"></div>'
        +   '<div class="v326-audio-intro"></div>'
        +   '<a class="v326-audio-download" target="_blank" rel="noopener"><span class="v326-audio-download-label"></span> <span class="v326-audio-download-arrow" aria-hidden="true">→</span></a>'
        + '</div>'
        + '<aside class="v326-audio-side">'
        +   '<span class="v326-audio-side-line" aria-hidden="true"></span>'
        +   '<nav class="v326-audio-side-nav"></nav>'
        + '</aside>';
      display.querySelector('.v326-audio-download').href=PDF_TARGET;
      head.appendChild(display);
    }

    display.querySelector('.v326-audio-kicker').textContent=val(panel,'v327AudioKicker','03 · PRODUCTION GUIDE');
    display.querySelector('.v326-audio-title').textContent=title;
    display.querySelector('.v326-audio-intro').textContent=val(panel,'v327AudioIntro',
      'Sound system, FOH, audio specifications & more. Explore the room, click the venue itself, or jump straight to the information you need.');
    display.querySelector('.v326-audio-download-label').textContent=val(panel,'v327AudioButton','DOWNLOAD PDF');

    const nav=display.querySelector('.v326-audio-side-nav');
    nav.innerHTML='';
    sideLabels(panel).forEach((label,i)=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=label;
      btn.addEventListener('click',()=>{
        const target=panel.querySelector(`[data-block-id="${CSS.escape(TARGETS[i])}"]`);
        if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
      });
      nav.appendChild(btn);
    });
  }

  window.v324SyncAudioHero=function(){
    const panel=document.querySelector(PANEL);
    const head=panel?.querySelector('.v194-details-head');
    if(!panel||!head)return;

    if(inAudioPreview(panel)){
      renderPreview(panel,head);
      return;
    }
    if(inAudioEdit(panel)){
      renderEditHelpers(panel,head);
      return;
    }

    removePreview(head);
    removeEditHelpers(head);
  };

  let raf=0;
  const schedule=()=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;window.v324SyncAudioHero?.()});
  };
  const mo=new MutationObserver(schedule);
  if(document.body)mo.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});
  setTimeout(schedule,80);
  setTimeout(schedule,350);
})();

(()=>{
  let resizeRAF=0;
  let lastW=0,lastH=0,lastDpr=0;

  function viewportSize(){
    const vv=window.visualViewport;
    /* innerWidth/innerHeight are the correct CSS viewport dimensions after
       desktop browser zoom. visualViewport is also observed because Chrome
       can update it before/without a normal resize in some situations. */
    const w=Math.max(1,Math.round(window.innerWidth||document.documentElement.clientWidth||vv?.width||1));
    const h=Math.max(1,Math.round(window.innerHeight||document.documentElement.clientHeight||vv?.height||1));
    return {w,h};
  }

  function refitVenueViewport(force=false){
    resizeRAF=0;
    if(!document.body.classList.contains('performance-mode') ||
       !document.body.classList.contains('site-preview')) return;

    const {w,h}=viewportSize();
    const dpr=window.devicePixelRatio||1;
    if(!force && w===lastW && h===lastH && Math.abs(dpr-lastDpr)<.001)return;
    lastW=w;lastH=h;lastDpr=dpr;

    try{
      const wrap=document.getElementById('wrap');
      const canvas=wrap?.querySelector('canvas');
      if(wrap){
        wrap.style.setProperty('width','100vw','important');
        wrap.style.setProperty('height','100vh','important');
      }
      if(canvas){
        canvas.style.setProperty('width','100vw','important');
        canvas.style.setProperty('height','100vh','important');
      }

      /* The renderer/cameras are globals in this venue build. Re-size only;
         don't call updateCamera(), so the actual saved viewpoint stays put. */
      if(typeof renderer!=='undefined'){
        renderer.setSize(w,h,false);
      }
      if(typeof persp!=='undefined'){
        persp.aspect=w/h;
        persp.updateProjectionMatrix();
      }
      if(typeof ortho!=='undefined' && typeof orthoSize!=='undefined'){
        const zoom=(typeof orthoZoom!=='undefined'&&Number.isFinite(+orthoZoom)&&+orthoZoom>0)?+orthoZoom:1;
        const s=orthoSize/zoom;
        const a=w/h;
        ortho.left=-s*a;
        ortho.right=s*a;
        ortho.top=s;
        ortho.bottom=-s;
        ortho.updateProjectionMatrix();
      }
      if(typeof markRenderDirty==='function')markRenderDirty(260);
    }catch(e){}
  }

  function cleanPreviewEditorArtifacts(){
    if(!document.body.classList.contains('performance-mode') ||
       !document.body.classList.contains('site-preview'))return;

    /* A render can occasionally finish one frame after EDIT → PREVIEW.
       Strip only the generated editing chrome; content itself is untouched. */
    document.querySelectorAll(
      '#v194SubmenuDetailsPanel .v199-module-tools,'+
      '#v194SubmenuDetailsPanel .v290-card-placeholder'
    ).forEach(el=>el.remove());

    const panel=document.getElementById('v194SubmenuDetailsPanel');
    if(panel){
      panel.classList.remove('v199-live-active');
      panel.querySelectorAll(
        '.v199-live-selected,.v199-selected,[data-selected="true"]'
      ).forEach(el=>{
        el.classList.remove('v199-live-selected','v199-selected');
        el.removeAttribute('data-selected');
      });
      panel.querySelectorAll('[contenteditable]').forEach(el=>{
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
      });
      panel.querySelectorAll('[draggable="true"]').forEach(el=>el.removeAttribute('draggable'));
    }
  }

  function schedule(force=false){
    if(resizeRAF)return;
    resizeRAF=requestAnimationFrame(()=>{
      refitVenueViewport(force);
      cleanPreviewEditorArtifacts();
    });
  }

  window.addEventListener('resize',()=>schedule(true),{passive:true});
  window.addEventListener('orientationchange',()=>schedule(true),{passive:true});
  window.visualViewport?.addEventListener('resize',()=>schedule(true),{passive:true});
  window.visualViewport?.addEventListener('scroll',()=>schedule(false),{passive:true});

  /* Browser zoom changes devicePixelRatio. A small lightweight watcher catches
     any Chrome zoom change that doesn't dispatch the expected resize event. */
  let watchedDpr=window.devicePixelRatio||1;
  setInterval(()=>{
    const now=window.devicePixelRatio||1;
    const {w,h}=viewportSize();
    if(Math.abs(now-watchedDpr)>.001 || w!==lastW || h!==lastH){
      watchedDpr=now;
      schedule(true);
    }
  },350);

  const observer=new MutationObserver(()=>{
    if(document.body.classList.contains('performance-mode') &&
       document.body.classList.contains('site-preview')){
      schedule(true);
    }
  });
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});

  /* Also clean after page-detail DOM mutations, which is where stale MOVE /
     HEADER / WIDTH controls were leaking into Preview. */
  const details=document.getElementById('v194SubmenuDetailsPanel');
  if(details){
    const detailObserver=new MutationObserver(()=>{
      if(document.body.classList.contains('performance-mode') &&
         document.body.classList.contains('site-preview')){
        requestAnimationFrame(cleanPreviewEditorArtifacts);
      }
    });
    detailObserver.observe(details,{childList:true,subtree:true,attributes:true});
  }

  window.v325RefitVenueViewport=()=>schedule(true);
  setTimeout(()=>schedule(true),80);
  setTimeout(()=>schedule(true),350);
})();
