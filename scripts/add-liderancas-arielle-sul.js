// Adiciona/atualiza 19 liderancas (L) — Sul, coordenacao da Arielle.
// Ja vem com lat/lng (extraidas do PDF), entao aparecem no mapa na hora, sem precisar geocodificar.
// Roda com: node scripts/add-liderancas-arielle-sul.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where } = require('firebase/firestore');
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

// [nome, telefone, aniversario(YYYY-MM-DD ou ''), endereco, bairro, lat, lng]
const PESSOAS = [
  ['Esther Layza Soares Araújo', '(86) 98896-1818', '', 'Rua Babaçu, 2335', 'Real Copagre', -5.053187, -42.820808],
  ['Marcélia Araújo Veras', '(86) 98883-7112', '', 'Rua Advogado Jorge Barguil, 5624', 'Parque Poty', -5.108802, -42.740414],
  ['Ana Lays de Sousa Machado', '(86) 98816-2643', '', 'Rua Batalha do Jenipapo, 3723', 'Risoleta Neves', -5.052932, -42.809959],
  ['Valéria Isabela Bandeira Ribeiro', '(86) 99407-8227', '', 'Quadra 79, Casa 02 (próx. praça do bambu)', 'Bela Vista 2', -5.134371, -42.772659],
  ['Maria Alice Menezes Ribeiro', '(86) 99470-0852', '', 'Rua Adolfo Basílio, 4382', 'Mocambinho', -5.021306, -42.817768],
  ['Najla Katriny dos Santos Hardi', '(86) 99425-0213', '', 'Rua Ivan Tito de Oliveira, 2560', '', -5.133767, -42.780884],
  ['Yohana Fernanda Ribeiro de Sampaio', '(86) 98119-4522', '', 'Av. Abdias Neves, 1861', 'Cristo Rei', -5.101193, -42.787254],
  ['Andressa Maria Rodrigues', '(86) 99803-2588', '', 'Quadra 102, Casa 13 (ref: Boteco da Fatinha)', 'Parque Piauí', -5.145337, -42.786068],
  ['Gilmara Bezerra da Silva', '', '', 'Quadra 81, Lote 11, Casa A', 'Promorar', -5.147800, -42.782898],
  ['Jeice de Sousa Silva', '', '', 'Quadra C, Casa 04', 'Bela Vista III', -5.140624, -42.775951],
  ['Lilian Maria Pereira da Silva', '', '', 'Rua Rio Claro, 5526', 'Planalto Bela Vista', -5.128833, -42.776096],
  ['Lucas Gomes de Morais', '', '', 'Quadra E, Casa 31', 'Planalto Bela Vista', -5.126954, -42.769920],
  ['Maria Lucilene de Oliveira', '(86) 98177-9769', '', 'Rua Firmino Teixeira Amaral, 1891 (ao lado do chaveiro André)', 'Angelim 1', -5.176564, -42.785358],
  ['Josilene Pinheiro dos Santos Queiroz', '', '', 'Quadra 20, Casa 07 (em frente Colégio Padre Rego)', 'Parque Piauí', -5.140505, -42.787926],
  ['Tamires Araújo Gomes da Silva', '(86) 99464-4574', '1999-02-15', 'Rua do Passeio, 278', 'São Pedro', -5.117293, -42.811565],
  ['Bruna Lima Alves Feitosa', '(86) 99509-5689', '2004-01-15', 'Rua 25, 5428', 'Santa Maria', -4.988179, -42.832008],
  ['Geovanna Kethelyn Sousa Paz', '(86) 99538-6336', '2007-02-27', 'Rua Projeta Oito ou Cj Israel, 3725', 'Real Copagri', -5.054005, -42.814266],
  ['Raissa Silva Nunes', '(86) 99821-3500', '2000-01-13', 'Rua Anil, 2788, Parque Wall Ferraz', 'Santa Maria da Codipi', -4.986363, -42.831398],
  ['Claudia Luciana Silva Assunção', '(86) 99913-0237', '1979-04-26', 'Quadra 08, Casa 14', 'Parque Piauí', -5.141047, -42.784504],
];

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const email = await ask('Email admin: ');
  const senha = await ask('Senha: ');
  await signInWithEmailAndPassword(auth, email, senha);
  console.log('\n✅ Login OK\n');

  const colRef = collection(db, 'campanhas', CAMPANHA, 'liderancas');
  const snapAll = await getDocs(colRef);

  let maxId = 0;
  let arielle = null;
  snapAll.forEach(d => {
    const p = d.data();
    const v = parseInt(p.id || 0);
    if (v > maxId) maxId = v;
    if (p.tipo === 'CA' && /arielle/i.test(p.nome || '')) arielle = { ...p, _fireId: d.id };
  });

  if (!arielle) {
    console.error('❌ Não encontrei o cadastro de Coordenadora de Área da Arielle. Nada foi feito.');
    process.exit(1);
  }
  console.log(`Coordenadora encontrada: ${arielle.nome} (zona ${arielle._zona}, coordZona "${arielle._coordZona}")\n`);

  const snapSul = await getDocs(query(colRef, where('_zona', '==', 'sul')));
  const idsPorNome = {};
  snapSul.forEach(d => { idsPorNome[norm(d.data().nome)] = d.id; });

  const base = {
    _zona: 'sul',
    _coordZona: arielle._coordZona || '',
    _coordNome: arielle.nome.split(' ')[0],
    coord_area_id: arielle._fireId,
    coord_area_nome: arielle.nome,
    status: 'ativo',
    votos: 0, custo_jul: 0, custo_ago: 0, custo_set: 0, custo_out: 0, total: 0,
    reuniao_feita: 'nao', reuniao_data: '',
  };

  let adicionados = 0, atualizados = 0;
  for (const [nome, tel, aniversario, endereco, bairro, lat, lng] of PESSOAS) {
    const dados = {
      ...base, tipo: 'L', nome, telefone: tel, aniversario, endereco, bairro, lat, lng,
    };
    const docId = idsPorNome[norm(nome)];
    if (docId) {
      await updateDoc(doc(colRef, docId), dados);
      atualizados++;
      console.log(`  🔄 ${nome} (atualizada)`);
    } else {
      maxId++;
      await addDoc(colRef, { ...dados, id: String(maxId).padStart(3, '0') });
      idsPorNome[norm(nome)] = '(novo)';
      adicionados++;
      console.log(`  ✅ ${nome} (adicionada)`);
    }
  }

  console.log(`\n✅ ${adicionados} adicionada(s), ${atualizados} atualizada(s). Recarregue o sistema.`);
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
