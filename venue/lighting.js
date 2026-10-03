function isSmokersAreaAssetKind(kind){
  return ['woodPanelFloor','brickWall','distressedConcreteWall','cementLeaner','woodPanelGate','longWoodBench','fineMeshWall'].includes(kind)
}
function isSmokersAreaAssetRoot(root){
  return !!root&&root.userData&&root.userData.builderType==='fixtureAsset'&&root.userData.assetData&&isSmokersAreaAssetKind(root.userData.assetData.kind)
}
function isSelectionProxyObject(o){return !!(o&&o.userData&&o.userData.v202SelectionProxy)}
function normaliseSmokersAreaData(kind,data={}){
  const d={...(data||{}),kind};
  if(kind==='woodPanelFloor'){
    d.width=Math.max(.30,+d.width||3.2);d.depth=Math.max(.30,+d.depth||2.0);d.height=Math.max(.025,+d.height||.055);
    d.detailSize=Math.max(.06,+d.detailSize||.18);d.orientation=d.orientation==='horizontal'?'horizontal':'vertical';d.color=d.color||'#30231f'
  }else if(kind==='brickWall'){
    d.width=Math.max(.30,+d.width||2.5);d.depth=Math.max(.04,+d.depth||.16);d.height=Math.max(.30,+d.height||2.3);
    d.detailSize=Math.max(.12,+d.detailSize||.28);d.orientation='horizontal';d.color=d.color||'#6a5147'
  }else if(kind==='distressedConcreteWall'){
    d.width=Math.max(.80,+d.width||5.8);d.depth=Math.max(.06,+d.depth||.22);d.height=Math.max(.80,+d.height||3.0);
    d.detailSize=Math.max(.14,+d.detailSize||.34);d.roughnessStrength=Math.max(.01,Math.min(.12,+d.roughnessStrength||.055));d.orientation='horizontal';d.color=d.color||'#b8b6af'
  }else if(kind==='cementLeaner'){
    d.width=Math.max(.25,+d.width||.62);d.depth=Math.max(.25,+d.depth||.50);d.height=Math.max(.45,+d.height||1.12);
    d.detailSize=.20;d.orientation='vertical';d.color=d.color||'#b9b7b0'
  }else if(kind==='woodPanelGate'){
    d.width=Math.max(.35,+d.width||1.05);d.depth=Math.max(.035,+d.depth||.075);d.height=Math.max(.45,+d.height||2.05);
    d.detailSize=Math.max(.06,+d.detailSize||.16);d.orientation=d.orientation==='horizontal'?'horizontal':'vertical';d.color=d.color||'#3a2b25'
  }else if(kind==='longWoodBench'){
    d.width=Math.max(.45,+d.width||2.55);d.depth=Math.max(.18,+d.depth||.46);d.height=Math.max(.24,+d.height||.48);
    d.detailSize=.18;d.orientation='horizontal';d.color=d.color||'#5a4033'
  }else if(kind==='fineMeshWall'){
    d.width=Math.max(.35,+d.width||2.7);d.depth=Math.max(.02,+d.depth||.05);d.height=Math.max(.40,+d.height||2.25);
    d.detailSize=Math.max(.05,+d.detailSize||.12);d.orientation='vertical';d.color=d.color||'#111317'
  }
  return d
}
function smokersAreaDefaultName(kind){
  return {
    woodPanelFloor:'Wood Panel Flooring',
    brickWall:'Brick Wall',
    distressedConcreteWall:'Distressed Concrete Wall',
    cementLeaner:'Tall Cement Leaner',
    woodPanelGate:'Wood Panel Gate',
    longWoodBench:'Long Wooden Bench',
    fineMeshWall:'Fine Black Mesh Wall'
  }[kind]||'Smokers Area Object'
}
function smokersPrismGeometry(bottomW,bottomD,topW,topD,h){
  const bw=bottomW/2,bd=bottomD/2,tw=topW/2,td=topD/2;
  const v=[
    -bw,0,-bd, bw,0,-bd, bw,0,bd, -bw,0,bd,
    -tw,h,-td, tw,h,-td, tw,h,td, -tw,h,td
  ];
  const idx=[
    0,2,1,0,3,2, 4,5,6,4,6,7,
    0,1,5,0,5,4, 1,2,6,1,6,5,
    2,3,7,2,7,6, 3,0,4,3,4,7
  ];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  g.setIndex(idx);g.computeVertexNormals();return g
}
function rebuildSmokersAreaAssetObject(root){
  if(!isSmokersAreaAssetRoot(root))return false;
  clearGroupChildren(root);
  const d=normaliseSmokersAreaData(root.userData.assetData.kind,root.userData.assetData);
  root.userData.assetData=d;
  const colour=root.userData.colorOverride||d.color||'#3a302b';
  d.color=colour;

  const woodMat=new THREE.MeshStandardMaterial({color:colour,roughness:.88,metalness:.02});
  const woodAlt=new THREE.MeshStandardMaterial({color:new THREE.Color(colour).multiplyScalar(.80),roughness:.92,metalness:.01});
  const darkMat=new THREE.MeshStandardMaterial({color:0x111317,roughness:.62,metalness:.54});
  const mortarMat=new THREE.MeshStandardMaterial({color:0x292724,roughness:1,metalness:0});
  const cementMat=new THREE.MeshStandardMaterial({color:colour,roughness:.96,metalness:.01});
  const blackMetal=new THREE.MeshStandardMaterial({color:colour,roughness:.48,metalness:.72});

  if(d.kind==='woodPanelFloor'){
    const vertical=d.orientation==='vertical';
    const across=vertical?d.width:d.depth;
    const along=vertical?d.depth:d.width;
    const count=Math.max(1,Math.ceil(across/d.detailSize));
    const panel=across/count,gap=.012;
    for(let i=0;i<count;i++){
      const offset=-across/2+panel*(i+.5);
      const w=vertical?Math.max(.02,panel-gap):along;
      const z=vertical?along:Math.max(.02,panel-gap);
      addAssetBox(root,w,d.height,z,vertical?offset:0,d.height/2,vertical?0:offset,i%2?woodAlt:woodMat)
    }
  }else if(d.kind==='brickWall'){
    addAssetBox(root,d.width,d.height,d.depth,0,d.height/2,0,woodMat);
    const course=Math.max(.12,d.detailSize*.48);
    const rows=Math.max(2,Math.floor(d.height/course));
    for(let r=1;r<rows;r++)addAssetBox(root,d.width+.008,.012,d.depth+.012,0,r*(d.height/rows),0,mortarMat);
    const brickW=Math.max(.18,d.detailSize);
    for(let r=0;r<rows;r++){
      const y=(r+.5)*(d.height/rows),offset=(r%2)*brickW/2;
      for(let x=-d.width/2+brickW+offset;x<d.width/2;x+=brickW){
        addAssetBox(root,.012,d.height/rows-.018,d.depth+.014,x,y,0,mortarMat)
      }
    }
  }else if(d.kind==='distressedConcreteWall'){
    // Main concrete/render slab with more believable tonal + depth variation.
    const baseCol=new THREE.Color(colour);

    // V206 · rough rendered concrete material, based on the supplied
    // cement-plaster reference. One cached procedural texture is reused
    // across the wall so colour changes stay cheap.
    const concreteTex=v206ConcreteTexture();
    concreteTex.repeat.set(
      Math.max(1.8,d.width*.95),
      Math.max(1.2,d.height*.95)
    );

    const concreteMat=new THREE.MeshStandardMaterial({
      color:baseCol.clone().multiplyScalar(.98),
      roughness:1,
      metalness:0,
      map:concreteTex,
      bumpMap:concreteTex,
      bumpScale:d.roughnessStrength,
      roughnessMap:concreteTex
    });
    const patchConcreteMat=new THREE.MeshStandardMaterial({
      color:baseCol.clone().multiplyScalar(.93),
      roughness:1,
      metalness:0,
      map:concreteTex,
      bumpMap:concreteTex,
      bumpScale:d.roughnessStrength*.84,
      roughnessMap:concreteTex
    });
    const patchConcreteMat2=new THREE.MeshStandardMaterial({
      color:baseCol.clone().multiplyScalar(1.03),
      roughness:.99,
      metalness:0,
      map:concreteTex,
      bumpMap:concreteTex,
      bumpScale:d.roughnessStrength*.72,
      roughnessMap:concreteTex
    });
    const stainMat=new THREE.MeshStandardMaterial({
      color:baseCol.clone().multiplyScalar(.84),
      roughness:1,
      metalness:0,
      map:concreteTex,
      bumpMap:concreteTex,
      bumpScale:d.roughnessStrength*.58,
      roughnessMap:concreteTex
    });
    const lightDustMat=new THREE.MeshStandardMaterial({
      color:baseCol.clone().lerp(new THREE.Color(0xffffff),.10),
      roughness:1,
      metalness:0,
      map:concreteTex,
      bumpMap:concreteTex,
      bumpScale:d.roughnessStrength*.69,
      roughnessMap:concreteTex
    });
    const masonryMat=new THREE.MeshStandardMaterial({
      color:0x8d847a,roughness:.98,metalness:0
    });
    const mortarDark=new THREE.MeshStandardMaterial({
      color:0x514d48,roughness:1,metalness:0
    });
    const rustMat=new THREE.MeshStandardMaterial({
      color:0x7b3c25,roughness:.78,metalness:.52
    });

    // Base slab.
    addAssetBox(root,d.width,d.height,d.depth,0,d.height/2,0,concreteMat);

    const faceZ=d.depth/2+.012;

    // Large shallow render variations so the wall feels more like real concrete.
    const broadPasses=[
      {x:-.34,y:.79,w:.28,h:.11,z:.014,m:patchConcreteMat},
      {x:-.02,y:.77,w:.33,h:.10,z:.012,m:patchConcreteMat2},
      {x:.29,y:.76,w:.24,h:.09,z:.010,m:patchConcreteMat},
      {x:-.22,y:.58,w:.20,h:.08,z:.008,m:lightDustMat},
      {x:.20,y:.57,w:.27,h:.08,z:.009,m:stainMat},
      {x:-.05,y:.43,w:.41,h:.10,z:.012,m:patchConcreteMat2},
      {x:.34,y:.33,w:.18,h:.07,z:.010,m:patchConcreteMat},
      {x:-.31,y:.24,w:.22,h:.09,z:.011,m:stainMat},
      {x:.07,y:.19,w:.38,h:.12,z:.013,m:patchConcreteMat},
      {x:-.06,y:.08,w:.45,h:.11,z:.009,m:lightDustMat}
    ];
    for(const p of broadPasses){
      addAssetBox(root,d.width*p.w,d.height*p.h,p.z,d.width*p.x,d.height*p.y,faceZ+.008,p.m)
    }

    // Smaller broken-up texture chips / pockmarks.
    const microPasses=[
      {x:-.40,y:.68,w:.06,h:.022,z:.014,m:stainMat},{x:-.28,y:.70,w:.09,h:.025,z:.010,m:patchConcreteMat2},
      {x:-.11,y:.71,w:.07,h:.018,z:.009,m:lightDustMat},{x:.06,y:.69,w:.08,h:.020,z:.012,m:stainMat},
      {x:.22,y:.71,w:.05,h:.017,z:.010,m:patchConcreteMat},{x:.36,y:.67,w:.07,h:.022,z:.013,m:patchConcreteMat2},
      {x:-.36,y:.50,w:.08,h:.022,z:.009,m:patchConcreteMat},{x:-.16,y:.49,w:.05,h:.016,z:.010,m:lightDustMat},
      {x:.03,y:.51,w:.10,h:.022,z:.011,m:stainMat},{x:.28,y:.47,w:.06,h:.018,z:.010,m:patchConcreteMat2},
      {x:-.21,y:.35,w:.09,h:.020,z:.012,m:patchConcreteMat},{x:.16,y:.36,w:.08,h:.018,z:.010,m:stainMat},
      {x:-.39,y:.14,w:.07,h:.021,z:.011,m:lightDustMat},{x:-.14,y:.14,w:.06,h:.018,z:.009,m:patchConcreteMat2},
      {x:.14,y:.12,w:.07,h:.020,z:.012,m:stainMat},{x:.35,y:.13,w:.09,h:.021,z:.010,m:patchConcreteMat}
    ];
    for(const p of microPasses){
      addAssetBox(root,d.width*p.w,d.height*p.h,p.z,d.width*p.x,d.height*p.y,faceZ+.009,p.m)
    }

    // Shallow recessed scars to stop the surface looking too flat.
    const recesses=[
      {x:-.25,y:.62,w:.14,h:.05,z:.010},
      {x:.15,y:.62,w:.17,h:.04,z:.010},
      {x:-.02,y:.27,w:.21,h:.05,z:.010},
      {x:.31,y:.22,w:.11,h:.04,z:.010},
      {x:-.31,y:.10,w:.16,h:.04,z:.010}
    ];
    for(const p of recesses){
      addAssetBox(root,d.width*p.w,d.height*p.h,p.z,d.width*p.x,d.height*p.y,faceZ-.004,stainMat)
    }

    // Damage areas spread across the larger wall so the reference reads zoomed out.
    const patches=[
      {x:-.29,y:.72,w:.38,h:.23},
      {x:.28,y:.66,w:.30,h:.20},
      {x:-.12,y:.39,w:.44,h:.20},
      {x:.31,y:.30,w:.24,h:.19},
      {x:-.34,y:.18,w:.26,h:.18}
    ];

    const brickW=Math.max(.18,d.detailSize);
    const brickH=brickW*.43;

    for(const p of patches){
      const pw=d.width*p.w,ph=d.height*p.h;
      const cx=d.width*p.x,cy=d.height*p.y;

      // Recessed exposed masonry field.
      addAssetBox(root,pw,ph,.018,cx,cy,faceZ,masonryMat);

      const cols=Math.max(2,Math.floor(pw/brickW));
      const rows=Math.max(2,Math.floor(ph/brickH));
      const actualW=pw/cols,actualH=ph/rows;

      for(let r=0;r<rows;r++){
        const offset=(r%2)*actualW*.5;
        for(let c=0;c<cols;c++){
          const bx=cx-pw/2+actualW*(c+.5)+offset;
          if(bx>cx+pw/2-actualW*.18)continue;
          const by=cy-ph/2+actualH*(r+.5);
          addAssetBox(root,actualW*.88,actualH*.82,.025,bx,by,faceZ+.017,masonryMat)
        }
      }

      // Mortar split lines for more believable texture.
      for(let r=1;r<rows;r++){
        addAssetBox(root,pw*.98,.010,.012,cx,cy-ph/2+actualH*r,faceZ+.010,mortarDark)
      }

      // Horizontal + vertical rusted reinforcement.
      const barR=Math.max(.008,Math.min(.018,d.detailSize*.045));
      const hBars=Math.max(2,Math.floor(ph/(brickH*1.55)));
      for(let r=0;r<=hBars;r++){
        const yy=cy-ph/2+(ph/hBars)*r;
        const geo=new THREE.CylinderGeometry(barR,barR,pw*.98,8);
        geo.rotateZ(Math.PI/2);
        const bar=new THREE.Mesh(geo,rustMat);
        bar.position.set(cx,yy,faceZ+.05);
        root.add(bar)
      }
      const vBars=Math.max(2,Math.floor(pw/(brickW*1.65)));
      for(let c=0;c<=vBars;c++){
        const xx=cx-pw/2+(pw/vBars)*c;
        const geo=new THREE.CylinderGeometry(barR,barR,ph*.98,8);
        const bar=new THREE.Mesh(geo,rustMat);
        bar.position.set(xx,cy,faceZ+.052);
        root.add(bar)
      }

      // Chunkier irregular plaster lips around the openings.
      const edge=.055;
      addAssetBox(root,pw*.72,edge,.022,cx-pw*.08,cy+ph/2,faceZ+.031,patchConcreteMat);
      addAssetBox(root,pw*.54,edge,.022,cx+pw*.12,cy-ph/2,faceZ+.031,patchConcreteMat);
      addAssetBox(root,edge,ph*.62,.022,cx-pw/2,cy+ph*.04,faceZ+.031,patchConcreteMat);
      addAssetBox(root,edge,ph*.55,.022,cx+pw/2,cy-ph*.06,faceZ+.031,patchConcreteMat);
      addAssetBox(root,pw*.18,ph*.09,.018,cx-pw*.21,cy+ph*.08,faceZ+.028,patchConcreteMat2);
      addAssetBox(root,pw*.14,ph*.08,.018,cx+pw*.17,cy-ph*.11,faceZ+.028,stainMat);
    }

    // Extra wide render overlays to keep the damaged fields embedded in
    // a larger, more textured worn surface.
    addAssetBox(root,d.width*.28,d.height*.19,.018,-d.width*.05,d.height*.56,faceZ+.02,patchConcreteMat);
    addAssetBox(root,d.width*.24,d.height*.16,.018,d.width*.34,d.height*.48,faceZ+.02,patchConcreteMat);
    addAssetBox(root,d.width*.31,d.height*.18,.018,-d.width*.27,d.height*.30,faceZ+.02,patchConcreteMat2);
  }else if(d.kind==='cementLeaner'){}else if(d.kind==='cementLeaner'){
    const geo=smokersPrismGeometry(d.width,d.depth,d.width*.72,d.depth*.72,d.height);
    const m=new THREE.Mesh(geo,cementMat);m.castShadow=true;m.receiveShadow=true;root.add(m)
  }else if(d.kind==='woodPanelGate'){
    const vertical=d.orientation==='vertical',frame=.065;
    addAssetBox(root,d.width,frame,d.depth,0,frame/2,0,darkMat);
    addAssetBox(root,d.width,frame,d.depth,0,d.height-frame/2,0,darkMat);
    addAssetBox(root,frame,d.height,d.depth,-d.width/2+frame/2,d.height/2,0,darkMat);
    addAssetBox(root,frame,d.height,d.depth,d.width/2-frame/2,d.height/2,0,darkMat);
    const innerW=Math.max(.08,d.width-2*frame),innerH=Math.max(.08,d.height-2*frame);
    const across=vertical?innerW:innerH,count=Math.max(1,Math.ceil(across/d.detailSize)),panel=across/count,gap=.012;
    for(let i=0;i<count;i++){
      const offset=-across/2+panel*(i+.5);
      if(vertical)addAssetBox(root,Math.max(.025,panel-gap),innerH,d.depth*.72,offset,d.height/2,0,i%2?woodAlt:woodMat);
      else addAssetBox(root,innerW,Math.max(.025,panel-gap),d.depth*.72,0,d.height/2+offset,0,i%2?woodAlt:woodMat)
    }
  }else if(d.kind==='longWoodBench'){
    const slab=Math.min(.11,Math.max(.055,d.height*.18));
    addAssetBox(root,d.width,slab,d.depth,0,d.height-slab/2,0,woodMat);
    const legH=Math.max(.12,d.height-slab),legW=Math.max(.06,Math.min(.13,d.width*.08));
    const inset=Math.min(d.width*.33,.42);
    [-1,1].forEach(sx=>addAssetBox(root,legW,legH,d.depth*.72,sx*(d.width/2-inset),legH/2,0,darkMat));

    // V202 · generous invisible hit volume.
    // The real bench is deliberately thin and can be awkward to click,
    // especially from top-down / shallow camera angles. This proxy fills
    // the complete bench envelope but writes no pixels.
    const pickMat=new THREE.MeshBasicMaterial({
      color:0xffffff,
      transparent:true,
      opacity:0,
      depthWrite:false,
      colorWrite:false,
      side:THREE.DoubleSide
    });
    const pick=new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(.18,d.width),
        Math.max(.18,d.height),
        Math.max(.18,d.depth)
      ),
      pickMat
    );
    pick.position.set(0,d.height/2,0);
    pick.userData.v202SelectionProxy=true;
    pick.name='Bench Selection Volume';
    root.add(pick)
  }else if(d.kind==='fineMeshWall'){
    const frame=Math.max(.025,Math.min(.055,d.depth*1.1));
    addAssetBox(root,d.width,frame,d.depth,0,frame/2,0,blackMetal);
    addAssetBox(root,d.width,frame,d.depth,0,d.height-frame/2,0,blackMetal);
    addAssetBox(root,frame,d.height,d.depth,-d.width/2+frame/2,d.height/2,0,blackMetal);
    addAssetBox(root,frame,d.height,d.depth,d.width/2-frame/2,d.height/2,0,blackMetal);

    const spacing=Math.max(.055,d.detailSize),pts=[];
    for(let x=-d.width/2+frame;x<=d.width/2-frame+.001;x+=spacing){
      pts.push(x,frame,0,x,d.height-frame,0)
    }
    for(let y=frame;y<=d.height-frame+.001;y+=spacing){
      pts.push(-d.width/2+frame,y,0,d.width/2-frame,y,0)
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    const lm=new THREE.LineBasicMaterial({color:colour,transparent:true,opacity:.82});
    const lines=new THREE.LineSegments(geo,lm);lines.position.z=d.depth*.04;root.add(lines)
  }
  return true
}
function createSmokersAreaAssetObject(kind,opts={}){
  const g=new THREE.Group();
  g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const d=normaliseSmokersAreaData(kind,{...opts,kind});
  g.userData.assetData=d;
  g.userData.colorOverride=opts.color||d.color;
  venue.add(g);
  registerBuilderRoot(g,opts.name||smokersAreaDefaultName(kind),'fixtureAsset',opts.id);
  rebuildSmokersAreaAssetObject(g);
  return g
}

