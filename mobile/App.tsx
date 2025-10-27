// Lead AI Pro - Mobile App (2025)
// React Native mobile application with AI-native features

import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { 
  SafeAreaProvider, 
  SafeAreaView 
} from 'react-native-safe-area-context'
import {
  StatusBar,
  Platform,
  Alert,
  Linking
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { enableScreens } from 'react-native-screens'
import Icon from 'react-native-vector-icons/MaterialIcons'

// Screens
import DashboardScreen from './src/screens/DashboardScreen'
import LeadsScreen from './src/screens/LeadsScreen'
import CalendarScreen from './src/screens/CalendarScreen'
import CameraScreen from './src/screens/CameraScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import LeadDetailScreen from './src/screens/LeadDetailScreen'
import BusinessCardScannerScreen from './src/screens/BusinessCardScannerScreen'
import DocumentScannerScreen from './src/screens/DocumentScannerScreen'
import CallScreen from './src/screens/CallScreen'
import EmailComposerScreen from './src/screens/EmailComposerScreen'
import SettingsScreen from './src/screens/SettingsScreen'

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { LeadProvider } from './src/context/LeadContext'
import { NotificationProvider } from './src/context/NotificationContext'

// Services
import { initializeNotifications } from './src/services/NotificationService'
import { initializeVoiceRecognition } from './src/services/VoiceService'
import { initializeAIServices } from './src/services/AIService'

// Enable screens for better performance
enableScreens()

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard'
              break
            case 'Leads':
              iconName = 'people'
              break
            case 'Calendar':
              iconName = 'event'
              break
            case 'Camera':
              iconName = 'camera-alt'
              break
            case 'Profile':
              iconName = 'person'
              break
            default:
              iconName = 'help'
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarBadge: undefined, // Will be set dynamically based on notifications
        }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadsScreen}
        options={{
          tabBarLabel: 'Leads',
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  )
}

// Root Stack Navigator
function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LeadDetail" 
        component={LeadDetailScreen}
        options={({ route }) => ({
          title: (route.params as any)?.leadName || 'Lead Details',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen 
        name="BusinessCardScanner" 
        component={BusinessCardScannerScreen}
        options={{
          title: 'Scan Business Card',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="DocumentScanner" 
        component={DocumentScannerScreen}
        options={{
          title: 'Scan Document',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Call" 
        component={CallScreen}
        options={{
          title: 'Call in Progress',
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="EmailComposer" 
        component={EmailComposerScreen}
        options={{
          title: 'Compose Email',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Stack.Navigator>
  )
}

// Main App Component
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Initialize core services
      await Promise.all([
        initializeNotifications(),
        initializeVoiceRecognition(),
        initializeAIServices(),
      ])

      // Check for app updates
      await checkForUpdates()

      // Setup deep linking
      setupDeepLinking()

      setIsInitialized(true)
    } catch (error) {
      console.error('App initialization failed:', error)
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart and try again.',
        [{ text: 'OK' }]
      )
    }
  }

  const checkForUpdates = async () => {
    try {
      // Check for app updates
      const response = await fetch('https://api.leadaipro.com/app/version')
      const { latestVersion, forceUpdate } = await response.json()
      
      const currentVersion = await AsyncStorage.getItem('app_version')
      
      if (latestVersion !== currentVersion) {
        Alert.alert(
          'Update Available',
          `A new version (${latestVersion}) is available. ${forceUpdate ? 'This update is required.' : 'Would you like to update now?'}`,
          [
            ...(forceUpdate ? [] : [{ text: 'Later', style: 'cancel' }]),
            { 
              text: 'Update', 
              onPress: () => {
                // Open app store
                const storeUrl = Platform.OS === 'ios' 
                  ? 'https://apps.apple.com/app/lead-ai-pro'
                  : 'https://play.google.com/store/apps/details?id=com.leadaipro'
                Linking.openURL(storeUrl)
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Update check failed:', error)
    }
  }

  const setupDeepLinking = () => {
    // Handle deep links
    const handleDeepLink = (url: string) => {
      // Parse URL and navigate accordingly
      console.log('Deep link received:', url)
    }

    // Listen for deep links
    Linking.addEventListener('url', ({ url }) => handleDeepLink(url))

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })
  }

  if (isLoading || !isInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Loading screen component would go here */}
      </SafeAreaView>
    )
  }

  if (!isAuthenticated) {
    // Return login/auth screens
    return (
      <SafeAreaView style={{ flex: 1 }}>
        {/* Auth screens would go here */}
      </SafeAreaView>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#3B82F6"
        translucent={false}
      />
      <RootStack />
    </NavigationContainer>
  )
}

// Root App with Providers
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LeadProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </LeadProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

// App configuration
const AppConfig = {
  name: 'Lead AI Pro',
  version: '1.0.0',
  buildNumber: '1',
  apiUrl: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://api.leadaipro.com',
  features: {
    voiceRecognition: true,
    businessCardScanning: true,
    documentScanning: true,
    aiInsights: true,
    realTimeSync: true,
    offlineMode: true,
    pushNotifications: true,
    biometricAuth: true,
  },
  ai: {
    providers: ['openai', 'anthropic'],
    features: [
      'lead_scoring',
      'conversation_intelligence',
      'behavioral_analysis',
      'predictive_analytics',
      'automated_responses',
      'smart_scheduling'
    ]
  },
  integrations: {
    calendar: ['google', 'outlook', 'apple'],
    email: ['gmail', 'outlook', 'apple_mail'],
    calling: ['twilio', 'vonage'],
    crm: ['salesforce', 'hubspot', 'pipedrive']
  }
}

export { AppConfig }
