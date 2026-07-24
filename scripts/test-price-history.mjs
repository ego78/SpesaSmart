import assert from 'node:assert/strict';
import { historyForProduct, summarizeHistory } from '../assets/js/price-history.js';
const product={id:'1',name:'pasta',brand:'',format:'',notes:'',allowAlternatives:true};
const history={snapshots:[{date:'2026-07-20',offers:[{product:'Pasta di semola',store:'Lidl',price:1.2,unitPrice:2.4,unitPriceLabel:'2,40 €/kg'}]},{date:'2026-07-21',offers:[{product:'Pasta di semola',store:'Lidl',price:1,unitPrice:2,unitPriceLabel:'2,00 €/kg'}]}]};
const rows=historyForProduct(product,history);assert.equal(rows.length,2);assert.equal(rows[0].date,'2026-07-21');
const s=summarizeHistory(rows,2);assert.equal(s.min,2);assert.equal(s.average,2.2);assert.equal(s.label,'Prezzo ottimo');
console.log('Storico prezzi: test superati');