function createVenueAssetByType(type,asset,opts={}){
  let k=asset&&asset.kind;
  // V187 legacy repair: V186 could serialize the new amp/wedge objects
  // through the fixture fallback as toilets. Recover by their explicit names.
  const repairName=String(opts?.name||'').toLowerCase();
  if(type==='fixtureAsset'&&(k==='toilet'||!k)){
    if(repairName.includes('guitar amp'))k='guitarAmpStack';
    else if(repairName.includes('bass amp'))k='bassAmpStack';
    else if(repairName.includes('wedge')||repairName.includes('floor monitor'))k='wedgeMonitor';
  }
  if(type==='furniture')return createFurnitureObject(k||'longCouch',opts);
  if(type==='artwork'){
    if(k==='spaceshipPorthole')return createSpaceshipPortholeObject(opts);
    if(k==='mothershipPortal')return createMothershipPortalObject({...opts,...asset});
    if(k==='robot')return createRobotObject(opts);
    return createArtworkPanelObject(k||'spaceship',{...opts,...asset})
  }
  if(type==='plantAsset'){if(k==='plantWall')return createPlantWallObject({...opts,...asset});if(k==='gridWall')return createGridWallObject({...opts,...asset});return createTallPlantObject({...opts,...asset})}
  if(type==='sunsetLamp')return createSunsetLampObject(opts);
  if(type==='barAsset'){if(k==='bottleRow')return createBottleRowObject(opts);if(k==='upperShelves'||k==='lowerShelves')return createBarShelfSetObject(k,opts);return createLagerTapObject(opts)}
  if(type==='fixtureAsset'){
    if(isSmokersAreaAssetKind(k))return createSmokersAreaAssetObject(k,{...opts,...asset,color:opts.color||asset.color});
    if(k==='doorFrame')return createDoorObject({...opts,...asset});if(k==='door')return createDoorObject({...opts,...asset});
    if(k==='djBooth')return createDjBoothObject({...opts,...asset});
    if(k==='djBoothSideTable')return createDjBoothSideTableObject({...opts,...asset});
    if(k==='djBoothMonitor')return createDjBoothMonitorObject({...opts,...asset});
    if(k==='djBoothSideSpeaker')return createDjBoothSideSpeakerObject({...opts,...asset});
    if(k==='soundConsole')return createSoundConsoleObject({...opts,...asset});
    if(k==='lightingConsole')return createLightingConsoleObject({...opts,...asset});
    if(k==='wallMirror')return createWallMirrorObject({...opts,...asset});
    if(k==='wallPole')return createWallPoleObject({...opts,...asset});
    if(k==='ceilingLightPole')return createCeilingLightPoleObject({...opts,...asset});
    if(k==='neonSkullLightBox')return createNeonSkullLightBoxObject({...opts,...asset});
    if(k==='neonRingPlantPanel')return createNeonRingPlantPanelObject({...opts,...asset});
    if(k==='customStair')return createCustomStairObject({...opts,...asset});
    if(k==='counterBarFridge')return createCounterBarFridgeObject({...opts,...asset});
    if(['visualLaptop','laptopScreen','guitar','bassGuitar','drumKit','micStand','guitarAmpStack','bassAmpStack','wedgeMonitor'].includes(k)){
      const fixedAsset={...(asset||{}),kind:k};
      return createStagePropObject(k,{...opts,...fixedAsset});
    }
    if(k==='stageFrontSubs')return createStageFrontSubsObject({...opts,...asset});
    if(k==='sinkPair')return createSinkPairObject({...opts,...asset});
    if(k==='doubleSinkCounter')return createDoubleSinkCounterObject({...opts,...asset});
    if(k==='handrail')return createHandrailObject({...opts,...asset});
    if(k==='acUnit')return createAcUnitObject({...opts,...asset});
    if(k==='speakerSub')return createSpeakerSubObject({...opts,...asset});
    if(k==='speakerTop')return createSpeakerTopObject({...opts,...asset});
    if(k==='speakerStack')return createSpeakerStackObject({...opts,...asset});
    if(k==='ledBatten')return createLedBattenObject({...opts,...asset});
    if(k==='ledPar')return createLedParObject({...opts,...asset});
    if(k==='blinderPar')return createBlinderParObject({...opts,...asset});
    if(k==='intimidator')return createIntimidatorFixtureObject({...opts,...asset});
    if(k==='movingMirrorScanner')return createMovingMirrorScannerObject({...opts,...asset});
    if(k==='hazerDF50')return createHazerDF50Object({...opts,...asset});
    if(k==='warmParCan')return createWarmParCanObject({...opts,...asset});
    if(k==='strobeFixture')return createStrobeFixtureObject({...opts,...asset});
    if(k==='downlightFixture')return createDownlightFixtureObject({...opts,...asset});
    if(k==='sunsetProjector')return createSunsetProjectorObject({...opts,...asset});
    if(k==='ceilingTubeLight')return createCeilingTubeLightObject({...opts,...asset});
    if(k==='rectShape')return createRectShapeObject(opts);
    // Never silently coerce known stage-equipment names into a toilet.
    if(repairName.includes('guitar amp'))return createStagePropObject('guitarAmpStack',{...opts,...(asset||{}),kind:'guitarAmpStack'});
    if(repairName.includes('bass amp'))return createStagePropObject('bassAmpStack',{...opts,...(asset||{}),kind:'bassAmpStack'});
    if(repairName.includes('wedge')||repairName.includes('floor monitor'))return createStagePropObject('wedgeMonitor',{...opts,...(asset||{}),kind:'wedgeMonitor'});
    return createToiletObject({...opts,...(asset||{})})
  }
  return null
}


function isStageRoot(o){if(!o||!o.userData)return false;const type=o.userData.builderType||'',name=String(o.userData.editName||o.name||'').toLowerCase(),item=String(o.userData.buildItem||'').toLowerCase();if(type==='solidPolygon'&&o.userData.solidData&&o.userData.solidData.role==='stage')return true;if(type==='staticPointSolid'&&o.userData.staticSolidEdit&&o.userData.staticSolidEdit.role==='stage')return true;if(type==='platform'&&(name.includes('stage')||item==='stage'))return true;if(type==='platformBox'&&(name.includes('stage')||item==='stage'))return true;return false}
function isStageFrontSubsRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='stageFrontSubs'}
function normaliseStageFrontSubsData(raw={}){const d=raw||{};d.kind='stageFrontSubs';d.totalLength=Math.max(.4,+d.totalLength||3.6);d.depth=Math.max(.15,+d.depth||.82);d.height=Math.max(.08,+d.height||.62);d.count=Math.max(1,Math.min(12,Math.round(+d.count||Math.max(1,Math.round(d.totalLength/1.15)))));d.gap=Math.max(0,Math.min(.08,+d.gap||.02));d.stageId=d.stageId||'';d.frontEdgeIndex=Number.isFinite(+d.frontEdgeIndex)?+d.frontEdgeIndex:0;return d}
function stageForFrontSubs(root=selectedEdit){if(isStageRoot(root))return root;if(isStageFrontSubsRoot(root)){const id=root.userData.assetData&&root.userData.assetData.stageId;const found=[...builderObjects,...editorRoots].find(o=>isStageRoot(o)&&o.userData&&o.userData.editId===id);if(found)return found}const candidates=[...builderObjects,...editorRoots].filter((o,i,a)=>o&&a.indexOf(o)===i&&o.visible!==false&&isStageRoot(o));if(!candidates.length)return null;const exact=candidates.find(o=>String(o.userData.editName||o.name||'').toLowerCase().startsWith('stage'));return exact||candidates[0]}
function stageFrontEdgeLocal(stage){const data=stage&&stage.userData&&(stage.userData.solidData||stage.userData.staticSolidEdit||stage.userData.platformData);let pts=data&&data.points;if((!pts||pts.length<2)&&stage&&stage.userData&&stage.userData.builderType==='platformBox'){const b=new THREE.Box3().setFromObject(stage),s=new THREE.Vector3();b.getSize(s);pts=presetPlatformPoints('rect',Math.max(.2,s.x),Math.max(.2,s.z))}if(!pts||pts.length<2)return null;let cx=0,cz=0;pts.forEach(p=>{cx+=+p[0]||0;cz+=+p[1]||0});cx/=pts.length;cz/=pts.length;let best=null;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],dx=(+b[0]||0)-(+a[0]||0),dz=(+b[1]||0)-(+a[1]||0),len=Math.hypot(dx,dz);if(len<.05)continue;const mid=[((+a[0]||0)+(+b[0]||0))/2,((+a[1]||0)+(+b[1]||0))/2];if(!best||mid[1]>best.mid[1])best={index:i,a:[+a[0]||0,+a[1]||0],b:[+b[0]||0,+b[1]||0],mid,length:len}}if(!best)return null;const dir=[(best.b[0]-best.a[0])/best.length,(best.b[1]-best.a[1])/best.length];let outward=[dir[1],-dir[0]];const toMid=[best.mid[0]-cx,best.mid[1]-cz],mag=Math.hypot(toMid[0],toMid[1])||1,unit=[toMid[0]/mag,toMid[1]/mag];if(outward[0]*unit[0]+outward[1]*unit[1]<0)outward=[-outward[0],-outward[1]];best.dir=dir;best.outward=outward;return best}
function rebuildStageFrontSubsObject(g){if(!isStageFrontSubsRoot(g))return;const d=normaliseStageFrontSubsData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const bodyMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x08090b,roughness:.86,metalness:.05}),grilleMat=new THREE.MeshStandardMaterial({color:0x11151b,roughness:.6,metalness:.12}),edgeMat=new THREE.MeshStandardMaterial({color:0x040506,roughness:.9,metalness:.08});const gap=Math.min(d.gap,Math.max(0,(d.totalLength-.25)/Math.max(1,d.count-1||1)));const cabW=Math.max(.28,(d.totalLength-gap*Math.max(0,d.count-1))/d.count);for(let i=0;i<d.count;i++){const x=-d.totalLength/2+cabW/2+i*(cabW+gap);addSpeakerCabinet(g,cabW,d.height,d.depth,x,d.height/2,-d.depth/2,bodyMat,grilleMat,edgeMat)}g.updateMatrixWorld(true)}
function createStageFrontSubsObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseStageFrontSubsData({totalLength:opts.totalLength,depth:opts.depth,height:opts.height,count:opts.count,gap:opts.gap,stageId:opts.stageId,frontEdgeIndex:opts.frontEdgeIndex});g.userData.colorOverride=opts.color||'#08090b';venue.add(g);registerBuilderRoot(g,opts.name||'Stage Front Subs','fixtureAsset',opts.id);rebuildStageFrontSubsObject(g);return g}
function findStageFrontSubsForStage(stage){if(!isStageRoot(stage))return null;const id=stage.userData&&stage.userData.editId;return builderObjects.find(o=>isStageFrontSubsRoot(o)&&o.userData&&o.userData.assetData&&o.userData.assetData.stageId===id&&o.visible!==false)||null}
function fitStageFrontSubsToStage(stage,subs){const edge=stageFrontEdgeLocal(stage);if(!edge||!subs)return false;let stageH=((stage.userData.solidData&&stage.userData.solidData.height)||(stage.userData.staticSolidEdit&&stage.userData.staticSolidEdit.height)||(stage.userData.platformData&&stage.userData.platformData.height)||0)*Math.max(Math.abs(stage.scale.y||1),.001);if(!stageH||stageH<.02){const bb=new THREE.Box3().setFromObject(stage),ss=new THREE.Vector3();bb.getSize(ss);stageH=Math.max(.08,ss.y||.62)}const d=normaliseStageFrontSubsData(subs.userData.assetData);d.stageId=stage.userData.editId;d.totalLength=edge.length;d.height=stageH;d.count=Math.max(1,Math.min(12,Math.round(d.totalLength/1.15)));d.frontEdgeIndex=edge.index;subs.userData.assetData=d;rebuildStageFrontSubsObject(subs);const localOrigin=new THREE.Vector3(edge.mid[0]+edge.outward[0]*.01,0,edge.mid[1]+edge.outward[1]*.01);const worldOrigin=stage.localToWorld(localOrigin.clone());subs.position.copy(worldOrigin);subs.position.y=stage.position.y;subs.quaternion.copy(stage.quaternion);subs.rotateY(Math.atan2(edge.dir[1],edge.dir[0]));subs.updateMatrixWorld(true);if(stage.userData.buildPhase!=null){subs.userData.buildPhase=stage.userData.buildPhase;subs.userData.buildCategory=stage.userData.buildCategory||'';subs.userData.phaseLocked=!!stage.userData.phaseLocked;if(typeof applyPhaseVisibilityToObject==='function')applyPhaseVisibilityToObject(subs)}return true}
function addOrRebuildStageFrontSubs(root=selectedEdit,announce=true){const stage=stageForFrontSubs(root);if(!stage){if(announce)flashEditor('No stage object found');return null}let subs=findStageFrontSubsForStage(stage);if(!subs)subs=createStageFrontSubsObject({name:'Stage Front Subs',stageId:stage.userData.editId,height:(stage.userData.solidData&&stage.userData.solidData.height)||(stage.userData.platformData&&stage.userData.platformData.height)||.62});if(!fitStageFrontSubsToStage(stage,subs)){if(announce)flashEditor('Could not read the stage front edge');return null}selectEdit(subs);updateSelectionBox();saveLocalEditState(false);syncAdvancedFields();if(announce)flashEditor('Stage front subs fitted flush across the full front edge');return subs}
function removeStageFrontSubs(root=selectedEdit){if(isStageFrontSubsRoot(root)){pushHistory();removeDynamicRoot(root);deselectEdit();saveLocalEditState(false);syncAdvancedFields();flashEditor('Stage front subs removed');return true}const stage=stageForFrontSubs(root);if(!stage){flashEditor('Select the stage first');return false}const subs=findStageFrontSubsForStage(stage);if(!subs){flashEditor('No stage front subs are attached to this stage');return false}pushHistory();removeDynamicRoot(subs);if(selectedEdit===subs)deselectEdit();saveLocalEditState(false);syncAdvancedFields();flashEditor('Stage front subs removed');return true}
function syncStageFrontSubsUI(){const box=document.getElementById('stageFrontSubsBox');if(!box)return;box.style.display='block';const stage=stageForFrontSubs(selectedEdit),status=document.getElementById('stageFrontSubsStatus'),add=document.getElementById('addStageFrontSubs'),remove=document.getElementById('removeStageFrontSubs');if(!stage){if(status)status.textContent='NO STAGE FOUND';if(add)add.disabled=true;if(remove)remove.disabled=true;return}const existing=findStageFrontSubsForStage(stage);if(status)status.textContent=existing?'ATTACHED · REBUILD READY':'STAGE FOUND · READY';if(add)add.disabled=false;if(remove)remove.disabled=!existing}

