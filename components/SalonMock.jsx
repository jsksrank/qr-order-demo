"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import dynamic from "next/dynamic";
import PricingModal from "./PricingModal";
import SettingsScreen from "./SettingsScreen";
import TagManagementScreen from "./TagManagementScreen";

const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

// ——— Constants ———
const CATEGORIES = ["カラー剤", "2剤", "パーマ剤", "トリートメント", "シャンプー", "スタイリング", "その他"];
const LOCATIONS = ["棚A上段", "棚A中段", "棚A下段", "棚B", "棚C", "ワゴン", "バックヤード"];

// ——— Color Tokens ———
const C = {
  primary: "#2563eb", primaryLight: "#eff6ff", primaryBorder: "#bfdbfe",
  danger: "#dc2626", dangerLight: "#fef2f2", dangerBorder: "#fecaca",
  success: "#059669", successLight: "#f0fdf4", successBorder: "#bbf7d0", successDark: "#166534",
  line: "#06c755",
  warn: "#f59e0b", warnLight: "#fefce8", warnBorder: "#fde68a", warnDark: "#92400e",
  bg: "#f8fafc", card: "#fff", border: "#e5e7eb",
  text: "#1a1a2e", textSub: "#6b7280", textMuted: "#9ca3af",
};

// ——— DB ↔ JS field mapping ———
const dbToJs = (row) => ({
  id: row.id, name: row.name, category: row.category, location: row.location,
  manufacturer: row.manufacturer, janCode: row.jan_code,
  defaultOrderQty: row.default_order_qty, reorderPoint: row.reorder_point, isActive: row.is_active,
});

const jsToDb = (item, storeId) => ({
  store_id: storeId, name: item.name, category: item.category, location: item.location,
  manufacturer: item.manufacturer || "", jan_code: item.janCode || null,
  default_order_qty: item.defaultOrderQty || 1, reorder_point: item.reorderPoint || null,
  is_active: item.isActive !== false,
});

const orderItemFromDb = (row) => ({
  id: row.id, productId: row.product_id, name: row.products?.name || "不明な商品",
  category: row.products?.category || "", location: row.products?.location || "",
  quantity: row.quantity, status: row.status,
  scannedAt: row.scanned_at ? formatDate(row.scanned_at) : "",
  orderedAt: row.ordered_at ? formatShortDate(row.ordered_at) : "",
  receivedAt: row.received_at, checked: false,
});

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function formatShortDate(isoStr) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ——— Shared Components ———
function Badge({ count, color }) {
  if (!count) return null;
  return (
    <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: color, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, flexShrink: 0, padding: "0 6px",
    }}>{count}</span>
  );
}

function QuantityStepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0,
      border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", background: C.card, flexShrink: 0,
    }}>
      <button onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}
        style={{ width: 36, height: 36, border: "none", background: "transparent",
          fontSize: 18, fontWeight: 700, color: value <= min ? C.textMuted : C.primary,
          cursor: value <= min ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>−</button>
      <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700, color: C.text,
        borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
      }}>{value}</div>
      <button onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
        style={{ width: 36, height: 36, border: "none", background: "transparent",
          fontSize: 18, fontWeight: 700, color: value >= max ? C.textMuted : C.primary,
          cursor: value >= max ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>+</button>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div style={{ padding: 32, textAlign: "center", color: C.textSub, fontSize: 14, background: C.bg, borderRadius: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      {message}
    </div>
  );
}

// ======================================================================
// ★ S31: TrialGateModal（101人目以降・紹介なし用のブロッキングモーダル）
// ======================================================================
function TrialGateModal({ onStartTrial, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px 24px", maxWidth: 380, width: "100%",
        textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🏷️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>
          在庫番を始めましょう
        </h2>
        <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, margin: "0 0 24px" }}>
          30日間無料でお試しいただけます
        </p>

        <div style={{
          background: C.bg, borderRadius: 14, padding: 16, marginBottom: 20,
          textAlign: "left",
        }}>
          {[
            "商品30点まで管理",
            "QRスキャン・発注リスト",
            "LINEで発注送信",
            "物理QRタグを郵送",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
              <span style={{ color: C.success, fontSize: 14, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 13, color: C.text }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{
          padding: "12px 16px", background: C.primaryLight, borderRadius: 12,
          marginBottom: 20, border: `1px solid ${C.primaryBorder}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>¥0</div>
          <div style={{ fontSize: 12, color: C.textSub }}>30日間無料 → 月額¥500（税込）</div>
        </div>

        <button
          onClick={onStartTrial}
          disabled={loading}
          style={{
            width: "100%", padding: "16px", border: "none", borderRadius: 14,
            background: loading ? C.textMuted : C.primary,
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(37,99,235,0.3)",
          }}
        >
          {loading ? "処理中..." : "30日間無料で始める"}
        </button>

        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 14, lineHeight: 1.6 }}>
          クレジットカードの登録が必要です。<br/>
          30日以内に解約すれば料金は発生しません。
        </p>
      </div>
    </div>
  );
}

// ======================================================================
// OverLimitBanner
// ======================================================================
function OverLimitBanner({ activeCount, skuLimit, onUpgrade }) {
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{
        padding: 24, background: C.warnLight, borderRadius: 14,
        border: `1.5px solid ${C.warnBorder}`, textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.warnDark, marginBottom: 8 }}>
          プラン上限を超えています
        </div>
        <div style={{ fontSize: 13, color: C.warnDark, lineHeight: 1.6, marginBottom: 6 }}>
          登録商品 <strong>{activeCount}品</strong> ／ 上限 <strong>{skuLimit}品</strong>
        </div>
        <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, marginBottom: 16 }}>
          この機能を使うには、商品を削除して上限以下にするか、プランをアップグレードしてください。
        </div>
        <button onClick={onUpgrade} style={{
          padding: "14px 32px", border: "none", borderRadius: 12,
          background: C.primary, color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>
          プランをアップグレード
        </button>
      </div>
    </div>
  );
}

// ======================================================================
// Top Screen
// ======================================================================
function TopScreen({ onNavigate, orderCount, receiveCount, productCount, tagCount, stockoutCount }) {
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🏷️</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>在庫番</h2>
        <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>在庫管理システム</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { id: "scan", icon: "📷", label: "QRスキャン", desc: "タグを読み取って発注リストに追加", color: C.primary },
          { id: "order", icon: "📋", label: "発注リスト", desc: "未発注の商品を確認・発注処理", color: C.danger, badge: orderCount },
          { id: "receive", icon: "📦", label: "受取待ち", desc: "届いた商品のタグをスキャンして完了", color: C.success, badge: receiveCount },
        ].map((btn) => (
          <button key={btn.id} onClick={() => onNavigate(btn.id)} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
            background: C.card, border: `1.5px solid ${btn.color}18`, borderRadius: 14,
            cursor: "pointer", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <span style={{ fontSize: 30, flexShrink: 0 }}>{btn.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{btn.label}</div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{btn.desc}</div>
            </div>
            <Badge count={btn.badge} color={btn.color} />
          </button>
        ))}
      </div>

      <button onClick={() => onNavigate("stockout")} style={{
        width: "100%", marginTop: 16, padding: "14px 18px",
        background: C.card, border: `1.5px solid ${C.danger}30`, borderRadius: 14,
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: 28 }}>🚨</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>欠品報告</div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>在庫切れの商品を記録 → 発注点を自動補正</div>
        </div>
        {stockoutCount > 0 && <Badge count={stockoutCount} color={C.danger} />}
        <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
      </button>

      <button onClick={() => onNavigate("products")} style={{
        width: "100%", marginTop: 10, padding: "14px 18px",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: 28 }}>⚙️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>商品管理</div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>商品の登録・編集・QRタグ紐付け</div>
        </div>
        <div style={{ fontSize: 13, color: C.textSub }}>{productCount}品</div>
        <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
      </button>

      <button onClick={() => onNavigate("tags")} style={{
        width: "100%", marginTop: 10, padding: "14px 18px",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: 28 }}>🏷️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>タグ管理</div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>QRタグの紐付け管理</div>
        </div>
        <div style={{ fontSize: 13, color: C.textSub }}>{tagCount}枚</div>
        <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
      </button>

      <button onClick={() => onNavigate("settings")} style={{
        width: "100%", marginTop: 10, padding: "14px 18px",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: 28 }}>👤</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>設定</div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>店舗情報・プラン・アカウント</div>
        </div>
        <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
      </button>

      <div style={{ marginTop: 20, padding: 14, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>サマリー</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[
            { label: "未発注", value: `${orderCount}件`, color: C.primary },
            { label: "管理SKU", value: `${productCount}品`, color: C.success },
            { label: "受取待ち", value: `${receiveCount}件`, color: C.danger },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// Scan Screen ★ S37: デモ削除＋スキャン順序を新しいもの上に
// ======================================================================
function ScanScreen({ onNavigate, products, onAddOrderItem, storeId, isOverLimit, skuLimit, activeCount, onShowPricing }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanned, setScanned] = useState([]);
  const [scanResult, setScanResult] = useState(null);

  if (isOverLimit) {
    return <OverLimitBanner activeCount={activeCount} skuLimit={skuLimit} onUpgrade={onShowPricing} />;
  }

  const handleQrScan = async (decodedText, format) => {
    if (supabase && storeId) {
      const { data: tag } = await supabase
        .from("qr_tags")
        .select("id, tag_code, product_id, status")
        .eq("tag_code", decodedText)
        .eq("store_id", storeId)
        .maybeSingle();

      if (tag) {
        if (tag.status === "removed") {
          setScanResult({ type: "warning", message: "このタグは既にスキャン済みです" });
          setTimeout(() => setScanResult(null), 2500);
          return;
        }

        const product = products.find((p) => p.id === tag.product_id);
        if (product) {
          await onAddOrderItem(product);
          await supabase.from("qr_tags").update({ status: "removed" }).eq("id", tag.id);
          const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
          {/* ★ S37: 新しいスキャンを先頭に追加 */}
          setScanned((prev) => [{ name: product.name, category: product.category, location: product.location, time }, ...prev]);
          setScanResult({ type: "success", name: product.name, message: "読み取り完了！" });
          setTimeout(() => setScanResult(null), 2000);
          return;
        }
      }
    }
    setScanResult({ type: "error", name: decodedText, message: "未登録のQRタグです。商品管理でタグを紐付けてください。" });
    setTimeout(() => setScanResult(null), 4000);
  };

  return (
    <div style={{ padding: "0 20px" }}>
      {cameraActive ? (
        <div style={{ marginBottom: 14 }}>
          <QrScanner mode="qr" active={cameraActive} onScan={handleQrScan} />
        </div>
      ) : (
        <div style={{
          width: "100%", aspectRatio: "1", maxHeight: 260,
          background: "#111827", borderRadius: 16,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden", marginBottom: 14, position: "relative",
        }}>
          {scanResult ? (
            <div style={{ textAlign: "center", padding: "0 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 6 }}>
                {scanResult.type === "success" ? "✅" : scanResult.type === "warning" ? "⚠️" : "❌"}
              </div>
              <p style={{ color: scanResult.type === "success" ? "#4ade80" : scanResult.type === "warning" ? "#fbbf24" : "#f87171", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{scanResult.message}</p>
              {scanResult.name && <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>{scanResult.name}</p>}
            </div>
          ) : (
            <>
              <div style={{ width: 170, height: 170, border: "2px dashed #4b5563", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>QRをここに合わせる</span>
              </div>
              <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 10 }}>カゴに貯めたタグをまとめてスキャン</p>
            </>
          )}
        </div>
      )}

      {cameraActive && scanResult && (
        <div style={{
          padding: "11px 14px", marginBottom: 12, borderRadius: 10,
          background: scanResult.type === "success" ? "#dcfce7" : scanResult.type === "warning" ? C.warnLight : C.dangerLight,
          border: `1px solid ${scanResult.type === "success" ? "#86efac" : scanResult.type === "warning" ? C.warnBorder : C.dangerBorder}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{scanResult.type === "success" ? "✅" : scanResult.type === "warning" ? "⚠️" : "❌"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: scanResult.type === "success" ? C.successDark : scanResult.type === "warning" ? C.warnDark : C.danger }}>{scanResult.message}</div>
            {scanResult.name && <div style={{ fontSize: 11, color: C.textSub }}>{scanResult.name}</div>}
          </div>
        </div>
      )}

      <button onClick={() => setCameraActive(!cameraActive)} style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: cameraActive ? "#dc2626" : C.primary, color: "#fff",
        fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 18,
      }}>
        {cameraActive ? "⏹ カメラを停止" : "📷 カメラを起動してスキャン"}
      </button>

      {scanned.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>
            今回スキャンした商品（{scanned.length}件）
          </div>
          {scanned.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
              background: C.successLight, borderRadius: 10, marginBottom: 5, border: `1px solid ${C.successBorder}`,
            }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div>
                <div style={{ fontSize: 10, color: C.textSub }}>{item.category} · {item.location}</div>
              </div>
              <div style={{ fontSize: 10, color: C.textSub }}>{item.time}</div>
            </div>
          ))}
          <button onClick={() => onNavigate("order")} style={{
            width: "100%", padding: "13px", border: `1.5px solid ${C.primary}`,
            borderRadius: 12, background: C.primaryLight, color: C.primary,
            fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 10,
          }}>
            📋 発注リストを確認する →
          </button>
        </div>
      )}
    </div>
  );
}

