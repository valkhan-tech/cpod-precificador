# Grupo de Compra — Regras de Negócio e Implementação

## Visão Geral

O recurso **Grupo de Compra** (tela `GrupoCompraScreen`) permite agrupar múltiplos
produtos adquiridos numa mesma operação de compra, ratear custos indiretos compartilhados
(ex: frete único para vários produtos), calcular a precificação individual de cada item e
obter a rentabilidade consolidada do conjunto.

Casos de uso principais:
1. **Compra em lote**: compradora adquiriu 30 blusas, 20 saias e 10 calças, pagou 1 frete.
   Queremos o custo real de cada peça e o potencial de lucro por produto e do conjunto.
2. **Inventário**: cadastrar todos os produtos em estoque, definir custos de aquisição e
   embalagem, calcular valor total em estoque e margem potencial de venda.

> **Recurso Premium** — Disponível apenas para contas com assinatura ativa.
> O campo `isPremium` em `AuthUser` controla o acesso. Enquanto não há assinaturas
> ativas, todos os usuários verão o paywall.

---

## Entidades

### Produto (input)
| Campo           | Tipo   | Obrigatório | Descrição                                              |
|-----------------|--------|-------------|--------------------------------------------------------|
| id              | string | —           | UUID gerado localmente                                  |
| nome            | string | não         | Nome do produto (ex: "Blusa Floral M")                 |
| quantidade      | string | sim         | Quantidade comprada (inteiro ≥ 1)                      |
| custoUnitario   | string | sim         | Custo de aquisição por unidade (R$)                    |
| precoVenda      | string | não         | Preço de venda praticado; se vazio, é calculado        |

### Grupo (inputs globais)
| Campo            | Tipo                              | Padrão | Descrição                                         |
|------------------|-----------------------------------|--------|---------------------------------------------------|
| nomeGrupo        | string                            | —      | Nome identificador do grupo / compra              |
| frete            | string                            | 0      | Frete total pago pela compra (R$)                 |
| outrasDespesas   | string                            | 0      | Outras despesas compartilhadas (R$)               |
| embalagemUnit    | string                            | 0      | Custo de embalagem por unidade de qualquer produto |
| taxa             | string                            | 0      | Taxa de marketplace / adquirente (%)              |
| impostos         | string                            | 0      | Carga tributária sobre o faturamento (%)          |
| margem           | string                            | 30     | Margem de lucro desejada (%)                      |
| metodoRateio     | 'quantidade' \| 'valor' \| 'igual' | 'valor' | Critério para distribuição do custo indireto  |

---

## Cálculos

### 1. Custo Indireto Total
```
custoIndiretoTotal = frete + outrasDespesas
```

### 2. Rateio do Custo Indireto por Produto (total, não por unidade)

**Por Quantidade** — proporcional ao número de peças:
```
rateio_i = custoIndiretoTotal × (qtd_i / Σ qtd)
```

**Por Valor** — proporcional ao investimento base de cada produto:
```
investBase_i = qtd_i × custoUnitario_i
rateio_i = custoIndiretoTotal × (investBase_i / Σ investBase)
```

**Igualitário** — divisão igual entre todos os produtos:
```
rateio_i = custoIndiretoTotal / n
```

### 3. Custo Indireto por Unidade
```
custoIndiretoUnit_i = rateio_i / qtd_i
```

### 4. Custo Total por Unidade
```
custoTotalUnit_i = custoUnitario_i + embalagemUnit + custoIndiretoUnit_i
```

### 5. Preço de Venda por Unidade
Se `precoVenda_i` for informado e > 0, usa-se o valor informado.
Caso contrário, calcula-se pelo markup reverso:
```
precoVenda_i = custoTotalUnit_i / (1 − taxa − impostos − margem)
```
(taxas e impostos em decimal: 20% → 0,20)

### 6. Resultados por Produto
```
investimento_i   = custoTotalUnit_i × qtd_i
receita_i        = precoVenda_i × qtd_i
lucro_i          = receita_i − investimento_i − receita_i × taxa − receita_i × impostos
margemReal_i (%) = (lucro_i / receita_i) × 100
```

### 7. Resultados Consolidados
```
totalInvestido = Σ investimento_i          ← valor em estoque
totalReceita   = Σ receita_i
totalLucro     = Σ lucro_i
margemGeral(%) = (totalLucro / totalReceita) × 100
roi (%)        = (totalLucro / totalInvestido) × 100
```

---

## Controle de Acesso Premium

### Onde é verificado
`GrupoCompraScreen` lê `hasPremium` do contexto `useAuth()`.
Se `false`, renderiza o componente `PremiumGate` no lugar do conteúdo da tela.

### Como está implementado (hoje)
```typescript
// src/types/api.types.ts
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean; // ausente = false
}

// src/context/AuthContext.tsx
// AuthContextValue expõe:
hasPremium: boolean; // user?.isPremium ?? false

// GrupoCompraScreen.tsx
const { hasPremium } = useAuth();
if (!hasPremium) return <PremiumGate />;
```

### Como ativar para um usuário (futuro)
Quando a API retornar `isPremium: true` em `AuthResponse.user`, o contexto já propaga
automaticamente via `hasPremium`. Basta o backend incluir o campo no JWT / response.

---

## Estrutura de Arquivos

```
src/
  screens/
    GrupoCompraScreen.tsx   ← tela principal (nova)
  context/
    AuthContext.tsx          ← expõe hasPremium
  types/
    api.types.ts             ← AuthUser.isPremium, SimulationType 'grupo_compra'
  navigation/
    types.ts                 ← MainTabParamList.GrupoCompra
    AppNavigator.tsx         ← Tab.Screen GrupoCompra
referencia/
  GRUPO_COMPRA_REGRAS.md    ← este arquivo
```

---

## UI / Fluxo de Tela

```
SafeAreaView (teal900)
└── KeyboardAvoidingView
    └── ScrollView
        ├── pageHeader
        ├── card: Nome do Grupo + Método de Rateio
        ├── colabWrapper-style: carrossel horizontal de cards de produto
        │   ├── navRow (Produto X/Y, ‹ › + Adicionar)
        │   ├── dots
        │   └── ScrollView horizontal (snapToInterval)
        │       └── ProdutoCard × N
        ├── card: Custos Indiretos (frete, outras despesas, embalagem/un)
        ├── card: Precificação (taxa, impostos, margem)
        ├── Button "Calcular"
        └── resultsArea (condicional)
            ├── highlightRow (3 destaques: estoque, receita, lucro)
            ├── ResultCard: Consolidado
            ├── ResultCard: Detalhamento por produto (flatMap)
            └── actionRow (Salvar, Limpar)
```
