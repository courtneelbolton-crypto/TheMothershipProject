function resetSelectedPageTextSize(){
  if(!pageTextStyleTargetKey){
    flashEditor?.('Click the text you want to resize first');
    return
  }
  delete pageInlineStyles[pageTextStyleTargetKey];
  applyPageInlineStylesToDom?.();
  const input=document.getElementById('pageTextSizeInput');if(input)input.value='';
  try{localStorage.setItem('mothershipPageInlineStylesV1',JSON.stringify(capturePageInlineStyleState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)
}

let pageInlineEdits={};
let inlinePageTextActiveEl=null;
let inlinePageTextCancelled=false;

function capturePageInlineEditState(){
  return JSON.parse(JSON.stringify(pageInlineEdits||{}))
}
function applyPageInlineEditState(saved){
  pageInlineEdits=saved&&typeof saved==='object'?JSON.parse(JSON.stringify(saved)):{};
  applyPageInlineEditsToDom()
}
function loadLocalPageInlineEditState(){
  try{
    const raw=localStorage.getItem('mothershipPageInlineEditsV1');
    applyPageInlineEditState(raw?JSON.parse(raw):{})
  }catch(e){applyPageInlineEditState({})}
}
function pageInlineOwnerEnabled(){
  return pageDetailsEditMode===true &&
    experienceMode==='edit' &&
    document.body.classList.contains('page-details-edit-mode') &&
    !document.body.classList.contains('promoter-link')
}
function inlinePageSectionForElement(el){
  if(el?.closest?.('#siteSectionCover'))return typeof siteActiveSection!=='undefined'?siteActiveSection:'venue';
  const roll=el?.closest?.('.overview-rollup-section');
  if(roll?.dataset?.overviewSection&&SITE_SECTION_META[roll.dataset.overviewSection])return roll.dataset.overviewSection;
  const sec=el?.closest?.('.site-section[data-site-section]');
  if(sec?.dataset?.siteSection&&SITE_SECTION_META[sec.dataset.siteSection])return sec.dataset.siteSection;
  if(el?.closest?.('#siteOverviewContent'))return 'explore';
  return typeof siteActiveSection!=='undefined'?siteActiveSection:'explore'
}
function inlinePageEditableTarget(target){
  if(!target?.closest)return null;
  const sel=[
    '#siteSectionCoverKicker',
    '#siteSectionCoverTitle',
    '#siteSectionCoverText',
    '#siteHeroCopy [data-inline-hero]',
    '.site-info-title-panel .site-section-number',
    '.site-info-title-panel h2',
    '.site-info-title-panel .site-section-intro',
    '.overview-rollup-head .overview-rollup-kicker',
    '.overview-rollup-head h3',
    '.overview-rollup-head p',
    '.site-content-card .site-card-kicker',
    '.site-content-card h3',
    '.site-content-card .custom-stat',
    '.site-content-card .bsmnt-card-copy p',
    '.site-content-card .bsmnt-card-copy li',
    '.site-content-card > p',
    '.site-content-card li'
  ].join(',');
  const el=target.closest(sel);
  if(!el)return null;
  if(el.closest('a,input,textarea,select'))return null;
  if(el.closest('button')&&!el.hasAttribute('data-inline-hero'))return null;
  return el.closest('#promoterSite')?el:null
}
function inlinePageHeaderField(el){
  if(el.id==='siteSectionCoverKicker')return 'kicker';
  if(el.id==='siteSectionCoverTitle')return 'heading';
  if(el.id==='siteSectionCoverText')return 'intro';
  if(el.closest('.site-info-title-panel')){
    if(el.classList.contains('site-section-number'))return 'kicker';
    if(el.matches('h2'))return 'heading';
    if(el.classList.contains('site-section-intro'))return 'intro'
  }
  if(el.closest('.overview-rollup-head')){
    if(el.classList.contains('overview-rollup-kicker'))return 'kicker';
    if(el.matches('h3'))return 'heading';
    if(el.matches('p'))return 'intro'
  }
  return ''
}
function inlinePageCustomContext(el){
  const card=el.closest('.performance-custom-card[data-performance-block-id]');
  if(!card)return null;
  const section=inlinePageSectionForElement(el);
  const blockId=card.dataset.performanceBlockId||'';
  let field='';
  if(el.classList.contains('site-card-kicker'))field='kicker';
  else if(el.matches('h3,.custom-stat'))field='title';
  else if(el.matches('.bsmnt-card-copy p'))field='body';
  else if(el.matches('.bsmnt-card-copy li'))field='list';
  if(!field)return null;
  const itemIndex=field==='list'?[...card.querySelectorAll('.bsmnt-card-copy li')].indexOf(el):-1;
  return {kind:'custom',section,blockId,field,itemIndex,card}
}
function inlinePageDefaultKey(el){
  const card=el.closest('.site-content-card:not(.performance-custom-card)');
  if(!card)return '';
  const base=pageModuleKey(card);if(!base)return '';

  let role='',sub=-1;
  if(el.classList.contains('site-card-kicker'))role='kicker';
  else if(el.matches('h3'))role='title';
  else if(el.matches('li')){
    role='li';sub=[...card.querySelectorAll('li')].indexOf(el)
  }else if(el.matches('p')){
    role='p';sub=[...card.querySelectorAll('p')].indexOf(el)
  }
  if(!role)return '';
  return base+'::text::'+role+(sub>=0?':'+sub:'')
}
function inlinePageContext(el){
  if(el?.hasAttribute?.('data-inline-hero')){
    const field=el.getAttribute('data-inline-hero')||'field';
    return {kind:'hero',section:'explore',field,key:'hero::'+field}
  }
  const headerField=inlinePageHeaderField(el);
  if(headerField)return {kind:'header',section:inlinePageSectionForElement(el),field:headerField};
  const custom=inlinePageCustomContext(el);if(custom)return custom;
  const key=inlinePageDefaultKey(el);if(key)return {kind:'default',key,section:inlinePageSectionForElement(el)};
  return null
}
function inlinePageTextValue(el){return String(el?.innerText??el?.textContent??'').replace(/\u00a0/g,' ').trim()}
function syncInlinePageMirrors(ctx,value,sourceEl=null){
  if(!ctx)return;
  if(ctx.kind==='header'){
    const section=ctx.section;

    if(section===(typeof siteActiveSection!=='undefined'?siteActiveSection:section)){
      const coverTarget=ctx.field==='kicker'
        ?document.getElementById('siteSectionCoverKicker')
        :(ctx.field==='heading'
          ?document.getElementById('siteSectionCoverTitle')
          :document.getElementById('siteSectionCoverText'));
      if(coverTarget&&coverTarget!==sourceEl)coverTarget.textContent=value
    }

    document.querySelectorAll('.site-section[data-site-section="'+section+'"] .site-info-title-panel, .overview-rollup-section[data-overview-section="'+section+'"] .overview-rollup-head').forEach(scope=>{
      let target=null;
      if(ctx.field==='kicker')target=scope.querySelector('.site-section-number,.overview-rollup-kicker');
      if(ctx.field==='heading')target=scope.querySelector('h2,h3');
      if(ctx.field==='intro')target=scope.querySelector('.site-section-intro,p');
      if(target&&target!==sourceEl)target.textContent=value
    })
  }
  if(ctx.kind==='custom'){
    document.querySelectorAll('.performance-custom-card[data-performance-block-id="'+CSS.escape(ctx.blockId)+'"]').forEach(card=>{
      let target=null;
      if(ctx.field==='kicker')target=card.querySelector('.site-card-kicker');
      else if(ctx.field==='title')target=card.querySelector('h3,.custom-stat');
      else if(ctx.field==='body')target=card.querySelector('.bsmnt-card-copy p');
      else if(ctx.field==='list'){
        const items=card.querySelectorAll('.bsmnt-card-copy li');
        target=items[ctx.itemIndex]||null
      }
      if(target&&target!==sourceEl)target.textContent=value
    })
  }
}
function applyPageInlineEditsToDom(root=document){
  if(!root?.querySelectorAll)return;
  const nodes=root.querySelectorAll(
    '.site-content-card:not(.performance-custom-card) .site-card-kicker,'+
    '.site-content-card:not(.performance-custom-card) h3,'+
    '.site-content-card:not(.performance-custom-card) p,'+
    '.site-content-card:not(.performance-custom-card) li'
  );
  nodes.forEach(el=>{
    if(el===inlinePageTextActiveEl)return;
    const key=inlinePageDefaultKey(el);
    if(key&&Object.prototype.hasOwnProperty.call(pageInlineEdits,key))el.textContent=pageInlineEdits[key]
  });
  root.querySelectorAll?.('#siteHeroCopy [data-inline-hero]')?.forEach(el=>{
    if(el===inlinePageTextActiveEl)return;
    const key='hero::'+(el.getAttribute('data-inline-hero')||'field');
    if(Object.prototype.hasOwnProperty.call(pageInlineEdits,key))el.textContent=pageInlineEdits[key]
  });
  refreshPageEmptyFlow?.(root)
}
function saveInlinePageText(el){
  if(!el)return;
  const ctx=inlinePageContext(el);if(!ctx)return;
  const value=inlinePageTextValue(el);
  el.textContent=value;

  if(ctx.kind==='hero'){
    pageInlineEdits[ctx.key]=value;
    if(['kicker','heading','intro'].includes(ctx.field)){
      ensurePerformancePageState();
      const map={kicker:'kicker',heading:'heading',intro:'intro'};
      if(performancePageState.explore)performancePageState.explore[map[ctx.field]]=value
    }
  }else if(ctx.kind==='header'){
    ensurePerformancePageState();
    if(performancePageState[ctx.section])performancePageState[ctx.section][ctx.field]=value;
    syncInlinePageMirrors(ctx,value,el)
  }else if(ctx.kind==='custom'){
    ensurePerformancePageState();
    const block=(performancePageState[ctx.section]?.blocks||[]).find(b=>b.id===ctx.blockId);
    if(block){
      if(ctx.field==='list'){
        const card=el.closest('.performance-custom-card');
        block.body=[...card.querySelectorAll('.bsmnt-card-copy li')].map(x=>inlinePageTextValue(x)).filter(Boolean).join('\n')
      }else block[ctx.field]=value
    }
    syncInlinePageMirrors(ctx,value,el)
  }else if(ctx.kind==='default'){
    pageInlineEdits[ctx.key]=value;
    applyPageInlineEditsToDom()
  }

  try{localStorage.setItem('mothershipPageInlineEditsV1',JSON.stringify(capturePageInlineEditState()))}catch(e){}
  try{localStorage.setItem('mothershipPerformancePagesV1',JSON.stringify(capturePerformancePageState()))}catch(e){}
  if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true);
  refreshPageEmptyFlow?.();
  syncPerformancePageBuilderUI?.()
}
function finishInlinePageTextEdit({cancel=false}={}){
  const el=inlinePageTextActiveEl;if(!el)return;
  inlinePageTextCancelled=cancel;
  if(cancel&&el.dataset.inlineOriginal!=null)el.innerText=el.dataset.inlineOriginal;
  if(!cancel)saveInlinePageText(el);
  el.removeAttribute('contenteditable');
  el.removeAttribute('spellcheck');
  el.classList.remove('inline-page-text-editing');
  delete el.dataset.inlineOriginal;
  inlinePageTextActiveEl=null;
  inlinePageTextCancelled=false
}
function beginInlinePageTextEdit(el){
  if(!pageInlineOwnerEnabled()||!el)return;
  if(inlinePageTextActiveEl&&inlinePageTextActiveEl!==el)finishInlinePageTextEdit();
  if(inlinePageTextActiveEl===el)return;

  inlinePageTextActiveEl=el;
  pageTextStyleTargetKey=inlinePageStyleKey(el);
  syncPageTextSizeControl(el);
  el.dataset.inlineOriginal=inlinePageTextValue(el);
  el.setAttribute('contenteditable','true');
  el.setAttribute('spellcheck','true');
  el.classList.add('inline-page-text-editing');
  el.focus({preventScroll:true});

  const range=document.createRange(),sel=window.getSelection();
  try{range.selectNodeContents(el);range.collapse(false);sel.removeAllRanges();sel.addRange(range)}catch(e){}
}
function initInlinePageTextEditor(){
  const site=document.getElementById('promoterSite');
  if(!site||site.dataset.inlinePageEditorBound==='1')return;
  site.dataset.inlinePageEditorBound='1';

  site.addEventListener('click',e=>{
    if(!pageInlineOwnerEnabled())return;
    const hero=e.target?.closest?.('#siteHeroCopy [data-inline-hero]');
    if(!hero)return;
    e.preventDefault();e.stopPropagation();
    beginInlinePageTextEdit(hero)
  },true);

  site.addEventListener('click',e=>{
    if(!pageInlineOwnerEnabled())return;
    const el=inlinePageEditableTarget(e.target);if(!el)return;
    e.preventDefault();e.stopPropagation();
    beginInlinePageTextEdit(el)
  },true);

  site.addEventListener('keydown',e=>{
    if(!inlinePageTextActiveEl||e.target!==inlinePageTextActiveEl)return;
    const ctx=inlinePageContext(inlinePageTextActiveEl);
    const singleLine=ctx?.kind==='header'&&ctx.field!=='intro' ||
      ctx?.kind==='custom'&&['kicker','title','list'].includes(ctx.field) ||
      inlinePageTextActiveEl.matches('.site-card-kicker,h3,.custom-stat,li');

    if(e.key==='Escape'){
      e.preventDefault();finishInlinePageTextEdit({cancel:true});return
    }
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
      e.preventDefault();finishInlinePageTextEdit();return
    }
    if(singleLine&&e.key==='Enter'){
      e.preventDefault();finishInlinePageTextEdit()
    }
  });

  site.addEventListener('focusout',e=>{
    if(e.target===inlinePageTextActiveEl){
      setTimeout(()=>{if(inlinePageTextActiveEl===e.target)finishInlinePageTextEdit()},0)
    }
  });

  document.body.classList.toggle('inline-page-text-active',pageInlineOwnerEnabled());
  applyPageInlineEditsToDom()
}