function createCurtainRailObject(opts={}){const g=new THREE.Group(),ceilingY=ceilingMountReferenceY(),topY=Math.max(2.10,Number.isFinite(+opts.topY)?+opts.topY:ceilingY-.02),drop=Math.max(.55,+opts.height||(topY-mainFloorLevel())),w=Math.max(.6,+opts.width||3.0),d={kind:'curtainRail',topY,height:drop,width:w,drapesVisible:opts.drapesVisible!==false};g.position.set(opts.x??target.x,Math.max(mainFloorLevel(),topY-drop),opts.z??target.z);g.userData.assetData=d;const railMat=new THREE.MeshStandardMaterial({color:0x15171b,metalness:.65,roughness:.28});const fabricMat=new THREE.MeshStandardMaterial({color:0x101116,roughness:1,metalness:0,side:THREE.DoubleSide});const rail=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,w,10),railMat);rail.rotation.z=Math.PI/2;rail.position.set(0,drop-.025,0);rail.castShadow=true;rail.receiveShadow=true;g.add(rail);const mountCount=Math.max(2,Math.round(w/1.2));for(let m=0;m<mountCount;m++){const x=-w/2+(m/Math.max(1,mountCount-1))*w,stem=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.05,8),railMat);stem.position.set(x,drop-.005,0);g.add(stem)}const panelH=Math.max(.35,drop-.055),fabric=createGatheredCurtainMesh(w,panelH,fabricMat,{pleatSpacing:.17,amplitude:.052,phase:.25});fabric.position.set(0,panelH/2,-.005);fabric.userData.curtainFabric=true;fabric.visible=curtainPreview&&d.drapesVisible!==false;g.add(fabric);const header=new THREE.Mesh(new THREE.BoxGeometry(w,.045,.035),fabricMat.clone());header.position.set(0,panelH-.022,-.002);header.userData.curtainFabric=true;header.visible=curtainPreview&&d.drapesVisible!==false;header.castShadow=true;header.receiveShadow=true;g.add(header);venue.add(g);registerBuilderRoot(g,opts.name||'Curtain Rail','curtainRail',opts.id);snapRootToCeiling(g,false);updateCurtainPreview();return g}
function createFeatureBlockObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,0,opts.z??target.z);box(.7,2.7,.35,0,1.35,0,new THREE.MeshStandardMaterial({color:opts.color||0x181b20,roughness:.82}),g);venue.add(g);registerBuilderRoot(g,opts.name||'Venue Block','featureBlock',opts.id);if(opts.color)setObjectColour(g,opts.color);return g}
const visualLoopTextures=[];let visualLoopMode='cycle',visualLoopLastUpload=0,visualLoopLastCycle=0,visualLoopCycleOffset=0;
function visualLoopTexture(index){index=Math.max(0,Math.min(VISUAL_LOOP_ASSETS.length-1,+index||0));if(visualLoopTextures[index])return visualLoopTextures[index];const img=new Image(),tex=new THREE.Texture(img);tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;tex.encoding=THREE.sRGBEncoding;img.onload=()=>{tex.needsUpdate=true;markRenderDirty(400)};img.src=VISUAL_LOOP_ASSETS[index].src;visualLoopTextures[index]=tex;return tex}
function applyVisualLoopToScreen(root,index){if(!root||root.userData.builderType!=='ledScreen')return;index=Math.max(0,Math.min(VISUAL_LOOP_ASSETS.length-1,+index||0));root.userData.visualLoopIndex=index;root.traverse(o=>{if(o.userData&&o.userData.visualScreenFace&&o.material){o.material.map=visualLoopTexture(index);o.material.color.set(0xffffff);if(o.material.emissive)o.material.emissive.set(0xffffff);o.material.emissiveIntensity=.62;o.material.needsUpdate=true}})}
function applyVisualLoopSelection(value='cycle'){visualLoopMode=String(value);const screens=builderObjects.filter(o=>o&&o.userData&&o.userData.builderType==='ledScreen');screens.forEach((root,i)=>applyVisualLoopToScreen(root,visualLoopMode==='cycle'?(i+visualLoopCycleOffset)%VISUAL_LOOP_ASSETS.length:+visualLoopMode||0));markRenderDirty(400)}
function updateVisualLoopTextures(now){
  // V172: these bundled LED assets are static images. Re-uploading them to the GPU
  // every 95 ms caused a large amount of unnecessary work and visible input lag.
  if(visualLoopMode==='cycle'&&now-visualLoopLastCycle>7000){
    visualLoopCycleOffset=(visualLoopCycleOffset+1)%VISUAL_LOOP_ASSETS.length;
    applyVisualLoopSelection('cycle');visualLoopLastCycle=now;return true
  }
  return false
}
function createLedScreenObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,0,opts.z??target.z);box(2.7,1.55,.12,0,1.45,0,new THREE.MeshStandardMaterial({color:0x101217,roughness:.4,metalness:.28}),g);const idx=Number.isFinite(+opts.visualLoopIndex)?+opts.visualLoopIndex:(builderObjects.filter(o=>o&&o.userData&&o.userData.builderType==='ledScreen').length%VISUAL_LOOP_ASSETS.length);const face=new THREE.Mesh(new THREE.PlaneGeometry(2.45,1.32),new THREE.MeshStandardMaterial({color:0xffffff,map:visualLoopTexture(idx),emissive:0xffffff,emissiveIntensity:.62,roughness:.22,metalness:.02,toneMapped:false}));face.position.set(0,1.45,.071);face.userData.visualScreenFace=true;face.userData.keepTextureColour=true;g.add(face);g.userData.visualLoopIndex=idx;venue.add(g);registerBuilderRoot(g,opts.name||'LED Screen','ledScreen',opts.id);return g}
function createShelfArtObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,0,opts.z??target.z);box(2.9,1.8,.1,0,1.45,0,new THREE.MeshStandardMaterial({color:0x06080d,roughness:.88}),g);[-.45,.1,.65].forEach((yy,i)=>{box(2.15,.045,.18,0,1.1+yy,.08,MAT.black,g);box(2.05,.015,.05,0,1.06+yy,.15,new THREE.MeshStandardMaterial({color:i===1?0x4268ff:0xff2e83,emissive:i===1?0x4268ff:0xff2e83,emissiveIntensity:1.1,roughness:.25}),g)});const art=new THREE.Mesh(new THREE.PlaneGeometry(.82,.82),new THREE.MeshBasicMaterial({map:textTexture('ART / CIRCLE','#39d9f9',512,256),transparent:true,toneMapped:false}));art.position.set(0,1.52,.12);g.add(art);venue.add(g);registerBuilderRoot(g,opts.name||'Shelf / Artwork','shelfArt',opts.id);if(opts.color)setObjectColour(g,opts.color);return g}
function createRefPinObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,0,opts.z??target.z);cyl(.11,.07,0,.035,0,new THREE.MeshStandardMaterial({color:0xff2e83,emissive:0xff2e83,emissiveIntensity:1.1}),g,10);cyl(.03,.55,0,.315,0,new THREE.MeshStandardMaterial({color:0xf3f4f7,emissive:0x39d9f9,emissiveIntensity:.45}),g,8);const cap=new THREE.Mesh(new THREE.SphereGeometry(.08,12,10),new THREE.MeshStandardMaterial({color:0x39d9f9,emissive:0x39d9f9,emissiveIntensity:1.3}));cap.position.set(0,.64,0);g.add(cap);venue.add(g);registerBuilderRoot(g,opts.name||'Reference Pin','refPin',opts.id);return g}

