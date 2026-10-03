/* 2D / 3D */
function setMode(twoD){cameraViewTween=null;mode2d=twoD;cinematicPerspective=false;camera=twoD?ortho:persp;transform.camera=camera;if(!twoD){persp.fov=45;persp.updateProjectionMatrix()}syncViewModeButtons();updateTransformAxes();updateCamera();syncLevelUI();applyRoomFloorEditDisplay();syncRoomFloorViewUI();markRenderDirty(300)}
__pubEl('btn3d').onclick=()=>{setMode(false);markRenderDirty(260)};const perspectiveBtn=document.getElementById('btnPerspective');if(perspectiveBtn)perspectiveBtn.onclick=()=>{if(!cinematicPerspective||mode2d)setPerspectiveView(true);else{syncViewModeButtons();flashEditor('Perspective stays active · drag to look · Shift/right-drag to move · WASD to walk')}};__pubEl('btn2d').onclick=()=>{setMode(true);markRenderDirty(260)};__pubEl('btnTheme').onclick=()=>setViewTheme(viewTheme==='dark'?'light':'dark',true);__pubEl('btnLayers').onclick=()=>{if(editMode)setEditMode(false);__pubEl('layers').classList.toggle('show')};['layerWalls','layerPlanGuide','layerLabels','layerLights','layerCeiling','layerStage','layerProduction','layerLighting','layerFurniture','layerArtDecor','layerCurtains'].forEach(id=>{const el=document.getElementById(id);if(el)el.onchange=()=>{applyLayerState(captureLayerState());saveLocalEditState(false)}});
const loadingRampLayerToggle=document.getElementById('layerLoadingRamp');if(loadingRampLayerToggle)loadingRampLayerToggle.onchange=()=>setLoadingRampLayerVisible(loadingRampLayerToggle.checked,true);__pubEl('navZoomIn').onclick=()=>zoomView(1);__pubEl('navZoomOut').onclick=()=>zoomView(-1);__pubEl('navFit').onclick=fitVenueView;__pubEl('navFocus').onclick=focusSelectedView;


/* V98 · EDIT / PERFORMANCE EXPERIENCE MODES */
let performancePreviewSnapshot=null,editLightsOff=true,editLightSnapshot=null,barLightsEnabled=false,selectedPerformanceGroup='scanners';
const LIGHT_GROUP_DEFS={
  scanners:{label:'SCANNERS',kinds:['movingMirrorScanner'],color:'#39d9f9'},
  chauvet:{label:'CHAUVET',kinds:['intimidator'],color:'#b32cff'},
  blinders:{label:'BLINDERS',kinds:['blinderPar'],color:'#ff315f'},
  battens:{label:'HORIZONTAL BATTENS',kinds:['ledBatten'],horizontal:true,color:'#4268ff'},
  metalPars:{label:'METAL PAR CANS',kinds:['warmParCan'],color:'#ffd49a'},
  ledPars:{label:'LED PAR CANS',kinds:['ledPar'],color:'#ff2e83'},
  strobes:{label:'STROBES',kinds:['strobeFixture'],color:'#ffffff'}
};
const performanceGroupState={};Object.entries(LIGHT_GROUP_DEFS).forEach(([k,d])=>performanceGroupState[k]={enabled:false,color:d.color,intensity:75,brightness:70,speed:k==='strobes'?58:55});
let performanceHazeEnabled=false,dynamicShowLastTime=0;const dynamicShowRuntime=new WeakMap();
function clonePlain(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return v}}
function groupForFixture(root){if(!root||!root.userData)return null;const d=root.userData.assetData||{},kind=d.kind;for(const [key,def] of Object.entries(LIGHT_GROUP_DEFS)){if(!def.kinds.includes(kind))continue;if(def.horizontal&&String(d.orientation||'horizontal').toLowerCase()==='vertical')continue;return key}return null}
function capturePerformanceLightingState(){return {groups:clonePlain(performanceGroupState),haze:!!performanceHazeEnabled,barLights:!!barLightsEnabled,visualLoop:visualLoopMode}}
function applyPerformanceLightingState(s={}){Object.entries(s.groups||{}).forEach(([k,v])=>{if(performanceGroupState[k])performanceGroupState[k]={...performanceGroupState[k],...v}});performanceHazeEnabled=!!s.haze;if(s.barLights!==undefined)applyBarLightsEnabled(!!s.barLights);if(s.visualLoop!=null)applyVisualLoopSelection(s.visualLoop);applyPerformanceRigPreview();syncSelectedGroupControls()}
function applyBarLightsEnabled(on){barLightsEnabled=!!on;if(typeof builtBarLayer!=='undefined')builtBarLayer.traverse(o=>{if(o.isLight){if(o.userData.__barBaseIntensity==null)o.userData.__barBaseIntensity=o.intensity;o.intensity=barLightsEnabled?o.userData.__barBaseIntensity:0;o.visible=barLightsEnabled;if(o.userData.barLight){if(o.distance>4.2)o.distance=4.2;configureRoomOccludedLight(o,128)}}});const ids=['editBarLightsToggle','perfBarLightsToggle'];ids.forEach(id=>{const b=document.getElementById(id);if(b){b.classList.toggle('active',barLightsEnabled);b.classList.toggle('on',barLightsEnabled);b.textContent=id==='editBarLightsToggle'?'BAR LIGHTS · '+(barLightsEnabled?'ON':'OFF'):(barLightsEnabled?'ON':'OFF')}});markRenderDirty(250)}

/* V159 · MOTHERSHIP NIGHT — cinematic Performance Mode default.
   Edit Mode remains the clean neutral working view. */
var mothershipNightLookEnabled=false,mothershipNightLookSnapshot=null;
const mothershipNightAtmosphere=new THREE.Group();
mothershipNightAtmosphere.name='Mothership Night Atmosphere';
mothershipNightAtmosphere.visible=false;
scene.add(mothershipNightAtmosphere);

const nightBarGlow=new THREE.PointLight(0xff197f,2.25,7.2,2);
nightBarGlow.userData.mothershipNightLight=true;
const nightLowerBarGlow=new THREE.PointLight(0xff2e83,.95,4.8,2);
nightLowerBarGlow.userData.mothershipNightLight=true;
const nightPurpleFill=new THREE.PointLight(0x6737b7,1.05,7.5,2);
nightPurpleFill.userData.mothershipNightLight=true;
const nightWarmFill=new THREE.PointLight(0xffc7a8,.34,5.5,2);
nightWarmFill.userData.mothershipNightLight=true;
[nightBarGlow,nightLowerBarGlow,nightPurpleFill,nightWarmFill].forEach(l=>configureRoomOccludedLight(l,256));
mothershipNightAtmosphere.add(nightBarGlow,nightLowerBarGlow,nightPurpleFill,nightWarmFill);

