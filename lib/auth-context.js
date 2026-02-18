"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // store_id を auth.uid() から解決
  const resolveStore = useCallback(async (authUser) => {
    if (!supabase || !authUser) return false;
    try {
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("id, store_name")
        .eq("owner_auth_id", authUser.id)
        .single();

      if (fetchError) {
        console.error("Store fetch error:", fetchError);
        setError("店舗情報が見つかりません。");
        return false;
      }
      setStoreId(data.id);
      setStoreName(data.store_name || "");
      setError(null);
      return true;
    } catch (e) {
      console.error("Store resolution error:", e);
      setError("店舗情報の取得に失敗しました。");
      return false;
    }
  }, []);

  // 初回マウント：既存セッションの復元
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session restore error:", sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await resolveStore(session.user);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [resolveStore]);

  // サインアップ
  const signUp = async (email, password, shopName) => {
    if (!supabase) return { error: "Supabase未接続" };
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return { error: authError.message };
      }

      const authUser = authData.user;
      if (!authUser) {
        setError("ユーザーの作成に失敗しました。");
        return { error: "ユーザーの作成に失敗しました。" };
      }

      // stores テーブルに1行追加
      const { error: storeError } = await supabase.from("stores").insert({
        owner_auth_id: authUser.id,
        email: email,
        store_name: shopName || "マイサロン",
        plan: "free",
        max_sku: 10,
      });

      if (storeError) {
        console.error("Store creation error:", storeError);
        setError("店舗の作成に失敗しました: " + storeError.message);
        return { error: storeError.message };
      }

      // ユーザーとストアを設定
      setUser(authUser);
      await resolveStore(authUser);

      return { data: authData };
    } catch (e) {
      console.error("SignUp error:", e);
      setError("登録に失敗しました: " + e.message);
      return { error: e.message };
    }
  };

  // ログイン（直接resolveStoreを呼ぶ）
  const signIn = async (email, password) => {
    if (!supabase) return { error: "Supabase未接続" };
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("SignIn error:", signInError);
        setError(signInError.message);
        return { error: signInError.message };
      }

      if (!data.user) {
        setError("ログインに失敗しました。");
        return { error: "ログインに失敗しました。" };
      }

      // ★ signIn内で直接ユーザーとストアを設定
      setUser(data.user);
      const storeResolved = await resolveStore(data.user);

      if (!storeResolved) {
        return { error: "店舗情報の取得に失敗しました。" };
      }

      return { data };
    } catch (e) {
      console.error("SignIn exception:", e);
      setError("ログインに失敗しました: " + e.message);
      return { error: e.message };
    }
  };

  // ログアウト
  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    }
    setUser(null);
    setStoreId(null);
    setStoreName("");
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      storeId,
      storeName,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      isAuthenticated: !!user && !!storeId,
      isSupabaseConnected: !!supabase,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
