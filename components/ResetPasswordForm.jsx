"use client";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

const C = {
  primary: "#2563eb",
  danger: "#dc2626",
  success: "#059669",
  bg: "#f8fafc",
  card: "#fff",
  border: "#e5e7eb",
  text: "#1a1a2e",
  textSub: "#6b7280",
  textMuted: "#9ca3af",
};

export default function ResetPasswordForm() {
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (newPw.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    if (newPw !== confirmPw) {
      setError("パスワードが一致しません");
      return;
    }
    setLoading(true);
    const result = await updatePassword(newPw);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  const handleContinue = () => {
    clearPasswordRecovery();
    // page.js の isPasswordRecovery が false になり、通常フローに戻る
    window.location.href = "/";
  };

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>
          新しいパスワードを設定
        </h1>
        <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>QRオーダー</p>
      </div>

      <div style={{
        background: C.card, borderRadius: 18, padding: 24,
        border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
              パスワードを変更しました
            </h2>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>
              新しいパスワードでログインできるようになりました。
            </p>
            <button
              onClick={handleContinue}
              style={{
                width: "100%", padding: "14px", border: "none",
                borderRadius: 12, background: C.primary, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              アプリに進む
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="6文字以上"
                  autoFocus
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: 15,
                    border: `1.5px solid ${C.border}`, borderRadius: 10,
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  パスワード確認
                </label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="もう一度入力"
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
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca",
              }}>
                <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{error}</p>
              </div>
            )}

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
              {loading ? "変更中..." : "パスワードを変更"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
