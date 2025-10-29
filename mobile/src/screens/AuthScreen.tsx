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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../services/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendMagicLink(email);
      setStep('code');
      Alert.alert(
        'Check your email', 
        'We sent you a verification code. Enter it below to sign in.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signInWithCode(email, code);
      // Auth state change will trigger navigation via RootNavigator
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
      // Auth state change will trigger navigation via RootNavigator
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
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
          <Text style={styles.cardTitle}>
            {step === 'email' ? 'Sign In' : 'Enter Code'}
          </Text>

          {step === 'email' ? (
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
                onPress={handleSendCode}
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue with Email</Text>
                )}
              </TouchableOpacity>

              {/* Note: Google OAuth temporarily disabled for mobile */}
              {/* Stack Auth requires HTTPS redirect URIs, which don't work with custom app schemes */}
              {/* Use the web app for Google sign-in, or use Magic Link on mobile */}
              
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Tip: Use the web app for Google sign-in, or continue with email above
                </Text>
              </View>

              <Text style={styles.termsText}>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Verification code</Text>
              <Text style={styles.helperText}>
                Enter the 6-digit code we sent to {email}
              </Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.button, styles.emailButton]}
                onPress={handleVerifyCode}
                disabled={isLoading || code.length < 6}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToEmail}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>Use a different email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>Resend code</Text>
              </TouchableOpacity>
            </View>
          )}
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
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
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
  infoBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '400',
  },
});


