# Documentação Detalhada dos Cálculos - Hora/Homem

## Princípio Fundamental

**Regra de Ouro**: A calculadora SEMPRE busca atingir a **Margem Desejada** (configurada pelo usuário). O **Valor/Hora Sugerido** é calculado de forma INDEPENDENTE do faturamento real informado, garantindo que se esse valor for cobrado, a margem desejada será atingida.

**Dois Valores Diferentes:**
1. **Fat. Hr Sugerido**: Valor calculado para atingir EXATAMENTE a margem desejada (30%)
2. **Fat. Hr Aplicado**: Valor real praticado (faturamento real ÷ horas unitárias)

O sistema NÃO ajusta o valor sugerido baseado no faturamento real - ele permanece constante como referência ideal.

## Dados Base para os Exemplos

### Configurações
- **Custo Fixo Mensal**: R$ 2.000,00
- **Margem Desejada**: 30%
- **Impostos**: 15%
- **Projeção**: 1 mês
- **Antecipação de Lucros**: R$ 0,00

### Colaboradores (4 pessoas)
| Colaborador | Valor/Hora | Horas/Dia | Dias/Mês | Total Horas | Custo Direto |
|-------------|------------|-----------|----------|-------------|--------------|
| João        | R$ 10,00   | 8h        | 22d      | 176h        | R$ 1.760,00  |
| Maria       | R$ 25,00   | 8h        | 22d      | 176h        | R$ 4.400,00  |
| Pedro       | R$ 30,00   | 8h        | 22d      | 176h        | R$ 5.280,00  |
| Ana         | R$ 22,00   | 8h        | 22d      | 176h        | R$ 3.872,00  |

### Totais Base
- **Total de Horas**: 704h (176h × 4)
- **Custo com Colaboradores**: R$ 15.312,00
- **Custo Fixo**: R$ 2.000,00
- **Custo Total**: R$ 17.312,00
- **Soma Valor/Hora Base**: R$ 87,00 (10 + 25 + 30 + 22)

---

## Fórmulas Fundamentais

### 1. Faturamento Mínimo Necessário
```
Faturamento Mínimo = Custo Total / (1 - Margem - Impostos)
```
**Onde:**
- Custo Total = Custo com Colaboradores + Custo Fixo
- Margem = Percentual desejado (ex: 0,30 para 30%)
- Impostos = Percentual de impostos (ex: 0,15 para 15%)

### 2. Valor/Hora Mínimo Necessário
```
Valor/Hora Mínimo = Faturamento Mínimo / Total de Horas
```

### 3. Rateio do Custo Fixo
```
Rateio por Hora = Custo Fixo / Total de Horas
Rateio por Colaborador = Custo Fixo / Quantidade de Colaboradores
```

### 4. Custo/Hora com Rateio
```
Custo/Hora = Soma dos Valores/Hora Base + Rateio por Hora
```

### 5. Margem Real
```
Líquido = Faturamento - Impostos - Custo com Colaboradores - Custo Fixo
Margem Real % = (Líquido / Faturamento) × 100
```

---

## CENÁRIO 1: Sem Faturamento Informado

### Objetivo
Calcular o **valor mínimo** que precisa ser cobrado por hora para atingir a margem desejada de 30%.

### Cálculos Passo a Passo

#### 1. Calcular Faturamento Mínimo
```
Custo Total = R$ 15.312,00 + R$ 2.000,00 = R$ 17.312,00

Faturamento Mínimo = R$ 17.312,00 / (1 - 0,30 - 0,15)
Faturamento Mínimo = R$ 17.312,00 / 0,55
Faturamento Mínimo = R$ 31.476,36
```

#### 2. Calcular Valor/Hora Mínimo
```
Valor/Hora Mínimo = R$ 31.476,36 / 704h
Valor/Hora Mínimo = R$ 44,71/h
```

#### 3. Calcular Rateio
```
Rateio por Hora = R$ 2.000,00 / 704h = R$ 2,84/h
Rateio por Colaborador = R$ 2.000,00 / 4 = R$ 500,00
```

#### 4. Calcular Custo/Hora
```
Custo/Hora = R$ 87,00 + R$ 2,84 = R$ 89,84/h
```

