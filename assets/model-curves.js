'use strict';
(async()=>{
 const $=id=>document.getElementById(id),col=['#edc776','#77d6cb','#c7b3eb'];
 function plot(id,series,unit,yLabel='percentile /100'){
  const all=series.flatMap(s=>s.points),lo=Math.min(...all.map(p=>p[0])),hi=Math.max(...all.map(p=>p[0])),ymax=Math.max(1,...all.map(p=>p[1]));
  const x=v=>42+(v-lo)/(hi-lo||1)*330,y=v=>178-v/ymax*155;
  const n=v=>Math.abs(v)>=1000?Math.round(v).toLocaleString():Number(v.toFixed(1));
  $(id).innerHTML=`<svg viewBox="0 0 400 220" role="img" aria-label="${id}: ${unit} against ${yLabel}"><path d="M42 20V178H375" fill="none" stroke="#99aabb"/><text x="3" y="25">${n(ymax)}</text><text x="15" y="181">0</text><text x="42" y="199">${n(lo)} ${unit}</text><text x="372" y="199" text-anchor="end">${n(hi)} ${unit}</text>${series.map((s,i)=>`<path d="${s.points.map((p,j)=>(j?'L':'M')+x(p[0]).toFixed(2)+','+y(p[1]).toFixed(2)).join('')}" fill="none" stroke="${col[i%col.length]}" stroke-width="2"/>`).join('')}</svg><small>${series.map((s,i)=>`<span style="color:${col[i%col.length]}">${s.name}</span>`).join(' · ')} · y: ${yLabel}</small>`;
 }
 const points=(end,fn,start=0)=>Array.from({length:181},(_,i)=>{const x=start+(end-start)*i/180;return[x,fn(x)]});
 plot('heightReach',[{name:'Solar elevation 56.65°',points:points(300,h=>h/Math.tan(56.65410279*Math.PI/180))}],'m height','shadow reach (m)');
 plot('angleReach',[{name:'Height 100 m',points:points(85,a=>100/Math.tan(a*Math.PI/180),5)}],'° elevation','shadow reach (m)');
 plot('distanceWeights',[50,100,150].map(r=>({name:r+' m radius',points:points(r,d=>100*Math.exp(-2*(d/r)**2))})),'m distance','weight ×100');
 try{const response=await fetch('./assets/model-curves.json?v=sunlit-1');if(!response.ok)throw Error('download');const data=await response.json();const curves=data.reference,asSeries=(name,knots)=>({name,points:knots.map(([x,y])=>[x,100*y])});
  function heat(){const rad=$('modelRadius').value;plot('heatCurves',[asSeries('Original',curves.heat[rad+'_true']),asSeries('Sun-exposed',curves.heat[rad+'_sunlit'])],'°C');}
  heat();$('modelRadius').onchange=heat;
  for(const [id,key,label,unit]of [['incomeCurve','income','Low-income share','%'],['heightCurve','height','Height','m'],['areaCurve','area','Footprint','m²'],['buildingCurve','building','Mean relative height / area','fraction']])plot(id,[asSeries(label,curves[key])],unit);
  $('curveStatus').textContent=curves.n.toLocaleString()+' buildings in the reference cohort';
 }catch{$('curveStatus').textContent='Reference curves could not load. Reload to retry; equations remain available.';}
})();
