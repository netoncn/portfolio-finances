# Privacy System

Sistema de privacidade para proteger dados sensíveis antes de enviá-los para provedores de IA (LLMs).

## 🛡️ Funcionalidades

### 1. **Mascaramento de Dados Sensíveis** (Data Masking)

Detecta e mascara automaticamente:

- **CPF**: `123.456.789-00` → `***.456.***-**`
- **Email**: `user@example.com` → `u***.er@example.com`
- **Telefone BR**: `(11) 98765-4321` → `(11) ****-4321`
- **Telefone US**: `(555) 123-4567` → `(555) ****-4567`
- **SSN**: `123-45-6789` → `***-**-6789`
- **Cartão de Crédito**: `1234 5678 9012 3456` → `**** **** **** 3456`
- **Endereços**: `Rua das Flores, 123` → `Rua das Flores, ***`
- **Conta Bancária**: `12345-6` → `****5-*`

### 2. **Truncamento de Descrições** (Truncation)

Limita o tamanho de descrições longas para evitar envio de dados desnecessários:

```typescript
// Descrição > 150 caracteres (padrão)
"Esta é uma descrição muito longa que contém muitos detalhes desnecessários..."
→ "Esta é uma descrição muito longa que contém muitos..."
```

### 3. **Redlines** (Blocklist)

Bloqueia completamente termos extremamente sensíveis:

- Senhas e secrets: `password: abc123` → `[REDACTED]`
- Tokens de API: `api_key: sk-12345` → `[REDACTED]`
- Contas bancárias completas com agência
- Registros médicos
- Documentos de identidade com contexto

## 📖 Como Usar

### Uso Básico

```typescript
import { PrivacyService } from "@/lib/privacy";

// Sanitizar texto simples
const result = PrivacyService.sanitizeText(
  "Meu CPF é 123.456.789-00 e meu email é user@example.com"
);

console.log(result.sanitized);
// Output: "Meu CPF é ***.456.***-** e meu email é u***.er@example.com"

console.log(result.detectedTypes);
// Output: ["cpf", "email"]

console.log(result.modified);
// Output: true
```

### Sanitizar Transações

```typescript
import { PrivacyService } from "@/lib/privacy";

const transaction = {
  description: "Pagamento para João Silva - CPF: 123.456.789-00",
  merchant: "Loja ABC - Tel: (11) 98765-4321",
  tags: ["compras", "eletrônicos"],
};

const result = PrivacyService.sanitizeTransaction(transaction);

console.log(result.description);
// Output: "Pagamento para João Silva - CPF: ***.456.***-**"

console.log(result.merchant);
// Output: "Loja ABC - Tel: (11) ****-4321"
```

### Sanitizar Mensagens de Chat

```typescript
import { PrivacyService } from "@/lib/privacy";

const message = {
  content: "Meu número é (11) 98765-4321 e meu email é user@example.com",
  role: "user" as const,
};

const result = PrivacyService.sanitizeChatMessage(message);

console.log(result.content);
// Output: "Meu número é (11) ****-4321 e meu email é u***.er@example.com"
```

### Configuração Personalizada

```typescript
import { PrivacyService } from "@/lib/privacy";

const config = {
  enableMasking: true,
  enableTruncation: true,
  enableRedlines: true,
  maxDescriptionLength: 200, // Personalizado
  maskingLevel: "full" as const, // 'partial' ou 'full'
  customRedlines: [/senha:\s*\S+/gi], // Padrões customizados
};

const result = PrivacyService.sanitizeText("Texto com dados sensíveis", config);
```

## 🔧 Configuração

### Opções Disponíveis

```typescript
interface PrivacyConfig {
  enableMasking: boolean; // Padrão: true
  enableTruncation: boolean; // Padrão: true
  enableRedlines: boolean; // Padrão: true
  maxDescriptionLength: number; // Padrão: 150
  maskingLevel: "partial" | "full"; // Padrão: 'partial'
  customRedlines?: RegExp[]; // Opcional
}
```

### Níveis de Mascaramento

- **`partial`** (padrão): Mostra alguns caracteres
  - Exemplo: `123.456.789-00` → `***.456.***-**`
