import assert from 'node:assert/strict';
import { buildPerfectShoppingPlans } from '../assets/js/perfect-shopping.js';
const products=[{id:'p1',name:'Latte',quantity:2,unit:'l'},{id:'p2',name:'Pasta',quantity:1,unit:'kg'}];
const stores=[{id:'a',name:'A',selected:true},{id:'b',name:'B',selected:true}];
const data={a:[{product:'Latte intero',price:1,format:'1 L',store:'A'},{product:'Pasta',price:1.5,format:'1 kg',store:'A'}],b:[{product:'Latte',price:.8,format:'1 L',store:'B'},{product:'Pasta',price:2,format:'1 kg',store:'B'}]};
const out=buildPerfectShoppingPlans(products,stores,s=>data[s.id]);
assert.equal(out.plans.length,3);assert.equal(out.plans[0].id,'cheapest');assert.equal(out.plans[1].id,'balanced');assert.equal(out.plans[2].id,'single');assert.ok(out.plans[0].total>0);assert.ok(out.plans[2].storeCount<=1);console.log('Spesa Perfetta: test superati');
