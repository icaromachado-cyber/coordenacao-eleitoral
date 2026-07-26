// Lista quem ainda nao tem lat/lng salvo (nao encontrado pelo geocodificar-pessoas.js),
// mostrando nome, bairro e endereco cadastrados, pra dar pra corrigir manualmente.
// Roda com: node scripts/listar-sem-coordenada.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(prompt, a => { rl.close(); r(a.trim()); }));
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const email = await ask('Email admin: ');
  const senha = await ask('Senha: ');
  await signInWithEmailAndPassword(auth, email, senha);
  console.log('\n✅ Login OK\n');

  const colRef = collection(db, 'campanhas', CAMPANHA, 'liderancas');
  const snap = await getDocs(colRef);

  const semCoord = [];
  snap.forEach(d => {
    const data = d.data();
    const temCoord = typeof data.lat === 'number' && typeof data.lng === 'number';
    if (!temCoord && (data.endereco || data.bairro)) {
      semCoord.push({ nome: data.nome, tipo: data.tipo, bairro: data.bairro, endereco: data.endereco });
    }
  });

  console.log(`${semCoord.length} pessoa(s) com endereço/bairro cadastrado mas sem coordenada:\n`);
  semCoord.forEach((p, i) => {
    console.log(`${i + 1}. [${p.tipo}] ${p.nome}`);
    console.log(`   bairro: ${p.bairro || '—'}  |  endereço: ${p.endereco || '—'}\n`);
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
