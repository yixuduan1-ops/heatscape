(function(root){
  'use strict';
  const M=typeof module!=='undefined'?require('./hib.js'):root.HeatModel;
  const presets=[
    {id:'balanced',label:'Balanced',balance:50,building:20},
    {id:'heat',label:'Heat first',balance:75,building:20},
    {id:'income',label:'Income first',balance:25,building:20},
    {id:'scale',label:'More building scale',balance:50,building:40},
    {id:'no-scale',label:'No building scale',balance:50,building:0},
    {id:'equal',label:'Equal shares',balance:50,building:100/3}
  ];
  function scenarios(settings={}){
    const choices=presets.map(p=>({...p}));
    const live={balance:settings.balance??50,building:settings.building??20};
    if(!choices.some(p=>Math.abs(p.balance-live.balance)<1e-7&&Math.abs(p.building-live.building)<1e-7))choices.push({id:'custom',label:'Your weights',...live});
    return [.6,.7,.8].flatMap(heatRecentWeight=>choices.flatMap(p=>[50,100,150].map(radius=>({
      ...p,id:`integrated-${Math.round(heatRecentWeight*100)}-${p.id}-${radius}`,heatDataset:'landsat-median',heatRecentWeight,radius,weights:M.weights(p.balance,p.building)
    }))));
  }
  // Compare identical peers in every test. Keep measurement availability separately:
  // a partially observed building must never look like an always-selected building.
  function run(all,settings={},reference=M.references(all)){
    const tests=scenarios(settings), evaluations=tests.map(t=>M.evaluate(all,{...settings,...t},reference));
    const summaries=all.map(r=>({id:r.building_id,valid:0,total:tests.length,selected:null,bestRank:null,worstRank:null,status:'insufficient'}));
    evaluations.forEach(e=>e.rows.forEach((r,i)=>{if(M.finite(r.score))summaries[i].valid++;}));
    const shared=summaries.map(s=>s.valid===tests.length),cohort=shared.filter(Boolean).length;
    const requested=cohort===0?0:settings.topMode==='count'
      ?Math.min(cohort,Math.max(1,Math.round(settings.topValue??20)))
      :Math.max(1,Math.ceil(cohort*Math.max(1,Math.min(100,settings.topValue??20))/100));
    summaries.forEach((s,i)=>{if(shared[i])s.selected=0;});
    tests.forEach((t,j)=>{
      const e=evaluations[j];
      const ranked=e.rows.map((r,i)=>({...r,index:i,rank:null,top:null})).filter(r=>shared[r.index]).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
      const cutoff=ranked[requested-1]?.score??null;
      ranked.forEach((r,i)=>{
        r.rank=i&&r.score===ranked[i-1].score?ranked[i-1].rank:i+1;
        r.top=r.score>=cutoff;
        const s=summaries[r.index];s.selected+=Number(r.top);
        s.bestRank=Math.min(s.bestRank??Infinity,r.rank);s.worstRank=Math.max(s.worstRank??0,r.rank);
      });
      const lookup=new Map(ranked.map(r=>[r.id,r]));
      t.rows=e.rows.map(r=>lookup.get(r.id)||{...r,rank:null,top:null});
      t.eligible=e.eligible;t.cohort=cohort;t.requested=requested;t.cutoff=cutoff;t.shortlisted=ranked.filter(r=>r.top).length;
    });
    summaries.forEach((s,i)=>{if(shared[i])s.status=s.selected===s.total?'all':s.selected>0?'some':'none';});
    const counts={all:0,some:0,none:0,insufficient:0};summaries.forEach(s=>counts[s.status]++);
    return {tests,rows:summaries,cohort,requested,counts,settings:{...settings},version:'ranking-stability-temperature-v4'};
  }
  const api={presets,scenarios,run};if(typeof module!=='undefined')module.exports=api;else root.RankingStability=Object.freeze(api);
})(typeof window!=='undefined'?window:globalThis);
