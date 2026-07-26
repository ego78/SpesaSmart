import fs from'node:fs';
const src=fs.readFileSync('assets/js/product-engine.js','utf8');
for(const token of ['recognizeProduct','recognizeReceiptLines','learnReceiptLines','PRODUCT_ALIASES_KEY'])if(!src.includes(token))throw new Error('Manca '+token);
console.log('Smart Product Engine: test superati');
