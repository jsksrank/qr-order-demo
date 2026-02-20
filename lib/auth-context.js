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
  const [storePlan, setStorePlan] = useState("free");
  const [storeMaxSku, setStoreMaxSku] = useState(10);
  const [storeBonusSku, setStoreBonusSku] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  // ★ Step 6 追加
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // store_id を auth.uid() から解決
  const resolveStore = useCallback(async (authUser) => {
    if (!supabase || !authUser) return false;
    try {
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("id, store_name, plan, max_sku, bonus_sku, subscription_status")
        .eq("owner_auth_id", authUser.id)
        .single();

      if (fetchError) {
        console.error("Store fetch error:", fetchError);
        setError("店舗情報が見つかりません。");
        return false;
      }
      setStoreId(data.id);
      setStoreName(data.store_name || "");
      setStorePlan(data.plan || "free");
      setStoreMaxSku(data.max_sku || 10);
      setStoreBonusSku(data.bonus_sku || 0);
      setSubscriptionStatus(data.subscription_status || null);
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

    // ★ Step 6 追加：PASSWORD_RECOVERY イベントをリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          if (session?.user) {
            setUser(session.user);
            setIsPasswordRecovery(true);
            setLoading(false);
          }
        }
      }
    );

    return () => subscription?.unsubscribe();
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
      const { data: storeData, error: storeError } = await supabase.from("stores").insert({
        owner_auth_id: authUser.id,
        email: email,
        store_name: shopName || "マイサロン",
        plan: "free",
        max_sku: 10,
      }).select("id").single(); // ★ Step 7: storeIdを取得するため .select().single() を追加

      if (storeError) {
        console.error("Store creation error:", storeError);
        setError("店舗の作成に失敗しました: " + storeError.message);
        return { error: storeError.message };
      }

      // ★ Step 7: free上限分（10枚）のQRタグを自動生成
      if (storeData?.id) {
        const FREE_TAG_COUNT = 10;
        const newTags = [];
        for (let i = 1; i <= FREE_TAG_COUNT; i++) {
          newTags.push({
            store_id: storeData.id,
            tag_code: `QRO-${String(i).padStart(3, "0")}`,
            status: "unassigned",
            product_id: null,
          });
        }
        const { error: tagError } = await supabase.from("qr_tags").insert(newTags);
        if (tagError) {
          // タグ生成失敗はログのみ（サインアップ自体は成功させる）
          console.error("Auto tag generation error:", tagError);
        }
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
    setStorePlan("free");
    setStoreMaxSku(10);
    setStoreBonusSku(0);
    setSubscriptionStatus(null);
    setError(null);
  };

  // ★ Step 6 追加：店舗名を更新
  const updateStoreName = async (newName) => {
    if (!supabase || !storeId) return { error: "未接続" };
    const trimmed = newName.trim();
    if (!trimmed) return { error: "店舗名を入力してください" };

    const { error: updateError } = await supabase
      .from("stores")
      .update({ store_name: trimmed })
      .eq("id", storeId);

    if (updateError) {
      return { error: updateError.message };
    }
    setStoreName(trimmed);
    return { success: true };
  };

  // ★ Step 6 追加：パスワード変更
  const updatePassword = async (newPassword) => {
    if (!supabase) return { error: "Supabase未接続" };
    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (pwError) {
      return { error: pwError.message };
    }
    return { success: true };
  };

  // ★ Step 6 追加：パスワードリセットメール送信
  const resetPassword = async (email) => {
    if (!supabase) return { error: "Supabase未接続" };
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (resetError) {
      return { error: resetError.message };
    }
    return { success: true };
  };

  // ★ Step 6 追加：store情報を再取得
  const refreshStore = async () => {
    if (user) {
      await resolveStore(user);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      storeId,
      storeName,
      storePlan,
      storeMaxSku,
      storeBonusSku,
      subscriptionStatus,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      // ★ Step 6 追加
      updateStoreName,
      updatePassword,
      resetPassword,
      refreshStore,
      isPasswordRecovery,
      clearPasswordRecovery: () => setIsPasswordRecovery(false),
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
