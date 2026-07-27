export class PerformanceMonitor {
  constructor({limit=100}={}){this.limit=limit;this.entries=[]}
  start(name,meta={}){const started=performance.now();return(extra={})=>this.record(name,performance.now()-started,{...meta,...extra})}
  record(name,duration,meta={}){const entry={name,duration:Math.round(duration*100)/100,at:new Date().toISOString(),meta};this.entries.push(entry);if(this.entries.length>this.limit)this.entries.shift();return entry}
  measure(name,fn,meta={}){const end=this.start(name,meta);try{const value=fn();if(value&&typeof value.then==='function')return value.finally(()=>end());end();return value}catch(error){end({error:true});throw error}}
  recent(name){return this.entries.filter(x=>!name||x.name===name)}
}
export const performanceMonitor=new PerformanceMonitor();
