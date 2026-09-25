import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, typography, radius } from "../constants/theme";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { AuthApi } from "../api/auth";

export const HomeScreen: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [rotationMsg, setRotationMsg] = useState<string | null>(null);

  const handleTestTokenRotation = async () => {
    setRefreshing(true);
    setRotationMsg(null);
    try {
      const res = await AuthApi.refresh();
      setRotationMsg(`Refreshed! New token expires in ${res.expiresIn}s`);
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Refresh failed";
      Alert.alert("Token Refresh Error", msg);
    } finally {
      setRefreshing(false);
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "DIRECTOR":
        return "error" as const;
      case "ADMIN":
      case "MANAGER":
        return "warning" as const;
      case "TRAINER":
        return "primary" as const;
      case "STUDENT":
        return "success" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top App Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>SOFTLAB GLOBAL</Text>
            <Text style={styles.welcomeText}>Welcome back, {user?.firstName}!</Text>
          </View>
          <Badge
            label={user?.roleCode || "STUDENT"}
            variant={getRoleVariant(user?.roleCode || "")}
          />
        </View>

        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <Text style={styles.cardHeader}>Authenticated Profile</Text>

          <View style={styles.profileRow}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={styles.label}>Email Address:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={styles.label}>Role Code:</Text>
            <Text style={styles.value}>{user?.roleCode}</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={[styles.value, styles.monoText]}>{user?.id}</Text>
          </View>
        </Card>

        {/* Token Management Card */}
        <Card style={styles.actionCard}>
          <Text style={styles.cardHeader}>Native Security & Tokens</Text>
          <Text style={styles.cardDesc}>
            Bearer JWT is active. Test token rotation against the backend.
          </Text>

          {rotationMsg && (
            <View style={styles.rotationBanner}>
              <Text style={styles.rotationText}>{rotationMsg}</Text>
            </View>
          )}

          <Button
            title="Test Token Refresh Rotation"
            onPress={handleTestTokenRotation}
            variant="outline"
            loading={refreshing}
            style={styles.actionBtn}
          />
        </Card>

        {/* Role Permissions Preview */}
        <Card style={styles.permissionsCard}>
          <Text style={styles.cardHeader}>Server-Assigned Claims</Text>
          <Text style={styles.cardDesc}>
            Granular permissions authorized server-side for this role:
          </Text>

          <View style={styles.claimsContainer}>
            {user?.permissions && user.permissions.length > 0 ? (
              user.permissions.slice(0, 10).map((perm, idx) => (
                <View key={idx} style={styles.claimPill}>
                  <Text style={styles.claimText}>{perm}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyClaims}>Standard student permissions active</Text>
            )}
            {user?.permissions && user.permissions.length > 10 && (
              <Text style={styles.moreClaims}>
                +{user.permissions.length - 10} more permissions
              </Text>
            )}
          </View>
        </Card>

        {/* Sign Out Action */}
        <View style={styles.logoutContainer}>
          <Button
            title="Sign Out"
            onPress={logout}
            variant="danger"
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  appTitle: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: "700",
    letterSpacing: 1,
  },
  welcomeText: {
    ...typography.h2,
    color: colors.slate900,
    marginTop: 2,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    ...typography.h3,
    color: colors.slate800,
    marginBottom: spacing.md,
  },
  cardDesc: {
    ...typography.caption,
    color: colors.slate600,
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    ...typography.caption,
    color: colors.slate500,
  },
  value: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.slate900,
  },
  monoText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  actionCard: {
    marginBottom: spacing.md,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
  rotationBanner: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  rotationText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionsCard: {
    marginBottom: spacing.xl,
  },
  claimsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  claimPill: {
    backgroundColor: colors.slate100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  claimText: {
    fontSize: 11,
    color: colors.slate700,
  },
  emptyClaims: {
    ...typography.caption,
    color: colors.slate400,
    fontStyle: "italic",
  },
  moreClaims: {
    ...typography.small,
    color: colors.slate400,
    marginTop: spacing.xs,
  },
  logoutContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoutBtn: {
    backgroundColor: colors.slate800,
  },
});
