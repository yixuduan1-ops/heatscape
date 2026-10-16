(function(root){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x),positive=x=>finite(x)&&x>0,clip=x=>Math.max(0,Math.min(1,x));
 const share=(x,f=.7)=>finite(x)?clip(x):f;
 const mix=(a,b,w)=>w===1?(finite(a)?a:null):w===0?(finite(b)?b:null):[a,b].every(finite)?w*a+(1-w)*b:null;
 function quantile(v,q){const a=v.filter(finite).sort((a,b)=>a-b);if(!a.length)return null;const p=(a.length-1)*q,i=Math.floor(p);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(p-i)}
 function knots(v){const a=v.filter(finite).sort((a,b)=>a-b),out=[];for(let i=0;i<a.length;){let j=i+1;while(j<a.length&&a[j]===a[i])j++;out.push([a[i],(i+j)/(2*a.length)]);i=j}return out}
 function percentile(x,a){if(!finite(x)||!a?.length)return null;if(x<=a[0][0])return a[0][1];if(x>=a.at(-1)[0])return a.at(-1)[1];let l=0,r=a.length-1;while(r-l>1){let m=(l+r)>>1;if(a[m][0]<=x)l=m;else r=m}return a[l][1]+(a[r][1]-a[l][1])*(x-a[l][0])/(a[r][0]-a[l][0])}
 function weights(balance=50,building=20){const b=Math.max(0,Math.min(40,building))/100,a=Math.max(0,Math.min(100,balance))/100;return [(1-b)*a,(1-b)*(1-a),b]}
 function combine(h,i,b,balance=50,building=20){const w=weights(balance,building),x=[h,i,b],ok=x.every((v,j)=>w[j]===0||finite(v)),points=x.map((v,j)=>ok?100*w[j]*(v??0):null);return {score:ok?points.reduce((a,b)=>a+b,0):null,heatWeight:w[0],incomeWeight:w[1],buildingWeight:w[2],heatPoints:points[0],incomePoints:points[1],formPoints:points[2]}}
 function climate(r){const a=r.historicalHeat?.climate_normals,v=[a?.[11],a?.[0],a?.[1]];return v.every(finite)?v.reduce((s,x)=>s+x,0)/3:null}
 function dailyMedian(r,radius){const v=r.heatSeries?.['landsat-median']?.[radius];return v?.date_count>=3&&v.valid_pct>=80&&v.weighted_valid_pct>=80&&v.pixels>=3?v.mean_C:null}
 function references(all){
  const eligible=all.filter(r=>finite(r.low_income_under650_pct)&&positive(r.lod1_height)&&positive(r.footprint_area_m2));
  const ref={heat:{},uhi:{},income:knots(eligible.map(r=>r.low_income_under650_pct)),rent:knots(eligible.map(r=>r.economic?.rent_income_area_ratio)),vic:knots(eligible.map(r=>r.historicalHeat?.vic2018?.UHI18_M)),climate:knots(eligible.map(climate)),height:knots(eligible.map(r=>r.lod1_height)),area:knots(eligible.map(r=>r.footprint_area_m2)),n:eligible.length};
  for(const radius of [50,100,150]){ref.heat['landsat-median_'+radius]=knots(eligible.map(r=>dailyMedian(r,radius)));ref.uhi[radius]=knots(eligible.map(r=>r.historicalHeat?.csiro_uhi?.[radius]?.mean_C));}
  ref.building=knots(eligible.map(r=>(percentile(r.lod1_height,ref.height)+percentile(r.footprint_area_m2,ref.area))/2));return ref;
 }
 function indicators(r,radius,ref,heatRecentWeight=.7,incomeLowWeight=.7){
  const v=r.heatSeries?.['landsat-median']?.[radius],temp=dailyMedian(r,radius),hRecent=percentile(temp,ref.heat['landsat-median_'+radius]);
  const hist=r.historicalHeat||{},hCsiro=percentile(hist.csiro_uhi?.[radius]?.mean_C,ref.uhi[radius]),hVic=percentile(hist.vic2018?.UHI18_M,ref.vic),hClimate=percentile(climate(r),ref.climate);
  const hHistorical=[hCsiro,hVic,hClimate].every(finite)?(hCsiro+hVic+hClimate)/3:null;
  const h=mix(hRecent,hHistorical,heatRecentWeight);
  const iIncome=percentile(r.low_income_under650_pct,ref.income),iRent=percentile(r.economic?.rent_income_area_ratio,ref.rent),inc=mix(iIncome,iRent,incomeLowWeight);
  const heightIndex=positive(r.lod1_height)?percentile(r.lod1_height,ref.height):null,areaIndex=positive(r.footprint_area_m2)?percentile(r.footprint_area_m2,ref.area):null,b=[heightIndex,areaIndex].every(finite)?percentile((heightIndex+areaIndex)/2,ref.building):null;
  return {temp,coverage:v?.valid_pct??0,weightedCoverage:v?.weighted_valid_pct??0,uncertainty:null,dateCount:v?.date_count??0,h,hRecent,hHistorical,hCsiro,hVic,hClimate,heatRecentWeight,incomeLowWeight,iIncome,iRent,inc,b,heightIndex,areaIndex};
 }
 function evaluate(all,{radius=100,balance=50,building=20,topMode='percent',topValue=20,heatRecentWeight=.7,incomeLowWeight=.7}={},ref=references(all)){
  heatRecentWeight=share(heatRecentWeight);incomeLowWeight=share(incomeLowWeight);
  const heatDataset='landsat-median',anchors=ref.heat[heatDataset+'_'+radius]||[];
  const rows=all.map(r=>{const x=indicators(r,radius,ref,heatRecentWeight,incomeLowWeight);return {id:r.building_id,heatDataset,...x,...combine(x.h,x.inc,x.b,balance,building),jointHigh:finite(x.h)&&finite(x.inc)&&x.h>=.8&&x.inc>=.8,rank:null,top:false}});
  const heatRows=rows.filter(r=>finite(r.h)).sort((a,b)=>b.h-a.h);heatRows.forEach((r,i)=>r.heatRank=i&&r.h===heatRows[i-1].h?heatRows[i-1].heatRank:i+1);
  const valid=rows.filter(r=>finite(r.score)).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  const requested=valid.length===0?0:topMode==='count'?Math.max(1,Math.min(valid.length,Math.round(topValue))):Math.max(1,Math.ceil(valid.length*Math.max(1,Math.min(100,topValue))/100)),cutoff=valid[requested-1]?.score??null;
  valid.forEach((r,i)=>{r.rank=i&&r.score===valid[i-1].score?valid[i-1].rank:i+1;r.top=r.score>=cutoff});
  return {rows,heatEligible:heatRows.length,eligible:valid.length,shortlisted:valid.filter(r=>r.top).length,cutoff,anchors,settings:{radius,distance:true,balance,building,topMode,topValue,heatDataset,heatRecentWeight,incomeLowWeight},version:'HIB-adjustable-v4'};
 }
 function stability(all,ref,settings={}){const counts=all.map(()=>({eligible:0,selected:0}));for(const radius of [50,100,150])evaluate(all,{...settings,radius},ref).rows.forEach((r,i)=>{if(finite(r.score)){counts[i].eligible++;if(r.top)counts[i].selected++}});return counts}
 const api={weights,finite,positive,clip,share,mix,quantile,knots,percentile,combine,references,evaluate,stability,indicators,climate,dailyMedian};if(typeof module!=='undefined')module.exports=api;else root.HeatModel=Object.freeze(api);
})(typeof window!=='undefined'?window:globalThis);
