// ===================== FIREBASE CONFIG =====================
const firebaseConfig = {
  apiKey: "AIzaSyDBg5pyAFWljMcty6qRYU6fONB6fm2xts8",
  authDomain: "coordenacao-eleitoral.firebaseapp.com",
  projectId: "coordenacao-eleitoral",
  storageBucket: "coordenacao-eleitoral.firebasestorage.app",
  messagingSenderId: "784517014215",
  appId: "1:784517014215:web:e37569899a5d598f0154e2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// App secundário para criar usuários sem deslogar o admin
const secondaryApp = firebase.initializeApp(firebaseConfig, 'secondary');
const secondaryAuth = secondaryApp.auth();
const {
  escapeHtml: h,
  escapeAttr: a,
  normalizeText,
  parseNonNegativeNumber,
  validateRecordInput,
  formatFirebaseError
} = window.AppUtils;

// ===================== ADMIN UTILS =====================

// Mapa completo bairro → zona (baseado nos dados da Prefeitura de Teresina)
const BAIRRO_ZONA_MAP = {
  // NORTE
  'AEROPORTO':'norte','ÁGUA MINERAL':'norte','AGUA MINERAL':'norte','ALTO ALEGRE':'norte',
  'AROEIRAS':'norte','AROEIRA':'norte','BOA ESPERANCA':'norte','BOA ESPERANÇA':'norte',
  'BUENOS AIRES':'norte','BUENO AIRES':'norte','CABRAL':'norte','CHAPADINHA':'norte',
  'CIDADE INDUSTRIAL':'norte','EMBRAPA':'norte','ITAPERU':'norte',
  'JACINTA ANDRADE':'norte','JARDIM EUROPA':'norte','LEONEL BRIZOLA':'norte',
  'LINDALMA SOARES':'norte','MAFRENSE':'norte','MAFUÁ':'norte','MAFUA':'norte',
  'MARQUES':'norte','MARQUÊS':'norte','MATADOURO':'norte','MATINHA':'norte',
  'MEMORARE':'norte','MOCAMBINHO':'norte','MOCAMBINHO 2':'norte',
  'MOCAMBINHO I':'norte','MOCAMBINHO II':'norte','MONTE ALEGRE':'norte',
  'MONTE VERDE':'norte','MORRO DA ESPERANÇA':'norte','NOVA BRASILIA':'norte',
  'NOVA BRASÍLIA':'norte','OLARIAS':'norte','PARQUE ALVORADA':'norte',
  'PARQUE AFONSO GIL':'norte','PARQUE BRASIL':'norte',
  'PARQUE BRASIL, SANTA MARIA':'norte','PARQUE MÃOO SANTA':'norte',
  'PARQUE STAEL':'norte','PORENQUANTO':'norte','POTI VELHO':'norte','POTY VELHO':'norte',
  'PRIMAVERA':'norte','PRIMAVERA 2':'norte','REAL COPAGRE':'norte',
  'SANTA BARBARA':'norte','SANTA MARIA':'norte','SANTA MARIA DA CODIPI':'norte',
  'SANTA  MARIA DA CODIPI':'norte','SANTA ROSA':'norte','SANTA SOFIA':'norte',
  'SÃO JOAQUIM':'norte','SAO JOAQUIM':'norte','TORQUARTO NETO':'norte',
  'TORQUATO NETO':'norte','VALE QUEM TEM':'norte','VILA BANDEIRANTES 2':'norte',
  'VILA MARIA':'norte','VILA OPERARIA':'norte','VILA OPERÁRIA':'norte',
  'VILA SÃO FRANCISCO':'norte','FRANCISCA TRINDADE':'norte',
  'CONJ. VILA NOVA CONQUISTA':'norte','RISOLETA':'norte','RISOLETA NEVES':'norte',
  'ACARAPE':'norte','BOM JESUS':'norte',
  // SUL
  'ANGELIM':'sul','ANGÉLICA':'sul','AREIAS':'sul','BELA VISTA':'sul','BRASILAR':'sul',
  'CATARINA':'sul','CENTRO SUL':'sul','CIDADE NOVA':'sul','CRISTO REI':'sul',
  'DISTRITO INDUSTRIAL':'sul','ESPLANADA':'sul','LOURIVAL PARENTE':'sul',
  'MACAÚBA':'sul','MACAUBA':'sul','MONTE CASTELO':'sul','MORADA NOVA':'sul',
  'NOSSA SENHORA DAS GRAÇAS':'sul','PARQUE JACINTA':'sul','PARQUE JULIANA':'sul',
  'PARQUE PIAUÍ':'sul','PARQUE SÃO JOÃO':'sul','PARQUE SUL':'sul',
  'PEDRA MIÚDA':'sul','PIÇARRA':'sul','PIO XII':'sul','POLO INDUSTRIAL SUL':'sul',
  'PORTAL DA ALEGRIA':'sul','PROMORAR':'sul','REDENÇÃO':'sul','SACI':'sul',
  'SANTA CRUZ':'sul','SANTA LUZIA':'sul','SANTO ANTÔNIO':'sul',
  'SÃO LOURENÇO':'sul','SÃO PEDRO':'sul','TABULETA':'sul',
  'TRÊS ANDARES':'sul','TRIUNFO':'sul','VERMELHA':'sul',
  // LESTE
  'ÁRVORES VERDES':'leste','ARVORES VERDES':'leste','CAMPESTRE':'leste',
  'CIDADE JARDIM':'leste','FÁTIMA':'leste','FATIMA':'leste','HORTO':'leste',
  'ILHOTAS':'leste','ININGA':'leste','JOCKEY':'leste','JOQUEI':'leste','JÓQUEI':'leste',
  'MORADA DO SOL':'leste','MORROS':'leste','NOIVOS':'leste','NOVO URUGUAI':'leste',
  'PARQUE UNIVERSITÁRIO':'leste','PEDRA MOLE':'leste','PIÇARREIRA':'leste',
  'PLANALTO':'leste','PORTO DO CENTRO':'leste','RECANTO DAS PALMEIRAS':'leste',
  'SAMAPI':'leste','SANTA ISABEL':'leste','SANTA LIA':'leste',
  'SÃO CRISTÓVÃO':'leste','SAO CRISTOVAO':'leste','SÃO JOÃO':'leste',
  'SAO JOAO':'leste','SATELITE':'leste','SATÉLITE':'leste','SOCOPO':'leste',
  'TABAJARAS':'leste','URUGUAI':'leste','VALE DO GAVIÃO':'leste',
  'VERDE LAR':'leste','VILA SANTA BÁRBARA':'leste','VILA URUGUAI':'leste',
  'ZOOBOTÂNICO':'leste',
  // SUDESTE
  'BEIRA RIO':'sudeste','BOM PRINCÍPIO':'sudeste','COLORADO':'sudeste',
  'COMPRIDA':'sudeste','DIRCEU':'sudeste','DIRCEU I':'sudeste','DIRCEU II':'sudeste',
  'DIRCEU2/ ITARARÉ':'sudeste','DIRCEU ARCOVERDE':'sudeste','EXTREMA':'sudeste',
  'FLOR DO CAMPO':'sudeste','GURUPI':'sudeste','ITARARÉ':'sudeste',
  'LIVRAMENTO':'sudeste','NOVO HORIZONTE':'sudeste','PARQUE IDEAL':'sudeste',
  'PARQUE POTY':'sudeste','REDONDA':'sudeste','RENASCENÇA':'sudeste',
  'RENASCENCA':'sudeste','SANTANA':'sudeste','SÃO RAIMUNDO':'sudeste',
  'SÃO SEBASTIÃO':'sudeste','SAO SEBASTIAO':'sudeste','TANCREDO NEVES':'sudeste',
  'TODOS OS SANTOS':'sudeste','VERDE CAP':'sudeste',
  // RURAL
  'ZONA RURAL':'rural','ÁREA RURAL':'rural','CAMPO LARGO':'rural',
  'CURRALINHOS':'rural','MARACANÃ':'rural',
};

async function migrarPorBairro() {
  if (!confirm('Organizar automaticamente as pessoas nas regiões corretas com base no bairro?\n\nIsso vai mover registros entre Norte, Sul, Leste, Sudeste e Rural conforme o bairro cadastrado.')) return;

  toast('🔄 Organizando por bairro…');
  let moved = 0, unchanged = 0;

  try {
    // Busca todos da campanha atual
    const todos = await colecao().get();
    const updates = [];

    todos.docs.forEach(doc => {
      const d = doc.data();
      const bairro = (d.bairro || '').trim().toUpperCase();
      const zonaCorreta = BAIRRO_ZONA_MAP[bairro];

      if (zonaCorreta && zonaCorreta !== d._zona) {
        updates.push({ ref: doc.ref, novaZona: zonaCorreta, data: d });
        moved++;
      } else {
        unchanged++;
      }
    });

    if (!updates.length) {
      toast('✅ Todos já estão nas regiões corretas!');
      return;
    }

    // Move cada pessoa: deleta da zona atual, cria na zona correta
    // Usa subcoleção por zona via _zona field update (mais simples)
    for (let i = 0; i < updates.length; i += 400) {
      const batch = db.batch();
      updates.slice(i, i + 400).forEach(u => {
        batch.update(u.ref, { _zona: u.novaZona });
      });
      await batch.commit();
    }

    // Recarrega zonas visíveis
    const zonas = getZonasVisiveis();
    const snaps = await Promise.all(zonas.map(z => colecao().where('_zona','==',z).get()));
    zonas.forEach((zona, i) => {
      DB[zona] = snaps[i].docs.map(d => ({...d.data(), _fireId: d.id}));
      BAIRROS[zona] = [...new Set(DB[zona].map(d => d.bairro).filter(Boolean))].sort();
    });

    atualizarNavCounts();
    aplicarFiltros();
    toast(`✅ ${moved} registros organizados · ${unchanged} já estavam corretos`);
  } catch(e) {
    console.error('Erro migração:', e);
    toast('❌ Erro na migração', true);
  }
}
async function limparCampanha(id) {
  const nome = campanhas[id]?.nome || id;
  if (!confirm(`⚠️ Limpar TODOS os dados de "${nome}"?\nEsta ação não pode ser desfeita.`)) return;
  
  toast('🗑️ Limpando ciclo…');
  try {
    const removidos = await limparRegistrosCampanha(id);
    await db.collection('campanhas').doc(id).set({
      dadosIniciaisImportados: true,
      limpaEm: new Date().toISOString()
    }, { merge: true });
    if (campanhas[id]) campanhas[id].dadosIniciaisImportados = true;
    await trocarCampanha(id);
    toast(`✅ "${nome}" limpa — ${removidos} registros removidos`);
  } catch(e) {
    toast('❌ Erro ao limpar ciclo', true);
  }
}

// ===================== CAMPANHAS =====================
const CAMPANHA_SEMENTE_INICIAL = '2024-vereador';
let campanhaAtual = null; // ID da campanha ativa
let campanhas = {}; // {id: {nome, ano, cargo}}

// Retorna a coleção correta baseada na campanha ativa
function colecao() {
  return db.collection('campanhas').doc(campanhaAtual || 'default').collection('liderancas');
}

async function limparRegistrosCampanha(id) {
  const snap = await db.collection('campanhas').doc(id).collection('liderancas').get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.size;
}

function deveImportarDadosIniciais() {
  const campanha = campanhas[campanhaAtual] || {};
  return campanhaAtual === CAMPANHA_SEMENTE_INICIAL && campanha.dadosIniciaisImportados !== true;
}

// ===================== DADOS =====================
const ZONAS_CFG = {
  norte:   { label: 'Região Norte',    cor: '#e8433a' },
  leste:   { label: 'Região Leste',    cor: '#3b82f6' },
  sul:     { label: 'Região Sul',      cor: '#22c55e' },
  sudeste: { label: 'Região Sudeste',  cor: '#a855f7' },
  rural:   { label: 'Região Rural',    cor: '#eab308' }
};

const TIPO_LABELS = {
  CA: 'CA',
  L: 'L',
  M: 'M',
  LE: 'LE',
  ME: 'ME'
};

const TIPO_NOMES = {
  CA: 'Coordenador de Área',
  L: 'Liderança',
  M: 'Mobilizador',
  LE: 'Liderança EMPREGADO',
  ME: 'Mobilizador EMPREGADO'
};

const CICLOS_NEUTROS = {
  '2024-vereador': '2024 - Ciclo Base'
};

const CICLOS_PADRAO_OCULTOS = new Set([
  '2026-governador',
  '2026-senador-1',
  '2026-senador-2',
  '2026-dep-estadual',
  '2026-dep-federal'
]);

const CATEGORIA_CORES = {
  Vereador: '#22c55e',
  Governador: '#a855f7',
  Senador: '#f59e0b',
  'Deputado Estadual': '#3b82f6',
  'Deputado Federal': '#ef4444',
  Prefeito: '#14b8a6',
  'Categoria A': '#a855f7',
  'Categoria B': '#f59e0b',
  'Categoria C': '#ef4444',
  'Categoria D': '#3b82f6',
  'Categoria E': '#22c55e',
  'Categoria F': '#14b8a6'
};

function tipoLabel(tipo) {
  return TIPO_LABELS[tipo] || tipo || '—';
}

function tipoNome(tipo) {
  return TIPO_NOMES[tipo] || tipoLabel(tipo);
}

function nomeCiclo(id, campanha) {
  if (id === CAMPANHA_SEMENTE_INICIAL) {
    const nome = String(campanha?.nome || '');
    if (campanha?.atualizadoEm && nome) return nome;
    return CICLOS_NEUTROS[id];
  }
  return String(campanha?.nome || id || '')
    .replace(/\b(Vereador|Governador|Senador|Deputado Federal|Deputado Estadual|Prefeito)\b/gi, 'Ciclo');
}

function cicloVisivel(id) {
  return id === CAMPANHA_SEMENTE_INICIAL || !CICLOS_PADRAO_OCULTOS.has(id);
}

const DADOS_NORTE = window.DADOS_NORTE || [];

// Banco em memória por zona
// DB em memória (espelho do Firestore)
const DB = {
  norte:   [],
  leste:   [],
  sul:     [],
  sudeste: [],
  rural:   []
};

// Flag de carregamento
let dbCarregado = false;

const BAIRROS_TERESINA = {"norte": ["ACARAPE", "AEROPORTO", "AGUA MINERAL", "ALTO ALEGRE", "AROEIRA", "AROEIRAS", "BOA ESPERANCA", "BOA ESPERANÇA", "BOM JESUS", "BUENO AIRES", "BUENOS AIRES", "CABRAL", "CENTRO NORTE", "CHAPADINHA", "CIDADE INDUSTRIAL", "CONJ. VILA NOVA CONQUISTA", "EMBRAPA", "FRANCISCA TRINDADE", "ITAPERU", "JACINTA ANDRADE", "JARDIM EUROPA", "LEONEL BRIZOLA", "LINDALMA SOARES", "MAFRENSE", "MAFUA", "MAFUÁ", "MARQUES", "MARQUÊS", "MATADOURO", "MATINHA", "MEMORARE", "MOCAMBINHO", "MOCAMBINHO 2", "MOCAMBINHO I", "MOCAMBINHO II", "MONTE ALEGRE", "MONTE VERDE", "MORRO DA ESPERANÇA", "NOVA BRASILIA", "NOVA BRASÍLIA", "OLARIAS", "PARQUE AFONSO GIL", "PARQUE ALVORADA", "PARQUE BRASIL", "PARQUE BRASIL, SANTA MARIA", "PARQUE MÃOO SANTA", "PARQUE STAEL", "PORENQUANTO", "POTI VELHO", "POTY VELHO", "PRIMAVERA", "PRIMAVERA 2", "REAL COPAGRE", "RISOLETA", "RISOLETA NEVES", "SANTA  MARIA DA CODIPI", "SANTA BARBARA", "SANTA MARIA", "SANTA MARIA DA CODIPI", "SANTA ROSA", "SANTA SOFIA", "SAO JOAQUIM", "SATELITE", "SÃO JOAQUIM", "TORQUARTO NETO", "TORQUATO NETO", "VALE QUEM TEM", "VILA BANDEIRANTES 2", "VILA MARIA", "VILA OPERARIA", "VILA OPERÁRIA", "VILA SÃO FRANCISCO", "ÁGUA MINERAL"], "sul": ["ANGELIM", "ANGÉLICA", "AREIAS", "BELA VISTA", "BRASILAR", "CATARINA", "CENTRO SUL", "CIDADE NOVA", "CRISTO REI", "DISTRITO INDUSTRIAL", "ESPLANADA", "LOURIVAL PARENTE", "MACAUBA", "MACAÚBA", "MONTE CASTELO", "MORADA NOVA", "NOSSA SENHORA DAS GRAÇAS", "PARQUE JACINTA", "PARQUE JULIANA", "PARQUE PIAUÍ", "PARQUE SUL", "PARQUE SÃO JOÃO", "PEDRA MIÚDA", "PIO XII", "PIÇARRA", "POLO INDUSTRIAL SUL", "PORTAL DA ALEGRIA", "PROMORAR", "REDENCO", "REDENÇÃO", "SACI", "SANTA CRUZ", "SANTA LUZIA", "SANTO ANTÔNIO", "SÃO LOURENÇO", "SÃO PEDRO", "TABULETA", "TRIUNFO", "TRÊS ANDARES", "VERMELHA"], "leste": ["ARVORES VERDES", "CAMPESTRE", "CIDADE JARDIM", "FATIMA", "FÁTIMA", "HORTO", "ILHOTAS", "ININGA", "JOCKEY", "JOQUEI", "JÓQUEI", "MORADA DO SOL", "MORROS", "NOIVOS", "NOVO URUGUAI", "PARQUE UNIVERSITÁRIO", "PEDRA MOLE", "PIÇARREIRA", "PLANALTO", "PORTO DO CENTRO", "RECANTO DAS PALMEIRAS", "SAMAPI", "SANTA ISABEL", "SANTA LIA", "SAO CRISTOVAO", "SAO JOAO", "SOCOPO", "SÃO CRISTÓVÃO", "SÃO JOÃO", "TABAJARAS", "URUGUAI", "VALE DO GAVIÃO", "VERDE LAR", "VILA SANTA BÁRBARA", "VILA URUGUAI", "ZOOBOTÂNICO", "ÁRVORES VERDES"], "sudeste": ["BEIRA RIO", "BOM PRINCÍPIO", "COLORADO", "COMPRIDA", "DIRCEU", "DIRCEU ARCOVERDE", "DIRCEU I", "DIRCEU II", "DIRCEU2/ ITARARÉ", "EXTREMA", "FLOR DO CAMPO", "GURUPI", "ITARARÉ", "LIVRAMENTO", "NOVO HORIZONTE", "PARQUE IDEAL", "PARQUE POTY", "REDONDA", "RENASCENCA", "RENASCENÇA", "SANTANA", "SAO SEBASTIAO", "SÃO RAIMUNDO", "SÃO SEBASTIÃO", "TANCREDO NEVES", "TODOS OS SANTOS", "VERDE CAP"], "rural": ["CAMPO LARGO", "CURRALINHOS", "DISTRITO DE BATALHA", "DISTRITO DE BRAÇO", "DISTRITO DE ÁGUA BRANCA", "GABRIEL FERREIRA", "MARACANÃ", "MOCAMBINHO RURAL", "ZONA RURAL", "ÁREA RURAL"]};

const BAIRROS_NORTE = BAIRROS_TERESINA.norte;

const BAIRROS = {
  norte:   [...BAIRROS_TERESINA.norte],
  leste:   [...BAIRROS_TERESINA.leste],
  sul:     [...BAIRROS_TERESINA.sul],
  sudeste: [...BAIRROS_TERESINA.sudeste],
  rural:   [...BAIRROS_TERESINA.rural]
};

// ===================== ESTADO =====================
let currentUserRole = null; // { role, region, zona, name }
let zonaAtual = 'norte';
let coordFiltroAtivo = null; // uid do coordenador selecionado no nav lateral
let filtrado = [];
let sortCol = 'id';
let sortAsc = true;
let pg = 1;
const PER = 50;
let editId = null;

// ===================== ROLE HELPERS =====================
function isAdminUser() {
  return !currentUserRole || currentUserRole.role === 'admin';
}

function getZonasVisiveis() {
  if (isAdminUser()) return ['norte', 'leste', 'sul', 'sudeste', 'rural'];
  return [currentUserRole.region].filter(Boolean);
}

function configurarNavPorRole() {
  const admin = isAdminUser();

  if (admin) {
    // Admin: esconde seção de regiões e filtro combinado; mostra "Todos os Dados"
    const secRegioes = document.getElementById('nav-section-regioes');
    if (secRegioes) secRegioes.style.display = 'none';
    const secFiltro = document.getElementById('nav-section-filtro');
    if (secFiltro) secFiltro.style.display = 'none';

    const labelGeral = document.getElementById('nav-label-geral');
    if (labelGeral) labelGeral.textContent = 'Coordenações';
    const todasLabel = document.getElementById('nav-todas-label');
    if (todasLabel) todasLabel.textContent = 'Todos os Dados';

    const navTodas = document.getElementById('nav-todas');
    if (navTodas) navTodas.style.display = '';
  } else {
    // Coordenador regional: mostra só sua região, sem seção de coordenadores e sem filtro combinado
    const secRegioes = document.getElementById('nav-section-regioes');
    if (secRegioes) secRegioes.style.display = '';
    const secFiltro = document.getElementById('nav-section-filtro');
    if (secFiltro) secFiltro.style.display = 'none';
    const secCoord = document.getElementById('sidebar-coord-section');
    if (secCoord) secCoord.style.display = 'none';

    const labelGeral = document.getElementById('nav-label-geral');
    if (labelGeral) labelGeral.style.display = 'none';
    const navTodas = document.getElementById('nav-todas');
    if (navTodas) navTodas.style.display = 'none';

    // Mostra apenas a zona do coordenador
    const region = currentUserRole?.region;
    ['norte', 'leste', 'sul', 'sudeste', 'rural'].forEach(z => {
      const nav = document.getElementById('nav-' + z);
      if (nav) nav.style.display = z === region ? '' : 'none';
    });

    // Exibe número de zona ao lado do nome da região
    if (region && currentUserRole?.zona) {
      const navName = document.querySelector(`#nav-${region} .nav-name`);
      if (navName) {
        const REGION_LABEL = { norte: 'Região Norte', leste: 'Região Leste', sul: 'Região Sul', sudeste: 'Região Sudeste', rural: 'Região Rural' };
        navName.textContent = (REGION_LABEL[region] || '') + ' · ' + currentUserRole.zona;
      }
    }
  }

  // Filtro de coordenadores — visível somente para admin
  const filtroCoord = document.getElementById('filtro-coord');
  if (filtroCoord) filtroCoord.style.display = admin ? '' : 'none';
  if (admin) carregarCoordFiltro();

  const btnMigrar = document.getElementById('btnMigrarBairro');
  if (btnMigrar) btnMigrar.style.display = admin ? '' : 'none';
  const btnUsuarios = document.getElementById('btnGerenciarUsuarios');
  if (btnUsuarios) btnUsuarios.style.display = admin ? '' : 'none';
}

// ===================== NAV POR COORDENADOR =====================
const COORD_COLORS = { norte: '#ef4444', leste: '#3b82f6', sul: '#22c55e', sudeste: '#a855f7', rural: '#f59e0b' };
const REGION_CAP   = { norte: 'Norte', leste: 'Leste', sul: 'Sul', sudeste: 'Sudeste', rural: 'Rural' };

async function renderNavCoord() {
  if (!isAdminUser()) return;
  const container = document.getElementById('nav-coord-items');
  const section   = document.getElementById('sidebar-coord-section');
  if (!container || !section) return;
  try {
    const snap = await db.collection('users').get();
    const allRecords = Object.values(DB).flat();
    const coords = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (!d.region) return;
      const count = allRecords.filter(r => r._criadoPor === doc.id).length;
      const label = (REGION_CAP[d.region] || d.region) + (d.zona ? ' ' + d.zona : '');
      coords.push({ uid: doc.id, label, name: d.name || d.email || '—', region: d.region, zona: d.zona || '', count });
    });
    coords.sort((a, b) => {
      const r = a.region.localeCompare(b.region, 'pt-BR');
      return r !== 0 ? r : a.zona.localeCompare(b.zona);
    });
    if (!coords.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    container.innerHTML = coords.map(c => `
      <div class="nav-item nav-coord-item" id="nav-coord-${a(c.uid)}" onclick="selecionarCoord('${a(c.uid)}')">
        <div class="nav-dot" style="background:${COORD_COLORS[c.region]||'#888'}"></div>
        <div style="flex:1;min-width:0;overflow:hidden">
          <div class="nav-name">${h(c.label)}</div>
          <div class="nav-coord-sub">${h(c.name)}</div>
        </div>
        <span class="nav-count" id="ncc-${a(c.uid)}">${c.count}</span>
      </div>`).join('');
  } catch(e) {
    section.style.display = 'none';
  }
}

