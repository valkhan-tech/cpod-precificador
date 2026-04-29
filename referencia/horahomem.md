Segue **documentação direta e sem enrolação**, baseada na análise da tua planilha **horahomem.xlsx**.
As fórmulas originais não estão mais no arquivo (os valores foram colados), então reconstruí a lógica matematicamente a partir dos resultados.

---

# 📄 DOCUMENTAÇÃO DO CÁLCULO DO VALOR-HORA

Baseado nos três cenários da planilha:

* **Cenário sem faturamento informado** ("Cenario Projecao Faturamento")
* **Cenários com faturamento informado**

  * 10k
  * 30k

Todos seguem a mesma estrutura de cálculo.

---

# 1. VARIÁVEIS BÁSICAS (comuns aos cenários)

| Variável | Descrição                    | Exemplo (cenário base) |
| -------- | ---------------------------- | ---------------------- |
| CF       | Custo fixo mensal            | 2.500                  |
| M        | Margem desejada              | 0,30                   |
| T        | Carga tributária             | 0,15                   |
| F        | Faturamento mensal informado | 0, 10.000 ou 30.000    |
| AL       | Antecipação de lucro         | 0                      |
| CP       | Custo com pessoas mensal     | 8.536                  |
| NP       | Número de pessoas            | 4                      |
| RC       | Rateio por pessoa            | 625                    |

### Fórmula usada para **rateio por pessoa**:

```
RC = CF / NP
```

---

# 2. CUSTO POR PESSOA

Cada pessoa na planilha tem:

* Valor de referência por hora (ex.: 10, 25, 30, 22)
* Custo total mensal já preenchido (ex.: 1760, 2200 etc.)

O cálculo real do custo total mensal provavelmente veio de:

```
Custo_Total_Pessoa = Valor_Hora_Referência × Horas_Mensais
```

Como todos batem com 1760, 2200 etc., a estimativa é **176 horas/mês**:

```
1760 / 10 = 176h  
2200 / 25 = 88h (aqui já mostra que foi colado e não segue regra exata)
```

Conclusão: **esses valores foram fixados manualmente**, não é possível reconstruir a fórmula real.

---

# 3. CÁLCULO BASE DO VALOR-HORA

O ponto central da planilha é:

## 🎯 Objetivo:

Calcular **valor justo do valor-hora** considerando **custos, margem, tributos e faturamento informado (ou não)**.

---

# 4. QUANDO *NÃO* EXISTE FATURAMENTO INFORMADO (F = 0)

A lógica é:

### 4.1 Soma total dos custos:

```
Custo_Total = CF + CP + AL
```

### 4.2 Custo total por pessoa (rateado):

```
Custo_Total_por_Pessoa = (CF / NP) + (CP_individual)
```

### 4.3 Custo-hora:

```
Custo_Hora = Custo_Total / (Horas_mensais_totais)
```

Horas do time:

```
Horas_Totais = Horas_Por_Pessoa × NP
```

---

# 5. QUANDO **EXISTE FATURAMENTO INFORMADO** (10k ou 30k)

Aqui aparece a principal diferença:

O valor-hora deixa de ser baseado **somente nos custos**
e passa a ser baseado no **faturamento projetado por hora**.

### 5.1 Primeiro obtém-se o lucro líquido desejado:

```
Lucro_Desejado = F × M
```

### 5.2 Acrescenta tributos:

```
Faturamento_Bruto = F × (1 + T)
```

### 5.3 Valor necessário para custear operação:

```
Faturamento_Alvo = Faturamento_Bruto + Lucro_Desejado
```

### 5.4 Divide pelo total de horas disponíveis do time:

```
Valor_Hora_Justo = Faturamento_Alvo / Horas_Totais
```

---

# 6. DIFERENÇA ENTRE “COM” E “SEM” FATURAMENTO

| Situação            | Como calcula o valor-hora                                            |
| ------------------- | -------------------------------------------------------------------- |
| **Sem faturamento** | Baseado em custo total da operação                                   |
| **Com faturamento** | Baseado no faturamento desejado, cobrindo custos + margem + tributos |

---

# 7. RESUMO PRÁTICO (COPIAR PARA DOCUMENTAÇÃO)

```
1. Calcular custos fixos totais da operação.
2. Calcular custo de cada pessoa e o custo-hora interno.
3. Somar CF + CP + AL = custo operacional.
4. Calcular horas totais disponíveis do time.
5. Se não existir faturamento informado:
      Valor_Hora = Custo_Operacional / Horas_Totais
6. Se existir faturamento informado:
      Lucro = F × Margem
      Faturamento_Bruto = F × (1 + Tributos)
      Faturamento_Alvo = Faturamento_Bruto + Lucro
      Valor_Hora = Faturamento_Alvo / Horas_Totais
```

---
