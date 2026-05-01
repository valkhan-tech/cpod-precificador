# cPod Premium — Implementação e Arquitetura

## Visão Geral

O sistema premium do cPod é composto por uma camada de controle de acesso,
armazenamento local de dados premium, telas dedicadas e integrações nas calculadoras
existentes. A assinatura é gerenciada na nuvem (backend), mas os dados de uso premium
são persistidos localmente via AsyncStorage.

---

## Planos Disponíveis

| Plano  | Valor       | Período              | Observação                  |
|--------|-------------|----------------------|-----------------------------|
| Anual  | R$ 99,90    | /ano                 | Economize R$ 19,00 vs mensal|
| Mensal | R$ 9,90     | /mês                 |                             |

Definidos em `src/constants/api.ts` na constante `PLANOS`.

---

## Controle de Acesso

### Campo `isPremium` no usuário

`AuthUser.isPremium?: boolean` (em `src/types/api.types.ts`) é retornado pelo backend
junto ao objeto de usuário no login/register. Controla acesso permanente.

### Sessão de Teste (`sessionPremium`)

Estado em memória no `AuthContext` (`src/context/AuthContext.tsx`):

```ts
const [sessionPremium, setSessionPremium] = useState(false);
const activatePremiumSession = () => setSessionPremium(true);
```

- Só existe enquanto o app está aberto (não persiste no storage)
- Exposto via `AuthContextValue.activatePremiumSession()`
- Resetado automaticamente ao fechar/reiniciar o app

### Composição do acesso

```ts
hasPremium = (user?.isPremium ?? false) || sessionPremium
```

`hasPremium` é o único campo que deve ser verificado nos components/screens.
Exposto via `useAuth().hasPremium`.

---

## Camada de Storage Local (`src/services/storage.ts`)

Wrapper sobre `@react-native-async-storage/async-storage` para dados premium locais.

### Chaves

| Chave                      | Conteúdo                    |
|----------------------------|-----------------------------|
| `cpod_equipes`             | `Equipe[]` (JSON)           |
| `cpod_defaults_produtos`   | `DefaultsProdutos` (JSON)   |
| `cpod_defaults_hora_homem` | `DefaultsHoraHomem` (JSON)  |

### Tipos exportados

```ts
interface EquipeColaborador {
  id: string; nome: string; salario: string;
  encargos: string; horasMes: string; ativo: boolean;
}

interface Equipe {
  id: string; nome: string;
  colaboradores: EquipeColaborador[];
  criadaEm: string; // ISO 8601
}

interface DefaultsProdutos {
  custo: string; embalagem: string; taxa: string;
  imposto: string; margem: string; quantidade: string;
}

interface DefaultsHoraHomem {
  custoFixo: string; margem: string; impostos: string;
  encargosDefault: string; horasMesDefault: string;
}
```

### Valores padrão

`DEFAULT_PRODUTOS` — todos os campos com string vazia (não aplica nenhum default).  
`DEFAULT_HORA_HOMEM` — `{ custoFixo: '3000', margem: '35', impostos: '16', encargosDefault: '68', horasMesDefault: '176' }`.

### Funções exportadas

| Função                         | Descrição                              |
|--------------------------------|----------------------------------------|
| `getEquipes()`                 | Retorna lista de equipes salvas        |
| `saveEquipe(nome, colabs)`     | Cria nova equipe com UUID + timestamp  |
| `deleteEquipe(id)`             | Remove equipe pelo id                  |
| `getDefaultsProdutos()`        | Retorna defaults (ou DEFAULT_PRODUTOS) |
| `saveDefaultsProdutos(d)`      | Persiste defaults de produtos          |
| `getDefaultsHoraHomem()`       | Retorna defaults (ou DEFAULT_HORA_HOMEM)|
| `saveDefaultsHoraHomem(d)`     | Persiste defaults de Hora Homem        |

---

## Endpoints de API (mocks em `src/services/api.ts`)

Todos os endpoints premium estão documentados no bloco de contrato no topo de `api.ts`
e implementados como mocks sobre `storage.ts`. Não há chamada de rede real — o backend
deverá substituir as funções mock mantendo as mesmas assinaturas.

| Função                           | Endpoint mock         | Descrição                        |
|----------------------------------|-----------------------|----------------------------------|
| `getEquipesList()`               | `GET /equipes`        | Lista equipes do usuário         |
| `createEquipe(nome, colabs)`     | `POST /equipes`       | Cria nova equipe                 |
| `removeEquipe(id)`               | `DELETE /equipes/:id` | Remove equipe                    |
| `fetchDefaultsProdutos()`        | `GET /defaults/produtos` | Busca defaults do Precificador|
| `updateDefaultsProdutos(d)`      | `PUT /defaults/produtos` | Salva defaults do Precificador|
| `fetchDefaultsHoraHomem()`       | `GET /defaults/hora-homem` | Busca defaults do HoraHomem |
| `updateDefaultsHoraHomem(d)`     | `PUT /defaults/hora-homem` | Salva defaults do HoraHomem |
| `getAssinaturaStatus()`          | `GET /assinatura`     | Status da assinatura ativa       |
| `initiateCheckout(plano)`        | `POST /assinatura/checkout` | Inicia checkout do plano   |

Limite de equipes por usuário: `MAX_EQUIPES = 20` (em `src/constants/api.ts`).