// ======================================================================
// Order Screen ★ S37: 発注取消ボタン追加
// ======================================================================
function OrderScreen({ pendingItems, setPendingItems, onMarkOrdered, onDeleteOrderItem, isOverLimit, skuLimit, activeCount, onShowPricing }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastOrderedCount, setLastOrderedCount] = useState(0);
  const [showLinePopup, setShowLinePopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  if (isOverLimit) {
    return <OverLimitBanner activeCount={activeCount} skuLimit={skuLimit} onUpgrade={onShowPricing} />;
  }

  const checkedCount = pendingItems.filter((i) => i.checked).length;

  const toggleCheck = (id) => {
    setPendingItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  };
  const updateQty = (id, qty) => {
    setPendingItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  {/* ★ S37: 発注取消（order_itemsから削除＋タグを元に戻す） */}
  const handleDelete = async (item) => {
    if (!confirm(`「${item.name}」を発注リストから取り消しますか？`)) return;
    setDeletingId(item.id);
    try {
      await onDeleteOrderItem(item);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOrder = async () => {
    const toOrder = pendingItems.filter((i) => i.checked);
    setLastOrderedCount(toOrder.length);
    await onMarkOrdered(toOrder);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  const generateLineText = () => {
    const lines = pendingItems.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity}個`);
    return `【発注リスト】${new Date().toLocaleDateString("ja-JP")}\n\n${lines.join("\n")}\n\n合計 ${pendingItems.length}品目 / ${pendingItems.reduce((s, i) => s + i.quantity, 0)}個\nよろしくお願いいたします。`;
  };

  return (
    <div style={{ padding: "0 20px" }}>
      {showConfirm && (
        <div style={{ padding: "11px 14px", background: "#dcfce7", borderRadius: 10, border: "1px solid #86efac", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontSize: 13, color: C.successDark, fontWeight: 600 }}>{lastOrderedCount}件を発注処理しました</span>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>未発注</span>
            <span style={{ fontSize: 12, color: C.textSub, marginLeft: 8 }}>{pendingItems.length}件</span>
          </div>
          {pendingItems.length > 0 && (
            <button onClick={() => setPendingItems((prev) => prev.map((i) => ({ ...i, checked: !pendingItems.every((x) => x.checked) })))}
              style={{ fontSize: 11, color: C.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              {pendingItems.every((i) => i.checked) ? "選択解除" : "すべて選択"}
            </button>
          )}
        </div>

        {pendingItems.length === 0 ? (
          <EmptyState icon="🎉" message="未発注の商品はありません" />
        ) : (
          pendingItems.map((item) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: item.checked ? C.primaryLight : C.card, borderRadius: 10, marginBottom: 6,
              border: item.checked ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`, cursor: "pointer",
            }} onClick={() => toggleCheck(item.id)}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: item.checked ? "none" : "2px solid #d1d5db",
                background: item.checked ? C.primary : C.card,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.checked && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{item.category} · {item.location} · {item.scannedAt}</div>
              </div>
              <QuantityStepper value={item.quantity} onChange={(v) => updateQty(item.id, v)} />
              {/* ★ S37: 取消ボタン */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                disabled={deletingId === item.id}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "none",
                  background: C.dangerLight, color: C.danger,
                  fontSize: 14, cursor: deletingId === item.id ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, opacity: deletingId === item.id ? 0.5 : 1,
                }}
                title="取り消す"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <button onClick={handleOrder} disabled={checkedCount === 0} style={{
          width: "100%", padding: "14px", border: "none", borderRadius: 12,
          background: checkedCount > 0 ? C.danger : "#d1d5db", color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: checkedCount > 0 ? "pointer" : "default", marginTop: 10,
        }}>
          ✅ {checkedCount > 0 ? `選択した${checkedCount}件を発注済みにする` : "発注する商品を選択してください"}
        </button>
      </div>

      <button onClick={() => setShowLinePopup(true)} style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: C.line, color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: "pointer", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>💬</span>発注リストを送信
      </button>

      {showLinePopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={() => { setShowLinePopup(false); setCopied(false); }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 28px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>📋 発注リスト送信</h3>
              <button onClick={() => { setShowLinePopup(false); setCopied(false); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textSub }}>✕</button>
            </div>
            <div style={{ padding: 14, background: C.bg, borderRadius: 12, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#333", maxHeight: 200, overflowY: "auto" }}>
              {generateLineText()}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => {
                navigator.clipboard.writeText(generateLineText()).then(() => setCopied(true)).catch(() => {
                  const ta = document.createElement("textarea");
                  ta.value = generateLineText();
                  document.body.appendChild(ta); ta.select(); document.execCommand("copy");
                  document.body.removeChild(ta); setCopied(true);
                });
              }} style={{
                flex: 1, padding: "14px", border: "none", borderRadius: 12,
                background: copied ? C.success : C.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                {copied ? "✅ コピー済み！" : "📋 テキストをコピー"}
              </button>
              <a href={`https://line.me/R/share?text=${encodeURIComponent(generateLineText())}`}
                target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: "14px", border: "none", borderRadius: 12,
                background: C.line, color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", textAlign: "center", textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                💬 LINEで送る
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================================
// Receive Screen ★ S37: タップで受取＋デモ削除
// ======================================================================
function ReceiveScreen({ orderedItems, receivedItems, onMarkReceived, storeId, products }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [lastReceived, setLastReceived] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [receivingId, setReceivingId] = useState(null);

  const handleQrScan = useCallback(async (decodedText, format) => {
    if (supabase && storeId) {
      const { data: tag } = await supabase
        .from("qr_tags").select("id, product_id")
        .eq("tag_code", decodedText).eq("store_id", storeId).maybeSingle();
      if (!tag) { setScanError("未登録のタグです"); setTimeout(() => setScanError(null), 3000); return; }
      const target = orderedItems.find((i) => i.productId === tag.product_id);
      if (!target) { setScanError("この商品の発注データがありません"); setTimeout(() => setScanError(null), 3000); return; }
      await onMarkReceived(target);
      await supabase.from("qr_tags").update({ status: "attached" }).eq("id", tag.id);
      setScanError(null);
      setLastReceived(target.name);
      setTimeout(() => setLastReceived(null), 4000);
    }
  }, [storeId, orderedItems, onMarkReceived]);

  {/* ★ S37: タップで受取完了 */}
  const handleTapReceive = async (item) => {
    setReceivingId(item.id);
    try {
      await onMarkReceived(item);
      {/* タグのステータスも戻す（product_idで検索） */}
      if (supabase && storeId) {
        await supabase.from("qr_tags")
          .update({ status: "attached" })
          .eq("store_id", storeId)
          .eq("product_id", item.productId)
          .eq("status", "removed");
      }
      setLastReceived(item.name);
      setTimeout(() => setLastReceived(null), 3000);
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <div style={{ padding: "0 20px" }}>
      {lastReceived && (
        <div style={{ padding: "11px 14px", background: "#dcfce7", borderRadius: 10, border: "1px solid #86efac", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>📦</span>
          <div>
            <div style={{ fontSize: 13, color: C.successDark, fontWeight: 600 }}>受取完了！</div>
            <div style={{ fontSize: 11, color: C.successDark }}>{lastReceived}</div>
            <div style={{ fontSize: 10, color: "#15803d", marginTop: 2 }}>→ タグを新しい在庫に付け直してください</div>
          </div>
        </div>
      )}
      {scanError && (
        <div style={{ padding: "11px 14px", background: C.dangerLight, borderRadius: 10, border: `1px solid ${C.dangerBorder}`, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>❌</span>
          <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>{scanError}</span>
        </div>
      )}
      {cameraActive && (
        <div style={{ marginBottom: 14 }}>
          <QrScanner mode="qr" active={cameraActive} onScan={handleQrScan} />
        </div>
      )}
      <button onClick={() => setCameraActive(!cameraActive)} disabled={orderedItems.length === 0 && !cameraActive}
        style={{ width: "100%", padding: "14px", border: "none", borderRadius: 12,
          background: cameraActive ? "#dc2626" : orderedItems.length === 0 ? "#d1d5db" : C.success,
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 18,
        }}>
        {cameraActive ? "⏹ カメラを停止" : orderedItems.length === 0 ? "すべて受取済み ✅" : "📷 届いた商品のタグをスキャン"}
      </button>

      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
        受取待ち <span style={{ fontSize: 12, color: C.textSub, fontWeight: 400 }}>{orderedItems.length}件</span>
      </div>
      {/* ★ S37: タップで受取の説明 */}
      {orderedItems.length > 0 && (
        <p style={{ fontSize: 11, color: C.textSub, margin: "0 0 10px", lineHeight: 1.5 }}>
          商品をタップして受取完了にできます
        </p>
      )}
      {orderedItems.length === 0 ? (
        <EmptyState icon="✅" message="すべて受取済みです" />
      ) : (
        orderedItems.map((item) => (
          <button key={item.id}
            onClick={() => receivingId !== item.id && handleTapReceive(item)}
            disabled={receivingId === item.id}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: receivingId === item.id ? C.successLight : C.card,
              borderRadius: 10, marginBottom: 5,
              border: `1px solid ${receivingId === item.id ? C.successBorder : C.border}`,
              cursor: receivingId === item.id ? "default" : "pointer",
              textAlign: "left",
              opacity: receivingId === item.id ? 0.6 : 1,
            }}>
            <span style={{ fontSize: 18 }}>{receivingId === item.id ? "⏳" : "📦"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div>
              <div style={{ fontSize: 10, color: C.textSub }}>× {item.quantity}個 · 発注日 {item.orderedAt}</div>
            </div>
            <span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>
              {receivingId === item.id ? "処理中..." : "タップで受取 →"}
            </span>
          </button>
        ))
      )}
      {receivedItems.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>受取済み（直近）</div>
          {receivedItems.slice(0, 5).map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.successLight, borderRadius: 10, marginBottom: 4, border: `1px solid ${C.successBorder}`, opacity: 0.5 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, textDecoration: "line-through" }}>{item.name}</div>
              </div>
              <span style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>受取済</span>
            </div>
          ))}
        </div>
      )}
      {receivedItems.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: C.warnLight, borderRadius: 10, border: `1px solid ${C.warnBorder}` }}>
          <p style={{ fontSize: 12, color: C.warnDark, margin: 0, lineHeight: 1.6 }}>
            💡 受取完了したタグは、届いた商品の<strong>後ろからN本目</strong>の位置に付け直してください。
          </p>
        </div>
      )}
    </div>
  );
}

// ======================================================================
// Product Management Screen
// ======================================================================
function ProductScreen({ products, onSaveProduct, onDeleteProduct, skuLimit, currentPlan, onShowPricing, tagMap = {} }) {
  const [view, setView] = useState("list");
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const activeProducts = products.filter((p) => p.isActive);
  const filtered = activeProducts.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.manufacturer || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.category !== filterCat) return false;
    return true;
  });

  const categoryCounts = {};
  activeProducts.forEach((p) => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });

  if (view === "add" || view === "edit") {
    return (
      <ProductForm
        product={view === "edit" ? editProduct : null}
        onSave={async (p) => { await onSaveProduct(p, view === "edit"); setView("list"); setEditProduct(null); }}
        onCancel={() => { setView("list"); setEditProduct(null); }}
        onDelete={view === "edit" ? async () => { await onDeleteProduct(editProduct.id); setView("list"); setEditProduct(null); } : null}
      />
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.textMuted }}>🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="商品名・メーカーで検索"
          style={{ width: "100%", padding: "11px 12px 11px 38px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: "none", background: C.card, boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        <button onClick={() => setFilterCat("")} style={{
          padding: "6px 12px", borderRadius: 20, border: `1px solid ${filterCat === "" ? C.primary : C.border}`,
          background: filterCat === "" ? C.primaryLight : C.card, color: filterCat === "" ? C.primary : C.textSub,
          fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        }}>すべて ({activeProducts.length})</button>
        {Object.entries(categoryCounts).map(([cat, count]) => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{
            padding: "6px 12px", borderRadius: 20, border: `1px solid ${filterCat === cat ? C.primary : C.border}`,
            background: filterCat === cat ? C.primaryLight : C.card, color: filterCat === cat ? C.primary : C.textSub,
            fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>{cat} ({count})</button>
        ))}
      </div>

      {filtered.map((p) => (
        <div key={p.id} onClick={() => { setEditProduct(p); setView("edit"); }} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          background: C.card, borderRadius: 10, marginBottom: 6, border: `1px solid ${C.border}`, cursor: "pointer",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
            {p.category.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>
              {tagMap[p.id] ? <span style={{ color: C.primary, fontWeight: 600 }}>{tagMap[p.id]}</span> : <span style={{ color: C.textMuted }}>タグなし</span>}
              {" · "}{p.manufacturer} · {p.location}
            </div>
          </div>
          <span style={{ color: C.textMuted, fontSize: 14 }}>›</span>
        </div>
      ))}
      {filtered.length === 0 && <EmptyState icon="🔭" message="該当する商品がありません" />}

      <button onClick={() => {
        const activeCount = products.filter(p => p.isActive).length;
        if (activeCount >= skuLimit) { onShowPricing(); return; }
        setView("add");
      }} style={{
        position: "fixed", bottom: 80, right: "calc(50% - 190px)",
        width: 56, height: 56, borderRadius: 28,
        background: C.primary, color: "#fff", border: "none",
        fontSize: 28, fontWeight: 400, cursor: "pointer",
        boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40,
      }}>+</button>
    </div>
  );
}

