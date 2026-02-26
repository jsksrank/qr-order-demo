"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

// ★ 紹介コード生成ヘルパー（ZB- + 英大文字数字6桁）
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字(0,O,1,I)を除外
  let code = "ZB-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storePlan, setStorePlan] = useState("free");
  const [storeMaxSku, setStoreMaxSku] = useState(30);
  const [storeBonusSku, setStoreBonusSku] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  // ★ Step 6 追加
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  // ★ 紹介プログラム追加
  const [referralCode, setReferralCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  // ★ S31 課金導線追加
  const [isEarlyBird, setIsEarlyBird] = useState(false);
  const [storeReferredBy, setStoreReferredBy] = useState(null);

  // store_id を auth.uid() から解決
  const resolveStore = useCallback(async (authUser) => {
    if (!supabase || !authUser) return false;
    try {
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("id, store_name, plan, max_sku, bonus_sku, subscription_status, referral_code, referral_count, is_early_bird, referred_by")
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
      setStoreMaxSku(data.max_sku || 30);
      setStoreBonusSku(data.bonus_sku || 0);
      setSubscriptionStatus(data.subscription_status || null);
      setReferralCode(data.referral_code || null);
      setReferralCount(data.referral_count || 0);
      // ★ S31 追加
      setIsEarlyBird(data.is_early_bird || false);
      setStoreReferredBy(data.referred_by || null);
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

  // サインアップ ★ S31: 先着100名判定 + is_early_bird セット
  const signUp = async (email, password, shopName, addressInfo = {}, referrerCode = "") => {
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

      // ★ 紹介コードから紹介元store_idを解決
      let referredByStoreId = null;
      if (referrerCode && referrerCode.trim()) {
        const { data: referrerData } = await supabase
          .from("stores")
          .select("id")
          .eq("referral_code", referrerCode.trim().toUpperCase())
          .single();
        if (referrerData) {
          referredByStoreId = referrerData.id;
        }
      }

      // ★ S31: 先着100名判定（現在の店舗数をカウント）
      let earlyBird = false;
      if (referredByStoreId) {
        // 紹介コードありは無条件でフリーアクセス（early_birdは不要だがフラグは立てない）
        earlyBird = false;
      } else {
        const { count: storeCount, error: countError } = await supabase
          .from("stores")
          .select("*", { count: "exact", head: true });
        if (!countError && (storeCount || 0) < 100) {
          earlyBird = true;
        }
      }

      // ★ 新規ストアの紹介コードを生成
      const newReferralCode = generateReferralCode();

      // stores テーブルに1行追加
      const { data: storeData, error: storeError } = await supabase.from("stores").insert({
        owner_auth_id: authUser.id,
        email: email,
        store_name: shopName || "マイサロン",
        plan: "free",
        max_sku: 30,
        postal_code: addressInfo.postalCode || null,
        address: addressInfo.address || null,
        phone: addressInfo.phone || null,
        referral_code: newReferralCode,
        referred_by: referredByStoreId,
        is_early_bird: earlyBird,
      }).select("id").single();

      if (storeError) {
        console.error("Store creation error:", storeError);
        // ★ referral_code の重複衝突時はリトライ（極めて稀）
        if (storeError.message.includes("referral_code")) {
          const retryCode = generateReferralCode();
          const { data: retryData, error: retryError } = await supabase.from("stores").insert({
            owner_auth_id: authUser.id,
            email: email,
            store_name: shopName || "マイサロン",
            plan: "free",
            max_sku: 30,
            postal_code: addressInfo.postalCode || null,
            address: addressInfo.address || null,
            phone: addressInfo.phone || null,
            referral_code: retryCode,
            referred_by: referredByStoreId,
            is_early_bird: earlyBird,
          }).select("id").single();
          if (retryError) {
            setError("店舗の作成に失敗しました: " + retryError.message);
            return { error: retryError.message };
          }
          Object.assign(storeData || {}, retryData);
        } else {
          setError("店舗の作成に失敗しました: " + storeError.message);
          return { error: storeError.message };
        }
      }

      // ★ 紹介元のreferral_countをインクリメント
      if (referredByStoreId) {
        const { data: referrerStore } = await supabase
          .from("stores")
          .select("referral_count")
          .eq("id", referredByStoreId)
          .single();
        if (referrerStore) {
          await supabase
            .from("stores")
            .update({ referral_count: (referrerStore.referral_count || 0) + 1 })
            .eq("id", referredByStoreId);
        }
      }

      // ★ 無料プラン36枚のQRタグを自動生成
      const effectiveStoreId = storeData?.id;
      if (effectiveStoreId) {
        const FREE_TAG_COUNT = 36;
        const newTags = [];
        for (let i = 1; i <= FREE_TAG_COUNT; i++) {
          newTags.push({
            store_id: effectiveStoreId,
            tag_code: `QRO-${String(i).padStart(3, "0")}`,
            status: "unassigned",
            product_id: null,
          });
        }
        const { error: tagError } = await supabase.from("qr_tags").insert(newTags);
        if (tagError) {
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

  // ログイン
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
    setStoreMaxSku(30);
    setStoreBonusSku(0);
    setSubscriptionStatus(null);
    setReferralCode(null);
    setReferralCount(0);
    setIsEarlyBird(false);
    setStoreReferredBy(null);
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
      // ★ 紹介プログラム追加
      referralCode,
      referralCount,
      // ★ S31 課金導線追加
      isEarlyBird,
      storeReferredBy,
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
