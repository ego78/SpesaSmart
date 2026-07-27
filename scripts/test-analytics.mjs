import assert from'node:assert/strict';
import{buildSpendingAnalytics,budgetStatus}from'../assets/js/analytics.js';
const receipts=[{date:'2026-07-01',store:'Lidl',total:10,lines:[{name:'Latte',productId:'p1',quantity:2,total:4},{name:'Pasta',productId:'p2',quantity:1,total:6}]},{date:'2026-07-05',store:'Penny',total:5,lines:[{name:'Latte',productId:'p1',quantity:1,total:5}]},{date:'2026-06-03',store:'Lidl',total:8,lines:[]}];
const a=buildSpendingAnalytics(receipts,[{id:'p1',category:'Fresco'},{id:'p2',category:'Dispensa'}],new Date('2026-07-27T12:00:00Z'));
assert.equal(a.monthTotal,15);assert.equal(a.receiptCount,2);assert.equal(a.byStore[0].name,'Lidl');assert.equal(a.byCategory.find(x=>x.name==='Fresco').total,9);assert.equal(a.monthlyTrend.length,2);assert.equal(budgetStatus(90,100,80).tone,'warning');assert.equal(budgetStatus(110,100).over,10);console.log('Analytics: test superati');
