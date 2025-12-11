// Join Group screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';

export default function JoinGroupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if group ID was passed via deep link
    const params = route.params as { groupId?: string };
    if (params?.groupId) {
      setGroupCode(params.groupId);
    }
  }, [route.params]);

  const handleJoin = async () => {
    if (!groupCode || !user) return;

    setIsLoading(true);
    try {
      await apiService.joinGroup(groupCode, user.id);
      Alert.alert(
        'Success',
        'Join request submitted! You will be notified when an admin approves your request.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main' as never),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Join a Group</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code shared by the group admin
        </Text>

        <TextInput
          style={styles.input}
          placeholder="000000"
          value={groupCode}
          onChangeText={setGroupCode}
          maxLength={6}
          autoCapitalize="characters"
          autoFocus={!groupCode}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={isLoading || !groupCode}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join Group</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Your request will be pending until an admin approves it
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});





