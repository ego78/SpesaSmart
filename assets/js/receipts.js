export const RECEIPTS_KEY='spesaSmart.receipts.v1';

const num=(value,fallback=0)=>{if(value==null||value==='')return fallback;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:fallback};
const clean=value=>String(value||'').trim();

export function normalizeReceiptLine(line={}){
 const quantity=Math.max(0.01,num(line.quantity,1));
 const unitPrice=Math.max(0,num(line.unitPrice,line.price));
 return {
  id:String(line.id||crypto.randomUUID?.()||Date.now()+Math.random()),
  name:clean(line.name),
  rawName:clean(line.rawName||line.name),
  productId:clean(line.productId),
  quantity,
  unit:clean(line.unit||'pz').toLowerCase(),
  unitPrice,
  total:Math.round(quantity*unitPrice*100)/100,
  addToPantry:line.addToPantry!==false
 };
}

export function normalizeReceipt(receipt={}){
 const lines=Array.isArray(receipt.lines)?receipt.lines.map(normalizeReceiptLine).filter(x=>x.name):[];
 return {
  id:String(receipt.id||crypto.randomUUID?.()||Date.now()),
  store:clean(receipt.store),
  date:clean(receipt.date||new Date().toISOString().slice(0,10)),
  note:clean(receipt.note),
  lines,
  total:Math.round(lines.reduce((sum,x)=>sum+x.total,0)*100)/100,
  createdAt:String(receipt.createdAt||new Date().toISOString()),
  updatedAt:String(receipt.updatedAt||new Date().toISOString())
 };
}

export function readReceipts(){
 try{const value=JSON.parse(localStorage.getItem(RECEIPTS_KEY)||'[]');return Array.isArray(value)?value.map(normalizeReceipt):[]}catch{return []}
}

export function writeReceipts(receipts){
 localStorage.setItem(RECEIPTS_KEY,JSON.stringify((receipts||[]).map(normalizeReceipt)));
}

export function upsertReceipt(receipts,input){
 const next=normalizeReceipt(input),list=(receipts||[]).map(normalizeReceipt),i=list.findIndex(x=>x.id===next.id);
 if(i<0)return [next,...list];
 list[i]={...list[i],...next,id:list[i].id,updatedAt:new Date().toISOString()};
 return list;
}

export function receiptsSummary(receipts,now=new Date()){
 const list=(receipts||[]).map(normalizeReceipt),month=now.toISOString().slice(0,7),monthRows=list.filter(x=>String(x.date).startsWith(month));
 return {
  count:list.length,
  monthCount:monthRows.length,
  monthTotal:Math.round(monthRows.reduce((sum,x)=>sum+x.total,0)*100)/100,
  products:monthRows.reduce((sum,x)=>sum+x.lines.reduce((s,l)=>s+l.quantity,0),0)
 };
}

export function receiptToPantry(receipt,pantryItems,normalizePantryItem,upsertPantry){
 let next=[...(pantryItems||[])];
 for(const line of normalizeReceipt(receipt).lines.filter(x=>x.addToPantry)){
  const existing=next.find(x=>String(x.name).toLowerCase()===line.name.toLowerCase()&&String(x.unit||'pz')===line.unit);
  const item=normalizePantryItem({
   ...(existing||{}),
   id:existing?.id||line.id,
   name:line.name,
   quantity:Number(existing?.quantity||0)+line.quantity,
   unit:line.unit,
   purchaseDate:receipt.date,
   store:receipt.store,
   lastPrice:line.total,
   updatedAt:new Date().toISOString()
  });
  next=upsertPantry(next,item);
 }
 return next;
}
