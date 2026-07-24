// ===================== ZONEAMENTO (Lei municipal 5.807/2022) =====================
// View dedicada, independente da vista "Mapa" de lideranças/CA/M/etc.
// Usa window.ZONEAMENTO_GEOJSON (assets/dados-zoneamento.js) e o Leaflet já carregado pelo app.

let zoneamentoView = false;
let zoneMap = null;
let zoneGeoLayer = null;
let zoneSelectedLayer = null;
let zoneMacroFiltro = null; // Set — null = todas visiveis
let zoneSearchQ = '';

// Pessoas por zona (calculado sob demanda, reaproveitando o mesmo cache de geocodificação do Mapa)
let zonPessoasPorSigla = null;   // sigla -> { total, porTipo: {CA:n, L:n, ...} }
let zonPessoasCalculando = false;
let zonPessoasResumo = null;     // { ok, fail, total }

const ZONA_MACRO_META = {
  MZOM:            { nome: 'Ocupação Moderada',        varCor: '--mz-moderada' },
  MZD:             { nome: 'Desenvolvimento',           varCor: '--mz-desenvolvimento' },
  MZIA:            { nome: 'Interesse Ambiental',        varCor: '--mz-ambiental' },
  MZOC:            { nome: 'Ocupação Condicionada',     varCor: '--mz-condicionada' },
  'ZONA ESPECIAL': { nome: 'Zona Especial',              varCor: '--mz-especial' },
  ZEPEU:           { nome: 'Plano Específico de Urbanização', varCor: '--mz-plano' },
};
const ZONA_MACRO_ORDEM = Object.keys(ZONA_MACRO_META);

function zonCssVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#999';
}
function zonMacroCor(macroSigl) {
  const meta = ZONA_MACRO_META[macroSigl];
  return meta ? zonCssVar(meta.varCor) : '#999';
}
function zonNorm(s) {
  return (window.AppUtils?.normalizeText) ? AppUtils.normalizeText(s) : String(s || '').toLowerCase();
}
function zonEsc(s) {
  return (window.AppUtils?.escapeHtml) ? AppUtils.escapeHtml(s) : String(s ?? '');
}

function zonFeatures() {
  return (window.ZONEAMENTO_GEOJSON && window.ZONEAMENTO_GEOJSON.features) || [];
}
function zonTotalAreaKm2() {
  return zonFeatures().reduce((s, f) => s + (f.properties.areaKm2 || 0), 0);
}
function zonMacroTotais() {
  const totais = {};
  for (const m of ZONA_MACRO_ORDEM) totais[m] = 0;
  for (const f of zonFeatures()) {
    const m = f.properties.macroSigl;
    totais[m] = (totais[m] || 0) + (f.properties.areaKm2 || 0);
  }
  return totais;
}

// ===================== abrir/fechar a vista =====================
function toggleZoneamentoView() {
  try { _toggleZoneamentoViewInner(); }
  catch (err) { console.error('[Zoneamento]', err); if (typeof toast === 'function') toast('Erro no Zoneamento: ' + err.message, 'erro'); }
}

function _toggleZoneamentoViewInner() {
  // Fecha as outras vistas em tela cheia, seguindo o mesmo padrão usado por elas entre si.
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

  zoneamentoView = !zoneamentoView;
  const btn = document.getElementById('btnZoneamentoToggle');
  const tableArea = document.querySelector('.table-area');
  const pag = document.getElementById('pag');
  const ctrlBar = document.querySelector('.controls-bar');
  const zoneamentoArea = document.getElementById('zoneamentoArea');

  if (zoneamentoView) {
    btn.classList.add('active');
    btn.textContent = '📋 Tabela';
    tableArea.classList.add('hidden');
    pag.style.display = 'none';
    ctrlBar.style.display = 'none';
    zoneamentoArea.classList.add('active');
    setTimeout(() => {
      iniciarZoneamentoMap();
      if (zoneMap) zoneMap.invalidateSize();
    }, 100);
  } else {
    btn.classList.remove('active');
    btn.textContent = '📐 Zoneamento';
    tableArea.classList.remove('hidden');
    pag.style.display = '';
    ctrlBar.style.display = '';
    zoneamentoArea.classList.remove('active');
    if (typeof reopenDashboardView === 'function') reopenDashboardView();
  }
}

