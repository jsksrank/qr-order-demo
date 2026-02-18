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

  // store_id を auth.uid() から解決（リトライ付き）
  const resolveStore = useCallback(async (authUser, retryCount = 0) => {
    if (!supabase || !authUser) return;
    try {
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("id, store_name")
        .eq("owner_auth_id", authUser.id)
        .single();

      if (fetchError) {
        // リトライ（最大3回、1秒間隔）
        if (retryCount < 3) {
          console.log(`Store fetch retry ${retryCount + 1}/3...`);
          await new Promise((r) => setTimeout(r, 1000));
          return resolveStore(authUser, retryCount + 1);
        }
        console.error("Store fetch error after retries:", fetchError);
        setError("店舗情報が見つかりません。再度ログインしてください。");
        return;
      }
      setStoreId(data.id);
      setStoreName(data.store_name || "");
      setError(null);
    } catch (e) {
      console.error("Store resolution error:", e);
      if (retryCount < 3) {
        await new Promise((r) => setTimeout(r, 1000));
        return resolveStore(authUser, retryCount + 1);
      }
      setError("店舗情報の取得に失敗しました。");
    }
  }, []);

  // 認証状態の監視（onAuthStateChange をメインに使う）
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("Auth event:", event);

        if (session?.user) {
          setUser(session.user);

          // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED すべてで store 解決
          if (!storeId || event === "SIGNED_IN") {
            await resolveStore(session.user);
          }
        } else {
          setUser(null);
          setStoreId(null);
          setStoreName("");
        }

        // 初回ロード完了
        if (loading) {
          setLoading(false);
        }
      }
    );

    // フォールバック: onAuthStateChange が発火しなかった場合のタイムアウト
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading) {
        console.log("Auth fallback: setting loading to false");
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
