import React, { useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useTaskContext } from "@/context/TaskContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { categories, tasks } = useTaskContext();

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const surfaceColor = useThemeColor({}, "icon");
  const colors = Colors[colorScheme ?? "light"];

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const missed = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      missed,
      percentage,
    };
  }, [tasks]);

  // Calculate category stats
  const categoryStats = useMemo(() => {
    return categories.map((category) => {
      const categoryTasks = tasks.filter((t) => t.categoryId === category.id);
      const completed = categoryTasks.filter((t) => t.isCompleted).length;
      const percentage = categoryTasks.length > 0 ? Math.round((completed / categoryTasks.length) * 100) : 0;

      return {
        id: category.id,
        title: category.title,
        total: categoryTasks.length,
        completed,
        percentage,
      };
    });
  }, [categories, tasks]);

  // Animated progress value
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(dailyStats.percentage, {
      duration: 1000,
    });
  }, [dailyStats.percentage]);

  const ProgressRing = ({ progress, size = 200, strokeWidth = 12 }: { progress: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <Svg width={size} height={size} style={styles.progressRing}>
        {/* Background circle */}
        <Circle
          stroke={colors.divider}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <Circle
          stroke={accentColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    );
  };

  const ProgressBar = ({ percentage, title, completed, total }: any) => {
    const animatedWidth = useSharedValue(0);

    useEffect(() => {
      animatedWidth.value = withTiming(percentage, {
        duration: 800,
      });
    }, [percentage]);

    const animatedStyle = useAnimatedStyle(() => ({
      width: `${animatedWidth.value}%`,
    }));

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarHeader}>
          <ThemedText type="default">{title}</ThemedText>
          <ThemedText type="default" style={{ color: surfaceColor, fontSize: 12 }}>
            {completed}/{total}
          </ThemedText>
        </View>
        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: percentage >= 80 ? colors.success || "#34C759" : accentColor,
              },
              animatedStyle,
            ]}
          />
        </View>
        <ThemedText type="default" style={{ color: surfaceColor, fontSize: 12, marginTop: Spacing.sm }}>
          {percentage}%
        </ThemedText>
      </View>
    );
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage === 100) return "🎉 Perfect! You completed all tasks!";
    if (percentage >= 80) return "🌟 Great job! Keep it up!";
    if (percentage >= 50) return "💪 You're doing well! Almost there!";
    if (percentage > 0) return "🚀 You're making progress!";
    return "📝 Start by completing your first task!";
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
        <ThemedText type="title" style={{ fontSize: 28, paddingHorizontal: Spacing.lg }}>
          Analytics
        </ThemedText>

        {/* Today's Summary */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg }}>
            Today's Summary
          </ThemedText>

          <View style={styles.progressRingContainer}>
            <ProgressRing progress={dailyStats.percentage} />
            <View style={styles.progressRingText}>
              <ThemedText type="title" style={{ fontSize: 32 }}>
                {dailyStats.percentage}%
              </ThemedText>
              <ThemedText type="default" style={{ color: surfaceColor }}>
                Complete
              </ThemedText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.success || "#34C759",
                  opacity: 0.1,
                },
              ]}
            >
              <ThemedText type="subtitle" style={{ fontSize: 24, color: colors.success || "#34C759" }}>
                {dailyStats.completed}
              </ThemedText>
              <ThemedText type="default" style={{ color: colors.success || "#34C759" }}>
                Completed
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.warning || "#FF9500",
                  opacity: 0.1,
                },
              ]}
            >
              <ThemedText type="subtitle" style={{ fontSize: 24, color: colors.warning || "#FF9500" }}>
                {dailyStats.missed}
              </ThemedText>
              <ThemedText type="default" style={{ color: colors.warning || "#FF9500" }}>
                Missed
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.motivationalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
              {getMotivationalMessage(dailyStats.percentage)}
            </ThemedText>
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
            <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg }}>
              Category Breakdown
            </ThemedText>

            {categoryStats.map((stat) => (
              <ProgressBar
                key={stat.id}
                title={stat.title}
                percentage={stat.percentage}
                completed={stat.completed}
                total={stat.total}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText type="subtitle">No tasks yet</ThemedText>
            <ThemedText type="default" style={{ color: surfaceColor, marginTop: Spacing.sm }}>
              Create tasks to see your analytics
            </ThemedText>
          </View>
        )}
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
  section: {
    marginBottom: Spacing.xl,
  },
  progressRingContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  progressRing: {
    marginBottom: -60,
  },
  progressRingText: {
    alignItems: "center",
    zIndex: 10,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  motivationalCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
});
