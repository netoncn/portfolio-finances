# Firestore Security Rules - Accounts Collection

## Visão Geral

As regras de segurança do Firestore para a coleção `accounts` garantem que:

1. **Autenticação**: Apenas usuários autenticados podem acessar contas
2. **Autorização**: Usuários só podem acessar suas próprias contas
3. **Validação de Schema**: Todos os campos obrigatórios estão presentes e válidos
4. **Coerência de Dados**: As regras de negócio são respeitadas (ex: cartões de crédito devem ter billing)
5. **Imutabilidade**: Campos críticos (userId, createdAt) não podem ser alterados

## Regras Implementadas

### 1. Funções Helper

#### `isValidAccountType(type)`
Valida que o tipo de conta está entre os permitidos:
- `card_credit` - Cartão de Crédito
- `card_debit` - Cartão de Débito
- `prepaid` - Pré-pago
- `wallet_cash` - Carteira
- `bank_checking` - Conta Corrente
- `bank_savings` - Conta Poupança

#### `isValidCardBrand(brand)`
Valida que a bandeira do cartão está entre as permitidas:
- `visa`, `mastercard`, `amex`, `elo`, `hipercard`
- `vr`, `sodexo`, `alelo`, `other`

#### `isCardType(type)` e `isCreditCard(type)`
Verificam se o tipo de conta é um cartão ou especificamente um cartão de crédito.

#### `isBankOrWallet(type)`
Verifica se o tipo é conta bancária ou carteira.

### 2. Validação de Campos Obrigatórios

#### `hasRequiredAccountFields(data)`
Garante que todos os campos obrigatórios estão presentes:
- `userId` (string) - ID do usuário proprietário
- `name` (string, mín. 2 caracteres) - Nome da conta
- `accountType` (enum) - Tipo de conta válido
- `currency` (literal "BRL") - Moeda
- `createdAt` (int) - Timestamp de criação
- `updatedAt` (int) - Timestamp de última atualização
- `archived` (bool) - Estado de arquivamento

#### `hasValidBilling(data)`
Valida a estrutura de faturamento para cartões de crédito:
- `closingDay` (int, 1-28) - Dia do fechamento
- `dueDay` (int, 1-28) - Dia do vencimento
- `closingDay` ≠ `dueDay` - Devem ser diferentes
- `creditLimit` (int, opcional) - Limite de crédito
- `availableCredit` (int, opcional) - Crédito disponível

### 3. Validação de Coerência

#### `accountFieldsAreCoherent(data)`
Garante que os campos fazem sentido para o tipo de conta:

**Para Cartões** (`card_credit`, `card_debit`, `prepaid`):
- ✅ DEVEM ter `cardBrand` válida
- ✅ `last4` deve ter 2-4 dígitos (se presente)

**Para Cartões de Crédito** (`card_credit`):
- ✅ DEVEM ter `billing` válido

**Para Contas Bancárias/Carteiras** (`bank_checking`, `bank_savings`, `wallet_cash`):
- ❌ NÃO devem ter `billing`
- ❌ NÃO devem ter `cardBrand`
- ❌ NÃO devem ter `last4` (ou deve ser string vazia)

**Campos Opcionais**:
- `benefits` deve ser um map (se presente)

### 4. Imutabilidade

#### `accountImmutableFieldsUnchanged()`
Garante que campos críticos não sejam alterados em updates:
- `userId` - Nunca pode ser alterado
- `createdAt` - Nunca pode ser alterado

## Operações Permitidas

### CREATE (allow create)
```javascript
allow create: if isOwnerNew()
  && hasRequiredAccountFields(request.resource.data)
  && accountFieldsAreCoherent(request.resource.data);
```

**Requisitos**:
1. Usuário autenticado
2. `userId` do documento = `uid` do usuário autenticado
3. Todos os campos obrigatórios presentes e válidos
4. Campos coerentes com o tipo de conta

### READ (allow read)
```javascript
allow read: if isOwnerDoc();
```

**Requisitos**:
1. Usuário autenticado
2. `userId` do documento = `uid` do usuário autenticado

### UPDATE (allow update)
```javascript
allow update: if isOwnerDoc()
  && isOwnerNew()
  && sameUserIdOnUpdate()
  && accountImmutableFieldsUnchanged()
  && hasRequiredAccountFields(request.resource.data)
  && accountFieldsAreCoherent(request.resource.data);
```

**Requisitos**:
1. Usuário autenticado
2. Documento original pertence ao usuário
3. Documento atualizado ainda pertence ao mesmo usuário
4. `userId` não foi alterado
5. Campos imutáveis não foram alterados
6. Todos os campos obrigatórios ainda presentes e válidos
7. Campos ainda coerentes com o tipo de conta

### DELETE (allow delete)
```javascript
allow delete: if isOwnerDoc();
```

**Requisitos**:
1. Usuário autenticado
2. `userId` do documento = `uid` do usuário autenticado

## Testes Manuais

### Teste 1: Criar Cartão de Crédito Válido ✅
```javascript
// Autenticado como user1
db.collection('accounts').add({
  userId: 'user1',
  name: 'Nubank Gold',
  accountType: 'card_credit',
  currency: 'BRL',
  cardBrand: 'mastercard',
  last4: '1234',
  billing: {
    closingDay: 15,
    dueDay: 25,
    creditLimit: 5000,
    availableCredit: 5000
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false
});
// DEVE PERMITIR
```