function selecionarCoord(uid) {
  coordFiltroAtivo = uid;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('nav-coord-' + uid)?.classList.add('active');
  zonaAtual = 'todas';
  const fc = document.getElementById('filtro-coord');
  if (fc) fc.value = uid;
  // Atualiza título com nome do coordenador
  const item = document.getElementById('nav-coord-' + uid);
  const label = item?.querySelector('.nav-name')?.textContent || '';
  const nome  = item?.querySelector('.nav-coord-sub')?.textContent || '';
  document.getElementById('zTitle').textContent = label + (nome ? ' — ' + nome : '');
  document.getElementById('zBadge').style.background = '#3b82f6';
  document.documentElement.style.setProperty('--accent', '#3b82f6');
  pg = 1;
  aplicarFiltros();
}

function atualizarNavCoordCounts() {
  if (!isAdminUser()) return;
  const allRecords = Object.values(DB).flat();
  document.querySelectorAll('.nav-coord-item').forEach(el => {
    const uid = el.id.replace('nav-coord-', '');
    const countEl = document.getElementById('ncc-' + uid);
    if (countEl) countEl.textContent = allRecords.filter(r => r._criadoPor === uid).length;
  });
}

// ===================== INIT =====================
function init() {
  mostrarLoading(true);
  carregarDoFirebase();
}

function mostrarLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

async function carregarDoFirebase() {
  try {
    await carregarCampanhas();

    // Operações de migração somente para admin — regionais não têm permissão de leitura global
    if (isAdminUser()) {
      const snapCheck = await colecao().limit(1).get();
      if (snapCheck.empty && deveImportarDadosIniciais()) {
        await migrarDadosNorte();
      }
    }

    // Coordenadores carregam TODAS as zonas filtradas por _criadoPor (podem ter registros em qualquer zona)
    const todasZonas = ['norte', 'leste', 'sul', 'sudeste', 'rural'];
    const uid = firebase.auth().currentUser?.uid;
    const snaps = await Promise.all(
      todasZonas.map(z => {
        let q = colecao().where('_zona', '==', z);
        if (!isAdminUser() && uid) q = q.where('_criadoPor', '==', uid);
        return q.get();
      })
    );
    todasZonas.forEach((zona, i) => {
      DB[zona] = snaps[i].docs.map(d => ({...d.data(), _fireId: d.id}));
      BAIRROS[zona] = [...new Set(DB[zona].map(d => d.bairro).filter(Boolean))].sort();
    });

    dbCarregado = true;

    // migrarVinculos lê todos os docs sem filtro — somente admin pode executar
    if (isAdminUser()) {
      const possuiRegistros = Object.values(DB).some(registros => registros.length > 0);
      if (possuiRegistros) {
        await migrarVinculos();
      }
      const snapsReload = await Promise.all(
        todasZonas.map(z => colecao().where('_zona', '==', z).get())
      );
      todasZonas.forEach((zona, i) => {
        DB[zona] = snapsReload[i].docs.map(d => ({...d.data(), _fireId: d.id}));
        BAIRROS[zona] = [...new Set(DB[zona].map(d => d.bairro).filter(Boolean))].sort();
      });
    }

    mostrarLoading(false);
    atualizarNavCounts();
    configurarNavPorRole();
    await renderNavCoord();
    const zonaInicial = isAdminUser() ? 'todas' : (currentUserRole?.region || 'norte');
    trocarZona(zonaInicial);
    abrirDashboardInicial();
  } catch(e) {
    console.error('Erro ao carregar Firebase:', e);
    // Fallback local somente para admin; regional recebe tela em branco
    if (isAdminUser()) {
      DB.norte = DADOS_NORTE.map(d => ({...d, _zona: 'norte'}));
      BAIRROS.norte = [...new Set(DB.norte.map(d => d.bairro).filter(Boolean))].sort();
    }
    dbCarregado = true;
    mostrarLoading(false);
    atualizarNavCounts();
    configurarNavPorRole();
    await renderNavCoord();
    trocarZona(isAdminUser() ? 'todas' : (currentUserRole?.region || 'norte'));
    abrirDashboardInicial();
    if (isAdminUser()) toast('⚠️ Usando dados locais — sem conexão com banco', true);
  }
}

function atualizarNavCounts() {
  let total = 0;
  Object.keys(DB).forEach(z => {
    const n = DB[z].length;
    const el = document.getElementById('nc-' + z);
    if (el) el.textContent = n;
    total += n;
  });
  const elTodas = document.getElementById('nc-todas');
  if (elTodas) elTodas.textContent = total;

  // Para coordenador regional: mostra total de todos os registros dele no item da sua zona
  if (!isAdminUser() && currentUserRole?.region) {
    const el = document.getElementById('nc-' + currentUserRole.region);
    if (el) el.textContent = total;
  }

  atualizarNavCoordCounts();
}

// ===================== TROCA ZONA =====================
function trocarZona(z) {
  // Limpa filtro de coordenador ao navegar por zona geográfica
  coordFiltroAtivo = null;
  const fc = document.getElementById('filtro-coord');
  if (fc) fc.value = '';

  // Reset multi-zona when switching to a regular zone
  if (z !== 'multi') {
    multiZonaAtivo = false;
    const mzPanel = document.getElementById('multi-zona-panel');
    if (mzPanel) {
      mzPanel.style.display = 'none';
      mzPanel.querySelectorAll('input').forEach(cb => cb.checked = false);
    }
  }
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + z);
  if (navEl) navEl.classList.add('active');

  zonaAtual = z;
  const cfg = z === 'todas' ? { label: 'Todas as Regiões', cor: '#e8433a' } : ZONAS_CFG[z];

  // Update topbar — appends zona number for regional coordinators
  let titulo = cfg.label;
  if (!isAdminUser() && currentUserRole?.zona && z === currentUserRole?.region) {
    titulo += ' · ' + currentUserRole.zona;
  }
  document.getElementById('zTitle').textContent = titulo;
  document.getElementById('zBadge').style.background = cfg.cor;
  document.documentElement.style.setProperty('--accent', cfg.cor);

  // Update bairro filter
  // Combina bairros oficiais de Teresina + bairros cadastrados no sistema
  let bairrosBase = z === 'todas'
    ? [...new Set(Object.values(BAIRROS_TERESINA).flat())]
    : [...(BAIRROS_TERESINA[z] || [])];

  // Adiciona bairros cadastrados que não estão na lista oficial
  const cadastrados = z === 'todas'
    ? [...new Set(Object.values(DB).flat().map(d => d.bairro).filter(Boolean))]
    : [...new Set((DB[z]||[]).map(d => d.bairro).filter(Boolean))];

  const bairros = [...new Set([...bairrosBase, ...cadastrados])].sort();

  const selB = document.getElementById('filtro-bairro');
  selB.innerHTML = '<option value="">Todos os bairros</option>';
  bairros.forEach(b => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    selB.appendChild(o);
  });

  document.getElementById('search').value = '';
  document.getElementById('filtro-tipo').value = '';
  document.getElementById('filtro-bairro').value = '';
  pg = 1;
  aplicarFiltros();
}

// ===================== FILTROS =====================
function getDados() {
  // Coordenador regional sempre vê todos os seus registros (podem estar em qualquer zona)
  if (!isAdminUser()) {
    const all = [];
    Object.entries(DB).forEach(([z, arr]) => {
      arr.forEach(d => all.push({...d, _zona: d._zona || z}));
    });
    return all;
  }
  if (zonaAtual === 'todas') {
    const all = [];
    Object.entries(DB).forEach(([z, arr]) => {
      arr.forEach(d => all.push({...d, _zona: z}));
    });
    return all;
  }
  if (zonaAtual === 'multi') {
    const selecionadas = Array.from(
      document.querySelectorAll('#multi-zona-panel input:checked')
    ).map(cb => cb.value);
    const all = [];
    selecionadas.forEach(z => {
      (DB[z] || []).forEach(d => all.push({...d, _zona: z}));
    });
    return all;
  }
  return (DB[zonaAtual] || []).map(d => ({...d, _zona: zonaAtual}));
}

function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

async function carregarCoordFiltro() {
  if (!isAdminUser()) return;
  const sel = document.getElementById('filtro-coord');
  if (!sel) return;
  try {
    const snap = await db.collection('users').get();
    const REGION_CAP = { norte: 'Norte', leste: 'Leste', sul: 'Sul', sudeste: 'Sudeste', rural: 'Rural' };
    const coords = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (!d.region) return; // sem região = admin global sem zona, não listar
      const zona = d.zona ? ' ' + d.zona : '';
      const nome = d.name ? ' — ' + d.name : '';
      const regLabel = REGION_CAP[d.region] || d.region;
      coords.push({ uid: doc.id, label: regLabel + zona + nome, region: d.region, zona: d.zona || '' });
    });
    coords.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    sel.innerHTML = '<option value="">Todos os coordenadores</option>' +
      coords.map(c => `<option value="${a(c.uid)}">${h(c.label)}</option>`).join('');
    sel.style.display = '';
  } catch(e) {
    console.error('Erro ao carregar filtro de coordenadores:', e);
  }
}

function aplicarFiltros() {
  const q = norm(document.getElementById('search').value);
  const tipo = document.getElementById('filtro-tipo').value;
  const bairro = document.getElementById('filtro-bairro').value;
  const coord = (document.getElementById('filtro-coord')?.value || '');

  filtrado = getDados().filter(d => {
    const mn = norm(d.nome), mb = norm(d.bairro), mt = (d.telefone||'').toLowerCase();
    return (!q || mn.includes(q) || mb.includes(q) || mt.includes(q))
        && (!tipo || d.tipo === tipo)
        && (!bairro || d.bairro === bairro)
        && (!coord || d._criadoPor === coord);
  });

  doSort();
  pg = 1;
  renderCards();
  renderTable();
}

function limpar() {
  document.getElementById('search').value = '';
  document.getElementById('filtro-tipo').value = '';
  document.getElementById('filtro-bairro').value = '';
  const fc = document.getElementById('filtro-coord');
  if (fc) fc.value = '';
  aplicarFiltros();
}

// ===================== SORT =====================
function sortBy(col) {
  sortAsc = (sortCol === col) ? !sortAsc : true;
  sortCol = col;
  document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
  const th = document.querySelector(`th[data-c="${col}"]`);
  if (th) th.classList.add('sorted');
  doSort();
  renderTable();
}

function doSort() {
  filtrado.sort((a,b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') {
      return sortAsc ? norm(va).localeCompare(norm(vb),'pt-BR') : norm(vb).localeCompare(norm(va),'pt-BR');
    }
    return sortAsc ? (va||0)-(vb||0) : (vb||0)-(va||0);
  });
}

// ===================== RENDER CARDS =====================
function fmtWhats(tel) {
  if (!tel || tel.trim().length < 8) return '—';
  const num = tel.replace(/\D/g, '');
  if (num.length < 8) return h(tel);
  const wa = num.startsWith('55') ? num : '55' + num;
  return `<a href="https://wa.me/${wa}" target="_blank" style="color:#25d366;text-decoration:none;display:inline-flex;align-items:center;gap:4px" title="Abrir WhatsApp">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.122 1.527 5.855L.057 23.882l6.19-1.622A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.724.977.995-3.635-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
    ${h(tel)}</a>`;
}


function fmtK(v) { return v>=1000 ? (v/1000).toFixed(1)+'K' : v.toFixed(0); }
function statusBadge(s) {
  const map = {
    ativo:    ['✅','ativo','status-ativo'],
    inativo:  ['❌','inativo','status-inativo'],
    pendente: ['⚠️','pendente','status-pendente']
  };
  const [ico, label, cls] = map[s||'ativo'] || map['ativo'];
  return `<span class="status-badge ${cls}">${ico} ${label}</span>`;
}

function reuniaoBadge(r, data) {
  if (r === 'sim') {
    return `<span class="reuniao-badge reuniao-sim">✅ ${data||'Sim'}</span>`;
  }
  return `<span class="reuniao-badge reuniao-nao">— Não</span>`;
}

