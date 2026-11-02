


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."approve_student_number_change"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_requested_student_number text;
  v_role text;
begin
  /*
   * ログイン確認
   */
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  /*
   * 管理者確認
   */
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception '管理者権限が必要です。';
  end if;

  /*
   * 対象ユーザーの申請内容取得
   */
  select
    requested_student_number,
    role
  into
    v_requested_student_number,
    v_role
  from public.profiles
  where id = p_user_id
    and role in (
      'student_pending',
      'student'
    );

  if v_requested_student_number is null then
    raise exception
      '学籍番号申請がありません。';
  end if;

  /*
   * 承認直前にも重複確認
   */
  if exists (
    select 1
    from public.profiles
    where student_number =
      v_requested_student_number
      and id <> p_user_id
  ) then
    raise exception
      'この学籍番号はすでに使用されています。';
  end if;

  /*
   * 正式な学籍番号として承認
   */
  update public.profiles
  set
    student_number =
      v_requested_student_number,

    requested_student_number =
      null,

    student_number_requested_at =
      null,

    role =
      'student',

    onboarding_completed =
      true
  where
    id = p_user_id
    and role in (
      'student_pending',
      'student'
    );

  if not found then
    raise exception
      '学籍番号申請を承認できませんでした。';
  end if;
end;
$$;


ALTER FUNCTION "public"."approve_student_number_change"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_teacher"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception '管理者権限が必要です。';
  end if;

  update public.profiles
  set
    role = 'teacher',
    onboarding_completed = true
  where
    id = p_user_id
    and role = 'teacher_pending';

  if not found then
    raise exception '承認対象の教員申請が見つかりません。';
  end if;
end;
$$;


ALTER FUNCTION "public"."approve_teacher"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_student_number_change"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  update public.profiles
  set
    requested_student_number = null,
    student_number_requested_at = null
  where id = auth.uid()
    and role = 'student'
    and requested_student_number is not null;

  if not found then
    raise exception '取り下げ可能な学籍番号変更申請がありません。';
  end if;
end;
$$;


ALTER FUNCTION "public"."cancel_student_number_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_student_registration"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  update public.profiles
  set
    role = 'pending',
    requested_student_number = null,
    student_number_requested_at = null,
    onboarding_completed = false
  where
    id = auth.uid()
    and role = 'student_pending';

  if not found then
    raise exception '取り下げ可能な学生登録申請がありません。';
  end if;
end;
$$;


ALTER FUNCTION "public"."cancel_student_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_teacher_registration"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  update public.profiles
  set
    role = 'pending',
    teacher_requested_at = null,
    onboarding_completed = false
  where id = auth.uid()
    and role = 'teacher_pending';

  if not found then
    raise exception '取り下げ可能な教員登録申請がありません。';
  end if;
end;
$$;


