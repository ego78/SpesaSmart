import{buildSpendingAnalytics,budgetStatus}from'./analytics.js';
import{pantrySummary,isLowStock,daysToExpiry}from'./pantry.js';

const clean=s=>String(s||'').trim();
const lower=s=>clean(s).toLocaleLowerCase('it-IT');
const round2=n=>Math.round((Number(n)||0)*100)/100;
const euro=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(n)||0);

export function buildAssistantContext({products=[],pantry=[],receipts=[],offers=[],analyticsSettings={},plans=[]}={}){
 const analytics=buildSpendingAnalytics(receipts,products);
 const budget=budgetStatus(analytics.monthTotal,analyticsSettings.monthlyBudget,analyticsSettings.warningPercent);
 const pantryInfo=pantrySummary(pantry);
 const lowStock=pantry.filter(isLowStock).sort((a,b)=>String(a.name).localeCompare(String(b.name),'it'));
 const expiring=pantry.filter(x=>{const d=daysToExpiry(x);return d!=null&&d>=0&&d<=7}).sort((a,b)=>daysToExpiry(a)-daysToExpiry(b));
 const checked=products.filter(x=>x.checked);
 const needed=products.filter(x=>x.priority==='needed');
 const favorite=products.filter(x=>x.favorite);
 const bestPlan=plans?.[0]||null;
 return{products,pantry,receipts,offers,analyticsSettings,analytics,budget,pantryInfo,lowStock,expiring,checked,needed,favorite,bestPlan};
}

function lines(items,mapper,limit=6){return items.slice(0,limit).map((x,i)=>`${i+1}. ${mapper(x)}`).join('\n')}
function intro(title,body,actions=[]){return{title,body,actions}}

export function weeklyReport(ctx){
 const a=ctx.analytics,b=ctx.budget,p=ctx.pantryInfo;
 const parts=[`Questa settimana puoi partire da questi dati:`,`• Nel mese hai registrato ${euro(a.monthTotal)} in ${a.receiptCount} scontrini.`];
 if(b.budget)parts.push(`• Hai usato il ${b.percent}% del budget mensile; restano ${euro(b.remaining)}.`);
 else parts.push('• Non hai ancora impostato un budget mensile.');
 parts.push(`• In dispensa ci sono ${p.total} prodotti: ${p.low} sotto soglia e ${p.expiring} in scadenza.`);
 if(ctx.lowStock.length)parts.push(`• Da ricomprare prima: ${ctx.lowStock.slice(0,5).map(x=>x.name).join(', ')}.`);
 if(ctx.bestPlan)parts.push(`• Il piano più economico stimato costa ${euro(ctx.bestPlan.total)} e usa ${ctx.bestPlan.storeCount||ctx.bestPlan.stores?.length||0} supermercati.`);
 if(a.bestStore)parts.push(`• Il supermercato con più spesa registrata questo mese è ${a.bestStore.name} (${euro(a.bestStore.total)}).`);
 return intro('Analisi della settimana',parts.join('\n'),['Apri la dispensa','Calcola la spesa migliore','Apri analisi']);
}

