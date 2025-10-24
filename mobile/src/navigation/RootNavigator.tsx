// Root navigator setup
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { RootStackParamList } from '../types/navigation';
import authService from '../services/auth';
import { AuthUser } from '../types';

// Screens
import AuthScreen from '../screens/AuthScreen';
import UsernameSetupScreen from '../screens/UsernameSetupScreen';
import MainTabNavigator from './MainTabNavigator';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import GroupAdminScreen from '../screens/GroupAdminScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditUsernameScreen from '../screens/EditUsernameScreen';
import notificationService from '../services/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');

export default function RootNavigator() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth service
    authService.init().then(() => {
      setIsLoading(false);
    });

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged((newUser) => {
      setUser(newUser);
    });

    return unsubscribe;
  }, []);

  // Subscribe to push notifications when a user is available
  useEffect(() => {
    if (user?.id) {
      // Ensure notifications are initialized and token is subscribed for this user
      notificationService.init(user.id);
    }
  }, [user?.id]);

  const linking = {
    prefixes: [prefix, 'wagerpals://', 'https://wagerpals.io', 'https://*.wagerpals.io'],
    config: {
      screens: {
        Main: {
          screens: {
            Home: '',
            Activity: 'activity',
            Explore: 'explore',
          },
        },
        GroupDetail: 'groups/:groupId',
        EventDetail: 'events/:eventId',
        JoinGroup: 'groups/join/:groupId',
        GroupAdmin: 'groups/:groupId/admin',
      },
    },
  } as any;

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="UsernameSetup" component={UsernameSetupScreen} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="GroupDetail" 
              component={GroupDetailScreen}
              options={{ headerShown: true, title: 'Group' }}
            />
            <Stack.Screen 
              name="EventDetail" 
              component={EventDetailScreen}
              options={{ headerShown: true, title: 'Event' }}
            />
            <Stack.Screen 
              name="CreateEvent" 
              component={CreateEventScreen}
              options={{ headerShown: true, title: 'Create Event', presentation: 'modal' }}
            />
            <Stack.Screen 
              name="GroupAdmin" 
              component={GroupAdminScreen}
              options={{ headerShown: true, title: 'Manage Group' }}
            />
            <Stack.Screen 
              name="JoinGroup" 
              component={JoinGroupScreen}
              options={{ headerShown: true, title: 'Join Group' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ headerShown: true, title: 'Profile' }}
            />
            <Stack.Screen 
              name="EditUsername" 
              component={EditUsernameScreen}
              options={{ headerShown: true, title: 'Edit Username', presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