ALTER FUNCTION "public"."cancel_teacher_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_student_registration"("p_student_number" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_student_number text;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  v_student_number :=
    upper(trim(p_student_number));

  if v_student_number = '' then
    raise exception '学籍番号を入力してください。';
  end if;

  /*
   * すでに正式登録されている番号との重複確認
   */
  if exists (
    select 1
    from public.profiles
    where student_number =
      v_student_number
      and id <> auth.uid()
  ) then
    raise exception
      'この学籍番号はすでに使用されています。';
  end if;

  /*
   * 他ユーザーが同じ番号を申請中か確認
   */
  if exists (
    select 1
    from public.profiles
    where requested_student_number =
      v_student_number
      and id <> auth.uid()
  ) then
    raise exception
      'この学籍番号はすでに申請されています。';
  end if;

  /*
   * 正式なstudent_numberにはまだ入れない。
   *
   * 管理者承認待ちにする。
   */
  update public.profiles
  set
    requested_student_number =
      v_student_number,
    student_number_requested_at =
      now(),
    role =
      'student_pending',
    onboarding_completed =
      false
  where
    id = auth.uid()
    and role = 'pending';

  if not found then
    raise exception
      '学生登録申請を行うことができませんでした。';
  end if;
end;
$$;


ALTER FUNCTION "public"."complete_student_registration"("p_student_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_teacher_requests"() RETURNS TABLE("user_id" "uuid", "display_name" "text", "requested_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception '管理者権限が必要です。';
  end if;

  return query
  select
    p.id as user_id,

    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      'ユーザー'
    ) as display_name,

    p.teacher_requested_at as requested_at

  from public.profiles p

  join auth.users u
    on u.id = p.id

  where p.role = 'teacher_pending'

  order by
    p.teacher_requested_at asc nulls last;
end;
$$;


ALTER FUNCTION "public"."get_pending_teacher_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_number_requests"() RETURNS TABLE("user_id" "uuid", "current_student_number" "text", "requested_student_number" "text", "requested_at" timestamp with time zone, "role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception '管理者権限が必要です。';
  end if;

  return query
  select
    p.id,
    p.student_number,
    p.requested_student_number,
    p.student_number_requested_at,
    p.role
  from public.profiles p
  where p.requested_student_number is not null
  order by p.student_number_requested_at asc;
end;
$$;


ALTER FUNCTION "public"."get_student_number_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (
    id,
    student_number,
    role,
    onboarding_completed
  )
  values (
    new.id,
    null,
    'pending',
    false
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_student_number_change"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_role text;
begin
  /*
   * ログイン確認
   */
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  /*
   * 管理者確認
   */
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception '管理者権限が必要です。';
  end if;

  /*
   * 現在のrole取得
   */
  select
    role
  into
    v_role
  from public.profiles
  where id = p_user_id
    and requested_student_number
      is not null
    and role in (
      'student_pending',
      'student'
    );

  if v_role is null then
    raise exception
      '学籍番号申請がありません。';
  end if;

  /*
   * 初回学生登録の却下
   */
  if v_role = 'student_pending' then

    update public.profiles
    set
      requested_student_number =
        null,

      student_number_requested_at =
        null,

      role =
        'pending',

      onboarding_completed =
        false
    where id = p_user_id;

  /*
   * 既存学生の変更申請却下
   */
  else

    update public.profiles
    set
      requested_student_number =
        null,

      student_number_requested_at =
        null
    where id = p_user_id;

  end if;
end;
$$;


ALTER FUNCTION "public"."reject_student_number_change"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_teacher"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception '管理者権限が必要です。';
  end if;

  update public.profiles
  set
    role = 'pending',
    onboarding_completed = false,
    teacher_requested_at = null
  where
    id = p_user_id
    and role = 'teacher_pending';

  if not found then
    raise exception '却下対象の教員申請が見つかりません。';
  end if;
end;
$$;


ALTER FUNCTION "public"."reject_teacher"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_student_number_change"("p_student_number" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_student_number text;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  -- 前後空白を除去して大文字化
  v_student_number := upper(trim(p_student_number));

  if v_student_number is null
     or v_student_number = '' then
    raise exception '学籍番号を入力してください。';
  end if;

  -- 異常に長い値だけ最低限防止
  if length(v_student_number) > 50 then
    raise exception '学籍番号が長すぎます。';
  end if;

  -- student 以外は変更申請できない
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'student'
  ) then
    raise exception '学籍番号の変更申請を行うことができません。';
  end if;

  -- すでに変更申請中
  if exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and requested_student_number is not null
  ) then
    raise exception 'すでに学籍番号の変更を申請しています。';
  end if;

  -- 現在と同じ学籍番号
  if exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and student_number = v_student_number
  ) then
    raise exception '現在と同じ学籍番号です。';
  end if;

  -- 他ユーザーが現在使用中
  if exists (
    select 1
    from public.profiles
    where id <> auth.uid()
      and student_number = v_student_number
  ) then
    raise exception 'この学籍番号はすでに使用されています。';
  end if;

  -- 他ユーザーが申請中
  if exists (
    select 1
    from public.profiles
    where id <> auth.uid()
      and requested_student_number = v_student_number
  ) then
    raise exception 'この学籍番号はすでに申請されています。';
  end if;

  update public.profiles
  set
    requested_student_number = v_student_number,
    student_number_requested_at = now()
  where id = auth.uid()
    and role = 'student';

  if not found then
    raise exception '学籍番号の変更申請を行うことができませんでした。';
  end if;
end;
$$;


