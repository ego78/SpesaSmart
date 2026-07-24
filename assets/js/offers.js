const STOP=new Set(['di','del','della','delle','dei','degli','da','al','alla','alle','ai','agli','con','per','in','il','lo','la','le','i','gli','un','una','e','o','gusto','tipo']);
const EXCLUSIONS={
 latte:['cioccolato','crema','caramella','biscotto'],
 pollo:['wurstel','salume','affettato','brodo'],
 caffe:['capsule','cialde','solubile'],
 pasta:['dentifricio','sfoglia'],
 pomodoro:['patatine','snack']
};
const UNIT_LABEL={kg:'kg',g:'g',l:'L',ml:'ml',pz:'pz',conf:'conf.'};
function normalize(s=''){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function tokens(s=''){return normalize(s).split(/\s+/).filter(x=>x.length>1&&!STOP.has(x))}
function textOfOffer(o){return[o.product,o.brand,o.format,o.canonicalName,o.unitPriceLabel].filter(Boolean).join(' ')}
function validPrice(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null}
function parseNumber(v){return Number(String(v).replace(',','.'))}
export function parseFormat(value=''){
 const s=normalize(value).replace(/\s*x\s*/g,'x');
 let m=s.match(/(\d+)x(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|pz|pezzi|capsule|rotoli|bottiglie|lattine)/i);
 if(m){const count=Number(m[1]),amount=parseNumber(m[2]),unit=canonicalUnit(m[3]);return{count,amount,total:count*amount,unit,source:'multipack'}}
 m=s.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|pz|pezzi|capsule|rotoli|bottiglie|lattine)/i);
 if(m){const amount=parseNumber(m[1]),unit=canonicalUnit(m[2]);return{count:1,amount,total:amount,unit,source:'format'}}
 return{count:1,amount:null,total:null,unit:null,source:'unknown'}
}
function canonicalUnit(u=''){u=normalize(u);if(u==='kg'||u==='g'||u==='l'||u==='ml')return u;if(['pz','pezzi','capsule','rotoli','bottiglie','lattine'].includes(u))return'pz';return null}
function baseQuantity(amount,unit){if(amount==null||!unit)return null;if(unit==='g')return amount/1000;if(unit==='ml')return amount/1000;return amount}
function baseUnit(unit){if(unit==='g')return'kg';if(unit==='ml')return'l';return unit}
export function enrichOffer(offer){
 const parsed=parseFormat(offer.format||offer.product||'');let unitPrice=validPrice(offer.unitPrice),unitPriceUnit=null;
 if(unitPrice){const text=normalize([offer.unitPriceLabel,offer.format,offer.product].join(' '));unitPriceUnit=text.includes('litro')||/\bl\b/.test(text)?'l':text.includes('pezzo')||text.includes('cad')?'pz':'kg'}
 if(!unitPrice&&parsed.total){const base=baseQuantity(parsed.total,parsed.unit);if(base)unitPrice=Number(offer.price)/base,unitPriceUnit=baseUnit(parsed.unit)}
 return{...offer,_format:parsed,calculatedUnitPrice:unitPrice?Math.round(unitPrice*100)/100:null,calculatedUnit:unitPriceUnit,calculatedUnitLabel:unitPrice&&unitPriceUnit?`${unitPrice.toFixed(2).replace('.',',')} €/${UNIT_LABEL[unitPriceUnit]||unitPriceUnit}`:''}
}
function conflicts(product,offer){const pn=tokens(product.name),ot=new Set(tokens(textOfOffer(offer)));for(const root of pn){for(const bad of EXCLUSIONS[root]||[])if(ot.has(bad))return true}return false}
export function matchScore(product,rawOffer){
 const offer=enrichOffer(rawOffer),text=textOfOffer(offer),ot=new Set(tokens(text)),nameTokens=tokens(product.name),all=tokens([product.name,product.brand,product.format,product.notes].join(' '));
 if(!nameTokens.length||conflicts(product,offer))return 0;
 const hits=nameTokens.filter(t=>ot.has(t)).length;if(!hits)return 0;
 let score=hits===nameTokens.length?62:Math.round(43*hits/nameTokens.length);
 const allHits=all.filter(t=>ot.has(t)).length;if(all.length)score+=Math.round(18*allHits/all.length);
 const brand=normalize(product.brand);if(brand){if(normalize(text).includes(brand))score+=18;else if(product.allowAlternatives===false)return 0}
 const wanted=parseFormat(product.format);if(wanted.unit&&offer._format.unit){if(baseUnit(wanted.unit)===baseUnit(offer._format.unit))score+=8;else if(product.allowAlternatives===false)return 0}
 if(product.notes&&tokens(product.notes).some(t=>ot.has(t)))score+=5;
 return Math.min(100,score)
}
export function purchaseEstimate(product,rawOffer){
 const offer=enrichOffer(rawOffer),wanted=Number(product.quantity)||1,wantedUnit=product.unit||'pz',fmt=offer._format,price=validPrice(offer.price)||0;
 let packages=1,covered=wanted,compatible=false;
 const wantedBase=baseQuantity(wanted,wantedUnit),offerBase=baseQuantity(fmt.total,fmt.unit);
 if(wantedBase&&offerBase&&baseUnit(wantedUnit)===baseUnit(fmt.unit)){packages=Math.max(1,Math.ceil(wantedBase/offerBase));covered=packages*offerBase;compatible=true}
 else if(wantedUnit==='conf'){packages=Math.max(1,Math.ceil(wanted));covered=packages;compatible=true}
 else if(wantedUnit==='pz'&&fmt.unit==='pz'&&fmt.total){packages=Math.max(1,Math.ceil(wanted/fmt.total));covered=packages*fmt.total;compatible=true}
 else if(wantedUnit==='pz'){packages=Math.max(1,Math.ceil(wanted));covered=packages;compatible=true}
 const cost=Math.round(packages*price*100)/100;
 const old=validPrice(offer.oldPrice);const saving=old&&old>price&&old/price<4?Math.round(packages*(old-price)*100)/100:0;
 return{packages,cost,saving,covered,compatible,unitPrice:offer.calculatedUnitPrice,unit:offer.calculatedUnit,label:packages>1?`${packages} confezioni · ${cost.toFixed(2).replace('.',',')} €`:`${cost.toFixed(2).replace('.',',')} €`}
}
function savingFor(o){const p=validPrice(o.price),old=validPrice(o.oldPrice);if(!p||!old||old<=p||old/p>4)return 0;return Math.round((old-p)*100)/100}
export async function loadOffers(){const r=await fetch('data/offerte.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Errore offerte');const d=await r.json();return Array.isArray(d)?d.map(enrichOffer):[]}
export function relevant(products,offers){if(!products.length)return offers;return offers.filter(o=>products.some(p=>matchScore(p,o)>=48))}
export function analyzeDeals(products,offers){
 const matches=products.map(product=>{const candidates=offers.map(offer=>{const score=matchScore(product,offer),estimate=purchaseEstimate(product,offer);return{offer,score,estimate}}).filter(x=>x.score>=48).sort((a,b)=>a.estimate.cost-b.estimate.cost||(a.estimate.unitPrice??Infinity)-(b.estimate.unitPrice??Infinity)||b.score-a.score);const hit=candidates[0]||null;return{product,best:hit?.offer||null,bestEstimate:hit?.estimate||null,offers:candidates.map(x=>x.offer),candidates,saving:hit?.estimate?.saving||0,score:hit?.score||0}});
 const matched=matches.filter(x=>x.best),byStore={};for(const item of matched){const store=String(item.best.store||item.best.chain||'Altro');if(!byStore[store])byStore[store]={store,count:0,saving:0,total:0,items:[]};byStore[store].count++;byStore[store].saving+=item.saving;byStore[store].total+=item.bestEstimate?.cost||Number(item.best.price)||0;byStore[store].items.push(item)}
 const stores=Object.values(byStore).map(x=>({...x,saving:Math.round(x.saving*100)/100,total:Math.round(x.total*100)/100})).sort((a,b)=>b.count-a.count||a.total-b.total);
 return{matches,matched,stores,totalSaving:Math.round(matched.reduce((s,x)=>s+x.saving,0)*100)/100,totalCost:Math.round(matched.reduce((s,x)=>s+(x.bestEstimate?.cost||0),0)*100)/100}
}