// ===================== mapa =====================
function iniciarZoneamentoMap() {
  if (!zoneMap) {
    zoneMap = L.map('zoneMap', { zoomControl: true }).setView([-5.0892, -42.8019], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(zoneMap);

    zoneGeoLayer = L.geoJSON(window.ZONEAMENTO_GEOJSON, {
      style: zonStyleForFeature,
      onEachFeature: zonBindFeature
    }).addTo(zoneMap);

    try { zoneMap.fitBounds(zoneGeoLayer.getBounds(), { padding: [24, 24] }); } catch (e) {}

    zonRenderLegend();
    zonRenderList();
    zonRenderInfoBar();
  }
}

function zonStyleForFeature(feature) {
  const macro = feature.properties.macroSigl;
  const visivel = !zoneMacroFiltro || zoneMacroFiltro.has(macro);
  const cor = zonMacroCor(macro);
  const buscando = !!zoneSearchQ;
  const combina = !buscando || zonMatch(feature);
  return {
    color: '#0b0b0b',
    weight: 1,
    opacity: 0.35,
    fillColor: cor,
    fillOpacity: !visivel ? 0 : (combina ? 0.5 : 0.08),
    className: visivel ? '' : 'zon-layer-hidden'
  };
}

function zonMatch(feature) {
  if (!zoneSearchQ) return true;
  const q = zonNorm(zoneSearchQ);
  return zonNorm(feature.properties.sigla).includes(q) || zonNorm(feature.properties.zona).includes(q);
}

function zonPessoasResumoZona(sigla) {
  return zonPessoasPorSigla ? (zonPessoasPorSigla[sigla] || { total: 0, porTipo: {} }) : null;
}

function zonPopupHTML(p) {
  const macroNome = ZONA_MACRO_META[p.macroSigl]?.nome || p.macrozona;
  const cor = zonMacroCor(p.macroSigl);
  const pessoas = zonPessoasResumoZona(p.sigla);
  let pessoasHTML = '';
  if (pessoas) {
    const partes = Object.entries(pessoas.porTipo)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, n]) => `${(typeof tipoLabel === 'function' ? tipoLabel(tipo) : tipo)} ${n}`)
      .join(' · ');
    pessoasHTML = `<div class="popup-row"><span class="popup-lbl">Pessoas na zona</span><span class="popup-val">${pessoas.total}${partes ? ' <span style="color:var(--muted);font-weight:400">(' + zonEsc(partes) + ')</span>' : ''}</span></div>`;
  } else if (zonPessoasCalculando) {
    pessoasHTML = `<div class="popup-row"><span class="popup-lbl">Pessoas na zona</span><span class="popup-val">calculando…</span></div>`;
  }
  return `
    <div style="min-width:200px">
      <div class="zon-popup-sigla" style="color:${cor}">${zonEsc(p.sigla)}</div>
      <div class="zon-popup-nome">${zonEsc(p.zona)}</div>
      <div class="popup-row"><span class="popup-lbl">Macrozona</span><span class="popup-val">${zonEsc(macroNome)}</span></div>
      <div class="popup-row"><span class="popup-lbl">Índice de aproveitamento</span><span class="popup-val">${p.ia ?? '—'}</span></div>
      <div class="popup-row"><span class="popup-lbl">Parâmetro</span><span class="popup-val">${p.pm && p.pm !== 'NULL' ? zonEsc(p.pm) : '—'}</span></div>
      <div class="popup-row"><span class="popup-lbl">Área</span><span class="popup-val">${p.areaKm2.toFixed(2)} km² (${p.areaHa.toLocaleString('pt-BR')} ha)</span></div>
      ${pessoasHTML}
    </div>`;
}

function zonBindFeature(feature, layer) {
  // Função (não string fixa) para o popup sempre refletir o estado mais recente das estatísticas.
  layer.bindPopup(() => zonPopupHTML(feature.properties));
  layer.on('mouseover', () => { if (layer !== zoneSelectedLayer) layer.setStyle({ weight: 2, opacity: 0.8 }); });
  layer.on('mouseout', () => { if (layer !== zoneSelectedLayer) zoneGeoLayer.resetStyle(layer); });
  layer.on('click', () => zonSelectLayer(layer));
}

function zonSelectLayer(layer) {
  if (zoneSelectedLayer && zoneSelectedLayer !== layer) zoneGeoLayer.resetStyle(zoneSelectedLayer);
  zoneSelectedLayer = layer;
  layer.setStyle({ weight: 3, color: zonCssVar('--accent'), opacity: 1 });
  zonHighlightListRow(layer.feature.properties.sigla);
}

