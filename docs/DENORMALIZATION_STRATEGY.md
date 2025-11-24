# Estratégia de Denormalização - Transactions

## Visão Geral

A denormalização é uma técnica de design de banco de dados onde copiamos dados de uma entidade para outra para melhorar performance de queries. No Finance AI, usamos denormalização **controlada e segura** entre Account e Transaction.

## Campos Denormalizados

### De Account → Transaction

Quando uma transação é criada, os seguintes campos são **copiados** da conta para a transação:

```typescript
{
  accountType: AccountType;  // Ex: "card_credit", "wallet_cash", etc.
  cardBrand?: CardBrand;     // Ex: "visa", "mastercard", etc.
}
```

## Por que Denormalizar?

### 1. **Performance de Queries**

**❌ Sem Denormalização** (requer JOIN):
```typescript
// Precisaria buscar todas as transactions
const transactions = await getTransactions(userId);

// Depois buscar cada account para filtrar
const creditCardTransactions = [];
for (const tx of transactions) {
  const account = await getAccount(tx.accountId);
  if (account.accountType === 'card_credit') {
    creditCardTransactions.push(tx);
  }
}
// N+1 queries! 😱
```

**✅ Com Denormalização**:
```typescript
// Query direta com índice
const creditCardTransactions = await TransactionService.listByAccountType(
  userId,
  'card_credit'
);
// 1 query! 🚀
```

### 2. **Preservação Histórica**

Se um cartão muda de bandeira (ex: migração de Elo para Mastercard):

- ✅ **Com denormalização**: Transações antigas mantêm a bandeira original
- ❌ **Sem denormalização**: Todas as transações "mentiriam" sobre a bandeira usada

**Exemplo**:
```typescript
// Janeiro 2025: Cartão era Elo
await createTransaction({
  accountId: 'card-123',
  accountType: 'card_credit',  // Copiado da conta
  cardBrand: 'elo',            // Snapshot: era Elo em Jan/2025
  // ...
});

// Fevereiro 2025: Troco para Mastercard
await updateAccount('card-123', {
  cardBrand: 'mastercard'  // Agora é Mastercard
});

// Março 2025: Nova transação
await createTransaction({
  accountId: 'card-123',
  accountType: 'card_credit',
  cardBrand: 'mastercard',     // Snapshot: é Mastercard em Mar/2025
  // ...
});

// Resultado: Histórico correto!
// - Transações de Jan/2025 mostram "elo"
// - Transações de Mar/2025 mostram "mastercard"
```

### 3. **Análises e Relatórios**

Queries complexas ficam simples:

```typescript
// Quanto gastei em cartões de crédito Visa em 2024?
const transactions = await db
  .collection('transactions')
  .where('userId', '==', userId)
  .where('accountType', '==', 'card_credit')
  .where('cardBrand', '==', 'visa')
  .where('date', '>=', startOf2024)
  .where('date', '<', endOf2024)
  .get();

// SEM denormalização, isso seria impraticável!
```

## Trade-offs

### Vantagens ✅

1. **Performance**: Queries 10-100x mais rápidas
2. **Simplicidade**: Menos código, menos JOINs
3. **Histórico preciso**: Dados refletem estado no momento da transação
4. **Índices eficientes**: Firestore pode indexar diretamente
5. **Análises rápidas**: Agregações sem lookups

### Desvantagens ❌

1. **Dados duplicados**: Mais espaço de armazenamento
2. **Potencial inconsistência**: Se não gerenciado corretamente
3. **Migração de dados**: Mudanças de schema são mais complexas

## Quando Atualizar Campos Denormalizados

### Regra Geral: **NÃO atualizar automaticamente**

**❌ Não fazer**:
```typescript
// Quando account muda, NÃO atualizar todas as transactions antigas
await updateAccount(accountId, { cardBrand: 'mastercard' });
// NÃO fazer isso:
await updateAllTransactions(accountId, { cardBrand: 'mastercard' });
```

