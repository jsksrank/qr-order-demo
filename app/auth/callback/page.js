"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLからcodeパラメータを取得（PKCE flow）
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code && supabase) {
          // コードをセッションに交換
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Code exchange error:", error);
            setStatus("error");
            return;
          }
        }

        // メインページにリダイレクト（?type=recovery でリカバリーモードを通知）
        window.location.href = "/?type=recovery";
      } catch (e) {
        console.error("Callback error:", e);
        setStatus("error");
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: "#f8fafc", fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />
      {status === "processing" ? (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>認証処理中...</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>認証に失敗しました</p>
          <a href="/" style={{ fontSize: 13, color: "#2563eb", marginTop: 12 }}>トップに戻る</a>
        </>
      )}
    </div>
  );
}
