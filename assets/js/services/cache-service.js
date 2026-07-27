export class MemoryCache {
  constructor(){this.map=new Map()}
  set(key,value,ttlMs=0){this.map.set(key,{value,expires:ttlMs?Date.now()+ttlMs:0});return value}
  get(key){const entry=this.map.get(key);if(!entry)return undefined;if(entry.expires&&entry.expires<Date.now()){this.map.delete(key);return undefined}return entry.value}
  has(key){return this.get(key)!==undefined}
  delete(key){return this.map.delete(key)}
  clear(prefix=''){if(!prefix){this.map.clear();return}for(const key of this.map.keys())if(String(key).startsWith(prefix))this.map.delete(key)}
  async remember(key,factory,ttlMs=0){const cached=this.get(key);if(cached!==undefined)return cached;const value=await factory();return this.set(key,value,ttlMs)}
}
export const appCache=new MemoryCache();
