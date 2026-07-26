const OCR_SCRIPT='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
let loaderPromise;

const clean=s=>String(s||'').replace(/[|_]+/g,' ').replace(/\s+/g,' ').trim();
const moneyValue=s=>{const n=Number(String(s||'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null};

export async function loadReceiptOcr(){
 if(globalThis.Tesseract)return globalThis.Tesseract;
 if(loaderPromise)return loaderPromise;
 loaderPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=OCR_SCRIPT;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>globalThis.Tesseract?resolve(globalThis.Tesseract):reject(new Error('Motore OCR non disponibile'));
  script.onerror=()=>reject(new Error('Impossibile caricare il motore OCR. Controlla la connessione.'));
  document.head.appendChild(script);
 });
 return loaderPromise;
}

async function prepareImage(file){
 const bitmap=await createImageBitmap(file);
 const maxWidth=1800,scale=Math.min(1,maxWidth/bitmap.width),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,w,h);bitmap.close?.();
 const data=ctx.getImageData(0,0,w,h),p=data.data;
 for(let i=0;i<p.length;i+=4){const gray=0.299*p[i]+0.587*p[i+1]+0.114*p[i+2],v=gray>195?255:gray<75?0:Math.round((gray-75)*255/120);p[i]=p[i+1]=p[i+2]=v}
 ctx.putImageData(data,0,0);return canvas;
}

export async function recognizeReceiptImage(file,onProgress=()=>{}){
 if(!file)throw new Error('Seleziona prima una foto dello scontrino.');
 const Tesseract=await loadReceiptOcr(),image=await prepareImage(file);
 const result=await Tesseract.recognize(image,'ita',{logger:m=>{if(m.status==='recognizing text')onProgress(Math.round((m.progress||0)*100),m.status);else onProgress(null,m.status)}});
 return String(result?.data?.text||'').trim();
}

const STOP_WORDS=/\b(totale|subtotale|contante|resto|carta|bancomat|visa|mastercard|iva|imponibile|pagamento|sconto totale|buono|punti|transazione|documento commerciale|corrispettivo|arrotondamento)\b/i;
const PRODUCT_HINT=/[a-zà-ÿ]{2,}/i;

export function parseReceiptText(text){
 const rawLines=String(text||'').split(/\r?\n/).map(clean).filter(Boolean);
 let store='',date='';
 const dateMatch=rawLines.join(' ').match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
 if(dateMatch){let y=dateMatch[3];if(y.length===2)y='20'+y;date=`${y}-${dateMatch[2].padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`}
 const storeCandidates=rawLines.slice(0,8).filter(x=>PRODUCT_HINT.test(x)&&!/@|www\.|p\.iva|partita iva|tel\.?/i.test(x)&&!/^\d/.test(x));
 store=storeCandidates.sort((a,b)=>b.length-a.length)[0]||'';

 const lines=[];
 for(let i=0;i<rawLines.length;i++){
  const line=rawLines[i];if(STOP_WORDS.test(line))continue;
  const priceMatch=line.match(/(?:€\s*)?(\d{1,4}[,.]\d{2})\s*€?\s*$/);if(!priceMatch)continue;
  const total=moneyValue(priceMatch[1]);if(total==null||total<=0||total>9999)continue;
  let name=clean(line.slice(0,priceMatch.index).replace(/^[*#-]+/,'').replace(/\b(?:eur|euro)\b/ig,''));
  let quantity=1,unitPrice=total;
  const qtyMatch=name.match(/(?:^|\s)(\d+(?:[,.]\d+)?)\s*[xX*]\s*(\d+[,.]\d{2})\s*$/);
  if(qtyMatch){quantity=moneyValue(qtyMatch[1])||1;unitPrice=moneyValue(qtyMatch[2])||total/quantity;name=clean(name.slice(0,qtyMatch.index))}
  else {
   const qtyOnly=name.match(/(?:^|\s)(\d+(?:[,.]\d+)?)\s*[xX*]\s*$/);
   if(qtyOnly){quantity=moneyValue(qtyOnly[1])||1;unitPrice=total/quantity;name=clean(name.slice(0,qtyOnly.index))}
  }
  name=name.replace(/\s+\d{5,14}$/,'').trim();
  if(!PRODUCT_HINT.test(name)||name.length<2)continue;
  if(lines.some(x=>x.name.toLowerCase()===name.toLowerCase()&&Math.abs(x.unitPrice-unitPrice)<.001))continue;
  lines.push({name,quantity,unit:'pz',unitPrice:Math.round(unitPrice*100)/100,addToPantry:true});
 }
 return {store,date,lines,rawLines};
}
