// Authentication service using Stack Auth API
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { AuthUser } from '../types';

const AUTH_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://wagerpals.io';

const STACK_PROJECT_ID = process.env.EXPO_PUBLIC_STACK_PROJECT_ID || 'your_project_id';
const STACK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STACK_PUBLISHABLE_KEY || 'your_key';

WebBrowser.maybeCompleteAuthSession();

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  async init() {
    // Try to restore session from secure storage
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  async signInWithGoogle() {
    try {
      // For Expo, use custom scheme for OAuth callback
      const redirectUrl = __DEV__ 
        ? 'exp://localhost:19000/--/oauth/callback'
        : 'wagerpals://oauth/callback';
      
      const authUrl = `https://api.stack-auth.com/api/v1/auth/oauth/authorize?client_id=${STACK_PROJECT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&provider=google`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl
      );

      if (result.type === 'success' && result.url) {
        // Extract auth code from callback URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Exchange code for user session via your backend
          const response = await fetch(`${AUTH_BASE_URL}/api/auth/mobile-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: redirectUrl }),
          });

          if (response.ok) {
            const user = await response.json();
            await this.setUser(user);
            return user;
          }
        }
      }
      
      throw new Error('Authentication failed');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        await this.setUser(user);
        return user;
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await SecureStore.deleteItemAsync('user');
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
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

