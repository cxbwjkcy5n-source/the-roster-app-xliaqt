
/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Redirects to auth screen if user is not logged in.
 */

import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = "/auth",
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      loadingComponent || (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )
    );
  }

  if (!user) {
    return <Redirect href={redirectTo} />;
  }

  return <>{children}</>;
}
