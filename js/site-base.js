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

