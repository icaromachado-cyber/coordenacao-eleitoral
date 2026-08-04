// Corrige o vinculo das pessoas que estavam agrupadas sob "_coordNome" = ADM VER,
// linkando corretamente para a Shelyda Raiane (Norte Zona 01).
// Roda com: node scripts/corrigir-adm-ver-para-shelyda.js

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

  // Acha a Shelyda (o CA de verdade)
  let shelyda = null;
  snap.forEach(d => {
    const p = d.data();
    if (p.tipo === 'CA' && /sh[ée]lyda/i.test(p.nome || '')) {
      shelyda = { ...p, _fireId: d.id };
    }
  });

  if (!shelyda) {
    console.error('❌ Não encontrei o cadastro de Coordenadora de Área da Shelyda. Nada foi alterado.');
    process.exit(1);
  }

  console.log(`Coordenadora encontrada: ${shelyda.nome} (zona ${shelyda._zona}, coordZona "${shelyda._coordZona}", fireId ${shelyda._fireId})\n`);

  const todos = [];
  snap.forEach(d => {
    const p = d.data();
    if ((p._coordNome || '').toUpperCase().includes('ADM VER')) {
      todos.push({ ...p, _fireId: d.id });
    }
  });

  // Só mexe em quem já está na mesma zona da Shelyda — evita reatribuir gente de outra zona por engano
  const alvo = todos.filter(p => p._zona === shelyda._zona);
  const foraDaZona = todos.filter(p => p._zona !== shelyda._zona);

  console.log(`${todos.length} pessoa(s) encontradas com "ADM VER" no total.`);
  if (foraDaZona.length) {
    console.log(`⚠️ ${foraDaZona.length} delas estão em outra zona e NÃO serão mexidas:`);
    foraDaZona.forEach(p => console.log(`   - ${p.nome} (zona ${p._zona})`));
  }
  console.log(`\n${alvo.length} pessoa(s) da zona ${shelyda._zona} para corrigir:\n`);

  for (const p of alvo) {
    await updateDoc(doc(colRef, p._fireId), {
      _coordZona: shelyda._coordZona || '',
      _coordNome: shelyda.nome.split(' ')[0],
      coord_area_id: shelyda._fireId,
      coord_area_nome: shelyda.nome,
    });
    console.log(`  ✅ ${p.nome} -> vinculada à ${shelyda.nome}`);
  }

  console.log('\nPronto! Recarregue o sistema.');
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
