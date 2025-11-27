# Sistema de Revisão de Classificações AI

## 📋 Visão Geral

Sistema completo de revisão de classificações sugeridas pela IA, permitindo que usuários aprovem, ajustem ou rejeitem sugestões de categorização de transações.

## 🎯 Features Implementadas

### 1. **Dashboard de Revisão** (`/reviews`)

- ✅ Interface com tabs para diferentes status (Pending, Approved, Rejected, Skipped)
- ✅ Estatísticas em tempo real (pending, approved, rejected, avg confidence)
- ✅ Barra de progresso de revisões
- ✅ Filtros por status e prioridade
- ✅ Ações em massa (Approve All)

### 2. **ReviewCard Component**

Interface completa de revisão com:

#### Visualização de Sugestão AI
- Badge com nome da categoria (resolvido dinamicamente)
- Merchant name sugerido
- Tags sugeridas
- Confiança da classificação (com código de cores)
- Raciocínio da IA (reasoning)
- Ícone indicando origem da sugestão (AI/Rule)

#### Modo de Edição (Expandido)
- **Seletor de Categoria**: Dropdown com todas as categorias do usuário
  - Mostra ícone + nome
  - Indica tipo da categoria (expense/income/transfer)
  - Carregamento assíncrono
- **Editor de Merchant**: Input para ajustar nome do comerciante
- **Editor de Tags**: Component TagsInput customizado
  - Adicionar tags com Enter ou vírgula
  - Remover tags com X
  - Backspace para remover última tag
- **Notas de Revisão**: Campo para adicionar observações
- **Criar Regra Automática**: Checkbox destacado para aprendizado
  - Cria regra baseada na decisão do usuário
  - Útil para padrões recorrentes

#### Ações Disponíveis
1. **Quick Approve**: Aceita sugestão da IA sem alterações
2. **Apply Changes**: Aplica modificações customizadas
3. **Reject**: Rejeita sugestão (com feedback para melhoria)
4. **Skip**: Pula para revisar depois

### 3. **TagsInput Component**

Component reutilizável para edição de tags:
- Adicionar tags com Enter ou vírgula
- Remover tags clicando no X
- Backspace remove última tag quando input vazio
- Visual consistente com design system

### 4. **Toast Notifications**

Feedback visual para todas as ações:
- ✅ Success: "Classification approved!"
- ✅ Success: "Custom classification applied!"
- ✅ Success: "Classification rejected"
- ℹ️ Info: "Review skipped"
- ❌ Error: Mensagens específicas para cada falha

### 5. **Loading States**

- Skeleton loading para lista de reviews
- Botões disabled durante processamento
- "Processing..." feedback nos botões
- Loading state no dropdown de categorias

### 6. **Error Handling**

- Alert visual para erros de carregamento
- Try-catch em todas as operações
- Mensagens de erro específicas
- Botão de retry disponível

## 🎨 Design System

### Cores de Prioridade
- 🔴 High: Red (bg-red-100 text-red-800)
- 🟡 Medium: Yellow (bg-yellow-100 text-yellow-800)
- 🔵 Low: Blue (bg-blue-100 text-blue-800)

### Cores de Confiança
- 🟢 ≥80%: Green (text-green-600)
- 🟡 60-79%: Yellow (text-yellow-600)
- 🔴 <60%: Red (text-red-600)

### Badges
- AI Suggestion: Purple badge com ícone Sparkles
- Category: Outline badge
- Tags: Secondary badge
- Priority: Colored badge

## 📊 Estatísticas

O ReviewQueueStats mostra:
- **Pending Reviews**: Número de revisões pendentes
- **Approved**: Total de aprovações
- **Rejected**: Total de rejeições
- **Average Confidence**: Confiança média das sugestões
- **Progress Bar**: % de revisões completas
- **Priority Breakdown**: High/Medium/Low count

## 🔄 Fluxo de Revisão

```
1. Transação é processada pela IA
   ↓
2. Sugestão vai para fila de revisão (se confiança < threshold)
   ↓
3. Usuário visualiza sugestão no Review Queue
   ↓
4. Opções:
   a) Quick Approve → Aplica sugestão + opcional criar regra
   b) Editar → Ajusta categoria/merchant/tags → Apply
   c) Reject → Rejeita com feedback
   d) Skip → Deixa para depois
   ↓
5. Sistema atualiza transação + cria regra (se solicitado)
   ↓
6. IA aprende com feedback para melhorar sugestões futuras
```

## 🛠️ Tecnologias Utilizadas

- **React Hooks**: useState para estado local
- **TanStack Query**: useQuery para dados de categorias
- **Shadcn UI**: Componentes base (Button, Card, Select, etc)
- **Sonner**: Toast notifications
- **Lucide React**: Ícones
- **Tailwind CSS**: Estilização

## 📱 Responsividade

- Grid adaptativo para stats (1 col mobile → 2 md → 4 lg)
- Cards de review responsivos
- Tabs compactas em mobile
- Formulários ajustáveis
- Scroll suave em listas longas

## 🔐 Segurança

- Server-side validation em todas as APIs
- User authentication verificada
- Ownership validation (userId)
- SQL injection protection
- XSS protection via sanitização

## 🧪 Testing

Para testar o sistema:

1. **Criar transações não classificadas**
2. **Executar classificação AI** via API:
   ```
   POST /api/transactions/:id/classify
   POST /api/transactions/classify-batch
   ```
3. **Acessar** `/reviews`
4. **Testar fluxos**:
   - Quick approve
   - Custom approve com edições
   - Reject
   - Skip
   - Bulk approve
5. **Verificar**:
   - Transação foi atualizada
   - Regra foi criada (se checkbox marcado)
   - Stats atualizadas
   - Toast notifications

## 🚀 Próximos Passos

Possíveis melhorias futuras:
- [ ] Filtros avançados (por confiança, data, valor)
- [ ] Ordenação customizável
- [ ] Keyboard shortcuts (j/k para navegar, a/r/s para ações)
- [ ] Preview de regra antes de criar
- [ ] Batch edit (aplicar mesma classificação a múltiplas)
- [ ] Analytics do tempo de revisão
- [ ] Sugestões de melhoria baseadas em rejeições
- [ ] Dark mode otimizado
