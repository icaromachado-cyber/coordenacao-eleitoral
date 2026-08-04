// Remove as 8 duplicatas confirmadas encontradas por verificar-duplicatas.js.
// Cada par tem o fireId que fica e o que sai definidos explicitamente (nao usa heuristica
// automatica) — assim da pra conferir exatamente o que vai acontecer antes de rodar.
// Roda com: node scripts/remover-duplicatas-confirmadas.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, deleteDoc } = require('firebase/firestore');
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

// [descrição, fireId a MANTER, fireId a APAGAR]
const PARES = [
  ['Flávia Vanusa Coutinho Rodrigues',        'GI1cthHnJaoaFkEyARx0', '2GrNJnKadTXBago6MQ9G'],
  ['Katherine da Mata Vasco',                 'GicQrh0hRSS6kpJRqKvQ', '4rNCK76OkJ5U2KTIC7xz'],
  ['Edson de Araújo Resende Filho',           '9fmmT7GbTlf9ki4AzXlM', 'S4EeK79jsz17zRQzVpUH'],
  ['Elisabeth da Silva de Oliveira',          'NHqOXKkMCBtVXWWukCeh', '8iVa9vFit29WQ9Rhipvy'],
  ['Dilma Alves dos Santos (Lima)',           'lJNI2RUAo2dbjOdskthc', 'JNqEo3W9S8n0C9fvV9jm'],
  ['Hélio Bezerra de Souza',                  'foj5QuSB99oodNnBqfHo', 'y5EOalRbfSVmvFduqvRR'],
  ['Creuzemir Viana Nascimento',              'p1CX1hqk5TwBdFxsAuuG', 'luUsDzGRq86jv4Rcerp0'],
  ['Cláudio da Silva Pessoa',                 'qGXmsjM9Bv59cOLgvZqW', 'mCRRrjPZOrlaTUrI93L2'],
];

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

  const colPath = ['campanhas', CAMPANHA, 'liderancas'];

  console.log('Confira antes de confirmar:\n');
  const validos = [];
  for (const [nome, manterId, apagarId] of PARES) {
    const refManter = doc(db, ...colPath, manterId);
    const refApagar = doc(db, ...colPath, apagarId);
    const [snapManter, snapApagar] = await Promise.all([getDoc(refManter), getDoc(refApagar)]);

    if (!snapManter.exists() || !snapApagar.exists()) {
      console.log(`⚠️  ${nome}: um dos dois registros não existe mais (pulando)`);
      continue;
    }
    console.log(`${nome}:`);
    console.log(`   MANTÉM: ${snapManter.data().nome} · ${snapManter.data()._coordNome || ''} (${manterId})`);
    console.log(`   APAGA:  ${snapApagar.data().nome} · ${snapApagar.data()._coordNome || ''} (${apagarId})\n`);
    validos.push([nome, refApagar]);
  }

  const resp = await ask(`Confirma apagar esses ${validos.length} registro(s)? (digite SIM): `);
  if (resp.trim().toUpperCase() !== 'SIM') {
    console.log('Cancelado, nada foi apagado.');
    process.exit(0);
  }

  for (const [nome, refApagar] of validos) {
    await deleteDoc(refApagar);
    console.log(`  🗑  ${nome} removido`);
  }

  console.log(`\n✅ ${validos.length} duplicata(s) removida(s). Recarregue o sistema.`);
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
