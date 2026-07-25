// ===================== BAIRROS (BAIRROS_2013 + cruzamento com QUADRAS) =====================
// View dedicada. Usa window.BAIRROS_GEOJSON (assets/dados-bairros.js) e o Leaflet já carregado pelo app.
// Cada bairro já vem com: nome oficial, zona (Norte/Sul/Leste/Sudeste), área e nº de quadras
// (calculado offline por cruzamento espacial quadra->bairro). Pessoas por bairro são calculadas
// sob demanda, reaproveitando o mesmo cache de geocodificação da vista Mapa.

let bairrosView = false;
let bairroMap = null;
let bairroGeoLayer = null;
let bairroSelectedLayer = null;
let bairroZonaFiltro = null; // Set — null = todas visiveis
let bairroSearchQ = '';

let bairroPessoasPorGid = null;  // gid -> { total, porTipo: {} }
let bairroPessoasCalculando = false;
let bairroPessoasResumo = null;  // { ok, fail, total, porTipo }
let bairroPessoasPontos = null;  // [{ d, lat, lng, gid }] — para os pinos individuais no mapa
let bairroPinsLayer = null;
let bairroMostrarPinos = false;
let bairroPinsTipoFiltro = new Set(['CA', 'L', 'LE', 'M', 'ME']);

const BRR_ZONA_META = {
  NORTE:   { nome: 'Norte',   varCor: '--brr-norte' },
  SUL:     { nome: 'Sul',     varCor: '--brr-sul' },
  LESTE:   { nome: 'Leste',   varCor: '--brr-leste' },
  SUDESTE: { nome: 'Sudeste', varCor: '--brr-sudeste' },
};
const BRR_ZONA_ORDEM = Object.keys(BRR_ZONA_META);

function brrCssVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#999';
}
function brrZonaCor(zona) {
  const meta = BRR_ZONA_META[zona];
  return meta ? brrCssVar(meta.varCor) : '#999';
}
function brrNorm(s) {
  return (window.AppUtils?.normalizeText) ? AppUtils.normalizeText(s) : String(s || '').toLowerCase();
}
function brrEsc(s) {
  return (window.AppUtils?.escapeHtml) ? AppUtils.escapeHtml(s) : String(s ?? '');
}

function brrFeatures() {
  return (window.BAIRROS_GEOJSON && window.BAIRROS_GEOJSON.features) || [];
}
function brrTotalAreaKm2() {
  return brrFeatures().reduce((s, f) => s + (f.properties.areaKm2 || 0), 0);
}
function brrTotalQuadras() {
  return brrFeatures().reduce((s, f) => s + (f.properties.nQuadras || 0), 0);
}
function brrZonaTotais() {
  const totais = {};
  for (const z of BRR_ZONA_ORDEM) totais[z] = { area: 0, bairros: 0, quadras: 0 };
  for (const f of brrFeatures()) {
    const z = f.properties.zona;
    if (!totais[z]) continue;
    totais[z].area += f.properties.areaKm2 || 0;
    totais[z].bairros += 1;
    totais[z].quadras += f.properties.nQuadras || 0;
  }
  return totais;
}

// ===================== abrir/fechar a vista =====================
function toggleBairrosView() {
  try { _toggleBairrosViewInner(); }
  catch (err) { console.error('[Bairros]', err); if (typeof toast === 'function') toast('Erro nos Bairros: ' + err.message, 'erro'); }
}

