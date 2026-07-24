import { normalizeOfferPrice, estimatePurchase, parsePackFormat } from './smart-price.js';

const STOP=new Set(['di','del','della','delle','dei','degli','da','al','alla','alle','ai','agli','con','per','in','il','lo','la','le','i','gli','un','una','e','o','gusto','tipo']);
const EXCLUSIONS={
 latte:['cioccolato','crema','caramella','biscotto'],
 pollo:['wurstel','salume','affettato','brodo'],
 caffe:['capsule','cialde','solubile'],
 pasta:['dentifricio','sfoglia'],
 pomodoro:['patatine','snack']
};
function normalize(s=''){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function tokens(s=''){return normalize(s).split(/\s+/).filter(x=>x.length>1&&!STOP.has(x))}
function textOfOffer(o){return[o.product,o.brand,o.format,o.canonicalName,o.unitPriceLabel].filter(Boolean).join(' ')}
function validPrice(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null}
export { parsePackFormat as parseFormat, normalizeOfferPrice as enrichOffer, estimatePurchase as purchaseEstimate };
function conflicts(product,offer){const pn=tokens(product.name),ot=new Set(tokens(textOfOffer(offer)));for(const root of pn){for(const bad of EXCLUSIONS[root]||[])if(ot.has(bad))return true}return false}
export function matchScore(product,rawOffer){
 const offer=normalizeOfferPrice(rawOffer),text=textOfOffer(offer),ot=new Set(tokens(text)),nameTokens=tokens(product.name),all=tokens([product.name,product.brand,product.format,product.notes].join(' '));
 if(!nameTokens.length||conflicts(product,offer))return 0;
 const hits=nameTokens.filter(t=>ot.has(t)).length;if(!hits)return 0;
 let score=hits===nameTokens.length?62:Math.round(43*hits/nameTokens.length);
 const allHits=all.filter(t=>ot.has(t)).length;if(all.length)score+=Math.round(18*allHits/all.length);
 const brand=normalize(product.brand);if(brand){if(normalize(text).includes(brand))score+=18;else if(product.allowAlternatives===false)return 0}
 const wanted=parsePackFormat(product.format);if(wanted.baseUnit&&offer.normalizedUnit){if(wanted.baseUnit===offer.normalizedUnit)score+=8;else if(product.allowAlternatives===false)return 0}
 if(product.notes&&tokens(product.notes).some(t=>ot.has(t)))score+=5;
 return Math.min(100,score)
}
function savingFor(o){const p=validPrice(o.price),old=validPrice(o.oldPrice);if(!p||!old||old<=p||old/p>4)return 0;return Math.round((old-p)*100)/100}
export async function loadOffers(){const r=await fetch('data/offerte.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Errore offerte');const d=await r.json();return Array.isArray(d)?d.map(normalizeOfferPrice):[]}
export function relevant(products,offers){if(!products.length)return offers;return offers.filter(o=>products.some(p=>matchScore(p,o)>=48))}
export function analyzeDeals(products,offers){
 const matches=products.map(product=>{const candidates=offers.map(offer=>{const score=matchScore(product,offer),estimate=estimatePurchase(product,offer);return{offer,score,estimate}}).filter(x=>x.score>=48).sort((a,b)=>(a.estimate.compatible===b.estimate.compatible?0:a.estimate.compatible?-1:1)||a.estimate.cost-b.estimate.cost||(a.estimate.unitPrice??Infinity)-(b.estimate.unitPrice??Infinity)||b.score-a.score);const hit=candidates[0]||null;return{product,best:hit?.offer||null,bestEstimate:hit?.estimate||null,offers:candidates.map(x=>x.offer),candidates,saving:hit?.estimate?.saving||0,score:hit?.score||0}});
 const matched=matches.filter(x=>x.best),byStore={};for(const item of matched){const store=String(item.best.store||item.best.chain||'Altro');if(!byStore[store])byStore[store]={store,count:0,saving:0,total:0,items:[]};byStore[store].count++;byStore[store].saving+=item.saving;byStore[store].total+=item.bestEstimate?.cost||Number(item.best.price)||0;byStore[store].items.push(item)}
 const stores=Object.values(byStore).map(x=>({...x,saving:Math.round(x.saving*100)/100,total:Math.round(x.total*100)/100})).sort((a,b)=>b.count-a.count||a.total-b.total);
 return{matches,matched,stores,totalSaving:Math.round(matched.reduce((s,x)=>s+x.saving,0)*100)/100,totalCost:Math.round(matched.reduce((s,x)=>s+(x.bestEstimate?.cost||0),0)*100)/100}
}
