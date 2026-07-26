export const PRODUCT_CATALOG_KEY='spesaSmart.productCatalog.v1';
export const PRODUCT_ALIASES_KEY='spesaSmart.productAliases.v1';

const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(?:kg|g|gr|ml|cl|l|lt|pz|conf|x)\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const tokens=value=>new Set(norm(value).split(' ').filter(x=>x.length>1));
const safeRead=(key,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key)||'null');return x??fallback}catch{return fallback}};
const safeWrite=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const id=()=>crypto.randomUUID?.()||`prd-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function similarity(a,b){
 const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;
 let common=0;for(const x of aa)if(bb.has(x))common++;
 const j=common/(aa.size+bb.size-common);
 const na=norm(a),nb=norm(b);const contains=na.includes(nb)||nb.includes(na)?0.18:0;
 return Math.min(1,j+contains);
}

export function readProductCatalog(){return safeRead(PRODUCT_CATALOG_KEY,[])}
export function writeProductCatalog(rows){safeWrite(PRODUCT_CATALOG_KEY,rows||[])}
export function readAliasMemory(){return safeRead(PRODUCT_ALIASES_KEY,{})}
export function writeAliasMemory(value){safeWrite(PRODUCT_ALIASES_KEY,value||{})}

export function buildProductCatalog({products=[],pantry=[],receipts=[],offers=[]}={}){
 const byKey=new Map();
 const add=(name,extra={})=>{const key=norm(name);if(!key)return;const old=byKey.get(key)||{};byKey.set(key,{id:old.id||extra.productId||extra.id||id(),name:old.name||String(name).trim(),brand:old.brand||extra.brand||'',category:old.category||extra.category||'',size:old.size||extra.format||extra.size||'',barcode:old.barcode||extra.barcode||'',aliases:[...new Set([...(old.aliases||[]),...(extra.aliases||[])])],seen:Number(old.seen||0)+1,lastSeen:new Date().toISOString()})};
 for(const x of readProductCatalog())add(x.name,x);
 for(const x of products)add(x.name,x);
 for(const x of pantry)add(x.name,x);
 for(const r of receipts)for(const x of r.lines||[])add(x.name,x);
 for(const x of offers.slice(0,2500))add(x.product,x);
 const rows=[...byKey.values()];writeProductCatalog(rows);return rows;
}

export function recognizeProduct(rawName,catalog,limit=4){
 const raw=String(rawName||'').trim(),key=norm(raw),aliases=readAliasMemory();
 const rememberedId=aliases[key];
 const scored=(catalog||[]).map(item=>{
  let score=similarity(raw,item.name);let source='similarità';
  if(norm(item.name)===key){score=1;source='nome esatto'}
  if((item.aliases||[]).some(a=>norm(a)===key)){score=0.99;source='alias catalogo'}
  if(rememberedId&&item.id===rememberedId){score=1;source='memoria personale'}
  return{item,score,source};
 }).filter(x=>x.score>=0.28).sort((a,b)=>b.score-a.score).slice(0,limit);
 const best=scored[0]||null;const confidence=Math.round((best?.score||0)*100);
 return{raw,best,candidates:scored,confidence,status:confidence>=95?'auto':confidence>=75?'verify':'unknown'};
}

export function recognizeReceiptLines(lines,catalog){
 return (lines||[]).map(line=>{const hit=recognizeProduct(line.name,catalog);return{...line,rawName:line.rawName||line.name,productId:hit.best?.item?.id||'',name:hit.status==='auto'&&hit.best?hit.best.item.name:line.name,recognition:hit}})
}

export function learnReceiptLines(lines,catalog){
 const aliases=readAliasMemory(),rows=[...(catalog||[])];
 for(const line of lines||[]){
  const raw=norm(line.rawName||line.name);if(!raw)continue;
  let item=rows.find(x=>x.id===line.productId);
  if(!item){item={id:line.productId||id(),name:String(line.name||line.rawName).trim(),brand:'',category:'',size:'',barcode:'',aliases:[],seen:0,lastSeen:new Date().toISOString()};rows.unshift(item);line.productId=item.id}
  aliases[raw]=item.id;item.aliases=[...new Set([...(item.aliases||[]),line.rawName].filter(Boolean))];item.seen=Number(item.seen||0)+1;item.lastSeen=new Date().toISOString();
 }
 writeAliasMemory(aliases);writeProductCatalog(rows);return rows;
}
