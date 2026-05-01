import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import PremiumScreen from "../screens/PremiumScreen";
import ConfigPadraoScreen from "../screens/ConfigPadraoScreen";
import HomeScreen from "../screens/HomeScreen";
import PrecificadorScreen from "../screens/PrecificadorScreen";
import HoraHomemScreen from "../screens/HoraHomemScreen";
import GrupoCompraScreen from "../screens/GrupoCompraScreen";
import HistoricoScreen from "../screens/HistoricoScreen";

import { Colors, Typography } from "../constants/theme";
import { RootStackParamList, MainTabParamList } from "./types";

// ─── Ícones de tab (emoji simples, sem dependência extra) ─────────────────────
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
        {emoji}
      </Text>
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
          height: 100,
          paddingBottom: 12,
          paddingTop: 12,
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
          title: "Início",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Precificador"
        component={PrecificadorScreen}
        options={{
          title: "Produtos",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HoraHomem"
        component={HoraHomemScreen}
        options={{
          title: "Serviços",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⏱️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GrupoCompra"
        component={GrupoCompraScreen}
        options={{
          title: "Grupo",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
        }}
      />
      {/* <Tab.Screen
        name="Historico"
        component={HistoricoScreen}
        options={{
          title: "Histórico",
          tabBarIcon: ({ focused }) => <TabIcon emoji="💾" focused={focused} />,
        }}
      /> */}
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
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="ConfigPadrao" component={ConfigPadraoScreen} />
    </Stack.Navigator>
  );
}
