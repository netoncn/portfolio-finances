# AI Usage Tracking & Quota Management

Sistema completo de rastreamento de uso e gerenciamento de quotas para funcionalidades de IA (LLM).

## 🎯 Visão Geral

Este módulo fornece:
- **Tracking automático** de uso de IA (tokens, requisições, custos)
- **Sistema de quotas** por usuário com limites configuráveis
- **Cálculo de custos** baseado no modelo e tokens utilizados
- **Proteção contra overuse** com verificação automática de quotas
- **APIs REST** para consulta de uso e quotas

## 📊 Estrutura

```
src/domain/ai-usage/
├── types/
│   └── usage.ts              # Tipos e interfaces
├── services/
│   ├── usage-tracking.service.ts    # Tracking e gerenciamento de quotas
│   └── ai-service-wrapper.service.ts # Wrapper para chamadas de IA
├── index.ts                  # Exportações
└── README.md                 # Esta documentação
```

## 🔧 Componentes Principais

### 1. **UsageTrackingService**

Gerencia tracking de uso e quotas.

**Principais métodos:**
- `recordUsage()` - Registra uso de IA
- `checkQuota()` - Verifica se usuário pode usar IA
- `getOrCreateQuota()` - Obtém ou cria quota do usuário
- `updateUserPlan()` - Atualiza plano do usuário
- `calculateCost()` - Calcula custo baseado em tokens

### 2. **AIServiceWrapper**

Wrapper que integra tracking com providers de IA.

**Principais métodos:**
- `generateText()` - Gera texto com tracking automático
- `generateJSON()` - Gera JSON com tracking automático
- `canUseAI()` - Verifica se usuário pode usar IA
- `getRemainingQuota()` - Obtém quota restante

## 💰 Planos e Quotas

### Planos Disponíveis

| Plano | Requests/mês | Tokens/mês | Custo máximo/mês | Alert threshold |
|-------|--------------|------------|------------------|-----------------|
| **Free** | 50 | 50,000 | $1.00 | 80% |
| **Basic** | 500 | 500,000 | $10.00 | 80% |
| **Premium** | 5,000 | 5,000,000 | $100.00 | 90% |
| **Unlimited** | ∞ | ∞ | ∞ | 95% |

### Preços por Modelo

#### OpenAI (USD cents per 1K tokens)
- **gpt-4o**: $0.25 (prompt) / $1.00 (completion)
- **gpt-4o-mini**: $0.015 (prompt) / $0.060 (completion)
- **gpt-3.5-turbo**: $0.050 (prompt) / $0.150 (completion)

#### Anthropic Claude
- **claude-3-5-sonnet**: $0.30 (prompt) / $1.50 (completion)
- **claude-3-opus**: $1.50 (prompt) / $7.50 (completion)
- **claude-3-haiku**: $0.025 (prompt) / $0.125 (completion)

#### Google Gemini
- **gemini-1.5-pro**: $0.125 (prompt) / $0.500 (completion)
- **gemini-1.5-flash**: $0.0075 (prompt) / $0.030 (completion)

## 🔐 Uso

### Integração Automática

O sistema é **automaticamente integrado** nos serviços de IA:

✅ `ChatService` - Chat financeiro
✅ `AIClassifier` - Classificação de transações
✅ `AIInsightsService` - Geração de insights

**Nenhuma configuração adicional necessária!**

### Uso Manual (avançado)

```typescript
import { AIServiceWrapper } from "@/domain/ai-usage";

// Gerar texto com tracking
const result = await AIServiceWrapper.generateText(
  userId,
  "chat", // feature type
  messages,
  {
    temperature: 0.7,
    maxTokens: 500,
  },
  {
    // metadata opcional
    month: "2025-11",
  },
);

// Verificar se usuário pode usar IA
const { allowed, reason } = await AIServiceWrapper.canUseAI(userId);

if (!allowed) {
  console.log(`Blocked: ${reason}`);
}

// Obter quota restante
const remaining = await AIServiceWrapper.getRemainingQuota(userId);
console.log(`Remaining: ${remaining.requests} requests, ${remaining.tokens} tokens`);
```

### Gerenciar Quotas

```typescript
import { UsageTrackingService } from "@/domain/ai-usage";

// Atualizar plano do usuário
await UsageTrackingService.updateUserPlan(userId, "premium");

// Bloquear usuário
await UsageTrackingService.blockUser(userId, "Payment overdue");

// Desbloquear usuário
await UsageTrackingService.unblockUser(userId);

// Resetar quota (início de novo período)
await UsageTrackingService.resetQuota(userId);
```

## 📡 API Endpoints

### GET /api/ai-usage

Retorna uso e quota atual do usuário autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "quota": {
      "plan": "free",
      "period": "2025-11",
      "periodStart": 1730419200000,
      "periodEnd": 1733011199999,
      "limits": {
        "requests": 50,
        "tokens": 50000,
        "cost": 100
      },
      "current": {
        "requests": 12,
        "tokens": 8500,
        "cost": 25
      },
      "remaining": {
        "requests": 38,
        "tokens": 41500,
        "cost": 75
      },
      "usage": {
        "requests": 12,
        "tokens": 8500,
        "cost": 25,
        "requestsPercent": 24.0,
        "tokensPercent": 17.0,
        "costPercent": 25.0
      },
      "status": {
        "allowed": true,
        "isBlocked": false,
        "alertThreshold": 80
      }
    }
  }
}
```

### GET /api/ai-usage/history

Retorna histórico de uso do usuário.

**Query Parameters:**
- `period` (optional): YYYY-MM format (default: current month)
- `limit` (optional): Max records (default: 100, max: 500)
- `feature` (optional): Filter by feature type

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2025-11",
    "records": [
      {
        "id": "...",
        "userId": "...",
        "feature": "chat",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "promptTokens": 150,
        "completionTokens": 80,
        "totalTokens": 230,
        "estimatedCost": 3,
        "currency": "USD",
        "timestamp": 1730500000000,
        "success": true
      }
    ],
    "summary": {
      "totalRequests": 12,
      "successfulRequests": 12,
      "failedRequests": 0,
      "totalTokens": 8500,
      "totalCost": 25,
      "byFeature": {
        "chat": { "requests": 8, "tokens": 6000, "cost": 18 },
        "classification": { "requests": 3, "tokens": 2000, "cost": 5 },
        "insights": { "requests": 1, "tokens": 500, "cost": 2 }
      },
      "byProvider": {
        "openai": { "requests": 10, "tokens": 7500, "cost": 22 },
        "anthropic": { "requests": 2, "tokens": 1000, "cost": 3 }
      }
    },
    "count": 12
  }
}
```