function fmtR(v) { return v ? 'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:0}) : '—'; }

function fmtMaps(end) {
  if (!end || end.trim().length < 5) return '—';
  const query = encodeURIComponent(end + (end.toLowerCase().includes('teresina') ? '' : ', Teresina PI'));
  const label = end.length > 28 ? end.substring(0,26)+'…' : end;
  return `<a href="https://www.google.com/maps/search/?api=1&query=${query}" target="_blank" style="color:#4285f4;text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-size:.78rem" title="Ver no Google Maps">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#4285f4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    ${h(label)}</a>`;
}

function custoClass(v) {
  if (!v || v===0) return 'c0';
  if (v<=500) return 'c1';
  if (v<=1000) return 'c2';
  return 'c3';
}

function totalStyle(v) {
  if (!v || v===0) return 'color:var(--muted)';
  if (v<=1000) return 'color:var(--z-sul)';
  if (v<=3000) return 'color:#fb923c';
  return 'color:var(--z-norte)';
}

function renderCards() {
  const src = filtrado;
  document.getElementById('sc-total').textContent = src.length;
  document.getElementById('sc-l').textContent = src.filter(d=>d.tipo==='L'||d.tipo==='LE').length;
  document.getElementById('sc-m').textContent = src.filter(d=>d.tipo==='M'||d.tipo==='ME').length;
  document.getElementById('sc-empregado').textContent = src.filter(d=>d.tipo==='CA').length;
  const ct = src.reduce((s,d)=>s+d.total,0);
  document.getElementById('sc-custo').textContent = 'R$ '+ct.toLocaleString('pt-BR',{minimumFractionDigits:0});

  const totalApoios = src.reduce((s,d)=>s+(d.votos||0),0);
  document.getElementById('tp1').innerHTML = `Apoios: <strong>${totalApoios.toLocaleString('pt-BR')}</strong>`;
  document.getElementById('tp2').innerHTML = `Média de recursos: <strong>R$ ${src.length?Math.round(ct/src.length).toLocaleString('pt-BR'):'0'}</strong>`;

  // Painel de zonas quando estiver em "Todas"
  renderZonePanel();
}

function renderZonePanel() {
  const panel = document.getElementById('zone-panel');
  if (!panel) return;

  panel.style.display = 'none';
  panel.innerHTML = '';
}

// ===================== RENDER TABLE =====================
function renderTable() {
  const start = (pg-1)*PER;
  const slice = filtrado.slice(start, start+PER);
  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty');

  document.getElementById('rinfo').textContent =
    filtrado.length + ' registro' + (filtrado.length!==1?'s':'');

  if (!slice.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    document.getElementById('pag').innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  const showZona = zonaAtual === 'todas';

  tbody.innerHTML = slice.map(d => {
    const nome = d.nome || '';
    const nomeDisplay = nome.length > 32 ? nome.substring(0,30)+'…' : nome;
    const colegio = d.colegio || '';
    const colegioDisplay = colegio ? colegio.substring(0,18)+(colegio.length>18?'…':'') : '—';
    const c = ZONAS_CFG[d._zona] || {};
    const regionShort = d._zona ? d._zona.charAt(0).toUpperCase() + d._zona.slice(1) : '';
    const coordTag = isAdminUser() && d._coordZona
      ? `<br><span style="font-size:.63rem;color:var(--muted);font-weight:600">${regionShort} ${d._coordZona}${d._coordNome ? ' · ' + d._coordNome.split(' ')[0] : ''}</span>`
      : '';
    return `<tr>
      <td class="muted-td mono" style="font-size:.72rem">${d.id}${showZona?`<br><span style="color:${c.cor};font-size:.65rem">${c.label||''}</span>`:''}${coordTag}</td>
      <td><span class="badge badge-${a(d.tipo)}">${h(tipoLabel(d.tipo))}</span></td>
      <td class="nome-td" title="${a(nome)}">${h(nomeDisplay)}</td>
      <td class="muted-td mono">${fmtWhats(d.telefone)}</td>
      <td class="muted-td" style="max-width:120px;overflow:hidden;text-overflow:ellipsis" title="${a(d.bairro || '')}">${h(d.bairro || '—')}</td>
      <td class="muted-td" style="max-width:130px;overflow:hidden;text-overflow:ellipsis" title="${a(colegio)}">${h(colegioDisplay)}</td>
      <td class="muted-td" style="text-align:center">${h(d.secao || '—')}</td>
      <td class="muted-td" style="text-align:center">${h(d.zona_eleitoral || '—')}</td>
      <td>${statusBadge(d.status)}</td>
      <td>${reuniaoBadge(d.reuniao_feita, d.reuniao_data)}</td>
      <td class="votos-td" style="color:#3b82f6">${d.votos||'—'}</td>
      <td class="num-td ${custoClass(d.custo_jul)}">${d.custo_jul?'R$'+d.custo_jul.toLocaleString('pt-BR'):'—'}</td>
      <td class="num-td ${custoClass(d.custo_ago)}">${d.custo_ago?'R$'+d.custo_ago.toLocaleString('pt-BR'):'—'}</td>
      <td class="num-td ${custoClass(d.custo_set)}">${d.custo_set?'R$'+d.custo_set.toLocaleString('pt-BR'):'—'}</td>
      <td class="num-td ${custoClass(d.custo_out)}">${d.custo_out?'R$'+d.custo_out.toLocaleString('pt-BR'):'—'}</td>
      <td class="total-td" style="${totalStyle(d.total)}">${d.total?'R$'+d.total.toLocaleString('pt-BR'):'—'}</td>
      <td style="text-align:center;white-space:nowrap">
        <button class="btn-ico view" data-action="ver-drawer" data-id="${a(d.id)}" data-zona="${a(d._zona)}" title="Visualizar">👁</button>
        <button class="btn-ico edit" data-action="editar-registro" data-id="${a(d.id)}" data-zona="${a(d._zona)}" title="Editar">✏️</button>
      </td>
    </tr>`;
  }).join('');

  renderPag();
}

function renderPag() {
  const total = Math.ceil(filtrado.length / PER);
  const pag = document.getElementById('pag');
  if (total <= 1) { pag.innerHTML = ''; return; }

  let html = `<button class="pbn" data-action="go-page" data-page="${pg-1}" ${pg===1?'disabled':''}>‹</button>`;
  for (let i=1;i<=total;i++) {
    if (i===1||i===total||Math.abs(i-pg)<=2)
      html += `<button class="pbn ${i===pg?'active':''}" data-action="go-page" data-page="${i}">${i}</button>`;
    else if (Math.abs(i-pg)===3) html += `<span class="p-info">…</span>`;
  }
  html += `<button class="pbn" data-action="go-page" data-page="${pg+1}" ${pg===total?'disabled':''}>›</button>`;
  html += `<span class="p-info">${pg}/${total} · ${filtrado.length} reg.</span>`;
  pag.innerHTML = html;
}

function goPg(p) {
  const total = Math.ceil(filtrado.length / PER);
  if (p<1||p>total) return;
  pg = p;
  renderTable();
  document.querySelector('.table-area').scrollTop = 0;
}

// ===================== DRAWER =====================
function verDrawer(id, zona) {
  const d = DB[zona].find(x=>x.id===id);
  if (!d) return;
  const maxC = Math.max(...getDados().map(x=>x.total), 1);
  const pct = Math.min(100, (d.total/maxC)*100);
  const cfg = ZONAS_CFG[zona];

  const regionShortD = zona ? zona.charAt(0).toUpperCase() + zona.slice(1) : '';
  const coordInfo = isAdminUser() && d._coordZona
    ? `<span style="font-size:.7rem;color:var(--muted);margin-left:8px">📍 ${regionShortD} ${d._coordZona}${d._coordNome ? ' · ' + d._coordNome.split(' ')[0] : ''}</span>`
    : '';

  document.getElementById('drawer-content').innerHTML = `
    <div class="d-badge-wrap"><span class="badge badge-${a(d.tipo)}">${h(tipoLabel(d.tipo))}</span>
    ${cfg?`<span style="font-size:.7rem;color:${cfg.cor};margin-left:8px">${cfg.label}</span>`:''}
    ${coordInfo}
    </div>
    <div class="d-name">${h(d.nome)}</div>
    <div class="d-row"><span class="d-lbl">📞 Telefone</span><span class="d-val">${fmtWhats(d.telefone)}</span></div>
    <div class="d-row"><span class="d-lbl">📍 Bairro</span><span class="d-val">${h(d.bairro || '—')}</span></div>
    <div class="d-row"><span class="d-lbl">🏠 Endereço</span><span class="d-val" style="font-size:.75rem;max-width:180px;text-align:right">${fmtMaps(d.endereco)}</span></div>
    <div class="d-row"><span class="d-lbl">🏫 Colégio</span><span class="d-val" style="font-size:.75rem;text-align:right">${h(d.colegio || '—')}</span></div>
    <div class="d-row"><span class="d-lbl">📋 Seção</span><span class="d-val">${h(d.secao || '—')}</span></div>
    <div class="d-row"><span class="d-lbl">🗂️ Código</span><span class="d-val">${h(d.zona_eleitoral || '—')}</span></div>
    <div class="d-row"><span class="d-lbl">📌 Apoios</span><span class="d-val" style="font-size:1.1rem;font-weight:700;color:var(--accent)">${d.votos||'—'}</span></div>
    <div style="margin:14px 0 6px;font-size:.67rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Recursos mensais</div>
    ${[['Julho',d.custo_jul],['Agosto',d.custo_ago],['Setembro',d.custo_set],['Outubro',d.custo_out]].map(([m,v])=>
      `<div class="d-row"><span class="d-lbl">${m}</span><span class="d-val">${fmtR(v)}</span></div>`
    ).join('')}

    <div class="drawer-tabs">
      <div class="drawer-tab active" data-action="switch-tab" data-tab="tab-info">📋 Info</div>
      <div class="drawer-tab" data-action="switch-tab" data-tab="tab-reunioes">🤝 Reuniões</div>
      <div class="drawer-tab" data-action="switch-tab" data-tab="tab-pagamentos">💰 Pagamentos</div>
    </div>

    <!-- TAB INFO -->
    <div class="drawer-tab-content active" id="tab-info">
      <div class="d-row"><span class="d-lbl">Status</span><span class="d-val">${statusBadge(d.status)}</span></div>
      <div class="d-row"><span class="d-lbl">Reunião</span><span class="d-val">${reuniaoBadge(d.reuniao_feita, d.reuniao_data)}</span></div>
      ${d.tipo==='CA' ? `<div class="d-row"><span class="d-lbl">👥 Equipe</span><span class="d-val" style="color:#fb923c;font-weight:700">${getEquipeDeUm(d).length} lideranças</span></div>` : ''}
      ${(d.tipo==='L'||d.tipo==='LE') && d.coord_area_nome ? `<div class="d-row"><span class="d-lbl">🏛️ Coordenador</span><span class="d-val" style="color:#fb923c;font-size:.75rem">${h(d.coord_area_nome)}</span></div>` : ''}
      ${(d.tipo==='L'||d.tipo==='LE') ? `<div class="d-row"><span class="d-lbl">👥 Mobilizadores</span><span class="d-val" style="color:#22c55e;font-weight:700">${getEquipeDeUm(d).length}</span></div>` : ''}
      ${(d.tipo==='M'||d.tipo==='ME') && d.lider_nome ? `<div class="d-row"><span class="d-lbl">👤 Liderança</span><span class="d-val" style="color:#60a5fa;font-size:.75rem">${h(d.lider_nome)}</span></div>` : ''}
      <div class="d-total-box">
        <div class="d-total-lbl">💰 Total investido</div>
        <div class="d-total-val" style="${totalStyle(d.total)}">${fmtR(d.total)}</div>
        <div class="cost-bar"><div class="cost-fill" style="width:${pct}%;background:var(--accent,#e8433a)"></div></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-outline" style="flex:1;font-size:.78rem" data-action="editar-registro" data-id="${a(d.id)}" data-zona="${a(zona)}" data-close-drawer="true">✏️ Editar</button>
        <button class="btn btn-outline" style="flex:1;font-size:.78rem" data-action="deletar-registro" data-id="${a(d.id)}" data-zona="${a(zona)}">🗑 Excluir</button>
      </div>
      <button class="migrar-zona-btn" data-action="migrar-pessoa" data-fire-id="${a(d._fireId || '')}" data-id="${a(d.id)}" data-zona="${a(zona)}">
        📁 Adicionar em outro ciclo
      </button>
    </div>

    <!-- TAB REUNIÕES -->
    <div class="drawer-tab-content" id="tab-reunioes">
      <div id="lista-reunioes-${d.id}"></div>
      <button class="btn-add-sm" data-action="toggle-mini" data-target="form-reuniao-${a(d.id)}">+ Registrar reunião</button>
      <div class="mini-modal" id="form-reuniao-${d.id}">
        <label>Data</label>
        <input type="date" id="nr-data-${d.id}" value="${new Date().toISOString().slice(0,10)}">
        <label>Observações</label>
        <textarea id="nr-obs-${d.id}" placeholder="Como foi a reunião?"></textarea>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-outline" style="flex:1;font-size:.75rem" data-action="toggle-mini" data-target="form-reuniao-${a(d.id)}">Cancelar</button>
          <button class="btn btn-primary" style="flex:1;font-size:.75rem" data-action="salvar-reuniao" data-fire-id="${a(d._fireId || '')}" data-id="${a(d.id)}" data-zona="${a(zona)}">Salvar</button>
        </div>
      </div>
    </div>

    <!-- TAB PAGAMENTOS -->
    <div class="drawer-tab-content" id="tab-pagamentos">
      <div id="lista-pagamentos-${d.id}"></div>
      <button class="btn-add-sm" data-action="toggle-mini" data-target="form-pag-${a(d.id)}">+ Registrar pagamento</button>
      <div class="mini-modal" id="form-pag-${d.id}">
        <label>Mês</label>
        <select id="np-mes-${d.id}">
          <option value="Jul">Julho</option>
          <option value="Ago">Agosto</option>
          <option value="Set">Setembro</option>
          <option value="Out">Outubro</option>
        </select>
        <label>Valor (R$)</label>
        <input type="number" id="np-valor-${d.id}" placeholder="0" step="50">
        <label>Status</label>
        <select id="np-status-${d.id}">
          <option value="pago">✅ Pago</option>
          <option value="aberto">⏳ Em aberto</option>
        </select>
        <label>Observação</label>
        <input type="text" id="np-obs-${d.id}" placeholder="Opcional">
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-outline" style="flex:1;font-size:.75rem" data-action="toggle-mini" data-target="form-pag-${a(d.id)}">Cancelar</button>
          <button class="btn btn-primary" style="flex:1;font-size:.75rem" data-action="salvar-pagamento" data-fire-id="${a(d._fireId || '')}" data-id="${a(d.id)}" data-zona="${a(zona)}">Salvar</button>
        </div>
      </div>
    </div>
  `;
  // Carrega reuniões e pagamentos
  carregarReunioes(d._fireId, d.id);
  carregarPagamentos(d._fireId, d.id);
  document.getElementById('drawer').classList.add('open');
}

function fecharDrawer() { document.getElementById('drawer').classList.remove('open'); }

// ===================== MODAL CRUD =====================
let _editZona = null;

function abrirModal(id, zona) {
  editId = id;
  _editZona = zona || zonaAtual;
  if (_editZona === 'todas') _editZona = 'norte';

  document.getElementById('modal-title').textContent = id===null ? '📋 Novo Registro' : '✏️ Editar Registro';
  const flds = ['f-tipo','f-zona','f-nome','f-tel','f-bairro','f-end','f-votos','f-jul','f-ago','f-set','f-out','f-total'];

  const zonaFieldEl = document.getElementById('f-zona');
  if (!isAdminUser() && currentUserRole?.region) {
    if (zonaFieldEl) { zonaFieldEl.value = currentUserRole.region; zonaFieldEl.disabled = true; }
    _editZona = currentUserRole.region;
  } else {
    if (zonaFieldEl) zonaFieldEl.disabled = false;
  }

  if (id === null) {
    flds.forEach(f => {
      const el=document.getElementById(f);
      if (!el) return;
      if (el.tagName === 'SELECT') {
        el.value = (f==='f-zona'?(_editZona==='todas'?'norte':_editZona):'M');
      } else {
        el.value = '';
      }
    });
    if (!isAdminUser() && currentUserRole?.region && zonaFieldEl) zonaFieldEl.value = currentUserRole.region;
  } else {
    const d = DB[_editZona].find(x=>x.id===id);
    if (!d) return;
    const setIf = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
    setIf('f-tipo', d.tipo||'M');
    setIf('f-zona', _editZona);
    setIf('f-nome', d.nome||'');
    setIf('f-tel', d.telefone||'');
    setIf('f-bairro', d.bairro||'');
    setIf('f-end', d.endereco||'');
    setIf('f-votos', d.votos||'');
    setIf('f-jul', d.custo_jul||'');
    setIf('f-ago', d.custo_ago||'');
    setIf('f-set', d.custo_set||'');
    setIf('f-out', d.custo_out||'');
    setIf('f-total', d.total||'');
    setIf('f-status', d.status||'ativo');
    setIf('f-reuniao', d.reuniao_feita||'nao');
    setIf('f-reuniao-data', d.reuniao_data||'');
    setIf('f-colegio', d.colegio||'');
    setIf('f-secao', d.secao||'');
    setIf('f-zona-el', d.zona_eleitoral||'');
    // Carrega hierarquia
    atualizarCamposHierarquia();
    setTimeout(() => {
      const ca = document.getElementById('f-coord-area'); if (ca) ca.value = d.coord_area_id||'';
      const fl = document.getElementById('f-lider'); if (fl) fl.value = d.lider_id||'';
    }, 50);
  }
  if (id === null) atualizarCamposHierarquia();
  document.getElementById('overlay').classList.add('on');
}

function fecharModal(e) {
  if (e && e.target !== document.getElementById('overlay')) return;
  document.getElementById('overlay').classList.remove('on');
}

function getNextId(zona) {
  const arr = DB[zona];
  return arr.length ? Math.max(...arr.map(d=>d.id)) + 1 : 1;
}

function salvar() {
  const zonaOrigem = _editZona || zonaAtual;
  const zonaDestino = document.getElementById('f-zona').value;
  const raw = {
    tipo: document.getElementById('f-tipo').value,
    zona: zonaDestino,
    nome: document.getElementById('f-nome').value.trim(),
    telefone: document.getElementById('f-tel').value.trim(),
    reuniao_feita: document.getElementById('f-reuniao').value || 'nao',
    reuniao_data: document.getElementById('f-reuniao-data').value || ''
  };
  const safeVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const numeric = {
    votos: parseNonNegativeNumber(safeVal('f-votos'), 'Apoios'),
    custo_jul: parseNonNegativeNumber(safeVal('f-jul'), 'Recurso de julho'),
    custo_ago: parseNonNegativeNumber(safeVal('f-ago'), 'Recurso de agosto'),
    custo_set: parseNonNegativeNumber(safeVal('f-set'), 'Recurso de setembro'),
    custo_out: parseNonNegativeNumber(safeVal('f-out'), 'Recurso de outubro'),
    total: parseNonNegativeNumber(safeVal('f-total'), 'Total aplicado')
  };
  const errors = [
    ...validateRecordInput(raw),
    ...Object.values(numeric).map(item => item.error).filter(Boolean)
  ];
  if (errors.length) {
    toast('⚠️ ' + errors[0], true);
    return;
  }

  // Recupera o _fireId do registro original antes de qualquer alteração
  const regOriginal = editId !== null ? DB[zonaOrigem].find(x => x.id === editId) : null;
  const fireId = regOriginal ? regOriginal._fireId : null;

  const reg = {
    id: editId !== null ? editId : getNextId(zonaDestino),
    _fireId: fireId, // preserva o ID do Firebase para deletar/atualizar corretamente
    tipo: raw.tipo,
    nome: raw.nome.toUpperCase(),
    telefone: raw.telefone,
    bairro: document.getElementById('f-bairro').value.trim().toUpperCase(),
    endereco: document.getElementById('f-end').value.trim().toUpperCase(),
    votos: numeric.votos.value,
    v_entrada: 0,
    custo_jul: numeric.custo_jul.value,
    custo_ago: numeric.custo_ago.value,
    custo_set: numeric.custo_set.value,
    custo_out: numeric.custo_out.value,
    total: numeric.total.value,
    colegio: document.getElementById('f-colegio').value.trim().toUpperCase(),
    secao: document.getElementById('f-secao').value.trim(),
    zona_eleitoral: document.getElementById('f-zona-el').value.trim(),
    status: document.getElementById('f-status').value || 'ativo',
    reuniao_feita: raw.reuniao_feita,
    reuniao_data: raw.reuniao_data,
    coord_area_id: document.getElementById('f-coord-area').value || '',
    coord_area_nome: document.getElementById('f-coord-area').options[document.getElementById('f-coord-area').selectedIndex]?.text || '',
    lider_id: document.getElementById('f-lider').value || '',
    lider_nome: document.getElementById('f-lider').options[document.getElementById('f-lider').selectedIndex]?.text || '',
  };

  const zonaChanged = editId !== null && zonaDestino !== zonaOrigem;

  document.getElementById('overlay').classList.remove('on');
  // Delega tudo ao Firebase — ele recarrega as zonas após salvar
  salvarNoFirebase(reg, zonaOrigem, zonaDestino, zonaChanged, editId);
}

async function salvarNoFirebase(reg, zonaOrigem, zonaDestino, zonaChanged, editIdOrig) {
  try {
    const docData = {...reg, _zona: zonaDestino};
    const fireId = docData._fireId;
    delete docData._fireId;

    const u = firebase.auth().currentUser;
    if (u && !docData._criadoPor) {
      docData._criadoPor = u.uid;
      if (currentUserRole?.zona) docData._coordZona = currentUserRole.zona;
      if (currentUserRole?.name) docData._coordNome = currentUserRole.name;
    }

    if (editIdOrig !== null && fireId) {
      if (zonaChanged) {
        await colecao().doc(fireId).delete();
        await colecao().add(docData);
      } else {
        await colecao().doc(fireId).set(docData);
      }
    } else {
      await colecao().add(docData);
    }

    await recarregarZona(zonaDestino);
    if (zonaChanged) await recarregarZona(zonaOrigem);
    atualizarNavCounts();
    aplicarFiltros();

    const msg = zonaChanged
      ? `✅ Transferido para ${ZONAS_CFG[zonaDestino].label}!`
      : editIdOrig !== null ? '✅ Salvo!' : '✅ Cadastrado!';
    toast(msg);

    // Se é cadastro novo, pergunta se quer adicionar em outros ciclos
    if (editIdOrig === null) {
      const outrasCamps = Object.keys(campanhas).filter(id => id !== campanhaAtual);
      if (outrasCamps.length > 0) {
        setTimeout(() => {
          abrirModalCampsSel(
            reg,
            '📁 Adicionar em outros ciclos?',
            `"${reg.nome.split(' ')[0]}" foi cadastrado(a). Deseja adicioná-lo(a) em outros ciclos também?`
          );
        }, 600);
      }
    }
  } catch(e) {
    console.error('Erro Firebase salvar:', e);
    toast('❌ ' + formatFirebaseError(e), true);
  }
}

function deletar(id, zona) {
  const d = DB[zona].find(x => x.id === id);
  if (!d || !confirm(`Excluir "${d.nome}"?`)) return;
  deletarNoFirebase(d, zona);
}

async function deletarNoFirebase(d, zona) {
  try {
    if (d._fireId) {
      await colecao().doc(d._fireId).delete();
    }
    await recarregarZona(zona);
    atualizarNavCounts();
    aplicarFiltros();
    toast('🗑️ Excluído');
  } catch(e) {
    console.error('Erro Firebase deletar:', e);
    toast('❌ ' + formatFirebaseError(e), true);
  }
}

async function recarregarZona(zona) {
  let q = colecao().where('_zona', '==', zona);
  if (!isAdminUser()) {
    const uid = firebase.auth().currentUser?.uid;
    if (uid) q = q.where('_criadoPor', '==', uid);
  }
  const snap = await q.get();
  DB[zona] = snap.docs.map(d => ({...d.data(), _fireId: d.id}));
  BAIRROS[zona] = [...new Set(DB[zona].map(d => d.bairro).filter(Boolean))].sort();
}

// ===================== MIGRAÇÃO DE VÍNCULOS =====================
// Mapa de vínculos extraído da planilha original
const VINCULOS_PLANILHA = {"EDNA MARIA DA SILVA SOUSA": ["MARIA SOLIDADE FERNANDES DA SILVA", "ANA CLEIDE JESUS DOS SANTOS", "KATIUSIA MILENA DA SILVA", "ANTONIO CARLOS GOMES DA SILVA RODRIGUES", "BARBARA SOLANGE DA SILVA", "BIANCA DE JESUS DOS SANTOS"], "ELISALDA FERANANDA REIS": ["WALLISON DOROTEU"], "RAYLINNE OLIVEIRA XAVIER (EMPREGADO)": ["MARYANNE XAVIER", "KARLA ADRIANA MATOS DA COSTA", "JULCIMAR NUNES DE OLIVEIRA", "OSTINA RODRIGUES DA SILVA"], "ELIESIO GOMES SILVA": ["BOUQUINHA"], "RAVENA REGO SENA RODRIGUES (EMPREGADO)": ["GLAYDE HAYANY DE SOUSA CARVALHO LEITE", "DANIELY CARVALHO DA SILVA", "GLACILDE RIBEIRO DE SOUSA CAVALCANTE", "ROSA ELVAS DE SÁ", "MARIZE ALEXANDRA DE OLIVEIRA SOUSA", "JERONIMO PEREIRA SOUZA", "GISELIA MARIA FERREIRA DE ARAÚJO", "GRACIELLY SILVA CAVALCANTE", "ERICA CIBELLY", "FRANCISCA MARIA LIRA DO NASCIMENTO", "PAI DA RAVENA", "LISTA DA DANÇA"], "SHÉLYDA RAIANE RODRIGUES MACHADO (EMPREGADO)": ["EUDIMAR RODRIGUES DE SOUSA", "RENE WANDERSON OTAVIO DE SOUSA", "PAULA APARECIDA RODRIGUES DO NASCIMENTO", "JACOB RODRIGUES DE SOUSA", "FRANCIANA LOPES DO NASCIMENTO", "EDIVAN RODRIGUES DE SOUSA", "JEANIS OLIVEIRA DE AMORIM DE SOUSA", "MARIA DO SOCORRO AMANCIO DE SOUSA"], "ALINE DANIELE DOS SANTOS (EMPREGADO)": ["MARLENE DE FREITAS MARCIEL", "VIVIANE ALVES DA COSTA", "MARIA APARECIDA VIEIRA DOS SANTOS", "BARBARA THAIS SARAIVA", "ELANE DE SOUSA NOBREGA MENDES", "MARIA DO AMPARO SARAIVA LOPES"], "MARIA FERNANDA DE OLIVEIRA CRUZ (EMPREGADO)": ["THAIANY GABRIELE FELIX DA SILVA", "NATHALIA RODRIGUES DE SALES", "SALETE", "SOLANGE"], "REGINALDO VITORIO SOUZA": ["DANIELE MARIA DE MELO SANTOS (MULHER DO IAGO)", "SAMARA MARIA CARVALHO DE ARAÚJO", "RAIANE FERNANDES DAS SILVA", "FRANCISCA SANTANA DA SILVA", "NAYANE SANTANA DA SILVA", "LISAEL MAYKON COSTA E SILVA", "TIAGO PEREIRA DA SILVA", "LILIAN CARLA COSTA E SILVA", "MARCIO MACHADO PEREIRA", "IRAPUA FRANCISCO ARAÚJO", "ANGELICA MARIA DA SILVA PEREIRA", "LUCILENE ESTEVES DA CRUZ (NAO FEZ REUNIAO)", "DOMINGOS COSTA DOS SANTOS", "KAIO ESTEVES DA CRUZ SANTOS (NAO FEZ REUNIAO)", "ADRIANA DA SILVA", "DEUSELENE CLEMENTE SILVA", "MARIA SANTANA FRAZÃO DE OLIVEIRA", "MARIA DO SOCORRO MORAIS", "EDILSON FRANCISCO DA SILVA", "LUIS ALVES", "GARDENIA MARIA DA SILVA", "LUCIANA KATIA BORGES DA SILVA (ANINHA)", "VINICIUS DA COSTA MOREIRA", "FERNANDA MARIA GOMES SOARES DE SOUSA (NAO FEZ REUNIAO)", "DEBORA NAYARA SILVA ARAÚJO", "IZAURA FERREIRA BARROS", "IAGO LUIS DA SILVA PEREIRA"], "IVONEIDE MARIA DE ANDRADE (EMPREGADO)": ["LUCINETE MARIA DE ANDRADDE (FEZ REUNIAO)", "REGINA CELIA DE SOUSA SILVA (FEZ REUNIAO)", "DALILA BORGES FONTENELE TEÓFILO (FEZ REUNIAO)", "MARIA DE DEUS SOUSA DIAS (FEZ REUNIAO)", "FRANCISCO ALAN DOS SANTOS SILVA (FEZ REUNIAO)", "RAIMUNDA NONATA SILVA (FEZ REUNIAO)", "LUIS FELIPE SALES ALMEIDA", "MIGUEL DA SILVA SOUSA", "VERONICA KAROLINY OLIVEIRA SILVA FONTENELE", "LAVINIA AGLENES", "HIAGO ALEXANDRE OLIVEIRA FONTENELE", "DANIELLE ROCHA LEÃO FERRAZ MOREIRA"], "CARLANDIA RAMOS DE ARAUJO": ["RHAFAELLA MAYRA LIMA", "IRISMARA DE CARVALHO", "MARINALDO ALVES DA SILVA", "MARCELO FERREIRA NOGUEIRA", "MARIA DAS NEVES GREGORIO", "MARCOS VITORIO FERREIRA NOGUEIRA", "DEUSELITA FERREIRA DO  MONTE", "MARINEIDE LOPES RODRIGUES", "GLAUCIA MARIA DE SOUSA", "FERNANDA CARLA SILVA SANTOS", "MARIA DE FÀTIMA SILVA SANTOS", "KESSYANNY RODRIGUES DE SENA", "MATEUS PEREIRA LIMA REGO", "JANAINA MAGALHÃES MACHADO CARVALHO", "ZILDA MARIA DOS SANTOS PAIVA", "FABIO LUSTOZA", "JOSELENE ALVES DA PAZ BRITO (PRETA)", "SUELY PATRICIA SILVA SANTOS", "LUCIANA RAMOS DE ARAUJO", "REJANE DE SOUSA OLIVEIRA", "ELIZETE", "STENIO LEO LOPES DOS SANTOS", "CID JOSE PIMENTEL (CRISTIANO)", "LUIS SERGIO RAMOS DE ARAUJO", "ANA LUCIA BEZERRA DE SOUSA", "FRANCISCA PEREIRA (DEDE)", "TIA ROSA (ENTREGOU PAR ANA LUCIA)"], "AIDA DE LURDES ALVES LIMA": ["TICIANE AGNES ROCHA LIMA (FEZ REUNIAO JUNTO COM AIDA)", "FRANCISCA (VAI JUNTAR COM PROXIMA)", "FRANCILENE DE FATIMA DIAS MACIEL(FEZ REUNIAO)", "VERONICE MAGALHÃES DIAS", "FRANCINEIDE DO NASCIMENTO NERY", "MARIA DALVA OLIVEIRA CRUZ", "ELISA ANTONIA (DA INVASAO)", "MARIA CONCEICAO (VAI JUNTAR COM A PROXIMA)"], "DOMINGOS FERREIRA DE CARVALHO NETO (NETAO)": ["EDMILSON BRUNO FERREIRA CAMPOS VERAS (JA FEZ REUNIAO)", "KAMILA FERREIRA VERAS", "SERGIO ROBERTO DE SOUSA OLIVEIRA", "MARIA CLARA ALVES DE SOUSA", "FLAVIA ALVES VIANA"], "MARIANA MOUSINHO (DIRETORA CARLANDIA)": ["MAYSA RAMOS CARNEIRO", "RAFAEL ALVES DOS SANTOS", "MARIANE DO NASCIMENTO COSTA", "MAX RAMOS CARNEIRO", "AMANDA BEATRIZ DE MORAES", "NATALIA HAVANY SANTOS COSTA"], "ARLANE SANDRA DE SOUSA SANTOS": ["SONIA MARIA ALVES DE ALMEIDA SOUSA"], "MARIA MARTA ASSAYAG SILVA (EMPREGADO) (JA FEZ REUNIAO)": ["RAFAELLE MENDES DE SOUSA (JA FEZ REUNIAO)"], "SUELI DE SOUSA": ["BARBARA SUELEN DA SILVA LEITE (REUNIAO FEITA)", "LUSIANE GOMES DE ARAUJO", "MYLLENA DYANA DE OLIVEIRA (REUNIAO FEITA)", "RAIMUNDA MARIANA DA COSTA CARVALHO (REUNIAO FEITA)", "SILVANIA DA SILVA GOMES"], "IVONETE LACERDA DE LIMA": ["ANA SABRINA BARBOSA VELOSO (JA FEZ REUNIAO)"], "LAYANY NAYRA COUTINHO LIMA (JA FEZ REUNIAO)": ["NÁDIA TATIELY JATAHY DOS SANTOS", "AURICÉLIA DE SOUZA COSTA", "ELIENE MELO DO VALE", "FABIANO XAVIER DA SILVA", "JÚLIA REJANE ARAÚJO DA SILVA", "LUIZ ALVES LIMA JÚNIOR", "MARIA DAS GRAÇAS COUTINHO LIMA", "MIRLLA PORTELA DUARTE", "RAYANE PEREIRA DA SILVA", "SILVANA BARBOSA DA COSTA"], "ANDRE PRADO": ["LUZINEIDE FELIX DE ARAÚJO SOUSA", "VERÔNICA MARIA FERREIRA", "LUCIMEIRE DE CRAVALHO", "WESLEY SILVESTRE CARNEIRO MOREIRA DA SILVA", "MYRNA ALVES"], "HEVERTON": ["MESTRE", "MARIA DE FATIMA GREGORI MELO"]};

// Nome da Raiane (coordenadora)
const RAIANE_NOME = 'SHÉLYDA RAIANE RODRIGUES MACHADO (EMPREGADO)';

async function migrarVinculos() {
  // Sempre roda para garantir vínculos completos
  await migrarVinculosForce();
}

async function migrarVinculosForce() {
  console.log('Iniciando migração de vínculos...');
  toast('🔗 Vinculando hierarquia…');

  // Busca todos os docs
  const todos = await colecao().get();
  const docs = todos.docs.map(d => ({...d.data(), _fireId: d.id}));

  // Encontra a Raiane
  const raiane = docs.find(d => d.nome && d.nome.includes('SHÉLYDA RAIANE'));
  const raianeId = raiane ? raiane._fireId : '';
  const raianeNome = raiane ? raiane.nome : RAIANE_NOME;

  const normalizeName = (name) =>
    (name || '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/SEMAM|EMPREGADO/g, '')
      .trim();

  const updates = [];
  let count = 0;

  // Para cada liderança com mobilizadores no mapa
  for (const [nomeL, nomesMobs] of Object.entries(VINCULOS_PLANILHA)) {
    // Encontra a liderança pelo nome (busca flexível)
    const nomeKeyL = normalizeName(nomeL).substring(0, 15);
    const lider = docs.find(d => d.nome && normalizeName(d.nome).includes(nomeKeyL));
    if (!lider) { console.log('Lider nao encontrada:', nomeL); continue; }

    // Vincula liderança à Raiane apenas se ela ainda não tiver coordenador
    if (lider._fireId !== raianeId && raianeId && !lider.coord_area_id) {
      updates.push({ ref: colecao().doc(lider._fireId), data: {
        coord_area_id: raianeId,
        coord_area_nome: raianeNome
      }});
      count++;
    }

    // Vincula mobilizadores à liderança apenas se ainda não tiverem uma liderança definida
    for (const nomeMob of nomesMobs) {
      const nomeKeyM = normalizeName(nomeMob).substring(0, 15);
      const mob = docs.find(d => d.nome && normalizeName(d.nome).includes(nomeKeyM));
      if (!mob) { console.log('Mob nao encontrado:', nomeMob); continue; }
      if (mob.lider_id || mob.coord_area_id) continue;
      updates.push({ ref: colecao().doc(mob._fireId), data: {
        lider_id: lider._fireId,
        lider_nome: lider.nome,
        coord_area_id: raianeId,
        coord_area_nome: raianeNome
      }});
      count++;
    }
  }

  // Aplica a coordenação da Raiane a todos os registros sem coordenação
  docs.filter(d => ['L','LE','M','ME'].includes(d.tipo) && !d.coord_area_id && d._fireId !== raianeId)
    .forEach(d => {
      if (!updates.find(u => u.ref.id === d._fireId && u.data.coord_area_id)) {
        updates.push({ ref: colecao().doc(d._fireId), data: {
          coord_area_id: raianeId,
          coord_area_nome: raianeNome
        }});
        count++;
      }
    });

  // Executa em batches de 400
  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch();
    updates.slice(i, i + 400).forEach(u => batch.update(u.ref, u.data));
    await batch.commit();
    console.log(`Batch ${Math.floor(i/400)+1} concluído`);
  }

  console.log(`Migração concluída: ${count} vínculos criados`);
  toast(`✅ ${count} vínculos aplicados!`);
}

// Migra dados locais da Zona Norte para Firebase (só na primeira vez)
async function migrarDadosNorte() {
  const snap = await colecao().where('_zona', '==', 'norte').limit(1).get();
  if (!snap.empty) return;
  toast('📤 Importando base inicial…');
  // Divide em batches de 500
  const todos = DADOS_NORTE.map(d => ({...d, _zona: 'norte'}));
  for (let i = 0; i < todos.length; i += 400) {
    const batch = db.batch();
    todos.slice(i, i + 400).forEach(d => {
      const ref = colecao().doc();
      const docData = {...d};
      delete docData._fireId;
      batch.set(ref, docData);
    });
    await batch.commit();
  }
  await db.collection('campanhas').doc(campanhaAtual).set({
    dadosIniciaisImportados: true,
    dadosIniciaisImportadosEm: new Date().toISOString()
  }, { merge: true });
  if (campanhas[campanhaAtual]) campanhas[campanhaAtual].dadosIniciaisImportados = true;
  toast('✅ Base inicial importada!');
}

// ===================== IMPORTAR XLSX =====================
function importarArquivo(event) {
  const file = event.target.files[0];
  if (!file) return;
  toast('📥 Importação via arquivo requer servidor. Adicione registros manualmente ou cole no console: DB["' + zonaAtual + '"]');
  event.target.value = '';
}

// ===================== HIERARQUIA =====================
function atualizarCamposHierarquia() {
  const tipo = document.getElementById('f-tipo').value;
  const campoCord = document.getElementById('campo-coordenador');
  const campoLider = document.getElementById('campo-lideranca');

  // L e LE precisam de coordenador
  if (tipo === 'L' || tipo === 'LE') {
    campoCord.style.display = 'block';
    campoLider.style.display = 'none';
    popularSelectCoordenadores();
  }
  // M e ME precisam de liderança (e indiretamente coordenador)
  else if (tipo === 'M' || tipo === 'ME') {
    campoCord.style.display = 'none';
    campoLider.style.display = 'block';
    popularSelectLiderancas();
  }
  // CA não precisa de vínculo
  else {
    campoCord.style.display = 'none';
    campoLider.style.display = 'none';
  }
}

function popularSelectCoordenadores() {
  const sel = document.getElementById('f-coord-area');
  const atual = sel.value;
  sel.innerHTML = '<option value="">— Selecione o coordenador —</option>';

  const todas = getDados();
  const coords = todas.filter(d => d.tipo === 'CA').sort((a,b) => a.nome.localeCompare(b.nome));
  coords.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d._fireId || d.id;
    opt.textContent = d.nome + (d.bairro ? ` (${d.bairro})` : '');
    sel.appendChild(opt);
  });
  sel.value = atual;
}

