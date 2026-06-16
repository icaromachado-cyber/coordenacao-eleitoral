(function (global) {
  const HTML_ESCAPE = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  const VALID_TYPES = ['CA', 'L', 'M', 'LE', 'ME'];
  const VALID_ZONES = ['norte', 'leste', 'sul', 'sudeste', 'rural'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPE[ch]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function normalizeText(value) {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function parseNonNegativeNumber(value, fieldName) {
    const raw = String(value ?? '').trim().replace(',', '.');
    if (!raw) return { value: 0, error: '' };

    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      return { value: 0, error: `${fieldName} deve ser um numero valido.` };
    }
    if (parsed < 0) {
      return { value: 0, error: `${fieldName} nao pode ser negativo.` };
    }
    return { value: parsed, error: '' };
  }

  function validateRecordInput(raw) {
    const errors = [];
    const nome = String(raw.nome ?? '').trim();
    const tipo = String(raw.tipo ?? '').trim();
    const zona = String(raw.zona ?? '').trim();

    if (!nome) errors.push('Informe o nome completo.');
    if (!VALID_TYPES.includes(tipo)) errors.push('Selecione um tipo valido.');
    if (!VALID_ZONES.includes(zona)) errors.push('Selecione uma zona valida.');

    if (raw.telefone) {
      const digits = String(raw.telefone).replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 8) {
        errors.push('Telefone deve ter ao menos 8 digitos.');
      }
    }

    if (raw.reuniao_feita === 'sim' && !raw.reuniao_data) {
      errors.push('Informe a data da reuniao.');
    }

    return errors;
  }

  function formatFirebaseError(error) {
    const code = error && error.code;
    const messages = {
      'permission-denied': 'Sem permissao para acessar estes dados.',
      unavailable: 'Banco indisponivel no momento. Verifique a conexao.',
      'deadline-exceeded': 'A conexao demorou demais. Tente novamente.',
      'not-found': 'Registro nao encontrado.',
      cancelled: 'Operacao cancelada antes de concluir.'
    };
    return messages[code] || 'Erro de comunicacao com o banco de dados.';
  }

  const api = {
    VALID_TYPES,
    VALID_ZONES,
    escapeHtml,
    escapeAttr,
    normalizeText,
    parseNonNegativeNumber,
    validateRecordInput,
    formatFirebaseError
  };

  global.AppUtils = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
