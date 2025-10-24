// Activity screen - Shows recent activity across all groups
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'bet':
        return '💰';
      case 'resolution':
        return '🏆';
      case 'event_created':
        return '📋';
      case 'comment':
        return '💬';
      default:
        return '•';
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => {
    let description = '';

    switch (item.type) {
      case 'bet':
        description = `${item.username} bet ${formatCurrency(item.amount || 0)} on ${item.side}`;
        if (item.note) {
          description += ` - "${item.note}"`;
        }
        break;
      case 'resolution':
        description = `Event resolved - ${item.winning_side} wins!`;
        break;
      case 'event_created':
        description = `${item.username} created ${item.event_title}`;
        break;
      case 'comment':
        description = `${item.username}: ${item.content}`;
        break;
    }

    return (
      <View style={styles.activityCard}>
        <Text style={styles.activityIcon}>{renderActivityIcon(item.type)}</Text>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.event_title}</Text>
          <Text style={styles.activityDescription}>{description}</Text>
          {item.group_name && (
            <Text style={styles.activityGroup}>{item.group_name}</Text>
          )}
          <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {activities.length > 0 ? (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item, index) => `${item.event_id}-${item.timestamp}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityGroup: {
    fontSize: 12,
    color: '#ea580c',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    fontWeight: '300',
    textAlign: 'center',
  },
});



