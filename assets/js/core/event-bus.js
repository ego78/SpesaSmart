export class EventBus {
  constructor(){this.listeners=new Map()}
  on(event,handler){if(typeof handler!=='function')throw new TypeError('handler non valido');const set=this.listeners.get(event)||new Set();set.add(handler);this.listeners.set(event,set);return()=>this.off(event,handler)}
  once(event,handler){const off=this.on(event,payload=>{off();handler(payload)});return off}
  off(event,handler){const set=this.listeners.get(event);if(!set)return;set.delete(handler);if(!set.size)this.listeners.delete(event)}
  emit(event,payload){const direct=[...(this.listeners.get(event)||[])],wild=[...(this.listeners.get('*')||[])];for(const fn of direct)try{fn(payload,event)}catch(err){queueMicrotask(()=>{throw err})}for(const fn of wild)try{fn(payload,event)}catch(err){queueMicrotask(()=>{throw err})}}
  clear(){this.listeners.clear()}
}
export const appEvents=new EventBus();