const PERFORMANCE_PAGE_SECTION_IDS={explore:'siteOverviewContent',venue:'siteVenue',hire:'siteHire',production:'siteProduction',marketing:'siteMarketing',past:'sitePast',contact:'siteContact'};
const PERFORMANCE_PAGE_LABELS={explore:'OVERVIEW',venue:'VENUE',hire:'HIRE',production:'PRODUCTION',marketing:'MARKETING',past:'PAST EVENTS',contact:'CONTACT'};
const TECH_SPECS_PERFORMANCE_PAGE_DEFAULTS={"explore":{"kicker":"00 \u00b7 AT A GLANCE","heading":"WELCOME TO THE MOTHERSHIP","intro":"A sanctuary for live music, club culture and creative events. Explore the room, click the venue itself, or jump straight to the information you need.","showDefault":true,"blocks":[],"layout":"grid","stacking":"off","stackOffset":10,"cardGap":20,"hoverImage":"off","imageStyle":"mono","imageRatio":"landscape","smoothness":0},"venue":{"kicker":"01 \u00b7 VENUE","heading":"THE VENUE","intro":"","showDefault":true,"blocks":[],"layout":"grid","stacking":"off","stackOffset":10,"cardGap":18,"hoverImage":"off","imageStyle":"mono","imageRatio":"landscape","smoothness":0},"hire":{"kicker":"02 \u00b7 HIRE","heading":"HIRE","intro":"A flexible, fully equipped venue for live music, club nights, private events and creative projects.","showDefault":true,"blocks":[],"layout":"grid","stacking":"off","stackOffset":10,"cardGap":18,"hoverImage":"off","imageStyle":"mono","imageRatio":"landscape","smoothness":0},"production":{"kicker":"03 \u00b7 PRODUCTION","heading":"PRODUCTION","intro":"House stage, audio, DJ, lighting, visuals, backline and recording information for advancing a show at The Mothership.","showDefault":false,"blocks":[{"id":"spec_prod_contact","type":"callout","width":"full","tone":"accent","kicker":"TECHNICAL DIRECTOR","title":"Patrick Hawkins","body":"Production is managed by Patrick Hawkins. Touring-console integration, additional production, technical changes and show-specific requirements should be advanced with the production team.","image":"","button":"EMAIL PRODUCTION","url":"mailto:patrick@themothership.co.nz"},{"id":"spec_prod_stage","type":"list","width":"half","tone":"standard","kicker":"STAGE","title":"Dimensions + Construction","body":"Usable stage: 5.44 m wide \u00d7 4.90 m deep\nStage height: approx. 0.56 m\nStage-to-ceiling: 2.20 m\nStage to lowest structural beam: 1.68 m\nTimber structure with black carpet finish\nLimited stage-left + stage-right wing space\nBlack stage curtains can be arranged if required","image":"","button":"","url":""},{"id":"spec_prod_room","type":"list","width":"half","tone":"standard","kicker":"ROOM / FOH","title":"Room Heights + FOH","body":"Main room ceiling: 2.58 m\nBeam underside over dancefloor: 2.24 m\nRaised areas: approx. 0.33 m above main floor\nFOH area: approx. 1.74 m \u00d7 2.28 m\nRecommended touring multicore length: 20 m minimum","image":"","button":"","url":""},{"id":"spec_prod_pa","type":"list","width":"full","tone":"accent","kicker":"AUDIO \u00b7 MAIN PA","title":"Adamson House System","body":"8 \u00d7 Adamson Metrix line-array modules\n2 \u00d7 Adamson S119i subs\n2 \u00d7 Adamson Metrix subs\n2 \u00d7 DAS Event-218 dual-18 active subs\n2 \u00d7 DAS Vantec 215-A active fill / satellite speakers\n1 \u00d7 DAS Vantec 215-A delay / satellite speaker\n2 \u00d7 Lab Gruppen PLM 20 amplifiers\nLake DSP via Lab Gruppen PLM 20","image":"","button":"","url":""},{"id":"spec_prod_foh","type":"list","width":"half","tone":"standard","kicker":"AUDIO \u00b7 FOH","title":"Control + I/O","body":"Midas M32 \u2014 tablet linkable\n2 \u00d7 Midas DL16 stageboxes via Cat5\nOptional Dante expansion can be arranged\nTouring-console handoff by prior arrangement with Technical Director\nNo native MADI in the current house system\nNo native Waves SoundGrid server / processing","image":"","button":"","url":""},{"id":"spec_prod_monitors","type":"list","width":"half","tone":"standard","kicker":"AUDIO \u00b7 MONITORS","title":"Stage Monitoring","body":"Monitor mixes operated from the house Midas M32\n2 \u00d7 DL16 house stageboxes\n4 \u00d7 DAS 12-inch active stage monitors","image":"","button":"","url":""},{"id":"spec_prod_mics","type":"list","width":"half","tone":"standard","kicker":"AUDIO \u00b7 MICROPHONES","title":"House Inventory","body":"1 \u00d7 Audix DP5A drum mic kit\n3 \u00d7 Shure SM58\n2 \u00d7 Shure SM57\n4 \u00d7 Beyerdynamic TG I51\n10 \u00d7 tall tripod-base mic stands with clips\n1 \u00d7 short boom mic stand","image":"","button":"","url":""},{"id":"spec_prod_cabling","type":"list","width":"half","tone":"minimal","kicker":"AUDIO \u00b7 CABLING","title":"House Cabling","body":"10 \u00d7 XLR M\u2013F cables in various lengths\n5 \u00d7 jack-to-jack instrument cables\nTalkback available\nStage fans available","image":"","button":"","url":""},{"id":"spec_prod_soundcheck","type":"callout","width":"full","tone":"accent","kicker":"SOUND CHECK","title":"6PM earliest full soundcheck","body":"Full soundchecks cannot begin before 6pm. Load-in, setup and line checks may happen earlier. Typical line check is approximately one hour before doors.","image":"","button":"","url":""},{"id":"spec_prod_dj","type":"list","width":"half","tone":"standard","kicker":"DJ","title":"House Setup","body":"4 \u00d7 Pioneer CDJ-3000\n1 \u00d7 Pioneer DJM-900NXS2\n1 \u00d7 Pioneer DJM-V10 available as an alternative mixer\nNo house turntables\nDJ equipment included in venue hire\nDJ booth normally on stage and can be moved","image":"","button":"","url":""},{"id":"spec_prod_lighting","type":"list","width":"half","tone":"standard","kicker":"LIGHTING","title":"House Rig","body":"ChamSys Maxi-Wing running MagicQ on PC\n4 \u00d7 Chauvet Intimidator scanners\n8 \u00d7 MadScan scanners\n4 \u00d7 LED PARs facing stage\n2 \u00d7 DMX-controlled blinders\n2 \u00d7 strobes\n4 \u00d7 LED battens on stage\n1 \u00d7 Diffusion DF50 hazer","image":"","button":"","url":""},{"id":"spec_prod_rig_policy","type":"callout","width":"full","tone":"minimal","kicker":"LIGHTING / RIGGING POLICY","title":"Advance additional production first","body":"The house lighting rig is not to be re-rigged and touring fixtures cannot be flown without prior approval. Do not unplug house production equipment, drill into surfaces or attach anything to the ceiling / painted surfaces without discussing it with the production team first.","image":"","button":"","url":""},{"id":"spec_prod_visuals","type":"list","width":"half","tone":"standard","kicker":"VISUALS","title":"Screens + Control","body":"Rear-stage twin-screen display\n2 \u00d7 55-inch wall-mounted screens\nCombined resolution: 3840 \u00d7 1080 px\nResolume\nDedicated house visuals PC\nHDMI input\nHDMI over Cat5 extender to screen controller\nHouse HDMI wall controller / extender","image":"","button":"","url":""},{"id":"spec_prod_backline","type":"list","width":"full","tone":"standard","kicker":"BACKLINE","title":"House Equipment","body":"1 \u00d7 Tama drum kit\n1 \u00d7 Vox AC50 guitar amp\n1 \u00d7 Orange Terror head\n1 \u00d7 Orange twin cab\n1 \u00d7 Marshall 1960 quad cabinet\n1 \u00d7 JCM800 guitar head\n1 \u00d7 Ampeg bass head\n1 \u00d7 Ampeg 8\u00d710 bass cabinet\nKeyboard stands\nGuitar stands\nAmp stands","image":"","button":"","url":""},{"id":"spec_prod_stagegear","type":"list","width":"half","tone":"minimal","kicker":"STAGE EQUIPMENT","title":"Additional Stage Gear","body":"Adjustable risers approx. 0.5\u20131.5 m\nRolling legs / wheels\nDJ riser\nBanner / backdrop support via metal bars\n3 \u00d7 stage fans\nSandbags / weights\nMusic stands, stools + chairs","image":"","button":"","url":""},{"id":"spec_prod_recording","type":"list","width":"half","tone":"standard","kicker":"RECORDING","title":"Audio","body":"Recording connection available\nDedicated recording computer / wired console connection\nRaw / unedited / unmastered WAV delivery options\nRecording service: approx. $50\u2013$150 + GST depending on deliverables","image":"","button":"","url":""},{"id":"spec_prod_video","type":"list","width":"half","tone":"standard","kicker":"VIDEO CAPTURE","title":"Optional Capture","body":"Fixed / planned camera positions available around stage and dancefloor\nVideo recording available\nLivestream not currently available\nVideo capture packages: approx. $100\u2013$250 + GST\nPackages can include synced audio, promo edit, logos and other deliverables","image":"","button":"","url":""},{"id":"spec_prod_wifi","type":"card","width":"half","tone":"minimal","kicker":"INTERNET","title":"Artist + Crew Wi-Fi","body":"Wi-Fi is available for artists and crew.","image":"","button":"","url":""},{"id":"spec_prod_rules","type":"list","width":"full","tone":"accent","kicker":"HOUSE RULES","title":"Production + Safety","body":"No pyro\nConfetti: $95 + GST cleaning fee; otherwise not permitted\nLaser use requires full knowledge and safe operation\nHaze / smoke is permitted\nNo full soundcheck before 6pm\nPack down your own equipment and leave venue / green-room areas tidy\nLoad-out expected within 1 hour of event finish unless otherwise arranged","image":"","button":"","url":""},{"id":"spec_prod_floorplan","type":"card","width":"half","tone":"standard","kicker":"DOWNLOAD","title":"Venue Floorplan","body":"Current venue floorplan / technical layout.","image":"","button":"OPEN FLOORPLAN","url":"https://drive.google.com/file/d/1Rg30XkJBD9yNU9X-td2pE9NPhPzd7DnP/view?usp=sharing"},{"id":"spec_prod_stageplan","type":"card","width":"half","tone":"standard","kicker":"DOWNLOAD","title":"Stage Plan","body":"Dimensioned stage-plan resources.","image":"","button":"OPEN STAGE PLAN","url":"https://drive.google.com/drive/u/1/search?q=stage"},{"id":"spec_prod_accessphotos","type":"card","width":"half","tone":"minimal","kicker":"DOWNLOAD","title":"Load-in + Venue Photos","body":"Access, load-in, green-room and venue reference photos.","image":"","button":"OPEN PHOTOS","url":"https://drive.google.com/drive/folders/1p2ZGNBS4OPxUuq1fiRS-0I4TpZLjp6om?usp=drive_link"},{"id":"spec_prod_shared","type":"card","width":"half","tone":"minimal","kicker":"DOWNLOAD","title":"Production Folder","body":"Shared production downloads and technical resources.","image":"","button":"OPEN PRODUCTION FOLDER","url":"https://drive.google.com/drive/folders/1zZlAW4UqWGYmV-QFZx-SvDrpBYrNxWCJ?usp=drive_link"}],"layout":"stack","stacking":"deck","stackOffset":10,"cardGap":18,"hoverImage":"cursor","imageStyle":"mono","imageRatio":"landscape","smoothness":64},"marketing":{"kicker":"04 \u00b7 MARKETING","heading":"MARKETING","intro":"","showDefault":true,"blocks":[],"layout":"grid","stacking":"off","stackOffset":10,"cardGap":18,"hoverImage":"off","imageStyle":"mono","imageRatio":"landscape","smoothness":0},"past":{"kicker":"05 \u00b7 PAST EVENTS","heading":"WHAT WE'VE DONE","intro":"A visual archive of memorable touring acts, club nights and live performances that show the scale and range of the room.","showDefault":true,"blocks":[],"layout":"projects","stacking":"off","stackOffset":10,"cardGap":10,"hoverImage":"cursor","imageStyle":"mono","imageRatio":"landscape","smoothness":64},"contact":{"kicker":"06 \u00b7 CONTACT","heading":"CONTACT","intro":"","showDefault":true,"blocks":[],"layout":"grid","stacking":"off","stackOffset":10,"cardGap":18,"hoverImage":"off","imageStyle":"mono","imageRatio":"landscape","smoothness":0}};
let performancePageState=null,performancePageOriginalDefaults=null,activePerformancePageBlockId='';
function clonePerformancePageValue(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return v}}
function performanceEscapeHTML(v){return String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function ensurePerformanceOverviewSection(){
  let sec=document.getElementById('siteOverviewContent');if(sec)return sec;
  const hero=document.getElementById('siteHero');if(!hero)return null;
  sec=document.createElement('section');sec.className='site-section';sec.id='siteOverviewContent';sec.dataset.siteSection='explore';
  const grid=document.createElement('div');grid.className='site-content-grid performance-custom-grid';sec.appendChild(grid);hero.insertAdjacentElement('afterend',sec);return sec
}
function performancePageSectionElement(section){if(section==='explore')return ensurePerformanceOverviewSection();return document.getElementById(PERFORMANCE_PAGE_SECTION_IDS[section])}
function performancePageHeaderFromDOM(section){
  if(section==='explore'){
    const hero=document.getElementById('siteHero');return {kicker:hero?.querySelector('.site-eyebrow')?.textContent||'',heading:(hero?.querySelector('h1')?.innerHTML||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,''),intro:hero?.querySelector('p')?.textContent||'',showDefault:true,blocks:[]}
  }
  const sec=performancePageSectionElement(section);return {kicker:sec?.querySelector('.site-section-number')?.textContent||'',heading:sec?.querySelector('h2')?.textContent||'',intro:sec?.querySelector('.site-section-intro')?.textContent||'',showDefault:true,blocks:[]}
}
function buildPerformancePageDefaults(){return clonePerformancePageValue(TECH_SPECS_PERFORMANCE_PAGE_DEFAULTS)}
function ensurePerformancePageState(){
  ensurePerformanceOverviewSection();
  if(!performancePageOriginalDefaults)performancePageOriginalDefaults=buildPerformancePageDefaults();
  if(!performancePageState)performancePageState=clonePerformancePageValue(performancePageOriginalDefaults);
  Object.keys(PERFORMANCE_PAGE_SECTION_IDS).forEach(k=>{
    if(!performancePageState[k])performancePageState[k]=clonePerformancePageValue(performancePageOriginalDefaults[k]);
    if(!Array.isArray(performancePageState[k].blocks))performancePageState[k].blocks=[];
    const base=performancePageOriginalDefaults[k]||{};
    ['layout','stacking','stackOffset','cardGap','hoverImage','imageStyle','imageRatio','smoothness'].forEach(prop=>{
      if(performancePageState[k][prop]==null)performancePageState[k][prop]=base[prop]
    })
  });
  return performancePageState
}
function capturePerformancePageState(){ensurePerformancePageState();return clonePerformancePageValue(performancePageState)}
function safePerformanceLink(url){url=String(url||'').trim();if(!url)return '';if(/^(https?:|mailto:|tel:|#|\/)/i.test(url))return url;return ''}
function renderPerformancePageBlock(block){
  const hasImage=!!String(block.image||'').trim(),type=block.type||'card';
  const art=document.createElement('article');
  art.className='site-content-card performance-custom-card width-'+(block.width||'third')+' tone-'+(block.tone||'standard')+(type==='callout'?' performance-callout':'')+(hasImage?' has-image':'');
  art.dataset.performanceBlockId=block.id;
  if(hasImage)art.dataset.previewImage=block.image;

  const kicker=performanceEscapeHTML(block.kicker||''),title=performanceEscapeHTML(block.title||''),body=String(block.body||'');

  // Keep empty text nodes in the DOM. Public preview hides them; Edit Page Details
  // shows a tiny + ADD TEXT point so deleted content can be restored.
  let titleHTML='<div class="site-card-kicker">'+kicker+'</div>';
  if(type==='stat')titleHTML+='<div class="custom-stat">'+title+'</div>';
  else titleHTML+='<h3>'+title+'</h3>';

  let copyHTML='';
  if(type==='list'){
    const lines=body.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const editableLines=lines.length?lines:[''];
    copyHTML+='<ul>'+editableLines.map(x=>'<li>'+performanceEscapeHTML(x)+'</li>').join('')+'</ul>'
  }else{
    copyHTML+='<p>'+performanceEscapeHTML(body).replace(/\n/g,'<br>')+'</p>'
  }

  const href=safePerformanceLink(block.url),label=String(block.button||'').trim();
  if(label)copyHTML+=href
    ?'<a class="custom-link" href="'+performanceEscapeHTML(href)+'" target="_blank" rel="noopener">'+performanceEscapeHTML(label)+' →</a>'
    :'<span class="custom-link">'+performanceEscapeHTML(label)+' →</span>';

  const mediaHTML=hasImage?'<img src="'+performanceEscapeHTML(block.image)+'" alt="'+performanceEscapeHTML(block.title||'Venue pack image')+'">':'';
  art.innerHTML='<div class="bsmnt-card-inner"><div class="bsmnt-card-title">'+titleHTML+'</div><div class="bsmnt-card-media">'+mediaHTML+'</div><div class="bsmnt-card-copy">'+copyHTML+'</div></div>';
  return art
}

function performancePageDesign(section){
  ensurePerformancePageState();
  const d=performancePageState?.[section]||{};
  return {
    layout:d.layout||'grid',
    stacking:d.stacking||'off',
    stackOffset:Math.max(0,Math.min(28,+d.stackOffset||10)),
    cardGap:Math.max(0,Math.min(40,+d.cardGap||12)),
    hoverImage:d.hoverImage||'off',
    imageStyle:d.imageStyle||'mono',
    imageRatio:d.imageRatio||'auto',
    smoothness:Math.max(0,Math.min(100,+d.smoothness||0))
  }
}
function applyPerformanceGridDesign(grid,section){
  if(!grid)return;
  const d=performancePageDesign(section);
  [...grid.classList].filter(c=>/^bsmnt-layout-|^stack-|^image-style-|^image-ratio-/.test(c)).forEach(c=>grid.classList.remove(c));
  grid.classList.add('bsmnt-layout-'+d.layout,'stack-'+d.stacking,'image-style-'+d.imageStyle,'image-ratio-'+d.imageRatio);
  grid.dataset.pageSection=section;
  grid.dataset.hoverMode=d.hoverImage;
  grid.dataset.imageStyle=d.imageStyle;
  grid.dataset.imageRatio=d.imageRatio;
  grid.style.setProperty('--bsmnt-stack-offset',d.stackOffset+'px');
  grid.style.setProperty('--bsmnt-card-gap',d.cardGap+'px');
  [...grid.querySelectorAll(':scope > .site-content-card')].forEach((card,i)=>{
    card.style.setProperty('--stack-index',i);
    card.style.setProperty('--stack-depth-index',Math.min(i,7));
    card.style.zIndex=String(10+i);
  });
  bsmntSetupInteractiveCards(grid);
}
function applyPerformancePageDesign(section){
  const sec=performancePageSectionElement(section);if(!sec)return;
  const d=performancePageDesign(section);
  [...sec.classList].filter(c=>/^perf-layout-/.test(c)).forEach(c=>sec.classList.remove(c));
  sec.classList.add('perf-layout-'+d.layout);
  sec.dataset.performanceLayout=d.layout;
  [...sec.querySelectorAll(':scope > .site-content-grid')].forEach(g=>applyPerformanceGridDesign(g,section));
}
let bsmntCardObserver=null;
function bsmntObserverRoot(){
  return document.body.classList.contains('site-info-expanded')?siteActiveInfoElement():null
}
function bsmntEnsureObserver(){
  if(bsmntCardObserver)bsmntCardObserver.disconnect();
  bsmntCardObserver=null
}
function bsmntSetupInteractiveCards(root=document){
  root.querySelectorAll?.('.site-content-card').forEach(card=>{
    card.classList.add('bsmnt-enter','bsmnt-inview');
    const img=card.dataset.previewImage||card.querySelector('img')?.src||'';
    if(!img)return;
    card.dataset.previewImage=img;
    if(!card.dataset.bsmntHoverBound){
      card.dataset.bsmntHoverBound='1';
      card.addEventListener('pointerenter',e=>bsmntHoverEnter(card,e),{passive:true});
      card.addEventListener('pointermove',e=>bsmntHoverMove(card,e),{passive:true});
      card.addEventListener('pointerleave',()=>bsmntHoverLeave(card),{passive:true})
    }
  })
}
const bsmntHoverState={visible:false,x:-9999,y:-9999,tx:-9999,ty:-9999,raf:0,hideTimer:0,card:null};
function bsmntHoverElements(){
  return {
    root:document.getElementById('bsmntHoverPreview'),
    img:document.getElementById('bsmntHoverImage'),
    pixels:document.getElementById('bsmntHoverPixels')
  }
}
function bsmntHoverConfig(card){
  const grid=card?.closest('.site-content-grid');
  const section=grid?.dataset.pageSection||card?.closest('.overview-rollup-section')?.dataset.overviewSection||siteActiveSection;
  const d=performancePageDesign(section);
  return {mode:grid?.dataset.hoverMode||d.hoverImage,style:grid?.dataset.imageStyle||d.imageStyle,ratio:grid?.dataset.imageRatio||d.imageRatio}
}
function bsmntHoverSetRatio(root,ratio){
  root.style.aspectRatio=ratio==='landscape'?'16 / 10':ratio==='square'?'1 / 1':'4 / 5';
}
function bsmntHoverLoop(){
  const s=bsmntHoverState,{root}=bsmntHoverElements();if(!root){s.raf=0;return}
  s.x+=(s.tx-s.x)*.16;s.y+=(s.ty-s.y)*.16;
  root.style.transform='translate3d('+s.x.toFixed(2)+'px,'+s.y.toFixed(2)+'px,0)';
  if(s.visible||Math.abs(s.tx-s.x)>.3||Math.abs(s.ty-s.y)>.3)s.raf=requestAnimationFrame(bsmntHoverLoop);else s.raf=0
}
function bsmntHoverTarget(e,mode,root){
  const w=root.offsetWidth||420,h=root.offsetHeight||520;
  if(mode==='center')return {x:(innerWidth-w)/2,y:(innerHeight-h)/2+14};
  const pad=24;
  let x=(e?.clientX||innerWidth*.5)+26,y=(e?.clientY||innerHeight*.5)-h*.48;
  if(x+w>innerWidth-pad)x=(e?.clientX||innerWidth*.5)-w-26;
  x=Math.max(pad,Math.min(innerWidth-w-pad,x));y=Math.max(58,Math.min(innerHeight-h-pad,y));
  return {x,y}
}
function bsmntBuildPixelDissolve(src){
  const {pixels}=bsmntHoverElements();if(!pixels)return;
  pixels.innerHTML='';
  const cols=8,rows=6,total=cols*rows;
  for(let i=0;i<total;i++){
    const x=i%cols,y=Math.floor(i/cols),p=document.createElement('i');p.className='pixel';
    p.style.backgroundImage='url("'+String(src).replace(/"/g,'%22')+'")';
    p.style.backgroundSize=(cols*100)+'% '+(rows*100)+'%';
    p.style.backgroundPosition=(cols===1?0:x/(cols-1)*100)+'% '+(rows===1?0:y/(rows-1)*100)+'%';
    const edge=(x/cols)*.45+(y/rows)*.22,noise=((i*37)%31)/31;
    p.style.setProperty('--pixel-delay',Math.round((edge+noise*.32)*190)+'ms');
    pixels.appendChild(p)
  }
}
function bsmntHoverEnter(card,e){
  if(innerWidth<=720||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const src=card?.dataset.previewImage;if(!src)return;
  const cfg=bsmntHoverConfig(card);if(cfg.mode==='off')return;
  const {root,img,pixels}=bsmntHoverElements();if(!root||!img)return;
  clearTimeout(bsmntHoverState.hideTimer);bsmntHoverState.card=card;bsmntHoverState.visible=true;
  root.classList.remove('is-dissolving','mono','muted','colour','center-mode');
  root.classList.add(cfg.style||'mono');if(cfg.mode==='center')root.classList.add('center-mode');
  bsmntHoverSetRatio(root,cfg.ratio);if(pixels)pixels.innerHTML='';
  img.src=src;img.alt=card.querySelector('h3')?.textContent||'Venue image';img.style.opacity='1';
  root.classList.add('is-visible');
  const pt=bsmntHoverTarget(e,cfg.mode,root);bsmntHoverState.tx=pt.x;bsmntHoverState.ty=pt.y;
  if(bsmntHoverState.x<-9000){bsmntHoverState.x=pt.x;bsmntHoverState.y=pt.y}
  if(!bsmntHoverState.raf)bsmntHoverState.raf=requestAnimationFrame(bsmntHoverLoop)
}
function bsmntHoverMove(card,e){
  if(!bsmntHoverState.visible||bsmntHoverState.card!==card)return;
  const cfg=bsmntHoverConfig(card),{root}=bsmntHoverElements();if(!root)return;
  const pt=bsmntHoverTarget(e,cfg.mode,root);bsmntHoverState.tx=pt.x;bsmntHoverState.ty=pt.y
}
function bsmntHoverLeave(card){
  if(bsmntHoverState.card!==card)return;
  const {root,img}=bsmntHoverElements();if(!root||!img)return;
  const src=card.dataset.previewImage||img.src;bsmntBuildPixelDissolve(src);
  root.classList.add('is-dissolving');bsmntHoverState.visible=false;bsmntHoverState.card=null;
  clearTimeout(bsmntHoverState.hideTimer);
  bsmntHoverState.hideTimer=setTimeout(()=>{root.classList.remove('is-visible','is-dissolving');img.removeAttribute('src')},620)
}
function bsmntHideHoverImmediate(){
  const {root,img,pixels}=bsmntHoverElements();clearTimeout(bsmntHoverState.hideTimer);bsmntHoverState.visible=false;bsmntHoverState.card=null;
  if(root)root.classList.remove('is-visible','is-dissolving');if(img)img.removeAttribute('src');if(pixels)pixels.innerHTML=''
}
const bsmntSmoothState={el:null,target:0,current:0,raf:0};
function bsmntResetSmoothScroll(el=null){
  if(bsmntSmoothState.raf)cancelAnimationFrame(bsmntSmoothState.raf);
  bsmntSmoothState.raf=0;bsmntSmoothState.el=el;
  bsmntSmoothState.current=el?el.scrollTop:0;
  bsmntSmoothState.target=bsmntSmoothState.current;
  if(el)el.style.scrollBehavior='auto'
}
function bsmntSmoothStep(){bsmntSmoothState.raf=0}
function bsmntHandleExpandedWheel(e,el){
  // V136: never intercept wheel / trackpad gestures.
  // Browser-native scrolling is allowed in both directions at all times.
  return false
}

function ensurePerformanceCustomGrid(section){
  const sec=performancePageSectionElement(section);if(!sec)return null;let grid=sec.querySelector('.performance-custom-grid');if(!grid){grid=document.createElement('div');grid.className='site-content-grid performance-custom-grid';sec.appendChild(grid)}return grid
}
function renderPerformancePage(section,{skipRollup=false}={}){
  ensurePerformancePageState();const data=performancePageState[section],sec=performancePageSectionElement(section);if(!data||!sec)return;
  if(section==='explore'){
    const hero=document.getElementById('siteHero'),eye=hero?.querySelector('.site-eyebrow'),h=hero?.querySelector('h1'),p=hero?.querySelector('p');if(eye)eye.textContent=data.kicker||'';if(h)h.innerHTML=performanceEscapeHTML(data.heading||'').replace(/\n/g,'<br>');if(p)p.textContent=data.intro||'';
  }else{
    const k=sec.querySelector('.site-section-number'),h=sec.querySelector('h2'),p=sec.querySelector('.site-section-intro');if(k)k.textContent=data.kicker||'';if(h)h.textContent=data.heading||'';if(p)p.textContent=data.intro||'';
    [...sec.querySelectorAll(':scope > .site-content-grid:not(.performance-custom-grid)')].forEach(g=>g.style.display=data.showDefault===false?'none':'grid')
  }
  const grid=ensurePerformanceCustomGrid(section);if(grid){grid.innerHTML='';data.blocks.forEach(b=>grid.appendChild(renderPerformancePageBlock(b)))}
  applyPerformancePageDesign(section);
  ensureSiteInfoTitlePanel?.(section);
  if(!skipRollup&&section!=='explore'&&typeof renderOverviewRollup==='function'&&performancePageState)renderOverviewRollup();
  applyPageInlineEditsToDom?.(sec);
  applyPageInlineStylesToDom?.(sec);
  applyPageDetailSectionVisibility?.(sec);
  applyPageModularLayout?.(sec);
  applyPageGapToElement?.(sec,section);
  refreshPageEmptyFlow?.(sec);
  dedupePageEditorArtifacts?.(sec)
}

function dedupePageEditorArtifacts(root=document){
  root.querySelectorAll?.('.site-content-card').forEach(card=>{
    const controls=[...card.children].filter(el=>el.classList?.contains('page-module-controls'));
    controls.slice(1).forEach(el=>el.remove());

    const deleteControls=[...card.children].filter(el=>el.classList?.contains('page-detail-section-control'));
    deleteControls.slice(1).forEach(el=>el.remove());

    const images=[...card.children].filter(el=>el.classList?.contains('page-module-attached-image'));
    images.slice(1).forEach(el=>el.remove())
  });

  root.querySelectorAll?.('.site-section[data-site-section]').forEach(sec=>{
    const panels=[...sec.children].filter(el=>el.classList?.contains('site-info-title-panel'));
    panels.slice(1).forEach(el=>el.remove())
  })
}
function cleanOverviewClone(root){
  if(!root)return root;
  root.querySelectorAll?.('.page-module-controls,.page-detail-section-control').forEach(el=>el.remove());
  root.classList?.remove('page-module-dragging','page-module-drop-before','page-module-drop-after','page-module-cross-drop');
  dedupePageEditorArtifacts(root);
  return root
}

function stripOverviewCloneIds(root){
  if(!root)return root;
  if(root.removeAttribute)root.removeAttribute('id');
  root.querySelectorAll?.('[id]').forEach(n=>n.removeAttribute('id'));
  return root
}
function renderOverviewRollup(){
  ensurePerformancePageState();
  dedupePageContentModules?.(document);
  const overview=ensurePerformanceOverviewSection();if(!overview)return;
  let holder=overview.querySelector('.overview-all-tabs');
  if(!holder){holder=document.createElement('div');holder.className='overview-all-tabs';overview.appendChild(holder)}
  holder.innerHTML='';

  ['venue','hire','production','marketing','past','contact'].forEach(section=>{
    const src=performancePageSectionElement(section),data=performancePageState[section];
    if(!src||!data)return;

    const wrap=document.createElement('section');
    wrap.className='overview-rollup-section perf-layout-'+performancePageDesign(section).layout;
    wrap.dataset.overviewSection=section;

    const head=document.createElement('div');
    head.className='overview-rollup-head';
    head.innerHTML=
      '<div class="overview-rollup-kicker">'+performanceEscapeHTML(data.kicker||PERFORMANCE_PAGE_LABELS[section])+'</div>'+
      '<h3>'+performanceEscapeHTML(data.heading||PERFORMANCE_PAGE_LABELS[section])+'</h3>'+
      (data.intro?'<p>'+performanceEscapeHTML(data.intro)+'</p>':'');
    wrap.appendChild(head);

    // V143: mirror the actual page-detail layout, not a reformatted summary.
    // This keeps each page looking exactly the same inside Overview.
    [...src.children].forEach(child=>{
      if(
        child.classList?.contains('site-section-number') ||
        child.matches?.('h2') ||
        child.classList?.contains('site-section-intro') ||
        child.classList?.contains('site-info-title-panel')
      ) return;

      // Skip an empty generated custom grid, but retain populated custom blocks.
      if(child.classList?.contains('performance-custom-grid') && !child.children.length)return;

      const clone=cleanOverviewClone(stripOverviewCloneIds(child.cloneNode(true)));

      // V145: the two large At A Glance Venue blurbs belong only to the Venue tab.
      // Overview mirrors the rest of Venue without duplicating those statements.
      if(section==='venue'&&clone.classList?.contains('venue-intro-content')){
        clone.querySelector('.venue-intro-kicker')?.remove();
        clone.querySelector('.venue-statement-grid')?.remove();
        if(!clone.children.length)return
      }

      wrap.appendChild(clone)
    });

    holder.appendChild(wrap);

    wrap.querySelectorAll('.site-content-grid').forEach(g=>{
      if(g.classList.contains('performance-custom-grid')||g.classList.contains('site-content-grid')){
        applyPerformanceGridDesign(g,section)
      }
    });

    applyPageInlineEditsToDom?.(wrap);
    applyPageInlineStylesToDom?.(wrap);
    applyPageDetailSectionVisibility?.(wrap);
    applyPageModularLayout?.(wrap);
    applyPageGapToElement?.(wrap,section);
    refreshPageEmptyFlow?.(wrap);
    dedupePageEditorArtifacts?.(wrap)
  });

  bsmntEnsureObserver();
  bsmntSetupInteractiveCards(holder)
}
function renderAllPerformancePages(){
  Object.keys(PERFORMANCE_PAGE_SECTION_IDS).forEach(section=>renderPerformancePage(section,{skipRollup:true}));
  renderOverviewRollup();
  syncSiteInfoTitlePanels();
  applyPageFrameToDom?.();
  applyPageSpacingToDom?.();
  refreshPageEmptyFlow?.();
  dedupePageContentModules?.();
  dedupePageEditorArtifacts?.();
  bsmntEnsureObserver();
  bsmntSetupInteractiveCards(document)
}
function applyPerformancePageState(saved){
  ensurePerformanceOverviewSection();if(!performancePageOriginalDefaults)performancePageOriginalDefaults=buildPerformancePageDefaults();
  performancePageState=saved&&typeof saved==='object'?clonePerformancePageValue(saved):clonePerformancePageValue(performancePageOriginalDefaults);ensurePerformancePageState();renderAllPerformancePages();syncPerformancePageBuilderUI()
}
function loadLocalPerformancePageState(){try{const raw=localStorage.getItem('mothershipPerformancePagesV1');if(raw)applyPerformancePageState(JSON.parse(raw));else applyPerformancePageState(null)}catch(e){applyPerformancePageState(null)}}
function performancePageNewBlock(type='card'){
  return {id:'content_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),type,width:type==='callout'?'full':'third',tone:type==='callout'?'accent':'standard',kicker:'',title:type==='stat'?'350–400':'New content',body:type==='list'?'First item\nSecond item':'Add your text here.',image:'',button:'',url:''}
}
function currentPerformancePageSection(){return document.getElementById('perfPageSection')?.value||'explore'}
function currentPerformanceBlock(){ensurePerformancePageState();const sec=currentPerformancePageSection(),arr=performancePageState[sec]?.blocks||[];return arr.find(b=>b.id===activePerformancePageBlockId)||null}
function syncPerformancePageBlockEditor(){
  ensurePerformancePageState();const sec=currentPerformancePageSection(),blocks=performancePageState[sec].blocks||[],sel=document.getElementById('perfPageBlockSelect');if(sel){sel.innerHTML='<option value="">— '+(blocks.length?'CHOOSE CUSTOM BLOCK':'NO CUSTOM BLOCKS')+' —</option>'+blocks.map((b,i)=>'<option value="'+performanceEscapeHTML(b.id)+'">'+String(i+1).padStart(2,'0')+' · '+performanceEscapeHTML((b.title||b.type||'Block').slice(0,38))+'</option>').join('');if(blocks.some(b=>b.id===activePerformancePageBlockId))sel.value=activePerformancePageBlockId;else{activePerformancePageBlockId='';sel.value=''}}
  const b=currentPerformanceBlock(),set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v==null?'':v};set('perfPageBlockType',b?.type||'card');set('perfPageBlockWidth',b?.width||'third');set('perfPageBlockTone',b?.tone||'standard');set('perfPageBlockKicker',b?.kicker||'');set('perfPageBlockTitle',b?.title||'');set('perfPageBlockBody',b?.body||'');set('perfPageBlockImage',b?.image||'');set('perfPageBlockButton',b?.button||'');set('perfPageBlockUrl',b?.url||'');
  const st=document.getElementById('perfPageBuilderStatus');if(st){st.classList.toggle('active',!!b);st.textContent=b?PERFORMANCE_PAGE_LABELS[sec]+' · editing '+(b.title||b.type):PERFORMANCE_PAGE_LABELS[sec]+' · '+blocks.length+' custom block'+(blocks.length===1?'':'s')}
}
function syncPerformancePageBuilderUI(){
  ensurePerformancePageState();const sec=currentPerformancePageSection(),d=performancePageState[sec];if(!d)return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v==null?'':v};
  set('perfPageKicker',d.kicker);set('perfPageHeading',d.heading);set('perfPageIntro',d.intro);
  set('perfPageLayout',d.layout||'grid');set('perfPageStacking',d.stacking||'off');set('perfPageHoverImage',d.hoverImage||'off');
  set('perfPageImageStyle',d.imageStyle||'mono');set('perfPageImageRatio',d.imageRatio||'auto');set('perfPageSmoothness',d.smoothness??75);
  set('perfPageStackOffset',d.stackOffset??10);set('perfPageCardGap',d.cardGap??12);
  const sval=document.getElementById('perfPageSmoothnessValue');if(sval)sval.textContent=(+(d.smoothness||0)<=0?'NATIVE':String(Math.round(d.smoothness))+'%');
  const oval=document.getElementById('perfPageStackOffsetValue');if(oval)oval.textContent=Math.round(d.stackOffset??10)+'px';
  const gval=document.getElementById('perfPageCardGapValue');if(gval)gval.textContent=Math.round(d.cardGap??12)+'px';
  const tog=document.getElementById('perfPageDefaultToggle');if(tog){const applicable=sec!=='explore';tog.disabled=!applicable;tog.textContent=!applicable?'OVERVIEW · CUSTOM BELOW':(d.showDefault===false?'DEFAULT CONTENT HIDDEN':'SHOW DEFAULT CONTENT');tog.classList.toggle('on',applicable&&d.showDefault!==false)}
  syncPerformancePageBlockEditor();
  syncPageDetailsEditControls?.()
}
function applyPerformancePageHeaderFromUI(){
  ensurePerformancePageState();const sec=currentPerformancePageSection(),d=performancePageState[sec];
  d.kicker=document.getElementById('perfPageKicker')?.value||'';d.heading=document.getElementById('perfPageHeading')?.value||'';d.intro=document.getElementById('perfPageIntro')?.value||'';
  d.layout=document.getElementById('perfPageLayout')?.value||'grid';d.stacking=document.getElementById('perfPageStacking')?.value||'off';
  d.hoverImage=document.getElementById('perfPageHoverImage')?.value||'off';d.imageStyle=document.getElementById('perfPageImageStyle')?.value||'mono';
  d.imageRatio=document.getElementById('perfPageImageRatio')?.value||'auto';d.smoothness=+(document.getElementById('perfPageSmoothness')?.value||0);
  d.stackOffset=+(document.getElementById('perfPageStackOffset')?.value||10);d.cardGap=+(document.getElementById('perfPageCardGap')?.value||12);
  renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI();bsmntResetSmoothScroll(siteActiveInfoElement());
  flashEditor(PERFORMANCE_PAGE_LABELS[sec]+' page + layout updated')
}
function addPerformancePageBlock(type){ensurePerformancePageState();const sec=currentPerformancePageSection(),b=performancePageNewBlock(type);performancePageState[sec].blocks.push(b);activePerformancePageBlockId=b.id;renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI()}
function applyPerformancePageBlockFromUI(){
  const b=currentPerformanceBlock();if(!b){flashEditor('Add or choose a custom content block first');return}const get=id=>document.getElementById(id)?.value||'';Object.assign(b,{type:get('perfPageBlockType')||'card',width:get('perfPageBlockWidth')||'third',tone:get('perfPageBlockTone')||'standard',kicker:get('perfPageBlockKicker'),title:get('perfPageBlockTitle'),body:get('perfPageBlockBody'),image:get('perfPageBlockImage'),button:get('perfPageBlockButton'),url:get('perfPageBlockUrl')});const sec=currentPerformancePageSection();renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI();flashEditor('Content block updated')
}
function movePerformancePageBlock(dir){const sec=currentPerformancePageSection(),arr=performancePageState?.[sec]?.blocks||[],i=arr.findIndex(b=>b.id===activePerformancePageBlockId);if(i<0)return;const j=i+(dir<0?-1:1);if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBlockEditor()}
function duplicatePerformancePageBlock(){const b=currentPerformanceBlock();if(!b)return;const sec=currentPerformancePageSection(),copy=clonePerformancePageValue(b);copy.id='content_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);copy.title=(copy.title||'Block')+' Copy';const arr=performancePageState[sec].blocks,i=arr.findIndex(x=>x.id===b.id);arr.splice(i+1,0,copy);activePerformancePageBlockId=copy.id;renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI()}
function deletePerformancePageBlock(){const sec=currentPerformancePageSection(),arr=performancePageState?.[sec]?.blocks||[],i=arr.findIndex(b=>b.id===activePerformancePageBlockId);if(i<0)return;arr.splice(i,1);activePerformancePageBlockId='';renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI()}
function resetPerformancePageTab(){ensurePerformancePageState();const sec=currentPerformancePageSection();performancePageState[sec]=clonePerformancePageValue(performancePageOriginalDefaults[sec]);activePerformancePageBlockId='';renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI();flashEditor(PERFORMANCE_PAGE_LABELS[sec]+' reset to original content')}
function initPerformancePageBuilder(){
  ensurePerformancePageState();renderAllPerformancePages();const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn)};
  on('perfPageSection','change',()=>{activePerformancePageBlockId='';syncPerformancePageBuilderUI()});
  on('perfPageSmoothness','input',e=>{const o=document.getElementById('perfPageSmoothnessValue');if(o)o.textContent=(+e.target.value<=0?'NATIVE':e.target.value+'%')});
  on('perfPageStackOffset','input',e=>{const o=document.getElementById('perfPageStackOffsetValue');if(o)o.textContent=e.target.value+'px'});
  on('perfPageCardGap','input',e=>{const o=document.getElementById('perfPageCardGapValue');if(o)o.textContent=e.target.value+'px'});
  on('perfPageDefaultToggle','click',()=>{const sec=currentPerformancePageSection();if(sec==='explore')return;performancePageState[sec].showDefault=performancePageState[sec].showDefault===false;renderPerformancePage(sec);saveLocalEditState(false);syncPerformancePageBuilderUI()});
  on('perfPageInlineEdit','click',()=>setPageDetailsEditMode(true));
  on('perfPageSaveText','click',savePageTextEdits);
  on('perfPageApplyHeader','click',applyPerformancePageHeaderFromUI);on('perfPagePreview','click',()=>{
    const sec=currentPerformancePageSection();
    if(pageDetailsEditMode)setPageDetailsEditMode(false,{restoreEditor:false});
    if(experienceMode!=='performance')setExperienceMode('performance');
    setTimeout(()=>siteNavigate(sec,{scroll:true,camera:true}),180)
  });
  document.querySelectorAll('[data-perf-add]').forEach(b=>b.addEventListener('click',()=>addPerformancePageBlock(b.dataset.perfAdd)));
  on('perfPageBlockSelect','change',e=>{activePerformancePageBlockId=e.target.value||'';syncPerformancePageBlockEditor()});on('perfPageApplyBlock','click',applyPerformancePageBlockFromUI);on('perfPageMoveUp','click',()=>movePerformancePageBlock(-1));on('perfPageMoveDown','click',()=>movePerformancePageBlock(1));on('perfPageDuplicate','click',duplicatePerformancePageBlock);on('perfPageDeleteBlock','click',deletePerformancePageBlock);on('perfPageResetTab','click',resetPerformancePageTab);
  on('perfPageImageFile','change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const b=currentPerformanceBlock();if(!b){flashEditor('Add or choose an IMAGE block first');e.target.value='';return}if(f.size>2500000){flashEditor('Image is over 2.5 MB · use a smaller file for the embedded venue pack');e.target.value='';return}const r=new FileReader();r.onload=()=>{b.image=String(r.result||'');renderPerformancePage(currentPerformancePageSection());saveLocalEditState(false);syncPerformancePageBuilderUI();flashEditor('Image embedded into this page block')};r.readAsDataURL(f);e.target.value=''});
  const overview=ensurePerformanceOverviewSection();if(overview&&!overview.dataset.rollupBound){overview.dataset.rollupBound='1';overview.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-site-object]');if(b){e.preventDefault();siteFocusObject(b.dataset.siteObject)}})}
  syncPerformancePageBuilderUI()
}

function captureProjectState(){return {format:'mothership-floorplan-project',version:76,layoutLocked,savedAt:new Date().toISOString(),edit:captureEditState(),builder:captureBuilderState(),barDetails:captureBarDetailState(),trace:null,ui:currentAppearanceState(),refs:captureReferenceState(),surfaces:captureSpecialSurfaceState(),cameraFrames:cameraFrameState(),performancePages:capturePerformancePageState(),pageInlineEdits:capturePageInlineEditState(),pageInlineStyles:capturePageInlineStyleState(),pageSpacing:capturePageSpacingState(),pageFrame:capturePageFrameState(),pageTabs:capturePageTabState(),pageHiddenSections:capturePageHiddenSectionState(),pageModularLayout:capturePageModularLayoutState(),interactiveZones:captureHotspotZoneState(),objectPopups:captureObjectPopupState(),v194SubmenuDetails:(typeof window.captureV194SubmenuDetailsState==='function'?window.captureV194SubmenuDetailsState():null),venueZoneHighlights:(typeof window.captureVenueZoneHighlightState==='function'?window.captureVenueZoneHighlightState():null)}}
function applyProjectState(p){if(!p||!p.edit||!p.builder)throw new Error('This does not look like a Mothership floor-plan project file');deselectEdit();applyEditState(p.edit);applyBuilderState(p.builder);if((p.version||0)<6)lockCurrentLayout();layoutLocked=p.layoutLocked!==false;autoSurfaceSnapEnabled=p.builder&&typeof p.builder.autoSurfaceSnap==='boolean'?p.builder.autoSurfaceSnap:true;buildUpperBarFromSavedMarkers(p.barDetails||(p.builder&&p.builder.barDetails)||null);applyReferenceState(p.refs||{});applySpecialSurfaceState(p.surfaces);applyCameraFrameState(p.cameraFrames||null);applyPerformancePageState(p.performancePages||null);applyPageInlineEditState(p.pageInlineEdits||null);applyPageInlineStyleState(p.pageInlineStyles||null);applyPageSpacingState(p.pageSpacing||null);applyPageFrameState(p.pageFrame||null);applyPageTabState(p.pageTabs||null);applyPageHiddenSectionState(p.pageHiddenSections||null);applyPageModularLayoutState(p.pageModularLayout||null);applyHotspotZoneState(p.interactiveZones||null);applyObjectPopupState(p.objectPopups||null);try{if(typeof window.applyV194SubmenuDetailsState==='function')window.applyV194SubmenuDetailsState(p.v194SubmenuDetails||null)}catch(e){};try{if(typeof window.applyVenueZoneHighlightState==='function')window.applyVenueZoneHighlightState(p.venueZoneHighlights||null);else window.__pendingVenueZoneHighlightState=p.venueZoneHighlights||null;}catch(e){};normalizeGroundFloorSystem((p.surfaces&&p.surfaces.exteriorFloor)||'#ababab');if(p.ui&&p.ui.theme)setViewTheme(p.ui.theme,false);applyLayerState((p.ui&&p.ui.layers)||(p.builder&&p.builder.appearance&&p.builder.appearance.layers)||DEFAULT_LAYER_STATE);applyPerformanceProfile((p.ui&&p.ui.performance&&p.ui.performance.profile)||'fast',false);
if(document.body.classList.contains('published-promoter-only')){
  // Finished/public venue: preserve visual state, skip editing UI/history/cache work.
  applyRoomFloorEditDisplay();
  history=[];redoHistory=[];
  return;
}
clearTraceImage();syncSnapUI();syncAdvancedFields();syncLayoutLockUI();syncSurfaceAttachUI();updateSelectionBox();applyRoomFloorEditDisplay();history=[];redoHistory=[];syncHistoryButtons();saveLocalEditState(false)}
function downloadBlobFile(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
let projectDirty=false,projectReady=false;
function setProjectDirty(on){projectDirty=!!on;const el=document.getElementById('projectState');if(el){el.classList.toggle('dirty',projectDirty);el.classList.toggle('safe',!projectDirty);el.textContent=projectDirty?'UNBACKED CHANGES · PRESS SAVE PROJECT':'PROJECT BACKUP SAVED'}}
function saveProjectFile(){const project=captureProjectState();let ok=true;try{localStorage.setItem('mothershipFloorplanProjectV4',JSON.stringify(project))}catch(e){ok=false}downloadBlobFile(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),'mothership_floorplan_project_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');setProjectDirty(false);flashEditor(ok?'Project backup downloaded':'Project downloaded · browser cache was full')}
async function importProjectFile(file){const raw=await file.text(),p=JSON.parse(raw);applyProjectState(p);setProjectDirty(false);try{localStorage.setItem('mothershipFloorplanProjectV4',JSON.stringify(p))}catch(e){}flashEditor('Project restored')}
/* V94 · SAFE UNDO / REDO
   History now stores scene content only. Restoring history never applies DEFAULT_LAYER_STATE,
   never resets room-floor view, theme, performance profile, layer toggles or editor settings,
   and never uses the progressive project loader. This keeps the current floor plan/view stable. */
function captureFullState(){
  return {
    historyVersion:2,
    edit:captureEditState(),
    objects:captureAllBuilderRecords(),
    barDetails:captureBarDetailState(),
    refs:captureReferenceState(),
    surfaces:captureSpecialSurfaceState(),
    objectPopups:captureObjectPopupState(),
    layoutPresets:JSON.parse(JSON.stringify(layoutPresets||{}))
  }
}
function applyFullState(s){
  if(!s)return;
  // Preserve every editor/view setting exactly as it is at the moment Undo/Redo is pressed.
  const keep={
    layoutLocked,
    autoSurfaceSnapEnabled,
    autoMainFloorLock,
    roomFloorEditView,
    fastFrameMode,
    orthoTraceEnabled,
    currentBuildPhase,
    currentBuildCategory,
    phasePendingMeta,
    phaseVisibility:{...phaseVisibility},
    phaseLocks:{...phaseLocks},
    phaseChecklist:{...phaseChecklist},
    theme:viewTheme,
    layerState:captureLayerState(),
    performance:capturePerformanceState(),
    structuralVisible:structuralWallLayer.visible,
    planVisible:planGuideLayer.visible,
    decorVisible:decorLayer.visible,
    ceilingVisible:ceilingLayer.visible,
    labelVisible:labelLayer.visible,
    lightVisible:lightVisualLayer.visible,
    furnitureVisible:furnitureLayerGroup.visible,
    artDecorVisible:artDecorLayerGroup.visible,
    builtBarVisible:builtBarLayer.visible,
    curtainPreview
  };

  deselectEdit();
  phasePendingMeta=null;

  // Static shell: restore only values recorded in the history snapshot.
  applyEditState(s.edit||{});

  // Dynamic objects: rebuild synchronously from the exact snapshot.
  // Do NOT call applyBuilderState here: that routine intentionally applies loader/default settings.
  clearBuilderObjects();
  const records=(s.objects||((s.builder&&s.builder.objects)||[]));
  records.forEach(buildSavedBuilderRecord);
  normaliseFunctionalLayerParents();

  // Rebuild dependent detail only after all snapshot objects exist.
  buildUpperBarFromSavedMarkers(s.barDetails||(s.builder&&s.builder.barDetails)||null);
  applyReferenceState(s.refs||{});
  applySpecialSurfaceState(s.surfaces||{});
  applyObjectPopupState(s.objectPopups||{});
  if(s.layoutPresets)layoutPresets=JSON.parse(JSON.stringify(s.layoutPresets));

  // Restore current settings instead of the historical/default UI state.
  layoutLocked=keep.layoutLocked;
  autoSurfaceSnapEnabled=keep.autoSurfaceSnapEnabled;
  autoMainFloorLock=keep.autoMainFloorLock;
  roomFloorEditView=keep.roomFloorEditView;
  fastFrameMode=keep.fastFrameMode;
  orthoTraceEnabled=keep.orthoTraceEnabled;
  currentBuildPhase=keep.currentBuildPhase;
  currentBuildCategory=keep.currentBuildCategory;
  phasePendingMeta=keep.phasePendingMeta;
  phaseVisibility={...keep.phaseVisibility};
  phaseLocks={...keep.phaseLocks};
  phaseChecklist={...keep.phaseChecklist};

  // Re-apply current phase visibility without changing object positions or dimensions.
  builderObjects.forEach(o=>{const p=phaseForObject(o);o.userData.phaseLocked=!!keep.phaseLocks[p];applyPhaseVisibilityToObject(o)});

  setViewTheme(keep.theme,false);
  applyLayerState(keep.layerState);
  if(keep.performance&&keep.performance.profile)applyPerformanceProfile(keep.performance.profile,false);
  structuralWallLayer.visible=keep.structuralVisible;
  planGuideLayer.visible=keep.planVisible;
  decorLayer.visible=keep.decorVisible;
  ceilingLayer.visible=keep.ceilingVisible;
  labelLayer.visible=keep.labelVisible;
  lightVisualLayer.visible=keep.lightVisible;
  furnitureLayerGroup.visible=keep.furnitureVisible;
  artDecorLayerGroup.visible=keep.artDecorVisible;
  builtBarLayer.visible=keep.builtBarVisible;
  curtainPreview=keep.curtainPreview;
  updateCurtainPreview();

  clearCeilingRigGuideLines();
  syncSnapUI();
  syncFastFrameUI();
  syncLayoutLockUI();
  syncSurfaceAttachUI();
  syncAppearanceFields();
  applyRoomFloorEditDisplay();
  syncRoomFloorViewUI();
  if(typeof syncLayoutPresetUI==='function')syncLayoutPresetUI();
  if(typeof renderPhaseBuilder==='function')renderPhaseBuilder();
  updateSelectionBox();
  markRenderDirty(500);
}
function syncHistoryButtons(){const u=document.getElementById('editUndo'),r=document.getElementById('editRedo');if(u)u.disabled=!history.length;if(r)r.disabled=!redoHistory.length}
function pushHistory(){history.push(JSON.stringify(captureFullState()));if(history.length>60)history.shift();redoHistory.length=0;syncHistoryButtons()}
function undoEdit(){if(!history.length){flashEditor('Nothing to undo');return}redoHistory.push(JSON.stringify(captureFullState()));if(redoHistory.length>60)redoHistory.shift();const prev=history.pop();applyFullState(JSON.parse(prev));saveLocalEditState(false);syncHistoryButtons();flashEditor('Undo · floor plan preserved')}
function redoEdit(){if(!redoHistory.length){flashEditor('Nothing to redo');return}history.push(JSON.stringify(captureFullState()));if(history.length>60)history.shift();const next=redoHistory.pop();applyFullState(JSON.parse(next));saveLocalEditState(false);syncHistoryButtons();flashEditor('Redo · floor plan preserved')}
function saveLocalEditState(show=true){let ok=true;try{localStorage.setItem('mothershipFloorplanEditStateV1',JSON.stringify(captureEditState()));localStorage.setItem('mothershipFloorplanBuilderStateV2',JSON.stringify(captureBuilderState()));localStorage.setItem('mothershipFloorplanBarDetailsV1',JSON.stringify(captureBarDetailState()));localStorage.setItem('mothershipFloorplanSurfaceStateV1',JSON.stringify(captureSpecialSurfaceState()));localStorage.setItem('mothershipFloorplanReferenceStateV1',JSON.stringify(captureReferenceState()));localStorage.setItem('mothershipCameraFramesV1',JSON.stringify(cameraFrameState()));localStorage.setItem('mothershipPerformancePagesV1',JSON.stringify(capturePerformancePageState()));localStorage.setItem('mothershipPageInlineEditsV1',JSON.stringify(capturePageInlineEditState()));localStorage.setItem('mothershipPageInlineStylesV1',JSON.stringify(capturePageInlineStyleState()));localStorage.setItem('mothershipPageSpacingV1',JSON.stringify(capturePageSpacingState()));localStorage.setItem('mothershipPageFrameV1',JSON.stringify(capturePageFrameState()));localStorage.setItem('mothershipPageTabsV1',JSON.stringify(capturePageTabState()));localStorage.setItem('mothershipPageHiddenSectionsV1',JSON.stringify(capturePageHiddenSectionState()));localStorage.setItem('mothershipPageModularLayoutV1',JSON.stringify(capturePageModularLayoutState()));localStorage.setItem('mothershipObjectPopupsV1',JSON.stringify(captureObjectPopupState()));localStorage.removeItem('mothershipFloorplanTraceStateV1')}catch(e){ok=false}if(projectReady)setProjectDirty(true);if(show)flashEditor(ok?'Browser autosave updated · use SAVE PROJECT for a real backup':'Browser storage is full · use SAVE PROJECT now')}
function loadLocalEditState(){try{const raw=localStorage.getItem('mothershipFloorplanEditStateV1');if(raw)applyEditState(JSON.parse(raw))}catch(e){}}
function loadLocalBuilderState(){try{const raw=localStorage.getItem('mothershipFloorplanBuilderStateV2');if(raw)applyBuilderState(JSON.parse(raw))}catch(e){}}
function loadLocalSurfaceState(){try{const raw=localStorage.getItem('mothershipFloorplanSurfaceStateV1');if(raw)applySpecialSurfaceState(JSON.parse(raw))}catch(e){}}
function loadLocalProjectState(){try{const raw=localStorage.getItem('mothershipFloorplanProjectV4');if(raw)return JSON.parse(raw)}catch(e){}return null}
function loadLocalReferenceState(){try{const raw=localStorage.getItem('mothershipFloorplanReferenceStateV1');if(raw)applyReferenceState(JSON.parse(raw))}catch(e){}}
function loadLocalTraceState(){try{const raw=localStorage.getItem('mothershipFloorplanTraceStateV1');if(raw)applyTraceState(JSON.parse(raw))}catch(e){}}

function flashEditor(msg){editorSelected.innerHTML='<b>'+msg+'</b>'+((selectedEdit&&selectedEdit.userData.editName)||'');setTimeout(()=>updateEditorSelected(),950)}
function selectedTypeLabel(){if(!selectedEdit)return '';return selectedEdit.userData.builderType||'object'}
function updateEditorSelected(){if(multiSelection.length){editorSelected.innerHTML='<b>'+multiSelection.length+' OBJECTS SELECTED</b>SHIFT/CMD/CTRL click to add/remove · press GROUP to bind them together';syncAdvancedFields();syncReferencePanel();syncGroupUI();return}if(activeGroupId&&groupPivot){const members=groupMembersById(activeGroupId,true),b=new THREE.Box3().setFromObject(groupPivot),s=new THREE.Vector3();b.getSize(s);editorSelected.innerHTML='<b>GROUP · '+members.length+' ITEMS</b>MOVE / ROTATE / STRETCH TOGETHER · '+s.x.toFixed(2)+' × '+s.z.toFixed(2)+' × '+s.y.toFixed(2)+' m<br>'+members.map(o=>o.userData.editName||'Object').slice(0,5).join(' · ')+(members.length>5?' · +'+(members.length-5):'');syncAdvancedFields();syncReferencePanel();syncGroupUI();return}if(!selectedEdit){editorSelected.innerHTML='<b>Nothing selected</b>'+ (layoutLocked?'Click an added detail or upper-bar detail.':'Click any wall, floor, bar, platform, pillar or added detail.');syncAdvancedFields();syncReferencePanel();syncGroupUI();return}const p=selectedEdit.position,s=selectedEdit.scale,t=selectedTypeLabel(),ref=selectedEdit.userData.referenceData,refCount=ref&&ref.photos?ref.photos.length:0,dims=selectedObjectDimensions(selectedEdit),dimText=dims?' · '+dims.length.toFixed(2)+' × '+dims.width.toFixed(2)+' × '+dims.height.toFixed(2)+' m':'',phaseText=selectedEdit.userData.dynamic?' · PHASE '+phaseForObject(selectedEdit):'',groupText=selectedEdit.userData.groupId?' · GROUPED':'';editorSelected.innerHTML='<b>'+selectedEdit.userData.editName+'</b>'+t.toUpperCase()+phaseText+groupText+dimText+' · X '+p.x.toFixed(2)+' · Z '+p.z.toFixed(2)+'<br>Scale '+s.x.toFixed(2)+' / '+s.y.toFixed(2)+' / '+s.z.toFixed(2)+(selectedEdit.userData.phaseLocked?'<br>PHASE LOCKED':'')+(refCount||ref&&ref.notes||ref&&ref.title?'<br>Refs '+refCount+' photo'+(refCount===1?'':'s'):'');syncAdvancedFields();syncReferencePanel();syncGroupUI()}
function updateSelectionBox(){if(activeGroupId&&groupPivot){selectionBox.setFromObject(groupPivot);selectionBox.visible=true;return}if(multiSelection.length){selectionBox.visible=false;return}if(selectedEdit&&selectedEdit.visible){selectionBox.setFromObject(selectedEdit);selectionBox.visible=true}else selectionBox.visible=false}
function editableRootFromHitObject(o){while(o&&o.parent&&!editorRoots.includes(o))o=o.parent;return isEditableRoot(o)?o:null}
function isFloorPickRoot(o){return !!o&&(isPlatformRoot(o)||o.userData?.builderType==='floorSurface')}
function isFramePickRoot(o){if(!o||!o.userData)return false;const t=o.userData.builderType;return isWallRoot(o)||isPlatformRoot(o)||t==='floorSurface'||t==='solidPolygon'||t==='platformBox'||t==='steps'||t==='ramp'||t==='rampPath'||t==='pillar'||isStaticPointSolid(o)}
function firstEditableRootFromHits(hits){
  for(const hit of hits||[]){
    const r=editableRootFromHitObject(hit.object);
    if(r)return r
  }
  return null
}
function getEditableHit(e){
  const rect=renderer.domElement.getBoundingClientRect();
  mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
  mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
  ray.setFromCamera(mouse,camera);

  let live=editorRoots
    .filter(isEditableRoot)
    .filter(o=>!(editMode&&roomFloorEditView==='hidden'&&isRoomFloorRoot(o)));

  if(window.__mshipStageFastEdit&&typeof window.__mshipStagePickRoots==='function'){
    const fast=window.__mshipStagePickRoots().filter(isEditableRoot);
    if(fast.length)live=fast
  }
  if(fastFrameMode)live=live.filter(isFramePickRoot);

  if(mode2d&&editMode&&!window.__mshipStageFastEdit){
    const walls=live.filter(isWallRoot);
    const wallRoot=firstEditableRootFromHits(ray.intersectObjects(walls,true));
    if(wallRoot)return wallRoot;

    const upper=live.filter(o=>!isFloorPickRoot(o));
    const upperRoot=firstEditableRootFromHits(ray.intersectObjects(upper,true));
    if(upperRoot)return upperRoot
  }

  return firstEditableRootFromHits(ray.intersectObjects(live,true))
}
function getWallHit(e,excludeRoot=null){const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const live=editorRoots.filter(o=>o&&o.visible!==false&&isWallRoot(o)&&o!==excludeRoot);const hits=ray.intersectObjects(live,true);if(!hits.length)return null;for(const h of hits){let o=h.object;while(o&&o.parent&&!editorRoots.includes(o))o=o.parent;if(o&&isWallRoot(o)&&o!==excludeRoot)return o}return null}
function selectEdit(obj){if(document.body.classList.contains('v258-page-details-only'))return;if(activeGroupId)releaseActiveGroupPivot(true);if(multiSelection.length)clearMultiSelectionVisuals();if(obj!==selectedEdit){cancelPointConnect();connectWallPickMode=false;connectWallSourceIndex=-1}clearWallAlignmentSuggestion();if(!isEditableRoot(obj)){if(obj)flashEditor(layoutLocked?'Venue shell is locked':'That object is not editable');return}if(drawMode&&drawMode!=='wallTrace')cancelDraw();selectedEdit=obj;activeVertexIndex=-1;transform.attach(obj);updateEditorSelected();updateSelectionBox();const wantsLivePoints=!!selectedEdit&&(isPlatformRoot(selectedEdit)||selectedEdit.userData.builderType==='floorSurface'||isWallRoot(selectedEdit)||isSolidPolygonRoot(selectedEdit)||selectedEdit.userData.builderType==='rampPath'||isStaticPointSolid(selectedEdit));if(wantsLivePoints){if(selectedEdit.userData.builderType!=='polyWall'&&isWallRoot(selectedEdit)){pushHistory();selectedEdit=ensurePointEditableWall(selectedEdit,false)||selectedEdit;transform.attach(selectedEdit)}if((isPlatformRoot(selectedEdit)||selectedEdit.userData.builderType==='floorSurface')&&selectedEdit.userData.builderType!=='platform'){pushHistory();selectedEdit=ensureCustomPlatform(selectedEdit)||selectedEdit;transform.attach(selectedEdit)}if(isStaticPointSolid(selectedEdit)){pushHistory();selectedEdit=ensurePointEditableSolid(selectedEdit)||selectedEdit;transform.attach(selectedEdit)}vertexEditMode=true;transform.attach(selectedEdit);updateVertexHandles()}else if(vertexEditMode)setVertexEdit(false);else updateVertexHandles();setEditTool(editModeName||'translate');if(typeof syncDrawButtons==='function')syncDrawButtons();if(typeof syncConnectPointsUI==='function')syncConnectPointsUI();syncDimensionFields()}
function deselectEdit(){connectWallPickMode=false;connectWallSourceIndex=-1;clearWallAlignmentSuggestion();releaseActiveGroupPivot(true);clearMultiSelectionVisuals();selectedEdit=null;transform.detach();selectionBox.visible=false;activeVertexIndex=-1;clearVertexHandles();updateEditorSelected();if(typeof syncDrawButtons==='function')syncDrawButtons();if(typeof syncConnectPointsUI==='function')syncConnectPointsUI();syncDimensionFields();syncGroupUI()}
function setEditTool(mode){clearWallAlignmentSuggestion();editModeName=mode;transform.enabled=true;transform.setMode(mode);transform.setSpace(mode==='scale'?'local':'world');if(activeGroupId&&groupPivot){if(transform.object!==groupPivot)transform.attach(groupPivot)}else if(selectedEdit&&isEditableRoot(selectedEdit)&&transform.object!==selectedEdit)transform.attach(selectedEdit);document.getElementById('editMove').classList.toggle('active',mode==='translate');document.getElementById('editScale').classList.toggle('active',mode==='scale');document.getElementById('editRotate').classList.toggle('active',mode==='rotate');updateTransformAxes()}
function updateTransformAxes(){if(mode2d){if(editModeName==='rotate'){transform.showX=false;transform.showY=true;transform.showZ=false}else{transform.showX=true;transform.showY=false;transform.showZ=true}}else{transform.showX=true;transform.showY=true;transform.showZ=true}}
function setEditMode(on){
  editMode=!!on;
  roomFloorNormalPreview=false;
  drag=false;navDragMode=null;navMoved=false;dragVertex=null;suppressNextCanvasClick=false;
  renderer.domElement.classList.remove('dragging');renderer.domElement.style.pointerEvents='auto';
  transform.enabled=editMode;try{transform.axis=null}catch(e){}

  document.body.classList.toggle('edit-on',editMode);
  const editBtn=document.getElementById('btnEdit');
  if(editBtn){
    editBtn.classList.toggle('active',editMode);
    editBtn.setAttribute('aria-pressed',editMode?'true':'false');
    editBtn.title=editMode?'Exit Edit Mode':'Enter Edit Mode'
  }

  editorPanel.classList.toggle('show',editMode);
  document.getElementById('layers').classList.remove('show');
  document.getElementById('info').classList.remove('show');

  if(!editMode){
    cancelDraw();
    cancelAttachPick();
    if(hotspotDrawMode)cancelHotspotDrawing?.();
    hotspotCornerDrag=null;
    hotspotZoneDrag=null;
    hotspotSpaceMoveActive=false;
    hotspotInteractionMode='zone';
    document.body.classList.remove(
      'hotspot-editing','hotspot-drawing','hotspot-view-mode',
      'hotspot-corner-dragging','hotspot-zone-moving'
    );
    hotspotTooltip?.(null,null);
    deselectEdit()
  }else{
    transform.enabled=true;renderer.domElement.style.pointerEvents='auto';
    if(activeHotspotId&&hotspotZones.some(z=>z.id===activeHotspotId)){
    // If a zone was being edited before EDIT was switched off,
    // restore its overlay editing state when EDIT is switched back on.
    document.body.classList.add('hotspot-editing');
      setHotspotInteractionMode?.('zone',{announce:false})
    }
  }

  syncLayoutLockUI();
  applyRoomFloorEditDisplay();
  syncRoomFloorViewUI();
  renderHotspotZones?.();

  document.getElementById('hint').innerHTML=editMode
    ?(layoutLocked
      ?'DETAIL EDITOR · shell protected<br>EDIT toggles this panel off · zone editor supports MOVE VIEW'
      :'DETAIL EDITOR · shell editable<br>EDIT toggles this panel off · zone editor supports MOVE VIEW')
    :'VIEW MODE · press EDIT to reopen editing<br>drag to orbit · scroll to zoom · Shift-drag pan'
}
function deleteSelected(){if(activeGroupId){const members=groupMembersById(activeGroupId,true);if(!members.length)return;pushHistory();releaseActiveGroupPivot(true);members.forEach(o=>o.visible=false);selectedEdit=null;selectionBox.visible=false;saveLocalEditState(false);updateEditorSelected();flashEditor(members.length+' grouped objects hidden');return}if(multiSelection.length){const items=multiSelection.slice();pushHistory();items.forEach(o=>o.visible=false);clearGroupingSelection();saveLocalEditState(false);flashEditor(items.length+' selected objects hidden');return}if(!selectedEdit)return;if(!isEditableRoot(selectedEdit)){flashEditor(layoutLocked?'Venue shell is locked':'That object is not editable');return}pushHistory();selectedEdit.visible=false;deselectEdit();saveLocalEditState(false)}
function clearUnlockedBuilderObjects(){const gone=builderObjects.filter(o=>!o.userData.lockedBase&&!o.userData.phaseLocked);gone.forEach(o=>{if(o.parent)o.parent.remove(o);disposeObject3D(o)});builderObjects=builderObjects.filter(o=>o.userData.lockedBase);editorRoots=editorRoots.filter(o=>!gone.includes(o))}
function resetAddedDetails(){pushHistory();deselectEdit();clearUnlockedBuilderObjects();buildUpperBarFromSavedMarkers();setViewTheme(DEFAULT_THEME,false);applyLayerState(DEFAULT_LAYER_STATE);saveLocalEditState(false);flashEditor('Added details reset · venue layout unchanged')}
function downloadEditedHTML(){const projectState=JSON.stringify(captureProjectState());const clone=document.documentElement.cloneNode(true);const wrapClone=clone.querySelector('#wrap');if(wrapClone)wrapClone.innerHTML='';const loadingClone=clone.querySelector('#loading');if(loadingClone)loadingClone.style.display='flex';const editorClone=clone.querySelector('#editor');if(editorClone)editorClone.classList.remove('show');clone.querySelector('#v226ZoneOverlay')?.remove();clone.querySelector('#v226ZoneLabel')?.remove();let html='<!DOCTYPE html>\n'+clone.outerHTML;html=html.replace(/const BOOT_EDIT_STATE\s*=\s*.*?;\s*\/\*__EDIT_STATE_END__\*\//s,()=>`const BOOT_EDIT_STATE=null; /*__EDIT_STATE_END__*/`);html=html.replace(/const BOOT_TRACE_STATE\s*=\s*.*?;\s*\/\*__TRACE_STATE_END__\*\//s,()=>`const BOOT_TRACE_STATE=null; /*__TRACE_STATE_END__*/`);html=html.replace(/const BOOT_BUILDER_STATE\s*=\s*.*?;\s*\/\*__BUILDER_STATE_END__\*\//s,()=>`const BOOT_BUILDER_STATE=null; /*__BUILDER_STATE_END__*/`);html=html.replace(/const BOOT_UI_STATE\s*=\s*.*?;\s*\/\*__UI_STATE_END__\*\//s,()=>`const BOOT_UI_STATE=null; /*__UI_STATE_END__*/`);html=html.replace(/const BOOT_PROJECT_STATE\s*=\s*.*?;\s*\/\*__PROJECT_STATE_END__\*\//s,()=>`const BOOT_PROJECT_STATE=${projectState}; /*__PROJECT_STATE_END__*/`);downloadBlobFile(new Blob([html],{type:'text/html'}),'MOTHERSHIP_V332_EDITED_VENUE_PACK_'+new Date().toISOString().slice(0,10)+'.html');setProjectDirty(false);flashEditor('Editable HTML exported')}

/* wall endpoints, magnetic snapping and persistent links */
function wallEndpoints(root){if(!isWallRoot(root))return null;let ep;if(root.userData.builderType==='curvedWall'){const p=root.userData.curveData.points;ep=[root.localToWorld(new THREE.Vector3(p[0][0],0,p[0][1])),root.localToWorld(new THREE.Vector3(p[2][0],0,p[2][1]))]}else if(root.userData.builderType==='polyWall'){const d=root.userData.polyWallData;if(d.closed)return null;const p=d.points;ep=[root.localToWorld(new THREE.Vector3(p[0][0],0,p[0][1])),root.localToWorld(new THREE.Vector3(p[p.length-1][0],0,p[p.length-1][1]))]}else{const p=root.geometry&&root.geometry.parameters;if(!p||!p.width)return null;ep=[root.localToWorld(new THREE.Vector3(-p.width/2,0,0)),root.localToWorld(new THREE.Vector3(p.width/2,0,0))]}ep.forEach(v=>v.y=0);return ep}
function nearestWallEndpoint(root,maxDist=Infinity){const mine=wallEndpoints(root);if(!mine)return null;let best=null;editorRoots.forEach(other=>{if(other===root||!other.visible||!isWallRoot(other))return;const ep=wallEndpoints(other);if(!ep)return;mine.forEach((a,ai)=>ep.forEach((b,bi)=>{const d=a.distanceTo(b);if(d<=maxDist&&(!best||d<best.distance))best={selfEnd:ai,target:other,targetEnd:bi,distance:d,selfPoint:a,targetPoint:b}}))});return best}
function shiftWallEndpointTo(root,endIndex,targetPoint){const eps=wallEndpoints(root);if(!eps)return;if(root.userData.builderType==='curvedWall'){const delta=targetPoint.clone().sub(eps[endIndex]);root.position.add(delta);return}const fixed=eps[1-endIndex];const a=endIndex===0?targetPoint:fixed,b=endIndex===1?targetPoint:fixed;setStraightWallEndpoints(root,a,b)}
function setStraightWallEndpoints(root,a,b){const p=root.geometry.parameters,dx=b.x-a.x,dz=b.z-a.z,len=Math.max(.03,Math.hypot(dx,dz));root.position.x=(a.x+b.x)/2;root.position.z=(a.z+b.z)/2;root.rotation.y=-Math.atan2(dz,dx);root.scale.x=len/Math.max(+p.width||1,.0001)}
function snapWall(root,makeLink=false,quiet=false){if(!isWallRoot(root))return false;const dist=Math.max(.05,+document.getElementById('snapDistance').value||.35),hit=nearestWallEndpoint(root,dist);if(!hit){if(!quiet)flashEditor('No wall end within snap distance');return false}const delta=hit.targetPoint.clone().sub(hit.selfPoint);root.position.add(delta);if(makeLink){const exists=wallLinks.some(l=>(l.aId===root.userData.editId&&l.aEnd===hit.selfEnd&&l.bId===hit.target.userData.editId&&l.bEnd===hit.targetEnd)||(l.bId===root.userData.editId&&l.bEnd===hit.selfEnd&&l.aId===hit.target.userData.editId&&l.aEnd===hit.targetEnd));if(!exists)wallLinks.push({aId:root.userData.editId,aEnd:hit.selfEnd,bId:hit.target.userData.editId,bEnd:hit.targetEnd})}updateSelectionBox();return true}
function enforceWallLinks(source){if(!source||!isWallRoot(source))return;const sid=source.userData.editId;wallLinks.forEach(l=>{let sEnd,tId,tEnd;if(l.aId===sid){sEnd=l.aEnd;tId=l.bId;tEnd=l.bEnd}else if(l.bId===sid){sEnd=l.bEnd;tId=l.aId;tEnd=l.aEnd}else return;const targetWall=objectByEditId(tId);if(!targetWall||!targetWall.visible)return;const desired=wallEndpoints(source)?.[sEnd];if(desired)shiftWallEndpointTo(targetWall,tEnd,desired)})}
function linkSelectedWall(){if(!isWallRoot(selectedEdit)){flashEditor('Select a wall first');return}pushHistory();if(snapWall(selectedEdit,true)){enforceWallLinks(selectedEdit);saveLocalEditState(false);flashEditor('Wall ends linked')}}
function unlinkSelectedWall(){if(!isWallRoot(selectedEdit)){flashEditor('Select a wall first');return}pushHistory();const id=selectedEdit.userData.editId,n=wallLinks.length;wallLinks=wallLinks.filter(l=>l.aId!==id&&l.bId!==id);saveLocalEditState(false);flashEditor(n===wallLinks.length?'No links on this wall':'Wall unlinked')}
function syncSnapUI(){autoSnapEnabled=false;wallLinks=[]}

/* selective wall alignment assist — explicit, never magnetic */
const WALL_ALIGN_OFFER_DIST=.12;
const WALL_ALIGN_END_JOIN_DIST=.18;
function isStraightWallRoot(o){return !!o&&o.userData&&o.userData.builderType==='wall'}
function closestPointOnSegmentXZ(p,a,b){const ab=b.clone().sub(a);ab.y=0;const den=ab.lengthSq();if(den<1e-8)return a.clone();const ap=p.clone().sub(a);ap.y=0;const t=Math.max(0,Math.min(1,ap.dot(ab)/den));return a.clone().add(ab.multiplyScalar(t))}
function nearestWallAlignmentCandidate(root,maxDist=WALL_ALIGN_OFFER_DIST){
  if(!isStraightWallRoot(root))return null;
  const mine=wallEndpoints(root);if(!mine)return null;let best=null;
  editorRoots.forEach(other=>{
    if(other===root||!other.visible||!isStraightWallRoot(other))return;
    const tep=wallEndpoints(other);if(!tep)return;
    mine.forEach((sp,selfEnd)=>{
      const q=closestPointOnSegmentXZ(sp,tep[0],tep[1]),d=sp.distanceTo(q);
      if(d>maxDist)return;
      let te=0,ted=sp.distanceTo(tep[0]);const d1=sp.distanceTo(tep[1]);if(d1<ted){te=1;ted=d1}
      if(!best||d<best.distance)best={root,target:other,selfEnd,targetPoint:q,targetEnd:te,targetEndPoint:tep[te].clone(),targetEndDistance:ted,distance:d};
    })
  });
  return best
}
function clearWallAlignmentSuggestion(){wallAlignSuggestion=null;const box=document.getElementById('wallAlignBox');if(box)box.classList.remove('show')}
function wallDirection(root){const ep=wallEndpoints(root);if(!ep)return null;const d=ep[1].clone().sub(ep[0]);d.y=0;return d.lengthSq()>1e-8?d.normalize():null}
function showWallAlignmentOffer(){
  clearWallAlignmentSuggestion();
  if(!selectedEdit||editModeName!=='translate'||!isStraightWallRoot(selectedEdit))return false;
  const hit=nearestWallAlignmentCandidate(selectedEdit,WALL_ALIGN_OFFER_DIST);if(!hit)return false;
  wallAlignSuggestion=hit;
  const box=document.getElementById('wallAlignBox'),status=document.getElementById('wallAlignStatus'),note=document.getElementById('wallAlignNote');
  if(status)status.textContent='NEAR '+String(hit.target.userData.editName||'WALL').toUpperCase();
  if(note)note.innerHTML='This wall end is <b>'+Math.round(hit.distance*100)+' cm</b> from '+(hit.target.userData.editName||'the closest wall')+'. Choose <b>90° + CONNECT</b>, <b>PARALLEL / LINE</b>, or <b>KEEP SKEW</b>. Move it outside this tight catch zone and no alignment prompt appears.';
  if(box){box.classList.add('show');box.scrollIntoView({block:'nearest'})}
  return true
}
function orientedDirectionClosest(base,current){const d=base.clone().normalize();if(current&&d.dot(current)<0)d.negate();return d}
function setWallWithAnchoredEnd(root,selfEnd,anchor,dir,len){const a=anchor.clone(),b=anchor.clone();if(selfEnd===0)b.add(dir.clone().multiplyScalar(len));else a.add(dir.clone().multiplyScalar(-len));setStraightWallEndpoints(root,a,b)}
function alignSuggestedWall(mode){
  const hit=wallAlignSuggestion;if(!hit||selectedEdit!==hit.root||!isStraightWallRoot(hit.root)||!isStraightWallRoot(hit.target)){clearWallAlignmentSuggestion();return}
  const root=hit.root,targetWall=hit.target,ep=wallEndpoints(root),tep=wallEndpoints(targetWall),current=wallDirection(root),targetDir=wallDirection(targetWall);if(!ep||!tep||!targetDir)return;
  const len=Math.max(.03,ep[0].distanceTo(ep[1]));pushHistory();
  if(mode==='perp'){
    const p1=new THREE.Vector3(-targetDir.z,0,targetDir.x),p2=p1.clone().negate(),dir=current&&p2.dot(current)>p1.dot(current)?p2:p1;
    setWallWithAnchoredEnd(root,hit.selfEnd,hit.targetPoint,dir,len);
    flashEditor('Wall connected at exactly 90°');
  }else if(mode==='parallel'){
    const dir=orientedDirectionClosest(targetDir,current);
    if(hit.targetEndDistance<=WALL_ALIGN_END_JOIN_DIST){
      setWallWithAnchoredEnd(root,hit.selfEnd,hit.targetEndPoint,dir,len);
      flashEditor('Walls joined on the same straight line');
    }else{
      const centre=ep[0].clone().add(ep[1]).multiplyScalar(.5),linePoint=tep[0],along=targetDir.clone().multiplyScalar(centre.clone().sub(linePoint).dot(targetDir)),projected=linePoint.clone().add(along);
      const a=projected.clone().add(dir.clone().multiplyScalar(-len/2)),b=projected.clone().add(dir.clone().multiplyScalar(len/2));setStraightWallEndpoints(root,a,b);
      flashEditor('Wall aligned parallel on the same centreline');
    }
  }
  clearWallAlignmentSuggestion();updateSelectionBox();updateEditorSelected();saveLocalEditState(false)
}
function keepWallSkew(){clearWallAlignmentSuggestion();saveLocalEditState(false);flashEditor('Wall kept exactly as placed')}

/* exact object / wall / floor dimensions */
function footprintData(root){if(isSolidPolygonRoot(root))return root.userData.solidData;if(root&&root.userData&&root.userData.builderType==='platform')return root.userData.platformData;return null}
function bakeFootprintScale(root){const d=footprintData(root);if(!d)return;const sx=Math.max(.001,Math.abs(root.scale.x)),sy=Math.max(.001,Math.abs(root.scale.y)),sz=Math.max(.001,Math.abs(root.scale.z));d.points=d.points.map(p=>[p[0]*sx,p[1]*sz]);d.height*=sy;root.scale.set(1,1,1);if(isSolidPolygonRoot(root))rebuildSolidPolygon(root);else rebuildPlatform(root)}
function selectedObjectDimensions(root=selectedEdit){if(!root)return null;if(isSpeakerStackRoot(root)){const d=normaliseSpeakerStackData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isSpeakerCabinetRoot(root)){const d=normaliseSpeakerCabinetData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isDjBoothRoot(root)){const d=normaliseDjBoothData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:(d.height+d.topThickness+d.backRailHeight)*Math.abs(root.scale.y)}}if(isSoundConsoleRoot(root)){const d=normaliseSoundConsoleData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:(d.baseHeight+d.mainRise+d.rearHeight)*Math.abs(root.scale.y)}}if(isLightingConsoleRoot(root)){const d=normaliseLightingConsoleData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.rearHeight*Math.abs(root.scale.y)}}if(isWallMirrorRoot(root)){const d=normaliseWallMirrorData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isMothershipPortalRoot(root)){const d=normaliseMothershipPortalData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isNeonSkullLightBoxRoot(root)){const d=normaliseNeonSkullLightBoxData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isNeonRingPlantPanelRoot(root)){const d=normaliseNeonRingPlantPanelData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isArtworkPanelRoot(root)){const d=normaliseArtworkPanelData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isCustomStairRoot(root)){const d=normaliseCustomStairData(root.userData.assetData),a=new THREE.Vector2(d.points[0][0],d.points[0][1]),b=new THREE.Vector2(d.points[1][0],d.points[1][1]);return {length:a.distanceTo(b)*Math.abs(root.scale.x),width:d.width*Math.abs(root.scale.z),height:(d.rise+d.wallHeight)*Math.abs(root.scale.y)}}if(isCounterBarFridgeRoot(root)){const d=normaliseCounterBarFridgeData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isStagePropRoot(root)){const d=normaliseStagePropData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isDjBoothSideTableRoot(root)){const d=normaliseDjBoothSideTableData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isDjBoothMonitorRoot(root)){const d=normaliseDjBoothMonitorData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isDjBoothSideSpeakerRoot(root)){const d=normaliseDjBoothSideTableData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isStageFrontSubsRoot(root)){const d=normaliseStageFrontSubsData(root.userData.assetData);return {length:d.totalLength*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isSimpleDoorRoot(root)){const d=normaliseSimpleDoorData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isSinkPairRoot(root)){const d=normaliseSinkPairData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isDoubleSinkCounterRoot(root)){const d=normaliseDoubleSinkCounterData(root.userData.assetData);return {length:d.width*Math.abs(root.scale.x),width:d.depth*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isHandrailRoot(root)){const d=normaliseHandrailData(root.userData.assetData);return {length:d.length*Math.abs(root.scale.z),width:.06,height:(d.railHeight+d.rise)*Math.abs(root.scale.y)}}if(isBarLeanerRoot(root)){const d=root.userData.leanerData;return {length:d.length*Math.abs(root.scale.x),width:d.width*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(root.userData.builderType==='rampPath'){const d=normaliseRampPathData(root.userData.rampPathData);return {length:rampPathLength(d.points)*Math.sqrt(Math.abs(root.scale.x*root.scale.z)),width:d.width,height:Math.abs(d.startLevel-d.finishLevel)}}if(footprintData(root)){const d=footprintData(root),b=platformBounds(d.points);return {length:b.w*Math.abs(root.scale.x),width:b.d*Math.abs(root.scale.z),height:d.height*Math.abs(root.scale.y)}}if(isStaticPointSolid(root)||root.userData.builderType==='platformBox'){const b=new THREE.Box3().setFromObject(root),v=new THREE.Vector3();b.getSize(v);return {length:v.x,width:v.z,height:v.y}}return null}
function selectedBaseLevel(root=selectedEdit){if(!root)return null;try{if(isMensUrinal(root))return root.getWorldPosition(new THREE.Vector3()).y-mainFloorLevel();return new THREE.Box3().setFromObject(root).min.y-mainFloorLevel()}catch(e){return null}}
function prepareDimensionRoot(root){if(isStaticPointSolid(root))return ensurePointEditableSolid(root);if(root&&root.userData&&root.userData.builderType==='platformBox')return ensureCustomPlatform(root);return root}
function setSelectedObjectFootprint(axis,v){if(!selectedEdit)return;const n=Math.max(.05,+v||.05);pushHistory();let root=prepareDimensionRoot(selectedEdit);if(!root){history.pop();return}if(isSpeakerStackRoot(root)){bakeSpeakerStackScale(root);root.userData.assetData[axis==='x'?'width':'depth']=n;rebuildSpeakerStackObject(root)}else if(isSpeakerCabinetRoot(root)){const d=normaliseSpeakerCabinetData(root.userData.assetData);d[axis==='x'?'width':'depth']=n;root.scale.set(1,1,1);rebuildSpeakerCabinetObject(root)}else if(isDjBoothRoot(root)){const d=normaliseDjBoothData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildDjBoothObject(root)}else if(isSoundConsoleRoot(root)){const d=normaliseSoundConsoleData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;d.rearDepth=Math.min(d.depth*.45,d.rearDepth);rebuildSoundConsoleObject(root)}else if(isLightingConsoleRoot(root)){const d=normaliseLightingConsoleData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildLightingConsoleObject(root)}else if(isWallMirrorRoot(root)){const d=normaliseWallMirrorData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildWallMirrorObject(root)}else if(isMothershipPortalRoot(root)){const d=normaliseMothershipPortalData(root.userData.assetData);root.scale.set(1,1,1);if(axis==='x')d.width=n;else d.depth=n;rebuildMothershipPortalObject(root)}else if(isNeonSkullLightBoxRoot(root)){const d=normaliseNeonSkullLightBoxData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildNeonSkullLightBoxObject(root)}else if(isNeonRingPlantPanelRoot(root)){const d=normaliseNeonRingPlantPanelData(root.userData.assetData);root.scale.set(1,1,1);if(axis==='x')d.width=n;else d.depth=n;rebuildNeonRingPlantPanelObject(root)}else if(isArtworkPanelRoot(root)){const d=normaliseArtworkPanelData(root.userData.assetData);root.scale.set(1,1,1);if(axis==='x')d.width=n;else d.depth=n;rebuildArtworkPanelObject(root)}else if(isCustomStairRoot(root)){const d=normaliseCustomStairData(root.userData.assetData);root.scale.set(1,1,1);if(axis==='z')d.width=n;else{const a=new THREE.Vector2(d.points[0][0],d.points[0][1]),b=new THREE.Vector2(d.points[1][0],d.points[1][1]),dir=b.clone().sub(a);if(dir.lengthSq()<1e-8)dir.set(1,0);dir.normalize();d.points[1]=[a.x+dir.x*n,a.y+dir.y*n]}rebuildCustomStairObject(root)}else if(isCounterBarFridgeRoot(root)){const d=normaliseCounterBarFridgeData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildCounterBarFridgeObject(root)}else if(isStagePropRoot(root)){const d=normaliseStagePropData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildStagePropObject(root)}else if(isDjBoothSideTableRoot(root)){const d=normaliseDjBoothSideTableData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildDjBoothSideTableObject(root)}else if(isDjBoothMonitorRoot(root)){const d=normaliseDjBoothMonitorData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildDjBoothMonitorObject(root)}else if(isDjBoothSideSpeakerRoot(root)){const d=normaliseDjBoothSideTableData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildDjBoothSideSpeakerObject(root)}else if(isStageFrontSubsRoot(root)){const d=normaliseStageFrontSubsData(root.userData.assetData);root.scale.set(1,1,1);if(axis==='x')d.totalLength=n;else d.depth=n;d.count=Math.max(1,Math.min(12,Math.round(d.totalLength/1.15)));rebuildStageFrontSubsObject(root)}else if(isSimpleDoorRoot(root)){const d=normaliseSimpleDoorData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildSimpleDoorObject(root)}else if(isSinkPairRoot(root)){const d=normaliseSinkPairData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildSinkPairObject(root)}else if(isDoubleSinkCounterRoot(root)){const d=normaliseDoubleSinkCounterData(root.userData.assetData);root.scale.set(1,1,1);d[axis==='x'?'width':'depth']=n;rebuildDoubleSinkCounterObject(root)}else if(isHandrailRoot(root)){const d=normaliseHandrailData(root.userData.assetData);root.scale.set(1,1,1);d.length=n;rebuildHandrailObject(root)}else if(isBarLeanerRoot(root)){bakeBarLeanerScale(root);root.userData.leanerData[axis==='x'?'length':'width']=n;rebuildBarLeaner(root)}else if(root.userData.builderType==='rampPath'){bakeRampPathScale(root);const d=root.userData.rampPathData;if(axis==='z'){d.width=n}else{const cur=rampPathLength(d.points),f=n/Math.max(.001,cur),anchor=d.points[0].slice();d.points=d.points.map(p=>[anchor[0]+(p[0]-anchor[0])*f,anchor[1]+(p[1]-anchor[1])*f])}rebuildRampPath(root)}else{const d=footprintData(root);if(!d){history.pop();flashEditor('Length / width editing is available for artwork, stage, bars, platforms, bar leaners, doors and selected simple fixtures');return}bakeFootprintScale(root);const b=platformBounds(d.points),cur=axis==='x'?b.w:b.d,f=n/Math.max(.001,cur);d.points=d.points.map(p=>axis==='x'?[p[0]*f,p[1]]:[p[0],p[1]*f]);if(isSolidPolygonRoot(root))rebuildSolidPolygon(root);else rebuildPlatform(root)}updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function setSelectedObjectHeight(v){if(!selectedEdit)return;const n=Math.max(.01,+v||.01);pushHistory();let root=prepareDimensionRoot(selectedEdit);if(!root){history.pop();return}if(isSpeakerStackRoot(root)){bakeSpeakerStackScale(root);root.userData.assetData.height=n;rebuildSpeakerStackObject(root)}else if(isSpeakerCabinetRoot(root)){const d=normaliseSpeakerCabinetData(root.userData.assetData);d.height=n;root.scale.set(1,1,1);rebuildSpeakerCabinetObject(root)}else if(isDjBoothRoot(root)){const d=normaliseDjBoothData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.55,n-d.topThickness-d.backRailHeight);rebuildDjBoothObject(root)}else if(isSoundConsoleRoot(root)){const d=normaliseSoundConsoleData(root.userData.assetData);root.scale.set(1,1,1);d.rearHeight=Math.max(.10,n-d.baseHeight-d.mainRise);rebuildSoundConsoleObject(root)}else if(isLightingConsoleRoot(root)){const d=normaliseLightingConsoleData(root.userData.assetData);root.scale.set(1,1,1);d.rearHeight=Math.max(.08,n);d.frontHeight=d.rearHeight;d.topTiltDeg=0;rebuildLightingConsoleObject(root)}else if(isWallMirrorRoot(root)){const d=normaliseWallMirrorData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildWallMirrorObject(root)}else if(isMothershipPortalRoot(root)){const d=normaliseMothershipPortalData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildMothershipPortalObject(root)}else if(isNeonSkullLightBoxRoot(root)){const d=normaliseNeonSkullLightBoxData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildNeonSkullLightBoxObject(root)}else if(isNeonRingPlantPanelRoot(root)){const d=normaliseNeonRingPlantPanelData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildNeonRingPlantPanelObject(root)}else if(isArtworkPanelRoot(root)){const d=normaliseArtworkPanelData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildArtworkPanelObject(root)}else if(isCustomStairRoot(root)){const d=normaliseCustomStairData(root.userData.assetData);root.scale.set(1,1,1);d.rise=Math.max(.10,n-d.wallHeight);rebuildCustomStairObject(root)}else if(isCounterBarFridgeRoot(root)){const d=normaliseCounterBarFridgeData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildCounterBarFridgeObject(root)}else if(isStagePropRoot(root)){const d=normaliseStagePropData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.10,n);rebuildStagePropObject(root)}else if(isDjBoothSideTableRoot(root)){const d=normaliseDjBoothSideTableData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildDjBoothSideTableObject(root)}else if(isDjBoothMonitorRoot(root)){const d=normaliseDjBoothMonitorData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.10,n);d.backHeight=Math.min(d.height-.02,Math.max(.04,d.height*.46));rebuildDjBoothMonitorObject(root)}else if(isDjBoothSideSpeakerRoot(root)){const d=normaliseDjBoothSideTableData(root.userData.assetData);root.scale.set(1,1,1);d.height=Math.max(.20,n);rebuildDjBoothSideSpeakerObject(root)}else if(isStageFrontSubsRoot(root)){const d=normaliseStageFrontSubsData(root.userData.assetData);root.scale.set(1,1,1);d.height=n;rebuildStageFrontSubsObject(root)}else if(isSimpleDoorRoot(root)){const d=normaliseSimpleDoorData(root.userData.assetData);root.scale.set(1,1,1);d.height=n;rebuildSimpleDoorObject(root)}else if(isSinkPairRoot(root)){const d=normaliseSinkPairData(root.userData.assetData);root.scale.set(1,1,1);d.height=n;rebuildSinkPairObject(root)}else if(isDoubleSinkCounterRoot(root)){const d=normaliseDoubleSinkCounterData(root.userData.assetData);root.scale.set(1,1,1);d.height=n;rebuildDoubleSinkCounterObject(root)}else if(isHandrailRoot(root)){const d=normaliseHandrailData(root.userData.assetData);root.scale.set(1,1,1);d.railHeight=Math.max(.45,n-d.rise);rebuildHandrailObject(root)}else if(isBarLeanerRoot(root)){bakeBarLeanerScale(root);root.userData.leanerData.height=n;rebuildBarLeaner(root)}else if(root.userData.builderType==='rampPath'){bakeRampPathScale(root);const d=normaliseRampPathData(root.userData.rampPathData),dir=d.startLevel>=d.finishLevel?1:-1;d.startLevel=d.finishLevel+dir*n;d.height=Math.abs(d.startLevel-d.finishLevel);rebuildRampPath(root)}else if(isSolidPolygonRoot(root)){bakeFootprintScale(root);root.userData.solidData.height=n;rebuildSolidPolygon(root)}else if(root.userData.builderType==='platform'){bakeFootprintScale(root);root.userData.platformData.height=n;rebuildPlatform(root)}else{history.pop();flashEditor('Height editing is available for artwork, stage, bars, platforms, bar leaners, doors and selected simple fixtures');return}updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function setSelectedBaseLevel(v){if(!selectedEdit)return;const n=+v;if(!Number.isFinite(n))return;pushHistory();const cur=selectedBaseLevel(selectedEdit);if(cur==null){history.pop();return}selectedEdit.position.y+=n-cur;if(isFloorSnappedRestroomFixture(selectedEdit)&&selectedEdit.userData.assetData)selectedEdit.userData.assetData.floorSnapName='';selectedEdit.updateMatrixWorld(true);updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function getWallWidth(root){if(!isWallRoot(root))return null;if(root.userData.builderType==='curvedWall')return root.userData.curveData.width;if(root.userData.builderType==='polyWall')return root.userData.polyWallData.width;const p=root.geometry.parameters;return Math.abs((+p.depth||.18)*root.scale.z)}
function getWallHeight(root){if(!isWallRoot(root))return null;if(root.userData.builderType==='curvedWall')return root.userData.curveData.height*Math.abs(root.scale.y);if(root.userData.builderType==='polyWall')return root.userData.polyWallData.height*Math.abs(root.scale.y);const p=root.geometry.parameters;return Math.abs((+p.height||2.55)*root.scale.y)}
function setSelectedWallWidth(v){if(!isWallRoot(selectedEdit))return;pushHistory();const n=Math.max(.03,+v||.18);if(selectedEdit.userData.builderType==='curvedWall'){selectedEdit.userData.curveData.width=n;rebuildCurvedWall(selectedEdit)}else if(selectedEdit.userData.builderType==='polyWall'){selectedEdit.userData.polyWallData.width=n;rebuildPolylineWall(selectedEdit)}else{const p=selectedEdit.geometry.parameters;selectedEdit.scale.z=n/Math.max(+p.depth||.18,.0001)}updateSelectionBox();saveLocalEditState(false);syncAdvancedFields()}
function setSelectedWallHeight(v){if(!isWallRoot(selectedEdit))return;pushHistory();const n=Math.max(.1,+v||2.55);if(selectedEdit.userData.builderType==='curvedWall'){const d=selectedEdit.userData.curveData;d.height=n/Math.max(Math.abs(selectedEdit.scale.y),.0001);rebuildCurvedWall(selectedEdit)}else if(selectedEdit.userData.builderType==='polyWall'){selectedEdit.userData.polyWallData.height=n/Math.max(Math.abs(selectedEdit.scale.y),.0001);rebuildPolylineWall(selectedEdit)}else{const p=selectedEdit.geometry.parameters;selectedEdit.scale.y=n/Math.max(+p.height||2.55,.0001);selectedEdit.position.y=n/2}updateSelectionBox();saveLocalEditState(false);syncAdvancedFields()}
function ensureCustomPlatform(root){if(!root||root.userData.builderType==='platform')return root;if(root.userData.builderType==='platformBox'){const p=root.geometry.parameters,w=Math.abs((+p.width||3)*root.scale.x),d=Math.abs((+p.depth||2)*root.scale.z),h=Math.abs((+p.height||.3)*root.scale.y),np=createPlatformObject('rect',{width:w,depth:d,height:h,x:root.position.x,z:root.position.z,name:root.userData.editName+' Custom',color:extractObjectColour(root)});np.rotation.y=root.rotation.y;root.visible=false;selectEdit(np);return np}if(root.userData.builderType==='floorSurface'){let pts=null,cx=0,cz=0,h=.06;if(root===exteriorFloor&&typeof exteriorOutline!=='undefined'){const world=insetPolygonWorld(exteriorOutline,0);cx=world.reduce((s,p)=>s+p[0],0)/world.length;cz=world.reduce((s,p)=>s+p[1],0)/world.length;pts=world.map(p=>[p[0]-cx,p[1]-cz])}else{const b=objectBoundsWorld(root).b,s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);cx=c.x;cz=c.z;h=Math.max(.04,s.y||.08);pts=presetPlatformPoints('rect',Math.max(.2,s.x),Math.max(.2,s.z))}const np=createPlatformObject('rect',{points:pts,height:h,x:cx,y:mainFloorLevel()-h,z:cz,name:(root.userData.editName||'Floor')+' Custom',color:extractObjectColour(root)});root.visible=false;selectEdit(np);return np}return null}
function selectedPlatformHeight(){if(isSolidPolygonRoot(selectedEdit)&&selectedEdit.userData.solidData.role==='stage')return selectedEdit.userData.solidData.height*Math.abs(selectedEdit.scale.y);if(!isPlatformRoot(selectedEdit))return null;if(selectedEdit.userData.builderType==='platform')return selectedEdit.userData.platformData.height*Math.abs(selectedEdit.scale.y);const p=selectedEdit.geometry.parameters;return Math.abs((+p.height||.3)*selectedEdit.scale.y)}
function setSelectedPlatformHeight(v){if(isSolidPolygonRoot(selectedEdit)&&selectedEdit.userData.solidData.role==='stage'){setSelectedObjectHeight(v);return}if(isStaticPointSolid(selectedEdit)&&selectedEdit.userData.staticSolidEdit.role==='stage'){setSelectedObjectHeight(v);return}if(!isPlatformRoot(selectedEdit))return;pushHistory();let root=ensureCustomPlatform(selectedEdit);if(!root)return;const isRoom=!!(root.userData.platformData&&root.userData.platformData.roomData);root.userData.platformData.height=Math.max(.01,+v||.3)/Math.max(Math.abs(root.scale.y),.0001);rebuildPlatform(root);if(autoMainFloorLock&&!isRoom)alignRootToMainFloor(root,false);updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function mainFloorLevel(){try{return objectBoundsWorld(exteriorFloor).b.max.y}catch(e){return 0}}
function isLevelSensitiveRoot(o){return !!o&&(isWallRoot(o)||isPlatformRoot(o)||isSolidPolygonRoot(o)||isBarLeanerRoot(o)||o.userData?.builderType==='floorSurface'||o===stage||isStaticPointSolid(o))}
function rootAllowsAutoFloorLock(o){if(o&&o.userData&&o.userData.builderType==='rampPath')return false;if(isSolidPolygonRoot(o))return o.userData.solidData.autoFloorLock!==false;if(isStaticPointSolid(o))return o.userData.staticSolidEdit.role==='stage';return true}
function levelUsesTop(root){return !!root&&(root.userData?.builderType==='floorSurface'||(isPlatformRoot(root)&&isLowFloorRoot(root)))}
function rootLevelAnchor(root){if(!root)return null;const b=objectBoundsWorld(root).b;return levelUsesTop(root)?b.max.y:b.min.y}
function levelDelta(root){const a=rootLevelAnchor(root);return a==null?null:a-mainFloorLevel()}
function alignRootToMainFloor(root,announce=true){if(!isLevelSensitiveRoot(root))return false;root.updateMatrixWorld(true);const d=levelDelta(root);if(d==null)return false;root.position.y-=d;root.updateMatrixWorld(true);updateSelectionBox();updateVertexHandles();if(announce)flashEditor('Aligned exactly to main floor');return true}
function syncLevelUI(){const box=document.getElementById('levelStatus'),txt=document.getElementById('levelStatusText'),read=document.getElementById('levelReadout'),snap=document.getElementById('snapMainFloor'),lock=document.getElementById('toggleMainFloorLock'),label=document.getElementById('levelModeLabel');if(lock){lock.textContent=autoMainFloorLock?'2D LEVEL LOCK ON':'2D LEVEL LOCK OFF';lock.classList.toggle('active',autoMainFloorLock)}if(label)label.textContent=mode2d?'2D SAFETY':'3D CHECK';if(!box||!txt||!read)return;box.classList.remove('aligned','floating','below','na');if(!isLevelSensitiveRoot(selectedEdit)){box.classList.add('na');txt.textContent='SELECT FLOOR / WALL';read.textContent='—';if(snap)snap.disabled=true;if(selectionBox&&selectionBox.material)selectionBox.material.color.set(0x39d9f9);return}if(snap)snap.disabled=false;const d=levelDelta(selectedEdit)||0,eps=.006;if(Math.abs(d)<=eps){box.classList.add('aligned');txt.textContent='ALIGNED TO MAIN FLOOR';read.textContent='0.000 m';if(selectionBox&&selectionBox.material)selectionBox.material.color.set(0x51e06d)}else if(d>0){box.classList.add('floating');txt.textContent='FLOATING ABOVE FLOOR';read.textContent='+'+d.toFixed(3)+' m';if(selectionBox&&selectionBox.material)selectionBox.material.color.set(0xffd166)}else{box.classList.add('below');txt.textContent='BELOW MAIN FLOOR';read.textContent=d.toFixed(3)+' m';if(selectionBox&&selectionBox.material)selectionBox.material.color.set(0xff4f6f)}}
function syncDimensionFields(){const w=document.getElementById('wallWidthInput'),wh=document.getElementById('wallHeightInput'),ph=document.getElementById('platformHeightInput'),ol=document.getElementById('objectLengthInput'),ow=document.getElementById('objectWidthInput'),oh=document.getElementById('objectHeightInput'),oy=document.getElementById('objectLevelInput'),point=document.getElementById('editPoints'),add=document.getElementById('addPoint'),rem=document.getElementById('removePoint'),status=document.getElementById('pointStatus'),join=document.getElementById('connectToWall'),room=document.getElementById('makeRoomFloor'),arcIn=document.getElementById('arcCutIn'),arcOut=document.getElementById('arcCutOut');const wall=isWallRoot(selectedEdit),floor=isPlatformRoot(selectedEdit),floorSurface=!!selectedEdit&&selectedEdit.userData.builderType==='floorSurface',solid=isSolidPolygonRoot(selectedEdit)||isStaticPointSolid(selectedEdit),rampPath=!!selectedEdit&&selectedEdit.userData.builderType==='rampPath',groupMode=!!activeGroupId||multiSelection.length>0,eligible=!groupMode&&(wall||floor||floorSurface||solid||rampPath),dims=groupMode?null:selectedObjectDimensions(selectedEdit),base=groupMode?null:selectedBaseLevel(selectedEdit);const olLabel=ol&&ol.parentElement?ol.parentElement.querySelector('span'):null,owLabel=ow&&ow.parentElement?ow.parentElement.querySelector('span'):null,ohLabel=oh&&oh.parentElement?oh.parentElement.querySelector('span'):null;if(olLabel)olLabel.textContent=rampPath?'PATH LENGTH m':'LENGTH m';if(owLabel)owLabel.textContent=rampPath?'RAMP WIDTH m':'WIDTH / DEPTH m';if(ohLabel)ohLabel.textContent=rampPath?'TOTAL RISE m':'OBJECT HEIGHT m';if(w){w.disabled=!wall;if(wall)w.value=(getWallWidth(selectedEdit)||.18).toFixed(2)}if(wh){wh.disabled=!wall;if(wall)wh.value=(getWallHeight(selectedEdit)||2.55).toFixed(2)}const platformLike=floor||(solid&&((selectedEdit.userData.solidData&&selectedEdit.userData.solidData.role==='stage')||(selectedEdit.userData.staticSolidEdit&&selectedEdit.userData.staticSolidEdit.role==='stage')));if(ph){ph.disabled=!platformLike;if(platformLike)ph.value=(selectedPlatformHeight()||.30).toFixed(2)}[[ol,'length'],[ow,'width'],[oh,'height']].forEach(([el,k])=>{if(!el)return;el.disabled=!dims;if(dims)el.value=dims[k].toFixed(2)});if(oy){oy.disabled=rampPath?true:base==null;if(!rampPath&&base!=null)oy.value=base.toFixed(2)}if(point)point.disabled=!eligible;if(add)add.disabled=!eligible;if(rem)rem.disabled=!eligible;if(join)join.disabled=!(wall&&selectedEdit.userData.builderType==='polyWall');if(room)room.disabled=!wall;if(arcIn)arcIn.disabled=!wall;if(arcOut)arcOut.disabled=!wall;document.querySelectorAll('.floor-shape').forEach(b=>b.disabled=!(floor||floorSurface));if(status){if(!eligible)status.textContent=isBarLeanerRoot(selectedEdit)?'LEANER DIMENSIONS READY':'SELECT FLOOR / WALL / STAGE / BAR / RAMP';else if(vertexEditMode)status.textContent=rampPath?'START → ROUTE POINTS → FINISH':wall?'DRAG POINT · ANGLES LIVE':solid?'DRAG SOLID CORNERS':'DRAG PINK POINTS';else status.textContent=rampPath?'SMART RAMP READY':wall?'WALL READY':solid?'SOLID READY':'FLOOR READY'}}
function syncInteractionFields(){const box=document.getElementById('objectInteractionBox'),status=document.getElementById('objectInteractionStatus'),highlight=document.getElementById('interactionHighlightOnHover'),interactive=document.getElementById('interactionInteractive'),style=document.getElementById('interactionHighlightStyle'),action=document.getElementById('interactionClickAction'),targetField=document.getElementById('interactionTargetField'),target=document.getElementById('interactionTarget'),apply=document.getElementById('interactionApply'),root=isEditableRoot(selectedEdit)?selectedEdit:null; if(!box)return;const enabled=!!root;[highlight,interactive,style,action,target,apply].forEach(el=>{if(el)el.disabled=!enabled});if(!root){status.textContent='SELECT AN OBJECT';if(highlight)highlight.checked=false;if(interactive)interactive.checked=false;if(style)style.value='outline';if(action)action.value='none';if(target)target.innerHTML='';if(targetField)targetField.style.display='none';return}status.textContent=root.userData.editName||'SELECTED OBJECT';if(highlight)highlight.checked=root.userData.highlightOnHover===true;if(interactive)interactive.checked=root.userData.interactive===true;if(style)style.value=['outline','brightness','emissive'].includes(root.userData.highlightStyle)?root.userData.highlightStyle:'outline';if(action)action.value=['none','popup','page','camera'].includes(root.userData.clickAction)?root.userData.clickAction:'none';const kind=action?.value||'none';if(targetField)targetField.style.display=kind==='page'||kind==='camera'?'block':'none';if(target){const current=root.userData.clickTarget||'',opts=kind==='page'?[['','CHOOSE PAGE'],['page:explore','OVERVIEW'],['page:venue','VENUE'],['page:hire','HIRE'],['page:production','PRODUCTION'],['page:marketing','MARKETING'],['page:past','PAST EVENTS'],['page:contact','CONTACT']]:cameraFrames.map(f=>['frame:'+f.id,f.name||'CAMERA VIEW']);target.innerHTML=opts.map(([v,l])=>'<option value="'+String(v).replace(/"/g,'&quot;')+'">'+String(l).replace(/</g,'&lt;')+'</option>').join('');target.value=opts.some(([v])=>v===current)?current:''}}\nfunction applySelectedInteraction(){if(!isEditableRoot(selectedEdit)){flashEditor('Select one editable object first');return}pushHistory();const root=selectedEdit,action=document.getElementById('interactionClickAction')?.value||'none';root.userData.highlightOnHover=!!document.getElementById('interactionHighlightOnHover')?.checked;root.userData.interactive=!!document.getElementById('interactionInteractive')?.checked;root.userData.highlightStyle=document.getElementById('interactionHighlightStyle')?.value||'outline';root.userData.clickAction=action;root.userData.clickTarget=(action==='page'||action==='camera')?document.getElementById('interactionTarget')?.value||'':'';saveLocalEditState(false);syncInteractionFields();flashEditor('Interaction settings saved')}\nfunction syncAdvancedFields(){syncAppearanceFields();syncDimensionFields();syncLevelUI();syncConnectPointsUI();syncRampLevelUI();syncSpeakerStackUI();syncToiletLevelUI();syncDoorUI();syncStairRailUI();syncSinkPlacementUI();syncStageFrontSubsUI();syncCustomStairUI();syncBacklitArtworkUI();syncLedStripUI();syncCurtainUI();syncWallPoleUI();syncCeilingLightPoleUI();syncLightFixtureUI();syncObjectPopupEditorUI?.();syncInteractionFields()}

let backlitArtworkUIBusy=false,backlitArtworkHistoryArmed=false,ledStripUIBusy=false,ledStripHistoryArmed=false;
function backlitArtworkInputs(){return {box:document.getElementById('backlitArtworkBox'),status:document.getElementById('backlitArtworkStatus'),note:document.getElementById('backlitArtworkNote'),logoRow:document.getElementById('artLogoColorRow'),enabled:document.getElementById('artBacklightEnabled'),color:document.getElementById('artBacklightColor'),logoColor:document.getElementById('artLogoColor'),brightness:document.getElementById('artBacklightBrightness'),spread:document.getElementById('artBacklightSpread'),blend:document.getElementById('artBacklightBlend'),brightnessNumber:document.getElementById('artBacklightBrightnessNumber'),spreadNumber:document.getElementById('artBacklightSpreadNumber'),blendNumber:document.getElementById('artBacklightBlendNumber')}}
function syncBacklitArtworkUI(){const ui=backlitArtworkInputs();if(!ui.box)return;const active=isBacklitArtworkRoot(selectedEdit);ui.box.style.display=active?'block':'none';if(ui.status)ui.status.textContent=active?(selectedEdit.userData.editName||'BACKLIT ART'):'NOT SELECTED';if(!active){backlitArtworkUIBusy=false;return}const kind=backlitRootKind(selectedEdit),d=getBacklitRootData(selectedEdit),portal=kind==='portal';backlitArtworkUIBusy=true;if(ui.enabled)ui.enabled.checked=d.backlit!==false;if(ui.color)ui.color.value=d.backlightColor||d.ringColor||d.panelColor||'#ff4ea6';if(ui.logoRow)ui.logoRow.style.display=portal?'grid':'none';if(ui.logoColor)ui.logoColor.value=d.logoColor||'#52d0ff';if(ui.brightness)ui.brightness.value=String(d.backlightBrightness??2.2);if(ui.spread)ui.spread.value=String(d.backlightSpread??1.35);if(ui.blend){ui.blend.parentElement.style.display=portal?'grid':'none';ui.blend.value=String(portal?(d.backlightBlend??.62):.62)}if(ui.brightnessNumber)ui.brightnessNumber.value=(d.backlightBrightness??2.2).toFixed(2);if(ui.spreadNumber)ui.spreadNumber.value=(d.backlightSpread??1.35).toFixed(2);if(ui.blendNumber){ui.blendNumber.parentElement.style.display=portal?'grid':'none';ui.blendNumber.value=(portal?(d.backlightBlend??.62):.62).toFixed(2)}if(ui.note)ui.note.textContent=portal?'CIRCULAR LED only · adjust halo colour, centre logo colour, brightness, spread and blend/softness.':kind==='skull'?'Adjust the skull neon colour, brightness and glow spread.':kind==='ring'?'Adjust the neon ring colour, brightness and glow spread.':'Adjust the backlight colour, brightness and spread.';backlitArtworkUIBusy=false}
function armBacklitArtworkHistory(){if(backlitArtworkHistoryArmed||!isBacklitArtworkRoot(selectedEdit))return;pushHistory();backlitArtworkHistoryArmed=true}
function releaseBacklitArtworkHistory(){backlitArtworkHistoryArmed=false}
function applyBacklitArtworkSettingsFromUI(){if(backlitArtworkUIBusy||!isBacklitArtworkRoot(selectedEdit))return;const ui=backlitArtworkInputs(),kind=backlitRootKind(selectedEdit),portal=kind==='portal',d=getBacklitRootData(selectedEdit);d.backlit=!!ui.enabled.checked;d.backlightColor=ui.color.value||'#ff4ea6';if(kind==='skull')d.panelColor=d.backlightColor;if(kind==='ring')d.ringColor=d.backlightColor;if(portal&&ui.logoColor)d.logoColor=ui.logoColor.value||'#52d0ff';d.backlightBrightness=Math.max(0,Math.min(8,+(ui.brightnessNumber&&ui.brightnessNumber.value||ui.brightness.value)||0));d.backlightSpread=Math.max(.2,Math.min(4,+(ui.spreadNumber&&ui.spreadNumber.value||ui.spread.value)||1));if(portal)d.backlightBlend=Math.max(0,Math.min(1,+(ui.blendNumber&&ui.blendNumber.value||ui.blend.value)||0));selectedEdit.userData.assetData=d;if(ui.brightness)ui.brightness.value=String(d.backlightBrightness);if(ui.spread)ui.spread.value=String(d.backlightSpread);if(ui.brightnessNumber)ui.brightnessNumber.value=d.backlightBrightness.toFixed(2);if(ui.spreadNumber)ui.spreadNumber.value=d.backlightSpread.toFixed(2);if(ui.blend)ui.blend.value=String(portal?d.backlightBlend:.62);if(ui.blendNumber)ui.blendNumber.value=(portal?d.backlightBlend:.62).toFixed(2);rebuildBacklitRoot(selectedEdit);updateSelectionBox();updateEditorSelected();saveLocalEditState(false)}
function ledStripInputs(){return {box:document.getElementById('ledStripBox'),status:document.getElementById('ledStripStatus'),scope:document.getElementById('ledStripScope'),enabled:document.getElementById('ledStripEnabled'),color:document.getElementById('ledStripColor'),brightness:document.getElementById('ledStripBrightness'),brightnessNumber:document.getElementById('ledStripBrightnessNumber'),note:document.getElementById('ledStripNote')}}
function ledStripTargetsFromUI(){const ui=ledStripInputs(),all=ledStripRoots();if(ui.scope&&ui.scope.value==='all')return all;return isLedStripRoot(selectedEdit)?[selectedEdit]:[]}
function syncLedStripUI(){const ui=ledStripInputs();if(!ui.box)return;const all=ledStripRoots(),active=isLedStripRoot(selectedEdit),show=active||all.length>0;ui.box.style.display=show?'block':'none';if(!show){if(ui.status)ui.status.textContent='NO STRIPS';ledStripUIBusy=false;return}ledStripUIBusy=true;if(ui.scope&&!active&&ui.scope.value==='selected')ui.scope.value='all';const allMode=ui.scope&&ui.scope.value==='all',targets=allMode?all:(active?[selectedEdit]:[]),sample=targets[0]?getLedStripData(targets[0]):null;if(ui.status)ui.status.textContent=allMode?('ALL STRIPS · '+all.length):(active?(selectedEdit.userData.editName||'LED STRIP'):'NO STRIP SELECTED');if(sample){if(ui.color)ui.color.value=sample.color||'#39d9f9';if(ui.brightness)ui.brightness.value=String(sample.brightness??3.2);if(ui.brightnessNumber)ui.brightnessNumber.value=(sample.brightness??3.2).toFixed(2);if(ui.enabled){const enabledCount=targets.filter(r=>getLedStripData(r).enabled!==false).length;ui.enabled.checked=enabledCount===targets.length;ui.enabled.indeterminate=enabledCount>0&&enabledCount<targets.length}}else if(ui.enabled){ui.enabled.checked=false;ui.enabled.indeterminate=false}if(ui.note)ui.note.innerHTML=allMode?('<b>ALL MODE</b> · '+all.length+' strip'+(all.length===1?'':'s')+' targeted. Colour / brightness / power changes every strip. <b>DRAW CONTINUOUS</b> lets you add unlimited corners; <b>TRACE RAISED TOP EDGE</b> follows the platform perimeter automatically.'):('<b>SELECTED MODE</b> · only the selected strip changes. Continuous strips remain one editable object even around multiple corners.');ledStripUIBusy=false;syncLedPathAlignmentUI()}
function armLedStripHistory(){if(ledStripHistoryArmed||!ledStripTargetsFromUI().length)return;pushHistory();ledStripHistoryArmed=true}
function releaseLedStripHistory(){ledStripHistoryArmed=false}
function applyLedStripSettingsFromUI(changed='all'){if(ledStripUIBusy)return;const ui=ledStripInputs(),targets=ledStripTargetsFromUI();if(!targets.length)return;const color=(ui.color&&ui.color.value)||'#39d9f9',brightness=Math.max(0,Math.min(8,+(ui.brightnessNumber&&ui.brightnessNumber.value||ui.brightness&&ui.brightness.value)||0)),enabled=ui.enabled?ui.enabled.checked:true;targets.forEach(root=>{const d=getLedStripData(root);if(changed==='all'||changed==='color')d.color=color;if(changed==='all'||changed==='brightness'||changed==='brightnessNumber')d.brightness=brightness;if(changed==='all'||changed==='enabled')d.enabled=enabled;setLedStripData(root,d);applyLedStripAppearance(root,d.color,d.brightness,d.enabled)});if(ui.brightness)ui.brightness.value=String(brightness);if(ui.brightnessNumber)ui.brightnessNumber.value=brightness.toFixed(2);updateSelectionBox();updateEditorSelected();saveLocalEditState(false);syncLedStripUI()}
function setAllLedStripPower(on){const roots=ledStripRoots();if(!roots.length){flashEditor('No LED strips to change');return}pushHistory();roots.forEach(root=>{const d=getLedStripData(root);d.enabled=!!on;setLedStripData(root,d);applyLedStripAppearance(root,d.color,d.brightness,d.enabled)});const ui=ledStripInputs();if(ui.scope)ui.scope.value='all';saveLocalEditState(false);syncLedStripUI();flashEditor('All LED strips '+(on?'ON':'OFF'))}
function selectAllLedStripsForLighting(){const roots=ledStripRoots(),ui=ledStripInputs();if(!roots.length){flashEditor('No LED strips added yet');return}if(ui.scope)ui.scope.value='all';syncLedStripUI();flashEditor('ALL LED STRIPS selected for lighting controls · '+roots.length+' strips')}

/* floor shapes + draggable vertices */
function platformBounds(points){let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;points.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minZ=Math.min(minZ,p[1]);maxZ=Math.max(maxZ,p[1])});return {w:Math.max(.3,maxX-minX),d:Math.max(.3,maxZ-minZ)}}
function ensureDynamicPillar(root){if(!root||root.userData.dynamic)return root;if(!isPillarRoot(root))return null;const p=root.geometry.parameters||{},w=Math.abs((+p.width||+p.radiusTop*2||.62)*root.scale.x),d=Math.abs((+p.depth||+p.radiusTop*2||.62)*root.scale.z),h=Math.abs((+p.height||2.62)*root.scale.y),np=createPillarObject('rect',{width:w,depth:d,height:h,x:root.position.x,z:root.position.z,name:root.userData.editName+' Custom',color:extractObjectColour(root)});np.rotation.y=root.rotation.y;root.visible=false;selectEdit(np);return np}
function applySelectedShape(shape){if(isPlatformRoot(selectedEdit)||(selectedEdit&&selectedEdit.userData.builderType==='floorSurface')){pushHistory();const root=ensureCustomPlatform(selectedEdit),b=platformBounds(root.userData.platformData.points);root.userData.platformData.shape=shape;root.userData.platformData.points=presetPlatformPoints(shape,b.w,b.d);rebuildPlatform(root);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);flashEditor(shape.toUpperCase()+' floor')}else if(isPillarRoot(selectedEdit)){pushHistory();const root=ensureDynamicPillar(selectedEdit),d=root.userData.pillarData;d.width*=Math.abs(root.scale.x);d.depth*=Math.abs(root.scale.z);d.height*=Math.abs(root.scale.y);d.shape=shape;if(root.geometry)root.geometry.dispose();root.geometry=pillarGeometry(shape,d.width,d.depth,d.height);root.scale.set(1,1,1);root.position.y=d.height/2;updateSelectionBox();saveLocalEditState(false);flashEditor(shape.toUpperCase()+' pillar')}else flashEditor('Select an editable floor or pillar first')}
function clearWallAngleReadouts(){while(wallAngleGroup.children.length){const o=wallAngleGroup.children.pop();if(o.material&&o.material.map)o.material.map.dispose();if(o.material)o.material.dispose()}wallAngleGroup.visible=false}
function clearVertexHandles(){while(vertexHandleGroup.children.length){const h=vertexHandleGroup.children.pop();if(h.geometry)h.geometry.dispose();if(h.material)h.material.dispose()}vertexHandleGroup.visible=false;clearWallAngleReadouts()}
function pointDataForRoot(root){if(!root)return null;if(isLedStripPathRoot(root)){const d=normaliseLedStripPathData(root.userData.ledPathData||{});return {points:d.points,closed:!!d.closed,isLedPath:true}}if(isCustomStairRoot(root)){const d=normaliseCustomStairData(root.userData.assetData);return {points:d.points,ys:[.12,d.rise+.12],closed:false}}if(root.userData.builderType==='platform')return {points:root.userData.platformData.points,y:root.userData.platformData.height+.06,closed:true};if(root.userData.builderType==='solidPolygon')return {points:root.userData.solidData.points,y:root.userData.solidData.height+.06,closed:true};if(root.userData.builderType==='polyWall')return {points:root.userData.polyWallData.points,y:root.userData.polyWallData.height+.08,closed:!!root.userData.polyWallData.closed};if(root.userData.builderType==='rampPath'){const d=normaliseRampPathData(root.userData.rampPathData);return {points:d.points,ys:rampPathPointLevels(d).map(y=>y+.10),closed:false}};return null}
function planWallAngleDeg(){return 0;}
function includedCornerAngleDeg(prev,centre,next){const a=prev.clone().sub(centre).setY(0),b=next.clone().sub(centre).setY(0);if(a.lengthSq()<1e-8||b.lengthSq()<1e-8)return null;a.normalize();b.normalize();return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(a.dot(b),-1,1)))}
function angleLabelSprite(text,position,accent='#39d9f9',scale=1){const c=document.createElement('canvas');c.width=420;c.height=92;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.font='700 28px IBM Plex Mono, monospace';const tw=Math.ceil(ctx.measureText(text).width),bw=Math.min(400,tw+42),x=(c.width-bw)/2;ctx.fillStyle='rgba(7,9,12,.92)';ctx.beginPath();ctx.roundRect(x,13,bw,64,12);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f6f7f9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,46);const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));sp.position.copy(position);sp.scale.set(2.15*scale,.47*scale,1);sp.renderOrder=150;wallAngleGroup.add(sp);return sp}
function updateWallAngleReadouts(){clearWallAngleReadouts();if(!vertexEditMode||!selectedEdit||selectedEdit.userData.builderType!=='polyWall'||activeVertexIndex<0)return;const d=selectedEdit.userData.polyWallData,pts=d.points;if(!pts||activeVertexIndex>=pts.length)return;const i=activeVertexIndex,y=(d.height||2.55)+.34,centre=selectedEdit.localToWorld(new THREE.Vector3(pts[i][0],0,pts[i][1])).setY(y);const isClosed=!!d.closed,prev=i>0?selectedEdit.localToWorld(new THREE.Vector3(pts[i-1][0],0,pts[i-1][1])).setY(y):(isClosed&&pts.length>2?selectedEdit.localToWorld(new THREE.Vector3(pts[pts.length-1][0],0,pts[pts.length-1][1])).setY(y):null),next=i<pts.length-1?selectedEdit.localToWorld(new THREE.Vector3(pts[i+1][0],0,pts[i+1][1])).setY(y):(isClosed&&pts.length>2?selectedEdit.localToWorld(new THREE.Vector3(pts[0][0],0,pts[0][1])).setY(y):null);const pushSegmentLabel=(other,name)=>{if(!other)return;const mid=centre.clone().lerp(other,.46);const dir=other.clone().sub(centre).setY(0).normalize();const perp=new THREE.Vector3(-dir.z,0,dir.x);mid.add(perp.multiplyScalar(.28));mid.y=y+.02;angleLabelSprite(name+' '+planWallAngleDeg(centre,other).toFixed(1)+'° · '+centre.distanceTo(other).toFixed(2)+'m',mid,'#39d9f9',.88)};pushSegmentLabel(prev,'A');pushSegmentLabel(next,prev?'B':'A');if(prev&&next){const corner=includedCornerAngleDeg(prev,centre,next);if(corner!=null){const bis=prev.clone().sub(centre).setY(0).normalize().add(next.clone().sub(centre).setY(0).normalize());if(bis.lengthSq()<1e-5)bis.set(0,0,1);else bis.normalize();const pos=centre.clone().add(bis.multiplyScalar(.62));pos.y=y+.16;angleLabelSprite('CORNER '+corner.toFixed(1)+'°',pos,'#ffd166',1)}}wallAngleGroup.visible=true}
function updateVertexHandles(){clearVertexHandles();if(!vertexEditMode||!selectedEdit)return;const d=pointDataForRoot(selectedEdit);if(!d)return;d.points.forEach((p,i)=>{const isRamp=selectedEdit.userData.builderType==='rampPath',isLed=!!d.isLedPath,rampColour=isRamp?(i===activeVertexIndex?0xffd166:(i===0?0x51e06d:(i===d.points.length-1?0x39d9f9:0xff2e83))):null,ledColour=isLed?(i===activeVertexIndex?0xffd166:(i===0?0x51e06d:(i===d.points.length-1?0x39d9f9:0xff2e83))):null,mat=new THREE.MeshBasicMaterial({color:isRamp?rampColour:(isLed?ledColour:(pointConnectMode&&i===pointConnectFirst?0x51e06d:(i===activeVertexIndex?0xffd166:0xff2e83))),depthTest:false});const h=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),mat);const world=isLed?selectedEdit.localToWorld(new THREE.Vector3(p[0],p[1],p[2])):selectedEdit.localToWorld(new THREE.Vector3(p[0],d.ys?d.ys[i]:d.y,p[1]));h.position.copy(world);h.renderOrder=100;h.userData.vertexIndex=i;vertexHandleGroup.add(h)});vertexHandleGroup.visible=true;updateWallAngleReadouts();if(typeof syncLedPathAlignmentUI==='function')syncLedPathAlignmentUI()}
function wallLoopTarget(){if(activeTraceWall&&activeTraceWall.parent&&activeTraceWall.userData&&activeTraceWall.userData.builderType==='polyWall')return activeTraceWall;if(selectedEdit&&selectedEdit.parent&&selectedEdit.userData&&selectedEdit.userData.builderType==='polyWall')return selectedEdit;return null}
function syncConnectPointsUI(){const btn=document.getElementById('connectPoints'),closeBtn=document.getElementById('closeWallLoop'),root=wallLoopTarget(),d=root&&root.userData.polyWallData;if(closeBtn){const canClose=!!(d&&!d.closed&&d.points&&d.points.length>=3);closeBtn.disabled=!canClose;closeBtn.textContent=d&&d.closed?'WALL CLOSED':(drawMode==='wallTrace'?'CLOSE WALL NOW':'CLOSE WALL');closeBtn.classList.toggle('active',canClose&&(drawMode==='wallTrace'||hasPausedWallTrace()));closeBtn.title=canClose?'Create the final wall from the last point back to the first point':'A wall needs at least 3 points before it can be closed'}if(!btn)return;const selectedD=selectedEdit&&selectedEdit.userData&&selectedEdit.userData.builderType==='polyWall'?selectedEdit.userData.polyWallData:null;if(selectedD&&selectedD.closed){btn.textContent='OPEN LOOP';btn.classList.add('active');btn.disabled=false;return}btn.classList.toggle('active',pointConnectMode);btn.textContent=pointConnectMode?(pointConnectFirst<0?'CLICK 1ST END':'CLICK 2ND END'):'CONNECT ENDS';btn.disabled=!(vertexEditMode&&selectedD&&selectedD.points&&selectedD.points.length>2)}
function closeWallLoopNow(){const root=wallLoopTarget();if(!root||!root.userData.polyWallData){flashEditor('Start tracing or select an open traced wall first');return}const d=root.userData.polyWallData;if(d.closed){flashEditor('That wall is already closed');return}if(!d.points||d.points.length<3){flashEditor('Add at least 3 wall points before closing the wall loop');return}pushHistory();d.closed=true;rebuildPolylineWall(root);root.updateMatrixWorld(true);drawMode=null;drawPoints=[];activeTraceWall=null;clearDrawGuides();pointConnectMode=false;pointConnectFirst=-1;vertexEditMode=false;activeVertexIndex=-1;dragVertex=null;selectEdit(root);transform.attach(root);updateSelectionBox();updateVertexHandles();syncDrawButtons();syncConnectPointsUI();const st=document.getElementById('drawStatus');if(st)st.textContent='WALL LOOP CLOSED';saveLocalEditState(false);flashEditor('Wall loop closed · no floor created')}
function cancelPointConnect(){pointConnectMode=false;pointConnectFirst=-1;syncConnectPointsUI();updateVertexHandles()}
function beginPointConnect(){if(!selectedEdit||selectedEdit.userData.builderType!=='polyWall'){flashEditor('Select a traced wall and turn EDIT POINTS on first');return}const d=selectedEdit.userData.polyWallData;if(d.closed){pushHistory();d.closed=false;rebuildPolylineWall(selectedEdit);activeVertexIndex=-1;cancelPointConnect();updateSelectionBox();saveLocalEditState(false);flashEditor('Wall loop opened · the first and last points are separate again');return}if(!vertexEditMode){setVertexEdit(true);if(!vertexEditMode)return}if(!d.points||d.points.length<3){flashEditor('The wall needs at least 3 points before it can be closed');return}pointConnectMode=true;pointConnectFirst=-1;transform.detach();syncConnectPointsUI();updateVertexHandles();flashEditor('Click the first end point, then the other end point')}
function handlePointConnect(index){if(!pointConnectMode||!selectedEdit||selectedEdit.userData.builderType!=='polyWall')return false;const d=selectedEdit.userData.polyWallData,n=d.points.length;if(index!==0&&index!==n-1){flashEditor('Choose one of the two END points of the wall');return true}if(pointConnectFirst<0){pointConnectFirst=index;activeVertexIndex=index;syncConnectPointsUI();updateVertexHandles();flashEditor('First end selected · click the other end point');return true}if(index===pointConnectFirst){flashEditor('Click the other end point');return true}if(!((pointConnectFirst===0&&index===n-1)||(pointConnectFirst===n-1&&index===0))){flashEditor('Only the two wall ends can be joined');return true}pushHistory();d.closed=true;pointConnectMode=false;pointConnectFirst=-1;activeVertexIndex=index;rebuildPolylineWall(selectedEdit);selectedEdit.updateMatrixWorld(true);updateSelectionBox();updateVertexHandles();syncConnectPointsUI();saveLocalEditState(false);flashEditor('Wall ends connected · closed loop · no floor created');return true}
function setVertexEdit(on){const btn=document.getElementById('editPoints');if(!on)cancelPointConnect();if(!on&&drawMode==='wallTrace'){finishWallTrace();return}if(on){if(!selectedEdit||(!isPlatformRoot(selectedEdit)&&selectedEdit.userData.builderType!=='floorSurface'&&!isWallRoot(selectedEdit)&&!isSolidPolygonRoot(selectedEdit)&&selectedEdit.userData.builderType!=='rampPath'&&!isCustomStairRoot(selectedEdit)&&!isStaticPointSolid(selectedEdit)&&!isLedStripPathRoot(selectedEdit))){flashEditor('Select an editable floor, wall, stage, bar, ramp or continuous LED strip first');return}if((isPlatformRoot(selectedEdit)||selectedEdit.userData.builderType==='floorSurface')&&selectedEdit.userData.builderType!=='platform'){pushHistory();ensureCustomPlatform(selectedEdit)}else if(isStaticPointSolid(selectedEdit)){pushHistory();ensurePointEditableSolid(selectedEdit)}else if(isWallRoot(selectedEdit)&&selectedEdit.userData.builderType!=='polyWall'){pushHistory();ensurePointEditableWall(selectedEdit)}if(!mode2d)setMode(true);vertexEditMode=true;if(selectedEdit)transform.attach(selectedEdit);if(btn)btn.classList.add('active')}else{vertexEditMode=false;activeVertexIndex=-1;dragVertex=null;if(btn)btn.classList.remove('active');clearVertexHandles();if(selectedEdit)transform.attach(selectedEdit)}updateVertexHandles();syncDimensionFields();syncConnectPointsUI();const ps=document.getElementById('pointStatus');if(ps&&selectedEdit){const pd=pointDataForRoot(selectedEdit);ps.textContent=vertexEditMode&&pd&&pd.points?('POINTS LIVE · '+pd.points.length+' POINT'+(pd.points.length===1?'':'S')):'SELECT A WALL / SHAPE'}}
function v207SelectedWallRoot(){
  let r=selectedEdit;
  if(!r)return null;
  if(isWallRoot(r))return r;
  let p=r.parent;
  while(p){
    if(isWallRoot(p))return p;
    p=p.parent
  }
  return null
}
function v207AddPointToSelectedWall(){
  let wall=v207SelectedWallRoot();
  if(!wall){flashEditor('Select a wall first');return}
  if(selectedEdit!==wall)selectEdit(wall);

  // Existing conversion logic turns ordinary straight walls into polyWall
  // without duplicating them.
  if(!vertexEditMode)setVertexEdit(true);
  wall=v207SelectedWallRoot()||selectedEdit;
  if(!wall||!isWallRoot(wall)){flashEditor('Wall point mode could not start');return}

  addCorner();
}

function addCorner(){if(!selectedEdit||(!isPlatformRoot(selectedEdit)&&selectedEdit.userData.builderType!=='floorSurface'&&!isWallRoot(selectedEdit)&&!isSolidPolygonRoot(selectedEdit)&&selectedEdit.userData.builderType!=='rampPath'&&!isStaticPointSolid(selectedEdit))){flashEditor('Select a floor, wall, stage or bar first');return}pushHistory();let root=selectedEdit;if(isPlatformRoot(root)||root.userData.builderType==='floorSurface')root=ensureCustomPlatform(root);else if(isStaticPointSolid(root))root=ensurePointEditableSolid(root);else if(isWallRoot(root))root=ensurePointEditableWall(root);const d=pointDataForRoot(root),pts=d.points;let insertAfter=-1;if(root.userData.builderType==='rampPath'&&activeVertexIndex<0)activeVertexIndex=pts.length-1;if(activeVertexIndex>=0&&activeVertexIndex<pts.length){if(d.closed){insertAfter=activeVertexIndex}else if(pts.length>=2){if(activeVertexIndex<pts.length-1)insertAfter=activeVertexIndex;else insertAfter=pts.length-2}}if(insertAfter<0){let bestI=0,bestD=-1,limit=d.closed?pts.length:pts.length-1;for(let i=0;i<limit;i++){const a=pts[i],b=pts[(i+1)%pts.length],dist=(a[0]-b[0])**2+(a[1]-b[1])**2;if(dist>bestD){bestD=dist;bestI=i}}insertAfter=bestI}const a=pts[insertAfter],b=pts[(insertAfter+1)%pts.length]||pts[pts.length-1];let nx=(a[0]+b[0])/2,nz=(a[1]+b[1])/2;if(!d.closed&&activeVertexIndex===pts.length-1){const prev=pts[pts.length-2],last=pts[pts.length-1],dx=last[0]-prev[0],dz=last[1]-prev[1];nx=last[0]+dx*.5;nz=last[1]+dz*.5;insertAfter=pts.length-1}else if(!d.closed&&activeVertexIndex===0&&insertAfter===0){nx=(pts[0][0]+pts[1][0])/2;nz=(pts[0][1]+pts[1][1])/2}pts.splice(insertAfter+1,0,[nx,nz]);activeVertexIndex=insertAfter+1;if(root.userData.builderType==='platform')rebuildPlatform(root);else if(root.userData.builderType==='solidPolygon')rebuildSolidPolygon(root);else if(root.userData.builderType==='rampPath')rebuildRampPath(root);else rebuildPolylineWall(root);setVertexEdit(true);saveLocalEditState(false);const ps=document.getElementById('pointStatus');if(ps)ps.textContent='POINTS LIVE · '+pts.length+' POINT'+(pts.length===1?'':'S');flashEditor((root.userData.builderType==='rampPath'?'Ramp corner':root.userData.builderType==='platform'?'Floor':root.userData.builderType==='solidPolygon'?'Solid':'Wall')+' point added · drag the pink point to reshape')}
function removeCorner(){if(!selectedEdit||(!isPlatformRoot(selectedEdit)&&selectedEdit.userData.builderType!=='floorSurface'&&!isWallRoot(selectedEdit)&&!isSolidPolygonRoot(selectedEdit)&&selectedEdit.userData.builderType!=='rampPath'&&!isStaticPointSolid(selectedEdit))){flashEditor('Select a floor, wall, stage or bar first');return}pushHistory();let root=selectedEdit;if(isPlatformRoot(root)||root.userData.builderType==='floorSurface')root=ensureCustomPlatform(root);else if(isStaticPointSolid(root))root=ensurePointEditableSolid(root);else if(isWallRoot(root))root=ensurePointEditableWall(root);const d=pointDataForRoot(root),pts=d.points,min=d.closed?3:2;if(pts.length<=min){flashEditor(d.closed?'A floor needs at least 3 corners':'A wall needs at least 2 points');history.pop();return}let i=activeVertexIndex>=0?activeVertexIndex:pts.length-1;pts.splice(i,1);activeVertexIndex=Math.min(i,pts.length-1);if(root.userData.builderType==='platform')rebuildPlatform(root);else if(root.userData.builderType==='solidPolygon')rebuildSolidPolygon(root);else if(root.userData.builderType==='rampPath')rebuildRampPath(root);else rebuildPolylineWall(root);updateVertexHandles();saveLocalEditState(false);flashEditor(root.userData.builderType==='rampPath'?'Ramp corner removed':root.userData.builderType==='solidPolygon'?'Solid point removed':(d.closed?'Floor point removed':'Wall point removed'))}
function getVertexHandleHit(e){if(drawMode==='wallTrace'||!vertexEditMode||!vertexHandleGroup.visible)return null;const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);return ray.intersectObjects(vertexHandleGroup.children,false)[0]||null}
function groundPointFromEvent(e){const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?p:null}

