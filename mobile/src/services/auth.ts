// Authentication service using Auth0
import * as SecureStore from 'expo-secure-store';
import { Auth0 } from 'react-native-auth0';
import { AuthUser } from '../types';

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN || 'dev-ti4x5dupc1lejewk.us.auth0.com';
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || 'M7v0CKV88mVEscfNVWVj2wZS54CzV3oP';

// Initialize Auth0 client
const auth0 = new Auth0({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  async init() {
    // Try to restore session from secure storage
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      const storedToken = await SecureStore.getItemAsync('accessToken');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      console.log('Starting Auth0 Google sign in...');
      
      // Use Auth0's authorize method with Google connection
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email',
        connection: 'google-oauth2',
      });

      console.log('Auth0 credentials received:', credentials ? 'yes' : 'no');

      if (credentials.accessToken) {
        // Store the access token
        await SecureStore.setItemAsync('accessToken', credentials.accessToken);
        
        if (credentials.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', credentials.refreshToken);
        }

        // Get user info from Auth0
        const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
        
        console.log('Auth0 user info:', userInfo);

        const user: AuthUser = {
          id: userInfo.sub || userInfo.email || '',
          email: userInfo.email || '',
          displayName: userInfo.name || userInfo.nickname || userInfo.email?.split('@')[0] || 'User',
          primaryEmail: userInfo.email || '',
        };

        await this.setUser(user);
        return user;
      }

      throw new Error('No access token received from Auth0');
    } catch (error: any) {
      console.error('Auth0 Google sign in error:', error);
      
      // Handle user cancellation
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        throw new Error('Authentication cancelled');
      }
      
      throw error;
    }
  }

  async signOut() {
    try {
      // Clear Auth0 session
      try {
        await auth0.webAuth.clearSession();
      } catch (e) {
        console.log('Auth0 clear session error (may be expected):', e);
      }
      
      await this.clearStorage();
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  private async clearStorage() {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch {
      return null;
    }
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private async setUser(user: AuthUser) {
    this.currentUser = user;
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export default new AuthService();

