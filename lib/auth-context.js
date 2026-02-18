"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [storeId, setStoreId] = useState(null);  // stores.id
  const [storeName, setStoreName] = useState(""); // stores.store_name
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // store_id を auth.uid() から解決
  const resolveStore = useCallback(async (authUser) => {
    if (!supabase || !authUser) return;
    try {
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("id, store_name")
        .eq("owner_auth_id", authUser.id)
        .single();

      if (fetchError) {
        // 店舗が見つからない場合（新規登録直後など）
        console.error("Store fetch error:", fetchError);
        setError("店舗情報が見つかりません。");
        return;
      }
      setStoreId(data.id);
      setStoreName(data.store_name || "");
    } catch (e) {
      console.error("Store resolution error:", e);
      setError("店舗情報の取得に失敗しました。");
    }
  }, []);

  // 初回マウント：セッション確認
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          await resolveStore(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setStoreId(null);
          setStoreName("");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [resolveStore]);

  // サインアップ（メール+パスワード → stores に1行追加）
  const signUp = async (email, password, shopName) => {
    if (!supabase) return { error: "Supabase未接続" };
    setError(null);

    // 1. Supabase Auth でユーザー作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return { error: authError.message };
    }

    // 2. stores テーブルに1行追加
    const authUser = authData.user;
    if (authUser) {
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

      // store_id を解決
      await resolveStore(authUser);
    }

    return { data: authData };
  };

  // ログイン
  const signIn = async (email, password) => {
    if (!supabase) return { error: "Supabase未接続" };
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return { error: signInError.message };
    }

    return { data };
  };

  // ログアウト
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setStoreId(null);
    setStoreName("");
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
