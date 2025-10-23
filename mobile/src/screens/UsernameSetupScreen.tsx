// Username setup screen (shown after first login)
import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { validateUsername } from '../utils/helpers';

export default function UsernameSetupScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUsernameStatus();
  }, [user]);

  const checkUsernameStatus = async () => {
    if (!user) return;

    try {
      const userData = await apiService.getUser(user.id);
      if (userData && userData.username_selected) {
        // Username already set, go to main app
        navigation.replace('Main' as never);
      }
    } catch (error) {
      console.log('User not found, needs to set username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const validation = validateUsername(username);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }

    if (!user) return;

    setIsSaving(true);
    setError('');

    try {
      await apiService.createOrUpdateUser(user.id, username);
      navigation.replace('Main' as never);
    } catch (error: any) {
      setError(error.message || 'Failed to set username');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Username</Text>
          <Text style={styles.subtitle}>
            This is how other players will see you
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setError('');
            }}
            autoCapitalize="none"
            autoFocus
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.hint}>
            3-20 characters • Letters, numbers, dashes, and underscores only
          </Text>

          <TouchableOpacity
            style={[styles.button, isSaving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSaving || !username}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 18,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});