/* draw tools */
function clearDrawGuides(){while(drawGuideGroup.children.length){const o=drawGuideGroup.children.pop();if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()}}
function drawGuidePoint(p){const m=new THREE.Mesh(new THREE.SphereGeometry(.10,10,7),new THREE.MeshBasicMaterial({color:0x39d9f9,depthTest:false}));m.position.copy(p);m.renderOrder=120;drawGuideGroup.add(m)}
function traceWorldPoints(){return [];}
function hasPausedWallTrace(){return !!(activeTraceWall&&activeTraceWall.parent&&drawMode!=='wallTrace')}
function selectedResumableWall(){return selectedEdit&&selectedEdit.parent&&selectedEdit.visible!==false&&selectedEdit.userData&&selectedEdit.userData.builderType==='polyWall'&&!selectedEdit.userData.polyWallData.closed?selectedEdit:null}
function syncDrawButtons(){const ids=['createWall','createCurvedWall','createFenceWall','createDoor','createLedStrip','createRamp'];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('draw-active')});const map={wallTrace:'createWall',curvedWall:'createCurvedWall',fenceWall:'createFenceWall',doorFrame:'createDoor',ledStrip:'createLedStrip',ledStripPathTrace:'createLedStrip',rampPathTrace:'createRamp'};const active=document.getElementById(map[drawMode]);if(active&&!(drawMode==='wallTrace'&&roomCloserMode))active.classList.add('draw-active');const roomBtn=document.getElementById('createRoomCloser');if(roomBtn)roomBtn.classList.toggle('draw-active',drawMode==='wallTrace'&&roomCloserMode);const wallBtn=document.getElementById('createWall'),rampBtn=document.getElementById('createRamp'),ledBtn=document.getElementById('createLedStrip'),finishLedBtn=document.getElementById('finishLedStripTrace'),editBtn=document.getElementById('editPoints'),paused=hasPausedWallTrace(),selectedWall=selectedResumableWall();if(ledBtn){ledBtn.textContent=drawMode==='ledStripPathTrace'?'FINISH LED STRIP':'+ CONTINUOUS LED STRIP';ledBtn.classList.toggle('draw-active',drawMode==='ledStripPathTrace')}if(finishLedBtn){finishLedBtn.classList.toggle('active',drawMode==='ledStripPathTrace');finishLedBtn.disabled=drawMode!=='ledStripPathTrace'}if(wallBtn){wallBtn.textContent=drawMode==='wallTrace'?'PAUSE TRACE':selectedWall?'RESUME SELECTED':paused?'RESUME WALL':'+ WALL';if(paused||selectedWall)wallBtn.classList.add('draw-active');wallBtn.title=selectedWall?'Continue tracing from the last point of the selected wall':paused?'Continue the paused wall trace':'Start a new continuous wall trace'}if(rampBtn){rampBtn.textContent=drawMode==='rampPathTrace'?'FINISH RAMP':'+ RAMP PATH';rampBtn.title=drawMode==='rampPathTrace'?'Finish the live ramp at the current last point':'Start a smart ramp path with unlimited route points'}if(editBtn){if(drawMode==='wallTrace'||paused){editBtn.classList.add('active');editBtn.textContent='FINISH TRACE'}else{editBtn.classList.add('active');editBtn.textContent='POINTS LIVE'}}if(typeof syncConnectPointsUI==='function')syncConnectPointsUI()}
function redrawWallTraceGuides(){clearDrawGuides();drawPoints.forEach(drawGuidePoint);if(drawPoints.length>1){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(drawPoints.map(p=>p.clone().setY(.025))),new THREE.LineBasicMaterial({color:0xff2e83,transparent:true,opacity:.9,depthTest:false}));line.renderOrder=121;drawGuideGroup.add(line)}}
function pauseWallTrace(){if(drawMode!=='wallTrace')return;drawMode=null;clearDrawGuides();vertexEditMode=false;activeVertexIndex=-1;dragVertex=null;if(activeTraceWall&&selectedEdit!==activeTraceWall)selectEdit(activeTraceWall);transform.detach();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='TRACE PAUSED · PAN / ZOOM · RESUME WALL';saveLocalEditState(false);flashEditor('Wall trace paused · move anywhere, then click RESUME WALL to continue')}
function resumeWallTrace(){if(!activeTraceWall||!activeTraceWall.parent){activeTraceWall=null;startDraw('wall');return}if(!editMode)setEditMode(true);if(!mode2d)setMode(true);drawMode='wallTrace';vertexEditMode=false;activeVertexIndex=-1;dragVertex=null;clearVertexHandles();drawPoints=traceWorldPoints(activeTraceWall);selectEdit(activeTraceWall);transform.detach();redrawWallTraceGuides();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='WALL TRACE · RESUMED · CLICK NEXT POINT';flashEditor('Wall trace resumed · keep clicking to continue from the last point')}
function redrawLedStripTraceGuides(){clearDrawGuides();drawPoints.forEach(drawGuidePoint);if(drawPoints.length>1){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(drawPoints),new THREE.LineBasicMaterial({color:0x39d9f9,transparent:true,opacity:.95,depthTest:false}));line.renderOrder=122;drawGuideGroup.add(line)}}
function finishLedStripTrace(){if(drawMode!=='ledStripPathTrace'){flashEditor('Start DRAW CONTINUOUS first');return false}if(drawPoints.length<2){drawMode=null;drawPoints=[];clearDrawGuides();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='READY';flashEditor('Continuous LED cancelled · add at least 2 points');return false}pushHistory();const ui=ledStripInputs(),col=(ui.color&&ui.color.value)||'#39d9f9',bright=Math.max(0,Math.min(8,+((ui.brightnessNumber&&ui.brightnessNumber.value)||(ui.brightness&&ui.brightness.value)||3.2))),enabled=ui.enabled?ui.enabled.checked:true,led=createLedStripPathFromWorldPoints(drawPoints,{name:'Continuous LED Strip',color:col,brightness:bright,enabled});drawMode=null;drawPoints=[];clearDrawGuides();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='CONTINUOUS LED · FINISHED';if(led){selectEdit(led);saveLocalEditState(false);flashEditor('Continuous LED strip created · one editable strip across '+getLedStripData(led).points.length+' points')}return !!led}
function raisedPlatformCandidates(){const roots=[...builderObjects,...editorRoots].filter((o,i,a)=>o&&a.indexOf(o)===i&&o.visible!==false);return roots.filter(o=>{const n=String(o.userData&&o.userData.editName||o.name||'').toLowerCase();return n.includes('raised')&&(isPlatformRoot(o)||isSolidPolygonRoot(o)||isStaticPointSolid(o))})}
function topPerimeterWorldPoints(root){if(!root)return[];const data=root.userData&&(root.userData.platformData||root.userData.solidData||root.userData.staticSolidEdit),pts=data&&data.points;if(!Array.isArray(pts)||pts.length<2)return[];root.updateMatrixWorld(true);const top=objectBoundsWorld(root).b.max.y+.018,out=pts.map(p=>{const q=root.localToWorld(new THREE.Vector3(+p[0]||0,0,+p[1]||0));q.y=top;return q});if(out.length>2)out.push(out[0].clone());return out}
function traceRaisedPlatformTop(){let targets=[];if(selectedEdit){const n=String(selectedEdit.userData&&selectedEdit.userData.editName||selectedEdit.name||'').toLowerCase();if(n.includes('raised')&&(isPlatformRoot(selectedEdit)||isSolidPolygonRoot(selectedEdit)||isStaticPointSolid(selectedEdit)))targets=[selectedEdit]}if(!targets.length)targets=raisedPlatformCandidates();if(!targets.length){flashEditor('Select a raised platform first');return}const ui=ledStripInputs(),col=(ui.color&&ui.color.value)||'#39d9f9',bright=Math.max(0,Math.min(8,+((ui.brightnessNumber&&ui.brightnessNumber.value)||(ui.brightness&&ui.brightness.value)||3.2))),enabled=ui.enabled?ui.enabled.checked:true;pushHistory();const made=[];targets.forEach((root,i)=>{const pts=topPerimeterWorldPoints(root);if(pts.length>2){const led=createLedStripPathFromWorldPoints(pts,{name:(targets.length>1?'Raised Platform LED '+(i+1):'Raised Platform Top LED'),color:col,brightness:bright,enabled,closed:true});if(led){led.userData.attachedSurfaceId=root.userData.editId||root.uuid;led.userData.attachedSurfaceName=root.userData.editName||'Raised Platform';made.push(led)}}});if(!made.length){history.pop();flashEditor('Could not read the raised platform top edge');return}selectEdit(made[0]);saveLocalEditState(false);flashEditor('Continuous LED traced around '+made.length+' raised platform top'+(made.length===1?'':'s')+' · '+made.reduce((s,r)=>s+getLedStripData(r).length,0).toFixed(1)+' m total')}

