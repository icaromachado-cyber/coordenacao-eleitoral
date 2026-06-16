import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { escapeHtml, parseNonNegativeNumber, validateRecordInput } = require('../assets/app-utils.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const html = readFileSync('index.html', 'utf8');
const app = readFileSync('assets/app.js', 'utf8');

execFileSync(process.execPath, ['--check', 'assets/app-utils.js'], { stdio: 'inherit' });
execFileSync(process.execPath, ['--check', 'assets/dados-norte.js'], { stdio: 'inherit' });
execFileSync(process.execPath, ['--check', 'assets/app.js'], { stdio: 'inherit' });

assert(html.includes('assets/styles.css'), 'index.html deve carregar o CSS separado.');
assert(html.includes('assets/dados-norte.js'), 'index.html deve carregar os dados separados.');
assert(html.includes('assets/app-utils.js'), 'index.html deve carregar os utilitarios.');
assert(html.includes('assets/app.js'), 'index.html deve carregar o app separado.');
assert(!/<style[\s>]/i.test(html), 'index.html nao deve conter bloco <style> inline.');
assert(!/<script>\s*\/\/ ===================== FIREBASE CONFIG/i.test(html), 'index.html nao deve conter o app inline.');
assert(!/\son(?:click|change|input|submit|mouseover|mouseout)=/i.test(html + app), 'Nao deve haver handlers inline.');
assert(!/\bcarregarFirestore\(/.test(app), 'Fluxo legado carregarFirestore nao deve ser usado.');
assert(/function deveImportarDadosIniciais\(\)/.test(app), 'Importacao inicial deve ter guarda explicita.');
assert(/snapCheck\.empty && deveImportarDadosIniciais\(\)/.test(app), 'Campanha vazia nao deve ser reimportada sem validar metadados.');
assert(/dadosIniciaisImportados: true/.test(app), 'Campanhas limpas/importadas devem registrar metadado de inicializacao.');

assert(escapeHtml('<img src=x onerror=alert(1)>') === '&lt;img src=x onerror=alert(1)&gt;', 'escapeHtml deve escapar tags.');
assert(parseNonNegativeNumber('-1', 'Valor').error, 'Numeros negativos devem ser rejeitados.');
assert(validateRecordInput({ nome: '', tipo: 'M', zona: 'norte' }).length > 0, 'Nome vazio deve ser invalido.');
assert(validateRecordInput({ nome: 'Teste', tipo: 'ZZ', zona: 'norte' }).length > 0, 'Tipo invalido deve ser rejeitado.');
assert(validateRecordInput({ nome: 'Teste', tipo: 'M', zona: 'norte', telefone: '123' }).length > 0, 'Telefone curto deve ser rejeitado.');

console.log('Verificacoes concluidas com sucesso.');
