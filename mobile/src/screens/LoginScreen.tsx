import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, typography, radius } from "../constants/theme";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";

export const LoginScreen: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!identifier.trim()) {
      setLocalError("Please enter your enrollment number, email, or mobile");
      return;
    }

    if (!password) {
      setLocalError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await login({
        identifier: identifier.trim(),
        password,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const activeError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Brand Identity */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>SG</Text>
            </View>
            <Text style={styles.title}>SOFTLAB GLOBAL</Text>
            <Text style={styles.subtitle}>IT Education Management Platform</Text>
            <Text style={styles.instruction}>
              Sign in with your Student ID, Email, or Mobile
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {activeError && (
              <ErrorBanner
                message={activeError}
                onDismiss={() => {
                  setLocalError(null);
                  clearError();
                }}
              />
            )}

            <Input
              label="Enrollment ID / Email / Phone"
              placeholder="e.g. SLG-2026-001 or email@example.com"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (localError) setLocalError(null);
              }}
              autoComplete="username"
              editable={!loading}
            />

            <Input
              label="Password"
              placeholder="Enter your account password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (localError) setLocalError(null);
              }}
              isPassword
              autoComplete="password"
              editable={!loading}
            />

            <Button
              title="Sign In to LMS"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need assistance? Contact{" "}
              <Text style={styles.supportLink}>support@softlabglobal.com</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textInverse,
    letterSpacing: 1,
  },
  title: {
    ...typography.h1,
    color: colors.slate900,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  instruction: {
    ...typography.caption,
    color: colors.slate500,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    ...typography.caption,
    color: colors.slate400,
  },
  supportLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