function mothershipNightMaterialSnapshot(mat){
  return {material:mat,color:mat.color&&mat.color.getHex?mat.color.getHex():null,roughness:Number.isFinite(mat.roughness)?mat.roughness:null,metalness:Number.isFinite(mat.metalness)?mat.metalness:null,emissive:mat.emissive&&mat.emissive.getHex?mat.emissive.getHex():null,emissiveIntensity:Number.isFinite(mat.emissiveIntensity)?mat.emissiveIntensity:null}
}
function mothershipNightFloorMaterials(){
  const mats=new Set();
  const addRoot=root=>{if(!root||!root.traverse)return;root.traverse(o=>{if(!o.isMesh||!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m)mats.add(m)})})};
  [exteriorFloor,stage,leftPlatform,rightPlatform,smokeFloor].forEach(addRoot);
  if(typeof MAT!=='undefined'&&MAT.floor)mats.add(MAT.floor);
  if(typeof builderObjects!=='undefined')builderObjects.forEach(root=>{if(!root||!root.userData)return;const type=root.userData.builderType,pd=root.userData.platformData,sd=root.userData.solidData,name=String(root.userData.editName||'').toLowerCase(),isFloor=type==='platform'||(pd&&pd.roomData)||name.includes('floor')||(sd&&/floor|stage|platform/i.test(String(sd.role||'')));if(isFloor)addRoot(root)});
  return [...mats]
}
function placeMothershipNightLights(){
  const centerOf=(root,fallback)=>{try{if(root){const b=new THREE.Box3().setFromObject(root),c=new THREE.Vector3();if(!b.isEmpty()){b.getCenter(c);return c}}}catch(e){}return fallback.clone()};
  const upper=centerOf(upperBar,new THREE.Vector3(2,1,0)),lower=centerOf(lowerBar,new THREE.Vector3(-1,1,4)),st=centerOf(stage,new THREE.Vector3(-6,.5,0)),venueBox=new THREE.Box3().setFromObject(venue),vc=new THREE.Vector3();venueBox.getCenter(vc);
  nightBarGlow.position.set(upper.x,Math.max(1.15,upper.y+1.05),upper.z+.65);
  nightLowerBarGlow.position.set(lower.x,Math.max(1.05,lower.y+.85),lower.z+.35);
  nightPurpleFill.position.set(st.x+2.2,2.05,st.z+.7);
  nightWarmFill.position.set(vc.x,2.15,vc.z+1.2)
}
function applyMothershipNightFloorMaterial(mat){
  if(!mat)return;if(mat.color)mat.color.set(0x0c090d);if('roughness' in mat)mat.roughness=.52;if('metalness' in mat)mat.metalness=.14;if(mat.emissive){mat.emissive.set(0x090207);if('emissiveIntensity' in mat)mat.emissiveIntensity=.045}mat.needsUpdate=true
}
function restoreMothershipNightMaterial(s){
  const m=s&&s.material;if(!m)return;if(s.color!=null&&m.color)m.color.setHex(s.color);if(s.roughness!=null&&'roughness' in m)m.roughness=s.roughness;if(s.metalness!=null&&'metalness' in m)m.metalness=s.metalness;if(s.emissive!=null&&m.emissive)m.emissive.setHex(s.emissive);if(s.emissiveIntensity!=null&&'emissiveIntensity' in m)m.emissiveIntensity=s.emissiveIntensity;m.needsUpdate=true
}
function applyMothershipNightLook(on=true){
  on=!!on;
  if(on){
    if(mothershipNightLookEnabled){placeMothershipNightLights();return}
    mothershipNightLookSnapshot={exposure:renderer.toneMappingExposure,background:scene.background&&scene.background.clone?scene.background.clone():scene.background,fog:scene.fog,hemi:baseHemi.intensity,house:houseLight.intensity,neutral:neutralFill.intensity,floorMaterials:mothershipNightFloorMaterials().map(mothershipNightMaterialSnapshot)};
    mothershipNightLookEnabled=true;
    mothershipNightLookSnapshot.floorMaterials.forEach(s=>applyMothershipNightFloorMaterial(s.material));
    baseHemi.intensity=.11;houseLight.intensity=.065;neutralFill.intensity=.025;
    renderer.toneMappingExposure=.84;
    scene.background=new THREE.Color(0x030204);
    scene.fog=new THREE.FogExp2(0x0d0610,.0105);
    placeMothershipNightLights();mothershipNightAtmosphere.visible=true;applyBarLightsEnabled(true);markRenderDirty(500)
  }else{
    if(!mothershipNightLookEnabled)return;
    const s=mothershipNightLookSnapshot;mothershipNightLookEnabled=false;mothershipNightAtmosphere.visible=false;
    if(s){(s.floorMaterials||[]).forEach(restoreMothershipNightMaterial);baseHemi.intensity=s.hemi;houseLight.intensity=s.house;neutralFill.intensity=s.neutral;renderer.toneMappingExposure=s.exposure;scene.background=s.background;scene.fog=s.fog}
    mothershipNightLookSnapshot=null;markRenderDirty(500)
  }
}

