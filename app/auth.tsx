
import React, { useEffect } from "react";
import { Redirect } from "expo-router";

// This file redirects to the proper auth screen
// We use /auth/login as the main auth entry point
export default function AuthScreen() {
  return <Redirect href="/auth/login" />;
}
