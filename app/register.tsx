import { useAuth } from "@/contexts/AuthContext";
import Slider from "@react-native-community/slider";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const [savings, setSavings] = useState(20);
  const [currentSavings, setCurrentSavings] = useState("0");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Smart slider adjustment to keep total at 100
  const handleNeedsChange = useCallback(
    (value: number) => {
      const newNeeds = Math.round(value);
      const remaining = 100 - newNeeds;
      const currentOtherTotal = wants + savings;

      if (currentOtherTotal > 0 && remaining >= 0) {
        // Distribute remaining proportionally between wants and savings
        const wantsRatio = wants / currentOtherTotal;
        const savingsRatio = savings / currentOtherTotal;
        const newWants = Math.round(remaining * wantsRatio);
        const newSavings = remaining - newWants; // Use remaining to avoid rounding errors

        setNeeds(newNeeds);
        setWants(newWants);
        setSavings(newSavings);
      } else if (remaining >= 0) {
        // If other total is 0, split evenly
        setNeeds(newNeeds);
        setWants(Math.floor(remaining / 2));
        setSavings(remaining - Math.floor(remaining / 2));
      }
    },
    [wants, savings]
  );

  const handleWantsChange = useCallback(
    (value: number) => {
      const newWants = Math.round(value);
      const remaining = 100 - newWants;
      const currentOtherTotal = needs + savings;

      if (currentOtherTotal > 0 && remaining >= 0) {
        // Distribute remaining proportionally between needs and savings
        const needsRatio = needs / currentOtherTotal;
        const savingsRatio = savings / currentOtherTotal;
        const newNeeds = Math.round(remaining * needsRatio);
        const newSavings = remaining - newNeeds; // Use remaining to avoid rounding errors

        setNeeds(newNeeds);
        setWants(newWants);
        setSavings(newSavings);
      } else if (remaining >= 0) {
        // If other total is 0, split evenly
        setNeeds(Math.floor(remaining / 2));
        setWants(newWants);
        setSavings(remaining - Math.floor(remaining / 2));
      }
    },
    [needs, savings]
  );

  const handleSavingsChange = useCallback(
    (value: number) => {
      const newSavings = Math.round(value);
      const remaining = 100 - newSavings;
      const currentOtherTotal = needs + wants;

      if (currentOtherTotal > 0 && remaining >= 0) {
        // Distribute remaining proportionally between needs and wants
        const needsRatio = needs / currentOtherTotal;
        const wantsRatio = wants / currentOtherTotal;
        const newNeeds = Math.round(remaining * needsRatio);
        const newWants = remaining - newNeeds; // Use remaining to avoid rounding errors

        setNeeds(newNeeds);
        setWants(newWants);
        setSavings(newSavings);
      } else if (remaining >= 0) {
        // If other total is 0, split evenly
        setNeeds(Math.floor(remaining / 2));
        setWants(remaining - Math.floor(remaining / 2));
        setSavings(newSavings);
      }
    },
    [needs, wants]
  );

  const showAlert = (title: string, message: string) => {
    console.log("Showing alert:", title, message); // Debug log
    if (Platform.OS === "web") {
      // Use window.alert for Web platform
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !name) {
      showAlert("Error", "Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Error", "Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      showAlert("Error", "Password must be at least 6 characters");
      return;
    }

    // Validate budget ratio (should always be 100 due to slider logic, but check anyway)
    const total = needs + wants + savings;
    if (total !== 100) {
      showAlert("Error", "Budget ratios must sum to 100%");
      return;
    }

    // Validate current savings
    const currentSavingsNum = parseFloat(currentSavings);
    if (isNaN(currentSavingsNum) || currentSavingsNum < 0) {
      showAlert("Error", "Current savings must be a valid positive number");
      return;
    }

    setLoading(true);
    setErrorMessage(""); // Clear previous error
    try {
      await register(
        email,
        password,
        name,
        {
          needs,
          wants,
          savings,
        },
        currentSavingsNum
      );
      // Registration successful - user is automatically logged in
      // Redirect to main app
      router.replace("/(tabs)/me");
    } catch (error: any) {
      // Show error message from API
      // API returns: { "error": "error message" }
      let errorMsg = "Registration failed. Please try again.";

      console.log("Caught error in handleRegister:", error); // Debug log

      if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === "string") {
        errorMsg = error;
      }

      console.error("Registration error:", error); // Debug log
      console.log("Final error message to show:", errorMsg); // Debug log

      // Set error message state for in-page display
      setErrorMessage(errorMsg);

      // Also show alert
      showAlert("Registration Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up to start managing your budget
            </Text>
          </View>

          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#99A7BC"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrorMessage("");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#99A7BC"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage(""); // Clear error when user types
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#99A7BC"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage("");
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#99A7BC"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMessage("");
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.budgetSection}>
              <Text style={styles.sectionTitle}>Budget Ratio (%)</Text>
              <Text style={styles.sectionDescription}>
                Follow the 50/30/20 model: 50% for essential needs, 30% for
                wants, 20% for savings
              </Text>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>
                      Needs (Essential Expenses)
                    </Text>
                    <Text style={styles.sliderValue}>{needs}%</Text>
                  </View>
                  <Text style={styles.sliderDescription}>
                    Essential expenses like rent, utilities, groceries, and
                    transportation
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    value={needs}
                    onValueChange={handleNeedsChange}
                    step={1}
                    minimumTrackTintColor="#25C46A"
                    maximumTrackTintColor="#D3DFF4"
                    thumbTintColor="#25C46A"
                    disabled={loading}
                  />
                </View>

                <View style={styles.sliderContainer}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>
                      Wants (Non-Essential Expenses)
                    </Text>
                    <Text style={styles.sliderValue}>{wants}%</Text>
                  </View>
                  <Text style={styles.sliderDescription}>
                    Non-essential expenses like dining out, entertainment, and
                    hobbies
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    value={wants}
                    onValueChange={handleWantsChange}
                    step={1}
                    minimumTrackTintColor="#3383FF"
                    maximumTrackTintColor="#D3DFF4"
                    thumbTintColor="#3383FF"
                    disabled={loading}
                  />
                </View>

                <View style={styles.sliderContainer}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Savings</Text>
                    <Text style={styles.sliderValue}>{savings}%</Text>
                  </View>
                  <Text style={styles.sliderDescription}>
                    Savings for emergency fund, investments, and future goals
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    value={savings}
                    onValueChange={handleSavingsChange}
                    step={1}
                    minimumTrackTintColor="#9B51E0"
                    maximumTrackTintColor="#D3DFF4"
                    thumbTintColor="#9B51E0"
                    disabled={loading}
                  />
                </View>
              </View>

              <View style={styles.totalContainer}>
                <Text
                  style={[
                    styles.totalLabel,
                    needs + wants + savings === 100
                      ? styles.totalLabelValid
                      : styles.totalLabelInvalid,
                  ]}
                >
                  Total: {needs + wants + savings}%
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Savings</Text>
              <Text style={styles.inputHint}>
                Enter your current savings amount (default: 0)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#99A7BC"
                value={currentSavings}
                onChangeText={(text) => {
                  setCurrentSavings(text);
                  setErrorMessage("");
                }}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <Pressable
              style={[
                styles.registerButton,
                (loading || needs + wants + savings !== 100) &&
                  styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading || needs + wants + savings !== 100}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Sign Up</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5FF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1B1B33",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6F7C8E",
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B1B33",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1B1B33",
    borderWidth: 1,
    borderColor: "#D3DFF4",
  },
  registerButton: {
    backgroundColor: "#12B76A",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#12B76A",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: "#6F7C8E",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#12B76A",
  },
  errorContainer: {
    backgroundColor: "#FFE6E9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFB3BA",
  },
  errorText: {
    color: "#D63A4A",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  budgetSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D3DFF4",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1B33",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: "#6F7C8E",
    marginBottom: 20,
    lineHeight: 18,
  },
  sliderGroup: {
    gap: 24,
    marginBottom: 16,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B1B33",
    flex: 1,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1B33",
  },
  sliderDescription: {
    fontSize: 11,
    color: "#6F7C8E",
    marginBottom: 8,
    lineHeight: 16,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  totalContainer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#D3DFF4",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalLabelValid: {
    color: "#12B76A",
  },
  totalLabelInvalid: {
    color: "#D63A4A",
  },
  inputHint: {
    fontSize: 12,
    color: "#6F7C8E",
    marginBottom: 4,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D3DFF4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOptionSelected: {
    borderColor: "#12B76A",
    backgroundColor: "#ECFDF5",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6F7C8E",
  },
  radioTextSelected: {
    color: "#12B76A",
    fontWeight: "600",
  },
});