### Resultados Finais - Cenário 1
| Métrica | Valor |
|---------|-------|
| **Faturamento Mensal** | R$ 31.476,36 |
| **Valor/Hora de Venda** | **R$ 44,71** |
| **Custo/Hora** | R$ 89,84 |
| **Rateio por Colaborador** | R$ 500,00 |
| **Impostos** | R$ 4.721,45 |
| **Líquido Mensal** | R$ 9.442,91 |
| **Margem Real** | 30,00% |

### Interpretação
Como não há faturamento real, o sistema calcula o **piso mínimo** necessário. O custo fixo é totalmente rateado entre as horas disponíveis.

---

## CENÁRIO 2: Faturamento de R$ 22.000,00

### Objetivo
Avaliar se o faturamento informado é suficiente. Como é MENOR que o mínimo necessário, o sistema deve **cobrar o valor mínimo** (igual ao Cenário 1).

### Cálculos Passo a Passo

#### 1. Faturamento Mínimo (mesmo do Cenário 1)
```
Faturamento Mínimo = R$ 31.476,36
```

#### 2. Verificar Margem Real com R$ 22.000,00
```
Impostos Real = R$ 22.000,00 × 0,15 = R$ 3.300,00
Líquido Real = R$ 22.000,00 - R$ 3.300,00 - R$ 15.312,00 - R$ 2.000,00
Líquido Real = R$ 1.388,00
Margem Real = (R$ 1.388,00 / R$ 22.000,00) × 100 = 6,31%
```

**Conclusão**: Margem Real (6,31%) < Margem Desejada (30%) → **INSUFICIENTE**

#### 3. Aplicar Valor Mínimo Necessário
Como o faturamento é insuficiente, o sistema usa o **mesmo valor do Cenário 1**:
```
Valor/Hora = R$ 44,71 (valor mínimo necessário)
Rateio por Hora = R$ 2,84/h
Rateio por Colaborador = R$ 500,00
```

### Resultados Finais - Cenário 2
| Métrica | Valor |
|---------|-------|
| **Faturamento Informado** | R$ 22.000,00 |
| **Faturamento Necessário** | R$ 31.476,36 |
| **Valor/Hora de Venda** | **R$ 44,71** |
| **Custo/Hora** | R$ 89,84 |
| **Rateio por Colaborador** | R$ 500,00 |
| **Margem Real (c/ R$ 22k)** | 6,31% ⚠️ |
| **Margem Necessária** | 30,00% |

### Interpretação
O faturamento de R$ 22.000,00 **NÃO É SUFICIENTE** para cobrir custos com a margem desejada. Por isso:
- O sistema **mantém o valor/hora mínimo** (R$ 44,71)
- O custo fixo é **totalmente rateado**
- Se cobrar esse valor/hora, atingirá R$ 31.476,36 de faturamento
- O faturamento real de R$ 22k resulta em apenas 6,31% de margem

---

## CENÁRIO 3: Faturamento de R$ 30.000,00

### Objetivo
Com faturamento MAIOR, o sistema pode calcular um valor/hora **MAIS BARATO**, mantendo a margem desejada.

### Cálculos Passo a Passo

#### 1. Verificar Margem Real com R$ 30.000,00
```
Impostos Real = R$ 30.000,00 × 0,15 = R$ 4.500,00
Líquido Real = R$ 30.000,00 - R$ 4.500,00 - R$ 15.312,00 - R$ 2.000,00
Líquido Real = R$ 8.188,00
Margem Real = (R$ 8.188,00 / R$ 30.000,00) × 100 = 27,29%
```

**Conclusão**: Margem Real (27,29%) < Margem Desejada (30%) → **AINDA INSUFICIENTE**

Apesar de estar próximo, ainda não atingiu a margem de 30%, então o sistema deve usar o valor mínimo.

#### 2. Aplicar Valor Mínimo Necessário
```
Valor/Hora = R$ 44,71 (valor mínimo necessário)
Rateio por Hora = R$ 2,84/h
Rateio por Colaborador = R$ 500,00
```

### Resultados Finais - Cenário 3
| Métrica | Valor |
|---------|-------|
| **Faturamento Informado** | R$ 30.000,00 |
| **Faturamento Necessário** | R$ 31.476,36 |
| **Valor/Hora de Venda** | **R$ 44,71** |
| **Custo/Hora** | R$ 89,84 |
| **Rateio por Colaborador** | R$ 500,00 |
| **Margem Real (c/ R$ 30k)** | 27,29% ⚠️ |
| **Margem Necessária** | 30,00% |

