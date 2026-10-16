 'use strict';
window.HeatArea=(()=>{
 let index=null,indexLoad=null,redraw=()=>{},selected=null,radius=100;
 const cache=new Map(),loads=new Map(),failures=new Set();
 const f=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'Unavailable';
 const key=()=>index?.buildings?.[selected?.building_id];
 const current=()=>cache.get(key())?.buildings?.[selected?.building_id]?.[radius];
 function status(){
  const v=current(),file=key(),failed=failures.has(file||'index'),el=document.getElementById('heatShapeStatus'),legend=document.getElementById('samplingLegend'),canvas=document.getElementById('city');
  const msg=!selected?'Select a building to display its multi-day sunlit sampling area.':failed?'Sampling overlay unavailable. Retry the display download; scores are unchanged.':v?`${v.dates.length}/9 accepted dates. Gold: ground sun-exposed on every accepted date. Pale gold: on some dates. Display geometry only; not temperature colours or a cloud-valid pixel mask.`:'Loading multi-day sampling geometry…';
  if(el)el.textContent=msg;document.getElementById('retryHeatShapes').hidden=!failed;
  if(legend){legend.hidden=!selected;legend.innerHTML=v?`<strong>Sunlit sampling · ${radius} m · ${v.dates.length}/9 dates</strong><span class="sample-chip"></span>All accepted dates &nbsp; <span class="sample-chip some"></span>Some dates<small>Geometry only; colour is not temperature.${v.dates.length<3?' Fewer than 3 dates: insufficient recent heat.':''}</small>`:msg;}
  if(canvas){canvas.dataset.heatOverlayState=!selected?'none':failed?'unavailable':v?'ready':'loading';canvas.dataset.heatOverlayDates=v?.dates.length??'';canvas.dataset.heatOverlayPolygons=v?.any.length??'';}
 }
 async function ensure(){
  if(!selected)return;
  if(!index){if(failures.has('index'))return;if(!indexLoad)indexLoad=fetch('./assets/heat-summary-index.json?v=adjustable-1').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>index=d).catch(()=>failures.add('index')).finally(()=>{indexLoad=null;status();redraw();});await indexLoad;if(!index)return;}
  const file=key();if(!file||cache.has(file)||loads.has(file)||failures.has(file))return;
  const task=(async()=>{try{const r=await fetch('./assets/'+file,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error();const data=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();cache.set(file,data);while(cache.size>8)cache.delete(cache.keys().next().value);}catch{failures.add(file);}finally{loads.delete(file);status();redraw();}})();loads.set(file,task);await task;
 }
 function init(render){redraw=render;document.getElementById('retryHeatShapes').onclick=()=>{failures.delete(key()||'index');ensure();status();};}
 function setDataset(){/* Source dates stay fixed; this overlay summarizes accepted dated masks. */}
 function selection(r,rad){selected=r||null;radius=rad;status();}
 function draw(ctx,polygon,r,rad){
  const v=current();if(!v){ensure();return false;}
  ctx.save();ctx.fillStyle='#efc46b40';ctx.strokeStyle='#d9bc7890';ctx.lineWidth=.8;
  for(const rings of v.any){const p=polygon(rings,0);ctx.fill(p,'evenodd');ctx.stroke(p);}
  ctx.fillStyle='#f5cf727a';ctx.strokeStyle='#ffe7a3';ctx.lineWidth=1.1;
  for(const rings of v.all){const p=polygon(rings,0);ctx.fill(p,'evenodd');ctx.stroke(p);}
  ctx.restore();return true;
 }
 function panel(r,dataset,radius){const el=document.getElementById('heatEvidence');if(!el)return;if(!r){el.innerHTML='<p>Select a building to see its heat evidence and the observations supporting it.</p>';return;}const z=r.heatSeries?.[dataset.id]?.[radius];el.innerHTML=`<div class="heat-metrics"><span><b>${f(r.temp)}°C</b>surface statistic</span><span><b>${f(z?.valid_pct)}%</b>valid sampling area</span><span><b>${f(z?.pixels,0)}</b>resampled grid cells</span></div><p class="heat-note">${z?.date_count!==undefined?`${z.date_count} of 9 dates contribute; median of valid per-date values. Coverage and cell counts below are minima across contributing dates. `:''}${f(z?.area_m2,0)} m² sampled · ${f(z?.weighted_valid_pct)}% valid weight. ${z?.uncertainty_mean_K!=null?`Mean pixel uncertainty ${f(z.uncertainty_mean_K,2)} K; this is not uncertainty of the building mean.`:'No comparable uncertainty band is supplied for this summary.'}</p><p class="heat-note">${f(z?.native_thermal_area_equivalents,2)} × 100 m-square areas. This geometric size check is not a count of independent thermal observations. A 50 m extent can still be poorly resolved.</p>`;}
 return {init,draw,panel,status,setDataset,selection};
})();
