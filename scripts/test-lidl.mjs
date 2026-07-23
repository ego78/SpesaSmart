import assert from 'node:assert/strict';
import { __test } from '../connectors/lidl-offers.mjs';

assert.equal(__test.parseItalianPrice('2,99 €*'), 2.99);
assert.equal(__test.parseItalianPrice('Prezzo 0,99 € Al kg'), 0.99);
assert.deepEqual(
  __test.parseDates('In punto vendita dal 23/07 al 29/07'),
  { validFrom: `${new Date().getFullYear()}-07-23`, validTo: `${new Date().getFullYear()}-07-29` }
);
assert.equal(__test.cleanTitle('In punto vendita Albicocche ^{}'), 'Albicocche');
assert.equal(__test.titleIsUsable('Cetrioli'), true);
assert.equal(__test.titleIsUsable('Mostra di più'), false);

assert.deepEqual(__test.pricesFromText('Yogurt 1,49 €'), [1.49]);
assert.equal(
  __test.flyerIdentifierFromUrl('https://www.lidl.it/l/it/volantini/offerte-estate/ar/0'),
  'offerte-estate'
);

const offer = __test.normalizeOffer(
  {
    title: 'Cetrioli',
    price: 0.99,
    text: 'Cetrioli 0,99 € Al kg In punto vendita dal 23/07 al 26/07',
    format: 'Al kg',
    image: 'https://example.test/cetrioli.jpg'
  },
  {
    flyerId: 'test',
    flyerUrl: 'https://www.lidl.it/',
    officialStoreId: 'IT00812'
  },
  {
    id: 'store-1',
    name: 'Lidl Sava',
    brand: 'Lidl',
    address: 'Sava'
  },
  0
);

assert.equal(offer.store, 'Lidl');
assert.equal(offer.product, 'Cetrioli');
assert.equal(offer.price, 0.99);
assert.equal(offer.flyerStoreId, 'store-1');


assert.equal(__test.exactPriceFromItem('2.99'), 2.99);
assert.equal(__test.exactPriceFromItem('1 kg = 9.93 €'), null);
assert.equal(__test.isUnitPriceText('1 kg = 9.93 €'), true);

const pdfFixture = [{
  number: 1,
  lines: [
    { y: 100, items: [{ text: 'GELATELLI', x: 14, y: 100, width: 40, height: 10 }] },
    { y: 88, items: [{ text: 'Stecco gelato', x: 14, y: 88, width: 80, height: 10 }] },
    { y: 70, items: [
      { text: '4x 80 g confezione', x: 14, y: 70, width: 90, height: 10 },
      { text: '2.99', x: 170, y: 60, width: 35, height: 20 }
    ] },
    { y: 60, items: [{ text: '1 kg = 9.34 €', x: 14, y: 60, width: 75, height: 8 }] }
  ]
}];
const pdfOffers = __test.extractPdfOffersFromLines(pdfFixture, {});
assert.equal(pdfOffers.length, 1);
assert.equal(pdfOffers[0].price, 2.99);
assert.equal(pdfOffers[0].format, '4x 80 g');
assert.match(pdfOffers[0].title, /Stecco gelato/i);

console.log('Test connettore Lidl superato.');
