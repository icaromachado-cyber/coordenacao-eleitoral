// ===================== ORGANOGRAMA =====================
// Vista alternativa à Árvore: mesmo dado (CA -> Liderança -> Mobilizador), mas em formato
// de organograma clássico (caixas conectadas por linhas), navegando um coordenador por vez.

let orgView = false;
let orgCaSelecionada = null; // chave (_fireId ou id) do CA em foco
let orgExpandidos = new Set(); // chaves de lideranças com o "galho" de mobilizadores aberto

// ===================== abrir/fechar a vista =====================
function toggleOrganogramaView() {
  try { _toggleOrganogramaViewInner(); }
  catch (err) { console.error('[Organograma]', err); if (typeof toast === 'function') toast('Erro no Organograma: ' + err.message, 'erro'); }
}

function _toggleOrganogramaViewInner() {
  if (typeof bairrosView !== 'undefined' && bairrosView) toggleBairrosView();
  if (typeof treeView !== 'undefined' && treeView) toggleTreeView();
  if (typeof _fecharRelatorio === 'function') _fecharRelatorio();
  if (typeof closeDashboardView === 'function') closeDashboardView();

  orgView = !orgView;
  const btn = document.getElementById('btnOrganogramaToggle');
  const tableArea = document.querySelector('.table-area');
  const pag = document.getElementById('pag');
  const ctrlBar = document.querySelector('.controls-bar');
  const orgArea = document.getElementById('orgArea');

  if (orgView) {
    btn.classList.add('active');
    btn.textContent = '📋 Tabela';
    tableArea.classList.add('hidden');
    pag.style.display = 'none';
    ctrlBar.style.display = 'none';
    orgArea.classList.add('active');
    renderOrganograma();
  } else {
    btn.classList.remove('active');
    btn.textContent = '🏢';
    tableArea.classList.remove('hidden');
    pag.style.display = '';
    ctrlBar.style.display = '';
    orgArea.classList.remove('active');
    if (typeof reopenDashboardView === 'function') reopenDashboardView();
  }
}

// ===================== dados: mesma regra de vínculo da Árvore =====================
function orgMontarHierarquia() {
  const dados = getDados();
  let coords = dados.filter(d => d.tipo === 'CA');
  const liderancas = dados.filter(d => d.tipo === 'L' || d.tipo === 'LE');
  const mobilizadores = dados.filter(d => d.tipo === 'M' || d.tipo === 'ME');

  if (coords.length === 0) {
    const coordIds = [...new Set(liderancas.map(l => l.coord_area_id).filter(Boolean))];
    coords = coordIds.map(id => {
      const found = dados.find(d => d._fireId === id || String(d.id) === id);
      if (found) return found;
      const nome = liderancas.find(l => l.coord_area_id === id)?.coord_area_nome || 'Coordenador';
      return { id, _fireId: id, tipo: 'CA', nome, _virtual: true };
    }).filter(Boolean);
  }

  coords.sort((a, b) => (a._coordZona || '').localeCompare(b._coordZona || ''));

  const caLidsMap = new Map();
  const assignedIds = new Set();

  coords.forEach(ca => {
    const caKey = ca._fireId || String(ca.id);
    const matched = liderancas.filter(l =>
      l.coord_area_id && (l.coord_area_id === ca._fireId || l.coord_area_id === String(ca.id))
    );
    matched.forEach(l => assignedIds.add(l._fireId || String(l.id)));
    caLidsMap.set(caKey, matched.slice());
  });

  const primeiroCAPorZona = {};
  coords.forEach(ca => { if (!primeiroCAPorZona[ca._zona]) primeiroCAPorZona[ca._zona] = ca; });

  liderancas.forEach(l => {
    const lKey = l._fireId || String(l.id);
    if (assignedIds.has(lKey)) return;
    const ca = primeiroCAPorZona[l._zona];
    if (!ca) return;
    const caKey = ca._fireId || String(ca.id);
    if (!caLidsMap.has(caKey)) caLidsMap.set(caKey, []);
    caLidsMap.get(caKey).push(l);
    assignedIds.add(lKey);
  });

  return { coords, liderancas, mobilizadores, caLidsMap };
}

function orgMobsDaLideranca(l, mobilizadores) {
  const lKey = l._fireId || String(l.id);
  return mobilizadores.filter(m => m.lider_id === lKey);
}

