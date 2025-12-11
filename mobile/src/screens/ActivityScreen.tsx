// Activity screen - Shows recent activity with modern iOS design
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { ActivityItem } from '../types';
import { formatDate, formatCurrency } from '../utils/helpers';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await apiService.getActivity();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadActivity();
  };

  const getActivityIcon = (type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } => {
    switch (type) {
      case 'bet':
        return { name: 'cash-outline', color: '#10b981', bg: '#d1fae5' };
      case 'resolution':
        return { name: 'trophy-outline', color: '#f59e0b', bg: '#fef3c7' };
      case 'event_created':
        return { name: 'add-circle-outline', color: '#3b82f6', bg: '#dbeafe' };
      case 'comment':
        return { name: 'chatbubble-outline', color: '#8b5cf6', bg: '#ede9fe' };
      default:
        return { name: 'ellipse', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const renderActivityItem = ({ item, index }: { item: ActivityItem; index: number }) => {
    const icon = getActivityIcon(item.type);
    let title = '';
    let description = '';

    switch (item.type) {
      case 'bet':
        title = item.username || 'Someone';
        description = `Bet ${formatCurrency(item.amount || 0)} on ${item.side}`;
        if (item.note) {
          description += ` • "${item.note}"`;
        }
        break;
      case 'resolution':
        title = 'Event Resolved';
        description = `${item.winning_side} wins!`;
        break;
      case 'event_created':
        title = item.username || 'Someone';
        description = 'Created a new event';
        break;
      case 'comment':
        title = item.username || 'Someone';
        description = item.content || 'Left a comment';
        break;
    }

    return (
      <View style={[styles.activityCard, index === 0 && styles.firstCard]}>
        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
          </View>
          <Text style={styles.activityDescription} numberOfLines={2}>{description}</Text>
          <View style={styles.activityMeta}>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.event_title}</Text>
            {item.group_name && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.groupName} numberOfLines={1}>{item.group_name}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Loading activity...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Text style={styles.headerSubtitle}>Recent updates from your groups</Text>
      </View>

      {activities.length > 0 ? (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item, index) => `${item.event_id}-${item.timestamp}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor="#ea580c"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="pulse-outline" size={48} color="#d1d5db" />
          </View>
          <Text style={styles.emptyStateText}>No activity yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Activity from your groups will appear here
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  firstCard: {
    marginTop: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '500',
    flex: 1,
  },
  metaDot: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  groupName: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