function applySmokingAreaEnabled(on){if(smokeFloor)smokeFloor.visible=!!on;const b=document.getElementById('editSmokingAreaToggle');if(b){b.classList.toggle('active',!!on);b.textContent='SMOKING AREA · '+(on?'ON':'OFF')}markRenderDirty(220)}
function captureEditLightState(){const lights=[],mats=[];scene.traverse(o=>{if(o.isLight&&o!==houseLight&&o!==neutralFill&&!o.isHemisphereLight)lights.push({o,intensity:o.intensity,visible:o.visible,color:o.color?o.color.getHex():null});if(o.isMesh&&o.material){const arr=Array.isArray(o.material)?o.material:[o.material];arr.forEach(m=>{if(m&&'emissiveIntensity'in m&&m.emissiveIntensity>0)mats.push({m,value:m.emissiveIntensity})})}});return {lights,mats,fixtures:builderObjects.filter(isLightingFixtureRoot).map(root=>({root,data:clonePlain(root.userData.assetData||{})})),strips:builderObjects.filter(isLedStripRoot).map(root=>({root,data:clonePlain(getLedStripData(root))})),bar:barLightsEnabled}}
function applyEditLightsOff(on=true){if(on){const fresh=captureEditLightState();if(!editLightSnapshot)editLightSnapshot=fresh;else{const fr=new Set(editLightSnapshot.fixtures.map(x=>x.root)),sr=new Set(editLightSnapshot.strips.map(x=>x.root)),lr=new Set(editLightSnapshot.lights.map(x=>x.o));fresh.fixtures.forEach(x=>{if(!fr.has(x.root))editLightSnapshot.fixtures.push(x)});fresh.strips.forEach(x=>{if(!sr.has(x.root))editLightSnapshot.strips.push(x)});fresh.lights.forEach(x=>{if(!lr.has(x.o))editLightSnapshot.lights.push(x)})}editLightsOff=true;window.__mshipForceLightsOff=true;builderObjects.filter(isLightingFixtureRoot).forEach(root=>{const d=normaliseLightingFixtureData(root.userData.assetData||{});d.enabled=false;root.userData.assetData=d;applyLightingFixtureAppearance(root)});builderObjects.filter(isLedStripRoot).forEach(root=>{const d=getLedStripData(root);applyLedStripAppearance(root,d.color,d.brightness,false)});editLightSnapshot.lights.forEach(x=>{x.o.intensity=0;x.o.visible=false});applyBarLightsEnabled(false);if(scene.fog)scene.fog.density=viewTheme==='light'?.0025:.004}else{editLightsOff=false;window.__mshipForceLightsOff=false;if(editLightSnapshot){editLightSnapshot.fixtures.forEach(x=>{if(x.root&&x.root.parent){x.root.userData.assetData=clonePlain(x.data);applyLightingFixtureAppearance(x.root)}});editLightSnapshot.strips.forEach(x=>{if(x.root&&x.root.parent){setLedStripData(x.root,clonePlain(x.data));const d=getLedStripData(x.root);applyLedStripAppearance(x.root,d.color,d.brightness,d.enabled)}});editLightSnapshot.lights.forEach(x=>{if(x.o&&x.o.parent){x.o.intensity=x.intensity;x.o.visible=x.visible;if(x.color!=null&&x.o.color)x.o.color.setHex(x.color)}});applyBarLightsEnabled(editLightSnapshot.bar);editLightSnapshot=null}}const off=document.getElementById('editAllLightsOff'),restore=document.getElementById('editRestoreLights');if(off)off.classList.toggle('active',editLightsOff);if(restore)restore.classList.toggle('active',!editLightsOff);markRenderDirty(350)}
function capturePerformancePreviewSnapshot(){return {layers:captureLayerState(),profile:performanceProfile,mode2d,perspectiveView:cinematicPerspective,cameraState:captureCameraViewState(),layoutLocked,barLights:barLightsEnabled,smoke:smokeFloor?smokeFloor.visible!==false:true,visualLoop:visualLoopMode,lighting:capturePerformanceLightingState(),fixtures:builderObjects.filter(isLightingFixtureRoot).map(root=>({root,data:clonePlain(root.userData.assetData||{})})),strips:builderObjects.filter(isLedStripRoot).map(root=>({root,data:clonePlain(getLedStripData(root))}))}}
function resetFullLightingShowVisuals(){builderObjects.filter(isLightingFixtureRoot).forEach(root=>root.traverse(o=>{const b=o.userData&&o.userData.dynamicBaseRotation;if(Array.isArray(b))o.rotation.set(+b[0]||0,+b[1]||0,+b[2]||0)}))}
function performanceFixtureBrightness(group){return Math.max(0,Math.min(100,+group.brightness||0))/100*7.0}
function applyPerformanceRigPreview(){builderObjects.filter(isLightingFixtureRoot).forEach(root=>{const d=normaliseLightingFixtureData(root.userData.assetData||{}),key=groupForFixture(root);if(d.kind==='hazerDF50'){d.enabled=!!performanceHazeEnabled;d.hazeAmount=performanceHazeEnabled?5.5:0;d.brightness=performanceHazeEnabled?5.5:0}else if(key){const g=performanceGroupState[key];d.enabled=!!g.enabled;d.lightColor=g.color;d.brightness=performanceFixtureBrightness(g);if(d.kind==='strobeFixture')d.strobeRate=2+(g.speed/100)*18}else d.enabled=false;root.userData.assetData=d;applyLightingFixtureAppearance(root)});builderObjects.filter(isLedStripRoot).forEach(root=>{const d=getLedStripData(root);applyLedStripAppearance(root,d.color,d.brightness,false)});if(scene.fog)scene.fog.density=performanceHazeEnabled?(mothershipNightLookEnabled?.018:(viewTheme==='light'?.010:.021)):(mothershipNightLookEnabled?.0105:(viewTheme==='light'?.0025:.004));setLightingRigVisualsVisible(lightingRigHardwareVisible);syncPerformanceDock();markRenderDirty(400)}
function dynamicShowStateFor(root,now){let s=dynamicShowRuntime.get(root);if(!s){s={phase:Math.random()*Math.PI*2,phase2:Math.random()*Math.PI*2,phase3:Math.random()*Math.PI*2,bias:.72+Math.random()*.7,current:1,nextBurst:now+450+Math.random()*1900,burstUntil:0,burst:.4};dynamicShowRuntime.set(root,s)}if(now>=s.nextBurst){s.burstUntil=now+120+Math.random()*420;s.burst=.22+Math.random()*.78;s.nextBurst=now+600+Math.random()*2700}return s}
function updateFullLightingShow(now){if(experienceMode!=='performance')return false;const dt=dynamicShowLastTime?Math.min(.08,(now-dynamicShowLastTime)/1000):.016;dynamicShowLastTime=now;let active=false;for(const root of builderObjects){if(!isLightingFixtureRoot(root))continue;const d=root.userData.assetData||{},key=groupForFixture(root);if(!key)continue;const g=performanceGroupState[key];if(!g||!g.enabled||!d.enabled)continue;active=true;const rs=dynamicShowStateFor(root,now),speed=.12+Math.pow(g.speed/100,1.12)*2.25,t=now*.001*speed*rs.bias,intensity=Math.max(0,g.intensity)/100,brightness=performanceFixtureBrightness(g),col=new THREE.Color(g.color);if(key==='scanners'){root.traverse(o=>{if(o.userData&&o.userData.dynamicScannerBody){o.rotation.y=1.15*(.67*Math.sin(t*.72+rs.phase)+.33*Math.sin(t*1.17+rs.phase3));o.rotation.x=.14*Math.sin(t*.58+rs.phase2)}if(o.userData&&o.userData.dynamicScannerMirror){o.rotation.x=-.65+.60*(.70*Math.sin(t*1.05+rs.phase2)+.30*Math.sin(t*1.91+rs.phase3));o.rotation.y=.42*Math.sin(t*.83+rs.phase)}if(o.userData&&o.userData.fixtureTarget){const range=Math.max(2,+d.range||7);o.position.x=range*(.38*Math.sin(t*.67+rs.phase)+.12*Math.sin(t*1.34+rs.phase2));o.position.y=-range*(.36+.16*Math.sin(t*.51+rs.phase3));o.position.z=range*(.70+.14*Math.cos(t*.61+rs.phase2))}})}else if(key==='chauvet'){root.traverse(o=>{if(o.userData&&o.userData.dynamicMovingHead){o.rotation.y=1.02*(.72*Math.sin(t*.61+rs.phase)+.28*Math.sin(t*1.11+rs.phase2));o.rotation.x=.42*(.7*Math.sin(t*.76+rs.phase2)+.3*Math.sin(t*1.39+rs.phase3));o.rotation.z=.10*Math.sin(t*.43+rs.phase3)}})}let factor=1;if(['blinders','battens','metalPars','ledPars'].includes(key)){const wave=.5+.5*(.60*Math.sin(t*1.08+rs.phase)+.40*Math.sin(t*2.16+rs.phase2)),burst=now<rs.burstUntil?rs.burst:0,target=.38+.58*wave+burst*.35,sm=1-Math.exp(-dt*5.5);rs.current+=(Math.max(.08,Math.min(1.38,target))-rs.current)*sm;factor=rs.current}root.traverse(o=>{if(o.isLight&&o.userData&&o.userData.fixtureLight){o.color.copy(col);if(key==='strobes'){const rate=2+(g.speed/100)*18,on=((now/1000*rate)%1)<.15;o.visible=on;o.intensity=on?kindLightIntensity(d.kind,brightness)*intensity:0}else{o.visible=true;o.intensity=kindLightIntensity(d.kind,brightness)*intensity*factor}}if(o.userData&&o.userData.fixtureGlow&&o.material){if(o.material.color)o.material.color.copy(col.clone().lerp(new THREE.Color('#ffffff'),.22));if(o.material.emissive)o.material.emissive.copy(col);if('emissiveIntensity'in o.material)o.material.emissiveIntensity=(.2+brightness*.55)*factor;o.material.needsUpdate=true}})}if(scene.fog)scene.fog.density=performanceHazeEnabled?(viewTheme==='light'?.010:(.018+.004*Math.sin(now*.00025))):(viewTheme==='light'?.0025:.004);return active}
function allPerformanceLightsOff(){if(mothershipNightLookEnabled)applyMothershipNightLook(false);Object.values(performanceGroupState).forEach(g=>g.enabled=false);performanceHazeEnabled=false;applyBarLightsEnabled(false);applyPerformanceRigPreview();syncSelectedGroupControls()}
function syncSelectedGroupControls(){const g=performanceGroupState[selectedPerformanceGroup],def=LIGHT_GROUP_DEFS[selectedPerformanceGroup];if(!g||!def)return;const name=document.getElementById('perfGroupName'),toggle=document.getElementById('perfGroupToggle'),color=document.getElementById('perfGroupColor'),intensity=document.getElementById('perfGroupIntensity'),brightness=document.getElementById('perfGroupBrightness'),speed=document.getElementById('perfGroupSpeed');if(name)name.textContent=def.label;if(toggle){toggle.textContent=g.enabled?'ON':'OFF';toggle.classList.toggle('on',g.enabled)}if(color)color.value=g.color;if(intensity)intensity.value=g.intensity;if(brightness)brightness.value=g.brightness;if(speed)speed.value=g.speed;const iv=document.getElementById('perfGroupIntensityValue'),bv=document.getElementById('perfGroupBrightnessValue'),sv=document.getElementById('perfGroupSpeedValue');if(iv)iv.textContent=Math.round(g.intensity)+'%';if(bv)bv.textContent=Math.round(g.brightness)+'%';if(sv)sv.textContent=Math.round(g.speed)+'%';document.querySelectorAll('[data-light-group]').forEach(b=>{const k=b.dataset.lightGroup;b.classList.toggle('active',k===selectedPerformanceGroup);b.classList.toggle('on',!!performanceGroupState[k]?.enabled)})}
function syncPerformanceDock(){const onCount=Object.values(performanceGroupState).filter(g=>g.enabled).length,status=document.getElementById('perfStatus'),hz=document.getElementById('perfHazeToggle'),bar=document.getElementById('perfBarLightsToggle');if(status)status.textContent=(onCount?onCount+' LIGHT GROUP'+(onCount===1?'':'S')+' ON':'ALL LIGHTS OFF')+' · '+(mode2d?'2D':cinematicPerspective?'PERSPECTIVE':'3D');if(hz){hz.textContent=performanceHazeEnabled?'ON':'OFF';hz.classList.toggle('on',performanceHazeEnabled)}if(bar){bar.textContent=barLightsEnabled?'ON':'OFF';bar.classList.toggle('on',barLightsEnabled)}syncSelectedGroupControls();syncPerformanceLayerButtons()}
function syncPerformanceLayerButtons(){const s=captureLayerState();document.querySelectorAll('[data-perf-layer]').forEach(b=>{const k=b.dataset.perfLayer;b.classList.toggle('active',k==='ceiling'?ceilingDetailHardwareVisible:k==='lighting'?lightingRigHardwareVisible:!!s[k])})}
function togglePerformanceLayer(key){const s=captureLayerState();if(key==='ceiling')s.ceiling=!ceilingDetailHardwareVisible;else if(key==='lighting')s.lighting=!lightingRigHardwareVisible;else s[key]=!s[key];applyLayerState(s);syncPerformanceLayerButtons()}
function restorePerformancePreviewSnapshot(){const s=performancePreviewSnapshot;if(!s)return;resetFullLightingShowVisuals();(s.fixtures||[]).forEach(x=>{if(x.root&&x.root.parent){x.root.userData.assetData=clonePlain(x.data);applyLightingFixtureAppearance(x.root)}});(s.strips||[]).forEach(x=>{if(x.root&&x.root.parent){setLedStripData(x.root,clonePlain(x.data));const d=getLedStripData(x.root);applyLedStripAppearance(x.root,d.color,d.brightness,d.enabled)}});applyLayerState(s.layers);setLayoutLocked(s.layoutLocked,false);if(s.cameraState)applyCameraViewState(s.cameraState,false);else if(s.perspectiveView)setPerspectiveView(false);else setMode(!!s.mode2d);applyPerformanceProfile(s.profile||'fast',false);applyBarLightsEnabled(!!s.barLights);applySmokingAreaEnabled(s.smoke!==false);applyVisualLoopSelection(s.visualLoop||'cycle');markRenderDirty(450)}
function saveCurrentRigToActivePreset(){const sel=document.getElementById('perfCombinedPreset'),key=sel&&sel.value||activeCombinedPresetKey;if(!key||!layoutPresets[key]||+layoutPresets[key].version<4){flashEditor('Choose a saved event + capacity preset first');return}layoutPresets[key].lighting=capturePerformanceLightingState();layoutPresets[key].barLights=barLightsEnabled;layoutPresets[key].smokingArea=smokeFloor?smokeFloor.visible!==false:true;layoutPresets[key].visualLoop=visualLoopMode;activeCombinedPresetKey=key;saveLocalEditState(false);syncLayoutPresetUI();flashEditor('Lighting rig saved to '+key.replace('::',' + '))}