// ===================== legenda (toggle por macrozona) =====================
function zonRenderLegend() {
  const el = document.getElementById('zonLegendList');
  if (!el) return;
  const totais = zonMacroTotais();
  const totalGeral = zonTotalAreaKm2();

  let pessoasPorMacro = null;
  if (zonPessoasPorSigla) {
    pessoasPorMacro = {};
    for (const f of zonFeatures()) {
      const r = zonPessoasPorSigla[f.properties.sigla];
      if (r) pessoasPorMacro[f.properties.macroSigl] = (pessoasPorMacro[f.properties.macroSigl] || 0) + r.total;
    }
  }

  const itens = ZONA_MACRO_ORDEM.map(m => ({ m, area: totais[m] || 0 })).sort((a, b) => b.area - a.area);
  el.innerHTML = itens.map(({ m, area }) => {
    const pct = totalGeral ? (area / totalGeral * 100) : 0;
    const cor = zonMacroCor(m);
    const nPessoas = pessoasPorMacro ? (pessoasPorMacro[m] || 0) : null;
    return `<div class="zon-legend-row" data-macro="${m}">
      <span class="zon-legend-dot" style="background:${cor}"></span>
      <span class="zon-legend-nome">${ZONA_MACRO_META[m].nome}</span>
      ${nPessoas !== null ? `<span class="zon-legend-pessoas">👥 ${nPessoas}</span>` : ''}
      <span class="zon-legend-pct">${pct.toFixed(1)}%</span>
    </div>`;
  }).join('');
  el.querySelectorAll('.zon-legend-row').forEach(row => {
    row.addEventListener('click', () => {
      const m = row.dataset.macro;
      if (!zoneMacroFiltro) zoneMacroFiltro = new Set(ZONA_MACRO_ORDEM);
      if (zoneMacroFiltro.has(m)) zoneMacroFiltro.delete(m); else zoneMacroFiltro.add(m);
      row.classList.toggle('off', !zoneMacroFiltro.has(m));
      if (zoneGeoLayer) zoneGeoLayer.setStyle(zonStyleForFeature);
    });
  });
}

