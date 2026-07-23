import { cleanText, normalizeProduct } from './common.mjs';

const STOP_WORDS = new Set([
  'di','del','della','dei','degli','delle','da','dal','dallo','alla','alle','al','ai','a','e','ed','con','per','in',
  'il','lo','la','i','gli','le','un','uno','una','conf','confezione','pezzo','pezzi','pz','assortito','assortiti',
  'vari','varie','gusto','gusti','tipo','tipi','offerta','promo','promozione','speciale','formato'
]);

const PHRASE_ALIASES = [
  [/\bcoca\s*[- ]?\s*cola\b/gi, 'coca cola'],
  [/\bcoca\s*cola\s*zero\s*zuccheri?\b/gi, 'coca cola zero'],
  [/\bcoca\s*cola\s*zero\b/gi, 'coca cola zero'],
  [/\bcoca\s*cola\s*light\b/gi, 'coca cola light'],
  [/\bnutella\s*ferrero\b/gi, 'nutella'],
  [/\bferrero\s*nutella\b/gi, 'nutella'],
  [/\bcarta\s+igienica\b/gi, 'carta igienica'],
  [/\bpassata\s+di\s+pomodoro\b/gi, 'passata pomodoro'],
  [/\btonno\s+all['’]?olio\b/gi, 'tonno olio'],
];

function plain(value='') {
  let text = cleanText(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[’']/g,"'");
  for (const [pattern,replacement] of PHRASE_ALIASES) text=text.replace(pattern,replacement);
  return text;
}

function decimal(value) {
  return Number(String(value).replace(',', '.'));
}

export function extractQuantity(value='') {
  const text=plain(value).replace(/\s+/g,' ');
  const multi=text.match(/\b(\d{1,3})\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|lt|ml|cl)\b/i);
  if(multi){
    const count=Number(multi[1]),amount=decimal(multi[2]),unit=multi[3].toLowerCase();
    return normalizeQuantity(count*amount,unit,count);
  }
  const single=text.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|lt|ml|cl)\b/i);
  if(single)return normalizeQuantity(decimal(single[1]),single[2].toLowerCase(),null);
  const pieces=text.match(/\b(\d{1,3})\s*(?:pz|pezzi|rotoli|capsule|lavaggi|strappi)\b/i);
  if(pieces)return {value:Number(pieces[1]),unit:'pz',label:`${Number(pieces[1])} pz`,multipack:null};
  return null;
}

function normalizeQuantity(amount,unit,multipack){
  if(!Number.isFinite(amount)||amount<=0)return null;
  if(unit==='kg')return {value:Math.round(amount*1000),unit:'g',label:`${formatNumber(amount)} kg`,multipack};
  if(unit==='l'||unit==='lt')return {value:Math.round(amount*1000),unit:'ml',label:`${formatNumber(amount)} L`,multipack};
  if(unit==='cl')return {value:Math.round(amount*10),unit:'ml',label:`${formatNumber(amount*10)} ml`,multipack};
  if(unit==='g')return {value:Math.round(amount),unit:'g',label:`${formatNumber(amount)} g`,multipack};
  return {value:Math.round(amount),unit:'ml',label:`${formatNumber(amount)} ml`,multipack};
}

function formatNumber(value){return Number.isInteger(value)?String(value):String(value).replace('.',',')}

function nameTokens(value=''){
  const text=plain(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|l|lt|ml|cl|pz|pezzi|rotoli|capsule|lavaggi|strappi)\b/g,' ')
    .replace(/\b\d{1,3}\s*[x×]\s*\d+(?:[.,]\d+)?\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ');
  return [...new Set(text.split(/\s+/).filter(token=>token.length>1&&!STOP_WORDS.has(token)))];
}

export function canonicalizeOffer(offer={}){
  const product=cleanText(offer.product||'');
  const format=cleanText(offer.format||'');
  const quantity=extractQuantity(`${product} ${format}`);
  const tokens=nameTokens(product);
  const canonicalName=tokens.join(' ')||normalizeProduct(product);
  const quantityKey=quantity?`${quantity.value}${quantity.unit}`:'';
  const canonicalKey=[canonicalName,quantityKey].filter(Boolean).join('|');
  return {
    ...offer,
    canonicalName,
    canonicalKey,
    canonicalTokens:tokens,
    normalizedQuantity:quantity,
  };
}

export function enrichOffersWithCatalog(offers=[]){
  return offers.map(canonicalizeOffer);
}

export function buildCatalog(offers=[]){
  const groups=new Map();
  for(const offer of enrichOffersWithCatalog(offers)){
    if(!offer.canonicalKey)continue;
    if(!groups.has(offer.canonicalKey))groups.set(offer.canonicalKey,{
      id:offer.canonicalKey,
      canonicalName:offer.canonicalName,
      canonicalKey:offer.canonicalKey,
      quantity:offer.normalizedQuantity,
      aliases:new Set(),
      stores:new Set(),
      offersCount:0,
      minPrice:null,
      maxPrice:null,
    });
    const group=groups.get(offer.canonicalKey);
    group.aliases.add(cleanText(offer.product));
    group.stores.add(cleanText(offer.store||offer.chain));
    group.offersCount+=1;
    const price=Number(offer.price);
    if(Number.isFinite(price)&&price>0){
      group.minPrice=group.minPrice===null?price:Math.min(group.minPrice,price);
      group.maxPrice=group.maxPrice===null?price:Math.max(group.maxPrice,price);
    }
  }
  return [...groups.values()].map(group=>({
    ...group,
    aliases:[...group.aliases].sort((a,b)=>a.localeCompare(b,'it')),
    stores:[...group.stores].filter(Boolean).sort((a,b)=>a.localeCompare(b,'it')),
  })).sort((a,b)=>a.canonicalName.localeCompare(b.canonicalName,'it'));
}
