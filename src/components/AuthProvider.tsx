import type {
  ReactNode,
} from "react";

import {
  useAuth,
} from "../hooks/useAuth";

import {
  useProfile,
} from "../hooks/useProfile";

import {
  supabase,
} from "../lib/supabase";

import {
  AuthContext,
} from "../lib/AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({
  children,
}: AuthProviderProps) {
  /*
   * ========================================
   * Auth
   * ========================================
   */

  const {
    session,
    isAuthLoading,
  } = useAuth();

  /*
   * ========================================
   * Profile
   * ========================================
   */

  const {
    profile,
    isProfileLoading,
    profileError,
  } = useProfile(
    session?.user.id,
  );

  /*
   * ========================================
   * Logout
   * ========================================
   */

  const logout =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    };

  /*
   * ========================================
   * Provider
   * ========================================
   */

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isAuthLoading,
        isProfileLoading,
        profileError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}