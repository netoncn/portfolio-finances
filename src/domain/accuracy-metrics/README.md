# Accuracy Metrics System

Sistema completo para medição e acompanhamento da acurácia de classificações de IA usando amostras rotuladas por humanos.

## 🎯 Visão Geral

Este módulo fornece:
- **Ground Truth Samples**: Coleta automática de amostras rotuladas de reviews humanos
- **Métricas de Acurácia**: Cálculo de accuracy, precision, recall e F1-score
- **Análise por Categoria**: Desempenho detalhado por categoria
- **Calibração de Confiança**: Verifica se scores de confiança correspondem à acurácia real
- **Recomendações de Threshold**: Sugere limiares ótimos para auto-classificação
- **Comparação de Modelos**: Compara performance entre diferentes modelos de IA

## 📊 Estrutura

```
src/domain/accuracy-metrics/
├── types/
│   └── metrics.ts                  # Tipos e interfaces
├── services/
│   ├── metrics.service.ts         # Cálculo de métricas
│   └── sample-collection.service.ts # Coleta de amostras
├── index.ts                        # Exportações
└── README.md                       # Esta documentação
```

## 🔧 Componentes Principais

### 1. **AccuracyMetricsService**

Calcula e gerencia métricas de acurácia.

**Principais métodos:**
- `calculateMetrics()` - Calcula métricas para um período
- `getMetrics()` - Obtém métricas calculadas
- `getMetricsSummary()` - Sumário para dashboard
- `getThresholdRecommendation()` - Recomenda threshold ótimo

### 2. **SampleCollectionService**

Coleta e gerencia amostras de ground truth.

**Principais métodos:**
- `createFromReview()` - Cria sample a partir de review
- `processReviewsToSamples()` - Processa reviews em batch
- `getCollectionStatus()` - Status da coleção de amostras
- `getSamples()` - Lista amostras coletadas

## 📈 Métricas Calculadas

### Métricas Gerais

- **Accuracy**: `(correct / total) * 100`
- **Precision**: Média ponderada por categoria
- **Recall**: Média ponderada por categoria
- **F1-Score**: `2 * (precision * recall) / (precision + recall)`

### Análise de Confiança

- **Average Confidence**: Confiança média de todas as predições
- **Confidence (Correct)**: Confiança média quando predição está correta
- **Confidence (Incorrect)**: Confiança média quando predição está errada
- **Calibration**: Quão bem a confiança corresponde à acurácia real

### Por Categoria

Para cada categoria:
- Número de samples
- Acurácia específica
- Top mispredictions (categorias mais confundidas)

### Por Modelo/Provider

- Samples, acurácia e confiança por modelo de IA
- Samples e acurácia por provider (OpenAI, Anthropic, Google)

### Confidence Buckets

Análise em faixas de confiança:
- 0.0-0.5, 0.5-0.6, 0.6-0.7, 0.7-0.8, 0.8-0.9, 0.9-1.0
- Samples e acurácia real em cada faixa

## 🔄 Fluxo Automático

### 1. Coleta de Amostras

Quando um usuário **aprova** ou **rejeita** um review:

```typescript
// Automático no ReviewQueueService
await ReviewQueueService.approveReview(id, userId, data);
// ↓ Automaticamente cria ground truth sample
await SampleCollectionService.createFromReview(review);
```

### 2. Cálculo de Métricas

Métricas podem ser calculadas on-demand ou em batch:

```typescript
// Calcular métricas para um mês
const metrics = await AccuracyMetricsService.calculateMetrics({
  userId: "user-123",
  period: "2025-11",
  minSamples: 10, // Mínimo de samples necessários
});
```

### 3. Visualização

```typescript
// Obter sumário para dashboard
const summary = await AccuracyMetricsService.getMetricsSummary(userId);
// Retorna histórico, melhores/piores categorias, distribuição de confiança
```

## 📡 API Endpoints

### GET /api/accuracy-metrics

Obtém métricas para um período específico.

