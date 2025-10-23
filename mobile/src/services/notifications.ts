// Push notification service using Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiService from './api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  async init(userId?: string) {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the token
    const token = await this.getExpoPushToken();
    
    if (token && userId) {
      // Subscribe to backend
      await this.subscribeToPush(token, userId);
    }

    // Set up listeners
    this.setupListeners();

    return token;
  }

  async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private setupListeners() {
    // Handle notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    // Handle user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Handle navigation based on notification data
        if (data.url) {
          // Navigate to the URL in data
          // This will be implemented in the navigation setup
        }
      }
    );
  }

  async subscribeToPush(token: string, userId: string) {
    try {
      await apiService.subscribeToPush({ token, userId });
      console.log('Subscribed to push notifications');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  async unsubscribeFromPush() {
    if (this.expoPushToken) {
      try {
        await apiService.unsubscribeFromPush(this.expoPushToken);
        console.log('Unsubscribed from push notifications');
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
      }
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Send a local notification (for testing)
  async sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  }
}

export default new NotificationService();