- **`full`**: Mascara tudo
  - Exemplo: `123.456.789-00` → `[MASKED]`

## 🎯 Onde é Usado

O sistema de privacidade é aplicado automaticamente em:

### 1. ChatService (`src/domain/chat/services/chat.service.ts`)

- ✅ Mensagens do usuário
- ✅ Descrições de transações recentes no contexto

### 2. AIClassifier (`src/lib/classification/ai-classifier.ts`)

- ✅ Descrições de transações para classificação
- ✅ Nomes de merchants
- ✅ Transações recentes no contexto

### 3. AIInsightsService (`src/domain/insights/services/ai-insights.service.ts`)

- ℹ️ **Não requer sanitização** - Envia apenas dados agregados (totais, categorias, porcentagens)

## 📊 Resultados da Sanitização

```typescript
interface SanitizationResult {
  sanitized: string; // Texto sanitizado
  original: string; // Texto original (para auditoria)
  modified: boolean; // Se foi modificado
  detectedTypes: string[]; // Tipos de dados detectados
  redlineViolations: string[]; // Violações de redlines
}
```

## 🧪 Exemplos de Teste

### Teste 1: Mascaramento de CPF

```typescript
const input = "O CPF do cliente é 123.456.789-00";
const result = PrivacyService.sanitizeText(input);

expect(result.sanitized).toBe("O CPF do cliente é ***.456.***-**");
expect(result.detectedTypes).toContain("cpf");
expect(result.modified).toBe(true);
```

### Teste 2: Redline de Senha

```typescript
const input = "Minha senha é password: secreto123";
const result = PrivacyService.sanitizeText(input);

expect(result.sanitized).toContain("[REDACTED]");
expect(result.redlineViolations.length).toBeGreaterThan(0);
```

### Teste 3: Truncamento

```typescript
const input = "A".repeat(200);
const result = PrivacyService.sanitizeText(input, {
  maxDescriptionLength: 100,
});

expect(result.sanitized.length).toBeLessThan(105); // 100 + "..."
expect(result.sanitized).toContain("...");
```

### Teste 4: Múltiplos Dados Sensíveis

```typescript
const input =
  "CPF: 123.456.789-00, Email: user@test.com, Tel: (11) 98765-4321";
const result = PrivacyService.sanitizeText(input);

expect(result.detectedTypes).toContain("cpf");
expect(result.detectedTypes).toContain("email");
expect(result.detectedTypes).toContain("phone_br");
expect(result.sanitized).not.toContain("123.456.789-00");
expect(result.sanitized).not.toContain("user@test.com");
expect(result.sanitized).not.toContain("98765-4321");
```

## 🔐 Segurança e Privacidade

### O que é protegido:

✅ Dados pessoais identificáveis (PII)
✅ Informações financeiras sensíveis
✅ Credenciais e secrets
✅ Informações médicas

### O que NÃO é enviado para a IA:

❌ CPFs completos
❌ Emails completos
❌ Telefones completos
❌ Números de cartão de crédito completos
❌ Senhas ou tokens
❌ Contas bancárias completas

### Logs e Auditoria

Quando dados sensíveis são detectados, o sistema registra:

```typescript
logger.warn("Sensitive data detected in transaction description", {
  types: ["cpf", "email"],
  redlines: ["password: ..."],
});
```

## 🚀 Próximos Passos

- [ ] Adicionar mais padrões internacionais (UK, EU)
- [ ] Suporte para PIX keys
- [ ] Detecção de CNH e RG brasileiro
- [ ] Dashboard de auditoria de privacidade
- [ ] Métricas de dados mascarados

## 📝 Notas

- Todos os dados originais são preservados localmente no banco de dados
- Apenas os dados **sanitizados** são enviados para provedores de IA externos
- O sistema de privacidade opera apenas no servidor (server-only)
- Logs de auditoria são gerados automaticamente quando dados sensíveis são detectados

## 📚 Referências

- [OWASP Privacy by Design](https://owasp.org/www-project-top-10-privacy-risks/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [GDPR - General Data Protection Regulation](https://gdpr.eu/)