function ledPathHasDuplicateClosure(d){if(!d||!d.closed||!d.points||d.points.length<3)return false;const a=d.points[0],b=d.points[d.points.length-1];return Math.hypot((a[0]-b[0]),(a[1]-b[1]),(a[2]-b[2]))<.001}
function ledPathEffectiveCount(d){return Math.max(0,d.points.length-(ledPathHasDuplicateClosure(d)?1:0))}
function ledPathCornerNeighbours(d,index){const n=ledPathEffectiveCount(d);if(n<3||index<0)return null;let i=index;if(ledPathHasDuplicateClosure(d)&&i===d.points.length-1)i=0;if(i>=n)return null;if(!d.closed&&(i===0||i===n-1))return null;const pi=(i-1+n)%n,ni=(i+1)%n;return {i,prev:d.points[pi],centre:d.points[i],next:d.points[ni],pi,ni,n}}
function ledPathCornerAngle(root,index=activeVertexIndex){if(!isLedStripPathRoot(root))return null;const d=normaliseLedStripPathData(root.userData.ledPathData||{}),q=ledPathCornerNeighbours(d,index);if(!q)return null;const ax=q.prev[0]-q.centre[0],az=q.prev[2]-q.centre[2],bx=q.next[0]-q.centre[0],bz=q.next[2]-q.centre[2],al=Math.hypot(ax,az),bl=Math.hypot(bx,bz);if(al<1e-7||bl<1e-7)return null;return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp((ax*bx+az*bz)/(al*bl),-1,1)))}
function syncLedPathAlignmentUI(){const status=document.getElementById('ledPathAlignmentStatus'),txt=document.getElementById('ledPathAlignmentText'),val=document.getElementById('ledPathAlignmentValue'),edit=document.getElementById('editLedStripPoints'),b90=document.getElementById('ledPointCorner90'),b180=document.getElementById('ledPointStraight180'),flat=document.getElementById('ledFlattenAllPoints'),straight=document.getElementById('ledStraightStartFinish');if(!status)return;const active=isLedStripPathRoot(selectedEdit);if(edit){edit.disabled=!active;edit.classList.toggle('active',active&&vertexEditMode)}if(flat)flat.disabled=!active;if(!active){if(straight)straight.disabled=true;if(b90)b90.disabled=true;if(b180)b180.disabled=true;status.className='level-status na';if(txt)txt.textContent='SELECT A CONTINUOUS LED STRIP';if(val)val.textContent='—';return}const d=normaliseLedStripPathData(selectedEdit.userData.ledPathData||{}),count=ledPathEffectiveCount(d),q=ledPathCornerNeighbours(d,activeVertexIndex),angle=q?ledPathCornerAngle(selectedEdit,activeVertexIndex):null;if(straight)straight.disabled=!!d.closed;if(b90)b90.disabled=!q;if(b180)b180.disabled=!q;status.className='level-status '+(q?'aligned':'na');if(txt)txt.textContent=q?('POINT '+(q.i+1)+' / '+count+' · SELECTED'):('CONTINUOUS STRIP · '+count+' POINTS');if(val)val.textContent=q&&angle!=null?('CORNER '+angle.toFixed(1)+'° · Y '+q.centre[1].toFixed(3)+' m'):('LENGTH '+d.length.toFixed(2)+' m')}
function editSelectedLedPathPoints(){if(!isLedStripPathRoot(selectedEdit)){flashEditor('Select a continuous LED strip first');return}if(!mode2d)setMode(true);setVertexEdit(true);const d=normaliseLedStripPathData(selectedEdit.userData.ledPathData||{}),n=ledPathEffectiveCount(d);if(activeVertexIndex<0||activeVertexIndex>=n)activeVertexIndex=n>2?1:0;updateVertexHandles();syncLedPathAlignmentUI();flashEditor('LED point edit active · click a pink point, then choose 90° CORNER or 180° STRAIGHT')}
function applyLedSelectedCorner(targetAngle){if(!isLedStripPathRoot(selectedEdit)){flashEditor('Select a continuous LED strip first');return false}const d=normaliseLedStripPathData(selectedEdit.userData.ledPathData||{}),q=ledPathCornerNeighbours(d,activeVertexIndex);if(!q){flashEditor('Select an internal LED point first');return false}pushHistory();const p=q.prev,c=q.centre,n=q.next,cy=c[1];if(targetAngle===90){const a=[p[0],cy,n[2]],b=[n[0],cy,p[2]],da=(a[0]-c[0])**2+(a[2]-c[2])**2,db=(b[0]-c[0])**2+(b[2]-c[2])**2;d.points[q.i]=(da<=db?a:b)}else{const vx=n[0]-p[0],vz=n[2]-p[2],den=vx*vx+vz*vz;if(den<1e-8){history.pop();flashEditor('Neighbouring LED points are too close to straighten');return false}let t=((c[0]-p[0])*vx+(c[2]-p[2])*vz)/den;t=Math.max(.04,Math.min(.96,t));d.points[q.i]=[p[0]+vx*t,cy,p[2]+vz*t]}if(ledPathHasDuplicateClosure(d)&&q.i===0)d.points[d.points.length-1]=d.points[0].slice();selectedEdit.userData.ledPathData=d;rebuildLedStripPathObject(selectedEdit);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);syncLedPathAlignmentUI();flashEditor(targetAngle===90?'Selected LED point squared to exactly 90°':'Selected LED point straightened to 180°');return true}
function flattenLedPathToStart(){if(!isLedStripPathRoot(selectedEdit)){flashEditor('Select a continuous LED strip first');return}pushHistory();const d=normaliseLedStripPathData(selectedEdit.userData.ledPathData||{}),y=d.points[0][1];d.points=d.points.map(p=>[p[0],y,p[2]]);if(ledPathHasDuplicateClosure(d))d.points[d.points.length-1]=d.points[0].slice();selectedEdit.userData.ledPathData=d;rebuildLedStripPathObject(selectedEdit);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);syncLedPathAlignmentUI();flashEditor('Every LED point levelled horizontally to the start height')}
function straightenLedPathStartFinish(){if(!isLedStripPathRoot(selectedEdit)){flashEditor('Select a continuous LED strip first');return}pushHistory();const d=normaliseLedStripPathData(selectedEdit.userData.ledPathData||{}),count=ledPathEffectiveCount(d);if(d.closed){history.pop();flashEditor('This LED is a closed loop · use 90° / 180° point tools, or FLAT TO START LEVEL');return}if(count<2){history.pop();return}const a=d.points[0],b=d.points[count-1],dist=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(dist<.01){history.pop();flashEditor('Start and finish are the same point · use 90° / 180° point tools for this closed strip');return}for(let i=1;i<count-1;i++){const t=i/(count-1);d.points[i]=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}selectedEdit.userData.ledPathData=d;rebuildLedStripPathObject(selectedEdit);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);syncLedPathAlignmentUI();flashEditor('LED path straightened from Start to Finish · all intermediate points now sit on the same 180° line')}

