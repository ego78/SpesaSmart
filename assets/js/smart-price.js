const PIECE_WORDS = new Set([
  'pz','pezzo','pezzi','capsula','capsule','cialda','cialde','rotolo','rotoli',
  'bottiglia','bottiglie','lattina','lattine','lavaggio','lavaggi','strappo','strappi',
  'foglio','fogli','sacchetto','sacchetti','busta','buste','porzione','porzioni'
]);

const UNIT_LABELS = { kg:'kg', l:'L', pz:'pz' };
const DISPLAY_UNITS = { kg:'kg', g:'g', l:'L', ml:'ml', cl:'cl', pz:'pz' };

export function normalizeText(value='') {
  return String(value)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/€/g,' euro ')
    .replace(/[×✕]/g,'x')
    .replace(/\s+/g,' ')
    .trim();
}

export function parseDecimal(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned=String(value??'')
    .replace(/\s/g,'')
    .replace(/\.(?=\d{3}(?:\D|$))/g,'')
    .replace(',','.');
  const match=cleaned.match(/-?\d+(?:\.\d+)?/);
  const number=match?Number(match[0]):NaN;
  return Number.isFinite(number)?number:null;
}

function canonicalRawUnit(unit='') {
  const u=normalizeText(unit).replace(/\./g,'');
  if (u==='kg'||u==='chilogrammo'||u==='chilogrammi') return 'kg';
  if (u==='g'||u==='gr'||u==='grammo'||u==='grammi') return 'g';
  if (u==='l'||u==='lt'||u==='litro'||u==='litri') return 'l';
  if (u==='ml'||u==='millilitro'||u==='millilitri') return 'ml';
  if (u==='cl'||u==='centilitro'||u==='centilitri') return 'cl';
  if (PIECE_WORDS.has(u)) return 'pz';
  return null;
}

function toBaseQuantity(amount, unit) {
  if (!Number.isFinite(amount)||amount<=0||!unit) return null;
  if (unit==='kg') return { value:amount, unit:'kg' };
  if (unit==='g') return { value:amount/1000, unit:'kg' };
  if (unit==='l') return { value:amount, unit:'l' };
  if (unit==='ml') return { value:amount/1000, unit:'l' };
  if (unit==='cl') return { value:amount/100, unit:'l' };
  if (unit==='pz') return { value:amount, unit:'pz' };
  return null;
}

function round(value, digits=4) {
  if (!Number.isFinite(value)) return null;
  const factor=10**digits;
  return Math.round((value+Number.EPSILON)*factor)/factor;
}

function formatNumber(value, max=2) {
  return new Intl.NumberFormat('it-IT',{maximumFractionDigits:max}).format(value);
}

function emptyFormat(sourceText='') {
  return {
    sourceText,
    recognized:false,
    kind:'unknown',
    count:1,
    amount:null,
    rawUnit:null,
    totalRaw:null,
    baseQuantity:null,
    baseUnit:null,
    displayLabel:'',
    confidence:0,
    warnings:['Formato non riconosciuto']
  };
}

/**
 * Interpreta formati come 500 g, 1,5 L, 4x125 g, 2 confezioni da 1 L,
 * 12 rotoli, 30 lavaggi e 6 bottiglie da 330 ml.
 */
