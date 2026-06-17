#!/usr/bin/env node
// Script de migração: agrega recursos atuais por região/ciclo e grava em `financas` collection
// Usage: set GOOGLE_APPLICATION_CREDENTIALS and run `node scripts/migrate-recursos.mjs`

import admin from 'firebase-admin';
import fs from 'fs';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Defina a variável GOOGLE_APPLICATION_CREDENTIALS com o service account JSON.');
  process.exit(1);
}

admin.initializeApp();
const db = admin.firestore();

async function main() {
  // Ajuste conforme sua modelagem: aqui assumimos que registros atuais têm campo _zona e total
  const ciclos = ['2024']; // ajuste se houver outros ciclos
  for (const ciclo of ciclos) {
    console.log('Processando ciclo', ciclo);
    const zonas = ['norte','leste','sul','sudeste','rural'];
    for (const zona of zonas) {
      const q = db.collection('registros').where('_zona','==',zona);
      const snap = await q.get();
      let total = 0;
      snap.forEach(d => { total += (d.data().total || 0); });
      const id = `${ciclo}_${zona}`;
      await db.collection('financas').doc(id).set({ region: zona, ciclo, total, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      console.log(`grava ${id} -> R$ ${total}`);
    }
  }
  console.log('Pronto.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