function initPromoterSite(){
  if(sitePreviewReady)return;sitePreviewReady=true;
  const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn)};
  document.querySelectorAll('[data-site-target]').forEach(b=>b.addEventListener('click',()=>{
    const target=b.dataset.siteTarget;
    siteNavigate(target,{scroll:false,camera:true});
  }));
  document.querySelectorAll('[data-site-jump]').forEach(b=>b.addEventListener('click',()=>siteNavigate(b.dataset.siteJump,{scroll:true,camera:false})));
  document.querySelectorAll('[data-site-object]').forEach(b=>b.addEventListener('click',()=>siteFocusObject(b.dataset.siteObject)));
  on('siteBrand','click',()=>siteNavigate('explore',{scroll:false,camera:true}));
  on('siteExploreVenue','click',siteRevealVenueCover);
  on('siteSectionCoverInfo','click',e=>siteReadMore(e.currentTarget.dataset.section||siteActiveSection));
  on('siteScrollCue','click',()=>siteNavigate('venue',{scroll:true,camera:true}));
  on('siteExpandedInfoClose','click',()=>siteCloseInfo());
  // V121 · one scroll system only:
  // mouse / trackpad / touch use browser-native document scrolling.
  // Smooth motion is reserved for READ MORE / BACK TO VENUE buttons.
  on('siteFreeExplore','click',()=>{});
  on('siteLightingBtn','click',()=>{document.body.classList.toggle('site-lighting-open');document.getElementById('siteLightingBtn')?.classList.toggle('active',document.body.classList.contains('site-lighting-open'))});
  on('siteLightingChip','click',()=>{document.body.classList.toggle('site-lighting-open');document.getElementById('siteLightingBtn')?.classList.toggle('active',document.body.classList.contains('site-lighting-open'))});
  on('siteBackToVenueChip','click',()=>siteCloseInfo());
  on('siteProductionLighting','click',()=>{window.scrollTo({top:0,behavior:'auto'});document.body.classList.add('site-lighting-open');document.getElementById('siteLightingBtn')?.classList.add('active')});
  on('siteEditBtn','click',()=>setExperienceMode('edit'));
  on('siteDrawerClose','click',()=>closeObjectPopupDrawer({restore:true}));
  on('siteDrawerGo','click',e=>{
    const s=e.currentTarget.dataset.section||'venue';
    clearPopupFrameReturn();
    document.getElementById('siteObjectDrawer')?.classList.remove('show');
    siteNavigate(s,{scroll:false,camera:true})
  });
  on('siteDrawerFrameGo','click',e=>openPopupFrameFull(e.currentTarget.dataset.frameId||''));
  on('siteDrawerFrameImage','click',e=>openPopupFrameFull(e.currentTarget.dataset.frameId||''));
  on('sitePopupFrameReturn','click',closePopupFrameFull);

  window.addEventListener('scroll',updateSiteBackToVenueChip,{passive:true});
  window.addEventListener('resize',updateSiteBackToVenueChip,{passive:true});
  updateSiteBackToVenueChip();

  // Active tab state is driven by clicks and in-venue object navigation.
}