### Interpretação
Mesmo com R$ 30.000,00, ainda não atinge a margem de 30%. O sistema mantém o valor mínimo de R$ 44,71/h.

---

## CENÁRIO 3B: Faturamento de R$ 35.000,00 (ADEQUADO)

### Objetivo
Demonstrar o comportamento quando o faturamento É SUFICIENTE para atingir a margem desejada.

### Cálculos Passo a Passo

#### 1. Verificar Margem Real com R$ 35.000,00
```
Impostos Real = R$ 35.000,00 × 0,15 = R$ 5.250,00
Líquido Real = R$ 35.000,00 - R$ 5.250,00 - R$ 15.312,00 - R$ 2.000,00
Líquido Real = R$ 12.438,00
Margem Real = (R$ 12.438,00 / R$ 35.000,00) × 100 = 35,54%
```

**Conclusão**: Margem Real (35,54%) ≥ Margem Desejada (30%) → **ADEQUADO! ✓**

#### 2. Calcular Valor/Hora com Faturamento Real
Como a margem é adequada, posso usar o faturamento real:
```
Valor/Hora = R$ 35.000,00 / 704h = R$ 49,72/h
Rateio = R$ 0,00 (não precisa ratear)
Custo/Hora = R$ 87,00 + R$ 0,00 = R$ 87,00/h
```

### Resultados Finais - Cenário 3B
| Métrica | Valor |
|---------|-------|
| **Faturamento Real** | R$ 35.000,00 |
| **Valor/Hora de Venda** | **R$ 49,72** |
| **Custo/Hora** | R$ 87,00 |
| **Rateio por Colaborador** | **R$ 0,00** |
| **Impostos** | R$ 5.250,00 |
| **Líquido Mensal** | R$ 12.438,00 |
| **Margem Real** | **35,54%** ✓ |

### Interpretação
Com faturamento adequado:
- O valor/hora AUMENTA de R$ 44,71 para R$ 49,72 porque usamos o faturamento real
- **NÃO há rateio** do custo fixo (R$ 0,00)
- A margem fica acima do desejado (35,54% > 30%)
- Custo/hora é apenas a soma dos valores base (R$ 87,00)

---

## CENÁRIO 3C: Faturamento de R$ 50.000,00 (EXCELENTE)

### Objetivo
Demonstrar que com faturamento MUITO MAIOR, o valor/hora pode ser REDUZIDO mantendo a margem.

### Cálculos Passo a Passo

#### 1. Verificar Margem Real
```
Impostos Real = R$ 50.000,00 × 0,15 = R$ 7.500,00
Líquido Real = R$ 50.000,00 - R$ 7.500,00 - R$ 15.312,00 - R$ 2.000,00
Líquido Real = R$ 25.188,00
Margem Real = (R$ 25.188,00 / R$ 50.000,00) × 100 = 50,38%
```

**Conclusão**: Margem MUITO adequada (50,38%)!

#### 2. Calcular Valor/Hora Reduzido
Posso calcular quanto cobrar para ter exatamente 30% de margem:
```
Faturamento para 30% = R$ 17.312,00 / (1 - 0,30 - 0,15) = R$ 31.476,36
```

Mas como tenho R$ 50.000,00 de faturamento, posso distribuir:
```
Valor/Hora Real = R$ 50.000,00 / 704h = R$ 71,02/h
```

Ou, para manter exatamente 30% de margem:
```
Faturamento alvo = R$ 31.476,36
Valor/Hora alvo = R$ 44,71/h
```

### Resultados - Usando Faturamento Real
| Métrica | Valor |
|---------|-------|
| **Faturamento Real** | R$ 50.000,00 |
| **Valor/Hora de Venda** | **R$ 71,02** |
| **Margem Real** | **50,38%** ✓✓✓ |

### Interpretação
Com faturamento muito alto, você pode:
1. Cobrar o valor calculado (R$ 71,02) e ter margem de 50%
2. OU reduzir seu preço para ser mais competitivo
3. O custo fixo fica totalmente diluído

---

## Tabela Comparativa dos Cenários

