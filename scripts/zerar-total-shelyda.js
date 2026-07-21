// Zera custo_jul/ago/set/out e total da SHELYDA (Norte Zona 01)
// Roda com: node scripts/zerar-total-shelyda.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

const firebaseConfig = {
  apiKey: "AIzaSyDBg5pyAFWljMcty6qRYU6fONB6fm2xts8",
  authDomain: "coordenacao-eleitoral.firebaseapp.com",
  projectId: "coordenacao-eleitoral",
  storageBucket: "coordenacao-eleitoral.firebasestorage.app",
  messagingSenderId: "784517014215",
  appId: "1:784517014215:web:e37569899a5d598f0154e2"
};

const CAMPANHA = '2024-vereador';

async function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(prompt, a => { rl.close(); r(a.trim()); }));
}

async function main() {
  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);

  const email = await ask('Email admin: ');
  const senha = await ask('Senha: ');
  await signInWithEmailAndPassword(auth, email, senha);
  console.log('\n✅ Login OK\n');

  const snap = await getDocs(collection(db, 'campanhas', CAMPANHA, 'liderancas'));

  const resultados = [];
  snap.forEach(d => {
    const r = d.data();
    const nome = (r.nome || '').toUpperCase();
    if (nome.includes('SHELYDA')) {
      resultados.push({ fireId: d.id, ...r });
    }
  });

  if (!resultados.length) {
    console.log('⚠️  Nenhum registro com "SHELYDA" encontrado.');
    process.exit(0);
  }

  console.log(`Encontrado(s) ${resultados.length} registro(s):\n`);
  resultados.forEach(r => {
    console.log(`  → ${r.nome} | zona: ${r._zona} | total atual: R$${r.total || 0}`);
  });

  const conf = await ask('\nZerar custo_jul/ago/set/out e total de todos acima? (s/n): ');
  if (conf.toLowerCase() !== 's') {
    console.log('Cancelado.');
    process.exit(0);
  }

  for (const r of resultados) {
    await updateDoc(doc(db, 'campanhas', CAMPANHA, 'liderancas', r.fireId), {
      custo_jul: 0,
      custo_ago: 0,
      custo_set: 0,
      custo_out: 0,
      total: 0,
    });
    console.log(`✅ Zerado: ${r.nome}`);
  }

  console.log('\nRecarregue o sistema.');
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
