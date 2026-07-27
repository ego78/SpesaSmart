const operators={lt:(a,b)=>a<b,lte:(a,b)=>a<=b,gt:(a,b)=>a>b,gte:(a,b)=>a>=b,eq:(a,b)=>a===b,includes:(a,b)=>Array.isArray(a)&&a.includes(b)};
const resolve=(obj,path)=>String(path||'').split('.').filter(Boolean).reduce((v,k)=>v?.[k],obj);
export class RuleEngine {
  constructor(rules=[]){this.rules=[...rules]}
  add(rule){if(!rule?.id||!rule.when||typeof rule.then!=='function')throw new Error('Regola non valida');this.rules.push(rule);return this}
  evaluate(context){const results=[];for(const rule of this.rules){const actual=resolve(context,rule.when.path),test=operators[rule.when.operator||'eq'];if(test?.(actual,rule.when.value)){const output=rule.then(context,actual);results.push({id:rule.id,output})}}return results}
}
export const createDefaultRules=()=>new RuleEngine()
 .add({id:'budget-warning',when:{path:'analytics.budgetPercent',operator:'gte',value:90},then:()=>({type:'warning',message:'Hai utilizzato almeno il 90% del budget mensile.'})});