export function parsePackFormat(value='') {
  const sourceText=String(value??'').trim();
  const text=normalizeText(sourceText)
    .replace(/\b(?:circa|ca\.?|formato|confezione|conf\.?|vaschetta)\b/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  if (!text) return emptyFormat(sourceText);

  const unitPattern='kg|chilogrammi?|g|gr|grammi?|l|lt|litri?|ml|millilitri?|cl|centilitri?|pz|pezzi?|capsule?|cialde?|rotoli?|bottiglie?|lattine?|lavaggi?|strappi?|fogli?|sacchetti?|buste?|porzioni?';
  let match;

  // 6 bottiglie da 330 ml / 2 confezioni da 1 L
  match=text.match(new RegExp(`\\b(\\d{1,3})\\s*(?:confezioni?|conf\\.?|bottiglie?|lattine?|vasetti?|buste?|pezzi?|pz)?\\s*(?:da|di|x)\\s*(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})\\b`,'i'));
  if (!match) {
    // 4x125 g / 6 x 330 ml
    match=text.match(new RegExp(`\\b(\\d{1,3})\\s*x\\s*(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})\\b`,'i'));
  }
  if (match) {
    const count=Number(match[1]), amount=parseDecimal(match[2]), rawUnit=canonicalRawUnit(match[3]);
    const totalRaw=count*amount, base=toBaseQuantity(totalRaw,rawUnit);
    if (base) return {
      sourceText,recognized:true,kind:'multipack',count,amount,rawUnit,totalRaw,
      baseQuantity:round(base.value),baseUnit:base.unit,
      displayLabel:`${count} × ${formatNumber(amount)} ${DISPLAY_UNITS[rawUnit]||rawUnit}`,
      confidence:1,warnings:[]
    };
  }

  // 12 rotoli / 30 lavaggi / 6 pezzi
  match=text.match(new RegExp(`\\b(\\d{1,4})\\s*(${[...PIECE_WORDS].join('|')})\\b`,'i'));
  if (match) {
    const totalRaw=Number(match[1]);
    return {
      sourceText,recognized:true,kind:'pieces',count:1,amount:totalRaw,rawUnit:'pz',totalRaw,
      baseQuantity:totalRaw,baseUnit:'pz',displayLabel:`${totalRaw} ${normalizeText(match[2])}`,
      confidence:.95,warnings:[]
    };
  }

  // 500 g / 1,5 L
  match=text.match(new RegExp(`\\b(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})\\b`,'i'));
  if (match) {
    const amount=parseDecimal(match[1]), rawUnit=canonicalRawUnit(match[2]), base=toBaseQuantity(amount,rawUnit);
    if (base) return {
      sourceText,recognized:true,kind:rawUnit==='pz'?'pieces':'single',count:1,amount,rawUnit,totalRaw:amount,
      baseQuantity:round(base.value),baseUnit:base.unit,
      displayLabel:`${formatNumber(amount)} ${DISPLAY_UNITS[rawUnit]||rawUnit}`,
      confidence:.95,warnings:[]
    };
  }

  return emptyFormat(sourceText);
}

export function detectUnitPrice(rawOffer={}) {
  const direct=parseDecimal(rawOffer.unitPrice);
  const label=normalizeText(rawOffer.unitPriceLabel||rawOffer.priceLabel||'');
  let unit=null;
  if (/\b(?:kg|chilogramm)/.test(label)) unit='kg';
  else if (/\b(?:l|lt|litro|litri)\b/.test(label)) unit='l';
  else if (/\b(?:pz|pezzo|cad|cadauno)\b/.test(label)) unit='pz';
  if (direct&&unit) return { value:round(direct,2), unit, source:'declared', confidence:1, warning:null };
  if (direct&&!unit) return { value:round(direct,2), unit:null, source:'declared-unlabeled', confidence:.45, warning:'Unità del prezzo unitario non indicata' };

  // Etichette come "€ 4,99/kg" quando unitPrice non è separato.
  const embedded=String(rawOffer.unitPriceLabel||rawOffer.priceLabel||'').match(/(\d+(?:[.,]\d+)?)\s*(?:€|euro)?\s*\/?\s*(kg|l|lt|pz|pezzo)/i);
  if (embedded) return { value:round(parseDecimal(embedded[1]),2), unit:canonicalRawUnit(embedded[2]), source:'label', confidence:.95 };
  return null;
}

export function normalizeOfferPrice(rawOffer={}) {
  const price=parseDecimal(rawOffer.price);
  const formatText=[rawOffer.format,rawOffer.quantityLabel,rawOffer.product].filter(Boolean).join(' ');
  const pack=parsePackFormat(formatText);
  const declared=detectUnitPrice(rawOffer);
  const warnings=[...pack.warnings];
  if (declared?.warning) warnings.push(declared.warning);
  let unitPrice=declared?.value??null;
  let unitPriceUnit=declared?.unit??null;
  if (unitPrice&&!unitPriceUnit) unitPriceUnit=pack.baseUnit||'kg';
  let unitPriceSource=declared?.source??null;

  if (!unitPrice&&price&&pack.baseQuantity&&pack.baseUnit) {
    unitPrice=round(price/pack.baseQuantity,2);
    unitPriceUnit=pack.baseUnit;
    unitPriceSource='calculated';
  }
  if (!price) warnings.push('Prezzo mancante o non valido');
  if (!unitPrice) warnings.push('Prezzo unitario non calcolabile');

  return {
    ...rawOffer,
    price,
    normalizedFormat:pack,
    normalizedQuantity:pack.baseQuantity,
    normalizedUnit:pack.baseUnit,
    unitPrice,
    unitPriceUnit,
    unitPriceSource,
    unitPriceLabel:unitPrice&&unitPriceUnit
      ?`${formatNumber(unitPrice)} €/${UNIT_LABELS[unitPriceUnit]||unitPriceUnit}`:'',
    // Alias mantenuti per compatibilità con l'interfaccia v10.
    calculatedUnitPrice:unitPrice,
    calculatedUnit:unitPriceUnit,
    calculatedUnitLabel:unitPrice&&unitPriceUnit
      ?`${formatNumber(unitPrice)} €/${UNIT_LABELS[unitPriceUnit]||unitPriceUnit}`:'',
    _format:{
      count:pack.count,
      amount:pack.amount,
      total:pack.totalRaw,
      unit:pack.rawUnit,
      source:pack.kind
    },
    priceQuality:warnings.length===0?'complete':price?'partial':'invalid',
    priceWarnings:[...new Set(warnings)]
  };
}

function normalizeRequestedQuantity(product={}) {
  const amount=parseDecimal(product.quantity)??1;
  const unit=canonicalRawUnit(product.unit)||((product.unit==='conf')?'conf':null)||'pz';
  if (unit==='conf') return { value:amount, unit:'conf' };
  return toBaseQuantity(amount,unit)||{value:amount,unit:'pz'};
}

/** Calcola quante confezioni servono e il costo reale per coprire la quantità richiesta. */
export function estimatePurchase(product={},rawOffer={}) {
  const offer=rawOffer.normalizedFormat?rawOffer:normalizeOfferPrice(rawOffer);
  const requested=normalizeRequestedQuantity(product);
  const price=parseDecimal(offer.price)||0;
  const packQuantity=offer.normalizedQuantity;
  const packUnit=offer.normalizedUnit;
  let packages=1, coveredQuantity=null, compatible=false, reason='';

  if (requested.unit==='conf') {
    packages=Math.max(1,Math.ceil(requested.value));
    coveredQuantity=packages;
    compatible=true;
    reason='Quantità richiesta in confezioni';
  } else if (packQuantity&&packUnit===requested.unit) {
    packages=Math.max(1,Math.ceil(requested.value/packQuantity));
    coveredQuantity=round(packages*packQuantity);
    compatible=true;
    reason='Unità compatibili';
  } else if (requested.unit==='pz'&&!packQuantity) {
    packages=Math.max(1,Math.ceil(requested.value));
    coveredQuantity=packages;
    compatible=true;
    reason='Formato non indicato: una confezione per pezzo richiesto';
  } else {
    packages=Math.max(1,Math.ceil(requested.value));
    coveredQuantity=packages;
    reason='Unità o formato non confrontabili';
  }

  const cost=round(packages*price,2)||0;
  const oldPrice=parseDecimal(offer.oldPrice);
  const saving=oldPrice&&oldPrice>price&&oldPrice/price<4?round(packages*(oldPrice-price),2):0;
  const excess=compatible&&coveredQuantity!=null&&requested.unit!=='conf'?round(coveredQuantity-requested.value):null;
  const warnings=[...offer.priceWarnings];
  if (!compatible) warnings.push(reason);
  if (excess>0) warnings.push(`Quantità eccedente: ${formatNumber(excess)} ${UNIT_LABELS[requested.unit]||requested.unit}`);

  return {
    packages,cost,saving,compatible,reason,
    requestedQuantity:requested.value,requestedUnit:requested.unit,
    coveredQuantity,coveredUnit:requested.unit,
    excessQuantity:excess,
    unitPrice:offer.unitPrice,unitPriceUnit:offer.unitPriceUnit,
    label:packages>1?`${packages} confezioni · ${formatNumber(cost)} €`:`${formatNumber(cost)} €`,
    warnings:[...new Set(warnings)]
  };
}

export function compareOffersForProduct(product,offerA,offerB) {
  const a=estimatePurchase(product,offerA), b=estimatePurchase(product,offerB);
  if (a.compatible!==b.compatible) return a.compatible?-1:1;
  if (a.cost!==b.cost) return a.cost-b.cost;
  const au=a.unitPrice??Infinity, bu=b.unitPrice??Infinity;
  if (au!==bu) return au-bu;
  return a.packages-b.packages;
}

export function smartPriceSummary(rawOffer={}) {
  const offer=rawOffer.normalizedFormat?rawOffer:normalizeOfferPrice(rawOffer);
  return {
    format:offer.normalizedFormat?.displayLabel||offer.format||'',
    unitPriceLabel:offer.unitPriceLabel||'',
    quality:offer.priceQuality,
    warnings:offer.priceWarnings||[]
  };
}
