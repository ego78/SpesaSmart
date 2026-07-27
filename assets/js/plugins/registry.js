export class PluginRegistry {
  constructor(){this.plugins=new Map()}
  register(plugin){if(!plugin?.id)throw new Error('Plugin senza id');if(this.plugins.has(plugin.id))throw new Error(`Plugin già registrato: ${plugin.id}`);this.plugins.set(plugin.id,Object.freeze({...plugin}));return plugin}
  get(id){return this.plugins.get(id)}
  list(type=''){return [...this.plugins.values()].filter(p=>!type||p.type===type)}
  supports(id,capability){return Boolean(this.get(id)?.capabilities?.includes(capability))}
}
export const supermarketPlugins=new PluginRegistry();
for(const plugin of [
 {id:'lidl',type:'supermarket',name:'Lidl',capabilities:['offers','flyers']},
 {id:'penny',type:'supermarket',name:'PENNY',capabilities:['offers','flyers','local-store']},
 {id:'eurospin',type:'supermarket',name:'Eurospin',capabilities:['offers','flyers','local-store']}
]) supermarketPlugins.register(plugin);
