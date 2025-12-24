import { Image } from "expo-image";
import { useRouter, Link } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";

// This screen is no longer used - app now uses tab-based navigation
// Keeping this file for reference
export default function HomeScreen() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("[HomeScreen] Auth state:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      user: user ? { id: user.id, openId: user.openId, name: user.name, email: user.email } : null,
    });
  }, [user, loading, isAuthenticated]);

  const handleLogin = async () => {
    try {
      console.log("[Auth] Login button clicked - redirecting to profile");
      // Navigate to profile tab which has the login form
      router.push("/profile");
    } catch (error) {
      console.error("[Auth] Navigation error:", error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">        TaskMaster  </ThemedText>
      
      </ThemedView>
      <ThemedView style={styles.authContainer}>
        {loading ? (
          <ActivityIndicator />
        ) : isAuthenticated && user ? (
          <ThemedView style={styles.userInfo}>
            <ThemedText type="subtitle">Logged in as</ThemedText>
            <ThemedText type="defaultSemiBold">{user.name || user.email || user.openId}</ThemedText>
            <Pressable onPress={logout} style={styles.logoutButton}>
              <ThemedText style={styles.logoutText}>Logout</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <Pressable
            onPress={handleLogin}
            style={styles.loginButton}
          >
            <ThemedText style={styles.loginText}>Login</ThemedText>
          </Pressable>
        )}
      </ThemedView>
      
      
      
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  authContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  userInfo: {
    gap: 8,
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
  },
});
