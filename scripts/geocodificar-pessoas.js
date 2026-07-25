// Geocodifica todas as pessoas da campanha (uma vez só) e salva lat/lng no proprio cadastro,
// para o Mapa carregar instantaneo depois disso (sem depender de geocodificacao ao vivo no navegador).
// Roda com: node scripts/geocodificar-pessoas.js

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

async function geocodificar(endereco, bairro) {
  const queries = [];
  if (endereco && endereco.length > 5) queries.push(endereco + ', Teresina, Piauí, Brasil');
  if (bairro) {
    queries.push(bairro + ', Teresina, Piauí, Brasil');
    queries.push('Bairro ' + bairro + ', Teresina, Piauí');
  }

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;
      const r = await fetch(url, { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'sicepi-geocode-batch/1.0' } });
      if (r.status === 429) return { rateLimited: true };
      const data = await r.json();
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {}
    await new Promise(res => setTimeout(res, 1100));
  }
  return null;
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

  const pendentes = [];
  let jaTinham = 0, semEndereco = 0;
  snap.forEach(d => {
    const data = d.data();
    if (typeof data.lat === 'number' && typeof data.lng === 'number') { jaTinham++; return; }
    if (!data.endereco && !data.bairro) { semEndereco++; return; }
    pendentes.push({ id: d.id, endereco: data.endereco, bairro: data.bairro, nome: data.nome });
  });

  console.log(`Total: ${snap.size} · já tinham coordenada: ${jaTinham} · sem endereço/bairro: ${semEndereco} · a geocodificar: ${pendentes.length}\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < pendentes.length; i++) {
    const p = pendentes[i];
    const resultado = await geocodificar(p.endereco, p.bairro);

    if (resultado && resultado.rateLimited) {
      console.log(`\n⚠️ Nominatim bloqueou (429) em ${i}/${pendentes.length}. Pare e tente de novo mais tarde — o que já foi salvo fica salvo.`);
      break;
    }

    if (resultado) {
      await updateDoc(doc(colRef, p.id), { lat: resultado.lat, lng: resultado.lng });
      ok++;
      console.log(`[${i + 1}/${pendentes.length}] ✅ ${p.nome || p.id}`);
    } else {
      fail++;
      console.log(`[${i + 1}/${pendentes.length}] ❌ ${p.nome || p.id} — não encontrado`);
    }

    if (i < pendentes.length - 1) await new Promise(res => setTimeout(res, 1100));
  }

  console.log(`\nConcluído: ${ok} geocodificados, ${fail} não encontrados.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
