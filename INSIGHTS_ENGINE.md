# Insight Engine - AI Financial Analysis

## 📋 Visão Geral

Sistema completo de análise financeira inteligente que utiliza IA para gerar insights sobre padrões de gastos, identificar variações, alertas de orçamento e oportunidades de economia.

## 🎯 Features Implementadas

### 1. **Análise Mensal Automatizada**

#### Spending Analyzer Service
- ✅ **Top Gastos por Categoria**: Identifica as 5 principais categorias de despesas
- ✅ **Análise de Variações**: Compara gastos mês a mês por categoria
- ✅ **Detecção de Anomalias**: Identifica gastos anormalmente altos usando desvio padrão
- ✅ **Taxa de Poupança**: Calcula savings rate (income - expenses / income)
- ✅ **Tendências**: Identifica se categoria está em alta, baixa ou estável

#### Métricas Calculadas
- Total Income
- Total Expenses
- Net Balance
- Savings Rate (%)
- Transaction Count
- Variação vs Mês Anterior (% e valor)
- Variação vs Média Histórica (6 meses)
- Average Transaction por categoria
- Spending per category

### 2. **Insights Inteligentes com IA**

#### AI Insights Service
Usa LLM provider-agnostic para gerar insights contextuais:

**Tipos de Insights:**
- `spending_spike`: Gasto anormalmente alto detectado
- `spending_decrease`: Redução significativa de gastos
- `category_trend`: Tendência identificada em categoria
- `budget_warning`: Alerta de orçamento próximo/excedido
- `savings_opportunity`: Oportunidade de economia
- `recurring_pattern`: Padrão recorrente identificado
- `anomaly`: Anomalia detectada
- `achievement`: Meta atingida ou desempenho positivo

**Níveis de Severidade:**
- `success`: Conquistas e tendências positivas
- `info`: Observações neutras e padrões
- `warning`: Preocupações que precisam de atenção
- `alert`: Problemas críticos que requerem ação imediata

**Fallback sem IA:**
- Sistema gera insights baseados em regras quando IA não disponível
- Cobre casos mais comuns (savings rate, top spending, variações)
- Garante funcionalidade mesmo sem API key de LLM

### 3. **Sistema de Alertas Automáticos**

#### Tipos de Alertas
- **Budget Exceeded**: Orçamento excedido (≥100%)
- **Budget Warning**: Alerta de orçamento (≥80%)
- **Unusual Spending**: Gasto incomum (>50% de aumento)
- **Large Transaction**: Transações grandes detectadas (>$500)

#### Características
- Severity levels (info, warning, alert)
- Acknowledgement system
- Vinculado a categorias/budgets/transações
- Threshold tracking

### 4. **UI Components**

#### SpendingSummaryCard
- 4 cards resumindo finanças do mês:
  - Total Income
  - Total Expenses (com variação vs mês anterior)
  - Net Balance (com cor verde/vermelha)
  - Savings Rate (com avaliação Excellent/Good/Fair/Negative)

#### TopSpendingCard
- Top 5 categorias de gastos
- Progress bar visual
- Ícones de categoria
- Tendência (↑ up / ↓ down / stable)
- Percentage do total
- Transaction count

#### InsightCard
- Card colorido baseado em severity
- Ícones contextuais por tipo
- Título + descrição
- Action text quando aplicável
- Botão de dismiss
- Background e border colors diferentes por severity

#### AlertsCard
- Lista de alertas não reconhecidos
- Badge com severity
- Botão de acknowledge
- Conta total de alertas
- Auto-hide quando todos reconhecidos

#### Insights Page (`/insights`)
- Month navigator (prev/next)
- Summary cards no topo
- Alertas (se houver)
- Grid de insights 2 colunas
- Top spending card
- Loading states
- Error states
- Empty states

### 5. **API Endpoint**

```
GET /api/insights/:month
```

**Parameters:**
- `month`: YYYY-MM format (ex: 2025-01)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "month": "2025-01",
    "period": { "start": ..., "end": ... },
    "summary": {
      "totalIncome": 5000,
      "totalExpenses": 3500,
      "netBalance": 1500,
      "transactionCount": 45,
      "savingsRate": 30
    },
    "topSpending": [...],
    "categoryBreakdown": [...],
    "variations": {...},
    "insights": [...],
    "alerts": [...],
    "generatedAt": ...
  }
}
```

### 6. **Hooks**

#### `useInsights(month: string)`
- TanStack Query hook
- 5 minute stale time
- Auto-refetch disabled
- Loading/error states

#### Helper Functions
- `getCurrentMonth()`: Retorna mês atual em YYYY-MM
- `getPreviousMonth(month)`: Calcula mês anterior
- `formatMonth(month)`: Formata para display (ex: "January 2025")

## 🔄 Fluxo de Análise

```
1. Usuário acessa /insights
   ↓
2. Hook busca insights do mês selecionado
   ↓
3. API processa:
   a) Busca transações do período atual e anterior
   b) Busca categorias e budgets do usuário
   c) Calcula métricas (SpendingAnalyzer)
   d) Detecta anomalias e padrões
   e) Gera insights com IA (ou fallback)
   f) Cria alertas automáticos
   ↓
4. UI renderiza:
   - Summary cards
   - Alertas
   - Insights da IA
   - Top spending
   ↓
5. Usuário pode:
   - Navegar entre meses
   - Dismiss insights
   - Acknowledge alertas
   - Ver detalhes e ações sugeridas
