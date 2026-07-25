export const PANTRY_KEY='spesaSmart.pantry.v1';

const cleanUnit=value=>String(value||'pz').trim().toLowerCase();
const safeNumber=(value,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?n:fallback};

export function normalizePantryItem(item={}){
 return {
  id:String(item.id||item.productId||crypto.randomUUID?.()||Date.now()),
  productId:String(item.productId||''),
  name:String(item.name||'').trim(),
  quantity:Math.max(0,safeNumber(item.quantity,0)),
  unit:cleanUnit(item.unit),
  minimumQuantity:Math.max(0,safeNumber(item.minimumQuantity,0)),
  expiryDate:String(item.expiryDate||''),
  purchaseDate:String(item.purchaseDate||''),
  store:String(item.store||'').trim(),
  lastPrice:item.lastPrice==null||item.lastPrice===''?null:Math.max(0,safeNumber(item.lastPrice,0)),
  notes:String(item.notes||'').trim(),
  updatedAt:String(item.updatedAt||new Date().toISOString())
 };
}

export function readPantry(){
 try{
  const raw=JSON.parse(localStorage.getItem(PANTRY_KEY)||'[]');
  return Array.isArray(raw)?raw.map(normalizePantryItem).filter(x=>x.name):[];
 }catch{return []}
}

export function writePantry(items){
 localStorage.setItem(PANTRY_KEY,JSON.stringify((items||[]).map(normalizePantryItem)));
}

export function isLowStock(item){
 const x=normalizePantryItem(item);
 return x.minimumQuantity>0&&x.quantity<=x.minimumQuantity;
}

export function daysToExpiry(item,now=new Date()){
 if(!item?.expiryDate)return null;
 const end=new Date(item.expiryDate+'T23:59:59');
 if(Number.isNaN(end.getTime()))return null;
 return Math.ceil((end.getTime()-now.getTime())/86400000);
}

export function pantrySummary(items,now=new Date()){
 const normalized=(items||[]).map(normalizePantryItem);
 return {
  total:normalized.length,
  low:normalized.filter(isLowStock).length,
  expiring:normalized.filter(x=>{const d=daysToExpiry(x,now);return d!=null&&d>=0&&d<=7}).length,
  expired:normalized.filter(x=>{const d=daysToExpiry(x,now);return d!=null&&d<0}).length
 };
}

export function upsertPantry(items,input){
 const next=normalizePantryItem(input),list=(items||[]).map(normalizePantryItem);
 const index=list.findIndex(x=>x.id===next.id||(next.productId&&x.productId===next.productId&&x.unit===next.unit));
 if(index<0)return [next,...list];
 const old=list[index];
 list[index]={...old,...next,id:old.id,updatedAt:new Date().toISOString()};
 return list;
}

export function addPurchasedProducts(items,products,assignments=[]){
 const byId=new Map((assignments||[]).map(x=>[x.product?.id,x]));
 let next=(items||[]).map(normalizePantryItem);
 for(const product of (products||[]).filter(x=>x.checked)){
  const hit=byId.get(product.id);
  const addition=Math.max(0,safeNumber(product.quantity,1));
  const existing=next.find(x=>(x.productId&&x.productId===product.id)||(!x.productId&&x.name.toLowerCase()===String(product.name).toLowerCase()&&x.unit===cleanUnit(product.unit)));
  const entry=normalizePantryItem({
   ...(existing||{}),
   id:existing?.id||product.id,
   productId:product.id,
   name:product.name,
   quantity:safeNumber(existing?.quantity,0)+addition,
   unit:product.unit||existing?.unit||'pz',
   minimumQuantity:existing?.minimumQuantity||0,
   purchaseDate:new Date().toISOString().slice(0,10),
   store:hit?.store?.name||hit?.store?.brand||existing?.store||'',
   lastPrice:hit?.estimate?.cost??hit?.offer?.price??existing?.lastPrice??null,
   notes:existing?.notes||product.notes||'',
   updatedAt:new Date().toISOString()
  });
  next=upsertPantry(next,entry);
 }
 return next;
}
