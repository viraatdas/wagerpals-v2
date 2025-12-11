// Explore screen - Browse all events with modern iOS design
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Event } from '../types';
import { formatDate } from '../utils/helpers';

type FilterType = 'all' | 'active' | 'resolved';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEvents();
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'all') return events.length;
    return events.filter(e => e.status === filterType).length;
  };

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const isActive = item.status === 'active';
    const hasEnded = item.end_time < Date.now();

    return (
      <TouchableOpacity
        style={[styles.eventCard, index === 0 && styles.firstCard]}
        onPress={() => navigation.navigate('EventDetail' as never, { eventId: item.id } as never)}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.resolvedBadge]}>
            <View style={[styles.statusDot, isActive ? styles.activeDot : styles.resolvedDot]} />
            <Text style={[styles.statusText, isActive ? styles.activeText : styles.resolvedText]}>
              {item.status}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.sidesContainer}>
          <View style={styles.side}>
            <Text style={styles.sideLabel} numberOfLines={1}>{item.side_a}</Text>
          </View>
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.side}>
            <Text style={styles.sideLabel} numberOfLines={1}>{item.side_b}</Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          {isActive ? (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.timeText}>
                {hasEnded ? 'Betting closed' : `Ends ${formatDate(item.end_time)}`}
              </Text>
            </View>
          ) : (
            item.resolution && (
              <View style={styles.winnerContainer}>
                <Ionicons name="trophy" size={14} color="#ea580c" />
                <Text style={styles.winnerText}>
                  {item.resolution.winning_side}
                </Text>
              </View>
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Browse all betting events</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'resolved'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterPill, filter === filterType && styles.filterPillActive]}
            onPress={() => setFilter(filterType)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === filterType && styles.filterTextActive]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
            <View style={[styles.filterCount, filter === filterType && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, filter === filterType && styles.filterCountTextActive]}>
                {getFilterCount(filterType)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {filteredEvents.length > 0 ? (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
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
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
          </View>
          <Text style={styles.emptyStateText}>No events found</Text>
          <Text style={styles.emptyStateSubtext}>
            {filter !== 'all' 
              ? `No ${filter} events at the moment`
              : 'Create an event in one of your groups'
            }
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterCountTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  eventTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  resolvedBadge: {
    backgroundColor: '#f3f4f6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#10b981',
  },
  resolvedDot: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activeText: {
    color: '#059669',
  },
  resolvedText: {
    color: '#6b7280',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  sidesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  side: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  vsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: '#6b7280',
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerText: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
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
