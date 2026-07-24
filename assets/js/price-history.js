import { matchScore } from './offers.js';

let cache=null;
const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
const day=v=>String(v||'').slice(0,10);

export async function loadPriceHistory(){
  if(cache)return cache;
  try{
    const r=await fetch('data/storico-offerte.json',{cache:'default'});
    if(!r.ok)throw new Error('Storico non disponibile');
    const d=await r.json();
    cache={generatedAt:d.generatedAt||'',snapshots:Array.isArray(d.snapshots)?d.snapshots:[]};
  }catch{
    cache={generatedAt:'',snapshots:[]};
  }
  return cache;
}

export function clearPriceHistoryCache(){cache=null}

export function historyForProduct(product,history,limit=180){
  const rows=[];
  for(const snap of history?.snapshots||[]){
    const date=day(snap.date||snap.generatedAt);
    for(const offer of snap.offers||[]){
      if(matchScore(product,offer)<48)continue;
      const price=num(offer.price);if(!price)continue;
      rows.push({date,price,unitPrice:num(offer.unitPrice),unitLabel:offer.unitPriceLabel||offer.calculatedUnitLabel||'',store:offer.store||offer.chain||'Altro',product:offer.product||offer.canonicalName||product.name,format:offer.format||''});
    }
  }
  rows.sort((a,b)=>b.date.localeCompare(a.date)||a.price-b.price);
  const dedup=[],seen=new Set();
  for(const r of rows){const k=[r.date,r.store,r.product,r.format,r.price].join('|');if(seen.has(k))continue;seen.add(k);dedup.push(r);if(dedup.length>=limit)break}
  return dedup;
}

export function summarizeHistory(rows,currentPrice=null){
  const values=rows.map(r=>r.unitPrice||r.price).filter(Boolean);
  if(!values.length)return{count:0,min:null,max:null,average:null,current:currentPrice,label:'Storico non ancora disponibile',tone:'neutral'};
  const min=Math.min(...values),max=Math.max(...values),average=values.reduce((a,b)=>a+b,0)/values.length,current=num(currentPrice);
  let label='Nella media',tone='average';
  if(current){if(current<=min*1.03){label='Prezzo ottimo',tone='good'}else if(current>=average*1.12){label='Più caro del solito',tone='high'}}
  return{count:values.length,min,max,average,current,label,tone};
}
