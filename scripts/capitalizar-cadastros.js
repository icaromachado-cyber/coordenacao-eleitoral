// Reformata nome, bairro, endereco e colegio de todo mundo que ja esta cadastrado,
// tirando a CAIXA ALTA e deixando em formato "Nome Proprio" (ex: MARIA DA SILVA -> Maria da Silva).
// So atualiza quem realmente muda, sem mexer no resto do cadastro.
// Roda com: node scripts/capitalizar-cadastros.js

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

const CONECTIVOS_MINUSCULOS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);
function capitalizarNomeProprio(s) {
  if (!s) return '';
  return s.trim().toLowerCase().split(/\s+/).map((palavra, i) => {
    if (i > 0 && CONECTIVOS_MINUSCULOS.has(palavra)) return palavra;
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  }).join(' ');
}

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

  let atualizados = 0, jaOk = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const patch = {};

    for (const campo of ['nome', 'bairro', 'endereco', 'colegio']) {
      const atual = data[campo];
      if (!atual) continue;
      const novo = capitalizarNomeProprio(atual);
      if (novo !== atual) patch[campo] = novo;
    }

    if (Object.keys(patch).length > 0) {
      await updateDoc(doc(colRef, d.id), patch);
      atualizados++;
      console.log(`✅ ${data.nome} ->`, patch);
    } else {
      jaOk++;
    }
  }

  console.log(`\nConcluído: ${atualizados} atualizados, ${jaOk} já estavam certos.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