ALTER FUNCTION "public"."request_student_number_change"("p_student_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_teacher_registration"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  update public.profiles
  set
    role = 'teacher_pending',
    onboarding_completed = false,
    teacher_requested_at = now()
  where
    id = auth.uid()
    and role = 'pending';

  if not found then
    raise exception '教員申請を行うことができませんでした。';
  end if;
end;
$$;


ALTER FUNCTION "public"."request_teacher_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_presentation"("p_presentation_id" "uuid", "p_seminar_name" "text", "p_title" "text", "p_summary" "text", "p_material_url" "text", "p_github_url" "text", "p_presenter_student_numbers" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_role text;
  v_student_number text;
  v_normalized_presenters text[];
begin
  if v_uid is null then
    raise exception 'ログインが必要です。';
  end if;

  select p.owner
  into v_owner
  from public.presentations p
  where p.id = p_presentation_id
  for update;

  if not found then
    raise exception '発表が見つかりません。';
  end if;

  select
    pf.role,
    nullif(upper(trim(pf.student_number)), '')
  into
    v_role,
    v_student_number
  from public.profiles pf
  where pf.id = v_uid;

  if v_role is null then
    raise exception 'プロフィールが見つかりません。';
  end if;

  if v_role not in ('student', 'teacher', 'admin') then
    raise exception '発表を編集する権限がありません。';
  end if;

  if
    v_owner <> v_uid
    and not exists (
      select 1
      from public.presenters pr
      where pr.presentation_id = p_presentation_id
        and upper(trim(pr.student_number)) = v_student_number
    )
  then
    raise exception '発表を編集する権限がありません。';
  end if;

  if nullif(trim(p_seminar_name), '') is null then
    raise exception 'ゼミ名を入力してください。';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'タイトルを入力してください。';
  end if;

  select coalesce(
    array_agg(x.student_number order by x.student_number),
    array[]::text[]
  )
  into v_normalized_presenters
  from (
    select distinct upper(trim(value)) as student_number
    from unnest(coalesce(p_presenter_student_numbers, array[]::text[])) as t(value)
    where nullif(trim(value), '') is not null
  ) x;

  if v_role = 'student' and v_student_number is not null then
    if not (v_student_number = any(v_normalized_presenters)) then
      v_normalized_presenters :=
        array_append(v_normalized_presenters, v_student_number);
    end if;
  end if;

  if cardinality(v_normalized_presenters) = 0 then
    raise exception '発表者を1人以上登録してください。';
  end if;

  update public.presentations
  set
    seminar_name = trim(p_seminar_name),
    title = trim(p_title),
    summary = coalesce(p_summary, ''),
    material_url = nullif(trim(p_material_url), ''),
    github_url = nullif(trim(p_github_url), '')
  where id = p_presentation_id;

  delete from public.presenters
  where presentation_id = p_presentation_id
    and not (
      upper(trim(student_number))
      = any(v_normalized_presenters)
    );

  insert into public.presenters (
    presentation_id,
    student_number
  )
  select
    p_presentation_id,
    student_number
  from unnest(v_normalized_presenters) as student_number
  on conflict (presentation_id, student_number)
  do nothing;
end;
$$;


ALTER FUNCTION "public"."update_presentation"("p_presentation_id" "uuid", "p_seminar_name" "text", "p_title" "text", "p_summary" "text", "p_material_url" "text", "p_github_url" "text", "p_presenter_student_numbers" "text"[]) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_programs" (
    "event_id" "uuid" NOT NULL,
    "entries" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "revision" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "event_programs_entries_check" CHECK (("jsonb_typeof"("entries") = 'array'::"text"))
);


ALTER TABLE "public"."event_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presentation_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "project_type" "text" NOT NULL,
    "event_date" "date",
    "location" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "presentation_events_project_type_check" CHECK (("project_type" = ANY (ARRAY['third_year'::"text", 'fourth_year'::"text"])))
);


ALTER TABLE "public"."presentation_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presentations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seminar_name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "material_url" "text",
    "github_url" "text",
    "owner" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid"
);


ALTER TABLE "public"."presentations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presenters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "presentation_id" "uuid" NOT NULL,
    "student_number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."presenters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "student_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "teacher_requested_at" timestamp with time zone,
    "requested_student_number" "text",
    "student_number_requested_at" timestamp with time zone,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['pending'::"text", 'student_pending'::"text", 'student'::"text", 'teacher_pending'::"text", 'teacher'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."event_programs"
    ADD CONSTRAINT "event_programs_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."presentation_events"
    ADD CONSTRAINT "presentation_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presentations"
    ADD CONSTRAINT "presentations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presenters"
    ADD CONSTRAINT "presenters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_student_number_unique" UNIQUE ("student_number");



CREATE INDEX "idx_presentations_owner" ON "public"."presentations" USING "btree" ("owner");



CREATE INDEX "idx_presenters_presentation_id" ON "public"."presenters" USING "btree" ("presentation_id");



CREATE UNIQUE INDEX "presenters_presentation_student_number_unique" ON "public"."presenters" USING "btree" ("presentation_id", "student_number");



ALTER TABLE ONLY "public"."event_programs"
    ADD CONSTRAINT "event_programs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."presentation_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presentation_events"
    ADD CONSTRAINT "presentation_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."presentations"
    ADD CONSTRAINT "presentations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."presentation_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presentations"
    ADD CONSTRAINT "presentations_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presenters"
    ADD CONSTRAINT "presenters_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can read profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Allowed roles can insert own presentations" ON "public"."presentations" FOR INSERT TO "authenticated" WITH CHECK ((("owner" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['student'::"text", 'teacher'::"text", 'admin'::"text"])))))));