export function answerAssistant(question,ctx){
 const q=lower(question);
 if(!q)return intro('Come posso aiutarti?','Scrivi una domanda sulla lista, la dispensa, il budget o le offerte.');
 if(/settimana|riepilogo|analizza/.test(q))return weeklyReport(ctx);
 if(/budget|quanto posso spendere|quanto resta/.test(q)){
  const b=ctx.budget,a=ctx.analytics;
  if(!b.budget)return intro('Budget non impostato',`Hai registrato ${euro(a.monthTotal)} questo mese, ma non hai ancora impostato un budget.`,['Apri analisi']);
  return intro('Situazione budget',`Hai speso ${euro(a.monthTotal)} su ${euro(b.budget)} (${b.percent}%). ${b.over?`Hai superato il budget di ${euro(b.over)}.`:`Ti restano ${euro(b.remaining)}.`}`,['Apri analisi']);
 }
 if(/dispensa|cosa ho|scorte|quasi finit|finendo/.test(q)){
  const p=ctx.pantryInfo;
  let body=`Hai ${p.total} prodotti in dispensa. ${p.low} sono sotto soglia, ${p.expiring} in scadenza e ${p.expired} scaduti.`;
  if(ctx.lowStock.length)body+=`\n\nDa ricomprare:\n${lines(ctx.lowStock,x=>`${x.name}: ${x.quantity} ${x.unit||'pz'}`)}`;
  if(ctx.expiring.length)body+=`\n\nIn scadenza:\n${lines(ctx.expiring,x=>`${x.name}, tra ${daysToExpiry(x)} giorni`)}`;
  return intro('Situazione dispensa',body,['Apri la dispensa','Aggiungi scorte basse alla lista']);
 }
 if(/spesa migliore|dove conviene|supermercat|meno possibile|economica/.test(q)){
  const plan=ctx.bestPlan;
  if(!plan)return intro('Piano non disponibile','Aggiungi prodotti alla lista e aggiorna le offerte, poi calcola la spesa migliore.',['Calcola la spesa migliore']);
  const stores=plan.stores||[];
  const detail=stores.length?`\n\n${lines(stores,s=>`${s.store||s.name}: ${euro(s.total)}${s.count?` · ${s.count} prodotti`:''}`)}`:'';
  return intro('Spesa consigliata',`La soluzione più economica stimata costa ${euro(plan.total)} con ${plan.storeCount||stores.length} supermercati.${detail}`,['Calcola la spesa migliore','Inizia la spesa']);
 }
 if(/lista|cosa devo comprare|prodotti da comprare/.test(q)){
  const pending=ctx.products.filter(x=>!x.checked);
  if(!pending.length)return intro('Lista vuota','Non ci sono prodotti da acquistare.');
  return intro('Prodotti da comprare',`${pending.length} prodotti ancora da prendere:\n${lines(pending,x=>`${x.name} · ${x.quantity||1} ${x.unit||'pz'}${x.priority==='needed'?' · necessario':''}`,10)}`,['Vai alla lista','Calcola la spesa migliore']);
 }
 if(/scaden|consumare prima/.test(q)){
  if(!ctx.expiring.length)return intro('Nessuna urgenza','Non risultano prodotti in scadenza nei prossimi 7 giorni.');
  return intro('Da consumare prima',lines(ctx.expiring,x=>`${x.name}: scade tra ${daysToExpiry(x)} giorni`,10),['Apri la dispensa']);
 }
 if(/risparmi|consiglio|conviene comprare|offerte/.test(q)){
  const tips=[];
  if(ctx.lowStock.length)tips.push(`Concentrati prima sulle scorte basse: ${ctx.lowStock.slice(0,4).map(x=>x.name).join(', ')}.`);
  if(ctx.budget.budget)tips.push(`Hai ancora ${euro(ctx.budget.remaining)} di budget disponibile.`);
  if(ctx.bestPlan)tips.push(`Il piano più economico stimato è ${euro(ctx.bestPlan.total)}.`);
  if(!tips.length)tips.push('Aggiungi prodotti, scontrini e scorte per ricevere consigli più precisi.');
  return intro('Consigli di risparmio',tips.map(x=>`• ${x}`).join('\n'),['Calcola la spesa migliore','Apri analisi']);
 }
 return intro('Risposta di Spesa Smart',`Posso aiutarti con budget, lista, dispensa, scadenze, analisi settimanale e scelta dei supermercati. Non ho trovato un comando preciso nella domanda: “${clean(question)}”.`,['Analizza la mia settimana','Mostra il budget','Cosa manca in dispensa?']);
}

export function addLowStockToList(products=[],pantry=[]){
 const existing=new Set(products.map(x=>lower(x.name)));
 const added=[];const next=[...products];
 for(const item of pantry.filter(isLowStock)){
  if(existing.has(lower(item.name)))continue;
  const quantity=Math.max(1,round2(Number(item.minimumQuantity||1)-Number(item.quantity||0)));
  next.push({id:`ai-${Date.now()}-${added.length}`,name:item.name,brand:'',format:'',quantity,unit:item.unit||'pz',category:'Dispensa',priority:'needed',allowAlternatives:true,checked:false,notes:'Aggiunto dall’assistente per scorta bassa',favorite:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  existing.add(lower(item.name));added.push(item.name);
 }
 return{products:next,added};
}