// ===================== render =====================
function renderOrganograma() {
  const { coords, mobilizadores, caLidsMap } = orgMontarHierarquia();

  // tira dos expandidos quem não existe mais nessa carga
  const stripEl = document.getElementById('orgCaStrip');
  const canvasEl = document.getElementById('orgCanvas');
  if (!stripEl || !canvasEl) return;

  if (coords.length === 0) {
    stripEl.innerHTML = '';
    canvasEl.innerHTML = `<div class="org-empty">🏛️ Nenhum coordenador cadastrado ainda.<br>Vincule referências a um coordenador de área para ver o organograma.</div>`;
    return;
  }

  if (!orgCaSelecionada || !coords.some(ca => (ca._fireId || String(ca.id)) === orgCaSelecionada)) {
    orgCaSelecionada = coords.length === 1 ? (coords[0]._fireId || String(coords[0].id)) : null;
  }

  stripEl.innerHTML = coords.map(ca => {
    const key = ca._fireId || String(ca.id);
    const lidsCA = caLidsMap.get(key) || [];
    const ativo = key === orgCaSelecionada;
    return `<div class="org-ca-pill${ativo ? ' active' : ''}" data-ca-key="${a(key)}">
      <strong>${h(ca.nome || '')}</strong><span class="n">${lidsCA.length} ref.</span>
    </div>`;
  }).join('');

  stripEl.querySelectorAll('.org-ca-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      orgCaSelecionada = pill.dataset.caKey;
      renderOrganograma();
    });
  });

  const ca = coords.find(c => (c._fireId || String(c.id)) === orgCaSelecionada);
  if (!ca) {
    canvasEl.innerHTML = `<div class="org-empty">👆 Selecione um coordenador acima para ver o organograma dele.</div>`;
    return;
  }

  const caKey = ca._fireId || String(ca.id);
  const lidsCA = caLidsMap.get(caKey) || [];
  const totalMobsCA = lidsCA.reduce((s, l) => s + orgMobsDaLideranca(l, mobilizadores).length, 0);
  const totalApoiosCA = [...lidsCA, ...lidsCA.flatMap(l => orgMobsDaLideranca(l, mobilizadores))]
    .reduce((s, d) => s + (d.votos || 0), 0);

  let html = `<ul class="org-tree"><li>
    <div class="org-node org-node-ca">
      <div class="org-node-nome">🏛️ ${h(ca.nome || '')}</div>
      <div class="org-node-sub">${h(ca.bairro || '')}${ca.telefone ? ' · ' + h(ca.telefone) : ''}</div>
      <div class="org-node-counts">
        <span class="org-node-pill">👥 ${lidsCA.length} ref.</span>
        <span class="org-node-pill">🗳️ ${totalMobsCA} eq.</span>
        <span class="org-node-pill">✅ ${totalApoiosCA} apoios</span>
      </div>
    </div>`;

  if (lidsCA.length > 0) {
    html += '<ul>';
    lidsCA.forEach(l => {
      const lKey = l._fireId || String(l.id);
      const mobsL = orgMobsDaLideranca(l, mobilizadores);
      const expandido = orgExpandidos.has(lKey);
      const apoiosL = [l, ...mobsL].reduce((s, d) => s + (d.votos || 0), 0);

      html += `<li><div class="org-node org-node-l${expandido ? ' expanded' : ''}" data-l-key="${a(lKey)}" data-has-mobs="${mobsL.length > 0}">
        <div class="org-node-nome">👤 ${h(l.nome || '')}</div>
        <div class="org-node-sub">${h(l.bairro || '')}</div>
        <div class="org-node-counts">
          <span class="org-node-pill eq">🗳️ ${mobsL.length} eq.${mobsL.length > 0 ? (expandido ? ' ▾' : ' ▸') : ''}</span>
          <span class="org-node-pill">✅ ${apoiosL}</span>
        </div>
      </div>`;

      if (expandido && mobsL.length > 0) {
        html += '<ul>';
        mobsL.forEach(m => {
          html += `<li><div class="org-node org-node-m" data-id="${a(m.id)}" data-zona="${a(m._zona)}">
            <div class="org-node-nome">🗳️ ${h(m.nome || '')}</div>
            <div class="org-node-sub">${h(m.bairro || '')}</div>
            ${m.votos ? `<div class="org-node-counts"><span class="org-node-pill">✅ ${m.votos}</span></div>` : ''}
          </div></li>`;
        });
        html += '</ul>';
      }

      html += '</li>';
    });
    html += '</ul>';
  }

  html += '</li></ul>';
  canvasEl.innerHTML = html;

  canvasEl.querySelectorAll('.org-node-l').forEach(node => {
    if (node.dataset.hasMobs !== 'true') return;
    node.addEventListener('click', () => {
      const key = node.dataset.lKey;
      if (orgExpandidos.has(key)) orgExpandidos.delete(key); else orgExpandidos.add(key);
      renderOrganograma();
    });
  });

  canvasEl.querySelectorAll('.org-node-m').forEach(node => {
    node.addEventListener('click', () => {
      if (typeof verDrawer === 'function') verDrawer(node.dataset.id, node.dataset.zona);
    });
  });
}

// ===================== busca =====================
function orgBuscar(termo) {
  const q = norm(termo || '');
  if (!q) return;

  const { coords, mobilizadores, caLidsMap } = orgMontarHierarquia();

  for (const ca of coords) {
    const caKey = ca._fireId || String(ca.id);
    const lidsCA = caLidsMap.get(caKey) || [];
    for (const l of lidsCA) {
      const lKey = l._fireId || String(l.id);
      if (norm(l.nome || '').includes(q)) {
        orgCaSelecionada = caKey;
        renderOrganograma();
        orgDestacar(`.org-node-l[data-l-key="${CSS.escape(lKey)}"]`);
        return;
      }
      const mobsL = orgMobsDaLideranca(l, mobilizadores);
      const mobMatch = mobsL.find(m => norm(m.nome || '').includes(q));
      if (mobMatch) {
        orgCaSelecionada = caKey;
        orgExpandidos.add(lKey);
        renderOrganograma();
        orgDestacar(`.org-node-m[data-id="${CSS.escape(String(mobMatch.id))}"]`);
        return;
      }
    }
  }
  if (typeof toast === 'function') toast('Nenhuma pessoa encontrada com esse nome no organograma.', 'erro');
}

function orgDestacar(seletor) {
  setTimeout(() => {
    const el = document.querySelector(seletor);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), 2200);
  }, 50);
}

// ===================== boot =====================
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('orgSearch');
  if (search) {
    search.addEventListener('keydown', e => { if (e.key === 'Enter') orgBuscar(search.value); });
  }
});
