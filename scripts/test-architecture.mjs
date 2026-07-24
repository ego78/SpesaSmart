import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requiredDocs = [
  'docs/README.md',
  'docs/ARCHITETTURA.md',
  'docs/MODELLO-DATI.md',
  'docs/CONNETTORI.md',
  'docs/ROADMAP.md',
  'docs/TEST-E-RILASCI.md',
  'docs/DECISIONI.md'
];

for (const relative of requiredDocs) {
  const file = path.join(root, relative);
  await access(file);
  const text = await readFile(file, 'utf8');
  if (text.trim().length < 100) {
    throw new Error(`Documento vuoto o incompleto: ${relative}`);
  }
}

console.log(`Documentazione architetturale verificata: ${requiredDocs.length} file.`);