function captureBuilderObject(o){const t=transformState(o);if(isLoadingRampLayerObject(o)&&o.userData.loadingRampBaseVisible!==undefined)t.v=o.userData.loadingRampBaseVisible!==false;const type=o.userData.builderType,base={id:o.userData.editId,name:o.userData.editName,type,color:extractObjectColour(o),finish:o.userData.surfaceFinish||'',locked:!!o.userData.lockedBase,phase:phaseForObject(o),category:o.userData.buildCategory||'',buildItem:o.userData.buildItem||'',phaseLocked:!!o.userData.phaseLocked,group:o.userData.groupId||'',viewLayer:o.userData.viewLayer||'',eventLayoutMember:!!o.userData.v184EventLayoutMember,eventTypes:Array.isArray(o.userData.v185EventTypes)?o.userData.v185EventTypes.slice():[],interactive:o.userData.interactive===true,highlightOnHover:o.userData.highlightOnHover===true,highlightStyle:o.userData.highlightStyle||'outline',clickAction:o.userData.clickAction||'none',clickTarget:o.userData.clickTarget||'',...t};if(type==='wall'){const p=o.geometry.parameters;base.base={length:+p.width||1,height:+p.height||2.58,width:+p.depth||.18}}else if(type==='curvedWall')base.curve=JSON.parse(JSON.stringify(o.userData.curveData));else if(type==='polyWall')base.polyWall=JSON.parse(JSON.stringify(o.userData.polyWallData));else if(type==='platform')base.platform=JSON.parse(JSON.stringify(o.userData.platformData));else if(type==='solidPolygon')base.solid=JSON.parse(JSON.stringify(o.userData.solidData));else if(type==='barLeaner')base.leaner=JSON.parse(JSON.stringify(o.userData.leanerData));else if(type==='pillar')base.pillar=JSON.parse(JSON.stringify(o.userData.pillarData));else if(type==='steps')base.steps=JSON.parse(JSON.stringify(o.userData.stepsData));else if(type==='ramp')base.ramp=JSON.parse(JSON.stringify(o.userData.rampData));else if(type==='rampPath')base.rampPath=JSON.parse(JSON.stringify(o.userData.rampPathData));else if(type==='ledStrip')base.led=JSON.parse(JSON.stringify(o.userData.ledData));else if(type==='ledStripPath')base.ledPath=JSON.parse(JSON.stringify(o.userData.ledPathData));if(o.userData.assetData)base.asset=JSON.parse(JSON.stringify(o.userData.assetData));if(type==='ledScreen')base.visualLoopIndex=Number.isFinite(+o.userData.visualLoopIndex)?+o.userData.visualLoopIndex:0;return base}
function ensureReferenceData(obj){if(!obj)return null;if(!obj.userData.referenceData)obj.userData.referenceData={title:'',kind:'general',notes:'',photos:[]};if(!Array.isArray(obj.userData.referenceData.photos))obj.userData.referenceData.photos=[];return obj.userData.referenceData}
function captureReferenceState(){const state={};editorRoots.forEach(o=>{const r=o.userData.referenceData;if(r&&(r.title||r.notes||r.kind!=='general'||(r.photos&&r.photos.length)))state[o.userData.editId]=JSON.parse(JSON.stringify(r))});return state}
function applyReferenceState(state){editorRoots.forEach(o=>delete o.userData.referenceData);Object.entries(state||{}).forEach(([id,r])=>{const o=objectByEditId(id);if(o)o.userData.referenceData=JSON.parse(JSON.stringify(r))});syncReferencePanel()}
function selectedHasReferenceTarget(){return !activeGroupId&&!multiSelection.length&&!!selectedEdit&&selectedEdit!==traceGroup}
function syncReferencePanel(){const status=document.getElementById('refStatus'),label=document.getElementById('refLabel'),kind=document.getElementById('refType'),notes=document.getElementById('refNotes'),clearBtn=document.getElementById('refClear');if(!status||!label||!kind||!notes)return;const enabled=selectedHasReferenceTarget();referenceUIBusy=true;[label,kind,notes,document.getElementById('refUpload'),clearBtn].forEach(el=>{if(el)el.disabled=!enabled});if(!enabled){status.textContent='SELECT AN AREA';label.value='';kind.value='general';notes.value='';renderReferenceThumbs(null);referenceUIBusy=false;return}const ref=ensureReferenceData(selectedEdit);status.textContent=selectedEdit.userData.editName||'SELECTED';label.value=ref.title||'';kind.value=ref.kind||'general';notes.value=ref.notes||'';renderReferenceThumbs(ref);referenceUIBusy=false}
function renderReferenceThumbs(ref){const wrap=document.getElementById('refThumbs');if(!wrap)return;wrap.innerHTML='';if(!ref||!ref.photos||!ref.photos.length){wrap.innerHTML='<div class="ref-empty">No area photos attached yet.</div>';return}ref.photos.forEach((src,i)=>{const item=document.createElement('div');item.className='ref-thumb';const img=document.createElement('img');img.src=src;img.alt='Reference '+(i+1);const btn=document.createElement('button');btn.type='button';btn.textContent='×';btn.onclick=()=>{if(!selectedHasReferenceTarget())return;pushHistory();const data=ensureReferenceData(selectedEdit);data.photos.splice(i,1);renderReferenceThumbs(data);saveLocalEditState(false)};item.append(img,btn);wrap.appendChild(item)})}
async function addReferenceFiles(files){if(!selectedHasReferenceTarget()){flashEditor('Select or place an area first');return}pushHistory();const ref=ensureReferenceData(selectedEdit);for(const file of files){const data=await compressTraceFile(file);ref.photos.push(data)}renderReferenceThumbs(ref);saveLocalEditState(false)}
function updateSelectedReferenceFields(){if(referenceUIBusy||!selectedHasReferenceTarget())return;const ref=ensureReferenceData(selectedEdit);ref.title=document.getElementById('refLabel').value.trim();ref.kind=document.getElementById('refType').value;ref.notes=document.getElementById('refNotes').value;saveLocalEditState(false)}
function clearSelectedReferences(){if(!selectedHasReferenceTarget()){flashEditor('Select an area first');return}pushHistory();delete selectedEdit.userData.referenceData;syncReferencePanel();saveLocalEditState(false)}
let venueCalibration={roomCeiling:2.58,beamDance:2.24,raisedCeiling:2.34,raisedBeam:1.91,stageCeiling:2.20,stageBeam:1.68,stageWidth:5.44,stageDepth:4.90,locked:false,verticalMode:'review',assumption:'sameBeam'};
let venueMeasureMode=null,venueMeasurePoints=[];
function calibrationInputNumber(id,fallback){const el=document.getElementById(id),v=el?+el.value:NaN;return Number.isFinite(v)?v:fallback}
function readVenueCalibrationInputs(){venueCalibration.roomCeiling=calibrationInputNumber('calRoomCeiling',2.58);venueCalibration.beamDance=calibrationInputNumber('calBeamDance',2.24);venueCalibration.raisedCeiling=calibrationInputNumber('calRaisedCeiling',2.34);venueCalibration.raisedBeam=calibrationInputNumber('calRaisedBeam',1.91);venueCalibration.stageCeiling=calibrationInputNumber('calStageCeiling',2.20);venueCalibration.stageBeam=calibrationInputNumber('calStageBeam',1.68);venueCalibration.stageWidth=calibrationInputNumber('calStageWidth',5.44);venueCalibration.stageDepth=calibrationInputNumber('calStageDepth',4.90);return venueCalibration}
function captureVenueCalibrationState(){readVenueCalibrationInputs();return {...venueCalibration}}
function applyVenueCalibrationState(s={},save=false){venueCalibration={...venueCalibration,...(s||{})};[['calRoomCeiling','roomCeiling'],['calBeamDance','beamDance'],['calRaisedCeiling','raisedCeiling'],['calRaisedBeam','raisedBeam'],['calStageCeiling','stageCeiling'],['calStageBeam','stageBeam'],['calStageWidth','stageWidth'],['calStageDepth','stageDepth']].forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.value=(+venueCalibration[k]).toFixed(2)});syncVenueCalibrationUI();if(save)saveLocalEditState(false)}
function venueCalibrationDerived(){const d=readVenueCalibrationInputs(),raisedFromCeiling=d.roomCeiling-d.raisedCeiling,raisedFromBeam=d.beamDance-d.raisedBeam,stageFromCeiling=d.roomCeiling-d.stageCeiling,stageFromBeam=d.beamDance-d.stageBeam,beamDrop=d.roomCeiling-d.beamDance,expectedRaisedCeiling=d.roomCeiling-raisedFromBeam,expectedStageCeiling=d.roomCeiling-stageFromBeam,raisedCeilingError=d.raisedCeiling-expectedRaisedCeiling,stageCeilingError=d.stageCeiling-expectedStageCeiling;return {...d,raisedFromCeiling,raisedFromBeam,stageFromCeiling,stageFromBeam,beamDrop,expectedRaisedCeiling,expectedStageCeiling,raisedCeilingError,stageCeilingError,raisedDiff:Math.abs(raisedFromCeiling-raisedFromBeam),stageDiff:Math.abs(stageFromCeiling-stageFromBeam)}}
function calibrationPlanFactors(){const d=readVenueCalibrationInputs(),sourceDepth=(545-105)/REF.sx,sourceWidth=(1095-612)/REF.sz;return {x:d.stageDepth/sourceDepth,z:d.stageWidth/sourceWidth,sourceDepth,sourceWidth}}
function syncVenueCalibrationUI(){const d=venueCalibrationDerived(),box=document.getElementById('venueCalibrationBox'),status=document.getElementById('calibrationStatus'),out=document.getElementById('calibrationDerived'),scale=document.getElementById('calibrationScaleReadout'),f=calibrationPlanFactors();if(box)box.classList.toggle('locked',!!venueCalibration.locked);if(status){const conflict=d.raisedDiff>.03||d.stageDiff>.03;status.className='calibration-status '+(conflict?'warn':'good');if(venueCalibration.locked)status.textContent='RATIO LOCKED';else status.textContent=conflict?'SAME-BEAM MISMATCH':'CONFIRMED'}if(out){const raisedClass=Math.abs(d.raisedCeilingError)>.03?'bad':'',stageClass=Math.abs(d.stageCeilingError)>.03?'bad':'',signR=d.raisedCeilingError>=0?'+':'',signS=d.stageCeilingError>=0?'+':'';out.innerHTML='<b>CONFIRMED STRUCTURAL SET</b><br>Room ceiling = '+d.roomCeiling.toFixed(2)+' m · Beam underside = '+d.beamDance.toFixed(2)+' m · Beam drop = <b>'+d.beamDrop.toFixed(2)+' m</b><br><b>AUTHORITATIVE FLOOR HEIGHTS · from same-beam readings</b><br>Raised lounge = <b>'+d.raisedFromBeam.toFixed(2)+' m</b> · Stage = <b>'+d.stageFromBeam.toFixed(2)+' m</b><br><b>IMPLIED CLEARANCE TO ROOM CEILING</b><br>Raised → ceiling should be <b>'+d.expectedRaisedCeiling.toFixed(2)+' m</b> · Stage → ceiling should be <b>'+d.expectedStageCeiling.toFixed(2)+' m</b><br><span class="'+raisedClass+'">Entered raised→ceiling = '+d.raisedCeiling.toFixed(2)+' m (difference '+signR+d.raisedCeilingError.toFixed(2)+' m)</span><br><span class="'+stageClass+'">Entered stage→ceiling = '+d.stageCeiling.toFixed(2)+' m (difference '+signS+d.stageCeilingError.toFixed(2)+' m)</span><br><span class="warn">Because all measurements were confirmed from the same structural beam level, the beam-based heights are the correct set to lock into the model. The ceiling-clearance inputs now serve as a discrepancy check only.</span>'}if(scale)scale.innerHTML='Current traced stage reference ≈ <b>'+f.sourceWidth.toFixed(2)+' m wide × '+f.sourceDepth.toFixed(2)+' m deep</b>.<br>Target = <b>'+d.stageWidth.toFixed(2)+' × '+d.stageDepth.toFixed(2)+' m</b> · measurement correction X ×'+f.x.toFixed(4)+' · Z ×'+f.z.toFixed(4)+' ('+((f.x-1)*100).toFixed(1)+'% / '+((f.z-1)*100).toFixed(1)+'%).';[['calRoomCeiling'],['calBeamDance'],['calRaisedCeiling'],['calRaisedBeam'],['calStageCeiling'],['calStageBeam'],['calStageWidth'],['calStageDepth']].forEach(([id])=>{const e=document.getElementById(id);if(e)e.disabled=!!venueCalibration.locked});const lock=document.getElementById('lockVenueCalibration'),unlock=document.getElementById('unlockVenueCalibration');if(lock){lock.classList.toggle('active',!!venueCalibration.locked);lock.textContent=venueCalibration.locked?'RATIO LOCKED':'LOCK RATIO'}if(unlock)unlock.disabled=!venueCalibration.locked}
function calibrationStageRoot(){return builderObjects.find(o=>o&&o.userData&&o.userData.builderType==='platform'&&String(o.userData.editName||'').toLowerCase().includes('stage · editable'))||builderObjects.find(o=>o&&o.userData&&o.userData.builderType==='platform'&&String(o.userData.editName||'').toLowerCase()==='stage')||null}
function calibrationRaisedRoots(){return builderObjects.filter(o=>o&&o.userData&&o.userData.builderType==='platform'&&['left raised platform custom','railings'].includes(String(o.userData.editName||'').toLowerCase()))}
function calibrationRaisedRoot(){return calibrationRaisedRoots()[0]||builderObjects.find(o=>o&&o.userData&&o.userData.builderType==='platform'&&String(o.userData.editName||'').toLowerCase().includes('raised'))||null}
function setCalibrationPlatformHeight(root,h){if(!root||!root.userData||!root.userData.platformData)return false;root.scale.y=1;root.userData.platformData.height=Math.max(.01,h);root.position.y=mainFloorLevel();rebuildPlatform(root);root.updateMatrixWorld(true);return true}
function applySafeFrameCalibration(){const d=venueCalibrationDerived();pushHistory();let wallCount=0,beamCount=0,pillarCount=0;builderObjects.forEach(o=>{if(!o||!o.userData)return;if(o.userData.builderType==='polyWall'&&o.userData.polyWallData&&o.userData.polyWallData.style!=='curtain'&&o.userData.polyWallData.height>=2.30){o.scale.y=1;o.userData.polyWallData.height=d.roomCeiling;rebuildPolylineWall(o);wallCount++}else if(o.userData.builderType==='curvedWall'&&o.userData.curveData&&o.userData.curveData.height>=2.30){o.scale.y=1;o.userData.curveData.height=d.roomCeiling;rebuildCurvedWall(o);wallCount++}else if(o.userData.builderType==='wall'&&o.geometry&&o.geometry.parameters&&(+o.geometry.parameters.height||0)>=2.30){const gp=o.geometry.parameters,sy=Math.abs(o.scale.y||1),bottom=o.position.y-(+gp.height||2.55)*sy/2;o.scale.y=1;if(o.geometry)o.geometry.dispose();o.geometry=new THREE.BoxGeometry(+gp.width||1,d.roomCeiling,+gp.depth||.18);o.position.y=bottom+d.roomCeiling/2;wallCount++}if(o.userData.builderType==='solidPolygon'&&o.userData.solidData&&o.userData.solidData.role==='ceilingBeam'){o.scale.y=1;o.userData.solidData.height=d.beamDrop;o.position.y=d.beamDance;rebuildSolidPolygon(o);beamCount++}if(o.userData.builderType==='pillar'&&o.userData.buildPhase===1&&o.userData.pillarData&&o.userData.pillarData.height>=2.30){const pd=o.userData.pillarData;o.scale.y=1;pd.height=d.roomCeiling;if(o.geometry)o.geometry.dispose();o.geometry=pillarGeometry(pd.shape||'rect',pd.width||.62,pd.depth||.62,pd.height);o.position.y=d.roomCeiling/2;pillarCount++}});venueCalibration.verticalMode='safe';venueCalibration.assumption='sameBeam';syncVenueCalibrationUI();rebuildCalibrationHeightGuides();updateSelectionBox();saveLocalEditState(false);flashEditor('Safe frame calibrated · '+wallCount+' full-height walls = '+d.roomCeiling.toFixed(2)+' m · '+beamCount+' beams = '+d.beamDrop.toFixed(2)+' m deep with underside '+d.beamDance.toFixed(2)+' m · '+pillarCount+' structural pillars = '+d.roomCeiling.toFixed(2)+' m')}
function showCeilingCalibrationCheck(){const d=venueCalibrationDerived();syncVenueCalibrationUI();flashEditor('Ceiling cross-check: raised→ceiling should be '+d.expectedRaisedCeiling.toFixed(2)+' m (entered '+d.raisedCeiling.toFixed(2)+' m) · stage→ceiling should be '+d.expectedStageCeiling.toFixed(2)+' m (entered '+d.stageCeiling.toFixed(2)+' m)')}
function applyVenueVerticalChoice(mode){const d=venueCalibrationDerived(),stage=calibrationStageRoot(),raisedRoots=calibrationRaisedRoots();pushHistory();applySafeFrameCalibration();if(mode==='ceiling'){setCalibrationPlatformHeight(stage,d.stageFromCeiling);raisedRoots.forEach(r=>setCalibrationPlatformHeight(r,d.raisedFromCeiling));venueCalibration.verticalMode='ceiling';flashEditor('Alternative ceiling-clearance levels applied for comparison only · stage '+d.stageFromCeiling.toFixed(2)+' m · raised '+d.raisedFromCeiling.toFixed(2)+' m')}else{setCalibrationPlatformHeight(stage,d.stageFromBeam);raisedRoots.forEach(r=>setCalibrationPlatformHeight(r,d.raisedFromBeam));venueCalibration.verticalMode='beam';venueCalibration.assumption='sameBeam';venueCalibration.appliedToGeometry=true;flashEditor('Confirmed same-beam geometry applied · stage '+d.stageFromBeam.toFixed(2)+' m · raised '+d.raisedFromBeam.toFixed(2)+' m · beam underside '+d.beamDance.toFixed(2)+' m · ceiling '+d.roomCeiling.toFixed(2)+' m')}rebuildCalibrationHeightGuides();syncVenueCalibrationUI();updateSelectionBox();saveLocalEditState(false)}
function lockVenueCalibration(){readVenueCalibrationInputs();venueCalibration.locked=true;syncVenueCalibrationUI();saveLocalEditState(false);flashEditor('Venue measurement ratio locked to stage '+venueCalibration.stageWidth.toFixed(2)+' × '+venueCalibration.stageDepth.toFixed(2)+' m · same-beam structural calibration retained')}
function unlockVenueCalibration(){venueCalibration.locked=false;syncVenueCalibrationUI();saveLocalEditState(false);flashEditor('Venue calibration unlocked')}
function lockVerifiedFrame(){if(!venueCalibration.locked){flashEditor('Lock the calibration ratio first');return}if(!phaseLocks[1])togglePhaseLock(1,false);else setLayoutLocked(true,false);flashEditor('Phase 1 frame locked · calibrated measurement ratio retained')}
function calibratedPlanDistance(a,b){const f=calibrationPlanFactors(),dx=(b.x-a.x)*f.x,dz=(b.z-a.z)*f.z;return Math.hypot(dx,dz)}
function clearVenueMeasurements(){while(venueMeasureGroup.children.length){const o=venueMeasureGroup.children.pop();if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose&&m.dispose());else o.material.dispose&&o.material.dispose()}}venueMeasureMode=null;venueMeasurePoints=[];const r=document.getElementById('venueMeasureResult');if(r)r.textContent='No measurement yet.';markRenderDirty()}
function measureLabelSprite(text,pos,color='#39d9f9'){const c=document.createElement('canvas');c.width=700;c.height=120;const x=c.getContext('2d');x.fillStyle='rgba(5,7,10,.92)';x.roundRect(8,8,684,104,18);x.fill();x.font='700 34px IBM Plex Mono, monospace';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(text,350,60);const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.position.copy(pos);sp.scale.set(3.8,.65,1);sp.renderOrder=210;venueMeasureGroup.add(sp);return sp}
function drawVenueMeasurement(a,b,label,color=0x39d9f9){const aa=a.clone().setY(Math.max(a.y,b.y,.05)+.025),bb=b.clone().setY(Math.max(a.y,b.y,.05)+.025),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([aa,bb]),new THREE.LineBasicMaterial({color,transparent:true,opacity:.95,depthTest:false}));line.renderOrder=205;venueMeasureGroup.add(line);[aa,bb].forEach(p=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),new THREE.MeshBasicMaterial({color,depthTest:false}));s.position.copy(p);s.renderOrder=206;venueMeasureGroup.add(s)});measureLabelSprite(label,aa.clone().lerp(bb,.5).add(new THREE.Vector3(0,.20,0)),color===0xffd166?'#ffd166':'#39d9f9');markRenderDirty()}
function stageWorldPolygon(){const root=calibrationStageRoot();if(!root||!root.userData.platformData)return null;return root.userData.platformData.points.map(p=>root.localToWorld(new THREE.Vector3(p[0],0,p[1])))}
function nearestStageEdgePoint(p){const poly=stageWorldPolygon();if(!poly||poly.length<2)return null;let best=null;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ab=b.clone().sub(a);ab.y=0;const ap=p.clone().sub(a);ap.y=0;const den=ab.lengthSq()||1,t=Math.max(0,Math.min(1,ap.dot(ab)/den)),q=a.clone().add(ab.multiplyScalar(t));q.y=mainFloorLevel();const dist=calibratedPlanDistance(p,q);if(!best||dist<best.dist)best={point:q,dist}}return best}
function startVenueMeasure(mode){if(!venueCalibration.locked){flashEditor('Lock the stage calibration ratio first');return}if(!editMode)setEditMode(true);if(!mode2d)setMode(true);cancelDraw();deselectEdit();venueMeasureMode=mode;venueMeasurePoints=[];const r=document.getElementById('venueMeasureResult');if(r)r.textContent=mode==='stage'?'CLICK A POINT · measuring to nearest stage edge':'CLICK START POINT · then END POINT';renderer.domElement.style.cursor='crosshair';markRenderDirty()}
function handleVenueMeasureClick(e){if(!venueMeasureMode)return false;const p=groundPointFromEvent(e);if(!p)return true;p.y=mainFloorLevel();if(venueMeasureMode==='stage'){const hit=nearestStageEdgePoint(p);if(!hit){flashEditor('Editable stage not found');venueMeasureMode=null;return true}const label=hit.dist.toFixed(2)+' m → STAGE';drawVenueMeasurement(p,hit.point,label,0xffd166);const r=document.getElementById('venueMeasureResult');if(r)r.textContent='Point → nearest stage edge: '+hit.dist.toFixed(2)+' m';venueMeasureMode=null;return true}venueMeasurePoints.push(p.clone());if(venueMeasurePoints.length===1){const r=document.getElementById('venueMeasureResult');if(r)r.textContent='START SET · click END POINT';return true}const a=venueMeasurePoints[0],b=venueMeasurePoints[1],dist=calibratedPlanDistance(a,b);drawVenueMeasurement(a,b,dist.toFixed(2)+' m');const r=document.getElementById('venueMeasureResult');if(r)r.textContent='Calibrated plan distance: '+dist.toFixed(2)+' m';venueMeasureMode=null;venueMeasurePoints=[];return true}
function clearCalibrationHeightGuides(){while(calibrationGuideGroup.children.length){const o=calibrationGuideGroup.children.pop();if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose&&m.dispose());else o.material.dispose&&o.material.dispose()}}}
function calibrationGuideLabel(textValue,pos,color='#51e06d'){const c=document.createElement('canvas');c.width=760;c.height=110;const x=c.getContext('2d');x.fillStyle='rgba(5,7,10,.92)';x.fillRect(5,5,750,100);x.font='700 29px IBM Plex Mono, monospace';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(textValue,380,55);const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.position.copy(pos);sp.scale.set(4.2,.62,1);sp.renderOrder=220;calibrationGuideGroup.add(sp);return sp}
function rebuildCalibrationHeightGuides(){clearCalibrationHeightGuides();const d=venueCalibrationDerived(),x=-10.65,z=-1.45,levels=[{y:0,label:'DANCE FLOOR · 0.00 m',c:0x39d9f9,h:'#39d9f9'},{y:d.raisedFromBeam,label:'RAISED FLOOR · '+d.raisedFromBeam.toFixed(2)+' m',c:0x51e06d,h:'#51e06d'},{y:d.stageFromBeam,label:'STAGE FLOOR · '+d.stageFromBeam.toFixed(2)+' m',c:0xff2e83,h:'#ff2e83'},{y:d.beamDance,label:'BEAM UNDERSIDE · '+d.beamDance.toFixed(2)+' m',c:0xffd166,h:'#ffd166'},{y:d.roomCeiling,label:'ROOM CEILING · '+d.roomCeiling.toFixed(2)+' m',c:0xffffff,h:'#ffffff'}];const v=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,z),new THREE.Vector3(x,d.roomCeiling,z)]),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.72,depthTest:false}));v.renderOrder=218;calibrationGuideGroup.add(v);levels.forEach((q,i)=>{const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x-.15,q.y,z),new THREE.Vector3(x+1.05,q.y,z)]),new THREE.LineBasicMaterial({color:q.c,transparent:true,opacity:.95,depthTest:false}));line.renderOrder=219;calibrationGuideGroup.add(line);calibrationGuideLabel(q.label,new THREE.Vector3(x+2.6,q.y+(i===0?.13:.06),z),q.h)});const bracket=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x-.42,d.beamDance,z),new THREE.Vector3(x-.42,d.roomCeiling,z)]),new THREE.LineBasicMaterial({color:0xffd166,transparent:true,opacity:.95,depthTest:false}));bracket.renderOrder=219;calibrationGuideGroup.add(bracket);calibrationGuideLabel('BEAM DROP · '+d.beamDrop.toFixed(2)+' m',new THREE.Vector3(x-2.05,(d.beamDance+d.roomCeiling)/2,z),'#ffd166');calibrationGuideGroup.visible=calibrationGuidesVisible;syncCalibrationGuideButton();markRenderDirty()}
function syncCalibrationGuideButton(){const b=document.getElementById('toggleCalibrationGuides');if(!b)return;b.textContent=calibrationGuidesVisible?'HIDE HEIGHT GUIDES':'SHOW HEIGHT GUIDES';b.classList.toggle('active',calibrationGuidesVisible)}
function toggleCalibrationHeightGuides(){calibrationGuidesVisible=!calibrationGuidesVisible;calibrationGuideGroup.visible=calibrationGuidesVisible;if(calibrationGuidesVisible)rebuildCalibrationHeightGuides();else syncCalibrationGuideButton();markRenderDirty()}
function captureBuilderState(){return {objects:captureAllBuilderRecords(),links:[],autoSnap:false,snapDistance:.35,layoutLocked,autoSurfaceSnap:autoSurfaceSnapEnabled,mainFloorLock:autoMainFloorLock,autoRoomFloors:false,autoCloseRoom:false,roomFloorMode:'manual',safeWallSnap:true,roomGapTolerance:.22,roomDrawSnapTolerance:FAST_FRAME_SNAP_TOL,roomFloorEditView:'normal',doorFrameWallPriority:true,redoEnabled:true,fastFrameMode,orthoTraceEnabled,calibration:captureVenueCalibrationState(),phaseSystem:capturePhaseSystemState(),appearance:currentAppearanceState(),barDetails:captureBarDetailState()}}
function clearBuilderObjects(){deferredBuildGeneration++;deferredBuilderRecords=[];if(selectedEdit&&selectedEdit.userData.dynamic)deselectEdit();builderObjects.forEach(o=>{if(o.parent)o.parent.remove(o);disposeObject3D(o)});editorRoots=editorRoots.filter(o=>!o.userData.dynamic);builderObjects=[];wallLinks=[];clearVertexHandles()}

