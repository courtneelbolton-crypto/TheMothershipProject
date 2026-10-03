/* Spatial Panel System — cursor-follow, tilt, scroll-depth interactions */
(function(){
  const reduceMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const isTouch=window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  function initSpatialPanels(){
    if(reduceMotion||isTouch)return;
    const panels=document.querySelectorAll('.spatial-panel');
    panels.forEach(panel=>{
      const hover=panel.dataset.hover;
      if(hover==='tilt'||hover==='cursor-follow'){
        panel.addEventListener('pointermove',e=>{
          const r=panel.getBoundingClientRect();
          const px=(e.clientX-r.left)/r.width-0.5;
          const py=(e.clientY-r.top)/r.height-0.5;
          panel.style.setProperty('--sp-tilt-x',(py*-8)+'deg');
          panel.style.setProperty('--sp-tilt-y',(px*8)+'deg');
          if(hover==='cursor-follow'){
            panel.style.setProperty('--sp-cursor-x',String(px));
            panel.style.setProperty('--sp-cursor-y',String(py));
          }
        });
        panel.addEventListener('pointerleave',()=>{
          panel.style.setProperty('--sp-tilt-x','0deg');
          panel.style.setProperty('--sp-tilt-y','0deg');
          panel.style.setProperty('--sp-cursor-x','0');
          panel.style.setProperty('--sp-cursor-y','0');
        });
      }
      if(hover==='image-pan'){
        panel.addEventListener('pointermove',e=>{
          const r=panel.getBoundingClientRect();
          panel.style.setProperty('--sp-cursor-x',String((e.clientX-r.left)/r.width-0.5));
          panel.style.setProperty('--sp-cursor-y',String((e.clientY-r.top)/r.height-0.5));
        });
        panel.addEventListener('pointerleave',()=>{
          panel.style.setProperty('--sp-cursor-x','0');
          panel.style.setProperty('--sp-cursor-y','0');
        });
      }
    });

    /* Scroll-depth: background panels drift slightly on scroll */
    const scrollPanels=document.querySelectorAll('.sp-scroll-panel[data-layer="background"]');
    if(scrollPanels.length){
      let ticking=false;
      window.addEventListener('scroll',()=>{
        if(!ticking){
          requestAnimationFrame(()=>{
            const y=window.scrollY||0;
            scrollPanels.forEach(p=>{
              const r=p.getBoundingClientRect();
              const vp=(r.top+r.height/2)/window.innerHeight;
              const offset=(vp-0.5)*-14;
              p.style.transform='perspective(900px) translateY('+offset+'px)';
            });
            ticking=false;
          },{passive:true});
          ticking=true;
        }
      },{passive:true});
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initSpatialPanels);
  }else{
    initSpatialPanels();
  }
  window.__initSpatialPanels=initSpatialPanels;
})();
