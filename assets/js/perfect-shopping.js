import { analyzeDeals } from './offers.js';

const round=v=>Math.round((Number(v)||0)*100)/100;
const costOf=x=>Number(x?.estimate?.cost??x?.offer?.price??Infinity);
const storeName=s=>String(s?.name||s?.brand||s?.id||'Altro');

export function buildProductChoices(products,stores,offersForStore){
 return products.map(product=>{
  const candidates=[];
  for(const store of stores){
   const hit=analyzeDeals([product],offersForStore(store)).matched[0];
   if(!hit?.best)continue;
   candidates.push({product,store,offer:hit.best,estimate:hit.bestEstimate,saving:Number(hit.saving||0),score:Number(hit.score||0)});
  }
  candidates.sort((a,b)=>costOf(a)-costOf(b)||Number(a.store?.distance??999)-Number(b.store?.distance??999)||b.score-a.score);
  return {product,candidates};
 });
}

function summarize(id,label,description,assignments,missing){
 const groups=new Map();
 for(const item of assignments){
  const key=item.store.id||storeName(item.store);
  if(!groups.has(key))groups.set(key,{store:item.store,items:[],total:0,saving:0});
  const g=groups.get(key);g.items.push(item);g.total+=costOf(item);g.saving+=Number(item.saving||0);
 }
 const storeGroups=[...groups.values()].map(g=>({...g,total:round(g.total),saving:round(g.saving)})).sort((a,b)=>b.items.length-a.items.length||a.total-b.total);
 return {id,label,description,assignments,missing,storeGroups,total:round(assignments.reduce((s,x)=>s+costOf(x),0)),saving:round(assignments.reduce((s,x)=>s+Number(x.saving||0),0)),storeCount:storeGroups.length};
}

function cheapestPlan(choices){
 const assignments=[],missing=[];
 for(const row of choices){row.candidates[0]?assignments.push(row.candidates[0]):missing.push(row.product)}
 return summarize('cheapest','Più economica','Il prezzo totale più basso tra i supermercati selezionati.',assignments,missing);
}

function singleStorePlan(choices,stores){
 let best=null;
 for(const store of stores){
  const assignments=[],missing=[];
  for(const row of choices){const hit=row.candidates.find(x=>(x.store.id||storeName(x.store))===(store.id||storeName(store)));hit?assignments.push(hit):missing.push(row.product)}
  const candidate=summarize('single','Un solo supermercato','La soluzione più completa evitando tappe aggiuntive.',assignments,missing);
  candidate.coverage=assignments.length;
  if(!best||candidate.coverage>best.coverage||(candidate.coverage===best.coverage&&candidate.total<best.total))best=candidate;
 }
 return best||summarize('single','Un solo supermercato','Nessun supermercato disponibile.',[],choices.map(x=>x.product));
}

function balancedPlan(choices,cheapest,single,maxExtraRatio=.08){
 if(cheapest.storeCount<=2)return {...cheapest,id:'balanced',label:'Equilibrata',description:'Mantiene il prezzo minimo con poche tappe.'};
 const cheapestTotal=cheapest.total||0,limit=cheapestTotal*(1+maxExtraRatio);
 const storeStats=new Map();
 for(const row of choices)for(const c of row.candidates){const key=c.store.id||storeName(c.store);if(!storeStats.has(key))storeStats.set(key,{store:c.store,count:0,cost:0});const s=storeStats.get(key);s.count++;s.cost+=costOf(c)}
 const preferred=[...storeStats.values()].sort((a,b)=>b.count-a.count||a.cost-b.cost).slice(0,2).map(x=>x.store.id||storeName(x.store));
 const assignments=[],missing=[];
 for(const row of choices){
  const allowed=row.candidates.filter(c=>preferred.includes(c.store.id||storeName(c.store)));
  const hit=allowed[0]||row.candidates[0];hit?assignments.push(hit):missing.push(row.product);
 }
 let plan=summarize('balanced','Equilibrata','Riduce le tappe accettando solo un piccolo aumento di costo.',assignments,missing);
 if(plan.total>limit&&single.total<=limit)plan={...single,id:'balanced',label:'Equilibrata',description:'Un solo supermercato con differenza contenuta rispetto al minimo.'};
 return plan;
}

export function buildPerfectShoppingPlans(products,stores,offersForStore){
 const activeStores=stores.filter(s=>s.selected);
 const choices=buildProductChoices(products,activeStores,offersForStore);
 const cheapest=cheapestPlan(choices),single=singleStorePlan(choices,activeStores),balanced=balancedPlan(choices,cheapest,single);
 const baseline=Math.max(cheapest.total,balanced.total,single.total);
 for(const plan of [cheapest,balanced,single])plan.difference=round(plan.total-cheapest.total),plan.relativeSaving=round(baseline-plan.total);
 return {choices,plans:[cheapest,balanced,single]};
}
