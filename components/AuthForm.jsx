"use client";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

const C = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  danger: "#dc2626",
  success: "#059669",
  bg: "#f8fafc",
  card: "#fff",
  border: "#e5e7eb",
  text: "#1a1a2e",
  textSub: "#6b7280",
  textMuted: "#9ca3af",
};

export default function AuthForm() {
  const { signIn, signUp, resetPassword, error: authError } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const displayError = localError || authError;

  const handleSubmit = async () => {
    setLocalError(null);

    // --- パスワードリセット ---
    if (mode === "reset") {
      if (!email.trim()) {
        setLocalError("メールアドレスを入力してください");
        return;
      }
      setLoading(true);
      const result = await resetPassword(email.trim());
      setLoading(false);
      if (result?.error) {
        setLocalError(result.error);
      } else {
        setResetSent(true);
      }
      return;
    }

    // --- ログイン / 新規登録 ---
    if (!email.trim() || !password.trim()) {
      setLocalError("メールアドレスとパスワードを入力してください");
      return;
    }
    if (password.length < 6) {
      setLocalError("パスワードは6文字以上にしてください");
      return;
    }
    if (mode === "signup" && !shopName.trim()) {
      setLocalError("店舗名を入力してください");
      return;
    }

    setLoading(true);
    if (mode === "login") {
      await signIn(email.trim(), password);
    } else {
      await signUp(email.trim(), password, shopName.trim());
    }
    setLoading(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError(null);
    setResetSent(false);
  };

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ロゴ */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏷️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>QRオーダー</h1>
        <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>美容室向け発注管理</p>
      </div>

      {/* カード */}
      <div style={{
        background: C.card, borderRadius: 18, padding: 24,
        border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", textAlign: "center" }}>
          {mode === "login" && "ログイン"}
          {mode === "signup" && "新規登録"}
          {mode === "reset" && "パスワードをリセット"}
        </h2>

        {/* パスワードリセット完了メッセージ */}
        {mode === "reset" && resetSent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 8 }}>
              リセットメールを送信しました
            </p>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
              <strong>{email}</strong> にパスワードリセットのリンクを送信しました。
              メールを確認してリンクをクリックしてください。
            </p>
            <button
              onClick={() => switchMode("login")}
              style={{
                marginTop: 20, padding: "12px 32px", border: "none",
                borderRadius: 10, background: C.primary, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              ログイン画面に戻る
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* 店舗名（新規登録のみ） */}
              {mode === "signup" && (
                <div>
                  <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>
                    店舗名
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="例：Hair Salon BLOOM"
                    maxLength={50}
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 15,
                      border: `1.5px solid ${C.border}`, borderRadius: 10,
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.primary)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              )}

              {/* メールアドレス */}
              <div>
                <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salon@example.com"
                  autoComplete="email"
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: 15,
                    border: `1.5px solid ${C.border}`, borderRadius: 10,
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* パスワード（リセットモードでは非表示） */}
              {mode !== "reset" && (
                <div>
                  <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>
                    パスワード
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 15,
                      border: `1.5px solid ${C.border}`, borderRadius: 10,
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.primary)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              )}
            </div>

            {/* エラー表示 */}
            {displayError && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca",
              }}>
                <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{displayError}</p>
              </div>
            )}

            {/* メインボタン */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", marginTop: 20, padding: "14px",
                border: "none", borderRadius: 12,
                background: loading ? C.textMuted : C.primary,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "処理中..." :
                mode === "login" ? "ログイン" :
                mode === "signup" ? "新規登録" :
                "リセットメールを送信"
              }
            </button>

            {/* パスワード忘れ（ログインモードのみ） */}
            {mode === "login" && (
              <button
                onClick={() => switchMode("reset")}
                style={{
                  width: "100%", marginTop: 8, padding: "8px",
                  border: "none", background: "transparent",
                  color: C.textSub, fontSize: 13, cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                パスワードを忘れた方
              </button>
            )}
          </>
        )}

        {/* モード切替 */}
        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`,
          textAlign: "center",
        }}>
          {mode === "login" && (
            <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>
              アカウントをお持ちでない方{" "}
              <button
                onClick={() => switchMode("signup")}
                style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                新規登録
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>
              アカウントをお持ちの方{" "}
              <button
                onClick={() => switchMode("login")}
                style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                ログイン
              </button>
            </p>
          )}
          {mode === "reset" && !resetSent && (
            <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>
              <button
                onClick={() => switchMode("login")}
                style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                ← ログインに戻る
              </button>
            </p>
          )}
        </div>
      </div>

      {/* フッター */}
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: C.textMuted }}>
        © 2026 QRオーダー
      </p>
    </div>
  );
}
