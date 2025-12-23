import React, { useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/hooks/use-auth";
import { useTaskContext } from "@/context/TaskContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { user, logout } = useAuth();
  const { tasks } = useTaskContext();

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const surfaceColor = useThemeColor({}, "icon");
  const colors = Colors[colorScheme ?? "light"];

  // Calculate user stats
  const userStats = useMemo(() => {
    const totalCompleted = tasks.filter((t) => t.isCompleted).length;

    // Calculate streaks (simplified - in production, this would track daily completion)
    const today = new Date().toDateString();
    const todayCompleted = tasks.filter((t) => t.isCompleted && new Date(t.lastCompletedDate || "").toDateString() === today).length;
    const todayTotal = tasks.length;

    return {
      daysActive: 1, // Placeholder - would track from user creation
      totalCompleted,
      bestStreak: 1, // Placeholder - would track from history
      currentStreak: todayCompleted === todayTotal ? 1 : 0,
    };
  }, [tasks]);

  const AnimatedStatCard = ({ label, value, icon }: { label: string; value: number; icon: string }) => {
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
          {
            backgroundColor: colors.surface,
            borderColor: colors.divider,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.statIconContainer}>
          <MaterialIcons name={icon as any} size={24} color={accentColor} />
        </View>
        <ThemedText type="title" style={{ fontSize: 24, marginTop: Spacing.sm }}>
          {value}
        </ThemedText>
        <ThemedText type="default" style={{ color: surfaceColor, fontSize: 12, marginTop: Spacing.xs }}>
          {label}
        </ThemedText>
      </Animated.View>
    );
  };

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
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: accentColor,
              },
            ]}
          >
            <MaterialIcons name="person" size={40} color="#fff" />
          </View>

          <View style={styles.profileInfo}>
            <ThemedText type="title" style={{ fontSize: 24 }}>
              {user?.name || user?.email || "User"}
            </ThemedText>
            <ThemedText type="default" style={{ color: surfaceColor, marginTop: Spacing.xs }}>
              Task Master Pro
            </ThemedText>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }]}>
          <AnimatedStatCard label="Days Active" value={userStats.daysActive} icon="calendar-today" />
          <AnimatedStatCard label="Tasks Done" value={userStats.totalCompleted} icon="check-circle" />
          <AnimatedStatCard label="Best Streak" value={userStats.bestStreak} icon="local-fire-department" />
          <AnimatedStatCard label="Current Streak" value={userStats.currentStreak} icon="trending-up" />
        </View>

        {/* Achievement Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }]}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg }}>
            Achievements
          </ThemedText>

          <View
            style={[
              styles.achievementCard,
              {
                backgroundColor: colors.success || "#34C759",
                opacity: 0.1,
              },
            ]}
          >
            <MaterialIcons name="star" size={32} color={colors.success || "#34C759"} />
            <ThemedText
              type="defaultSemiBold"
              style={{ marginTop: Spacing.md, color: colors.success || "#34C759" }}
            >
              First Task Completed!
            </ThemedText>
            <ThemedText
              type="default"
              style={{ color: colors.success || "#34C759", marginTop: Spacing.sm, fontSize: 12 }}
            >
              You've started your productivity journey
            </ThemedText>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }]}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg }}>
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
            <ThemedText type="default">
              Task Master is your personal productivity companion. Build discipline and consistency by tracking daily tasks, organizing by skills, and monitoring your progress.
            </ThemedText>
            <ThemedText type="default" style={{ marginTop: Spacing.lg, fontSize: 12, color: surfaceColor }}>
              Version 1.0.0
            </ThemedText>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={logout}
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.warning || "#FF9500",
              opacity: 0.1,
            },
          ]}
        >
          <MaterialIcons name="logout" size={20} color={colors.warning || "#FF9500"} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.warning || "#FF9500", marginLeft: Spacing.md }}>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
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
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  achievementCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
