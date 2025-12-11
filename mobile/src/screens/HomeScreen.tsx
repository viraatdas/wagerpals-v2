// Home screen - Shows user's groups with modern iOS design
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Group } from '../types';
import TextInputModal from '../components/TextInputModal';

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

  const handleCreateGroup = async (groupName: string) => {
    if (!user) return;
    
    setShowCreateModal(false);
    try {
      const newGroup = await apiService.createGroup(groupName, user.id);
      navigation.navigate('GroupDetail' as never, { groupId: newGroup.id } as never);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupCode: string) => {
    if (!user) return;
    
    setShowJoinModal(false);
    try {
      await apiService.joinGroup(groupCode.toUpperCase(), user.id);
      Alert.alert('Success', 'Join request submitted! Waiting for admin approval.');
      loadGroups();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupDetail' as never, { groupId: item.id } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.groupCardInner}>
        <View style={styles.groupIconContainer}>
          <Ionicons name="people" size={24} color="#ea580c" />
        </View>
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
            {item.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <View style={styles.groupMeta}>
            <Text style={styles.groupCode}>{item.id}</Text>
            <Text style={styles.groupDot}>•</Text>
            <Text style={styles.memberCount}>{item.member_count} members</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.titleText}>
            <Text style={styles.titleNormal}>Wager</Text>
            <Text style={styles.titleBold}>Pals</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile' as never)}
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={20} color="#ea580c" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Cards */}
      <View style={styles.actionCards}>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Create Group</Text>
          <Text style={styles.actionSubtitle}>Start a new betting group</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, styles.actionCardAlt]} 
          onPress={() => setShowJoinModal(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, styles.actionIconAlt]}>
            <Ionicons name="enter-outline" size={24} color="#ea580c" />
          </View>
          <Text style={[styles.actionTitle, styles.actionTitleAlt]}>Join Group</Text>
          <Text style={[styles.actionSubtitle, styles.actionSubtitleAlt]}>Enter a group code</Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <View style={styles.groupsSection}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
        
        {groups.length > 0 ? (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.groupsList}
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
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
            </View>
            <Text style={styles.emptyStateText}>No groups yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create a group or join one with a code to get started
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <TextInputModal
        visible={showCreateModal}
        title="Create Group"
        message="Enter a name for your new betting group"
        placeholder="Group name"
        onSubmit={handleCreateGroup}
        onCancel={() => setShowCreateModal(false)}
        submitText="Create"
      />

      <TextInputModal
        visible={showJoinModal}
        title="Join Group"
        message="Enter the 6-character group code"
        placeholder="ABC123"
        maxLength={6}
        onSubmit={handleJoinGroup}
        onCancel={() => setShowJoinModal(false)}
        submitText="Join"
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 28,
  },
  titleNormal: {
    fontWeight: '300',
    color: '#1f2937',
  },
  titleBold: {
    fontWeight: '700',
    color: '#ea580c',
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ea580c',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCardAlt: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconAlt: {
    backgroundColor: '#fff5f3',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionTitleAlt: {
    color: '#1f2937',
  },
  actionSubtitleAlt: {
    color: '#6b7280',
  },
  groupsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  groupsList: {
    paddingBottom: 20,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  groupCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff5f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupCode: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  groupDot: {
    fontSize: 13,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  memberCount: {
    fontSize: 13,
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