function popularSelectLiderancas() {
  const sel = document.getElementById('f-lider');
  const atual = sel.value;
  sel.innerHTML = '<option value="">— Selecione a liderança —</option>';

  const zona = document.getElementById('f-zona').value;
  const todas = getDados();
  const liders = todas.filter(d => d.tipo === 'L' || d.tipo === 'LE').sort((a,b) => a.nome.localeCompare(b.nome));
  liders.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d._fireId || d.id;
    opt.textContent = d.nome + (d.bairro ? ` (${d.bairro})` : '');
    sel.appendChild(opt);
  });
  sel.value = atual;
}

function getEquipeDeUm(d) {
  const todas = getDados();
  if (d.tipo === 'CA') {
    return todas.filter(x => x.coord_area_id === (d._fireId || String(d.id)));
  }
  if (d.tipo === 'L' || d.tipo === 'LE') {
    return todas.filter(x => x.lider_id === (d._fireId || String(d.id)));
  }
  return [];
}

// ===================== DASHBOARD =====================
let dashboardView = false;
let dashboardInicialAberto = false;

function dadosDoCicloAtual() {
  return Object.values(DB).flat();
}

// Abre o Dashboard como tela inicial logo após o carregamento dos dados.
function abrirDashboardInicial() {
  if (dashboardInicialAberto) return;
  dashboardInicialAberto = true;
  if (!dashboardView) toggleDashboardView();
}

