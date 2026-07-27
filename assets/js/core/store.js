const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
export class AppStore {
  constructor(initialState={},events=null){this.state=clone(initialState);this.events=events;this.version=0}
  getState(){return this.state}
  select(selector){return selector(this.state)}
  replace(nextState,meta={}){const previous=this.state;this.state=clone(nextState);this.version++;this.events?.emit('store:changed',{state:this.state,previous,version:this.version,meta});return this.state}
  patch(partial,meta={}){return this.replace({...this.state,...clone(partial)},meta)}
  update(updater,meta={}){if(typeof updater!=='function')throw new TypeError('updater non valido');return this.replace(updater(clone(this.state)),meta)}
}
