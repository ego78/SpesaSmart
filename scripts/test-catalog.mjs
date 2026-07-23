import assert from 'node:assert/strict';
import { canonicalizeOffer, buildCatalog, extractQuantity } from '../connectors/catalog.mjs';

assert.deepEqual(extractQuantity('6 x 330 ml'),{value:1980,unit:'ml',label:'1980 ml',multipack:6});
assert.equal(canonicalizeOffer({product:'Coca-Cola PET',format:'1,5 L'}).canonicalKey,'coca cola pet|1500ml');
assert.equal(canonicalizeOffer({product:'Coca Cola PET 1500 ml'}).canonicalKey,'coca cola pet|1500ml');
const catalog=buildCatalog([
  {product:'Coca-Cola PET',format:'1,5 L',store:'PENNY',price:1.49},
  {product:'Coca Cola PET 1500 ml',store:'Lidl',price:1.39},
]);
assert.equal(catalog.length,1);
assert.equal(catalog[0].offersCount,2);
assert.equal(catalog[0].minPrice,1.39);
console.log('Catalogo: test superati');
