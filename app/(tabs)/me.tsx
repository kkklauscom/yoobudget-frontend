import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

const ratios = [
  { label: 'Needs', value: 50, color: '#25C46A' },
  { label: 'Wants', value: 30, color: '#3383FF' },
  { label: 'Savings', value: 20, color: '#9B51E0' },
];

export default function MeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    console.log('handleLogout called'); // Debug log
    
    // For Web platform, use window.confirm, for native use Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      console.log('Confirm result:', confirmed); // Debug log
      if (confirmed) {
        console.log('User confirmed logout'); // Debug log
        setLoggingOut(true);
        try {
          await logout();
          console.log('Logout successful, redirecting...'); // Debug log
          router.replace('/login');
        } catch (logoutErr) {
          console.error('Logout error:', logoutErr); // Debug log
          window.alert('Logout failed: ' + (logoutErr instanceof Error ? logoutErr.message : 'Unknown error'));
        } finally {
          setLoggingOut(false);
        }
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              setLoggingOut(true);
              try {
                await logout();
                router.replace('/login');
              } catch (logoutErr) {
                Alert.alert('Error', 'Logout failed');
              } finally {
                setLoggingOut(false);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            {user?.name || user?.email || 'Customize your budget preferences'}
          </Text>
          {user?.email && (
            <Text style={styles.headerEmail}>{user.email}</Text>
          )}
        </View>

        <View style={[styles.card, styles.softCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>💵</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>View Cycle</Text>
              <Text style={styles.cardSubtitle}>
                How you view your budget
              </Text>
            </View>
          </View>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownValue}>
              {user?.viewCycle
                ? user.viewCycle.charAt(0).toUpperCase() + user.viewCycle.slice(1)
                : 'Monthly'}
            </Text>
            <Text style={styles.dropdownCaret}>⌄</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleAlt}>
              <Text style={styles.iconText}>📈</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Budget Ratios</Text>
              <Text style={styles.cardSubtitle}>
                {user?.budgetRatio
                  ? `Current: ${user.budgetRatio.needs}% / ${user.budgetRatio.wants}% / ${user.budgetRatio.savings}%`
                  : 'Current: 50% / 30% / 20%'}
              </Text>
            </View>
          </View>
          <View style={styles.ratioList}>
            {user?.budgetRatio ? (
              <>
                <View style={styles.ratioRow}>
                  <Text style={styles.ratioLabel}>Needs</Text>
                  <View style={styles.ratioTrack}>
                    <View
                      style={[
                        styles.ratioFill,
                        {
                          width: `${user.budgetRatio.needs}%`,
                          backgroundColor: '#25C46A',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.ratioValue, { color: '#25C46A' }]}>
                    {user.budgetRatio.needs}%
                  </Text>
                </View>
                <View style={styles.ratioRow}>
                  <Text style={styles.ratioLabel}>Wants</Text>
                  <View style={styles.ratioTrack}>
                    <View
                      style={[
                        styles.ratioFill,
                        {
                          width: `${user.budgetRatio.wants}%`,
                          backgroundColor: '#3383FF',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.ratioValue, { color: '#3383FF' }]}>
                    {user.budgetRatio.wants}%
                  </Text>
                </View>
                <View style={styles.ratioRow}>
                  <Text style={styles.ratioLabel}>Savings</Text>
                  <View style={styles.ratioTrack}>
                    <View
                      style={[
                        styles.ratioFill,
                        {
                          width: `${user.budgetRatio.savings}%`,
                          backgroundColor: '#9B51E0',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.ratioValue, { color: '#9B51E0' }]}>
                    {user.budgetRatio.savings}%
                  </Text>
                </View>
              </>
            ) : (
              ratios.map((ratio) => (
                <View key={ratio.label} style={styles.ratioRow}>
                  <Text style={styles.ratioLabel}>{ratio.label}</Text>
                  <View style={styles.ratioTrack}>
                    <View
                      style={[
                        styles.ratioFill,
                        {
                          width: `${ratio.value}%`,
                          backgroundColor: ratio.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.ratioValue, { color: ratio.color }]}>
                    {ratio.value}%
                  </Text>
                </View>
              ))
            )}
          </View>
          <Text style={styles.helperText}>
            Edit ratios from the Dashboard page
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleAlt}>
              <Text style={styles.iconText}>🌞</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Appearance</Text>
              <Text style={styles.cardSubtitle}>
                Choose your preferred theme
              </Text>
            </View>
          </View>
          <View style={styles.themeSwitch}>
            <Pressable style={[styles.themeOption, styles.themeOptionActive]}>
              <Text style={styles.themeOptionTextActive}>Light</Text>
            </Pressable>
            <Pressable style={styles.themeOption}>
              <Text style={styles.themeOptionText}>Dark</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, styles.resetCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleDanger}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <View>
              <Text style={styles.resetTitle}>Reset Data</Text>
              <Text style={styles.cardSubtitle}>
                Clear all data and start fresh
              </Text>
            </View>
          </View>

          <Pressable style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset Budget</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.logoutCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleLogout}>
              <Text style={styles.iconText}>🚪</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.cardSubtitle}>
                Sign out of your account
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              loggingOut && styles.logoutButtonDisabled,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              console.log('Logout button clicked'); // Debug log
              handleLogout();
            }}
            disabled={loggingOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {loggingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F6FF',
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B2433',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6E7A90',
  },
  headerEmail: {
    fontSize: 12,
    color: '#9CA3B0',
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 20,
    shadowColor: '#c3d4ff',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  softCard: {
    backgroundColor: '#F3FBF6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCF5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleAlt: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE6E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2433',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6E7A90',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D2E2FF',
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2433',
  },
  dropdownCaret: {
    fontSize: 18,
    color: '#6E7A90',
  },
  ratioList: {
    gap: 14,
  },
  ratioRow: {
    gap: 8,
  },
  ratioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2433',
  },
  ratioTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#E0E6F4',
    overflow: 'hidden',
  },
  ratioFill: {
    height: '100%',
    borderRadius: 6,
  },
  ratioValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6E7A90',
  },
  themeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#EEF3FF',
    borderRadius: 20,
    padding: 6,
    gap: 8,
  },
  themeOption: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#8FA9FF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E7A90',
  },
  themeOptionTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2433',
  },
  resetCard: {
    borderWidth: 1,
    borderColor: '#FFD5D9',
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D63A4A',
  },
  resetButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF4757',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutCard: {
    borderWidth: 1,
    borderColor: '#E0E6F4',
  },
  iconCircleLogout: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2433',
  },
  logoutButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#6E7A90',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 100,
    minHeight: 44, // Ensure minimum touch target size
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer', // Web cursor
    zIndex: 10, // Ensure button is above other elements
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonPressed: {
    opacity: 0.8,
    backgroundColor: '#5A6678',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardHeaderText: {
    flex: 1,
  },
});

