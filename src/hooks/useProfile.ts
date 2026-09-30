import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";

import type {
  Profile,
} from "../types/profile";

export function useProfile(
  userId: string | undefined,
) {
  const [
    profile,
    setProfile,
  ] = useState<Profile | null>(
    null,
  );

  const [
    loadedUserId,
    setLoadedUserId,
  ] = useState<string | null>(
    null,
  );

  const [
    profileError,
    setProfileError,
  ] = useState("");

  useEffect(() => {
    /*
     * 未ログインなら
     * Profile取得・Realtime購読を行わない
     */
    if (!userId) {
      return;
    }

    let isCancelled =
      false;

    /*
     * ========================================
     * Profile取得
     * ========================================
     */

    const fetchProfile =
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            role,
            student_number,
            requested_student_number,
            student_number_requested_at,
            onboarding_completed,
            teacher_requested_at,
            created_at
          `)
          .eq(
            "id",
            userId,
          )
          .maybeSingle();

        if (isCancelled) {
          return;
        }

        if (error) {
          setProfile(null);

          setProfileError(
            "ユーザー情報を取得できませんでした。",
          );

          setLoadedUserId(
            userId,
          );

          return;
        }

        if (!data) {
          setProfile(null);

          setProfileError(
            "プロフィールが登録されていません。",
          );

          setLoadedUserId(
            userId,
          );

          return;
        }

        setProfile(
          data as Profile,
        );

        setProfileError("");

        setLoadedUserId(
          userId,
        );
      };

    /*
     * ========================================
     * 初回取得
     * ========================================
     */

    void fetchProfile();

    /*
     * ========================================
     * Realtime
     * ========================================
     *
     * 自分自身のprofilesだけ監視する。
     *
     * 管理者が
     *
     * teacher_pending
     *       ↓
     * teacher
     *
     * に変更するとUPDATEイベントが届く。
     */

    const channel =
      supabase
        .channel(
          `profile-${userId}`,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",

            schema: "public",

            table: "profiles",

            filter:
              `id=eq.${userId}`,
          },
          () => {
            /*
             * DBの最新状態を再取得する。
             *
             * payload.newを直接Profileとして
             * 使用することもできるが、
             * selectするカラムを一箇所に
             * 集約するため再取得方式にする。
             */
            void fetchProfile();
          },
        )
        .subscribe();

    /*
     * ========================================
     * Cleanup
     * ========================================
     */

    return () => {
      isCancelled = true;

      void supabase.removeChannel(
        channel,
      );
    };
  }, [userId]);

  /*
   * userIdが変わった場合も
   * 新しいProfile取得完了まではLoading
   */
  const isProfileLoading =
    Boolean(userId) &&
    loadedUserId !== userId;

  return {
    profile,
    isProfileLoading,
    profileError,
  };
}