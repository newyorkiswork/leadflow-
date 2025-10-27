// Lead AI Pro - Mobile Dashboard Screen (2025)
// Mobile-first dashboard with voice control and AI insights

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
  Vibration,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import LinearGradient from 'react-native-linear-gradient'
import { useNavigation } from '@react-navigation/native'

// Components
import { MetricCard } from '../components/MetricCard'
import { LeadCard } from '../components/LeadCard'
import { ActionButton } from '../components/ActionButton'
import { VoiceButton } from '../components/VoiceButton'
import { NotificationBanner } from '../components/NotificationBanner'
import { AIInsightCard } from '../components/AIInsightCard'

// Hooks
import { useLeads } from '../hooks/useLeads'
import { useNotifications } from '../hooks/useNotifications'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import { useAIInsights } from '../hooks/useAIInsights'

// Services
import { DashboardService } from '../services/DashboardService'
import { AnalyticsService } from '../services/AnalyticsService'

const { width } = Dimensions.get('window')

interface DashboardData {
  metrics: {
    totalLeads: number
    hotLeads: number
    todayActions: number
    thisWeekMeetings: number
    conversionRate: number
    responseRate: number
  }
  todayActions: Array<{
    id: string
    type: 'call' | 'email' | 'meeting'
    leadName: string
    time: string
    priority: 'high' | 'medium' | 'low'
  }>
  hotLeads: Array<{
    id: string
    name: string
    company: string
    score: number
    lastActivity: string
    nextAction: string
  }>
  aiInsights: Array<{
    id: string
    type: 'opportunity' | 'risk' | 'recommendation'
    title: string
    description: string
    confidence: number
    actionable: boolean
  }>
}

export default function DashboardScreen() {
  const navigation = useNavigation()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today')
  
  // Hooks
  const { leads, refreshLeads } = useLeads()
  const { notifications, markAsRead } = useNotifications()
  const { isListening, startListening, stopListening } = useVoiceCommands()
  const { insights, refreshInsights } = useAIInsights()

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    loadDashboardData()
    setupAnimations()
    
    // Track screen view
    AnalyticsService.trackScreenView('Dashboard')
  }, [])

  useEffect(() => {
    // Refresh data when timeframe changes
    loadDashboardData()
  }, [selectedTimeframe])

  const setupAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const loadDashboardData = async () => {
    try {
      const data = await DashboardService.getDashboardData(selectedTimeframe)
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        loadDashboardData(),
        refreshLeads(),
        refreshInsights(),
      ])
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleVoiceCommand = async () => {
    if (isListening) {
      stopListening()
    } else {
      Vibration.vibrate(50) // Haptic feedback
      startListening()
    }
  }

  const handleQuickAction = (action: string, data?: any) => {
    AnalyticsService.trackEvent('quick_action', { action, source: 'dashboard' })
    
    switch (action) {
      case 'scan_card':
        navigation.navigate('BusinessCardScanner' as never)
        break
      case 'add_lead':
        navigation.navigate('AddLead' as never)
        break
      case 'make_call':
        if (data?.leadId) {
          navigation.navigate('Call' as never, { leadId: data.leadId } as never)
        }
        break
      case 'schedule_meeting':
        navigation.navigate('Calendar' as never, { action: 'schedule' } as never)
        break
      case 'view_lead':
        navigation.navigate('LeadDetail' as never, { leadId: data.leadId } as never)
        break
    }
  }

  const urgentNotifications = notifications.filter(n => n.priority === 'urgent' || n.priority === 'high')

  if (isLoading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good morning!</Text>
              <Text style={styles.subtitle}>Ready to close some deals?</Text>
            </View>
            <VoiceButton 
              isListening={isListening}
              onPress={handleVoiceCommand}
            />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Urgent Notifications */}
          {urgentNotifications.length > 0 && (
            <View style={styles.section}>
              {urgentNotifications.slice(0, 2).map((notification) => (
                <NotificationBanner
                  key={notification.id}
                  notification={notification}
                  onPress={() => markAsRead(notification.id)}
                />
              ))}
            </View>
          )}

          {/* Timeframe Selector */}
          <View style={styles.timeframeSelector}>
            {(['today', 'week', 'month'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.timeframeTextActive
                ]}>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.metricsGrid}>
              <MetricCard
                title="Total Leads"
                value={dashboardData?.metrics.totalLeads.toString() || '0'}
                icon="people"
                color="#3B82F6"
                trend={{ value: 12, isPositive: true }}
              />
              <MetricCard
                title="Hot Leads"
                value={dashboardData?.metrics.hotLeads.toString() || '0'}
                icon="whatshot"
                color="#EF4444"
                trend={{ value: 8, isPositive: true }}
              />
              <MetricCard
                title="Today's Actions"
                value={dashboardData?.metrics.todayActions.toString() || '0'}
                icon="today"
                color="#10B981"
                trend={{ value: 5, isPositive: true }}
              />
              <MetricCard
                title="Conversion Rate"
                value={`${dashboardData?.metrics.conversionRate || 0}%`}
                icon="trending_up"
                color="#8B5CF6"
                trend={{ value: 3.2, isPositive: true }}
              />
            </View>
          </View>

          {/* AI Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalScroll}>
                {insights.slice(0, 3).map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={insight}
                    onPress={() => {/* Handle insight action */}}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Today's Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Actions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar' as never)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {dashboardData?.todayActions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="check-circle" size={48} color="#10B981" />
                <Text style={styles.emptyStateText}>All caught up for today!</Text>
              </View>
            ) : (
              <View style={styles.actionsList}>
                {dashboardData?.todayActions.slice(0, 3).map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionItem}
                    onPress={() => handleQuickAction('view_lead', { leadId: action.id })}
                  >
                    <View style={styles.actionIcon}>
                      <Icon 
                        name={action.type === 'call' ? 'phone' : action.type === 'email' ? 'email' : 'event'} 
                        size={20} 
                        color="#3B82F6" 
                      />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{action.leadName}</Text>
                      <Text style={styles.actionTime}>{action.time}</Text>
                    </View>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: action.priority === 'high' ? '#EF4444' : action.priority === 'medium' ? '#F59E0B' : '#6B7280' }
                    ]}>
                      <Text style={styles.priorityText}>{action.priority}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Hot Leads */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hot Leads</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Leads' as never)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalScroll}>
                {dashboardData?.hotLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onPress={() => handleQuickAction('view_lead', { leadId: lead.id })}
                    onCall={() => handleQuickAction('make_call', { leadId: lead.id })}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <ActionButton
                icon="camera-alt"
                label="Scan Card"
                color="#3B82F6"
                onPress={() => handleQuickAction('scan_card')}
              />
              <ActionButton
                icon="person-add"
                label="Add Lead"
                color="#10B981"
                onPress={() => handleQuickAction('add_lead')}
              />
              <ActionButton
                icon="phone"
                label="Make Call"
                color="#EF4444"
                onPress={() => handleQuickAction('make_call')}
              />
              <ActionButton
                icon="event"
                label="Schedule"
                color="#8B5CF6"
                onPress={() => handleQuickAction('schedule_meeting')}
              />
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 20,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horizontalScroll: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  actionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
