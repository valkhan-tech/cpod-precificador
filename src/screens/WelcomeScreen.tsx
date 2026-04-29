import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CpodLogo from '../components/CpodLogo';
import Button from '../components/Button';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🏷️',
    title: 'Precifique com\nconfiança',
    description:
      'Calcule o preço ideal dos seus produtos e serviços considerando custos, taxas, impostos e margem de lucro.',
  },
  {
    id: '2',
    icon: '⚡',
    title: 'Use sem\ncadastro',
    description:
      'Acesse todas as calculadoras gratuitamente. Sem burocracia, sem surpresas — só resultados.',
  },
  {
    id: '3',
    icon: '💾',
    title: 'Salve suas\nsimulações',
    description:
      'Crie uma conta gratuita e salve até 10 simulações no histórico para reaproveitar sempre que precisar.',
  },
];

export default function WelcomeScreen({ navigation }: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<Slide>>(null);

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={styles.slide}>
      <Text style={styles.slideIcon}>{item.icon}</Text>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDesc}>{item.description}</Text>
    </View>
  );

  const renderDot = (_: unknown, index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.4, 0.8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View key={index} style={[styles.dot, { transform: [{ scale }], opacity }]} />
    );
  };

  return (
    <LinearGradient
      colors={[Colors.teal900, Colors.teal800, Colors.teal700]}
      style={styles.fill}
    >
      <SafeAreaView style={styles.fill}>
        {/* Header */}
        <View style={styles.header}>
          <CpodLogo size={160} variant="full" />
          <Text style={styles.tagline}>Precificador</Text>
        </View>

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(s) => s.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          style={styles.slider}
        />

        {/* Dots */}
        <View style={styles.dots}>{SLIDES.map(renderDot)}</View>

        {/* CTA */}
        <View style={styles.cta}>
          <Button
            title="Começar a usar"
            onPress={() => navigation.navigate('Main')}
            style={styles.btnPrimary}
          />
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Ferramenta gratuita para empreendedores. Sem anúncios.
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  tagline: {
    marginTop: Spacing.sm,
    color: Colors.teal300,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  slider: {
    flexGrow: 0,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  slideIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  slideTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing.md,
  },
  slideDesc: {
    fontSize: Typography.base,
    color: Colors.teal100,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.teal300,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  btnPrimary: {
    borderRadius: Radius.md,
  },
  btnLogin: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  btnLoginText: {
    color: Colors.teal100,
    fontSize: Typography.base,
  },
  btnLoginAccent: {
    color: Colors.mint,
    fontWeight: Typography.bold,
  },
  disclaimer: {
    textAlign: 'center',
    color: Colors.teal300,
    fontSize: Typography.xs,
    paddingBottom: Spacing.lg,
    opacity: 0.7,
  },
});
