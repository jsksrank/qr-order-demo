"use client";
import { AuthProvider, useAuth } from "../lib/auth-context";
import AuthForm from "../components/AuthForm";
import SalonMock from "../components/SalonMock";

function AppContent() {
  const { isAuthenticated, loading, isSupabaseConnected } = useAuth();

  // ローディング中
  if (loading) {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: "#f8fafc", fontFamily: "'Noto Sans JP', system-ui, sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
        <p style={{ fontSize: 13, color: "#6b7280" }}>読み込み中...</p>
      </div>
    );
  }

  // 未認証 → ログイン画面
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // 認証済み → メインアプリ
  return <SalonMock />;
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