**Query Parameters:**
- `period` (required): YYYY-MM format
- `calculate` (optional): Se true, calcula se não existir

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "period": "2025-11",
    "totalSamples": 150,
    "correctPredictions": 132,
    "incorrectPredictions": 18,
    "accuracy": 88.0,
    "precision": 86.5,
    "recall": 85.3,
    "f1Score": 85.9,
    "averageConfidence": 82.5,
    "averageConfidenceCorrect": 88.2,
    "averageConfidenceIncorrect": 62.1,
    "confidenceCalibration": 5.5,
    "bySource": {
      "ai": {
        "samples": 120,
        "correct": 105,
        "accuracy": 87.5,
        "averageConfidence": 83.0
      },
      "rule": {
        "samples": 30,
        "correct": 27,
        "accuracy": 90.0,
        "averageConfidence": 95.0
      }
    },
    "byCategory": {
      "cat-groceries": {
        "categoryName": "Groceries",
        "samples": 45,
        "correct": 42,
        "accuracy": 93.3,
        "commonMispredictions": [
          {
            "categoryId": "cat-restaurants",
            "categoryName": "Restaurants",
            "count": 2
          }
        ]
      }
    },
    "confidenceBuckets": [
      {
        "range": "0.8-0.9",
        "min": 0.8,
        "max": 0.9,
        "samples": 55,
        "correct": 48,
        "accuracy": 87.3
      }
    ]
  }
}
```

### POST /api/accuracy-metrics

Calcula métricas para um período.

**Request Body:**
```json
{
  "period": "2025-11",
  "minSamples": 10
}
```

**Response:** Mesmo formato do GET

### GET /api/accuracy-metrics/summary

Obtém sumário para dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "currentPeriod": "2025-11",
    "current": {
      "accuracy": 88.0,
      "f1Score": 85.9,
      "totalSamples": 150,
      "trend": "up"
    },
    "history": [
      {
        "period": "2025-11",
        "accuracy": 88.0,
        "f1Score": 85.9,
        "samples": 150
      },
      {
        "period": "2025-10",
        "accuracy": 85.5,
        "f1Score": 83.2,
        "samples": 132
      }
    ],
    "topMispredictions": [
      {
        "predicted": "Restaurants",
        "actual": "Groceries",
        "count": 8,
        "percentage": 5.3
      }
    ],
    "confidenceDistribution": [
      {
        "bucket": "0.8-0.9",
        "samples": 55,
        "accuracy": 87.3
      }
    ],
    "bestCategories": [
      {
        "categoryId": "cat-groceries",
        "categoryName": "Groceries",
        "accuracy": 95.5,
        "samples": 45
      }
    ],
    "worstCategories": [
      {
        "categoryId": "cat-misc",
        "categoryName": "Miscellaneous",
        "accuracy": 68.2,
        "samples": 22
      }
    ]
  }
}
```

### GET /api/accuracy-metrics/threshold

Recomenda threshold ótimo para auto-classificação.

**Query Parameters:**
- `period` (required): YYYY-MM format

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2025-11",
    "analysis": [
      {
        "threshold": 0.8,
        "autoClassifiedPercent": 65.0,
        "expectedAccuracy": 92.5,
        "needsReviewPercent": 35.0
      },
      {
        "threshold": 0.9,
        "autoClassifiedPercent": 42.0,
        "expectedAccuracy": 96.8,
        "needsReviewPercent": 58.0
      }
    ],
    "recommended": {
      "threshold": 0.8,
      "reason": "Maximizes auto-classification (65.0%) while maintaining 92.5% accuracy",
      "expectedAccuracy": 92.5,
      "autoClassifiedPercent": 65.0
    }
  }
}
```

### GET /api/accuracy-metrics/samples

Obtém ground truth samples ou status da coleção.

**Query Parameters:**
- `period` (optional): YYYY-MM format
- `limit` (optional): Number of samples (default: 100)
- `status` (optional): If true, returns collection status

**Response (samples):**
```json
{
  "success": true,
  "data": {
    "samples": [
      {
        "id": "sample-123",
        "userId": "user-123",
        "transactionId": "tx-456",
        "transactionDescription": "SUPERMARKET XYZ",
        "transactionAmount": -45.90,
        "correctCategoryId": "cat-groceries",
        "correctCategoryName": "Groceries",
        "predictedCategoryId": "cat-groceries",
        "predictionConfidence": 0.92,
        "predictionSource": "ai",
        "predictionModel": "gpt-4o-mini",
        "isCorrect": true,
        "validatedBy": "user-123",
        "validatedAt": 1730500000000,
        "validationMethod": "review"
      }
    ],
    "count": 150,
    "period": "2025-11"
  }
}
```

**Response (status):**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "totalSamples": 450,
    "samplesThisMonth": 82,
    "samplesNeeded": 150,
    "coverage": {
      "totalCategories": 15,
      "categoriesWithSamples": 12,
      "categoriesNeedingSamples": []
    },
    "quality": {
      "averageConfidenceGap": 0.08,
      "recommendedMinSamples": 450,
      "hasStatisticalSignificance": true
    }
  }
}
```

### POST /api/accuracy-metrics/samples

Processa reviews para criar ground truth samples.

**Request Body:**
```json
{
  "reviewIds": ["review-1", "review-2"] // Optional, processes all if empty
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 50,
    "created": 48,
    "skipped": 2,
    "errors": 0
  }
}
```

### DELETE /api/accuracy-metrics/samples

Deleta um ground truth sample.

**Query Parameters:**
- `id` (required): Sample ID

**Response:**
```json
{
  "success": true,
  "message": "Sample deleted"
}
```

## 💡 Casos de Uso

### 1. Monitorar Acurácia ao Longo do Tempo

```typescript
const summary = await AccuracyMetricsService.getMetricsSummary(userId);

console.log(`Current accuracy: ${summary.current.accuracy}%`);
console.log(`Trend: ${summary.current.trend}`); // up, down, stable

// Ver histórico
summary.history.forEach(h => {
  console.log(`${h.period}: ${h.accuracy}% (${h.samples} samples)`);
});
```

### 2. Identificar Categorias Problemáticas