function setExperienceMode(mode){mode=mode==='performance'?'performance':'edit';if(mode===experienceMode){if(mode==='edit'&&!editMode)setEditMode(true);else if(mode==='performance'&&!sitePreviewActive())setSitePreviewState(true);return;}const eb=document.getElementById('modeEditBtn'),pb=document.getElementById('modePerformanceBtn');if(mode==='performance'){const wasOff=editLightsOff;if(editLightsOff)applyEditLightsOff(false);performancePreviewSnapshot=document.body.classList.contains('published-promoter-only')?{editWasOff:wasOff}:capturePerformancePreviewSnapshot();performancePreviewSnapshot.editWasOff=wasOff;experienceMode='performance';document.body.classList.add('performance-mode');setSitePreviewState(true);if(eb)eb.classList.remove('active');if(pb)pb.classList.add('active');setEditMode(false);setLayoutLocked(true,false);const s=captureLayerState();Object.assign(s,{walls:true,planGuide:false,labels:false,ceiling:false,stage:true,production:true,lighting:true,furniture:true,artDecor:true,curtains:true});for(let p=1;p<=7;p++)s['phase'+p]=true;applyLayerState(s);applyPerformanceProfile('quality',false);applyMothershipNightLook(false);allPerformanceLightsOff();applyVisualLoopSelection('cycle');syncLayoutPresetUI();if(cameraCoverFrameId&&cameraFrames.some(f=>f.id===cameraCoverFrameId))loadCameraFrame(cameraCoverFrameId,true);else if(!cinematicPerspective||mode2d)setPerspectiveView(true);syncCameraFrameUI();document.getElementById('hint').innerHTML='VENUE PACK PREVIEW · PAGE VIEWS + CLICKABLE ZONES'}else{applyMothershipNightLook(false);allPerformanceLightsOff();restorePerformancePreviewSnapshot();experienceMode='edit';setSitePreviewState(false);document.body.classList.remove('performance-mode');if(eb)eb.classList.add('active');if(pb)pb.classList.remove('active');setEditMode(true);const wasOff=!!performancePreviewSnapshot?.editWasOff;performancePreviewSnapshot=null;if(wasOff)applyEditLightsOff(true);syncLayoutLockUI();markRenderDirty(450)}}

