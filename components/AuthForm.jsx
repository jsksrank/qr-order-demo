"use client";
import { useState, useEffect } from "react";
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

const inputBaseStyle = {
  width: "100%", padding: "12px 14px", fontSize: 15,
  border: `1.5px solid ${C.border}`, borderRadius: 10,
  outline: "none", boxSizing: "border-box",
};

function InputField({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

{/* ★ パスワード入力コンポーネント（表示トグル付き） */}
function PasswordInput({ value, onChange, placeholder, autoComplete, onKeyDown }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ ...inputBaseStyle, paddingRight: 44 }}
        onFocus={(e) => (e.target.style.borderColor = C.primary)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          padding: 6, fontSize: 18, color: C.textMuted, lineHeight: 1,
        }}
        tabIndex={-1}
        aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

export default function AuthForm() {
  const { signIn, signUp, resetPassword, error: authError } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // ★ パスワード確認用
  const [shopName, setShopName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false); // ★ 確認メール送信完了
  const [addressLoading, setAddressLoading] = useState(false);
  // ★ 紹介コード（URLパラメータからの自動読み込みのみ）
  const [referrerCode, setReferrerCode] = useState("");
  const [referralFromUrl, setReferralFromUrl] = useState(false);

  const displayError = localError || authError;

  // ★ URLパラメータ ?ref=XXXX から紹介コードを自動読み込み
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref");
      if (refCode) {
        setReferrerCode(refCode.toUpperCase());
        setReferralFromUrl(true);
      }
    }
  }, []);

  // 郵便番号から住所を自動入力（zipcloud API）
  const lookupAddress = async (code) => {
    const cleaned = code.replace(/[^0-9]/g, "");
    if (cleaned.length !== 7) return;
    setAddressLoading(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
      const data = await res.json();
      if (data.results && data.results[0]) {
        const r = data.results[0];
        setAddress(`${r.address1}${r.address2}${r.address3}`);
      }
    } catch (e) {
      // 無視：手入力で対応
    }
    setAddressLoading(false);
  };

  const handlePostalCodeChange = (val) => {
    // ハイフン自動挿入
    let cleaned = val.replace(/[^0-9]/g, "");
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + "-" + cleaned.slice(3, 7);
    }
    setPostalCode(cleaned);
    // 7桁入力で自動検索
    if (cleaned.replace("-", "").length === 7) {
      lookupAddress(cleaned);
    }
  };

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

    // ★ 新規登録時：パスワード一致チェック
    if (mode === "signup") {
      if (password !== passwordConfirm) {
        setLocalError("パスワードが一致しません。もう一度入力してください");
        return;
      }
      if (!shopName.trim()) {
        setLocalError("店舗名を入力してください");
        return;
      }
      if (!postalCode.trim() || postalCode.replace(/[^0-9]/g, "").length !== 7) {
        setLocalError("正しい郵便番号を入力してください");
        return;
      }
      if (!address.trim()) {
        setLocalError("住所を入力してください");
        return;
      }
      if (!phone.trim()) {
        setLocalError("電話番号を入力してください");
        return;
      }
    }

    setLoading(true);
    if (mode === "login") {
      await signIn(email.trim(), password);
    } else {
      // ★ 第5引数に紹介コードを渡す（URLパラメータから自動取得済み）
      const result = await signUp(email.trim(), password, shopName.trim(), {
        postalCode: postalCode.trim(),
        address: address.trim(),
        phone: phone.trim(),
      }, referrerCode.trim());

      // ★ Confirm email ONの場合、サインアップ成功後に確認メール案内を表示
      // signUpがエラーを返さなければ成功とみなす
      if (!result?.error) {
        setSignupSent(true);
      }
    }
    setLoading(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError(null);
    setResetSent(false);
    setSignupSent(false);
    setPasswordConfirm(""); // ★ モード切替時に確認パスワードをクリア
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>在庫番</h1>
        {/* ★ 変更：「美容室向け発注管理」→「在庫管理システム」 */}
        <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>在庫管理システム</p>
      </div>

      {/* ★ 紹介コード経由の場合のバナー */}
      {mode === "signup" && referralFromUrl && referrerCode && !signupSent && (
        <div style={{
          padding: "10px 14px", background: "#f0fdf4", borderRadius: 12,
          border: "1px solid #bbf7d0", marginBottom: 16, textAlign: "center",
        }}>
          <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
            🎉 紹介コード「{referrerCode}」が適用されています（月額¥500 OFF）
          </span>
        </div>
      )}

      {/* カード */}
      <div style={{
        background: C.card, borderRadius: 18, padding: 24,
        border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", textAlign: "center" }}>
          {mode === "login" && "ログイン"}
          {mode === "signup" && !signupSent && "新規登録"}
          {mode === "signup" && signupSent && "確認メールを送信しました"}
          {mode === "reset" && "パスワードをリセット"}
        </h2>

        {/* ★ 新規登録後の確認メール送信完了画面 */}
        {mode === "signup" && signupSent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 8 }}>
              確認メールを送信しました
            </p>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 4 }}>
              <strong>{email}</strong> 宛に確認メールを送信しました。
            </p>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
              メール内のリンクをクリックすると登録が完了します。
            </p>
            <div style={{
              marginTop: 16, padding: "10px 14px", background: C.primaryLight, borderRadius: 8,
              border: `1px solid ${C.border}`,
            }}>
              <p style={{ fontSize: 11, color: C.textSub, margin: 0, lineHeight: 1.6 }}>
                ⚠️ メールが届かない場合は迷惑メールフォルダをご確認ください。
              </p>
            </div>
            <button
              onClick={() => switchMode("login")}
              style={{
                marginTop: 20, padding: "12px 32px", border: "none",
                borderRadius: 10, background: C.primary, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              ログイン画面へ
            </button>
          </div>
        ) : mode === "reset" && resetSent ? (
          /* パスワードリセット完了メッセージ */
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

              {/* ===== 新規登録用フィールド ===== */}
              {mode === "signup" && (
                <>
                  {/* 店舗名 */}
                  <InputField label="店舗名" required>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="例：Hair Salon BLOOM"
                      maxLength={50}
                      style={inputBaseStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.primary)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </InputField>

                  {/* 郵便番号 */}
                  <InputField label="郵便番号（QRタグ送付先）" required>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => handlePostalCodeChange(e.target.value)}
                        placeholder="123-4567"
                        maxLength={8}
                        inputMode="numeric"
                        style={{ ...inputBaseStyle, width: 140, flexShrink: 0 }}
                        onFocus={(e) => (e.target.style.borderColor = C.primary)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      />
                      {addressLoading && (
                        <span style={{ fontSize: 12, color: C.textMuted }}>検索中...</span>
                      )}
                    </div>
                  </InputField>

                  {/* 住所 */}
                  <InputField label="住所" required>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="都道府県 市区町村 番地 建物名"
                      maxLength={200}
                      style={inputBaseStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.primary)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                    <p style={{ fontSize: 10, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                      ※ QRタグの郵送先になります。建物名・部屋番号まで正確にご記入ください。
                    </p>
                  </InputField>

                  {/* 電話番号 */}
                  <InputField label="電話番号" required>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="090-1234-5678"
                      maxLength={20}
                      inputMode="tel"
                      style={inputBaseStyle}
                      onFocus={(e) => (e.target.style.borderColor = C.primary)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </InputField>

                  {/* 区切り線 */}
                  <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />
                </>
              )}

              {/* メールアドレス */}
              <InputField label="メールアドレス" required={mode === "signup"}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salon@example.com"
                  autoComplete="email"
                  style={inputBaseStyle}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </InputField>

              {/* パスワード（リセットモードでは非表示）★ 表示トグル付き */}
              {mode !== "reset" && (
                <InputField label="パスワード" required={mode === "signup"}>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleSubmit()}
                  />
                </InputField>
              )}

              {/* ★ パスワード確認（新規登録モードのみ） */}
              {mode === "signup" && (
                <InputField label="パスワード（確認）" required>
                  <PasswordInput
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="もう一度入力してください"
                    autoComplete="new-password"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  {/* ★ リアルタイム一致表示 */}
                  {passwordConfirm.length > 0 && (
                    <p style={{
                      fontSize: 11, marginTop: 4,
                      color: password === passwordConfirm ? C.success : C.danger,
                    }}>
                      {password === passwordConfirm ? "✓ パスワードが一致しました" : "✗ パスワードが一致しません"}
                    </p>
                  )}
                </InputField>
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

            {/* 新規登録の注意事項 */}
            {mode === "signup" && (
              <p style={{ fontSize: 10, color: C.textMuted, marginTop: 12, lineHeight: 1.6 }}>
                登録することで<a href="/legal" target="_blank" style={{ color: C.primary }}>運営者情報・販売条件</a>に同意したものとみなします。
              </p>
            )}

            {/* メインボタン */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", marginTop: mode === "signup" ? 12 : 20, padding: "14px",
                border: "none", borderRadius: 12,
                background: loading ? C.textMuted : C.primary,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "処理中..." :
                mode === "login" ? "ログイン" :
                mode === "signup" ? "無料で始める" :
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
          {mode === "login" && null}
          {(mode === "signup" && !signupSent) && (
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
        © 2026 在庫番
      </p>
    </div>
  );
}
