import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { tapMedium, success, error as hapticError } from '../utils/haptics';

type CreateEventRouteProps = RouteProp<RootStackParamList, 'CreateEvent'>;

export default function CreateEventScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<CreateEventRouteProps>();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [title, setTitle] = useState('');
  const [sideA, setSideA] = useState('');
  const [sideB, setSideB] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an event.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter an event title.');
      return;
    }
    if (!sideA.trim() || !sideB.trim()) {
      Alert.alert('Missing Field', 'Please enter names for both sides.');
      return;
    }
    if (!endDate.trim() || !endTime.trim()) {
      Alert.alert('Missing Field', 'Please enter an end date and time.');
      return;
    }

    // Parse date/time — expected formats: YYYY-MM-DD and HH:MM
    const dateTimeString = `${endDate.trim()}T${endTime.trim()}`;
    const parsedTime = new Date(dateTimeString).getTime();

    if (isNaN(parsedTime)) {
      Alert.alert('Invalid Date', 'Please enter date as YYYY-MM-DD and time as HH:MM.');
      return;
    }

    if (parsedTime <= Date.now()) {
      Alert.alert('Invalid Date', 'End time must be in the future.');
      return;
    }

    tapMedium();
    setIsSubmitting(true);

    try {
      const newEvent = await apiService.createEvent({
        title: title.trim(),
        side_a: sideA.trim(),
        side_b: sideB.trim(),
        end_time: parsedTime,
        group_id: groupId,
      });

      success();
      Alert.alert('Success', 'Event created!', [
        {
          text: 'View Event',
          onPress: () =>
            navigation.navigate('EventDetail' as never, { eventId: newEvent.id } as never),
        },
        {
          text: 'Back to Group',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      hapticError();
      Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.heading}>Create Event</Text>
            <Text style={styles.subheading}>Set up a new prediction event</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Event Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Will it rain tomorrow?"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
                returnKeyType="next"
              />
            </View>

            {/* Sides */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Sides</Text>
              <View style={styles.sidesContainer}>
                <View style={styles.sideInputWrapper}>
                  <View style={styles.sideIndicator}>
                    <Text style={styles.sideIndicatorText}>A</Text>
                  </View>
                  <TextInput
                    style={styles.sideInput}
                    placeholder="e.g. Yes"
                    placeholderTextColor="#9ca3af"
                    value={sideA}
                    onChangeText={setSideA}
                    autoCapitalize="sentences"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>vs</Text>
                </View>
                <View style={styles.sideInputWrapper}>
                  <View style={styles.sideIndicator}>
                    <Text style={styles.sideIndicatorText}>B</Text>
                  </View>
                  <TextInput
                    style={styles.sideInput}
                    placeholder="e.g. No"
                    placeholderTextColor="#9ca3af"
                    value={sideB}
                    onChangeText={setSideB}
                    autoCapitalize="sentences"
                    returnKeyType="next"
                  />
                </View>
              </View>
            </View>

            {/* End Date/Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>When does this end?</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeField}>
                  <Ionicons name="calendar-outline" size={18} color="#ea580c" style={styles.dateIcon} />
                  <TextInput
                    style={styles.dateTimeInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                    value={endDate}
                    onChangeText={setEndDate}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.dateTimeField}>
                  <Ionicons name="time-outline" size={18} color="#ea580c" style={styles.dateIcon} />
                  <TextInput
                    style={styles.dateTimeInput}
                    placeholder="HH:MM"
                    placeholderTextColor="#9ca3af"
                    value={endTime}
                    onChangeText={setEndTime}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="done"
                  />
                </View>
              </View>
              <Text style={styles.hint}>Use 24-hour format (e.g. 14:30)</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Create Event</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  sidesContainer: {
    gap: 12,
  },
  sideInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sideIndicator: {
    width: 40,
    height: '100%',
    backgroundColor: '#fff5f3',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sideIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ea580c',
  },
  sideInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dateIcon: {
    marginLeft: 14,
  },
  dateTimeInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
