# Coordenação Eleitoral — Setup Rápido

## ⚡ Quick Start (Usuários & Financeiro)

### Pré-requisitos
- Firebase CLI instalado: `npm install -g firebase-tools`
- Python 3.8+

### 1. Instalar dependências Python
```bash
pip install firebase-admin python-dotenv
```

### 2. Setup Automático de Usuários
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
python scripts/setup-users.py
```

Isso vai:
- ✅ Criar usuário admin: `icarocaio18@gmail.com`
- ✅ Criar usuários regionais: `norte@`, `leste@`, `sul@`, `sudeste@`, `rural@`
- ✅ Popular Firestore `users/{uid}` com roles

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Testar
- Login: `icarocaio18@gmail.com` / (sua senha) → acesso admin
- Login: `norte@coord.local` / `Temp@1234!` → acesso regional

---

## 📊 Financeiro — Para Todos

- **Menu**: Ferramentas > Financeiro
- **Admin (`icarocaio18@gmail.com`)**: vê/edita financeiro de todas as regiões
- **Regional (`norte@coord.local` etc.)**: vê/edita apenas sua região
- **Dados** salvos em Firestore `financas/{ciclo}_{region}`

---

## 🔐 Security

Firestore rules em `firebase/firestore.rules` já estão preparadas:
```plaintext
Admin: read/write everything
Regional: read/write only their region
Public: no access
```

---

## Estrutura de Usuários (Firestore)

Collection: `users`

**Admin Document**
```
{
  uid: (Firebase Auth UID)
  email: "icarocaio18@gmail.com"
  role: "admin"
}
```

**Regional Document**
```
{
  uid: (Firebase Auth UID)
  email: "norte@coord.local"
  role: "regional"
  region: "norte"
}
```

---

## Manual (sem script)

Se preferir criar usuários manualmente:

1. Firebase Console > Auth > criar cada email+senha
2. Firestore > coleção `users` > criar docs com estrutura acima
3. Deploy regras: `firebase deploy --only firestore:rules`

---

## Próximos passos

- [ ] Rodar script de migração (agregação de dados 2024): `node scripts/migrate-recursos.mjs`
- [ ] Testar Financeiro com admin e regional
- [ ] Mudar senhas padrão dos regionais no Firebase Console
