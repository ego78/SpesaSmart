export const ANALYTICS_SETTINGS_KEY='spesaSmart.analytics.v1';

const round2=n=>Math.round((Number(n)||0)*100)/100;
const monthKey=date=>String(date||'').slice(0,7);
const clean=s=>String(s||'').trim();

export function readAnalyticsSettings(){
 try{return {...{monthlyBudget:0,warningPercent:80},...(JSON.parse(localStorage.getItem(ANALYTICS_SETTINGS_KEY)||'{}')||{})}}catch{return{monthlyBudget:0,warningPercent:80}}
}
export function writeAnalyticsSettings(value){localStorage.setItem(ANALYTICS_SETTINGS_KEY,JSON.stringify({...{monthlyBudget:0,warningPercent:80},...value}))}

export function buildSpendingAnalytics(receipts=[],products=[],now=new Date()){
 const currentMonth=now.toISOString().slice(0,7),productMap=new Map((products||[]).map(p=>[String(p.id),p]));
 const valid=(receipts||[]).filter(r=>r&&r.date&&Array.isArray(r.lines));
 const current=valid.filter(r=>monthKey(r.date)===currentMonth);
 const monthTotal=round2(current.reduce((s,r)=>s+Number(r.total||0),0));
 const byStore=new Map(),byCategory=new Map(),byProduct=new Map(),months=new Map();
 for(const receipt of valid){
  const mk=monthKey(receipt.date);months.set(mk,round2((months.get(mk)||0)+Number(receipt.total||0)));
  if(mk!==currentMonth)continue;
  const store=clean(receipt.store)||'Altro';byStore.set(store,round2((byStore.get(store)||0)+Number(receipt.total||0)));
  for(const line of receipt.lines){
   const total=round2(line.total!=null?line.total:Number(line.quantity||1)*Number(line.unitPrice||0));
   const product=productMap.get(String(line.productId||''));
   const category=clean(product?.category)||'Non classificati';
   byCategory.set(category,round2((byCategory.get(category)||0)+total));
   const key=clean(line.name)||'Prodotto';const old=byProduct.get(key)||{name:key,total:0,quantity:0,count:0};
   old.total=round2(old.total+total);old.quantity=round2(old.quantity+Number(line.quantity||0));old.count+=1;byProduct.set(key,old);
  }
 }
 const sortMap=map=>[...map.entries()].map(([name,total])=>({name,total:round2(total)})).sort((a,b)=>b.total-a.total);
 return{
  currentMonth,monthTotal,receiptCount:current.length,averageReceipt:current.length?round2(monthTotal/current.length):0,
  byStore:sortMap(byStore),byCategory:sortMap(byCategory),topProducts:[...byProduct.values()].sort((a,b)=>b.total-a.total).slice(0,10),
  monthlyTrend:[...months.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-12).map(([month,total])=>({month,total})),
  bestStore:sortMap(byStore)[0]||null
 };
}

export function budgetStatus(total,budget,warningPercent=80){
 const b=Math.max(0,Number(budget)||0),t=Math.max(0,Number(total)||0),percent=b?Math.round(t/b*100):0;
 return{budget:b,total:t,remaining:round2(Math.max(0,b-t)),over:round2(Math.max(0,t-b)),percent,tone:!b?'neutral':t>b?'danger':percent>=warningPercent?'warning':'ok'};
}
