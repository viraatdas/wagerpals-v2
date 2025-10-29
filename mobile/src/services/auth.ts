// Authentication service using Stack Auth API
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthUser } from '../types';

const AUTH_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://wagerpals.io';

const STACK_PROJECT_ID = process.env.EXPO_PUBLIC_STACK_PROJECT_ID || '';
const STACK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STACK_PUBLISHABLE_KEY || '';

WebBrowser.maybeCompleteAuthSession();

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];
  private authSession: any = null;

  async init() {
    // Try to restore session from secure storage
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      const storedToken = await SecureStore.getItemAsync('accessToken');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        // Verify token is still valid
        const isValid = await this.verifyToken(storedToken);
        if (isValid) {
          this.notifyListeners();
        } else {
          // Token expired, clear storage
          await this.clearStorage();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/users?id=me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendMagicLink(email: string): Promise<void> {
    try {
      // Use Stack Auth API to send magic link
      const response = await fetch('https://api.stack-auth.com/api/v1/auth/otp/send-sign-in-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-project-id': STACK_PROJECT_ID,
          'x-stack-publishable-client-key': STACK_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          email,
          callback_url: `${AUTH_BASE_URL}/auth/signin`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send magic link');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      throw error;
    }
  }

  async signInWithCode(email: string, code: string): Promise<AuthUser> {
    try {
      // Verify the code with Stack Auth
      const response = await fetch('https://api.stack-auth.com/api/v1/auth/otp/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-project-id': STACK_PROJECT_ID,
          'x-stack-publishable-client-key': STACK_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid code');
      }

      const data = await response.json();
      
      // Store the access token
      await SecureStore.setItemAsync('accessToken', data.access_token);
      
      // Get user info
      const user = await this.getUserInfo(data.access_token);
      await this.setUser(user);
      
      return user;
    } catch (error) {
      console.error('Sign in with code error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      // Use web-based OAuth bridge
      // Stack Auth redirects to our web handler, which then redirects to the mobile app
      const redirectUrl = `${AUTH_BASE_URL}/auth/mobile-callback`;
      
      const authUrl = `https://api.stack-auth.com/api/v1/auth/oauth/authorize?client_id=${STACK_PROJECT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&provider=google&x-stack-publishable-client-key=${STACK_PUBLISHABLE_KEY}`;
      
      // Open OAuth in browser and wait for deep link back
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'wagerpals://oauth-callback'
      );

      if (result.type === 'success' && result.url) {
        // Extract auth code from deep link callback
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Exchange code for tokens
          const tokenResponse = await fetch('https://api.stack-auth.com/api/v1/auth/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-stack-project-id': STACK_PROJECT_ID,
              'x-stack-publishable-client-key': STACK_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUrl,
            }),
          });

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Token exchange error:', errorData);
            throw new Error('Failed to exchange code for token');
          }

          const tokens = await tokenResponse.json();
          await SecureStore.setItemAsync('accessToken', tokens.access_token);
          
          // Get user info
          const user = await this.getUserInfo(tokens.access_token);
          await this.setUser(user);
          
          return user;
        }
      }
      
      throw new Error('Authentication cancelled or failed');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  private async getUserInfo(accessToken: string): Promise<AuthUser> {
    const response = await fetch('https://api.stack-auth.com/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-stack-project-id': STACK_PROJECT_ID,
        'x-stack-publishable-client-key': STACK_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      email: data.primary_email,
      displayName: data.display_name || data.primary_email?.split('@')[0] || 'User',
      primaryEmail: data.primary_email,
    };
  }

  async signOut() {
    try {
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

