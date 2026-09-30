import {
  createContext,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import type {
  Profile,
} from "../types/profile";

export type AuthContextType = {
  session: Session | null;

  profile: Profile | null;

  isAuthLoading: boolean;

  isProfileLoading: boolean;

  profileError: string;

  logout: () => Promise<void>;
};

export const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);