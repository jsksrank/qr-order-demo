"use client";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";

// カラートークン（SalonMock.jsx の C と同じ）
const C = {
  primary: "#2563eb", primaryLight: "#eff6ff", primaryBorder: "#bfdbfe",
  danger: "#dc2626", dangerLight: "#fef2f2", dangerBorder: "#fecaca",
  success: "#059669", successLight: "#f0fdf4", successBorder: "#bbf7d0",
  warn: "#f59e0b", warnLight: "#fefce8", warnBorder: "#fde68a",
  bg: "#f8fafc", card: "#fff", border: "#e5e7eb",
  text: "#1a1a2e", textSub: "#6b7280", textMuted: "#9ca3af",
};

const PLAN_LABELS = {
  free: { name: "無料プラン", color: C.textSub, bg: "#f3f4f6" },
  entry: { name: "エントリー", color: "#059669", bg: "#f0fdf4" },
  light: { name: "ライト", color: "#7c3aed", bg: "#f5f3ff" },
  standard: { name: "スタンダード", color: C.primary, bg: C.primaryLight },
  pro: { name: "プロ", color: "#d97706", bg: "#fffbeb" },
};

// --- セクションカード ---
function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8, padding: "0 4px", letterSpacing: 0.5 }}>
          {title}
        </div>
      )}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// --- セクション内の行 ---
function SettingsRow({ icon, label, value, onClick, danger, borderBottom = true }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px",
        borderBottom: borderBottom ? `1px solid ${C.border}` : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: "center" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? C.danger : C.text }}>{label}</div>
        {value && <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{value}</div>}
      </div>
      {onClick && <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>}
    </div>
  );
}