// ======================================================================
// Product Form ★ S37: デモバーコード削除
// ======================================================================
function ProductForm({ product, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(product || {
    name: "", category: "カラー剤", location: "棚A上段", manufacturer: "",
    defaultOrderQty: 1, reorderPoint: null, janCode: "",
  });
  const [barcodeScanActive, setBarcodeScanActive] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const isValid = form.name.trim() !== "";

  const handleBarcodeScan = useCallback((decodedText, format) => {
    setBarcodeScanActive(false);
    setBarcodeResult(decodedText);
    setForm((f) => ({ ...f, janCode: decodedText }));
  }, []);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>
        {product ? "商品を編集" : "新しい商品を登録"}
      </div>
      {!product && (
        <>
          {barcodeScanActive ? (
            <div style={{ marginBottom: 16 }}>
              <QrScanner mode="barcode" active={barcodeScanActive} onScan={handleBarcodeScan} />
              <button onClick={() => setBarcodeScanActive(false)} style={{
                width: "100%", padding: "12px", border: `1.5px solid ${C.danger}`, borderRadius: 12, background: C.dangerLight, color: C.danger,
                fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8,
              }}>✕ スキャンを中止</button>
            </div>
          ) : (
            <button onClick={() => setBarcodeScanActive(true)} style={{
              width: "100%", padding: "14px", border: `1.5px dashed ${C.primary}`, borderRadius: 12, background: C.primaryLight, color: C.primary,
              fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginBottom: 16,
            }}>📷 バーコード読取</button>
          )}
          {barcodeResult && (
            <div style={{ padding: "10px 14px", background: C.successLight, borderRadius: 10, border: `1px solid ${C.successBorder}`, marginBottom: 16, fontSize: 12, color: C.successDark }}>
              ✅ バーコード読み取り成功: {barcodeResult}
            </div>
          )}
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="商品名" required>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="例：イルミナカラー オーシャン 6" style={inputStyle} />
        </FormField>
        <FormField label="メーカー">
          <input value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} placeholder="例：ウエラ" style={inputStyle} />
        </FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <FormField label="カテゴリ" style={{ flex: 1 }}>
            <select value={form.category} onChange={(e) => update("category", e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="保管場所" style={{ flex: 1 }}>
            <select value={form.location} onChange={(e) => update("location", e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormField>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <FormField label="デフォルト発注数" style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <QuantityStepper value={form.defaultOrderQty} onChange={(v) => update("defaultOrderQty", v)} />
              <span style={{ fontSize: 12, color: C.textSub }}>個</span>
            </div>
          </FormField>
          <FormField label="発注点（後ろからN本目）" style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <QuantityStepper value={form.reorderPoint || 1} onChange={(v) => update("reorderPoint", v)} min={1} max={20} />
              <span style={{ fontSize: 12, color: C.textSub }}>本目</span>
            </div>
          </FormField>
        </div>
        {form.janCode && (
          <FormField label="JANコード">
            <div style={{ ...inputStyle, background: C.bg, color: C.textSub }}>{form.janCode}</div>
          </FormField>
        )}
      </div>
      {!product && (
        <div style={{ marginTop: 20, padding: 12, background: C.primaryLight, borderRadius: 10, border: `1px solid ${C.primaryBorder}` }}>
          <p style={{ fontSize: 12, color: C.primary, margin: 0, lineHeight: 1.6 }}>
            🏷️ 保存すると未割当のQRタグが自動で紐付けされます。タグ管理画面で対応表を確認し、物理タグを商品に取り付けてください。
          </p>
        </div>
      )}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={handleSave} disabled={!isValid || saving} style={{
          width: "100%", padding: "14px", border: "none", borderRadius: 12,
          background: isValid && !saving ? C.primary : "#d1d5db", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: isValid && !saving ? "pointer" : "default",
        }}>{saving ? "保存中..." : product ? "保存する" : "商品を登録する"}</button>
        <button onClick={onCancel} style={{ width: "100%", padding: "14px", border: `1px solid ${C.border}`, borderRadius: 12, background: C.card, color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>キャンセル</button>
        {onDelete && (
          <button onClick={onDelete} style={{ width: "100%", padding: "12px", border: "none", borderRadius: 12, background: "transparent", color: C.danger, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>この商品を削除する</button>
        )}
      </div>
    </div>
  );
}

function FormField({ label, required, children, style = {} }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`,
  borderRadius: 8, fontSize: 14, outline: "none", background: "#fff",
  boxSizing: "border-box", color: C.text,
};

// ======================================================================
// Stockout Screen（変更なし — S35版そのまま）
// ======================================================================
function StockoutScreen({ products, storeId, isDbMode, onRefreshProducts, onStockoutCountChange }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionReports, setSessionReports] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [reorderProposal, setReorderProposal] = useState(null);
  const [applyingProposal, setApplyingProposal] = useState(false);

  const fetchUnacknowledged = useCallback(async () => {
    if (!supabase || !storeId) return;
    try {
      const { data, error } = await supabase
        .from("stockout_reports")
        .select("id, product_id, reported_at, products(name, reorder_point)")
        .eq("store_id", storeId)
        .eq("acknowledged", false)
        .order("reported_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data && data.products) {
        const currentPoint = data.products.reorder_point || 1;
        setReorderProposal({
          reportId: data.id,
          productId: data.product_id,
          productName: data.products.name,
          currentPoint,
          newPoint: currentPoint + 1,
        });
      }
    } catch (e) {
      console.error("Fetch unacknowledged error:", e);
    }
  }, [storeId]);

  useEffect(() => {
    fetchHistory();
    fetchUnacknowledged();
  }, [storeId, fetchUnacknowledged]);

  const fetchHistory = async () => {
    if (!supabase || !storeId) {
      setHistoryLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("stockout_reports")
        .select("id, product_id, reported_at, days_since_order, acknowledged, products(name, category)")
        .eq("store_id", storeId)
        .order("reported_at", { ascending: false })
        .limit(30);
      if (!error && data) {
        setHistory(data);
      }
    } catch (e) {
      console.error("Stockout history fetch error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const acknowledgeReport = async (reportId) => {
    if (!supabase || !storeId || !reportId) return;
    try {
      await supabase
        .from("stockout_reports")
        .update({ acknowledged: true })
        .eq("id", reportId)
        .eq("store_id", storeId);
    } catch (e) {
      console.error("Acknowledge error:", e);
    }
  };

  const reportStockout = async (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      setScanResult({ type: "error", message: "商品が見つかりません" });
      setTimeout(() => setScanResult(null), 3000);
      return;
    }

    if (sessionReports.find((r) => r.productId === productId)) {
      setScanResult({ type: "warning", message: `${product.name} は既に報告済みです` });
      setTimeout(() => setScanResult(null), 2500);
      return;
    }

    setReporting(true);
    try {
      let lastOrderedAt = null;
      let daysSinceOrder = null;
      let insertedReportId = null;

      if (supabase && storeId) {
        const { data: lastOrder } = await supabase
          .from("order_items")
          .select("ordered_at")
          .eq("store_id", storeId)
          .eq("product_id", productId)
          .not("ordered_at", "is", null)
          .order("ordered_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastOrder?.ordered_at) {
          lastOrderedAt = lastOrder.ordered_at;
          daysSinceOrder = Math.floor(
            (Date.now() - new Date(lastOrderedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        const { data: insertedData, error: insertError } = await supabase
          .from("stockout_reports")
          .insert({
            store_id: storeId,
            product_id: productId,
            reported_at: new Date().toISOString(),
            last_ordered_at: lastOrderedAt,
            days_since_order: daysSinceOrder,
            acknowledged: false,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Stockout report insert error:", insertError);
          setScanResult({ type: "error", message: "報告の保存に失敗しました" });
          setTimeout(() => setScanResult(null), 3000);
          return;
        }

        insertedReportId = insertedData?.id;
      }

      setSessionReports((prev) => [
        {
          productId,
          name: product.name,
          category: product.category,
          reportedAt: new Date(),
          daysSinceOrder,
        },
        ...prev,
      ]);

      setScanResult({ type: "success", name: product.name, message: "欠品を記録しました" });
      setTimeout(() => setScanResult(null), 2500);

      const currentPoint = product.reorderPoint || 1;
      setReorderProposal({
        reportId: insertedReportId,
        productId: product.id,
        productName: product.name,
        currentPoint,
        newPoint: currentPoint + 1,
      });

      await fetchHistory();
      if (onStockoutCountChange) onStockoutCountChange();
    } catch (e) {
      console.error("Stockout report error:", e);
      setScanResult({ type: "error", message: "エラーが発生しました" });
      setTimeout(() => setScanResult(null), 3000);
    } finally {
      setReporting(false);
    }
  };

  const handleQrScan = useCallback(
    async (decodedText) => {
      if (!supabase || !storeId) return;

      const { data: tag } = await supabase
        .from("qr_tags")
        .select("product_id")
        .eq("tag_code", decodedText)
        .eq("store_id", storeId)
        .maybeSingle();

      if (!tag || !tag.product_id) {
        setScanResult({ type: "error", message: "未登録のタグです" });
        setTimeout(() => setScanResult(null), 3000);
        return;
      }

      await reportStockout(tag.product_id);
    },
    [storeId, products, sessionReports]
  );

  const activeProducts = products.filter((p) => p.isActive);
  const searchResults = searchQuery.trim()
    ? activeProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.manufacturer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeProducts;

  const handleAfterProposal = async () => {
    setReorderProposal(null);
    if (onStockoutCountChange) onStockoutCountChange();
    await fetchHistory();
    await fetchUnacknowledged();
  };

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{
        padding: 14, background: C.dangerLight, borderRadius: 12,
        border: `1px solid ${C.dangerBorder}`, marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 4 }}>
          🚨 在庫切れの商品を報告
        </div>
        <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>
          欠品データをもとに発注点を自動で見直します。
          タグをスキャンするか、商品を検索して報告してください。
        </div>
      </div>

      {scanResult && (
        <div style={{
          padding: "11px 14px", marginBottom: 12, borderRadius: 10,
          background:
            scanResult.type === "success" ? "#dcfce7" :
            scanResult.type === "warning" ? C.warnLight : C.dangerLight,
          border: `1px solid ${
            scanResult.type === "success" ? "#86efac" :
            scanResult.type === "warning" ? C.warnBorder : C.dangerBorder
          }`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>
            {scanResult.type === "success" ? "✅" : scanResult.type === "warning" ? "⚠️" : "❌"}
          </span>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color:
                scanResult.type === "success" ? C.successDark :
                scanResult.type === "warning" ? C.warnDark : C.danger,
            }}>
              {scanResult.message}
            </div>
            {scanResult.name && (
              <div style={{ fontSize: 11, color: C.textSub }}>{scanResult.name}</div>
            )}
          </div>
        </div>
      )}

      {reorderProposal && (
        <div style={{
          padding: "14px 16px", marginBottom: 12, borderRadius: 12,
          background: C.primaryLight, border: `1.5px solid ${C.primaryBorder}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 6 }}>
            💡 発注点の変更を提案
          </div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
            <strong>{reorderProposal.productName}</strong> で欠品が発生しました。
            発注点を <strong style={{ color: C.danger }}>{reorderProposal.currentPoint}本目</strong> →{" "}
            <strong style={{ color: C.primary }}>{reorderProposal.newPoint}本目</strong> に引き上げますか？
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={async () => {
                setApplyingProposal(true);
                try {
                  if (supabase && storeId) {
                    const { error } = await supabase
                      .from("products")
                      .update({ reorder_point: reorderProposal.newPoint })
                      .eq("id", reorderProposal.productId)
                      .eq("store_id", storeId);
                    if (error) {
                      console.error("Reorder point update error:", error);
                      alert("更新に失敗しました");
                      return;
                    }
                  }
                  await acknowledgeReport(reorderProposal.reportId);
                  setScanResult({
                    type: "success",
                    name: reorderProposal.productName,
                    message: `発注点を${reorderProposal.newPoint}本目に変更しました`,
                  });
                  setTimeout(() => setScanResult(null), 3000);
                  if (onRefreshProducts) await onRefreshProducts();
                  await handleAfterProposal();
                } finally {
                  setApplyingProposal(false);
                }
              }}
              disabled={applyingProposal}
              style={{
                flex: 1, padding: "10px", border: "none", borderRadius: 10,
                background: applyingProposal ? C.textMuted : C.primary,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: applyingProposal ? "default" : "pointer",
              }}
            >
              {applyingProposal ? "更新中..." : `✅ ${reorderProposal.newPoint}本目に変更`}
            </button>
            <button
              onClick={async () => {
                await acknowledgeReport(reorderProposal.reportId);
                await handleAfterProposal();
              }}
              style={{
                padding: "10px 16px", border: `1px solid ${C.border}`, borderRadius: 10,
                background: C.card, color: C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              スキップ
            </button>
          </div>
        </div>
      )}

      {cameraActive && (
        <div style={{ marginBottom: 14 }}>
          <QrScanner mode="qr" active={cameraActive} onScan={handleQrScan} />
        </div>
      )}

      <button
        onClick={() => { setCameraActive(!cameraActive); setShowSearch(false); }}
        style={{
          width: "100%", padding: "14px", border: "none", borderRadius: 12,
          background: cameraActive ? "#dc2626" : C.danger, color: "#fff",
          fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8,
        }}
      >
        {cameraActive ? "⏹ カメラを停止" : "📷 QRタグをスキャンして報告"}
      </button>

      <button
        onClick={() => { setShowSearch(!showSearch); setCameraActive(false); }}
        style={{
          width: "100%", padding: "12px", border: `1.5px solid ${C.border}`,
          borderRadius: 12, background: showSearch ? C.bg : C.card, color: C.textSub,
          fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16,
        }}
      >
        {showSearch ? "✕ 検索を閉じる" : "🔍 タグが手元にない場合 → 商品名で検索"}
      </button>

      {showSearch && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", fontSize: 16, color: C.textMuted,
            }}>
              🔍
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="商品名・メーカーで検索"
              autoFocus
              style={{
                width: "100%", padding: "11px 12px 11px 38px",
                border: `1px solid ${C.border}`, borderRadius: 10,
                fontSize: 13, outline: "none", background: C.card,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: C.textSub }}>
                該当する商品がありません
              </div>
            ) : (
              searchResults.slice(0, 20).map((p) => {
                const alreadyReported = sessionReports.find((r) => r.productId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => !alreadyReported && !reporting && reportStockout(p.id)}
                    disabled={!!alreadyReported || reporting}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: alreadyReported ? C.bg : C.card,
                      borderRadius: 10, marginBottom: 4,
                      border: `1px solid ${alreadyReported ? C.successBorder : C.border}`,
                      cursor: alreadyReported || reporting ? "default" : "pointer",
                      textAlign: "left", opacity: alreadyReported ? 0.5 : 1,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: C.dangerLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, flexShrink: 0,
                    }}>
                      {alreadyReported ? "✅" : "🚨"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: C.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.textSub, marginTop: 1 }}>
                        {p.category} · {p.manufacturer}
                      </div>
                    </div>
                    {alreadyReported ? (
                      <span style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>報告済</span>
                    ) : (
                      <span style={{ fontSize: 11, color: C.danger, fontWeight: 600 }}>報告</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {sessionReports.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            今回の報告 <span style={{ fontSize: 12, color: C.textSub, fontWeight: 400 }}>{sessionReports.length}件</span>
          </div>
          {sessionReports.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: C.dangerLight, borderRadius: 10, marginBottom: 4,
              border: `1px solid ${C.dangerBorder}`,
            }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.name}</div>
                <div style={{ fontSize: 10, color: C.textSub }}>
                  {r.category}
                  {r.daysSinceOrder != null && ` · 前回発注から${r.daysSinceOrder}日`}
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.textSub }}>
                {r.reportedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          過去の欠品報告
        </div>
        {historyLoading ? (
          <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: C.textSub }}>
            読み込み中...
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon="📊" message="まだ欠品報告はありません。報告が蓄積されると発注点を自動で改善します。" />
        ) : (
          <>
            {history.slice(0, 10).map((h) => (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: h.acknowledged === false ? C.warnLight : C.card,
                borderRadius: 10, marginBottom: 4,
                border: `1px solid ${h.acknowledged === false ? C.warnBorder : C.border}`,
              }}>
                <span style={{ fontSize: 14, color: h.acknowledged === false ? C.warn : C.textMuted }}>
                  {h.acknowledged === false ? "🔔" : "✅"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                    {h.products?.name || "不明な商品"}
                    {h.acknowledged === false && (
                      <span style={{ fontSize: 10, color: C.warn, fontWeight: 700, marginLeft: 6 }}>未対応</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: C.textSub }}>
                    {h.products?.category || ""}
                    {h.days_since_order != null && ` · 発注から${h.days_since_order}日で欠品`}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.textSub }}>
                  {h.reported_at ? formatShortDate(h.reported_at) : ""}
                </div>
              </div>
            ))}
            {history.length > 10 && (
              <div style={{ padding: 8, textAlign: "center", fontSize: 11, color: C.textMuted }}>
                他 {history.length - 10}件の報告
              </div>
            )}
          </>
        )}
      </div>

      <div style={{
        marginTop: 16, padding: 14, background: C.primaryLight,
        borderRadius: 12, border: `1px solid ${C.primaryBorder}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
          💡 使うほど賢くなる自動補正
        </div>
        <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>
          欠品を報告するたびに、該当商品の発注点（タグを付ける位置）を1つ手前にずらすことを提案します。
          承認すると次回から早めに発注リストに入るため、同じ欠品を防げます。
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// Main App ★ S37: handleDeleteOrderItem 追加
// ======================================================================
export default function SalonMock() {
  const {
    storeId, storeName, storePlan, storeMaxSku, storeBonusSku,
    subscriptionStatus, signOut, isAuthenticated, isSupabaseConnected, user,
    refreshStore,
    isEarlyBird, storeReferredBy,
  } = useAuth();

  const [screen, setScreen] = useState("top");
  const [products, setProducts] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [receivedItems, setReceivedItems] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [tagCount, setTagCount] = useState(0);
  const [tagMap, setTagMap] = useState({});
  const [trialLoading, setTrialLoading] = useState(false);
  const [stockoutCount, setStockoutCount] = useState(0);

  const isDbMode = isSupabaseConnected && isAuthenticated && dbConnected;

  const skuLimit = (storeMaxSku || 30) + (storeBonusSku || 0);
  const activeProductCount = products.filter((p) => p.isActive).length;
  const isOverLimit = activeProductCount > skuLimit;

  const isFreeAccess = isEarlyBird || !!storeReferredBy;

  const needsTrialGate = !isFreeAccess && storePlan === "free" && !subscriptionStatus;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        window.history.replaceState({}, "", window.location.pathname);
        const timer = setTimeout(() => {
          if (refreshStore) refreshStore();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [refreshStore]);

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1T4w0SAhbUNgyEJI4FwYN1k7",
          accessToken: token,
          trialDays: 30,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "エラーが発生しました");
      }
    } catch (err) {
      alert("通信エラーが発生しました");
    } finally {
      setTrialLoading(false);
    }
  };

  // ——— Fetch products from Supabase ———
  const fetchProducts = useCallback(async () => {
    if (!supabase || !storeId) return;
    try {
      const { data, error } = await supabase.from("products").select("*").eq("store_id", storeId).order("created_at", { ascending: true });
      if (error) throw error;
      if (data) { setProducts(data.map(dbToJs)); setDbConnected(true); }
    } catch (e) { console.error("Products fetch error:", e); setDbConnected(false); }
  }, [storeId]);

  const fetchOrderItems = useCallback(async () => {
    if (!supabase || !storeId) return;
    try {
      const { data, error } = await supabase.from("order_items")
        .select(`*, products (name, category, location, manufacturer)`)
        .eq("store_id", storeId).order("scanned_at", { ascending: false });
      if (error) throw error;
      if (data) {
        const items = data.map(orderItemFromDb);
        setPendingItems(items.filter((i) => i.status === "scanned"));
        setOrderedItems(items.filter((i) => i.status === "ordered"));
        setReceivedItems(items.filter((i) => i.status === "received"));
      }
    } catch (e) { console.error("Order items fetch error:", e); }
  }, [storeId]);

  const fetchTagCount = useCallback(async () => {
    if (!supabase || !storeId) return;
    try {
      const { count, error } = await supabase.from("qr_tags").select("*", { count: "exact", head: true }).eq("store_id", storeId);
      if (!error) setTagCount(count || 0);
      const { data: tags } = await supabase.from("qr_tags").select("product_id, tag_code").eq("store_id", storeId).not("product_id", "is", null);
      if (tags) { const map = {}; tags.forEach(t => { map[t.product_id] = t.tag_code; }); setTagMap(map); }
    } catch (e) { console.error("Tag count fetch error:", e); }
  }, [storeId]);

  const fetchStockoutCount = useCallback(async () => {
    if (!supabase || !storeId) return;
    try {
      const { count, error } = await supabase
        .from("stockout_reports")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("acknowledged", false);
      if (!error) setStockoutCount(count || 0);
    } catch (e) {
      console.error("Stockout count fetch error:", e);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) { fetchProducts(); fetchOrderItems(); fetchTagCount(); fetchStockoutCount(); }
  }, [storeId, fetchProducts, fetchOrderItems, fetchTagCount, fetchStockoutCount]);

  // ——— Product CRUD ———
  const handleSaveProduct = async (formData, isEdit) => {
    if (!supabase || !storeId) return;
    try {
      if (isEdit) {
        const { error } = await supabase.from("products").update(jsToDb(formData, storeId)).eq("id", formData.id).eq("store_id", storeId);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase.from("products").insert(jsToDb(formData, storeId)).select("id").single();
        if (error) throw error;
        if (newProduct) {
          const { data: freeTag } = await supabase.from("qr_tags").select("id, tag_code")
            .eq("store_id", storeId).eq("status", "unassigned").is("product_id", null)
            .order("tag_code", { ascending: true }).limit(1).maybeSingle();
          if (freeTag) {
            await supabase.from("qr_tags").update({ product_id: newProduct.id, status: "attached" }).eq("id", freeTag.id);
          }
        }
      }
      await fetchProducts();
      await fetchTagCount();
    } catch (e) { console.error("Product save error:", e); alert("保存に失敗しました: " + e.message); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!supabase || !storeId) return;
    try {
      await supabase.from("qr_tags").update({ product_id: null, status: "unassigned" }).eq("store_id", storeId).eq("product_id", productId);
      const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId).eq("store_id", storeId);
      if (error) throw error;
      await fetchProducts();
      await fetchTagCount();
    } catch (e) { console.error("Product delete error:", e); alert("削除に失敗しました: " + e.message); }
  };

  // ——— Order Item operations ———
  const handleAddOrderItem = async (product) => {
    if (!supabase || !storeId) return;
    try {
      const { error } = await supabase.from("order_items").insert({ store_id: storeId, product_id: product.id, status: "scanned", quantity: product.defaultOrderQty, scanned_at: new Date().toISOString() });
      if (error) throw error;
      await fetchOrderItems();
    } catch (e) { console.error("Add order item error:", e); }
  };

  const handleMarkOrdered = async (items) => {
    if (!supabase || !storeId) return;
    try {
      for (const item of items) {
        const { error } = await supabase.from("order_items").update({ status: "ordered", quantity: item.quantity, ordered_at: new Date().toISOString() }).eq("id", item.id).eq("store_id", storeId);
        if (error) throw error;
      }
      await fetchOrderItems();
    } catch (e) { console.error("Mark ordered error:", e); }
  };

  const handleMarkReceived = async (item) => {
    if (!supabase || !storeId) return;
    try {
      const { error } = await supabase.from("order_items").update({ status: "received", received_at: new Date().toISOString() }).eq("id", item.id).eq("store_id", storeId);
      if (error) throw error;
      await fetchOrderItems();
    } catch (e) { console.error("Mark received error:", e); }
  };

  // ★ S37: 発注取消（order_itemsから削除＋タグをattachedに戻す）
  const handleDeleteOrderItem = async (item) => {
    if (!supabase || !storeId) return;
    try {
      // order_itemsから削除
      const { error } = await supabase
        .from("order_items")
        .delete()
        .eq("id", item.id)
        .eq("store_id", storeId);
      if (error) throw error;

      // タグのステータスを attached に戻す（removedのものを復元）
      if (item.productId) {
        await supabase
          .from("qr_tags")
          .update({ status: "attached" })
          .eq("store_id", storeId)
          .eq("product_id", item.productId)
          .eq("status", "removed");
      }

      await fetchOrderItems();
    } catch (e) {
      console.error("Delete order item error:", e);
      alert("取消に失敗しました");
    }
  };

  const pendingCount = pendingItems.length;
  const waitingCount = orderedItems.length;
  const activeProducts = activeProductCount;

  const screenTitle = {
    top: null, scan: "QRスキャン", order: "発注リスト", receive: "受取待ち",
    products: "商品管理", tags: "タグ管理", settings: "設定",
    stockout: "欠品報告",
  };

  if (needsTrialGate && isDbMode) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <TrialGateModal onStartTrial={handleStartTrial} loading={trialLoading} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "14px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        {screen !== "top" && (
          <button onClick={() => setScreen("top")} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px", color: "#555" }}>←</button>
        )}
        <div style={{ flex: 1 }}>
          {screen === "top" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏷️</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>在庫番</span>
              <span style={{
                fontSize: 9, color: isDbMode ? C.success : C.textSub,
                background: isDbMode ? C.successLight : "#f3f4f6",
                padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                border: isDbMode ? `1px solid ${C.successBorder}` : "none",
              }}>
                {isDbMode ? "DB接続中" : "未接続"}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{screenTitle[screen]}</span>
          )}
        </div>
        {screen === "top" && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
              fontSize: 11, color: C.textSub, display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 14 }}>👤</span>
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {storeName || "メニュー"}
              </span>
            </button>
            {showMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setShowMenu(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 4,
                  background: C.card, borderRadius: 10, border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 180, zIndex: 70, overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{storeName || "マイサロン"}</div>
                    <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{isDbMode ? "Supabase接続中" : "未接続"}</div>
                  </div>
                  <button onClick={() => { setScreen("settings"); setShowMenu(false); }} style={{
                    width: "100%", padding: "12px 16px", border: "none", background: "transparent", textAlign: "left",
                    fontSize: 13, color: C.text, cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                  }}>⚙️ 設定</button>
                  <button onClick={() => { signOut(); setShowMenu(false); }} style={{
                    width: "100%", padding: "12px 16px", border: "none", background: "transparent", textAlign: "left",
                    fontSize: 13, color: C.danger, cursor: "pointer",
                  }}>ログアウト</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ paddingTop: 16, paddingBottom: 90 }}>
        {screen === "top" && <TopScreen onNavigate={setScreen} orderCount={pendingCount} receiveCount={waitingCount} productCount={activeProducts} tagCount={tagCount} stockoutCount={stockoutCount} />}
        {screen === "scan" && <ScanScreen onNavigate={setScreen} products={products} onAddOrderItem={handleAddOrderItem} storeId={storeId} isOverLimit={isOverLimit} skuLimit={skuLimit} activeCount={activeProductCount} onShowPricing={() => setShowPricing(true)} />}
        {screen === "order" && <OrderScreen pendingItems={pendingItems} setPendingItems={setPendingItems} onMarkOrdered={handleMarkOrdered} onDeleteOrderItem={handleDeleteOrderItem} isOverLimit={isOverLimit} skuLimit={skuLimit} activeCount={activeProductCount} onShowPricing={() => setShowPricing(true)} />}
        {screen === "receive" && <ReceiveScreen orderedItems={orderedItems} receivedItems={receivedItems} onMarkReceived={handleMarkReceived} storeId={storeId} products={products} />}
        {screen === "products" && <ProductScreen products={products} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} skuLimit={skuLimit} currentPlan={storePlan || "free"} onShowPricing={() => setShowPricing(true)} tagMap={tagMap} />}
        {screen === "tags" && <TagManagementScreen products={products} />}
        {screen === "settings" && <SettingsScreen activeProductCount={activeProductCount} onShowPricing={() => setShowPricing(true)} />}
        {screen === "stockout" && <StockoutScreen products={products} storeId={storeId} isDbMode={isDbMode} onRefreshProducts={fetchProducts} onStockoutCountChange={fetchStockoutCount} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: C.card, borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-around", padding: "6px 0 18px", zIndex: 50,
      }}>
        {[
          { id: "top", icon: "🏠", label: "ホーム" },
          { id: "scan", icon: "📷", label: "スキャン" },
          { id: "order", icon: "📋", label: "発注", badge: pendingCount },
          { id: "receive", icon: "📦", label: "受取", badge: waitingCount },
        ].map((nav) => (
          <button key={nav.id} onClick={() => setScreen(nav.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            padding: "4px 12px", opacity: screen === nav.id ? 1 : 0.4, position: "relative",
          }}>
            <span style={{ fontSize: 20 }}>{nav.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: screen === nav.id ? C.primary : C.textSub }}>{nav.label}</span>
            {nav.badge > 0 && (
              <span style={{
                position: "absolute", top: -2, right: 4,
                minWidth: 16, height: 16, borderRadius: 8,
                background: C.danger, color: "#fff",
                fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
              }}>{nav.badge}</span>
            )}
          </button>
        ))}
      </div>

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        currentPlan={storePlan || "free"}
        accessToken={null}
        isFreeAccess={isFreeAccess}
      />
    </div>
  );
}
