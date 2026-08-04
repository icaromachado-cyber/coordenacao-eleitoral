// Para cada Mobilizador (M/ME) vinculado a uma Lideranca (lider_id), copia o coordenador
// da propria lideranca (_coordZona, _coordNome, coord_area_id, coord_area_nome) pro mobilizador —
// assim ele fica corretamente contado sob o coordenador certo, em vez de "sem vinculo".
// So mexe em quem esta com _coordZona vazio/diferente do da lideranca. Nao mexe em quem ja
// tem _coordZona proprio e correto.
// Roda com: node scripts/herdar-coordenador-dos-mobilizadores.js

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

  const porFireId = new Map();
  snap.forEach(d => porFireId.set(d.id, { ...d.data(), _fireId: d.id }));

  const mobilizadores = [...porFireId.values()].filter(p => (p.tipo === 'M' || p.tipo === 'ME') && p.lider_id);

  console.log(`${mobilizadores.length} mobilizador(es) vinculados a uma liderança. Verificando...\n`);

  let corrigidos = 0, jaOk = 0, liderNaoAchada = 0;

  for (const m of mobilizadores) {
    const lider = porFireId.get(m.lider_id);
    if (!lider) { liderNaoAchada++; continue; }

    const coordZonaCorreta = lider._coordZona || '';
    const coordNomeCorreto = lider._coordNome || '';
    const coordAreaIdCorreto = lider.coord_area_id || '';
    const coordAreaNomeCorreto = lider.coord_area_nome || '';

    const jaEstaCorreto =
      (m._coordZona || '') === coordZonaCorreta &&
      (m.coord_area_id || '') === coordAreaIdCorreto;

    if (jaEstaCorreto) { jaOk++; continue; }

    await updateDoc(doc(colRef, m._fireId), {
      _coordZona: coordZonaCorreta,
      _coordNome: coordNomeCorreto,
      coord_area_id: coordAreaIdCorreto,
      coord_area_nome: coordAreaNomeCorreto,
    });
    corrigidos++;
    console.log(`  ✅ ${m.nome} -> herdou coordenação de ${lider.nome} (coordZona "${coordZonaCorreta}")`);
  }

  console.log(`\nConcluído: ${corrigidos} corrigido(s), ${jaOk} já estavam certos, ${liderNaoAchada} com liderança não encontrada.`);
  console.log('Recarregue o sistema.');
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