function initV161EditorVisibility(){
  const editor=document.getElementById('editor');
  const btn=document.getElementById('toggleHiddenEditorTools');
  const status=document.getElementById('hiddenEditorToolsStatus');
  if(!editor||!btn)return;

  // V257: show every advanced editor section by default.
  let show=true;

  const sync=()=>{
    editor.classList.toggle('v161-advanced-hidden',!show);
    btn.textContent=show?'HIDE ADVANCED TOOLS':'SHOW ADVANCED TOOLS';
    btn.classList.toggle('active',show);
    if(status)status.textContent=show?'ALL ADVANCED PANELS SHOWN':'ADVANCED PANELS HIDDEN';
  };

  sync();

  btn.addEventListener('click',()=>{
    show=!show;
    sync();
  });
}


function venueInfoBoardRoot(){
  return objectByEditId?.('dyn_0500') ||
    [...(editorRoots||[])].find(o=>o?.userData?.editName==='Venue Info Poster Board') ||
    [...(builderObjects||[])].find(o=>o?.userData?.assetData?.kind==='ornateInfoBoard') ||
    null
}
function ensureArtDecorVisible(){
  try{
    if(typeof artDecorLayerGroup!=='undefined')artDecorLayerGroup.visible=true;
    const cb=document.getElementById('layerArtDecor');
    if(cb){cb.checked=true;applyLayerState?.(captureLayerState?.())}
  }catch(e){}
}
function focusVenueInfoBoardNow(attempt=0){
  ensureArtDecorVisible();
  const root=venueInfoBoardRoot();
  if(!root){
    if(attempt<24){
      setTimeout(()=>focusVenueInfoBoardNow(attempt+1),150);
      if(attempt===0)flashEditor?.('Loading poster board…')
    }else{
      flashEditor?.('Poster board has not loaded yet · try again in a moment')
    }
    return
  }
  root.visible=true;
  root.traverse?.(o=>o.visible=true);
  selectEdit?.(root);
  focusSelectedView?.();
  markRenderDirty?.(500);
  flashEditor?.('Venue Info Poster Board focused')
}
function v164PosterPreset(key){
  const map={
    keyFeatures:{title:'KEY FEATURES',code:'01',accent:'#ff2e83',editName:'Key Features Poster'},
    gallery:{title:'GALLERY',code:'02',accent:'#39d9f9',editName:'Gallery Poster'},
    safety:{title:'SAFETY POLICY',code:'03',accent:'#ffd166',editName:'Safety Policy Poster'},
    licensing:{title:'LICENSING',code:'04',accent:'#ff6b6b',editName:'Licensing Poster'}
  };
  return map[key]||map.keyFeatures
}
function v164PosterOffset(key){
  const slots={
    keyFeatures:{u:-0.18,v:0.245},
    gallery:{u:0.18,v:0.245},
    safety:{u:-0.18,v:-0.245},
    licensing:{u:0.18,v:-0.245}
  };
  return slots[key]||slots.keyFeatures
}
function v164FindPosterRoot(editName){
  const list=[...(editorRoots||[]),...(builderObjects||[])];
  return list.find(o=>o?.userData?.editName===editName)||null
}
function v164PositionPosterOnBoard(root,key){
  const board=venueInfoBoardRoot();
  if(!root||!board||!root.userData?.assetData)return;
  const slot=v164PosterOffset(key);
  const a=board.rotation?.y||0;
  const normalX=Math.sin(a), normalZ=Math.cos(a);
  const rightX=Math.cos(a), rightZ=-Math.sin(a);
  root.position.set(
    (board.position?.x||0)+rightX*slot.u+normalX*0.070,
    0,
    (board.position?.z||0)+rightZ*slot.u+normalZ*0.070
  );
  root.rotation.set(0,a,0);
  root.userData.assetData.width=0.297;
  root.userData.assetData.height=0.420;
  root.userData.assetData.depth=0.016;
  root.userData.assetData.centerY=1.43+slot.v;
  rebuildArtworkPanelObject?.(root);
}
function v164AddInfoPoster(key,{focus=true}={}){
  ensureArtDecorVisible();
  const preset=v164PosterPreset(key);
  const o=addRestoredLibraryObject(
    ()=>createArtworkPanelObject('infoPosterCard',{
      name:preset.editName,
      posterTitle:preset.title,
      posterCode:preset.code,
      accentColor:preset.accent,
      width:0.297,
      height:0.420,
      depth:0.016,
      centerY:1.43
    }),
    6,'ARTWORK',preset.editName,preset.title+' poster added'
  );
  setTimeout(()=>{
    if(o){
      v164PositionPosterOnBoard(o,key);
      if(focus){selectEdit?.(o);focusSelectedView?.()}
      markRenderDirty?.(350)
    }
  },40);
  return o
}
function v164EnsurePosterSet(){
  const board=venueInfoBoardRoot();
  if(!board)return;
  [['keyFeatures','Key Features Poster'],['gallery','Gallery Poster'],['safety','Safety Policy Poster'],['licensing','Licensing Poster']].forEach(([key,name],idx)=>{
    const found=v164FindPosterRoot(name);
    if(found){v164PositionPosterOnBoard(found,key);return}
    setTimeout(()=>v164AddInfoPoster(key,{focus:false}),idx*60);
  })
}
function initV162PosterBoardQuickAccess(){
  const focus=document.getElementById('focusVenueInfoBoard');
  const add=document.getElementById('addVenueInfoBoardQuick');
  const addKey=document.getElementById('addPosterKeyFeatures');
  const addGallery=document.getElementById('addPosterGallery');
  const addSafety=document.getElementById('addPosterSafety');
  const addLicensing=document.getElementById('addPosterLicensing');
  if(focus)focus.addEventListener('click',()=>focusVenueInfoBoardNow(0));
  if(add) add.addEventListener('click',()=>{
    ensureArtDecorVisible();
    const o=addRestoredLibraryObject(
      ()=>createArtworkPanelObject('ornateInfoBoard',{name:'Venue Info Poster Board'}),
      6,'ARTWORK','Venue Info Poster Board',
      'Ornate four-poster board added · click a wall to attach'
    );
    setTimeout(()=>{if(o){selectEdit?.(o);focusSelectedView?.();beginAttachPick?.()}},30)
  });
  if(addKey)addKey.addEventListener('click',()=>v164AddInfoPoster('keyFeatures'));
  if(addGallery)addGallery.addEventListener('click',()=>v164AddInfoPoster('gallery'));
  if(addSafety)addSafety.addEventListener('click',()=>v164AddInfoPoster('safety'));
  if(addLicensing)addLicensing.addEventListener('click',()=>v164AddInfoPoster('licensing'));
  setTimeout(v164EnsurePosterSet,220);
}


