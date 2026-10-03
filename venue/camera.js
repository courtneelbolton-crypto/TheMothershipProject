function rootLayerVisible(o){let p=o;while(p&&p!==scene){if(p.visible===false)return false;p=p.parent}return true}
function isEditableRoot(o){if(!o||o.visible===false||!rootLayerVisible(o))return false;if(isWallRoot(o)&&!structuralWallLayer.visible&&!isCurtainTrackRoot(o))return false;if(o.userData.barDetail)return true;if(o.userData&&o.userData.phaseLocked)return false;if(!layoutLocked&&(staticEditorRoots.includes(o)||builderObjects.includes(o)))return true;return !!o.userData.dynamic&&!o.userData.lockedBase}
function nextGroupId(){groupCounter++;return 'grp_'+String(groupCounter).padStart(4,'0')}
function noteGroupId(id){const n=parseInt(String(id||'').replace(/\D/g,''),10);if(Number.isFinite(n))groupCounter=Math.max(groupCounter,n)}
function groupMembersById(id,includeHidden=true){if(!id)return [];return editorRoots.filter(o=>o&&o.userData&&o.userData.groupId===id&&(includeHidden||o.visible!==false))}
function groupedSelectionMembers(){if(activeGroupId)return groupMembersById(activeGroupId,true);if(multiSelection.length)return multiSelection.slice();return selectedEdit?[selectedEdit]:[]}
function disposeSelectionHelper(h){if(!h)return;if(h.parent)h.parent.remove(h);if(h.geometry)h.geometry.dispose();if(h.material)h.material.dispose()}
function clearMultiSelectionVisuals(){multiSelectionBoxes.forEach(disposeSelectionHelper);multiSelectionBoxes=[];multiSelection=[]}
function rebuildMultiSelectionVisuals(){multiSelectionBoxes.forEach(disposeSelectionHelper);multiSelectionBoxes=[];multiSelection.forEach(o=>{if(!o||o.visible===false)return;const h=new THREE.BoxHelper(o,0xff2e83);h.material.depthTest=false;h.material.transparent=true;h.material.opacity=.92;h.renderOrder=9998;scene.add(h);multiSelectionBoxes.push(h)})}
function commonGroupParent(members){if(!members.length)return scene;const p=members[0].parent;return members.every(o=>o.parent===p)?p:scene}
function releaseActiveGroupPivot(clearId=true){if(groupPivot){groupPivot.updateMatrixWorld(true);const entries=[...groupParentMap.entries()];entries.forEach(([m,parent])=>{if(m&&parent){parent.updateMatrixWorld(true);parent.attach(m);m.updateMatrixWorld(true)}});if(groupPivot.parent)groupPivot.parent.remove(groupPivot);groupPivot=null;groupParentMap.clear()}transform.detach();if(clearId)activeGroupId=null}
function selectGroupById(id){if(!id)return false;if(activeGroupId===id&&groupPivot)return true;releaseActiveGroupPivot(true);clearMultiSelectionVisuals();const all=groupMembersById(id,true),members=all.filter(o=>o.visible!==false);if(members.length<2){if(members.length===1){members[0].userData.groupId='';selectEdit(members[0])}return false}if(members.some(o=>!isEditableRoot(o))){flashEditor('This group contains a locked item · unlock its phase/layout first');return false}cancelPointConnect();connectWallPickMode=false;connectWallSourceIndex=-1;clearWallAlignmentSuggestion();if(drawMode&&drawMode!=='wallTrace')cancelDraw();if(vertexEditMode)setVertexEdit(false);activeGroupId=id;noteGroupId(id);selectedEdit=members[0];activeVertexIndex=-1;clearVertexHandles();const b=new THREE.Box3();members.forEach(o=>{o.updateMatrixWorld(true);b.union(new THREE.Box3().setFromObject(o))});const center=new THREE.Vector3();b.getCenter(center);const parent=commonGroupParent(members);parent.updateMatrixWorld(true);const pivot=new THREE.Group();pivot.name='Editable group '+id;parent.add(pivot);pivot.position.copy(parent.worldToLocal(center.clone()));pivot.rotation.set(0,0,0);pivot.scale.set(1,1,1);pivot.updateMatrixWorld(true);groupParentMap.clear();members.forEach(o=>{groupParentMap.set(o,o.parent);pivot.attach(o)});groupPivot=pivot;transform.attach(groupPivot);setEditTool(editModeName||'translate');updateEditorSelected();updateSelectionBox();syncGroupUI();syncDimensionFields();return true}
function toggleMultiSelection(hit){if(!hit||!isEditableRoot(hit))return;let items=multiSelection.length?multiSelection.slice():[];if(!items.length){if(activeGroupId)items.push(...groupMembersById(activeGroupId,true).filter(isEditableRoot));else if(selectedEdit&&isEditableRoot(selectedEdit))items.push(selectedEdit)}releaseActiveGroupPivot(true);selectedEdit=null;transform.detach();activeVertexIndex=-1;if(vertexEditMode){vertexEditMode=false;clearVertexHandles();const p=document.getElementById('editPoints');if(p)p.classList.remove('active')}const addSet=hit.userData.groupId?groupMembersById(hit.userData.groupId,true).filter(isEditableRoot):[hit];const allPresent=addSet.every(o=>items.includes(o));if(allPresent)items=items.filter(o=>!addSet.includes(o));else addSet.forEach(o=>{if(!items.includes(o))items.push(o)});multiSelection=items.filter(o=>o&&o.visible!==false&&isEditableRoot(o));rebuildMultiSelectionVisuals();selectionBox.visible=false;updateEditorSelected();syncGroupUI();syncDimensionFields()}
function expandedGroupingSelection(){let items=(multiSelection.length?multiSelection.slice():(activeGroupId?groupMembersById(activeGroupId,true):(selectedEdit?[selectedEdit]:[]))).filter(Boolean),out=[];items.forEach(o=>{const gid=o.userData&&o.userData.groupId;if(gid)groupMembersById(gid,true).forEach(m=>{if(!out.includes(m))out.push(m)});else if(!out.includes(o))out.push(o)});return out.filter(o=>o.visible!==false&&isEditableRoot(o))}
function groupSelectedObjects(){const items=expandedGroupingSelection();if(items.length<2){flashEditor('Shift-click at least two editable objects first');return false}pushHistory();releaseActiveGroupPivot(true);const id=nextGroupId();items.forEach(o=>{o.userData.groupId=id});clearMultiSelectionVisuals();saveLocalEditState(false);selectGroupById(id);flashEditor(items.length+' objects grouped · move / rotate / stretch together');return true}
function ungroupSelectedObjects(){let ids=[];if(activeGroupId)ids=[activeGroupId];else if(multiSelection.length)ids=[...new Set(multiSelection.map(o=>o.userData&&o.userData.groupId).filter(Boolean))];else if(selectedEdit&&selectedEdit.userData&&selectedEdit.userData.groupId)ids=[selectedEdit.userData.groupId];if(!ids.length){flashEditor('Select a grouped object first');return false}pushHistory();const affected=ids.flatMap(id=>groupMembersById(id,true));releaseActiveGroupPivot(true);affected.forEach(o=>{if(o&&o.userData)o.userData.groupId='' });clearMultiSelectionVisuals();selectedEdit=null;transform.detach();selectionBox.visible=false;saveLocalEditState(false);updateEditorSelected();syncGroupUI();flashEditor(affected.length+' objects ungrouped · each item is editable separately');return true}
function clearGroupingSelection(){releaseActiveGroupPivot(true);clearMultiSelectionVisuals();selectedEdit=null;transform.detach();selectionBox.visible=false;activeVertexIndex=-1;clearVertexHandles();updateEditorSelected();syncGroupUI();syncDimensionFields()}
function syncGroupUI(){const status=document.getElementById('groupStatus'),g=document.getElementById('groupSelected'),u=document.getElementById('ungroupSelected'),c=document.getElementById('clearGroupSelection');if(!status)return;if(activeGroupId){const n=groupMembersById(activeGroupId,true).length;status.textContent='GROUP · '+n+' ITEMS';status.className='group-status active';if(g)g.disabled=true;if(u)u.disabled=false;if(c)c.disabled=false;return}if(multiSelection.length){status.textContent=multiSelection.length+' ITEMS SELECTED';status.className='group-status multi';if(g)g.disabled=multiSelection.length<2;if(u)u.disabled=!multiSelection.some(o=>o.userData&&o.userData.groupId);if(c)c.disabled=false;return}status.textContent='SHIFT-CLICK TO MULTI-SELECT';status.className='group-status';if(g)g.disabled=true;if(u)u.disabled=!(selectedEdit&&selectedEdit.userData&&selectedEdit.userData.groupId);if(c)c.disabled=!selectedEdit}
function worldAwareTransformState(o){const v=o&&o.userData&&o.userData.phaseHidden?o.userData.phaseWasVisible!==false:o.visible!==false;if(groupPivot&&o&&o.parent===groupPivot){o.updateMatrixWorld(true);const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();o.matrixWorld.decompose(p,q,s);const e=new THREE.Euler().setFromQuaternion(q,'XYZ');return {p:p.toArray(),r:[e.x,e.y,e.z,'XYZ'],s:s.toArray(),v}}return {p:o.position.toArray(),r:[o.rotation.x,o.rotation.y,o.rotation.z,o.rotation.order],s:o.scale.toArray(),v}}

function isEditableAddonRoot(o){return isEditableRoot(o)}
function isFreestandingToilet(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='toilet'}
function isMensUrinal(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='urinal'}
function isFloorSnappedRestroomFixture(o){return isFreestandingToilet(o)||isMensUrinal(o)}
function normalizeFreestandingToilet(o){if(!isFloorSnappedRestroomFixture(o))return;delete o.userData.attachedSurfaceId;delete o.userData.attachedSurfaceName;o.userData.freeStanding=true;const d=o.userData.assetData||(o.userData.assetData={kind:'toilet'});if(typeof d.autoFloorSnap!=='boolean')d.autoFloorSnap=true;if(!d.floorSnapName)d.floorSnapName='';o.updateMatrixWorld(true)}
function isAttachableDetail(o){if(isFloorSnappedRestroomFixture(o)||isSinkPairRoot(o)||isBarLeanerRoot(o))return false;return !!o&&o.visible!==false&&(o.userData.barDetail||(o.userData.dynamic&&!o.userData.lockedBase))}
function lockCurrentLayout(){staticEditorRoots.forEach(o=>o.userData.lockedBase=true);builderObjects.forEach(o=>o.userData.lockedBase=true);wallLinks=[];autoSnapEnabled=false}
function syncLayoutLockUI(){const state=document.getElementById('layoutState'),status=document.getElementById('layoutLockStatus'),btn=document.getElementById('toggleLayoutLock'),box=document.getElementById('layoutLockBox'),label=document.getElementById('addDetailLockLabel');if(state)state.textContent=layoutLocked?'LAYOUT LOCKED':'LAYOUT UNLOCKED';if(status){status.textContent=layoutLocked?'LOCKED':'UNLOCKED';status.classList.toggle('unlocked',!layoutLocked)}if(btn){btn.textContent=layoutLocked?'UNLOCK LAYOUT':'LOCK LAYOUT';btn.classList.toggle('active',layoutLocked);btn.classList.toggle('unlocked',!layoutLocked)}if(box)box.classList.toggle('unlocked',!layoutLocked);if(label)label.textContent=layoutLocked?'SHELL PROTECTED':'SHELL EDITABLE';if(editMode)document.getElementById('hint').innerHTML=layoutLocked?'DETAIL EDITOR · shell protected<br>scroll zoom · right/middle drag pan · Alt-drag orbit':'DETAIL EDITOR · shell editable<br>scroll zoom · right/middle drag pan · Alt-drag orbit'}
function setLayoutLocked(on,save=true){layoutLocked=!!on;if(layoutLocked&&selectedEdit&&!isEditableRoot(selectedEdit))deselectEdit();cancelAttachPick();syncLayoutLockUI();syncAppearanceFields();if(save)saveLocalEditState(false);flashEditor(layoutLocked?'Venue layout locked':'Venue layout unlocked · structural objects editable')}
function objectByEditId(id){return editorRoots.find(o=>o.userData.editId===id)||null}
function isWallRoot(o){return !!o&&['wall','curvedWall','polyWall'].includes(o.userData.builderType)}
function isPlatformRoot(o){return !!o&&['platform','platformBox'].includes(o.userData.builderType)}
function isPillarRoot(o){return !!o&&o.userData.builderType==='pillar'}
function isSolidPolygonRoot(o){return !!o&&o.userData&&o.userData.builderType==='solidPolygon'}
function isBarLeanerRoot(o){return !!o&&o.userData&&o.userData.builderType==='barLeaner'}
function isStaticPointSolid(o){return !!o&&o.userData&&!!o.userData.staticSolidEdit}

function captureEditState(){const state={};staticEditorRoots.forEach(o=>{const t=worldAwareTransformState(o);state[o.userData.editId]={...t,c:extractObjectColour(o),g:o.userData.groupId||'',f:o.userData.surfaceFinish||''}});return state}
function applyEditState(state){if(!state)return;staticEditorRoots.forEach(o=>{const d=state[o.userData.editId];if(!d)return;o.position.fromArray(d.p);o.rotation.set(d.r[0],d.r[1],d.r[2],d.r[3]||'XYZ');o.scale.fromArray(d.s);o.visible=d.v!==false;o.userData.groupId=d.g||'';noteGroupId(o.userData.groupId);if(d.c)setObjectColour(o,d.c);if(d.f)applySurfaceFinish(o,d.f)});if(selectedEdit&&!selectedEdit.visible)deselectEdit();updateSelectionBox();syncAppearanceFields()}
function transformState(o){return worldAwareTransformState(o)}
function applyTransformState(o,d){if(!d)return;o.position.fromArray(d.p||[0,0,0]);const r=d.r||[0,0,0,'XYZ'];o.rotation.set(r[0],r[1],r[2],r[3]||'XYZ');o.scale.fromArray(d.s||[1,1,1]);o.visible=d.v!==false;if(isArtworkPanelRoot(o))syncArtworkTextureCrop(o)}

function createStraightWallFromPoints(a,b,opts={}){const dx=b.x-a.x,dz=b.z-a.z,len=Math.max(.05,Math.hypot(dx,dz)),h=opts.height||2.55,w=opts.width||.18;const m=box(len,h,w,(a.x+b.x)/2,h/2,(a.z+b.z)/2,MAT.wall,venue);m.rotation.y=-Math.atan2(dz,dx);m.userData.wallBase={length:len,height:h,width:w};registerBuilderRoot(m,opts.name||'New Wall','wall',opts.id);if(opts.color)setObjectColour(m,opts.color);return m}
function curvePoint(p0,p1,p2,t){const u=1-t;return new THREE.Vector3(u*u*p0.x+2*u*t*p1.x+t*t*p2.x,0,u*u*p0.z+2*u*t*p1.z+t*t*p2.z)}
function wallLineIntersection2D(p,r,q,s){const cross=r[0]*s[1]-r[1]*s[0];if(Math.abs(cross)<1e-8)return null;const qmp=[q[0]-p[0],q[1]-p[1]],t=(qmp[0]*s[1]-qmp[1]*s[0])/cross;return [p[0]+r[0]*t,p[1]+r[1]*t]}
function wallStripPolygon(points,width,closedOverride=null){
  const clean=[];(points||[]).forEach(p=>{const q=[+p[0],+p[1]];if(!clean.length||Math.hypot(q[0]-clean[clean.length-1][0],q[1]-clean[clean.length-1][1])>.0005)clean.push(q)});
  if(clean.length<2)return [];
  const duplicateEnd=clean.length>2&&Math.hypot(clean[0][0]-clean[clean.length-1][0],clean[0][1]-clean[clean.length-1][1])<.025;
  let closed=closedOverride===null?duplicateEnd:!!closedOverride;
  if(duplicateEnd)clean.pop();
  const n=clean.length,half=Math.max(.005,(+width||.18)/2),left=[],right=[];
  function segmentDir(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.max(1e-8,Math.hypot(dx,dz));return [dx/len,dz/len]}
  function offsetAt(i,side){
    const p=clean[i];
    if(!closed&&i===0){const d=segmentDir(clean[0],clean[1]),normal=[-d[1]*side,d[0]*side];return [p[0]+normal[0]*half,p[1]+normal[1]*half]}
    if(!closed&&i===n-1){const d=segmentDir(clean[n-2],clean[n-1]),normal=[-d[1]*side,d[0]*side];return [p[0]+normal[0]*half,p[1]+normal[1]*half]}
    const prev=clean[(i-1+n)%n],next=clean[(i+1)%n],d1=segmentDir(prev,p),d2=segmentDir(p,next),n1=[-d1[1]*side,d1[0]*side],n2=[-d2[1]*side,d2[0]*side],a=[p[0]+n1[0]*half,p[1]+n1[1]*half],b=[p[0]+n2[0]*half,p[1]+n2[1]*half];
    const hit=wallLineIntersection2D(a,d1,b,d2);
    if(!hit){const av=[n1[0]+n2[0],n1[1]+n2[1]],al=Math.hypot(av[0],av[1])||1;return [p[0]+av[0]/al*half,p[1]+av[1]/al*half]}
    const miterLen=Math.hypot(hit[0]-p[0],hit[1]-p[1]),limit=half*4;
    if(miterLen>limit){const vx=hit[0]-p[0],vz=hit[1]-p[1],vl=Math.max(1e-8,Math.hypot(vx,vz));return [p[0]+vx/vl*limit,p[1]+vz/vl*limit]}
    return hit
  }
  for(let i=0;i<n;i++){left.push(offsetAt(i,1));right.push(offsetAt(i,-1))}
  return left.concat(right.reverse())
}
function buildContinuousWallMesh(points,width,height,hex,closed=false){const footprint=wallStripPolygon(points,width,closed);if(footprint.length<4)return null;const mat=cloneMaterialWithColour(MAT.wall,hex);mat.side=THREE.DoubleSide;const m=new THREE.Mesh(platformGeometry(footprint,height),mat);m.castShadow=true;m.receiveShadow=true;return m}
function wallClosedOffsetLoop(points,width,side){
  const clean=[];(points||[]).forEach(p=>{const q=[+p[0],+p[1]];if(!clean.length||Math.hypot(q[0]-clean[clean.length-1][0],q[1]-clean[clean.length-1][1])>.0005)clean.push(q)});
  if(clean.length>2&&Math.hypot(clean[0][0]-clean[clean.length-1][0],clean[0][1]-clean[clean.length-1][1])<.025)clean.pop();
  const n=clean.length;if(n<3)return [];
  const half=Math.max(.005,(+width||.18)/2),out=[];
  function dir(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.max(1e-8,Math.hypot(dx,dz));return [dx/len,dz/len]}
  for(let i=0;i<n;i++){
    const p=clean[i],prev=clean[(i-1+n)%n],next=clean[(i+1)%n],d1=dir(prev,p),d2=dir(p,next),n1=[-d1[1]*side,d1[0]*side],n2=[-d2[1]*side,d2[0]*side],a=[p[0]+n1[0]*half,p[1]+n1[1]*half],b=[p[0]+n2[0]*half,p[1]+n2[1]*half];
    const hit=wallLineIntersection2D(a,d1,b,d2);
    if(!hit){const av=[n1[0]+n2[0],n1[1]+n2[1]],al=Math.hypot(av[0],av[1])||1;out.push([p[0]+av[0]/al*half,p[1]+av[1]/al*half]);continue}
    const miterLen=Math.hypot(hit[0]-p[0],hit[1]-p[1]),limit=half*4;
    if(miterLen>limit){const vx=hit[0]-p[0],vz=hit[1]-p[1],vl=Math.max(1e-8,Math.hypot(vx,vz));out.push([p[0]+vx/vl*limit,p[1]+vz/vl*limit])}else out.push(hit)
  }
  return out
}
function buildClosedWallRingMesh(points,width,height,hex){
  const clean=[];(points||[]).forEach(p=>{const q=[+p[0],+p[1]];if(!clean.length||Math.hypot(q[0]-clean[clean.length-1][0],q[1]-clean[clean.length-1][1])>.0005)clean.push(q)});
  if(clean.length>2&&Math.hypot(clean[0][0]-clean[clean.length-1][0],clean[0][1]-clean[clean.length-1][1])<.025)clean.pop();
  const n=clean.length;if(n<3)return null;
  let area=0;for(let i=0;i<n;i++){const j=(i+1)%n;area+=clean[i][0]*clean[j][1]-clean[j][0]*clean[i][1]}
  const left=wallClosedOffsetLoop(clean,width,1),right=wallClosedOffsetLoop(clean,width,-1);if(left.length!==n||right.length!==n)return null;
  const outer=area>=0?right:left,inner=area>=0?left:right,verts=[],idx=[];
  // bottom outer, bottom inner, top outer, top inner
  outer.forEach(p=>verts.push(p[0],0,p[1]));inner.forEach(p=>verts.push(p[0],0,p[1]));outer.forEach(p=>verts.push(p[0],height,p[1]));inner.forEach(p=>verts.push(p[0],height,p[1]));
  const OB=i=>i,IB=i=>n+i,OT=i=>2*n+i,IT=i=>3*n+i;
  function quad(a,b,c,d){idx.push(a,b,c,a,c,d)}
  for(let i=0;i<n;i++){const j=(i+1)%n;
    quad(OT(i),OT(j),IT(j),IT(i));       // top wall strip
    quad(OB(i),IB(i),IB(j),OB(j));       // underside
    quad(OB(i),OB(j),OT(j),OT(i));       // outside face
    quad(IB(i),IT(i),IT(j),IB(j));       // inside face
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);const sharp=g.toNonIndexed();g.dispose();sharp.computeVertexNormals();
  const mat=cloneMaterialWithColour(MAT.wall,hex);mat.side=THREE.DoubleSide;const m=new THREE.Mesh(sharp,mat);m.castShadow=true;m.receiveShadow=true;return m
}
function rebuildCurvedWall(g){const d=g.userData.curveData;if(!d)return;while(g.children.length){const c=g.children.pop();if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose()}const wallHex=g.userData.colorOverride||'#'+MAT.wall.color.getHexString(),pts=d.points.map(p=>new THREE.Vector3(p[0],0,p[1])),seg=Math.max(16,d.segments||32),track=[];for(let i=0;i<=seg;i++){const p=curvePoint(pts[0],pts[1],pts[2],i/seg);track.push([p.x,p.z])}const m=buildContinuousWallMesh(track,d.width,d.height,wallHex,false);if(m)g.add(m)}
function createCurvedWallFromPoints(a,bend,c,opts={}){const control=new THREE.Vector3(2*bend.x-(a.x+c.x)/2,0,2*bend.z-(a.z+c.z)/2);const centre=new THREE.Vector3((a.x+control.x+c.x)/3,0,(a.z+control.z+c.z)/3);const g=new THREE.Group();g.position.copy(centre);g.userData.curveData={points:[[a.x-centre.x,a.z-centre.z],[control.x-centre.x,control.z-centre.z],[c.x-centre.x,c.z-centre.z]],width:opts.width||.18,height:opts.height||2.55,segments:24};if(opts.color)g.userData.colorOverride=opts.color;venue.add(g);rebuildCurvedWall(g);registerBuilderRoot(g,opts.name||'Curved Wall','curvedWall',opts.id);return g}
function createGatheredCurtainMesh(width,height,material,opts={}){const w=Math.max(.08,+width||.08),h=Math.max(.2,+height||.2),pleatSpacing=Math.max(.11,+opts.pleatSpacing||.18),folds=Math.max(4,Math.round(w/pleatSpacing)),segX=Math.min(260,Math.max(32,folds*8)),segY=18,geo=new THREE.PlaneGeometry(w,h,segX,segY),pos=geo.attributes.position,phase=Number.isFinite(+opts.phase)?+opts.phase:.35,amp=Math.min(.075,Math.max(.035,+opts.amplitude||.052));for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),yn=THREE.MathUtils.clamp((y+h/2)/h,0,1),lower=1-yn,edge=Math.min(1,Math.max(0,(w/2-Math.abs(x))/Math.max(.001,pleatSpacing))),edgeEase=.45+.55*Math.min(1,edge*1.8),theta=(x/w)*folds*Math.PI*2+phase,z=(Math.sin(theta)+.22*Math.sin(theta*2+.7)+.08*Math.sin(theta*.5-1.1))*amp*(.93+.28*lower)*edgeEase,sideSway=.012*lower*lower*Math.sin((x/w)*Math.PI*3+phase*.8);pos.setX(i,x+sideSway);pos.setZ(i,z)}geo.computeVertexNormals();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.curtainFabric=true;return mesh}
function rebuildPolylineWall(g){const d=g.userData.polyWallData;if(!d)return;while(g.children.length){const c=g.children.pop();if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose()}const wallHex=g.userData.colorOverride||'#'+MAT.wall.color.getHexString();const style=d.style||'solid';if(style==='curtain'){if(d.drapesVisible==null)d.drapesVisible=true;const topY=Number.isFinite(+d.topY)?+d.topY:Math.max(2.45,+d.height||2.55),drop=Math.max(.45,+d.height||2.55);const baseY=d.ceilingMounted?Math.max(0,topY-drop):0;for(let i=0,limit=d.closed?d.points.length:d.points.length-1;i<limit;i++){const a=d.points[i],b=d.points[(i+1)%d.points.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.max(.02,Math.hypot(dx,dz)),midX=(a[0]+b[0])/2,midZ=(a[1]+b[1])/2,rot=-Math.atan2(dz,dx);const segment=new THREE.Group();segment.position.set(midX,baseY,midZ);segment.rotation.y=rot;const railMat=new THREE.MeshStandardMaterial({color:0x15171b,metalness:.62,roughness:.3});const fabricMat=new THREE.MeshStandardMaterial({color:0x101116,roughness:1,metalness:0,side:THREE.DoubleSide});const rail=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,len,10),railMat);rail.rotation.z=Math.PI/2;rail.position.set(0,drop-.025,0);rail.castShadow=true;rail.receiveShadow=true;segment.add(rail);const mountCount=Math.max(2,Math.round(len/1.2));for(let m=0;m<mountCount;m++){const x=-len/2+(m/(Math.max(1,mountCount-1)))*len;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.05,8),railMat);stem.position.set(x,drop-.005,0);segment.add(stem);const plate=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.008,10),railMat);plate.position.set(x,drop+.022,0);segment.add(plate)}const panelH=Math.max(.35,drop-.055),fabric=createGatheredCurtainMesh(len,panelH,fabricMat,{pleatSpacing:.17,amplitude:.052,phase:i*.71+.25});fabric.position.set(0,panelH/2,-.005);fabric.visible=curtainPreview&&d.drapesVisible!==false;segment.add(fabric);const headerMat=fabricMat.clone(),header=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.04,len),.045,.035),headerMat);header.position.set(0,panelH-.022,-.002);header.userData.curtainFabric=true;header.visible=curtainPreview&&d.drapesVisible!==false;header.castShadow=true;header.receiveShadow=true;segment.add(header);g.add(segment)}return}if(style!=='fence'){const m=d.closed?buildClosedWallRingMesh(d.points,d.width,d.height,wallHex):buildContinuousWallMesh(d.points,d.width,d.height,wallHex,false);if(m)g.add(m);return}for(let i=0,limit=d.closed?d.points.length:d.points.length-1;i<limit;i++){const a=d.points[i],b=d.points[(i+1)%d.points.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.max(.02,Math.hypot(dx,dz)),midX=(a[0]+b[0])/2,midZ=(a[1]+b[1])/2,rot=-Math.atan2(dz,dx);const segment=new THREE.Group();segment.position.set(midX,0,midZ);segment.rotation.y=rot;const railMat=cloneMaterialWithColour(MAT.wall,wallHex),slatMat=cloneMaterialWithColour(MAT.black,wallHex);const railDepth=Math.max(.02,d.width*.38),slatW=Math.max(.02,d.slatWidth||Math.min(.06,d.width*.55)),gap=Math.max(.02,d.slatGap||.10);const count=Math.max(2,Math.floor((len+gap)/(slatW+gap)));for(let s=0;s<count;s++){const x=-len/2+slatW/2+s*((len-slatW)/Math.max(count-1,1));const m=new THREE.Mesh(new THREE.BoxGeometry(slatW,d.height,d.width),slatMat);m.position.set(x,d.height/2,0);m.castShadow=true;m.receiveShadow=true;segment.add(m)}const topRail=new THREE.Mesh(new THREE.BoxGeometry(len,.06,railDepth),railMat);topRail.position.set(0,d.height-.03,0);segment.add(topRail);const botRail=new THREE.Mesh(new THREE.BoxGeometry(len,.06,railDepth),railMat);botRail.position.set(0,.03,0);segment.add(botRail);g.add(segment)}}
function createPolylineWallObject(points,opts={}){const g=new THREE.Group();g.position.set(opts.x||0,opts.y||0,opts.z||0);const d={points:(points||[[-1,0],[1,0]]).map(p=>[+p[0],+p[1]]),width:opts.width||.18,height:opts.height||2.55,style:opts.style||'solid',slatGap:opts.slatGap||.10,slatWidth:opts.slatWidth||.04,closed:!!opts.closed};if(opts.ceilingMounted!==undefined)d.ceilingMounted=!!opts.ceilingMounted;if(Number.isFinite(+opts.topY))d.topY=+opts.topY;if(opts.drapesVisible!==undefined)d.drapesVisible=opts.drapesVisible!==false;g.userData.polyWallData=d;if(opts.color)g.userData.colorOverride=opts.color;structuralWallLayer.add(g);rebuildPolylineWall(g);registerBuilderRoot(g,opts.name||'Editable Point Wall','polyWall',opts.id);return g}
function ensurePointEditableWall(root,autoSelect=true){if(!root||!isWallRoot(root))return null;if(root.userData.builderType==='polyWall')return root;const width=getWallWidth(root)||.18,height=getWallHeight(root)||2.55,color=extractObjectColour(root),worldPts=[];if(root.userData.builderType==='curvedWall'){const d=root.userData.curveData,src=d.points.map(p=>new THREE.Vector3(p[0],0,p[1]));for(let i=0;i<7;i++){const p=curvePoint(src[0],src[1],src[2],i/6);worldPts.push(root.localToWorld(p))}}else{const ep=wallEndpoints(root);if(ep)worldPts.push(ep[0].clone(),ep[1].clone())}if(worldPts.length<2)return null;const centre=worldPts.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/worldPts.length);centre.y=0;const localPts=worldPts.map(p=>[p.x-centre.x,p.z-centre.z]);const name=(root.userData.editName||'Wall')+' · Points';root.visible=false;const g=createPolylineWallObject(localPts,{x:centre.x,y:0,z:centre.z,width,height,color,name});if(autoSelect)selectEdit(g);return g}function createPolylineWallFromWorldPoints(worldPoints,opts={}){if(!worldPoints||worldPoints.length<2)return null;const centre=worldPoints.reduce((a,p)=>a.add(p.clone()),new THREE.Vector3()).multiplyScalar(1/worldPoints.length);centre.y=0;const localPts=worldPoints.map(p=>[p.x-centre.x,p.z-centre.z]);return createPolylineWallObject(localPts,{x:centre.x,y:0,z:centre.z,width:opts.width||.18,height:opts.height||2.55,color:opts.color,name:opts.name,id:opts.id,style:opts.style||'solid',slatGap:opts.slatGap,slatWidth:opts.slatWidth,closed:!!opts.closed})}
function nearestPointOnSegment2D(p,a,b){const ab=b.clone().sub(a),lenSq=ab.x*ab.x+ab.z*ab.z;if(lenSq<1e-8)return {point:a.clone(),t:0,dist:p.distanceTo(a)};const t=Math.max(0,Math.min(1,((p.x-a.x)*ab.x+(p.z-a.z)*ab.z)/lenSq));const point=new THREE.Vector3(a.x+ab.x*t,0,a.z+ab.z*t);return {point,t,dist:Math.hypot(p.x-point.x,p.z-point.z)}}
function wallSegmentsWorld(root){const out=[];if(!root||!isWallRoot(root))return out;const width=getWallWidth(root)||.18;const style=root.userData.builderType==='polyWall'?(root.userData.polyWallData.style||'solid'):'solid';if(root.userData.builderType==='curvedWall'){const d=root.userData.curveData,src=d.points.map(p=>new THREE.Vector3(p[0],0,p[1]));let prev=root.localToWorld(curvePoint(src[0],src[1],src[2],0));for(let i=1;i<=12;i++){const next=root.localToWorld(curvePoint(src[0],src[1],src[2],i/12));out.push({a:prev.clone().setY(0),b:next.clone().setY(0),width,root,segmentIndex:i-1,style});prev=next}}else if(root.userData.builderType==='polyWall'){const pts=root.userData.polyWallData.points.map(p=>root.localToWorld(new THREE.Vector3(p[0],0,p[1])));for(let i=0;i<pts.length-1;i++)out.push({a:pts[i].clone().setY(0),b:pts[i+1].clone().setY(0),width,root,segmentIndex:i,style});if(root.userData.polyWallData.closed&&pts.length>2)out.push({a:pts[pts.length-1].clone().setY(0),b:pts[0].clone().setY(0),width,root,segmentIndex:pts.length-1,style})}else{const ep=wallEndpoints(root);if(ep)out.push({a:ep[0],b:ep[1],width,root,segmentIndex:0,style})}return out}
function snapSelectedFloorToWalls(){if(!selectedEdit||(!isPlatformRoot(selectedEdit)&&selectedEdit.userData.builderType!=='floorSurface')){flashEditor('Select a floor or raised area first');return false}pushHistory();const root=ensureCustomPlatform(selectedEdit);if(!root)return false;const segs=editorRoots.filter(o=>o!==root&&o.visible&&isWallRoot(o)).flatMap(wallSegmentsWorld);if(!segs.length){flashEditor('No nearby walls found');history.pop();return false}const pts=root.userData.platformData.points;let changed=0;for(let i=0;i<pts.length;i++){const world=root.localToWorld(new THREE.Vector3(pts[i][0],0,pts[i][1]));let best=null;for(const seg of segs){const hit=nearestPointOnSegment2D(world,seg.a,seg.b);if(hit.dist<=.85&&(!best||hit.dist<best.dist))best=hit}if(best){const local=root.worldToLocal(best.point.clone());pts[i]=[local.x,local.z];changed++}}if(!changed){history.pop();flashEditor('No floor corners were close enough to nearby walls');return false}rebuildPlatform(root);if(autoMainFloorLock)alignRootToMainFloor(root,false);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);flashEditor('Floor corners snapped to nearby walls');return true}
function wallWorldPolyline(root){if(!root||!isWallRoot(root))return [];if(root.userData.builderType==='polyWall')return root.userData.polyWallData.points.map(p=>root.localToWorld(new THREE.Vector3(p[0],0,p[1])).setY(0));if(root.userData.builderType==='curvedWall'){const d=root.userData.curveData,src=d.points.map(p=>new THREE.Vector3(p[0],0,p[1])),pts=[];for(let i=0;i<=16;i++)pts.push(root.localToWorld(curvePoint(src[0],src[1],src[2],i/16)).setY(0));return pts}const ep=wallEndpoints(root);return ep?ep.map(p=>p.clone().setY(0)):[]}
function roomNodeKey(p){return (Math.round(p.x*100)/100).toFixed(2)+','+(Math.round(p.z*100)/100).toFixed(2)}
const ROOM_GRAPH_GAP_TOL=.22;
const ROOM_DRAW_SNAP_TOL=.38;
const ROOM_AUTO_FLOOR_MAX_AREA=70; // safety: automatic close-room floors must stay room-sized; manual sync can handle larger spaces
function roomSegmentIntersection2D(a,b,c,d){const rx=b.x-a.x,rz=b.z-a.z,sx=d.x-c.x,sz=d.z-c.z,den=rx*sz-rz*sx;if(Math.abs(den)<1e-8)return null;const qx=c.x-a.x,qz=c.z-a.z,t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;if(t<-.001||t>1.001||u<-.001||u>1.001)return null;const tt=Math.max(0,Math.min(1,t)),uu=Math.max(0,Math.min(1,u));return {point:new THREE.Vector3(a.x+rx*tt,0,a.z+rz*tt),t:tt,u:uu}}
function roomSegmentsNearlyParallel(a,b){const adx=a.b.x-a.a.x,adz=a.b.z-a.a.z,bdx=b.b.x-b.a.x,bdz=b.b.z-b.a.z,al=Math.hypot(adx,adz),bl=Math.hypot(bdx,bdz);if(al<1e-8||bl<1e-8)return false;return Math.abs((adx*bdx+adz*bdz)/(al*bl))>.965}
function roomNearJoinAllowed(sourceSeg,targetSeg,hit){if(!roomSegmentsNearlyParallel(sourceSeg,targetSeg))return true;const endDist=Math.min(hit.point.distanceTo(targetSeg.a),hit.point.distanceTo(targetSeg.b));return endDist<=ROOM_GRAPH_GAP_TOL*1.2}
function roomGraphPath(start,end,excludeRoot){
  const walls=editorRoots.filter(o=>o&&o.visible!==false&&isWallRoot(o)&&o!==excludeRoot),segs=walls.flatMap(wallSegmentsWorld);if(!segs.length)return null;
  const breaks=segs.map(s=>[{t:0,p:s.a.clone()},{t:1,p:s.b.clone()}]),connectors=[];
  const addBreak=(i,t,p)=>{t=Math.max(0,Math.min(1,t));const list=breaks[i],found=list.find(x=>Math.abs(x.t-t)<1e-5);if(found){if(found.p.distanceTo(p)>.001)found.p=found.p.clone().add(p).multiplyScalar(.5);return found}const q={t,p:p.clone().setY(0)};list.push(q);return q};
  for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){const a=segs[i],b=segs[j],cross=roomSegmentIntersection2D(a.a,a.b,b.a,b.b);if(cross){addBreak(i,cross.t,cross.point);addBreak(j,cross.u,cross.point);continue}[[i,a,j,b],[j,b,i,a]].forEach(([si,ss,ti,ts])=>{[[0,ss.a],[1,ss.b]].forEach(([et,ep])=>{const hit=nearestPointOnSegment2D(ep,ts.a,ts.b);if(hit.dist>.004&&hit.dist<=ROOM_GRAPH_GAP_TOL&&roomNearJoinAllowed(ss,ts,hit)){addBreak(ti,hit.t,hit.point);connectors.push({a:ep.clone(),b:hit.point.clone()})}})})}
  const anchor=(p)=>{let best=null;for(let i=0;i<segs.length;i++){const h=nearestPointOnSegment2D(p,segs[i].a,segs[i].b);if(!best||h.dist<best.hit.dist)best={i,hit:h}}if(!best||best.hit.dist>Math.max(ROOM_DRAW_SNAP_TOL,ROOM_GRAPH_GAP_TOL+.08))return null;addBreak(best.i,best.hit.t,best.hit.point);if(best.hit.dist>.004)connectors.push({a:p.clone().setY(0),b:best.hit.point.clone()});return best.hit.point.clone().setY(0)};
  const startAnchor=anchor(start),endAnchor=anchor(end);if(!startAnchor||!endAnchor)return null;
  const nodes=[],adj=new Map();const nodeId=(p)=>{let bi=-1,bd=.016;for(let i=0;i<nodes.length;i++){const dd=Math.hypot(nodes[i].x-p.x,nodes[i].z-p.z);if(dd<bd){bd=dd;bi=i}}if(bi>=0)return bi;nodes.push(p.clone().setY(0));adj.set(nodes.length-1,[]);return nodes.length-1};const addEdge=(a,b,w)=>{if(a===b)return;adj.get(a).push({k:b,w});adj.get(b).push({k:a,w})};
  breaks.forEach(list=>{list.sort((a,b)=>a.t-b.t);const clean=[];list.forEach(x=>{if(!clean.length||Math.abs(x.t-clean[clean.length-1].t)>1e-5)clean.push(x)});for(let k=0;k<clean.length;k++)clean[k].id=nodeId(clean[k].p);for(let k=0;k<clean.length-1;k++)addEdge(clean[k].id,clean[k+1].id,clean[k].p.distanceTo(clean[k+1].p))});connectors.forEach(c=>addEdge(nodeId(c.a),nodeId(c.b),Math.max(.001,c.a.distanceTo(c.b))));
  const ks=nodeId(startAnchor),ke=nodeId(endAnchor);if(!adj.has(ks)||!adj.has(ke))return null;const dist=new Map([[ks,0]]),prev=new Map(),todo=[[0,ks]];while(todo.length){todo.sort((a,b)=>a[0]-b[0]);const [du,k]=todo.shift();if(Math.abs(du-(dist.get(k)??Infinity))>1e-9)continue;if(k===ke)break;for(const e of adj.get(k)||[]){const nd=du+e.w;if(nd<(dist.get(e.k)??Infinity)){dist.set(e.k,nd);prev.set(e.k,k);todo.push([nd,e.k])}}}if(!dist.has(ke))return null;const ids=[];let k=ke;while(k!=null){ids.push(k);if(k===ks)break;k=prev.get(k)}if(ids[ids.length-1]!==ks)return null;ids.reverse();return ids.map(i=>nodes[i].clone())
}
function polygonAreaWorld(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.z-q.x*p.z}return a/2}
function cleanRoomPolygon(points){const out=[];(points||[]).forEach(p=>{const q=p.clone().setY(0);if(!out.length||q.distanceTo(out[out.length-1])>.025)out.push(q)});if(out.length>2&&out[0].distanceTo(out[out.length-1])<.025)out.pop();return out}
function deriveRoomPolygonForWall(root,maxArea=600){if(!root||!isWallRoot(root))return null;const path=wallWorldPolyline(root);if(path.length<2)return null;if(root.userData.builderType==='polyWall'&&root.userData.polyWallData.closed){const poly=cleanRoomPolygon(path),area=Math.abs(polygonAreaWorld(poly));return poly.length>=3&&area>.18&&area<maxArea?poly:null}const returnPath=roomGraphPath(path[path.length-1],path[0],root);if(!returnPath||returnPath.length<2)return null;const poly=cleanRoomPolygon(path.concat(returnPath.slice(1,-1)));const area=Math.abs(polygonAreaWorld(poly));return poly.length>=3&&area>.18&&area<maxArea?poly:null}
function isRoomFloorRoot(o){return !!o&&o.userData&&o.userData.builderType==='platform'&&o.userData.platformData&&!!o.userData.platformData.roomData}
function eachMaterial(root,fn){if(!root)return;root.traverse(o=>{if(!o.isMesh||!o.material)return;const a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>m&&fn(m,o))})}
function rememberRoomFloorMaterial(root){eachMaterial(root,(m,o)=>{if(!m.userData)m.userData={};if(!m.userData.__roomFloorDisplayBase)m.userData.__roomFloorDisplayBase={transparent:!!m.transparent,opacity:m.opacity==null?1:m.opacity,depthWrite:m.depthWrite!==false,depthTest:m.depthTest!==false,visible:m.visible!==false,renderOrder:o.renderOrder||0}})}
function restoreRoomFloorMaterial(root){eachMaterial(root,(m,o)=>{const b=m.userData&&m.userData.__roomFloorDisplayBase;if(!b)return;m.transparent=b.transparent;m.opacity=b.opacity;m.depthWrite=b.depthWrite;m.depthTest=b.depthTest;m.visible=b.visible;o.renderOrder=b.renderOrder;m.needsUpdate=true})}
function applyRoomFloorEditDisplay(){builderObjects.filter(isRoomFloorRoot).forEach(root=>{rememberRoomFloorMaterial(root);restoreRoomFloorMaterial(root);eachMaterial(root,(m,o)=>{m.visible=true;m.transparent=false;m.opacity=1;m.depthWrite=true;m.depthTest=true;o.renderOrder=mode2d?-30:0;m.needsUpdate=true})});updateSelectionBox()}
function syncRoomFloorViewUI(){const s=document.getElementById('roomFloorViewStatus');if(s)s.textContent='ROOM FLOORS · NORMAL'}
function toggleRoomFloorEditView(){roomFloorNormalPreview=false;roomFloorEditView='normal';applyRoomFloorEditDisplay();syncRoomFloorViewUI();saveLocalEditState(false);flashEditor('Room floors stay visible in this version')}
function toggleRoomFloorNormalPreview(){if(!editMode){flashEditor('Open EDIT mode to preview room floors');return}roomFloorNormalPreview=!roomFloorNormalPreview;applyRoomFloorEditDisplay();syncRoomFloorViewUI();flashEditor(roomFloorNormalPreview?'Normal room-floor preview':'Back to protected edit view')}
function roomFloorForWall(root){return builderObjects.find(o=>o&&o.visible!==false&&o.userData.builderType==='platform'&&o.userData.platformData&&o.userData.platformData.roomData&&o.userData.platformData.roomData.sourceWallId===root.userData.editId)||null}
function roomFloorMeta(floor){if(!floor||!floor.userData||!floor.userData.platformData)return null;let rd=floor.userData.platformData.roomData;if(!rd)return null;rd.linked=false;rd.autoFollow=false;rd.frozen=true;return rd}
function freezeLoadedRoomFloors(){builderObjects.forEach(f=>{if(f&&f.userData&&f.userData.builderType==='platform'&&f.userData.platformData&&f.userData.platformData.roomData)roomFloorMeta(f)})}
function setRoomFloorPolygon(floor,worldPts){if(!floor||!worldPts||worldPts.length<3)return false;const d=floor.userData.platformData,h=Math.max(.01,+d.height||.06),cx=worldPts.reduce((s,p)=>s+p.x,0)/worldPts.length,cz=worldPts.reduce((s,p)=>s+p.z,0)/worldPts.length;d.points=worldPts.map(p=>[p.x-cx,p.z-cz]);floor.position.x=cx;floor.position.z=cz;floor.rotation.y=0;floor.scale.x=1;floor.scale.z=1;rebuildPlatform(floor);floor.updateMatrixWorld(true);const rd=roomFloorMeta(floor);if(rd){rd.lastGoodPolygon=worldPts.map(p=>[p.x,p.z]);rd.lastGoodCenter=[cx,cz]}return true}
function createOrSyncRoomFloor(root,announce=true,opts={}){if(!root||!isWallRoot(root))return null;const force=!!opts.force,automatic=!!opts.automatic,maxArea=automatic?ROOM_AUTO_FLOOR_MAX_AREA:600;let floor=roomFloorForWall(root);if(floor&&!force){roomFloorMeta(floor);if(announce){selectEdit(floor);flashEditor('Room floor kept fixed · use MAKE / SYNC ROOM FLOOR to recalculate it')}return floor}const poly=deriveRoomPolygonForWall(root,maxArea);if(!poly){if(announce)flashEditor(automatic?'No safe room-sized boundary found · floor was not moved':'No complete enclosed room found · existing floor was not moved');return floor||null}if(!floor){const h=.055,hex=extractObjectColour(exteriorFloor)||'#ababab';floor=createPlatformObject('rect',{points:[[0,0],[1,0],[1,1]],height:h,x:0,y:mainFloorLevel()-h,z:0,name:'Room Floor · '+(root.userData.editName||'Wall'),color:hex,roomData:{sourceWallId:root.userData.editId,linked:false,autoFollow:false,frozen:true}})}setRoomFloorPolygon(floor,poly);const rd=roomFloorMeta(floor);if(rd){rd.sourceWallId=root.userData.editId;rd.syncedAt=new Date().toISOString()}if(announce){selectEdit(floor);flashEditor(force?'Selected room floor deliberately re-synced':'Editable room floor created · position now fixed')}applyRoomFloorEditDisplay();return floor}
function syncAllRoomFloors(force=false){if(!force)return;builderObjects.filter(o=>o&&o.visible!==false&&o.userData.builderType==='platform'&&o.userData.platformData&&o.userData.platformData.roomData).forEach(f=>{const rd=roomFloorMeta(f),root=rd&&objectByEditId(rd.sourceWallId);if(root&&root.visible!==false){const poly=deriveRoomPolygonForWall(root,600);if(poly)setRoomFloorPolygon(f,poly)}})}
function nearestWallJunction(root,point){const segs=wallSegmentsWorld(root);let best=null;for(const seg of segs){const hit=nearestPointOnSegment2D(point.clone().setY(0),seg.a,seg.b);if(!best||hit.dist<best.hit.dist)best={seg,hit}}return best}
function insertJunctionPointOnWall(root,worldPoint){let wall=root;if(!wall||!isWallRoot(wall))return {root:wall,point:worldPoint.clone()};if(wall.userData.builderType!=='polyWall')wall=ensurePointEditableWall(wall,false);if(!wall||wall.userData.builderType!=='polyWall')return {root:wall,point:worldPoint.clone()};const d=wall.userData.polyWallData,pts=d.points.map(p=>wall.localToWorld(new THREE.Vector3(p[0],0,p[1])).setY(0));let best=null,limit=d.closed?pts.length:pts.length-1;for(let i=0;i<limit;i++){const a=pts[i],b=pts[(i+1)%pts.length],hit=nearestPointOnSegment2D(worldPoint.clone().setY(0),a,b);if(!best||hit.dist<best.hit.dist)best={i,hit}}if(!best)return {root:wall,point:worldPoint.clone()};const snap=best.hit.point.clone();if(best.hit.t>.025&&best.hit.t<.975){const local=wall.worldToLocal(snap.clone());d.points.splice(best.i+1,0,[local.x,local.z]);rebuildPolylineWall(wall);wall.updateMatrixWorld(true)}return {root:wall,point:snap}}
function nearestWallConnectionPoint(source,p,maxDist=FAST_FRAME_CONNECT_TOL){let best=null;editorRoots.filter(o=>o&&o.visible!==false&&isWallRoot(o)&&o!==source).forEach(w=>{const wp=wallWorldPolyline(w);wp.forEach((pt,i)=>{const dist=p.distanceTo(pt);if(dist<=maxDist&&(!best||dist<best.dist||(dist<=.22&&best.kind!=='point'))){best={point:pt.clone(),dist,root:w,kind:'point',pointIndex:i}}});wallSegmentsWorld(w).forEach(seg=>{const hit=nearestPointOnSegment2D(p.clone().setY(0),seg.a,seg.b);if(hit.dist<=maxDist&&(!best||hit.dist<best.dist)){best={point:hit.point.clone(),dist:hit.dist,root:w,kind:'segment',segmentIndex:seg.segmentIndex}}})});return best}
function selectedWallEndIndex(root){if(!root||root.userData.builderType!=='polyWall')return -1;const d=root.userData.polyWallData,n=d.points.length;if(activeVertexIndex===0||activeVertexIndex===n-1)return activeVertexIndex;let best=null;[0,n-1].forEach(i=>{const p=root.localToWorld(new THREE.Vector3(d.points[i][0],0,d.points[i][1])).setY(0),hit=nearestWallConnectionPoint(root,p,FAST_FRAME_CONNECT_TOL);if(hit&&(!best||hit.dist<best.dist))best={i,dist:hit.dist}});return best?best.i:n-1}
function snapWallEndpointExact(source,index,targetPoint){if(!source||source.userData.builderType!=='polyWall'||index<0)return false;const d=source.userData.polyWallData,local=source.worldToLocal(targetPoint.clone());d.points[index]=[local.x,local.z];rebuildPolylineWall(source);source.updateMatrixWorld(true);activeVertexIndex=index;updateVertexHandles();updateSelectionBox();return true}
function beginConnectToWall(){if(!selectedEdit||!isWallRoot(selectedEdit)){flashEditor('Select a wall first');return}let source=selectedEdit;if(source.userData.builderType!=='polyWall'){pushHistory();source=ensurePointEditableWall(source,false);selectEdit(source);setVertexEdit(true)}const d=source.userData.polyWallData,n=d.points.length;if(n<2){flashEditor('Wall needs at least two points');return}const idx=selectedWallEndIndex(source),world=source.localToWorld(new THREE.Vector3(d.points[idx][0],0,d.points[idx][1])).setY(0),near=nearestWallConnectionPoint(source,world,FAST_FRAME_CONNECT_TOL);if(near){pushHistory();snapWallEndpointExact(source,idx,near.point);saveLocalEditState(false);flashEditor('CONNECTED · endpoint snapped exactly to existing '+(near.kind==='point'?'wall point':'wall'));return}connectWallPickMode=true;connectWallSourceIndex=idx;activeVertexIndex=idx;transform.detach();updateVertexHandles();flashEditor('No wall close enough · click the target wall')}
function connectSelectedEndpointToWall(targetWall,clickPoint){const source=selectedEdit;if(!connectWallPickMode||!source||source.userData.builderType!=='polyWall'||!targetWall||targetWall===source||!isWallRoot(targetWall))return false;const d=source.userData.polyWallData,idx=connectWallSourceIndex>=0?connectWallSourceIndex:selectedWallEndIndex(source),sourcePoint=source.localToWorld(new THREE.Vector3(d.points[idx][0],0,d.points[idx][1])).setY(0);const hit=nearestWallJunction(targetWall,sourcePoint);if(!hit){flashEditor('Could not find that target wall segment');return false}pushHistory();snapWallEndpointExact(source,idx,hit.hit.point.clone());connectWallPickMode=false;connectWallSourceIndex=-1;selectEdit(source);setVertexEdit(true);saveLocalEditState(false);flashEditor('CONNECTED · endpoint snapped exactly · no floor created');return true}
function isPointEditEligible(root){return !!root&&(isPlatformRoot(root)||isSolidPolygonRoot(root)||isWallRoot(root)||root.userData.builderType==='floorSurface'||root.userData.builderType==='rampPath'||isStaticPointSolid(root))}
function cleanPolylinePoints(points,closed=false){const src=(points||[]).map(p=>[+p[0],+p[1]]),out=[];src.forEach(p=>{if(!out.length||Math.hypot(p[0]-out[out.length-1][0],p[1]-out[out.length-1][1])>.02)out.push(p)});let changed=src.length!==out.length,pass=true;while(pass&&out.length>(closed?3:2)){pass=false;for(let i=0;i<out.length;i++){if(!closed&&(i===0||i===out.length-1))continue;const a=out[(i-1+out.length)%out.length],b=out[i],c=out[(i+1)%out.length],ab=[b[0]-a[0],b[1]-a[1]],bc=[c[0]-b[0],c[1]-b[1]],lab=Math.hypot(ab[0],ab[1]),lbc=Math.hypot(bc[0],bc[1]);if(lab<.06||lbc<.06){out.splice(i,1);changed=true;pass=true;break}const dot=(ab[0]*bc[0]+ab[1]*bc[1])/Math.max(1e-8,lab*lbc);if(Math.abs(dot)>0.998){out.splice(i,1);changed=true;pass=true;break}}}return {points:out,changed}}
function createCeilingBeamObject(opts={}){const pts=presetPlatformPoints('rect',3,.26);const beam=createSolidPolygonObject(pts,{height:.34,role:'ceilingBeam',autoFloorLock:false,id:opts.id,name:opts.name||'Concrete Ceiling Beam',x:opts.x??target.x,y:opts.y??2.24,z:opts.z??target.z,color:opts.color||'#0b0c0f'});beam.userData.editName=opts.name||'Concrete Ceiling Beam';return beam}
function createCurtainTrackPath(opts={}){const ceilingH=ceilingMountReferenceY()-.012,drop=Math.max(.55,+opts.height||(ceilingH-mainFloorLevel()));const o=createPolylineWallObject([[-1.5,0],[1.5,0]],{x:opts.x??target.x,y:0,z:opts.z??target.z,width:opts.width||.04,height:drop,color:opts.color||'#111319',name:opts.name||'Curtain Track',style:'curtain',ceilingMounted:true,topY:ceilingH,drapesVisible:opts.drapesVisible!==false});o.userData.editName=opts.name||'Curtain Track';snapRootToCeiling(o,false);return o}
function tidyLayout(){pushHistory();let joins=0,pointFixes=0,hidden=0,grounded=0;const walls=builderObjects.filter(o=>o&&o.visible!==false&&o.userData.builderType==='polyWall');walls.forEach(w=>{const d=w.userData.polyWallData;if(!d)return;const tidy=cleanPolylinePoints(d.points,!!d.closed);if(tidy.changed){d.points=tidy.points;pointFixes++}const points=d.points||[];if(points.length>=2){[0,points.length-1].forEach(idx=>{const world=w.localToWorld(new THREE.Vector3(points[idx][0],0,points[idx][1])).setY(0);const near=nearestWallConnectionPoint(w,world,.28);if(near&&near.point.distanceTo(world)>.005){snapWallEndpointExact(w,idx,near.point);joins++}})}let total=0;for(let i=0;i<(d.closed?d.points.length:d.points.length-1);i++){const a=d.points[i],b=d.points[(i+1)%d.points.length];total+=Math.hypot(b[0]-a[0],b[1]-a[1])}if(!d.closed&&d.points.length<=2&&total<.12){w.visible=false;hidden++}rebuildPolylineWall(w)});builderObjects.forEach(o=>{if(!o||o.visible===false)return;const t=o.userData.builderType;if(['polyWall','platform','solidPolygon','steps','ramp','rampPath','featureBlock'].includes(t)&&Math.abs(o.position.y)<.02){o.position.y=0;grounded++}});if(selectedEdit){updateVertexHandles();updateSelectionBox()}saveLocalEditState(false);flashEditor('TIDY DONE · '+joins+' joins · '+pointFixes+' point cleanups'+(hidden?' · '+hidden+' tiny spare walls hidden':'')+(grounded?' · '+grounded+' grounded':''))}
function snapTraceOrDragPointToFrame(source,p,maxDist=FAST_FRAME_SNAP_TOL){if(!fastFrameMode)return null;return nearestWallConnectionPoint(source,p,maxDist)}
function orthogonalTracePoint(raw){if(!orthoTraceEnabled||!drawPoints.length)return raw;const prev=drawPoints[drawPoints.length-1],dx=raw.x-prev.x,dz=raw.z-prev.z,len=Math.hypot(dx,dz);if(len<1e-6)return raw;if(drawPoints.length<2){return Math.abs(dx)>=Math.abs(dz)?new THREE.Vector3(raw.x,0,prev.z):new THREE.Vector3(prev.x,0,raw.z)}const p2=drawPoints[drawPoints.length-2],ux=prev.x-p2.x,uz=prev.z-p2.z,ul=Math.hypot(ux,uz);if(ul<1e-6)return raw;ux/=ul;uz/=ul;const dirs=[[ux,uz],[-ux,-uz],[-uz,ux],[uz,-ux]];let best=null;dirs.forEach(([vx,vz])=>{const proj=dx*vx+dz*vz;if(proj<=0)return;const cx=prev.x+vx*proj,cz=prev.z+vz*proj,err=Math.hypot(raw.x-cx,raw.z-cz);if(!best||err<best.err)best={x:cx,z:cz,err}});return best?new THREE.Vector3(best.x,0,best.z):raw}
function setSelectedCornerAngle(deg){
  if(!selectedEdit||!['polyWall','rampPath'].includes(selectedEdit.userData.builderType)){flashEditor('Select a traced wall or smart ramp first');return}
  const isRamp=selectedEdit.userData.builderType==='rampPath',d=isRamp?normaliseRampPathData(selectedEdit.userData.rampPathData):selectedEdit.userData.polyWallData,n=d.points.length,i=activeVertexIndex;
  if(i<0){flashEditor('EDIT POINTS → click the corner dot first');return}
  const closed=isRamp?false:!!d.closed;
  if(!closed&&(i===0||i===n-1)){flashEditor('Choose a middle corner · endpoints only have one segment');return}
  const pi=(i-1+n)%n,ni=(i+1)%n,A=d.points[pi],B=d.points[i],C=d.points[ni],inx=B[0]-A[0],inz=B[1]-A[1],il=Math.hypot(inx,inz),outLen=Math.hypot(C[0]-B[0],C[1]-B[1]);
  if(il<1e-6||outLen<1e-6){flashEditor('Corner is too short to align');return}
  const ux=inx/il,uz=inz/il;let nx,nz;
  if(deg===180){nx=ux;nz=uz}else{const c1=[-uz,ux],c2=[uz,-ux],oldx=C[0]-B[0],oldz=C[1]-B[1],d1=(oldx-c1[0]*outLen)**2+(oldz-c1[1]*outLen)**2,d2=(oldx-c2[0]*outLen)**2+(oldz-c2[1]*outLen)**2;[nx,nz]=d1<=d2?c1:c2}
  pushHistory();d.points[ni]=[B[0]+nx*outLen,B[1]+nz*outLen];
  if(isRamp){d.startSnapName='';d.finishSnapName='';rebuildRampPath(selectedEdit)}else rebuildPolylineWall(selectedEdit);
  selectedEdit.updateMatrixWorld(true);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);syncAdvancedFields();
  flashEditor(deg===180?(isRamp?'180° RAMP RUN · exact':'180° STRAIGHT · exact'):(isRamp?'90° RAMP CORNER · exact':'90° CORNER · exact'))
}
function squareAllSelectedRampCorners(){
  if(!selectedEdit||selectedEdit.userData?.builderType!=='rampPath'){flashEditor('Select the smart ramp first');return}
  const d=normaliseRampPathData(selectedEdit.userData.rampPathData),pts=d.points;if(!pts||pts.length<3){flashEditor('Ramp needs at least one bend');return}
  pushHistory();
  for(let i=1;i<pts.length-1;i++){
    const A=pts[i-1],B=pts[i],C=pts[i+1],ix=B[0]-A[0],iz=B[1]-A[1],il=Math.hypot(ix,iz),outLen=Math.hypot(C[0]-B[0],C[1]-B[1]);
    if(il<1e-6||outLen<1e-6)continue;
    const ux=ix/il,uz=iz/il,c1=[-uz,ux],c2=[uz,-ux],ox=C[0]-B[0],oz=C[1]-B[1],d1=(ox-c1[0]*outLen)**2+(oz-c1[1]*outLen)**2,d2=(ox-c2[0]*outLen)**2+(oz-c2[1]*outLen)**2,[nx,nz]=d1<=d2?c1:c2;
    pts[i+1]=[B[0]+nx*outLen,B[1]+nz*outLen];
  }
  d.startSnapName='';d.finishSnapName='';rebuildRampPath(selectedEdit);selectedEdit.updateMatrixWorld(true);updateVertexHandles();updateSelectionBox();saveLocalEditState(false);syncAdvancedFields();flashEditor('ALL RAMP BENDS SQUARED · full-width flush corner landings');
}
function syncFastFrameUI(){const a=document.getElementById('toggleFastFrame'),o=document.getElementById('toggleOrthoTrace'),v=document.getElementById('toggleFrameView'),s=document.getElementById('fastFrameStatus');if(a){a.classList.toggle('fast-active',fastFrameMode);a.textContent=fastFrameMode?'FRAME MODE ON':'FRAME MODE OFF'}if(o){o.classList.toggle('fast-active',orthoTraceEnabled);o.textContent=orthoTraceEnabled?'ORTHO TRACE ON':'ORTHO TRACE OFF'}if(v){v.classList.toggle('fast-active',frameViewActive);v.textContent=frameViewActive?'NORMAL VIEW':'FRAME VIEW'}if(s)s.textContent=fastFrameMode?'SNAP + STRUCTURE':'OFF'}
function toggleFastFrameMode(){fastFrameMode=!fastFrameMode;syncFastFrameUI();saveLocalEditState(false);flashEditor(fastFrameMode?'Fast frame mode ON · wall-first selection + magnetic endpoints':'Fast frame mode OFF · all editable objects selectable')}
function toggleOrthoTraceMode(){orthoTraceEnabled=!orthoTraceEnabled;syncFastFrameUI();saveLocalEditState(false);flashEditor(orthoTraceEnabled?'Ortho trace ON · straight / 90° segments':'Ortho trace OFF · free-angle tracing')}
function toggleFrameViewMode(){if(!frameViewActive){frameViewPreviousLayers=captureLayerState();frameViewPreviousRoomFloor=roomFloorEditView;const next={...frameViewPreviousLayers,walls:true,planGuide:true,labels:false,lights:false,ceiling:false,stage:true,production:false,lighting:false,furniture:false,artDecor:false,curtains:false};applyLayerState(next);roomFloorEditView='normal';roomFloorNormalPreview=false;frameViewActive=true;if(!mode2d)setMode(true)}else{if(frameViewPreviousLayers)applyLayerState(frameViewPreviousLayers);roomFloorEditView='normal';frameViewActive=false}applyRoomFloorEditDisplay();syncRoomFloorViewUI();syncFastFrameUI();saveLocalEditState(false);flashEditor(frameViewActive?'FRAME VIEW · clutter hidden':'Normal layers restored')}
function nearestWallSegmentSnap(p,excludeRoot=null,maxDist=ROOM_DRAW_SNAP_TOL){let best=null;editorRoots.filter(o=>o&&o.visible!==false&&isWallRoot(o)&&o!==excludeRoot).forEach(w=>wallSegmentsWorld(w).forEach(seg=>{const hit=nearestPointOnSegment2D(p.clone().setY(0),seg.a,seg.b);if(hit.dist<=maxDist&&(!best||hit.dist<best.dist))best={point:hit.point.clone(),dist:hit.dist,root:w,segmentIndex:seg.segmentIndex}}));return best}
function snapTracePointToWallEndpoint(p,excludeRoot=null,maxDist=ROOM_DRAW_SNAP_TOL){const best=nearestWallSegmentSnap(p,excludeRoot,maxDist);return best?best.point:p}
function addSemicircleToSelectedWall(sign=1){if(!selectedEdit||!isWallRoot(selectedEdit)){flashEditor('Select a wall first');return}let root=selectedEdit;if(root.userData.builderType!=='polyWall'){pushHistory();root=ensurePointEditableWall(root,true)}else pushHistory();const d=root.userData.polyWallData,n=d.points.length;if(n<2){history.pop();return}let i=(activeVertexIndex>=0?activeVertexIndex:0),j;if(d.closed){j=(i+1)%n}else if(i>=n-1){j=i-1;const t=i;i=j;j=t}else j=i+1;const a=d.points[i],b=d.points[j],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.25){history.pop();flashEditor('That wall segment is too short for a half-circle');return}const ux=dx/len,uz=dz/len,nx=-uz*sign,nz=ux*sign,cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2,r=len/2,steps=10,arc=[];for(let k=1;k<steps;k++){const th=Math.PI-k*Math.PI/steps;arc.push([cx+ux*r*Math.cos(th)+nx*r*Math.sin(th),cz+uz*r*Math.cos(th)+nz*r*Math.sin(th)])}if(j===i+1)d.points.splice(i+1,0,...arc);else{arc.reverse();d.points.splice(j+1,0,...arc)}rebuildPolylineWall(root);root.updateMatrixWorld(true);activeVertexIndex=i;updateVertexHandles();updateSelectionBox();saveLocalEditState(false);flashEditor(sign>0?'Semi-circle added · existing room floors left fixed':'Reverse semi-circle added · existing room floors left fixed')}
function inheritCutWallMeta(src,dst){if(!src||!dst)return dst;['buildPhase','buildCategory','buildItem','phaseLocked','lockedBase'].forEach(k=>{if(src.userData&&src.userData[k]!==undefined)dst.userData[k]=src.userData[k]});if(typeof applyPhaseVisibilityToObject==='function')applyPhaseVisibilityToObject(dst);return dst}
function removeDynamicRoot(root){if(!root)return;if(transform&&transform.object===root)transform.detach();builderObjects=builderObjects.filter(o=>o!==root);editorRoots=editorRoots.filter(o=>o!==root);if(root.parent)root.parent.remove(root);disposeObject3D(root)}
function insertDoorIntoWall(root,point,opts={}){
  if(!root||!isWallRoot(root))return null;
  const doorW=Math.max(.25,+opts.width||.96),doorH=Math.max(.25,+opts.height||2.08),post=Math.max(.012,Math.min(.065,+opts.post||.028)),openingW=doorW+post*2,wallH=getWallHeight(root)||2.55,wallW=getWallWidth(root)||.18,color=extractObjectColour(root),hinge=opts.hinge==='right'?'right':'left',apex=opts.apex==='outward'?'outward':'inward';
  if(root.userData.builderType==='curvedWall')root=ensurePointEditableWall(root,false);
  if(!root||!isWallRoot(root))return null;
  if(!opts.skipHistory)pushHistory();
  const finish=(start,end,dir,leftWall,rightWall)=>{
    root.visible=false;root.userData.cutByDoor=true;
    inheritCutWallMeta(root,leftWall);inheritCutWallMeta(root,rightWall);
    const center=start.clone().add(end).multiplyScalar(.5),door=createDoorObject({x:center.x,y:mainFloorLevel(),z:center.z,width:doorW,height:Math.min(doorH,wallH),depth:Math.max(.035,Math.min(wallW*.55,.09)),post,hinge,apex,color:opts.color||'#050607',name:opts.name||'Door'});
    door.rotation.y=-Math.atan2(dir.z,dir.x);door.userData.attachedWallCut=true;door.userData.cutSourceWallId=root.userData.editId||'';door.userData.cutLeftWallId=leftWall&&leftWall.userData?leftWall.userData.editId||'':'';door.userData.cutRightWallId=rightWall&&rightWall.userData?rightWall.userData.editId||'':'';
    if(opts.phaseSource&&opts.phaseSource.userData){['buildPhase','buildCategory','buildItem','phaseLocked'].forEach(k=>{if(opts.phaseSource.userData[k]!==undefined)door.userData[k]=opts.phaseSource.userData[k]});if(typeof applyPhaseVisibilityToObject==='function')applyPhaseVisibilityToObject(door)}
    selectEdit(door);saveLocalEditState(false);flashEditor('Door snapped to wall · wall opening cut cleanly');return door
  };
  if(root.userData.builderType==='wall'){
    const ep=wallEndpoints(root);if(!ep)return null;const hit=nearestPointOnSegment2D(point.clone().setY(0),ep[0],ep[1]),dir=ep[1].clone().sub(ep[0]).setY(0).normalize(),segLen=ep[0].distanceTo(ep[1]),half=openingW/2;
    if(segLen<openingW+.10){if(!opts.skipHistory)history.pop();flashEditor('That wall section is too short for this door width');return null}
    const mid=Math.max(half+.025,Math.min(segLen-half-.025,segLen*hit.t)),start=ep[0].clone().add(dir.clone().multiplyScalar(mid-half)),end=ep[0].clone().add(dir.clone().multiplyScalar(mid+half));
    const leftWall=ep[0].distanceTo(start)>.04?createStraightWallFromPoints(ep[0],start,{width:wallW,height:wallH,color,name:(root.userData.editName||'Wall')+' · Door Left'}):null;
    const rightWall=end.distanceTo(ep[1])>.04?createStraightWallFromPoints(end,ep[1],{width:wallW,height:wallH,color,name:(root.userData.editName||'Wall')+' · Door Right'}):null;
    return finish(start,end,dir,leftWall,rightWall)
  }
  if(root.userData.builderType==='polyWall'){
    const d=root.userData.polyWallData,worldPts=d.points.map(p=>root.localToWorld(new THREE.Vector3(p[0],0,p[1]))),segCount=d.closed?worldPts.length:worldPts.length-1;let best=null;
    for(let i=0;i<segCount;i++){const j=(i+1)%worldPts.length,hit=nearestPointOnSegment2D(point.clone().setY(0),worldPts[i],worldPts[j]);if(!best||hit.dist<best.hit.dist)best={i,j,hit}}
    if(!best)return null;const a=worldPts[best.i],b=worldPts[best.j],dir=b.clone().sub(a).setY(0).normalize(),len=a.distanceTo(b),half=openingW/2;
    if(len<openingW+.10){if(!opts.skipHistory)history.pop();flashEditor('That wall section is too short for this door width');return null}
    const mid=Math.max(half+.025,Math.min(len-half-.025,len*best.hit.t)),start=a.clone().add(dir.clone().multiplyScalar(mid-half)),end=a.clone().add(dir.clone().multiplyScalar(mid+half));
    if(d.closed){/* Keep this predictable: turn the closed run into two open runs around the doorway. */const ordered=[];let k=best.j;while(k!==best.i){ordered.push(worldPts[k]);k=(k+1)%worldPts.length}ordered.push(worldPts[best.i]);const run=[end,...ordered,start];const wall=createPolylineWallFromWorldPoints(run,{width:d.width,height:d.height,color:extractObjectColour(root),name:(root.userData.editName||'Wall')+' · Door Cut',style:d.style||'solid',slatGap:d.slatGap,slatWidth:d.slatWidth,closed:false});return finish(start,end,dir,wall,null)}
    const left=[...worldPts.slice(0,best.i+1),start],right=[end,...worldPts.slice(best.i+1)],leftWall=left.length>=2?createPolylineWallFromWorldPoints(left,{width:d.width,height:d.height,color:extractObjectColour(root),name:(root.userData.editName||'Wall')+' · Door Left',style:d.style||'solid',slatGap:d.slatGap,slatWidth:d.slatWidth}):null,rightWall=right.length>=2?createPolylineWallFromWorldPoints(right,{width:d.width,height:d.height,color:extractObjectColour(root),name:(root.userData.editName||'Wall')+' · Door Right',style:d.style||'solid',slatGap:d.slatGap,slatWidth:d.slatWidth}):null;
    return finish(start,end,dir,leftWall,rightWall)
  }
  if(!opts.skipHistory)history.pop();return null
}
function makeSelectedDescriptor(root){if(!root||!isEditableRoot(root))return null;const type=root.userData.builderType;if(['wall','curvedWall','polyWall','platform','solidPolygon','barLeaner','pillar','steps','ramp','rampPath','fixtureAsset','furniture','artwork','plantAsset','barAsset','curtainRail','featureBlock','ledScreen','shelfArt','refPin'].includes(type))return captureBuilderObject(root);if(type==='platformBox'){const box3=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box3.getSize(size);const c=new THREE.Vector3();box3.getCenter(c);return {type:'platform',name:(root.userData.editName||'Platform')+' Copy',id:null,color:extractObjectColour(root),p:[c.x,0,c.z],r:[0,root.rotation.y,0,'XYZ'],s:[1,1,1],v:true,locked:false,platform:{shape:'rect',points:presetPlatformPoints('rect',size.x,size.z),height:Math.max(.05,size.y)}}; }return null}
function buildObjectFromDescriptor(d){
  if(d&&d.type==='fixtureAsset'){
    const n=String(d.name||d.buildItem||'').toLowerCase();
    d.asset=d.asset&&typeof d.asset==='object'?d.asset:{};
    if(d.asset.kind==='toilet'||!d.asset.kind){
      if(n.includes('guitar amp'))d.asset.kind='guitarAmpStack';
      else if(n.includes('bass amp'))d.asset.kind='bassAmpStack';
      else if(n.includes('wedge')||n.includes('floor monitor'))d.asset.kind='wedgeMonitor';
    }
  }
  let o=null;if(d.type==='wall'){const b=d.base||{};o=createStraightWallFromPoints(new THREE.Vector3(0,0,0),new THREE.Vector3(b.length||1,0,0),{height:b.height||2.55,width:b.width||.18,id:d.id,name:d.name,color:d.color});o.position.set(0,(b.height||2.55)/2,0)}else if(d.type==='curvedWall'){const c=d.curve||{points:[[-1,0],[0,-1],[1,0]],width:.18,height:2.58};const p=c.points.map(v=>new THREE.Vector3(v[0],0,v[1]));o=createCurvedWallFromPoints(p[0],p[1],p[2],{width:c.width,height:c.height,id:d.id,name:d.name,color:d.color});o.userData.curveData=JSON.parse(JSON.stringify(c));rebuildCurvedWall(o)}else if(d.type==='polyWall'){const p=d.polyWall||{points:[[-1,0],[1,0]],width:.18,height:2.58,style:'solid'};o=createPolylineWallObject(p.points,{width:p.width,height:p.height,id:d.id,name:d.name,color:d.color,style:p.style||'solid',slatGap:p.slatGap,slatWidth:p.slatWidth,closed:!!p.closed,ceilingMounted:p.ceilingMounted,topY:p.topY,drapesVisible:p.drapesVisible})}else if(d.type==='platform'){const p=d.platform||{};o=createPlatformObject(p.shape||'rect',{points:p.points,height:p.height,id:d.id,name:d.name,x:0,z:0,color:d.color,roomData:p.roomData||null})}else if(d.type==='solidPolygon'){const q=d.solid||{};o=createSolidPolygonObject(q.points||presetPlatformPoints('rect',2,1),{height:q.height||.5,role:q.role||'solid',autoFloorLock:q.autoFloorLock!==false,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})}else if(d.type==='barLeaner'){const q=d.leaner||{};o=createBarLeanerObject({...q,id:d.id,name:d.name,x:0,y:0,z:0,color:q.topColor||d.color})}else if(d.type==='pillar'){const p=d.pillar||{};o=createPillarObject(p.shape||'rect',{width:p.width,depth:p.depth,height:p.height,id:d.id,name:d.name,x:0,z:0,color:d.color})}else if(d.type==='steps'){const p=d.steps||{};o=createStepsObject({count:p.count,width:p.width,run:p.run,height:p.height,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})}else if(d.type==='ramp'){const p=d.ramp||{};o=createRampObject({width:p.width,depth:p.depth,height:p.height,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})}else if(d.type==='rampPath'){const p=d.rampPath||{};o=createRampPathObject({points:p.points,width:p.width,height:p.height,startLevel:p.startLevel,finishLevel:p.finishLevel,thickness:p.thickness,autoFloorSnap:p.autoFloorSnap,startSnapName:p.startSnapName,finishSnapName:p.finishSnapName,id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})}else if(['furniture','artwork','plantAsset','barAsset','fixtureAsset'].includes(d.type)){o=createVenueAssetByType(d.type,d.asset||{},{id:d.id,name:d.name,x:0,y:0,z:0,color:d.color})}else if(d.type==='curtainRail'){o=createCurtainRailObject({id:d.id,name:d.name,x:0,z:0,color:d.color,...(d.asset||{})})}else if(d.type==='featureBlock'){o=createFeatureBlockObject({id:d.id,name:d.name,x:0,z:0,color:d.color})}else if(d.type==='ledScreen'){o=createLedScreenObject({id:d.id,name:d.name,x:0,z:0,color:d.color,visualLoopIndex:d.visualLoopIndex})}else if(d.type==='shelfArt'){o=createShelfArtObject({id:d.id,name:d.name,x:0,z:0,color:d.color})}else if(d.type==='refPin'){o=createRefPinObject({id:d.id,name:d.name,x:0,z:0,color:d.color})}if(o){
  applyTransformState(o,d);
  o.userData.lockedBase=!!d.locked;
  o.userData.buildPhase=Math.min(7,Math.max(1,+d.phase||phaseForObject(o)||1));
  o.userData.buildCategory=d.category||o.userData.buildCategory||'';
  o.userData.buildItem=d.buildItem||o.userData.buildItem||'';
  o.userData.phaseLocked=!!d.phaseLocked;
  o.userData.groupId=d.group||'';
  o.userData.viewLayer=d.viewLayer||'';
  o.userData.v184EventLayoutMember=!!d.eventLayoutMember;
  o.userData.v185EventTypes=Array.isArray(d.eventTypes)?d.eventTypes.slice():[];
  noteGroupId(o.userData.groupId);
  if(isSpeakerStackRoot(o)&&d.color){o.userData.colorOverride=d.color;rebuildSpeakerStackObject(o)}
  else if(d.color&&!['artwork','plantAsset','barAsset'].includes(d.type))setObjectColour(o,d.color);
  if(d.finish)applySurfaceFinish(o,d.finish)
}return o}
function copySelectedEditable(){if(activeGroupId){const items=groupMembersById(activeGroupId,true).map(makeSelectedDescriptor).filter(Boolean);if(!items.length)return false;copyBuffer={__group:true,items:JSON.parse(JSON.stringify(items))};flashEditor(items.length+' grouped items copied');return true}const d=makeSelectedDescriptor(selectedEdit);if(!d){flashEditor('Select an editable wall, floor, pillar or added object first');return false}copyBuffer=JSON.parse(JSON.stringify(d));flashEditor((selectedEdit.userData.editName||'Item')+' copied');return true}
function pasteCopiedSelection(offsetX=.55,offsetZ=.55){if(!copyBuffer){flashEditor('Nothing copied yet');return null}pushHistory();if(copyBuffer.__group){const gid=nextGroupId(),made=[];(copyBuffer.items||[]).forEach(src=>{const d=JSON.parse(JSON.stringify(src));d.id=null;d.locked=false;d.group='';d.name=(d.name||'Copy')+' Copy';if(!d.p)d.p=[0,0,0];d.p=[(d.p[0]||0)+offsetX,d.p[1]||0,(d.p[2]||0)+offsetZ];const o=buildObjectFromDescriptor(d);if(o){o.userData.groupId=gid;if(o.userData&&o.userData.v184EventLayoutMember)o.userData.v178IntentionalEventDuplicate=true;made.push(o)}});if(made.length){saveLocalEditState(false);selectGroupById(gid);flashEditor(made.length+' grouped items pasted');return made[0]}history.pop();return null}const d=JSON.parse(JSON.stringify(copyBuffer));d.id=null;d.locked=false;d.group='';d.name=(d.name||'Copy')+' Copy';if(!d.p)d.p=[0,0,0];d.p=[(d.p[0]||0)+offsetX,d.p[1]||0,(d.p[2]||0)+offsetZ];const o=buildObjectFromDescriptor(d);if(o){if(o.userData&&o.userData.v184EventLayoutMember)o.userData.v178IntentionalEventDuplicate=true;selectEdit(o);saveLocalEditState(false);flashEditor('Copy pasted')}return o}
function duplicateSelectedEditable(){if(!copySelectedEditable())return null;return pasteCopiedSelection(.45,.45)}
function platformGeometry(points,height){
  const n=points.length,verts=[],idx=[],contour=points.map(p=>new THREE.Vector2(p[0],p[1]));
  points.forEach(([x,z])=>verts.push(x,0,z));points.forEach(([x,z])=>verts.push(x,height,z));
  const tris=THREE.ShapeUtils.triangulateShape(contour,[]);
  tris.forEach(tr=>{const [a,b,c]=tr;idx.push(c,b,a);idx.push(a+n,b+n,c+n)});
  for(let i=0;i<n;i++){const j=(i+1)%n;idx.push(i,j,j+n,i,j+n,i+n)}
  const indexed=new THREE.BufferGeometry();
  indexed.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  indexed.setIndex(idx);
  const sharp=indexed.toNonIndexed();
  indexed.dispose();
  sharp.computeVertexNormals();
  return sharp
}
function rebuildPlatform(root){const d=root.userData.platformData;if(!d)return;if(root.geometry)root.geometry.dispose();root.geometry=platformGeometry(d.points,d.height);syncFloorBleed(root)}
function presetPlatformPoints(shape,w=3,d=2){if(shape==='triangle')return [[0,-d/2],[w/2,d/2],[-w/2,d/2]];if(shape==='hexagon'){const pts=[];for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;pts.push([Math.cos(a)*w/2,Math.sin(a)*d/2])}return pts}if(shape==='circle'){const pts=[];for(let i=0;i<24;i++){const a=-Math.PI/2+i*Math.PI*2/24;pts.push([Math.cos(a)*w/2,Math.sin(a)*d/2])}return pts}return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]]}
function createPlatformObject(shape='rect',opts={}){const g=new THREE.Mesh(platformGeometry(opts.points||presetPlatformPoints(shape,opts.width||3,opts.depth||2),opts.height||.30),new THREE.MeshStandardMaterial({color:opts.color||0x15171b,roughness:.8,side:THREE.DoubleSide}));g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);g.castShadow=true;g.receiveShadow=true;g.userData.platformData={shape,points:(opts.points||presetPlatformPoints(shape,opts.width||3,opts.depth||2)).map(p=>[...p]),height:opts.height||.30,roomData:opts.roomData?JSON.parse(JSON.stringify(opts.roomData)):null};if(opts.color)g.userData.colorOverride=opts.color;venue.add(g);registerBuilderRoot(g,opts.name||'Raised Floor','platform',opts.id);return g}
function rebuildSolidPolygon(root){const d=root&&root.userData&&root.userData.solidData;if(!d)return;if(root.geometry)root.geometry.dispose();root.geometry=platformGeometry(d.points,d.height)}
function createSolidPolygonObject(points,opts={}){const h=Math.max(.01,+opts.height||.5),hex=opts.color||'#101218',m=new THREE.Mesh(platformGeometry(points,h),new THREE.MeshStandardMaterial({color:hex,roughness:.78,side:THREE.DoubleSide}));m.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);m.castShadow=true;m.receiveShadow=true;m.userData.solidData={points:(points||presetPlatformPoints('rect',2,1)).map(p=>[...p]),height:h,role:opts.role||'solid',autoFloorLock:opts.autoFloorLock!==false};m.userData.colorOverride=hex;venue.add(m);registerBuilderRoot(m,opts.name||'Editable Solid','solidPolygon',opts.id);return m}

function createCustomShapeObject(shape='rect',opts={}){const map={square:presetPlatformPoints('rect',1.2,1.2),rect:presetPlatformPoints('rect',1.8,1.0),triangle:presetPlatformPoints('triangle',1.6,1.25)};return createSolidPolygonObject((opts.points||map[shape]||map.rect),{height:opts.height||.55,role:'customObject',autoFloorLock:false,x:opts.x??target.x,y:opts.y??mainFloorLevel(),z:opts.z??target.z,color:opts.color||'#171a20',name:opts.name||('Custom '+shape.charAt(0).toUpperCase()+shape.slice(1)),id:opts.id})}
function currentStaticSolidWorldPoints(root){const d=root&&root.userData&&root.userData.staticSolidEdit;if(!d)return [];root.updateMatrixWorld(true);const base=new THREE.Matrix4().fromArray(d.baseMatrix),delta=root.matrixWorld.clone().multiply(base.clone().invert());return d.points.map(p=>new THREE.Vector3(p[0],d.baseY,p[1]).applyMatrix4(delta))}
function v177ExistingStructuralEditable(role,exclude=null){const all=(typeof builderObjects!=='undefined'?builderObjects:[]);return all.find(o=>{if(!o||o===exclude||!o.userData)return false;const n=String(o.userData.editName||'').toLowerCase(),sr=String(o.userData.solidData&&o.userData.solidData.role||'').toLowerCase();if(role==='stage')return sr==='stage'||n.startsWith('stage · editable');if(role==='foh')return sr==='foh'||n.startsWith('foh booth · editable');return false})||null}
function ensurePointEditableSolid(root){if(isSolidPolygonRoot(root))return root;if(!isStaticPointSolid(root))return null;const meta=root.userData.staticSolidEdit||{},role=String(meta.role||'').toLowerCase();if(role==='stage'||role==='foh'){const existing=v177ExistingStructuralEditable(role,root);if(existing){root.visible=false;if(existing.visible!==false)selectEdit(existing);return existing}}const world=currentStaticSolidWorldPoints(root);if(world.length<3)return null;const b=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();b.getSize(size);const cx=world.reduce((v,p)=>v+p.x,0)/world.length,cz=world.reduce((v,p)=>v+p.z,0)/world.length,pts=world.map(p=>[p.x-cx,p.z-cz]),baseLevel=b.min.y-mainFloorLevel(),autoFloor=Math.abs(baseLevel)<=.12;const m=createSolidPolygonObject(pts,{height:Math.max(.01,size.y),role:meta.role,autoFloorLock:autoFloor,x:cx,y:b.min.y,z:cz,name:(root.userData.editName||'Object')+' · Editable',color:extractObjectColour(root)});root.visible=false;selectEdit(m);return m}
function rebuildBarLeaner(root){const d=root&&root.userData&&root.userData.leanerData;if(!d)return;while(root.children.length){const c=root.children.pop();if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose()}const L=Math.max(.45,+d.length||1.8),W=Math.max(.18,+d.width||.38),H=Math.max(.55,+d.height||1.05),T=Math.max(.035,Math.min(+d.topThickness||.06,H*.25)),dia=Math.max(.08,+d.legDiameter||.2032),r=dia/2,topMat=new THREE.MeshStandardMaterial({color:d.topColor||'#08090b',roughness:.7,metalness:.08}),metal=new THREE.MeshStandardMaterial({color:0xb8bec7,roughness:.25,metalness:.82});box(L,T,W,0,H-T/2,0,topMat,root);const legH=Math.max(.08,H-T),inset=Math.max(r+.08,Math.min(L*.22,+d.legInset||.22)),x=Math.max(0,L/2-inset);[-x,x].forEach(px=>cyl(r,legH,px,legH/2,0,metal,root,28));d.length=L;d.width=W;d.height=H;d.topThickness=T;d.legDiameter=dia;d.legInset=inset}
function createBarLeanerObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);g.userData.leanerData={length:opts.length||1.8,width:opts.width||.38,height:opts.height||1.05,topThickness:opts.topThickness||.06,legDiameter:opts.legDiameter||.2032,legInset:opts.legInset||.22,topColor:opts.color||opts.topColor||'#08090b'};g.userData.colorOverride=g.userData.leanerData.topColor;venue.add(g);registerBuilderRoot(g,opts.name||'Bar Leaner','barLeaner',opts.id);rebuildBarLeaner(g);return g}
function bakeBarLeanerScale(root){if(!isBarLeanerRoot(root))return;const d=root.userData.leanerData,s=root.scale;d.length*=Math.max(.02,Math.abs(s.x));d.height*=Math.max(.02,Math.abs(s.y));d.width*=Math.max(.02,Math.abs(s.z));root.scale.set(1,1,1);rebuildBarLeaner(root)}
function pillarGeometry(shape,w,d,h){if(shape==='rect')return new THREE.BoxGeometry(w,h,d);const seg=shape==='triangle'?3:shape==='hexagon'?6:shape==='octagon'?8:32;return new THREE.CylinderGeometry(Math.max(w,d)/2,Math.max(w,d)/2,h,seg)}
function createPillarObject(shape='rect',opts={}){const w=opts.width||.62,d=opts.depth||.62,h=opts.height||2.58,m=new THREE.Mesh(pillarGeometry(shape,w,d,h),new THREE.MeshStandardMaterial({color:opts.color||0x0a0b0d,roughness:.84}));m.position.set(opts.x??target.x,h/2,opts.z??target.z);m.castShadow=true;m.receiveShadow=true;m.userData.pillarData={shape,width:w,depth:d,height:h};if(opts.color)m.userData.colorOverride=opts.color;venue.add(m);registerBuilderRoot(m,opts.name||'Pillar','pillar',opts.id);return m}

function createFloorObject(opts={}){const h=opts.height||.08,hex=opts.color||extractObjectColour(exteriorFloor)||'#ababab';return createPlatformObject('rect',{width:opts.width||3.0,depth:opts.depth||2.0,height:h,x:opts.x??target.x,y:opts.y??-h,z:opts.z??target.z,name:opts.name||'Floor',color:hex,id:opts.id})}
function createStepsObject(opts={}){const g=new THREE.Group(),count=opts.count||4,w=opts.width||1.8,run=opts.run||1.35,h=opts.height||.48,mat=new THREE.MeshStandardMaterial({color:opts.color||0x17191c,roughness:.82});g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);for(let i=0;i<count;i++){const stepH=h*(i+1)/count,depth=run/count;box(w,stepH,depth,0,stepH/2,-run/2+depth*(i+.5),mat,g)}g.userData.stepsData={count,width:w,run,height:h};if(opts.color)g.userData.colorOverride=opts.color;venue.add(g);registerBuilderRoot(g,opts.name||'Steps','steps',opts.id);return g}
function rampGeometry(w=1.8,d=2.2,h=.48){const v=[-w/2,0,-d/2, w/2,0,-d/2, -w/2,0,d/2, w/2,0,d/2, -w/2,h,d/2, w/2,h,d/2],idx=[0,1,3,0,3,2, 0,4,5,0,5,1, 2,3,5,2,5,4, 0,2,4, 1,5,3];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);const sharp=g.toNonIndexed();g.dispose();sharp.computeVertexNormals();return sharp}
function createRampObject(opts={}){const w=opts.width||1.8,d=opts.depth||2.2,h=opts.height||.48,m=new THREE.Mesh(rampGeometry(w,d,h),new THREE.MeshStandardMaterial({color:opts.color||0x17191c,roughness:.82,side:THREE.DoubleSide}));m.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);m.castShadow=true;m.receiveShadow=true;m.userData.rampData={width:w,depth:d,height:h};if(opts.color)m.userData.colorOverride=opts.color;venue.add(m);registerBuilderRoot(m,opts.name||'Ramp','ramp',opts.id);return m}

// V32 smart ramp path: level-only floor snapping + square full-width corner landings + flush no-roll runs.
function rampPathLength(points){let n=0;for(let i=1;i<(points||[]).length;i++)n+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return Math.max(.001,n)}
function normaliseRampPathData(d){if(!d)return d;if(d.startLevel==null)d.startLevel=Math.max(0,+d.height||.45);if(d.finishLevel==null)d.finishLevel=0;if(d.thickness==null)d.thickness=.08;if(d.autoFloorSnap==null)d.autoFloorSnap=true;d.width=Math.max(.10,+d.width||1.20);d.startLevel=+d.startLevel||0;d.finishLevel=+d.finishLevel||0;d.thickness=Math.max(.02,+d.thickness||.08);d.height=Math.abs(d.startLevel-d.finishLevel);return d}
function rampPathCumulative(points){const pts=points||[],cum=[0];for(let i=1;i<pts.length;i++)cum[i]=cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return cum}
function rampPathPointLevels(d){normaliseRampPathData(d);const cum=rampPathCumulative(d.points),total=Math.max(.001,cum[cum.length-1]||0);return cum.map(v=>d.startLevel+(d.finishLevel-d.startLevel)*(v/total))}
function rampPathSlopeInfo(d){normaliseRampPathData(d);const run=rampPathLength(d.points),rise=d.finishLevel-d.startLevel,absRise=Math.abs(rise),angle=THREE.MathUtils.radToDeg(Math.atan2(absRise,run)),grade=run>0?absRise/run*100:0,ratio=absRise>.0001?run/absRise:Infinity;return {run,rise,angle,grade,ratio}}

// Each straight run is its own zero-roll slab: both left/right edges at a station share the same Y.
// This avoids the twisted-ribbon effect at sharp path bends.
function rampPathGeometry(points,width=1.2,startLevel=.45,finishLevel=0,thickness=.08){
  const pts=(points&&points.length>=2?points:[[-1,0],[1,0]]).map(p=>[+p[0]||0,+p[1]||0]),w=Math.max(.10,+width||1.2),half=w/2,t=Math.max(.02,+thickness||.08),d={points:pts,width:w,startLevel:+startLevel||0,finishLevel:+finishLevel||0,thickness:t},levels=rampPathPointLevels(d),verts=[],idx=[];
  const addV=(x,y,z)=>{verts.push(x,y,z);return verts.length/3-1};
  const quad=(a,b,c,d)=>idx.push(a,b,c,a,c,d);
  const addBoxPolygon=(poly,yTop)=>{
    const top=[],bot=[];
    poly.forEach(q=>top.push(addV(q[0],yTop,q[1])));poly.forEach(q=>bot.push(addV(q[0],yTop-t,q[1])));
    const contour=poly.map(q=>new THREE.Vector2(q[0],q[1])),tris=THREE.ShapeUtils.triangulateShape(contour,[]);
    tris.forEach(tr=>{const[a,b,c]=tr;idx.push(top[a],top[b],top[c]);idx.push(bot[c],bot[b],bot[a])});
    for(let k=0;k<poly.length;k++){const j=(k+1)%poly.length;quad(top[k],bot[k],bot[j],top[j])}
  };
  const runDir=(i)=>{if(i<0||i>=pts.length-1)return null;const a=pts[i],b=pts[i+1],v=new THREE.Vector2(b[0]-a[0],b[1]-a[1]);if(v.lengthSq()<1e-8)return null;return v.normalize()};
  const cornerIsTurn=(i)=>{if(i<=0||i>=pts.length-1)return false;const a=runDir(i-1),b=runDir(i);return !!(a&&b&&Math.abs(a.dot(b))<.999)};
  const trimAt=(i,side,len)=>{
    // Interior bend gets a full-width square landing. Straight-through points do not need one.
    const cornerIndex=side==='start'?i:i+1;
    if(!cornerIsTurn(cornerIndex))return 0;
    // Keep tiny/short ramp runs valid rather than letting the two landings cross over one another.
    return Math.min(half,Math.max(0,len*.42));
  };
  const addRun=(i)=>{
    const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.001)return;
    const ux=dx/len,uz=dz/len,nx=-uz*half,nz=ux*half,ts=trimAt(i,'start',len),te=trimAt(i,'end',len);
    const ax=a[0]+ux*ts,az=a[1]+uz*ts,bx=b[0]-ux*te,bz=b[1]-uz*te;
    if(Math.hypot(bx-ax,bz-az)<.01)return;
    const y0=levels[i],y1=levels[i+1];
    const tl0=addV(ax+nx,y0,az+nz),tr0=addV(ax-nx,y0,az-nz),tr1=addV(bx-nx,y1,bz-nz),tl1=addV(bx+nx,y1,bz+nz);
    const bl0=addV(ax+nx,y0-t,az+nz),br0=addV(ax-nx,y0-t,az-nz),br1=addV(bx-nx,y1-t,bz-nz),bl1=addV(bx+nx,y1-t,bz+nz);
    quad(tl0,tr0,tr1,tl1);quad(bl1,br1,br0,bl0);quad(tl1,tl0,bl0,bl1);quad(tr0,tr1,br1,br0);quad(tl0,bl0,br0,tr0);quad(tl1,tr1,br1,bl1);
  };
  const addSquareCornerLanding=(i)=>{
    if(!cornerIsTurn(i))return;
    const p=pts[i],incoming=runDir(i-1),outgoing=runDir(i);if(!incoming||!outgoing)return;
    // For an exact 90° route, incoming and outgoing become the two axes of the square landing.
    // If a point is slightly off-square, use the incoming axis; SQUARE ALL CORNERS fixes the route itself.
    const ax=incoming.clone(),ay=new THREE.Vector2(-ax.y,ax.x);
    const poly=[
      [p[0]+ax.x*half+ay.x*half,p[1]+ax.y*half+ay.y*half],
      [p[0]-ax.x*half+ay.x*half,p[1]-ax.y*half+ay.y*half],
      [p[0]-ax.x*half-ay.x*half,p[1]-ax.y*half-ay.y*half],
      [p[0]+ax.x*half-ay.x*half,p[1]+ax.y*half-ay.y*half]
    ];
    addBoxPolygon(poly,levels[i]);
  };
  for(let i=0;i<pts.length-1;i++)addRun(i);
  for(let i=1;i<pts.length-1;i++)addSquareCornerLanding(i);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);const sharp=g.toNonIndexed();g.dispose();sharp.computeVertexNormals();sharp.computeBoundingBox();sharp.computeBoundingSphere();return sharp
}
function rebuildRampPath(root){if(!root||root.userData.builderType!=='rampPath'||!root.userData.rampPathData)return;const d=normaliseRampPathData(root.userData.rampPathData);if(root.geometry)root.geometry.dispose();root.geometry=rampPathGeometry(d.points,d.width,d.startLevel,d.finishLevel,d.thickness);root.castShadow=true;root.receiveShadow=true;syncRampLevelUI()}
function createRampPathObject(opts={}){const pts=(opts.points&&opts.points.length>=2?opts.points:[[-1.2,0],[-.4,0],[.4,0],[1.2,0]]).map(p=>[+p[0]||0,+p[1]||0]),w=Math.max(.10,+opts.width||1.20),start=opts.startLevel!=null?+opts.startLevel:(opts.height!=null?Math.max(0,+opts.height):.45),finish=opts.finishLevel!=null?+opts.finishLevel:0,thick=Math.max(.02,+opts.thickness||.08),m=new THREE.Mesh(rampPathGeometry(pts,w,start,finish,thick),new THREE.MeshStandardMaterial({color:opts.color||0x17191c,roughness:.82,side:THREE.DoubleSide}));m.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);m.castShadow=true;m.receiveShadow=true;m.userData.rampPathData={points:pts,width:w,startLevel:start,finishLevel:finish,thickness:thick,height:Math.abs(start-finish),streetEnd:true,autoFloorSnap:opts.autoFloorSnap!==false,startSnapName:opts.startSnapName||'',finishSnapName:opts.finishSnapName||''};if(opts.color)m.userData.colorOverride=opts.color;venue.add(m);registerBuilderRoot(m,opts.name||'Smart Level Ramp','rampPath',opts.id);return m}
function bakeRampPathScale(root){if(!root||root.userData.builderType!=='rampPath')return;const d=normaliseRampPathData(root.userData.rampPathData),sx=Math.max(.001,Math.abs(root.scale.x)),sz=Math.max(.001,Math.abs(root.scale.z));d.points=d.points.map(p=>[p[0]*sx,p[1]*sz]);/* width + deck thickness deliberately stay fixed when route is stretched */root.scale.set(1,1,1);rebuildRampPath(root)}
function rampWorldLevel(root,key){if(!root||root.userData.builderType!=='rampPath')return null;const d=normaliseRampPathData(root.userData.rampPathData),local=key==='finish'?d.finishLevel:d.startLevel;return root.position.y-mainFloorLevel()+local}
function setRampWorldLevel(key,value){if(!selectedEdit||selectedEdit.userData.builderType!=='rampPath')return;const n=+value;if(!Number.isFinite(n))return;pushHistory();const d=normaliseRampPathData(selectedEdit.userData.rampPathData),local=n-(selectedEdit.position.y-mainFloorLevel());if(key==='finish'){d.finishLevel=local;d.finishSnapName=''}else{d.startLevel=local;d.startSnapName=''}d.height=Math.abs(d.startLevel-d.finishLevel);rebuildRampPath(selectedEdit);updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function setRampThickness(value){if(!selectedEdit||selectedEdit.userData.builderType!=='rampPath')return;pushHistory();const d=normaliseRampPathData(selectedEdit.userData.rampPathData);d.thickness=Math.max(.02,+value||.08);rebuildRampPath(selectedEdit);updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function setRampWidth(value){if(!selectedEdit||selectedEdit.userData.builderType!=='rampPath')return;pushHistory();const d=normaliseRampPathData(selectedEdit.userData.rampPathData);d.width=Math.max(.10,+value||1.20);rebuildRampPath(selectedEdit);updateSelectionBox();updateVertexHandles();saveLocalEditState(false);syncAdvancedFields()}
function isRampFloorSnapRoot(o){if(!o||o.visible===false)return false;if(o===exteriorFloor||o===smokeFloor||o===stage)return true;if(isPlatformRoot(o)||isSolidPolygonRoot(o)||isStaticPointSolid(o)||o.userData?.builderType==='floorSurface')return true;const n=String(o.userData?.editName||o.name||'').toLowerCase();return /(^|\s)(floor|platform|stage|raised|vip)(\s|$)/.test(n)}
function rampFloorSnapRoots(rampRoot){return rootsUnique([exteriorFloor,smokeFloor,stage,...staticEditorRoots,...builderObjects]).filter(o=>o&&o!==rampRoot&&isRampFloorSnapRoot(o))}
function nearestRampFloorTopPoint(rampRoot,worldXZ,maxDist=1.25){let best=null,bestD=Math.max(.01,maxDist),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cp=new THREE.Vector3(),q=new THREE.Vector3(),tri=new THREE.Triangle(),norm=new THREE.Vector3();for(const root of rampFloorSnapRoots(rampRoot)){root.updateMatrixWorld(true);const topY=new THREE.Box3().setFromObject(root).max.y;root.traverse(mesh=>{if(!mesh.isMesh||mesh.visible===false||!mesh.geometry?.attributes?.position)return;mesh.updateMatrixWorld(true);const g=mesh.geometry,pos=g.attributes.position,index=g.index,count=index?index.count:pos.count;for(let k=0;k+2<count;k+=3){const ia=index?index.getX(k):k,ib=index?index.getX(k+1):k+1,ic=index?index.getX(k+2):k+2;a.fromBufferAttribute(pos,ia).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(pos,ib).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(pos,ic).applyMatrix4(mesh.matrixWorld);tri.set(a,b,c);tri.getNormal(norm);if(Math.abs(norm.y)<.72)continue;const ay=(a.y+b.y+c.y)/3;if(ay<topY-.08)continue;q.set(worldXZ.x,ay,worldXZ.z);tri.closestPointToPoint(q,cp);const hd=Math.hypot(cp.x-worldXZ.x,cp.z-worldXZ.z);if(hd<bestD-.004||(Math.abs(hd-bestD)<=.004&&(!best||cp.y>best.point.y))){bestD=hd;best={point:cp.clone(),root,distance:hd,name:root.userData?.editName||root.name||'Floor'}}}})}return best}
function rampEndWorldPoint(root,key){const d=normaliseRampPathData(root.userData.rampPathData),i=key==='finish'?d.points.length-1:0,p=d.points[i];return root.localToWorld(new THREE.Vector3(p[0],0,p[1]))}
function snapRampEndToFloorForRoot(root,key,announce=true,maxDist=1.25){if(!root||root.userData?.builderType!=='rampPath')return false;const d=normaliseRampPathData(root.userData.rampPathData),world=rampEndWorldPoint(root,key),snap=nearestRampFloorTopPoint(root,world,maxDist);if(!snap){if(announce)flashEditor('No floor / raised platform close enough to copy the '+key+' level');return false}/* V30: LEVEL-ONLY SNAP. Never alter d.points[i] here; X/Z stays exactly where the user drew it so 90° route corners remain square. */const levelLocal=snap.point.y-root.position.y;if(key==='finish'){d.finishLevel=levelLocal;d.finishSnapName=snap.name}else{d.startLevel=levelLocal;d.startSnapName=snap.name}d.height=Math.abs(d.startLevel-d.finishLevel);rebuildRampPath(root);root.updateMatrixWorld(true);updateVertexHandles();updateSelectionBox();syncAdvancedFields();if(announce){saveLocalEditState(false);flashEditor((key==='finish'?'Finish':'Start')+' LEVEL matched to '+snap.name+' · '+(snap.point.y-mainFloorLevel()).toFixed(3)+' m · X/Z unchanged')}return true}
function snapSelectedRampEndToFloor(key){if(!selectedEdit||selectedEdit.userData?.builderType!=='rampPath'){flashEditor('Select the smart ramp first');return}pushHistory();if(!snapRampEndToFloorForRoot(selectedEdit,key,true,1.50))history.pop()}
function nearestToiletFloor(root,maxDist=.70){if(!isFloorSnappedRestroomFixture(root))return null;root.updateMatrixWorld(true);const box3=new THREE.Box3().setFromObject(root),center=new THREE.Vector3();box3.getCenter(center);return nearestRampFloorTopPoint(root,center,maxDist)}
function snapToiletToFloor(root=selectedEdit,announce=true,maxDist=.70){if(!isFloorSnappedRestroomFixture(root)){if(announce)flashEditor('Select a toilet or urinal first');return false}const snap=nearestToiletFloor(root,maxDist);if(!snap){if(announce)flashEditor('No floor / raised platform directly under this fixture');return false}root.updateMatrixWorld(true);if(isMensUrinal(root)){const origin=root.getWorldPosition(new THREE.Vector3());root.position.y+=snap.point.y-origin.y}else{const b=new THREE.Box3().setFromObject(root),delta=snap.point.y-b.min.y;root.position.y+=delta}const d=root.userData.assetData||(root.userData.assetData={kind:'toilet'});d.floorSnapName=snap.name||'Floor';root.updateMatrixWorld(true);updateSelectionBox();updateEditorSelected();syncAdvancedFields();if(announce){saveLocalEditState(false);flashEditor((isMensUrinal(root)?'Urinal':'Toilet')+' floor reference snapped to '+d.floorSnapName+' · '+(snap.point.y-mainFloorLevel()).toFixed(3)+' m')}return true}
function toggleToiletAutoFloorSnap(){if(!isFloorSnappedRestroomFixture(selectedEdit))return;const d=selectedEdit.userData.assetData||(selectedEdit.userData.assetData={kind:'toilet'});d.autoFloorSnap=d.autoFloorSnap===false;saveLocalEditState(false);syncToiletLevelUI();flashEditor((isMensUrinal(selectedEdit)?'Urinal':'Toilet')+' auto floor snap '+(d.autoFloorSnap?'ON':'OFF'))}
function syncToiletLevelUI(){const box=document.getElementById('toiletLevelBox');if(!box)return;const on=isFloorSnappedRestroomFixture(selectedEdit);box.style.display=on?'block':'none';if(!on)return;normalizeFreestandingToilet(selectedEdit);const d=selectedEdit.userData.assetData,snap=nearestToiletFloor(selectedEdit,.70),status=document.getElementById('toiletFloorStatus'),read=document.getElementById('toiletFloorReadout'),txt=document.getElementById('toiletFloorText'),val=document.getElementById('toiletFloorValue'),auto=document.getElementById('toggleToiletAutoFloor');if(auto){auto.textContent=d.autoFloorSnap?'AUTO FLOOR SNAP ON':'AUTO FLOOR SNAP OFF';auto.classList.toggle('active',!!d.autoFloorSnap)}if(status)status.textContent=(isMensUrinal(selectedEdit)?'URINAL · ':'TOILET · ')+(d.floorSnapName?String(d.floorSnapName).toUpperCase():'FLOOR LEVEL');if(read)read.className='level-status '+(snap?'aligned':'na');if(snap){if(txt)txt.textContent='FLOOR UNDER · '+(snap.name||'Floor').toUpperCase();if(val)val.textContent=(snap.point.y-mainFloorLevel()).toFixed(3)+' m'}else{if(txt)txt.textContent='MOVE OVER FLOOR / PLATFORM';if(val)val.textContent='—'}}

function toggleRampAutoFloorSnap(){if(!selectedEdit||selectedEdit.userData?.builderType!=='rampPath')return;const d=normaliseRampPathData(selectedEdit.userData.rampPathData);d.autoFloorSnap=!d.autoFloorSnap;saveLocalEditState(false);syncRampLevelUI();flashEditor('Ramp endpoint auto LEVEL snap '+(d.autoFloorSnap?'ON · X/Z preserved':'OFF'))}
function syncRampLevelUI(){const box=document.getElementById('rampLevelBox');if(!box)return;const ramp=!!selectedEdit&&selectedEdit.userData&&selectedEdit.userData.builderType==='rampPath';box.style.display=ramp?'block':'none';if(!ramp)return;const d=normaliseRampPathData(selectedEdit.userData.rampPathData),info=rampPathSlopeInfo(d),start=document.getElementById('rampStartLevelInput'),finish=document.getElementById('rampFinishLevelInput'),width=document.getElementById('rampWidthInput'),thick=document.getElementById('rampThicknessInput'),text=document.getElementById('rampSlopeText'),value=document.getElementById('rampSlopeValue'),status=document.getElementById('rampSlopeStatus'),auto=document.getElementById('toggleRampAutoFloorSnap'),snapText=document.getElementById('rampFloorSnapText'),snapValue=document.getElementById('rampFloorSnapValue'),snapBox=document.getElementById('rampFloorSnapStatus');if(start)start.value=(rampWorldLevel(selectedEdit,'start')||0).toFixed(2);if(finish)finish.value=(rampWorldLevel(selectedEdit,'finish')||0).toFixed(2);if(width)width.value=d.width.toFixed(2);if(thick)thick.value=d.thickness.toFixed(2);if(text)text.textContent=(d.finishLevel<d.startLevel?'FALL':'RISE')+' · '+Math.abs(info.rise).toFixed(3)+' m OVER '+info.run.toFixed(2)+' m';if(value)value.textContent=info.angle.toFixed(2)+'° LONG · 0.00° CROSS';if(status)status.textContent=Number.isFinite(info.ratio)?'1:'+info.ratio.toFixed(1)+' · NO ROLL':'LEVEL · NO ROLL';if(auto){auto.textContent=d.autoFloorSnap?'AUTO LEVEL SNAP':'LEVEL SNAP OFF';auto.classList.toggle('active',!!d.autoFloorSnap)}const bits=[];if(d.startSnapName)bits.push('START → '+d.startSnapName);if(d.finishSnapName)bits.push('FINISH → '+d.finishSnapName);if(snapText)snapText.textContent=bits.length?bits.join(' · '):'END POSITION STAYS FIXED · LEVEL SNAPS ONLY';if(snapValue)snapValue.textContent=bits.length?'FLUSH':'↕ LEVEL';if(snapBox){snapBox.classList.toggle('aligned',bits.length>0);snapBox.classList.toggle('na',bits.length===0)}}

function normaliseLedStripData(raw={}){const d={...(raw||{})};d.length=Math.max(.08,+d.length||2);d.radius=Math.max(.008,+d.radius||.025);d.color=d.color||'#39d9f9';d.brightness=Math.max(0,Math.min(8,Number.isFinite(+d.brightness)?+d.brightness:3.2));d.enabled=(raw.enabled!==undefined)?raw.enabled!==false:true;return d}
function normaliseLedStripPathData(raw={}){const src=raw||{},d={...src};d.points=Array.isArray(src.points)?src.points.map(p=>[+p[0]||0,+p[1]||0,+p[2]||0]):[[0,0,0],[2,0,0]];if(d.points.length<2)d.points=[[0,0,0],[2,0,0]];d.radius=Math.max(.008,+d.radius||.025);d.color=d.color||'#39d9f9';d.brightness=Math.max(0,Math.min(8,Number.isFinite(+d.brightness)?+d.brightness:3.2));d.enabled=(src.enabled!==undefined)?src.enabled!==false:true;d.closed=!!src.closed;let total=0;for(let i=1;i<d.points.length;i++){const a=d.points[i-1],b=d.points[i];total+=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])}d.length=Math.max(.08,total);return d}
function isLedStripRoot(o){return !!o&&o.userData&&['ledStrip','ledStripPath'].includes(o.userData.builderType)}
function isLedStripPathRoot(o){return !!o&&o.userData&&o.userData.builderType==='ledStripPath'}
function getLedStripData(root){return isLedStripPathRoot(root)?normaliseLedStripPathData(root.userData.ledPathData||{}):normaliseLedStripData(root&&root.userData&&root.userData.ledData||{})}
function setLedStripData(root,d){if(!root)return;if(isLedStripPathRoot(root))root.userData.ledPathData=normaliseLedStripPathData(d);else root.userData.ledData=normaliseLedStripData(d)}
function ledStripRoots(){return builderObjects.filter(o=>isLedStripRoot(o)&&o.parent&&o.visible!==false)}
function applyLedStripAppearance(root,color,brightness,enabled){if(!root||!isLedStripRoot(root))return;const d=getLedStripData(root);if(color)d.color=color;if(brightness!=null)d.brightness=Math.max(0,Math.min(8,+brightness||0));if(enabled!==undefined)d.enabled=enabled!==false;setLedStripData(root,d);root.userData.colorOverride=d.color;const c=new THREE.Color(d.color),display=d.enabled?c:c.clone().multiplyScalar(.16),liveBrightness=d.enabled?d.brightness:0;root.traverse(o=>{if(o.isMesh&&o.userData.ledStripGlow&&o.material){o.material.color.copy(display);if(o.material.emissive)o.material.emissive.copy(c);o.material.emissiveIntensity=d.enabled?(.18+liveBrightness):0}if(o.isLight&&o.userData.ledStripLight){o.color.copy(c);o.visible=!!d.enabled;o.intensity=d.enabled?(.14+liveBrightness*.42):0;const seg=+o.userData.ledStripSegmentLength||Math.min(2.2,d.length);o.distance=Math.min(2.6,Math.max(1.2,seg*(.82+liveBrightness*.08)));configureRoomOccludedLight(o,128)}});applyPerformanceSensitiveObjects(root);markRenderDirty()}
function createLedStripObject(opts={}){const d=normaliseLedStripData(opts),g=new THREE.Group(),hex=d.color,mat=new THREE.MeshStandardMaterial({color:hex,emissive:hex,emissiveIntensity:d.enabled?d.brightness:0,roughness:.18,metalness:.08});const strip=new THREE.Mesh(new THREE.CylinderGeometry(d.radius,d.radius,d.length,10),mat);strip.userData.ledStripGlow=true;strip.castShadow=true;strip.receiveShadow=true;g.add(strip);[-.32,.32].forEach(t=>{const l=new THREE.PointLight(hex,d.enabled?(.14+d.brightness*.42):0,Math.max(1.2,d.length*(.45+d.brightness*.08)),2);l.position.y=d.length*t;l.userData.ledStripLight=true;l.userData.ledStripSegmentLength=d.length;g.add(l)});g.userData.ledData={length:d.length,radius:d.radius,color:d.color,brightness:d.brightness,enabled:d.enabled};g.userData.colorOverride=d.color;venue.add(g);registerBuilderRoot(g,opts.name||'LED Strip','ledStrip',opts.id);applyLedStripAppearance(g,d.color,d.brightness,d.enabled);return g}
function createLedStripFromPoints(a,b,opts={}){const delta=b.clone().sub(a),len=Math.max(.08,delta.length()),g=createLedStripObject({...opts,length:len});g.position.copy(a).add(b).multiplyScalar(.5);const dir=delta.normalize();g.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);g.updateMatrixWorld(true);return g}
function clearLedStripPathChildren(g){while(g.children.length){const c=g.children.pop();if(c.geometry)c.geometry.dispose();if(c.material){if(Array.isArray(c.material))c.material.forEach(m=>m&&m.dispose&&m.dispose());else c.material.dispose&&c.material.dispose()}}}
function rebuildLedStripPathObject(g){if(!isLedStripPathRoot(g))return;const d=normaliseLedStripPathData(g.userData.ledPathData||{});g.userData.ledPathData=d;clearLedStripPathChildren(g);const hex=d.color,display=d.enabled?hex:new THREE.Color(hex).multiplyScalar(.16);let lightCount=0;for(let i=1;i<d.points.length;i++){const av=d.points[i-1],bv=d.points[i],a=new THREE.Vector3(av[0],av[1],av[2]),b=new THREE.Vector3(bv[0],bv[1],bv[2]),delta=b.clone().sub(a),len=delta.length();if(len<.03)continue;const mat=new THREE.MeshStandardMaterial({color:display,emissive:hex,emissiveIntensity:d.enabled?(.18+d.brightness):0,roughness:.18,metalness:.08}),seg=new THREE.Mesh(new THREE.CylinderGeometry(d.radius,d.radius,len,10),mat);seg.position.copy(a).add(b).multiplyScalar(.5);seg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());seg.userData.ledStripGlow=true;seg.castShadow=true;seg.receiveShadow=true;g.add(seg);if(lightCount<8&&len>.35){const l=new THREE.PointLight(hex,d.enabled?(.14+d.brightness*.42):0,Math.max(1.2,Math.min(2.8,len)*(1+d.brightness*.08)),2);l.position.copy(seg.position);l.userData.ledStripLight=true;l.userData.ledStripSegmentLength=Math.min(2.8,len);g.add(l);lightCount++}}for(let i=0;i<d.points.length;i++){const p=d.points[i],mat=new THREE.MeshStandardMaterial({color:display,emissive:hex,emissiveIntensity:d.enabled?(.18+d.brightness):0,roughness:.18,metalness:.08}),joint=new THREE.Mesh(new THREE.SphereGeometry(d.radius*1.03,10,8),mat);joint.position.set(p[0],p[1],p[2]);joint.userData.ledStripGlow=true;g.add(joint)}applyLedStripAppearance(g,d.color,d.brightness,d.enabled);g.updateMatrixWorld(true)}
function createLedStripPathObject(opts={}){const d=normaliseLedStripPathData(opts),g=new THREE.Group();g.position.set(opts.x||0,opts.y||0,opts.z||0);g.userData.ledPathData=d;g.userData.colorOverride=d.color;venue.add(g);registerBuilderRoot(g,opts.name||'Continuous LED Strip','ledStripPath',opts.id);rebuildLedStripPathObject(g);return g}
function createLedStripPathFromWorldPoints(points,opts={}){if(!Array.isArray(points)||points.length<2)return null;const anchor=points[0].clone(),local=points.map(p=>[p.x-anchor.x,p.y-anchor.y,p.z-anchor.z]);return createLedStripPathObject({...opts,points:local,x:anchor.x,y:anchor.y,z:anchor.z})}
function updateDrawnLedStrips(hex,level){const brightness=Math.max(0,Math.min(8,((level==null?68:level)/100)*8));ledStripRoots().forEach(root=>applyLedStripAppearance(root,hex||'#39d9f9',brightness,undefined))}


/* venue furniture / artwork / plants / lighting / bar asset library */
const venueTextureCache={};
function venueAssetTexture(key){
  if(venueTextureCache[key])return venueTextureCache[key];
  const t=new THREE.TextureLoader().load(VENUE_ASSET_TEXTURES[key],tex=>{tex.encoding=THREE.sRGBEncoding;tex.needsUpdate=true});
  t.encoding=THREE.sRGBEncoding;venueTextureCache[key]=t;return t
}
function cloneVenueAssetTexture(key,ownerId=''){
  if(!key)return null;
  const base=venueAssetTexture(key),t=base.clone();
  t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  t.center.set(.5,.5);t.repeat.set(1,1);t.offset.set(0,0);
  t.userData={...(t.userData||{}),artworkKey:key,artworkOwnerId:ownerId};
  t.needsUpdate=true;return t
}
function assetMat(hex=0x0a0b0d,rough=.78,metal=.08){return new THREE.MeshStandardMaterial({color:hex,roughness:rough,metalness:metal})}
function addAssetBox(g,w,h,d,x,y,z,mat){return box(w,h,d,x,y,z,mat,g)}
function createFurnitureObject(kind='longCouch',opts={}){
  const g=new THREE.Group(),base=assetMat(0x07080a,.78,.08),soft=assetMat(0x101318,.92,.02),soft2=assetMat(0x171a20,.88,.04),metal=assetMat(0x15181d,.35,.72);
  g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  if(kind==='barStool'){
    addAssetBox(g,.42,.11,.42,0,.84,0,soft);addAssetBox(g,.36,.03,.36,0,.905,0,soft2);
    cyl(.045,.70,0,.43,0,metal,g,16);const foot=new THREE.Mesh(new THREE.TorusGeometry(.19,.016,8,28),metal);foot.rotation.x=Math.PI/2;foot.position.y=.30;g.add(foot);
    addAssetBox(g,.32,.03,.32,0,.05,0,metal)
  }else if(kind==='longCouch'||kind==='singleSeat'){
    const w=kind==='singleSeat'?1.05:2.55;
    addAssetBox(g,w,.34,.82,0,.22,0,base);addAssetBox(g,w*.96,.18,.72,0,.49,-.02,soft);
    addAssetBox(g,w*.96,.68,.18,0,.85,.31,soft);
    const sections=kind==='singleSeat'?1:3,seg=w*.9/sections;
    for(let i=0;i<sections;i++){addAssetBox(g,seg*.9,.52,.12,-w*.45+seg*(i+.5),.88,.40,soft2)}
  }else if(kind==='cornerCouch'){
    const w=1.18,d=1.18;
    addAssetBox(g,w,.34,d,0,.22,0,base);addAssetBox(g,w*.92,.16,d*.92,0,.49,0,soft);
    addAssetBox(g,w*.92,.56,.16,0,.82,-d/2+.09,soft);
    addAssetBox(g,.16,.56,d*.92,-w/2+.09,.82,0,soft);
    addAssetBox(g,.16,.56,d*.92,w/2-.09,.82,0,soft);
    addAssetBox(g,.34,.12,d*.72,-w/2+.26,.56,.02,soft2);
    addAssetBox(g,.34,.12,d*.72,w/2-.26,.56,.02,soft2);
    addAssetBox(g,w*.42,.12,.30,0,.56,-d/2+.22,soft2)
  }else if(kind==='halfOttoman'){
    const r=.82,h=.34;
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,36,1,false,0,Math.PI),base);shell.position.y=h/2;shell.rotation.y=Math.PI/2;shell.castShadow=true;shell.receiveShadow=true;g.add(shell);
    const cushion=new THREE.Mesh(new THREE.CylinderGeometry(r*.95,r*.95,.13,36,1,false,0,Math.PI),soft);cushion.position.y=h+.035;cushion.rotation.y=Math.PI/2;cushion.castShadow=true;cushion.receiveShadow=true;g.add(cushion)
  }else if(kind==='pillow'){
    const p=new THREE.Mesh(new THREE.BoxGeometry(.46,.13,.46),soft2);p.position.y=.08;p.rotation.y=.12;p.castShadow=true;p.receiveShadow=true;g.add(p)
  }else if(kind==='ottoman'){
    addAssetBox(g,2.65,.38,.78,0,.22,0,base);addAssetBox(g,2.55,.18,.72,0,.49,0,soft)
  }else if(kind==='cubbyBench9'){
    const w=1.35,h=1.35,d=.42,t=.055,frame=assetMat(0x101216,.82,.08),back=assetMat(0x080a0d,.92,.03);
    addAssetBox(g,w,t,d,0,t/2,0,frame);addAssetBox(g,w,t,d,0,h-t/2,0,frame);
    addAssetBox(g,t,h-2*t,d,-w/2+t/2,h/2,0,frame);addAssetBox(g,t,h-2*t,d,w/2-t/2,h/2,0,frame);
    const innerW=w-2*t,innerH=h-2*t,pitchX=innerW/3,pitchY=innerH/3;
    [-1,1].forEach(k=>addAssetBox(g,t,h-2*t,d,k*pitchX/2,h/2,0,frame));
    [1,2].forEach(i=>addAssetBox(g,w-2*t,t,d,0,t+i*pitchY,0,frame));
    addAssetBox(g,w-2*t,h-2*t,.022,0,h/2,-d/2+.011,back);
  }else if(kind==='coffeeTable'||kind==='benchTable'){
    const w=kind==='benchTable'?2.6:1.35,d=kind==='benchTable'?.68:.72,h=.48,top=assetMat(0x171719,.58,.18);
    addAssetBox(g,w,.08,d,0,h,0,top);
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sz])=>addAssetBox(g,.07,h,.07,sx*(w/2-.10),h/2,sz*(d/2-.10),metal))
  }
  g.userData.assetData={kind};venue.add(g);registerBuilderRoot(g,opts.name||({barStool:'Bar Stool',longCouch:'Long Couch',singleSeat:'Single Seater',cornerCouch:'Corner Couch',halfOttoman:'Half-circle Ottoman',pillow:'Pillow',ottoman:'Long Ottoman',coffeeTable:'Coffee Table',benchTable:'Long Coffee Table',cubbyBench9:'9-Cubby Bench'}[kind]||'Furniture'),'furniture',opts.id);return g
}
function artworkPanelPreset(kind='spaceship'){
  const presets={
    spaceship:{kind:'spaceship',width:3.5,height:1.85,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:'spaceship',imageAspect:3.5/1.85,frame:'plain',transparent:false,backlit:false,backlightColor:'#ff4ea6',backlightBrightness:1.8,backlightSpread:1.15},
    galaxy:{kind:'galaxy',width:3.2,height:2.0,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:'galaxy',imageAspect:3.2/2.0,frame:'plain',transparent:false,backlit:false,backlightColor:'#7c6cff',backlightBrightness:1.6,backlightSpread:1.1},
    robotFrame:{kind:'robotFrame',width:1.35,height:1.8,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:'robotPoster',imageAspect:1.35/1.8,frame:'ornate',transparent:false,backlit:false,backlightColor:'#4fa6ff',backlightBrightness:1.4,backlightSpread:1.05},
    blank:{kind:'blank',width:2.2,height:1.4,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:null,imageAspect:2.2/1.4,frame:'plain',transparent:false,backlit:false,backlightColor:'#ffffff',backlightBrightness:1,backlightSpread:1},
    muralSpaceship:{kind:'muralSpaceship',width:3.2,height:2.4,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:'muralSpaceship',imageAspect:2048/1536,frame:'plain',transparent:false,backlit:false,backlightColor:'#ff4ea6',backlightBrightness:1.8,backlightSpread:1.1},
    muralGalaxyBlue:{kind:'muralGalaxyBlue',width:4.0,height:2.0,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:'muralGalaxyBlue',imageAspect:1774/887,frame:'plain',transparent:false,backlit:false,backlightColor:'#676eff',backlightBrightness:1.8,backlightSpread:1.15},
    muralNebula:{kind:'muralNebula',width:3.2,height:2.4,depth:.09,border:.12,centerY:1.28,faceZ:.052,textureKey:'muralNebula',imageAspect:1448/1086,frame:'plain',transparent:false,backlit:false,backlightColor:'#ff4a96',backlightBrightness:1.8,backlightSpread:1.15},
    backlitShip:{kind:'backlitShip',width:2.65,height:1.98,depth:.08,border:.02,centerY:1.28,faceZ:.05,textureKey:'backlitShip',imageAspect:1448/1086,frame:'none',transparent:true,backlit:true,backlightColor:'#ff4ea6',backlightBrightness:2.2,backlightSpread:1.35},
    ornateInfoBoard:{kind:'ornateInfoBoard',width:.74,height:1.02,depth:.12,border:0,centerY:1.28,faceZ:.072,textureKey:null,imageAspect:.74/1.02,frame:'none',transparent:false,backlit:false,backlightColor:'#ffffff',backlightBrightness:1,backlightSpread:1},
    infoPosterCard:{kind:'infoPosterCard',width:.297,height:.42,depth:.016,border:0,centerY:1.28,faceZ:.028,textureKey:null,imageAspect:.297/.42,frame:'none',transparent:false,backlit:false,backlightColor:'#ffffff',backlightBrightness:1,backlightSpread:1,posterTitle:'INFO',posterCode:'01',accentColor:'#ff4a6a'},
    eventMarquee:{kind:'eventMarquee',width:2.14,height:2.03,depth:.07,border:.018,centerY:1.27,faceZ:.046,textureKey:'eventMarquee',imageAspect:1050/996,frame:'none',transparent:false,backlit:true,backlightColor:'#cc3c3a',backlightBrightness:2.65,backlightSpread:1.38}
  };
  return {...(presets[kind]||presets.spaceship)}
}
function normaliseArtworkPanelData(raw={}){
  const incoming=raw||{},seed=artworkPanelPreset(incoming.kind||'spaceship'),d={...seed,...incoming};
  d.kind=incoming.kind||seed.kind||'spaceship';
  d.width=Math.max(.2,+d.width||seed.width||2.2);
  d.height=Math.max(.2,+d.height||seed.height||1.4);
  d.depth=Math.max(.02,+d.depth||seed.depth||.09);
  d.border=Math.max(0,+d.border||0);
  d.centerY=Number.isFinite(+d.centerY)?+d.centerY:(seed.centerY||1.28);
  d.faceZ=Number.isFinite(+d.faceZ)?+d.faceZ:(seed.faceZ||.052);
  d.textureKey=(d.textureKey===null)?null:(d.textureKey||seed.textureKey||null);
  d.imageAspect=Math.max(.05,+d.imageAspect||seed.imageAspect||Math.max(.05,d.width/Math.max(.05,d.height)));
  d.frame=d.frame||seed.frame||'plain';
  d.transparent=(incoming.transparent!==undefined)?(incoming.transparent!==false):(seed.transparent===true);
  d.backlit=(incoming.backlit!==undefined)?(incoming.backlit!==false):(seed.backlit===true);
  d.backlightColor=d.backlightColor||seed.backlightColor||'#ff4ea6';
  d.backlightBrightness=Math.max(0,Math.min(8,Number.isFinite(+d.backlightBrightness)?+d.backlightBrightness:(seed.backlightBrightness||1.8)));
  d.backlightSpread=Math.max(.2,Math.min(4,Number.isFinite(+d.backlightSpread)?+d.backlightSpread:(seed.backlightSpread||1.1)));
  d.posterTitle=(incoming.posterTitle||d.posterTitle||seed.posterTitle||'INFO').toString();
  d.posterCode=(incoming.posterCode||d.posterCode||seed.posterCode||'01').toString();
  d.accentColor=incoming.accentColor||d.accentColor||seed.accentColor||'#ff4a6a';
  return d
}
function isArtworkPanelRoot(o){const k=o&&o.userData&&o.userData.assetData&&o.userData.assetData.kind;return !!o&&o.userData&&o.userData.builderType==='artwork'&&!!k&&!['spaceshipPorthole','robot','mothershipPortal'].includes(k)}
function isBacklitArtworkRoot(o){const k=o&&o.userData&&o.userData.assetData&&o.userData.assetData.kind;return ['backlitShip','eventMarquee','mothershipPortal','neonSkullLightBox','neonRingPlantPanel'].includes(k)}
function backlitRootKind(o){if(isMothershipPortalRoot(o))return 'portal';if(isNeonSkullLightBoxRoot(o))return 'skull';if(isNeonRingPlantPanelRoot(o))return 'ring';return 'art'}
function getBacklitRootData(o){const kind=backlitRootKind(o);if(kind==='portal')return normaliseMothershipPortalData(o.userData.assetData);if(kind==='skull')return normaliseNeonSkullLightBoxData(o.userData.assetData);if(kind==='ring')return normaliseNeonRingPlantPanelData(o.userData.assetData);return normaliseArtworkPanelData(o.userData.assetData)}
function rebuildBacklitRoot(o){const kind=backlitRootKind(o);if(kind==='portal')rebuildMothershipPortalObject(o);else if(kind==='skull')rebuildNeonSkullLightBoxObject(o);else if(kind==='ring')rebuildNeonRingPlantPanelObject(o);else rebuildArtworkPanelObject(o)}
function ensureArtworkManagedTexture(mesh,root,data){
  if(!mesh||!mesh.material||!data||!data.textureKey)return null;
  let mat=mesh.material,tex=mat.map;
  const slot=mesh.userData&&mesh.userData.artworkTextureSlot?mesh.userData.artworkTextureSlot:'front';
  const desiredOwner=root.uuid+':'+slot;
  if(!tex||!tex.userData||tex.userData.artworkOwnerId!==desiredOwner||tex.userData.artworkKey!==data.textureKey){
    if(mesh.userData&&mesh.userData.artworkUseColourOnly){
      mat=mat.clone();
      mat.map=cloneVenueAssetTexture(data.textureKey,desiredOwner);
      mat.needsUpdate=true;mesh.material=mat;tex=mat.map
    }else{
      mat=mat.clone();
      mat.map=cloneVenueAssetTexture(data.textureKey,desiredOwner);
      mat.needsUpdate=true;mesh.material=mat;tex=mat.map
    }
  }
  return tex||null
}
function syncArtworkTextureCrop(root){
  if(!isArtworkPanelRoot(root))return;
  const d=normaliseArtworkPanelData(root.userData.assetData);root.userData.assetData=d;
  const panelAspect=(d.width*Math.max(.001,Math.abs(root.scale.x)))/Math.max(.001,d.height*Math.max(.001,Math.abs(root.scale.y)));
  const imageAspect=Math.max(.05,d.imageAspect||1);
  let repeatX=1,repeatY=1,offsetX=0,offsetY=0;
  if(panelAspect>imageAspect){repeatY=Math.max(.01,imageAspect/panelAspect);offsetY=(1-repeatY)/2}else{repeatX=Math.max(.01,panelAspect/imageAspect);offsetX=(1-repeatX)/2}
  root.traverse(o=>{
    if(!(o.userData&&o.userData.artworkManaged))return;
    const tex=ensureArtworkManagedTexture(o,root,d);if(!tex)return;
    tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;tex.center.set(.5,.5);tex.repeat.set(repeatX,repeatY);tex.offset.set(offsetX,offsetY);tex.needsUpdate=true
  })
}

const __INFO_POSTER_TEXTURE_CACHE={};
function infoPosterGraphicTexture(title='INFO',accent='#ff4a6a',code='01'){
  const key=[title,accent,code].join('|');
  if(__INFO_POSTER_TEXTURE_CACHE[key])return __INFO_POSTER_TEXTURE_CACHE[key];
  const c=document.createElement('canvas');c.width=900;c.height=1260;const ctx=c.getContext('2d');
  const bg='#07090d',paper='#f3f0ea',muted='#9ea3ad',line='#20242d';
  ctx.fillStyle=paper;ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle=bg;ctx.fillRect(34,34,c.width-68,c.height-68);
  ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=2;ctx.strokeRect(66,66,c.width-132,c.height-132);
  const grad=ctx.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,accent);grad.addColorStop(1,'#ff7f33');
  ctx.fillStyle=grad;ctx.fillRect(66,66,c.width-132,38);
  ctx.fillStyle='rgba(255,255,255,.09)';for(let i=0;i<6;i++)ctx.fillRect(90,160+i*22,320,3);
  ctx.fillStyle=paper;ctx.font='900 140px Arial Black, Arial, sans-serif';ctx.textAlign='left';ctx.textBaseline='top';
  const words=(title||'INFO').toUpperCase().split(/\s+/);let y=122;words.forEach(w=>{ctx.fillText(w,88,y);y+=118});
  ctx.fillStyle=muted;ctx.font='700 28px Arial, sans-serif';ctx.fillText('THE MOTHERSHIP · VENUE PACK',92,420);
  ctx.fillStyle=accent;ctx.fillRect(88,470,290,10);ctx.fillRect(88,495,150,10);
  ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(88,566,724,210);
  ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(106,584,688,174);
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=3;ctx.strokeRect(106,584,688,174);
  ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=2;for(let i=0;i<5;i++)ctx.strokeRect(122+i*118,600+(i%2)*18,94,138);
  ctx.fillStyle=paper;ctx.font='900 30px Arial Black, Arial, sans-serif';ctx.fillText('0'+String(code).replace(/^0+/,'').padStart(1,'0'),702,122);
  ctx.fillText('A3',702,164);
  ctx.fillStyle='rgba(255,255,255,.76)';ctx.font='600 22px Arial, sans-serif';
  ['Forward-thinking', 'Detail-driven', 'Artist-aligned', 'Auckland CBD'].forEach((t,i)=>ctx.fillText(t,92,836+i*38));
  ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(88,1006,724,120);
  ctx.fillStyle=paper;ctx.font='700 24px Arial, sans-serif';ctx.fillText('Independent venue + adaptable event information panel',108,1038);
  ctx.fillStyle=muted;ctx.font='600 18px Arial, sans-serif';ctx.fillText('Designed as clean vector-style signage rather than a photo print.',108,1076);
  ctx.strokeStyle=accent;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(592,1000);ctx.lineTo(810,1128);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(592,1048);ctx.lineTo(770,1048);ctx.lineTo(810,1090);ctx.stroke();
  ctx.fillStyle=paper;ctx.font='900 42px Arial Black, Arial, sans-serif';ctx.fillText(title.toUpperCase(),90,1156);
  ctx.fillStyle=accent;ctx.fillRect(88,1198,180,12);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(280,1198,532,12);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.needsUpdate=true;__INFO_POSTER_TEXTURE_CACHE[key]=t;return t
}
function addInfoThumbTack(parent,x,y,z,col='#f2d16f'){
  const metal=new THREE.MeshStandardMaterial({color:col,roughness:.24,metalness:.82});
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.009,.010,.006,14),metal);cap.rotation.x=Math.PI/2;cap.position.set(x,y,z+.006);cap.castShadow=true;cap.receiveShadow=true;parent.add(cap);
  const pin=new THREE.Mesh(new THREE.CylinderGeometry(.0015,.0015,.016,10),new THREE.MeshStandardMaterial({color:0xc7c9cf,roughness:.28,metalness:.9}));pin.position.set(x,y,z-.003);pin.castShadow=true;pin.receiveShadow=true;parent.add(pin)
}
function addOrnateBoardRosette(parent,x,y,z,s=.05){
  const mat=new THREE.MeshStandardMaterial({color:0x090a0d,roughness:.34,metalness:.58});
  const gloss=new THREE.MeshStandardMaterial({color:0x1d2026,roughness:.24,metalness:.68});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(s*.44,s*.12,10,18),mat);ring.position.set(x,y,z);ring.castShadow=true;ring.receiveShadow=true;parent.add(ring);
  const core=new THREE.Mesh(new THREE.SphereGeometry(s*.18,14,12),gloss);core.position.set(x,y,z+.01);core.castShadow=true;core.receiveShadow=true;parent.add(core);
  for(let i=0;i<4;i++){const petal=new THREE.Mesh(new THREE.SphereGeometry(s*.22,10,8),mat);petal.scale.set(.72,1.18,.45);petal.position.set(x+Math.cos(i*Math.PI/2)*s*.30,y+Math.sin(i*Math.PI/2)*s*.30,z+.006);petal.castShadow=true;petal.receiveShadow=true;parent.add(petal)}
}

function rebuildArtworkPanelObject(g){
  if(!g||!g.userData)return;
  const d=normaliseArtworkPanelData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;
  clearGroupChildren(g);

  if(d.kind==='ornateInfoBoard'){
    const frameMat=new THREE.MeshStandardMaterial({color:0x07080b,roughness:.36,metalness:.70});
    const trimMat=new THREE.MeshStandardMaterial({color:0x191d24,roughness:.24,metalness:.72});
    const accentMat=new THREE.MeshStandardMaterial({color:0x381317,emissive:0x190406,emissiveIntensity:.18,roughness:.34,metalness:.38});
    const backMat=new THREE.MeshStandardMaterial({color:0x12151b,roughness:.82,metalness:.06});
    const innerW=d.width,innerH=d.height,depth=Math.max(.10,d.depth),rail=.115,z=0;
    addAssetBox(g,innerW+.18,innerH+.24,.030,0,d.centerY,-depth*.14,backMat);
    addAssetBox(g,innerW+.24,rail,depth,0,d.centerY+innerH/2+rail*.22,z,frameMat);
    addAssetBox(g,innerW+.24,rail,depth,0,d.centerY-innerH/2-rail*.22,z,frameMat);
    addAssetBox(g,rail,innerH+.24,depth,-innerW/2-rail*.22,d.centerY,z,frameMat);
    addAssetBox(g,rail,innerH+.24,depth,innerW/2+rail*.22,d.centerY,z,frameMat);
    addAssetBox(g,innerW+.08,.030,.032,0,d.centerY+innerH/2-.026,depth*.34,trimMat);
    addAssetBox(g,innerW+.08,.030,.032,0,d.centerY-innerH/2+.026,depth*.34,trimMat);
    addAssetBox(g,.030,innerH+.08,.032,-innerW/2+.026,d.centerY,depth*.34,trimMat);
    addAssetBox(g,.030,innerH+.08,.032,innerW/2-.026,d.centerY,depth*.34,trimMat);
    addAssetBox(g,innerW+.11,.014,.015,0,d.centerY+innerH/2-.010,depth*.50,accentMat);
    addAssetBox(g,innerW+.11,.014,.015,0,d.centerY-innerH/2+.010,depth*.50,accentMat);
    addAssetBox(g,.014,innerH+.11,.015,-innerW/2+.010,d.centerY,depth*.50,accentMat);
    addAssetBox(g,.014,innerH+.11,.015,innerW/2-.010,d.centerY,depth*.50,accentMat);
    [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(([sx,sy])=>addOrnateBoardRosette(g,sx*(innerW/2+.083),d.centerY+sy*(innerH/2+.093),depth*.56,.068));
    addOrnateBoardRosette(g,0,d.centerY+innerH/2+.088,depth*.56,.074);
    addOrnateBoardRosette(g,0,d.centerY-innerH/2-.088,depth*.56,.074);
    const capGeo=new THREE.CylinderGeometry(.030,.040,.028,20);const cap1=new THREE.Mesh(capGeo,trimMat);cap1.rotation.z=Math.PI/2;cap1.position.set(-innerW/2-.13,d.centerY,depth*.12);g.add(cap1);const cap2=cap1.clone();cap2.position.x=innerW/2+.13;g.add(cap2);
    g.updateMatrixWorld(true);applyPerformanceSensitiveObjects(g);markRenderDirty();return
  }

  if(d.kind==='infoPosterCard'){
    const paperMat=new THREE.MeshStandardMaterial({color:0xf0ece6,roughness:.92,metalness:.02});
    const edgeMat=new THREE.MeshStandardMaterial({color:0xe3ddd4,roughness:.94,metalness:.01});
    const shadowMat=new THREE.MeshStandardMaterial({color:0x090b0f,transparent:true,opacity:.38,roughness:1,metalness:0});
    const cardDepth=Math.max(.012,d.depth||.016),w=d.width,h=d.height;
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w*.98,h*.98),shadowMat);shadow.position.set(.008,d.centerY-.008,-cardDepth*.44);g.add(shadow);
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,cardDepth),[edgeMat,edgeMat,paperMat,edgeMat,edgeMat,edgeMat]);body.position.set(0,d.centerY,0);body.castShadow=true;body.receiveShadow=true;g.add(body);
    const tex=infoPosterGraphicTexture(d.posterTitle,d.accentColor,d.posterCode);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(w*.952,h*.952),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));face.position.set(0,d.centerY,cardDepth/2+.0025);face.userData.keepTextureColour=true;g.add(face);
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sy])=>addInfoThumbTack(g,sx*(w*.42),d.centerY+sy*(h*.43),cardDepth/2+.004,sx*sy>0?'#e6c975':'#d6d7dc'));
    g.updateMatrixWorld(true);applyPerformanceSensitiveObjects(g);markRenderDirty();return
  }

  const showFrame=d.frame!=='none'&&d.frame!=='cutout'&&d.frame!==false;
  if(showFrame){
    addAssetBox(g,d.width+d.border,d.height+d.border,d.depth,0,d.centerY,0,assetMat(d.frame==='ornate'?0x0b0b0c:0x08090b,.68,.15));
    if(d.frame==='ornate'){
      const ornate=assetMat(0x1d1b1a,.46,.52);
      addAssetBox(g,d.width+.20,.065,.12,0,d.centerY+d.height/2+.08,.03,ornate);addAssetBox(g,d.width+.20,.065,.12,0,d.centerY-d.height/2-.08,.03,ornate);
      addAssetBox(g,.065,d.height+.20,.12,-d.width/2-.08,d.centerY,.03,ornate);addAssetBox(g,.065,d.height+.20,.12,d.width/2+.08,d.centerY,.03,ornate)
    }
  }
  const frontZ=Math.max(d.depth/2+.007,d.faceZ);
  if(d.backlit&&d.textureKey){
    const darkBack=new THREE.Mesh(new THREE.PlaneGeometry(d.width,d.height),new THREE.MeshBasicMaterial({map:cloneVenueAssetTexture(d.textureKey,g.uuid+':shadow'),transparent:true,opacity:.95,color:0x06070a,alphaTest:.02,side:THREE.DoubleSide}));
    darkBack.position.set(0,d.centerY,frontZ-.015);darkBack.userData.artworkManaged=true;darkBack.userData.artworkTextureSlot='shadow';g.add(darkBack);
    const glowScales=[1+.06*d.backlightSpread,1+.16*d.backlightSpread,1+.30*d.backlightSpread];
    const glowOps=[.34,.18,.08];
    glowScales.forEach((scale,idx)=>{
      const glowMat=new THREE.MeshBasicMaterial({map:cloneVenueAssetTexture(d.textureKey,g.uuid+':glow'+idx),transparent:true,opacity:Math.min(.92,glowOps[idx]*d.backlightBrightness),color:new THREE.Color(d.backlightColor),blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,alphaTest:.001});
      const glow=new THREE.Mesh(new THREE.PlaneGeometry(d.width,d.height),glowMat);glow.scale.set(scale,scale,1);glow.position.set(0,d.centerY,frontZ-.032-(idx*.007));glow.userData.artworkManaged=true;glow.userData.artworkTextureSlot='glow'+idx;glow.userData.artworkGlow=true;g.add(glow)
    });
    const lamp=new THREE.PointLight(new THREE.Color(d.backlightColor),Math.max(0,d.backlightBrightness)*.85,Math.max(1.2,1.3+d.backlightSpread*2.1),2.0);lamp.position.set(0,d.centerY,frontZ-.1);lamp.userData.artworkBacklight=true;g.add(lamp)
  }
  let mat;
  if(d.textureKey)mat=new THREE.MeshBasicMaterial({map:cloneVenueAssetTexture(d.textureKey,g.uuid+':front'),toneMapped:false,transparent:!!d.transparent,alphaTest:d.transparent?.02:0,side:THREE.DoubleSide});
  else mat=new THREE.MeshStandardMaterial({color:0x17191f,emissive:0x0b0c12,emissiveIntensity:.18,roughness:.65});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(d.width,d.height),mat);p.position.set(0,d.centerY,frontZ);p.userData.keepTextureColour=!!d.textureKey;p.userData.artworkSurface=true;p.userData.artworkManaged=!!d.textureKey;p.userData.artworkTextureSlot='front';g.add(p);
  g.updateMatrixWorld(true);if(d.textureKey)syncArtworkTextureCrop(g);applyPerformanceSensitiveObjects(g);markRenderDirty()
}
function createArtworkPanelObject(kind='spaceship',opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  g.userData.assetData=normaliseArtworkPanelData({
    ...artworkPanelPreset(kind),kind,
    width:opts.width,height:opts.height,depth:opts.depth,border:opts.border,centerY:opts.centerY,faceZ:opts.faceZ,
    textureKey:('textureKey' in opts)?opts.textureKey:undefined,imageAspect:opts.imageAspect,frame:opts.frame,transparent:('transparent' in opts)?opts.transparent:undefined,
    backlit:('backlit' in opts)?opts.backlit:undefined,backlightColor:opts.backlightColor,backlightBrightness:opts.backlightBrightness,backlightSpread:opts.backlightSpread,
    posterTitle:opts.posterTitle,posterCode:opts.posterCode,accentColor:opts.accentColor
  });
  venue.add(g);registerBuilderRoot(g,opts.name||({spaceship:'Spaceship Mural',galaxy:'Galaxy Wall Artwork',robotFrame:'Robot Poster Frame',blank:'Blank Artwork Panel',muralSpaceship:'Spaceship Wall Mural',muralGalaxyBlue:'Blue Galaxy Wall Mural',muralNebula:'Nebula Wall Mural',backlitShip:'Backlit Spaceship Artwork',ornateInfoBoard:'Venue Info Frame',infoPosterCard:'Info Poster',eventMarquee:'Mothership Event Marquee'}[kind]||'Artwork'),'artwork',opts.id);rebuildArtworkPanelObject(g);return g
}
function isEventMarqueeRoot(o){return !!o&&o.userData&&o.userData.builderType==='artwork'&&o.userData.assetData&&o.userData.assetData.kind==='eventMarquee'}
function isMothershipPortalRoot(o){return !!o&&o.userData&&o.userData.builderType==='artwork'&&o.userData.assetData&&o.userData.assetData.kind==='mothershipPortal'}
function normaliseMothershipPortalData(raw={}){const incoming=raw||{},d={...incoming};d.kind='mothershipPortal';d.width=Math.max(.72,+d.width||1.72);d.height=Math.max(.72,+d.height||1.72);d.depth=Math.max(.05,+d.depth||.12);d.centerY=Number.isFinite(+d.centerY)?+d.centerY:1.30;d.backlit=('backlit' in incoming)?incoming.backlit!==false:true;d.backlightColor=d.backlightColor||'#7c84ff';d.logoColor=d.logoColor||'#52d0ff';d.backlightBrightness=Math.max(0,Math.min(8,Number.isFinite(+d.backlightBrightness)?+d.backlightBrightness:2.35));d.backlightSpread=Math.max(.2,Math.min(4,Number.isFinite(+d.backlightSpread)?+d.backlightSpread:1.28));d.backlightBlend=Math.max(0,Math.min(1,Number.isFinite(+d.backlightBlend)?+d.backlightBlend:.62));return d}
function portalStarTexture(){const c=document.createElement('canvas');c.width=c.height=768;const ctx=c.getContext('2d'),cx=384,cy=384,g=ctx.createRadialGradient(cx,cy,25,cx,cy,380);g.addColorStop(0,'#0d2745');g.addColorStop(.34,'#07172c');g.addColorStop(.72,'#020a17');g.addColorStop(1,'#000205');ctx.fillStyle=g;ctx.fillRect(0,0,768,768);for(let i=0;i<245;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*340,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,rr=Math.random()*2.2+.35,alpha=.25+Math.random()*.72;ctx.fillStyle='rgba('+(110+Math.floor(Math.random()*110))+','+(160+Math.floor(Math.random()*90))+',255,'+alpha.toFixed(3)+')';ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill();if(Math.random()>.91){ctx.strokeStyle='rgba(150,205,255,'+(alpha*.62).toFixed(3)+')';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-rr*2.6,y);ctx.lineTo(x+rr*2.6,y);ctx.moveTo(x,y-rr*2.6);ctx.lineTo(x,y+rr*2.6);ctx.stroke()}}const haze=ctx.createRadialGradient(cx*1.06,cy*.92,20,cx,cy,300);haze.addColorStop(0,'rgba(22,83,155,.13)');haze.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=haze;ctx.fillRect(0,0,768,768);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t}
function portalLogoTexture(hex='#52d0ff'){const c=document.createElement('canvas');c.width=1200;c.height=420;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=hex;ctx.shadowBlur=28;ctx.fillStyle=hex;ctx.font='700 62px Archivo, Arial, sans-serif';ctx.fillText('THE',600,105);ctx.font='900 138px Archivo, Arial, sans-serif';ctx.save();ctx.translate(600,250);ctx.scale(1.04,.90);ctx.fillText('MOTHERSHIP',0,0);ctx.restore();const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t}
function portalHaloTexture(hex='#7c84ff'){const c=document.createElement('canvas');c.width=c.height=768;const ctx=c.getContext('2d'),col=new THREE.Color(hex),r=Math.round(col.r*255),gg=Math.round(col.g*255),b=Math.round(col.b*255),grad=ctx.createRadialGradient(384,384,210,384,384,370);grad.addColorStop(0,'rgba('+r+','+gg+','+b+',0)');grad.addColorStop(.48,'rgba('+r+','+gg+','+b+',0)');grad.addColorStop(.73,'rgba('+r+','+gg+','+b+',.50)');grad.addColorStop(.88,'rgba('+r+','+gg+','+b+',.95)');grad.addColorStop(1,'rgba('+r+','+gg+','+b+',0)');ctx.fillStyle=grad;ctx.fillRect(0,0,768,768);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t}
function rebuildMothershipPortalObject(g){if(!isMothershipPortalRoot(g))return;const d=normaliseMothershipPortalData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;clearGroupChildren(g);const w=d.width,h=d.height,depth=d.depth,cy=d.centerY,R=Math.min(w,h)*.405,inner=R*.765,z=depth/2+.012,panel=assetMat(0x111318,.83,.12),frame=assetMat(0x1b1e23,.64,.28),rim=assetMat(0x08090c,.46,.46);addAssetBox(g,w,h,depth,0,cy,0,panel);addAssetBox(g,w*.965,h*.965,.018,0,cy,depth/2+.003,assetMat(0x17191e,.8,.18));if(d.backlit){const col=new THREE.Color(d.backlightColor),blend=d.backlightBlend,spread=d.backlightSpread,bright=d.backlightBrightness;const led=new THREE.Mesh(new THREE.TorusGeometry(R*.985,.014+blend*.009,12,96),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2.1+bright*.65,roughness:.22,metalness:.1,transparent:true,opacity:.86}));led.position.set(0,cy,z-.006);g.add(led);const bands=[{rin:R*(.88-.02*spread),rout:R*(1.05+.02*spread),op:.34},{rin:R*(.80-.035*spread),rout:R*(1.12+.05*spread),op:.17},{rin:R*(.70-.055*spread),rout:R*(1.22+.09*spread),op:.075}];bands.forEach((b,i)=>{const geo=new THREE.RingGeometry(Math.max(.02,b.rin),b.rout,96,1),mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:Math.min(.9,b.op*bright*(.55+blend*.8)),blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});const glow=new THREE.Mesh(geo,mat);glow.position.set(0,cy,z-.022-i*.006);glow.userData.portalBacklight=true;g.add(glow)});const nearHalo=new THREE.PointLight(col,bright*(.22+.32*blend),Math.max(1.0,1.1+spread*1.5),2.3);nearHalo.position.set(0,cy,z-.045);nearHalo.userData.portalBacklight=true;g.add(nearHalo)}const outer=new THREE.Mesh(new THREE.CylinderGeometry(R,R,.075,72),frame);outer.rotation.x=Math.PI/2;outer.position.set(0,cy,z);g.add(outer);const outerLip=new THREE.Mesh(new THREE.TorusGeometry(R*.985,.020,10,72),rim);outerLip.position.set(0,cy,z+.045);g.add(outerLip);const star=new THREE.Mesh(new THREE.CircleGeometry(inner,72),new THREE.MeshBasicMaterial({map:portalStarTexture(),toneMapped:false}));star.position.set(0,cy,z+.043);g.add(star);const innerGlowMat=new THREE.MeshStandardMaterial({color:0x20242c,roughness:.32,metalness:.5,emissive:new THREE.Color(d.backlightColor),emissiveIntensity:d.backlit?(.22+d.backlightBrightness*.10):.02});const innerLip=new THREE.Mesh(new THREE.TorusGeometry(inner*1.015,.019,10,72),innerGlowMat);innerLip.position.set(0,cy,z+.052);g.add(innerLip);const glass=new THREE.Mesh(new THREE.CircleGeometry(inner*.985,72),new THREE.MeshPhysicalMaterial({color:0x07131f,roughness:.07,metalness:.08,transmission:.07,thickness:.06,clearcoat:1,clearcoatRoughness:.03,transparent:true,opacity:.38}));glass.position.set(0,cy,z+.057);g.add(glass);const logoTex=portalLogoTexture(d.logoColor),logoGlow=new THREE.Mesh(new THREE.PlaneGeometry(inner*1.35,inner*.48),new THREE.MeshBasicMaterial({map:logoTex.clone(),transparent:true,color:new THREE.Color(d.logoColor),opacity:.20,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));logoGlow.scale.set(1.13,1.13,1);logoGlow.position.set(0,cy,z+.068);g.add(logoGlow);const logo=new THREE.Mesh(new THREE.PlaneGeometry(inner*1.30,inner*.46),new THREE.MeshBasicMaterial({map:logoTex,transparent:true,toneMapped:false}));logo.position.set(0,cy,z+.072);g.add(logo);g.updateMatrixWorld(true);applyPerformanceSensitiveObjects(g);markRenderDirty()}
function createMothershipPortalObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);g.userData.assetData=normaliseMothershipPortalData({width:opts.width,height:opts.height,depth:opts.depth,centerY:opts.centerY,backlit:opts.backlit,backlightColor:opts.backlightColor,logoColor:opts.logoColor,backlightBrightness:opts.backlightBrightness,backlightSpread:opts.backlightSpread,backlightBlend:opts.backlightBlend});g.userData.colorOverride=opts.color||'#111318';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Mothership Portal Art','artwork',opts.id);rebuildMothershipPortalObject(g);return g}
function createSpaceshipPortholeObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z),r=0.72;
  const back=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.12,48),assetMat(0x07080a,.42,.55));back.rotation.x=Math.PI/2;back.position.y=1.35;g.add(back);
  const face=new THREE.Mesh(new THREE.CircleGeometry(r*.88,48),new THREE.MeshBasicMaterial({map:venueAssetTexture('porthole'),toneMapped:false}));face.position.set(0,1.35,.075);face.userData.keepTextureColour=true;g.add(face);
  const blue=new THREE.MeshStandardMaterial({color:0x204cff,emissive:0x204cff,emissiveIntensity:1.8,roughness:.22}),ring=new THREE.Mesh(new THREE.TorusGeometry(r*.98,.035,10,64),blue);ring.position.set(0,1.35,.09);g.add(ring);
  const inner=new THREE.Mesh(new THREE.TorusGeometry(r*.62,.028,10,64),new THREE.MeshStandardMaterial({color:0xff315f,emissive:0xff315f,emissiveIntensity:1.7}));inner.position.set(0,1.35,.095);g.add(inner);
  g.userData.assetData={kind:'spaceshipPorthole'};venue.add(g);registerBuilderRoot(g,opts.name||'Spaceship Circle Artwork','artwork',opts.id);return g
}
function createRobotObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const blue=assetMat(0x2f6697,.56,.40),dark=assetMat(0x111419,.48,.76),steel=assetMat(0x7a7f86,.30,.88),white=assetMat(0xd8dbde,.66,.16),gold=assetMat(0xd7a52a,.34,.76),blackGlass=new THREE.MeshStandardMaterial({color:0x0b0f14,roughness:.08,metalness:.82,envMapIntensity:1.2});
  addAssetBox(g,.68,.16,.22,0,.12,0,dark);
  addAssetBox(g,.28,.44,.24,-.12,.64,0,blue);
  addAssetBox(g,.40,.54,.30,.04,1.15,0,blue);
  addAssetBox(g,.18,.22,.16,.12,1.28,.17,dark);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,.20,10),dark);neck.position.set(.02,1.50,0);neck.castShadow=true;neck.receiveShadow=true;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,20,16),blue);head.scale.set(.96,1.06,.92);head.position.set(.03,1.78,0);head.castShadow=true;head.receiveShadow=true;g.add(head);
  const face=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.18,22),blue);face.rotation.x=Math.PI/2;face.position.set(.03,1.76,.11);face.castShadow=true;face.receiveShadow=true;g.add(face);
  const mouth=new THREE.Mesh(new THREE.CylinderGeometry(.056,.066,.08,18),dark);mouth.rotation.x=Math.PI/2;mouth.position.set(.03,1.62,.215);mouth.castShadow=true;mouth.receiveShadow=true;g.add(mouth);
  [-1,1].forEach(s=>{const eyeShell=new THREE.Mesh(new THREE.SphereGeometry(.12,18,14),blue);eyeShell.scale.set(1.10,1.00,.92);eyeShell.position.set(.03+s*.135,1.82,.06);eyeShell.castShadow=true;eyeShell.receiveShadow=true;g.add(eyeShell);const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,18,14),blackGlass);eye.position.set(.03+s*.135,1.82,.13);eye.castShadow=true;eye.receiveShadow=true;g.add(eye);const ear=new THREE.Mesh(new THREE.CylinderGeometry(.072,.072,.08,16),steel);ear.rotation.z=Math.PI/2;ear.position.set(.03+s*.26,1.78,-.02);ear.castShadow=true;ear.receiveShadow=true;g.add(ear)});
  const topBand=new THREE.Mesh(new THREE.TorusGeometry(.19,.012,8,32,Math.PI),steel);topBand.rotation.z=Math.PI/2;topBand.position.set(.03,1.98,-.01);g.add(topBand);
  addCylinderBetween(g,new THREE.Vector3(-.30,1.36,0),new THREE.Vector3(-.56,.76,0),.028,dark,10);
  addCylinderBetween(g,new THREE.Vector3(-.56,.76,0),new THREE.Vector3(-.62,.34,.02),.022,dark,10);
  addCylinderBetween(g,new THREE.Vector3(.34,1.34,0),new THREE.Vector3(.60,.80,0),.032,dark,10);
  addCylinderBetween(g,new THREE.Vector3(.60,.80,0),new THREE.Vector3(.66,.36,.02),.028,dark,10);
  [-1,1].forEach(s=>{const upper=new THREE.Mesh(new THREE.BoxGeometry(.08,.17,.08),s<0?steel:blue);upper.position.set(s*.62,.30,.02);upper.castShadow=true;upper.receiveShadow=true;g.add(upper);const handA=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.14,12),dark);handA.position.set(s*.65,.18,.02);handA.castShadow=true;handA.receiveShadow=true;g.add(handA);[-.04,0,.04].forEach(dx=>{const finger=new THREE.Mesh(new THREE.BoxGeometry(.018,.08,.018),dark);finger.position.set(s*(.62+dx),.08,.05-Math.abs(dx)*.2);finger.castShadow=true;finger.receiveShadow=true;g.add(finger)})});
  const pendantRing=new THREE.Mesh(new THREE.TorusGeometry(.15,.010,8,22),gold);pendantRing.position.set(.02,1.18,.17);pendantRing.scale.y=.75;g.add(pendantRing);const leaf=new THREE.Mesh(new THREE.CircleGeometry(.08,6),gold);leaf.position.set(.02,1.05,.18);leaf.rotation.x=-.20;g.add(leaf);
  addAssetBox(g,.22,.12,.12,.10,.78,.18,steel);const camLens=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.045,16),blackGlass);camLens.rotation.x=Math.PI/2;camLens.position.set(.10,.78,.25);camLens.castShadow=true;camLens.receiveShadow=true;g.add(camLens);
  addCylinderBetween(g,new THREE.Vector3(-.10,.56,0),new THREE.Vector3(-.14,-.10,0),.040,dark,10);
  addCylinderBetween(g,new THREE.Vector3(.12,.56,0),new THREE.Vector3(.16,-.10,0),.044,dark,10);
  [-1,1].forEach(s=>{const thighShell=new THREE.Mesh(new THREE.BoxGeometry(.14,.18,.14),blue);thighShell.position.set(s*.13,.08,0);thighShell.castShadow=true;thighShell.receiveShadow=true;g.add(thighShell);const shin=new THREE.Mesh(new THREE.BoxGeometry(.08,.56,.08),dark);shin.position.set(s*.15,-.36,0);shin.castShadow=true;shin.receiveShadow=true;g.add(shin);const shoe=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.52),s<0?blue:white);shoe.position.set(s*.15,-.72,.08);shoe.castShadow=true;shoe.receiveShadow=true;g.add(shoe);const toe=new THREE.Mesh(new THREE.BoxGeometry(.18,.10,.18),white);toe.position.set(s*.15,-.72,.30);toe.castShadow=true;toe.receiveShadow=true;g.add(toe);const shoeRing=new THREE.Mesh(new THREE.TorusGeometry(.13,.012,6,24),white);shoeRing.rotation.x=Math.PI/2;shoeRing.position.set(s*.15,-.63,.03);g.add(shoeRing)});
  g.userData.assetData={kind:'robot'};g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'AI Robot','artwork',opts.id);return g
}
function addMiniPlant(g,x,y,z,s=1){
  const trunk=assetMat(0x33271d,.86,.05),greens=[0x214f30,0x2f6840,0x183f29,0x47784a].map(c=>assetMat(c,.92,.02));
  cyl(.025*s,.65*s,x,y+.32*s,z,trunk,g,7);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9+(i%2)*.2,leaf=new THREE.Mesh(new THREE.ConeGeometry(.10*s,.72*s,6),greens[i%greens.length]);
    leaf.position.set(x+Math.cos(a)*.12*s,y+.63*s+(i%3)*.06*s,z+Math.sin(a)*.12*s);leaf.rotation.z=Math.PI/2-(Math.sin(a)*.28);leaf.rotation.y=-a;g.add(leaf)
  }
}
function addWallPlantCluster(g,x,y,z=.07,s=1){
  const greens=[0x264f33,0x315f3b,0x3f7a48,0x193a24,0x5d8f54].map(c=>assetMat(c,.9,.03));
  for(let i=0;i<10;i++){
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.08*s,10,8),greens[i%greens.length]);
    leaf.scale.set(1.55,.50,.90);leaf.rotation.set((i%3-.9)*.35,(i*0.65)%Math.PI,(i%2?.4:-.4));
    const rx=(Math.random()-.5)*.30*s,ry=(Math.random()-.5)*.42*s,rz=(Math.random()-.5)*.16*s;
    leaf.position.set(x+rx,y+ry,z+rz);leaf.castShadow=true;leaf.receiveShadow=true;g.add(leaf)
  }
}
function buildMetalGridWall(g,w,h,{depth=.08,cols=8,rows=7,color=0x0b0c0f,withPlants=false}={}){
  const metal=assetMat(color,.34,.82),barT=Math.max(.018,Math.min(.03,w/60));
  addAssetBox(g,barT,h,depth,-w/2,h/2,0,metal);addAssetBox(g,barT,h,depth,w/2,h/2,0,metal);
  addAssetBox(g,w+barT*2,barT,depth,0,barT/2,0,metal);addAssetBox(g,w+barT*2,barT,depth,0,h-barT/2,0,metal);
  for(let i=1;i<cols;i++)addAssetBox(g,barT,h-barT*2,Math.max(.04,depth*.55),-w/2+(i/cols)*w,h/2,0,metal);
  for(let i=1;i<rows;i++)addAssetBox(g,w-barT*2,barT,Math.max(.04,depth*.55),0,(i/rows)*h,0,metal);
  if(withPlants){
    const spots=[[-.36,.18,.92],[-.12,.42,.86],[.14,.16,.78],[.36,.38,.92],[-.28,.70,.82],[.02,.68,.98],[.30,.74,.78],[-.04,.92,.82]];
    spots.forEach(([ux,uy,sc],i)=>addWallPlantCluster(g,ux*w,uy*h,.07,.85*sc));
  }
}
function createTallPlantObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const potMat=assetMat(0x111418,.84,.10),soilMat=assetMat(0x2c241b,.95,.04),stemMat=assetMat(0x2c2a21,.72,.06),twigMat=assetMat(0x3c4a28,.70,.06);
  const leafMats=[0x4d7a23,0x5f8f2b,0x709c36,0x7ca83d,0x567f2a].map(c=>assetMat(c,.88,.03));
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.24,.25,.34,24),potMat);pot.position.y=.17;pot.castShadow=true;pot.receiveShadow=true;g.add(pot);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.03,20),soilMat);soil.position.y=.325;soil.castShadow=true;soil.receiveShadow=true;g.add(soil);
  function addLeaf(parent,x,y,z,rx,ry,rz,sx,sy,sz,mat){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.052,10,8),mat);leaf.position.set(x,y,z);leaf.rotation.set(rx,ry,rz);leaf.scale.set(sx,sy,sz);leaf.castShadow=true;leaf.receiveShadow=true;parent.add(leaf);return leaf}
  function addBranch(parent,y,side,reach,up,twist,scale=1){
    const branch=new THREE.Group();branch.position.set(0,y,0);branch.rotation.y=twist;branch.rotation.z=side*(.92+Math.random()*.22);branch.rotation.x=(Math.random()-.5)*.18;parent.add(branch);
    const twig=new THREE.Mesh(new THREE.CylinderGeometry(.0045*scale,.0065*scale,reach,6),twigMat);twig.position.y=reach/2;twig.castShadow=true;twig.receiveShadow=true;branch.add(twig);
    for(let i=0;i<4;i++){const t=i/3,spread=(Math.random()-.5)*.16;addLeaf(branch,spread,reach*(.18+t*.72),spread*.25,up*(.14+t*.10)+(Math.random()-.5)*.22,side*(.18+.12*i),Math.random()*Math.PI,.95*scale+(i%2)*.18,.18*scale,.42*scale,leafMats[(i+Math.abs(Math.round(side*2)))%leafMats.length])}
    addLeaf(branch,0,reach+.02,0,up*.22,side*.3,Math.random()*Math.PI,1.15*scale,.16*scale,.46*scale,leafMats[Math.floor(Math.random()*leafMats.length)]);
  }
  function addStem(x,z,h,leanZ=0,leanX=0,scale=1){
    const stemG=new THREE.Group();stemG.position.set(x,.32,z);stemG.rotation.z=leanZ;stemG.rotation.x=leanX;stemG.rotation.y=(x+z)*1.8;g.add(stemG);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.008*scale,.012*scale,h,8),stemMat);stem.position.y=h/2;stem.castShadow=true;stem.receiveShadow=true;stemG.add(stem);
    const nodes=[.34,.5,.68,.82,.94];
    for(let i=0;i<nodes.length;i++){const t=nodes[i],y=h*t,reach=.18*scale+.22*t*scale+(i%2)*.03;addBranch(stemG,y,(i%2===0?-1:1),reach,.2+.16*i,(i*.78)+(x-z)*.7,.95-.08*i);if(i>1&&Math.random()>.5)addBranch(stemG,y-.05,(i%2===0?1:-1),reach*.82,.18+.12*i,(i*.92)+1.4,.72)}
    addLeaf(stemG,0,h,0,.12,0,Math.random()*Math.PI,1.25*scale,.18*scale,.56*scale,leafMats[Math.floor(Math.random()*leafMats.length)]);
    addLeaf(stemG,.02,h-.08,.01,-.08,.3,Math.random()*Math.PI,1.05*scale,.16*scale,.48*scale,leafMats[Math.floor(Math.random()*leafMats.length)]);
  }
  addStem(0.00,0.01,2.12,.03,-.02,1.15);
  addStem(-.05,-.02,1.95,-.05,.01,1.02);
  addStem(.06,.00,1.82,.04,.02,.96);
  addStem(.10,.03,1.56,.09,-.03,.88);
  addStem(-.11,.04,1.48,-.07,.03,.82);
  addStem(-.07,-.05,.92,-.02,.01,.58);
  addStem(.05,-.07,.84,.02,-.02,.54);
  g.userData.assetData={kind:'tallPlant'};g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Tall Plant','plantAsset',opts.id);return g
}
function createPlantWallObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  buildMetalGridWall(g,opts.width||2.4,opts.height||2.25,{depth:.10,cols:6,rows:6,withPlants:true});
  g.userData.assetData={kind:'plantWall'};g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Metal Grid Wall · Plants','plantAsset',opts.id);return g
}
function createGridWallObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  buildMetalGridWall(g,opts.width||1.25,opts.height||2.25,{depth:.08,cols:4,rows:6,withPlants:false});
  g.userData.assetData={kind:'gridWall'};venue.add(g);registerBuilderRoot(g,opts.name||'Metal Grid Wall','plantAsset',opts.id);return g
}
function createSunsetLampObject(opts={}){
  const g=new THREE.Group(),hex=opts.color||'#ff6b2b';g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  cyl(.16,.08,0,.04,0,assetMat(0x111216,.46,.62),g,20);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.14,20,14),new THREE.MeshStandardMaterial({color:hex,emissive:hex,emissiveIntensity:4.0,roughness:.18}));glow.position.y=.18;glow.userData.sunsetGlow=true;g.add(glow);
  const light=new THREE.PointLight(hex,2.2,4.6,1.7);light.position.set(0,.42,0);light.userData.sunsetLight=true;g.add(light);
  g.userData.assetData={kind:'sunsetLamp'};g.userData.colorOverride=hex;venue.add(g);registerBuilderRoot(g,opts.name||'Sunset Lamp','sunsetLamp',opts.id);return g
}
function createLagerTapObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const body=assetMat(0x08090b,.34,.76),rim=assetMat(0x24272d,.30,.82);
  cyl(.18,.78,0,.40,0,body,g,24);cyl(.26,.06,0,.04,0,rim,g,24);
  addAssetBox(g,.58,.13,.18,0,.78,0,body);
  const makeBadge=(x,key)=>{
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.08,36),body);disc.rotation.x=Math.PI/2;disc.position.set(x,1.08,0);g.add(disc);
    const face=new THREE.Mesh(new THREE.CircleGeometry(.215,36),new THREE.MeshBasicMaterial({map:venueAssetTexture(key),toneMapped:false}));face.position.set(x,1.08,.055);face.userData.keepTextureColour=true;g.add(face)
  };
  makeBadge(-.26,'lager1');makeBadge(.26,'lager2');
  g.userData.assetData={kind:'lagerTap'};venue.add(g);registerBuilderRoot(g,opts.name||'Mothership Lager Tap','barAsset',opts.id);return g
}
function createBottleRowObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const cols=[0x5a6d58,0x6b4932,0x51668c,0x737173,0x5d3c51,0x355f53];
  for(let i=0;i<6;i++){const x=-.75+i*.30,h=.44+(i%3)*.05,mat=new THREE.MeshStandardMaterial({color:cols[i],transparent:true,opacity:.9,roughness:.35,metalness:.12});cyl(.065,h,x,h/2,0,mat,g,12);cyl(.034,.12,x,h+.055,0,mat,g,10);cyl(.036,.02,x,h+.125,0,assetMat(0x19191b,.45,.55),g,10)}
  g.userData.assetData={kind:'bottleRow'};venue.add(g);registerBuilderRoot(g,opts.name||'Six Bottle Row','barAsset',opts.id);return g
}

function addBarShelfBottle(parent,x,y,z=.13,h=.30,col=0x5a6d58){
  const glass=new THREE.MeshStandardMaterial({color:col,transparent:true,opacity:.91,roughness:.30,metalness:.08});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.045,.052,h,10),glass);body.position.set(x,y+h/2,z);parent.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.023,.028,h*.22,9),glass);neck.position.set(x,y+h+h*.10,z);parent.add(neck);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.024,9),assetMat(0x23252a,.42,.48));cap.position.set(x,y+h+h*.22,z);parent.add(cap)
}
function addBarShelfBottleRow(parent,y,w,count=6,offset=0){
  const cols=[0x5a6d58,0x6b4932,0x51668c,0x737173,0x5d3c51,0x355f53,0x8a704c,0x465b70];
  for(let i=0;i<count;i++){const t=count===1?.5:i/(count-1),x=-w/2+t*w,h=.24+((i+offset)%4)*.035;addBarShelfBottle(parent,x,y,.13,h,cols[(i+offset)%cols.length])}
}
function createBarShelfSetObject(kind='lowerShelves',opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const shelfMat=assetMat(0x080a0e,.48,.38),pink=new THREE.MeshStandardMaterial({color:0xff2e83,emissive:0xff2e83,emissiveIntensity:1.65,roughness:.24}),purple=new THREE.MeshStandardMaterial({color:0x7b38ff,emissive:0x7b38ff,emissiveIntensity:1.45,roughness:.24});
  const shelf=(y,w,glow='pink',count=6,offset=0)=>{addAssetBox(g,w,.055,.20,0,y,0,shelfMat);addAssetBox(g,w*.96,.015,.05,0,y-.047,.105,glow==='purple'?purple:pink);addBarShelfBottleRow(g,y+.060,w*.82,count,offset)};
  if(kind==='lowerShelves'){
    shelf(1.43,1.82,'pink',6,1);shelf(1.93,1.94,'purple',6,4);
  }else{
    shelf(1.18,2.40,'pink',8,0);shelf(1.57,2.65,'purple',9,3);shelf(1.96,2.45,'pink',8,6);
  }
  g.userData.assetData={kind};venue.add(g);registerBuilderRoot(g,opts.name||(kind==='lowerShelves'?'Lower Bar Shelves':'Upper Bar Shelves'),'barAsset',opts.id);return g
}
function tagRestoredLibraryObject(o,phase,category,label){if(!o)return o;o.userData.buildPhase=phase;o.userData.buildCategory=category;o.userData.buildItem=label;o.userData.phaseLocked=!!phaseLocks[phase];applyPhaseVisibilityToObject(o);return o}
function addRestoredLibraryObject(createFn,phase,category,label,message){pushHistory();const o=createFn();tagRestoredLibraryObject(o,phase,category,label);selectEdit(o);saveLocalEditState(false);flashEditor(message||label+' added');return o}

function createToiletObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);
  const ceramic=new THREE.MeshStandardMaterial({color:opts.color||0xe9ecef,roughness:.34,metalness:.01});
  const inner=new THREE.MeshStandardMaterial({color:0x20242a,roughness:.72,metalness:.02});
  const metal=new THREE.MeshStandardMaterial({color:0xbfc5cc,roughness:.32,metalness:.62});
  // Minimal modern back-to-wall silhouette: smooth pedestal, compact bowl, slim seat and clean cistern.
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.145,.205,.36,16),ceramic);pedestal.position.set(0,.18,.015);g.add(pedestal);
  const bowl=new THREE.Mesh(new THREE.SphereGeometry(.255,20,12,0,Math.PI*2,0,Math.PI*.60),ceramic);bowl.scale.set(1,.66,1.16);bowl.position.set(0,.43,.035);g.add(bowl);
  const seat=new THREE.Mesh(new THREE.TorusGeometry(.19,.025,10,24),inner);seat.rotation.x=Math.PI/2;seat.scale.z=1.15;seat.position.set(0,.535,.045);g.add(seat);
  const cistern=addAssetBox(g,.42,.50,.16,0,.82,-.245,ceramic);
  const top=addAssetBox(g,.44,.035,.18,0,1.085,-.245,ceramic);
  const flush=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.012,14),metal);flush.rotation.x=Math.PI/2;flush.position.set(.10,1.105,-.155);g.add(flush);
  g.userData.assetData={kind:'toilet',autoFloorSnap:opts.autoFloorSnap!==false,floorSnapName:opts.floorSnapName||''};
  g.userData.colorOverride=opts.color||'#e9ecef';g.userData.freeStanding=true;
  venue.add(g);registerBuilderRoot(g,opts.name||'Minimal Toilet','fixtureAsset',opts.id);normalizeFreestandingToilet(g);if(opts.color)setObjectColour(g,opts.color);return g
}
function createUrinalObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);
  const ceramic=new THREE.MeshStandardMaterial({color:opts.color||0xf1f2f3,roughness:.34,metalness:.01});
  const dark=new THREE.MeshStandardMaterial({color:0x17191d,roughness:.58,metalness:.04});
  const chrome=assetMat(0xbfc4cb,.18,.72);
  // Minimal wall-mounted back plate.
  const back=addAssetBox(g,.38,.64,.08,0,.72,-.12,ceramic);
  // Smooth compact bowl projected from the wall. Geometry begins above floor so root Y remains the floor reference level.
  const bowl=new THREE.Mesh(new THREE.SphereGeometry(.235,24,16,0,Math.PI*2,0,Math.PI*.66),ceramic);bowl.scale.set(.86,.92,.72);bowl.rotation.x=-.12;bowl.position.set(0,.55,.08);g.add(bowl);
  // Clean dark inner opening, kept subtle for the minimal venue-pack style.
  const inner=new THREE.Mesh(new THREE.TorusGeometry(.125,.024,10,24),dark);inner.rotation.x=Math.PI/2;inner.scale.set(1,.80,1);inner.position.set(0,.61,.235);g.add(inner);
  // Small flush control and a narrow upper connector; no exposed plumbing clutter.
  const flush=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.018,16),chrome);flush.rotation.x=Math.PI/2;flush.position.set(0,.91,-.065);g.add(flush);
  const connector=addAssetBox(g,.07,.17,.045,0,1.02,-.085,chrome);
  g.userData.assetData={kind:'urinal',autoFloorSnap:opts.autoFloorSnap!==false,floorSnapName:opts.floorSnapName||'',mountHeight:Number.isFinite(+opts.mountHeight)?+opts.mountHeight:.38};
  venue.add(g);registerBuilderRoot(g,opts.name||'Minimal Mens Urinal','fixtureAsset',opts.id);normalizeFreestandingToilet(g);if(opts.color)setObjectColour(g,opts.color);return g
}
function clearGroupChildren(g){while(g.children.length){const c=g.children.pop();if(c&&typeof c.getRenderTarget==='function'){const rt=c.getRenderTarget();if(rt&&rt.dispose)rt.dispose()}if(c.geometry)c.geometry.dispose();if(c.material){if(Array.isArray(c.material))c.material.forEach(m=>m.dispose&&m.dispose());else c.material.dispose&&c.material.dispose()}}}
function isSpeakerStackRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='speakerStack'}
function normaliseSpeakerStackData(raw={}){const d=raw||{};d.kind='speakerStack';d.width=Math.max(.45,+d.width||1.20);d.depth=Math.max(.30,+d.depth||.72);d.height=Math.max(.65,+d.height||1.90);d.subCount=Math.max(1,Math.min(3,Math.round(+d.subCount||2)));d.topCount=Math.max(1,Math.min(6,Math.round(+d.topCount||3)));d.topSide=['left','center','right'].includes(d.topSide)?d.topSide:'left';d.style=d.style==='centered'?'centered':'venue';return d}
function speakerStackTopX(d,topW){if(d.style==='centered'||d.topSide==='center')return 0;const edge=Math.max(0,d.width/2-topW/2);return d.topSide==='right'?edge:-edge}
function addSpeakerCabinet(g,w,h,d,x,y,z,bodyMat,grilleMat,edgeMat){
  addAssetBox(g,w,h,d,x,y,z,bodyMat);
  const grilleDepth=Math.min(.018,Math.max(.009,d*.028));
  addAssetBox(g,w*.90,h*.82,grilleDepth,x,y,z+d/2+grilleDepth/2+.001,grilleMat);
  const lip=Math.min(.024,Math.max(.010,Math.min(w,h)*.035));
  addAssetBox(g,w*.94,lip,grilleDepth*.75,x,y+h*.44,z+d/2+grilleDepth+.002,edgeMat);
  addAssetBox(g,w*.94,lip,grilleDepth*.75,x,y-h*.44,z+d/2+grilleDepth+.002,edgeMat);
}

function isSpeakerCabinetRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&['speakerSub','speakerTop'].includes(o.userData.assetData.kind)}
function isSpeakerSubRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='speakerSub'}
function isSpeakerTopRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='speakerTop'}
function normaliseSpeakerCabinetData(raw={}){const d=raw||{};d.kind=d.kind==='speakerSub'?'speakerSub':'speakerTop';if(d.kind==='speakerSub'){d.width=Math.max(.30,+d.width||1.08);d.depth=Math.max(.20,+d.depth||.82);d.height=Math.max(.20,+d.height||.88)}else{d.width=Math.max(.18,+d.width||.46);d.depth=Math.max(.12,+d.depth||.34);d.height=Math.max(.10,+d.height||.25);d.tilt=Number.isFinite(+d.tilt)?+d.tilt:-4}return d}
function rebuildSpeakerCabinetObject(g){if(!isSpeakerCabinetRoot(g))return;const d=normaliseSpeakerCabinetData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const bodyHex=g.userData.colorOverride||'#08090b',body=new THREE.MeshStandardMaterial({color:bodyHex,roughness:.88,metalness:.05}),grille=new THREE.MeshStandardMaterial({color:0x171a1f,roughness:.98,metalness:.02}),edge=new THREE.MeshStandardMaterial({color:0x252a31,roughness:.72,metalness:.18});addSpeakerCabinet(g,d.width,d.height,d.depth,0,d.height/2,0,body,grille,edge);g.updateMatrixWorld(true)}
function createSpeakerSubObject(opts={}){const g=new THREE.Group(),hex=opts.color||'#08090b';g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseSpeakerCabinetData({kind:'speakerSub',width:opts.width||1.08,depth:opts.depth||.82,height:opts.height||.88});g.userData.colorOverride=hex;venue.add(g);registerBuilderRoot(g,opts.name||'Stage Sub','fixtureAsset',opts.id);rebuildSpeakerCabinetObject(g);return g}
function createSpeakerTopObject(opts={}){const g=new THREE.Group(),hex=opts.color||'#08090b';g.position.set(opts.x??target.x,opts.y??mainFloorLevel()+1.5,opts.z??target.z);g.userData.assetData=normaliseSpeakerCabinetData({kind:'speakerTop',width:opts.width||.46,depth:opts.depth||.34,height:opts.height||.25,tilt:opts.tilt});g.userData.colorOverride=hex;venue.add(g);registerBuilderRoot(g,opts.name||'Stage Top Cabinet','fixtureAsset',opts.id);rebuildSpeakerCabinetObject(g);if(Number.isFinite(+opts.tilt))g.rotation.x=THREE.MathUtils.degToRad(+opts.tilt);return g}
function createSeparateStageSpeakerSet(opts={}){const baseX=opts.x??target.x,baseY=opts.y??mainFloorLevel(),baseZ=opts.z??target.z,hex=opts.color||'#08090b';const subW=opts.subWidth||1.08,subD=opts.subDepth||.82,subH=opts.subHeight||.88,topW=opts.topWidth||.46,topD=opts.topDepth||.34,topH=opts.topHeight||.25;const sub=createSpeakerSubObject({name:'Stage Sub',x:baseX,y:baseY,z:baseZ,width:subW,depth:subD,height:subH,color:hex});const cabinets=[];const tiltSeries=[-2,-4,-7,-10],zSeries=[-.02,.00,.03,.07],gap=.018,lowestBottom=baseY+1.24;for(let i=0;i<4;i++){const levelFromBottom=3-i;const y=lowestBottom+levelFromBottom*(topH+gap);const top=createSpeakerTopObject({name:'Stage Top Cabinet '+(i+1),x:baseX,y,y,z:baseZ+zSeries[i],width:topW,depth:topD,height:topH,tilt:tiltSeries[i],color:hex});cabinets.push(top)}return [sub,...cabinets]}

function rebuildSpeakerStackObject(g){
  if(!isSpeakerStackRoot(g))return;const d=normaliseSpeakerStackData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);
  const bodyHex=g.userData.colorOverride||'#08090b',body=new THREE.MeshStandardMaterial({color:bodyHex,roughness:.88,metalness:.05}),grille=new THREE.MeshStandardMaterial({color:0x171a1f,roughness:.98,metalness:.02}),edge=new THREE.MeshStandardMaterial({color:0x252a31,roughness:.72,metalness:.18});
  const gapX=Math.min(.035,d.width*.025),subH=Math.max(.30,Math.min(d.height*.37,d.height-.32)),subW=Math.max(.16,(d.width-gapX*(d.subCount-1))/d.subCount);
  for(let i=0;i<d.subCount;i++){const x=-d.width/2+subW/2+i*(subW+gapX);addSpeakerCabinet(g,subW,subH,d.depth,x,subH/2,0,body,grille,edge)}
  const towerGap=Math.min(.035,d.height*.018),towerH=Math.max(.22,d.height-subH-towerGap),topW=Math.max(.24,Math.min(d.width*.48,.64*(d.width/1.20))),topDepth=Math.max(.22,d.depth*.60),boxGap=Math.min(.024,towerH*.025),topH=Math.max(.10,(towerH-boxGap*(d.topCount-1))/d.topCount),topX=speakerStackTopX(d,topW),topZ=(d.depth-topDepth)/2-.018;
  for(let i=0;i<d.topCount;i++){const y=subH+towerGap+topH/2+i*(topH+boxGap);addSpeakerCabinet(g,topW,topH,topDepth,topX,y,topZ,body,grille,edge)}
  // subtle rear support plate keeps the tower silhouette cohesive without over-detailing it
  addAssetBox(g,Math.max(.05,topW*.12),Math.max(.12,towerH*.94),Math.max(.04,topDepth*.12),topX,subH+towerGap+towerH*.50,topZ-topDepth*.48,edge);
  g.updateMatrixWorld(true)
}
function createSpeakerStackObject(opts={}){const g=new THREE.Group(),hex=opts.color||'#08090b';g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseSpeakerStackData({kind:'speakerStack',width:opts.width||1.20,depth:opts.depth||.72,height:opts.height||1.90,subCount:opts.subCount||2,topCount:opts.topCount||3,topSide:opts.topSide||'left',style:opts.style||'venue'});g.userData.colorOverride=hex;venue.add(g);registerBuilderRoot(g,opts.name||'Stage Speaker Stack','fixtureAsset',opts.id);rebuildSpeakerStackObject(g);return g}
function bakeSpeakerStackScale(root){if(!isSpeakerStackRoot(root))return;const d=normaliseSpeakerStackData(root.userData.assetData);d.width*=Math.abs(root.scale.x||1);d.height*=Math.abs(root.scale.y||1);d.depth*=Math.abs(root.scale.z||1);root.scale.set(1,1,1);rebuildSpeakerStackObject(root)}
function setSpeakerStackOption(key,value){if(!isSpeakerStackRoot(selectedEdit))return;pushHistory();bakeSpeakerStackScale(selectedEdit);const d=normaliseSpeakerStackData(selectedEdit.userData.assetData);if(key==='subCount')d.subCount=Math.max(1,Math.min(3,Math.round(+value||2)));else if(key==='topCount')d.topCount=Math.max(1,Math.min(6,Math.round(+value||3)));else if(key==='topSide')d.topSide=['left','center','right'].includes(value)?value:'left';else if(key==='style')d.style=value==='centered'?'centered':'venue';rebuildSpeakerStackObject(selectedEdit);updateSelectionBox();saveLocalEditState(false);syncAdvancedFields()}
function resetSelectedSpeakerStackShape(){if(!isSpeakerStackRoot(selectedEdit))return;pushHistory();const d=normaliseSpeakerStackData(selectedEdit.userData.assetData);d.width=1.20;d.depth=.72;d.height=1.90;d.subCount=2;d.topCount=3;d.topSide='left';d.style='venue';selectedEdit.scale.set(1,1,1);rebuildSpeakerStackObject(selectedEdit);updateSelectionBox();saveLocalEditState(false);syncAdvancedFields();flashEditor('Speaker stack reference proportions restored')}
function duplicateSpeakerStackForOtherSide(){if(!isSpeakerStackRoot(selectedEdit)){flashEditor('Select a stage speaker stack first');return}const original=selectedEdit;const dup=duplicateSelectedEditable();if(!dup||!isSpeakerStackRoot(dup))return;const d=normaliseSpeakerStackData(dup.userData.assetData);if(d.topSide==='left')d.topSide='right';else if(d.topSide==='right')d.topSide='left';rebuildSpeakerStackObject(dup);const dist=(normaliseSpeakerStackData(original.userData.assetData).width*Math.abs(original.scale.x||1))+1.0,offset=new THREE.Vector3(dist,0,0).applyQuaternion(original.quaternion);dup.position.copy(original.position).add(offset);dup.rotation.copy(original.rotation);dup.updateMatrixWorld(true);updateSelectionBox();saveLocalEditState(false);syncAdvancedFields();flashEditor('Opposite stage speaker stack duplicated · same facing direction · move into final position')}
function syncSpeakerStackUI(){const box=document.getElementById('speakerStackBox');if(!box)return;const on=isSpeakerStackRoot(selectedEdit);box.style.display=on?'block':'none';if(!on)return;const d=normaliseSpeakerStackData(selectedEdit.userData.assetData);const sc=document.getElementById('speakerSubCount'),tc=document.getElementById('speakerTopCount'),side=document.getElementById('speakerTopSide'),style=document.getElementById('speakerStackStyle');if(sc)sc.value=d.subCount;if(tc)tc.value=d.topCount;if(side)side.value=d.topSide;if(style)style.value=d.style}
function isSimpleDoorRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&['door','doorFrame'].includes(o.userData.assetData.kind)}
function normaliseSimpleDoorData(raw={}){const d=raw||{};d.kind='door';d.width=Math.max(.25,+d.width||.96);d.height=Math.max(.25,+d.height||2.08);d.depth=Math.max(.025,+d.depth||.05);d.post=Math.max(.012,Math.min(.065,+d.post||.028));d.hinge=d.hinge==='right'?'right':'left';d.apex=d.apex==='outward'?'outward':'inward';return d}
function rebuildSimpleDoorObject(g){if(!isSimpleDoorRoot(g))return;const d=normaliseSimpleDoorData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const doorW=d.width,doorH=d.height,doorT=d.depth,post=d.post,hex=g.userData.colorOverride||'#050607';const frameMat=new THREE.MeshStandardMaterial({color:0x0a0c0f,roughness:.82,metalness:.10});const slabMat=new THREE.MeshStandardMaterial({color:hex,roughness:.88,metalness:.04});const panelMat=new THREE.MeshStandardMaterial({color:0x8e98a5,roughness:.34,metalness:.76});const lineMat=new THREE.LineBasicMaterial({color:0x12161b,transparent:true,opacity:.92});const dashMat=new THREE.LineDashedMaterial({color:0x1d2229,dashSize:.085,gapSize:.055,transparent:true,opacity:.95});addAssetBox(g,doorW+post*2,post,Math.max(.02,doorT*.80),0,doorH-post/2,0,frameMat);addAssetBox(g,post,doorH,Math.max(.02,doorT*.80),-doorW/2-post/2,doorH/2,0,frameMat);addAssetBox(g,post,doorH,Math.max(.02,doorT*.80),doorW/2+post/2,doorH/2,0,frameMat);addAssetBox(g,doorW,doorH,doorT,0,doorH/2,0,slabMat);const latchX=d.hinge==='left'?doorW*.34:-doorW*.34;addAssetBox(g,.055,.18,.006,latchX,1.00,doorT/2+.004,panelMat);addAssetBox(g,.055,.18,.006,latchX,1.00,-doorT/2-.004,panelMat);const hingeX=d.hinge==='left'?-doorW/2:doorW/2,dir=d.hinge==='left'?1:-1,apexSign=d.apex==='outward'?-1:1;const closed=[new THREE.Vector3(hingeX,.01,0),new THREE.Vector3(hingeX+dir*doorW,.01,0)];const leafClosed=new THREE.Line(new THREE.BufferGeometry().setFromPoints(closed),lineMat);leafClosed.userData.planGuide=true;g.add(leafClosed);const arcPts=[];for(let i=0;i<=18;i++){const a=(Math.PI/2)*(i/18),x=hingeX+dir*Math.cos(a)*doorW,z=apexSign*Math.sin(a)*doorW;arcPts.push(new THREE.Vector3(x,.01,z))}const arc=new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts),dashMat);arc.computeLineDistances();arc.userData.planGuide=true;g.add(arc);const swingLeaf=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(hingeX,.01,0),arcPts[arcPts.length-1].clone()]),lineMat);swingLeaf.userData.planGuide=true;g.add(swingLeaf);g.updateMatrixWorld(true)}
function syncDoorUI(){const box=document.getElementById('doorOptionsBox');if(!box)return;const on=isSimpleDoorRoot(selectedEdit);box.style.display=on?'block':'none';if(!on)return;const d=normaliseSimpleDoorData(selectedEdit.userData.assetData),hinge=document.getElementById('doorHingeSide'),apex=document.getElementById('doorApexDir');if(hinge)hinge.value=d.hinge;if(apex)apex.value=d.apex}
function setDoorOption(key,value){if(!isSimpleDoorRoot(selectedEdit))return;pushHistory();const d=normaliseSimpleDoorData(selectedEdit.userData.assetData);if(key==='hinge')d.hinge=value==='right'?'right':'left';else if(key==='apex')d.apex=value==='outward'?'outward':'inward';rebuildSimpleDoorObject(selectedEdit);updateSelectionBox();saveLocalEditState(false);syncAdvancedFields();flashEditor('Door '+key+' updated')}
function snapSelectedDoorToWallAndCut(){if(!isSimpleDoorRoot(selectedEdit)){flashEditor('Select a door first');return}if(selectedEdit.userData.attachedWallCut){flashEditor('This door is already snapped into a cut wall opening');return}const old=selectedEdit,d=normaliseSimpleDoorData(old.userData.assetData),world=old.getWorldPosition(new THREE.Vector3()),snap=nearestWallSegmentSnap(world,null,1.15);if(!snap){flashEditor('Move the door closer to a wall, then try SNAP TO WALL + CUT');return}pushHistory();const door=insertDoorIntoWall(snap.root,snap.point,{width:d.width,height:d.height,depth:d.depth,post:d.post,hinge:d.hinge,apex:d.apex,color:old.userData.colorOverride||'#050607',phaseSource:old,skipHistory:true,name:old.userData.editName||'Door'});if(!door){history.pop();return}removeDynamicRoot(old);selectEdit(door);saveLocalEditState(false);syncAdvancedFields()}
function rebuildDoorFrameObject(g){rebuildSimpleDoorObject(g)}
function createDoorFrameObject(opts={}){return createDoorObject({...opts,name:opts.name||'Door'})}
function createDoorObject(opts={}){const g=new THREE.Group(),hex=opts.color||'#050607';g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseSimpleDoorData({kind:'door',width:opts.width||.96,height:opts.height||2.08,depth:opts.depth||.05,post:opts.post||.028,hinge:opts.hinge||opts.swing||'left',apex:opts.apex||'inward'});g.userData.colorOverride=hex;venue.add(g);registerBuilderRoot(g,opts.name||'Door','fixtureAsset',opts.id);rebuildSimpleDoorObject(g);return g}
function createRectShapeObject(opts={}){
  const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??0,opts.z??target.z);
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,.85,.7),new THREE.MeshStandardMaterial({color:opts.color||0x171a20,roughness:.82,metalness:.06}));body.position.set(0,.425,0);g.add(body);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2,.85,.7)),new THREE.LineBasicMaterial({color:0x3e4652}));edge.position.set(0,.425,0);g.add(edge);
  g.userData.assetData={kind:'rectShape'};venue.add(g);registerBuilderRoot(g,opts.name||'Rectangular Shape','fixtureAsset',opts.id);if(opts.color)setObjectColour(g,opts.color);return g
}

function isSinkPairRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='sinkPair'}
function normaliseSinkPairData(raw={}){const d=raw||{};d.kind='sinkPair';d.width=Math.max(.55,+d.width||.86);d.depth=Math.max(.24,+d.depth||.38);d.height=Math.max(.06,+d.height||.16);d.autoSurfaceSnap=d.autoSurfaceSnap!==false;d.surfaceName=d.surfaceName||'';return d}
function rebuildSinkPairObject(g){if(!isSinkPairRoot(g))return;const d=normaliseSinkPairData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const ceramic=new THREE.MeshStandardMaterial({color:0xe9ecef,roughness:.93,metalness:.01});const inner=new THREE.MeshStandardMaterial({color:0xb9c0c7,roughness:.90,metalness:.01});const metal=new THREE.MeshStandardMaterial({color:0x8f98a4,roughness:.24,metalness:.86});const pairGap=Math.max(.08,d.width*.12),eachW=Math.max(.20,(d.width-pairGap)/2),bowlD=Math.min(d.depth*.68,.27),bowlW=Math.min(eachW*.72,.30),rimH=Math.min(.055,d.height*.34),innerH=Math.max(.018,rimH*.42),xOff=(eachW+pairGap)/2;[-xOff,xOff].forEach(x=>{const rim=new THREE.Mesh(new THREE.CylinderGeometry(bowlW*.50,bowlW*.56,rimH,24),ceramic);rim.scale.z=Math.max(.62,bowlD/bowlW);rim.position.set(x,rimH/2,0);g.add(rim);const well=new THREE.Mesh(new THREE.CylinderGeometry(bowlW*.36,bowlW*.41,innerH,24),inner);well.scale.z=Math.max(.62,bowlD/bowlW);well.position.set(x,rimH+innerH/2-.012,0);g.add(well);cyl(.009,Math.max(.10,d.height*.72),x,rimH+Math.max(.10,d.height*.72)/2,-bowlD*.34,metal,g,10);addAssetBox(g,.075,.014,.026,x,rimH+Math.max(.10,d.height*.72),-bowlD*.34,metal)});g.updateMatrixWorld(true)}
function createSinkPairObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseSinkPairData({width:opts.width,depth:opts.depth,height:opts.height,autoSurfaceSnap:opts.autoSurfaceSnap,surfaceName:opts.surfaceName});g.userData.colorOverride=opts.color||'#e9ecef';venue.add(g);registerBuilderRoot(g,opts.name||'2 Sink Basins','fixtureAsset',opts.id);rebuildSinkPairObject(g);return g}
function isRaisedSinkSurface(root){if(!root||isSinkPairRoot(root)||isWallRoot(root)||root===exteriorFloor||root===smokeFloor||(typeof isRoomFloorRoot==='function'&&isRoomFloorRoot(root)))return false;const t=root.userData&&root.userData.builderType;if(['platformBox','solidPolygon','rectShape'].includes(t))return true;if(t==='platform'){const d=root.userData&&root.userData.platformData;return !(d&&d.roomData)}if(isSolidPolygonRoot(root)||isStaticPointSolid(root))return true;return !!(root.userData&&root.userData.dynamic&&root.userData.solidData&&root.userData.solidData.role==='phaseAsset')}
function surfaceWorldYaw(root){try{const q=root.getWorldQuaternion(new THREE.Quaternion()),e=new THREE.Euler().setFromQuaternion(q,'YXZ');return e.y}catch(e){return root.rotation?root.rotation.y:0}}
function createSinkPairOnSurface(surface,opts={}){if(!isRaisedSinkSurface(surface))return createSinkPairObject(opts);surface.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(surface),c=new THREE.Vector3();b.getCenter(c);const sink=createSinkPairObject({...opts,x:c.x,y:b.max.y+.004,z:c.z,surfaceName:surface.userData?.editName||'Raised surface'});sink.rotation.y=surfaceWorldYaw(surface);sink.userData.assetData.surfaceId=surface.userData?.editId||surface.uuid;sink.userData.assetData.surfaceName=surface.userData?.editName||'Raised surface';sink.updateMatrixWorld(true);return sink}
function sinkTopSurfaceHit(root=selectedEdit,maxRise=2.4){if(!isSinkPairRoot(root))return null;root.updateMatrixWorld(true);const pos=root.getWorldPosition(new THREE.Vector3()),origin=new THREE.Vector3(pos.x,pos.y+maxRise,pos.z);ray.set(origin,new THREE.Vector3(0,-1,0));const hits=ray.intersectObjects(surfaceMeshes(),false);for(const h of hits){const sr=surfaceRootForObject(h.object);if(!sr||sr===root||!isRaisedSinkSurface(sr))continue;const n=h.face?h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize():new THREE.Vector3(0,1,0);if(n.y<.55)continue;if(h.point.y>origin.y+.01)continue;return {hit:h,root:sr,normal:n}}return null}
function snapSinkToSurface(root=selectedEdit,announce=true){if(!isSinkPairRoot(root)){if(announce)flashEditor('Select the sink pair first');return false}const found=sinkTopSurfaceHit(root,2.6);if(!found){if(announce)flashEditor('No raised counter / object directly under the sinks');return false}root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),delta=found.hit.point.y+.004-b.min.y;root.position.y+=delta;root.rotation.y=surfaceWorldYaw(found.root);const d=normaliseSinkPairData(root.userData.assetData);d.surfaceId=found.root.userData?.editId||found.root.uuid;d.surfaceName=found.root.userData?.editName||'Raised surface';root.updateMatrixWorld(true);updateSelectionBox();updateEditorSelected();syncAdvancedFields();if(announce){saveLocalEditState(false);flashEditor('Sinks snapped to '+d.surfaceName+' top surface')}return true}
function toggleSinkAutoSurfaceSnap(){if(!isSinkPairRoot(selectedEdit))return;const d=normaliseSinkPairData(selectedEdit.userData.assetData);d.autoSurfaceSnap=!d.autoSurfaceSnap;saveLocalEditState(false);syncSinkPlacementUI();flashEditor('Sink auto top snap '+(d.autoSurfaceSnap?'ON':'OFF'))}
function syncSinkPlacementUI(){const box=document.getElementById('sinkPlacementBox');if(!box)return;const on=isSinkPairRoot(selectedEdit);box.style.display=on?'block':'none';if(!on)return;const d=normaliseSinkPairData(selectedEdit.userData.assetData),found=sinkTopSurfaceHit(selectedEdit,2.6),status=document.getElementById('sinkSurfaceStatus'),read=document.getElementById('sinkSurfaceReadout'),txt=document.getElementById('sinkSurfaceText'),val=document.getElementById('sinkSurfaceValue'),auto=document.getElementById('toggleSinkAutoSurface');if(auto){auto.textContent=d.autoSurfaceSnap?'AUTO TOP SNAP ON':'AUTO TOP SNAP OFF';auto.classList.toggle('active',!!d.autoSurfaceSnap)}if(status)status.textContent=d.surfaceName?String(d.surfaceName).toUpperCase():'RAISED SURFACE';if(read)read.className='level-status '+(found?'aligned':'na');if(found){if(txt)txt.textContent='SURFACE UNDER · '+String(found.root.userData?.editName||'RAISED OBJECT').toUpperCase();if(val)val.textContent=(found.hit.point.y-mainFloorLevel()).toFixed(3)+' m'}else{if(txt)txt.textContent='MOVE OVER A COUNTER / RAISED OBJECT';if(val)val.textContent='—'}}

function isDoubleSinkCounterRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='doubleSinkCounter'}
function normaliseDoubleSinkCounterData(raw={}){const d=raw||{};d.kind='doubleSinkCounter';d.width=Math.max(.80,+d.width||1.45);d.depth=Math.max(.25,+d.depth||.52);d.height=Math.max(.55,+d.height||.88);return d}
function rebuildDoubleSinkCounterObject(g){if(!isDoubleSinkCounterRoot(g))return;const d=normaliseDoubleSinkCounterData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const bodyMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x171a20,roughness:.84,metalness:.06}),topMat=new THREE.MeshStandardMaterial({color:0x0d1015,roughness:.56,metalness:.18}),sinkMat=new THREE.MeshStandardMaterial({color:0xe7eaee,roughness:.96,metalness:.01}),tapMat=new THREE.MeshStandardMaterial({color:0x8e97a4,roughness:.22,metalness:.85});const bodyH=Math.max(.30,d.height-.06),topT=.06;addAssetBox(g,d.width,bodyH,d.depth,0,bodyH/2,0,bodyMat);addAssetBox(g,d.width,topT,d.depth+.02,0,bodyH+topT/2,0,topMat);const sinkW=Math.min(.38,d.width*.22),sinkD=Math.min(.28,d.depth*.48),sinkH=.10,offset=Math.min(d.width*.24,.33);[-offset,offset].forEach(x=>{addAssetBox(g,sinkW,sinkH,sinkD,x,bodyH+topT-sinkH/2+.01,0,sinkMat);addAssetBox(g,sinkW*.68,sinkH*.38,sinkD*.68,x,bodyH+topT-sinkH/2+.042,0,new THREE.MeshStandardMaterial({color:0xb9c0c7,roughness:.88,metalness:.02}));cyl(.008,.16,x,bodyH+topT+.07,-sinkD*.10,tapMat,g,10);addAssetBox(g,.06,.014,.03,x,bodyH+topT+.14,-sinkD*.10,tapMat)});g.updateMatrixWorld(true)}
function createDoubleSinkCounterObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseDoubleSinkCounterData({width:opts.width,height:opts.height,depth:opts.depth});g.userData.colorOverride=opts.color||'#171a20';venue.add(g);registerBuilderRoot(g,opts.name||'Hand Basin Counter','fixtureAsset',opts.id);rebuildDoubleSinkCounterObject(g);return g}
function isHandrailRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='handrail'}
function normaliseHandrailData(raw={}){const d=raw||{};d.kind='handrail';d.length=Math.max(.40,+d.length||1.35);d.rise=Math.max(0,+d.rise||.48);d.railHeight=Math.max(.64,+d.railHeight||.90);d.postRadius=Math.max(.015,+d.postRadius||.042);d.midRailRadius=Math.max(.010,+d.midRailRadius||d.postRadius*.62);d.wallPlateRadius=Math.max(.03,+d.wallPlateRadius||d.postRadius*1.8);d.side=d.side==='right'?'right':'left';return d}
function addCylinderBetween(parent,a,b,r,mat,segments=10){const dir=b.clone().sub(a),len=Math.max(.001,dir.length()),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,segments),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function rebuildHandrailObject(g){if(!isHandrailRoot(g))return;const d=normaliseHandrailData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const mat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x818892,roughness:.22,metalness:.88});const wallMat=new THREE.MeshStandardMaterial({color:0x6f7781,roughness:.32,metalness:.76});const z0=-d.length/2,z1=d.length/2,y0=d.railHeight,y1=d.railHeight+d.rise;const topA=new THREE.Vector3(0,y0,z0),topB=new THREE.Vector3(0,y1,z1);addCylinderBetween(g,topA,topB,d.postRadius,mat,18);addCylinderBetween(g,new THREE.Vector3(0,y0*.58,z0),new THREE.Vector3(0,(y0+y1)*.58,z1),d.midRailRadius,mat,14);[0,.5,1].forEach((t,i)=>{const z=z0+(z1-z0)*t,y=y0+(y1-y0)*t;addCylinderBetween(g,new THREE.Vector3(0,0,z),new THREE.Vector3(0,y,z),Math.max(.012,d.postRadius*.70),wallMat,12);const plate=new THREE.Mesh(new THREE.CylinderGeometry(d.wallPlateRadius,d.wallPlateRadius,.024,18),wallMat);plate.rotation.x=Math.PI/2;plate.position.set(0,y,z);plate.castShadow=true;plate.receiveShadow=true;g.add(plate)});g.updateMatrixWorld(true)}
function createHandrailObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseHandrailData({length:opts.length,rise:opts.rise,railHeight:opts.railHeight,postRadius:opts.postRadius,midRailRadius:opts.midRailRadius,wallPlateRadius:opts.wallPlateRadius,side:opts.side});g.userData.colorOverride=opts.color||'#7e8790';venue.add(g);registerBuilderRoot(g,opts.name||'Handrail','fixtureAsset',opts.id);rebuildHandrailObject(g);if(Number.isFinite(+opts.rotY))g.rotation.y=+opts.rotY;return g}
function addHandrailsToSelectedSteps(side='both'){const root=selectedEdit;if(!root||root.userData.builderType!=='steps'){flashEditor('Select the stairs first');return null}const d=root.userData.stepsData||{width:1.8,run:1.35,height:.48},sides=side==='both'?['left','right']:[side],arr=[];sides.forEach(s=>{const offX=(s==='left'?-1:1)*(d.width/2+.04),world=root.localToWorld(new THREE.Vector3(offX,0,0));const rail=createHandrailObject({name:'Stair Handrail',x:world.x,y:world.y,z:world.z,length:d.run,rise:d.height,railHeight:.90,postRadius:.042,midRailRadius:.026,wallPlateRadius:.07,side:s,color:'#7e8790'});rail.rotation.copy(root.rotation);arr.push(rail)});return arr}
function syncStairRailUI(){const box=document.getElementById('stairRailBox');if(!box)return;box.style.display=(selectedEdit&&selectedEdit.userData&&selectedEdit.userData.builderType==='steps')?'block':'none'}

function isCeilingAcUnitRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='acUnit'}
function normaliseAcUnitData(raw={}){const d=raw||{};d.kind='acUnit';d.width=Math.max(.80,+d.width||1.25);d.depth=Math.max(.46,+d.depth||.72);d.height=Math.max(.32,+d.height||.48);d.frame=Math.max(.035,+d.frame||Math.min(d.width,d.depth)*.08);d.ventInset=Math.max(.05,+d.ventInset||Math.min(d.width,d.depth)*.12);return d}
function rebuildAcUnitObject(g){if(!isCeilingAcUnitRoot(g))return;const d=normaliseAcUnitData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;clearGroupChildren(g);const darkGrey=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x4b5159,roughness:.64,metalness:.22});const darker=new THREE.MeshStandardMaterial({color:0x23272d,roughness:.74,metalness:.10});const panel=new THREE.MeshStandardMaterial({color:0x171b20,roughness:.82,metalness:.04});const trim=new THREE.MeshStandardMaterial({color:0x7c828a,roughness:.42,metalness:.38});const w=d.width,dep=d.depth,h=d.height;const lowerH=h*.50,upperH=h-lowerH;addAssetBox(g,w*.98,lowerH,dep,0,lowerH/2,0,darkGrey);addAssetBox(g,w*.84,upperH*.96,dep*.76,0,lowerH+upperH/2,-dep*.05,darkGrey);const recessW=w-d.frame*2,recessD=dep-d.frame*2;addAssetBox(g,recessW,d.frame*.85,recessD,0,d.frame*.42,0,darker);const innerW=recessW-d.ventInset*1.2,innerD=recessD-d.ventInset*1.1;addAssetBox(g,innerW,d.frame*.55,innerD,0,d.frame*.72,0,panel);for(let i=0;i<10;i++){const zz=-innerD/2+(i+.5)*(innerD/10);addAssetBox(g,innerW*.88,.008,.016,0,d.frame*1.02,zz,trim)}addAssetBox(g,innerW*.16,.016,innerD*.26,w*.16,d.frame*1.12,-innerD*.08,trim);addAssetBox(g,innerW*.12,.028,innerD*.12,0,d.frame*1.14,innerD*.14,trim);const bevel=new THREE.Mesh(new THREE.BoxGeometry(w*.92,.018,dep*.92),trim);bevel.position.set(0,lowerH-d.frame*.35,0);bevel.rotation.x=-.22;bevel.castShadow=true;bevel.receiveShadow=true;g.add(bevel);const skirt=new THREE.Mesh(new THREE.BoxGeometry(w*.64,.018,dep*.56),trim);skirt.position.set(0,d.frame*1.18,0);skirt.rotation.x=.28;skirt.castShadow=true;skirt.receiveShadow=true;g.add(skirt);g.updateMatrixWorld(true)}
function createAcUnitObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,Number.isFinite(+opts.y)?+opts.y:(ceilingMountReferenceY()-(+opts.height||.48)),opts.z??target.z);g.userData.assetData=normaliseAcUnitData(opts);g.userData.colorOverride=opts.color||'#4b5159';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'AC Unit','fixtureAsset',opts.id);rebuildAcUnitObject(g);if(Number.isFinite(+opts.rotY))g.rotation.y=+opts.rotY;snapRootToCeiling(g,false);return g}
function isLegacyAcUnitRoot(root){if(!root||!root.userData||root.userData.builderType!=='solidPolygon')return false;const name=String(root.userData.editName||'').toLowerCase(),item=String(root.userData.buildItem||'').toLowerCase(),cat=String(root.userData.buildCategory||'').toLowerCase();return (name.includes('ac unit')||item.includes('ac unit'))&&cat.includes('ceiling')}
function upgradeLegacyAcUnits(){const roots=builderObjects.slice().filter(isLegacyAcUnitRoot);roots.forEach(root=>{const info=objectBoundsWorld(root),state=transformState(root),meta={phase:root.userData.buildPhase,category:root.userData.buildCategory,item:root.userData.buildItem,phaseLocked:!!root.userData.phaseLocked,groupId:root.userData.groupId||'',name:root.userData.editName||'AC Unit',visible:root.visible!==false,color:root.userData.colorOverride||'#4b5159'};const bi=builderObjects.indexOf(root);if(bi>-1)builderObjects.splice(bi,1);const ei=editorRoots.indexOf(root);if(ei>-1)editorRoots.splice(ei,1);if(root.parent)root.parent.remove(root);disposeObject3D(root);const made=createAcUnitObject({id:root.userData.editId,name:meta.name,x:state.p[0],y:state.p[1],z:state.p[2],width:Math.max(.8,info&&info.s?info.s.x:1.25),depth:Math.max(.46,info&&info.s?info.s.z:.72),height:Math.max(.32,info&&info.s?info.s.y:.48),color:meta.color,rotY:state.r[1]});made.visible=meta.visible;made.userData.buildPhase=meta.phase;made.userData.buildCategory=meta.category;made.userData.buildItem=meta.item;made.userData.phaseLocked=meta.phaseLocked;made.userData.groupId=meta.groupId;noteGroupId(meta.groupId);snapRootToCeiling(made,false);applyPhaseVisibilityToObject(made)})}

function isDjBoothRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='djBooth'}
function isDjBoothSideTableRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='djBoothSideTable'}
function isDjBoothMonitorRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='djBoothMonitor'}
function isDjBoothSideSpeakerRoot(o){return isDjBoothSideTableRoot(o)||!!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='djBoothSideSpeaker'}
function normaliseDjBoothData(raw={}){const d=raw||{};d.kind='djBooth';d.width=Math.max(2.4,+d.width||3.72);d.depth=Math.max(.70,+d.depth||1.18);d.height=Math.max(.65,+d.height||1.00);d.topThickness=Math.max(.035,+d.topThickness||.06);d.legWidth=Math.max(.05,+d.legWidth||.10);d.legDepth=Math.max(.05,+d.legDepth||.10);d.legInsetX=Math.max(.16,+d.legInsetX||.30);d.legInsetZ=Math.max(.09,+d.legInsetZ||.17);d.backRailHeight=Math.max(.18,+d.backRailHeight||.30);d.backRailDepth=Math.max(.02,+d.backRailDepth||.03);d.backRailInset=Math.max(.03,+d.backRailInset||.10);d.backRailFrame=Math.max(.02,+d.backRailFrame||.03);d.frontBoardThickness=Math.max(.025,+d.frontBoardThickness||.045);d.frontBoardBottom=Math.max(.02,+d.frontBoardBottom||.07);d.frontLipHeight=Math.max(.006,+d.frontLipHeight||.015);return d}
function normaliseDjBoothSideTableData(raw={}){const d=raw||{};d.kind='djBoothSideTable';d.width=Math.max(.35,+d.width||.60);d.depth=Math.max(.32,+d.depth||.60);d.height=Math.max(.42,+d.height||.86);d.side=d.side==='right'?'right':'left';return d}
function normaliseDjBoothMonitorData(raw={}){const d=raw||{};d.kind='djBoothMonitor';d.width=Math.max(.24,+d.width||.56);d.depth=Math.max(.18,+d.depth||.38);d.height=Math.max(.12,+d.height||.24);d.backHeight=Math.max(.05,+d.backHeight||.12);d.frontInset=Math.max(.02,+d.frontInset||.07);d.grilleInset=Math.max(.008,+d.grilleInset||.018);d.yaw=Number.isFinite(+d.yaw)?+d.yaw:0;d.side=d.side==='right'?'right':'left';return d}
function addDjWedgeMonitor(parent,data,x=0,y=0,z=0,colorHex='#0b0c0f',rotY=0){const d=normaliseDjBoothMonitorData(data);const bodyMat=new THREE.MeshStandardMaterial({color:colorHex,roughness:.90,metalness:.03}),grilleMat=new THREE.MeshStandardMaterial({color:0x171a1f,roughness:.98,metalness:.02}),edgeMat=new THREE.MeshStandardMaterial({color:0x242931,roughness:.70,metalness:.14});const shape=new THREE.Shape();const backZ=-d.depth/2,frontZ=d.depth/2;shape.moveTo(backZ,0);shape.lineTo(frontZ,0);shape.lineTo(frontZ-d.frontInset,d.height);shape.lineTo(backZ,d.backHeight);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:d.width,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-d.width/2,0,0);const body=new THREE.Mesh(geo,bodyMat);body.position.set(x,y,z);body.rotation.y=rotY;body.castShadow=true;body.receiveShadow=true;parent.add(body);const topFront=new THREE.Vector3(0,d.height*0.52,d.depth/2-d.frontInset*0.52),bottomFront=new THREE.Vector3(0,d.height*0.06,d.depth/2-d.frontInset*0.08);const faceHeight=topFront.y-bottomFront.y,faceWidth=d.width*0.82;const faceAngle=Math.atan2(topFront.y-bottomFront.y,topFront.z-bottomFront.z);const grille=new THREE.Mesh(new THREE.PlaneGeometry(faceWidth,Math.max(.05,faceHeight)),grilleMat);grille.position.set(x,y+(topFront.y+bottomFront.y)/2,z+(topFront.z+bottomFront.z)/2+d.grilleInset);grille.rotation.x=-faceAngle+Math.PI/2;grille.rotation.y=rotY;grille.castShadow=true;grille.receiveShadow=true;parent.add(grille);const logo=addAssetBox(parent,Math.max(.03,d.width*.08),Math.max(.01,d.height*.04),Math.max(.006,d.depth*.02),x,y+d.height*.50,z+d.depth*.16,edgeMat);logo.rotation.y=rotY;logo.rotation.x=grille.rotation.x;return {body,grille}}
function addDjDeckUnit(parent,opts={}){const d={width:Math.max(.5,+opts.width||.62),depth:Math.max(.32,+opts.depth||.42),height:Math.max(.04,+opts.height||.062)},x=opts.x||0,y=opts.y||0,z=opts.z||0;const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const chassisMat=new THREE.MeshStandardMaterial({color:0x121418,roughness:.86,metalness:.08}),topMat=new THREE.MeshStandardMaterial({color:0x1a1d22,roughness:.62,metalness:.14}),screenMat=new THREE.MeshStandardMaterial({color:0x151e2f,roughness:.18,metalness:.12}),waveMat=new THREE.MeshStandardMaterial({color:0x2a66ff,roughness:.24,metalness:.18}),whiteMat=new THREE.MeshStandardMaterial({color:0xdde3ea,roughness:.36,metalness:.26}),darkMat=new THREE.MeshStandardMaterial({color:0x0a0d11,roughness:.74,metalness:.10}),silverMat=new THREE.MeshStandardMaterial({color:0x858d98,roughness:.34,metalness:.74}),orangeMat=new THREE.MeshStandardMaterial({color:0xc99736,roughness:.38,metalness:.16}),greenMat=new THREE.MeshStandardMaterial({color:0x62cf77,roughness:.38,metalness:.12}),blueMat=new THREE.MeshStandardMaterial({color:0x64b7ff,roughness:.34,metalness:.16}),redMat=new THREE.MeshStandardMaterial({color:0xd2504e,roughness:.42,metalness:.10});addAssetBox(g,d.width,d.height,d.depth,0,d.height/2,0,chassisMat);addAssetBox(g,d.width*.96,.008,d.depth*.94,0,d.height+.004,0,topMat);addAssetBox(g,d.width*.44,.038,d.depth*.18,0,d.height+.024,-d.depth*.30,topMat);addAssetBox(g,d.width*.39,.003,d.depth*.14,0,d.height+.044,-d.depth*.30,screenMat);addAssetBox(g,d.width*.30,.001,d.depth*.045,0,d.height+.046,-d.depth*.30,waveMat);for(let i=0;i<6;i++){const px=-d.width*.24+i*(d.width*.095);addAssetBox(g,d.width*.055,.004,d.depth*.022,px,d.height+.023,-d.depth*.18,i<4?blueMat:whiteMat)}const platterOuter=new THREE.Mesh(new THREE.CylinderGeometry(d.width*.22,d.width*.22,.016,30),silverMat);platterOuter.position.set(0,d.height+.010,d.depth*.12);platterOuter.castShadow=true;platterOuter.receiveShadow=true;g.add(platterOuter);const platterInner=new THREE.Mesh(new THREE.CylinderGeometry(d.width*.18,d.width*.18,.010,30),darkMat);platterInner.position.set(0,d.height+.019,d.depth*.12);platterInner.castShadow=true;platterInner.receiveShadow=true;g.add(platterInner);const platterCap=new THREE.Mesh(new THREE.CylinderGeometry(d.width*.06,d.width*.06,.012,22),redMat);platterCap.position.set(0,d.height+.024,d.depth*.12);platterCap.castShadow=true;platterCap.receiveShadow=true;g.add(platterCap);addAssetBox(g,d.width*.03,.004,d.depth*.42,d.width*.36,d.height+.009,d.depth*.02,darkMat);addAssetBox(g,d.width*.012,.006,d.depth*.12,d.width*.36,d.height+.012,d.depth*.08,silverMat);const btn=function(px,pz,mat,w=.04,h=.014,dep=.022){const b=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,h,18),mat);b.position.set(px,d.height+h/2,pz);b.castShadow=true;b.receiveShadow=true;g.add(b)};btn(-d.width*.28,d.depth*.36,orangeMat,.05,.014,.05);btn(-d.width*.28,d.depth*.25,greenMat,.05,.014,.05);btn(d.width*.25,d.depth*.26,blueMat,.035,.012,.035);btn(d.width*.18,d.depth*.29,whiteMat,.03,.012,.03);for(let i=0;i<3;i++){const knob=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.016,16),silverMat);knob.position.set(-d.width*.30+i*.055,d.height+.011,d.depth*.02);knob.castShadow=true;knob.receiveShadow=true;g.add(knob)}return g}
function addDjMixerUnit(parent,opts={}){const d={width:Math.max(.32,+opts.width||.40),depth:Math.max(.34,+opts.depth||.42),height:Math.max(.05,+opts.height||.07)},x=opts.x||0,y=opts.y||0,z=opts.z||0;const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const chassisMat=new THREE.MeshStandardMaterial({color:0x121418,roughness:.84,metalness:.08}),topMat=new THREE.MeshStandardMaterial({color:0x171a1f,roughness:.56,metalness:.14}),silverMat=new THREE.MeshStandardMaterial({color:0xc5ccd3,roughness:.30,metalness:.76}),darkMat=new THREE.MeshStandardMaterial({color:0x090b0f,roughness:.78,metalness:.08}),blueMat=new THREE.MeshStandardMaterial({color:0x66b7ff,roughness:.34,metalness:.18}),orangeMat=new THREE.MeshStandardMaterial({color:0xd59a3e,roughness:.34,metalness:.14}),greenMat=new THREE.MeshStandardMaterial({color:0x61cf77,roughness:.36,metalness:.12}),redMat=new THREE.MeshStandardMaterial({color:0xd2504e,roughness:.38,metalness:.10});addAssetBox(g,d.width,d.height,d.depth,0,d.height/2,0,chassisMat);addAssetBox(g,d.width*.96,.008,d.depth*.94,0,d.height+.004,0,topMat);const channelXs=[-d.width*.27,-d.width*.09,d.width*.09,d.width*.27];channelXs.forEach((px,idx)=>{for(let row=0;row<4;row++){const knob=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.014,16),silverMat);knob.position.set(px,d.height+.010,-d.depth*.23+row*.08);knob.castShadow=true;knob.receiveShadow=true;g.add(knob)}addAssetBox(g,.012,.03,.15,px,d.height+.015,d.depth*.18,darkMat);addAssetBox(g,.020,.010,.040,px,d.height+.030,d.depth*.22, idx<3?orangeMat:greenMat)});for(let i=0;i<12;i++){const mat=i<4?greenMat:(i<8?orangeMat:redMat);addAssetBox(g,.014,.008,.010,d.width*.42,d.height+.020,-d.depth*.22+i*.032,mat)}addAssetBox(g,d.width*.16,.006,.032,0,d.height+.012,d.depth*.35,silverMat);addAssetBox(g,d.width*.10,.010,.05,-d.width*.34,d.height+.018,d.depth*.33,blueMat);addAssetBox(g,d.width*.10,.010,.05,d.width*.34,d.height+.018,d.depth*.33,blueMat);return g}

function rebuildDjBoothObject(g){if(!isDjBoothRoot(g))return;const d=normaliseDjBoothData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const bodyMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x0b0c0f,roughness:.92,metalness:.03}),topMat=new THREE.MeshStandardMaterial({color:0x16181c,roughness:.58,metalness:.10}),railMat=new THREE.MeshStandardMaterial({color:0x272d34,roughness:.76,metalness:.24}),legMat=new THREE.MeshStandardMaterial({color:0xa7adb5,roughness:.46,metalness:.68}),lipMat=new THREE.MeshStandardMaterial({color:0xd6d9df,roughness:.42,metalness:.22}),panelMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x0b0c0f,roughness:.88,metalness:.04});
  const tableWidth=d.width,tableDepth=d.depth,topT=d.topThickness,topY=d.height+topT/2;
  addAssetBox(g,tableWidth,topT,tableDepth,0,topY,0,topMat);
  addAssetBox(g,tableWidth+.02,d.frontLipHeight,Math.max(.015,tableDepth*.06),0,d.height+.004,tableDepth/2+.003,lipMat);
  const legXs=[-tableWidth/2+d.legInsetX,-tableWidth*.18,tableWidth*.18,tableWidth/2-d.legInsetX],legZFront=tableDepth/2-d.legInsetZ,legZRear=-tableDepth/2+d.legInsetZ;
  [legXs[0],legXs[3]].forEach(x=>addAssetBox(g,d.legWidth,d.height,d.legDepth,x,d.height/2,legZFront,legMat));
  [legXs[1],legXs[2]].forEach(x=>addAssetBox(g,d.legWidth,d.height*.94,d.legDepth,x,d.height*.47,legZRear,legMat));
  const boardH=Math.max(.18,d.backRailHeight),boardBaseY=d.height+.02,boardCenterY=boardBaseY+boardH/2,boardZ=-tableDepth/2+d.backRailInset;
  const privacyPanelH=Math.max(.20,d.height),privacyPanelY=privacyPanelH/2,privacyPanelZ=boardZ+d.backRailDepth*.18;
  addAssetBox(g,tableWidth-.02,privacyPanelH,Math.max(.018,d.backRailDepth*.72),0,privacyPanelY,privacyPanelZ,panelMat);
  addAssetBox(g,tableWidth+.02,d.backRailFrame,d.backRailDepth,0,boardBaseY+d.backRailFrame/2,boardZ,railMat);
  addAssetBox(g,tableWidth+.02,d.backRailFrame,d.backRailDepth,0,boardBaseY+boardH-d.backRailFrame/2,boardZ,railMat);
  addAssetBox(g,d.backRailFrame,boardH,d.backRailDepth,-tableWidth/2+d.backRailFrame/2,boardCenterY,boardZ,railMat);
  addAssetBox(g,d.backRailFrame,boardH,d.backRailDepth,tableWidth/2-d.backRailFrame/2,boardCenterY,boardZ,railMat);
  const postCount=Math.max(10,Math.round(tableWidth/.22));for(let i=0;i<postCount;i++){const x=-tableWidth/2+d.backRailFrame+(i/(postCount-1))*Math.max(.01,tableWidth-d.backRailFrame*2);addAssetBox(g,.012,boardH-d.backRailFrame*2,d.backRailDepth*.70,x,boardCenterY,boardZ,railMat)}
  const rowY=boardBaseY+boardH*.48;addAssetBox(g,tableWidth-d.backRailFrame*2,.012,d.backRailDepth*.65,0,rowY,boardZ,railMat);
  const surfaceY=d.height+topT+.002,deckW=Math.min(.62,Math.max(.56,tableWidth*.155)),deckD=Math.min(.42,Math.max(.36,tableDepth*.35)),mixerW=Math.min(.40,Math.max(.36,tableWidth*.105)),mixerD=Math.min(.42,Math.max(.38,tableDepth*.36)),gap=.05,totalRigW=deckW*4+mixerW+gap*4,startX=-totalRigW/2+deckW/2,deck1X=startX,deck2X=deck1X+deckW+gap,mixerX=deck2X+deckW/2+mixerW/2+gap,deck3X=mixerX+mixerW/2+deckW/2+gap,deck4X=deck3X+deckW+gap,gearZ=0;
  addDjDeckUnit(g,{x:deck1X,y:surfaceY,z:gearZ,width:deckW,depth:deckD,height:.062});
  addDjDeckUnit(g,{x:deck2X,y:surfaceY,z:gearZ,width:deckW,depth:deckD,height:.062});
  addDjMixerUnit(g,{x:mixerX,y:surfaceY,z:gearZ,width:mixerW,depth:mixerD,height:.072});
  addDjDeckUnit(g,{x:deck3X,y:surfaceY,z:gearZ,width:deckW,depth:deckD,height:.062});
  addDjDeckUnit(g,{x:deck4X,y:surfaceY,z:gearZ,width:deckW,depth:deckD,height:.062});
  g.updateMatrixWorld(true)
}
function rebuildDjBoothSideTableObject(g){if(!isDjBoothSideTableRoot(g)&&!(g.userData&&g.userData.assetData&&g.userData.assetData.kind==='djBoothSideSpeaker'))return;const raw=g.userData.assetData&&g.userData.assetData.kind==='djBoothSideSpeaker'?{width:g.userData.assetData.width,depth:g.userData.assetData.depth,height:g.userData.assetData.height,side:g.userData.assetData.side}:g.userData.assetData;const d=normaliseDjBoothSideTableData(raw);g.userData.assetData=d;clearGroupChildren(g);const bodyMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x0b0c0f,roughness:.90,metalness:.03});addAssetBox(g,d.width,d.height,d.depth,0,d.height/2,0,bodyMat);g.updateMatrixWorld(true)}
function rebuildDjBoothMonitorObject(g){if(!isDjBoothMonitorRoot(g))return;const d=normaliseDjBoothMonitorData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);addDjWedgeMonitor(g,d,0,0,0,g.userData.colorOverride||'#0b0c0f',THREE.MathUtils.degToRad(d.yaw));g.updateMatrixWorld(true)}
function createDjBoothObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseDjBoothData({width:opts.width,depth:opts.depth,height:opts.height,topThickness:opts.topThickness,legWidth:opts.legWidth,legDepth:opts.legDepth,legInsetX:opts.legInsetX,legInsetZ:opts.legInsetZ,backRailHeight:opts.backRailHeight,backRailDepth:opts.backRailDepth,backRailInset:opts.backRailInset,backRailFrame:opts.backRailFrame,frontBoardThickness:opts.frontBoardThickness,frontBoardBottom:opts.frontBoardBottom});g.userData.colorOverride=opts.color||'#0c0d10';venue.add(g);registerBuilderRoot(g,opts.name||'DJ Booth Table','fixtureAsset',opts.id);rebuildDjBoothObject(g);return g}
function createDjBoothSideTableObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseDjBoothSideTableData({width:opts.width,depth:opts.depth,height:opts.height,side:opts.side});g.userData.colorOverride=opts.color||'#0c0d10';venue.add(g);registerBuilderRoot(g,opts.name||((opts.side==='right'?'Right':'Left')+' DJ Side Table'),'fixtureAsset',opts.id);rebuildDjBoothSideTableObject(g);return g}
function createDjBoothMonitorObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseDjBoothMonitorData({width:opts.width,depth:opts.depth,height:opts.height,backHeight:opts.backHeight,frontInset:opts.frontInset,grilleInset:opts.grilleInset,yaw:opts.yaw,side:opts.side});g.userData.colorOverride=opts.color||'#0c0d10';venue.add(g);registerBuilderRoot(g,opts.name||((opts.side==='right'?'Right':'Left')+' DJ Monitor'),'fixtureAsset',opts.id);rebuildDjBoothMonitorObject(g);return g}
function createDjBoothSideSpeakerObject(opts={}){return createDjBoothSideTableObject(opts)}
function createDjBoothSet(opts={}){const x=opts.x??target.x,y=opts.y??mainFloorLevel(),z=opts.z??target.z,table=createDjBoothObject({name:'DJ Booth Table',x,y,z,width:opts.width||3.72,depth:opts.depth||1.18,height:opts.height||1.00,color:opts.color||'#0c0d10'}),d=normaliseDjBoothData(table.userData.assetData),sideW=.60,sideD=.60,sideH=.86,gap=.08,off=d.width/2+gap+sideW/2,monitorH=.24,leftTable=createDjBoothSideTableObject({name:'DJ Side Table · Left',side:'left',x:x-off,y,z,width:sideW,depth:sideD,height:sideH,color:'#0c0d10'}),rightTable=createDjBoothSideTableObject({name:'DJ Side Table · Right',side:'right',x:x+off,y,z,width:sideW,depth:sideD,height:sideH,color:'#0c0d10'}),leftMonitor=createDjBoothMonitorObject({name:'DJ Monitor · Left',side:'left',x:x-off,y:y+sideH,z,width:.56,depth:.38,height:monitorH,backHeight:.11,yaw:10,color:'#0c0d10'}),rightMonitor=createDjBoothMonitorObject({name:'DJ Monitor · Right',side:'right',x:x+off,y:y+sideH,z,width:.56,depth:.38,height:monitorH,backHeight:.11,yaw:-10,color:'#0c0d10'});return [table,leftTable,rightTable,leftMonitor,rightMonitor]}


function isStagePropRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&['visualLaptop','laptopScreen','guitar','bassGuitar','drumKit','micStand','guitarAmpStack','bassAmpStack','wedgeMonitor'].includes(o.userData.assetData.kind)}
function normaliseStagePropData(raw={}){const d=raw||{};const kind=d.kind||'guitar';d.kind=kind;
  if(kind==='visualLaptop'){d.width=Math.max(.28,+d.width||.44);d.depth=Math.max(.24,+d.depth||.32);d.height=Math.max(.70,+d.height||1.08);d.screenTiltDeg=Number.isFinite(+d.screenTiltDeg)?Math.max(85,Math.min(125,+d.screenTiltDeg)):108}
  else if(kind==='laptopScreen'){d.width=Math.max(.24,+d.width||.38);d.depth=Math.max(.16,+d.depth||.24);d.height=Math.max(.05,+d.height||.22);d.screenTiltDeg=Number.isFinite(+d.screenTiltDeg)?Math.max(95,Math.min(130,+d.screenTiltDeg)):106}
  else if(kind==='guitar'){d.width=Math.max(.18,+d.width||.38);d.depth=Math.max(.06,+d.depth||.12);d.height=Math.max(.70,+d.height||1.14)}
  else if(kind==='bassGuitar'){d.width=Math.max(.18,+d.width||.34);d.depth=Math.max(.06,+d.depth||.12);d.height=Math.max(.80,+d.height||1.24)}
  else if(kind==='drumKit'){d.width=Math.max(.75,+d.width||1.42);d.depth=Math.max(.65,+d.depth||1.02);d.height=Math.max(.45,+d.height||1.02)}
  else if(kind==='micStand'){d.width=Math.max(.22,+d.width||.46);d.depth=Math.max(.18,+d.depth||.34);d.height=Math.max(.90,+d.height||1.55);d.boomAngleDeg=Number.isFinite(+d.boomAngleDeg)?Math.max(8,Math.min(38,+d.boomAngleDeg)):18}
  else if(kind==='guitarAmpStack'){d.width=Math.max(.42,+d.width||.72);d.depth=Math.max(.24,+d.depth||.38);d.height=Math.max(.52,+d.height||.90)}
  else if(kind==='bassAmpStack'){d.width=Math.max(.48,+d.width||.76);d.depth=Math.max(.28,+d.depth||.44);d.height=Math.max(.72,+d.height||1.24)}
  else if(kind==='wedgeMonitor'){d.width=Math.max(.38,+d.width||.62);d.depth=Math.max(.32,+d.depth||.52);d.height=Math.max(.16,+d.height||.32)}
  return d}

function instrumentBodyShape(w,h,isBass=false){const s=new THREE.Shape();
  if(isBass){
    s.moveTo(0,-h*.50);s.bezierCurveTo(-w*.32,-h*.50,-w*.48,-h*.34,-w*.49,-h*.12);s.bezierCurveTo(-w*.50,h*.06,-w*.35,h*.12,-w*.37,h*.28);s.bezierCurveTo(-w*.40,h*.40,-w*.28,h*.47,-w*.12,h*.49);s.bezierCurveTo(-w*.05,h*.43,-w*.04,h*.34,0,h*.31);s.bezierCurveTo(w*.07,h*.35,w*.12,h*.43,w*.23,h*.42);s.bezierCurveTo(w*.40,h*.39,w*.44,h*.24,w*.34,h*.13);s.bezierCurveTo(w*.27,h*.05,w*.36,-h*.04,w*.42,-h*.17);s.bezierCurveTo(w*.49,-h*.33,w*.34,-h*.49,0,-h*.50)
  }else{
    s.moveTo(0,-h*.50);s.bezierCurveTo(-w*.34,-h*.50,-w*.48,-h*.36,-w*.48,-h*.14);s.bezierCurveTo(-w*.48,h*.03,-w*.34,h*.10,-w*.37,h*.24);s.bezierCurveTo(-w*.40,h*.37,-w*.29,h*.46,-w*.14,h*.48);s.bezierCurveTo(-w*.08,h*.47,-w*.05,h*.39,-w*.05,h*.30);s.bezierCurveTo(-w*.03,h*.27,-w*.01,h*.26,0,h*.26);s.bezierCurveTo(w*.04,h*.26,w*.08,h*.31,w*.09,h*.36);s.bezierCurveTo(w*.12,h*.44,w*.22,h*.45,w*.30,h*.39);s.bezierCurveTo(w*.40,h*.31,w*.38,h*.17,w*.27,h*.10);s.bezierCurveTo(w*.20,h*.05,w*.29,-h*.04,w*.40,-h*.17);s.bezierCurveTo(w*.49,-h*.34,w*.34,-h*.50,0,-h*.50)
  }
  return s
}
function instrumentPickguardShape(w,h,isBass=false){const s=new THREE.Shape();
  if(isBass){s.moveTo(-w*.18,-h*.03);s.lineTo(w*.20,-h*.02);s.lineTo(w*.28,h*.25);s.lineTo(w*.11,h*.34);s.lineTo(-w*.08,h*.31);s.lineTo(-w*.22,h*.15);s.closePath()}
  else{s.moveTo(-w*.16,-h*.08);s.lineTo(w*.22,-h*.05);s.lineTo(w*.28,h*.22);s.lineTo(w*.08,h*.34);s.lineTo(-w*.14,h*.28);s.lineTo(-w*.24,h*.08);s.closePath()}
  return s
}
function addInstrumentBody(g,d,isBass=false){const w=d.width,h=d.height*(isBass ? .33 : .35),depth=d.depth,bodyY=h*.52+.055;
  const edgeMat=new THREE.MeshStandardMaterial({color:isBass?0x5d4b34:0x3b160f,roughness:.54,metalness:.05});
  const faceMat=new THREE.MeshStandardMaterial({color:isBass?0xc5a76d:0x9c351d,roughness:.48,metalness:.05});
  const guardMat=new THREE.MeshStandardMaterial({color:isBass?0x111317:0xf0f1ee,roughness:.52,metalness:.04});
  const fretMat=new THREE.MeshStandardMaterial({color:isBass?0xc9a76d:0x37251f,roughness:.56,metalness:.06});
  const neckBackMat=new THREE.MeshStandardMaterial({color:isBass?0xd2b779:0xb78952,roughness:.52,metalness:.04});
  const metal=new THREE.MeshStandardMaterial({color:0xb7bcc4,roughness:.34,metalness:.72});
  const dark=new THREE.MeshStandardMaterial({color:0x16191d,roughness:.70,metalness:.10});
  const bodyShape=instrumentBodyShape(w,h,isBass),geo=new THREE.ExtrudeGeometry(bodyShape,{depth:depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2});geo.translate(0,bodyY,-depth/2);const outer=new THREE.Mesh(geo,edgeMat);outer.castShadow=true;outer.receiveShadow=true;g.add(outer);
  const faceGeo=new THREE.ShapeGeometry(bodyShape,20),face=new THREE.Mesh(faceGeo,faceMat);face.scale.set(.94,.94,1);face.position.set(0,bodyY,depth/2+.010);face.castShadow=true;g.add(face);
  const pgShape=instrumentPickguardShape(w,h,isBass),pgGeo=new THREE.ShapeGeometry(pgShape,12),pg=new THREE.Mesh(pgGeo,guardMat);pg.position.set(0,bodyY,depth/2+.016);g.add(pg);
  const bodyTop=bodyY+h*.49,headH=d.height*(isBass ? .11 : .10),neckLen=Math.max(.25,d.height-bodyTop-headH-.025),neckW=w*(isBass ? .16 : .15),neckCenter=bodyTop+neckLen/2;
  addAssetBox(g,neckW*1.18,neckLen,depth*.28,0,neckCenter,0,neckBackMat);addAssetBox(g,neckW,neckLen,depth*.11,0,neckCenter,depth*.18,fretMat);
  const fretCount=isBass?13:14;for(let i=1;i<fretCount;i++){const yy=bodyTop+(i/fretCount)*neckLen;addAssetBox(g,neckW*.96,.006,.007,0,yy,depth*.25,metal)}
  const headW=w*(isBass ? .24 : .20),headY=bodyTop+neckLen+headH/2;const headShape=new THREE.Shape();headShape.moveTo(-headW*.28,-headH*.50);headShape.lineTo(headW*.14,-headH*.50);headShape.bezierCurveTo(headW*.42,-headH*.38,headW*.48,headH*.20,headW*.22,headH*.50);headShape.lineTo(-headW*.14,headH*.43);headShape.lineTo(-headW*.30,headH*.15);headShape.closePath();const headGeo=new THREE.ExtrudeGeometry(headShape,{depth:depth*.26,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:1});headGeo.translate(0,headY,-depth*.13);const head=new THREE.Mesh(headGeo,neckBackMat);head.castShadow=true;g.add(head);
  const stringCount=isBass?4:6,stringSpan=neckW*.62;for(let i=0;i<stringCount;i++){const x=stringCount===1?0:-stringSpan/2+(i/(stringCount-1))*stringSpan;addAssetBox(g,.0028,d.height*.68,.003,x,bodyY+h*.07+d.height*.34,depth*.285,metal)}
  const pickupCount=isBass?2:3;for(let i=0;i<pickupCount;i++){const yy=bodyY+(isBass?-.02:.01)+i*h*.105;addAssetBox(g,w*(isBass ? .22 : .20),.024,.012,0,yy,depth*.29,isBass?dark:metal)}
  addAssetBox(g,w*.26,.026,.014,0,bodyY-h*.20,depth*.29,metal);
  const knobCount=isBass?3:3;for(let i=0;i<knobCount;i++){const k=cyl(w*.022,.012,w*.22+i*w*.055,bodyY-h*.05-i*h*.055,depth*.30,isBass?metal:guardMat,g,12);k.rotation.x=Math.PI/2}
  // tuning pegs
  const pegCount=isBass?4:6;for(let i=0;i<pegCount;i++){const side=isBass?-1:(i<3?-1:1),idx=isBass?i:(i%3),py=headY-headH*.28+idx*headH*.23,px=side*headW*.34;const peg=cyl(.010,.018,px,py,0,metal,g,10);peg.rotation.z=Math.PI/2}
  return {bodyY,bodyTop,neckLen,headY}
}
function addRefinedMicStand(g,d){const black=new THREE.MeshStandardMaterial({color:0x111317,roughness:.72,metalness:.22}),metal=new THREE.MeshStandardMaterial({color:0x7c838d,roughness:.38,metalness:.72}),grille=new THREE.MeshStandardMaterial({color:0xadb2b8,roughness:.64,metalness:.54}),cableMat=new THREE.MeshStandardMaterial({color:0x1d5b3a,roughness:.72,metalness:.02});
  const baseR=Math.max(.11,d.width*.27),poleH=d.height*.88;cyl(baseR,.045,0,.022,0,black,g,28);cyl(baseR*.74,.018,0,.052,0,black,g,28);cyl(.010,poleH,0,.05+poleH/2,0,black,g,12);cyl(.018,.12,0,d.height*.57,0,black,g,12);cyl(.014,.05,0,d.height*.89,0,metal,g,12);
  const clipA=new THREE.Vector3(0,d.height*.90,0),clipB=new THREE.Vector3(.055,d.height*.94,-.012);addCylinderBetween(g,clipA,clipB,.010,black,12);
  const micA=new THREE.Vector3(.045,d.height*.94,-.012),micB=new THREE.Vector3(.19,d.height*.985,-.038);addCylinderBetween(g,micA,micB,.018,black,16);const dir=micB.clone().sub(micA).normalize(),headCenter=micB.clone().add(dir.clone().multiplyScalar(.025));const micHead=new THREE.Mesh(new THREE.SphereGeometry(.030,16,12),grille);micHead.scale.set(1.15,.86,.86);micHead.position.copy(headCenter);micHead.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),dir);g.add(micHead);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.045,d.height*.93,-.010),new THREE.Vector3(.010,d.height*.80,.018),new THREE.Vector3(.008,d.height*.46,.022),new THREE.Vector3(.006,d.height*.12,.024),new THREE.Vector3(-.04,.035,.045),new THREE.Vector3(-d.width*.40,.018,d.depth*.22)]);const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,34,.004,7,false),cableMat);tube.castShadow=true;g.add(tube)
}

function rebuildStagePropObject(g){if(!isStagePropRoot(g))return;const d=normaliseStagePropData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);
  const blackMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x0f1115,roughness:.84,metalness:.07}),darkMat=new THREE.MeshStandardMaterial({color:0x20252c,roughness:.78,metalness:.10}),metalMat=new THREE.MeshStandardMaterial({color:0xa4aab3,roughness:.36,metalness:.74}),screenMat=new THREE.MeshStandardMaterial({color:0x1a1f24,roughness:.30,metalness:.10}),cymbalMat=new THREE.MeshStandardMaterial({color:0xc8b27a,roughness:.36,metalness:.72}),skinMat=new THREE.MeshStandardMaterial({color:0xd8dde4,roughness:.92,metalness:.02});
  if(d.kind==='visualLaptop'){
    const baseR=Math.max(.12,Math.min(d.width,d.depth)*.36),standH=d.height*.78,trayY=standH;
    cyl(baseR,.03,0,.015,0,blackMat,g,22); cyl(.028,standH,0,standH/2,0,metalMat,g,14); addAssetBox(g,d.width*.82,.026,d.depth*.78,0,trayY,0,darkMat);
    const laptopGroup=new THREE.Group(); laptopGroup.position.set(0,trayY+.018,0); g.add(laptopGroup);
    addAssetBox(laptopGroup,d.width*.56,.018,d.depth*.48,0,0.009,0,blackMat);
    const screen=new THREE.Mesh(new THREE.BoxGeometry(d.width*.56,d.height*.16,.018),blackMat); screen.position.set(0,d.height*.08,-d.depth*.12); screen.rotation.x=THREE.MathUtils.degToRad(-(180-d.screenTiltDeg)); laptopGroup.add(screen);
    const inner=new THREE.Mesh(new THREE.BoxGeometry(d.width*.50,d.height*.12,.006),screenMat); inner.position.set(0,0,.010); screen.add(inner);
    addAssetBox(laptopGroup,d.width*.12,.006,d.depth*.08,0,.015,d.depth*.10,metalMat)
  } else if(d.kind==='laptopScreen'){
    addAssetBox(g,d.width*.62,.016,d.depth*.56,0,.008,0,blackMat);
    const hinge=addAssetBox(g,d.width*.24,.010,.018,0,.020,-d.depth*.13,metalMat);
    const screen=new THREE.Mesh(new THREE.BoxGeometry(d.width*.58,d.height,.018),blackMat); screen.position.set(0,d.height*.50+0.02,-d.depth*.12); screen.rotation.x=THREE.MathUtils.degToRad(-(180-d.screenTiltDeg)); g.add(screen);
    const inner=new THREE.Mesh(new THREE.BoxGeometry(d.width*.52,d.height*.82,.006),screenMat); inner.position.set(0,0,.010); screen.add(inner);
    addAssetBox(g,d.width*.16,.004,d.depth*.10,0,.018,d.depth*.10,metalMat)
  } else if(d.kind==='guitar' || d.kind==='bassGuitar'){
    addInstrumentBody(g,d,d.kind==='bassGuitar')
  } else if(d.kind==='drumKit'){
    const shellHex=(g.userData.colorOverride && String(g.userData.colorOverride).trim()) || '#6b1836';
    if(!g.userData.colorOverride || /^#?15181d$/i.test(String(g.userData.colorOverride).replace(/\s+/g,'')))g.userData.colorOverride='#6b1836';
    const shellMat=new THREE.MeshStandardMaterial({color:shellHex,roughness:.48,metalness:.18});
    const shellDarkMat=new THREE.MeshStandardMaterial({color:new THREE.Color(shellHex).clone().multiplyScalar(.72),roughness:.56,metalness:.16});
    const hoopMat=new THREE.MeshStandardMaterial({color:0xebedf1,roughness:.42,metalness:.82});
    const lugMat=new THREE.MeshStandardMaterial({color:0xd5d9df,roughness:.34,metalness:.9});
    const rubberMat=new THREE.MeshStandardMaterial({color:0x9b6a3a,roughness:.88,metalness:.06});
    const headFrontMat=new THREE.MeshStandardMaterial({color:0xd8dbd9,roughness:.9,metalness:.02});
    const headWarmMat=new THREE.MeshStandardMaterial({color:0xf4ebd2,roughness:.92,metalness:.02});
    const cymWarmMat=new THREE.MeshStandardMaterial({color:0xd8c18d,roughness:.6,metalness:.38});
    const cymDarkMat=new THREE.MeshStandardMaterial({color:0x6f6455,roughness:.7,metalness:.24});
    const drum=(r,h,x,y,z,mat=headWarmMat,headMat=headWarmMat)=>{
      const shell=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28),mat); shell.position.set(x,y,z); g.add(shell);
      const ring1=new THREE.Mesh(new THREE.TorusGeometry(r*.98,h*.07,10,28),hoopMat); ring1.rotation.x=Math.PI/2; ring1.position.set(x,y+h*.5,z); g.add(ring1);
      const ring2=ring1.clone(); ring2.position.y=y-h*.5; g.add(ring2);
      const head1=new THREE.Mesh(new THREE.CylinderGeometry(r*.94,r*.94,.014,26),headMat); head1.position.set(x,y+h*.5+.003,z); g.add(head1);
      const head2=head1.clone(); head2.position.y=y-h*.5-.003; g.add(head2);
      for(let i=0;i<6;i++){
        const a=(Math.PI*2/6)*i;
        const lug=new THREE.Mesh(new THREE.CylinderGeometry(r*.06,r*.06,h*.34,10),lugMat);
        lug.rotation.z=Math.PI/2;
        lug.position.set(x+Math.cos(a)*r*.9,y,z+Math.sin(a)*r*.9);
        g.add(lug);
      }
      return shell;
    };
    const standLeg=(x1,y1,z1,x2,y2,z2,r=.011)=>{
      const dir=new THREE.Vector3(x2-x1,y2-y1,z2-z1),len=dir.length();
      const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,9),metalMat);
      const mid=new THREE.Vector3((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
      m.position.copy(mid); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()); g.add(m);
      const foot=new THREE.Mesh(new THREE.CylinderGeometry(r*1.7,r*1.7,r*5,8),rubberMat); foot.position.set(x2,y2,z2); foot.rotation.z=Math.PI/2; g.add(foot);
    };
    const cymbal=(x,y,z,r,tilt=.08,mat=cymWarmMat)=>{
      const cym=new THREE.Mesh(new THREE.CylinderGeometry(r*.6,r,.012,28),mat);
      cym.position.set(x,y,z); cym.rotation.x=tilt; g.add(cym);
      return cym;
    };
    // kick
    const kickR=d.width*.19, kickL=d.depth*.42, kickY=d.height*.22;
    const kickShell=new THREE.Mesh(new THREE.CylinderGeometry(kickR,kickR,kickL,32),shellMat); kickShell.rotation.z=Math.PI/2; kickShell.position.set(0,kickY,0); g.add(kickShell);
    const kickHoopF=new THREE.Mesh(new THREE.TorusGeometry(kickR*.99,kickL*.035,10,30),hoopMat); kickHoopF.rotation.y=Math.PI/2; kickHoopF.position.set(kickL*.5+.001,kickY,0); g.add(kickHoopF);
    const kickHoopB=kickHoopF.clone(); kickHoopB.position.x=-kickL*.5-.001; g.add(kickHoopB);
    const kickHeadF=new THREE.Mesh(new THREE.CylinderGeometry(kickR*.93,kickR*.93,.014,28),headFrontMat); kickHeadF.rotation.z=Math.PI/2; kickHeadF.position.set(kickL*.5+.004,kickY,0); g.add(kickHeadF);
    const kickHeadB=new THREE.Mesh(new THREE.CylinderGeometry(kickR*.93,kickR*.93,.014,28),headWarmMat); kickHeadB.rotation.z=Math.PI/2; kickHeadB.position.set(-kickL*.5-.004,kickY,0); g.add(kickHeadB);
    for(let i=0;i<8;i++){ const a=(Math.PI*2/8)*i; const lug=new THREE.Mesh(new THREE.CylinderGeometry(kickR*.05,kickR*.05,kickL*.14,10),lugMat); lug.rotation.z=Math.PI/2; lug.position.set(0,kickY+Math.sin(a)*kickR*.84,Math.cos(a)*kickR*.84); g.add(lug); }
    standLeg(-kickL*.18,kickY-kickR*.52,-kickR*.34,-kickL*.34,0.01,-kickR*.82,.012);
    standLeg(-kickL*.18,kickY-kickR*.52,kickR*.34,-kickL*.34,0.01,kickR*.82,.012);
    // snare + toms
    drum(d.width*.115,d.height*.12,-d.width*.19,d.height*.38,d.depth*.12,shellMat,headWarmMat);
    drum(d.width*.13,d.height*.18,d.width*.20,d.height*.36,d.depth*.10,shellMat,headWarmMat);
    drum(d.width*.105,d.height*.14,-d.width*.06,d.height*.55,-d.depth*.09,shellMat,headWarmMat);
    drum(d.width*.105,d.height*.14,d.width*.12,d.height*.57,-d.depth*.06,shellMat,headWarmMat);
    // tom mount / snare stand
    standLeg(0,kickY+kickR*.55,-d.depth*.02,0,d.height*.50,-d.depth*.02,.013);
    standLeg(-d.width*.19,d.height*.26,d.depth*.12,-d.width*.30,0.01,d.depth*.22,.010);
    standLeg(-d.width*.19,d.height*.26,d.depth*.12,-d.width*.12,0.01,d.depth*.30,.010);
    standLeg(-d.width*.19,d.height*.26,d.depth*.12,-d.width*.06,0.01,d.depth*.05,.010);
    standLeg(d.width*.20,d.height*.22,d.depth*.10,d.width*.08,0.01,d.depth*.20,.011);
    standLeg(d.width*.20,d.height*.22,d.depth*.10,d.width*.34,0.01,d.depth*.24,.011);
    standLeg(d.width*.20,d.height*.22,d.depth*.10,d.width*.25,0.01,-d.depth*.02,.011);
    // cymbal stands + cymbals
    const lcx=-d.width*.40,lcz=-d.depth*.22,lcy=.63;
    standLeg(lcx,lcy*.32,lcz,lcx-.10,0.01,lcz-.08,.011); standLeg(lcx,lcy*.32,lcz,lcx+.03,0.01,lcz+.10,.011); standLeg(lcx,lcy*.32,lcz,lcx+.10,0.01,lcz-.02,.011);
    cyl(.010,lcy*.62,lcx,lcy*.31,lcz,metalMat,g,10); cymbal(lcx,lcy,lcz,d.width*.16,.24,cymDarkMat);
    const rcx=d.width*.40,rcz=-d.depth*.08,rcy=.56;
    standLeg(rcx,rcy*.34,rcz,rcx-.10,0.01,rcz+.06,.011); standLeg(rcx,rcy*.34,rcz,rcx+.10,0.01,rcz+.02,.011); standLeg(rcx,rcy*.34,rcz,rcx+.02,0.01,rcz-.11,.011);
    cyl(.010,rcy*.64,rcx,rcy*.32,rcz,metalMat,g,10); cymbal(rcx,rcy,rcz,d.width*.13,.08,cymWarmMat);
    const rideX=d.width*.08,rideZ=-d.depth*.33,rideY=.76;
    standLeg(rideX,rideY*.34,rideZ,rideX-.08,0.01,rideZ+.08,.011); standLeg(rideX,rideY*.34,rideZ,rideX+.11,0.01,rideZ+.02,.011); standLeg(rideX,rideY*.34,rideZ,rideX+.01,0.01,rideZ-.10,.011);
    cyl(.010,rideY*.68,rideX,rideY*.34,rideZ,metalMat,g,10); cymbal(rideX,rideY,rideZ,d.width*.15,.10,cymWarmMat);
    // subtle stool behind the kit
    const stoolTop=new THREE.Mesh(new THREE.CylinderGeometry(d.width*.07,d.width*.075,.03,18),shellDarkMat); stoolTop.position.set(0,.28,d.depth*.30); g.add(stoolTop);
    standLeg(0,.27,d.depth*.30,-.05,0.01,d.depth*.25,.009); standLeg(0,.27,d.depth*.30,.06,0.01,d.depth*.25,.009); standLeg(0,.27,d.depth*.30,0,0.01,d.depth*.38,.009);
  } else if(d.kind==='guitarAmpStack' || d.kind==='bassAmpStack'){
    const bass=d.kind==='bassAmpStack';
    const cabMat=new THREE.MeshStandardMaterial({color:0x090a0c,roughness:.88,metalness:.06});
    const edgeMat=new THREE.MeshStandardMaterial({color:0x181a1e,roughness:.72,metalness:.12});
    const grilleMat=new THREE.MeshStandardMaterial({color:bass?0x202226:0x2b2925,roughness:.96,metalness:.03});
    const headMat=new THREE.MeshStandardMaterial({color:bass?0x0d0f12:0x171514,roughness:.68,metalness:.14});
    const panelMat=new THREE.MeshStandardMaterial({color:bass?0xb8bcc1:0xb38b49,roughness:.46,metalness:.48});
    const silverMat=new THREE.MeshStandardMaterial({color:0xc7ccd2,roughness:.32,metalness:.78});
    const speakerMat=new THREE.MeshStandardMaterial({color:0x07080a,roughness:.92,metalness:.02});
    const cabH=d.height*(bass?.82:.70),headH=Math.max(.13,d.height*(bass?.15:.22)),gap=d.height*.025;
    addAssetBox(g,d.width,cabH,d.depth,0,cabH/2,0,cabMat);
    addAssetBox(g,d.width*.94,cabH*.90,.018,0,cabH*.50,d.depth/2+.010,grilleMat);
    const cols=2,rows=bass?4:2;
    const spR=Math.min(d.width/(cols*2.65),cabH/(rows*2.5));
    for(let row=0;row<rows;row++){
      for(let col=0;col<cols;col++){
        const x=(col?1:-1)*d.width*.225;
        const y=cabH*((rows-row)-.5)/(rows+0.55);
        const sp=new THREE.Mesh(new THREE.CylinderGeometry(spR,spR,.014,24),speakerMat);
        sp.rotation.x=Math.PI/2;sp.position.set(x,y,d.depth/2+.024);g.add(sp);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(spR*.82,spR*.055,8,22),edgeMat);
        ring.position.copy(sp.position);ring.rotation.x=Math.PI/2;ring.position.z+=.009;g.add(ring);
      }
    }
    // Cabinet corner protectors / feet
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
      addAssetBox(g,d.width*.045,cabH*.055,.035,sx*d.width*.465,sy<0?cabH*.035:cabH*.965,d.depth/2+.015,edgeMat)
    });
    addAssetBox(g,d.width*.94,headH,d.depth*.82,0,cabH+gap+headH/2,-d.depth*.025,headMat);
    addAssetBox(g,d.width*.86,headH*.56,.018,0,cabH+gap+headH*.50,d.depth*.39+0.012,panelMat);
    const knobCount=bass?7:6;
    for(let i=0;i<knobCount;i++){
      const x=-d.width*.31+(i/(knobCount-1))*d.width*.62;
      const knob=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.017,10),speakerMat);
      knob.rotation.x=Math.PI/2;knob.position.set(x,cabH+gap+headH*.50,d.depth*.39+.027);g.add(knob)
    }
    // Handle + small badge
    addAssetBox(g,d.width*.25,.018,.035,0,cabH+gap+headH+.012,-d.depth*.08,silverMat);
    addAssetBox(g,d.width*.16,headH*.16,.008,bass?d.width*.27:-d.width*.27,cabH+gap+headH*.51,d.depth*.39+.035,silverMat);
    // Rubber feet
    addAssetBox(g,d.width*.09,.025,d.depth*.10,-d.width*.34,.012,-d.depth*.31,edgeMat);
    addAssetBox(g,d.width*.09,.025,d.depth*.10,d.width*.34,.012,-d.depth*.31,edgeMat)
  } else if(d.kind==='wedgeMonitor'){
    const bodyMat=new THREE.MeshStandardMaterial({color:0x0a0b0e,roughness:.86,metalness:.07});
    const edgeMat=new THREE.MeshStandardMaterial({color:0x22262c,roughness:.68,metalness:.18});
    const grilleMat=new THREE.MeshStandardMaterial({color:0x15181c,roughness:.96,metalness:.04});
    const speakerMat=new THREE.MeshStandardMaterial({color:0x050608,roughness:.94,metalness:.01});
    const backH=d.height,frontH=d.height*.22,backZ=-d.depth/2,frontZ=d.depth/2;
    const sh=new THREE.Shape();sh.moveTo(backZ,0);sh.lineTo(frontZ,0);sh.lineTo(frontZ,frontH);sh.lineTo(backZ,backH);sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:d.width,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(-d.width/2,0,0);
    const body=new THREE.Mesh(geo,bodyMat);body.castShadow=true;body.receiveShadow=true;g.add(body);
    const ang=Math.atan2(backH-frontH,d.depth),midY=(backH+frontH)/2;
    const grille=addAssetBox(g,d.width*.88,.020,d.depth*.78,0,midY+.012,0,grilleMat);grille.rotation.x=ang;
    const wooferR=Math.min(d.width,d.depth)*.23;
    const woofer=new THREE.Mesh(new THREE.CylinderGeometry(wooferR,wooferR,.018,28),speakerMat);
    woofer.rotation.x=ang;woofer.position.set(0,midY+.035,0);g.add(woofer);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(wooferR*.88,wooferR*.055,8,24),edgeMat);
    ring.rotation.x=ang;ring.position.set(0,midY+.050,0);g.add(ring);
    const tweeter=new THREE.Mesh(new THREE.CylinderGeometry(wooferR*.28,wooferR*.28,.016,18),speakerMat);
    tweeter.rotation.x=ang;tweeter.position.set(0,midY+.046,-d.depth*.25);g.add(tweeter);
    // Side handles and rubber feet.
    addAssetBox(g,.022,d.height*.22,d.depth*.22,-d.width*.50-.006,d.height*.42,-d.depth*.08,edgeMat);
    addAssetBox(g,.022,d.height*.22,d.depth*.22,d.width*.50+.006,d.height*.42,-d.depth*.08,edgeMat);
    addAssetBox(g,d.width*.16,.025,d.depth*.08,-d.width*.32,.012,d.depth*.33,edgeMat);
    addAssetBox(g,d.width*.16,.025,d.depth*.08,d.width*.32,.012,d.depth*.33,edgeMat)
  } else if(d.kind==='micStand'){
    addRefinedMicStand(g,d)
  }
  g.updateMatrixWorld(true)
}
function createStagePropObject(kind='guitar',opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseStagePropData({kind:kind,width:opts.width,depth:opts.depth,height:opts.height,screenTiltDeg:opts.screenTiltDeg,boomAngleDeg:opts.boomAngleDeg});g.userData.colorOverride=opts.color||((kind==='visualLaptop'||kind==='laptopScreen')?'#0f1115':kind==='drumKit'?'#6b1836':'#101216');g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||({visualLaptop:'Visuals Laptop',laptopScreen:'Laptop Screen',guitar:'Guitar',bassGuitar:'Bass Guitar',drumKit:'Drum Kit',micStand:'Mic Stand',guitarAmpStack:'Guitar Amp + Head',bassAmpStack:'Bass Amp + Head',wedgeMonitor:'Wedge Floor Monitor'}[kind]||'Stage Prop'),'fixtureAsset',opts.id);rebuildStagePropObject(g);return g}

function isLightingConsoleRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='lightingConsole'}
function normaliseLightingConsoleData(raw={}){const d=raw||{};d.kind='lightingConsole';d.width=Math.max(.72,+d.width||1.06);d.depth=Math.max(.42,+d.depth||.68);const flatH=Math.max(.08,+d.rearHeight||+d.frontHeight||.12);d.frontHeight=flatH;d.rearHeight=flatH;d.topTiltDeg=Number.isFinite(+d.topTiltDeg)?Math.max(0,Math.min(4,+d.topTiltDeg)):0;d.keypadCols=Math.max(3,Math.min(5,Math.round(+d.keypadCols||4)));d.faderCount=Math.max(8,Math.min(16,Math.round(+d.faderCount||10)));return d}
function rebuildLightingConsoleObject(g){if(!isLightingConsoleRoot(g))return;const d=normaliseLightingConsoleData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);
  const bodyBlue=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x2f5fcb,roughness:.48,metalness:.16}),panelWhite=new THREE.MeshStandardMaterial({color:0xe9edf4,roughness:.54,metalness:.06}),darkMat=new THREE.MeshStandardMaterial({color:0x171b21,roughness:.74,metalness:.10}),midMat=new THREE.MeshStandardMaterial({color:0x586273,roughness:.56,metalness:.44}),knobMat=new THREE.MeshStandardMaterial({color:0x272c33,roughness:.56,metalness:.34});
  const frontZ=d.depth/2,backZ=-d.depth/2;
  const bodyShape=new THREE.Shape();bodyShape.moveTo(backZ,0);bodyShape.lineTo(frontZ,0);bodyShape.lineTo(frontZ,d.frontHeight);bodyShape.lineTo(backZ,d.rearHeight);bodyShape.closePath();
  const bodyGeo=new THREE.ExtrudeGeometry(bodyShape,{depth:d.width,bevelEnabled:false});bodyGeo.rotateY(Math.PI/2);bodyGeo.translate(-d.width/2,0,0);const body=new THREE.Mesh(bodyGeo,bodyBlue);body.castShadow=true;body.receiveShadow=true;g.add(body);
  const topGroup=new THREE.Group();topGroup.position.set(0,d.frontHeight + (d.rearHeight-d.frontHeight)*.52,0);topGroup.rotation.x=THREE.MathUtils.degToRad(d.topTiltDeg);g.add(topGroup);
  addAssetBox(topGroup,d.width*.94,.010,d.depth*.90,0,.005,0,panelWhite);
  addAssetBox(topGroup,d.width*.97,.014,.022,0,.007,d.depth*.44,bodyBlue);
  addAssetBox(topGroup,d.width*.97,.014,.022,0,.007,-d.depth*.44,bodyBlue);
  const leftStripX=-d.width*.42,rightStripX=d.width*.42;addAssetBox(topGroup,.050,.010,d.depth*.86,leftStripX,.005,0,bodyBlue);addAssetBox(topGroup,.050,.010,d.depth*.86,rightStripX,.005,0,bodyBlue);
  // back indicator dots
  const dotCount=18;for(let i=0;i<dotCount;i++){const x=-d.width*.34+(i/(dotCount-1))*d.width*.68;const dot=cyl(.008,.006,x,.010,-d.depth*.34,darkMat,topGroup,10);dot.rotation.x=Math.PI/2}
  // left encoder column
  for(let i=0;i<4;i++){const z=-d.depth*.22+i*.080;const k=cyl(.026,.018,-d.width*.44,.022,z,knobMat,topGroup,18);k.scale.y=.7}
  // top function key blocks
  const blockY=.010; for(let row=0;row<3;row++){for(let col=0;col<6;col++){const x=-d.width*.18+col*.060,z=-d.depth*.19+row*.075;addAssetBox(topGroup,.038,.012,.026,x,blockY,z,darkMat)}}
  // right knob cluster
  [[.30,-.22,.036],[.37,-.13,.030],[.33,-.04,.030],[.25,.02,.024],[.39,.02,.040]].forEach(([xr,zr,rr])=>{const k=cyl(rr,.020,d.width*xr,.024,d.depth*zr,knobMat,topGroup,20);k.scale.y=.65});
  // faders section
  const fCount=d.faderCount,usable=d.width*.62,start=-usable/2+usable/(fCount*2),sp=usable/fCount;for(let i=0;i<fCount;i++){const x=start+i*sp;addAssetBox(topGroup,.036,.004,d.depth*.24,x,.011,d.depth*.10,darkMat);addAssetBox(topGroup,.012,.018,.028,x,.019,d.depth*.12-(i%3)*.015,midMat);addAssetBox(topGroup,.030,.010,.020,x,.010,d.depth*.23,darkMat)}
  // row of playback buttons below faders
  const playCount=10,playUse=d.width*.60,playStart=-playUse/2+playUse/(playCount*2),playSp=playUse/playCount;for(let i=0;i<playCount;i++){addAssetBox(topGroup,.040,.010,.028,playStart+i*playSp,.010,d.depth*.33,darkMat)}
  // mid rows of square buttons
  for(let row=0;row<2;row++){for(let col=0;col<10;col++){const x=-d.width*.24+col*.050,z=-d.depth*.02+row*.055;addAssetBox(topGroup,.026,.010,.022,x,.010,z,darkMat)}}
  // keypad / command wing
  const kCols=d.keypadCols,kRows=4;for(let row=0;row<kRows;row++){for(let col=0;col<kCols;col++){const x=d.width*.27+col*.045,z=d.depth*.07+row*.055;addAssetBox(topGroup,.030,.012,.026,x,.010,z,darkMat)}}
  // side cheeks to make it feel boxed like the reference
  addAssetBox(g,.024,d.rearHeight*.94,d.depth*.94,-d.width/2+.012,d.rearHeight*.47,0,bodyBlue);addAssetBox(g,.024,d.rearHeight*.94,d.depth*.94,d.width/2-.012,d.rearHeight*.47,0,bodyBlue);
  g.updateMatrixWorld(true)
}
function createLightingConsoleObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseLightingConsoleData({width:opts.width,depth:opts.depth,frontHeight:opts.frontHeight,rearHeight:opts.rearHeight,topTiltDeg:opts.topTiltDeg,keypadCols:opts.keypadCols,faderCount:opts.faderCount});g.userData.colorOverride=opts.color||'#2f5fcb';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Lighting Console','fixtureAsset',opts.id);rebuildLightingConsoleObject(g);return g}

function isSoundConsoleRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='soundConsole'}
function normaliseSoundConsoleData(raw={}){const d=raw||{};d.kind='soundConsole';d.width=Math.max(.8,+d.width||1.28);d.depth=Math.max(.45,+d.depth||.72);d.baseHeight=Math.max(.05,+d.baseHeight||.075);d.mainSlopeDeg=Number.isFinite(+d.mainSlopeDeg)?Math.max(2,Math.min(12,+d.mainSlopeDeg)):6;d.mainRise=Math.tan(THREE.MathUtils.degToRad(d.mainSlopeDeg))*d.depth;d.rearHeight=Math.max(.10,+d.rearHeight||.225);d.rearDepth=Math.max(.08,Math.min(d.depth*.40,+d.rearDepth||.16));d.rearTiltDeg=Number.isFinite(+d.rearTiltDeg)?Math.max(-38,Math.min(-8,+d.rearTiltDeg)):-28;d.screenWidth=Math.max(.16,+d.screenWidth||.23);d.screenHeight=Math.max(.08,+d.screenHeight||.11);return d}
function addSoundConsoleButton(parent,w,h,d,x,y,z,mat){const b=addAssetBox(parent,w,h,d,x,y,z,mat);return b}
function rebuildSoundConsoleObject(g){if(!isSoundConsoleRoot(g))return;const d=normaliseSoundConsoleData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const bodyMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x1c1f24,roughness:.78,metalness:.10}),panelMat=new THREE.MeshStandardMaterial({color:0x262a31,roughness:.68,metalness:.12}),trimMat=new THREE.MeshStandardMaterial({color:0x111318,roughness:.86,metalness:.08}),screenMat=new THREE.MeshStandardMaterial({color:0x67d14f,emissive:0x67d14f,emissiveIntensity:.42,roughness:.28,metalness:.04}),screenBlueMat=new THREE.MeshStandardMaterial({color:0x4aa6ff,emissive:0x4aa6ff,emissiveIntensity:.25,roughness:.24,metalness:.05}),knobMat=new THREE.MeshStandardMaterial({color:0x9397a0,roughness:.42,metalness:.62}),orangeMat=new THREE.MeshStandardMaterial({color:0xf1b07d,emissive:0xa85f25,emissiveIntensity:.15,roughness:.40,metalness:.10}),yellowMat=new THREE.MeshStandardMaterial({color:0xe4dd74,emissive:0x9e9830,emissiveIntensity:.14,roughness:.40,metalness:.10}),blueMat=new THREE.MeshStandardMaterial({color:0x67a9ff,emissive:0x3f6dbd,emissiveIntensity:.16,roughness:.40,metalness:.10}),pinkMat=new THREE.MeshStandardMaterial({color:0xff9aad,emissive:0xa54562,emissiveIntensity:.14,roughness:.40,metalness:.10}),greenMat=new THREE.MeshStandardMaterial({color:0x87d88d,emissive:0x3f9d48,emissiveIntensity:.14,roughness:.40,metalness:.10});
  // Wedge-shaped lower chassis: flat on the surface, gently rising toward the rear.
  const frontZ=d.depth/2,backZ=-d.depth/2,frontH=d.baseHeight,rearH=d.baseHeight+d.mainRise;
  const lowerShape=new THREE.Shape();lowerShape.moveTo(backZ,0);lowerShape.lineTo(frontZ,0);lowerShape.lineTo(frontZ,frontH);lowerShape.lineTo(backZ,rearH);lowerShape.closePath();
  const lowerGeo=new THREE.ExtrudeGeometry(lowerShape,{depth:d.width,bevelEnabled:false});lowerGeo.rotateY(Math.PI/2);lowerGeo.translate(-d.width/2,0,0);const lowerBody=new THREE.Mesh(lowerGeo,bodyMat);lowerBody.castShadow=true;lowerBody.receiveShadow=true;g.add(lowerBody);
  // Main fader/control surface follows the same shallow rake as the chassis.
  const mainPanel=new THREE.Group();mainPanel.position.set(0,frontH+d.mainRise/2,0);mainPanel.rotation.x=THREE.MathUtils.degToRad(d.mainSlopeDeg);g.add(mainPanel);addAssetBox(mainPanel,d.width*.985,.012,d.depth*.96,0,.006,0,panelMat);addAssetBox(mainPanel,d.width*.98,.018,.035,0,.004,d.depth*.475,trimMat);
  const stripCount=16,usableW=d.width*.78,startX=-usableW/2+usableW/(stripCount*2),spacing=usableW/stripCount;for(let i=0;i<stripCount;i++){const x=startX+i*spacing;addAssetBox(mainPanel,.048,.004,d.depth*.42,x,.014,-d.depth*.02,trimMat);addAssetBox(mainPanel,.016,.012,.034,x,.019,d.depth*.06-(i%5)*.018,knobMat);addSoundConsoleButton(mainPanel,.030,.006,.018,x,.015,-d.depth*.18,yellowMat);addSoundConsoleButton(mainPanel,.030,.006,.018,x,.015,-d.depth*.11,blueMat);addSoundConsoleButton(mainPanel,.030,.006,.018,x,.015,-d.depth*.04,pinkMat);addSoundConsoleButton(mainPanel,.030,.006,.018,x,.015,d.depth*.03,greenMat);addSoundConsoleButton(mainPanel,.030,.006,.018,x,.015,d.depth*.10,orangeMat);addSoundConsoleButton(mainPanel,.030,.006,.018,x,.015,d.depth*.17,pinkMat)}
  const masterX=d.width*.40;for(let c=0;c<3;c++){for(let r=0;r<4;r++){const gx=masterX+c*.05,gz=-d.depth*.02+r*.08;const knob=cyl(.010,.012,gx,.020,gz,knobMat,mainPanel,14);knob.scale.y=.7}}for(let c=0;c<3;c++){for(let r=0;r<4;r++)addSoundConsoleButton(mainPanel,.024,.006,.016,masterX+c*.05,.015,d.depth*.16+r*.04,orangeMat)}
  // Raised M32-style rear section. It is solid and now leans outward more strongly so the rear board sits at roughly a 120° relationship to the base.
  const rearGroup=new THREE.Group(),rearBaseY=rearH+.004,rearPivotZ=-d.depth/2+d.rearDepth*.50;rearGroup.position.set(0,rearBaseY,rearPivotZ);rearGroup.rotation.x=THREE.MathUtils.degToRad(d.rearTiltDeg);g.add(rearGroup);
  addAssetBox(rearGroup,d.width*.985,d.rearHeight,d.rearDepth*.96,0,d.rearHeight/2,0,bodyMat);addAssetBox(rearGroup,d.width*.96,d.rearHeight*.94,.020,0,d.rearHeight*.50,-d.rearDepth*.48,trimMat);addAssetBox(rearGroup,d.width*.94,.014,d.rearDepth*.98,0,d.rearHeight+.006,0,trimMat);
  const cheekW=Math.min(.06,d.width*.05);addAssetBox(rearGroup,cheekW,d.rearHeight*.88,d.rearDepth*.92,-d.width/2+cheekW/2,d.rearHeight*.50,0,trimMat);addAssetBox(rearGroup,cheekW,d.rearHeight*.88,d.rearDepth*.92,d.width/2-cheekW/2,d.rearHeight*.50,0,trimMat);
  const screenY=d.rearHeight*.56,screenZ=d.rearDepth*.42;addAssetBox(rearGroup,d.screenWidth,d.screenHeight,.018,0,screenY,screenZ,screenMat);addAssetBox(rearGroup,d.screenWidth*.82,d.screenHeight*.56,.021,0,screenY+.005,screenZ+.003,screenBlueMat);
  const monitorCols=[greenMat,greenMat,greenMat,yellowMat,orangeMat];for(let i=0;i<monitorCols.length;i++)addAssetBox(rearGroup,.010,d.screenHeight*.88*((i+3)/8),.012,d.screenWidth/2+.04+i*.014,d.rearHeight*.24+(d.screenHeight*.88*((i+3)/8))/2,screenZ+.003,monitorCols[i]);
  const topZoneY=d.rearHeight*.78,topLeftX=-d.width*.33;for(let col=0;col<4;col++){for(let row=0;row<2;row++){const gx=topLeftX+col*.08,gz=-d.rearDepth*.08+row*.055;const knob=cyl(.012,.012,gx,topZoneY,gz,knobMat,rearGroup,16);knob.scale.y=.8;addSoundConsoleButton(rearGroup,.020,.006,.012,gx-.022,topZoneY-.028,gz+.018,orangeMat);addSoundConsoleButton(rearGroup,.020,.006,.012,gx+.022,topZoneY-.028,gz+.018,yellowMat)}}
  const topRightX=d.width*.33;for(let col=0;col<3;col++){for(let row=0;row<2;row++){const gx=topRightX-col*.08,gz=-d.rearDepth*.08+row*.055;const knob=cyl(.012,.012,gx,topZoneY,gz,knobMat,rearGroup,16);knob.scale.y=.8;addSoundConsoleButton(rearGroup,.018,.006,.012,gx,topZoneY-.028,gz+.018,orangeMat)}}
  g.updateMatrixWorld(true)
}
function createSoundConsoleObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseSoundConsoleData({width:opts.width,depth:opts.depth,baseHeight:opts.baseHeight,mainSlopeDeg:opts.mainSlopeDeg,rearHeight:opts.rearHeight,rearDepth:opts.rearDepth,rearTiltDeg:opts.rearTiltDeg,screenWidth:opts.screenWidth,screenHeight:opts.screenHeight});g.userData.colorOverride=opts.color||'#1d2025';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Sound Console','fixtureAsset',opts.id);rebuildSoundConsoleObject(g);return g}


function isWallMirrorRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='wallMirror'}
function normaliseWallMirrorData(raw={}){const d=raw||{};d.kind='wallMirror';d.width=Math.max(.20,+d.width||.90);d.height=Math.max(.25,+d.height||1.35);d.depth=Math.max(.025,+d.depth||.055);d.frame=Math.max(.012,Math.min(.08,+d.frame||.035));return d}
let wallMirrorEnvTexture=null;
function wallMirrorEnvironment(){
  if(wallMirrorEnvTexture)return wallMirrorEnvTexture;
  const makeFace=(side)=>{
    const c=document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');
    const bg=x.createLinearGradient(0,0,192,192);
    bg.addColorStop(0,'#050609');bg.addColorStop(.36,'#111521');bg.addColorStop(.66,'#24283a');bg.addColorStop(1,'#07080b');
    x.fillStyle=bg;x.fillRect(0,0,192,192);
    const band=x.createLinearGradient(0,0,192,0);
    band.addColorStop(0,'rgba(255,255,255,0)');
    band.addColorStop(.42,'rgba(235,241,255,.08)');
    band.addColorStop(.52,'rgba(255,255,255,.60)');
    band.addColorStop(.61,'rgba(235,241,255,.08)');
    band.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=band;x.fillRect(0,side%2?36:64,192,side%2?18:10);
    x.fillStyle='rgba(204,60,58,.34)';x.fillRect(side%3===0?14:116,112,62,8);
    x.fillStyle='rgba(112,91,255,.20)';x.fillRect(side%2?18:126,22,45,5);
    return c
  };
  wallMirrorEnvTexture=new THREE.CubeTexture([0,1,2,3,4,5].map(makeFace));
  wallMirrorEnvTexture.encoding=THREE.sRGBEncoding;wallMirrorEnvTexture.needsUpdate=true;
  return wallMirrorEnvTexture
}
function rebuildWallMirrorObject(g){if(!isWallMirrorRoot(g))return;const d=normaliseWallMirrorData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const frameMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x111318,roughness:.26,metalness:.78}),backMat=new THREE.MeshStandardMaterial({color:0x0b0d10,roughness:.78,metalness:.12});
  const fw=Math.min(d.frame,d.width*.18),fh=Math.min(d.frame,d.height*.18),frontZ=d.depth/2+.010,mirrorW=Math.max(.08,d.width-fw*2),mirrorH=Math.max(.08,d.height-fh*2);
  addAssetBox(g,d.width,d.height,d.depth,0,d.height/2,0,backMat);
  const mirrorMat=new THREE.MeshPhysicalMaterial({
    color:0xe9edf2,metalness:1,roughness:.012,envMap:wallMirrorEnvironment(),envMapIntensity:2.55,
    clearcoat:1,clearcoatRoughness:.006,reflectivity:1,side:THREE.DoubleSide
  });
  const mirror=new THREE.Mesh(new THREE.PlaneGeometry(mirrorW,mirrorH),mirrorMat);mirror.position.set(0,d.height/2,frontZ);mirror.userData.keepTextureColour=true;mirror.userData.performanceMirror=true;g.add(mirror);
  // faint diagonal highlight makes the reflection read even in very dark lighting
  const sheenTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');const gr=x.createLinearGradient(0,256,256,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.42,'rgba(255,255,255,0)');gr.addColorStop(.50,'rgba(255,255,255,.20)');gr.addColorStop(.58,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,256,256);const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t})();
  const sheen=new THREE.Mesh(new THREE.PlaneGeometry(mirrorW,mirrorH),new THREE.MeshBasicMaterial({map:sheenTex,transparent:true,opacity:.46,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false}));
  sheen.position.set(0,d.height/2,frontZ+.0015);sheen.userData.keepTextureColour=true;g.add(sheen);
  addAssetBox(g,d.width,fh,.018,0,fh/2,frontZ+.008,frameMat);addAssetBox(g,d.width,fh,.018,0,d.height-fh/2,frontZ+.008,frameMat);
  addAssetBox(g,fw,d.height-fh*2,.018,-d.width/2+fw/2,d.height/2,frontZ+.008,frameMat);addAssetBox(g,fw,d.height-fh*2,.018,d.width/2-fw/2,d.height/2,frontZ+.008,frameMat);
  g.updateMatrixWorld(true);markRenderDirty(300)
}
function createWallMirrorObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseWallMirrorData({width:opts.width,height:opts.height,depth:opts.depth,frame:opts.frame});g.userData.colorOverride=opts.color||'#111318';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Wall Mirror','fixtureAsset',opts.id);rebuildWallMirrorObject(g);return g}

function isCustomStairRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='customStair'}
function normaliseCustomStairData(raw={}){const d=raw||{};d.kind='customStair';if(!Array.isArray(d.points)||d.points.length<2)d.points=[[-1.6,0],[1.6,0]];d.points=d.points.slice(0,2).map(p=>[+p[0]||0,+p[1]||0]);d.width=Math.max(.45,+d.width||1.20);d.rise=Math.max(.10,+d.rise||2.40);d.count=Math.max(3,Math.min(48,Math.round(+d.count||16)));d.wallHeight=Math.max(.20,+d.wallHeight||1.05);d.wallThickness=Math.max(.04,+d.wallThickness||.09);d.mode=['straight','half','full'].includes(d.mode)?d.mode:'straight';d.turnSide=d.turnSide===-1?-1:1;return d}
function customStairPath(d){d=normaliseCustomStairData(d);const a=new THREE.Vector2(d.points[0][0],d.points[0][1]),b=new THREE.Vector2(d.points[1][0],d.points[1][1]),delta=b.clone().sub(a),L=Math.max(.40,delta.length()),dir=delta.lengthSq()>1e-8?delta.clone().normalize():new THREE.Vector2(1,0),perp=new THREE.Vector2(-dir.y,dir.x).multiplyScalar(d.turnSide),pts=[],segments=Math.max(d.count*3,36);for(let i=0;i<=segments;i++){const t=i/segments;let p=a.clone().lerp(b,t);if(d.mode==='half'){p.add(perp.clone().multiplyScalar(Math.sin(Math.PI*t)*(L*.50)))}else if(d.mode==='full'){const amp=L*.32*Math.sin(Math.PI*t),theta=Math.PI*2*t;p.add(dir.clone().multiplyScalar(Math.cos(theta)*amp*.42)).add(perp.clone().multiplyScalar(Math.sin(theta)*amp))}pts.push(p)}return pts}
function customStairSample(path,t){const s=Math.max(0,Math.min(1,t))*(path.length-1),i=Math.min(path.length-2,Math.floor(s)),f=s-i;return path[i].clone().lerp(path[i+1],f)}
function customStairTangent(path,t){const e=1/(path.length-1),a=customStairSample(path,Math.max(0,t-e)),b=customStairSample(path,Math.min(1,t+e)),v=b.sub(a);if(v.lengthSq()<1e-8)v.set(1,0);return v.normalize()}
function rebuildCustomStairObject(g){if(!isCustomStairRoot(g))return;const d=normaliseCustomStairData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const stairMat=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x24272c,roughness:.86}),wallMat=new THREE.MeshStandardMaterial({color:0x111318,roughness:.94}),path=customStairPath(d),stepN=d.count,total=path.reduce((s,p,i)=>i?s+p.distanceTo(path[i-1]):0,0),stepDepth=Math.max(.12,total/stepN*1.12);for(let i=0;i<stepN;i++){const t0=i/stepN,t1=(i+1)/stepN,tm=(t0+t1)/2,p=customStairSample(path,tm),tan=customStairTangent(path,tm),yaw=-Math.atan2(tan.y,tan.x),topY=d.rise*t1,stepH=Math.max(.04,d.rise/stepN);const step=new THREE.Mesh(new THREE.BoxGeometry(d.width,stepH,stepDepth),stairMat);step.position.set(p.x,topY-stepH/2,p.y);step.rotation.y=yaw+Math.PI/2;step.castShadow=true;step.receiveShadow=true;g.add(step);const n=new THREE.Vector2(-tan.y,tan.x),wallY=topY+d.wallHeight/2;[-1,1].forEach(side=>{const wp=p.clone().add(n.clone().multiplyScalar(side*(d.width/2+d.wallThickness/2)));const wall=new THREE.Mesh(new THREE.BoxGeometry(d.wallThickness,d.wallHeight,stepDepth*1.08),wallMat);wall.position.set(wp.x,wallY,wp.y);wall.rotation.y=yaw+Math.PI/2;wall.castShadow=true;wall.receiveShadow=true;g.add(wall)})}g.updateMatrixWorld(true)}
function createCustomStairObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseCustomStairData(opts);g.userData.colorOverride=opts.color||'#24272c';venue.add(g);registerBuilderRoot(g,opts.name||'Point-to-point Staircase','fixtureAsset',opts.id);rebuildCustomStairObject(g);return g}
function isCounterBarFridgeRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='counterBarFridge'}
function normaliseCounterBarFridgeData(raw={}){const d=raw||{};d.kind='counterBarFridge';d.width=Math.max(.30,+d.width||.54);d.depth=Math.max(.28,+d.depth||.48);d.height=Math.max(.30,+d.height||.58);return d}
function rebuildCounterBarFridgeObject(g){if(!isCounterBarFridgeRoot(g))return;const d=normaliseCounterBarFridgeData(g.userData.assetData);g.userData.assetData=d;clearGroupChildren(g);const body=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x14171b,roughness:.72,metalness:.20}),glass=new THREE.MeshStandardMaterial({color:0x18242c,roughness:.18,metalness:.35,transparent:true,opacity:.72}),trim=new THREE.MeshStandardMaterial({color:0x8a9099,roughness:.34,metalness:.72});addAssetBox(g,d.width,d.height,d.depth,0,d.height/2,0,body);addAssetBox(g,d.width*.84,d.height*.70,.018,0,d.height*.53,d.depth/2+.012,glass);addAssetBox(g,.018,d.height*.54,.025,d.width*.37,d.height*.54,d.depth/2+.028,trim);g.updateMatrixWorld(true)}
function createCounterBarFridgeObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseCounterBarFridgeData(opts);g.userData.colorOverride=opts.color||'#14171b';venue.add(g);registerBuilderRoot(g,opts.name||'Counter Bar Fridge','fixtureAsset',opts.id);rebuildCounterBarFridgeObject(g);return g}
function createCounterBarFridgeOnSurface(surface,opts={}){if(!isRaisedSinkSurface(surface))return createCounterBarFridgeObject(opts);surface.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(surface),c=new THREE.Vector3();b.getCenter(c);const o=createCounterBarFridgeObject({...opts,x:c.x,y:b.max.y+.004,z:c.z});o.rotation.y=surfaceWorldYaw(surface);return o}
function syncCustomStairUI(){const box=document.getElementById('customStairBox');if(!box)return;const on=isCustomStairRoot(selectedEdit);box.style.display=on?'block':'none';if(!on)return;const d=normaliseCustomStairData(selectedEdit.userData.assetData),status=document.getElementById('customStairStatus');if(status)status.textContent=(d.mode==='straight'?'STRAIGHT':d.mode==='half'?'HALF SPIRAL':'FULL SPIRAL')+' · '+d.count+' STEPS';document.querySelectorAll('.stair-mode').forEach(b=>b.classList.toggle('active',b.dataset.stairMode===d.mode));[['customStairWidth',d.width],['customStairRise',d.rise],['customStairCount',d.count],['customStairWallHeight',d.wallHeight]].forEach(([id,val])=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=Number(val.toFixed(3))})}
function updateCustomStairField(key,value){if(!isCustomStairRoot(selectedEdit))return;pushHistory();const d=normaliseCustomStairData(selectedEdit.userData.assetData);if(key==='count')d.count=Math.max(3,Math.min(48,Math.round(+value||16)));else if(key==='width')d.width=Math.max(.45,+value||1.2);else if(key==='rise')d.rise=Math.max(.1,+value||2.4);else if(key==='wallHeight')d.wallHeight=Math.max(.2,+value||1.05);rebuildCustomStairObject(selectedEdit);updateSelectionBox();saveLocalEditState(false);syncCustomStairUI()}
function setCustomStairMode(mode){if(!isCustomStairRoot(selectedEdit)||!['straight','half','full'].includes(mode))return;pushHistory();selectedEdit.userData.assetData.mode=mode;rebuildCustomStairObject(selectedEdit);updateSelectionBox();saveLocalEditState(false);syncCustomStairUI()}
function flipCustomStairSide(){if(!isCustomStairRoot(selectedEdit))return;pushHistory();const d=normaliseCustomStairData(selectedEdit.userData.assetData);d.turnSide*=-1;rebuildCustomStairObject(selectedEdit);updateSelectionBox();saveLocalEditState(false);syncCustomStairUI()}
function isWallPoleRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='wallPole'}
function normaliseWallPoleData(raw={}){const d=raw||{};d.kind='wallPole';d.height=Math.max(.25,+d.height||1.55);d.diameter=Math.max(.025,+d.diameter||.065);d.standoff=Math.max(.025,+d.standoff||.075);d.mountRadius=Math.max(.03,+d.mountRadius||.055);return d}
function rebuildWallPoleObject(g){if(!isWallPoleRoot(g))return;const d=normaliseWallPoleData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;clearGroupChildren(g);const steel=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x6c727b,roughness:.28,metalness:.82}),dark=new THREE.MeshStandardMaterial({color:0x272b31,roughness:.38,metalness:.70}),r=d.diameter/2;cyl(r,d.height,0,d.height/2,0,steel,g,24);[.24,.76].forEach(f=>{const y=d.height*f,stem=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(.012,r*.38),Math.max(.012,r*.38),d.standoff,12),dark);stem.rotation.x=Math.PI/2;stem.position.set(0,y,-d.standoff/2);stem.castShadow=true;stem.receiveShadow=true;g.add(stem);const plate=new THREE.Mesh(new THREE.CylinderGeometry(d.mountRadius,d.mountRadius,.014,20),dark);plate.rotation.x=Math.PI/2;plate.position.set(0,y,-d.standoff-.007);plate.castShadow=true;plate.receiveShadow=true;g.add(plate)});g.updateMatrixWorld(true)}
function createWallPoleObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseWallPoleData(opts);g.userData.colorOverride=opts.color||'#6c727b';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Wall Pole','fixtureAsset',opts.id);rebuildWallPoleObject(g);return g}
function isCeilingLightPoleRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='ceilingLightPole'}
function normaliseCeilingLightPoleData(raw={}){const d=raw||{};d.kind='ceilingLightPole';d.length=Math.max(.40,+d.length||2.40);d.diameter=Math.max(.025,Math.min(.12,+d.diameter||.050));d.drop=Math.max(.04,Math.min(1.20,+d.drop||.18));d.mountSpread=Math.max(.25,Math.min(.90,+d.mountSpread||.72));d.plateRadius=Math.max(.04,+d.plateRadius||Math.max(.055,d.diameter*1.45));return d}
function rebuildCeilingLightPoleObject(g){if(!isCeilingLightPoleRoot(g))return;const d=normaliseCeilingLightPoleData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;clearGroupChildren(g);const steel=new THREE.MeshStandardMaterial({color:g.userData.colorOverride||0x747b84,roughness:.24,metalness:.88}),dark=new THREE.MeshStandardMaterial({color:0x2b3036,roughness:.34,metalness:.78}),r=d.diameter/2;const pole=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length,20),steel);pole.rotation.z=Math.PI/2;pole.position.set(0,0,0);pole.castShadow=true;pole.receiveShadow=true;g.add(pole);const spread=Math.min(d.length*.90,Math.max(d.length*.30,d.length*d.mountSpread));[-1,1].forEach(s=>{const x=s*spread/2;const dropper=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(.010,r*.52),Math.max(.010,r*.52),d.drop,12),dark);dropper.position.set(x,d.drop/2+r*.25,0);dropper.castShadow=true;dropper.receiveShadow=true;g.add(dropper);const clamp=new THREE.Mesh(new THREE.TorusGeometry(Math.max(r*1.20,.026),Math.max(.006,r*.20),8,18),dark);clamp.rotation.x=Math.PI/2;clamp.position.set(x,r*.15,0);clamp.castShadow=true;clamp.receiveShadow=true;g.add(clamp);const plate=new THREE.Mesh(new THREE.CylinderGeometry(d.plateRadius,d.plateRadius,.018,20),dark);plate.position.set(x,d.drop+r*.25+.009,0);plate.castShadow=true;plate.receiveShadow=true;g.add(plate)});g.updateMatrixWorld(true);if(typeof markRenderDirty==='function')markRenderDirty(180)}
function createCeilingLightPoleObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??(ceilingMountReferenceY()-.25),opts.z??target.z);g.userData.assetData=normaliseCeilingLightPoleData(opts);g.userData.colorOverride=opts.color||'#747b84';g.userData.preserveDetailColours=true;g.userData.builderType='fixtureAsset';venue.add(g);rebuildCeilingLightPoleObject(g);registerBuilderRoot(g,opts.name||'Ceiling Light Pole','fixtureAsset',opts.id);if(Number.isFinite(+opts.rotY))g.rotation.y=+opts.rotY;snapRootToCeiling(g,false);return g}
function syncCeilingLightPoleUI(){const box=document.getElementById('ceilingLightPoleBox');if(!box)return;const active=isCeilingLightPoleRoot(selectedEdit);box.style.display=active?'block':'none';if(!active)return;const d=normaliseCeilingLightPoleData(selectedEdit.userData.assetData);const vals=[['ceilingPoleLength',d.length],['ceilingPoleDiameter',d.diameter],['ceilingPoleDrop',d.drop],['ceilingPoleMountSpread',d.mountSpread]];vals.forEach(([id,v])=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=Number(v).toFixed(id==='ceilingPoleDiameter'?3:2)})}
function updateSelectedCeilingLightPoleFromUI(){if(!isCeilingLightPoleRoot(selectedEdit))return;pushHistory();const d=normaliseCeilingLightPoleData(selectedEdit.userData.assetData),get=(id,fallback)=>{const el=document.getElementById(id),v=el?+el.value:NaN;return Number.isFinite(v)?v:fallback};d.length=get('ceilingPoleLength',d.length);d.diameter=get('ceilingPoleDiameter',d.diameter);d.drop=get('ceilingPoleDrop',d.drop);d.mountSpread=get('ceilingPoleMountSpread',d.mountSpread);selectedEdit.userData.assetData=normaliseCeilingLightPoleData(d);rebuildCeilingLightPoleObject(selectedEdit);snapRootToCeiling(selectedEdit,false);updateSelectionBox();saveLocalEditState(false);syncCeilingLightPoleUI()}
function resetSelectedCeilingLightPole(){if(!isCeilingLightPoleRoot(selectedEdit))return;pushHistory();selectedEdit.scale.set(1,1,1);selectedEdit.userData.assetData=normaliseCeilingLightPoleData({length:2.40,diameter:.050,drop:.18,mountSpread:.72});rebuildCeilingLightPoleObject(selectedEdit);snapRootToCeiling(selectedEdit,false);updateSelectionBox();saveLocalEditState(false);syncCeilingLightPoleUI();flashEditor('Ceiling light pole reset · 2.40 m length')}
function neonSkullPanelTexture(bgHex='#493bff',skullHex='#ffffff'){const key='neonSkull:'+bgHex+':'+skullHex;neonSkullPanelTexture.cache=neonSkullPanelTexture.cache||{};if(neonSkullPanelTexture.cache[key])return neonSkullPanelTexture.cache[key];const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d'),bg=new THREE.Color(bgHex),sk=new THREE.Color(skullHex),bgr=Math.round(bg.r*255),bgg=Math.round(bg.g*255),bgb=Math.round(bg.b*255),skr=Math.round(sk.r*255),skg=Math.round(sk.g*255),skb=Math.round(sk.b*255);const g=ctx.createRadialGradient(512,530,60,512,530,610);g.addColorStop(0,'rgba('+bgr+','+bgg+','+bgb+',0.98)');g.addColorStop(.56,'rgba('+bgr+','+bgg+','+bgb+',0.92)');g.addColorStop(1,'rgba(10,11,20,0.98)');ctx.fillStyle=g;ctx.fillRect(0,0,1024,1024);ctx.save();ctx.translate(516,525);ctx.rotate(.22);ctx.scale(1.02,1.08);ctx.shadowColor='rgba('+skr+','+skg+','+skb+',0.52)';ctx.shadowBlur=34;ctx.fillStyle='rgba('+skr+','+skg+','+skb+',1)';ctx.beginPath();ctx.moveTo(-250,-280);ctx.bezierCurveTo(-360,-175,-350,40,-230,172);ctx.bezierCurveTo(-142,272,-28,334,56,304);ctx.bezierCurveTo(128,278,180,202,202,128);ctx.bezierCurveTo(252,-24,180,-195,32,-295);ctx.bezierCurveTo(-58,-354,-180,-340,-250,-280);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.shadowBlur=0;ctx.fillStyle='rgba(0,0,0,1)';ctx.beginPath();ctx.ellipse(-102,118,52,88,-.76,0,Math.PI*2);ctx.ellipse(44,132,48,84,-.60,0,Math.PI*2);ctx.moveTo(-16,148);ctx.lineTo(26,222);ctx.lineTo(-36,226);ctx.closePath();ctx.fill();ctx.lineWidth=22;ctx.lineCap='round';ctx.strokeStyle='rgba(0,0,0,1)';ctx.beginPath();ctx.moveTo(-154,-226);ctx.lineTo(-178,-138);ctx.lineTo(-126,-84);ctx.lineTo(-136,-16);ctx.moveTo(146,-44);ctx.lineTo(118,36);ctx.moveTo(-128,62);ctx.lineTo(-18,82);ctx.moveTo(70,18);ctx.lineTo(146,78);ctx.moveTo(58,246);ctx.lineTo(28,296);ctx.stroke();ctx.restore();const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;tex.needsUpdate=true;neonSkullPanelTexture.cache[key]=tex;return tex}
function isNeonSkullLightBoxRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='neonSkullLightBox'}
function normaliseNeonSkullLightBoxData(raw={}){const d=raw||{};d.kind='neonSkullLightBox';d.width=Math.max(.45,+d.width||1.18);d.height=Math.max(.45,+d.height||1.18);d.depth=Math.max(.22,+d.depth||1.18);d.frame=Math.max(.04,+d.frame||Math.min(d.width,d.height)*.10);d.backlit=(raw.backlit!==undefined)?(raw.backlit!==false):true;d.backlightColor=d.backlightColor||d.panelColor||'#493bff';d.panelColor=d.backlightColor;d.backlightBrightness=Math.max(0,Math.min(8,Number.isFinite(+d.backlightBrightness)?+d.backlightBrightness:3.4));d.backlightSpread=Math.max(.2,Math.min(4,Number.isFinite(+d.backlightSpread)?+d.backlightSpread:1.45));return d}
function rebuildNeonSkullLightBoxObject(g){if(!isNeonSkullLightBoxRoot(g))return;const d=normaliseNeonSkullLightBoxData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;clearGroupChildren(g);const frame=assetMat(0x090b10,.46,.16),top=assetMat(0x0e1015,.34,.20),glassCol=new THREE.Color(d.backlightColor),frameT=d.frame,w=d.width,h=d.height,dep=d.depth,glowOn=d.backlit!==false,emit=glowOn?Math.max(.1,d.backlightBrightness):0,spread=Math.max(.8,d.backlightSpread*2.25);addAssetBox(g,w,frameT,dep,0,frameT/2,0,frame);addAssetBox(g,w,frameT,dep,0,h-frameT/2,0,top);addAssetBox(g,frameT,h-2*frameT,dep,-w/2+frameT/2,h/2,0,frame);addAssetBox(g,frameT,h-2*frameT,dep,w/2-frameT/2,h/2,0,frame);addAssetBox(g,w-2*frameT,h-2*frameT,frameT,0,h/2,-dep/2+frameT/2,frame);const faceMat=new THREE.MeshStandardMaterial({color:glassCol,emissive:glassCol,emissiveIntensity:emit,roughness:.18,metalness:.05,transparent:true,opacity:glowOn?.92:.35});const frontGlow=new THREE.Mesh(new THREE.PlaneGeometry(w-2*frameT,h-2*frameT),faceMat.clone());frontGlow.position.set(0,h/2,dep/2+.012);g.add(frontGlow);const rightGlow=new THREE.Mesh(new THREE.PlaneGeometry(dep-2*frameT,h-2*frameT),faceMat.clone());rightGlow.rotation.y=-Math.PI/2;rightGlow.position.set(w/2+.012,h/2,0);g.add(rightGlow);const skullTex=neonSkullPanelTexture(d.backlightColor),frontFace=new THREE.Mesh(new THREE.PlaneGeometry(w-2*frameT,h-2*frameT),new THREE.MeshBasicMaterial({map:skullTex,toneMapped:false,transparent:false,opacity:glowOn?1:.72}));frontFace.position.set(0,h/2,dep/2+.018);frontFace.userData.keepTextureColour=true;g.add(frontFace);const sideFace=new THREE.Mesh(new THREE.PlaneGeometry(dep-2*frameT,h-2*frameT),new THREE.MeshBasicMaterial({map:skullTex.clone(),toneMapped:false,transparent:false,opacity:glowOn?1:.72}));sideFace.rotation.y=-Math.PI/2;sideFace.position.set(w/2+.018,h/2,0);sideFace.userData.keepTextureColour=true;g.add(sideFace);const glow=new THREE.PointLight(glassCol,glowOn?(.18+d.backlightBrightness*.48):0,spread,1.7);glow.position.set(.18,h*.56,.05);glow.userData.portalBacklight=true;g.add(glow);g.updateMatrixWorld(true);applyPerformanceSensitiveObjects(g);markRenderDirty()}
function createNeonSkullLightBoxObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseNeonSkullLightBoxData(opts);g.userData.colorOverride=opts.color||'#090b10';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Neon Skull Light Box','fixtureAsset',opts.id);rebuildNeonSkullLightBoxObject(g);return g}
function isNeonRingPlantPanelRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&o.userData.assetData&&o.userData.assetData.kind==='neonRingPlantPanel'}
function normaliseNeonRingPlantPanelData(raw={}){const d=raw||{};d.kind='neonRingPlantPanel';d.width=Math.max(.75,+d.width||1.55);d.height=Math.max(1.2,+d.height||2.42);d.depth=Math.max(.08,+d.depth||.14);d.backlit=(raw.backlit!==undefined)?(raw.backlit!==false):true;d.backlightColor=d.backlightColor||d.ringColor||'#ff542c';d.ringColor=d.backlightColor;d.backlightBrightness=Math.max(0,Math.min(8,Number.isFinite(+d.backlightBrightness)?+d.backlightBrightness:3.1));d.backlightSpread=Math.max(.2,Math.min(4,Number.isFinite(+d.backlightSpread)?+d.backlightSpread:1.55));return d}
function addNeonRingPlantVine(g,x,y,z=.10,len=.72,sway=.05,segments=7){const stemMat=assetMat(0x3b4b26,.82,.04),leafMats=[0x6b963d,0x4f7f2f,0x7aaa46,0x3d6a28].map(c=>assetMat(c,.86,.02));let py=y;for(let i=0;i<segments;i++){const h=len/segments,px=x+Math.sin((i+1)*.75)*sway*(1+i*.08),pz=z+Math.cos((i+1)*.55)*.012;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.006,.008,h,6),stemMat);stem.position.set((x+px)/2,py-h/2,pz);stem.rotation.z=(px-x)/Math.max(.001,h);stem.castShadow=true;stem.receiveShadow=true;g.add(stem);const leafA=new THREE.Mesh(new THREE.SphereGeometry(.034,8,6),leafMats[i%leafMats.length]);leafA.scale.set(1.55,.45,.85);leafA.position.set(px+.032,py-h*.65,pz+.018);leafA.rotation.set(.25,i*.7,.55);g.add(leafA);const leafB=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),leafMats[(i+1)%leafMats.length]);leafB.scale.set(1.45,.42,.78);leafB.position.set(px-.028,py-h*.35,pz-.012);leafB.rotation.set(-.20,i*.62,-.62);g.add(leafB);x=px;py-=h}}
function addNeonRingBarbieDoll(parent,x,y,z,scale=1){const skin=assetMat(0xd4a182,.76,.06),hair=assetMat(0x6c3b28,.80,.06),metal=assetMat(0xd6d9de,.26,.76),white=assetMat(0xe8ebef,.54,.16);const baseGlow=new THREE.PointLight(0xfff4d0,.55,1.6,2);baseGlow.position.set(x,y+.05,z+.12);parent.add(baseGlow);const head=new THREE.Mesh(new THREE.SphereGeometry(.10*scale,16,14),skin);head.position.set(x,y+.62*scale,z);head.castShadow=true;head.receiveShadow=true;parent.add(head);[-1,1].forEach(s=>{const hairWing=new THREE.Mesh(new THREE.ConeGeometry(.12*scale,.34*scale,10),hair);hairWing.position.set(x+s*.12*scale,y+.64*scale,z-.01);hairWing.rotation.z=s*1.05;hairWing.rotation.x=.58;hairWing.castShadow=true;hairWing.receiveShadow=true;parent.add(hairWing)});const torso=new THREE.Mesh(new THREE.BoxGeometry(.18*scale,.26*scale,.10*scale),metal);torso.position.set(x,y+.40*scale,z);torso.castShadow=true;torso.receiveShadow=true;parent.add(torso);const waist=new THREE.Mesh(new THREE.BoxGeometry(.14*scale,.10*scale,.08*scale),skin);waist.position.set(x,y+.24*scale,z);waist.castShadow=true;waist.receiveShadow=true;parent.add(waist);const skirt=new THREE.Mesh(new THREE.BoxGeometry(.20*scale,.20*scale,.12*scale),metal);skirt.position.set(x,y+.10*scale,z);skirt.castShadow=true;skirt.receiveShadow=true;parent.add(skirt);[-1,1].forEach(s=>{addCylinderBetween(parent,new THREE.Vector3(x+s*.11*scale,y+.46*scale,z),new THREE.Vector3(x+s*.20*scale,y+.24*scale,z+.02),.018*scale,skin,10);addCylinderBetween(parent,new THREE.Vector3(x+s*.05*scale,y+.00*scale,z),new THREE.Vector3(x+s*.08*scale,y-.36*scale,z),.024*scale,skin,10);const boot=new THREE.Mesh(new THREE.BoxGeometry(.10*scale,.20*scale,.14*scale),white);boot.position.set(x+s*.08*scale,y-.48*scale,z+.02);boot.castShadow=true;boot.receiveShadow=true;parent.add(boot)});addMiniPlant(parent,x-.18*scale,y-.46*scale,z+.08,0.44*scale);addMiniPlant(parent,x+.16*scale,y-.45*scale,z+.08,0.36*scale)}
function rebuildNeonRingPlantPanelObject(g){if(!isNeonRingPlantPanelRoot(g))return;const d=normaliseNeonRingPlantPanelData(g.userData.assetData);g.userData.assetData=d;g.userData.preserveDetailColours=true;clearGroupChildren(g);buildMetalGridWall(g,d.width,d.height,{depth:Math.max(.08,d.depth*.6),cols:6,rows:8,withPlants:false});const ringY=d.height*.68,R=Math.min(d.width*.31,d.height*.20),z=d.depth/2+.018,col=new THREE.Color(d.backlightColor),glowOn=d.backlit!==false,emit=glowOn?Math.max(.1,d.backlightBrightness):0;const ring=new THREE.Mesh(new THREE.TorusGeometry(R,.028,12,96),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:emit,roughness:.20,metalness:.06}));ring.position.set(0,ringY,z);g.add(ring);[{rin:R*.92,rout:R*1.12,op:.28},{rin:R*.80,rout:R*1.22,op:.14},{rin:R*.66,rout:R*1.36,op:.06}].forEach((b,i)=>{const halo=new THREE.Mesh(new THREE.RingGeometry(b.rin,b.rout,72),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:glowOn?b.op*(.35+d.backlightBrightness/5):0.02,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));halo.position.set(0,ringY,z-.01-i*.004);halo.userData.portalBacklight=true;g.add(halo)});const glow=new THREE.PointLight(col,glowOn?(.18+d.backlightBrightness*.55):0,Math.max(1.8,2.0+d.backlightSpread*1.55),1.8);glow.position.set(0,ringY,z+.02);glow.userData.portalBacklight=true;g.add(glow);[[-.42,.77,1.16],[-.22,.91,1.02],[.03,.94,1.06],[.26,.86,1.18],[.45,.79,1.20],[-.48,.56,1.12],[.47,.57,1.10],[-.32,.39,.98],[.34,.36,.96],[.02,.22,.82]].forEach(([ux,uy,s])=>addWallPlantCluster(g,ux*d.width,uy*d.height,.095,.92*s));[[-.30,d.height*.86,.10,.58,.03,6],[.18,d.height*.88,.10,.84,.06,8],[.36,d.height*.72,.10,1.05,.04,9],[-.08,d.height*.28,.10,.70,.02,6]].forEach(v=>addNeonRingPlantVine(g,...v));g.updateMatrixWorld(true);applyPerformanceSensitiveObjects(g);markRenderDirty()}
function createNeonRingPlantPanelObject(opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseNeonRingPlantPanelData(opts);g.userData.colorOverride=opts.color||'#0b0d10';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||'Neon Ring Plant Panel','fixtureAsset',opts.id);rebuildNeonRingPlantPanelObject(g);return g}
function isWallOnlyAttachRoot(o){return isWallMirrorRoot(o)||isEventMarqueeRoot(o)||isMothershipPortalRoot(o)||isWallPoleRoot(o)||isNeonSkullLightBoxRoot(o)||isNeonRingPlantPanelRoot(o)||isLedBattenRoot(o)||isWarmParCanRoot(o)}

function syncWallPoleUI(){const box=document.getElementById('wallPoleOptionsBox');if(!box)return;box.style.display=isWallPoleRoot(selectedEdit)?'block':'none'}
function attachSelectedWallPole(){if(!isWallPoleRoot(selectedEdit)){flashEditor('Select a wall pole first');return}beginAttachPick()}


const LIGHTING_FIXTURE_KINDS=['ledBatten','ledPar','blinderPar','intimidator','movingMirrorScanner','hazerDF50','warmParCan','strobeFixture','downlightFixture','sunsetProjector','ceilingTubeLight'];
function isLightingFixtureKind(kind){return LIGHTING_FIXTURE_KINDS.includes(kind)}
function isLightingFixtureRoot(o){return !!o&&o.userData&&o.userData.builderType==='fixtureAsset'&&isLightingFixtureKind(o.userData.assetData&&o.userData.assetData.kind)}
function lightingFixtureKind(o){return isLightingFixtureRoot(o)?o.userData.assetData.kind:''}
function isLedBattenRoot(o){return isLightingFixtureRoot(o)&&lightingFixtureKind(o)==='ledBatten'}
function isWarmParCanRoot(o){return isLightingFixtureRoot(o)&&lightingFixtureKind(o)==='warmParCan'}
function lightingFixtureLabel(kind){return ({ledBatten:'LED Batten',ledPar:'LED Par',blinderPar:'Blinder Pars',intimidator:'Chauvet Intimidator',movingMirrorScanner:'Moving Mirror Scanner',hazerDF50:'Hazer DF-50',warmParCan:'Brushed Metal PAR Can',strobeFixture:'Ceiling Strobe',downlightFixture:'Circular Downlight',sunsetProjector:'Sunset Floor Lamp',ceilingTubeLight:'Ceiling LED Tube'})[kind]||'Lighting Fixture'}
function lightingFixtureMount(kind){return ({ledBatten:'wall',ledPar:'ceiling',blinderPar:'surface',intimidator:'ceiling',movingMirrorScanner:'ceiling',hazerDF50:'stage',warmParCan:'wall',strobeFixture:'ceiling',downlightFixture:'ceiling',sunsetProjector:'floor',ceilingTubeLight:'ceiling'})[kind]||'surface'}
function lightingFixtureSupportsColour(kind){return !['hazerDF50','warmParCan','strobeFixture'].includes(kind)}
function lightingFixtureDefaultRange(kind){return ({ledBatten:4.8,ledPar:6.5,blinderPar:5.5,intimidator:9.5,movingMirrorScanner:8.5,hazerDF50:4.2,warmParCan:5.2,strobeFixture:6.2,downlightFixture:4.0,sunsetProjector:5.6,ceilingTubeLight:4.2})[kind]||6}
function normaliseLightingFixtureData(raw={}){
  const src=raw||{};const d={...src};
  const kind=isLightingFixtureKind(d.kind)?d.kind:'ledPar';
  d.kind=kind;d.enabled=('enabled' in d)?!!d.enabled:false;d.lightColor=d.lightColor||d.color||(kind==='sunsetProjector'?'#ff7447':'#ffffff');
  if(kind==='warmParCan')d.lightColor='#ffd49a';if(kind==='strobeFixture')d.lightColor='#ffffff';
  const defaultBrightness=kind==='intimidator'||kind==='movingMirrorScanner'?3.8:kind==='hazerDF50'?2.6:kind==='strobeFixture'?4.4:kind==='sunsetProjector'?3.2:2.8;
  d.brightness=Math.max(0,Math.min(8,Number.isFinite(+d.brightness)?+d.brightness:defaultBrightness));
  d.range=Math.max(1.5,Math.min(20,Number.isFinite(+d.range)?+d.range:lightingFixtureDefaultRange(kind)));
  d.beamAngle=Math.max(6,Math.min(85,Number.isFinite(+d.beamAngle)?+d.beamAngle:({ledBatten:42,ledPar:34,blinderPar:58,intimidator:18,movingMirrorScanner:12,hazerDF50:30,warmParCan:36,strobeFixture:54,downlightFixture:48,sunsetProjector:62,ceilingTubeLight:70}[kind]||30)));
  d.tilt=Number.isFinite(+d.tilt)?+d.tilt:({ledBatten:0,ledPar:0,blinderPar:-8,intimidator:14,movingMirrorScanner:28,hazerDF50:0,warmParCan:0,strobeFixture:0,downlightFixture:0,sunsetProjector:0,ceilingTubeLight:0}[kind]||0);
  if(kind==='ledBatten')d.orientation=d.orientation==='vertical'?'vertical':'horizontal';
  if(kind==='hazerDF50')d.hazeAmount=Math.max(0,Math.min(8,Number.isFinite(+d.hazeAmount)?+d.hazeAmount:d.brightness));
  if(kind==='strobeFixture')d.strobeRate=Math.max(1,Math.min(20,Number.isFinite(+d.strobeRate)?+d.strobeRate:8));
  return d
}
function lightFixtureMountButtonLabel(kind){return ({ledBatten:'ATTACH TO WALL',ledPar:'SNAP TO CEILING',blinderPar:'SNAP TO SURFACE',intimidator:'SNAP TO CEILING',movingMirrorScanner:'SNAP TO CEILING',hazerDF50:'PLACE STAGE CORNER',warmParCan:'ATTACH TO WALL',strobeFixture:'SNAP TO CEILING',downlightFixture:'SNAP TO CEILING',sunsetProjector:'SNAP TO FLOOR',ceilingTubeLight:'SNAP TO CEILING'})[kind]||'SNAP TO MOUNT'}
function lightFixtureNote(kind){return ({ledBatten:'Wall-mounted LED batten with adjustable orientation. Starts OFF. Use ATTACH TO WALL, then ROTATE or switch HORIZONTAL / VERTICAL.',ledPar:'Ceiling-mounted LED par. Starts OFF and throws a downward wash from ceiling height.',blinderPar:'4-cell blinder for the stage floor / subs / raised surfaces. Starts OFF and throws a broad audience-facing wash.',intimidator:'Chauvet-style moving-head fixture. Starts OFF and mounts to ceiling height. Rotate the object to aim the head across the room.',movingMirrorScanner:'Madscan-style moving mirror scanner. Starts OFF and mounts to ceiling height with a narrow directional beam.',hazerDF50:'DF-50 style hazer. Starts OFF and defaults to a corner of the stage. BRIGHTNESS controls haze output.',warmParCan:'Brushed-metal wall PAR. Starts OFF. Warm bright light only; colour is intentionally fixed.',strobeFixture:'Ceiling strobe. Starts OFF. FLASH RATE controls the pulse speed when switched on.',downlightFixture:'Small circular ceiling downlight. Starts OFF, faces straight down and can be any colour.',sunsetProjector:'Floor-level sunset projector. Starts OFF. The selected centre colour is blended into a multicolour halo for plants and corners.',ceilingTubeLight:'Soft LED tube light. Starts OFF, auto-mounts to the ceiling and can be any colour.'})[kind]||'Fixture controls'}
function fixtureMountHeight(){return Math.max(2.2,+((typeof venueCalibration!=='undefined'&&venueCalibration&&venueCalibration.roomCeiling)||2.58))}
function moveRootBottomToY(root,y){if(!root)return;root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root);root.position.y+=y-b.min.y;root.updateMatrixWorld(true)}
function moveRootTopToY(root,y){if(!root)return;root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root);root.position.y+=y-b.max.y;root.updateMatrixWorld(true)}
function snapLightingFixtureToMount(root=selectedEdit,announce=true){
  if(!isLightingFixtureRoot(root))return false;
  const kind=lightingFixtureKind(root),mount=lightingFixtureMount(kind);
  if(mount==='wall'){
    if(root===selectedEdit){beginAttachPick();if(announce)flashEditor('Click a wall to attach '+lightingFixtureLabel(kind));return true}
    return false
  }
  if(mount==='ceiling'){
    moveRootTopToY(root,fixtureMountHeight()-.01);
    if(announce)flashEditor(lightingFixtureLabel(kind)+' snapped to ceiling height');
    return true
  }
  if(kind==='hazerDF50'){
    const st=(typeof stageForFrontSubs==='function'&&stageForFrontSubs())||(typeof stage!=='undefined'?stage:null);
    if(st){const sb=objectBoundsWorld(st).b;root.position.x=sb.min.x+.36;root.position.z=sb.max.z-.34;moveRootBottomToY(root,sb.max.y+.006)}else moveRootBottomToY(root,mainFloorLevel()+.006);
    if(announce)flashEditor('Hazer moved to stage corner');
    return true
  }
  if(kind==='blinderPar'){
    const st=(typeof stageForFrontSubs==='function'&&stageForFrontSubs())||(typeof stage!=='undefined'?stage:null);
    if(st)moveRootBottomToY(root,objectBoundsWorld(st).b.max.y+.006);else moveRootBottomToY(root,mainFloorLevel()+.006);
    if(announce)flashEditor('Blinder snapped to nearest stage / surface height');
    return true
  }
  if(mount==='floor'){
    moveRootBottomToY(root,mainFloorLevel()+.006);
    if(announce)flashEditor(lightingFixtureLabel(kind)+' snapped to floor level');
    return true
  }
  moveRootBottomToY(root,mainFloorLevel()+.006);
  if(announce)flashEditor(lightingFixtureLabel(kind)+' snapped to surface');
  return true
}
function fixtureLensMaterials(hex,enabled){const ringMat=new THREE.MeshStandardMaterial({color:0xd9dde3,roughness:.36,metalness:.96});const faceMat=new THREE.MeshStandardMaterial({color:enabled?new THREE.Color(hex).clone().lerp(new THREE.Color('#ffffff'),.28):0x8a8f97,emissive:enabled?new THREE.Color(hex):new THREE.Color(0x000000),emissiveIntensity:enabled?1.4:0,roughness:.24,metalness:.16});return {ringMat,faceMat}}
function addFixtureLens(parent,x,y,z,r,hex,enabled,depth=.028){const mats=fixtureLensMaterials(hex,enabled);const ring=new THREE.Mesh(new THREE.CylinderGeometry(r*1.08,r*1.08,depth,18),mats.ringMat);ring.rotation.x=Math.PI/2;ring.position.set(x,y,z);parent.add(ring);const face=new THREE.Mesh(new THREE.CylinderGeometry(r*.88,r*.88,depth*.46,18),mats.faceMat);face.rotation.x=Math.PI/2;face.position.set(x,y,z+depth*.36);face.userData.fixtureGlow=true;parent.add(face);return face}
function addFixtureSpot(parent,data,origin,dir,cone=.35){const spot=new THREE.SpotLight(data.lightColor||'#ffffff',0,data.range||6,THREE.MathUtils.degToRad(data.beamAngle||30),cone,1.2);spot.position.copy(origin);spot.userData.fixtureLight=true;configureRoomOccludedLight(spot,256);const targetObj=new THREE.Object3D();targetObj.position.copy(dir.clone().normalize().multiplyScalar(Math.max(1.2,data.range||6)));targetObj.userData.fixtureTarget=true;parent.add(targetObj);spot.target=targetObj;parent.add(spot);return spot}
function applyLightingFixtureAppearance(root){
  if(!isLightingFixtureRoot(root))return;const d=normaliseLightingFixtureData(root.userData.assetData||{});root.userData.assetData=d;const colour=new THREE.Color(d.lightColor||'#ffffff');
  root.traverse(obj=>{
    if(obj.userData&&obj.userData.fixtureGlow&&obj.material){if(obj.material.color)obj.material.color.copy(d.enabled?colour.clone().lerp(new THREE.Color('#ffffff'),.28):new THREE.Color(0x8a8f97));if(obj.material.emissive)obj.material.emissive.copy(d.enabled?colour:new THREE.Color(0x000000));if('emissiveIntensity' in obj.material)obj.material.emissiveIntensity=d.enabled?(0.42+d.brightness*.42):0;obj.material.needsUpdate=true}
    if(obj.isLight&&obj.userData&&obj.userData.fixtureLight){if(obj.color&&!obj.userData.sunsetAccent)obj.color.copy(colour);obj.visible=!!d.enabled;obj.intensity=d.enabled?(kindLightIntensity(d.kind,d.brightness)):0;if(obj.userData.strobeLight)obj.intensity=0;if(obj.isSpotLight){obj.distance=d.range||6;obj.angle=THREE.MathUtils.degToRad(d.beamAngle||30)}configureRoomOccludedLight(obj,obj.isPointLight?128:256)}
    if(obj.userData&&obj.userData.hazePlume&&obj.material){obj.visible=d.enabled!==false&&d.kind==='hazerDF50';if(obj.material.color)obj.material.color.set(0xe7efff);if(obj.material.emissive)obj.material.emissive.set(0xe7efff);if('emissiveIntensity' in obj.material)obj.material.emissiveIntensity=d.enabled?(0.05+d.hazeAmount*.04):0;obj.material.opacity=d.enabled?Math.min(.42,.06+d.hazeAmount*.045):0;obj.material.needsUpdate=true}
  });
  markRenderDirty()
}
function kindLightIntensity(kind,brightness){const b=Math.max(0,+brightness||0);return ({ledBatten:0.20+b*.85,ledPar:0.25+b*.95,blinderPar:0.35+b*1.1,intimidator:0.30+b*1.35,movingMirrorScanner:0.24+b*1.15,hazerDF50:0,warmParCan:0.30+b*.95,strobeFixture:0.45+b*1.20,downlightFixture:0.16+b*.72,sunsetProjector:0.22+b*.72,ceilingTubeLight:0.16+b*.58}[kind]||b)}
function rebuildLightingFixtureObject(g){
  if(!isLightingFixtureRoot(g))return;const d=normaliseLightingFixtureData(g.userData.assetData||{});g.userData.assetData=d;clearGroupChildren(g);
  const bodyMat=assetMat(0x101317,.8,.08),accentMat=assetMat(0x242a33,.55,.22),trimMat=assetMat(0x07090b,.92,.12),mirrorMat=assetMat(0xdce1e8,.18,.95),rig=new THREE.Group();g.add(rig);if(d.kind==='intimidator'||d.kind==='movingMirrorScanner')rig.scale.setScalar(.70);
  if(d.kind==='ledBatten'){
    const len=1.46,h=.12,dep=.11;addAssetBox(rig,len,h,dep,0,0,0,bodyMat);addAssetBox(rig,.08,h+.05,dep+.03,-len/2+.03,0,0,accentMat);addAssetBox(rig,.08,h+.05,dep+.03,len/2-.03,0,0,accentMat);
    const cols=18,step=(len-.18)/(cols-1);for(let i=0;i<cols;i++){const x=-len/2+.09+i*step;addFixtureLens(rig,x,.022,dep/2+.004,.027,d.lightColor,d.enabled,.026);addFixtureLens(rig,x,-.022,dep/2+.004,.027,d.lightColor,d.enabled,.026)}
    if(d.orientation==='vertical')rig.rotation.z=Math.PI/2;addFixtureSpot(rig,d,new THREE.Vector3(0,0,dep/2+.03),new THREE.Vector3(0,0,1),.45)
  }else if(d.kind==='ledPar'){
    const head=new THREE.Group();rig.add(head);addAssetBox(head,.10,.08,.12,0,-.03,0,accentMat);addAssetBox(head,.40,.06,.06,0,-.02,-.10,trimMat);const body=new THREE.Mesh(new THREE.CylinderGeometry(.23,.26,.20,28),bodyMat);body.rotation.x=Math.PI/2;body.position.set(0,-.18,0);head.add(body);addAssetBox(head,.035,.34,.04,-.19,-.14,0,accentMat);addAssetBox(head,.035,.34,.04,.19,-.14,0,accentMat);const lensRows=4,lensCols=4,sp=.11;for(let r=0;r<lensRows;r++)for(let c=0;c<lensCols;c++){addFixtureLens(head,(c-(lensCols-1)/2)*sp,-.18+(r-(lensRows-1)/2)*sp,.105,.040,d.lightColor,d.enabled,.03)}addFixtureSpot(head,d,new THREE.Vector3(0,-.18,.12),new THREE.Vector3(0,-1,0),.42)
  }else if(d.kind==='blinderPar'){
    const w=.72,h=.78,dep=.16;addAssetBox(rig,w,h,dep,0,h/2,0,bodyMat);addAssetBox(rig,w,.10,dep+.04,0,.05,0,trimMat);const xs=[-.18,.18],ys=[.24,.54];ys.forEach(y=>xs.forEach(x=>{addFixtureLens(rig,x,y,dep/2+.006,.115,d.lightColor,d.enabled,.045)}));addAssetBox(rig,.05,.72,.05,-w/2+.04,h/2,0,accentMat);addAssetBox(rig,.05,.72,.05,w/2-.04,h/2,0,accentMat);addFixtureSpot(rig,d,new THREE.Vector3(0,.46,dep/2+.04),new THREE.Vector3(0,.10,1),.52)
  }else if(d.kind==='intimidator'){
    addAssetBox(rig,.26,.08,.22,0,-.03,0,trimMat);addAssetBox(rig,.24,.24,.22,0,-.16,0,bodyMat);addAssetBox(rig,.06,.68,.06,-.18,-.40,0,accentMat);addAssetBox(rig,.06,.68,.06,.18,-.40,0,accentMat);const head=new THREE.Group();head.position.set(0,-.55,0);head.userData.dynamicMovingHead=true;head.userData.dynamicBaseRotation=[0,0,0];rig.add(head);addAssetBox(head,.32,.42,.42,0,0,0,bodyMat);const nose=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.20,22),bodyMat);nose.rotation.x=Math.PI/2;nose.position.set(0,-.03,.24);head.add(nose);addFixtureLens(head,0,-.03,.34,.095,d.lightColor,d.enabled,.04);addFixtureSpot(head,d,new THREE.Vector3(0,-.03,.34),new THREE.Vector3(.16,-.72,.68),.22)
  }else if(d.kind==='movingMirrorScanner'){
    addAssetBox(rig,.26,.08,.22,0,-.03,0,trimMat);const body=new THREE.Group();body.position.set(0,-.26,0);body.userData.dynamicScannerBody=true;body.userData.dynamicBaseRotation=[0,0,0];rig.add(body);addAssetBox(body,.34,.46,.34,0,0,0,bodyMat);addFixtureLens(body,0,.09,.18,.075,d.lightColor,d.enabled,.03);addFixtureLens(body,0,-.09,.18,.075,d.lightColor,d.enabled,.03);const mirror=new THREE.Mesh(new THREE.BoxGeometry(.18,.10,.02),mirrorMat);mirror.position.set(0,.14,.22);mirror.rotation.x=-.65;mirror.userData.dynamicScannerMirror=true;mirror.userData.dynamicBaseRotation=[-.65,0,0];body.add(mirror);addAssetBox(body,.15,.03,.11,0,.22,.17,accentMat);addFixtureSpot(body,d,new THREE.Vector3(0,.12,.25),new THREE.Vector3(.24,-.46,.86),.16)
  }else if(d.kind==='warmParCan'){
    const silver=new THREE.MeshStandardMaterial({color:0xbfc5ca,roughness:.24,metalness:.92}),dark=assetMat(0x101216,.58,.35);const can=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,.30,24,1,true),silver);can.rotation.x=Math.PI/2;can.position.set(0,0,.12);rig.add(can);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.055,8),silver);rim.rotation.x=Math.PI/2;rim.position.set(0,0,.285);rig.add(rim);addFixtureLens(rig,0,0,.318,.13,d.lightColor,d.enabled,.035);addAssetBox(rig,.035,.34,.035,-.18,.08,.08,dark);addAssetBox(rig,.035,.34,.035,.18,.08,.08,dark);addAssetBox(rig,.39,.035,.035,0,.25,.08,dark);const knob=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.05,14),dark);knob.rotation.z=Math.PI/2;knob.position.set(-.205,.06,.08);rig.add(knob);addFixtureSpot(rig,d,new THREE.Vector3(0,0,.34),new THREE.Vector3(0,-.08,1),.38)
  }else if(d.kind==='strobeFixture'){
    const w=.62,h=.34,dep=.13;addAssetBox(rig,w,h,dep,0,-h/2,0,bodyMat);addAssetBox(rig,w*.90,h*.70,.018,0,-h/2,dep/2+.012,accentMat);const rows=5,cols=12,sx=.041,sy=.045;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=(c-(cols-1)/2)*sx,y=-h/2+(r-(rows-1)/2)*sy;const p=new THREE.Mesh(new THREE.BoxGeometry(.024,.024,.012),new THREE.MeshStandardMaterial({color:0xe9edf2,emissive:0xffffff,emissiveIntensity:d.enabled?.6:0,roughness:.38}));p.position.set(x,y,dep/2+.026);p.userData.fixtureGlow=true;rig.add(p)}addAssetBox(rig,.12,.10,.06,-.14,.035,0,trimMat);addAssetBox(rig,.06,.10,.06,.12,.035,0,trimMat);addAssetBox(rig,.06,.10,.06,.22,.035,0,trimMat);const spot=addFixtureSpot(rig,d,new THREE.Vector3(0,-h/2,dep/2+.04),new THREE.Vector3(0,-.35,1),.56);spot.userData.strobeLight=true
  }else if(d.kind==='downlightFixture'){
    const ringMat=new THREE.MeshStandardMaterial({color:0xe8ebee,roughness:.46,metalness:.18}),innerMat=new THREE.MeshStandardMaterial({color:d.enabled?d.lightColor:0xc8ccd1,emissive:d.enabled?d.lightColor:0x000000,emissiveIntensity:d.enabled?.7:0,roughness:.48});const ring=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.018,32),ringMat);ring.position.y=-.009;rig.add(ring);const inner=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.020,32),innerMat);inner.position.y=-.019;inner.userData.fixtureGlow=true;rig.add(inner);addFixtureSpot(rig,d,new THREE.Vector3(0,-.035,0),new THREE.Vector3(0,-1,0),.50)
  }else if(d.kind==='sunsetProjector'){
    const black=assetMat(0x0d0f12,.72,.18),metal=assetMat(0x31363d,.36,.72);const base=new THREE.Mesh(new THREE.CylinderGeometry(.17,.18,.035,28),black);base.position.y=.018;rig.add(base);addAssetBox(rig,.035,.55,.035,0,.31,0,metal);const head=new THREE.Group();head.position.set(0,.59,0);head.rotation.x=-.18;rig.add(head);const outer=new THREE.Mesh(new THREE.CylinderGeometry(.115,.125,.085,28),black);outer.rotation.x=Math.PI/2;head.add(outer);addFixtureLens(head,0,0,.055,.082,d.lightColor,d.enabled,.03);const baseColor=new THREE.Color(d.lightColor||'#ff7447'),hsl={h:0,s:0,l:0};baseColor.getHSL(hsl);const colors=[baseColor,new THREE.Color().setHSL((hsl.h+.13)%1,Math.max(.72,hsl.s),Math.min(.68,Math.max(.45,hsl.l))),new THREE.Color().setHSL((hsl.h+.88)%1,Math.max(.72,hsl.s),Math.min(.68,Math.max(.45,hsl.l)))];const dirs=[new THREE.Vector3(0,.08,1),new THREE.Vector3(-.18,.12,1),new THREE.Vector3(.18,.04,1)];colors.forEach((c,i)=>{const sd={...d,lightColor:'#'+c.getHexString(),brightness:d.brightness*(i===0?1:.68),beamAngle:i===0?58:72,range:d.range};const sp=addFixtureSpot(head,sd,new THREE.Vector3(0,0,.085),dirs[i],.72);sp.userData.sunsetAccent=true})
  }else if(d.kind==='ceilingTubeLight'){
    const len=1.18,r=.025,capMat=assetMat(0xd8dce1,.42,.55),tubeMat=new THREE.MeshStandardMaterial({color:d.enabled?d.lightColor:0xe7e9ec,emissive:d.enabled?d.lightColor:0x000000,emissiveIntensity:d.enabled?(0.22+d.brightness*.22):0,roughness:.36,metalness:.04});const tube=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,18),tubeMat);tube.rotation.z=Math.PI/2;tube.position.y=-.035;tube.userData.fixtureGlow=true;rig.add(tube);[-len/2,len/2].forEach(x=>{const cap=new THREE.Mesh(new THREE.CylinderGeometry(r*1.15,r*1.15,.045,16),capMat);cap.rotation.z=Math.PI/2;cap.position.set(x,-.035,0);rig.add(cap)});[-.36,0,.36].forEach(x=>{const pl=new THREE.PointLight(d.lightColor,d.enabled?(0.06+d.brightness*.18):0,Math.max(1.5,d.range),2);pl.position.set(x,-.09,0);pl.userData.fixtureLight=true;rig.add(pl)});addFixtureSpot(rig,d,new THREE.Vector3(0,-.08,0),new THREE.Vector3(0,-1,0),.72)
  }else if(d.kind==='hazerDF50'){
    const w=.44,h=.52,dep=.38;addAssetBox(rig,w,h,dep,0,h/2,0,bodyMat);addAssetBox(rig,.14,.04,.05,0,h+.02,0,accentMat);const handle=new THREE.Mesh(new THREE.TorusGeometry(.06,.012,12,18,Math.PI),accentMat);handle.rotation.z=Math.PI;handle.position.set(0,h+.045,0);rig.add(handle);addAssetBox(rig,.09,.09,.05,-w/2+.05,.10,-dep/2+.02,trimMat);addAssetBox(rig,.12,.12,.04,w/2-.06,.16,dep/2+.015,accentMat);const grille=new THREE.Mesh(new THREE.PlaneGeometry(.18,.16),new THREE.MeshStandardMaterial({color:0x272d35,roughness:.85,metalness:.08}));grille.position.set(-w/2+.03,.16,dep/2+.021);rig.add(grille);const plume=new THREE.Mesh(new THREE.ConeGeometry(.18,.65,18,1,true),new THREE.MeshStandardMaterial({color:0xe7efff,emissive:0xe7efff,emissiveIntensity:0,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));plume.position.set(w/2-.02,.20,dep/2+.26);plume.rotation.z=-Math.PI/2;plume.userData.hazePlume=true;rig.add(plume)
  }
  applyLightingFixtureAppearance(g);g.updateMatrixWorld(true)
}
function createLightingFixtureObject(kind,opts={}){const g=new THREE.Group();g.position.set(opts.x??target.x,opts.y??mainFloorLevel(),opts.z??target.z);g.userData.assetData=normaliseLightingFixtureData({kind,...opts});g.userData.colorOverride=opts.color||'#101317';g.userData.preserveDetailColours=true;venue.add(g);registerBuilderRoot(g,opts.name||lightingFixtureLabel(kind),'fixtureAsset',opts.id);rebuildLightingFixtureObject(g);const shouldAutoMount=opts.autoMount!==false&&!Number.isFinite(+opts.y);if(shouldAutoMount&&(lightingFixtureMount(kind)==='ceiling'||lightingFixtureMount(kind)==='floor'||kind==='blinderPar'||kind==='hazerDF50'))snapLightingFixtureToMount(g,false);return g}
function createLedBattenObject(opts={}){return createLightingFixtureObject('ledBatten',opts)}
function createLedParObject(opts={}){return createLightingFixtureObject('ledPar',opts)}
function createBlinderParObject(opts={}){return createLightingFixtureObject('blinderPar',opts)}
function createIntimidatorFixtureObject(opts={}){return createLightingFixtureObject('intimidator',opts)}
function createMovingMirrorScannerObject(opts={}){return createLightingFixtureObject('movingMirrorScanner',opts)}
function createHazerDF50Object(opts={}){return createLightingFixtureObject('hazerDF50',opts)}
function createWarmParCanObject(opts={}){return createLightingFixtureObject('warmParCan',{...opts,lightColor:'#ffd49a'})}
function createStrobeFixtureObject(opts={}){return createLightingFixtureObject('strobeFixture',{...opts,lightColor:'#ffffff'})}
function createDownlightFixtureObject(opts={}){return createLightingFixtureObject('downlightFixture',opts)}
function createSunsetProjectorObject(opts={}){return createLightingFixtureObject('sunsetProjector',{lightColor:'#ff7447',...opts})}
function createCeilingTubeLightObject(opts={}){return createLightingFixtureObject('ceilingTubeLight',opts)}
let lightFixtureUIBusy=false,lightFixtureHistoryArmed=false;
function lightFixtureInputs(){return {box:document.getElementById('lightFixtureBox'),status:document.getElementById('lightFixtureStatus'),enabled:document.getElementById('lightFixtureEnabled'),colourField:document.getElementById('lightFixtureColourField'),color:document.getElementById('lightFixtureColor'),brightness:document.getElementById('lightFixtureBrightness'),brightnessNumber:document.getElementById('lightFixtureBrightnessNumber'),beamField:document.getElementById('lightFixtureBeamField'),beam:document.getElementById('lightFixtureBeam'),beamNumberField:document.getElementById('lightFixtureBeamNumberField'),beamNumber:document.getElementById('lightFixtureBeamNumber'),orientationRow:document.getElementById('lightFixtureOrientationRow'),orientation:document.getElementById('lightFixtureOrientation'),mountReadout:document.getElementById('lightFixtureMountReadout'),mountButton:document.getElementById('applySelectedLightFixtureMount'),turnOff:document.getElementById('lightFixtureTurnOff'),note:document.getElementById('lightFixtureNote'),brightnessLabel:document.getElementById('lightFixtureBrightnessLabel'),brightnessNumberLabel:document.getElementById('lightFixtureBrightnessNumberLabel'),beamLabel:document.getElementById('lightFixtureBeamLabel'),beamNumberLabel:document.getElementById('lightFixtureBeamNumberLabel')}}
function syncLightFixtureUI(){const ui=lightFixtureInputs();if(!ui.box)return;const active=isLightingFixtureRoot(selectedEdit);ui.box.style.display=active?'block':'none';if(!active){lightFixtureUIBusy=false;return}const d=normaliseLightingFixtureData(selectedEdit.userData.assetData||{}),kind=d.kind;lightFixtureUIBusy=true;if(ui.status)ui.status.textContent=selectedEdit.userData.editName||lightingFixtureLabel(kind);if(ui.enabled)ui.enabled.checked=d.enabled!==false;if(ui.color)ui.color.value=d.lightColor||'#ffffff';if(ui.brightness)ui.brightness.value=String(kind==='hazerDF50'?(d.hazeAmount??d.brightness):d.brightness);if(ui.brightnessNumber)ui.brightnessNumber.value=(kind==='hazerDF50'?(d.hazeAmount??d.brightness):d.brightness).toFixed(2);const beamValue=kind==='strobeFixture'?(d.strobeRate||8):(d.beamAngle||30);if(ui.beam){ui.beam.min=kind==='strobeFixture'?'1':'6';ui.beam.max=kind==='strobeFixture'?'20':'85';ui.beam.step=kind==='strobeFixture'?'1':'1';ui.beam.value=String(beamValue)}if(ui.beamNumber){ui.beamNumber.min=kind==='strobeFixture'?'1':'6';ui.beamNumber.max=kind==='strobeFixture'?'20':'85';ui.beamNumber.step=kind==='strobeFixture'?'1':'1';ui.beamNumber.value=String(Math.round(beamValue))}if(ui.colourField)ui.colourField.style.display=lightingFixtureSupportsColour(kind)?'grid':'none';if(ui.beamField)ui.beamField.style.display=kind==='hazerDF50'?'none':'grid';if(ui.beamNumberField)ui.beamNumberField.style.display=kind==='hazerDF50'?'none':'grid';if(ui.orientationRow)ui.orientationRow.style.display=kind==='ledBatten'?'grid':'none';if(ui.orientation)ui.orientation.value=d.orientation==='vertical'?'vertical':'horizontal';if(ui.mountReadout)ui.mountReadout.textContent=lightingFixtureMount(kind).toUpperCase()+' MOUNT';if(ui.mountButton)ui.mountButton.textContent=lightFixtureMountButtonLabel(kind);if(ui.brightnessLabel)ui.brightnessLabel.textContent=kind==='hazerDF50'?'OUTPUT':'BRIGHTNESS';if(ui.brightnessNumberLabel)ui.brightnessNumberLabel.textContent=kind==='hazerDF50'?'OUTPUT #':'BRIGHTNESS #';if(ui.beamLabel)ui.beamLabel.textContent=kind==='strobeFixture'?'FLASH RATE':kind==='movingMirrorScanner'?'BEAM':'SPREAD';if(ui.beamNumberLabel)ui.beamNumberLabel.textContent=kind==='strobeFixture'?'FLASH RATE #':kind==='movingMirrorScanner'?'BEAM #':'SPREAD #';if(ui.note)ui.note.textContent=lightFixtureNote(kind);lightFixtureUIBusy=false}
function armLightFixtureHistory(){if(lightFixtureHistoryArmed||!isLightingFixtureRoot(selectedEdit))return;pushHistory();lightFixtureHistoryArmed=true}
function releaseLightFixtureHistory(){lightFixtureHistoryArmed=false}
function applyLightFixtureSettingsFromUI(key='all'){if(lightFixtureUIBusy||!isLightingFixtureRoot(selectedEdit))return;const ui=lightFixtureInputs(),d=normaliseLightingFixtureData(selectedEdit.userData.assetData||{}),kind=d.kind;d.enabled=!!(ui.enabled&&ui.enabled.checked);if(lightingFixtureSupportsColour(kind)&&ui.color)d.lightColor=ui.color.value||'#ffffff';if(kind==='warmParCan')d.lightColor='#ffd49a';if(kind==='strobeFixture')d.lightColor='#ffffff';const brightness=Math.max(0,Math.min(8,+(ui.brightnessNumber&&ui.brightnessNumber.value||ui.brightness&&ui.brightness.value)||0));if(kind==='hazerDF50'){d.hazeAmount=brightness;d.brightness=brightness}else d.brightness=brightness;if(kind==='strobeFixture')d.strobeRate=Math.max(1,Math.min(20,+(ui.beamNumber&&ui.beamNumber.value||ui.beam&&ui.beam.value)||8));else if(kind!=='hazerDF50'){d.beamAngle=Math.max(6,Math.min(85,+(ui.beamNumber&&ui.beamNumber.value||ui.beam&&ui.beam.value)||d.beamAngle||30))}if(kind==='ledBatten'&&ui.orientation)d.orientation=ui.orientation.value==='vertical'?'vertical':'horizontal';selectedEdit.userData.assetData=d;if(ui.brightness)ui.brightness.value=String(brightness);if(ui.brightnessNumber)ui.brightnessNumber.value=brightness.toFixed(2);if(ui.beam&&kind!=='hazerDF50')ui.beam.value=String(kind==='strobeFixture'?d.strobeRate:d.beamAngle);if(ui.beamNumber&&kind!=='hazerDF50')ui.beamNumber.value=String(Math.round(kind==='strobeFixture'?d.strobeRate:d.beamAngle));rebuildLightingFixtureObject(selectedEdit);updateSelectionBox();updateEditorSelected();saveLocalEditState(false);syncLightFixtureUI()}


let v206ConcreteTextureCache=null;
function v206ConcreteTexture(){
  if(v206ConcreteTextureCache)return v206ConcreteTextureCache;

  const size=192;
  const c=document.createElement('canvas');
  c.width=c.height=size;
  const ctx=c.getContext('2d');

  // Base cement tone.
  ctx.fillStyle='#8f8f8f';
  ctx.fillRect(0,0,size,size);

  // Fine aggregate / sand grain.
  const img=ctx.getImageData(0,0,size,size);
  const data=img.data;
  let seed=18437;
  const rnd=()=>{
    seed=(seed*1664525+1013904223)>>>0;
    return seed/4294967296
  };
  for(let i=0;i<data.length;i+=4){
    const n=(rnd()-.5)*46;
    const coarse=rnd()<.055?(rnd()-.5)*72:0;
    const v=Math.max(72,Math.min(184,143+n+coarse));
    data[i]=data[i+1]=data[i+2]=v;
    data[i+3]=255;
  }
  ctx.putImageData(img,0,0);

  // Broad trowel sweeps / render ridges.
  ctx.globalAlpha=.18;
  ctx.lineCap='round';
  for(let i=0;i<46;i++){
    const y=rnd()*size;
    const x=-30+rnd()*40;
    const len=size*(.28+rnd()*.70);
    const rise=(rnd()-.5)*34;
    ctx.strokeStyle=rnd()>.48?'#d5d5d5':'#545454';
    ctx.lineWidth=1.5+rnd()*5.5;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.bezierCurveTo(
      x+len*.28,y+rise,
      x+len*.68,y-rise*.7,
      x+len,y+(rnd()-.5)*18
    );
    ctx.stroke();
  }

  // Small chipped pits.
  ctx.globalAlpha=.26;
  for(let i=0;i<160;i++){
    const x=rnd()*size,y=rnd()*size;
    const rx=.6+rnd()*3.4,ry=.5+rnd()*2.3;
    ctx.fillStyle=rnd()>.5?'#525252':'#c2c2c2';
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;

  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.colorSpace=THREE.SRGBColorSpace||tex.colorSpace;
  tex.needsUpdate=true;

  v206ConcreteTextureCache=tex;
  return tex
}