let deferredBuilderRecords=[],deferredBuildGeneration=0,deferredBuildRunning=false;
function captureAllBuilderRecords(){const loaded=builderObjects.map(captureBuilderObject),ids=new Set(loaded.map(d=>d&&d.id).filter(Boolean)),pending=(deferredBuilderRecords||[]).filter(d=>d&&!ids.has(d.id)).map(d=>JSON.parse(JSON.stringify(d)));return loaded.concat(pending)}
function isEssentialBuilderRecord(d){if(!d)return false;const type=d.type||'';if(['wall','curvedWall','polyWall','platform','solidPolygon','pillar','steps','ramp','rampPath'].includes(type))return true;if(type==='fixtureAsset'){const k=d.asset&&d.asset.kind;return ['door','doorFrame','handrail','toilet','urinal','sinkPair','doubleSinkCounter','counterBarFridge'].includes(k)}return false}
function buildSavedBuilderRecord(d){

    if(String(d&&d.name||'').toLowerCase().startsWith('toilet floor custom'))return;
    // V187 compatibility migration for V186 project/history records.
    if(d&&d.type==='fixtureAsset'){
      const n=String(d.name||d.buildItem||'').toLowerCase();
      d.asset=d.asset&&typeof d.asset==='object'?d.asset:{};
      if(d.asset.kind==='toilet'||!d.asset.kind){
        if(n.includes('guitar amp'))d.asset.kind='guitarAmpStack';
        else if(n.includes('bass amp'))d.asset.kind='bassAmpStack';
        else if(n.includes('wedge')||n.includes('floor monitor'))d.asset.kind='wedgeMonitor';
      }
    } // legacy square toilet-floor conversion intentionally removed
    let o=null;
    if(d.type==='wall'){
      const b=d.base||{};
      o=createStraightWallFromPoints(new THREE.Vector3(0,0,0),new THREE.Vector3(b.length||1,0,0),{height:b.height||2.58,width:b.width||.18,id:d.id,name:d.name,color:d.color});
      o.position.set(0,(b.height||2.58)/2,0)
    }else if(d.type==='curvedWall'){
      const c=d.curve||{points:[[-1,0],[0,-1],[1,0]],width:.18,height:2.55};
      const p=c.points.map(v=>new THREE.Vector3(v[0],0,v[1]));
      o=createCurvedWallFromPoints(p[0],p[1],p[2],{width:c.width,height:c.height,id:d.id,name:d.name,color:d.color});
      o.userData.curveData=JSON.parse(JSON.stringify(c));rebuildCurvedWall(o)
    }else if(d.type==='polyWall'){
      const p=d.polyWall||{points:[[-1,0],[1,0]],width:.18,height:2.55,style:'solid'};o=createPolylineWallObject(p.points,{width:p.width,height:p.height,id:d.id,name:d.name,color:d.color,style:p.style||'solid',slatGap:p.slatGap,slatWidth:p.slatWidth,closed:!!p.closed,ceilingMounted:p.ceilingMounted,topY:p.topY,drapesVisible:p.drapesVisible})
    }else if(d.type==='platform'){
      const p=d.platform||{};o=createPlatformObject(p.shape||'rect',{points:p.points,height:p.height,id:d.id,name:d.name,x:0,z:0,color:d.color,roomData:p.roomData||null})
    }else if(d.type==='solidPolygon'){
      const q=d.solid||{};o=createSolidPolygonObject(q.points||presetPlatformPoints('rect',2,1),{height:q.height||.5,role:q.role||'solid',autoFloorLock:q.autoFloorLock!==false,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})
    }else if(d.type==='barLeaner'){
      const q=d.leaner||{};o=createBarLeanerObject({...q,id:d.id,name:d.name,x:0,y:0,z:0,color:q.topColor||d.color})
    }else if(d.type==='pillar'){
      const p=d.pillar||{};o=createPillarObject(p.shape||'rect',{width:p.width,depth:p.depth,height:p.height,id:d.id,name:d.name,x:0,z:0,color:d.color})
    }else if(d.type==='steps'){
      const p=d.steps||{};o=createStepsObject({count:p.count,width:p.width,run:p.run,height:p.height,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})
    }else if(d.type==='ramp'){
      const p=d.ramp||{};o=createRampObject({width:p.width,depth:p.depth,height:p.height,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})
    }else if(d.type==='rampPath'){
      const p=d.rampPath||{};o=createRampPathObject({points:p.points,width:p.width,height:p.height,startLevel:p.startLevel,finishLevel:p.finishLevel,thickness:p.thickness,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})
    }else if(d.type==='ledStrip'){
      o=createLedStripObject({id:d.id,name:d.name,x:0,y:0,z:0,color:(d.led&&d.led.color)||d.color,length:(d.led&&d.led.length)||2,brightness:(d.led&&d.led.brightness)!=null?d.led.brightness:3.2,enabled:(d.led&&d.led.enabled)!==false})
    }else if(d.type==='ledStripPath'){
      const q=d.ledPath||{};o=createLedStripPathObject({id:d.id,name:d.name,x:0,y:0,z:0,points:q.points,color:q.color||d.color,radius:q.radius,brightness:q.brightness,enabled:q.enabled,closed:q.closed})
    }else if(d.type==='sunsetLamp'){
      o=createSunsetLampObject({id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})
    }else if(['furniture','artwork','plantAsset','barAsset','fixtureAsset'].includes(d.type)){
      o=createVenueAssetByType(d.type,d.asset||{},{id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})
    }else if(d.type==='curtainRail'){
      o=createCurtainRailObject({id:d.id,name:d.name,x:0,z:0,color:d.color,...(d.asset||{})})
    }else if(d.type==='featureBlock'){
      o=createFeatureBlockObject({id:d.id,name:d.name,x:0,z:0,color:d.color})
    }else if(d.type==='ledScreen'){
      o=createLedScreenObject({id:d.id,name:d.name,x:0,z:0,color:d.color})
    }else if(d.type==='shelfArt'){
      o=createShelfArtObject({id:d.id,name:d.name,x:0,z:0,color:d.color})
    }else if(d.type==='refPin'){
      o=createRefPinObject({id:d.id,name:d.name,x:0,z:0,color:d.color})
    }
    if(o){
      applyTransformState(o,d);
      if(isFloorSnappedRestroomFixture(o))normalizeFreestandingToilet(o);
      o.userData.lockedBase=!!d.locked;
      o.userData.buildPhase=Math.min(7,Math.max(1,+d.phase||1));o.userData.buildCategory=d.category||'';o.userData.buildItem=d.buildItem||'';o.userData.phaseLocked=!!d.phaseLocked;o.userData.groupId=d.group||'';o.userData.viewLayer=d.viewLayer||'';o.userData.v184EventLayoutMember=!!d.eventLayoutMember;o.userData.v185EventTypes=Array.isArray(d.eventTypes)?d.eventTypes.slice():[];o.userData.interactive=d.interactive===true;o.userData.highlightOnHover=d.highlightOnHover===true;o.userData.highlightStyle=d.highlightStyle||'outline';o.userData.clickAction=d.clickAction||'none';o.userData.clickTarget=d.clickTarget||'';if(o.userData.viewLayer==='loadingRamp'||LOADING_RAMP_LEGACY_IDS.has(d.id)){o.userData.viewLayer='loadingRamp';o.userData.loadingRampBaseVisible=d.v!==false}noteGroupId(o.userData.groupId);
      if(d.color&&!['artwork','plantAsset','barAsset'].includes(d.type))setObjectColour(o,d.color);if(d.finish)applySurfaceFinish(o,d.finish)
    }

  if(o&&typeof applyPhaseVisibilityToObject==='function')applyPhaseVisibilityToObject(o);
  if(o&&typeof applyPendingObjectPopupToRoot==='function')applyPendingObjectPopupToRoot(o);
  return o||null
}
function runDeferredBuilderLoad(gen){if(gen!==deferredBuildGeneration||deferredBuildRunning)return;deferredBuildRunning=true;const work=deadline=>{if(gen!==deferredBuildGeneration){deferredBuildRunning=false;return}let made=0;const start=(window.performance&&performance.now)?performance.now():Date.now();while(deferredBuilderRecords.length&&made<10){const now=(window.performance&&performance.now)?performance.now():Date.now();if(made>1&&deadline&&typeof deadline.timeRemaining==='function'&&deadline.timeRemaining()<3)break;if(now-start>12&&made>1)break;const d=deferredBuilderRecords.shift();buildSavedBuilderRecord(d);made++}markRenderDirty(180);if(deferredBuilderRecords.length){deferredBuildRunning=false;if('requestIdleCallback' in window)requestIdleCallback(()=>runDeferredBuilderLoad(gen),{timeout:80});else setTimeout(()=>runDeferredBuilderLoad(gen),16)}else{deferredBuildRunning=false;freezeLoadedRoomFloors();syncAppearanceFields();updateCurtainPreview();applyRoomFloorEditDisplay();syncRoomFloorViewUI();if(typeof renderPhaseBuilder==='function')renderPhaseBuilder();normaliseFunctionalLayerParents();normaliseCeilingMountedDetails();scheduleCeilingRigGuideRebuild();if(typeof syncLayoutPresetUI==='function')syncLayoutPresetUI();if(typeof applyVisualLoopSelection==='function')applyVisualLoopSelection(typeof visualLoopMode!=='undefined'?visualLoopMode:'cycle');if(experienceMode==='performance'&&typeof applyPerformanceRigPreview==='function')applyPerformanceRigPreview();else if(window.__mshipForceLightsOff&&typeof applyEditLightsOff==='function')applyEditLightsOff(true);markRenderDirty(500)}};work(null)}
function queueDeferredBuilderLoad(records){deferredBuildGeneration++;const gen=deferredBuildGeneration;deferredBuilderRecords=(records||[]).map(d=>JSON.parse(JSON.stringify(d)));deferredBuildRunning=false;if(!deferredBuilderRecords.length)return;if('requestIdleCallback' in window)requestIdleCallback(()=>runDeferredBuilderLoad(gen),{timeout:60});else setTimeout(()=>runDeferredBuilderLoad(gen),20)}
function applyBuilderState(state){
  clearBuilderObjects();
  if(!state){setViewTheme(DEFAULT_THEME,false);applyLayerState(DEFAULT_LAYER_STATE);syncSnapUI();return}
  autoSnapEnabled=false;
  if(typeof state.layoutLocked==='boolean')layoutLocked=state.layoutLocked;
  if(typeof state.autoSurfaceSnap==='boolean')autoSurfaceSnapEnabled=state.autoSurfaceSnap;if(typeof state.mainFloorLock==='boolean')autoMainFloorLock=state.mainFloorLock;roomFloorEditView='normal';if(typeof state.fastFrameMode==='boolean')fastFrameMode=state.fastFrameMode;if(typeof state.orthoTraceEnabled==='boolean')orthoTraceEnabled=state.orthoTraceEnabled;if(state.calibration)applyVenueCalibrationState(state.calibration,false);else syncVenueCalibrationUI();
  const allRecords=(state.objects||[]),essential=allRecords.filter(isEssentialBuilderRecord),deferred=allRecords.filter(d=>!isEssentialBuilderRecord(d));
  essential.forEach(buildSavedBuilderRecord);
  queueDeferredBuilderLoad(deferred);
  wallLinks=[];
  applyPhaseSystemState(state.phaseSystem||{},false);
  setViewTheme((state.appearance&&state.appearance.theme)||DEFAULT_THEME,false);
  applyLayerState((state.appearance&&state.appearance.layers)||DEFAULT_LAYER_STATE);
  freezeLoadedRoomFloors();syncSnapUI();syncAppearanceFields();updateCurtainPreview();applyRoomFloorEditDisplay();syncRoomFloorViewUI();syncFastFrameUI()
}
function captureSpecialSurfaceState(){return {exteriorFloor:extractObjectColour(exteriorFloor),smokeFloor:extractObjectColour(smokeFloor)}}
function applySpecialSurfaceState(s){if(!s)return;if(s.exteriorFloor)setObjectColour(exteriorFloor,s.exteriorFloor);if(s.smokeFloor)setObjectColour(smokeFloor,s.smokeFloor)}
function normalizeGroundFloorSystem(hex=null){const colourHex=hex||extractObjectColour(exteriorFloor)||'#ababab';if(exteriorFloor&&exteriorFloor.visible!==false){setObjectColour(exteriorFloor,colourHex);syncFloorBleed(exteriorFloor)}if(smokeFloor&&smokeFloor.visible!==false)syncFloorBleed(smokeFloor);builderObjects.forEach(o=>{if(isLowFloorRoot(o)&&o.userData.builderType==='platform'&&o.visible!==false)syncFloorBleed(o)});updateSelectionBox();syncAppearanceFields()}


/* V125 · selected-object click popups + optional saved-frame preview */
let pendingObjectPopupState={},objectPopupDraftImageData='';

