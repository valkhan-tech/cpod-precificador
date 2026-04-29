# cPod Precificador — App Mobile

Aplicativo React Native / Expo para precificação de produtos e serviços. Ferramenta gratuita para empreendedores com três calculadoras integradas: **Precificador**, **Custo Hora-Homem** e **Histórico de simulações**.

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Instalação do projeto](#instalação-do-projeto)
- [Rodando o app](#rodando-o-app)
- [Criando o app no Expo (EAS Build)](#criando-o-app-no-expo-eas-build)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Variáveis e constantes importantes](#variáveis-e-constantes-importantes)
- [Camada de API (mock → produção)](#camada-de-api-mock--produção)
- [Fluxo de autenticação](#fluxo-de-autenticação)
- [Credenciais de teste](#credenciais-de-teste)
- [Versões compatíveis](#versões-compatíveis)

---

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|---|---|---|
| Node.js | 18+ | Recomendado LTS |
| npm | 9+ | Vem com Node |
| Android Studio | Ladybug (2024.2) | Emulador Android |
| Xcode | 15+ | Apenas macOS — para iOS |
| JDK | 17 | Para build Android |

> **Windows**: Android Studio + emulador é o caminho para desenvolvimento local. iOS só pode ser compilado em macOS.

---

## Configuração do ambiente

### 1. Instalar Node.js

Baixe em https://nodejs.org e instale a versão LTS.

### 2. Instalar Expo CLI (global — opcional, mas útil)

```bash
npm install -g eas-cli
```

### 3. Configurar Android Studio

1. Instale o Android Studio em https://developer.android.com/studio
2. Abra o SDK Manager e instale:
   - Android SDK Platform **35** (Android 15)
   - Android SDK Build-Tools **35.0.0**
   - Android Emulator
3. Crie um Virtual Device (AVD):
   - Device: **Pixel 8** (ou equivalente)
   - System Image: **API 35 / x86_64**
4. Adicione as variáveis de ambiente ao seu perfil (`~/.bashrc`, `~/.zshrc` ou variáveis de sistema no Windows):

```bash
# Linux/macOS
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Windows (PowerShell — adicionar nas variáveis de sistema)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

---

## Instalação do projeto

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd vlk-precificador/cpod-app

# 2. Instale as dependências
npm install
```

> ⚠️ **Importante**: sempre use `npm install` (não `npm install <pacote>` diretamente para pacotes nativos). Para adicionar novos pacotes do ecossistema Expo, use `npx expo install <pacote>` para garantir compatibilidade com o SDK 54.

---

## Rodando o app

### Android (emulador ou dispositivo físico)

```bash
# Inicia o Metro Bundler e abre no emulador Android
npm run android

# Ou com a CLI local do Expo
node node_modules/expo/bin/cli.js start --android
```

### iOS (apenas macOS)

```bash
npm run ios
```

### Modo interativo (escolher plataforma depois)

```bash
npm start
# Pressione 'a' para Android, 'i' para iOS
```

### Dispositivo físico

1. Instale o app **Expo Go** no celular (Play Store / App Store)
2. Execute `npm start`
3. Escaneie o QR code exibido no terminal

---

## Criando o app no Expo (EAS Build)

### 1. Login na conta Expo

```bash
npx eas-cli login
```

> Crie uma conta gratuita em https://expo.dev se ainda não tiver.

### 2. Configurar o projeto no Expo

```bash
npx eas-cli init
```

Isso vai associar o projeto à sua conta e gerar/atualizar o `app.json` com o `projectId`.

### 3. Configurar o `eas.json`

Crie o arquivo `eas.json` na raiz do `cpod-app/`:

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4. Build de preview (APK para teste interno)

```bash
# Gera APK Android para distribuição interna
npx eas-cli build --platform android --profile preview
```

O link para download do APK será exibido ao final do build.

### 5. Build de produção

```bash
# Android (AAB para Google Play)
npx eas-cli build --platform android --profile production

# iOS (IPA para App Store)
npx eas-cli build --platform ios --profile production
```

### 6. Submit para as lojas

```bash
npx eas-cli submit --platform android
npx eas-cli submit --platform ios
```

---

## Estrutura do projeto

```
cpod-app/
├── App.tsx                    # Ponto de entrada
├── app.json                   # Configuração Expo (bundle ID, nome, splash)
├── package.json
├── tsconfig.json
├── assets/                    # Ícone, splash, adaptive icon
└── src/
    ├── constants/
    │   ├── theme.ts            # Design tokens (cores, tipografia, espaçamento)
    │   └── api.ts              # URL base, endpoints, MAX_SIMULATIONS
    ├── types/
    │   └── api.types.ts        # Interfaces TypeScript (AuthUser, Simulation, etc.)
    ├── services/
    │   └── api.ts              # Camada de API com mocks (TODO: substituir por real)
    ├── context/
    │   └── AuthContext.tsx     # Estado de autenticação global + SecureStore
    ├── components/
    │   ├── Button.tsx          # Botão (variantes: primary, secondary, ghost)
    │   ├── CpodLogo.tsx        # Logo SVG cPod (variantes: full, icon)
    │   ├── InputField.tsx      # Input com label, prefix, suffix, erro
    │   └── ResultCard.tsx      # Card de resultado com linhas coloridas
    ├── screens/
    │   ├── WelcomeScreen.tsx   # Onboarding com 3 slides animados
    │   ├── LoginScreen.tsx     # Tela de login
    │   ├── RegisterScreen.tsx  # Tela de cadastro
    │   ├── HomeScreen.tsx      # Hub com cards de ferramentas
    │   ├── PrecificadorScreen.tsx  # Calculadora de preços
    │   ├── HoraHomemScreen.tsx     # Calculadora de custo hora-homem
    │   └── HistoricoScreen.tsx     # Histórico de simulações salvas
    └── navigation/
        ├── types.ts            # Tipos das rotas (RootStack, MainTabs)
        └── AppNavigator.tsx    # Stack + Bottom Tabs
```

---

## Variáveis e constantes importantes

### `src/constants/api.ts`

```ts
API_BASE_URL = 'https://api.cpod.com.br/v1'
MAX_SIMULATIONS = 10      // limite de simulações salvas por usuário
MOCK_DELAY_MS = 600       // delay simulado nas chamadas mock
```

### `src/constants/theme.ts`

Paleta cPod baseada no `cpod.css`:

| Token | Valor | Uso |
|---|---|---|
| `Colors.teal900` | `#071e1d` | Background principal |
| `Colors.teal700` | `#1F5C59` | Primário / gradiente |
| `Colors.purple` | `#C333F3` | Acento — Precificador |
| `Colors.cyan` | `#33C3F3` | Acento — Hora-Homem |
| `Colors.mint` | `#33F3C3` | Acento — destaques |

---

## Camada de API (mock → produção)

Todas as chamadas de API estão em `src/services/api.ts`. Enquanto o backend `api.cpod.com.br` não está disponível, todas as funções retornam dados simulados com delay configurável.

Para ativar uma chamada real, substitua o bloco mock pelo helper `apiCall<T>()` já documentado no arquivo. Cada função contém um comentário `// TODO: substituir por apiCall real`.

**Funções disponíveis:**

```ts
login(email, password)           // POST /auth/login
register(name, email, password)  // POST /auth/register
logout()                         // POST /auth/logout
getSimulations()                 // GET  /simulations
saveSimulation(data)             // POST /simulations (max 10)
deleteSimulation(id)             // DELETE /simulations/:id
```

---

## Fluxo de autenticação

- **Sem login**: todas as calculadoras funcionam normalmente; simulações não são salvas
- **Com login**: permite salvar até **10 simulações** no histórico
- Tokens armazenados com `expo-secure-store` (Keychain/Keystore nativo — nunca AsyncStorage)
- Chaves de storage: `cpod_access_token`, `cpod_refresh_token`, `cpod_user`
- Sessão restaurada automaticamente ao abrir o app

---

## Credenciais de teste

Enquanto a API estiver no modo mock:

| Campo | Valor |
|---|---|
| E-mail | `demo@cpod.com.br` |
| Senha | `demo1234` |

Qualquer outro e-mail/senha no cadastro também funciona no mock.

---

## Versões compatíveis

| Pacote | Versão |
|---|---|
| Expo SDK | `~54.0.33` |
| React Native | `0.81.5` |
| React | `19.1.0` |
| TypeScript | `~5.9.2` |
| expo-linear-gradient | `~15.0.8` |
| expo-secure-store | `~15.0.8` |
| @react-native-async-storage/async-storage | `2.2.0` |
| react-native-screens | `~4.16.0` |
| react-native-safe-area-context | `~5.6.0` |
| react-native-svg | `15.12.1` |

> ⚠️ Não use `npm install <pacote>` para dependências nativas do Expo — sempre use `npx expo install <pacote>` para garantir a versão compatível com o SDK atual.
