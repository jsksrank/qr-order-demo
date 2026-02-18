"use client";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

const C = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  primaryBorder: "#bfdbfe",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  success: "#059669",
  bg: "#f8fafc",
  card: "#fff",
  border: "#e5e7eb",
  text: "#1a1a2e",
  textSub: "#6b7280",
  textMuted: "#9ca3af",
};

export default function AuthForm() {
  const { signIn, signUp, error: authError, isSupabaseConnected } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async () => {
    setLocalError("");

    // バリデーション
    if (!email.trim() || !password.trim()) {
      setLocalError("メールアドレスとパスワードを入力してください。");
      return;
    }
    if (password.length < 6) {
      setLocalError("パスワードは6文字以上で入力してください。");
      return;
    }
    if (mode === "signup" && !shopName.trim()) {
      setLocalError("店舗名を入力してください。");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const result = await signIn(email, password);
        if (result.error) {
          setLocalError(translateError(result.error));
        }
      } else {
        const result = await signUp(email, password, shopName);
        if (result.error) {
          setLocalError(translateError(result.error));
        } else {
          setSignUpSuccess(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const translateError = (msg) => {
    if (msg.includes("Invalid login")) return "メールアドレスまたはパスワードが正しくありません。";
    if (msg.includes("already registered")) return "このメールアドレスは既に登録されています。";
    if (msg.includes("Email not confirmed")) return "メールアドレスの確認が完了していません。受信箱をご確認ください。";
    if (msg.includes("rate limit")) return "しばらく待ってから再試行してください。";
    return msg;
  };

  if (!isSupabaseConnected) {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
        <h2 style={{ fontSize: 16, color: C.text, marginBottom: 8 }}>セットアップ中</h2>
        <p style={{ fontSize: 13, color: C.textSub, textAlign: "center", lineHeight: 1.6 }}>
          Supabase環境変数が未設定です。<br />
          Vercelの環境変数を確認してください。
        </p>
      </div>
    );
  }

  if (signUpSuccess) {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 16, color: C.text, marginBottom: 8 }}>確認メールを送信しました</h2>
        <p style={{ fontSize: 13, color: C.textSub, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
          {email} に確認メールを送信しました。<br />
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <button onClick={() => { setSignUpSuccess(false); setMode("login"); }} style={{
          padding: "12px 32px", border: `1px solid ${C.border}`, borderRadius: 10,
          background: C.card, color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          ログイン画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ロゴエリア */}
      <div style={{ textAlign: "center", paddingTop: 60, paddingBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏷️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>QRオーダー</h1>
        <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>美容室向け発注管理</p>
      </div>

      {/* フォーム */}
      <div style={{ padding: "0 24px", flex: 1 }}>
        {/* タブ切り替え */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
          {[
            { id: "login", label: "ログイン" },
            { id: "signup", label: "新規登録" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => { setMode(tab.id); setLocalError(""); }} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: 8,
              background: mode === tab.id ? C.card : "transparent",
              color: mode === tab.id ? C.text : C.textSub,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: mode === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* エラー表示 */}
        {(localError || authError) && (
          <div style={{
            padding: "10px 14px", background: C.dangerLight, borderRadius: 8,
            marginBottom: 14, fontSize: 12, color: C.danger, fontWeight: 500,
          }}>
            {localError || authError}
          </div>
        )}

        {/* 入力フィールド */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
                店舗名 <span style={{ color: C.danger }}>*</span>
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="例：Hair Salon BLOOM"
                style={{
                  width: "100%", padding: "11px 14px", border: `1.5px solid ${C.border}`,
                  borderRadius: 10, fontSize: 14, outline: "none", background: C.card,
                  boxSizing: "border-box", color: C.text,
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
              メールアドレス <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="salon@example.com"
              autoComplete="email"
              style={{
                width: "100%", padding: "11px 14px", border: `1.5px solid ${C.border}`,
                borderRadius: 10, fontSize: 14, outline: "none", background: C.card,
                boxSizing: "border-box", color: C.text,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
              パスワード <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{
                width: "100%", padding: "11px 14px", border: `1.5px solid ${C.border}`,
                borderRadius: 10, fontSize: 14, outline: "none", background: C.card,
                boxSizing: "border-box", color: C.text,
              }}
            />
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", border: "none", borderRadius: 12,
            background: loading ? "#94a3b8" : C.primary, color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
            marginTop: 20,
          }}
        >
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウントを作成"}
        </button>

        {/* 補足 */}
        {mode === "signup" && (
          <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            1店舗につき1アカウント。スタッフの方は<br />オーナーからログイン情報を共有してもらってください。
          </p>
        )}
      </div>

      {/* フッター */}
      <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
        <p style={{ fontSize: 10, color: C.textMuted }}>QRオーダー v0.2 — 美容室向け発注管理SaaS</p>
      </div>
    </div>
  );
}
