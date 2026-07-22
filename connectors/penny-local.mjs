import { cleanText, numberValue } from './common.mjs';

const API='https://next.doveconviene.it/api/flyer';
const LANDING='https://www.penny.it/sfoglia-il-volantino-mobile';
const DEFAULT_FLYER_ID='1635909';

async function getJson(url,{allow404=false}={}){
  const r=await fetch(url,{headers:{accept:'application/json,text/plain,*/*','user-agent':'SpesaSmart/3.0 (+GitHub Actions)'},cache:'no-store'});
  if(allow404&&r.status===404)return null;
  if(!r.ok)throw new Error(`HTTP ${r.status} su ${url}`);
  return r.json();
}

async function discoverFlyerId(){
  const forced=String(process.env.PENNY_FLYER_ID||'').trim();
  if(forced)return forced;
  try{
    const r=await fetch(LANDING,{headers:{'user-agent':'Mozilla/5.0 SpesaSmart/3.0'},cache:'no-store'});
    if(r.ok){
      const html=await r.text();
      const patterns=[
        /next\.doveconviene\.it[^"'\s]*\/flyer\/(\d+)/i,
        /\/api\/flyer\/(\d+)/i,
        /[?&](?:flyerId|flyer_id|idFlyer)=(\d+)/i,
        /"(?:flyerId|flyer_id|idFlyer)"\s*:\s*"?(\d+)"?/i
      ];
      for(const p of patterns){const m=html.match(p);if(m?.[1])return m[1]}
    }
  }catch(e){console.warn(`PENNY: rilevamento volantino non riuscito (${e.message})`)}
  return DEFAULT_FLYER_ID;
}

function haversine(a,b,c,d){
  const R=6371,toRad=x=>x*Math.PI/180;
  const x=toRad(c-a),y=toRad(d-b);
  const z=Math.sin(x/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(y/2)**2;
  return 2*R*Math.asin(Math.sqrt(z));
}

function nearestStore(rows,store){
  const lat=Number(store.lat),lon=Number(store.lon);
  return [...rows].sort((a,b)=>haversine(lat,lon,Number(a.lat),Number(a.lon))-haversine(lat,lon,Number(b.lat),Number(b.lon)))[0]||null;
}

function imageUrl(basePath,path){
  if(!path)return'';
  if(/^https?:\/\//i.test(path))return path;
  return String(basePath||'')+String(path).replace(/^\//,'');
}

function toOffer(raw,meta,store,officialStore,section,index){
  const p=raw?.product||raw;
  if(!p||p.type==='image'||!p.name)return null;
  const discounted=numberValue(p.price?.discounted??p.price?.full);
  if(!Number.isFinite(discounted))return null;
  const full=numberValue(p.price?.full);
  const officialId=String(officialStore?.id||''),appId=String(store.id||'');
  return {
    id:`penny-${meta.id}-${officialId||appId}-${p.id||p.externalId||`${section}-${index}`}`,
    store:'PENNY',chain:'PENNY',product:cleanText(p.name),brand:'',format:cleanText(p.subName||''),category:cleanText(p.categoryName||''),
    price:discounted,oldPrice:Number.isFinite(full)&&full>discounted?full:null,discount:cleanText(p.price?.discount||''),
    description:cleanText(p.description||''),image:imageUrl(meta.basePath,p.productImage||p.props?.src),
    validFrom:meta.dateFrom||'',validTo:meta.dateTo||'',sourceUrl:LANDING,source:'PENNY / DoveConviene',
    localValidityVerified:true,offerScope:'local-store',flyerId:String(meta.id||''),flyerStoreId:appId,officialStoreId:officialId,
    nearestStore:{id:appId,name:store.name||'PENNY',brand:store.brand||'PENNY',address:store.address||'',lat:Number(store.lat),lon:Number(store.lon),distance:Number(store.distance)||null},
    locations:[{id:appId,name:store.name||'PENNY',brand:store.brand||'PENNY',address:store.address||'',lat:Number(store.lat),lon:Number(store.lon),distance:Number(store.distance)||null,officialStoreId:officialId}],
    fetchedAt:new Date().toISOString()
  };
}

async function scanSection(flyerId,section,meta,store,officialStore){
  const out=[],batchSize=20,maxProducts=240;
  for(let start=0;start<maxProducts;start+=batchSize){
    const batch=await Promise.all(Array.from({length:batchSize},(_,j)=>{
      const index=start+j;
      return getJson(`${API}/${flyerId}/section/${section}/product/${index}`,{allow404:true}).then(raw=>({raw,index})).catch(()=>({raw:null,index}));
    }));
    let found=0;
    for(const {raw,index} of batch){if(raw){found++;const offer=toOffer(raw,meta,store,officialStore,section,index);if(offer)out.push(offer)}}
    if(found===0)break;
  }
  return out;
}

export async function scanPennyLocal(store){
  if(!Number.isFinite(Number(store?.lat))||!Number.isFinite(Number(store?.lon)))throw new Error('Coordinate PENNY mancanti');
  const flyerId=await discoverFlyerId();
  const meta=await getJson(`${API}/${flyerId}`);
  const storeData=await getJson(`${API}/${flyerId}/stores?ll=${encodeURIComponent(`${store.lat},${store.lon}`)}`);
  const officialStore=nearestStore(Array.isArray(storeData?.value)?storeData.value:[],store);
  if(!officialStore)throw new Error(`Nessun punto vendita PENNY associato al volantino ${flyerId}`);
  console.log(`PENNY: ${store.name||store.address} → store ufficiale ${officialStore.id}, volantino ${flyerId}, valido fino al ${meta.dateTo||'n/d'}`);
  const offers=[];let emptySections=0;
  for(let section=0;section<40&&emptySections<3;section++){
    const sectionOffers=await scanSection(flyerId,section,meta,store,officialStore);
    if(sectionOffers.length){offers.push(...sectionOffers);emptySections=0}else emptySections++;
  }
  if(!offers.length)throw new Error(`Volantino ${flyerId} raggiunto, ma nessun prodotto con prezzo estratto`);
  return offers;
}