function closeDashboardView() {
  if (!dashboardView) return;
  dashboardView = false;
  document.getElementById('btnDashboardToggle')?.classList.remove('active');
  const btn = document.getElementById('btnDashboardToggle');
  if (btn) btn.textContent = '📊 Dashboard';
  document.getElementById('dashboardArea')?.classList.remove('active');
  document.querySelector('.table-area')?.classList.remove('hidden');
  const pag = document.getElementById('pag');
  const ctrlBar = document.querySelector('.controls-bar');
  if (pag) pag.style.display = '';
  if (ctrlBar) ctrlBar.style.display = '';
}

function toggleDashboardView() {
  if (mapView) {
    mapView = false;
    document.getElementById('btnMapToggle').classList.remove('active');
    document.getElementById('btnMapToggle').textContent = '🗺️ Mapa';
    document.getElementById('mapArea').classList.remove('active');
    document.body.classList.remove('map-fullscreen');
  }
  if (treeView) {
    treeView = false;
    document.getElementById('btnTreeToggle').classList.remove('active');
    document.getElementById('btnTreeToggle').textContent = '🌳 Árvore';
    document.getElementById('treeArea').classList.remove('active');
  }

  dashboardView = !dashboardView;
  const btn = document.getElementById('btnDashboardToggle');
  const dashboardArea = document.getElementById('dashboardArea');
  const tableArea = document.querySelector('.table-area');
  const pag = document.getElementById('pag');
  const ctrlBar = document.querySelector('.controls-bar');
  if (!btn || !dashboardArea || !tableArea || !pag || !ctrlBar) {
    toast('❌ Não foi possível abrir o Dashboard', true);
    return;
  }

  if (dashboardView) {
    btn.classList.add('active');
    btn.textContent = '📋 Lista';
    tableArea.classList.add('hidden');
    pag.style.display = 'none';
    ctrlBar.style.display = 'none';
    dashboardArea.classList.add('active');
    try {
      renderDashboard();
    } catch(e) {
      console.error('Erro render dashboard:', e);
      const cards = document.getElementById('dashboardCards');
      if (cards) cards.innerHTML = '<div class="dash-empty">Não foi possível carregar o Dashboard.</div>';
      toast('❌ Erro ao carregar o Dashboard', true);
    }
  } else {
    btn.classList.remove('active');
    btn.textContent = '📊 Dashboard';
    tableArea.classList.remove('hidden');
    pag.style.display = '';
    ctrlBar.style.display = '';
    dashboardArea.classList.remove('active');
  }
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item) || 'Sem informação';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function renderBars(elId, rows, color) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!rows.length) {
    el.innerHTML = '<div class="dash-empty">Sem dados neste ciclo.</div>';
    return;
  }
  const max = Math.max(...rows.map(([, value]) => value), 1);
  el.innerHTML = rows.map(([label, value]) => `
    <div class="dash-bar-row">
      <span class="dash-bar-label">${h(label)}</span>
      <span class="dash-bar-track"><span class="dash-bar-fill" style="width:${Math.max(4, (value / max) * 100)}%;background:${color || 'var(--accent,#3b82f6)'}"></span></span>
      <span class="dash-bar-value">${value}</span>
    </div>
  `).join('');
}

function renderDashboard() {
  const dados = dadosDoCicloAtual();
  const total = dados.length;
  const referencias = dados.filter(d => d.tipo === 'L' || d.tipo === 'LE').length;
  const equipe = dados.filter(d => d.tipo === 'M' || d.tipo === 'ME').length;
  const coordenacao = dados.filter(d => d.tipo === 'CA').length;
  const apoios = dados.reduce((sum, d) => sum + (d.votos || 0), 0);
  const recursos = dados.reduce((sum, d) => sum + (d.total || 0), 0);
  const pendentes = dados.filter(d => d.status === 'pendente').length;
  const semContato = dados.filter(d => !(d.telefone || '').replace(/\D/g, '')).length;
  const semBairro = dados.filter(d => !d.bairro).length;
  const cicloNome = nomeCiclo(campanhaAtual, campanhas[campanhaAtual]);

  document.getElementById('dashboardTitle').textContent = cicloNome;
  document.getElementById('dashboardCards').innerHTML = [
    ['Total', total.toLocaleString('pt-BR'), 'registros no ciclo'],
    ['Lideranças', referencias.toLocaleString('pt-BR'), 'pontos de contato'],
    ['Mobilizadores', equipe.toLocaleString('pt-BR'), 'campo operacional'],
    ['Coordenadores', coordenacao.toLocaleString('pt-BR'), 'regionais'],
    ['Apoios', apoios.toLocaleString('pt-BR'), 'previstos'],
    ['Pendentes', pendentes.toLocaleString('pt-BR'), 'precisam de revisão'],
    ['Sem contato', semContato.toLocaleString('pt-BR'), `${semBairro} sem bairro`]
  ].map(([label, value, sub]) => `
    <div class="dashboard-card">
      <div class="dashboard-card-label">${h(label)}</div>
      <div class="dashboard-card-value">${h(value)}</div>
      <div class="dashboard-card-sub">${h(sub)}</div>
    </div>
  `).join('');

  const regioes = Object.entries(ZONAS_CFG).map(([zona, cfg]) => [cfg.label, (DB[zona] || []).length]);
  const perfis = Object.entries(countBy(dados, d => tipoNome(d.tipo))).sort((a,b) => b[1] - a[1]);
  const status = Object.entries(countBy(dados, d => d.status || 'ativo')).sort((a,b) => b[1] - a[1]);
  const bairros = Object.entries(countBy(dados.filter(d => d.bairro), d => d.bairro))
    .sort((a,b) => b[1] - a[1])
    .slice(0, 8);

  renderBars('dashboardRegioes', regioes, '#3b82f6');
  renderBars('dashboardPerfis', perfis, '#22c55e');
  renderBars('dashboardStatus', status, '#f59e0b');
  renderBars('dashboardBairros', bairros, '#a855f7');
}

// ===================== ÁRVORE HIERÁRQUICA =====================
let treeView = false;

function toggleTreeView() {
  // Fecha mapa se estiver aberto
  if (mapView) {
    mapView = false;
    document.getElementById('btnMapToggle').classList.remove('active');
    document.getElementById('btnMapToggle').textContent = '🗺️ Mapa';
    document.getElementById('mapArea').classList.remove('active');
    document.querySelector('.table-area').classList.remove('hidden');
    document.getElementById('pag').style.display = '';
    document.body.classList.remove('map-fullscreen');
  }
  closeDashboardView();

  treeView = !treeView;
  const btn = document.getElementById('btnTreeToggle');
  const tableArea = document.querySelector('.table-area');
  const pag = document.getElementById('pag');
  const treeArea = document.getElementById('treeArea');
  const ctrlBar = document.querySelector('.controls-bar');

  if (treeView) {
    btn.classList.add('active');
    btn.textContent = '📋 Tabela';
    tableArea.classList.add('hidden');
    pag.style.display = 'none';
    ctrlBar.style.display = 'none';
    treeArea.classList.add('active');
    renderArvore();
  } else {
    btn.classList.remove('active');
    btn.textContent = '🌳 Árvore';
    tableArea.classList.remove('hidden');
    pag.style.display = '';
    ctrlBar.style.display = '';
    treeArea.classList.remove('active');
  }
}