function initV168AdaptiveNav(){
  const body=document.body;
  const keepFull=()=>body.classList.remove(
    'v167-nav-hidden','v167-nav-returned',
    'v168-nav-hidden','v168-nav-compact','v168-nav-expanded'
  );
  keepFull();
}


function initV168NavZonePreview(){
  const site=document.getElementById('promoterSite'),nav=document.getElementById('siteNav');if(!site||!nav)return;
  let zone=document.getElementById('v168NavZonePreview');
  if(!zone){zone=document.createElement('div');zone.id='v168NavZonePreview';zone.innerHTML='<span></span>';site.appendChild(zone)}
  const map={
    venue:[42,17,45,60],
    hire:[49,45,38,34],
    production:[18,20,39,50],
    marketing:[57,13,31,41],
    past:[35,25,45,48],
    contact:[5,18,27,58]
  };
  const hide=()=>zone.classList.remove('show');
  nav.querySelectorAll('.site-nav-link').forEach(btn=>{
    const show=()=>{
      const key=btn.dataset.siteTarget;if(!map[key]||document.body.classList.contains('site-info-expanded')){hide();return}
      const [x,y,w,h]=map[key];
      zone.style.setProperty('--zx',x+'vw');zone.style.setProperty('--zy',y+'vh');zone.style.setProperty('--zw',w+'vw');zone.style.setProperty('--zh',h+'vh');
      zone.querySelector('span').textContent=(btn.textContent||key).trim().toUpperCase();
      zone.classList.add('show')
    };
    btn.addEventListener('mouseenter',show);btn.addEventListener('focus',show);btn.addEventListener('mouseleave',hide);btn.addEventListener('blur',hide)
  })
}

function initExperienceModes(){if(document.body.classList.contains('published-promoter-only')){
  // Public build: initialise only the systems required by the promoter venue pack.
  initV168AdaptiveNav();
  initPromoterSite();

  // Apply the saved page/nav state without attaching its editing controls.
  applyPageTabState(pageTabState&&Object.keys(pageTabState.pages||{}).length?pageTabState:null);

  // Keep the public Performance controls available if their panel is opened.
  const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn)};
  on('perfAllOff','click',allPerformanceLightsOff);
  on('perfLayersToggle','click',()=>{document.body.classList.toggle('performance-layers-open')});
  on('perfView3D','click',()=>{setMode(false);fitVenueView();syncPerformanceDock()});
  on('perfViewPerspective','click',()=>{if(!cinematicPerspective||mode2d)setPerspectiveView(true);syncPerformanceDock()});
  on('perfView2D','click',()=>{setMode(true);fitVenueView();syncPerformanceDock()});
  on('perfResetView','click',resetPerspectiveToCover);
  on('perfCombinedPreset','change',e=>{if(e.target.value)loadNamedLayoutPreset(e.target.value,{preview:true,silent:true})});
  on('perfBarLightsToggle','click',()=>applyBarLightsEnabled(!barLightsEnabled));
  on('perfHazeToggle','click',()=>{performanceHazeEnabled=!performanceHazeEnabled;applyPerformanceRigPreview()});
  on('perfVisualLoop','change',e=>applyVisualLoopSelection(e.target.value));
  on('perfGroupToggle','click',()=>{performanceGroupState[selectedPerformanceGroup].enabled=!performanceGroupState[selectedPerformanceGroup].enabled;applyPerformanceRigPreview()});
  on('perfGroupColor','input',e=>{performanceGroupState[selectedPerformanceGroup].color=e.target.value;applyPerformanceRigPreview()});
  on('perfGroupIntensity','input',e=>{performanceGroupState[selectedPerformanceGroup].intensity=+e.target.value||0;syncSelectedGroupControls();markRenderDirty(250)});
  on('perfGroupBrightness','input',e=>{performanceGroupState[selectedPerformanceGroup].brightness=+e.target.value||0;applyPerformanceRigPreview()});
  on('perfGroupSpeed','input',e=>{performanceGroupState[selectedPerformanceGroup].speed=+e.target.value||0;syncSelectedGroupControls();markRenderDirty(250)});
  document.querySelectorAll('[data-light-group]').forEach(b=>b.addEventListener('click',()=>{selectedPerformanceGroup=b.dataset.lightGroup;syncSelectedGroupControls()}));
  document.querySelectorAll('[data-perf-layer]').forEach(b=>b.addEventListener('click',()=>togglePerformanceLayer(b.dataset.perfLayer)));
  syncPerformanceDock();
  return;
}initV168AdaptiveNav();initPromoterSite();initV170PageManager();initHotspotZoneEditor();document.querySelectorAll('#v172EditorJumps [data-jump]').forEach(b=>b.addEventListener('click',()=>{const el=document.getElementById(b.dataset.jump);if(el){el.scrollIntoView({behavior:'smooth',block:'start'})}}));const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn)};on('modeEditBtn','click',()=>setExperienceMode('edit'));on('modePerformanceBtn','click',()=>setExperienceMode('performance'));on('perfAllOff','click',allPerformanceLightsOff);on('perfLayersToggle','click',()=>{document.body.classList.toggle('performance-layers-open')});on('perfView3D','click',()=>{setMode(false);fitVenueView();syncPerformanceDock()});on('perfViewPerspective','click',()=>{if(!cinematicPerspective||mode2d)setPerspectiveView(true);syncPerformanceDock()});on('perfView2D','click',()=>{setMode(true);fitVenueView();syncPerformanceDock()});on('perfResetView','click',resetPerspectiveToCover);on('perfCombinedPreset','change',e=>{if(e.target.value)loadNamedLayoutPreset(e.target.value,{preview:true,silent:true})});on('perfSaveRigPreset','click',saveCurrentRigToActivePreset);on('perfBarLightsToggle','click',()=>applyBarLightsEnabled(!barLightsEnabled));on('perfHazeToggle','click',()=>{performanceHazeEnabled=!performanceHazeEnabled;applyPerformanceRigPreview()});on('perfVisualLoop','change',e=>applyVisualLoopSelection(e.target.value));on('perfGroupToggle','click',()=>{performanceGroupState[selectedPerformanceGroup].enabled=!performanceGroupState[selectedPerformanceGroup].enabled;applyPerformanceRigPreview()});on('perfGroupColor','input',e=>{performanceGroupState[selectedPerformanceGroup].color=e.target.value;applyPerformanceRigPreview()});on('perfGroupIntensity','input',e=>{performanceGroupState[selectedPerformanceGroup].intensity=+e.target.value||0;syncSelectedGroupControls();markRenderDirty(250)});on('perfGroupBrightness','input',e=>{performanceGroupState[selectedPerformanceGroup].brightness=+e.target.value||0;applyPerformanceRigPreview()});on('perfGroupSpeed','input',e=>{performanceGroupState[selectedPerformanceGroup].speed=+e.target.value||0;syncSelectedGroupControls();markRenderDirty(250)});document.querySelectorAll('[data-light-group]').forEach(b=>b.addEventListener('click',()=>{selectedPerformanceGroup=b.dataset.lightGroup;syncSelectedGroupControls()}));document.querySelectorAll('[data-perf-layer]').forEach(b=>b.addEventListener('click',()=>togglePerformanceLayer(b.dataset.perfLayer)));on('editAllLightsOff','click',()=>applyEditLightsOff(true));on('editRestoreLights','click',()=>applyEditLightsOff(false));on('editBarLightsToggle','click',()=>applyBarLightsEnabled(!barLightsEnabled));on('editSmokingAreaToggle','click',()=>applySmokingAreaEnabled(!(smokeFloor&&smokeFloor.visible!==false)));syncPerformanceDock();let params=null;try{params=new URLSearchParams(location.search)}catch(e){}const requested=params&&params.get('mode'),promoter=params&&params.get('promoter')==='1';if(promoter){document.body.classList.add('promoter-link');setTimeout(()=>setExperienceMode('performance'),0)}else if(requested==='performance')setTimeout(()=>setExperienceMode('performance'),0)}