function startDraw(mode){if(!editMode)setEditMode(true);if(mode==='wall'){roomCloserMode=false;wallTraceStartSnapped=false;if(drawMode==='wallTrace'){pauseWallTrace();return}const picked=selectedResumableWall();if(picked){activeTraceWall=picked;resumeWallTrace();return}if(hasPausedWallTrace()){resumeWallTrace();return}mode='wallTrace'}else if(mode==='rampPathTrace'&&drawMode==='rampPathTrace'){finishRampTrace(true);return}else if(mode==='stairPathTrace'&&drawMode==='stairPathTrace'){cancelDraw();return}else if(activeTraceWall&&activeTraceWall.parent&&(drawMode==='wallTrace'||hasPausedWallTrace())){finishWallTrace(false)}if(['wallTrace','curvedWall','fenceWall','doorFrame','rampPathTrace','stairPathTrace','ledStripPathTrace'].includes(mode)&&!mode2d)setMode(true);deselectEdit();vertexEditMode=false;activeVertexIndex=-1;clearVertexHandles();activeTraceWall=null;activeTraceRamp=null;drawMode=mode;drawPoints=[];clearDrawGuides();syncDrawButtons();const st=document.getElementById('drawStatus');const labels={wallTrace:'WALL TRACE · CLICK FIRST POINT',curvedWall:'CURVED · START → BEND → END',fenceWall:'FENCE · CLICK START → END',doorFrame:'SIMPLE DOOR · CLICK WALL / FLOOR',ledStrip:'LED · CLICK START → END',ledStripPathTrace:'CONTINUOUS LED · CLICK START · KEEP ADDING CORNERS',rampPathTrace:'SMART RAMP · CLICK START · KEEP ADDING POINTS',stairPathTrace:'STAIRCASE · CLICK START → FINISH'};if(st)st.textContent=labels[mode]||'READY';const hints={wallTrace:'Click around the floor-plan outline. In FAST FRAME MODE, wall ends snap to existing wall lines / points and ORTHO TRACE keeps straight / 90° runs. Touching another wall does NOT finish the trace — use FINISH TRACE when you are actually done.',curvedWall:'Click the start, bend and end of the curved wall',fenceWall:'Click the start and end of the fence wall',doorFrame:'Click on or near a wall: the door snaps to its centreline, aligns to the wall and cuts a clean opening so no wall remains visible through the door. Click away from walls only for a freestanding door.',ledStrip:'Click the start and end of the LED strip',ledStripPathTrace:'Click the first point, then keep clicking every corner or direction change. Press FINISH STRIP when the full run is complete.',rampPathTrace:'Click START, then keep clicking as many bend / route points as you need. The ramp appears after point 2 and stays live. Click FINISH RAMP when the current last point should become the Finish.'};flashEditor(hints[mode]||'Drawing mode enabled')}
function startRoomCloserDraw(){if(!editMode)setEditMode(true);if(!mode2d)setMode(true);if(drawMode==='wallTrace'&&activeTraceWall)finishWallTrace(false);deselectEdit();vertexEditMode=false;activeVertexIndex=-1;clearVertexHandles();activeTraceWall=null;drawMode='wallTrace';drawPoints=[];roomCloserMode=true;wallTraceStartSnapped=false;clearDrawGuides();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='CLOSE GAP · CLICK FIRST EXISTING WALL';flashEditor('CLOSE GAP · click one existing wall, then the other · creates only the missing wall')}
function finishWallTrace(enablePointEdit=false){if(drawMode!=='wallTrace'&&!activeTraceWall)return;const finishedWall=activeTraceWall,hadWall=!!finishedWall,wasRoomCloser=roomCloserMode;drawMode=null;drawPoints=[];activeTraceWall=null;roomCloserMode=false;wallTraceStartSnapped=false;clearDrawGuides();vertexEditMode=false;activeVertexIndex=-1;dragVertex=null;syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='READY';if(hadWall&&finishedWall){selectEdit(finishedWall);if(enablePointEdit){setVertexEdit(true);saveLocalEditState(false);flashEditor('Wall trace finished · drag the pink points to tweak corners');return}}if(selectedEdit)transform.attach(selectedEdit);updateVertexHandles();saveLocalEditState(false);flashEditor(wasRoomCloser?'Gap wall added + snapped · no floor created':(hadWall?'Wall trace finished · no floor created':'Wall trace stopped'))}
function finishRampTrace(enablePointEdit=true){if(drawMode!=='rampPathTrace'&&!activeTraceRamp)return;const ramp=activeTraceRamp,hadRamp=!!(ramp&&ramp.parent);if(!hadRamp&&drawPoints.length<2){drawMode=null;drawPoints=[];activeTraceRamp=null;clearDrawGuides();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='READY';flashEditor('Ramp trace cancelled · place at least Start + one more point');return}drawMode=null;drawPoints=[];activeTraceRamp=null;clearDrawGuides();vertexEditMode=false;activeVertexIndex=-1;dragVertex=null;syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='RAMP FINISHED';if(hadRamp){selectEdit(ramp);const d=normaliseRampPathData(ramp.userData.rampPathData);activeVertexIndex=d.points.length-1;if(enablePointEdit)setVertexEdit(true);snapRampEndToFloorForRoot(ramp,'start',false,.38);snapRampEndToFloorForRoot(ramp,'finish',false,.38);saveLocalEditState(false);syncRampLevelUI();flashEditor('Ramp finished · '+d.points.length+' points · last point is FINISH · select Finish + POINT to extend later')}else flashEditor('Ramp trace stopped')}
function cancelDraw(){if(drawMode==='wallTrace'&&!roomCloserMode){pauseWallTrace();return}if(drawMode==='rampPathTrace'&&activeTraceRamp){finishRampTrace(true);return}drawMode=null;drawPoints=[];activeTraceWall=null;activeTraceRamp=null;roomCloserMode=false;wallTraceStartSnapped=false;if(typeof phasePendingMeta!=='undefined')phasePendingMeta=null;clearDrawGuides();syncDrawButtons();const st=document.getElementById('drawStatus');if(st)st.textContent='READY'}
function surfacePointFromEvent(e){const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(surfaceMeshes(),false)[0];if(hit)return hit.point.clone();return groundPointFromEvent(e)}
function handleDrawClick(e){if(!drawMode)return false;if(drawMode==='doorFrame'){const pending=(typeof phasePendingMeta!=='undefined'&&phasePendingMeta)?{...phasePendingMeta}:null;const hit=getWallSurfaceHit(e);if(hit){const root=surfaceRootForObject(hit.object);if(root&&isWallRoot(root)){const door=insertDoorIntoWall(root,hit.point.clone(),{});if(door&&pending)tagPhaseObject(door,pending.item,pending.category);cancelDraw();return true}}const gp=groundPointFromEvent(e);if(!gp)return true;const near=nearestWallSegmentSnap(gp,null,.55);if(near&&near.root){const door=insertDoorIntoWall(near.root,near.point.clone(),{});if(door&&pending)tagPhaseObject(door,pending.item,pending.category);cancelDraw();return true}pushHistory();const frame=createDoorFrameObject({x:gp.x,y:mainFloorLevel(),z:gp.z,color:'#0b0d10'});if(pending)tagPhaseObject(frame,pending.item,pending.category);cancelDraw();selectEdit(frame);saveLocalEditState(false);flashEditor('Freestanding simple door created · use SNAP TO WALL + CUT when positioned near a wall');return true}let p=(drawMode==='ledStrip'||drawMode==='ledStripPathTrace')?surfacePointFromEvent(e):groundPointFromEvent(e);if(!p)return true;if(drawMode==='ledStripPathTrace'){if(drawPoints.length&&p.distanceTo(drawPoints[drawPoints.length-1])<.035)return true;drawPoints.push(p.clone());redrawLedStripTraceGuides();const st=document.getElementById('drawStatus');if(st)st.textContent=drawPoints.length===1?'CONTINUOUS LED · START SET · CLICK NEXT CORNER':'CONTINUOUS LED · '+drawPoints.length+' POINTS · KEEP CLICKING · FINISH STRIP WHEN DONE';flashEditor(drawPoints.length===1?'LED start set · keep clicking corners':'LED point '+drawPoints.length+' added · keep going');return true}if(drawMode==='stairPathTrace'){if(drawPoints.length&&p.distanceTo(drawPoints[drawPoints.length-1])<.08)return true;drawPoints.push(p.clone());drawGuidePoint(p);const st=document.getElementById('drawStatus');if(drawPoints.length===1){if(st)st.textContent='STAIRCASE · START SET · CLICK FINISH';return true}if(drawPoints.length===2){pushHistory();const pending=(typeof phasePendingMeta!=='undefined'&&phasePendingMeta)?{...phasePendingMeta}:null,anchor=drawPoints[0],end=drawPoints[1],o=createCustomStairObject({points:[[0,0],[end.x-anchor.x,end.z-anchor.z]],x:anchor.x,y:mainFloorLevel(),z:anchor.z,name:pending?.name||'Point-to-point Staircase'});if(pending)tagPhaseObject(o,pending.item,pending.category);cancelDraw();selectEdit(o);setVertexEdit(true);activeVertexIndex=1;saveLocalEditState(false);syncCustomStairUI();flashEditor('Staircase created · drag START / FINISH points or choose a spiral mode');return true}return true}if(drawMode==='rampPathTrace'){if(drawPoints.length)p=orthogonalTracePoint(p);if(drawPoints.length&&p.distanceTo(drawPoints[drawPoints.length-1])<.04)return true;drawPoints.push(p.clone());drawGuidePoint(p);const st=document.getElementById('drawStatus');if(drawPoints.length===1){if(st)st.textContent='SMART RAMP · START SET · CLICK NEXT POINT';flashEditor('Ramp Start set · keep clicking route points');return true}if(drawPoints.length===2){pushHistory();const anchor=drawPoints[0],pts=drawPoints.map(q=>[q.x-anchor.x,q.z-anchor.z]);activeTraceRamp=createRampPathObject({points:pts,x:anchor.x,y:mainFloorLevel(),z:anchor.z,width:1.20,startLevel:.45,finishLevel:0,thickness:.08,name:'Smart Level Ramp'});selectEdit(activeTraceRamp);transform.detach();saveLocalEditState(false);if(st)st.textContent='RAMP LIVE · 2 POINTS · KEEP CLICKING · FINISH RAMP WHEN DONE';flashEditor('Ramp live · keep clicking corners / route points · FINISH RAMP when done');return true}if(activeTraceRamp&&activeTraceRamp.userData?.rampPathData){const local=activeTraceRamp.worldToLocal(p.clone()),d=normaliseRampPathData(activeTraceRamp.userData.rampPathData);d.points.push([local.x,local.z]);d.finishSnapName='';rebuildRampPath(activeTraceRamp);activeTraceRamp.updateMatrixWorld(true);updateSelectionBox();saveLocalEditState(false);if(st)st.textContent='RAMP LIVE · '+d.points.length+' POINTS · KEEP CLICKING · FINISH RAMP WHEN DONE';flashEditor('Ramp point '+d.points.length+' added · current last point is provisional Finish');return true}return true}if(drawMode==='wallTrace'){let snapInfo=snapTraceOrDragPointToFrame(activeTraceWall,p,FAST_FRAME_SNAP_TOL);if(!snapInfo&&fastFrameMode===false)snapInfo=nearestWallSegmentSnap(p,activeTraceWall,ROOM_DRAW_SNAP_TOL);if(roomCloserMode&&!snapInfo){flashEditor(drawPoints.length?'CLOSE GAP · second click must be on / near an existing wall':'CLOSE GAP · click directly on / near the first existing wall');return true}if(snapInfo)p=snapInfo.point.clone();else p=orthogonalTracePoint(p);if(drawPoints.length&&p.distanceTo(drawPoints[drawPoints.length-1])<.04)return true;drawPoints.push(p.clone());redrawWallTraceGuides();syncConnectPointsUI();const st=document.getElementById('drawStatus');if(drawPoints.length===1){wallTraceStartSnapped=!!snapInfo;if(st)st.textContent=roomCloserMode?'CLOSE GAP · NOW CLICK THE OTHER WALL':'WALL TRACE · CLICK NEXT POINT';flashEditor(roomCloserMode?'First wall snapped · click the wall across the opening':'Wall start set · keep clicking · snapping does not end the trace');return true}if(drawPoints.length===2){pushHistory();activeTraceWall=createPolylineWallFromWorldPoints(drawPoints,{width:.18,height:2.58,name:roomCloserMode?'Gap Closing Wall':'Traced Wall'});selectEdit(activeTraceWall);transform.detach();saveLocalEditState(false);if(roomCloserMode){if(st)st.textContent='CLOSE GAP · DONE';finishWallTrace(false);return true}if(st)st.textContent='WALL TRACE · KEEP CLICKING · PAUSE = STOP / RESUME LATER';flashEditor('Wall started · keep clicking to extend it, or pause and resume later');return true}if(activeTraceWall&&activeTraceWall.userData.polyWallData){const local=activeTraceWall.worldToLocal(p.clone());activeTraceWall.userData.polyWallData.points.push([local.x,local.z]);rebuildPolylineWall(activeTraceWall);activeTraceWall.updateMatrixWorld(true);updateSelectionBox();syncConnectPointsUI();saveLocalEditState(false);if(st)st.textContent='WALL TRACE · KEEP CLICKING · PAUSE = STOP / RESUME LATER'}return true}drawPoints.push(p.clone());drawGuidePoint(p);const st=document.getElementById('drawStatus');if(drawPoints.length===1){if(st)st.textContent=(drawMode==='curvedWall'?'CURVED · NOW CLICK BEND':'CLICK NEXT POINT');return true}if(drawMode==='curvedWall'&&drawPoints.length===2){if(st)st.textContent='CURVED · NOW CLICK END';return true}if(drawMode==='fenceWall'&&drawPoints.length===2){pushHistory();const g=createPolylineWallFromWorldPoints([drawPoints[0],drawPoints[1]],{width:.16,height:2.1,color:'#050607',name:'Fence Wall',style:'fence',slatGap:.10,slatWidth:.04});cancelDraw();selectEdit(g);saveLocalEditState(false);flashEditor('Fence wall created')}else if(drawMode==='curvedWall'&&drawPoints.length===3){pushHistory();const w=createCurvedWallFromPoints(drawPoints[0],drawPoints[1],drawPoints[2],{width:.18,height:2.58});cancelDraw();selectEdit(w);saveLocalEditState(false);flashEditor('Curved wall created')}else if(drawMode==='ledStrip'&&drawPoints.length===2){pushHistory();const ui=ledStripInputs(),col=(ui.color&&ui.color.value)||'#39d9f9',bright=Math.max(0,Math.min(8,+((ui.brightnessNumber&&ui.brightnessNumber.value)||(ui.brightness&&ui.brightness.value)||3.2)));const led=createLedStripFromPoints(drawPoints[0],drawPoints[1],{color:col,brightness:bright});cancelDraw();selectEdit(led);applyLedStripAppearance(led,col,bright);saveLocalEditState(false);flashEditor('Straight interactive LED strip created on the selected surface')}return true}

