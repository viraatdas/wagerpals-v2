// Profile screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { User } from '../types';
import { formatCurrency } from '../utils/helpers';
import notificationService from '../services/notifications';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user: authUser, signOut } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [authUser]);

  const loadUserData = async () => {
    if (!authUser) return;

    try {
      const data = await apiService.getUser(authUser.id);
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
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
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#ea580c" />
          </View>
          <Text style={styles.username}>@{userData?.username}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(userData?.net_total || 0)}
            </Text>
            <Text style={styles.statLabel}>Net Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(userData?.total_bet || 0)}
            </Text>
            <Text style={styles.statLabel}>Total Bet</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userData?.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              if (!authUser?.id) return;
              try {
                // Ensure we have a token and it’s subscribed
                await notificationService.init(authUser.id);
                await apiService.sendPushToUser({
                  userId: authUser.id,
                  title: 'Test notification',
                  body: 'If you see this, mobile push works!',
                });
                Alert.alert('Success', 'Test notification sent (device required).');
              } catch (e) {
                console.error('Test push failed', e);
                Alert.alert('Error', 'Failed to send test notification.');
              }
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Send Test Notification</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditUsername' as never)}
          >
            <Ionicons name="create-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Edit Username</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
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
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ea580c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  signOutText: {
    color: '#dc2626',
  },
});


