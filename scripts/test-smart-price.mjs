import assert from 'node:assert/strict';
import { parsePackFormat, normalizeOfferPrice, estimatePurchase, compareOffersForProduct, parseDecimal } from '../assets/js/smart-price.js';

assert.equal(parseDecimal('€ 1,49'),1.49);
assert.equal(parseDecimal('1.299,50'),1299.5);

const cases=[
 ['500 g',{baseQuantity:.5,baseUnit:'kg',kind:'single'}],
 ['1 kg',{baseQuantity:1,baseUnit:'kg',kind:'single'}],
 ['1,5 kg',{baseQuantity:1.5,baseUnit:'kg',kind:'single'}],
 ['750 ml',{baseQuantity:.75,baseUnit:'l',kind:'single'}],
 ['1 L',{baseQuantity:1,baseUnit:'l',kind:'single'}],
 ['2x500 g',{baseQuantity:1,baseUnit:'kg',kind:'multipack',count:2}],
 ['4 x 125 g',{baseQuantity:.5,baseUnit:'kg',kind:'multipack',count:4}],
 ['2 confezioni da 1 L',{baseQuantity:2,baseUnit:'l',kind:'multipack',count:2}],
 ['6 bottiglie da 330 ml',{baseQuantity:1.98,baseUnit:'l',kind:'multipack',count:6}],
 ['12 rotoli',{baseQuantity:12,baseUnit:'pz',kind:'pieces'}],
 ['30 lavaggi',{baseQuantity:30,baseUnit:'pz',kind:'pieces'}],
 ['10 capsule',{baseQuantity:10,baseUnit:'pz',kind:'pieces'}],
];
for(const [input,expected] of cases){const got=parsePackFormat(input);for(const [key,value] of Object.entries(expected))assert.equal(got[key],value,`${input}: ${key}`)}
assert.equal(parsePackFormat('formato famiglia').recognized,false);

let offer=normalizeOfferPrice({product:'Pasta',format:'500 g',price:'0,89'});
assert.equal(offer.normalizedQuantity,.5);
assert.equal(offer.normalizedUnit,'kg');
assert.equal(offer.unitPrice,1.78);
assert.equal(offer.unitPriceLabel,'1,78 €/kg');

let multi=normalizeOfferPrice({product:'Yogurt',format:'4x125 g',price:1.2});
assert.equal(multi.normalizedQuantity,.5);
assert.equal(multi.unitPrice,2.4);

let declared=normalizeOfferPrice({product:'Pollo sfuso',price:4.49,unitPrice:4.49,unitPriceLabel:'4,49 €/kg'});
assert.equal(declared.unitPrice,4.49);
assert.equal(declared.unitPriceUnit,'kg');
assert.equal(declared.unitPriceSource,'declared');

let milk=estimatePurchase({quantity:3,unit:'l'},normalizeOfferPrice({product:'Latte',format:'1 L',price:.89}));
assert.equal(milk.packages,3);
assert.equal(milk.cost,2.67);
assert.equal(milk.compatible,true);

let pasta=estimatePurchase({quantity:2,unit:'kg'},normalizeOfferPrice({product:'Pasta',format:'500 g',price:.89}));
assert.equal(pasta.packages,4);
assert.equal(pasta.cost,3.56);
assert.equal(pasta.coveredQuantity,2);

let yogurt=estimatePurchase({quantity:1,unit:'kg'},normalizeOfferPrice({product:'Yogurt',format:'4x125 g',price:1.2}));
assert.equal(yogurt.packages,2);
assert.equal(yogurt.cost,2.4);

let rolls=estimatePurchase({quantity:18,unit:'pz'},normalizeOfferPrice({product:'Carta igienica',format:'12 rotoli',price:4.99}));
assert.equal(rolls.packages,2);
assert.equal(rolls.coveredQuantity,24);
assert.equal(rolls.excessQuantity,6);

const product={quantity:2,unit:'kg'};
const half=normalizeOfferPrice({product:'Pasta',format:'500 g',price:.89});
const kilo=normalizeOfferPrice({product:'Pasta',format:'1 kg',price:1.49});
assert.ok(compareOffersForProduct(product,kilo,half)<0,'La confezione da 1 kg deve risultare più conveniente per 2 kg');

const incomplete=normalizeOfferPrice({product:'Prodotto misterioso',price:2.5,format:'formato famiglia'});
assert.equal(incomplete.priceQuality,'partial');
assert.ok(incomplete.priceWarnings.includes('Formato non riconosciuto'));

console.log(`Smart Price Engine: ${cases.length+15} controlli superati`);