function _toggleBairrosViewInner() {
  if (typeof mapView !== 'undefined' && mapView) {
    mapView = false;
    document.getElementById('btnMapToggle').classList.remove('active');
    document.getElementById('btnMapToggle').textContent = '🗺️ Mapa';
    document.getElementById('mapArea').classList.remove('active');
    document.querySelector('.table-area').classList.remove('hidden');
    document.getElementById('pag').style.display = '';
    document.body.classList.remove('map-fullscreen');
  }
  if (typeof treeView !== 'undefined' && treeView) {
    treeView = false;
    document.getElementById('btnTreeToggle').classList.remove('active');
    document.getElementById('btnTreeToggle').textContent = '🌳 Árvore';
    document.getElementById('treeArea').classList.remove('active');
    document.querySelector('.table-area').classList.remove('hidden');
    document.getElementById('pag').style.display = '';
    document.querySelector('.controls-bar').style.display = '';
  }
  if (typeof _fecharRelatorio === 'function') _fecharRelatorio();
  if (typeof closeDashboardView === 'function') closeDashboardView();

  bairrosView = !bairrosView;
  const btn = document.getElementById('btnBairrosToggle');
  const tableArea = document.querySelector('.table-area');
  const pag = document.getElementById('pag');
  const ctrlBar = document.querySelector('.controls-bar');
  const bairrosArea = document.getElementById('bairrosArea');

  if (bairrosView) {
    btn.classList.add('active');
    btn.textContent = '📋 Tabela';
    tableArea.classList.add('hidden');
    pag.style.display = 'none';
    ctrlBar.style.display = 'none';
    bairrosArea.classList.add('active');
    setTimeout(() => {
      iniciarBairrosMap();
      if (bairroMap) bairroMap.invalidateSize();
    }, 100);
  } else {
    btn.classList.remove('active');
    btn.textContent = '🏘️ Bairros';
    tableArea.classList.remove('hidden');
    pag.style.display = '';
    ctrlBar.style.display = '';
    bairrosArea.classList.remove('active');
    if (typeof reopenDashboardView === 'function') reopenDashboardView();
  }
}

// ===================== mapa =====================
function iniciarBairrosMap() {
  if (!bairroMap) {
    bairroMap = L.map('bairroMap', { zoomControl: true }).setView([-5.0892, -42.8019], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(bairroMap);

    bairroGeoLayer = L.geoJSON(window.BAIRROS_GEOJSON, {
      style: brrStyleForFeature,
      onEachFeature: brrBindFeature
    }).addTo(bairroMap);

    try { bairroMap.fitBounds(bairroGeoLayer.getBounds(), { padding: [24, 24] }); } catch (e) {}

    brrRenderLegend();
    brrRenderList();
    brrRenderInfoBar();
    brrCalcularPessoasPorBairro();
  }
}

function brrStyleForFeature(feature) {
  const zona = feature.properties.zona;
  const visivel = !bairroZonaFiltro || bairroZonaFiltro.has(zona);
  const cor = brrZonaCor(zona);
  const buscando = !!bairroSearchQ;
  const combina = !buscando || brrMatch(feature);
  return {
    color: '#0b0b0b',
    weight: 1,
    opacity: 0.35,
    fillColor: cor,
    fillOpacity: !visivel ? 0 : (combina ? 0.5 : 0.08),
  };
}

function brrMatch(feature) {
  if (!bairroSearchQ) return true;
  const q = brrNorm(bairroSearchQ);
  return brrNorm(feature.properties.nome).includes(q);
}

function brrPessoasResumoBairro(gid) {
  return bairroPessoasPorGid ? (bairroPessoasPorGid[gid] || { total: 0, porTipo: {} }) : null;
}

function brrPopupHTML(p) {
  const cor = brrZonaCor(p.zona);
  const pessoas = brrPessoasResumoBairro(p.gid);
  let pessoasHTML = '';
  if (pessoas) {
    const partes = Object.entries(pessoas.porTipo)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, n]) => `${(typeof tipoLabel === 'function' ? tipoLabel(tipo) : tipo)} ${n}`)
      .join(' · ');
    pessoasHTML = `<div class="popup-row"><span class="popup-lbl">Pessoas no bairro</span><span class="popup-val">${pessoas.total}${partes ? ' <span style="color:var(--muted);font-weight:400">(' + brrEsc(partes) + ')</span>' : ''}</span></div>`;
  } else if (bairroPessoasCalculando) {
    pessoasHTML = `<div class="popup-row"><span class="popup-lbl">Pessoas no bairro</span><span class="popup-val">calculando…</span></div>`;
  }
  return `
    <div style="min-width:200px">
      <div class="zon-popup-sigla" style="color:${cor}">${brrEsc(p.nome)}</div>
      <div class="popup-row"><span class="popup-lbl">Zona</span><span class="popup-val">${brrEsc(BRR_ZONA_META[p.zona]?.nome || p.zona)}</span></div>
      <div class="popup-row"><span class="popup-lbl">Área</span><span class="popup-val">${p.areaKm2.toFixed(2)} km²</span></div>
      <div class="popup-row"><span class="popup-lbl">Quadras</span><span class="popup-val">${p.nQuadras}</span></div>
      ${pessoasHTML}
    </div>`;
}

