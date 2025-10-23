// Group Detail Screen - Shows group info, events, and members
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Event, GroupMember } from '../types';
import { formatDate, formatCurrency } from '../utils/helpers';

export default function GroupDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { groupId } = route.params as { groupId: string };

  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userStatus, setUserStatus] = useState<'active' | 'pending'>('active');

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [groupId, user])
  );

  const loadGroupData = async () => {
    if (!user) return;

    try {
      // Fetch group details
      const groupData = await fetch(`${apiService.API_BASE_URL}/api/groups?id=${groupId}`).then(r => r.json());
      setGroup(groupData);

      // Check user's role and status
      const userMember = groupData.members?.find((m: GroupMember) => m.user_id === user.id);
      setIsAdmin(userMember?.role === 'admin');
      setUserStatus(userMember?.status || 'pending');

      // Fetch events
      const eventsData = await apiService.getEvents(groupId);
      setEvents(eventsData);

      // Fetch members
      const membersData = await apiService.getGroupMembers(groupId);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load group data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroupData();
  };

  const handleShareInvite = async () => {
    try {
      const message = `Join my betting group "${group.name}" on WagerPals!\n\nUse code: ${groupId}\n\nOr click: wagerpals://groups/join/${groupId}`;
      
      await Share.share({
        message,
        title: `Join ${group.name} on WagerPals`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const categorizeEvents = () => {
    const now = Date.now();
    const active = events.filter((e) => e.status === 'active' && e.end_time > now);
    const ended = events.filter((e) => e.status === 'resolved' || (e.status === 'active' && e.end_time <= now));
    return { active, ended };
  };

  const renderEventCard = (event: Event) => {
    const isActive = event.status === 'active' && event.end_time > Date.now();
    const isResolved = event.status === 'resolved';

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail' as never, { eventId: event.id } as never)}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.endedBadge]}>
            <Text style={styles.statusText}>{isActive ? 'Active' : isResolved ? 'Resolved' : 'Ended'}</Text>
          </View>
        </View>

        <View style={styles.sidesRow}>
          <View style={styles.sideBox}>
            <Text style={styles.sideText} numberOfLines={1}>{event.side_a}</Text>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.sideBox}>
            <Text style={styles.sideText} numberOfLines={1}>{event.side_b}</Text>
          </View>
        </View>

        {isActive ? (
          <Text style={styles.eventTime}>Ends {formatDate(event.end_time)}</Text>
        ) : isResolved && event.resolution ? (
          <Text style={styles.winnerText}>Winner: {event.resolution.winning_side}</Text>
        ) : (
          <Text style={styles.eventTime}>Betting closed</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  // Show pending approval message
  if (userStatus === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.pendingContainer}>
          <Ionicons name="hourglass-outline" size={64} color="#f59e0b" />
          <Text style={styles.pendingTitle}>Pending Approval</Text>
          <Text style={styles.pendingText}>
            Your request to join "{group?.name}" is waiting for admin approval.
          </Text>
          <Text style={styles.pendingSubtext}>
            You'll receive a notification when you're approved.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { active, ended } = categorizeEvents();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Group Header */}
        <View style={styles.header}>
          <Text style={styles.groupName}>{group?.name}</Text>
          <View style={styles.groupInfo}>
            <Text style={styles.groupCode}>Code: {groupId}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.memberCount}>{members.length} members</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShareInvite}>
            <Ionicons name="share-outline" size={20} color="#ea580c" />
            <Text style={styles.actionButtonText}>Invite</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('GroupAdmin' as never, { groupId } as never)}
            >
              <Ionicons name="settings-outline" size={20} color="#ea580c" />
              <Text style={styles.actionButtonText}>Manage</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateEvent' as never, { groupId } as never)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#ea580c" />
            <Text style={styles.actionButtonText}>New Event</Text>
          </TouchableOpacity>
        </View>

        {/* Active Events */}
        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Events</Text>
            {active.map(renderEventCard)}
          </View>
        )}

        {/* Ended Events */}
        {ended.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ended Events</Text>
            {ended.slice(0, 5).map(renderEventCard)}
          </View>
        )}

        {events.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first event to get started!
            </Text>
          </View>
        )}

        {/* Members Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {members.filter(m => m.status === 'active').slice(0, 5).map((member) => (
            <View key={member.user_id} style={styles.memberItem}>
              <Text style={styles.memberName}>{member.username}</Text>
              {member.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          ))}
          {members.filter(m => m.status === 'active').length > 5 && (
            <Text style={styles.moreText}>
              +{members.filter(m => m.status === 'active').length - 5} more
            </Text>
          )}
        </View>
      </ScrollView>
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
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  pendingSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ea580c',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  groupName: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupCode: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    marginHorizontal: 8,
    color: '#666',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff5f3',
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  endedBadge: {
    backgroundColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sidesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sideBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sideText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  vsText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: '#999',
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  winnerText: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '500',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
  },
  adminBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#9a3412',
  },
  moreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
