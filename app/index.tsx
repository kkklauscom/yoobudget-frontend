import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = segments[0] === 'login';
    const isRegisterPage = segments[0] === 'register';

    if (!isAuthenticated) {
      // Redirect to login if not authenticated and not already on login/register page
      if (!isLoginPage && !isRegisterPage) {
        router.replace('/login');
      }
    } else {
      // User is authenticated, redirect to tabs if on login/register page
      if (isLoginPage || isRegisterPage || segments.length === 0) {
        router.replace('/(tabs)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#12B76A" />
        </View>
      </SafeAreaView>
    );
  }

  // This component doesn't render anything visible
  // It just handles routing based on authentication state
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