function brrBindFeature(feature, layer) {
  layer.bindPopup(() => brrPopupHTML(feature.properties));
  layer.on('mouseover', () => { if (layer !== bairroSelectedLayer) layer.setStyle({ weight: 2, opacity: 0.8 }); });
  layer.on('mouseout', () => { if (layer !== bairroSelectedLayer) bairroGeoLayer.resetStyle(layer); });
  layer.on('click', () => brrSelectLayer(layer));
}

function brrSelectLayer(layer) {
  if (bairroSelectedLayer && bairroSelectedLayer !== layer) bairroGeoLayer.resetStyle(bairroSelectedLayer);
  bairroSelectedLayer = layer;
  layer.setStyle({ weight: 3, color: brrCssVar('--accent'), opacity: 1 });
  brrHighlightListRow(layer.feature.properties.gid);
}

// ===================== legenda (toggle por zona) =====================
function brrRenderLegend() {
  const el = document.getElementById('brrLegendList');
  if (!el) return;
  const totais = brrZonaTotais();
  const totalGeral = brrTotalAreaKm2();

  let pessoasPorZona = null;
  let totalPessoasGeral = 0;
  if (bairroPessoasPorGid) {
    pessoasPorZona = {};
    for (const f of brrFeatures()) {
      const r = bairroPessoasPorGid[f.properties.gid];
      if (r) {
        pessoasPorZona[f.properties.zona] = (pessoasPorZona[f.properties.zona] || 0) + r.total;
        totalPessoasGeral += r.total;
      }
    }
  }

  const itens = BRR_ZONA_ORDEM.map(z => ({ z, ...totais[z] })).sort((a, b) => b.area - a.area);
  el.innerHTML = itens.map(({ z, area, bairros, quadras }) => {
    const pct = totalGeral ? (area / totalGeral * 100) : 0;
    const cor = brrZonaCor(z);
    const nPessoas = pessoasPorZona ? (pessoasPorZona[z] || 0) : null;
    const pctPessoas = (nPessoas !== null && totalPessoasGeral) ? ` (${(nPessoas / totalPessoasGeral * 100).toFixed(0)}%)` : '';
    return `<div class="zon-legend-row" data-zona="${z}">
      <span class="zon-legend-dot" style="background:${cor}"></span>
      <span class="zon-legend-nome">${BRR_ZONA_META[z].nome}<span class="zon-legend-sub">${bairros} bairros · ${quadras} quadras</span></span>
      ${nPessoas !== null ? `<span class="zon-legend-pessoas">👥 ${nPessoas}${pctPessoas}</span>` : ''}
      <span class="zon-legend-pct">${pct.toFixed(1)}%</span>
    </div>`;
  }).join('');
  el.querySelectorAll('.zon-legend-row').forEach(row => {
    row.addEventListener('click', () => {
      const z = row.dataset.zona;
      if (!bairroZonaFiltro) bairroZonaFiltro = new Set(BRR_ZONA_ORDEM);
      if (bairroZonaFiltro.has(z)) bairroZonaFiltro.delete(z); else bairroZonaFiltro.add(z);
      row.classList.toggle('off', !bairroZonaFiltro.has(z));
      if (bairroGeoLayer) bairroGeoLayer.setStyle(brrStyleForFeature);
    });
  });
}

