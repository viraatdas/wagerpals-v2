import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

type InviteRouteProps = RouteProp<RootStackParamList, 'CreateEventFromInvite'>;

export default function CreateEventFromInviteScreen() {
  const route = useRoute<InviteRouteProps>();
  const navigation = useNavigation();
  const { title, sideA, sideB } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.heading}>Wager Invite</Text>

        <View style={styles.card}>
          <Text style={styles.eventTitle}>{title}</Text>
          <View style={styles.sidesRow}>
            <View style={styles.sideBox}>
              <Text style={styles.sideLabel}>Side A</Text>
              <Text style={styles.sideValue}>{sideA}</Text>
            </View>
            <Text style={styles.vs}>vs</Text>
            <View style={styles.sideBox}>
              <Text style={styles.sideLabel}>Side B</Text>
              <Text style={styles.sideValue}>{sideB}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Main' as any)}
        >
          <Text style={styles.buttonText}>Open WagerPals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
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
    marginBottom: 32,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
  },
  sidesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBox: {
    flex: 1,
    alignItems: 'center',
  },
  sideLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sideValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ea580c',
  },
  vs: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    marginHorizontal: 12,
  },
  button: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
