(() => {
  'use strict';
  const cfg = window.SPESA_SMART_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const state = { products: [], offers: [], filter: 'Tutti' };
  const endpointReady = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(cfg.APPS_SCRIPT_URL || '');

  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const euro = (v) => Number(v || 0).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
  const familyCode = () => localStorage.getItem('spesaSmartCode') || '';
  const location = () => localStorage.getItem('spesaSmartLocation') || cfg.DEFAULT_LOCATION || 'Sava 74028';
  function toast(msg){ const el=$('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
  function switchTab(name){document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===name));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));}

  async function api(action, payload={}){
    if(!endpointReady) throw new Error('Configura prima APPS_SCRIPT_URL in config.js');
    const body={action,code:familyCode(),...payload};
    const res=await fetch(cfg.APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'});
    const data=await res.json();
    if(!data.ok) throw new Error(data.error || 'Operazione non riuscita');
    return data;
  }

  async function loadProducts(){
    $('productsList').innerHTML='<div class="empty">Caricamento prodotti…</div>';
    try{const data=await api('listProducts');state.products=data.products||[];renderProducts();}
    catch(e){$('productsList').innerHTML=`<div class="empty">${esc(e.message)}</div>`;}
  }
  function renderProducts(){
    if(!state.products.length){$('productsList').innerHTML='<div class="empty">Nessun prodotto inserito.</div>';return;}
    $('productsList').innerHTML=state.products.map(p=>`<article class="card"><div class="card-head"><div><h3>${esc(p.name)}</h3><div class="muted">${esc([p.brand,p.format,p.category].filter(Boolean).join(' · '))}</div></div>${p.maxPrice?`<div><div class="muted">Prezzo massimo</div><div class="price">${euro(p.maxPrice)}</div></div>`:''}</div>${p.notes?`<p>${esc(p.notes)}</p>`:''}<div class="actions"><span class="badge">${p.active?'Attivo':'Disattivato'}</span><button class="danger delete-product" data-id="${esc(p.id)}" type="button">Elimina</button></div></article>`).join('');
    document.querySelectorAll('.delete-product').forEach(b=>b.addEventListener('click',()=>deleteProduct(b.dataset.id)));
  }
  async function deleteProduct(id){
    if(!confirm('Eliminare questo prodotto dalla lista?')) return;
    try{await api('deleteProduct',{id});toast('Prodotto eliminato');await loadProducts();}catch(e){toast(e.message);}
  }

  async function loadOffers(){
    $('offersList').innerHTML='<div class="empty">Caricamento offerte…</div>';
    try{const res=await fetch(`${cfg.OFFERS_FILE || 'data/offerte.json'}?t=${Date.now()}`,{cache:'no-store'});if(!res.ok)throw new Error('Il file offerte non è ancora disponibile');const data=await res.json();state.offers=data.offers||[];$('offersMeta').textContent=data.updatedAt?`Ultimo controllo: ${new Date(data.updatedAt).toLocaleString('it-IT')}`:'Nessuna scansione eseguita';renderFilters();renderOffers();}
    catch(e){$('offersMeta').textContent='';$('offersList').innerHTML=`<div class="empty">${esc(e.message)}. Avvia il workflow GitHub Actions dopo la configurazione.</div>`;}
  }
  function renderFilters(){const stores=['Tutti',...new Set(state.offers.map(o=>o.store).filter(Boolean))];$('offerFilters').innerHTML=stores.map(s=>`<button type="button" class="chip ${s===state.filter?'active':''}" data-store="${esc(s)}">${esc(s)}</button>`).join('');document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.store;renderFilters();renderOffers();}));}
  function renderOffers(){const offers=state.filter==='Tutti'?state.offers:state.offers.filter(o=>o.store===state.filter);if(!offers.length){$('offersList').innerHTML='<div class="empty">Nessuna offerta trovata per questo filtro.</div>';return;}$('offersList').innerHTML=offers.map(o=>`<article class="card"><div class="card-head"><div><span class="badge">${esc(o.store||'Negozio')}</span><h3>${esc(o.title||o.productName)}</h3><div class="muted">Corrispondenza: ${esc(o.productName||'')}</div></div>${o.price?`<div class="price">${euro(o.price)}</div>`:''}</div><p class="muted">${esc(o.description||'')}</p><div class="actions">${o.url?`<a href="${esc(o.url)}" target="_blank" rel="noopener">Apri offerta</a>`:''}${o.validUntil?`<span class="muted">Valida fino al ${esc(o.validUntil)}</span>`:''}</div></article>`).join('');}

  async function addProduct(){
    const payload={name:$('name').value.trim(),brand:$('brand').value.trim(),format:$('format').value.trim(),maxPrice:Number($('maxPrice').value||0),category:$('category').value,notes:$('notes').value.trim(),location:location()};
    if(!payload.name){$('formStatus').textContent='Inserisci il nome del prodotto.';return;}
    $('addProductBtn').disabled=true;$('formStatus').textContent='Salvataggio…';
    try{await api('addProduct',{product:payload});['name','brand','format','maxPrice','notes'].forEach(id=>$(id).value='');$('formStatus').textContent='Prodotto salvato nel Foglio Google.';toast('Prodotto aggiunto');await loadProducts();switchTab('products');}
    catch(e){$('formStatus').textContent=e.message;}finally{$('addProductBtn').disabled=false;}
  }

  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  $('addProductBtn').addEventListener('click',addProduct);$('refreshProducts').addEventListener('click',loadProducts);$('refreshOffers').addEventListener('click',loadOffers);
  $('settingsBtn').addEventListener('click',()=>{$('familyCode').value=familyCode();$('location').value=location();$('settingsDialog').showModal();});
  $('closeSettings').addEventListener('click',()=>$('settingsDialog').close());
  $('saveSettings').addEventListener('click',()=>{localStorage.setItem('spesaSmartCode',$('familyCode').value.trim());localStorage.setItem('spesaSmartLocation',$('location').value.trim()||cfg.DEFAULT_LOCATION);$('settingsDialog').close();toast('Impostazioni salvate');loadProducts();});
  if(!endpointReady)$('setupNotice').classList.remove('hidden');
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  loadOffers(); if(endpointReady && familyCode()) loadProducts(); else $('productsList').innerHTML='<div class="empty">Apri le impostazioni e inserisci il codice famiglia.</div>';
})();
