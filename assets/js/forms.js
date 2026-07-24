import{$,uid}from'./utils.js';
export function openProduct(p=null){
 $('dialogTitle').textContent=p?'Modifica prodotto':'Aggiungi prodotto';
 $('editId').value=p?.id||'';$('name').value=p?.name||'';$('brand').value=p?.brand||'';$('format').value=p?.format||'';
 $('quantity').value=Number(p?.quantity)||1;$('unit').value=p?.unit||'pz';$('category').value=p?.category||'Alimentari';
 $('maxPrice').value=p?.maximumPrice??'';$('priority').value=p?.priority||'normal';$('notes').value=p?.notes||'';
 $('allowAlternatives').checked=p?.allowAlternatives!==false;$('favorite').checked=!!p?.favorite;$('formMsg').textContent='';
 $('productDialog').showModal();setTimeout(()=>$('name').focus(),40)
}
export function productFromForm(){
 const name=$('name').value.trim();if(!name)throw Error('Inserisci il nome del prodotto.');
 const quantity=Number($('quantity').value);if(!Number.isFinite(quantity)||quantity<=0)throw Error('Inserisci una quantità valida.');
 return{id:$('editId').value||uid(),name,brand:$('brand').value.trim(),format:$('format').value.trim(),quantity,unit:$('unit').value||'pz',category:$('category').value,maximumPrice:$('maxPrice').value?Number($('maxPrice').value):null,priority:$('priority').value||'normal',notes:$('notes').value.trim(),allowAlternatives:$('allowAlternatives').checked,favorite:$('favorite').checked,checked:false,updatedAt:new Date().toISOString()}
}