// ===================== lista de bairros =====================
function brrRenderList() {
  const el = document.getElementById('brrListBody');
  if (!el) return;
  const rows = [...brrFeatures()].sort((a, b) => {
    const pa = brrPessoasResumoBairro(a.properties.gid), pb = brrPessoasResumoBairro(b.properties.gid);
    if (pa && pb && pa.total !== pb.total) return pb.total - pa.total;
    return b.properties.nQuadras - a.properties.nQuadras;
  });
  el.innerHTML = rows.map((f, idx) => {
    const p = f.properties;
    const cor = brrZonaCor(p.zona);
    const pessoas = brrPessoasResumoBairro(p.gid);
    const rank = (bairroPessoasPorGid && pessoas && pessoas.total > 0) ? idx + 1 : null;
    return `<div class="zon-list-row" data-gid="${p.gid}">
      <span class="zon-list-dot" style="background:${cor}"></span>
      <div class="zon-list-main">
        <div class="zon-list-top">
          ${rank ? `<span class="zon-list-rank">#${rank}</span>` : ''}
          <span class="zon-list-sigla">${brrEsc(p.nome)}</span>
          <span class="zon-list-area">${p.nQuadras} quadras</span>
        </div>
        <div class="zon-list-bottom">
          <span class="zon-list-nome">${brrEsc(BRR_ZONA_META[p.zona]?.nome || p.zona)} · ${p.areaKm2.toFixed(1)} km²</span>
          ${pessoas ? `<span class="zon-list-pessoas">👥 ${pessoas.total}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('.zon-list-row').forEach(row => {
    row.addEventListener('click', () => brrGoToGid(+row.dataset.gid));
  });
}

function brrHighlightListRow(gid) {
  document.querySelectorAll('#brrListBody .zon-list-row').forEach(row => {
    row.classList.toggle('selected', +row.dataset.gid === gid);
  });
}

function brrGoToGid(gid) {
  if (!bairroGeoLayer) return;
  let found = null;
  bairroGeoLayer.eachLayer(layer => { if (layer.feature.properties.gid === gid) found = layer; });
  if (!found) return;
  brrSelectLayer(found);
  bairroMap.fitBounds(found.getBounds(), { padding: [40, 40], maxZoom: 15 });
  found.openPopup();
}

// ===================== busca =====================
function brrRenderInfoBar() {
  const el = document.getElementById('brrInfoBar');
  if (!el) return;
  const base = `<strong>${brrFeatures().length}</strong> bairros · <strong>${brrTotalQuadras().toLocaleString('pt-BR')}</strong> quadras · <strong>${brrTotalAreaKm2().toFixed(1)}</strong> km² mapeados`;

  if (bairroPessoasCalculando) {
    el.innerHTML = `${base} · <span class="zon-calc-status">calculando pessoas por bairro…</span>`;
    return;
  }
  if (bairroPessoasResumo) {
    const r = bairroPessoasResumo;
    const porTipoStr = r.porTipo
      ? Object.entries(r.porTipo).sort((a, b) => b[1] - a[1])
          .map(([t, n]) => `${(typeof tipoLabel === 'function' ? tipoLabel(t) : t)} ${n}`).join(' · ')
      : '';
    el.innerHTML = `${base} · <strong>${r.ok}</strong> pessoas localizadas${porTipoStr ? ` (${porTipoStr})` : ''}${r.fail ? ` · <span style="color:var(--z-norte)">${r.fail} sem coordenada</span>` : ''} <button id="brrCalcPessoasBtn" class="zon-calc-btn">🔄 Recalcular</button>`;
  } else {
    el.innerHTML = `${base} <button id="brrCalcPessoasBtn" class="zon-calc-btn">👥 Calcular pessoas por bairro</button>`;
  }
  const btn = document.getElementById('brrCalcPessoasBtn');
  if (btn) btn.addEventListener('click', brrCalcularPessoasPorBairro);
}

function brrOnSearchInput(value) {
  bairroSearchQ = value.trim();
  if (bairroGeoLayer) bairroGeoLayer.setStyle(brrStyleForFeature);
  const el = document.getElementById('brrSearchCount');
  if (el) {
    const n = brrFeatures().filter(brrMatch).length;
    el.textContent = bairroSearchQ ? `${n}/${brrFeatures().length}` : '';
  }
}

function brrOnSearchEnter() {
  const match = brrFeatures().find(brrMatch);
  if (match) brrGoToGid(match.properties.gid);
}

// ===================== pessoas por bairro (ponto-em-polígono) =====================
function brrPointInRingLL(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function brrPointInPolyLL(lon, lat, rings) {
  if (!brrPointInRingLL(lon, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) if (brrPointInRingLL(lon, lat, rings[k])) return false;
  return true;
}
function brrGidForLatLng(lat, lng) {
  for (const f of brrFeatures()) {
    const g = f.geometry;
    const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (const poly of polys) {
      if (brrPointInPolyLL(lng, lat, poly)) return f.properties.gid;
    }
  }
  return null;
}

async function brrCalcularPessoasPorBairro() {
  if (bairroPessoasCalculando) return;
  if (typeof getDados !== 'function') {
    if (typeof toast === 'function') toast('Dados da equipe ainda não carregados.', 'erro');
    return;
  }

  bairroPessoasCalculando = true;
  brrRenderInfoBar();

  try {
    const dados = getDados();
    const comEndereco = dados.filter(d => d.endereco || d.bairro);
    const porGid = {};
    const porTipoGeral = {};
    const pontos = [];
    let ok = 0, fail = 0;

    for (let i = 0; i < comEndereco.length; i++) {
      const d = comEndereco[i];
      const chave = d.endereco || d.bairro;

      let coord;
      if (typeof geocodeCache !== 'undefined' && geocodeCache[chave] !== undefined) {
        coord = geocodeCache[chave];
      } else if (typeof geocodificar === 'function') {
        coord = await geocodificar(d.endereco, d.bairro, i);
      } else {
        coord = null;
      }

      if (coord) {
        const gid = brrGidForLatLng(coord.lat, coord.lng);
        if (gid !== null) {
          const bucket = porGid[gid] || (porGid[gid] = { total: 0, porTipo: {} });
          bucket.total++;
          bucket.porTipo[d.tipo] = (bucket.porTipo[d.tipo] || 0) + 1;
        }
        porTipoGeral[d.tipo] = (porTipoGeral[d.tipo] || 0) + 1;
        pontos.push({ d, lat: coord.lat, lng: coord.lng, gid });
        ok++;
      } else {
        fail++;
      }

      if ((i + 1) % 5 === 0 || i === comEndereco.length - 1) {
        const el = document.getElementById('brrInfoBar');
        if (el) el.innerHTML = `Calculando pessoas por bairro… <strong>${i + 1}/${comEndereco.length}</strong>`;
      }
    }

    bairroPessoasPorGid = porGid;
    bairroPessoasResumo = { ok, fail, total: comEndereco.length, porTipo: porTipoGeral };
    bairroPessoasPontos = pontos;
    bairroMostrarPinos = true;
  } catch (err) {
    console.error('[Bairros] erro ao calcular pessoas por bairro', err);
    if (typeof toast === 'function') toast('Erro ao calcular pessoas por bairro: ' + err.message, 'erro');
  } finally {
    bairroPessoasCalculando = false;
    brrRenderLegend();
    brrRenderList();
    brrRenderInfoBar();
    brrRenderPinsBar();
    brrRenderPessoasMarkers();
  }
}

// ===================== pinos individuais de pessoas no mapa =====================
function brrRenderPessoasMarkers() {
  if (!bairroMap) return;
  if (bairroPinsLayer) { bairroMap.removeLayer(bairroPinsLayer); bairroPinsLayer = null; }
  if (!bairroMostrarPinos || !bairroPessoasPontos) return;

  const layers = [];
  for (const p of bairroPessoasPontos) {
    if (!bairroPinsTipoFiltro.has(p.d.tipo)) continue;
    const icon = (typeof criarIcone === 'function') ? criarIcone(p.d.tipo) : undefined;
    const marker = L.marker([p.lat, p.lng], icon ? { icon } : undefined);
    if (typeof popupHTML === 'function') marker.bindPopup(popupHTML(p.d, p.d._zona), { maxWidth: 280 });
    layers.push(marker);
  }
  bairroPinsLayer = L.layerGroup(layers).addTo(bairroMap);
}

function brrRenderPinsBar() {
  const bar = document.getElementById('brrPinsBar');
  if (!bar) return;
  if (!bairroPessoasPontos) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  const tiposHTML = ['CA', 'L', 'LE', 'M', 'ME'].map(t => {
    const cor = (typeof TIPO_COLORS !== 'undefined' && TIPO_COLORS[t]) || '#888';
    const ativo = bairroPinsTipoFiltro.has(t);
    return `<button class="zon-pins-tipo-btn${ativo ? ' active' : ''}" data-tipo="${t}"><span class="zon-pins-dot" style="background:${cor}"></span>${t}</button>`;
  }).join('');

  bar.innerHTML = `
    <button id="brrPinsToggle" class="zon-pins-toggle${bairroMostrarPinos ? '' : ' off'}">${bairroMostrarPinos ? '📍 Pessoas no mapa' : '🙈 Pessoas ocultas'}</button>
    ${tiposHTML}
  `;

  document.getElementById('brrPinsToggle').addEventListener('click', () => {
    bairroMostrarPinos = !bairroMostrarPinos;
    brrRenderPinsBar();
    brrRenderPessoasMarkers();
  });
  bar.querySelectorAll('.zon-pins-tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tipo;
      if (bairroPinsTipoFiltro.has(t)) bairroPinsTipoFiltro.delete(t); else bairroPinsTipoFiltro.add(t);
      brrRenderPinsBar();
      brrRenderPessoasMarkers();
    });
  });
}

// ===================== boot =====================
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('brrSearch');
  if (search) {
    search.addEventListener('input', e => brrOnSearchInput(e.target.value));
    search.addEventListener('keydown', e => { if (e.key === 'Enter') brrOnSearchEnter(); });
  }
});