/* dynamic lighting removed — compatibility placeholders only */
let master=100,haze=false,strobe=false,accents=false,currentPreset='static',rigColor='#ffffff';
const colour=null,masterEl=null,pct=null;themeRuntimeReady=false;
function applyRigColor(){}
function applyMaster(){}
function setToggle(){}
function preset(){}
/* render */
function updateLightingFixtureAnimations(now){if(experienceMode==='performance'||window.__mshipForceLightsOff||editLightsOff)return false;let active=false;for(const root of builderObjects){if(!isLightingFixtureRoot(root))continue;const d=root.userData.assetData;if(!d||d.kind!=='strobeFixture'||!d.enabled)continue;active=true;const rate=Math.max(1,Math.min(20,+d.strobeRate||8)),phase=(now/1000*rate)%1,on=phase<.16;root.traverse(o=>{if(o.userData&&o.userData.strobeLight&&o.isLight){o.visible=on;o.intensity=on?kindLightIntensity('strobeFixture',d.brightness):0}if(o.userData&&o.userData.fixtureGlow&&o.material&&'emissiveIntensity' in o.material){o.material.emissiveIntensity=on?(1.1+d.brightness*.45):0}})}return active}
function animate(ts=0){
  requestAnimationFrame(animate);
  const now=ts||((window.performance&&performance.now)?performance.now():Date.now());
  const infoOnly=document.body.classList.contains('performance-mode')&&document.body.classList.contains('site-preview')&&(window.scrollY||0)>window.innerHeight*.78;
  if(infoOnly)return;

  const cameraMoving=updateCameraViewTween(now),
        showing=updateFullLightingShow(now),
        strobing=updateLightingFixtureAnimations(now),
        visuals=updateVisualLoopTextures(now),
        stageFast=!!window.__mshipStageFastEdit;

  if(strobing||showing||visuals||cameraMoving)renderDirty=true;

  // V247: do not submit an identical WebGL frame just because the old idle
  // interval elapsed. Dynamic lights, visuals and camera tweens still mark
  // themselves dirty and therefore render exactly when they change.
  if(!renderDirty&&!cameraMoving&&!showing&&!strobing&&!visuals)return;

  const boosting=now<renderBoostUntil,
        interval=stageFast?(cameraMoving?20:34):(cameraMoving?16:((showing||strobing)?32:(visuals?70:(performanceProfile==='quality'?(boosting?16:48):(boosting?24:180)))));

  if(now-lastRenderTime<interval)return;

  // Editor overlays are absent in this public build. Avoid walking their
  // selection helpers during Performance Mode renders.
  if(editMode&&selectionBox.visible&&!(stageFast&&transform&&transform.dragging))updateSelectionBox();
  if(editMode&&!stageFast)multiSelectionBoxes.forEach(h=>h&&h.update&&h.update());

  renderer.render(scene,camera);
  lastRenderTime=now;
  renderDirty=false
}
fastFrameMode=false;frameViewActive=false;autoSnapEnabled=false;
calibrationGuideGroup.visible=false;

// Keep geometry compatibility work that affects the finished venue, but perform
// the final ceiling normalisation only once.
upgradeLegacyAcUnits();
if(document.getElementById('layerCeiling'))__pubEl('layerCeiling').checked=true;
if(document.getElementById('layerStage'))__pubEl('layerStage').checked=true;
if(document.getElementById('layerProduction'))__pubEl('layerProduction').checked=true;
if(document.getElementById('layerLighting'))__pubEl('layerLighting').checked=true;
if(document.getElementById('layerArtDecor'))__pubEl('layerArtDecor').checked=true;
if(document.getElementById('layerFurniture'))__pubEl('layerFurniture').checked=true;
normaliseCeilingMountedDetails();
applyLayerState(captureLayerState());

// V249: preserve the previous V247/V246 opening camera/start position.
// Initialise the promoter navigation while the loading overlay is present,
// but do not run the Performance-mode camera/state transition until the
// existing performance-only startup guard runs immediately afterwards.
initExperienceModes();
applyBarLightsEnabled(false);
applyEditLightsOff(true);

document.body.classList.remove('edit-on');
const v248Loading=document.getElementById('loading');
if(v248Loading)v248Loading.style.display='none';
animate();