// --- 店舗名編集モーダル ---
function EditStoreNameModal({ currentName, onClose, onSave }) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("店舗名を入力してください"); return; }
    setSaving(true);
    setError(null);
    const result = await onSave(name.trim());
    setSaving(false);
    if (result?.error) { setError(result.error); } else { onClose(); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 18, padding: 24, width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>店舗名を変更</h3>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          maxLength={50} autoFocus
          style={{ width: "100%", padding: "12px 14px", fontSize: 15, border: `1.5px solid ${error ? C.danger : C.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }}
          onFocus={(e) => !error && (e.target.style.borderColor = C.primary)}
          onBlur={(e) => !error && (e.target.style.borderColor = C.border)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        {error && <p style={{ color: C.danger, fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, fontSize: 14, fontWeight: 600, color: C.textSub, cursor: "pointer" }}>キャンセル</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: saving ? C.textMuted : C.primary, fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer" }}>
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- パスワード変更モーダル ---
function ChangePasswordModal({ onClose }) {
  const { updatePassword } = useAuth();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (newPw.length < 6) { setError("パスワードは6文字以上にしてください"); return; }
    if (newPw !== confirmPw) { setError("パスワードが一致しません"); return; }
    setSaving(true);
    const result = await updatePassword(newPw);
    setSaving(false);
    if (result?.error) { setError(result.error); } else { setSuccess(true); setTimeout(() => onClose(), 1500); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 18, padding: 24, width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>パスワードを変更</h3>
        {success ? (
          <div style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <p style={{ fontSize: 14, color: C.success, fontWeight: 600 }}>パスワードを変更しました</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>新しいパスワード</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="6文字以上" autoFocus
                  style={{ width: "100%", padding: "12px 14px", fontSize: 15, border: `1.5px solid ${C.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textSub, fontWeight: 600, display: "block", marginBottom: 4 }}>パスワード確認</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="もう一度入力"
                  style={{ width: "100%", padding: "12px 14px", fontSize: 15, border: `1.5px solid ${C.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()} />
              </div>
            </div>
            {error && <p style={{ color: C.danger, fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "12px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, fontSize: 14, fontWeight: 600, color: C.textSub, cursor: "pointer" }}>キャンセル</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: saving ? C.textMuted : C.primary, fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer" }}>
                {saving ? "変更中..." : "変更する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- ログアウト確認モーダル ---
function LogoutConfirmModal({ onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => { setLoading(true); await onConfirm(); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 18, padding: 24, width: "100%", maxWidth: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>ログアウトしますか？</h3>
        <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 20px" }}>再度ログインするにはメールアドレスとパスワードが必要です</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, fontSize: 14, fontWeight: 600, color: C.textSub, cursor: "pointer" }}>キャンセル</button>
          <button onClick={handleLogout} disabled={loading} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: loading ? C.textMuted : C.danger, fontSize: 14, fontWeight: 600, color: "#fff", cursor: loading ? "default" : "pointer" }}>
            {loading ? "処理中..." : "ログアウト"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ★ 紹介プログラムカード（S41: コードコピー→リンクコピーに変更）
function ReferralCard({ referralCode, referralCount }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/app?ref=${referralCode}`
    : "";

  const qrImageUrl = referralUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralUrl)}`
    : "";

  const discount = referralCount * 500;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "在庫番 - 紹介プログラム",
          text: `在庫番を使ってみませんか？このリンクから登録すると有料プランが永久¥500 OFF！`,
          url: referralUrl,
        });
        return;
      } catch {}
    }
    await copyLink();
  };

  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: 18,
      border: `1px solid ${C.border}`, marginBottom: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 12, letterSpacing: 0.5 }}>
        🎁 紹介プログラム
      </div>

      {/* ★S41: 紹介コード表示（コピーボタンはリンクコピーに変更） */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px", background: C.bg, borderRadius: 10,
        border: `1px dashed ${C.border}`, marginBottom: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>あなたの紹介コード</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, letterSpacing: 2, fontFamily: "monospace" }}>
            {referralCode || "---"}
          </div>
        </div>
        <button
          onClick={copyLink}
          style={{
            padding: "8px 14px", border: `1px solid ${copiedLink ? C.successBorder : C.primaryBorder}`,
            borderRadius: 8, background: copiedLink ? C.successLight : C.primaryLight,
            color: copiedLink ? C.success : C.primary,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {copiedLink ? "✅ コピー済" : "🔗 リンクコピー"}
        </button>
      </div>

      {/* 紹介リンク共有ボタン */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          onClick={shareLink}
          style={{
            flex: 1, padding: "12px", border: "none", borderRadius: 10,
            background: C.primary, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          📤 リンクを共有
        </button>
        <button
          onClick={() => setShowQr(!showQr)}
          style={{
            padding: "12px 16px", border: `1.5px solid ${showQr ? C.primary : C.border}`,
            borderRadius: 10, background: showQr ? C.primaryLight : C.card,
            color: showQr ? C.primary : C.textSub,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {showQr ? "✕ 閉じる" : "QR表示"}
        </button>
      </div>

      {/* QRコード表示 */}
      {showQr && (
        <div style={{
          padding: 20, background: "#fff", borderRadius: 12,
          border: `1px solid ${C.border}`, marginBottom: 14,
          textAlign: "center",
        }}>
          <img
            src={qrImageUrl}
            alt="紹介QRコード"
            style={{ width: 180, height: 180, marginBottom: 8 }}
          />
          <p style={{ fontSize: 11, color: C.textSub, margin: 0, lineHeight: 1.5 }}>
            相手のスマホカメラで読み取ると<br />紹介コード付きで登録画面が開きます
          </p>
        </div>
      )}

      {/* 紹介実績 */}
      <div style={{
        display: "flex", justifyContent: "space-around",
        padding: "12px 0", borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{referralCount}</div>
          <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>紹介人数</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: discount > 0 ? C.success : C.textMuted }}>
            ¥{discount.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>月額割引</div>
        </div>
      </div>

      {/* 説明 */}
      <div style={{
        marginTop: 10, padding: "10px 12px", background: C.warnLight,
        borderRadius: 8, border: `1px solid ${C.warnBorder}`,
      }}>
        <p style={{ fontSize: 11, color: C.text, margin: 0, lineHeight: 1.7 }}>
          <strong>仕組み：</strong>1人紹介するごとに月額¥500 OFF（永久適用）。
          紹介された方も全プラン永久¥500 OFF。
          例：ライトプランで6人紹介すると実質無料！
        </p>
      </div>
    </div>
  );
}

// ========================================
// メイン：SettingsScreen
// ========================================
export default function SettingsScreen({ activeProductCount, onShowPricing }) {
  const {
    user, storeName, storePlan, storeMaxSku, storeBonusSku, subscriptionStatus,
    signOut, updateStoreName,
    referralCode, referralCount, isEarlyBird,
  } = useAuth();

  const [showEditName, setShowEditName] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const planInfo = PLAN_LABELS[storePlan] || PLAN_LABELS.free;
  // ★ Early Bird の free ユーザーは「エントリー（先着無料）」と表示
  const planDisplayName = (storePlan === "free" && isEarlyBird) ? "エントリー（先着無料）" : planInfo.name;
  const planDisplayColor = (storePlan === "free" && isEarlyBird) ? "#059669" : planInfo.color;
  const planDisplayBg = (storePlan === "free" && isEarlyBird) ? "#f0fdf4" : planInfo.bg;

  const totalSku = (storeMaxSku || 10) + (storeBonusSku || 0);
  const skuUsage = activeProductCount || 0;

  const hasSubscriptionHistory = subscriptionStatus && subscriptionStatus !== "canceled";

  const handleOpenPortal = async () => {
    if (!hasSubscriptionHistory && onShowPricing) {
      onShowPricing();
      return;
    }

    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "ポータルを開けませんでした");
      }
    } catch (e) {
      alert("エラーが発生しました");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 20px" }}>

      {/* プロフィールカード */}
      <div style={{
        background: C.card, borderRadius: 18, padding: 20,
        border: `1px solid ${C.border}`, marginBottom: 20, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32,
          background: planDisplayBg, border: `2px solid ${planDisplayColor}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", fontSize: 28,
        }}>💇</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{storeName || "マイサロン"}</h2>
        <p style={{ fontSize: 12, color: C.textSub, margin: "0 0 12px" }}>{user?.email || ""}</p>
        <span style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 20,
          fontSize: 12, fontWeight: 700, color: planDisplayColor, background: planDisplayBg,
        }}>{planDisplayName}</span>
      </div>

      {/* 商品数 使用状況 */}
      <div style={{
        background: C.card, borderRadius: 14, padding: 16,
        border: `1px solid ${C.border}`, marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>商品数</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: skuUsage >= totalSku ? C.danger : C.primary }}>
            {skuUsage} / {totalSku >= 99999 ? "∞" : totalSku}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: totalSku >= 99999 ? "10%" : `${Math.min(100, (skuUsage / totalSku) * 100)}%`,
            background: skuUsage >= totalSku ? C.danger : C.primary,
            transition: "width 0.3s ease",
          }} />
        </div>
        {skuUsage >= totalSku && (
          <p style={{ fontSize: 11, color: C.danger, marginTop: 6, fontWeight: 600 }}>
            上限に達しています。プランをアップグレードしてください。
          </p>
        )}
      </div>

      {/* ★ 紹介プログラム */}
      <ReferralCard referralCode={referralCode} referralCount={referralCount} />

      {/* 店舗設定 */}
      <SettingsSection title="店舗設定">
        <SettingsRow icon="🏪" label="店舗名" value={storeName || "マイサロン"} onClick={() => setShowEditName(true)} />
        <SettingsRow icon="✉️" label="メールアドレス" value={user?.email || ""} borderBottom={false} />
      </SettingsSection>

      {/* アカウント */}
      <SettingsSection title="アカウント">
        <SettingsRow icon="🔑" label="パスワードを変更" onClick={() => setShowChangePw(true)} />
        <SettingsRow icon="💳" label="プラン・お支払い管理"
          value={hasSubscriptionHistory ? "Stripeで管理" : "プランを選択"}
          onClick={handleOpenPortal} borderBottom={false} />
      </SettingsSection>

      {/* ログアウト */}
      <div style={{ marginTop: 8 }}>
        <SettingsSection>
          <SettingsRow icon="🚪" label="ログアウト" danger onClick={() => setShowLogout(true)} borderBottom={false} />
        </SettingsSection>
      </div>

      <div style={{ textAlign: "center", marginTop: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: C.textMuted }}>在庫番 v0.1.0</p>
      </div>

      {/* モーダル */}
      {showEditName && <EditStoreNameModal currentName={storeName} onClose={() => setShowEditName(false)} onSave={updateStoreName} />}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      {showLogout && <LogoutConfirmModal onClose={() => setShowLogout(false)} onConfirm={signOut} />}
    </div>
  );
}
