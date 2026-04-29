import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PrecificadorScreen from '../screens/PrecificadorScreen';
import HoraHomemScreen from '../screens/HoraHomemScreen';
import LoteScreen from '../screens/LoteScreen';
import HistoricoScreen from '../screens/HistoricoScreen';

import { Colors, Typography } from '../constants/theme';
import { RootStackParamList, MainTabParamList } from './types';

// ─── Ícones de tab (emoji simples, sem dependência extra) ─────────────────────
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    </View>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.teal700,
        tabBarInactiveTintColor: Colors.subtle,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.medium,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Precificador"
        component={PrecificadorScreen}
        options={{
          title: 'Preços',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HoraHomem"
        component={HoraHomemScreen}
        options={{
          title: 'Hora-Homem',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⏱️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Lote"
        component={LoteScreen}
        options={{
          title: 'Lote',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Historico"
        component={HistoricoScreen}
        options={{
          title: 'Histórico',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💾" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}
