# Guia de Configuração do Google AdMob

Este guia descreve todos os passos necessários para configurar o Google AdMob em produção no app **cPod Precificador** (`br.com.cpod.precificador`).

---

## 1. Criar conta no AdMob

1. Acesse [admob.google.com](https://admob.google.com) e entre com uma conta Google
2. Siga o assistente de criação de conta (nome, país, fuso horário, moeda)
3. Aceite os termos de uso

---

## 2. Cadastrar os aplicativos

Você precisa cadastrar **dois apps** separados: um para Android e um para iOS.

### Android
1. No painel do AdMob, clique em **Aplicativos → Adicionar app**
2. Selecione a plataforma **Android**
3. Se o app já estiver publicado na Play Store, pesquise pelo nome; caso contrário, escolha "Adicionar manualmente"
4. Nome do app: `cPod Precificador`
5. Confirme a criação → copie o **App ID** gerado (formato: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)

### iOS
1. Repita o processo acima selecionando a plataforma **iOS**
2. Copie o **App ID** gerado para o iOS

---

## 3. Criar as unidades de anúncio (Ad Units)

Para cada app (Android e iOS), crie uma unidade do tipo **Banner**:

1. No painel do app, clique em **Unidades de anúncio → Adicionar unidade de anúncio**
2. Escolha o formato **Banner**
3. Nome sugerido: `banner-principal`
4. Copie o **ID da unidade de anúncio** gerado (formato: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)

> Você terá ao final 4 valores:
> - App ID Android
> - App ID iOS
> - Ad Unit ID Banner Android
> - Ad Unit ID Banner iOS

---

## 4. Atualizar o `app.json`

Substitua os IDs de teste pelos IDs reais da sua conta:

```json
"plugins": [
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
      "iosAppId":     "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
    }
  ]
]
```

> **Atenção:** o App ID usa `~` (til) como separador, não `/`.

---

## 5. Atualizar o componente `BannerAd.tsx`

Abra `src/components/BannerAd.tsx` e substitua os placeholders pelos Ad Unit IDs reais:

```ts
const BANNER_ID = Platform.select({
  android: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // ← Ad Unit ID Android real
  ios: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // ← Ad Unit ID iOS real
}) as string;
```

O bloco `__DEV__` garante que em desenvolvimento os IDs de teste do Google são usados automaticamente, sem risco de violação de política.

---

## 6. Rebuildar o app nativo

O plugin do AdMob modifica arquivos nativos. Após alterar o `app.json`, é necessário gerar um novo build:

```bash
# Via EAS Build (recomendado para produção)
npx eas build --platform android
npx eas build --platform ios

# Via build local (para testes)
npx expo run:android
npx expo run:ios
```

> O Expo Go **não suporta** módulos nativos de anúncios. Use sempre um build de desenvolvimento ou produção.

---

## 7. Verificar conformidade com as políticas do AdMob

Antes de publicar, confirme:

- [ ] O app possui uma **Política de Privacidade** acessível
- [ ] A política menciona o uso de anúncios personalizados e coleta de dados
- [ ] O app exibe um **banner de consentimento (LGPD/GDPR)** se necessário — considere usar `react-native-google-mobile-ads` junto com `@react-native-google/consent` para o UMP (User Messaging Platform)
- [ ] Os anúncios **não estão posicionados próximos a botões clicáveis** de forma que induza cliques acidentais
- [ ] O app **não incentiva cliques** em anúncios

---

## 8. Tempo de ativação

Após criar a conta e os apps no AdMob:

- Os anúncios podem levar até **24–48 horas** para começar a exibir
- Os primeiros pagamentos só ocorrem após atingir o limite mínimo (R$ 250,00 no Brasil)

---

## Referências

- [Documentação react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads)
- [Políticas do programa AdMob](https://support.google.com/admob/answer/6128543)
- [Guia de primeiros passos AdMob](https://support.google.com/admob/answer/7356431)
