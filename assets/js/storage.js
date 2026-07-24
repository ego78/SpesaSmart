export const PK='spesaSmart.products.v2',SK='spesaSmart.settings.v1';
const OLD_PK='spesaSmart.products.v1';
export function read(k,f){try{let raw=localStorage.getItem(k);if(raw==null&&k===PK)raw=localStorage.getItem(OLD_PK);const value=JSON.parse(raw);if(k===PK&&Array.isArray(value))return value.map(p=>({quantity:1,unit:'pz',priority:'normal',allowAlternatives:true,checked:false,notes:'',...p}));return value??f}catch{return f}}
export function write(k,v){localStorage.setItem(k,JSON.stringify(v))}
export function family(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'')}
