
/**
 * Protected Route Component - DISABLED
 *
 * Authentication has been disabled. This component now simply renders children.
 */

import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  // Authentication disabled - render children directly
  return <>{children}</>;
}