### Teste 2: Criar Cartão de Crédito SEM billing ❌
```javascript
// Autenticado como user1
db.collection('accounts').add({
  userId: 'user1',
  name: 'Nubank Gold',
  accountType: 'card_credit',
  currency: 'BRL',
  cardBrand: 'mastercard',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false
});
// DEVE NEGAR - Cartão de crédito precisa de billing
```

### Teste 3: Criar Carteira COM billing ❌
```javascript
// Autenticado como user1
db.collection('accounts').add({
  userId: 'user1',
  name: 'Carteira Física',
  accountType: 'wallet_cash',
  currency: 'BRL',
  billing: { closingDay: 15, dueDay: 25 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false
});
// DEVE NEGAR - Carteiras não devem ter billing
```

### Teste 4: Criar Conta SEM cardBrand ❌
```javascript
// Autenticado como user1
db.collection('accounts').add({
  userId: 'user1',
  name: 'Cartão Débito',
  accountType: 'card_debit',
  currency: 'BRL',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false
});
// DEVE NEGAR - Cartões precisam de cardBrand
```

### Teste 5: Ler Conta de Outro Usuário ❌
```javascript
// Autenticado como user1, tentando ler conta de user2
db.collection('accounts').doc('account_of_user2').get();
// DEVE NEGAR - Só pode ler suas próprias contas
```

### Teste 6: Update com userId Alterado ❌
```javascript
// Autenticado como user1
db.collection('accounts').doc('my_account').update({
  userId: 'user2',  // Tentando mudar o dono
  name: 'Updated Name'
});
// DEVE NEGAR - userId é imutável
```

### Teste 7: Update com createdAt Alterado ❌
```javascript
// Autenticado como user1
db.collection('accounts').doc('my_account').update({
  createdAt: Date.now(),  // Tentando mudar timestamp
  name: 'Updated Name'
});
// DEVE NEGAR - createdAt é imutável
```

### Teste 8: Update Válido de Nome ✅
```javascript
// Autenticado como user1
db.collection('accounts').doc('my_account').update({
  name: 'Novo Nome',
  updatedAt: Date.now()
});
// DEVE PERMITIR
```

### Teste 9: Criar Conta com billing.closingDay = billing.dueDay ❌
```javascript
// Autenticado como user1
db.collection('accounts').add({
  userId: 'user1',
  name: 'Cartão Inválido',
  accountType: 'card_credit',
  currency: 'BRL',
  cardBrand: 'visa',
  billing: {
    closingDay: 15,
    dueDay: 15  // Mesmo dia!
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false
});
// DEVE NEGAR - closingDay deve ser diferente de dueDay
```

### Teste 10: Criar Conta com Nome Muito Curto ❌
```javascript
// Autenticado como user1
db.collection('accounts').add({
  userId: 'user1',
  name: 'A',  // Menos de 2 caracteres
  accountType: 'wallet_cash',
  currency: 'BRL',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false
});
// DEVE NEGAR - Nome deve ter no mínimo 2 caracteres
```

## Testes Automatizados (Setup Futuro)

Para implementar testes automatizados no futuro, instalar:

```bash
pnpm add -D @firebase/rules-unit-testing
```

E criar arquivo `__tests__/firestore.rules.test.ts`:

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { setLogLevel } from 'firebase/firestore';

// Silenciar logs durante testes
setLogLevel('error');

describe('Firestore Security Rules - Accounts', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('CREATE operations', () => {
    it('should allow creating a valid credit card', async () => {
      const user1 = testEnv.authenticatedContext('user1');
      await assertSucceeds(
        user1.firestore().collection('accounts').add({
          userId: 'user1',
          name: 'Nubank Gold',
          accountType: 'card_credit',
          currency: 'BRL',
          cardBrand: 'mastercard',
          billing: { closingDay: 15, dueDay: 25 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          archived: false,
        })
      );
    });

    it('should deny creating credit card without billing', async () => {
      const user1 = testEnv.authenticatedContext('user1');
      await assertFails(
        user1.firestore().collection('accounts').add({
          userId: 'user1',
          name: 'Invalid Card',
          accountType: 'card_credit',
          currency: 'BRL',
          cardBrand: 'visa',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          archived: false,
        })
      );
    });

    // ... mais testes
  });

  describe('READ operations', () => {
    it('should allow reading own account', async () => {
      const user1 = testEnv.authenticatedContext('user1');
      const ref = await user1.firestore().collection('accounts').add({
        userId: 'user1',
        name: 'My Account',
        accountType: 'wallet_cash',
        currency: 'BRL',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
      });

      await assertSucceeds(ref.get());
    });

    it('should deny reading another user account', async () => {
      const user1 = testEnv.authenticatedContext('user1');
      const user2 = testEnv.authenticatedContext('user2');

      const ref = await user1.firestore().collection('accounts').add({
        userId: 'user1',
        name: 'User1 Account',
        accountType: 'wallet_cash',
        currency: 'BRL',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
      });

      await assertFails(user2.firestore().collection('accounts').doc(ref.id).get());
    });
  });

  // ... mais testes para UPDATE e DELETE
});
```

## Scripts para Deploy

### Deploy apenas das rules:
```bash
pnpm deploy:rules
```

### Testar rules localmente com Firebase Emulator:
```bash
firebase emulators:start --only firestore
```

## Monitoramento

Para monitorar violações de segurança em produção:

1. Acessar Firebase Console > Firestore > Rules
2. Verificar métricas de rejeições
3. Analisar logs de auditoria

## Referências

- [Firebase Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Rules Language Reference](https://firebase.google.com/docs/rules/rules-language)
