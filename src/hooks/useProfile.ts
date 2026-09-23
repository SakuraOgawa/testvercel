import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

import type { Profile } from "../types/profile";

export function useProfile(
  userId: string | undefined,
) {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [isFetching, setIsFetching] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isCancelled = false;

    const fetchProfile = async () => {
      setIsFetching(true);

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          role,
          student_number,
          created_at
        `)
        .eq("id", userId)
        .single();

      if (isCancelled) {
        return;
      }

      if (error) {
        console.error(
          "プロフィール取得エラー:",
          error,
        );

        setProfile(null);

        setProfileError(
          "ユーザー情報を取得できませんでした。",
        );

        setIsFetching(false);

        return;
      }

      setProfile(data as Profile);
      setProfileError("");
      setIsFetching(false);
    };

    void fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  /*
   * userIdが存在するときだけ
   * プロフィール取得中として扱う
   */
  const isProfileLoading =
    Boolean(userId) && isFetching;

  return {
    profile,
    isProfileLoading,
    profileError,
  };
}