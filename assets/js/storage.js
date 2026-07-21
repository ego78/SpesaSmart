export const PK='spesaSmart.products.v1',SK='spesaSmart.settings.v1';
export function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
export function write(k,v){localStorage.setItem(k,JSON.stringify(v))}
export function family(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'')}