function renderArvore() {
  const q = norm(document.getElementById('treeSearch')?.value || '');
  const dados = getDados();

  // CA inclui tipo CA e também quem tem referências vinculadas por coord_area_id
  let coords = dados.filter(d => d.tipo === 'CA');
  const liderancas = dados.filter(d => d.tipo === 'L' || d.tipo === 'LE');
  const mobilizadores = dados.filter(d => d.tipo === 'M' || d.tipo === 'ME');

  // Se não tem CA mas tem vínculos via coord_area_id, reconstrói coordenadores a partir dos vínculos
  if (coords.length === 0) {
    const coordIds = [...new Set(liderancas.map(l => l.coord_area_id).filter(Boolean))];
    coords = coordIds.map(id => {
      // Busca o registro por _fireId ou por coord_area_nome
      const found = dados.find(d => d._fireId === id || String(d.id) === id);
      if (found) return found;
      // Fallback: cria nó virtual com o nome
      const nome = liderancas.find(l => l.coord_area_id === id)?.coord_area_nome || 'Coordenador';
      return { id: id, _fireId: id, tipo: 'CA', nome, _virtual: true };
    }).filter(Boolean);
  }

  // Stats
  const totalApoios = dados.reduce((s,d) => s+(d.votos||0), 0);
  const semVinculo = liderancas.filter(l => !l.coord_area_id).length;
  document.getElementById('treeStats').innerHTML = `
    <div class="tree-stat">Coordenadores: <strong>${coords.length}</strong></div>
    <div class="tree-stat">Lideranças: <strong>${liderancas.length}</strong></div>
    <div class="tree-stat">Mobilizadores: <strong>${mobilizadores.length}</strong></div>
    <div class="tree-stat">Total de apoios: <strong>${totalApoios.toLocaleString('pt-BR')}</strong></div>
    ${semVinculo > 0 ? `<div class="tree-stat" style="border-color:rgba(234,179,8,.3)">⚠️ Sem vínculo: <strong style="color:#f59e0b">${semVinculo}</strong></div>` : ''}
  `;

  let html = '';

  // Sem coordenador e sem vínculos — mostra aviso
  if (coords.length === 0 && liderancas.filter(l => l.coord_area_id).length === 0) {
    html += `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;color:var(--muted);margin-bottom:16px">
      <div style="font-size:1.5rem;margin-bottom:8px">🏛️</div>
      <div style="font-size:.85rem">Nenhuma hierarquia definida ainda.</div>
      <div style="font-size:.75rem;margin-top:6px">Edite as referências e vincule-as a um coordenador de área.</div>
    </div>`;
  }

  // Nó de cada Coordenador
  coords.forEach((ca, ci) => {
    const nomeCA = ca.nome || '';
    if (q && !norm(nomeCA).includes(q)) {
      // Verifica se alguma liderança/mob bate
      const lidsCa = liderancas.filter(l => l.coord_area_id === (ca._fireId || String(ca.id)));
      const mobsCa = mobilizadores.filter(m => lidsCa.some(l => l._fireId === m.lider_id || String(l.id) === m.lider_id));
      const algumBate = [...lidsCa, ...mobsCa].some(d =>
        norm(d.nome || '').includes(q)
      );
      if (!algumBate) return;
    }

    const lidsCA = liderancas.filter(l => l.coord_area_id === (ca._fireId || String(ca.id)));
    const totalMobs = mobilizadores.filter(m => lidsCA.some(l => (l._fireId||String(l.id)) === m.lider_id)).length;
    const totalApoiosCA = [...lidsCA, ...mobilizadores.filter(m => lidsCA.some(l => (l._fireId||String(l.id)) === m.lider_id))].reduce((s,d)=>s+(d.votos||0),0);

    html += `<div class="tree-ca">
      <div class="tree-ca-header" data-action="toggle-node" data-node-id="ca-${ci}">
        <div class="tree-ca-avatar">🏛️</div>
        <div class="tree-ca-info">
          <div class="tree-ca-nome">${h(nomeCA)}</div>
          <div class="tree-ca-sub">${h(ca.bairro || '')} ${ca.telefone ? '· '+h(ca.telefone) : ''}</div>
        </div>
        <div class="tree-ca-counts">
          <div class="tree-count-pill">👥 <strong>${lidsCA.length}</strong> referências</div>
          <div class="tree-count-pill">🗳️ <strong>${totalMobs}</strong> eq.</div>
          <div class="tree-count-pill">✅ <strong>${totalApoiosCA}</strong> apoios</div>
        </div>
        <span class="tree-toggle open" id="tog-ca-${ci}">▶</span>
      </div>
      <div class="tree-ca-body open" id="ca-${ci}">`;

    if (lidsCA.length === 0) {
      html += `<div style="font-size:.78rem;color:var(--muted);padding:8px 0">Nenhuma referência vinculada a esta coordenação ainda.</div>`;
    }

    // Lideranças do CA
    lidsCA.forEach((l, li) => {
      const nomeL = l.nome || '';
      const mobsL = mobilizadores.filter(m => m.lider_id === (l._fireId || String(l.id)));
      const apoiosL = [l, ...mobsL].reduce((s,d)=>s+(d.votos||0),0);

      html += `<div class="tree-l">
        <div class="tree-l-header" data-action="toggle-node" data-node-id="l-${ci}-${li}">
          <div class="tree-l-avatar">👤</div>
          <div style="flex:1">
            <div class="tree-l-nome">${h(nomeL)}</div>
            <div class="tree-l-sub">${h(l.bairro || '')} ${l.secao?'· Seção '+h(l.secao):''}</div>
          </div>
          <div class="tree-ca-counts">
            <div class="tree-count-pill">👥 <strong>${mobsL.length}</strong> eq.</div>
            <div class="tree-count-pill">🗳️ <strong>${apoiosL}</strong> apoios</div>
          </div>
          <div style="display:flex;gap:6px;margin-left:8px">
            <button class="btn-ico view" data-action="ver-drawer" data-id="${a(l.id)}" data-zona="${a(l._zona)}" title="Visualizar">👁</button>
          </div>
          <span class="tree-toggle open" id="tog-l-${ci}-${li}" style="margin-left:6px">▶</span>
        </div>
        <div class="tree-l-body open" id="l-${ci}-${li}">`;

      if (mobsL.length === 0) {
        html += `<div style="font-size:.75rem;color:var(--muted);padding:4px 0">Nenhuma pessoa da equipe vinculada a esta referência.</div>`;
      }

      mobsL.forEach(m => {
        html += `<div class="tree-m" data-action="ver-drawer" data-id="${a(m.id)}" data-zona="${a(m._zona)}">
          <div class="tree-m-dot"></div>
          <span class="tree-m-nome">${h(m.nome)}</span>
          <span class="tree-m-bairro">${h(m.bairro || '')}</span>
          ${m.votos ? `<span class="tree-m-votos">🗳️ ${m.votos}</span>` : ''}
          <button class="btn-ico view" data-action="ver-drawer" data-id="${a(m.id)}" data-zona="${a(m._zona)}" title="Visualizar">👁</button>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += `</div></div>`;
  });

  // Sem vínculo — Lideranças sem coordenação
  const lidersSemCA = liderancas.filter(l => !l.coord_area_id || l.coord_area_id === '');
  const mobsSemL = mobilizadores.filter(m => !m.lider_id || m.lider_id === '');

  if (lidersSemCA.length > 0 || mobsSemL.length > 0) {
    html += `<div class="tree-orphans">
      <div class="tree-orphans-header" data-action="toggle-node" data-node-id="orphans">
        <h4>⚠️ Sem vínculo definido</h4>
        <span class="tree-count-pill"><strong>${lidersSemCA.length}</strong> lideranças · <strong>${mobsSemL.length}</strong> mobilizadores</span>
        <span class="tree-toggle" id="tog-orphans">▶</span>
      </div>
      <div class="tree-orphans-body" id="orphans">`;

    if (lidersSemCA.length > 0) {
      html += `<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;margin-top:4px">Lideranças sem coordenação</div>`;
      lidersSemCA.forEach(l => {
        html += `<div class="orphan-item">
          <span class="badge badge-${a(l.tipo)}">${h(l.tipo)}</span>
          <span class="orphan-name">${h(l.nome)}</span>
          <span class="orphan-bairro">${h(l.bairro || '')}</span>
          <button class="btn-ico view" data-action="ver-drawer" data-id="${a(l.id)}" data-zona="${a(l._zona)}" title="Visualizar">👁</button>
          <button class="btn-ico edit" data-action="editar-registro" data-id="${a(l.id)}" data-zona="${a(l._zona)}" title="Editar">✏️</button>
        </div>`;
      });
    }

    if (mobsSemL.length > 0) {
      html += `<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;margin-top:12px">Mobilizadores sem liderança</div>`;
      mobsSemL.forEach(m => {
        html += `<div class="orphan-item">
          <span class="badge badge-${a(m.tipo)}">${h(m.tipo)}</span>
          <span class="orphan-name">${h(m.nome)}</span>
          <span class="orphan-bairro">${h(m.bairro || '')}</span>
          <button class="btn-ico view" data-action="ver-drawer" data-id="${a(m.id)}" data-zona="${a(m._zona)}" title="Visualizar">👁</button>
          <button class="btn-ico edit" data-action="editar-registro" data-id="${a(m.id)}" data-zona="${a(m._zona)}" title="Editar">✏️</button>
        </div>`;
      });
    }

    html += `</div></div>`;
  }

  document.getElementById('treeContent').innerHTML = html;
}

function toggleNode(id) {
  const body = document.getElementById(id);
  const tog = document.getElementById('tog-' + id);
  if (!body) return;
  body.classList.toggle('open');
  if (tog) tog.classList.toggle('open');
}

// ===================== EXPORTAR =====================
function exportarDados() {
  const dados = getDados();
  if (!dados.length) { toast('⚠️ Nenhum dado para exportar', true); return; }

  const zonaNome = zonaAtual === 'todas' ? 'Todas as Regiões' : (ZONAS_CFG[zonaAtual]?.label || zonaAtual);

  const rows = dados.map(d => ({
    'ID': d.id,
    'Tipo': d.tipo,
    'Nome': d.nome,
    'Telefone': d.telefone || '',
    'Bairro': d.bairro || '',
    'Endereço': d.endereco || '',
    'Região': ZONAS_CFG[d._zona]?.label || d._zona || '',
    'Ponto de referência': d.colegio || '',
    'Seção': d.secao || '',
    'Código regional': d.zona_eleitoral || '',
    'Coordenador de Área': d.coord_area_nome || '',
    'Liderança': d.lider_nome || '',
    'Apoios': d.votos || 0,
    'V. Entrada': d.v_entrada || 0,
    'Recurso Jul': d.custo_jul || 0,
    'Recurso Ago': d.custo_ago || 0,
    'Recurso Set': d.custo_set || 0,
    'Recurso Out': d.custo_out || 0,
    'Total': d.total || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Largura das colunas
  ws['!cols'] = [
    {wch:6},{wch:8},{wch:40},{wch:18},{wch:20},{wch:40},
    {wch:16},{wch:30},{wch:10},{wch:14},{wch:30},{wch:30},
    {wch:8},{wch:10},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12}
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, zonaNome.substring(0,31));

  const data = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  const filename = `coordenacao_${zonaAtual}_${data}.xlsx`;
  XLSX.writeFile(wb, filename);

  toast(`✅ Exportado: ${filename}`);
}

// ===================== DRAWER TABS =====================
function switchTab(el, tabId) {
  const drawer = el.closest('.drawer-tabs').parentElement;
  drawer.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
  drawer.querySelectorAll('.drawer-tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const tab = drawer.querySelector('#' + tabId);
  if (tab) tab.classList.add('active');
}

function toggleMiniModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

// ===================== REUNIÕES =====================
async function carregarReunioes(fireId, localId) {
  const el = document.getElementById('lista-reunioes-' + localId);
  if (!el || !fireId) return;
  try {
    const snap = await colecao().doc(fireId)
      .collection('reunioes').orderBy('data', 'desc').limit(10).get();
    if (snap.empty) {
      el.innerHTML = '<div style="font-size:.75rem;color:var(--muted);padding:8px 0">Nenhuma reunião registrada ainda.</div>';
      return;
    }
    el.innerHTML = snap.docs.map(d => {
      const r = d.data();
      return `<div class="reuniao-item">
        <div class="reuniao-item-data">📅 ${h(r.data || '—')}</div>
        <div class="reuniao-item-obs">${h(r.obs || 'Sem observações')}</div>
      </div>`;
    }).join('');
  } catch(e) { console.error('Erro reunioes:', e); }
}

async function salvarReuniao(fireId, localId, zona) {
  const data = document.getElementById('nr-data-' + localId).value;
  const obs  = document.getElementById('nr-obs-' + localId).value.trim();
  if (!data) { toast('⚠️ Informe a data', true); return; }
  try {
    await colecao().doc(fireId)
      .collection('reunioes').add({ data, obs, criadoEm: new Date().toISOString() });
    // Marca reunião feita no registro principal
    await colecao().doc(fireId).update({ reuniao_feita: 'sim', reuniao_data: data });
    await recarregarZona(zona);
    aplicarFiltros();
    toggleMiniModal('form-reuniao-' + localId);
    carregarReunioes(fireId, localId);
    toast('✅ Reunião registrada!');
  } catch(e) { toast('❌ Erro ao salvar reunião', true); }
}

// ===================== PAGAMENTOS =====================
async function carregarPagamentos(fireId, localId) {
  const el = document.getElementById('lista-pagamentos-' + localId);
  if (!el || !fireId) return;
  try {
    const snap = await colecao().doc(fireId)
      .collection('pagamentos').orderBy('criadoEm', 'desc').limit(20).get();
    if (snap.empty) {
      el.innerHTML = '<div style="font-size:.75rem;color:var(--muted);padding:8px 0">Nenhum pagamento registrado ainda.</div>';
      return;
    }
    el.innerHTML = snap.docs.map(d => {
      const p = d.data();
      const cls = p.status === 'pago' ? 'pag-pago' : 'pag-aberto';
      const ico = p.status === 'pago' ? '✅' : '⏳';
      return `<div class="pag-mes">
        <span class="pag-mes-nome">${h(p.mes || '—')} ${p.obs ? '· '+h(p.obs) : ''}</span>
        <span class="pag-mes-valor">R$ ${(p.valor||0).toLocaleString('pt-BR')}</span>
        <span class="pag-mes-status ${cls}">${ico} ${h(p.status || '')}</span>
      </div>`;
    }).join('');
  } catch(e) { console.error('Erro pagamentos:', e); }
}

async function salvarPagamento(fireId, localId, zona) {
  const mes    = document.getElementById('np-mes-' + localId).value;
  const parsedValor = parseNonNegativeNumber(document.getElementById('np-valor-' + localId).value, 'Valor');
  const status = document.getElementById('np-status-' + localId).value;
  const obs    = document.getElementById('np-obs-' + localId).value.trim();
  if (parsedValor.error) { toast('⚠️ ' + parsedValor.error, true); return; }
  if (!parsedValor.value) { toast('⚠️ Informe o valor', true); return; }
  try {
    await colecao().doc(fireId)
      .collection('pagamentos').add({ mes, valor: parsedValor.value, status, obs, criadoEm: new Date().toISOString() });
    toggleMiniModal('form-pag-' + localId);
    carregarPagamentos(fireId, localId);
    toast('✅ Pagamento registrado!');
  } catch(e) { toast('❌ Erro ao salvar pagamento', true); }
}

// ===================== CAMPANHAS =====================
async function carregarCampanhas() {
  try {
    const snap = await db.collection('campanhas').orderBy('ano', 'asc').get();

    if (snap.empty) {
      // Cria ciclos padrão
      const campanhasPadrao = [
        { id: CAMPANHA_SEMENTE_INICIAL, nome: '2024 - Ciclo Base', ano: 2024, cargo: 'Categoria E' },
      ];
      const batch = db.batch();
      campanhasPadrao.forEach(cp => {
        batch.set(db.collection('campanhas').doc(cp.id), {
          nome: cp.nome, ano: cp.ano, cargo: cp.cargo,
          dadosIniciaisImportados: cp.id !== CAMPANHA_SEMENTE_INICIAL,
          criadoEm: new Date().toISOString()
        });
      });
      await batch.commit();
      campanhas = {};
      campanhasPadrao.forEach(cp => {
        campanhas[cp.id] = {
          nome: cp.nome,
          ano: cp.ano,
          cargo: cp.cargo,
          dadosIniciaisImportados: cp.id !== CAMPANHA_SEMENTE_INICIAL
        };
      });
      campanhaAtual = '2024-vereador';
    } else {
      const todasCampanhas = {};
      snap.docs.forEach(d => { todasCampanhas[d.id] = d.data(); });
      if (!todasCampanhas[CAMPANHA_SEMENTE_INICIAL]) {
        await db.collection('campanhas').doc(CAMPANHA_SEMENTE_INICIAL).set({
          nome: '2024 - Ciclo Base',
          ano: 2024,
          cargo: 'Categoria E',
          dadosIniciaisImportados: false,
          criadoEm: new Date().toISOString()
        }, { merge: true });
        todasCampanhas[CAMPANHA_SEMENTE_INICIAL] = {
          nome: '2024 - Ciclo Base',
          ano: 2024,
          cargo: 'Categoria E',
          dadosIniciaisImportados: false
        };
      }

      campanhas = Object.fromEntries(
        Object.entries(todasCampanhas).filter(([id]) => cicloVisivel(id))
      );

      // Usa o ciclo base por padrão, ou a salva no localStorage se ainda for visível.
      campanhaAtual = campanhas[CAMPANHA_SEMENTE_INICIAL]
        ? CAMPANHA_SEMENTE_INICIAL
        : Object.keys(campanhas)[0];
      const saved = localStorage.getItem('campanhaAtual');
      if (saved && campanhas[saved]) campanhaAtual = saved;
    }

    renderCampanhaTabs();
  } catch(e) {
    console.error('Erro campanhas:', e);
    campanhaAtual = '2024-vereador';
  }
}

function renderCampanhaTabs() {
  const select = document.getElementById('campanhaSelect');
  if (!select) return;

  select.innerHTML = Object.entries(campanhas).map(([id, camp]) =>
    `<option value="${a(id)}">${h(nomeCiclo(id, camp))}</option>`
  ).join('');
  select.value = campanhaAtual || '';

  const podeImportarBase = campanhaAtual && campanhaAtual !== CAMPANHA_SEMENTE_INICIAL;
  const btnImportarBase = document.getElementById('btnImportarBase');
  if (btnImportarBase) btnImportarBase.disabled = !podeImportarBase;

  // Atualiza select de origem no modal
  const sel = document.getElementById('mc-origem');
  if (sel) {
    sel.innerHTML = '<option value="">Ciclo zerado</option>' +
      `<option value="${CAMPANHA_SEMENTE_INICIAL}">Importar do ciclo base</option>`;
  }
}

async function trocarCampanha(id) {
  if (!campanhas[id]) return;
  campanhaAtual = id;
  localStorage.setItem('campanhaAtual', id);
  renderCampanhaTabs();
  mostrarLoading(true);

  // Recarrega dados do novo ciclo
  const zonas = ['norte', 'leste', 'sul', 'sudeste', 'rural'];
  try {
    const snaps = await Promise.all(
      zonas.map(z => colecao().where('_zona', '==', z).get())
    );
    zonas.forEach((zona, i) => {
      DB[zona] = snaps[i].docs.map(d => ({...d.data(), _fireId: d.id}));
      BAIRROS[zona] = [...new Set(DB[zona].map(d => d.bairro).filter(Boolean))].sort();
    });
  } catch(e) { console.error('Erro trocar campanha:', e); }

  mostrarLoading(false);
  atualizarNavCounts();
  aplicarFiltros();
  if (dashboardView) renderDashboard();
  toast(`📁 Ciclo: ${nomeCiclo(id, campanhas[id])}`);
}

async function renomearCampanhaAtual() {
  if (!campanhaAtual || !campanhas[campanhaAtual]) return;
  const atual = nomeCiclo(campanhaAtual, campanhas[campanhaAtual]);
  const novoNome = prompt('Novo nome do ciclo:', atual);
  if (novoNome === null) return;
  const nome = novoNome.trim();
  if (!nome) { toast('⚠️ Informe um nome para o ciclo', true); return; }

  try {
    await db.collection('campanhas').doc(campanhaAtual).set({
      nome,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
    campanhas[campanhaAtual].nome = nome;
    renderCampanhaTabs();
    toast('✅ Ciclo renomeado');
  } catch(e) {
    console.error('Erro renomear ciclo:', e);
    toast('❌ Erro ao renomear ciclo', true);
  }
}

async function copiarDadosEntreCampanhas(origem, destino, modo='estrutura') {
  if (!origem || !destino || origem === destino) return 0;
  const todos = await db.collection('campanhas').doc(origem).collection('liderancas').get();
  const registros = todos.docs.map(d => ({...d.data(), _sourceId: d.id}));
  const count = await copiarRegistrosParaCampanha(registros, destino, modo);
  await marcarCampanhaImportada(destino);
  return count;
}

async function copiarRegistrosParaCampanha(registros, destino, modo='estrutura') {
  for (let i = 0; i < registros.length; i += 400) {
    const batch = db.batch();
    registros.slice(i, i + 400).forEach(reg => {
      const data = {...reg};
      if (modo === 'estrutura') {
        data.votos = 0; data.v_entrada = 0;
        data.custo_jul = 0; data.custo_ago = 0;
        data.custo_set = 0; data.custo_out = 0;
        data.total = 0; data.status = 'pendente';
        data.reuniao_feita = 'nao'; data.reuniao_data = '';
      }
      delete data._fireId;
      delete data._sourceId;
      const ref = db.collection('campanhas').doc(destino).collection('liderancas').doc();
      batch.set(ref, data);
    });
    await batch.commit();
  }

  return registros.length;
}

async function marcarCampanhaImportada(destino) {
  await db.collection('campanhas').doc(destino).set({
    dadosIniciaisImportados: true,
    baseImportadaEm: new Date().toISOString()
  }, { merge: true });
  if (campanhas[destino]) campanhas[destino].dadosIniciaisImportados = true;
}

async function importarBaseParaCampanhaAtual() {
  abrirModalImportarBase();
}

function abrirModalCampanha() {
  document.getElementById('mc-nome').value = '';
  document.getElementById('mc-ano').value = new Date().getFullYear() + 2;
  document.getElementById('mc-candidato').value = '';
  document.getElementById('mc-origem').value = '';
  document.getElementById('mc-copiar').value = 'estrutura';
  document.getElementById('mc-migrar-opcoes').style.display = 'none';
  document.getElementById('modalCampanha').classList.add('open');
}

function fecharModalCampanha() {
  document.getElementById('modalCampanha').classList.remove('open');
}


async function criarCampanha() {
  const nome = document.getElementById('mc-nome').value.trim();
  const ano  = parseInt(document.getElementById('mc-ano').value) || new Date().getFullYear();
  const cargo = document.getElementById('mc-cargo').value;
  const origem = document.getElementById('mc-origem').value;
  const copiar = document.getElementById('mc-copiar').value;

  if (!nome) { toast('⚠️ Informe o nome do ciclo', true); return; }

  let id = nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (CICLOS_PADRAO_OCULTOS.has(id)) id = `${id}-novo`;
  if (campanhas[id]) {
    toast('⚠️ Já existe um ciclo com esse nome', true);
    return;
  }

  try {
    const candidato = document.getElementById('mc-candidato').value.trim();
    await db.collection('campanhas').doc(id).set({
      nome, ano, cargo, candidato, criadoEm: new Date().toISOString()
    });

    campanhas[id] = { nome, ano, cargo, candidato };

    // Copia dados do ciclo de origem se selecionado
    if (origem && campanhas[origem]) {
      toast('📋 Copiando estrutura…');
      const totalCopiado = await copiarDadosEntreCampanhas(origem, id, copiar);
      toast(`✅ ${totalCopiado} registros copiados de ${nomeCiclo(origem, campanhas[origem])}`);
    }

    fecharModalCampanha();
    renderCampanhaTabs();
    await trocarCampanha(id);
    toast(`✅ Ciclo "${nome}" criado!`);
  } catch(e) {
    console.error('Erro criar campanha:', e);
    toast('❌ Erro ao criar ciclo', true);
  }
}

// Adiciona pessoa em outro ciclo
function migrarPessoa(fireId, localId, zona) {
  const d = DB[zona].find(x => x.id === localId);
  if (!d) return;

  const outrasCamps = Object.keys(campanhas).filter(id => id !== campanhaAtual);
  if (!outrasCamps.length) {
    toast('⚠️ Crie outro ciclo primeiro', true);
    return;
  }

  abrirModalCampsSel(
    d,
    `📁 Adicionar "${d.nome.split(' ')[0]}" em outros ciclos`,
    'Selecione em quais ciclos esta pessoa vai participar:'
  );
}

// ===================== SELEÇÃO MÚLTIPLA DE CAMPANHAS =====================
let _mcsPessoa = null; // dados da pessoa a ser adicionada
let _mcsCallback = null; // callback após confirmação
let _mcsMode = 'ciclos';
let _mcsBaseRegistros = [];

function abrirModalCampsSel(pessoa, titulo, desc, callback) {
  _mcsMode = 'ciclos';
  _mcsPessoa = pessoa;
  _mcsCallback = callback;

  document.getElementById('mcs-titulo').textContent = titulo || '📅 Adicionar em outros ciclos';
  document.getElementById('mcs-desc').textContent = desc || 'Selecione em quais ciclos esta pessoa vai participar:';
  document.getElementById('mcs-search').style.display = 'none';
  document.getElementById('mcs-actions').classList.remove('on');

  // Lista todos os ciclos exceto o atual
  const outras = Object.entries(campanhas).filter(([id]) => id !== campanhaAtual);

  const lista = document.getElementById('mcs-lista');
  if (!outras.length) {
    lista.innerHTML = '<div style="font-size:.8rem;color:var(--muted);padding:8px">Nenhum outro ciclo disponível. Crie ciclos primeiro.</div>';
  } else {
    const cargoCores = CATEGORIA_CORES;
    lista.innerHTML = outras.map(([id, camp]) => {
      const cor = cargoCores[camp.cargo] || '#6b7294';
      return `<label class="camp-check-item">
        <input type="checkbox" value="${a(id)}">
        <span class="camp-check-nome">${h(nomeCiclo(id, camp))}${camp.candidato?' · '+h(camp.candidato.split(' ')[0]):''}</span>
        <span class="camp-check-cargo" style="color:${cor}">${h(camp.cargo && camp.cargo.startsWith('Categoria') ? camp.cargo : 'Ciclo')}</span>
      </label>`;
    }).join('');
  }

  document.getElementById('modalCampsSel').classList.add('open');
}

async function abrirModalImportarBase() {
  if (!campanhaAtual || campanhaAtual === CAMPANHA_SEMENTE_INICIAL) {
    toast('⚠️ Escolha um ciclo criado para importar a base', true);
    return;
  }

  _mcsMode = 'base';
  _mcsPessoa = null;
  _mcsCallback = null;
  _mcsBaseRegistros = [];

  document.getElementById('mcs-titulo').textContent = '📋 Importar do ciclo base';
  document.getElementById('mcs-desc').textContent = 'Selecione quem vai continuar neste novo ciclo. Apoios serão zerados.';
  const search = document.getElementById('mcs-search');
  search.style.display = '';
  search.value = '';
  document.getElementById('mcs-actions').classList.add('on');
  document.getElementById('mcs-lista').innerHTML = '<div style="font-size:.8rem;color:var(--muted);padding:8px">Carregando base…</div>';
  document.getElementById('modalCampsSel').classList.add('open');

  try {
    const snap = await db.collection('campanhas').doc(CAMPANHA_SEMENTE_INICIAL).collection('liderancas').get();
    _mcsBaseRegistros = snap.docs.map(d => ({...d.data(), _sourceId: d.id}));
    renderImportacaoBase();
  } catch(e) {
    console.error('Erro carregar base:', e);
    document.getElementById('mcs-lista').innerHTML = '<div style="font-size:.8rem;color:var(--muted);padding:8px">Erro ao carregar o ciclo base.</div>';
  }
}

function renderImportacaoBase() {
  const lista = document.getElementById('mcs-lista');
  const q = norm(document.getElementById('mcs-search').value);
  const filtrados = _mcsBaseRegistros.filter(d => {
    return !q || norm(`${d.nome || ''} ${d.bairro || ''} ${d.telefone || ''}`).includes(q);
  });

  if (!filtrados.length) {
    lista.innerHTML = '<div style="font-size:.8rem;color:var(--muted);padding:8px">Nenhum registro encontrado na base.</div>';
    return;
  }

  lista.innerHTML = filtrados.map(d => `
    <label class="camp-check-item">
      <input type="checkbox" value="${a(d._sourceId)}">
      <span class="camp-check-nome">${h(d.nome || 'Sem nome')}${d.bairro ? ` · ${h(d.bairro)}` : ''}</span>
      <span class="camp-check-cargo">${h(tipoLabel(d.tipo))}</span>
    </label>
  `).join('');
}

function fecharModalCampsSel() {
  document.getElementById('modalCampsSel').classList.remove('open');
  _mcsPessoa = null;
  _mcsCallback = null;
  _mcsMode = 'ciclos';
  _mcsBaseRegistros = [];
}

async function confirmarCampsSel() {
  const checkboxes = document.querySelectorAll('#mcs-lista input[type="checkbox"]:checked');
  const selecionados = Array.from(checkboxes).map(cb => cb.value);

  if (_mcsMode === 'base') {
    if (!selecionados.length) { toast('⚠️ Selecione pelo menos um registro', true); return; }
    const ids = new Set(selecionados);
    const registros = _mcsBaseRegistros.filter(d => ids.has(d._sourceId));
    fecharModalCampsSel();
    try {
      toast('📋 Importando selecionados…');
      await limparRegistrosCampanha(campanhaAtual);
      const count = await copiarRegistrosParaCampanha(registros, campanhaAtual, 'estrutura');
      await marcarCampanhaImportada(campanhaAtual);
      await trocarCampanha(campanhaAtual);
      toast(`✅ ${count} registros importados do ciclo base`);
    } catch(e) {
      console.error('Erro importar selecionados:', e);
      toast('❌ Erro ao importar selecionados', true);
    }
    return;
  }

  const campsSelecionadas = selecionados;
  fecharModalCampsSel();

  if (!campsSelecionadas.length || !_mcsPessoa) return;

  let count = 0;
  for (const campId of campsSelecionadas) {
    try {
      const docData = {..._mcsPessoa,
        status: 'pendente',
        votos: 0, custo_jul: 0, custo_ago: 0, custo_set: 0, custo_out: 0, total: 0,
        reuniao_feita: 'nao', reuniao_data: '',
        _campanha: campId
      };
      delete docData._fireId;
      await db.collection('campanhas').doc(campId).collection('liderancas').add(docData);
      count++;
    } catch(e) { console.error('Erro ao adicionar em ciclo:', campId, e); }
  }

  if (count > 0) toast(`✅ Adicionado(a) em ${count} ciclo${count>1?'s':''}!`);
  if (_mcsCallback) _mcsCallback();
}

// ===================== TOAST =====================
function toast(msg, err=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err?' err':'');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

// ===================== EVENTOS =====================
function on(id, eventName, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(eventName, handler);
}

function fecharSidebarMobile() {
  if (window.innerWidth > 768) return;
  document.querySelector('.sidebar')?.classList.remove('mob-open');
  document.getElementById('mobOverlay')?.classList.remove('active');
}

function bindStaticEvents() {
  on('search', 'input', () => { pg = 1; aplicarFiltros(); });
  on('filtro-tipo', 'change', () => { pg = 1; aplicarFiltros(); });
  on('filtro-bairro', 'change', () => { pg = 1; aplicarFiltros(); });
  on('filtro-coord', 'change', () => { pg = 1; aplicarFiltros(); });
  on('treeSearch', 'input', renderArvore);
  on('loginBtn', 'click', fazerLogin);
  on('mobOverlay', 'click', toggleSidebar);

  // Fechar todos os dropdowns e painéis ao clicar fora
  document.addEventListener('click', e => {
    // Menus details (Ferramentas, Filtros)
    document.querySelectorAll('.tools-menu[open], .filters-menu[open]').forEach(d => {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });

    // Drawer (painel lateral de detalhes)
    const drawer = document.getElementById('drawer');
    if (drawer?.classList.contains('open')) {
      // Fecha se clicou fora do drawer e não no botão que o abriu
      const dentroDrawer = drawer.contains(e.target);
      const abrindoDrawer = e.target.closest('[data-action="ver-drawer"]');
      const abrindoModal  = e.target.closest('[data-action="editar-registro"]') || e.target.closest('.overlay');
      if (!dentroDrawer && !abrindoDrawer && !abrindoModal) {
        fecharDrawer();
      }
    }
  }, true);
  on('mobMenuBtn', 'click', toggleSidebar);
  on('btnTheme', 'click', toggleTheme);
  on('btnDashboardToggle', 'click', toggleDashboardView);
  on('btnDashboardClose', 'click', closeDashboardView);
  on('btnTreeToggle', 'click', toggleTreeView);
  on('btnMapToggle', 'click', toggleMapView);
  on('btnLogout', 'click', fazerLogout);
  on('importFile', 'change', importarArquivo);
  on('btnExport', 'click', exportarDados);
  on('btnMigrarBairro', 'click', migrarPorBairro);
  on('btnNovoRegistro', 'click', () => abrirModal(null));
  on('btnNovaCampanha', 'click', abrirModalCampanha);
  on('btnRenomearCampanha', 'click', renomearCampanhaAtual);
  on('btnImportarBase', 'click', importarBaseParaCampanhaAtual);
  on('btnLimparFiltros', 'click', limpar);
  on('btnCancelarCampanha', 'click', fecharModalCampanha);
  on('btnCriarCampanha', 'click', criarCampanha);
  on('btnFecharDrawer', 'click', fecharDrawer);
  on('btnCancelarRegistro', 'click', () => fecharModal());
  on('btnSalvarRegistro', 'click', salvar);
  on('btnFecharCampsSel', 'click', fecharModalCampsSel);
  on('btnConfirmarCampsSel', 'click', confirmarCampsSel);
  on('mcs-search', 'input', renderImportacaoBase);
  on('btnMcsTodos', 'click', () => {
    document.querySelectorAll('#mcs-lista input[type="checkbox"]').forEach(input => {
      input.checked = true;
      input.closest('.camp-check-item')?.classList.add('selected');
    });
  });
  on('btnMcsLimpar', 'click', () => {
    document.querySelectorAll('#mcs-lista input[type="checkbox"]').forEach(input => {
      input.checked = false;
      input.closest('.camp-check-item')?.classList.remove('selected');
    });
  });
  on('f-tipo', 'change', atualizarCamposHierarquia);
  on('campanhaSelect', 'change', event => trocarCampanha(event.target.value));

  on('overlay', 'click', fecharModal);
  on('mc-origem', 'change', function () {
    document.getElementById('mc-migrar-opcoes').style.display = this.value ? 'block' : 'none';
  });

  document.querySelectorAll('[data-zone-nav]').forEach(el => {
    el.addEventListener('click', () => {
      trocarZona(el.dataset.zoneNav);
      fecharSidebarMobile();
    });
  });
  document.querySelectorAll('#multi-zona-panel input').forEach(cb => {
    cb.addEventListener('change', aplicarMultiZona);
  });
  document.querySelectorAll('th[data-c]').forEach(th => {
    th.addEventListener('click', () => sortBy(th.dataset.c));
  });

  const campsLista = document.getElementById('mcs-lista');
  if (campsLista) {
    campsLista.addEventListener('change', event => {
      const input = event.target.closest('input[type="checkbox"]');
      if (!input) return;
      input.closest('.camp-check-item')?.classList.toggle('selected', input.checked);
    });
  }

  document.addEventListener('click', handleActionClick);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      fecharModal();
      fecharDrawer();
      fecharModalCampanha();
      fecharModalCampsSel();
    }
    if (event.key === 'Enter' && !document.getElementById('loginScreen').classList.contains('hidden')) {
      fazerLogin();
    }
  });
}

function handleActionClick(event) {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  if (el instanceof HTMLButtonElement && el.disabled) return;

  const ds = el.dataset;
  const id = ds.id ? Number(ds.id) : null;

  switch (ds.action) {
    case 'toggle-multi-zona':
      toggleMultiZona();
      break;
    case 'trocar-zona':
      trocarZona(ds.zona);
      break;
    case 'ver-drawer':
      verDrawer(id, ds.zona);
      break;
    case 'editar-registro':
      abrirModal(id, ds.zona);
      if (ds.closeDrawer === 'true') fecharDrawer();
      break;
    case 'deletar-registro':
      deletar(id, ds.zona);
      break;
    case 'go-page':
      goPg(Number(ds.page));
      break;
    case 'switch-tab':
      switchTab(el, ds.tab);
      break;
    case 'migrar-pessoa':
      migrarPessoa(ds.fireId, id, ds.zona);
      break;
    case 'toggle-mini':
      toggleMiniModal(ds.target);
      break;
    case 'salvar-reuniao':
      salvarReuniao(ds.fireId, id, ds.zona);
      break;
    case 'salvar-pagamento':
      salvarPagamento(ds.fireId, id, ds.zona);
      break;
    case 'toggle-node':
      toggleNode(ds.nodeId);
      break;
    case 'trocar-campanha':
      trocarCampanha(ds.campanha);
      break;
    case 'limpar-campanha':
      limparCampanha(ds.campanha);
      break;
    case 'fechar-map-popup':
      fecharMapPopup();
      verDrawer(id, ds.zona);
      break;
    default:
      return;
  }

  event.preventDefault();
  event.stopPropagation();
}

document.addEventListener('DOMContentLoaded', bindStaticEvents);

// ===================== FIREBASE =====================


// Mostra indicador de sync
function setSyncStatus(msg, cor) {
  let el = document.getElementById('sync-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = cor || 'var(--muted)';
}

// ===================== AUTENTICAÇÃO =====================
const auth = firebase.auth();

// Observa estado de login
auth.onAuthStateChanged(async user => {
  if (user) {
    document.getElementById('loginScreen').classList.add('hidden');
    const initials = user.email.substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userEmail').textContent = user.email;
    setSyncStatus('🔄 Carregando dados…', '#60a5fa');
    try {
      const roleDoc = await db.collection('users').doc(user.uid).get();
      currentUserRole = roleDoc.exists ? roleDoc.data() : null;
    } catch(e) {
      currentUserRole = null;
    }
    init();
  } else {
    currentUserRole = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loading-overlay').style.display = 'none';
    setSyncStatus('🔒 Aguardando login', 'var(--muted)');
  }
});

async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');

  if (!email || !senha) {
    err.textContent = 'Preencha e-mail e senha.';
    err.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando…';
  err.classList.remove('show');

  try {
    await auth.signInWithEmailAndPassword(email, senha);
    // onAuthStateChanged cuida do resto
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Entrar';
    const msgs = {
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.'
    };
    err.textContent = msgs[e.code] || 'Erro ao fazer login. Tente novamente.';
    err.classList.add('show');
  }
}

async function fazerLogout() {
  if (!confirm('Deseja sair do sistema?')) return;
  await auth.signOut();
}


// ===================== TEMA =====================
function toggleTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  document.getElementById('btnTheme').textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Aplica tema salvo ao carregar
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('theme-light');
    // Botão será atualizado após DOM carregar
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('btnTheme');
      if (btn) btn.textContent = '🌙';
    });
  }
})();

// ===================== MULTI ZONA =====================
let multiZonaAtivo = false;

function toggleMultiZona() {
  const panel = document.getElementById('multi-zona-panel');
  const navItem = document.getElementById('nav-multi');
  multiZonaAtivo = !multiZonaAtivo;
  panel.style.display = multiZonaAtivo ? 'block' : 'none';
  navItem.classList.toggle('active', multiZonaAtivo);

  if (!multiZonaAtivo) {
    // Desmarca todos e volta para todas
    document.querySelectorAll('#multi-zona-panel input').forEach(cb => cb.checked = false);
    trocarZona('todas');
  }
}

function aplicarMultiZona() {
  const selecionadas = Array.from(
    document.querySelectorAll('#multi-zona-panel input:checked')
  ).map(cb => cb.value);

  if (selecionadas.length === 0) {
    trocarZona('todas');
    return;
  }

  if (selecionadas.length === 1) {
    trocarZona(selecionadas[0]);
    return;
  }

  // Múltiplas zonas selecionadas
  zonaAtual = 'multi';
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('nav-multi').classList.add('active');

  // Atualiza título
  const nomes = selecionadas.map(z => ZONAS_CFG[z]?.label.replace('Região ','') || z);
  document.getElementById('zTitle').textContent = nomes.join(' + ');
  document.getElementById('zBadge').style.background = '#3b82f6';

  pg = 1;
  aplicarFiltros();
  if (window.innerWidth <= 768) {
    document.querySelector('.sidebar').classList.remove('mob-open');
    document.getElementById('mobOverlay').classList.remove('active');
  }
}

// ===================== MOBILE SIDEBAR =====================
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobOverlay');
  sidebar.classList.toggle('mob-open');
  overlay.classList.toggle('active');
}

// ===================== START =====================
// init() é chamado pelo onAuthStateChanged após login.

// ===================== MAPA =====================
let mapView = false;
let leafletMap = null;
let markers = [];
let geocodeCache = {};  // endereço -> {lat, lng} | null

const TIPO_COLORS = { CA: '#fb923c', L: '#3b82f6', M: '#22c55e', LE: '#a855f7', ME: '#eab308' };

function toggleMapView() {
  // Fecha árvore se estiver aberta
  if (treeView) {
    treeView = false;
    document.getElementById('btnTreeToggle').classList.remove('active');
    document.getElementById('btnTreeToggle').textContent = '🌳 Árvore';
    document.getElementById('treeArea').classList.remove('active');
    document.querySelector('.table-area').classList.remove('hidden');
    document.getElementById('pag').style.display = '';
    document.querySelector('.controls-bar').style.display = '';
  }
  closeDashboardView();
  mapView = !mapView;
  const btn = document.getElementById('btnMapToggle');
  const tableArea = document.querySelector('.table-area');
  const pag = document.getElementById('pag');
  const mapArea = document.getElementById('mapArea');

  if (mapView) {
    btn.classList.add('active');
    btn.textContent = '📋 Tabela';
    tableArea.classList.add('hidden');
    pag.style.display = 'none';
    mapArea.classList.add('active');
    document.body.classList.add('map-fullscreen');
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
      iniciarMapa();
    }, 100);
  } else {
    btn.classList.remove('active');
    btn.textContent = '🗺️ Mapa';
    tableArea.classList.remove('hidden');
    pag.style.display = '';
    mapArea.classList.remove('active');
    document.body.classList.remove('map-fullscreen');
  }
}

