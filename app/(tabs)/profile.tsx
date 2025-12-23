import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/hooks/use-auth";
import { useTaskContext } from "@/context/TaskContext";
import { authService } from "@/lib/supabase-auth";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { user, logout, isAuthenticated, refresh } = useAuth();
  const { tasks } = useTaskContext();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const dangerColor = Colors[colorScheme ?? "light"].danger;
  const colors = Colors[colorScheme ?? "light"];

  // Calculate user stats
  const userStats = useMemo(() => {
    const totalCompleted = tasks.filter((t) => t.isCompleted).length;

    // Calculate streaks (simplified - in production, this would track daily completion)
    const today = new Date().toDateString();
    const todayCompleted = tasks.filter(
      (t) => t.isCompleted && t.lastCompletedDate && new Date(t.lastCompletedDate).toDateString() === today
    ).length;
    const todayTotal = tasks.length;

    return {
      daysActive: 1, // Placeholder - would track from user creation
      totalCompleted,
      bestStreak: 1, // Placeholder - would track from history
      currentStreak: todayCompleted === todayTotal && todayTotal > 0 ? 1 : 0,
    };
  }, [tasks]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setAuthLoading(true);

      if (isSignUp) {
        if (password.length < 6) {
          Alert.alert("Error", "Password must be at least 6 characters");
          return;
        }
        await authService.signUp(email, password, name || email.split("@")[0]);
        Alert.alert("Success", "Account created! Please check your email to verify your account.");
      } else {
        await authService.signIn(email, password);
        Alert.alert("Success", "Logged in successfully!");
      }

      setShowAuthModal(false);
      setEmail("");
      setPassword("");
      setName("");
      refresh();
    } catch (error: any) {
      console.error("Auth error:", error);
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Success", "Logged out successfully");
        },
      },
    ]);
  };

  const AnimatedStatCard = ({ label, value, icon, gradient }: { label: string; value: number; icon: string; gradient: string[] }) => {
    const animatedValue = useSharedValue(0);

    useEffect(() => {
      animatedValue.value = withTiming(value, {
        duration: 1000,
      });
    }, [value]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: animatedValue.value > 0 ? 1 : 0.5,
    }));

    return (
      <Animated.View
        style={[
          styles.statCard,
          animatedStyle,
        ]}
        entering={FadeIn.delay(100)}
      >
        <LinearGradient
          colors={gradient}
          style={styles.statCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statIconContainer}>
            <MaterialIcons name={icon as any} size={24} color="#fff" />
          </View>
          <ThemedText type="title" style={{ fontSize: 28, marginTop: Spacing.sm, color: "#fff" }}>
            {value}
          </ThemedText>
          <ThemedText type="default" style={{ fontSize: 12, marginTop: Spacing.xs, color: "rgba(255,255,255,0.9)" }}>
            {label}
          </ThemedText>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Show login/signup screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemedView
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, Spacing.lg),
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
          },
        ]}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.authContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authHeader}>
            <View style={[styles.authLogo, { backgroundColor: accentColor }]}>
              <MaterialIcons name="task-alt" size={64} color="#fff" />
            </View>
            <ThemedText type="title" style={{ fontSize: 32, marginTop: Spacing.xl, textAlign: "center" }}>
              Task Master
            </ThemedText>
            <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
              Your personal productivity companion
            </ThemedText>
          </View>

          <View style={styles.authForm}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <ThemedText type="default" style={{ marginBottom: Spacing.sm }}>Name (Optional)</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.divider,
                      color: textColor,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholder="Your name"
                  placeholderTextColor={textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <ThemedText type="default" style={{ marginBottom: Spacing.sm }}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.divider,
                    color: textColor,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="default" style={{ marginBottom: Spacing.sm }}>Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.divider,
                    color: textColor,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              onPress={handleAuth}
              disabled={authLoading}
              style={[
                styles.authButton,
                {
                  backgroundColor: accentColor,
                  opacity: authLoading ? 0.7 : 1,
                },
              ]}
            >
              {authLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: "#fff", fontSize: 16 }}>
                  {isSignUp ? "Sign Up" : "Log In"}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.switchAuthButton}
            >
              <ThemedText type="default" style={{ color: textSecondary, textAlign: "center" }}>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <ThemedText type="defaultSemiBold" style={{ color: accentColor }}>
                  {isSignUp ? "Log In" : "Sign Up"}
                </ThemedText>
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Authenticated user view
  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Spacing.lg),
          paddingBottom: Math.max(insets.bottom, Spacing.lg),
        },
      ]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { paddingHorizontal: Spacing.lg }]}>
          <LinearGradient
            colors={colorScheme === "dark" ? ["#0A84FF", "#0066CC"] : [accentColor, "#005FCC"]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="person" size={48} color="#fff" />
          </LinearGradient>

          <View style={styles.profileInfo}>
            <ThemedText type="title" style={{ fontSize: 24 }}>
              {user?.name || user?.email || "User"}
            </ThemedText>
            <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.xs }}>
              {user?.email}
            </ThemedText>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }]}>
          <AnimatedStatCard 
            label="Days Active" 
            value={userStats.daysActive} 
            icon="calendar-today"
            gradient={["#667eea", "#764ba2"]}
          />
          <AnimatedStatCard 
            label="Tasks Done" 
            value={userStats.totalCompleted} 
            icon="check-circle"
            gradient={["#f093fb", "#f5576c"]}
          />
          <AnimatedStatCard 
            label="Best Streak" 
            value={userStats.bestStreak} 
            icon="local-fire-department"
            gradient={["#4facfe", "#00f2fe"]}
          />
          <AnimatedStatCard 
            label="Current Streak" 
            value={userStats.currentStreak} 
            icon="trending-up"
            gradient={["#43e97b", "#38f9d7"]}
          />
        </View>

        {/* Achievement Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }]}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg, fontSize: 20 }}>
            Achievements
          </ThemedText>

          <LinearGradient
            colors={["#11998e", "#38ef7d"]}
            style={styles.achievementCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="star" size={40} color="#fff" />
            <ThemedText
              type="defaultSemiBold"
              style={{ marginTop: Spacing.md, color: "#fff", fontSize: 18 }}
            >
              Welcome to Task Master!
            </ThemedText>
            <ThemedText
              type="default"
              style={{ color: "rgba(255,255,255,0.9)", marginTop: Spacing.sm, fontSize: 14 }}
            >
              You've started your productivity journey
            </ThemedText>
          </LinearGradient>
        </View>

        {/* About Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }]}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg, fontSize: 20 }}>
            About
          </ThemedText>

          <View
            style={[
              styles.aboutCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
          >
            <ThemedText type="default" style={{ lineHeight: 22 }}>
              Task Master is your personal productivity companion. Build discipline and consistency by tracking
              daily tasks, organizing by skills, and monitoring your progress.
            </ThemedText>
            <ThemedText type="default" style={{ marginTop: Spacing.lg, fontSize: 12, color: textSecondary }}>
              Version 1.0.0 • Powered by Supabase
            </ThemedText>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.surface,
              borderColor: dangerColor,
            },
          ]}
          data-testid="logout-button"
        >
          <MaterialIcons name="logout" size={20} color={dangerColor} />
          <ThemedText
            type="defaultSemiBold"
            style={{ color: dangerColor, marginLeft: Spacing.md }}
          >
            Logout
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  authHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl * 2,
  },
  authLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authForm: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  authButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  switchAuthButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileInfo: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "48%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statCardGradient: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  achievementCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  aboutCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl * 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