// ===================== lista de zonas por área =====================
function zonRenderList() {
  const el = document.getElementById('zonListBody');
  if (!el) return;
  const rows = [...zonFeatures()].sort((a, b) => b.properties.areaKm2 - a.properties.areaKm2);
  el.innerHTML = rows.map(f => {
    const p = f.properties;
    const cor = zonMacroCor(p.macroSigl);
    const pessoas = zonPessoasResumoZona(p.sigla);
    return `<div class="zon-list-row" data-sigla="${zonEsc(p.sigla)}">
      <span class="zon-list-dot" style="background:${cor}"></span>
      <div class="zon-list-main">
        <div class="zon-list-top">
          <span class="zon-list-sigla">${zonEsc(p.sigla)}</span>
          <span class="zon-list-area">${p.areaKm2.toFixed(1)} km²</span>
        </div>
        <div class="zon-list-bottom">
          <span class="zon-list-nome">${zonEsc(p.zona)}</span>
          ${pessoas ? `<span class="zon-list-pessoas">👥 ${pessoas.total}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('.zon-list-row').forEach(row => {
    row.addEventListener('click', () => zonGoToSigla(row.dataset.sigla));
  });
}

function zonHighlightListRow(sigla) {
  document.querySelectorAll('.zon-list-row').forEach(row => {
    row.classList.toggle('selected', row.dataset.sigla === sigla);
  });
}

function zonGoToSigla(sigla) {
  if (!zoneGeoLayer) return;
  let found = null;
  zoneGeoLayer.eachLayer(layer => { if (layer.feature.properties.sigla === sigla) found = layer; });
  if (!found) return;
  zonSelectLayer(found);
  zoneMap.fitBounds(found.getBounds(), { padding: [40, 40], maxZoom: 15 });
  found.openPopup();
}

// ===================== busca =====================
function zonRenderInfoBar() {
  const el = document.getElementById('zonInfoBar');
  if (!el) return;
  const base = `<strong>${zonFeatures().length}</strong> zonas · <strong>${ZONA_MACRO_ORDEM.length}</strong> macrozonas · <strong>${zonTotalAreaKm2().toFixed(1)}</strong> km² mapeados`;

  if (zonPessoasCalculando) {
    el.innerHTML = `${base} · <span class="zon-calc-status">calculando pessoas por zona…</span>`;
    return;
  }
  if (zonPessoasResumo) {
    const r = zonPessoasResumo;
    el.innerHTML = `${base} · <strong>${r.ok}</strong> pessoas localizadas${r.fail ? ` · <span style="color:var(--z-norte)">${r.fail} sem coordenada</span>` : ''} <button id="zonCalcPessoasBtn" class="zon-calc-btn">🔄 Recalcular</button>`;
  } else {
    el.innerHTML = `${base} <button id="zonCalcPessoasBtn" class="zon-calc-btn">👥 Calcular pessoas por zona</button>`;
  }
  const btn = document.getElementById('zonCalcPessoasBtn');
  if (btn) btn.addEventListener('click', zonCalcularPessoasPorZona);
}

function zonOnSearchInput(value) {
  zoneSearchQ = value.trim();
  if (zoneGeoLayer) zoneGeoLayer.setStyle(zonStyleForFeature);
  const el = document.getElementById('zonSearchCount');
  if (el) {
    const n = zonFeatures().filter(zonMatch).length;
    el.textContent = zoneSearchQ ? `${n}/${zonFeatures().length}` : '';
  }
}

function zonOnSearchEnter() {
  const match = zonFeatures().find(zonMatch);
  if (match) zonGoToSigla(match.properties.sigla);
}

// ===================== pessoas por zona (ponto-em-polígono) =====================
// Geometria das zonas está em GeoJSON padrão: coordenadas [lon, lat] por anel.
function zonPointInRingLL(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function zonPointInPolyLL(lon, lat, rings) {
  if (!zonPointInRingLL(lon, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) if (zonPointInRingLL(lon, lat, rings[k])) return false;
  return true;
}
function zonSiglaForLatLng(lat, lng) {
  for (const f of zonFeatures()) {
    const g = f.geometry;
    const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (const poly of polys) {
      if (zonPointInPolyLL(lng, lat, poly)) return f.properties.sigla;
    }
  }
  return null;
}

async function zonCalcularPessoasPorZona() {
  if (zonPessoasCalculando) return;
  if (typeof getDados !== 'function') {
    if (typeof toast === 'function') toast('Dados da equipe ainda não carregados.', 'erro');
    return;
  }

  zonPessoasCalculando = true;
  zonRenderInfoBar();

  try {
    const dados = getDados();
    const comEndereco = dados.filter(d => d.endereco || d.bairro);
    const porSigla = {};
    let ok = 0, fail = 0;

    for (let i = 0; i < comEndereco.length; i++) {
      const d = comEndereco[i];
      const chave = d.endereco || d.bairro;

      let coord;
      if (typeof geocodeCache !== 'undefined' && geocodeCache[chave] !== undefined) {
        coord = geocodeCache[chave]; // já geocodificado antes (ex.: vista Mapa) — sem custo extra
      } else if (typeof geocodificar === 'function') {
        coord = await geocodificar(d.endereco, d.bairro, i); // busca e guarda no mesmo cache global
      } else {
        coord = null;
      }

      if (coord) {
        const sigla = zonSiglaForLatLng(coord.lat, coord.lng);
        if (sigla) {
          const bucket = porSigla[sigla] || (porSigla[sigla] = { total: 0, porTipo: {} });
          bucket.total++;
          bucket.porTipo[d.tipo] = (bucket.porTipo[d.tipo] || 0) + 1;
        }
        ok++;
      } else {
        fail++;
      }

      if ((i + 1) % 5 === 0 || i === comEndereco.length - 1) {
        const el = document.getElementById('zonInfoBar');
        if (el) el.innerHTML = `Calculando pessoas por zona… <strong>${i + 1}/${comEndereco.length}</strong>`;
      }
    }

    zonPessoasPorSigla = porSigla;
    zonPessoasResumo = { ok, fail, total: comEndereco.length };
  } catch (err) {
    console.error('[Zoneamento] erro ao calcular pessoas por zona', err);
    if (typeof toast === 'function') toast('Erro ao calcular pessoas por zona: ' + err.message, 'erro');
  } finally {
    zonPessoasCalculando = false;
    zonRenderLegend();
    zonRenderList();
    zonRenderInfoBar();
  }
}

// ===================== boot: liga os controles quando o DOM estiver pronto =====================
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('zonSearch');
  if (search) {
    search.addEventListener('input', e => zonOnSearchInput(e.target.value));
    search.addEventListener('keydown', e => { if (e.key === 'Enter') zonOnSearchEnter(); });
  }
});
