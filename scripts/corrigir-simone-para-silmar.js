// Corrige o vinculo de "Simone Alessandra da Silva Sousa": estava aparecendo debaixo da
// Shelyda, mas na verdade e da coordenacao do Silmar Cunha (Norte Zona 02).
// Roda com: node scripts/corrigir-simone-para-silmar.js

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
const norm = s => (s || '').toUpperCase().trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '');

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

  let silmar = null;
  const simones = [];
  snap.forEach(d => {
    const p = d.data();
    if (p.tipo === 'CA' && /silmar/i.test(p.nome || '')) silmar = { ...p, _fireId: d.id };
    if (norm(p.nome) === norm('Simone Alessandra da Silva Sousa')) simones.push({ ...p, _fireId: d.id });
  });

  if (!silmar) {
    console.error('❌ Não encontrei o cadastro de Coordenador de Área do Silmar. Nada foi alterado.');
    process.exit(1);
  }
  if (!simones.length) {
    console.error('❌ Não encontrei nenhuma "Simone Alessandra da Silva Sousa". Nada foi alterado.');
    process.exit(1);
  }

  console.log(`Coordenador encontrado: ${silmar.nome} (zona ${silmar._zona}, coordZona "${silmar._coordZona}", fireId ${silmar._fireId})`);
  console.log(`${simones.length} registro(s) de Simone encontrado(s).\n`);

  for (const s of simones) {
    await updateDoc(doc(colRef, s._fireId), {
      _zona: silmar._zona,
      _coordZona: silmar._coordZona || '',
      _coordNome: silmar.nome.split(' ')[0],
      coord_area_id: silmar._fireId,
      coord_area_nome: silmar.nome,
    });
    console.log(`  ✅ ${s.nome} (fireId ${s._fireId}) -> vinculada ao ${silmar.nome}`);
  }

  console.log('\nPronto! Recarregue o sistema.');
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