function normaliseObjectPopupConfig(raw={},root=null){
  const baseMeta=root?siteObjectAutoMeta?.(root):null;
  const section=SITE_SECTION_META[raw.section]?raw.section:(baseMeta?.section||'venue');
  const activePage=SITE_SECTION_META[raw.activePage]?raw.activePage:section;
  const name=String(root?.userData?.editName||root?.userData?.info?.title||'Venue Detail');
  return {
    enabled:raw.enabled===true,
    activePage,
    hover:String(raw.hover||raw.hoverLabel||baseMeta?.title||name).trim().slice(0,80),
    kicker:String(raw.kicker||((SITE_SECTION_META[section]?.number||'01')+' · '+(SITE_SECTION_META[section]?.label||'VENUE'))).trim().slice(0,80),
    title:String(raw.title||root?.userData?.info?.title||baseMeta?.title||name).trim().slice(0,120),
    text:String(raw.text||root?.userData?.info?.desc||'').slice(0,4000),
    section,
    button:String(raw.button||'VIEW SECTION').trim().slice(0,40),
    frameId:String(raw.frameId||''),
    imageMode:raw.imageMode==='custom'?'custom':(raw.imageMode==='none'?'none':'frame'),
    customImage:String(raw.customImage||'')
  }
}
function selectedObjectPopupTarget(){
  return !activeGroupId&&!multiSelection.length&&!!selectedEdit&&selectedEdit!==traceGroup
}
function captureObjectPopupState(){
  const state=JSON.parse(JSON.stringify(pendingObjectPopupState||{}));
  const roots=[...new Set([...(editorRoots||[]),...(builderObjects||[])])];
  roots.forEach(o=>{
    const id=o?.userData?.editId,cfg=o?.userData?.sitePopup;
    if(id&&cfg)state[id]=JSON.parse(JSON.stringify(normaliseObjectPopupConfig(cfg,o)));
    else if(id&&state[id]&&o)delete state[id]
  });
  return state
}
function applyPendingObjectPopupToRoot(root){
  const id=root?.userData?.editId;if(!id)return;
  const raw=pendingObjectPopupState?.[id];
  if(raw)root.userData.sitePopup=normaliseObjectPopupConfig(raw,root);
  else delete root.userData.sitePopup
}
function applyObjectPopupState(state){
  pendingObjectPopupState=state&&typeof state==='object'?JSON.parse(JSON.stringify(state)):{};
  const roots=[...new Set([...(editorRoots||[]),...(builderObjects||[])])];
  roots.forEach(applyPendingObjectPopupToRoot);
  syncObjectPopupEditorUI?.()
}
function loadLocalObjectPopupState(){
  try{
    const raw=localStorage.getItem('mothershipObjectPopupsV1');
    applyObjectPopupState(raw?JSON.parse(raw):{})
  }catch(e){applyObjectPopupState({})}
}
function persistObjectPopupState(){
  try{localStorage.setItem('mothershipObjectPopupsV1',JSON.stringify(captureObjectPopupState()))}catch(e){}
  if(typeof setProjectDirty==='function')setProjectDirty(true)
}
function objectPopupFrameOptions(){
  const sel=document.getElementById('objectPopupFrame');if(!sel)return;
  const keep=sel.value;
  sel.innerHTML='<option value="">AUTO CLOSE-UP OF OBJECT</option>'+cameraFrames.map(f=>
    '<option value="'+String(f.id).replace(/"/g,'&quot;')+'">'+String(f.name||'Frame').replace(/</g,'&lt;')+'</option>'
  ).join('');
  if(cameraFrames.some(f=>f.id===keep))sel.value=keep
}
function syncObjectPopupEditorUI(){
  const status=document.getElementById('objectPopupStatus');if(!status)return;
  objectPopupFrameOptions();
  const enabledTarget=selectedObjectPopupTarget();
  const ids=['objectPopupEnabled','objectPopupActivePage','objectPopupHover','objectPopupKicker','objectPopupTitle','objectPopupText','objectPopupSection','objectPopupButton','objectPopupFrame','objectPopupImageMode','objectPopupUploadImage','objectPopupClearImage','objectPopupApply','objectPopupRemove','objectPopupPreview','objectPopupPreviewCamera'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!enabledTarget});
  const set=(id,v)=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=v==null?'':v};
  const chk=document.getElementById('objectPopupEnabled');
  if(!enabledTarget){
    status.textContent='SELECT AN OBJECT';status.classList.remove('active');
    if(chk)chk.checked=false;
    ['objectPopupHover','objectPopupKicker','objectPopupTitle','objectPopupText','objectPopupButton'].forEach(id=>set(id,''));
    set('objectPopupActivePage','venue');set('objectPopupSection','venue');set('objectPopupFrame','');set('objectPopupImageMode','none');
    objectPopupDraftImageData='';
    const thumb=document.getElementById('objectPopupImageThumb');if(thumb){thumb.removeAttribute('src');thumb.classList.remove('has-image')}
    return
  }
  const cfg=normaliseObjectPopupConfig(selectedEdit.userData.sitePopup||{},selectedEdit);
  if(chk)chk.checked=!!cfg.enabled;
  set('objectPopupHover',cfg.hover);set('objectPopupKicker',cfg.kicker);set('objectPopupTitle',cfg.title);
  set('objectPopupActivePage',cfg.activePage);set('objectPopupText',cfg.text);set('objectPopupSection',cfg.section);set('objectPopupButton',cfg.button);set('objectPopupFrame',cfg.frameId);set('objectPopupImageMode',cfg.imageMode);
  objectPopupDraftImageData=cfg.customImage||'';
  const thumb=document.getElementById('objectPopupImageThumb');
  if(thumb){if(objectPopupDraftImageData){thumb.src=objectPopupDraftImageData;thumb.classList.add('has-image')}else{thumb.removeAttribute('src');thumb.classList.remove('has-image')}}
  status.textContent=(selectedEdit.userData.editName||'OBJECT')+(cfg.enabled?' · CLICK POPUP ON':' · CLICK POPUP OFF');
  status.classList.toggle('active',!!cfg.enabled)
}
function objectPopupConfigFromUI(root){
  const val=id=>document.getElementById(id)?.value||'';
  return normaliseObjectPopupConfig({
    enabled:!!document.getElementById('objectPopupEnabled')?.checked,
    activePage:val('objectPopupActivePage'),
    hover:val('objectPopupHover'),
    kicker:val('objectPopupKicker'),
    title:val('objectPopupTitle'),
    text:val('objectPopupText'),
    section:val('objectPopupSection'),
    button:val('objectPopupButton'),
    frameId:val('objectPopupFrame'),
    imageMode:val('objectPopupImageMode'),
    customImage:objectPopupDraftImageData
  },root)
}
function applySelectedObjectPopup(){
  if(!selectedObjectPopupTarget()){flashEditor('Select one object first');return}
  pushHistory();
  selectedEdit.userData.sitePopup=objectPopupConfigFromUI(selectedEdit);
  persistObjectPopupState();saveLocalEditState(false);syncObjectPopupEditorUI();
  flashEditor(selectedEdit.userData.sitePopup.enabled?'Object click popup enabled':'Object popup saved but disabled')
}
function removeSelectedObjectPopup(){
  if(!selectedObjectPopupTarget()){flashEditor('Select one object first');return}
  pushHistory();delete selectedEdit.userData.sitePopup;
  persistObjectPopupState();saveLocalEditState(false);syncObjectPopupEditorUI();flashEditor('Object popup removed')
}
function previewSelectedObjectPopup(){
  if(!selectedObjectPopupTarget()){flashEditor('Select one object first');return}
  const cfg=objectPopupConfigFromUI(selectedEdit);
  selectedEdit.userData.sitePopup=cfg;
  openObjectPopupDrawer(selectedEdit,cfg,true)
}
function previewSelectedObjectCamera(){
  if(!selectedObjectPopupTarget()){flashEditor('Select one object first');return}
  const cfg=objectPopupConfigFromUI(selectedEdit);
  if(mode2d||!cinematicPerspective)setPerspectiveView(true);
  if(cfg.frameId&&cameraFrames.some(f=>f.id===cfg.frameId)){
    loadCameraFrame(cfg.frameId,true)
  }else{
    const autoFrame=objectPopupAutoFocusFrame(selectedEdit);
    if(autoFrame)startCameraViewTween(autoFrame,1050)
  }
}
function objectPopupSetDraftImage(data=''){
  objectPopupDraftImageData=String(data||'');
  const thumb=document.getElementById('objectPopupImageThumb');
  if(thumb){if(objectPopupDraftImageData){thumb.src=objectPopupDraftImageData;thumb.classList.add('has-image')}else{thumb.removeAttribute('src');thumb.classList.remove('has-image')}}
}
function objectPopupUploadImage(){
  if(!selectedObjectPopupTarget()){flashEditor('Select one object first');return}
  document.getElementById('objectPopupImageInput')?.click()
}
function objectPopupReadImageFile(e){
  const file=e.target.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')){flashEditor('Choose an image file');e.target.value='';return}
  const reader=new FileReader();
  reader.onload=()=>{
    objectPopupSetDraftImage(reader.result||'');
    const mode=document.getElementById('objectPopupImageMode');if(mode)mode.value='custom';
    flashEditor('Custom popup image loaded · press APPLY TO SELECTED OBJECT')
  };
  reader.onerror=()=>flashEditor('Could not read image');
  reader.readAsDataURL(file);e.target.value=''
}
function objectPopupClearImage(){
  objectPopupSetDraftImage('');
  const mode=document.getElementById('objectPopupImageMode');if(mode)mode.value='none';
  flashEditor('Custom popup image cleared')
}
function initObjectPopupEditor(){
  const on=(id,ev,fn)=>{const el=document.getElementById(id);if(el&&!el.dataset.popupBound){el.dataset.popupBound='1';el.addEventListener(ev,fn)}};
  on('objectPopupApply','click',applySelectedObjectPopup);
  on('objectPopupRemove','click',removeSelectedObjectPopup);
  on('objectPopupPreview','click',previewSelectedObjectPopup);
  on('objectPopupPreviewCamera','click',previewSelectedObjectCamera);
  on('objectPopupUploadImage','click',objectPopupUploadImage);
  on('objectPopupClearImage','click',objectPopupClearImage);
  on('objectPopupImageInput','change',objectPopupReadImageFile);
  syncObjectPopupEditorUI()
}

function popupFrameDirection(frame,out=new THREE.Vector3()){
  const cp=Math.cos(+frame.pitch||0);
  return out.set(Math.sin(+frame.yaw||0)*cp,Math.sin(+frame.pitch||0),Math.cos(+frame.yaw||0)*cp).normalize()
}
function applySavedFrameToPreviewCamera(frame,cam){
  if(!frame||!cam)return;
  if(frame.mode==='3d'||Array.isArray(frame.target)){
    const t=new THREE.Vector3(...frame.target),r=+frame.radius||25.5,th=Number.isFinite(+frame.theta)?+frame.theta:Math.PI*.25,ph=Number.isFinite(+frame.phi)?+frame.phi:Math.PI*.31;
    cam.fov=Math.max(30,Math.min(80,+frame.fov||45));
    cam.position.set(t.x+r*Math.sin(ph)*Math.sin(th),t.y+r*Math.cos(ph),t.z+r*Math.sin(ph)*Math.cos(th));
    cam.lookAt(t)
  }else{
    cam.fov=Math.max(45,Math.min(80,+frame.fov||62));
    cam.position.fromArray(frame.position);
    const look=cam.position.clone().addScaledVector(popupFrameDirection(frame,new THREE.Vector3()),12);
    cam.lookAt(look)
  }
  cam.updateProjectionMatrix();cam.updateMatrixWorld(true)
}
function renderSavedFramePreview(frameId,customImage='',imageMode='none'){
  const frame=cameraFrames.find(f=>f.id===frameId);
  const drawer=document.getElementById('siteObjectDrawer'),wrap=document.getElementById('siteDrawerFrameWrap'),
        img=document.getElementById('siteDrawerFrameImage'),name=document.getElementById('siteDrawerFrameName'),
        go=document.getElementById('siteDrawerFrameGo');
  if(!drawer||!wrap||!img)return;
  const useCustom=imageMode==='custom'&&!!customImage;
  const useFrame=imageMode==='frame'&&!!frame;
  if(imageMode==='none'||(!useFrame&&!useCustom)){
    drawer.classList.remove('has-frame');wrap.classList.remove('is-loading','custom-image','no-frame-action');img.removeAttribute('src');img.dataset.frameId='';img.classList.remove('frame-clickable');
    if(go)go.dataset.frameId='';return
  }
  drawer.classList.add('has-frame');wrap.classList.toggle('custom-image',useCustom);wrap.classList.toggle('no-frame-action',!useFrame);
  img.dataset.frameId=useFrame?(frame?.id||''):'';img.classList.toggle('frame-clickable',!!useFrame);
  if(name)name.textContent=useCustom?'CUSTOM POPUP IMAGE':String(frame?.name||'OBJECT CAMERA VIEW').toUpperCase();
  if(go)go.dataset.frameId=useFrame?(frame?.id||''):'';
  if(useCustom){wrap.classList.remove('is-loading');img.src=customImage;return}
  wrap.classList.add('is-loading');
  requestAnimationFrame(()=>{
    let rt=null;
    try{
      const w=560,h=315;
      rt=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true,stencilBuffer:false});
      if(rt.texture&&'encoding' in rt.texture)rt.texture.encoding=THREE.sRGBEncoding;
      const cam=new THREE.PerspectiveCamera(62,w/h,.1,100);
      applySavedFrameToPreviewCamera(frame,cam);
      const oldTarget=renderer.getRenderTarget();
      renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,cam);
      const pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(rt,0,0,w,h,pixels);
      renderer.setRenderTarget(oldTarget);
      const flipped=new Uint8ClampedArray(w*h*4),row=w*4;
      for(let y=0;y<h;y++)flipped.set(pixels.subarray(y*row,(y+1)*row),(h-1-y)*row);
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d');ctx.putImageData(new ImageData(flipped,w,h),0,0);
      img.src=c.toDataURL('image/jpeg',.84)
    }catch(e){
      img.removeAttribute('src')
    }finally{
      if(rt)rt.dispose();wrap.classList.remove('is-loading')
    }
  })
}
let popupFrameReturnState=null;
function syncPopupBackButton(){
  const btn=document.getElementById('siteDrawerBackView');
  const drawer=document.getElementById('siteObjectDrawer');
  const active=!!popupFrameReturnState;
  if(btn){
    btn.classList.toggle('show',active);
    const page=popupFrameReturnState?.section||'';
    const label=SITE_SECTION_META?.[page]?.label||'PAGE';
    const main=btn.querySelector('span'),small=btn.querySelector('small');
    if(main)main.textContent='BACK TO '+String(label).toUpperCase();
    if(small)small.textContent='RETURN TO '+String(label).toUpperCase()+' PAGE FRAME'
  }
  if(drawer)drawer.classList.toggle('auto-frame-active',active)
}
function clearPopupFrameReturn(){
  popupFrameReturnState=null;
  document.getElementById('sitePopupFrameReturn')?.classList.remove('show');
  syncPopupBackButton()
}
function capturePopupPreviousView(){
  if(popupFrameReturnState)return popupFrameReturnState;
  popupFrameReturnState={
    camera:captureCameraViewState(),
    activeFrameId:activeCameraFrameId||'',
    section:(typeof siteActiveSection!=='undefined'?siteActiveSection:'venue')
  };
  syncPopupBackButton();
  return popupFrameReturnState
}
function openPopupFrameFull(frameId){
  if(!frameId)return;
  capturePopupPreviousView();
  loadCameraFrame(frameId,true);
  syncPopupBackButton()
}
function returnFromObjectPopup({closeDrawer=true}={}){
  const s=popupFrameReturnState;
  if(!s){
    if(closeDrawer)document.getElementById('siteObjectDrawer')?.classList.remove('show');
    clearPopupFrameReturn();return
  }
  popupFrameReturnState=null;
  const page=SITE_SECTION_META[s.section]?s.section:(typeof siteActiveSection!=='undefined'?siteActiveSection:'venue');
  activeCameraFrameId='';
  // X is the single return control. If the popup changed page, restore the source page;
  // otherwise return to that page's existing cover/default camera frame.
  if(typeof siteActiveSection!=='undefined'&&siteActiveSection!==page){
    siteNavigate(page,{scroll:false,camera:true})
  }else{
    siteGoCamera(page,true)
  }
  syncCameraFrameUI?.();
  syncPopupBackButton();
  markRenderDirty(1400);
  if(closeDrawer)document.getElementById('siteObjectDrawer')?.classList.remove('show')
}
function closePopupFrameFull(){returnFromObjectPopup({closeDrawer:true})}
function closeObjectPopupDrawer({restore=true}={}){
  if(restore&&popupFrameReturnState)returnFromObjectPopup({closeDrawer:true});
  else{
    document.getElementById('siteObjectDrawer')?.classList.remove('show');
    clearPopupFrameReturn()
  }
}
function openObjectPopupDrawer(root,cfg,previewOnly=false){
  const drawer=document.getElementById('siteObjectDrawer');if(!drawer)return false;
  const section=SITE_SECTION_META[cfg.section]?cfg.section:'venue';

  // Starting a new object popup always begins from the page/frame currently
  // on screen, so BACK can return exactly there.
  if(!previewOnly)clearPopupFrameReturn();

  document.getElementById('siteDrawerIndex').textContent=cfg.kicker||((SITE_SECTION_META[section]?.number||'')+' · '+(SITE_SECTION_META[section]?.label||'VENUE'));
  document.getElementById('siteDrawerTitle').textContent=cfg.title||cfg.hover||root?.userData?.editName||'Venue Detail';
  document.getElementById('siteDrawerText').textContent=cfg.text||'';

  const go=document.getElementById('siteDrawerGo');
  if(go){
    go.dataset.section=section;
    go.textContent=(cfg.button||'VIEW SECTION')+' →';
    go.style.display=cfg.button===''?'none':'inline-block'
  }

  renderSavedFramePreview(cfg.frameId,cfg.customImage,cfg.imageMode);
  drawer.classList.add('show');

  // PERFORMANCE / PAGE VIEW:
  // Every configured object changes camera and exposes a Back control.
  // Saved frame = use it. No saved frame = generate a clean close-up of the object.
  if(!previewOnly){
    capturePopupPreviousView();
    if(cfg.frameId&&cameraFrames.some(f=>f.id===cfg.frameId)){
      loadCameraFrame(cfg.frameId,true)
    }else{
      const autoFrame=objectPopupAutoFocusFrame(root);
      if(autoFrame)startCameraViewTween(autoFrame,1050);
      else siteGoCamera(cfg.activePage||siteActiveSection,true)
    }
    syncPopupBackButton()
  }else{
    syncPopupBackButton()
  }
  return true
}

/* V106 · editable Performance Mode scroll-page content */
/* V123 · initialise promoter section metadata before page-builder startup. */
const SITE_SECTION_META={
  explore:{label:'OVERVIEW',number:'01',title:'WELCOME TO THE MOTHERSHIP',text:'A sanctuary for live music, club culture and creative events. Explore the room, click the venue itself, or jump straight to the information you need.',element:'siteOverviewContent'},
  venue:{label:'VENUE',number:'01',title:'THE VENUE',text:'',element:'siteVenue'},
  hire:{label:'HIRE',number:'02',title:'HIRE',text:'A flexible, fully equipped venue for live music, club nights, private events and creative projects.',element:'siteHire'},
  production:{label:'PRODUCTION',number:'03',title:'PRODUCTION',text:'Stage, FOH, audio, DJ, lighting, visuals, backline, recording and technical downloads.',element:'siteProduction'},
  marketing:{label:'MARKETING',number:'04',title:'MARKETING',text:'',element:'siteMarketing'},
  past:{label:'PAST EVENTS',number:'05',title:"WHAT WE'VE DONE",text:'Explore the venue above, then scroll through memorable events and moments from our stage.',element:'sitePast'},
  contact:{label:'CONTACT',number:'06',title:'CONTACT',text:'',element:'siteContact'}
};
/* V149 · page navigation state must exist before project/page-layout startup. */
var siteActiveSection='explore',sitePanelSection='explore';

