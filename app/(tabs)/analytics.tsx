import React, { useMemo, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useTaskContext } from "@/context/TaskContext";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/supabase-auth";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { categories, tasks } = useTaskContext();
  const [analyticsHistory, setAnalyticsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const accentColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = Colors[colorScheme ?? "light"].textSecondary;
  const dangerColor = Colors[colorScheme ?? "light"].danger;
  const colors = Colors[colorScheme ?? "light"];

  // Load analytics history
  useEffect(() => {
    loadAnalyticsHistory();
  }, []);

  const loadAnalyticsHistory = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("analytics_history")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);

      if (error) throw error;
      setAnalyticsHistory(data || []);
    } catch (error) {
      console.error("Error loading analytics history:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const ProgressRing = ({
    progress,
    size = 220,
    strokeWidth = 16,
  }: {
    progress: number;
    size?: number;
    strokeWidth?: number;
  }) => {
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
          opacity={0.3}
        />
        {/* Progress circle */}
        <Circle
          stroke="url(#gradient)"
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
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={colorScheme === "dark" ? "#0A84FF" : "#005FCC"} />
          </linearGradient>
        </defs>
      </Svg>
    );
  };

  const WeeklyChart = () => {
    const chartWidth = screenWidth - Spacing.lg * 2;
    const chartHeight = 180;
    const barWidth = (chartWidth - 60) / 7;
    const maxHeight = chartHeight - 40;

    const weekData = analyticsHistory.slice(0, 7).reverse();

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {weekData.map((day, index) => {
            const barHeight = (day.completion_percentage / 100) * maxHeight;
            const x = 30 + index * barWidth + barWidth / 4;
            const y = chartHeight - 20 - barHeight;

            return (
              <React.Fragment key={index}>
                {/* Bar */}
                <Line
                  x1={x}
                  y1={chartHeight - 20}
                  x2={x}
                  y2={y}
                  stroke={day.completion_percentage >= 80 ? "#34C759" : accentColor}
                  strokeWidth={barWidth / 2}
                  strokeLinecap="round"
                />
                {/* Day label */}
                <SvgText
                  x={x}
                  y={chartHeight - 5}
                  fontSize="10"
                  fill={textSecondary}
                  textAnchor="middle"
                >
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }).substring(0, 1)}
                </SvgText>
                {/* Percentage label */}
                <SvgText
                  x={x}
                  y={y - 5}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {day.completion_percentage}%
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
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

    const getGradientColors = (percentage: number): [string, string] => {
      if (percentage >= 80) return ["#11998e", "#38ef7d"];
      if (percentage >= 50) return ["#667eea", "#764ba2"];
      return ["#f093fb", "#f5576c"];
    };

    return (
      <Animated.View style={styles.progressBarContainer} entering={FadeIn}>
        <View style={styles.progressBarHeader}>
          <ThemedText type="default" style={{ fontSize: 15 }}>
            {title}
          </ThemedText>
          <ThemedText type="default" style={{ color: textSecondary, fontSize: 13 }}>
            {completed}/{total}
          </ThemedText>
        </View>
        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <Animated.View style={[styles.progressBarFill, animatedStyle]}>
            <LinearGradient
              colors={getGradientColors(percentage)}
              style={{ flex: 1, borderRadius: BorderRadius.sm }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <ThemedText type="default" style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>
          {percentage}% complete
        </ThemedText>
      </Animated.View>
    );
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage === 100) return "🎉 Perfect! You completed all tasks!";
    if (percentage >= 80) return "🌟 Great job! Keep it up!";
    if (percentage >= 50) return "💪 You're doing well! Almost there!";
    if (percentage > 0) return "🚀 You're making progress!";
    return "📝 Start by completing your first task!";
  };

  const getMotivationalColor = (percentage: number) => {
    if (percentage === 100) return ["#11998e", "#38ef7d"];
    if (percentage >= 80) return ["#667eea", "#764ba2"];
    if (percentage >= 50) return ["#f093fb", "#f5576c"];
    return ["#4facfe", "#00f2fe"];
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
        <ThemedText type="title" style={{ fontSize: 32, paddingHorizontal: Spacing.lg, fontWeight: "bold" }} data-testid="analytics-title">
          Analytics
        </ThemedText>

        {/* Today's Summary */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg, fontSize: 20 }}>
            Today's Progress
          </ThemedText>

          <View style={styles.progressRingContainer} data-testid="progress-ring-container">
            <ProgressRing progress={dailyStats.percentage} />
            <View style={styles.progressRingText}>
              <ThemedText type="title" style={{ fontSize: 48, fontWeight: "bold" }} data-testid="progress-percentage">
                {dailyStats.percentage}%
              </ThemedText>
              <ThemedText type="default" style={{ color: textSecondary, fontSize: 16 }}>
                Complete
              </ThemedText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <Animated.View
              style={[styles.statCard]}
              entering={FadeIn.delay(100)}
              data-testid="stat-completed"
            >
              <LinearGradient
                colors={["#11998e", "#38ef7d"]}
                style={styles.statCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="check-circle" size={32} color="#fff" />
                <ThemedText type="subtitle" style={{ fontSize: 28, color: "#fff", marginTop: 8 }}>
                  {dailyStats.completed}
                </ThemedText>
                <ThemedText type="default" style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
                  Completed
                </ThemedText>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={[styles.statCard]}
              entering={FadeIn.delay(200)}
              data-testid="stat-remaining"
            >
              <LinearGradient
                colors={["#f093fb", "#f5576c"]}
                style={styles.statCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="pending-actions" size={32} color="#fff" />
                <ThemedText type="subtitle" style={{ fontSize: 28, color: "#fff", marginTop: 8 }}>
                  {dailyStats.missed}
                </ThemedText>
                <ThemedText type="default" style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
                  Remaining
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          </View>

          <LinearGradient
            colors={getMotivationalColor(dailyStats.percentage)}
            style={styles.motivationalCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: "#fff", textAlign: "center" }}>
              {getMotivationalMessage(dailyStats.percentage)}
            </ThemedText>
          </LinearGradient>
        </View>

        {/* Weekly Progress */}
        {analyticsHistory.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
            <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg, fontSize: 20 }}>
              Weekly Progress
            </ThemedText>
            <View
              style={[
                styles.chartWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.divider,
                },
              ]}
            >
              <WeeklyChart />
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
            <ThemedText type="subtitle" style={{ marginBottom: Spacing.lg, fontSize: 20 }}>
              Category Performance
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
            <MaterialIcons name="assessment" size={64} color={textSecondary} />
            <ThemedText type="subtitle" style={{ marginTop: Spacing.lg }}>
              No tasks yet
            </ThemedText>
            <ThemedText type="default" style={{ color: textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
              Create tasks to see your analytics and track your progress
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
    marginTop: Spacing.xl,
  },
  progressRingContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  progressRing: {
    marginBottom: -80,
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
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statCardInner: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  motivationalCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  chartWrapper: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
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
    height: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
});