CREATE POLICY "Allowed roles can insert presenters into own presentations" ON "public"."presenters" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."presentations" "pr"
  WHERE (("pr"."id" = "presenters"."presentation_id") AND ("pr"."owner" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['student'::"text", 'teacher'::"text", 'admin'::"text"])))))));



CREATE POLICY "Authenticated users can read events" ON "public"."presentation_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read presentations" ON "public"."presentations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read presenters" ON "public"."presenters" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Owner or presenter can update presentation" ON "public"."presentations" FOR UPDATE TO "authenticated" USING ((("owner" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."presenters" "pr"
     JOIN "public"."profiles" "pf" ON (("pf"."student_number" = "pr"."student_number")))
  WHERE (("pr"."presentation_id" = "presentations"."id") AND ("pf"."id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK ((("owner" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."presenters" "pr"
     JOIN "public"."profiles" "pf" ON (("pf"."student_number" = "pr"."student_number")))
  WHERE (("pr"."presentation_id" = "presentations"."id") AND ("pf"."id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Teachers and admins can create events" ON "public"."presentation_events" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['teacher'::"text", 'admin'::"text"])))))));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."event_programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presentation_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presentations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presenters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "program_insert" ON "public"."event_programs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['teacher'::"text", 'admin'::"text"]))))));



CREATE POLICY "program_read" ON "public"."event_programs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "program_update" ON "public"."event_programs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['teacher'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['teacher'::"text", 'admin'::"text"]))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."approve_student_number_change"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_student_number_change"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_student_number_change"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."approve_teacher"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_teacher"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_teacher"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_student_number_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_student_number_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_student_number_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_student_registration"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_student_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_student_registration"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_teacher_registration"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_teacher_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_teacher_registration"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_student_registration"("p_student_number" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_student_registration"("p_student_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_student_registration"("p_student_number" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_pending_teacher_requests"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_teacher_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_teacher_requests"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_student_number_requests"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_student_number_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_number_requests"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user_profile"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_student_number_change"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_student_number_change"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_student_number_change"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_teacher"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_teacher"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_teacher"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_student_number_change"("p_student_number" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_student_number_change"("p_student_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_student_number_change"("p_student_number" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_teacher_registration"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_teacher_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_teacher_registration"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_presentation"("p_presentation_id" "uuid", "p_seminar_name" "text", "p_title" "text", "p_summary" "text", "p_material_url" "text", "p_github_url" "text", "p_presenter_student_numbers" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_presentation"("p_presentation_id" "uuid", "p_seminar_name" "text", "p_title" "text", "p_summary" "text", "p_material_url" "text", "p_github_url" "text", "p_presenter_student_numbers" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_presentation"("p_presentation_id" "uuid", "p_seminar_name" "text", "p_title" "text", "p_summary" "text", "p_material_url" "text", "p_github_url" "text", "p_presenter_student_numbers" "text"[]) TO "service_role";


















GRANT ALL ON TABLE "public"."event_programs" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."event_programs" TO "authenticated";



GRANT ALL ON TABLE "public"."presentation_events" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."presentation_events" TO "authenticated";



GRANT ALL ON TABLE "public"."presentations" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."presentations" TO "authenticated";



GRANT UPDATE("seminar_name") ON TABLE "public"."presentations" TO "authenticated";



GRANT UPDATE("title") ON TABLE "public"."presentations" TO "authenticated";



GRANT UPDATE("summary") ON TABLE "public"."presentations" TO "authenticated";



GRANT UPDATE("material_url") ON TABLE "public"."presentations" TO "authenticated";



GRANT UPDATE("github_url") ON TABLE "public"."presentations" TO "authenticated";



GRANT ALL ON TABLE "public"."presenters" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."presenters" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