Tipos relacionados em `src/types/api.types.ts`:
```ts
type PlanoAssinatura = 'mensal' | 'anual';

interface Assinatura {
  id: string; userId: string; plano: PlanoAssinatura;
  ativo: boolean; validoAte: string; valor: number;
}

interface CheckoutRequest { plano: PlanoAssinatura; }
interface CheckoutResponse { checkoutUrl: string; }
```

---

## Telas

### `PremiumScreen` (`src/screens/PremiumScreen.tsx`)

Tela de oferta da assinatura, acessível via `navigation.navigate('Premium')`.

**Seções:**
1. **Hero** — Gradiente `teal900→teal700`, emoji coroa, título, subtítulo.
   Badge "✅ Premium ativo nesta sessão" aparece se `hasPremium = true`.
2. **Benefícios** — 6 cards listando os recursos: Grupo de Compra, Equipes Salvas,
   Valores Padrão, Histórico Ilimitado, Relatórios (em breve), Sincronização.
3. **Planos** — Radio buttons para selecionar Anual ou Mensal, com badge
   "Economize R$ 19,00" no plano anual. Botão "Assinar plano X" chama `initiateCheckout`.
   Exige `isAuthenticated`; caso contrário redireciona para Register.
4. **Modo de Teste** — Card informativo + botão "Ativar modo de teste". Chama
   `activatePremiumSession()` após confirmação via Alert e volta à tela anterior.
   Botão fica desabilitado se premium já ativo.

**Navegação de entrada:** qualquer tela via `navigation.navigate('Premium')`.

---

### `ConfigPadraoScreen` (`src/screens/ConfigPadraoScreen.tsx`)

Tela de configuração de valores padrão das calculadoras, premium-gated.

**Acesso:** `hasPremium = false` → exibe paywall com botão "Ver benefícios Premium →".

**Seções quando premium:**
- **🏷️ Calculadora de Produtos** — campos: Custo, Embalagem, Taxa, Imposto, Margem, Quantidade
- **⏱️ Custo de Serviços** — campos: Custo Fixo, Margem, Impostos, Encargos (padrão p/ novos colaboradores), Horas/Mês

**Ações:**
- **Salvar padrões** — chama `updateDefaultsProdutos` + `updateDefaultsHoraHomem` em paralelo
- **Limpar** — restaura todos os campos para `DEFAULT_PRODUTOS` / `DEFAULT_HORA_HOMEM` via Alert destrutivo

Valores são carregados do storage no `useEffect` de montagem.

---

## Integrações nas Telas Existentes

### `HoraHomemScreen` — Equipes Salvas

**Painel colapsável** inserido antes do carrossel de colaboradores:

- Cabeçalho: título "⚡ Equipes Salvas" + badge com contagem (ou badge PREMIUM se não tem acesso)
- Expandido sem premium: mini-gate com botão "Ver benefícios →" para `PremiumScreen`
- Expandido com premium:
  - Lista de equipes: toque carrega a equipe (substituindo colaboradores atuais), botão ✕ remove
  - Botão "💾 Salvar equipe atual" → formulário inline com campo nome + botões Salvar/Cancelar

**Defaults carregados no mount (premium):**
```
useEffect: quando !isLoading && hasPremium && !defaultsApplied.current
  → fetchDefaultsHoraHomem()
  → aplica custoFixo, margem, impostos nos estados
  → aplica encargosDefault e horasMesDefault em todos os colaboradores
```
Ref `defaultsApplied` evita reaplicação em re-renders (ex: toggle de premium na sessão).

---

### `PrecificadorScreen` — Defaults + Acesso a ConfigPadrao

**Defaults carregados no mount (premium):**
```
useEffect: quando !isLoading && hasPremium && !defaultsApplied.current
  → fetchDefaultsProdutos()
  → aplica custo, embalagem, taxa, imposto, margem, quantidade nos estados
```

**Ícone ⚙️** no cabeçalho da tela (visível apenas com `hasPremium`):
- Navega para `'ConfigPadrao'`

---

### `HomeScreen` — Card de Entrada Premium

Card gradiente `teal900→teal700` posicionado após a seção de calculadoras:
- Emoji coroa + título + descrição resumida dos benefícios
- Botão branco "Ver benefícios →" navega para `'Premium'`

---

### `GrupoCompraScreen` — Correção do PremiumGate

O componente inline `PremiumGate` agora redireciona para `'Premium'` (antes redirecionava
para `'Login'`):

```tsx
<PremiumGate onLogin={() => navigation.navigate('Premium')} />
```

---

## Navegação

`RootStackParamList` (em `src/navigation/types.ts`):

```ts
{
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Premium: undefined;      // ← adicionado
  ConfigPadrao: undefined; // ← adicionado
}
```

Screens registradas em `AppNavigator.tsx` no Stack.Navigator.

---

## Fluxo de Teste (Desenvolvimento)

1. Abrir o app
2. Ir à aba **Home**
3. Tocar em "Ver benefícios →" no card premium
4. Na `PremiumScreen`, rolar até o final e tocar em **"Ativar modo de teste"**
5. Confirmar o Alert
6. `hasPremium` passa a ser `true` nesta sessão
7. Recursos premium ficam desbloqueados em todas as telas
8. Reiniciar o app para resetar o acesso