function surfaceRootForObject(obj){let o=obj;while(o&&o.parent&&!editorRoots.includes(o)&&![exteriorFloor,smokeFloor].includes(o))o=o.parent;return o}
function surfaceMeshes(){const structural=builderObjects.filter(o=>!['ledStrip','ledStripPath','refPin','furniture','artwork','plantAsset','sunsetLamp','barAsset','fixtureAsset','barLeaner'].includes(o.userData.builderType));const roots=rootsUnique([...staticEditorRoots,...structural,exteriorFloor,smokeFloor]).filter(o=>o&&o.visible!==false&&o!==selectedEdit&&!(editMode&&roomFloorEditView==='hidden'&&isRoomFloorRoot(o)));const meshes=[];roots.forEach(root=>root.traverse(o=>{if(o.isMesh&&o.visible!==false&&(!selectedEdit||!selectedEdit.getObjectById(o.id)))meshes.push(o)}));return meshes}
function wallSurfaceMeshes(){const roots=editorRoots.filter(o=>o&&o.visible!==false&&isWallRoot(o));const meshes=[];roots.forEach(root=>root.traverse(o=>{if(o.isMesh&&o.visible!==false)meshes.push(o)}));return meshes}
function getWallSurfaceHit(e){const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(wallSurfaceMeshes(),false);if(!hits.length)return null;const hit=hits[0],root=surfaceRootForObject(hit.object);return root&&isWallRoot(root)?hit:null}
function syncSurfaceAttachUI(msg=null,kind=''){const status=document.getElementById('attachStatus'),btn=document.getElementById('autoSurfaceSnap');if(status){status.textContent=msg||(attachPickMode?'CLICK A SURFACE':autoSurfaceSnapEnabled?'AUTO LEVEL SNAP':'LEVEL SNAP OFF');status.classList.toggle('picking',attachPickMode||kind==='picking');status.classList.toggle('snapped',kind==='snapped')}if(btn){btn.classList.toggle('active',autoSurfaceSnapEnabled);btn.textContent=autoSurfaceSnapEnabled?'AUTO SNAP':'AUTO OFF'}}
function cancelAttachPick(){attachPickMode=false;syncSurfaceAttachUI()}
function beginAttachPick(){if(!isAttachableDetail(selectedEdit)){flashEditor('Select an added detail or upper-bar detail first');return}attachPickMode=true;transform.detach();const wallOnly=isWallOnlyAttachRoot(selectedEdit);syncSurfaceAttachUI(wallOnly?'CLICK A WALL':'CLICK WALL / FLOOR','picking');flashEditor(wallOnly?'Click the wall where you want this attached':'Click the surface you want this attached to')}
function getSurfaceHit(e){const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(surfaceMeshes(),false);return hits.find(h=>{const r=surfaceRootForObject(h.object),wallOnly=isWallOnlyAttachRoot(selectedEdit);return r&&r!==selectedEdit&&(!wallOnly||isWallRoot(r))})||null}
function objectBoundsWorld(root){const b=new THREE.Box3().setFromObject(root),c=new THREE.Vector3(),s=new THREE.Vector3();b.getCenter(c);b.getSize(s);return {b,c,s}}
function attachSelectedToHit(hit,announce=true){if(!selectedEdit||!hit)return false;const root=surfaceRootForObject(hit.object);if(!root||root===selectedEdit)return false;if(isWallOnlyAttachRoot(selectedEdit)&&!isWallRoot(root)){if(announce)flashEditor('This item can only attach to walls');return false}pushHistory();const n=hit.face?hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize():new THREE.Vector3(0,1,0);const horizontal=Math.abs(n.y)>.65;if(horizontal){selectedEdit.position.x=hit.point.x;selectedEdit.position.z=hit.point.z;selectedEdit.updateMatrixWorld(true);let info=objectBoundsWorld(selectedEdit);selectedEdit.position.y+=hit.point.y+(n.y>=0?.012:-.012)-(n.y>=0?info.b.min.y:info.b.max.y)}else{const flat=new THREE.Vector3(n.x,0,n.z).normalize();selectedEdit.rotation.y=Math.atan2(flat.x,flat.z);selectedEdit.updateMatrixWorld(true);let info=objectBoundsWorld(selectedEdit),offset=Math.max(.018,Math.min(info.s.x,info.s.z)/2+.012);selectedEdit.position.x=hit.point.x+flat.x*offset;selectedEdit.position.z=hit.point.z+flat.z*offset;selectedEdit.updateMatrixWorld(true);info=objectBoundsWorld(selectedEdit);selectedEdit.position.y+=hit.point.y-info.c.y}
  selectedEdit.userData.attachedSurfaceId=root.userData.editId||root.uuid;selectedEdit.userData.attachedSurfaceName=root.userData.editName||'Surface';selectedEdit.updateMatrixWorld(true);attachPickMode=false;transform.attach(selectedEdit);updateSelectionBox();updateEditorSelected();saveLocalEditState(false);syncSurfaceAttachUI('SNAPPED · '+(root.userData.editName||'SURFACE'),'snapped');if(announce)flashEditor('Attached to '+(root.userData.editName||'surface'));return true}
