// Verifica cadastros duplicados em toda a base (todas as zonas/coordenadores) —
// por nome igual e por telefone igual. So leitura, nao apaga nada.
// Roda com: node scripts/verificar-duplicatas.js

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
const normNome = s => (s || '').toUpperCase().trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normTel = s => (s || '').replace(/\D/g, '');

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(prompt, a => { rl.close(); r(a.trim()); }));
}

function imprimirGrupo(chave, itens) {
  console.log(`\n"${chave}" (${itens.length}x):`);
  itens.forEach(p => {
    console.log(`   [${p.tipo}] ${p.nome} · ${p.telefone || '(sem telefone)'} · ${p._zona || '?'}${p._coordNome ? ' / ' + p._coordNome : ''} · bairro: ${p.bairro || '—'} · fireId: ${p._fireId}`);
  });
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const email = await ask('Email admin: ');
  const senha = await ask('Senha: ');
  await signInWithEmailAndPassword(auth, email, senha);
  console.log('\n✅ Login OK\n');

  const snap = await getDocs(collection(db, 'campanhas', CAMPANHA, 'liderancas'));
  const todos = [];
  snap.forEach(d => todos.push({ ...d.data(), _fireId: d.id }));

  console.log(`Total de cadastros: ${todos.length}\n`);
  console.log('='.repeat(60));
  console.log('DUPLICADOS POR NOME');
  console.log('='.repeat(60));

  const porNome = {};
  todos.forEach(p => {
    const chave = normNome(p.nome);
    if (!chave) return;
    (porNome[chave] = porNome[chave] || []).push(p);
  });
  const dupNome = Object.entries(porNome).filter(([, itens]) => itens.length > 1);
  if (!dupNome.length) console.log('Nenhum nome duplicado.');
  dupNome.forEach(([chave, itens]) => imprimirGrupo(chave, itens));

  console.log('\n' + '='.repeat(60));
  console.log('DUPLICADOS POR TELEFONE');
  console.log('='.repeat(60));

  const porTel = {};
  todos.forEach(p => {
    const chave = normTel(p.telefone);
    if (!chave || chave.length < 8) return; // ignora telefone vazio/curto demais
    (porTel[chave] = porTel[chave] || []).push(p);
  });
  const dupTel = Object.entries(porTel).filter(([, itens]) => itens.length > 1
    // não repete o que já apareceu como duplicado por nome idêntico
    && new Set(itens.map(p => normNome(p.nome))).size > 1);
  if (!dupTel.length) console.log('Nenhum telefone duplicado entre nomes diferentes.');
  dupTel.forEach(([chave, itens]) => imprimirGrupo(chave, itens));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Resumo: ${dupNome.length} grupo(s) de nome duplicado · ${dupTel.length} grupo(s) de telefone duplicado (nomes diferentes)`);
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
