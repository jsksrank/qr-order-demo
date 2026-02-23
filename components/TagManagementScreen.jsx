"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

// ——— Color Tokens（SalonMock と同じ）———
const C = {
  primary: "#2563eb", primaryLight: "#eff6ff", primaryBorder: "#bfdbfe",
  danger: "#dc2626", dangerLight: "#fef2f2", dangerBorder: "#fecaca",
  success: "#059669", successLight: "#f0fdf4", successBorder: "#bbf7d0", successDark: "#166534",
  warn: "#f59e0b", warnLight: "#fefce8", warnBorder: "#fde68a", warnDark: "#92400e",
  bg: "#f8fafc", card: "#fff", border: "#e5e7eb",
  text: "#1a1a2e", textSub: "#6b7280", textMuted: "#9ca3af",
};

// ★ Step 7簡素化: ステータス設定（removedは表示用に定義は残す）
const STATUS_CONFIG = {
  attached: { emoji: "🟢", label: "紐付け済", color: C.success, bg: C.successLight, border: C.successBorder },
  removed: { emoji: "🔴", label: "スキャン済", color: C.danger, bg: C.dangerLight, border: C.dangerBorder },
  unassigned: { emoji: "⚪", label: "未割当", color: C.textSub, bg: C.bg, border: C.border },
};

// ======================================================================
// TagManagementScreen（★ Step 7簡素化版）
// ・タグ生成ボタン＋モーダル削除（自動生成に移行）
// ・テキスト出力削除（不要と判断）
// ・スキャン済フィルター削除（発注リストと重複のため不要）
// ======================================================================
export default function TagManagementScreen({ products }) {
  const { storeId } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // 紐付け
  const [bindingTagId, setBindingTagId] = useState(null);

  // フィードバック
  const [feedback, setFeedback] = useState(null);

  // ——— タグ一覧の取得 ———
  const fetchTags = useCallback(async () => {
    if (!supabase || !storeId) return;
    try {
      const { data, error } = await supabase
        .from("qr_tags")
        .select("id, tag_code, product_id, status, created_at")
        .eq("store_id", storeId)
        .order("tag_code", { ascending: true });
      if (error) throw error;
      setTags(data || []);
    } catch (e) {
      console.error("Tags fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // ——— 紐付け変更 ———
  const handleBindProduct = async (tagId, productId) => {
    if (!supabase || !storeId) return;

    try {
      const updateData = productId
        ? { product_id: productId, status: "attached" }
        : { product_id: null, status: "unassigned" };

      const { error } = await supabase
        .from("qr_tags")
        .update(updateData)
        .eq("id", tagId)
        .eq("store_id", storeId);
      if (error) throw error;

      await fetchTags();
      setBindingTagId(null);

      const productName = productId
        ? products.find((p) => p.id === productId)?.name || "商品"
        : null;
      showFeedback("success", productId ? `${productName} に紐付けました` : "紐付けを解除しました");
    } catch (e) {
      console.error("Bind error:", e);
      showFeedback("error", "紐付けに失敗しました");
    }
  };

  // ——— ヘルパー ———
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const getFilteredTags = () => {
    if (filter === "all") return tags;
    return tags.filter((t) => t.status === filter);
  };

  const filteredTags = getFilteredTags();
  const counts = {
    all: tags.length,
    attached: tags.filter((t) => t.status === "attached").length,
    unassigned: tags.filter((t) => t.status === "unassigned").length,
  };

  // ======================================================================
  // Render
  // ======================================================================
  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: C.textSub }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {/* フィードバック */}
      {feedback && (
        <div style={{
          padding: "11px 14px", borderRadius: 10, marginBottom: 14,
          background: feedback.type === "success" ? "#dcfce7" : C.dangerLight,
          border: `1px solid ${feedback.type === "success" ? "#86efac" : C.dangerBorder}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{feedback.type === "success" ? "✅" : "❌"}</span>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: feedback.type === "success" ? C.successDark : C.danger,
          }}>{feedback.message}</span>
        </div>
      )}

      {/* ★ Step 7簡素化: サマリー（3項目のみ） */}
      <div style={{
        padding: 14, background: C.card, borderRadius: 12,
        border: `1px solid ${C.border}`, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[
            { label: "全タグ", value: counts.all, color: C.primary },
            { label: "紐付済", value: counts.attached, color: C.success },
            { label: "未割当", value: counts.unassigned, color: C.textSub },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ★ Step 7簡素化: フィルター（3つのみ） */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {[
          { key: "all", label: `すべて (${counts.all})` },
          { key: "unassigned", label: `⚪ 未割当 (${counts.unassigned})` },
          { key: "attached", label: `🟢 紐付済 (${counts.attached})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0,
            border: `1px solid ${filter === f.key ? C.primary : C.border}`,
            background: filter === f.key ? C.primaryLight : C.card,
            color: filter === f.key ? C.primary : C.textSub,
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>{f.label}</button>
        ))}
      </div>

      {/* タグ一覧 */}
      {filteredTags.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: C.textSub, fontSize: 14, background: C.bg, borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏷️</div>
          {tags.length === 0
            ? "タグがありません。プランに応じて自動生成されます。"
            : "該当するタグがありません"}
        </div>
      ) : (
        filteredTags.map((tag) => {
          const product = tag.product_id ? products.find((p) => p.id === tag.product_id) : null;
          const statusConf = STATUS_CONFIG[tag.status] || STATUS_CONFIG.unassigned;
          const isBinding = bindingTagId === tag.id;

          return (
            <div key={tag.id} style={{
              padding: "12px 14px", background: isBinding ? C.primaryLight : C.card,
              borderRadius: 10, marginBottom: 6,
              border: `1px solid ${isBinding ? C.primary : C.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* タグコード */}
                <div style={{
                  minWidth: 72, padding: "4px 10px", borderRadius: 6,
                  background: statusConf.bg, border: `1px solid ${statusConf.border}`,
                  fontSize: 12, fontWeight: 700, color: statusConf.color, textAlign: "center",
                }}>
                  {tag.tag_code}
                </div>

                {/* 商品名 or 未割当 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {product ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.textSub, marginTop: 1 }}>
                        {product.category} · {statusConf.label}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {statusConf.emoji} {statusConf.label}
                    </div>
                  )}
                </div>

                {/* 紐付けボタン */}
                <button onClick={() => setBindingTagId(isBinding ? null : tag.id)} style={{
                  padding: "6px 10px", borderRadius: 8,
                  border: `1px solid ${isBinding ? C.danger : C.primaryBorder}`,
                  background: isBinding ? C.dangerLight : C.primaryLight,
                  color: isBinding ? C.danger : C.primary,
                  fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  {isBinding ? "✕ 閉じる" : "🔗 紐付け"}
                </button>
              </div>

              {/* 紐付け選択パネル */}
              {isBinding && (
                <div style={{ marginTop: 10, padding: 12, background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>
                    商品を選択してください：
                  </div>
                  <select
                    value={tag.product_id || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleBindProduct(tag.id, val ? val : null);
                    }}
                    style={{
                      width: "100%", padding: "10px 12px",
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 13, background: "#fff", color: C.text,
                      appearance: "auto", boxSizing: "border-box",
                    }}
                  >
                    <option value="">（紐付け解除）</option>
                    {products.filter((p) => p.isActive).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
