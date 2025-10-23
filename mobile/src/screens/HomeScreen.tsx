// Home screen - Shows user's groups
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Group } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [user])
  );

  const loadGroups = async () => {
    if (!user) return;

    try {
      const data = await apiService.getGroups(user.id);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroups();
  };

  const handleCreateGroup = () => {
    Alert.prompt(
      'Create Group',
      'Enter a name for your group',
      async (groupName) => {
        if (!groupName || !user) return;

        try {
          const newGroup = await apiService.createGroup(groupName, user.id);
          navigation.navigate('GroupDetail' as never, { groupId: newGroup.id } as never);
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to create group');
        }
      },
      'plain-text'
    );
  };

  const handleJoinGroup = () => {
    Alert.prompt(
      'Join Group',
      'Enter the 6-digit group code',
      async (groupCode) => {
        if (!groupCode || !user) return;

        try {
          await apiService.joinGroup(groupCode, user.id);
          Alert.alert('Success', 'Join request submitted! Waiting for admin approval.');
          loadGroups();
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to join group');
        }
      },
      'plain-text'
    );
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupDetail' as never, { groupId: item.id } as never)}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.is_admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupInfoText}>Code: {item.id}</Text>
        <Text style={styles.groupInfoText}>•</Text>
        <Text style={styles.groupInfoText}>{item.member_count} members</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.titleText}>
              <Text style={styles.titleNormal}>Wager</Text>
              <Text style={styles.titleBold}>Pals</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile' as never)}
            style={styles.profileButton}
          >
            <Ionicons name="person-circle-outline" size={32} color="#ea580c" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateGroup}>
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionText}>Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleJoinGroup}>
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={styles.actionText}>Join Group</Text>
          </TouchableOpacity>
        </View>

        {groups.length > 0 ? (
          <View style={styles.groupsSection}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <FlatList
              data={groups}
              renderItem={renderGroupItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.groupsList}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No groups yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create a group or join one with a code
            </Text>
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
  },
  titleText: {
    fontSize: 32,
  },
  titleNormal: {
    fontWeight: '300',
  },
  titleBold: {
    fontWeight: '600',
    color: '#ea580c',
  },
  profileButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#333',
  },
  groupsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ea580c',
  },
  groupsList: {
    paddingBottom: 16,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '300',
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
    fontWeight: '300',
  },
  groupInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  groupInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});


