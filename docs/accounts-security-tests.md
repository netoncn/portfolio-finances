# Testes de Segurança - Accounts Collection

## Como Executar os Testes

### Opção 1: Firebase Console (Produção/Staging)
1. Acesse https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em Firestore Database > Rules
4. Clique em "Rules Playground"
5. Execute os testes abaixo

### Opção 2: Firebase Emulator (Local)
```bash
# 1. Iniciar emulador
firebase emulators:start --only firestore

# 2. Acessar UI do emulador
# http://localhost:4000/firestore
```

## Cenários de Teste

### ✅ TESTES QUE DEVEM PASSAR

#### TC-001: Criar Cartão de Crédito Válido
**Descrição**: Usuário autenticado cria cartão de crédito com todos os campos obrigatórios

**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-001`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Nubank Gold",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "mastercard",
  "last4": "1234",
  "billing": {
    "closingDay": 15,
    "dueDay": 25,
    "creditLimit": 5000,
    "availableCredit": 5000
  },
  "benefits": {
    "airline": "LATAM Pass",
    "cashback": 0.01
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ✅ Permitido

---

#### TC-002: Criar Cartão de Débito Válido
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-002`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Itaú Débito",
  "accountType": "card_debit",
  "currency": "BRL",
  "cardBrand": "visa",
  "last4": "5678",
  "issuer": "Itaú",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ✅ Permitido

---

#### TC-003: Criar Carteira Válida
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-003`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Carteira Física",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ✅ Permitido

---

#### TC-004: Ler Própria Conta
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `get`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "Nubank Gold",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "mastercard",
  "billing": { "closingDay": 15, "dueDay": 25 },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ✅ Permitido

---

#### TC-005: Atualizar Nome da Conta
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `update`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "Nubank Gold",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "mastercard",
  "billing": { "closingDay": 15, "dueDay": 25 },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Dados Novos**:
```json
{
  "userId": "user-123",
  "name": "Nubank Platinum",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "mastercard",
  "billing": { "closingDay": 15, "dueDay": 25 },
  "createdAt": 1700000000000,
  "updatedAt": 1700100000000,
  "archived": false
}
```

**Resultado Esperado**: ✅ Permitido

---

#### TC-006: Arquivar Conta
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `update`

**Localização**: `/accounts/account-001`

**Dados Novos**:
```json
{
  "userId": "user-123",
  "name": "Nubank Gold",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "mastercard",
  "billing": { "closingDay": 15, "dueDay": 25 },
  "createdAt": 1700000000000,
  "updatedAt": 1700200000000,
  "archived": true,
  "archivedAt": 1700200000000
}
```

**Resultado Esperado**: ✅ Permitido

---

#### TC-007: Deletar Própria Conta
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `delete`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "Old Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": true
}
```

**Resultado Esperado**: ✅ Permitido

---

### ❌ TESTES QUE DEVEM FALHAR

#### TC-101: Criar Conta Sem Autenticação
**Configuração**:
- Authenticated: No

**Operação**: `set`

**Localização**: `/accounts/account-101`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Unauthorized Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (permission-denied)

---