## 🎨 Tipos de Features

```typescript
type AIFeatureType =
  | "chat"            // Chat financeiro
  | "classification"  // Classificação de transações
  | "insights"        // Geração de insights
  | "review";         // Processamento de fila de revisão
```

## 🚨 Sistema de Alertas

O sistema monitora o uso e pode gerar alertas quando:

1. **Threshold atingido**: Quando uso atinge o threshold configurado (ex: 80%)
2. **Quota excedida**: Quando qualquer limite é ultrapassado
3. **Requisições bloqueadas**: Quando usuário tenta usar IA após bloqueio

### Exemplo de Bloqueio

```typescript
// Quando quota é excedida, o sistema automaticamente bloqueia:
throw new Error("Monthly request limit exceeded");
// ou
throw new Error("Monthly token limit exceeded");
// ou
throw new Error("Monthly cost limit exceeded");
```

## 💾 Modelo de Dados

### AIUsageRecord

Registra cada chamada de IA:

```typescript
interface AIUsageRecord {
  id: string;
  userId: string;
  feature: AIFeatureType;
  provider: LLMProviderType;
  model: string;

  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  estimatedCost: number; // in USD cents
  currency: "USD";

  timestamp: number;
  responseTime?: number; // in ms
  success: boolean;
  errorMessage?: string;

  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}
```

### UserQuota

Gerencia quotas por usuário:

```typescript
interface UserQuota {
  id: string;
  userId: string;

  // Limites (por mês)
  maxRequestsPerMonth: number;
  maxTokensPerMonth: number;
  maxCostPerMonth: number; // in USD cents

  // Uso atual (reseta mensalmente)
  currentRequests: number;
  currentTokens: number;
  currentCost: number;

  // Período
  currentPeriod: string; // YYYY-MM
  periodStartDate: number;
  periodEndDate: number;

  // Status
  isBlocked: boolean;
  blockReason?: string;
  alertThreshold: number; // percentage (80 = 80%)
  lastAlertSent?: number;

  // Plano
  plan: "free" | "basic" | "premium" | "unlimited";
  customLimits?: boolean;

  createdAt: number;
  updatedAt: number;
}
```

## 🔄 Reset Automático de Quota

As quotas são **automaticamente resetadas** no início de cada mês:

- Quando um usuário faz uma requisição em um novo mês, o sistema:
  1. Detecta que o período expirou
  2. Reseta automaticamente os contadores (requests, tokens, cost)
  3. Atualiza o período para o mês atual
  4. Permite a requisição

## 📈 Análises e Relatórios

O sistema permite análises detalhadas:

```typescript
// Por feature
const chatUsage = summary.byFeature.chat;
console.log(`Chat: ${chatUsage.requests} requests, $${chatUsage.cost/100}`);

// Por provider
const openaiUsage = summary.byProvider.openai;
console.log(`OpenAI: ${openaiUsage.tokens} tokens`);

// Percentuais
const usage = quotaCheck.usage;
console.log(`Used ${usage.requestsPercent}% of requests`);
console.log(`Used ${usage.tokensPercent}% of tokens`);
console.log(`Used ${usage.costPercent}% of budget`);
```

## 🛡️ Segurança

- ✅ Verificação de quota **antes** de cada chamada de IA
- ✅ Tracking **automático** de uso
- ✅ Proteção contra **overuse**
- ✅ Bloqueio automático quando limites são excedidos
- ✅ Logs detalhados de uso e erros
- ✅ Isolamento por usuário (cada usuário tem sua própria quota)

## 📝 Logs

O sistema gera logs detalhados:

```
INFO: AI usage recorded { userId, feature: 'chat', tokens: 230, cost: 3 }
WARN: User approaching quota limit { userId, requestsPercent: 85 }
WARN: AI request blocked due to quota { userId, feature: 'chat', reason: 'Monthly request limit exceeded' }
ERROR: AI request failed { userId, feature: 'classification', errorMessage: '...' }
```

## 🚀 Próximos Passos

- [ ] Dashboard UI para visualização de uso
- [ ] Alertas por email quando threshold é atingido
- [ ] Sistema de billing/pagamento
- [ ] Quotas customizadas por cliente enterprise
- [ ] Análises preditivas de uso
- [ ] Cache de respostas para reduzir custos
- [ ] Rate limiting por janela de tempo (além de mensal)

## 🤝 Integrações

O sistema está integrado com:

- ✅ **ChatService** - Tracking automático de chats
- ✅ **AIClassifier** - Tracking de classificações
- ✅ **AIInsightsService** - Tracking de insights
- ✅ **LLM Providers** - OpenAI, Anthropic, Google
- ✅ **Firebase Firestore** - Armazenamento de dados
- ✅ **Logger** - Logs estruturados

## 📚 Referências

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Google AI Pricing](https://ai.google.dev/pricing)
