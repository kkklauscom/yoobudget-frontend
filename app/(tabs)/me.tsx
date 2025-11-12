import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ratios = [
  { label: 'Needs', value: 50, color: '#25C46A' },
  { label: 'Wants', value: 30, color: '#3383FF' },
  { label: 'Savings', value: 20, color: '#9B51E0' },
];

export default function MeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your budget preferences
          </Text>
        </View>

        <View style={[styles.card, styles.softCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>💵</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Income Frequency</Text>
              <Text style={styles.cardSubtitle}>
                How often you receive income
              </Text>
            </View>
          </View>
          <Pressable style={styles.dropdown}>
            <Text style={styles.dropdownValue}>Monthly</Text>
            <Text style={styles.dropdownCaret}>⌄</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleAlt}>
              <Text style={styles.iconText}>📈</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Budget Ratios</Text>
              <Text style={styles.cardSubtitle}>
                Current: 50% / 30% / 20%
              </Text>
            </View>
          </View>
          <View style={styles.ratioList}>
            {ratios.map((ratio) => (
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
            ))}
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
});