// ===================== FINANCEIRO =====================
async function getCurrentUserRole() {
  const u = firebase.auth().currentUser;
  if (!u) return null;
  try {
    const doc = await db.collection('users').doc(u.uid).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error('Erro ao buscar user role', e);
    return null;
  }
}

function openFinanceiro() {
  document.getElementById('financeiroMsg').textContent = '';
  document.getElementById('financeiroArea').style.display = 'block';
  loadFinanceiro();
}

function closeFinanceiro() {
  document.getElementById('financeiroArea').style.display = 'none';
}

function calcFinTotal() {
  const vals = ['fin-jul','fin-ago','fin-set','fin-out'].map(id=>parseInt(document.getElementById(id).value||0,10));
  const total = vals.reduce((s,v)=>s+(isNaN(v)?0:v),0);
  document.getElementById('fin-total').value = total;
  return total;
}

async function loadFinanceiro() {
  const role = await getCurrentUserRole();
  if (!role) { document.getElementById('financeiroMsg').textContent = 'Permissão negada'; return; }
  const region = role.region || 'todas';
  const ciclo = campanhaAtual || '2024';
  document.getElementById('fin-ciclo').textContent = ciclo;
  document.getElementById('fin-regiao').textContent = region;

  // read finanças doc
  const id = `${ciclo}_${region}`;
  const doc = await db.collection('financas').doc(id).get();
  const data = doc.exists ? doc.data() : { julho:0, agosto:0, setembro:0, outubro:0, total:0 };
  document.getElementById('fin-jul').value = data.julho || 0;
  document.getElementById('fin-ago').value = data.agosto || 0;
  document.getElementById('fin-set').value = data.setembro || 0;
  document.getElementById('fin-out').value = data.outubro || 0;
  document.getElementById('fin-total').value = data.total || 0;
}

async function saveFinanceiro() {
  const role = await getCurrentUserRole();
  if (!role) { document.getElementById('financeiroMsg').textContent = 'Permissão negada'; return; }
  const region = role.region || 'todas';
  const ciclo = campanhaAtual || '2024';
  const id = `${ciclo}_${region}`;
  const data = {
    region,
    ciclo,
    julho: parseInt(document.getElementById('fin-jul').value||0,10),
    agosto: parseInt(document.getElementById('fin-ago').value||0,10),
    setembro: parseInt(document.getElementById('fin-set').value||0,10),
    outubro: parseInt(document.getElementById('fin-out').value||0,10),
    total: calcFinTotal(),
    updatedBy: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('financas').doc(id).set(data, { merge: true });
    document.getElementById('financeiroMsg').textContent = 'Salvo com sucesso.';
    // update tools value
    document.getElementById('toolsResourceValue').textContent = 'R$ ' + data.total.toLocaleString('pt-BR');
  } catch(e) {
    console.error(e);
    document.getElementById('financeiroMsg').textContent = 'Erro ao salvar.';
  }
}

// bind finance buttons
document.addEventListener('DOMContentLoaded', ()=>{
  const bf = document.getElementById('btnFinanceiro');
  if (bf) bf.addEventListener('click', openFinanceiro);
  const bc = document.getElementById('btnCloseFinance');
  if (bc) bc.addEventListener('click', closeFinanceiro);
  const bs = document.getElementById('btnSaveFinance');
  if (bs) bs.addEventListener('click', saveFinanceiro);
  ['fin-jul','fin-ago','fin-set','fin-out'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcFinTotal);
  });
});

function iniciarMapa() {
  if (!leafletMap) {
    leafletMap = L.map('map', { zoomControl: true }).setView([-5.0892, -42.8019], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(leafletMap);
  }
  renderMapa();
}

function criarIcone(tipo) {
  const cor = TIPO_COLORS[tipo] || '#888';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${cor}" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="5" fill="rgba(255,255,255,.9)"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    className: ''
  });
}

function popupHTML(d, zona) {
  const cfg = ZONAS_CFG[zona] || {};
  const wa = d.telefone ? d.telefone.replace(/\D/g,'') : '';
  const waLink = wa.length >= 8
    ? `<a href="https://wa.me/55${wa}" target="_blank" style="color:#25d366">${h(d.telefone)}</a>`
    : h(d.telefone || '—');
  return `
    <div style="min-width:200px">
      <div class="popup-nome">${h(d.nome)}</div>
      <div class="popup-row"><span class="popup-lbl">Tipo</span><span class="popup-val"><span class="badge badge-${a(d.tipo)}">${h(tipoLabel(d.tipo))}</span></span></div>
      ${cfg.label ? `<div class="popup-row"><span class="popup-lbl">Zona</span><span class="popup-val" style="color:${cfg.cor}">${cfg.label}</span></div>` : ''}
      <div class="popup-row"><span class="popup-lbl">Bairro</span><span class="popup-val">${h(d.bairro || '—')}</span></div>
      <div class="popup-row"><span class="popup-lbl">📞</span><span class="popup-val">${waLink}</span></div>
      <div class="popup-row"><span class="popup-lbl">Apoios</span><span class="popup-val" style="color:var(--accent,#e8433a);font-weight:700">${d.votos||'—'}</span></div>
      ${d.colegio ? `<div class="popup-row"><span class="popup-lbl">Colégio</span><span class="popup-val" style="font-size:.7rem">${h(d.colegio)}</span></div>` : ''}
      ${d.secao ? `<div class="popup-row"><span class="popup-lbl">Seção</span><span class="popup-val">${h(d.secao)}</span></div>` : ''}
      <div style="margin-top:8px">
        <button data-action="fechar-map-popup" data-id="${a(d.id)}" data-zona="${a(zona)}" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);cursor:pointer;padding:6px;font-size:.75rem;font-family:DM Sans,sans-serif">
          Ver detalhes →
        </button>
      </div>
    </div>`;
}

