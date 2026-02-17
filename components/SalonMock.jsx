"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// ━━━ DB ↔ JS マッピング ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function mapProductFromDB(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    location: row.location,
    manufacturer: row.manufacturer || "",
    defaultOrderQty: row.default_order_qty || 1,
    reorderPoint: row.reorder_point,
    isActive: row.is_active,
    janCode: row.jan_code || "",
    storeId: row.store_id,
  };
}

function mapProductToDB(product, storeId) {
  return {
    store_id: storeId,
    name: product.name,
    category: product.category,
    location: product.location,
    manufacturer: product.manufacturer || "",
    default_order_qty: product.defaultOrderQty || 1,
    reorder_point: product.reorderPoint || null,
    is_active: true,
    jan_code: product.janCode || null,
  };
}

// ━━━ フォールバック用サンプルデータ（Supabase接続失敗時） ━━━━━━━━━
const FALLBACK_PRODUCTS = [
  { id: 1, name: "イルミナカラー オーシャン 6", category: "カラー剤", location: "棚A上段", manufacturer: "ウエラ", defaultOrderQty: 2, reorderPoint: 3, isActive: true },
  { id: 2, name: "アディクシー グレーパール 7", category: "カラー剤", location: "棚A上段", manufacturer: "ミルボン", defaultOrderQty: 2, reorderPoint: 2, isActive: true },
  { id: 3, name: "オルディーブ シーディル C-8", category: "カラー剤", location: "棚A中段", manufacturer: "ミルボン", defaultOrderQty: 3, reorderPoint: 3, isActive: true },
  { id: 4, name: "オキシ 6% 2剤 1000ml", category: "2剤", location: "棚B", manufacturer: "ウエラ", defaultOrderQty: 1, reorderPoint: 2, isActive: true },
  { id: 5, name: "ファイバープレックス No.1", category: "トリートメント", location: "ワゴン", manufacturer: "シュワルツコフ", defaultOrderQty: 1, reorderPoint: 1, isActive: true },
];

const CATEGORIES = ["カラー剤", "2剤", "パーマ剤", "トリートメント", "シャンプー", "スタイリング", "その他"];
const LOCATIONS = ["棚A上段", "棚A中段", "棚A下段", "棚B", "棚C", "ワゴン", "バックヤード"];

// ━━━ Color Tokens ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const C = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  primaryBorder: "#bfdbfe",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  dangerBorder: "#fecaca",
  success: "#059669",
  successLight: "#f0fdf4",
  successBorder: "#bbf7d0",
  successDark: "#166534",
  line: "#06c755",
  warn: "#f59e0b",
  warnLight: "#fefce8",
  warnBorder: "#fde68a",
  warnDark: "#92400e",
  bg: "#f8fafc",
  card: "#fff",
  border: "#e5e7eb",
  text: "#1a1a2e",
  textSub: "#6b7280",
  textMuted: "#9ca3af",
};

// ━━━ Shared Components ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Badge({ count, color }) {
  if (!count) return null;
  return (
    <span style={{
      minWidth: 22, height: 22, borderRadius: 11, background: color, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, flexShrink: 0, padding: "0 6px",
    }}>{count}</span>
  );
}

function QuantityStepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden",
      background: C.card, flexShrink: 0,
    }}>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}
        style={{
          width: 36, height: 36, border: "none", background: "transparent",
          fontSize: 18, fontWeight: 700, color: value <= min ? C.textMuted : C.primary,
          cursor: value <= min ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>
      <div style={{
        width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700, color: C.text,
        borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
      }}>{value}</div>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
        style={{
          width: 36, height: 36, border: "none", background: "transparent",
          fontSize: 18, fontWeight: 700, color: value >= max ? C.textMuted : C.primary,
          cursor: value >= max ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >+</button>
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

// ━━━ Top Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TopScreen({ onNavigate, orderCount, receiveCount, productCount }) {
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🏷️</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>QRオーダー</h2>
        <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>美容室向け発注管理</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { id: "scan", icon: "📷", label: "QRスキャン", desc: "タグを読み取って発注リストに追加", color: C.primary },
          { id: "order", icon: "📋", label: "発注リスト", desc: "未発注の商品を確認・発注処理", color: C.danger, badge: orderCount },
          { id: "receive", icon: "📦", label: "受取待ち", desc: "届いた商品のタグをスキャンして完了", color: C.success, badge: receiveCount },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => onNavigate(btn.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
              background: C.card, border: `1.5px solid ${btn.color}18`, borderRadius: 14,
              cursor: "pointer", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <span style={{ fontSize: 30, flexShrink: 0 }}>{btn.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{btn.label}</div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{btn.desc}</div>
            </div>
            <Badge count={btn.badge} color={btn.color} />
          </button>
        ))}
      </div>

      <button
        onClick={() => onNavigate("products")}
        style={{
          width: "100%", marginTop: 16, padding: "14px 18px",
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
          cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <span style={{ fontSize: 28 }}>⚙️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>商品管理</div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>商品の登録・編集・QRタグ紐付け</div>
        </div>
        <div style={{ fontSize: 13, color: C.textSub }}>{productCount}品</div>
        <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
      </button>

      <div style={{ marginTop: 20, padding: 14, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>今月のサマリー</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[
            { label: "発注回数", value: "8回", color: C.primary },
            { label: "管理SKU", value: `${productCount}品`, color: C.success },
            { label: "在庫切れ", value: "1回", color: C.danger },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <StockoutButton />
      </div>
    </div>
  );
}

// ━━━ Scan Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScanScreen({ onNavigate, products, onAddOrderItem }) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);

  const scanTargets = products.filter((p) => p.isActive).slice(0, 5);

  const simulateScan = () => {
    if (scanTargets.length === 0) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setShowResult(true);
      const target = scanTargets[scanIndex % scanTargets.length];
      const item = {
        ...target,
        time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      };
      setScanned((prev) => [...prev, item]);
      onAddOrderItem(target);
      setScanIndex((i) => i + 1);
      setTimeout(() => setShowResult(false), 1800);
    }, 1000);
  };

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{
        width: "100%", aspectRatio: "1", maxHeight: 260,
        background: scanning ? "#1a1a2e" : "#111827", borderRadius: 16,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden", marginBottom: 14, position: "relative",
      }}>
        {scanning ? (
          <>
            <div style={{ width: 170, height: 170, border: "3px solid #2563eb", borderRadius: 12, position: "relative" }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "#2563eb", animation: "scanLine 1.2s ease-in-out infinite",
              }} />
            </div>
            <style>{`@keyframes scanLine { 0%{top:0} 50%{top:calc(100% - 3px)} 100%{top:0} }`}</style>
            <p style={{ color: "#fff", fontSize: 13, marginTop: 14 }}>スキャン中...</p>
          </>
        ) : showResult ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 6 }}>✅</div>
            <p style={{ color: "#4ade80", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>読み取り完了！</p>
            <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>{scanned[scanned.length - 1]?.name}</p>
          </div>
        ) : (
          <>
            <div style={{
              width: 170, height: 170, border: "2px dashed #4b5563", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>QRをここに合わせる</span>
            </div>
            <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 10 }}>カゴに貯めたタグをまとめてスキャン</p>
          </>
        )}
      </div>

      <button onClick={simulateScan} disabled={scanning} style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: scanning ? "#94a3b8" : C.primary, color: "#fff",
        fontSize: 15, fontWeight: 700, cursor: scanning ? "default" : "pointer", marginBottom: 18,
      }}>
        {scanning ? "読み取り中..." : "📷 スキャンする（デモ）"}
      </button>

      {scanned.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>
            今回スキャンした商品（{scanned.length}件）
          </div>
          {scanned.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
              background: C.successLight, borderRadius: 10, marginBottom: 5,
              border: `1px solid ${C.successBorder}`,
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

// ━━━ Order Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function OrderScreen({ orderItems, setOrderItems, orderedItems, setOrderedItems }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastOrderedCount, setLastOrderedCount] = useState(0);
  const [showLinePopup, setShowLinePopup] = useState(false);

  const pending = orderItems.filter((i) => i.status === "scanned");
  const checkedCount = pending.filter((i) => i.checked).length;

  const toggleCheck = (id) => {
    setOrderItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const updateQty = (id, qty) => {
    setOrderItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const handleOrder = () => {
    const toOrder = pending.filter((i) => i.checked).map((i) => ({
      ...i, status: "ordered", orderedAt: new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
    }));
    setLastOrderedCount(toOrder.length);
    setOrderedItems((prev) => [...prev, ...toOrder]);
    setOrderItems((prev) => prev.filter((i) => !i.checked));
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  const generateLineText = () => {
    const lines = pending.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity}個`);
    return `【発注リスト】${new Date().toLocaleDateString("ja-JP")}\n\n${lines.join("\n")}\n\n合計 ${pending.length}品目 / ${pending.reduce((s, i) => s + i.quantity, 0)}個\nよろしくお願いいたします。`;
  };

  return (
    <div style={{ padding: "0 20px" }}>
      {showConfirm && (
        <div style={{
          padding: "11px 14px", background: "#dcfce7", borderRadius: 10,
          border: "1px solid #86efac", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontSize: 13, color: C.successDark, fontWeight: 600 }}>
            {lastOrderedCount}件を発注処理しました
          </span>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>未発注</span>
            <span style={{ fontSize: 12, color: C.textSub, marginLeft: 8 }}>{pending.length}件</span>
          </div>
          {pending.length > 0 && (
            <button
              onClick={() => setOrderItems((prev) => prev.map((i) => i.status === "scanned" ? { ...i, checked: !pending.every((x) => x.checked) } : i))}
              style={{ fontSize: 11, color: C.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              {pending.every((i) => i.checked) ? "選択解除" : "すべて選択"}
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <EmptyState icon="🎉" message="未発注の商品はありません" />
        ) : (
          pending.map((item) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              background: item.checked ? C.primaryLight : C.card, borderRadius: 10, marginBottom: 6,
              border: item.checked ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
              cursor: "pointer",
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
                <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>
                  {item.category} · {item.location} · {item.scannedAt}
                </div>
              </div>
              <QuantityStepper value={item.quantity} onChange={(v) => updateQty(item.id, v)} />
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
        <span style={{ fontSize: 18 }}>💬</span>LINEで発注リストを送信
      </button>

      {showLinePopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={() => setShowLinePopup(false)}>
          <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 28px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>💬 LINE送信プレビュー</h3>
              <button onClick={() => setShowLinePopup(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textSub }}>✕</button>
            </div>
            <div style={{
              padding: 14, background: C.bg, borderRadius: 12,
              fontFamily: "monospace", fontSize: 12, lineHeight: 1.8,
              whiteSpace: "pre-wrap", color: "#333", maxHeight: 240, overflowY: "auto",
            }}>
              {generateLineText()}
            </div>
            <button onClick={() => setShowLinePopup(false)} style={{
              width: "100%", padding: "14px", border: "none", borderRadius: 12,
              background: C.line, color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", marginTop: 14,
            }}>
              LINEに送信する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ Receive Screen ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ReceiveScreen({ orderedItems, setOrderedItems }) {
  const [scanning, setScanning] = useState(false);
  const [lastReceived, setLastReceived] = useState(null);

  const unreceived = orderedItems.filter((i) => i.status === "ordered");
  const received = orderedItems.filter((i) => i.status === "received");

  const simulateReceive = () => {
    const target = unreceived[0];
    if (!target) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setOrderedItems((prev) => prev.map((i) => i.id === target.id ? { ...i, status: "received" } : i));
      setLastReceived(target.name);
      setTimeout(() => setLastReceived(null), 3000);
    }, 1000);
  };

  return (
    <div style={{ padding: "0 20px" }}>
      {lastReceived && (
        <div style={{
          padding: "11px 14px", background: "#dcfce7", borderRadius: 10,
          border: "1px solid #86efac", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>📦</span>
          <div>
            <div style={{ fontSize: 13, color: C.successDark, fontWeight: 600 }}>受取完了！</div>
            <div style={{ fontSize: 11, color: C.successDark }}>{lastReceived}</div>
            <div style={{ fontSize: 10, color: "#15803d", marginTop: 2 }}>→ タグを新しい在庫に付け直してください</div>
          </div>
        </div>
      )}

      <button onClick={simulateReceive} disabled={scanning || unreceived.length === 0} style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: scanning ? "#94a3b8" : unreceived.length === 0 ? "#d1d5db" : C.success,
        color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 18,
      }}>
        {scanning ? "読み取り中..." : unreceived.length === 0 ? "すべて受取済み ✅" : "📷 届いた商品のタグをスキャン（デモ）"}
      </button>

      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>
        受取待ち <span style={{ fontSize: 12, color: C.textSub, fontWeight: 400 }}>{unreceived.length}件</span>
      </div>
      {unreceived.length === 0 ? (
        <EmptyState icon="✅" message="すべて受取済みです" />
      ) : (
        unreceived.map((item) => (
          <div key={item.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: C.card, borderRadius: 10, marginBottom: 5, border: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div>
              <div style={{ fontSize: 10, color: C.textSub }}>× {item.quantity}個 · 発注日 {item.orderedAt}</div>
            </div>
          </div>
        ))
      )}

      {received.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>受取済み</div>
          {received.map((item) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: C.successLight, borderRadius: 10, marginBottom: 4,
              border: `1px solid ${C.successBorder}`, opacity: 0.5,
            }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, textDecoration: "line-through" }}>{item.name}</div>
              </div>
              <span style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>受取済</span>
            </div>
          ))}
        </div>
      )}

      {received.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: C.warnLight, borderRadius: 10, border: `1px solid ${C.warnBorder}` }}>
          <p style={{ fontSize: 12, color: C.warnDark, margin: 0, lineHeight: 1.6 }}>
            💡 受取完了したタグは、届いた商品の<strong>後ろからN本目</strong>の位置に付け直してください。
          </p>
        </div>
      )}
    </div>
  );
}

// ━━━ Product Management Screen（Supabase対応版）━━━━━━━━━━━━━━━━
function ProductScreen({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [view, setView] = useState("list");
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = products.filter((p) => {
    if (!p.isActive) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.manufacturer.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.category !== filterCat) return false;
    return true;
  });

  const categoryCounts = {};
  products.filter((p) => p.isActive).forEach((p) => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });

  if (view === "add" || view === "edit") {
    return (
      <ProductForm
        product={view === "edit" ? editProduct : null}
        saving={saving}
        onSave={async (p) => {
          setSaving(true);
          try {
            if (view === "edit") {
              await onUpdateProduct({ ...p, id: editProduct.id });
            } else {
              await onAddProduct(p);
            }
            setView("list");
            setEditProduct(null);
          } catch (err) {
            console.error("保存エラー:", err);
          } finally {
            setSaving(false);
          }
        }}
        onCancel={() => { setView("list"); setEditProduct(null); }}
        onDelete={view === "edit" ? async () => {
          setSaving(true);
          try {
            await onDeleteProduct(editProduct.id);
            setView("list");
            setEditProduct(null);
          } catch (err) {
            console.error("削除エラー:", err);
          } finally {
            setSaving(false);
          }
        } : null}
      />
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.textMuted }}>🔍</span>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="商品名・メーカーで検索"
          style={{
            width: "100%", padding: "11px 12px 11px 38px", border: `1px solid ${C.border}`,
            borderRadius: 10, fontSize: 13, outline: "none", background: C.card,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        <button onClick={() => setFilterCat("")} style={{
          padding: "6px 12px", borderRadius: 20, border: `1px solid ${filterCat === "" ? C.primary : C.border}`,
          background: filterCat === "" ? C.primaryLight : C.card, color: filterCat === "" ? C.primary : C.textSub,
          fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        }}>すべて ({products.filter((p) => p.isActive).length})</button>
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
          background: C.card, borderRadius: 10, marginBottom: 6,
          border: `1px solid ${C.border}`, cursor: "pointer",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: C.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0,
          }}>
            {p.category.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>
              {p.manufacturer} · {p.location} · 発注点: {p.reorderPoint || "未設定"}本目 · 発注数: {p.defaultOrderQty}個
            </div>
          </div>
          <span style={{ color: C.textMuted, fontSize: 14 }}>›</span>
        </div>
      ))}

      {filtered.length === 0 && <EmptyState icon="🔭" message="該当する商品がありません" />}

      <button onClick={() => setView("add")} style={{
        position: "fixed", bottom: 80, right: "calc(50% - 190px)",
        width: 56, height: 56, borderRadius: 28,
        background: C.primary, color: "#fff", border: "none",
        fontSize: 28, fontWeight: 400, cursor: "pointer",
        boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 40,
      }}>+</button>
    </div>
  );
}

// ━━━ Product Form ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ProductForm({ product, onSave, onCancel, onDelete, saving }) {
  const [form, setForm] = useState(product || {
    name: "", category: "カラー剤", location: "棚A上段", manufacturer: "",
    defaultOrderQty: 1, reorderPoint: null, janCode: "",
  });
  const [showBarcodeScan, setShowBarcodeScan] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isValid = form.name.trim() !== "" && !saving;

  const simulateBarcodeScan = () => {
    setShowBarcodeScan(true);
    setTimeout(() => {
      setShowBarcodeScan(false);
      setForm((f) => ({
        ...f,
        name: "ミルボン オルディーブ アディクシー GP7",
        manufacturer: "ミルボン",
        category: "カラー剤",
        janCode: "4954835325141",
      }));
    }, 1500);
  };

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>
        {product ? "商品を編集" : "新しい商品を登録"}
      </div>

      {!product && (
        <button onClick={simulateBarcodeScan} disabled={showBarcodeScan} style={{
          width: "100%", padding: "14px", border: `1.5px dashed ${C.primary}`,
          borderRadius: 12, background: C.primaryLight, color: C.primary,
          fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {showBarcodeScan ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
              バーコード読み取り中...
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </>
          ) : (
            <>📷 バーコードで商品情報を自動入力（デモ）</>
          )}
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="商品名" required>
          <input value={form.name} onChange={(e) => update("name", e.target.value)}
            placeholder="例：イルミナカラー オーシャン 6"
            style={inputStyle} />
        </FormField>

        <FormField label="メーカー">
          <input value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)}
            placeholder="例：ウエラ"
            style={inputStyle} />
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
            🏷️ 保存後、QRタグをスキャンしてこの商品に紐付けてください。
            タグに商品名を手書きし、後ろから{form.reorderPoint || "N"}本目に取り付けます。
          </p>
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => isValid && onSave(form)} disabled={!isValid} style={{
          width: "100%", padding: "14px", border: "none", borderRadius: 12,
          background: isValid ? C.primary : "#d1d5db", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: isValid ? "pointer" : "default",
        }}>
          {saving ? "保存中..." : product ? "保存する" : "商品を登録する"}
        </button>
        <button onClick={onCancel} disabled={saving} style={{
          width: "100%", padding: "14px", border: `1px solid ${C.border}`, borderRadius: 12,
          background: C.card, color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          キャンセル
        </button>
        {onDelete && (
          <button onClick={onDelete} disabled={saving} style={{
            width: "100%", padding: "12px", border: "none", borderRadius: 12,
            background: "transparent", color: C.danger, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            この商品を削除する
          </button>
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

// ━━━ Stockout Button ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StockoutButton() {
  const [reported, setReported] = useState(false);
  if (reported) {
    return (
      <div style={{ padding: "11px 14px", background: C.dangerLight, borderRadius: 10, border: `1px solid ${C.dangerBorder}`, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>⚠️ 在庫切れを報告しました（消費サイクルの学習に使います）</span>
      </div>
    );
  }
  return (
    <button onClick={() => setReported(true)} style={{
      width: "100%", padding: "12px", border: `1.5px solid ${C.danger}`,
      borderRadius: 12, background: C.card, color: C.danger,
      fontSize: 13, fontWeight: 700, cursor: "pointer",
    }}>
      ⚠️ 在庫が切れた商品を報告する
    </button>
  );
}

// ━━━ Main App（Supabase対応版）━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function SalonMock() {
  const [screen, setScreen] = useState("top");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [storeId, setStoreId] = useState(null);

  // Order items: scanned but not yet ordered（まだローカルstate）
  const [orderItems, setOrderItems] = useState([
    { id: 101, productId: 1, name: "イルミナカラー オーシャン 6", category: "カラー剤", location: "棚A上段", quantity: 2, status: "scanned", scannedAt: "2/15 14:20", checked: false },
    { id: 102, productId: 2, name: "アディクシー グレーパール 7", category: "カラー剤", location: "棚A上段", quantity: 2, status: "scanned", scannedAt: "2/15 14:20", checked: false },
    { id: 103, productId: 3, name: "オルディーブ シーディル C-8", category: "カラー剤", location: "棚A中段", quantity: 3, status: "scanned", scannedAt: "2/16 10:05", checked: false },
    { id: 104, productId: 4, name: "オキシ 6% 2剤 1000ml", category: "2剤", location: "棚B", quantity: 1, status: "scanned", scannedAt: "2/16 10:05", checked: false },
    { id: 105, productId: 5, name: "ファイバープレックス No.1", category: "トリートメント", location: "ワゴン", quantity: 1, status: "scanned", scannedAt: "2/17 09:30", checked: false },
  ]);

  // Ordered items: ordered, waiting for delivery（まだローカルstate）
  const [orderedItems, setOrderedItems] = useState([
    { id: 201, productId: 6, name: "スロウカラー モノトーン MT/08", category: "カラー剤", location: "棚A下段", quantity: 2, status: "ordered", orderedAt: "2/14" },
    { id: 202, productId: 7, name: "プロマスター スウィーツ PK-7", category: "カラー剤", location: "棚A中段", quantity: 2, status: "ordered", orderedAt: "2/14" },
  ]);

  // ━━━ Supabaseからデータ読み込み ━━━
  useEffect(() => {
    async function loadData() {
      try {
        // 最初の店舗を取得
        const { data: store, error: storeError } = await supabase
          .from("stores")
          .select("id, store_name")
          .limit(1)
          .single();

        if (storeError) throw storeError;
        setStoreId(store.id);

        // 商品一覧を取得
        const { data: productRows, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", store.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (prodError) throw prodError;
        setProducts(productRows.map(mapProductFromDB));
        setDbConnected(true);
        console.log(`✅ Supabase接続成功: ${store.store_name} (商品${productRows.length}件)`);
      } catch (err) {
        console.error("⚠️ Supabase接続失敗（フォールバックデータを使用）:", err);
        setProducts(FALLBACK_PRODUCTS);
        setDbConnected(false);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ━━━ 商品CRUD（Supabase対応）━━━
  const handleAddProduct = async (product) => {
    if (!storeId || !dbConnected) {
      // フォールバック：ローカルstateだけ更新
      setProducts((prev) => [...prev, { ...product, id: Date.now(), isActive: true }]);
      return;
    }
    const dbProduct = mapProductToDB(product, storeId);
    const { data, error } = await supabase
      .from("products")
      .insert(dbProduct)
      .select()
      .single();

    if (error) {
      console.error("商品追加エラー:", error);
      throw error;
    }
    setProducts((prev) => [...prev, mapProductFromDB(data)]);
  };

  const handleUpdateProduct = async (product) => {
    if (!dbConnected) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? product : p));
      return;
    }
    const dbProduct = mapProductToDB(product, storeId);
    const { error } = await supabase
      .from("products")
      .update(dbProduct)
      .eq("id", product.id);

    if (error) {
      console.error("商品更新エラー:", error);
      throw error;
    }
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...product, isActive: true } : p));
  };

  const handleDeleteProduct = async (productId) => {
    if (!dbConnected) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (error) {
      console.error("商品削除エラー:", error);
      throw error;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // ━━━ スキャン→発注リスト追加 ━━━
  const handleAddOrderItem = (product) => {
    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      category: product.category,
      location: product.location,
      quantity: product.defaultOrderQty,
      status: "scanned",
      scannedAt: new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) + " " +
        new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      checked: false,
    };
    setOrderItems((prev) => [...prev, newItem]);
  };

  const pendingCount = orderItems.filter((i) => i.status === "scanned").length;
  const waitingCount = orderedItems.filter((i) => i.status === "ordered").length;
  const activeProducts = products.filter((p) => p.isActive).length;

  const screenTitle = { top: null, scan: "QRスキャン", order: "発注リスト", receive: "受取待ち", products: "商品管理" };

  // ━━━ ローディング表示 ━━━
  if (loading) {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
        <div style={{ fontSize: 14, color: C.textSub }}>データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: C.bg, fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "14px 20px", background: C.card, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 50,
      }}>
        {screen !== "top" && (
          <button onClick={() => setScreen("top")}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px", color: "#555" }}>
            ←
          </button>
        )}
        <div style={{ flex: 1 }}>
          {screen === "top" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏷️</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>QRオーダー</span>
              <span style={{ fontSize: 10, color: dbConnected ? C.success : C.textSub, background: dbConnected ? C.successLight : "#f3f4f6", padding: "2px 8px", borderRadius: 10, border: dbConnected ? `1px solid ${C.successBorder}` : "none" }}>
                {dbConnected ? "DB接続中" : "デモ"}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{screenTitle[screen]}</span>
          )}
        </div>
        {screen === "top" && (
          <div style={{ fontSize: 11, color: C.textSub }}>Hair Salon BLOOM</div>
        )}
      </div>

      {/* Content */}
      <div style={{ paddingTop: 16, paddingBottom: 90 }}>
        {screen === "top" && (
          <TopScreen onNavigate={setScreen} orderCount={pendingCount} receiveCount={waitingCount} productCount={activeProducts} />
        )}
        {screen === "scan" && (
          <ScanScreen onNavigate={setScreen} products={products} onAddOrderItem={handleAddOrderItem} />
        )}
        {screen === "order" && (
          <OrderScreen orderItems={orderItems} setOrderItems={setOrderItems} orderedItems={orderedItems} setOrderedItems={setOrderedItems} />
        )}
        {screen === "receive" && (
          <ReceiveScreen orderedItems={orderedItems} setOrderedItems={setOrderedItems} />
        )}
        {screen === "products" && (
          <ProductScreen
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
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
    </div>
  );
}
