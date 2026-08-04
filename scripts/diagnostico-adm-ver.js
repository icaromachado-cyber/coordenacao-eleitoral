// Lista quem sao as pessoas agrupadas sob "_coordNome" = ADM VER (ou parecido),
// que aparecem no Relatorio Financeiro sem ter um Coordenador de Area de verdade vinculado.
// So leitura, nao altera nada.
// Roda com: node scripts/diagnostico-adm-ver.js

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

  const snap = await getDocs(collection(db, 'campanhas', CAMPANHA, 'liderancas'));

  const alvo = [];
  snap.forEach(d => {
    const p = d.data();
    if ((p._coordNome || '').toUpperCase().includes('ADM VER')) {
      alvo.push({ ...p, _fireId: d.id });
    }
  });

  console.log(`${alvo.length} pessoa(s) com _coordNome contendo "ADM VER":\n`);
  let total = 0;
  alvo.forEach((p, i) => {
    total += p.total || 0;
    console.log(`${i + 1}. [${p.tipo}] ${p.nome}`);
    console.log(`   zona: ${p._zona} · coordZona: "${p._coordZona || ''}" · coordNome: "${p._coordNome}"`);
    console.log(`   coord_area_id: ${p.coord_area_id || '(nenhum)'} · custos: jul ${p.custo_jul||0} ago ${p.custo_ago||0} set ${p.custo_set||0} out ${p.custo_out||0} · total ${p.total||0}`);
    console.log(`   fireId: ${p._fireId}\n`);
  });
  console.log(`Soma dos totais: R$ ${total.toLocaleString('pt-BR')}`);

  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
