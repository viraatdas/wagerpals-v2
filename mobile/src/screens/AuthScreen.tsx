// Authentication screen - using Stack Auth
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import authService from '../services/auth';

// Get Stack Auth configuration from environment
const STACK_PROJECT_ID = process.env.EXPO_PUBLIC_STACK_PROJECT_ID || 'your_project_id';
const APP_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailContinue = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Open Stack Auth email sign-in in web browser
      const authUrl = `${APP_URL}/auth/signin?email=${encodeURIComponent(email)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, `${APP_URL}/`);
      
      if (result.type === 'success') {
        // User completed auth in browser, refresh app
        Alert.alert('Success', 'Please check your email to complete sign in');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskey = async () => {
    setIsLoading(true);
    try {
      const authUrl = `${APP_URL}/auth/signin?passkey=true`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, `${APP_URL}/`);
      
      if (result.type === 'success') {
        Alert.alert('Success', 'Signed in successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Passkey sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const authUrl = `${APP_URL}/auth/signin?provider=google`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, `${APP_URL}/`);
      
      if (result.type === 'success') {
        Alert.alert('Success', 'Signed in successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.title}>
            <Text style={styles.titleWager}>Wager</Text>
            <Text style={styles.titlePals}>Pals</Text>
          </Text>
          <Text style={styles.subtitle}>Polymarket for friends</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, styles.emailButton]}
              onPress={handleEmailContinue}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue with Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.passkeyButton]}
              onPress={handlePasskey}
              disabled={isLoading}
            >
              <Text style={styles.passkeyIcon}>🔑</Text>
              <Text style={styles.passkeyButtonText}>Continue with Passkey</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleAuth}
              disabled={isLoading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
    marginBottom: 4,
  },
  title: {
    fontSize: 42,
    marginBottom: 8,
  },
  titleWager: {
    fontWeight: '300',
    color: '#333',
  },
  titlePals: {
    fontWeight: '600',
    color: '#ea580c',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '400',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailButton: {
    backgroundColor: '#fdb4a0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  passkeyButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passkeyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  passkeyButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '400',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
    color: '#ea4335',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '400',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});


