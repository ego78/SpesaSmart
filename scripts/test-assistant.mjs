import assert from'node:assert/strict';
import{buildAssistantContext,answerAssistant,addLowStockToList,weeklyReport}from'../assets/js/assistant.js';
const ctx=buildAssistantContext({products:[{id:'1',name:'Latte',quantity:2,unit:'l',priority:'needed'}],pantry:[{id:'p',name:'Pasta',quantity:0,minimumQuantity:2,unit:'kg'}],receipts:[],analyticsSettings:{monthlyBudget:500},plans:[{total:20,storeCount:1,stores:[{store:'Lidl',total:20,count:1}]}]});
assert.match(answerAssistant('cosa manca in dispensa',ctx).body,/Pasta/);
assert.match(answerAssistant('dove conviene',ctx).body,/20,00/);
assert.match(weeklyReport(ctx).title,/settimana/i);
const result=addLowStockToList([],ctx.pantry);assert.equal(result.added.length,1);assert.equal(result.products[0].name,'Pasta');
console.log('Assistente Smart: test superati');