| Cenário | Faturamento | Margem Real | Valor/Hora | Rateio/Colab | Custo/Hora | Interpretação |
|---------|-------------|-------------|------------|--------------|------------|---------------|
| **1 - Sem Fat.** | R$ 31.476,36 | 30,00% | **R$ 44,71** | R$ 500,00 | R$ 89,84 | Valor mínimo necessário |
| **2 - R$ 22k** | R$ 22.000,00 | 6,31% ⚠️ | **R$ 44,71** | R$ 500,00 | R$ 89,84 | Insuficiente, usar mínimo |
| **3 - R$ 30k** | R$ 30.000,00 | 27,29% ⚠️ | **R$ 44,71** | R$ 500,00 | R$ 89,84 | Ainda insuficiente |
| **3B - R$ 35k** | R$ 35.000,00 | 35,54% ✓ | **R$ 49,72** | R$ 0,00 | R$ 87,00 | Adequado, sem rateio |
| **3C - R$ 50k** | R$ 50.000,00 | 50,38% ✓✓✓ | **R$ 71,02** | R$ 0,00 | R$ 87,00 | Excelente, alta margem |

---

## Regras de Decisão do Sistema

```
SE Faturamento Informado = 0 ENTÃO
    Usar Faturamento Mínimo Necessário
    Aplicar Rateio Completo
    Valor/Hora = Valor Mínimo Necessário

SENÃO
    Calcular Margem Real com Faturamento Informado
    
    SE Margem Real < Margem Desejada ENTÃO
        Usar Faturamento Mínimo Necessário
        Aplicar Rateio Completo
        Valor/Hora = Valor Mínimo Necessário
    SENÃO
        Usar Faturamento Informado
        Rateio = 0
        Valor/Hora = Faturamento Informado / Total Horas
    FIM SE
FIM SE
```

---

## Observações Importantes

1. **Fat. Hr Sugerido vs Fat. Hr Aplicado**:
   - **Fat. Hr Sugerido**: SEMPRE calculado para atingir exatamente a margem desejada (30%)
   - **Fat. Hr Aplicado**: Valor real praticado (Faturamento Real ÷ Horas Unitárias)
   - O sugerido NÃO muda com o faturamento - é sua referência de preço ideal

2. **O rateio é um indicador de pressão sobre custos fixos**:
   - Rateio > 0 → Faturamento insuficiente, custos fixos pesam
   - Rateio = 0 → Faturamento suficiente, custos fixos diluídos

3. **Custo/Hora tem dois componentes**:
   - Soma dos valores/hora base dos colaboradores (fixo)
   - Rateio do custo fixo (variável conforme faturamento)

4. **O sistema PRIORIZA atingir a margem desejada**:
   - O Fat. Hr Sugerido é calculado matematicamente para atingir EXATAMENTE a margem
   - Se você cobrar o Fat. Hr Aplicado diferente do sugerido, sua margem será diferente da desejada
   - Exemplo: 
     * Fat. Hr Sugerido: R$ 113,61 → Margem: 30,00%
     * Fat. Hr Aplicado: R$ 181,82 (com R$ 32k fat.) → Margem: 50,34%
     * Fat. Hr Aplicado: R$ 107,95 (com R$ 19k fat.) → Margem: 28,33%

## Como Usar os Dois Valores

### Cenário 1: Precificação Inicial
Você está começando um projeto e quer saber quanto cobrar:
- **Use o Fat. Hr Sugerido**: R$ 113,61
- Este valor garante margem de 30% com base nos seus custos

### Cenário 2: Análise de Proposta Recebida
Cliente oferece R$ 25.000/mês de faturamento:
- **Fat. Hr Sugerido**: R$ 113,61 (não muda, continua sendo sua referência)
- **Fat. Hr Aplicado**: R$ 142,05 (R$ 25.000 ÷ 176h)
- **Margem Real**: 37,07% (acima dos 30% desejados)
- **Decisão**: Aceitar! Você terá margem acima da meta

### Cenário 3: Competitividade
Concorrente cobra R$ 100/hora:
- **Fat. Hr Sugerido**: R$ 113,61
- **Diferença**: Você precisa cobrar 13,61% a mais para manter margem
- **Opções**: 
  1. Justificar o valor maior pela qualidade
  2. Reduzir custos para baixar o Fat. Hr Sugerido
  3. Aceitar margem menor (cobrar R$ 100/h = margem ~19%)
