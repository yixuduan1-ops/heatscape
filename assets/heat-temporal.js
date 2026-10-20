(function(root){
 'use strict';
 const M=typeof module!=='undefined'?require('./hib.js'):root.HeatModel;
 function run(all,settings={},ref=M.references(all)){
  const radius=settings.radius??100, dates=[...new Set(all.flatMap(r=>r.heatSeries?.['landsat-median']?.[radius]?.dates||[]))].sort();
  const variants=[{id:'median',label:'Current median'},{id:'mean',label:'Mean of accepted dates'},...dates.map(date=>({id:date,label:'Leave out '+date.replace('landsat-','').replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'),omit:date}))];
  const tests=variants.map(t=>{
   const inputs=all.map(r=>{const original=r.heatSeries?.['landsat-median']?.[radius]||{},values=(original.dates||[]).filter(d=>d!==t.omit).map(d=>r.heatSeries?.[d]?.[radius]?.mean_C).filter(M.finite);
    // Preserve the production baseline exactly; counterfactuals use accepted dates only.
    const temp=t.id==='median'?M.dailyMedian(r,radius):values.length<3?null:t.id==='mean'?values.reduce((a,b)=>a+b,0)/values.length:M.quantile(values,.5);
    return {...r,heatSeries:{...r.heatSeries,'landsat-median':{...r.heatSeries?.['landsat-median'],[radius]:{...original,mean_C:temp,date_count:values.length}}}};
   });
   return {...t,rows:M.evaluate(inputs,settings,ref).rows};
  });
  const shared=all.map((r,i)=>tests.every(t=>M.finite(t.rows[i].score)&&M.finite(t.rows[i].temp))),cohort=shared.filter(Boolean).length;
  const requested=cohort?settings.topMode==='count'?Math.min(cohort,Math.max(1,Math.round(settings.topValue??20))):Math.max(1,Math.ceil(cohort*Math.max(1,Math.min(100,settings.topValue??20))/100)):0;
  for(const t of tests){t.rows=t.rows.filter((r,i)=>shared[i]).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));const cutoff=t.rows[requested-1]?.score;
   t.rows.forEach((r,i)=>{r.rank=i&&r.score===t.rows[i-1].score?t.rows[i-1].rank:i+1;r.top=r.score>=cutoff;});t.shortlisted=t.rows.filter(r=>r.top).length;
  }
  const baseline=new Map(tests[0].rows.map(r=>[r.id,r])),baseTop=new Set(tests[0].rows.filter(r=>r.top).map(r=>r.id));
  for(const t of tests){const overlap=t.rows.filter(r=>r.top&&baseTop.has(r.id)).length,changes=t.rows.map(r=>Math.abs(r.rank-baseline.get(r.id).rank));
   t.overlap=overlap;t.retainedPct=baseTop.size?100*overlap/baseTop.size:null;t.jaccard=baseTop.size+t.shortlisted-overlap?overlap/(baseTop.size+t.shortlisted-overlap):null;t.meanRankChange=changes.length?changes.reduce((a,b)=>a+b,0)/changes.length:null;t.maxRankChange=changes.length?Math.max(...changes):null;
  }
  return {version:'temporal-v1',generatedAt:new Date().toISOString(),settings:{radius,balance:50,building:20,topMode:'percent',topValue:20,heatRecentWeight:.7,incomeLowWeight:.7,...settings},cohort,excluded:all.length-cohort,requested,dates,tests,method:'Same peers in all temporal checks; at least 3 accepted dates after omission. Production percentile reference curves fixed. Historical heat, income, building scale and weights unchanged. Ties included. Separate from the 162-setting suite; not external validation.'};
 }
 function create(all,ref){
  const $=id=>document.getElementById(id),num=v=>Number.isFinite(v)?v.toFixed(1):'—',esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let result=null,key='',state={},selected=null;
  $('temporalRun').onclick=()=>{result=run(all,state,ref);key=JSON.stringify(state);render();};
  $('temporalExport').onclick=()=>{if(!result||key!==JSON.stringify(state))return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.href=url;a.download='HEATSCAPE_temporal_audit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  function render(){const fresh=result&&key===JSON.stringify(state);$('temporalExport').disabled=!fresh;
   if(!fresh){$('temporalResults').textContent='Run checks using the current weights, distance and shortlist size. Previous results are cleared when settings change.';return;}
   $('temporalResults').innerHTML=`<p><b>${result.cohort} buildings share complete evidence across these ${result.tests.length} checks.</b> ${result.excluded} excluded from this comparison; missing evidence is not failure. Ranks use this common cohort, so may differ from the live map.</p><div class="heat-table-scroll"><table class="heat-table"><thead><tr><th>Temporal check</th><th>Baseline shortlist retained</th><th>Mean / max rank change</th><th>Selected building rank</th></tr></thead><tbody>${result.tests.map(t=>{const r=t.rows.find(r=>r.id===selected);return `<tr><th>${esc(t.label)}</th><td>${num(t.retainedPct)}% (${t.overlap}/${result.tests[0].shortlisted})</td><td>${num(t.meanRankChange)} / ${t.maxRankChange??'—'}</td><td>${r?`${r.rank}${r.top?' · shortlisted':''}`:(selected?'Insufficient evidence':'Select a building')}</td></tr>`;}).join('')}</tbody></table></div><p>${esc(result.method)}</p><p>Only accepted dates are used. Omitting a date that was already rejected leaves that building’s input unchanged. These observations are not a complete season; stable rankings do not prove thermal accuracy.</p>`;
  }
  return {select(r,s){selected=r?.building_id;state={...s};render();}};
 }
 const api={run,create};if(typeof module!=='undefined')module.exports=api;else root.HeatTemporal=api;
})(typeof window!=='undefined'?window:globalThis);
