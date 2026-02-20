"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

// ——— Color Tokens（SalonMock と同じ）———
const C = {
  primary: "#2563eb", primaryLight: "#eff6ff", primaryBorder: "#bfdbfe",
  danger: "#dc2626", dangerLight: "#fef2f2", dangerBorder: "#fecaca",
  success: "#059669", successLight: "#f0fdf4", successBorder: "#bbf7d0", successDark: "#166534",
  warn: "#f59e0b", warnLight: "#fefce8", warnBorder: "#fde68a", warnDark: "#92400e",
  bg: "#f8fafc", card: "#fff", border: "#e5e7eb",
  text: "#1a1a2e", textSub: "#6b7280", textMuted: "#9ca3af",
};

// ステータスの表示設定
const STATUS_CONFIG = {
  attached: { emoji: "🟢", label: "紐付け済", color: C.success, bg: C.successLight, border: C.successBorder },
  removed: { emoji: "🔴", label: "スキャン済", color: C.danger, bg: C.dangerLight, border: C.dangerBorder },
  unassigned: { emoji: "⚪", label: "未割当", color: C.textSub, bg: C.bg, border: C.border },
};

// ======================================================================
// TagManagementScreen
// ======================================================================
export default function TagManagementScreen({ products }) {
  const { storeId } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // タグ生成
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  // 紐付け
  const [bindingTagId, setBindingTagId] = useState(null);
  const [bindCameraActive, setBindCameraActive] = useState(false);

  // テキスト出力
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // ——— タグ生成 ———
  const handleGenerate = async () => {
    if (!supabase || !storeId || generateCount < 1) return;
    setGenerating(true);

    try {
      // 現在の最大連番を取得
      const { data: existing } = await supabase
        .from("qr_tags")
        .select("tag_code")
        .eq("store_id", storeId)
        .order("tag_code", { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (existing && existing.length > 0) {
        const match = existing[0].tag_code.match(/QRO-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }

      // 一括INSERT
      const newTags = [];
      for (let i = 0; i < generateCount; i++) {
        newTags.push({
          store_id: storeId,
          tag_code: `QRO-${String(nextNum + i).padStart(3, "0")}`,
          status: "unassigned",
          product_id: null,
        });
      }

      const { error } = await supabase.from("qr_tags").insert(newTags);
      if (error) throw error;

      await fetchTags();
      setShowGenerate(false);
      showFeedback("success", `${generateCount}枚のタグを生成しました`);
    } catch (e) {
      console.error("Tag generate error:", e);
      showFeedback("error", "タグ生成に失敗しました: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

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

  // ——— QRスキャンで紐付け ———
  const handleBindScan = async (decodedText) => {
    if (!supabase || !storeId) return;

    // スキャンしたQRコードに一致するunassignedタグを探す
    const tag = tags.find(
      (t) => t.tag_code === decodedText && (t.status === "unassigned" || t.status === "attached")
    );

    if (!tag) {
      showFeedback("error", `タグ「${decodedText}」が見つからないか、スキャン済みです`);
      return;
    }

    // bindingTagIdに商品IDがセットされている場合はそれを使う
    // → ここでは「商品から紐付け」フローではなく「タグ管理画面のスキャン」なので
    //   スキャンしたタグの情報を表示してbindingTagIdにセット
    setBindingTagId(tag.id);
    setBindCameraActive(false);
    showFeedback("success", `タグ ${tag.tag_code} を選択しました。商品を選んでください。`);
  };

  // ——— テキスト出力 ———
  const generateExportText = (mode) => {
    const filteredTags = getFilteredTags();

    if (mode === "codes_only") {
      // QRコード生成サイト用：タグコードだけ
      return filteredTags.map((t) => t.tag_code).join("\n");
    }

    // 一覧テキスト
    const date = new Date().toLocaleDateString("ja-JP");
    const lines = [
      `【QRオーダー タグ一覧】`,
      `出力日: ${date}`,
      ``,
      ...filteredTags.map((t) => {
        const product = t.product_id ? products.find((p) => p.id === t.product_id) : null;
        const statusConf = STATUS_CONFIG[t.status];
        return `${t.tag_code}  ${statusConf.emoji} ${statusConf.label}  →  ${product ? product.name : "（未割当）"}`;
      }),
      ``,
      `合計: ${filteredTags.length}枚`,
    ];
    return lines.join("\n");
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
    removed: tags.filter((t) => t.status === "removed").length,
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

      {/* サマリー */}
      <div style={{
        padding: 14, background: C.card, borderRadius: 12,
        border: `1px solid ${C.border}`, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[
            { label: "全タグ", value: counts.all, color: C.primary },
            { label: "紐付済", value: counts.attached, color: C.success },
            { label: "スキャン済", value: counts.removed, color: C.danger },
            { label: "未割当", value: counts.unassigned, color: C.textSub },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* アクションボタン */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setShowGenerate(true)} style={{
          flex: 1, padding: "12px", border: "none", borderRadius: 12,
          background: C.primary, color: "#fff",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          ＋ タグ生成
        </button>
        <button onClick={() => setShowExport(true)} style={{
          flex: 1, padding: "12px", border: `1.5px solid ${C.border}`,
          borderRadius: 12, background: C.card, color: C.text,
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          📄 テキスト出力
        </button>
      </div>

      {/* フィルター */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {[
          { key: "all", label: `すべて (${counts.all})` },
          { key: "unassigned", label: `⚪ 未割当 (${counts.unassigned})` },
          { key: "attached", label: `🟢 紐付済 (${counts.attached})` },
          { key: "removed", label: `🔴 スキャン済 (${counts.removed})` },
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
            ? "タグがありません。「タグ生成」で作成してください。"
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

      {/* ======== タグ生成モーダル ======== */}
      {showGenerate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setShowGenerate(false)}>
          <div style={{
            width: "90%", maxWidth: 360, background: "#fff", borderRadius: 16, padding: 24,
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>
              🏷️ タグを生成
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                生成枚数
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  style={{
                    width: 80, padding: "10px 12px", border: `1px solid ${C.border}`,
                    borderRadius: 8, fontSize: 16, fontWeight: 700, textAlign: "center",
                    outline: "none", color: C.text,
                  }}
                />
                <span style={{ fontSize: 13, color: C.textSub }}>枚</span>
              </div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 6 }}>
                QRO-{String((tags.length > 0 ? Math.max(...tags.map(t => {
                  const m = t.tag_code.match(/QRO-(\d+)/);
                  return m ? parseInt(m[1], 10) : 0;
                })) + 1 : 1)).padStart(3, "0")}
                〜 が自動採番されます
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowGenerate(false)} style={{
                flex: 1, padding: "12px", border: `1px solid ${C.border}`,
                borderRadius: 12, background: C.card, color: C.textSub,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>キャンセル</button>
              <button onClick={handleGenerate} disabled={generating} style={{
                flex: 1, padding: "12px", border: "none",
                borderRadius: 12, background: generating ? "#d1d5db" : C.primary, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: generating ? "default" : "pointer",
              }}>
                {generating ? "生成中..." : `${generateCount}枚 生成`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== テキスト出力モーダル ======== */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={() => { setShowExport(false); setCopied(false); }}>
          <div style={{
            width: "100%", maxWidth: 420, background: "#fff",
            borderRadius: "20px 20px 0 0", padding: "20px 20px 28px",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>📄 テキスト出力</h3>
              <button onClick={() => { setShowExport(false); setCopied(false); }}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textSub }}>✕</button>
            </div>

            {/* 一覧テキスト */}
            <div style={{
              padding: 14, background: C.bg, borderRadius: 12,
              fontFamily: "monospace", fontSize: 11, lineHeight: 1.8,
              whiteSpace: "pre-wrap", color: "#333", maxHeight: 200, overflowY: "auto",
              marginBottom: 12,
            }}>
              {generateExportText("full")}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => copyText(generateExportText("full"))} style={{
                flex: 1, padding: "12px", border: "none", borderRadius: 12,
                background: copied ? C.success : C.primary, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {copied ? "✅ コピー済み！" : "📋 一覧をコピー"}
              </button>
              <button onClick={() => copyText(generateExportText("codes_only"))} style={{
                flex: 1, padding: "12px", border: `1.5px solid ${C.border}`,
                borderRadius: 12, background: C.card, color: C.text,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                🏷️ コードだけコピー
              </button>
            </div>

            <div style={{
              padding: 10, background: C.warnLight, borderRadius: 8,
              border: `1px solid ${C.warnBorder}`,
            }}>
              <p style={{ fontSize: 11, color: C.warnDark, margin: 0, lineHeight: 1.6 }}>
                💡 「コードだけコピー」でタグコード一覧をコピーし、QRコード生成サイトで一括作成できます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
