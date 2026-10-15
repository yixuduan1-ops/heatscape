(function(){
 'use strict';
 const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=(x,d=0)=>Number.isFinite(x)?x.toLocaleString('en-AU',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const labels={all:'All tested settings',some:'Some tested settings',none:'Not shortlisted',insufficient:'Insufficient evidence'};
 const colors={all:'#efbb65',some:'#63b8bf',none:'#637b93',insufficient:'#c2b3df'};
 function download(name,fields,rows){
  const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const blob=new Blob(['\ufeff'+[fields.join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function create({all,reference,onSettings,onSelect,onFilter,onMap,onViewMap,onStableMap,available}){
  let suite=null,key='',state={},selected=null;
  const byId=new Map(all.map(r=>[r.building_id,r]));
  const stable=()=>$('stabilityOnly').checked;
  function matches(){
   const query=$('stabilitySearch').value.trim().toLowerCase(),filter=$('stabilityFilter').value;
   return all.filter(r=>{
    const s=r.rankStability;if(!s)return false;
    return (!$('council').value||r.lga_name===$('council').value)
     &&(!stable()||s.status==='all')
     &&(stable()||filter==='all'||(filter==='selected'?s.selected>0:filter===s.status))
     &&(!query||[r.building_name,r.building_id,r.building_address,...r.building_aliases||[]].join(' ').toLowerCase().includes(query));
   }).sort((a,b)=>(b.rankStability.selected??-1)-(a.rankStability.selected??-1)||(a.rank??Infinity)-(b.rank??Infinity)||a.building_id.localeCompare(b.building_id));
  }
  function renderList(){
   if(!suite)return;const rows=matches(),scroll=$('stabilityRows').parentElement.scrollTop;
   $('stabilityListCount').textContent=`${number(rows.length)} buildings · ordered by selection count, then current rank`;
   $('stabilityRows').innerHTML=rows.map(r=>{
    const s=r.rankStability,complete=s.valid===s.total;
    const title=r.building_name|| (r.building_id.length>19?r.building_id.slice(0,15)+'…':r.building_id);
    return `<tr class="${r.building_id===selected?'selected-building':''}" data-building="${esc(r.building_id)}"><td><button class="stability-building" title="${esc(r.building_id)}" data-stability-id="${esc(r.building_id)}"><i style="background:${colors[s.status]}"></i><strong>${esc(title)}</strong><small>${esc(r.building_name?r.building_id:r.suburb||r.lga_name)}</small></button></td><td title="${esc(labels[s.status])}"><b>${complete?`${s.selected}/${s.total}`:'—'}</b><small>${s.valid}/${s.total} valid</small></td><td>${complete?`${number(s.bestRank)}–${number(s.worstRank)}`:'—'}<small>${r.rank===null?'Unscored':`Now ${number(r.rank)}`}</small></td></tr>`;
   }).join('')||'<tr><td colspan="3" class="stability-empty">No matching buildings. Try another filter or a larger shortlist.</td></tr>';
   $('stabilityRows').parentElement.scrollTop=scroll;
  }
  function renderSelection(){
   if(!suite)return;const r=byId.get(selected),s=r?.rankStability;
   $('stabilitySelected').innerHTML=r?`<div class="stability-selected-title"><strong>${esc(r.building_name||r.building_id)}</strong><span>${number(r.score,1)}<small>current score / 100</small></span></div><p>${esc(labels[s.status])} · ${s.selected===null?'Not comparable':`${s.selected}/${s.total} selections`} · ${s.valid}/${s.total} valid tests</p>`:'<p>Select a building from the list to see its rank in every test.</p>';
   $('testBuildingHeading').textContent=r?'Each cell shows this building’s rank and selection.':'Each cell shows the shortlist count. Select a building for its ranks.';
   const groups=[];suite.tests.forEach((t,i)=>{if(i%3===0)groups.push([]);groups.at(-1).push({...t,testIndex:i});});
   $('stabilityTests').innerHTML=groups.map(group=>{
    const first=group[0],w=first.weights.map(x=>number(x*100,Math.abs(x*100-Math.round(x*100))<.001?0:1)).join('/');
    return `<tr><td><strong>${w}</strong><small>${esc(first.label)} · ${first.heatMode==='sunlit'?'Sunlit':'Original'}</small></td>${group.map(t=>{
     const row=r?t.rows.find(x=>x.id===r.building_id):null;
     const active=t.radius===state.radius&&t.heatMode===state.heatMode&&Math.abs(t.balance-state.balance)<1e-7&&Math.abs(t.building-state.building)<1e-7;
     const title=`Apply ${t.label}, ${t.radius} m, ${t.heatMode}. ${t.shortlisted} shortlisted from ${t.cohort}; score cutoff ${number(t.cutoff,2)}.`;
     return `<td class="${active?'active-test':''}" data-test-id="${esc(t.id)}"><button data-apply-test="${t.testIndex}" title="${esc(title)}">${row?(row.rank===null?'—':number(row.rank)):number(t.shortlisted)}<small class="${row?.top?'test-yes':'test-no'}">${row?(row.rank===null?'No rank':row.top?'In':'Out'):'listed'}</small></button></td>`;
    }).join('')}</tr>`;
   }).join('');
   $('stabilityRows').querySelectorAll('tr').forEach(el=>el.classList.toggle('selected-building',el.dataset.building===selected));
   renderSupport(r);
  }
  function renderSupport(r){
   $('thermalSupport').innerHTML=r?`<p class="support-name">${esc(r.building_name||r.building_id)} · sunlit sampling</p><table><thead><tr><th>Extent</th><th>30 m cells</th><th>Valid area</th><th>Sunlit area</th></tr></thead><tbody>${[50,100,150].map(radius=>{const v=r.sunlit?.[radius];return `<tr><td>${radius} m</td><td>${number(v?.pixels)}</td><td>${number(v?.valid_pct,1)}%</td><td>${number(v?.area_m2)} m²</td></tr>`}).join('')}</tbody></table>`:'<p>Select a building to inspect its pixel support at each extent.</p>';
  }
  function render(){
   if(!suite)return;
   $('stabilitySummary').innerHTML=Object.entries(suite.counts).map(([status,count])=>`<span><i style="background:${colors[status]}"></i><b>${number(count)}</b> ${labels[status]}</span>`).join('');
   $('stabilityTestCount').textContent=`${suite.tests.length} tests`;
   const consistent=all.filter(r=>r.rankStability.status==='all'&&(!$('council').value||r.lga_name===$('council').value)).length;
   $('stableMapActionCount').textContent=`${number(consistent)} buildings · in all ${suite.tests.length} tested settings`;
   $('showStableOnMap').disabled=consistent===0;
   $('stabilityScope').textContent=`Same ${number(suite.cohort)} buildings in every test · ${state.topMode==='count'?'Top '+state.topValue:'Top '+state.topValue+'%'} = ${number(suite.requested)} positions; cutoff ties included.`;
   $('stabilityExclusions').textContent=suite.counts.insufficient?`${number(suite.counts.insufficient)} candidates excluded: incomplete evidence. Missing data does not mean “not shortlisted”.`:'Every candidate has data for the full test set.';
   $('stabilityScopeFilter').textContent=$('council').value?`List and map filtered to ${$('council').value.toLowerCase()}; test ranks remain across all five councils.`:'Test ranks use all five councils; list filters do not recalculate them.';
   $('priorityShortlistMode').value=state.topMode;$('priorityShortlistValue').value=state.topValue;
   $('priorityShortlistValue').max=state.topMode==='count'?all.length:100;
   $('priorityShortlistUnit').textContent=state.topMode==='count'?'buildings':'%';
   $('stabilityFilter').disabled=stable();renderList();renderSelection();
  }
  function update(next,id){
   state={...next};selected=id||null;
   const nextKey=JSON.stringify([next.balance,next.building,next.topMode,next.topValue,$('stabilityBothModels').checked?'both':next.heatMode]);
   if(nextKey!==key){
    suite=RankingStability.run(all,{...state,bothModels:$('stabilityBothModels').checked},reference);key=nextKey;
    suite.rows.forEach((s,i)=>all[i].rankStability=s);
   }
   render();
  }
  function select(id){if(selected===id)return;selected=id||null;renderSelection();}
  $('stabilityBothModels').disabled=!available;
  $('stabilityBothModels').onchange=()=>onSettings({});
  $('stabilityOnly').onchange=()=>{$('stableOnly').checked=stable();onFilter();render();};
  $('stableOnly').onchange=()=>{$('stabilityOnly').checked=$('stableOnly').checked;onFilter();render();};
  $('stabilitySearch').oninput=renderList;$('stabilityFilter').onchange=renderList;
  $('stabilityRows').onclick=e=>{const b=e.target.closest('[data-stability-id]');if(b)onSelect(b.dataset.stabilityId);};
  $('stabilityTests').onclick=e=>{const b=e.target.closest('[data-apply-test]');if(!b)return;const t=suite.tests[Number(b.dataset.applyTest)];onSettings({radius:t.radius,heatMode:t.heatMode,balance:t.balance,building:t.building});};
  $('stabilityMap').onchange=()=>onMap($('stabilityMap').checked);$('stabilityViewMap').onclick=onViewMap;
  $('showStableOnMap').onclick=()=>{
   $('stabilityOnly').checked=true;$('stableOnly').checked=true;$('stabilityMap').checked=true;
   $('stabilitySearch').value='';onMap(true);onStableMap();render();
  };
  $('clearStableMap').onclick=()=>{
   $('stabilityOnly').checked=false;$('stableOnly').checked=false;onFilter();render();
   document.querySelector('[data-panel="priority"]').focus();
  };
  function setSize(){const topMode=$('priorityShortlistMode').value,max=topMode==='count'?all.length:100,topValue=Math.max(1,Math.min(max,Math.round(Number($('priorityShortlistValue').value)||1)));onSettings({topMode,topValue});}
  $('priorityShortlistMode').onchange=()=>{$('priorityShortlistValue').value=$('priorityShortlistMode').value==='count'?100:20;setSize();};$('priorityShortlistValue').onchange=setSize;
  $('exportStability').onclick=()=>{
   const rows=matches().map(r=>({building_id:r.building_id,building_name:r.building_name,rank_current:r.rank,score_current:r.score,selected_tests:r.rankStability.selected,valid_tests:r.rankStability.valid,total_tests:r.rankStability.total,best_rank:r.rankStability.bestRank,worst_rank:r.rankStability.worstRank,stability:r.rankStability.status,shared_cohort:suite.cohort,shortlist_mode:state.topMode,shortlist_value:state.topValue,requested_positions:suite.requested,tests:suite.tests.map(t=>t.id).join(';'),current_radius:state.radius,current_heat_model:state.heatMode,current_weights_H_I_B:HeatModel.weights(state.balance,state.building).join('/'),height_quality:r.height_quality,version:suite.version}));
   download('HEATSCAPE_ranking_stability.csv',['building_id','building_name','rank_current','score_current','selected_tests','valid_tests','total_tests','best_rank','worst_rank','stability','shared_cohort','shortlist_mode','shortlist_value','requested_positions','tests','current_radius','current_heat_model','current_weights_H_I_B','height_quality','version'],rows);
  };
  $('exportTests').onclick=()=>download('HEATSCAPE_test_settings.csv',['test','label','radius_m','heat_model','weight_H','weight_I','weight_B','cohort','valid_candidates','requested_positions','shortlisted','score_cutoff','shortlist_mode','shortlist_value','building_id','building_rank','building_selected'],suite.tests.map(t=>{const r=t.rows.find(r=>r.id===selected);return {test:t.id,label:t.label,radius_m:t.radius,heat_model:t.heatMode,weight_H:t.weights[0],weight_I:t.weights[1],weight_B:t.weights[2],cohort:t.cohort,valid_candidates:t.eligible,requested_positions:t.requested,shortlisted:t.shortlisted,score_cutoff:t.cutoff,shortlist_mode:state.topMode,shortlist_value:state.topValue,building_id:selected,building_rank:r?.rank,building_selected:r?.top};}));
  return {update,select,render,onlyStable:stable,colors,labels,getSuite:()=>suite};
 }
 window.RankingWorkspace={create};
})();