function nearestSurfaceHit(maxDist=.48){if(!isAttachableDetail(selectedEdit))return null;const c=objectBoundsWorld(selectedEdit).c,dirs=[new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0)];for(let i=0;i<16;i++){const a=i*Math.PI*2/16;dirs.push(new THREE.Vector3(Math.sin(a),0,Math.cos(a)))}let best=null;const meshes=surfaceMeshes();dirs.forEach(d=>{ray.set(c,d.normalize());const h=ray.intersectObjects(meshes,false).find(x=>{const r=surfaceRootForObject(x.object);const wallOnly=isWallOnlyAttachRoot(selectedEdit);return r&&r!==selectedEdit&&(!wallOnly||isWallRoot(r))});if(h&&h.distance<=maxDist&&(!best||h.distance<best.distance))best=h});return best}
function autoSnapSelectedToSurface(){if(!autoSurfaceSnapEnabled||!isAttachableDetail(selectedEdit))return false;const h=nearestSurfaceHit(.50);return h?attachSelectedToHit(h,false):false}
function offerSurfaceAttach(root){selectEdit(root);setTimeout(()=>{if(root===selectedEdit&&window.confirm('Attach this new detail to a wall, floor, bar or platform surface now?'))beginAttachPick()},0)}
function syncBuilderAfterTransform(){if(window.__mshipStageFastEdit&&typeof window.__mshipStageFastObjectSelected==='function'&&window.__mshipStageFastObjectSelected()){if(activeGroupId&&groupPivot)groupPivot.updateMatrixWorld(true);else if(selectedEdit)selectedEdit.updateMatrixWorld(true);if(projectReady)setProjectDirty(true);if(typeof window.__mshipScheduleStageAutosave==='function')window.__mshipScheduleStageAutosave();return}if(activeGroupId&&groupPivot){groupPivot.updateMatrixWorld(true);updateSelectionBox();updateEditorSelected();saveLocalEditState(false);return}if(!isEditableRoot(selectedEdit))return;if(isBarLeanerRoot(selectedEdit)&&editModeName==='scale')bakeBarLeanerScale(selectedEdit);if(selectedEdit&&selectedEdit.userData&&selectedEdit.userData.builderType==='rampPath'){if(editModeName==='scale')bakeRampPathScale(selectedEdit);if(editModeName==='rotate'){selectedEdit.rotation.x=0;selectedEdit.rotation.z=0;selectedEdit.updateMatrixWorld(true);rebuildRampPath(selectedEdit)}}if(isArtworkPanelRoot(selectedEdit))syncArtworkTextureCrop(selectedEdit);if(mode2d&&autoMainFloorLock&&isLevelSensitiveRoot(selectedEdit)&&rootAllowsAutoFloorLock(selectedEdit))alignRootToMainFloor(selectedEdit,false);if(isFloorSnappedRestroomFixture(selectedEdit)){normalizeFreestandingToilet(selectedEdit);const td=selectedEdit.userData.assetData;if(editModeName==='translate'&&td.autoFloorSnap)snapToiletToFloor(selectedEdit,false,.70)}if(isSinkPairRoot(selectedEdit)&&editModeName==='translate'){const sd=normaliseSinkPairData(selectedEdit.userData.assetData);if(sd.autoSurfaceSnap)snapSinkToSurface(selectedEdit,false)}if(isCeilingDetailRoot(selectedEdit)||(selectedEdit.userData&&selectedEdit.userData.builderType==='fixtureAsset'&&isCeilingMountedFixtureKind(selectedEdit.userData.assetData&&selectedEdit.userData.assetData.kind)))snapRootToCeiling(selectedEdit,false);if(isLightingRigLayerRoot(selectedEdit))scheduleCeilingRigGuideRebuild();if(isStraightWallRoot(selectedEdit)&&editModeName==='translate')showWallAlignmentOffer();else{clearWallAlignmentSuggestion();if(isAttachableDetail(selectedEdit))autoSnapSelectedToSurface()}updateSelectionBox();updateEditorSelected();saveLocalEditState(false)}


/* detailed upper-bar reconstruction — permanently visible, grouped for detail editing */
function clearBarDetailRoots(){if(selectedEdit&&barDetailRoots.includes(selectedEdit))deselectEdit();barDetailRoots.forEach(o=>{editorRoots=editorRoots.filter(r=>r!==o);if(o.parent)o.parent.remove(o);disposeObject3D(o)});barDetailRoots=[];while(builtBarLayer.children.length){const o=builtBarLayer.children.pop();disposeObject3D(o)}}
function registerBarDetailRoot(root,name,id){root.userData.barDetail=true;root.userData.lockedBase=false;root.userData.builderType='barDetail';root.userData.editId=id;root.userData.editName=name;builtBarLayer.add(root);barDetailRoots.push(root);if(!editorRoots.includes(root))editorRoots.push(root);return root}
function captureBarDetailState(){const s={};barDetailRoots.forEach(o=>s[o.userData.editId]={...transformState(o),c:o.userData.colorOverride||null,g:o.userData.groupId||''});return s}
function applyBarDetailState(state){if(!state)return;barDetailRoots.forEach(o=>{const d=state[o.userData.editId];if(d){applyTransformState(o,d);o.userData.groupId=d.g||'';noteGroupId(o.userData.groupId);if(d.c)setObjectColour(o,d.c)}})}
function buildUpperBarFromSavedMarkers(savedState=null){
  clearBarDetailRoots();
  const shelfMarkers=builderObjects.filter(o=>o.userData.builderType==='shelfArt'&&o.userData.lockedBase).sort((a,b)=>a.position.x-b.position.x);
  const pin=builderObjects.find(o=>o.userData.builderType==='refPin'&&o.userData.lockedBase);
  if(!shelfMarkers.length){
    const b=new THREE.Box3().setFromObject(upperBar),c=new THREE.Vector3(),sz=new THREE.Vector3();b.getCenter(c);b.getSize(sz);
    const muralG=registerBarDetailRoot(new THREE.Group(),'Back Bar Mural','bar_detail_mural');muralG.position.set(c.x,1.55,b.min.z-.055);const mural=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(4.8,sz.x),1.92),new THREE.MeshBasicMaterial({map:galaxyTexture(),toneMapped:false}));muralG.add(mural);
    const circleG=registerBarDetailRoot(new THREE.Group(),'Circular Mirror + Logo','bar_detail_circle');circleG.position.set(c.x-.8,1.68,b.min.z+.01);const halo=new THREE.PointLight(0xff315f,.62,2.5,2);halo.userData.barLight=true;halo.position.set(0,0,.22);circleG.add(halo);const ringBack=new THREE.Mesh(new THREE.TorusGeometry(.53,.075,18,54),new THREE.MeshStandardMaterial({color:0x160d12,emissive:0xff315f,emissiveIntensity:.48,metalness:.52,roughness:.34}));ringBack.position.z=.07;circleG.add(ringBack);const ring=new THREE.Mesh(new THREE.TorusGeometry(.46,.035,16,54),new THREE.MeshStandardMaterial({color:0x2b2e35,metalness:.82,roughness:.22}));ring.position.z=.10;circleG.add(ring);const mirror=new THREE.Mesh(new THREE.CircleGeometry(.425,56),new THREE.MeshStandardMaterial({color:0x05070a,metalness:.78,roughness:.12,emissive:0x120018,emissiveIntensity:.16}));mirror.position.z=.095;circleG.add(mirror);const logo=new THREE.Mesh(new THREE.PlaneGeometry(.67,.18),new THREE.MeshBasicMaterial({map:textTexture('MOTHERSHIP','#ff315f',700,180),transparent:true,toneMapped:false}));logo.position.z=.14;circleG.add(logo);builtBarLayer.visible=true;applyBarDetailState(savedState);return}
  const z=shelfMarkers.reduce((n,o)=>n+o.position.z,0)/shelfMarkers.length+.13;
  const shelfMat=new THREE.MeshStandardMaterial({color:0x090b0f,roughness:.48,metalness:.42});
  const magenta=new THREE.MeshStandardMaterial({color:0xff2e83,emissive:0xff2e83,emissiveIntensity:2.35,roughness:.24});
  const purple=new THREE.MeshStandardMaterial({color:0x7b38ff,emissive:0x7b38ff,emissiveIntensity:2.0,roughness:.24});
  const blue=new THREE.MeshStandardMaterial({color:0x39d9f9,emissive:0x39d9f9,emissiveIntensity:1.6,roughness:.22});
  const glassColors=[0xeaf1ff,0xffc4d3,0xff7b93,0xaed7ff,0xffd98a,0xd7c3ff,0x8fc4ff];
  function localBox(parent,w,h,d,x,y,zz,mat){return box(w,h,d,x,y,zz,mat,parent)}
  function shelf(parent,x,y,w,glow='pink'){localBox(parent,w,.045,.18,x,y,0,shelfMat);localBox(parent,w*.96,.015,.055,x,y-.048,.095,glow==='blue'?blue:glow==='purple'?purple:magenta)}
  function bottle(parent,x,y,h=.27,col=0xeaf1ff){const gm=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.13,transparent:true,opacity:.94,roughness:.16,metalness:.04});const body=new THREE.Mesh(new THREE.CylinderGeometry(.045,.052,h,10),gm);body.position.set(x,y+h/2,.13);parent.add(body);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.023,.028,h*.22,9),gm);neck.position.set(x,y+h+h*.1,.13);parent.add(neck);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.025,9),new THREE.MeshStandardMaterial({color:0xe7e9ef,roughness:.42,metalness:.25}));cap.position.set(x,y+h+h*.22,.13);parent.add(cap)}
  function bottleRow(parent,cx,y,w,count,offset=0){for(let i=0;i<count;i++){const t=count===1?.5:i/(count-1),x=cx-w/2+t*w;const h=.21+((i+offset)%4)*.035;bottle(parent,x,y,h,glassColors[(i+offset)%glassColors.length])}}
  const minX=Math.min(...shelfMarkers.map(o=>o.position.x-1.65*Math.abs(o.scale.x)))-.45;
  const maxX=Math.max(...shelfMarkers.map(o=>o.position.x+1.65*Math.abs(o.scale.x)))+.45;
  const wallW=Math.max(4.8,maxX-minX),wallCx=(minX+maxX)/2;
  const muralG=registerBarDetailRoot(new THREE.Group(),'Back Bar Mural','bar_detail_mural');muralG.position.set(wallCx,1.55,z-.035);const mural=new THREE.Mesh(new THREE.PlaneGeometry(wallW,1.92),new THREE.MeshBasicMaterial({map:galaxyTexture(),toneMapped:false}));muralG.add(mural);
  const left=shelfMarkers[0],leftW=Math.max(.95,2.15*Math.abs(left.scale.x)),leftCx=left.position.x;
  const leftG=registerBarDetailRoot(new THREE.Group(),'Left Back-Bar Shelves','bar_detail_left_shelves');leftG.position.set(leftCx,0,z);[1.18,1.57,1.96].forEach((yy,i)=>{shelf(leftG,0,yy,leftW,i===1?'purple':'pink');bottleRow(leftG,0,yy+.055,leftW*.86,7,i*2)});
  const circleX=pin?pin.position.x:(leftCx+1.55),circleY=pin?(pin.position.y+.60*Math.abs(pin.scale.y||1)):1.68;
  const circleG=registerBarDetailRoot(new THREE.Group(),'Circular Mirror + Logo','bar_detail_circle');circleG.position.set(circleX,circleY,z);const halo=new THREE.PointLight(0xff315f,.62,2.5,2);halo.userData.barLight=true;halo.position.set(0,0,.22);circleG.add(halo);const ringBack=new THREE.Mesh(new THREE.TorusGeometry(.53,.075,18,54),new THREE.MeshStandardMaterial({color:0x160d12,emissive:0xff315f,emissiveIntensity:.48,metalness:.52,roughness:.34}));ringBack.position.z=.07;circleG.add(ringBack);const ring=new THREE.Mesh(new THREE.TorusGeometry(.46,.035,16,54),new THREE.MeshStandardMaterial({color:0x2b2e35,metalness:.82,roughness:.22}));ring.position.z=.10;circleG.add(ring);const mirror=new THREE.Mesh(new THREE.CircleGeometry(.425,56),new THREE.MeshStandardMaterial({color:0x05070a,metalness:.78,roughness:.12,emissive:0x120018,emissiveIntensity:.16}));mirror.position.z=.095;circleG.add(mirror);const logo=new THREE.Mesh(new THREE.PlaneGeometry(.67,.18),new THREE.MeshBasicMaterial({map:textTexture('MOTHERSHIP','#ff315f',700,180),transparent:true,toneMapped:false}));logo.position.z=.14;circleG.add(logo);
  const rights=shelfMarkers.filter(o=>o.position.x>circleX+.35).sort((a,b)=>a.position.x-b.position.x),broad=rights[0]||shelfMarkers[1],upper=rights[1]||shelfMarkers[2],far=rights[2]||shelfMarkers[3];
  if(broad){const g=registerBarDetailRoot(new THREE.Group(),'Centre Back-Bar Shelves','bar_detail_centre_shelves');g.position.set(broad.position.x,0,z);const w=Math.max(1.4,2.9*Math.abs(broad.scale.x));[[1.18,w*.9],[1.55,w],[1.91,w*.88]].forEach((v,i)=>{shelf(g,0,v[0],v[1],i===1?'purple':'pink');bottleRow(g,0,v[0]+.055,v[1]*.88,Math.max(6,Math.round(v[1]/.16)),5+i)})}
  if(upper){const g=registerBarDetailRoot(new THREE.Group(),'Upper Accent Shelf','bar_detail_upper_shelf');g.position.set(upper.position.x,0,z);const w=Math.max(.62,2.9*Math.abs(upper.scale.x));shelf(g,0,2.16,w,'purple');bottleRow(g,0,2.215,w*.78,4,2);const orb=new THREE.Mesh(new THREE.SphereGeometry(.10,18,14),new THREE.MeshStandardMaterial({color:0xffb34e,emissive:0xff7b2e,emissiveIntensity:2.25,roughness:.35}));orb.position.set(0,2.31,.14);g.add(orb)}
  if(far){const g=registerBarDetailRoot(new THREE.Group(),'Right Back-Bar Shelves','bar_detail_right_shelves');g.position.set(far.position.x,0,z);const w=Math.max(.8,2.9*Math.abs(far.scale.x));[[1.39,w],[1.78,w*.92],[2.02,w*.86]].forEach((v,i)=>{shelf(g,0,v[0],v[1],i===2?'purple':'pink');bottleRow(g,0,v[0]+.055,v[1]*.84,Math.max(5,Math.round(v[1]/.15)),11+i)})}
  const glowG=registerBarDetailRoot(new THREE.Group(),'Back-Bar Worktop Glow','bar_detail_worktop_glow');glowG.position.set(wallCx,.78,z+.08);localBox(glowG,Math.max(4.5,wallW-.35),.025,.07,0,0,0,blue);
  const lightsG=registerBarDetailRoot(new THREE.Group(),'Back-Bar Downlights','bar_detail_downlights');lightsG.position.set(0,0,z);[leftCx-.45,(far?far.position.x:wallCx+1.8)].forEach(x=>{const l=new THREE.PointLight(0xff315f,.48,3.3,2);l.userData.barLight=true;l.position.set(x,2.55,.8);lightsG.add(l);const lens=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.035,16),magenta);lens.rotation.x=Math.PI/2;lens.position.set(x,2.48,.05);lightsG.add(lens)});

  // Lower Bar — rebuilt from the supplied venue photos / in-pack prompts.
  // Two floating shelves only, six individual bottles per row. No generic back-bar panel or extra shelf dressing.
  const lowerShelfG=registerBarDetailRoot(new THREE.Group(),'Lower Bar Shelves','bar_detail_lower_shelves');
  lowerShelfG.position.set(-3.10,0,6.47);
  lowerShelfG.rotation.y=Math.PI; // face the shelves / bottles back toward the dancefloor
  const lowerShelfMat=new THREE.MeshStandardMaterial({color:0x080a0e,roughness:.48,metalness:.38});
  function lowerShelfRow(y,w,offset=0){
    localBox(lowerShelfG,w,.055,.20,0,y,0,lowerShelfMat);
    bottleRow(lowerShelfG,0,y+.060,w*.82,6,offset);
  }
  lowerShelfRow(1.43,1.82,1);
  lowerShelfRow(1.93,1.94,4);

  shelfMarkers.forEach(o=>o.visible=false);if(pin)pin.visible=false;builtBarLayer.visible=true;applyBarDetailState(savedState)
}

buildEditorRoots();initialEditState=document.body.classList.contains('published-promoter-only')?null:captureEditState();if(BOOT_PROJECT_STATE){applyProjectState(BOOT_PROJECT_STATE)}else{if(BOOT_EDIT_STATE)applyEditState(BOOT_EDIT_STATE);else loadLocalEditState();if(BOOT_BUILDER_STATE)applyBuilderState(BOOT_BUILDER_STATE);else loadLocalBuilderState();lockCurrentLayout();loadLocalReferenceState();loadLocalSurfaceState();loadLocalCameraFrameState();loadLocalPerformancePageState();loadLocalPageInlineEditState();loadLocalPageInlineStyleState();loadLocalPageSpacingState();loadLocalPageFrameState();loadLocalPageTabState();loadLocalPageHiddenSectionState();loadLocalPageModularLayoutState();loadLocalHotspotZoneState();loadLocalObjectPopupState();if(BOOT_UI_STATE&&BOOT_UI_STATE.theme)setViewTheme(BOOT_UI_STATE.theme,false);else if(!BOOT_BUILDER_STATE)setViewTheme(DEFAULT_THEME,false);applyLayerState((BOOT_UI_STATE&&BOOT_UI_STATE.layers)||(BOOT_BUILDER_STATE&&BOOT_BUILDER_STATE.appearance&&BOOT_BUILDER_STATE.appearance.layers)||DEFAULT_LAYER_STATE);let localBar=null;try{localBar=JSON.parse(localStorage.getItem('mothershipFloorplanBarDetailsV1')||'null')}catch(e){}buildUpperBarFromSavedMarkers(localBar)}applyRoomLightOcclusionSystem();
if(document.body.classList.contains('published-promoter-only')){
  // Published build: no editor managers or builder panels.
  syncCameraFrameUI();
}else{
  syncSnapUI();syncAdvancedFields();syncReferencePanel();syncLayoutLockUI();syncSurfaceAttachUI();
  applyRoomFloorEditDisplay();syncRoomFloorViewUI();renderPhaseBuilder();syncPhaseLayerLockUI();
  syncHistoryButtons();syncGroupUI();initCameraFrameManager();syncCameraFrameUI();initPerformancePageBuilder();
}
projectReady=true;setProjectDirty(false);if(!document.body.classList.contains('published-promoter-only'))window.addEventListener('beforeunload',e=>{if(projectDirty){e.preventDefault();e.returnValue=''}});
transform.addEventListener('mouseDown',()=>{clearWallAlignmentSuggestion();if((activeGroupId&&groupPivot)||isEditableRoot(selectedEdit))pushHistory()});
transform.addEventListener('objectChange',()=>{if(window.__mshipStageFastEdit){const now=(window.performance&&performance.now)?performance.now():Date.now();renderDirty=true;renderBoostUntil=Math.max(renderBoostUntil,now+70);clearTimeout(window.__mshipStageFastAutosaveTimer);if(now-(window.__mshipStageFastLastUi||0)>90){window.__mshipStageFastLastUi=now;if(selectionBox.visible)updateSelectionBox()}return}if(selectedEdit===traceGroup)syncTraceSizeInputs();updateEditorSelected();updateSelectionBox();updateVertexHandles();syncLevelUI();markRenderDirty(420)});
transform.addEventListener('mouseUp',()=>{syncBuilderAfterTransform();if(window.__mshipStageFastEdit){try{updateSelectionBox();updateEditorSelected();syncLevelUI();if(typeof syncV180StageGroupUI==='function')syncV180StageGroupUI();markRenderDirty(90)}catch(e){}}});
transform.addEventListener('dragging-changed',e=>{if(e.value)drag=false});

/* V1130 · Canvas object picking in 3D Edit mode
   The existing raycaster and selection system are reused.  A click on
   the canvas selects the editable object under the cursor; a click on
   empty space deselects.  Shift-click toggles multi-selection for
   grouping.  A subtle BoxHelper outline appears on hover. */
let _hoverOutline=null;
function clearHoverOutline(){
  if(_hoverOutline){_hoverOutline.parent?.remove(_hoverOutline);disposeObject3D?.(_hoverOutline)||(_hoverOutline.geometry?.dispose?.(),_hoverOutline.material?.dispose?.());_hoverOutline=null}
}
function setHoverOutline(obj){
  if(obj===(_hoverOutline?._object))return;
  clearHoverOutline();
  if(!obj)return;
  const h=new THREE.BoxHelper(obj,0x39d9f9);
  h.material.depthTest=false;h.material.transparent=true;h.material.opacity=.55;h.renderOrder=9997;
  h._object=obj;scene.add(h);_hoverOutline=h;
}
function editableHoverHit(e){
  if(!editMode||drawMode||attachPickMode||hotspotDrawMode||venueMeasureMode)return null;
  return getEditableHit(e);
}
renderer.domElement.addEventListener('pointermove',e=>{
  if(!editMode||drawMode||attachPickMode||hotspotDrawMode||venueMeasureMode||drag){clearHoverOutline();return}
  const hit=editableHoverHit(e);
  setHoverOutline(hit);
});
renderer.domElement.addEventListener('click',e=>{
  if(!editMode)return;
  if(suppressNextCanvasClick){suppressNextCanvasClick=false;return}
  if(drawMode||attachPickMode||hotspotDrawMode||venueMeasureMode)return;
  if(navMoved)return;
  if(e.button!==0&&e.button!==undefined)return;
  const hit=getEditableHit(e);
  if(!hit){deselectEdit();return}
  if(e.shiftKey||e.metaKey||e.ctrlKey){toggleMultiSelection(hit);return}
  selectEdit(hit);
},{capture:false});

__pubEl('wallAlignPerp').onclick=()=>alignSuggestedWall('perp');__pubEl('wallAlignParallel').onclick=()=>alignSuggestedWall('parallel');__pubEl('wallAlignKeep').onclick=keepWallSkew;__pubEl('btnEdit').onclick=()=>setEditMode(!editMode);__pubEl('toggleLayoutLock').onclick=()=>setLayoutLocked(!layoutLocked);__pubEl('fitAfterUnlock').onclick=fitVenueView;
__pubEl('phaseLockNext').onclick=()=>togglePhaseLock(currentBuildPhase,!phaseLocks[currentBuildPhase]);__pubEl('phaseSolo').onclick=soloCurrentPhase;__pubEl('phaseAssignSelected').onclick=assignSelectedToCurrentPhase;document.querySelectorAll('[data-phase-layer]').forEach(el=>el.onchange=()=>setPhaseVisibility(+el.dataset.phaseLayer,el.checked));
__pubEl('editMove').onclick=()=>setEditTool('translate');__pubEl('editScale').onclick=()=>setEditTool('scale');__pubEl('editRotate').onclick=()=>setEditTool('rotate');
__pubEl('groupSelected').onclick=groupSelectedObjects;__pubEl('ungroupSelected').onclick=ungroupSelectedObjects;__pubEl('clearGroupSelection').onclick=clearGroupingSelection;