const V170_ZONE_ONLY_MODE=true;
const V170_BUILTIN_PAGE_IDS=['explore','venue','hire','production','marketing','past','contact'];
const V170_PAGE_DEFAULT_NAMES={explore:'OVERVIEW',venue:'VENUE',hire:'HIRE',production:'PRODUCTION',marketing:'MARKETING',past:'PAST EVENTS',contact:'CONTACT'};
let pageTabState={order:V170_BUILTIN_PAGE_IDS.slice(),pages:{},menuStyle:{width:348,textSize:31,opacity:72,bg:'#0b0c10',text:'#f6f6f4',accent:'#ff514f'}};
function v170DefaultPageTabState(){
  const pages={};
  V170_BUILTIN_PAGE_IDS.forEach(id=>pages[id]={name:V170_PAGE_DEFAULT_NAMES[id],enabled:true,frameId:''});
  return {order:V170_BUILTIN_PAGE_IDS.slice(),pages,menuStyle:{width:348,textSize:31,opacity:72,bg:'#0b0c10',text:'#f6f6f4',accent:'#ff514f'}}
}
function capturePageTabState(){return JSON.parse(JSON.stringify(pageTabState||v170DefaultPageTabState()))}
function v170SafePageId(name='PAGE'){
  const base=String(name||'PAGE').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,22)||'page';
  let id='custom_'+base,i=2;while(SITE_SECTION_META[id]||pageTabState.pages[id])id='custom_'+base+'_'+i++;
  return id
}
function v170EnsureCustomSection(id,name){
  let meta=SITE_SECTION_META[id];
  if(!meta){
    meta=SITE_SECTION_META[id]={label:name,number:'00',title:name,text:'',element:'sitePage_'+id};
  }
  let sec=document.getElementById(meta.element);
  if(!sec){
    sec=document.createElement('section');sec.id=meta.element;sec.className='site-section';sec.dataset.siteSection=id;
    document.getElementById('promoterSite')?.appendChild(sec)
  }
  return sec
}
function v170EnabledPageIds(){return (pageTabState.order||[]).filter(id=>pageTabState.pages?.[id]?.enabled!==false&&SITE_SECTION_META[id])}
function v170PageName(id){return pageTabState.pages?.[id]?.name||SITE_SECTION_META[id]?.label||id.toUpperCase()}
function v170PageFrameId(id){return pageTabState.pages?.[id]?.frameId||''}
function v170SetStatus(msg){const el=document.getElementById('v170PageStatus');if(el)el.textContent=msg}
function v170RefreshPageNumbering(){
  v170EnabledPageIds().forEach((id,i)=>{const meta=SITE_SECTION_META[id];if(meta)meta.number=String(i+1).padStart(2,'0')})
}
function v170BindNavButton(btn){
  if(!btn||btn.dataset.v170Bound==='1')return;btn.dataset.v170Bound='1';
  btn.addEventListener('click',()=>siteNavigate(btn.dataset.siteTarget,{scroll:false,camera:true}))
}
function v170RebuildNav(){
  const nav=document.getElementById('siteNav');if(!nav)return;
  const enabled=v170EnabledPageIds();v170RefreshPageNumbering();nav.innerHTML='';
  enabled.forEach(id=>{
    const b=document.createElement('button');b.type='button';b.className='site-nav-link'+(id===siteActiveSection?' active':'');b.dataset.siteTarget=id;b.textContent=v170PageName(id);v170BindNavButton(b);nav.appendChild(b)
  });
  if(!enabled.includes(siteActiveSection)&&enabled.length){siteActiveSection=enabled[0];sitePanelSection=enabled[0]}
  v170RefreshPageControls();v170RefreshHotspotPageOptions();v171SyncMenuPreview?.();
}
function v170RefreshHotspotPageOptions(){
  const pages=v170EnabledPageIds(),html=pages.map(id=>'<option value="'+id.replace(/"/g,'&quot;')+'">'+v170PageName(id).replace(/</g,'&lt;')+'</option>').join('');
  ['hotspotPage','hotspotTarget'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const keep=el.value;el.innerHTML=html;if(pages.includes(keep))el.value=keep;else if(pages.length)el.value=pages[0]});
  syncHotspotEditorUI?.()
}
function v170RefreshPageFrameOptions(){
  const el=document.getElementById('v170PageFrame');if(!el)return;const page=document.getElementById('v170PageSelect')?.value||siteActiveSection,keep=v170PageFrameId(page);
  el.innerHTML='<option value="">AUTO / NO ASSIGNED FRAME</option>'+cameraFrames.map(f=>'<option value="'+String(f.id).replace(/"/g,'&quot;')+'">'+String(f.name||'Frame').replace(/</g,'&lt;')+' · '+String(f.mode||'perspective').toUpperCase()+'</option>').join('');
  if(cameraFrames.some(f=>f.id===keep))el.value=keep
}
function v170RefreshPageControls(){
  const select=document.getElementById('v170PageSelect'),name=document.getElementById('v170PageName');if(!select)return;
  const pages=v170EnabledPageIds(),keep=pages.includes(select.value)?select.value:(pages.includes(siteActiveSection)?siteActiveSection:pages[0]);
  select.innerHTML=pages.map(id=>'<option value="'+id.replace(/"/g,'&quot;')+'">'+v170PageName(id).replace(/</g,'&lt;')+'</option>').join('');
  if(keep)select.value=keep;if(name&&document.activeElement!==name)name.value=keep?v170PageName(keep):'';v170RefreshPageFrameOptions()
}
const V171_MENU_DEFAULT={width:348,textSize:31,opacity:72,bg:'#0b0c10',text:'#f6f6f4',accent:'#ff514f'};
function v171Clamp(n,min,max,fallback){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function v171Hex(v,fallback){v=String(v||'').trim();return /^#[0-9a-f]{6}$/i.test(v)?v:fallback}
function v171HexToRgb(hex){hex=v171Hex(hex,'#0b0c10').slice(1);return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]}
function v171NormaliseMenuStyle(v){v=v&&typeof v==='object'?v:{};return {width:v171Clamp(v.width,210,520,V171_MENU_DEFAULT.width),textSize:v171Clamp(v.textSize,14,42,V171_MENU_DEFAULT.textSize),opacity:v171Clamp(v.opacity,20,100,V171_MENU_DEFAULT.opacity),bg:v171Hex(v.bg,V171_MENU_DEFAULT.bg),text:v171Hex(v.text,V171_MENU_DEFAULT.text),accent:v171Hex(v.accent,V171_MENU_DEFAULT.accent)}}
function v171ApplyMenuStyle(style=pageTabState?.menuStyle){
  const st=v171NormaliseMenuStyle(style);if(pageTabState)pageTabState.menuStyle=st;
  const [r,g,b]=v171HexToRgb(st.bg),a=(st.opacity/100).toFixed(3),a2=Math.min(1,st.opacity/100+.08).toFixed(3);
  let el=document.getElementById('v171RuntimeNavStyle');if(!el){el=document.createElement('style');el.id='v171RuntimeNavStyle';document.head.appendChild(el)}
  el.textContent=`@media(min-width:721px){#siteNav{width:${st.width}px!important;max-width:calc(100vw - 44px)!important;background:linear-gradient(145deg,rgba(${r},${g},${b},${a2}),rgba(${r},${g},${b},${a}) 58%,rgba(${r},${g},${b},${a2}))!important}#siteNav .site-nav-link{font-size:${st.textSize}px!important;color:${st.text}!important}#siteNav .site-nav-link::before{color:${st.text}!important}#siteNav .site-nav-link.active{color:${st.accent}!important;box-shadow:inset 3px 0 0 ${st.accent}!important}#siteNav .site-nav-link.active::before{color:${st.accent}!important}body.v168-nav-compact.v168-nav-expanded #siteNav{width:${st.width}px!important}body.v168-nav-compact:not(.v168-nav-expanded) #siteNav .site-nav-link.active{color:${st.text}!important}}`;
  v171SyncMenuControls()
}
function v171SyncMenuPreview(){
  const el=document.getElementById('v171MenuPreview');if(!el)return;const st=v171NormaliseMenuStyle(pageTabState?.menuStyle),[r,g,b]=v171HexToRgb(st.bg);
  el.style.background=`rgba(${r},${g},${b},${Math.max(.2,st.opacity/100)})`;el.style.maxWidth=Math.min(st.width,354)+'px';
  const pages=v170EnabledPageIds().slice(0,5);el.innerHTML=pages.map((id,i)=>`<button type="button" style="font-size:${Math.max(12,Math.min(28,st.textSize*.72))}px;color:${i===0?st.accent:st.text}">${v170PageName(id).replace(/</g,'&lt;')}</button>`).join('')
}
function v171SyncMenuControls(){
  const st=v171NormaliseMenuStyle(pageTabState?.menuStyle),set=(id,v)=>{const e=document.getElementById(id);if(e&&document.activeElement!==e)e.value=v};
  set('v171MenuWidth',st.width);set('v171MenuTextSize',st.textSize);set('v171MenuOpacity',st.opacity);set('v171MenuBg',st.bg);set('v171MenuText',st.text);set('v171MenuAccent',st.accent);
  const w=document.getElementById('v171MenuWidthValue'),t=document.getElementById('v171MenuTextSizeValue'),o=document.getElementById('v171MenuOpacityValue');if(w)w.textContent=Math.round(st.width)+' PX';if(t)t.textContent=Math.round(st.textSize)+' PX';if(o)o.textContent=Math.round(st.opacity)+'%';v171SyncMenuPreview()
}
function v171ReadMenuControls(){return v171NormaliseMenuStyle({width:document.getElementById('v171MenuWidth')?.value,textSize:document.getElementById('v171MenuTextSize')?.value,opacity:document.getElementById('v171MenuOpacity')?.value,bg:document.getElementById('v171MenuBg')?.value,text:document.getElementById('v171MenuText')?.value,accent:document.getElementById('v171MenuAccent')?.value})}
function v171UpdateMenuFromUI({persist=false}={}){pageTabState.menuStyle=v171ReadMenuControls();v171ApplyMenuStyle(pageTabState.menuStyle);if(persist)persistPageTabState()}
function v171ResetMenu(){pageTabState.menuStyle={...V171_MENU_DEFAULT};v171ApplyMenuStyle(pageTabState.menuStyle);persistPageTabState();v170SetStatus('Navigation menu style reset')}
function v171InitMenuEditor(){
  const live=['v171MenuWidth','v171MenuTextSize','v171MenuOpacity','v171MenuBg','v171MenuText','v171MenuAccent'];live.forEach(id=>document.getElementById(id)?.addEventListener('input',()=>v171UpdateMenuFromUI({persist:false})));
  live.forEach(id=>document.getElementById(id)?.addEventListener('change',()=>v171UpdateMenuFromUI({persist:true})));
  document.getElementById('v171MenuApply')?.addEventListener('click',()=>{v171UpdateMenuFromUI({persist:true});v170SetStatus('Navigation menu style saved')});
  document.getElementById('v171MenuReset')?.addEventListener('click',v171ResetMenu);v171ApplyMenuStyle(pageTabState.menuStyle)
}
function v171SyncViewButtons(){
  const set=(id,on)=>document.getElementById(id)?.classList.toggle('active',!!on);
  set('v170View3D',!mode2d&&!cinematicPerspective);set('v170ViewPerspective',!mode2d&&cinematicPerspective);set('v170View2D',mode2d)
}
function applyPageTabState(saved){
  const base=v170DefaultPageTabState(),src=saved&&typeof saved==='object'?saved:null;
  pageTabState=src?JSON.parse(JSON.stringify(src)):base;
  if(!Array.isArray(pageTabState.order))pageTabState.order=base.order.slice();if(!pageTabState.pages||typeof pageTabState.pages!=='object')pageTabState.pages={};pageTabState.menuStyle=v171NormaliseMenuStyle(pageTabState.menuStyle||base.menuStyle);
  V170_BUILTIN_PAGE_IDS.forEach(id=>{if(!pageTabState.pages[id])pageTabState.pages[id]=base.pages[id];if(!pageTabState.order.includes(id))pageTabState.order.push(id)});
  pageTabState.order.forEach(id=>{
    const p=pageTabState.pages[id];if(!p)return;const name=String(p.name||V170_PAGE_DEFAULT_NAMES[id]||'PAGE').trim().slice(0,40)||'PAGE';p.name=name;
    if(!SITE_SECTION_META[id])v170EnsureCustomSection(id,name);SITE_SECTION_META[id].label=name;SITE_SECTION_META[id].title=name;
  });
  v170RebuildNav();v171ApplyMenuStyle(pageTabState.menuStyle)
}
function loadLocalPageTabState(){try{const raw=localStorage.getItem('mothershipPageTabsV1');applyPageTabState(raw?JSON.parse(raw):null)}catch(e){applyPageTabState(null)}}
function persistPageTabState(){try{localStorage.setItem('mothershipPageTabsV1',JSON.stringify(capturePageTabState()))}catch(e){}if(typeof setProjectDirty==='function'&&projectReady)setProjectDirty(true)}
function v170CurrentManagedPage(){return document.getElementById('v170PageSelect')?.value||siteActiveSection||v170EnabledPageIds()[0]||''}
function v170RenamePage(){
  const id=v170CurrentManagedPage(),input=document.getElementById('v170PageName');if(!id||!input)return;const name=input.value.trim().slice(0,40);if(!name){v170SetStatus('Enter a page name first.');return}
  pageTabState.pages[id].name=name;SITE_SECTION_META[id].label=name;SITE_SECTION_META[id].title=name;persistPageTabState();v170RebuildNav();siteSetActiveNav(id);v170SetStatus(name+' saved')
}
function v170AddPage(){
  const input=document.getElementById('v170PageName');const name=(input?.value||'NEW PAGE').trim().slice(0,40)||'NEW PAGE';const id=v170SafePageId(name);
  pageTabState.pages[id]={name,enabled:true,frameId:''};pageTabState.order.push(id);v170EnsureCustomSection(id,name);persistPageTabState();v170RebuildNav();const sel=document.getElementById('v170PageSelect');if(sel)sel.value=id;v170RefreshPageControls();siteNavigate(id,{scroll:false,camera:true});v170SetStatus(name+' page added')
}
function v170DeletePage(){
  const id=v170CurrentManagedPage(),enabled=v170EnabledPageIds();if(!id)return;if(enabled.length<=1){v170SetStatus('Keep at least one page.');return}
  pageTabState.pages[id].enabled=false;persistPageTabState();const next=enabled.find(x=>x!==id)||'explore';siteActiveSection=next;sitePanelSection=next;v170RebuildNav();siteNavigate(next,{scroll:false,camera:true});v170SetStatus(v170PageName(id)+' removed from navigation')
}
function v170AssignPageFrame(){
  const id=v170CurrentManagedPage(),frame=document.getElementById('v170PageFrame')?.value||'';if(!id)return;pageTabState.pages[id].frameId=frame;persistPageTabState();v170SetStatus(frame?'Frame assigned to '+v170PageName(id):'Page frame returned to AUTO')
}
function v170SaveCurrentViewToPage(){
  const id=v170CurrentManagedPage();if(!id)return;
  const name=v170PageName(id),existing=v170PageFrameId(id),idx=cameraFrames.findIndex(f=>f.id===existing);let frame;
  if(idx>=0){frame=captureCurrentPerspectiveFrame(name,existing);cameraFrames[idx]=frame}else{frame=captureCurrentPerspectiveFrame(name);cameraFrames.push(frame)}
  pageTabState.pages[id].frameId=frame.id;activeCameraFrameId=frame.id;persistCameraFrameState();persistPageTabState();syncCameraFrameUI();v170RefreshPageFrameOptions();v170SetStatus(name+' '+String(frame.mode).toUpperCase()+' view saved')
}
function v170GoManagedPageFrame(){const id=v170CurrentManagedPage();if(id)siteGoCamera(id,true)}
function v170PageAssignedFrame(section){const id=v170PageFrameId(section);return id?cameraFrames.find(f=>f.id===id)||null:null}
function initV170PageManager(){
  applyPageTabState(pageTabState&&Object.keys(pageTabState.pages||{}).length?pageTabState:null);
  const on=(id,ev,fn)=>document.getElementById(id)?.addEventListener(ev,fn);
  on('v170PageSelect','change',e=>{const id=e.target.value;v170RefreshPageControls();siteNavigate(id,{scroll:false,camera:true});syncHotspotEditorUI?.()});
  on('v170RenamePage','click',v170RenamePage);on('v170AddPage','click',v170AddPage);on('v170DeletePage','click',v170DeletePage);
  on('v170AssignFrame','click',v170AssignPageFrame);on('v170SaveViewToPage','click',v170SaveCurrentViewToPage);on('v170GoPageFrame','click',v170GoManagedPageFrame);
  on('v170View3D','click',()=>{setMode(false);v171SyncViewButtons()});
  on('v170ViewPerspective','click',()=>{if(!cinematicPerspective||mode2d)setPerspectiveView(true);v171SyncViewButtons()});
  on('v170View2D','click',()=>{setMode(true);v171SyncViewButtons()});
  on('v170FitVenue','click',fitVenueView);on('v170GoActivePage','click',()=>siteGoCamera(siteActiveSection,true));
  on('v170PageFrame','change',v170AssignPageFrame);v170RefreshPageControls();v171InitMenuEditor();v171SyncViewButtons();
}


const HOTSPOT_NS='http://www.w3.org/2000/svg';
let hotspotZones=[],activeHotspotId='',hotspotEditorSection='venue',hotspotDrawMode=false,
    hotspotDraftPoints=[],hotspotDraftOriginal=null,hotspotDrawWasNew=false,
    hotspotCameraSuspended=false,hotspotCameraTimer=0,hotspotCornerDrag=null,
    hotspotZoneDrag=null,hotspotSuppressZoneClick=false,hotspotInteractionMode='zone',
    hotspotSpaceMoveActive=false,hotspotModeBeforeSpace='zone',
    hotspotDraftImageData='';

function clampHotspot01(v){return Math.max(0,Math.min(1,+v||0))}
function hotspotPerspectivePoints(points){
  if(!Array.isArray(points)||points.length<4)return [];
  const pts=points.slice(0,4).map(p=>[clampHotspot01(p[0]),clampHotspot01(p[1])]);
  const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length;
  const cy=pts.reduce((s,p)=>s+p[1],0)/pts.length;
  return pts.sort((a,b)=>Math.atan2(a[1]-cy,a[0]-cx)-Math.atan2(b[1]-cy,b[0]-cx))
}
function hotspotRectPoints(points,shape='rectangle'){
  if(!Array.isArray(points)||points.length<2)return [];
  if(shape==='perspective'&&points.length>=4)return hotspotPerspectivePoints(points);
  const xs=points.map(p=>clampHotspot01(p[0])),ys=points.map(p=>clampHotspot01(p[1]));
  let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  if(maxX-minX<.015)maxX=Math.min(1,minX+.08);
  if(maxY-minY<.015)maxY=Math.min(1,minY+.08);
  if(shape==='square'){
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    let size=Math.max(maxX-minX,maxY-minY);
    size=Math.min(size,2*Math.min(cx,1-cx,cy,1-cy));
    minX=clampHotspot01(cx-size/2);maxX=clampHotspot01(cx+size/2);
    minY=clampHotspot01(cy-size/2);maxY=clampHotspot01(cy+size/2)
  }
  return [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
}
function normaliseHotspotZone(raw={}){
  const page=SITE_SECTION_META[raw.page]?raw.page:'venue';
  const target=SITE_SECTION_META[raw.target]?raw.target:page;
  const shape=raw.shape==='perspective'?'perspective':(raw.shape==='square'?'square':'rectangle');
  const sourcePoints=Array.isArray(raw.points)?raw.points.filter(p=>Array.isArray(p)&&p.length>=2).map(p=>[clampHotspot01(p[0]),clampHotspot01(p[1])]):[];
  const points=sourcePoints.length>=2?hotspotRectPoints(sourcePoints,shape):[];
  const action=V170_ZONE_ONLY_MODE?'navigate':(raw.action==='navigate'?'navigate':(raw.action==='both'?'both':'popup'));
  const imageMode=raw.imageMode==='custom'?'custom':(raw.imageMode==='frame'?'frame':'none');
  return {
    id:String(raw.id||('hotspot_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6))),
    page,shape,
    label:String(raw.label||'CLICKABLE AREA').slice(0,80),
    action,target,
    display:'hover',
    color:/^#[0-9a-f]{6}$/i.test(String(raw.color||''))?String(raw.color):'#cc3c3a',
    outlineWidth:Math.max(.5,Math.min(8,+raw.outlineWidth||1.5)),
    fillColor:/^#[0-9a-f]{6}$/i.test(String(raw.fillColor||''))?String(raw.fillColor):'#cc3c3a',
    fillOpacity:Math.max(0,Math.min(100,Number.isFinite(+raw.fillOpacity)?+raw.fillOpacity:18)),
    cornerShape:raw.cornerShape==='x'?'x':'plus',
    cornerWidth:Math.max(3,Math.min(30,+raw.cornerWidth||+raw.cornerSize||9)),
    cornerHeight:Math.max(3,Math.min(30,+raw.cornerHeight||+raw.cornerSize||9)),
    cornerColor:/^#[0-9a-f]{6}$/i.test(String(raw.cornerColor||''))?String(raw.cornerColor):'#ffffff',
    kicker:String(raw.kicker||((SITE_SECTION_META[page]?.number||'01')+' · '+(SITE_SECTION_META[page]?.label||'VENUE'))).slice(0,80),
    title:String(raw.title||raw.label||'Venue Detail').slice(0,120),
    text:String(raw.text||'Click through for more information about this part of the venue.').slice(0,4000),
    button:String(raw.button==null?'VIEW SECTION':raw.button).slice(0,40),
    popupFrameId:String(raw.popupFrameId||raw.frameId||''),
    imageMode,
    customImage:String(raw.customImage||''),
    points
  }
}
function captureHotspotZoneState(){return {version:2,zones:hotspotZones.map(z=>JSON.parse(JSON.stringify(z)))}}
function applyHotspotZoneState(state){
  const raw=Array.isArray(state)?state:(state&&Array.isArray(state.zones)?state.zones:[]);
  hotspotZones=raw.map(normaliseHotspotZone);
  if(activeHotspotId&&!hotspotZones.some(z=>z.id===activeHotspotId))activeHotspotId='';
  try{localStorage.setItem('mothershipPerspectiveHotspotsV1',JSON.stringify(captureHotspotZoneState()))}catch(e){}
  syncHotspotEditorUI();renderHotspotZones()
}
function loadLocalHotspotZoneState(){
  try{const s=JSON.parse(localStorage.getItem('mothershipPerspectiveHotspotsV1')||'null');if(s)applyHotspotZoneState(s)}catch(e){}
}
function persistHotspotZones(){
  try{localStorage.setItem('mothershipPerspectiveHotspotsV1',JSON.stringify(captureHotspotZoneState()))}catch(e){}
  if(typeof setProjectDirty==='function')setProjectDirty(true)
}
function currentHotspotZone(){return hotspotZones.find(z=>z.id===activeHotspotId)||null}
function hotspotEditorPage(){const el=document.getElementById('hotspotPage');return SITE_SECTION_META[el?.value]?el.value:'venue'}
function hotspotSvg(){return document.getElementById('siteHotspotOverlay')}
function hotspotPointString(points){return points.map(p=>(p[0]*1000).toFixed(2)+','+(p[1]*1000).toFixed(2)).join(' ')}
function positionSiteHoverLabel(e,tip){
  if(!e||!tip)return;
  const onRight=e.clientX>window.innerWidth*.5;
  const nearBottom=e.clientY>window.innerHeight*.78;
  tip.style.left=e.clientX+'px';
  tip.style.top=e.clientY+'px';
  tip.style.transform='translate('+
    (onRight?'calc(-100% - 16px)':'16px')+','+
    (nearBottom?'calc(-100% - 14px)':'14px')+')'
}
function hotspotTooltip(e,zone){
  const tip=document.getElementById('siteHoverLabel');if(!tip)return;
  if(!zone){tip.style.display='none';tip.style.transform='none';return}
  tip.innerHTML='<b>↗</b>'+String(zone.label||'CLICKABLE AREA').toUpperCase();
  tip.style.display='block';
  positionSiteHoverLabel(e,tip)
}
function hotspotPopupFrameOptions(){
  const sel=document.getElementById('hotspotPopupFrame');if(!sel)return;
  const keep=sel.value;
  sel.innerHTML='<option value="">NO CAMERA CHANGE</option>'+cameraFrames.map(f=>
    '<option value="'+String(f.id).replace(/"/g,'&quot;')+'">'+String(f.name||'Frame').replace(/</g,'&lt;')+'</option>'
  ).join('');
  if(cameraFrames.some(f=>f.id===keep))sel.value=keep
}
function hotspotSetDraftImage(data=''){
  hotspotDraftImageData=String(data||'');
  const thumb=document.getElementById('hotspotImageThumb');
  if(thumb){
    if(hotspotDraftImageData){thumb.src=hotspotDraftImageData;thumb.classList.add('has-image')}
    else{thumb.removeAttribute('src');thumb.classList.remove('has-image')}
  }
}
function hotspotUploadImage(){
  if(!currentHotspotZone()){hotspotStatus('Create or choose a zone first.');return}
  document.getElementById('hotspotImageInput')?.click()
}
function hotspotReadImageFile(e){
  const file=e.target.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')){hotspotStatus('Choose an image file.');e.target.value='';return}
  const reader=new FileReader();
  reader.onload=()=>{
    hotspotSetDraftImage(reader.result||'');
    const mode=document.getElementById('hotspotImageMode');if(mode)mode.value='custom';
    hotspotStatus('Custom popup image loaded · press APPLY DETAILS')
  };
  reader.onerror=()=>hotspotStatus('Could not read image.');
  reader.readAsDataURL(file);e.target.value=''
}
function hotspotClearImage(){
  hotspotSetDraftImage('');
  const mode=document.getElementById('hotspotImageMode');if(mode)mode.value='none';
  hotspotStatus('Custom popup image cleared · press APPLY DETAILS')
}
function preparePopupReturnState(sourcePage){
  popupFrameReturnState={
    camera:captureCameraViewState(),
    activeFrameId:activeCameraFrameId||'',
    section:SITE_SECTION_META[sourcePage]?sourcePage:(typeof siteActiveSection!=='undefined'?siteActiveSection:'venue')
  };
  syncPopupBackButton?.()
}
function openHotspotPopupDrawer(zone){
  const drawer=document.getElementById('siteObjectDrawer');if(!drawer)return;
  const target=SITE_SECTION_META[zone.target]?zone.target:zone.page;
  document.getElementById('siteDrawerIndex').textContent=zone.kicker||((SITE_SECTION_META[zone.page]?.number||'')+' · '+(SITE_SECTION_META[zone.page]?.label||'VENUE'));
  document.getElementById('siteDrawerTitle').textContent=zone.title||zone.label||'Venue Detail';
  document.getElementById('siteDrawerText').textContent=zone.text||'';
  const go=document.getElementById('siteDrawerGo');
  if(go){
    go.dataset.section=target;
    go.textContent=(zone.button||'VIEW SECTION')+' →';
    go.style.display=zone.button===''?'none':'inline-block'
  }
  renderSavedFramePreview(zone.popupFrameId,zone.customImage,zone.imageMode);
  drawer.classList.add('show')
}
function openHotspotZone(zone){
  if(!zone)return;
  const sourcePage=zone.page;
  const target=SITE_SECTION_META[zone.target]?zone.target:sourcePage;
  const wantsPopup=zone.action==='popup'||zone.action==='both';
  const wantsNavigate=zone.action==='navigate'||zone.action==='both';

  hotspotTooltip(null,null);

  if(!wantsPopup){
    clearPopupFrameReturn?.();
    if(wantsNavigate)siteNavigate(target,{scroll:false,camera:true});
    return
  }

  // Save the source page before any navigation/camera motion. X is the sole return control.
  const previousCamera=captureCameraViewState();
  const previousFrameId=activeCameraFrameId||'';

  if(wantsNavigate){
    siteNavigate(target,{scroll:false,camera:false})
  }else{
    clearPopupFrameReturn?.()
  }

  popupFrameReturnState={
    camera:previousCamera,
    activeFrameId:previousFrameId,
    section:sourcePage
  };
  syncPopupBackButton?.();

  openHotspotPopupDrawer(zone);

  if(zone.popupFrameId&&cameraFrames.some(f=>f.id===zone.popupFrameId)){
    loadCameraFrame(zone.popupFrameId,true)
  }else if(wantsNavigate){
    siteGoCamera(target,true)
  }
}
function hotspotOverlaySection(){
  if(document.body.classList.contains('hotspot-editing'))return hotspotEditorSection||hotspotEditorPage();
  try{return siteActiveSection||'explore'}catch(e){return 'explore'}
}
function updateHotspotOverlayVisibility(){
  const svg=hotspotSvg();if(!svg)return;
  const editing=document.body.classList.contains('hotspot-editing');
  let visible=editing;
  if(!editing){
    const preview=document.body.classList.contains('performance-mode')&&document.body.classList.contains('site-preview');
    visible=preview&&!hotspotCameraSuspended&&(window.scrollY||0)<window.innerHeight*.72
  }
  svg.classList.toggle('hotspot-hidden',!visible)
}
function createHotspotPlus(svg,p,index,{draft=false,zone=null}={}){
  const x=p[0]*1000,y=p[1]*1000;
  const g=document.createElementNS(HOTSPOT_NS,'g');
  g.setAttribute('class',draft?'hotspot-draft-plus':'hotspot-corner-handle');
  g.dataset.cornerIndex=String(index);

  const active=zone||currentHotspotZone()||{};
  const halfW=Math.max(3,Math.min(30,+(active.cornerWidth||active.cornerSize||9)));
  const halfH=Math.max(3,Math.min(30,+(active.cornerHeight||active.cornerSize||9)));
  const shape=active.cornerShape==='x'?'x':'plus';
  const colour=active.cornerColor||'#ffffff';
  g.style.setProperty('--hotspot-corner-colour',colour);

  const geom=shape==='x'
    ? [[x-halfW,y-halfH,x+halfW,y+halfH],[x-halfW,y+halfH,x+halfW,y-halfH]]
    : [[x-halfW,y,x+halfW,y],[x,y-halfH,x,y+halfH]];

  geom.forEach(v=>{
    const line=document.createElementNS(HOTSPOT_NS,'line');
    line.setAttribute('x1',v[0]);line.setAttribute('y1',v[1]);
    line.setAttribute('x2',v[2]);line.setAttribute('y2',v[3]);
    line.style.stroke=colour;
    g.appendChild(line)
  });

  if(!draft&&zone){
    g.addEventListener('pointerdown',e=>{
      if(hotspotInteractionMode!=='zone')return;
      e.preventDefault();e.stopPropagation();
      hotspotCornerDrag={zoneId:zone.id,index,pointerId:e.pointerId};
      svg.setPointerCapture?.(e.pointerId);
      document.body.classList.add('hotspot-corner-dragging')
    })
  }
  svg.appendChild(g)
}
function dragHotspotCorner(zone,index,x,y){
  if(!zone||zone.points.length!==4)return;
  const nx=clampHotspot01(x),ny=clampHotspot01(y);

  if(zone.shape==='perspective'){
    zone.points[index]=[nx,ny];
    return
  }

  const opp=(index+2)%4,op=zone.points[opp];
  const left=index===0||index===3,top=index===0||index===1;
  let px=left?Math.min(nx,op[0]-.012):Math.max(nx,op[0]+.012);
  let py=top?Math.min(ny,op[1]-.012):Math.max(ny,op[1]+.012);
  px=clampHotspot01(px);py=clampHotspot01(py);

  if(zone.shape==='square'){
    let size=Math.max(Math.abs(px-op[0]),Math.abs(py-op[1]));
    size=Math.min(size,left?op[0]:1-op[0],top?op[1]:1-op[1]);
    size=Math.max(.018,size);
    px=clampHotspot01(op[0]+(left?-size:size));
    py=clampHotspot01(op[1]+(top?-size:size))
  }

  const minX=Math.min(px,op[0]),maxX=Math.max(px,op[0]),minY=Math.min(py,op[1]),maxY=Math.max(py,op[1]);
  zone.points=[[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
}

function setHotspotInteractionMode(mode,{announce=true}={}){
  hotspotInteractionMode=mode==='view'?'view':'zone';
  const editing=document.body.classList.contains('hotspot-editing');
  document.body.classList.toggle('hotspot-view-mode',editing&&hotspotInteractionMode==='view');

  const zoneBtn=document.getElementById('hotspotEditZoneMode');
  const viewBtn=document.getElementById('hotspotMoveViewMode');
  if(zoneBtn)zoneBtn.classList.toggle('active',hotspotInteractionMode==='zone');
  if(viewBtn)viewBtn.classList.toggle('active',hotspotInteractionMode==='view');

  if(announce&&editing){
    if(hotspotInteractionMode==='view'){
      hotspotStatus('MOVE VIEW / CAMERA · orbit, pan and zoom in 3D or PERSPECTIVE · switch back to EDIT / MOVE ZONE when aligned')
    }else{
      hotspotStatus(activeHotspotId
        ? 'EDIT / MOVE ZONE · drag inside the selected shape to move it · drag corner markers to resize'
        : 'EDIT / MOVE ZONE · click a zone to select it')
    }
  }
  renderHotspotZones()
}
function hotspotCanManipulateZone(){
  return document.body.classList.contains('hotspot-editing') &&
    hotspotInteractionMode==='zone' &&
    !hotspotDrawMode &&
    !hotspotCornerDrag
}
function beginHotspotZoneDrag(e,zone){
  if(!hotspotCanManipulateZone()||!zone)return;
  activeHotspotId=zone.id;

  const startX=e.clientX/Math.max(1,innerWidth);
  const startY=e.clientY/Math.max(1,innerHeight);
  hotspotZoneDrag={
    zoneId:zone.id,
    pointerId:e.pointerId,
    startX,startY,
    startPoints:zone.points.map(p=>p.slice()),
    moved:false
  };
  e.preventDefault();e.stopPropagation();
  hotspotSvg()?.setPointerCapture?.(e.pointerId);
  document.body.classList.add('hotspot-zone-moving');
  syncHotspotEditorUI();
  renderHotspotZones()
}
function moveHotspotZoneDrag(e){
  if(!hotspotZoneDrag)return false;
  const zone=hotspotZones.find(z=>z.id===hotspotZoneDrag.zoneId);if(!zone)return false;

  const x=e.clientX/Math.max(1,innerWidth),y=e.clientY/Math.max(1,innerHeight);
  let dx=x-hotspotZoneDrag.startX,dy=y-hotspotZoneDrag.startY;

  const xs=hotspotZoneDrag.startPoints.map(p=>p[0]),ys=hotspotZoneDrag.startPoints.map(p=>p[1]);
  dx=Math.max(-Math.min(...xs),Math.min(1-Math.max(...xs),dx));
  dy=Math.max(-Math.min(...ys),Math.min(1-Math.max(...ys),dy));

  if(Math.abs(dx)>.001||Math.abs(dy)>.001)hotspotZoneDrag.moved=true;
  zone.points=hotspotZoneDrag.startPoints.map(p=>[clampHotspot01(p[0]+dx),clampHotspot01(p[1]+dy)]);
  renderHotspotZones();
  return true
}
function finishHotspotZoneDrag(){
  if(!hotspotZoneDrag)return;
  const moved=hotspotZoneDrag.moved,pid=hotspotZoneDrag.pointerId;
  try{hotspotSvg()?.releasePointerCapture?.(pid)}catch(_){}
  hotspotZoneDrag=null;
  document.body.classList.remove('hotspot-zone-moving');
  if(moved){
    hotspotSuppressZoneClick=true;
    setTimeout(()=>hotspotSuppressZoneClick=false,0);
    persistHotspotZones();
    hotspotStatus('Zone moved · drag again or use corner markers to resize')
  }
  renderHotspotZones()
}