function fecharMapPopup() {
  if (leafletMap) leafletMap.closePopup();
}

async function geocodificar(endereco, bairro, tentativa) {
  const chave = endereco || bairro;
  if (!chave) return null;
  if (geocodeCache[chave] !== undefined) return geocodeCache[chave];

  // Monta query progressivamente
  const queries = [];
  if (endereco && endereco.length > 5) {
    queries.push(endereco + ', Teresina, Piauí, Brasil');
  }
  if (bairro) {
    queries.push(bairro + ', Teresina, Piauí, Brasil');
    queries.push('Bairro ' + bairro + ', Teresina, Piauí');
  }

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;
      const r = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      const data = await r.json();
      if (data && data[0]) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache[chave] = result;
        return result;
      }
    } catch(e) {}
    // Respeita rate limit do Nominatim
    await new Promise(res => setTimeout(res, 1100));
  }

  geocodeCache[chave] = null;
  return null;
}

async function renderMapa() {
  // Limpa marcadores antigos
  markers.forEach(m => leafletMap.removeLayer(m));
  markers = [];

  const dados = getDados();
  const comEndereco = dados.filter(d => d.endereco || d.bairro);

  const infoBar = document.getElementById('mapInfoBar');
  const gc = document.getElementById('gcProgress');
  const gcSub = document.getElementById('gcSub');

  if (!comEndereco.length) {
    infoBar.innerHTML = '⚠️ Nenhum registro com endereço ou bairro para mapear';
    return;
  }

  // Mostra spinner
  gc.classList.add('active');
  infoBar.innerHTML = 'Geocodificando endereços…';

  let ok = 0, fail = 0;
  const bounds = [];

  for (let i = 0; i < comEndereco.length; i++) {
    const d = comEndereco[i];
    gcSub.textContent = `${i+1} / ${comEndereco.length}`;

    // Pequena variação aleatória para não sobrepor pins do mesmo bairro
    const jitter = () => (Math.random() - 0.5) * 0.003;

    let coord = await geocodificar(d.endereco, d.bairro, i);

    if (coord) {
      const lat = coord.lat + jitter();
      const lng = coord.lng + jitter();
      const marker = L.marker([lat, lng], { icon: criarIcone(d.tipo) })
        .bindPopup(popupHTML(d, d._zona), { maxWidth: 280 })
        .addTo(leafletMap);
      markers.push(marker);
      bounds.push([lat, lng]);
      ok++;
    } else {
      fail++;
    }

    // Atualiza info bar
    infoBar.innerHTML = `<strong>${ok}</strong> no mapa · <strong>${fail}</strong> sem coordenada · processando ${i+1}/${comEndereco.length}`;

    // Pausa entre requests para respeitar Nominatim (1 req/seg)
    if (i < comEndereco.length - 1) {
      await new Promise(res => setTimeout(res, 1100));
    }
  }

  gc.classList.remove('active');

  if (bounds.length) {
    leafletMap.fitBounds(bounds, { padding: [40, 40] });
    infoBar.innerHTML = `✅ <strong>${ok}</strong> referências no mapa · ${fail ? `<span style="color:var(--z-norte)">${fail} sem endereço encontrado</span>` : ''}`;
  } else {
    infoBar.innerHTML = '⚠️ Nenhum endereço pôde ser localizado. Verifique os endereços cadastrados.';
  }

  setTimeout(() => leafletMap.invalidateSize(), 200);
}

// ===================== GERENCIAR USUÁRIOS (ADMIN) =====================

function abrirGerenciarUsuarios() {
  document.getElementById('overlayUsuarios').style.display = 'flex';
  document.getElementById('nu-msg').textContent = '';
  document.getElementById('nu-nome').value = '';
  document.getElementById('nu-email').value = '';
  document.getElementById('nu-senha').value = '';
  document.getElementById('nu-role').value = 'regional';
  document.getElementById('nu-region').value = 'norte';
  document.getElementById('nu-zona').value = '';
  document.getElementById('nu-region-group').style.display = '';
  carregarListaUsuarios();
  verificarRegistrosSemCoord();
}

function fecharGerenciarUsuarios() {
  document.getElementById('overlayUsuarios').style.display = 'none';
}

async function carregarListaUsuarios() {
  const lista = document.getElementById('nu-lista');
  lista.innerHTML = '<div style="color:var(--muted);font-size:.84rem;padding:8px 0">Carregando…</div>';
  try {
    const snap = await db.collection('users').get();
    if (snap.empty) {
      lista.innerHTML = '<div style="color:var(--muted);font-size:.84rem;padding:8px 0">Nenhum usuário cadastrado.</div>';
      return;
    }
    const REGION_LABELS = { norte: 'Norte', sul: 'Sul', leste: 'Leste', sudeste: 'Sudeste', rural: 'Rural' };
    let html = '';
    snap.forEach(doc => {
      const d = doc.data();
      const isAdmin = d.role === 'admin';
      const badgeClass = isAdmin ? 'nu-badge-admin' : 'nu-badge-regional';
      const badgeLabel = isAdmin ? 'Admin' : 'Coordenador';
      const regiao = d.region ? (REGION_LABELS[d.region] || d.region) + (d.zona ? ' · Zona ' + d.zona : '') : '';
      const dataStr = encodeURIComponent(JSON.stringify({ name: d.name||'', role: d.role||'regional', region: d.region||'norte', zona: d.zona||'', email: d.email||'' }));
      html += `<div class="nu-user-row">
        <div>
          <div class="nu-user-name">${h(d.name || '—')}</div>
          <div class="nu-user-sub">${h(d.email || '—')}</div>
        </div>
        <div>
          <span class="nu-badge-role ${badgeClass}">${badgeLabel}</span>
          ${regiao ? `<div class="nu-user-sub" style="margin-top:4px">${h(regiao)}</div>` : ''}
        </div>
        <button class="btn btn-outline" style="font-size:.78rem;padding:6px 12px" onclick="editarUsuario('${a(doc.id)}', decodeURIComponent('${dataStr}'))">✏️ Editar</button>
      </div>`;
    });
    lista.innerHTML = html;
  } catch(e) {
    lista.innerHTML = '<div style="color:var(--danger);font-size:.84rem">Erro ao carregar usuários.</div>';
  }
}

function editarUsuario(uid, dataStr) {
  const d = JSON.parse(dataStr);
  const lista = document.getElementById('nu-lista');
  const regionOptions = ['norte','sul','leste','sudeste','rural']
    .map(r => `<option value="${r}" ${d.region===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`)
    .join('');
  lista.innerHTML = `
    <div class="nu-edit-panel">
      <h4>Editando: ${h(d.email)}</h4>
      <div class="fg"><label>Nome</label><input type="text" id="edit-nome" value="${a(d.name)}"></div>
      <div class="fg">
        <label>Função</label>
        <select id="edit-role" onchange="document.getElementById('edit-region-group').style.display=this.value==='regional'?'':'none'">
          <option value="regional" ${d.role==='regional'?'selected':''}>Coordenador Regional</option>
          <option value="admin" ${d.role==='admin'?'selected':''}>Administrador</option>
        </select>
      </div>
      <div id="edit-region-group" style="display:${d.role==='regional'?'':'none'}">
        <div class="fg"><label>Região</label><select id="edit-region">${regionOptions}</select></div>
        <div class="fg"><label>Zona</label><input type="text" id="edit-zona" value="${a(d.zona)}" placeholder="Ex: 01, 02..."></div>
      </div>
      <div id="edit-msg" style="color:var(--danger);font-size:.82rem;margin-top:4px"></div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-outline" style="flex:1" onclick="carregarListaUsuarios()">Cancelar</button>
        <button class="btn btn-primary" style="flex:1" onclick="salvarEdicaoUsuario('${a(uid)}')">Salvar</button>
      </div>
    </div>`;
}

async function salvarEdicaoUsuario(uid) {
  const nome = document.getElementById('edit-nome').value.trim();
  const role = document.getElementById('edit-role').value;
  const region = role === 'regional' ? document.getElementById('edit-region').value : null;
  const zona = role === 'regional' ? document.getElementById('edit-zona').value.trim() : null;
  const msg = document.getElementById('edit-msg');
  const btn = event.target;

  if (!nome) { msg.textContent = 'Nome é obrigatório.'; return; }
  btn.disabled = true; btn.textContent = 'Salvando…';

  try {
    const docData = { name: nome, role };
    if (region) { docData.region = region; } else { docData.region = firebase.firestore.FieldValue.delete(); }
    if (zona) { docData.zona = zona; } else { docData.zona = firebase.firestore.FieldValue.delete(); }
    await db.collection('users').doc(uid).update(docData);
    toast('✅ Usuário atualizado!');
    carregarListaUsuarios();
  } catch(e) {
    msg.textContent = 'Erro ao salvar: ' + e.message;
    btn.disabled = false; btn.textContent = 'Salvar';
  }
}

async function criarNovoUsuario() {
  const nome = document.getElementById('nu-nome').value.trim();
  const email = document.getElementById('nu-email').value.trim();
  const senha = document.getElementById('nu-senha').value;
  const role = document.getElementById('nu-role').value;
  const region = role === 'regional' ? document.getElementById('nu-region').value : null;
  const zona = role === 'regional' ? document.getElementById('nu-zona').value.trim() : null;
  const msg = document.getElementById('nu-msg');
  const btn = document.getElementById('btnCriarUsuario');

  if (!nome || !email || !senha) {
    msg.textContent = 'Preencha nome, e-mail e senha.';
    return;
  }
  if (senha.length < 6) {
    msg.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Criando…';
  msg.textContent = '';

  try {
    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, senha);
    const uid = cred.user.uid;
    await secondaryAuth.signOut();

    const docData = { email, name: nome, role };
    if (region) docData.region = region;
    if (zona) docData.zona = zona;
    await db.collection('users').doc(uid).set(docData);

    // Auto-cria registro CA na liderança quando for coordenador regional
    if (role === 'regional' && region) {
      try {
        const snapZona = await colecao().where('_zona', '==', region).get();
        const maxId = Math.max(...snapZona.docs.map(d => +(d.data().id) || 0), 0);
        const novoId = String(maxId + 1).padStart(3, '0');
        const primeiroNome = nome.split(' ')[0];
        await colecao().add({
          id: novoId,
          nome: nome.toUpperCase(),
          tipo: 'CA',
          _zona: region,
          _criadoPor: uid,
          _coordZona: zona || '',
          _coordNome: primeiroNome,
          status: 'ativo',
          bairro: '',
          telefone: '',
          votos: 0, custo_jul: 0, custo_ago: 0, custo_set: 0, custo_out: 0, total: 0,
          reuniao: false
        });
      } catch(eCA) {
        console.warn('Não foi possível criar registro CA automaticamente:', eCA.message);
      }
    }

    msg.style.color = 'var(--success, #22c55e)';
    msg.textContent = `✅ Conta criada${role === 'regional' ? ' e registro CA adicionado na liderança' : ''} — ${email}`;
    document.getElementById('nu-nome').value = '';
    document.getElementById('nu-email').value = '';
    document.getElementById('nu-senha').value = '';
    carregarListaUsuarios();
    if (isAdminUser()) await renderNavCoord();
  } catch(e) {
    const erros = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres).',
    };
    msg.style.color = 'var(--danger)';
    msg.textContent = erros[e.code] || 'Erro ao criar conta: ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar conta';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const roleSelect = document.getElementById('nu-role');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      document.getElementById('nu-region-group').style.display =
        roleSelect.value === 'regional' ? '' : 'none';
    });
  }
  const btnGerenciar = document.getElementById('btnGerenciarUsuarios');
  if (btnGerenciar) btnGerenciar.addEventListener('click', abrirGerenciarUsuarios);
  const btnFecharU = document.getElementById('btnFecharUsuarios');
  if (btnFecharU) btnFecharU.addEventListener('click', fecharGerenciarUsuarios);
  const btnCriarU = document.getElementById('btnCriarUsuario');
  if (btnCriarU) btnCriarU.addEventListener('click', criarNovoUsuario);
  // Fechar ao clicar no overlay
  const overlayU = document.getElementById('overlayUsuarios');
  if (overlayU) overlayU.addEventListener('click', e => { if (e.target === overlayU) fecharGerenciarUsuarios(); });
});

// ===================== MIGRAÇÃO DE REGISTROS =====================

async function sincronizarCAsCoord() {
  const msgEl = document.getElementById('nu-sync-msg');
  msgEl.style.color = 'var(--muted)';
  msgEl.textContent = 'Verificando coordenadores…';

  try {
    const usersSnap = await db.collection('users').get();
    const coords = [];
    usersSnap.forEach(doc => {
      const d = doc.data();
      if (d.region) coords.push({ uid: doc.id, ...d });
    });

    if (!coords.length) { msgEl.textContent = 'Nenhum coordenador com região encontrado.'; return; }

    let criados = 0;
    let jaExistem = 0;

    // Carrega todos os CAs existentes de uma vez (evita múltiplas queries)
    const todosCASnap = await colecao().where('tipo', '==', 'CA').get();
    const todosCA = todosCASnap.docs.map(d => d.data());

    for (const coord of coords) {
      const primeiroNomeUpper = (coord.name || '').toUpperCase().split(' ')[0];

      // Considera que já tem CA se: mesmo _criadoPor OU mesmo nome na mesma zona
      const jaTemCA = todosCA.some(ca =>
        ca._criadoPor === coord.uid ||
        (ca._zona === coord.region && primeiroNomeUpper && ca.nome && ca.nome.includes(primeiroNomeUpper))
      );

      if (jaTemCA) { jaExistem++; continue; }

      // ID único baseado na região+zona para evitar conflito com sequencial
      const coordId = `CA-${coord.region}-${coord.zona || '00'}`;
      const primeiroNome = (coord.name || '').split(' ')[0];
      const nomeCompleto = (coord.name || coord.email || 'COORDENADOR').toUpperCase();

      await colecao().add({
        id: coordId,
        nome: nomeCompleto,
        tipo: 'CA',
        _zona: coord.region,
        _criadoPor: coord.uid,
        _coordZona: coord.zona || '',
        _coordNome: primeiroNome,
        status: 'ativo',
        bairro: '',
        telefone: '',
        votos: 0, custo_jul: 0, custo_ago: 0, custo_set: 0, custo_out: 0, total: 0,
        reuniao: false
      });
      criados++;
    }

    msgEl.style.color = '#4ade80';
    msgEl.textContent = `✅ ${criados} CA(s) criado(s). ${jaExistem} já existia(m).`;
    toast(`✅ Sincronização concluída — ${criados} CA(s) criado(s)`);
    await carregarDoFirebase();

  } catch(e) {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = 'Erro: ' + e.message;
  }
}

async function verificarRegistrosSemCoord() {
  const infoEl  = document.getElementById('nu-migrate-info');
  const selCoord = document.getElementById('nu-migrate-coord');
  if (!infoEl || !selCoord) return;

  infoEl.textContent = 'Verificando registros...';
  try {
    // Conta registros sem _criadoPor em todas as zonas
    const snaps = await Promise.all(
      ['norte','leste','sul','sudeste','rural'].map(z =>
        colecao().where('_zona', '==', z).get()
      )
    );
    const semCoord = snaps.flatMap(s => s.docs).filter(d => !d.data()._criadoPor);
    const total = semCoord.length;

    if (total === 0) {
      infoEl.innerHTML = '<span style="color:#4ade80">✓ Todos os registros já têm coordenador atribuído.</span>';
    } else {
      infoEl.innerHTML = `<span style="color:#fbbf24">⚠️ <strong>${total}</strong> registro(s) sem coordenador — selecione para quem atribuir:</span>`;
    }

    // Popula dropdown com coordenadores
    const usersSnap = await db.collection('users').get();
    const coords = [];
    usersSnap.forEach(doc => {
      const d = doc.data();
      if (!d.region) return;
      const label = (REGION_CAP[d.region] || d.region) + (d.zona ? ' ' + d.zona : '') + (d.name ? ' — ' + d.name : '');
      coords.push({ uid: doc.id, label, region: d.region, zona: d.zona||'', name: d.name||'' });
    });
    coords.sort((a,b) => a.label.localeCompare(b.label, 'pt-BR'));
    selCoord.innerHTML = '<option value="">— selecione um coordenador —</option>' +
      coords.map(c => `<option value="${a(c.uid)}" data-region="${a(c.region)}" data-zona="${a(c.zona)}" data-name="${a(c.name)}">${h(c.label)}</option>`).join('');

  } catch(e) {
    infoEl.textContent = 'Erro ao verificar: ' + e.message;
  }
}

async function executarMigracaoDados() {
  const selCoord  = document.getElementById('nu-migrate-coord');
  const moverZona = document.getElementById('nu-migrate-zona').checked;
  const msgEl     = document.getElementById('nu-migrate-msg');
  msgEl.textContent = '';

  const uid = selCoord.value;
  if (!uid) { msgEl.textContent = 'Selecione um coordenador.'; return; }

  const opt = selCoord.options[selCoord.selectedIndex];
  const coordRegion = opt.getAttribute('data-region');
  const coordZona   = opt.getAttribute('data-zona');
  const coordName   = opt.getAttribute('data-name');

  if (!confirm(`Atribuir todos os registros SEM coordenador para ${opt.text}?\n${moverZona ? 'Os registros também serão movidos para a zona ' + coordRegion.toUpperCase() + '.' : ''}\n\nEsta ação não pode ser desfeita.`)) return;

  msgEl.textContent = 'Migrando...';
  try {
    // Busca todos os registros sem _criadoPor
    const snaps = await Promise.all(
      ['norte','leste','sul','sudeste','rural'].map(z =>
        colecao().where('_zona', '==', z).get()
      )
    );
    const semCoord = snaps.flatMap(s => s.docs).filter(d => !d.data()._criadoPor);

    if (semCoord.length === 0) {
      msgEl.style.color = '#4ade80';
      msgEl.textContent = 'Nenhum registro sem coordenador encontrado.';
      return;
    }

    // Batch update (limite 499 por batch)
    let migrados = 0;
    for (let i = 0; i < semCoord.length; i += 499) {
      const batch = db.batch();
      semCoord.slice(i, i + 499).forEach(doc => {
        const update = {
          _criadoPor: uid,
          _coordZona: coordZona,
          _coordNome: coordName
        };
        if (moverZona && coordRegion) update._zona = coordRegion;
        batch.update(doc.ref, update);
      });
      await batch.commit();
      migrados += Math.min(499, semCoord.length - i);
    }

    msgEl.style.color = '#4ade80';
    msgEl.textContent = `✅ ${migrados} registro(s) migrados com sucesso!`;
    toast(`✅ ${migrados} registros atribuídos a ${coordName || opt.text}`);

    // Recarrega dados
    await carregarDoFirebase();
    verificarRegistrosSemCoord();

  } catch(e) {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = 'Erro: ' + e.message;
  }
}
