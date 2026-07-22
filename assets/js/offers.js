const STOP_WORDS=new Set(['di','del','della','dei','degli','delle','da','dal','dallo','alla','alle','al','ai','a','e','ed','con','per','in','il','lo','la','i','gli','le','un','uno','una','gr','g','kg','ml','cl','lt','l']);

function normalize(value=''){
  return String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function tokens(value=''){
  return normalize(value).split(/\s+/).filter(x=>x.length>1&&!STOP_WORDS.has(x));
}

function textOfOffer(o){return [o.product,o.brand,o.format,o.category].filter(Boolean).join(' ')}

function matchScore(product,offer){
  const pn=normalize(product?.name),on=normalize(offer?.product);
  if(!pn||!on)return 0;
  let score=0;
  if(on===pn)score+=100;
  else if(on.includes(pn)||pn.includes(on))score+=70;
  const pt=[...new Set(tokens([product.name,product.brand,product.format].filter(Boolean).join(' ')))];
  const ot=new Set(tokens(textOfOffer(offer)));
  const nameTokens=tokens(product.name);
  const nameHits=nameTokens.filter(t=>ot.has(t)).length;
  if(nameTokens.length&&nameHits===nameTokens.length)score+=55;
  else if(nameHits)score+=Math.round(40*nameHits/nameTokens.length);
  const allHits=pt.filter(t=>ot.has(t)).length;
  if(pt.length)score+=Math.round(20*allHits/pt.length);
  if(product.brand&&normalize(textOfOffer(offer)).includes(normalize(product.brand)))score+=18;
  if(product.format&&normalize(textOfOffer(offer)).includes(normalize(product.format)))score+=10;
  return score;
}

function validPrice(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:null}

function savingFor(offer){
  const price=validPrice(offer.price),old=validPrice(offer.oldPrice);
  if(!price||!old||old<=price||old/price>4)return 0;
  return Math.round((old-price)*100)/100;
}

export async function loadOffers(){const r=await fetch('data/offerte.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Errore offerte');const d=await r.json();return Array.isArray(d)?d:[]}

export function relevant(products,offers){
  if(!products.length)return offers;
  return offers.filter(o=>products.some(p=>matchScore(p,o)>=45));
}

export function analyzeDeals(products,offers){
  const matches=products.map(product=>{
    const candidates=offers.map(offer=>({offer,score:matchScore(product,offer)})).filter(x=>x.score>=45)
      .sort((a,b)=>Number(a.offer.price??Infinity)-Number(b.offer.price??Infinity)||b.score-a.score);
    const best=candidates[0]?.offer||null;
    return {product,best,offers:candidates.map(x=>x.offer),saving:best?savingFor(best):0};
  });
  const matched=matches.filter(x=>x.best);
  const byStore={};
  for(const item of matched){
    const store=String(item.best.store||item.best.chain||'Altro');
    if(!byStore[store])byStore[store]={store,count:0,saving:0,items:[]};
    byStore[store].count+=1;byStore[store].saving+=item.saving;byStore[store].items.push(item);
  }
  const stores=Object.values(byStore).map(x=>({...x,saving:Math.round(x.saving*100)/100})).sort((a,b)=>b.count-a.count||b.saving-a.saving);
  return {matches,matched,stores,totalSaving:Math.round(matched.reduce((s,x)=>s+x.saving,0)*100)/100};
}