// V180: expose the same proven grouping engine directly in the Stage / Event Layout editor.
function syncV180StageGroupUI(){
  const status=document.getElementById('v180StageGroupStatus');
  const g=document.getElementById('v180GroupSelected');
  const u=document.getElementById('v180UngroupSelected');
  const c=document.getElementById('v180ClearGroupSelection');
  if(!status)return;
  if(activeGroupId){
    const n=groupMembersById(activeGroupId,true).length;
    status.textContent='GROUP · '+n+' ITEMS';status.className='active';
    if(g)g.disabled=true;if(u)u.disabled=false;if(c)c.disabled=false;return;
  }
  if(multiSelection.length){
    status.textContent=multiSelection.length+' ITEMS SELECTED';status.className='multi';
    if(g)g.disabled=multiSelection.length<2;
    if(u)u.disabled=!multiSelection.some(o=>o.userData&&o.userData.groupId);
    if(c)c.disabled=false;return;
  }
  status.textContent='SHIFT-CLICK TO MULTI-SELECT';status.className='';
  if(g)g.disabled=true;
  if(u)u.disabled=!(selectedEdit&&selectedEdit.userData&&selectedEdit.userData.groupId);
  if(c)c.disabled=!selectedEdit;
}
const v180OriginalSyncGroupUI=syncGroupUI;
syncGroupUI=function(){v180OriginalSyncGroupUI();syncV180StageGroupUI()};
const v180GroupBtn=document.getElementById('v180GroupSelected');
const v180UngroupBtn=document.getElementById('v180UngroupSelected');
const v180ClearBtn=document.getElementById('v180ClearGroupSelection');
if(v180GroupBtn)v180GroupBtn.onclick=()=>{groupSelectedObjects();syncV180StageGroupUI()};
if(v180UngroupBtn)v180UngroupBtn.onclick=()=>{ungroupSelectedObjects();syncV180StageGroupUI()};
if(v180ClearBtn)v180ClearBtn.onclick=()=>{clearGroupingSelection();syncV180StageGroupUI()};
syncV180StageGroupUI();
__pubEl('editDelete').onclick=deleteSelected;__pubEl('editDeselect').onclick=deselectEdit;__pubEl('editUndo').onclick=undoEdit;__pubEl('editRedo').onclick=redoEdit;__pubEl('toggleRoomFloorEditView').onclick=toggleRoomFloorEditView;__pubEl('showRoomFloorNormal').onclick=toggleRoomFloorNormalPreview;__pubEl('editReset').onclick=resetAddedDetails;__pubEl('editSaveLocal').onclick=saveProjectFile;__pubEl('editDownload').onclick=downloadEditedHTML;__pubEl('projectImport').onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{await importProjectFile(f)}catch(err){flashEditor('Could not load project: '+err.message)}e.target.value=''};


__pubEl('createRectPillar').onclick=()=>{pushHistory();const o=createPillarObject('rect',{width:.70,depth:.42,height:2.58,name:'Rectangular Pillar',color:'#0a0b0d'});selectEdit(o);saveLocalEditState(false)};__pubEl('createCustomStair').onclick=()=>startDraw('stairPathTrace');__pubEl('toggleFastFrame').onclick=toggleFastFrameMode;__pubEl('toggleOrthoTrace').onclick=toggleOrthoTraceMode;__pubEl('toggleFrameView').onclick=toggleFrameViewMode;__pubEl('setPerformanceFast').onclick=()=>applyPerformanceProfile('fast');__pubEl('setPerformanceHigh').onclick=()=>applyPerformanceProfile('quality');__pubEl('optimiseSceneNow').onclick=()=>{applyPerformanceProfile('fast');flashEditor('Performance optimisation applied · FAST EDIT mode active')};__pubEl('applySafeFrameCalibration').onclick=applySafeFrameCalibration;__pubEl('applyCeilingClearanceLevels').onclick=showCeilingCalibrationCheck;__pubEl('applyBeamClearanceLevels').onclick=()=>applyVenueVerticalChoice('beam');__pubEl('lockVenueCalibration').onclick=lockVenueCalibration;__pubEl('toggleCalibrationGuides').onclick=toggleCalibrationHeightGuides;__pubEl('unlockVenueCalibration').onclick=unlockVenueCalibration;__pubEl('lockVerifiedFrame').onclick=lockVerifiedFrame;__pubEl('measureTwoPoints').onclick=()=>startVenueMeasure('two');__pubEl('measurePointToStage').onclick=()=>startVenueMeasure('stage');__pubEl('clearVenueMeasurements').onclick=clearVenueMeasurements;['calRoomCeiling','calBeamDance','calRaisedCeiling','calRaisedBeam','calStageCeiling','calStageBeam','calStageWidth','calStageDepth'].forEach(id=>{const e=document.getElementById(id);if(e){e.addEventListener('input',()=>{syncVenueCalibrationUI();rebuildCalibrationHeightGuides();saveLocalEditState(false)});e.addEventListener('change',()=>{syncVenueCalibrationUI();rebuildCalibrationHeightGuides();saveLocalEditState(false)})}});__pubEl('corner90').onclick=()=>setSelectedCornerAngle(90);__pubEl('corner180').onclick=()=>setSelectedCornerAngle(180);__pubEl('createWall').onclick=()=>startDraw('wall');__pubEl('createLedStrip').onclick=()=>{if(drawMode==='ledStripPathTrace')finishLedStripTrace();else startDraw('ledStripPathTrace')};__pubEl('createCurtainTrack').onclick=()=>{pushHistory();const o=createCurtainTrackPath();selectEdit(o);saveLocalEditState(false);flashEditor('Curtain track created · drag pink points to trace the ceiling path')};__pubEl('createCeilingBeam').onclick=()=>{pushHistory();const o=createCeilingBeamObject();selectEdit(o);saveLocalEditState(false);flashEditor('Concrete ceiling beam created · move, stretch or point-edit as needed')};__pubEl('tidyLayoutBtn').onclick=tidyLayout;__pubEl('createRoomCloser').onclick=()=>startRoomCloserDraw();__pubEl('createCurvedWall').onclick=()=>startDraw('curvedWall');__pubEl('createFenceWall').onclick=()=>startDraw('fenceWall');__pubEl('createDoor').onclick=()=>startDraw('doorFrame');__pubEl('createFloor').onclick=()=>{pushHistory();const o=createFloorObject();selectEdit(o);saveLocalEditState(false);flashEditor('Editable floor created')};__pubEl('createSteps').onclick=()=>{pushHistory();const o=createStepsObject();selectEdit(o);saveLocalEditState(false);flashEditor('Editable steps created')};__pubEl('createRamp').onclick=()=>startDraw('rampPathTrace');__pubEl('createOctPillar').onclick=()=>{pushHistory();const o=createPillarObject('octagon',{width:.68,depth:.68,height:2.58,name:'Octagon Pillar',color:'#0a0b0d'});selectEdit(o);saveLocalEditState(false);flashEditor('Octagon pillar created')};__pubEl('createBarLeaner').onclick=()=>{pushHistory();const o=createBarLeanerObject();selectEdit(o);saveLocalEditState(false);flashEditor('Bar leaner created · posts stay Ø203 mm when resized')};__pubEl('createObjectSquare').onclick=()=>{pushHistory();const o=createCustomShapeObject('square');selectEdit(o);saveLocalEditState(false);flashEditor('Editable square object created')};__pubEl('createObjectRect').onclick=()=>{pushHistory();const o=createCustomShapeObject('rect');selectEdit(o);saveLocalEditState(false);flashEditor('Editable rectangle object created')};__pubEl('createObjectTriangle').onclick=()=>{pushHistory();const o=createCustomShapeObject('triangle');selectEdit(o);saveLocalEditState(false);flashEditor('Editable triangle object created')};__pubEl('connectToWall').onclick=beginConnectToWall;__pubEl('makeRoomFloor').onclick=()=>{if(!selectedEdit||!isWallRoot(selectedEdit)){flashEditor('Select the room closing wall first');return}pushHistory();const f=createOrSyncRoomFloor(selectedEdit,true,{force:true});if(f)saveLocalEditState(false);else history.pop()};__pubEl('arcCutIn').onclick=()=>addSemicircleToSelectedWall(1);__pubEl('arcCutOut').onclick=()=>addSemicircleToSelectedWall(-1);
__pubEl('createBarStool').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('barStool'),5,'SEATING','Bar Stool','Bar stool added · Phase 5');__pubEl('createLongCouch').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('longCouch'),5,'SEATING','Long Couch','Long black couch added · Phase 5');__pubEl('createOttoman').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('ottoman'),5,'SEATING','Ottoman','Long black ottoman added · Phase 5');__pubEl('createSingleSeat').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('singleSeat'),5,'SEATING','Single Seat','Single black seat added · Phase 5');__pubEl('createCoffeeTable').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('coffeeTable'),5,'TABLES','Coffee Table','Coffee table added · Phase 5');__pubEl('createBenchTable').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('benchTable'),5,'TABLES','Long Table','Long table added · Phase 5');__pubEl('createCubbyBench').onclick=()=>addRestoredLibraryObject(()=>createFurnitureObject('cubbyBench9'),5,'SEATING','9-Cubby Bench','9-cubby square bench added · empty 3 × 3 compartments · Phase 5');__pubEl('createMuralSpaceship').onclick=()=>{const o=addRestoredLibraryObject(()=>createArtworkPanelObject('muralSpaceship'),6,'ARTWORK','Spaceship mural','Spaceship mural added · image uses cover crop so it will not warp');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createMuralGalaxyBlue').onclick=()=>{const o=addRestoredLibraryObject(()=>createArtworkPanelObject('muralGalaxyBlue'),6,'ARTWORK','Blue galaxy mural','Blue galaxy mural added · image uses cover crop so it will not warp');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createMuralNebula').onclick=()=>{const o=addRestoredLibraryObject(()=>createArtworkPanelObject('muralNebula'),6,'ARTWORK','Nebula mural','Nebula mural added · image uses cover crop so it will not warp');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createBacklitShipArtwork').onclick=()=>{const o=addRestoredLibraryObject(()=>createArtworkPanelObject('backlitShip'),6,'ARTWORK','Backlit spaceship artwork','Backlit spaceship artwork added · adjust colour, brightness and spread in the Backlit Artwork panel');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createEventMarquee').onclick=()=>{const o=addRestoredLibraryObject(()=>createArtworkPanelObject('eventMarquee',{name:'Mothership Event Marquee'}),6,'ARTWORK','Mothership Event Marquee','Red event marquee added · click a wall to attach · edit size / glow in the artwork controls');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createOrnateInfoBoard').onclick=()=>{const o=addRestoredLibraryObject(()=>createArtworkPanelObject('ornateInfoBoard',{name:'Venue Info Poster Board'}),6,'ARTWORK','Venue Info Poster Board','Ornate info frame added · vector A3 posters are now separate movable objects in the default set');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createSpaceshipPorthole').onclick=()=>{const o=addRestoredLibraryObject(()=>createSpaceshipPortholeObject({name:'Spaceship Circle Artwork'}),6,'ARTWORK','Spaceship Circle Artwork','Spaceship porthole artwork added · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createMothershipPortalArtwork').onclick=()=>{const o=addRestoredLibraryObject(()=>createMothershipPortalObject({name:'Neon Mothership Porthole Panel'}),6,'ARTWORK','Neon Mothership Porthole Panel','Neon Mothership porthole panel added · edit LED and logo colours in Backlit Artwork');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createNeonSkullLightBox').onclick=()=>{const o=addRestoredLibraryObject(()=>createNeonSkullLightBoxObject(),6,'ARTWORK','Neon Skull Light Box','Neon skull light box added · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createNeonRingPlantPanel').onclick=()=>{const o=addRestoredLibraryObject(()=>createNeonRingPlantPanelObject(),6,'ARTWORK','Neon Ring Plant Panel','Neon ring artpiece added · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createWallMirror').onclick=()=>{const o=addRestoredLibraryObject(()=>createWallMirrorObject(),6,'ARTWORK','Wall Mirror','Wall mirror added · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createWallPole').onclick=()=>{const o=addRestoredLibraryObject(()=>createWallPoleObject(),2,'BUILT-IN OBJECTS','Wall Pole','Wall pole added · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createLedBattenH').onclick=()=>{const o=addRestoredLibraryObject(()=>createLedBattenObject({orientation:'horizontal',name:'LED Batten'}),4,'LIGHTING','LED Batten','LED batten created · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createLedBattenV').onclick=()=>{const o=addRestoredLibraryObject(()=>createLedBattenObject({orientation:'vertical',name:'LED Batten Vertical'}),4,'LIGHTING','LED Batten Vertical','Vertical LED batten created · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createLedParFixture').onclick=()=>addRestoredLibraryObject(()=>createLedParObject({name:'LED Par'}),4,'LIGHTING','LED Par','LED par created · auto-mounted to ceiling height · starts OFF');__pubEl('createBlinderParFixture').onclick=()=>addRestoredLibraryObject(()=>createBlinderParObject({name:'Blinder Pars'}),4,'LIGHTING','Blinder Pars','Blinder created · starts OFF · use SNAP TO MOUNT to reposition');__pubEl('createIntimidatorFixture').onclick=()=>addRestoredLibraryObject(()=>createIntimidatorFixtureObject({name:'Chauvet Intimidator'}),4,'LIGHTING','Chauvet Intimidator','Chauvet-style Intimidator created · auto-mounted to ceiling height · starts OFF');__pubEl('createMirrorScannerFixture').onclick=()=>addRestoredLibraryObject(()=>createMovingMirrorScannerObject({name:'Moving Mirror Scanner'}),4,'LIGHTING','Moving Mirror Scanner','Moving mirror scanner created · auto-mounted to ceiling height · starts OFF');__pubEl('createHazerDF50').onclick=()=>addRestoredLibraryObject(()=>createHazerDF50Object({name:'Hazer DF-50'}),4,'ATMOSPHERE','Hazer DF-50','DF-50 hazer created · default placement = corner of stage');__pubEl('createWarmParCan').onclick=()=>{const o=addRestoredLibraryObject(()=>createWarmParCanObject({name:'Brushed Metal PAR Can'}),4,'LIGHTING','Brushed Metal PAR Can','Warm PAR can created · click a wall to attach');setTimeout(()=>{if(o===selectedEdit)beginAttachPick()},0)};__pubEl('createStrobeFixture').onclick=()=>addRestoredLibraryObject(()=>createStrobeFixtureObject({name:'Ceiling Strobe'}),4,'LIGHTING','Ceiling Strobe','Strobe created · auto-mounted to ceiling · starts OFF');__pubEl('createDownlightFixture').onclick=()=>addRestoredLibraryObject(()=>createDownlightFixtureObject({name:'Circular Downlight'}),4,'LIGHTING','Circular Downlight','Downlight created · auto-mounted to ceiling · starts OFF');__pubEl('createSunsetProjector').onclick=()=>addRestoredLibraryObject(()=>createSunsetProjectorObject({name:'Sunset Floor Lamp'}),4,'LIGHTING','Sunset Floor Lamp','Sunset lamp created · floor-mounted · starts OFF');__pubEl('createCeilingTubeLight').onclick=()=>addRestoredLibraryObject(()=>createCeilingTubeLightObject({name:'Ceiling LED Tube'}),4,'LIGHTING','Ceiling LED Tube','LED tube created · auto-mounted to ceiling · starts OFF');__pubEl('createCeilingLightPole').onclick=()=>addRestoredLibraryObject(()=>createCeilingLightPoleObject({name:'Ceiling Light Pole'}),4,'LIGHTING','Ceiling Light Pole','Metal lighting pole created · auto-mounted to ceiling · rotate / move into position');__pubEl('createUpperBarShelves').onclick=()=>addRestoredLibraryObject(()=>createBarShelfSetObject('upperShelves'),2,'BARS','Upper Bar Shelves','Upper bar shelf set added · editable object · Phase 2');__pubEl('createLowerBarShelves').onclick=()=>addRestoredLibraryObject(()=>createBarShelfSetObject('lowerShelves'),2,'BARS','Lower Bar Shelves','Lower bar shelves added · 2 shelves · 6 bottles each · Phase 2');__pubEl('createBottleRow').onclick=()=>addRestoredLibraryObject(()=>createBottleRowObject(),2,'BARS','Bottle Row','Six bottle row added · Phase 2');__pubEl('createLagerTap').onclick=()=>addRestoredLibraryObject(()=>createLagerTapObject(),2,'BARS','Lager Tap','Mothership lager tap added · Phase 2');
__pubEl('editPoints').onclick=()=>{if(drawMode==='wallTrace'||hasPausedWallTrace())finishWallTrace(true);else if(selectedEdit&&isPointEditEligible(selectedEdit)){setVertexEdit(true);flashEditor('Points are live for the selected object')}else flashEditor('Select a wall, floor, stage, ramp path or custom shape first')};__pubEl('addPoint').onclick=addCorner;__pubEl('removePoint').onclick=removeCorner;__pubEl('closeWallLoop').onclick=closeWallLoopNow;__pubEl('connectPoints').onclick=beginPointConnect;
__pubEl('shapeRect').onclick=()=>applySelectedShape('rect');__pubEl('shapeTriangle').onclick=()=>applySelectedShape('triangle');__pubEl('shapeHex').onclick=()=>applySelectedShape('hexagon');__pubEl('shapeCircle').onclick=()=>applySelectedShape('circle');__pubEl('shapeOct').onclick=()=>applySelectedShape('octagon');
['wallWidthInput','wallHeightInput','platformHeightInput'].forEach(id=>{const el=document.getElementById(id);el.addEventListener('change',()=>{if(id==='wallWidthInput')setSelectedWallWidth(el.value);else if(id==='wallHeightInput')setSelectedWallHeight(el.value);else setSelectedPlatformHeight(el.value)})});[['objectLengthInput','x'],['objectWidthInput','z']].forEach(([id,axis])=>document.getElementById(id).addEventListener('change',e=>setSelectedObjectFootprint(axis,e.target.value)));__pubEl('objectHeightInput').addEventListener('change',e=>setSelectedObjectHeight(e.target.value));__pubEl('objectLevelInput').addEventListener('change',e=>setSelectedBaseLevel(e.target.value));__pubEl('rampStartLevelInput').addEventListener('change',e=>setRampWorldLevel('start',e.target.value));__pubEl('rampFinishLevelInput').addEventListener('change',e=>setRampWorldLevel('finish',e.target.value));__pubEl('rampWidthInput').addEventListener('change',e=>setRampWidth(e.target.value));__pubEl('rampThicknessInput').addEventListener('change',e=>setRampThickness(e.target.value));__pubEl('snapRampStartFloor').onclick=()=>snapSelectedRampEndToFloor('start');__pubEl('snapRampFinishFloor').onclick=()=>snapSelectedRampEndToFloor('finish');__pubEl('toggleRampAutoFloorSnap').onclick=toggleRampAutoFloorSnap;__pubEl('squareRampCorners').onclick=squareAllSelectedRampCorners;__pubEl('speakerSubCount').addEventListener('change',e=>setSpeakerStackOption('subCount',e.target.value));__pubEl('speakerTopCount').addEventListener('change',e=>setSpeakerStackOption('topCount',e.target.value));__pubEl('speakerTopSide').addEventListener('change',e=>setSpeakerStackOption('topSide',e.target.value));__pubEl('speakerStackStyle').addEventListener('change',e=>setSpeakerStackOption('style',e.target.value));__pubEl('speakerDuplicatePair').onclick=duplicateSpeakerStackForOtherSide;__pubEl('speakerResetShape').onclick=resetSelectedSpeakerStackShape;
__pubEl('snapFloorWalls').onclick=()=>snapSelectedFloorToWalls();__pubEl('duplicateSelected').onclick=duplicateSelectedEditable;__pubEl('copySelected').onclick=copySelectedEditable;__pubEl('pasteSelected').onclick=()=>pasteCopiedSelection();__pubEl('copySelectedTop').onclick=copySelectedEditable;__pubEl('pasteSelectedTop').onclick=()=>pasteCopiedSelection();__pubEl('duplicateSelectedTop').onclick=duplicateSelectedEditable;
document.querySelectorAll('.stair-mode').forEach(b=>b.addEventListener('click',()=>setCustomStairMode(b.dataset.stairMode)));__pubEl('customStairWidth').addEventListener('change',e=>updateCustomStairField('width',e.target.value));__pubEl('customStairRise').addEventListener('change',e=>updateCustomStairField('rise',e.target.value));__pubEl('customStairCount').addEventListener('change',e=>updateCustomStairField('count',e.target.value));__pubEl('customStairWallHeight').addEventListener('change',e=>updateCustomStairField('wallHeight',e.target.value));__pubEl('customStairEditPoints').onclick=()=>{if(isCustomStairRoot(selectedEdit))setVertexEdit(true)};__pubEl('customStairFlip').onclick=flipCustomStairSide;__pubEl('snapToiletFloor').onclick=()=>{if(isFloorSnappedRestroomFixture(selectedEdit)){pushHistory();if(!snapToiletToFloor(selectedEdit,true,.85))history.pop()}};__pubEl('toggleToiletAutoFloor').onclick=toggleToiletAutoFloorSnap;__pubEl('snapSinkSurface').onclick=()=>{if(isSinkPairRoot(selectedEdit)){pushHistory();if(!snapSinkToSurface(selectedEdit,true))history.pop()}};__pubEl('toggleSinkAutoSurface').onclick=toggleSinkAutoSurfaceSnap;__pubEl('addStageFrontSubs').onclick=()=>addOrRebuildStageFrontSubs(selectedEdit,true);__pubEl('removeStageFrontSubs').onclick=()=>removeStageFrontSubs(selectedEdit);__pubEl('doorHingeSide').addEventListener('change',e=>setDoorOption('hinge',e.target.value));__pubEl('doorApexDir').addEventListener('change',e=>setDoorOption('apex',e.target.value));__pubEl('snapDoorToWall').onclick=snapSelectedDoorToWallAndCut;__pubEl('addStairRailLeft').onclick=()=>{pushHistory();const made=addHandrailsToSelectedSteps('left');if(made&&made.length){selectEdit(made[0]);saveLocalEditState(false)}else history.pop()};__pubEl('addStairRailRight').onclick=()=>{pushHistory();const made=addHandrailsToSelectedSteps('right');if(made&&made.length){selectEdit(made[0]);saveLocalEditState(false)}else history.pop()};__pubEl('addStairRailBoth').onclick=()=>{pushHistory();const made=addHandrailsToSelectedSteps('both');if(made&&made.length){selectEdit(made[0]);saveLocalEditState(false)}else history.pop()};__pubEl('toggleSelectedCurtainDrapes').onclick=toggleSelectedCurtainDrapes;__pubEl('selectAllLedStrips').onclick=selectAllLedStripsForLighting;__pubEl('allLedStripsOn').onclick=()=>setAllLedStripPower(true);__pubEl('allLedStripsOff').onclick=()=>setAllLedStripPower(false);__pubEl('redrawLedStrip').onclick=()=>{if(drawMode==='ledStripPathTrace')finishLedStripTrace();else startDraw('ledStripPathTrace')};__pubEl('finishLedStripTrace').onclick=finishLedStripTrace;__pubEl('traceRaisedLedStripTop').onclick=traceRaisedPlatformTop;__pubEl('applySelectedLedStripSurface').onclick=()=>{if(isLedStripRoot(selectedEdit)){beginAttachPick()}else flashEditor('Select a LED strip first')};__pubEl('editLedStripPoints').onclick=editSelectedLedPathPoints;__pubEl('ledPointCorner90').onclick=()=>applyLedSelectedCorner(90);__pubEl('ledPointStraight180').onclick=()=>applyLedSelectedCorner(180);__pubEl('ledFlattenAllPoints').onclick=flattenLedPathToStart;__pubEl('ledStraightStartFinish').onclick=straightenLedPathStartFinish;__pubEl('attachWallPole').onclick=attachSelectedWallPole;['ceilingPoleLength','ceilingPoleDiameter','ceilingPoleDrop','ceilingPoleMountSpread'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('change',updateSelectedCeilingLightPoleFromUI)});__pubEl('snapCeilingLightPole').onclick=()=>{if(!isCeilingLightPoleRoot(selectedEdit)){flashEditor('Select a ceiling light pole first');return}pushHistory();snapRootToCeiling(selectedEdit,true);updateSelectionBox();saveLocalEditState(false)};__pubEl('resetCeilingLightPole').onclick=resetSelectedCeilingLightPole;__pubEl('snapMainFloor').onclick=()=>{if(alignRootToMainFloor(selectedEdit,true)){saveLocalEditState(false);syncAdvancedFields()}};__pubEl('toggleMainFloorLock').onclick=()=>{autoMainFloorLock=!autoMainFloorLock;saveLocalEditState(false);syncLevelUI();flashEditor(autoMainFloorLock?'2D floor-level lock enabled':'2D floor-level lock disabled')};
__pubEl('interactionClickAction')?.addEventListener('change',syncInteractionFields);__pubEl('interactionApply')?.addEventListener('click',applySelectedInteraction);__pubEl('colourScope').onchange=syncAppearanceFields;__pubEl('sampleSelectedColour').onclick=()=>{if(isEditableRoot(selectedEdit))__pubEl('surfaceColour').value=extractObjectColour(selectedEdit)};__pubEl('applySelectedColour').onclick=()=>{const scope=__pubEl('colourScope').value,hex=__pubEl('surfaceColour').value;applyColourSet(appearanceTargets(scope),hex)};__pubEl('resetColours').onclick=resetAllColours;const backlightUI=backlitArtworkInputs();['enabled','color','logoColor','brightness','spread','blend','brightnessNumber','spreadNumber','blendNumber'].forEach(key=>{const el=backlightUI[key];if(!el)return;el.addEventListener('pointerdown',armBacklitArtworkHistory);el.addEventListener('focus',armBacklitArtworkHistory);el.addEventListener('input',()=>{if(backlitArtworkUIBusy)return;if(key==='brightness'&&backlightUI.brightnessNumber)backlightUI.brightnessNumber.value=(+backlightUI.brightness.value||0).toFixed(2);if(key==='spread'&&backlightUI.spreadNumber)backlightUI.spreadNumber.value=(+backlightUI.spread.value||0).toFixed(2);if(key==='brightnessNumber'&&backlightUI.brightness)backlightUI.brightness.value=String(+backlightUI.brightnessNumber.value||0);if(key==='spreadNumber'&&backlightUI.spread)backlightUI.spread.value=String(+backlightUI.spreadNumber.value||0);if(key==='blend'&&backlightUI.blendNumber)backlightUI.blendNumber.value=(+backlightUI.blend.value||0).toFixed(2);if(key==='blendNumber'&&backlightUI.blend)backlightUI.blend.value=String(+backlightUI.blendNumber.value||0);applyBacklitArtworkSettingsFromUI()});el.addEventListener('change',()=>{applyBacklitArtworkSettingsFromUI();releaseBacklitArtworkHistory()});el.addEventListener('blur',releaseBacklitArtworkHistory)});const ledUI=ledStripInputs();if(ledUI.scope)ledUI.scope.addEventListener('change',()=>{releaseLedStripHistory();syncLedStripUI()});['enabled','color','brightness','brightnessNumber'].forEach(key=>{const el=ledUI[key];if(!el)return;el.addEventListener('pointerdown',armLedStripHistory);el.addEventListener('focus',armLedStripHistory);el.addEventListener('input',()=>{if(ledStripUIBusy)return;if(key==='brightness'&&ledUI.brightnessNumber)ledUI.brightnessNumber.value=(+ledUI.brightness.value||0).toFixed(2);if(key==='brightnessNumber'&&ledUI.brightness)ledUI.brightness.value=String(+ledUI.brightnessNumber.value||0);applyLedStripSettingsFromUI(key)});el.addEventListener('change',()=>{applyLedStripSettingsFromUI(key);releaseLedStripHistory()});el.addEventListener('blur',releaseLedStripHistory)});const lfUI=lightFixtureInputs();['enabled','color','brightness','brightnessNumber','beam','beamNumber','orientation'].forEach(key=>{const el=lfUI[key];if(!el)return;el.addEventListener('pointerdown',armLightFixtureHistory);el.addEventListener('focus',armLightFixtureHistory);el.addEventListener('input',()=>{if(lightFixtureUIBusy)return;if(key==='brightness'&&lfUI.brightnessNumber)lfUI.brightnessNumber.value=(+lfUI.brightness.value||0).toFixed(2);if(key==='brightnessNumber'&&lfUI.brightness)lfUI.brightness.value=String(+lfUI.brightnessNumber.value||0);if(key==='beam'&&lfUI.beamNumber)lfUI.beamNumber.value=String(Math.round(+lfUI.beam.value||0));if(key==='beamNumber'&&lfUI.beam)lfUI.beam.value=String(+lfUI.beamNumber.value||0);applyLightFixtureSettingsFromUI(key)});el.addEventListener('change',()=>{applyLightFixtureSettingsFromUI(key);releaseLightFixtureHistory()});el.addEventListener('blur',releaseLightFixtureHistory)});if(lfUI.mountButton)lfUI.mountButton.onclick=()=>{if(!isLightingFixtureRoot(selectedEdit)){flashEditor('Select a light fixture first');return}pushHistory();if(!snapLightingFixtureToMount(selectedEdit,true))history.pop();else{saveLocalEditState(false);syncLightFixtureUI();updateSelectionBox()}};if(lfUI.turnOff)lfUI.turnOff.onclick=()=>{if(!isLightingFixtureRoot(selectedEdit))return;armLightFixtureHistory();if(lfUI.enabled)lfUI.enabled.checked=false;applyLightFixtureSettingsFromUI('enabled');releaseLightFixtureHistory()};


addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;if((e.metaKey||e.ctrlKey)&&(e.key==='z'||e.key==='Z')){e.preventDefault();if(e.shiftKey)redoEdit();else undoEdit();return}if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==='y'||e.key==='Y')){e.preventDefault();redoEdit();return}if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&(e.key==='c'||e.key==='C')){e.preventDefault();copySelectedEditable();return}if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&(e.key==='v'||e.key==='V')){e.preventDefault();pasteCopiedSelection();return}if(!editMode)return;if(e.key==='g'||e.key==='G'){e.preventDefault();if(e.shiftKey)ungroupSelectedObjects();else groupSelectedObjects();return}if(e.key==='w'||e.key==='W')setEditTool('translate');else if(e.key==='e'||e.key==='E')setEditTool('rotate');else if(e.key==='r'||e.key==='R')setEditTool('scale');else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected()}else if(e.key==='Escape'){if(drawMode){const wasTrace=drawMode==='wallTrace';cancelDraw();if(!wasTrace)flashEditor('Drawing cancelled')}else deselectEdit()}});

/* labels */
