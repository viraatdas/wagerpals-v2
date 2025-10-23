// Group Admin Screen - Manage members
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { GroupMember } from '../types';

export default function GroupAdminScreen() {
  const route = useRoute();
  const { user } = useAuth();
  const { groupId } = route.params as { groupId: string };

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      const data = await apiService.getGroupMembers(groupId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAction = async (
    action: 'approve' | 'decline' | 'promote' | 'demote' | 'remove',
    targetUserId: string,
    username: string
  ) => {
    if (!user) return;

    const actionMessages = {
      approve: `Approve ${username}?`,
      decline: `Decline ${username}'s request?`,
      promote: `Promote ${username} to admin?`,
      demote: `Demote ${username} to member?`,
      remove: `Remove ${username} from group?`,
    };

    Alert.alert(
      'Confirm Action',
      actionMessages[action],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await apiService.manageGroupMember(action, groupId, user.id, targetUserId);
              Alert.alert('Success', `Action completed successfully`);
              loadMembers();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to perform action');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  const pendingMembers = members.filter((m) => m.status === 'pending');
  const activeMembers = members.filter((m) => m.status === 'active');
  const admins = activeMembers.filter((m) => m.role === 'admin');
  const regularMembers = activeMembers.filter((m) => m.role === 'member');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadMembers(); }} />}
      >
        {/* Pending Requests */}
        {pendingMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests ({pendingMembers.length})</Text>
            {pendingMembers.map((member) => (
              <View key={member.user_id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberStatus}>Waiting for approval</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleAction('approve', member.user_id, member.username || '')}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.declineBtn]}
                    onPress={() => handleAction('decline', member.user_id, member.username || '')}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Admins */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admins ({admins.length})</Text>
          {admins.map((member) => (
            <View key={member.user_id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.username}</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              </View>
              {member.user_id !== user?.id && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={() => handleAction('demote', member.user_id, member.username || '')}
                >
                  <Text style={styles.btnText}>Demote</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({regularMembers.length})</Text>
          {regularMembers.map((member) => (
            <View key={member.user_id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.username}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={() => handleAction('promote', member.user_id, member.username || '')}
                >
                  <Text style={styles.btnText}>Promote</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.removeBtn]}
                  onPress={() => handleAction('remove', member.user_id, member.username || '')}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberStatus: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#9a3412',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  declineBtn: {
    backgroundColor: '#ef4444',
  },
  secondaryBtn: {
    backgroundColor: '#ea580c',
  },
  removeBtn: {
    backgroundColor: '#dc2626',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
