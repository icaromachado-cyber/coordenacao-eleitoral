# Setup de Usuários — Financeiro & Regional

## 1. Criar Usuários no Firebase Auth

Acesse **Firebase Console** > **Authentication** > **Users** e crie os seguintes usuários:

### Admin
- **Email**: `icarocaio18@gmail.com`
- **Senha**: (defina uma senha segura)

### Regionais (exemplo)
- **norte@coord.local** (Região Norte)
- **leste@coord.local** (Região Leste)
- **sul@coord.local** (Região Sul)
- **sudeste@coord.local** (Região Sudeste)
- **rural@coord.local** (Região Rural)

---

## 2. Adicionar Roles e Regiões no Firestore

Acesse **Firestore** > **Collections** > Create/edit collection `users` com documentos:

### Admin
**Document ID**: (copie o UID do usuário `icarocaio18@gmail.com` do Firebase Auth)

```json
{
  "role": "admin",
  "email": "icarocaio18@gmail.com"
}
```

### Regionais

**Document ID**: (UID do usuário norte@coord.local)
```json
{
  "role": "regional",
  "region": "norte",
  "email": "norte@coord.local"
}
```

**Document ID**: (UID do usuário leste@coord.local)
```json
{
  "role": "regional",
  "region": "leste",
  "email": "leste@coord.local"
}
```

Repita para **sul**, **sudeste**, **rural** com seus respectivos UIDs.

---

## 3. Usar o Script de Migração (opcional)

Se quiser agregar dados existentes da Região Norte para o Financeiro:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/serviceAccount.json"
node scripts/migrate-recursos.mjs
```

---

## 4. Testar

1. Login com `icarocaio18@gmail.com` → acesso admin
2. Clique em **Ferramentas** > **Financeiro** → pode editar qualquer região
3. Login com `norte@coord.local` → acesso regional (só vê/edita Região Norte)

---

## Firestore Security Rules

As regras `firebase/firestore.rules` já estão configuradas para:
- Admins: leitura/escrita em tudo
- Regionais: leitura/escrita apenas de sua região

Deploy das regras:
```bash
firebase deploy --only firestore:rules
```