```typescript
const summary = await AccuracyMetricsService.getMetricsSummary(userId);

console.log("Worst performing categories:");
summary.worstCategories.forEach(cat => {
  console.log(`- ${cat.categoryName}: ${cat.accuracy}% (${cat.samples} samples)`);
});

console.log("\nTop mispredictions:");
summary.topMispredictions.forEach(misp => {
  console.log(`- Predicted "${misp.predicted}" instead of "${misp.actual}": ${misp.count} times`);
});
```

### 3. Otimizar Threshold de Auto-Classificação

```typescript
const recommendation = await AccuracyMetricsService.getThresholdRecommendation(
  userId,
  "2025-11"
);

console.log(`Recommended threshold: ${recommendation.recommended.threshold}`);
console.log(`Reason: ${recommendation.recommended.reason}`);
console.log(`Expected accuracy: ${recommendation.recommended.expectedAccuracy}%`);
console.log(`Auto-classify: ${recommendation.recommended.autoClassifiedPercent}% of transactions`);

// Aplicar threshold recomendado no sistema
// if (confidence >= recommendation.recommended.threshold) {
//   autoClassify();
// } else {
//   sendToReview();
// }
```

### 4. Comparar Modelos de IA

```typescript
const metrics = await AccuracyMetricsService.getMetrics(userId, "2025-11");

console.log("Model comparison:");
for (const [model, data] of Object.entries(metrics.byModel || {})) {
  console.log(`${model}:`);
  console.log(`  Accuracy: ${data.accuracy}%`);
  console.log(`  Samples: ${data.samples}`);
  console.log(`  Confidence: ${data.averageConfidence}%`);
}
```

### 5. Verificar Calibração de Confiança

```typescript
const metrics = await AccuracyMetricsService.getMetrics(userId, "2025-11");

console.log("Confidence calibration analysis:");
metrics.confidenceBuckets.forEach(bucket => {
  console.log(`${bucket.range}:`);
  console.log(`  Samples: ${bucket.samples}`);
  console.log(`  Actual accuracy: ${bucket.accuracy}%`);
  console.log(`  Expected: ${(bucket.min + bucket.max) / 2 * 100}%`);
});

if (metrics.confidenceCalibration < 5) {
  console.log("✅ Model is well-calibrated");
} else {
  console.log("⚠️  Model needs calibration");
}
```

## 📊 Requisitos para Significância Estatística

Para métricas confiáveis, recomenda-se:

- **Mínimo total**: 100 samples
- **Mínimo por categoria**: 30 samples
- **Período**: Pelo menos 1 mês de dados

O sistema calcula automaticamente se há significância estatística:

```typescript
const status = await SampleCollectionService.getCollectionStatus(userId);

if (status.quality.hasStatisticalSignificance) {
  console.log("✅ Sufficient samples for reliable metrics");
} else {
  console.log(`⚠️  Need ${status.samplesNeeded} more samples`);
}
```

## 🔄 Integração Automática

O sistema é **automaticamente integrado** com:

✅ **ReviewQueueService** - Cria samples quando reviews são aprovados/rejeitados
✅ **TransactionReview** - Captura decisões humanas como ground truth
✅ **AIClassifier** - Predições são comparadas com ground truth

**Nenhuma configuração adicional necessária!**

## 🚨 Alerts e Monitoramento

O sistema pode gerar alertas quando:

1. **Acurácia cai**: `accuracy < threshold` em comparação com período anterior
2. **Categoria problemática**: `category_accuracy < 70%` com samples >= 20
3. **Descalibração**: `confidenceCalibration > 10%`
4. **Samples insuficientes**: `totalSamples < minRequired`

## 📝 Boas Práticas

### 1. Coleta Regular de Samples

- Revisar pelo menos 10-20 transações por semana
- Focar em transações de baixa confiança primeiro
- Garantir cobertura de todas as categorias

### 2. Análise Mensal

- Calcular métricas todo início de mês
- Comparar com mês anterior
- Identificar tendências e problemas

### 3. Ajuste de Thresholds

- Revisar threshold trimestralmente
- Balancear auto-classificação vs. acurácia
- Considerar custo de revisão humana

### 4. Feedback Loop

- Usar mispredictions para melhorar regras
- Treinar novos modelos com ground truth
- Adicionar keywords às categorias problemáticas

## 🚀 Próximos Passos

- [ ] Dashboard UI para visualização de métricas
- [ ] Alertas automáticos por email
- [ ] Export de relatórios em PDF
- [ ] A/B testing de modelos
- [ ] Active learning (priorizar samples mais úteis)
- [ ] Confusion matrix detalhada
- [ ] ROC curves e AUC
- [ ] Cost-sensitive learning (pesar erros por valor da transação)

## 📚 Referências

- [Precision and Recall](https://en.wikipedia.org/wiki/Precision_and_recall)
- [F1 Score](https://en.wikipedia.org/wiki/F-score)
- [Confusion Matrix](https://en.wikipedia.org/wiki/Confusion_matrix)
- [Calibration Curve](https://scikit-learn.org/stable/modules/calibration.html)