```

## 🧠 Prompts da IA

### Contexto Fornecido
- Current month summary (income, expenses, balance, savings rate)
- Previous month comparison
- Top categories with amounts
- Significant changes (>20% variation)
- Budget status

### Guidelines para IA
1. Foco em padrões e mudanças mais significativas
2. Específico com números e percentagens
3. Recomendações acionáveis quando possível
4. Severidade apropriada
5. Títulos concisos (<60 chars)
6. Descrições informativas (<200 chars)
7. Action text específico (<50 chars)

### Exemplo de Prompt

```
Analyze the following financial data and generate 3-5 actionable insights:

**Current Month Summary:**
- Total Income: $5,000.00
- Total Expenses: $3,500.00
- Net Balance: $1,500.00
- Savings Rate: 30.0%

**Comparison to Previous Month:**
- Income Change: +5.0%
- Expense Change: +12.3%

**Top Spending Categories:**
- Housing: $1,200.00 (34.3%)
- Food: $600.00 (17.1%)
- Transportation: $450.00 (12.9%)

**Significant Changes:**
- Food: +$150.00 (+33.3%)

**Budget Status:**
- Food Budget: $650.00 / $700.00 (92.9%)

Please provide 3-5 insights in JSON format...
```

## 📊 Análises Específicas

### 1. Top Spending Analysis
- Top 5 categorias por valor absoluto
- Percentage do total de gastos
- Tendência vs mês anterior (>10% = up, <-10% = down)
- Transaction count
- Average per transaction

### 2. Variation Analysis
**vs Last Month:**
- Total change em valor e percentagem
- Change por categoria

**vs Average (6 meses):**
- Compara mês atual com média histórica
- Identifica se gasto está acima/abaixo do normal

### 3. Anomaly Detection
- Usa desvio padrão (threshold 2.5x)
- Detecta transações outliers
- Calcula % de desvio da média
- Requer mínimo 3 transações para análise

### 4. Budget Monitoring
- Calcula spending vs budget limit
- Alertas em 80% e 100%
- Suporta budgets com múltiplas categorias
- Tracking de orçamentos mensais

## 🎨 Design System

### Cores de Severity (Insights)
- **Success**: Green bg/border (bg-green-50, border-green-200)
- **Warning**: Yellow bg/border (bg-yellow-50, border-yellow-200)
- **Alert**: Red bg/border (bg-red-50, border-red-200)
- **Info**: Blue bg/border (bg-blue-50, border-blue-200)

### Ícones por Tipo
- `spending_spike`: TrendingUp
- `spending_decrease`: TrendingDown
- `category_trend`: ArrowUp
- `budget_warning`: AlertTriangle
- `savings_opportunity`: Lightbulb
- `achievement`: CheckCircle2
- `anomaly/default`: Info

### Savings Rate Colors
- ≥20%: Green (Excellent)
- 10-19%: Yellow (Good)
- 0-9%: Yellow (Fair)
- <0%: Red (Negative)

## 🚀 Como Usar

### 1. Configurar LLM Provider
```env
# .env
LLM_PROVIDER=openai  # ou anthropic, google
OPENAI_API_KEY=sk-...
```

### 2. Acessar Dashboard
```
http://localhost:3000/insights
```

### 3. Navegar Meses
- Use setas para voltar/avançar meses
- Botão "next" disabled para futuro

### 4. Interagir
- Dismiss insights que não são relevantes
- Acknowledge alertas
- Ler ações sugeridas
- Monitorar top gastos

## 🧪 Testing

### Testar Insights

1. **Adicionar transações** no mês atual
2. **Criar budgets** para categorias
3. **Acessar** `/insights`
4. **Verificar**:
   - Summary cards mostram valores corretos
   - Top spending lista categorias certas
   - Insights são relevantes
   - Alertas aparecem quando budget >80%
   - Navigation funciona

### Testar com IA Desabilitada
1. Remover API key do LLM provider
2. Verificar fallback insights funcionam
3. Confirmar que não há erros

### Testar Variações
1. Adicionar transações em meses diferentes
2. Navegar entre meses
3. Verificar variações são calculadas
4. Confirmar arrows (↑↓) aparecem corretamente

## 🔧 Arquitetura

```
src/
├── domain/insights/
│   ├── types/insight.ts           # Types e interfaces
│   └── services/
│       ├── spending-analyzer.service.ts   # Análise de gastos
│       ├── ai-insights.service.ts         # Geração de insights com IA
│       └── insights.service.ts            # Orquestrador principal
│
├── app/api/insights/[month]/route.ts  # API endpoint
│
├── app/(dashboard)/insights/page.tsx  # Página principal
│
├── components/insights/
│   ├── InsightCard.tsx           # Card de insight individual
│   ├── SpendingSummaryCard.tsx   # Cards de resumo
│   ├── TopSpendingCard.tsx       # Top categorias
│   └── AlertsCard.tsx            # Lista de alertas
│
└── hooks/use-insights.ts          # React Query hook
```

## 📈 Performance

- **Cache**: 5 minutos de stale time
- **Batch Processing**: Análises rodadas em paralelo
- **Lazy Loading**: Componentes carregam sob demanda
- **Fallback**: Insights sem IA quando provider indisponível
- **Historical Analysis**: Apenas últimos 6 meses para média

## 🎯 Próximos Passos

Possíveis melhorias futuras:
- [ ] Gráficos de tendência histórica
- [ ] Comparação ano a ano
- [ ] Export de relatório em PDF
- [ ] Notificações push para alertas
- [ ] Machine Learning para previsões
- [ ] Recomendações personalizadas
- [ ] Goals e targets tracking
- [ ] Benchmark vs outros usuários (anonimizado)
- [ ] Drill-down em insights (ver transações)
- [ ] Agendar relatórios mensais por email