**Por quê?** Perderia a precisão histórica.

### Exceções: Quando atualizar

#### 1. **Correção de Erros**

Se uma conta foi criada com tipo errado:

```typescript
// Conta foi criada como "card_debit" por engano, mas é "card_credit"
await AccountService.update({
  id: accountId,
  accountType: 'card_credit',  // Correção
});

// Corrigir transações também (foram todas incorretas)
await TransactionService.refreshDenormalizedFieldsByAccount(accountId, userId);
```

#### 2. **Mudança de accountId em Transaction**

Se mover transação para outra conta:

```typescript
// Service já faz isso automaticamente!
await TransactionService.update({
  id: transactionId,
  accountId: newAccountId,  // Mudou de conta
});
// accountType e cardBrand são atualizados automaticamente
```

## Implementação

### Arquivo: `denormalization.helper.ts`

```typescript
/**
 * Extrai campos denormalizados da Account
 */
export function extractDenormalizedFields(account: Account) {
  return {
    accountType: account.accountType,
    cardBrand: account.cardBrand,
  };
}

/**
 * Valida se campos denormalizados estão atualizados
 */
export function validateDenormalizedFields(
  transaction: DenormalizedAccountFields,
  account: Account
): boolean {
  return (
    transaction.accountType === account.accountType &&
    transaction.cardBrand === account.cardBrand
  );
}
```

### Arquivo: `transaction.service.ts`

```typescript
/**
 * CREATE: Copia campos automaticamente
 */
static async create(dto: CreateTransactionDTO) {
  const account = await AccountService.getById(dto.accountId, dto.userId);
  const denormalizedFields = extractDenormalizedFields(account);

  const transactionData = {
    ...dto,
    ...denormalizedFields,  // Override com dados reais da conta
    // ...
  };
  // ...
}

/**
 * UPDATE: Atualiza se accountId mudar
 */
static async update(dto: UpdateTransactionDTO) {
  if (updates.accountId && updates.accountId !== data.accountId) {
    const account = await AccountService.getById(updates.accountId, userId);
    const denormalizedFields = extractDenormalizedFields(account);

    updatedData = {
      ...updatedData,
      ...denormalizedFields,  // Atualiza com nova conta
    };
  }
  // ...
}
```

## Manutenção e Migração

### Detectar Dados Desatualizados

```typescript
const transaction = await TransactionService.getById(txId, userId);
const account = await AccountService.getById(transaction.accountId, userId);

if (needsDenormalizationRefresh(transaction, account)) {
  console.warn('Transaction has stale denormalized data', {
    transactionId: transaction.id,
    current: {
      accountType: transaction.accountType,
      cardBrand: transaction.cardBrand,
    },
    actual: {
      accountType: account.accountType,
      cardBrand: account.cardBrand,
    }
  });
}
```

### Script de Migração

Para corrigir dados em massa (usar com cuidado!):

```typescript
// scripts/fix-denormalized-data.ts
import { TransactionService } from '@/domain/transactions';
import { AccountService } from '@/domain/accounts';

async function fixDenormalizedData(userId: string) {
  const accounts = await AccountService.listByUser(userId);

  for (const account of accounts) {
    const updated = await TransactionService.refreshDenormalizedFieldsByAccount(
      account.id,
      userId
    );
    console.log(`Account ${account.id}: ${updated} transactions updated`);
  }
}
```

## Índices Necessários

