import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import notificationService from './src/services/notifications';

// Ignore certain warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  useEffect(() => {
    // Initialize notification service
    notificationService.init();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
