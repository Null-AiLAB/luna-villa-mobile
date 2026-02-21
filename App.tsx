/**
 * 🏖️ Luna Villa — メインアプリ
 * タブナビゲーション + 認証フロー
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { api } from './src/api';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TaskScreen from './src/screens/TaskScreen';
import MemoScreen from './src/screens/MemoScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// タブアイコン
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  const { theme } = useTheme();
  return (
    <Text style={{
      fontSize: focused ? 26 : 22,
      opacity: focused ? 1 : 0.5,
      color: focused ? theme.primary : theme.textSecondary
    }}>
      {icon}
    </Text>
  );
}

function SettingsWrapper({ onLogout }: { onLogout: () => void }) {
  return <SettingsScreen onLogout={onLogout} />;
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    await api.init();
    setIsLoggedIn(api.isAuthenticated());
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>🌙</Text>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              borderTopWidth: 1,
              height: 65,
              paddingBottom: 10,
              paddingTop: 5,
            },
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.textMuted,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarLabel: 'チャット',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="💬" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarLabel: 'カレンダー',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="📅" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Tasks"
            component={TaskScreen}
            options={{
              tabBarLabel: 'タスク',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="✅" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Memos"
            component={MemoScreen}
            options={{
              tabBarLabel: 'メモ',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="📌" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            options={{
              tabBarLabel: '設定',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="⚙️" focused={focused} />
              ),
            }}
          >
            {() => <SettingsWrapper onLogout={() => setIsLoggedIn(false)} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 48,
    marginTop: 16,
  },
});