Para aproveitar a denormalização, criar índices compostos:

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "accountType", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "cardBrand", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "accountType", "order": "ASCENDING"},
        {"fieldPath": "cardBrand", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "DESCENDING"}
      ]
    }
  ]
}
```

Deploy:
```bash
pnpm deploy:indexes
```

## Testes

### Teste 1: Create copia campos
```typescript
test('should copy denormalized fields on create', async () => {
  const account = await AccountService.create({
    userId: 'user-1',
    name: 'Nubank',
    accountType: 'card_credit',
    cardBrand: 'mastercard',
    // ...
  });

  const transaction = await TransactionService.create({
    userId: 'user-1',
    accountId: account.id,
    // NÃO fornece accountType ou cardBrand
    // ...
  });

  expect(transaction.accountType).toBe('card_credit');
  expect(transaction.cardBrand).toBe('mastercard');
});
```

### Teste 2: Update mantém campos se accountId não muda
```typescript
test('should preserve denormalized fields if accountId unchanged', async () => {
  const transaction = await TransactionService.create({
    userId: 'user-1',
    accountId: 'account-1',
    // accountType: 'card_credit', cardBrand: 'visa' (copiados)
  });

  // Conta muda depois
  await AccountService.update({
    id: 'account-1',
    cardBrand: 'mastercard',  // Mudou!
  });

  // Atualiza descrição da transaction
  const updated = await TransactionService.update({
    id: transaction.id,
    userId: 'user-1',
    description: 'New description',
  });

  // Campos denormalizados NÃO mudam (preserva histórico)
  expect(updated.cardBrand).toBe('visa');  // Ainda 'visa'!
});
```

### Teste 3: Update atualiza campos se accountId muda
```typescript
test('should refresh denormalized fields if accountId changes', async () => {
  const account2 = await AccountService.create({
    userId: 'user-1',
    name: 'Itaú',
    accountType: 'card_debit',
    cardBrand: 'visa',
  });

  const transaction = await TransactionService.create({
    userId: 'user-1',
    accountId: 'account-1',  // mastercard
  });

  // Move para outra conta
  const updated = await TransactionService.update({
    id: transaction.id,
    userId: 'user-1',
    accountId: account2.id,  // Mudou de conta!
  });

  // Campos denormalizados MUDAM para nova conta
  expect(updated.accountType).toBe('card_debit');
  expect(updated.cardBrand).toBe('visa');
});
```

## Boas Práticas

### ✅ DO

1. **Sempre copie via helper**
   ```typescript
   const denormalized = extractDenormalizedFields(account);
   ```

2. **Use service methods**
   ```typescript
   await TransactionService.create(dto);  // Copia automaticamente
   ```

3. **Valide em migrações**
   ```typescript
   if (needsDenormalizationRefresh(tx, account)) {
     await refreshDenormalizedFields(tx.id, userId);
   }
   ```

4. **Documente quando atualizar**
   - Adicionar comentário explicando por que está atualizando campos históricos

### ❌ DON'T

1. **Nunca atualize manualmente todas as transactions quando account muda**
   ```typescript
   // ❌ NÃO FAZER
   await updateAccount(accountId, { cardBrand: 'mastercard' });
   await db.collection('transactions')
     .where('accountId', '==', accountId)
     .update({ cardBrand: 'mastercard' });
   ```

2. **Nunca confie apenas em denormalização**
   - Sempre mantenha `accountId` como fonte de verdade
   - Campos denormalizados são **cache** para performance

3. **Nunca esqueça índices**
   - Denormalização sem índices = desperdício de espaço

## Monitoramento

Criar alertas para:

1. **Alto % de dados desatualizados**
   ```typescript
   const staleCount = await countStaleTransactions(userId);
   if (staleCount > totalCount * 0.1) {
     alert('More than 10% of transactions have stale data');
   }
   ```

2. **Latência alta em queries denormalizadas**
   - Se queries por `accountType` estão lentas, verificar índices

3. **Tamanho da coleção crescendo rápido**
   - Denormalização aumenta tamanho ~10-20%

## Referências

- [Firestore Data Model Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [NoSQL Data Modeling Techniques](https://highlyscalable.wordpress.com/2012/03/01/nosql-data-modeling-techniques/)
- [Denormalization in Firebase](https://firebase.google.com/docs/firestore/solutions/aggregation)