#### TC-102: Criar Conta para Outro Usuário
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-102`

**Dados**:
```json
{
  "userId": "user-999",
  "name": "Fraudulent Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (userId não corresponde)

---

#### TC-103: Criar Cartão de Crédito SEM billing
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-103`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Invalid Credit Card",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "visa",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (falta billing obrigatório)

---

#### TC-104: Criar Cartão SEM cardBrand
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-104`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Invalid Card",
  "accountType": "card_debit",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (falta cardBrand obrigatório para cartões)

---

#### TC-105: Criar Carteira COM billing
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-105`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Invalid Wallet",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "billing": {
    "closingDay": 15,
    "dueDay": 25
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (carteiras não devem ter billing)

---

#### TC-106: Criar Conta Bancária COM cardBrand
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-106`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Invalid Bank Account",
  "accountType": "bank_checking",
  "currency": "BRL",
  "cardBrand": "visa",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (contas bancárias não devem ter cardBrand)

---

#### TC-107: Criar Conta com closingDay = dueDay
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-107`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Invalid Billing Card",
  "accountType": "card_credit",
  "currency": "BRL",
  "cardBrand": "mastercard",
  "billing": {
    "closingDay": 15,
    "dueDay": 15
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (closingDay deve ser diferente de dueDay)

---

#### TC-108: Criar Conta com Nome Curto
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-108`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "A",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (nome deve ter mínimo 2 caracteres)

---

#### TC-109: Criar Conta com Tipo Inválido
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-109`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Invalid Type Account",
  "accountType": "invalid_type",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (accountType inválido)

---

#### TC-110: Criar Conta com Moeda Inválida
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-110`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "USD Account",
  "accountType": "wallet_cash",
  "currency": "USD",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (currency deve ser "BRL")

---

#### TC-111: Criar Conta com last4 Inválido (muito curto)
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `set`

**Localização**: `/accounts/account-111`

**Dados**:
```json
{
  "userId": "user-123",
  "name": "Card with Invalid Last4",
  "accountType": "card_debit",
  "currency": "BRL",
  "cardBrand": "visa",
  "last4": "1",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (last4 deve ter 2-4 dígitos)

---

#### TC-112: Ler Conta de Outro Usuário
**Configuração**:
- Authenticated: Yes
- User ID: `user-999`

**Operação**: `get`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "User 123's Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (conta pertence a user-123)

---

#### TC-113: Atualizar userId da Conta
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `update`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "My Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Dados Novos**:
```json
{
  "userId": "user-999",
  "name": "My Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700100000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (userId é imutável)

---

#### TC-114: Atualizar createdAt da Conta
**Configuração**:
- Authenticated: Yes
- User ID: `user-123`

**Operação**: `update`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "My Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Dados Novos**:
```json
{
  "userId": "user-123",
  "name": "My Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700999999999,
  "updatedAt": 1700100000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (createdAt é imutável)

---

#### TC-115: Deletar Conta de Outro Usuário
**Configuração**:
- Authenticated: Yes
- User ID: `user-999`

**Operação**: `delete`

**Localização**: `/accounts/account-001`

**Dados Existentes**:
```json
{
  "userId": "user-123",
  "name": "User 123's Account",
  "accountType": "wallet_cash",
  "currency": "BRL",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000,
  "archived": false
}
```

**Resultado Esperado**: ❌ Negado (conta pertence a user-123)

---

## Resumo de Cobertura

### Operações Testadas
- ✅ CREATE (7 cenários válidos, 10 cenários inválidos)
- ✅ READ (1 cenário válido, 1 cenário inválido)
- ✅ UPDATE (2 cenários válidos, 2 cenários inválidos)
- ✅ DELETE (1 cenário válido, 1 cenário inválido)

### Validações Cobertas
- ✅ Autenticação
- ✅ Autorização (ownership)
- ✅ Campos obrigatórios
- ✅ Tipos de dados
- ✅ Coerência de campos por tipo de conta
- ✅ Imutabilidade de campos críticos
- ✅ Validação de enums
- ✅ Validação de ranges (closingDay, dueDay, last4)
- ✅ Regras de negócio (billing obrigatório para crédito, etc.)

## Checklist de Execução

- [ ] TC-001 a TC-007: Testes que devem passar
- [ ] TC-101 a TC-115: Testes que devem falhar
- [ ] Verificar logs de erro no console
- [ ] Confirmar mensagens de erro apropriadas
- [ ] Deploy das rules em staging antes de produção

## Notas
- Todos os timestamps devem ser valores int (milliseconds)
- O userId deve corresponder ao UID do Firebase Auth
- Em produção, usar valores reais de timestamp com `Date.now()`
