"use client";
import { useEffect, useRef } from "react";

// ── Color Tokens ──
const V = {
  ink: "#0f172a",
  inkSub: "#475569",
  inkMuted: "#94a3b8",
  bg: "#fafbfd",
  surface: "#ffffff",
  border: "#e2e8f0",
  accent: "#0d9488",
  accentLight: "#ccfbf1",
  accentDark: "#0f766e",
  accentGlow: "rgba(13,148,136,0.12)",
  warm: "#f59e0b",
  warmLight: "#fef3c7",
  danger: "#e11d48",
  dangerLight: "#fff1f2",
};

// ── Scroll Animation Hook ──
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll(".anim");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── FAQ Item ──
function FaqItem({ q, a }) {
  const handleClick = (e) => {
    const item = e.currentTarget.parentElement;
    const wasOpen = item.classList.contains("open");
    item.parentElement.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  };
  return (
    <div className="faq-item">
      <button className="faq-q" onClick={handleClick}>{q}</button>
      <div className="faq-a"><p>{a}</p></div>
    </div>
  );
}

// ── Main Component ──
export default function LandingPage() {
  const rootRef = useScrollReveal();

  useEffect(() => {
    const onScroll = () => {
      const nav = document.getElementById("lp-nav");
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => {
    document.getElementById("lp-nav-links")?.classList.toggle("open");
  };
  const closeMenu = () => {
    document.getElementById("lp-nav-links")?.classList.remove("open");
  };

  const APP_URL = "/app";
  const FORM_URL = "https://forms.gle/KYf2N99PYUg1c4ke7";

  return (
    <div ref={rootRef}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet" />
      <style>{lpStyles}</style>

      {/* ═══ Navigation ═══ */}
      <nav className="lp-nav" id="lp-nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">📦</div>
            <span className="nav-logo-text">在庫番</span>
          </a>
          <button className="nav-mobile-toggle" onClick={toggleMenu} aria-label="メニュー">
            <span /><span /><span />
          </button>
          <ul className="nav-links" id="lp-nav-links">
            <li><a href="#features" onClick={closeMenu}>特徴</a></li>
            <li><a href="#how" onClick={closeMenu}>使い方</a></li>
            <li><a href="#pricing" onClick={closeMenu}>料金</a></li>
            <li><a href="#faq" onClick={closeMenu}>FAQ</a></li>
            <li><a href="#contact" onClick={closeMenu}>お問い合わせ</a></li>
            <li><a href={APP_URL} className="nav-cta">ログイン</a></li>
          </ul>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">美容室・エステサロン専用の在庫管理</div>
            <h1>月次の棚卸し、<br /><em>やめられます。</em></h1>
            <div className="hero-steps">
              <div className="hero-step-item">
                <span className="hero-step-num">1</span>
                <span>カラー剤にQRタグを<strong>ゴム紐で引っかける</strong></span>
              </div>
              <div className="hero-step-item">
                <span className="hero-step-num">2</span>
                <span>開封するときタグを外して、<strong>カゴに集める</strong></span>
              </div>
              <div className="hero-step-item">
                <span className="hero-step-num">3</span>
                <span>閉店前にスマホで<strong>タグを読む</strong></span>
              </div>
            </div>
            <p className="hero-sub-line">これだけで、在庫確認の残業から解放されます。</p>
            <div className="hero-actions">
              <a href={APP_URL} className="btn-primary">無料で始める →</a>
              <a href="#how" className="btn-secondary">仕組みを見る</a>
            </div>
            <p className="hero-note">※ クレジットカード不要・先着100名は完全無料</p>
          </div>
          <div className="hero-visual">
            <div className="hero-phone">
              <div className="hero-phone-screen">
                <div className="phone-status-bar"><div className="phone-notch" /></div>
                <div className="phone-header">
                  <span className="phone-header-icon">🏷️</span>
                  <span className="phone-header-text">在庫番</span>
                </div>
                <div className="phone-body">
                  <div className="phone-scan-btn">📷 QRスキャン</div>
                  {[
                    { name: "イルミナカラー オーシャン 6", meta: "カラー剤 · 棚A上段", qty: "×2", color: "#e11d48" },
                    { name: "アディクシー グレーパール 7", meta: "カラー剤 · 棚A上段", qty: "×2", color: "#f59e0b" },
                    { name: "オルディーブ シーディル C-8", meta: "カラー剤 · 棚A中段", qty: "×3", color: "#8b5cf6" },
                  ].map((item, i) => (
                    <div className="phone-item" key={i}>
                      <div className="phone-item-dot" style={{ background: item.color }} />
                      <div className="phone-item-text">
                        <div className="phone-item-name">{item.name}</div>
                        <div className="phone-item-meta">{item.meta}</div>
                      </div>
                      <div className="phone-item-qty">{item.qty}</div>
                    </div>
                  ))}
                  <div style={{ padding: 10, background: "#06c755", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: "auto" }}>
                    💬 LINEで発注リストを送信
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-float-tag">
              <span className="tag-icon">🏷️</span>
              <span className="tag-text">ゴム紐でチューブに引っかけるだけ！</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Pain Points ═══ */}
      <section className="section pain" id="pain">
        <div className="container">
          <div className="pain-header anim">
            <span className="section-label">よくあるお悩み</span>
            <h2 className="section-title">その在庫管理、まだ手作業ですか？</h2>
            <p className="section-desc">美容室・エステサロンの在庫管理に共通する3つの課題。あなたのサロンにも心当たりはありませんか？</p>
          </div>
          <div className="pain-grid">
            {[
              { icon: "🌙", title: "深夜の棚卸し地獄", desc: "閉店後に100〜200種類のカラー剤を数える。月末の恒例行事とわかっていても、ため息が出る作業です。" },
              { icon: "⚠️", title: "欠品で施術できない", desc: "「あの色、もうなかった…」お客様を目の前に、代替カラーで対応するしかない。カラー1回分の売上は約1万円。たった1本の欠品が、信頼と売上の両方を奪います。" },
              { icon: "💸", title: "発注の伝達ミス・過剰在庫", desc: "口頭やメモでの発注連絡で漏れが発生。不安から多めに頼んで、気づけば棚がパンパンに。" },
            ].map((p, i) => (
              <div className="pain-card anim" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="pain-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="pain-ai-callout anim">
            <div className="pain-ai-icon">🤖</div>
            <div className="pain-ai-text">
              <strong>AIが安全在庫を提案</strong>
              <span>過去の消費ペースをもとに、商品ごとの「あと何本で発注すべきか」をAIが自動で提案。勘に頼らない発注点の設定を実現します。</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="section" id="how">
        <div className="container">
          <div className="how-header anim">
            <span className="section-label">仕組み</span>
            <h2 className="section-title">QRタグで発注を「自動化」する仕組み</h2>
            <p className="section-desc">カンバン方式をデジタル化。在庫を数えず、発注タイミングだけを検知します。</p>
          </div>
          <div className="how-steps">
            {[
              { icon: "🏷️", title: "タグをゴム紐で付ける", desc: "商品の後ろからN本目にQRタグをゴム紐で引っかけます。これが「発注点」です。" },
              { icon: "📦", title: "開封してタグを外す", desc: "タグ付き商品を開封＝発注点に到達。タグを外してカゴに入れるだけ。" },
              { icon: "📷", title: "まとめてスキャン", desc: "手が空いた時にカゴのタグをスキャン。発注リストに自動追加されます。" },
              { icon: "💬", title: "LINEで発注", desc: "完成したリストをLINEでディーラーに送信。転記ミスゼロ、聞き間違いゼロ。" },
            ].map((s, i) => (
              <div className="how-step anim" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="step-number">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="section features" id="features">
        <div className="container">
          <div className="features-header anim">
            <span className="section-label">特徴</span>
            <h2 className="section-title">現場で使える、5つのこだわり</h2>
            <p className="section-desc">施術の手を止めない。入力作業ゼロ。美容室・エステサロンの現場から逆算して設計しました。</p>
          </div>
          <div className="features-grid">
            {[
              { icon: "🚫", title: "在庫を数えない設計", desc: "理論在庫の追跡を捨て、「発注が必要なタイミング」だけを物理タグで検知する新発想。" },
              { icon: "📱", title: "スマホだけで完結", desc: "専用アプリのインストール不要。ブラウザでQRスキャンから発注まですべて完結します。" },
              { icon: "👥", title: "スタッフ全員で共有", desc: "1アカウントをスタッフで共有。誰がスキャンしても同じ発注リストに反映されます。" },
              { icon: "💬", title: "LINEでそのまま発注", desc: "発注リストをワンタップでLINEに送信。ディーラーさんにそのまま送れるテキスト形式。" },
              { icon: "🏷️", title: "耐水QRタグをお届け", desc: "耐水性のユポ紙製QRタグをゴム紐付きで郵送。届いたら商品に引っかけるだけですぐ使えます。" },
            ].map((f, i) => (
              <div className="feature-card anim" key={i} style={{ transitionDelay: `${(i % 2) * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Comparison ═══ */}
      <section className="section">
        <div className="container">
          <div className="comparison-header anim">
            <span className="section-label">比較</span>
            <h2 className="section-title">既存の方法と、何が違うのか</h2>
          </div>
          <div className="comparison-table-wrap anim">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th></th>
                  <th>手書き / Excel</th>
                  <th>POS一体型</th>
                  <th className="col-highlight">在庫番</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["月額料金", "¥0", "¥5,000〜30,000", "¥0〜¥9,800"],
                  ["棚卸し作業", "毎月必要", "毎月必要", "不要", true],
                  ["発注リスト自動作成", "✕", "✕", "✓", true],
                  ["導入の手軽さ", "すぐ", "数週間", "即日", true],
                  ["入力作業", "手入力", "施術ごとに入力", "スキャンのみ", true],
                ].map(([label, a, b, c, highlight], i) => (
                  <tr key={i}>
                    <td>{label}</td>
                    <td><span className={highlight ? "cross" : ""}>{a}</span></td>
                    <td><span className={highlight ? "cross" : ""}>{b}</span></td>
                    <td className="col-highlight"><span className={highlight ? "check" : ""}>{c}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="pricing-header anim">
            <span className="section-label">料金プラン</span>
            <h2 className="section-title">まずは無料で、試してみてください</h2>
            <p className="section-desc">管理する商品数に応じたシンプルな料金体系。すべての機能が使えます。</p>
          </div>
          <div className="pricing-grid-4">
            {[
              { name: "エントリー", sku: "〜30 商品", price: "500", period: "/ 月（税別）", tags: "QRタグ 36枚付き", features: ["QRスキャン", "発注リスト自動作成", "LINE送信", "メールサポート"], popular: false, referral: "紹介経由で ¥0", promo: true },
              { name: "ライト", sku: "〜100 商品", price: "2,980", period: "/ 月（税別）", tags: "QRタグ 120枚付き", features: ["エントリーの全機能", "メールサポート"], popular: false, referral: "紹介経由で ¥2,480", promo: false },
              { name: "スタンダード", sku: "〜300 商品", price: "5,980", period: "/ 月（税別）", tags: "QRタグ 360枚付き", features: ["エントリーの全機能", "優先サポート"], popular: true, referral: "紹介経由で ¥5,480", promo: false },
              { name: "プロ", sku: "〜500 商品", price: "9,800", period: "/ 月（税別）", tags: "QRタグ 600枚付き", features: ["エントリーの全機能", "優先サポート"], popular: false, referral: "紹介経由で ¥9,300", promo: false },
            ].map((plan, i) => (
              <div className={`pricing-card anim${plan.popular ? " popular" : ""}${plan.promo ? " promo" : ""}`} key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                {plan.popular && <div className="pricing-popular-badge">おすすめ</div>}
                {plan.promo && <div className="pricing-promo-badge">🔥 先着100名 無料！残り100名</div>}
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-sku">{plan.sku}</div>
                <div className="pricing-price">
                  {plan.promo ? (
                    <><span className="price-original"><span className="yen">¥</span>{plan.price}</span><span className="free-label">¥0</span></>
                  ) : (
                    <><span className="yen">¥</span>{plan.price}</>
                  )}
                </div>
                <div className="pricing-period">{plan.promo ? "先着終了後 ¥500 / 月" : plan.period}</div>
                <div className="pricing-tags">{plan.tags}</div>
                <ul className="pricing-features">
                  {plan.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                {plan.referral && <!--<div className="pricing-referral">🎁 {plan.referral}</div>-->}
                <a href={APP_URL} className={`pricing-btn ${plan.popular ? "pricing-btn-primary" : plan.promo ? "pricing-btn-promo" : "pricing-btn-outline"}`}>
                  {plan.promo ? "無料で始める →" : "プランを選択"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Referral Program ═══ */}
      <section className="section referral-section">
        <div className="container">
          <div className="referral-card anim">
            <div className="referral-icon">🎁</div>
            <div className="referral-content">
              <h2 className="referral-title">紹介プログラム</h2>
              <p className="referral-desc">
                お知り合いのサロンをご紹介いただくと、<strong>紹介された方は月額500円OFF</strong>、
                <strong>紹介した方も毎月500円OFF</strong>が永続適用されます。
              </p>
              <div className="referral-steps-row">
                <div className="referral-step">
                  <div className="referral-step-num">1</div>
                  <span>マイページから紹介リンクを発行</span>
                </div>
                <div className="referral-arrow">→</div>
                <div className="referral-step">
                  <div className="referral-step-num">2</div>
                  <span>リンクをLINEやSNSでシェア</span>
                </div>
                <div className="referral-arrow">→</div>
                <div className="referral-step">
                  <div className="referral-step-num">3</div>
                  <span>相手が有料プランに登録で双方割引</span>
                </div>
              </div>
              <p className="referral-note">※ 紹介人数に上限はありません。紹介が増えるほど月額が安くなります。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="section" id="faq">
        <div className="container">
          <div className="faq-header anim">
            <span className="section-label">よくある質問</span>
            <h2 className="section-title">FAQ</h2>
          </div>
          <div className="faq-list">
            {[
              ["QRタグとは何ですか？どうやって使うの？", "耐水性のユポ紙（3cm×5.5cm）にQRコードを印刷した小さなタグです。ゴム紐が付いており、カラー剤のチューブや箱に引っかけて使います。商品の後ろからN本目に付けておき、その商品を開封した時にタグを外してカゴに入れます。後でまとめてスマホでスキャンすると、発注リストに自動追加されます。"],
              ["アプリのインストールは必要ですか？", "いいえ、不要です。スマートフォンのブラウザ（Safari/Chrome）からそのままお使いいただけます。ホーム画面に追加すれば、アプリのように使えます。"],
              ["施術中にスキャンする必要がありますか？", "いいえ。タグ付き商品を開封したら、タグを外してカゴに入れるだけです。スキャンは手が空いた時にまとめて行えます。施術の流れを妨げません。"],
              ["スタッフ全員にアカウントが必要？", "いいえ。1店舗につき1アカウントです。スタッフ全員で同じアカウントを共有するので、追加料金はかかりません。"],
              ["カラー剤以外にも使えますか？", "はい。シャンプー、トリートメント、2剤、スタイリング剤、エステの施術用オイルやパック剤など、繰り返し発注が必要な商品すべてにお使いいただけます。"],
              ["エステサロンでも使えますか？", "はい。オイル、クリーム、パック剤などのボトルやチューブにゴム紐で取り付けられるため、エステサロンでもそのままお使いいただけます。"],
              ["解約はすぐにできますか？", "はい。管理画面からいつでも解約できます。解約後はエントリープラン（30商品）に切り替わります。解約手数料は一切かかりません。"],
              ["QRタグを紛失した場合はどうすれば？", "予備タグを多めにお届けしています。予備が切れた場合は追加注文が可能です。緊急時はWebページから普通紙に印刷して応急的にお使いいただけます。"],
            ].map(([q, a], i) => (
              <div className="anim" key={i} style={{ transitionDelay: `${i * 0.05}s` }}>
                <FaqItem q={q} a={a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="section cta-section">
        <div className="container">
          <div className="anim">
            <h2 className="cta-title">棚卸しのない日常を、<br />今日から始めよう</h2>
            <p className="cta-desc">先着100名はエントリープラン（30商品）が永久無料。クレジットカードの登録も不要です。</p>
            <a href={APP_URL} className="btn-cta-white">無料アカウントを作成 →</a>
            <p className="cta-sub">※ 30秒で登録完了。いつでも解約可能。</p>
          </div>
        </div>
      </section>

      {/* ═══ Contact ═══ */}
      <section className="section" id="contact">
        <div className="container">
          <div className="contact-header anim">
            <span className="section-label">お問い合わせ</span>
            <h2 className="section-title">お気軽にご連絡ください</h2>
            <p className="section-desc">導入のご相談やご質問など、何でもお気軽にどうぞ。</p>
          </div>
          <div className="contact-grid">
            <div className="contact-card anim">
              <div className="contact-icon" style={{ background: "#dcfce7" }}>💬</div>
              <h3>LINEで相談</h3>
              <p>友だち追加ですぐにチャットで相談できます。お気軽にどうぞ。</p>
              <a href="#" className="contact-btn btn-line">LINEで友だち追加</a>
            </div>
            <div className="contact-card anim" style={{ transitionDelay: "0.1s" }}>
              <div className="contact-icon" style={{ background: "#dbeafe" }}>📝</div>
              <h3>フォームで問い合わせ</h3>
              <p>24時間受付。通常1営業日以内にご返信いたします。</p>
              <a href={FORM_URL} target="_blank" rel="noopener noreferrer" className="contact-btn btn-mail">お問い合わせフォーム</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="lp-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="footer-logo-icon">📦</div>
            <span className="footer-logo-text">在庫番</span>
          </div>
          <ul className="footer-links">
            <li><a href="#features">特徴</a></li>
            <li><a href="#pricing">料金</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact">お問い合わせ</a></li>
            <li><a href="/legal">運営者情報</a></li>
          </ul>
          <div className="footer-trademark">※ QRコードは株式会社デンソーウェーブの登録商標です。</div>
          <div className="footer-copy">© 2026 株式会社コクシ・ムソー / 在庫番（zaiko-ban.com）</div>
        </div>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════
// CSS
// ══════════════════════════════════════════
const lpStyles = `
/* ── Reset ── */
.lp-nav, .lp-nav *, .hero, .hero *, .section, .section *, .lp-footer, .lp-footer * {
  margin: 0; padding: 0; box-sizing: border-box;
}
body {
  font-family: 'Noto Sans JP', sans-serif;
  background: #fafbfd;
  color: #0f172a;
  line-height: 1.8;
  font-size: 15px;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
html { scroll-behavior: smooth; }

/* ── Utility ── */
.container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.section { padding: 96px 0; }
@media (max-width: 768px) { .section { padding: 64px 0; } }

.section-label {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: 0.15em;
  text-transform: uppercase; color: ${V.accent}; margin-bottom: 12px; display: block;
}
.section-title {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif;
  font-size: clamp(24px, 4vw, 36px); font-weight: 900; line-height: 1.35; color: ${V.ink}; margin-bottom: 16px;
}
.section-desc { font-size: 15px; color: ${V.inkSub}; max-width: 600px; line-height: 1.9; }

/* ── Animations ── */
@keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
@keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
.anim {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
}
.anim.visible { opacity: 1; transform: translateY(0); }

/* ── Nav ── */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(250,251,253,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(226,232,240,0.6); transition: box-shadow 0.3s;
}
.lp-nav.scrolled { box-shadow: 0 2px 20px rgba(15,23,42,0.06); }
.nav-inner {
  max-width: 1080px; margin: 0 auto; padding: 0 24px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.nav-logo-icon {
  width: 36px; height: 36px; background: ${V.accent}; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff;
}
.nav-logo-text {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif;
  font-size: 18px; font-weight: 900; color: ${V.ink};
}
.nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
.nav-links a { font-size: 13px; font-weight: 600; color: ${V.inkSub}; text-decoration: none; transition: color 0.2s; }
.nav-links a:hover { color: ${V.accent}; }
.nav-cta {
  padding: 9px 22px !important; background: ${V.accent}; color: #fff !important;
  border-radius: 8px; font-weight: 700 !important; transition: background 0.2s, transform 0.15s;
}
.nav-cta:hover { background: ${V.accentDark}; transform: translateY(-1px); }
.nav-mobile-toggle { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
.nav-mobile-toggle span { display: block; width: 22px; height: 2px; background: ${V.ink}; margin: 5px 0; border-radius: 2px; }
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-links.open {
    display: flex; flex-direction: column; position: absolute; top: 64px; left: 0; right: 0;
    background: ${V.surface}; border-bottom: 1px solid ${V.border}; padding: 20px 24px; gap: 16px;
    box-shadow: 0 4px 20px rgba(15,23,42,0.08);
  }
  .nav-mobile-toggle { display: block; }
}

/* ── Hero ── */
.hero { padding: 140px 0 100px; position: relative; overflow: hidden; }
.hero::before {
  content: ''; position: absolute; top: -200px; right: -200px; width: 600px; height: 600px;
  background: radial-gradient(circle, ${V.accentGlow} 0%, transparent 70%); pointer-events: none;
}
.hero-inner {
  max-width: 1080px; margin: 0 auto; padding: 0 24px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
}
.hero-text { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
  background: ${V.accentLight}; color: ${V.accentDark}; border-radius: 99px;
  font-size: 12px; font-weight: 700; margin-bottom: 24px;
}
.hero-badge::before { content: ''; width: 6px; height: 6px; background: ${V.accent}; border-radius: 50%; }
.hero h1 {
  font-family: 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif;
  font-size: clamp(28px, 5vw, 46px); font-weight: 900; line-height: 1.3;
  margin-bottom: 24px; letter-spacing: -0.02em;
}
.hero h1 em { font-style: normal; color: ${V.accent}; position: relative; }
.hero h1 em::after {
  content: ''; position: absolute; bottom: 2px; left: 0; right: 0; height: 8px;
  background: ${V.accentLight}; z-index: -1; border-radius: 4px;
}

/* Hero 3-step */
.hero-steps { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.hero-step-item {
  display: flex; align-items: center; gap: 12px;
  font-size: 15px; color: ${V.inkSub}; line-height: 1.7;
}
.hero-step-item strong { color: ${V.ink}; }
.hero-step-num {
  width: 28px; height: 28px; border-radius: 50%; background: ${V.accent}; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; flex-shrink: 0;
}
.hero-sub-line {
  font-size: 16px; color: ${V.ink}; font-weight: 700; margin-bottom: 32px;
  padding-left: 40px;
}

.hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px;
  background: ${V.accent}; color: #fff; border: none; border-radius: 10px;
  font-family: 'Noto Sans JP', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; text-decoration: none; transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(13,148,136,0.3);
}
.btn-primary:hover { background: ${V.accentDark}; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(13,148,136,0.35); }
.btn-secondary {
  display: inline-flex; align-items: center; gap: 8px; padding: 16px 28px;
  background: ${V.surface}; color: ${V.ink}; border: 1.5px solid ${V.border}; border-radius: 10px;
  font-family: 'Noto Sans JP', sans-serif; font-size: 15px; font-weight: 600;
  cursor: pointer; text-decoration: none; transition: all 0.2s;
}
.btn-secondary:hover { border-color: ${V.accent}; color: ${V.accent}; transform: translateY(-1px); }
.hero-note { margin-top: 16px; font-size: 12px; color: ${V.inkMuted}; }

.hero-visual { animation: fadeUp 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both; position: relative; }
.hero-phone {
  width: 280px; margin: 0 auto; background: #111827; border-radius: 36px; padding: 12px;
  box-shadow: 0 12px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.1) inset;
}
.hero-phone-screen { background: ${V.bg}; border-radius: 26px; overflow: hidden; aspect-ratio: 9/16; display: flex; flex-direction: column; }
.phone-status-bar { padding: 10px 20px 6px; background: ${V.surface}; display: flex; justify-content: center; }
.phone-notch { width: 80px; height: 4px; background: #d1d5db; border-radius: 4px; }
.phone-header { padding: 10px 16px; background: ${V.surface}; border-bottom: 1px solid ${V.border}; display: flex; align-items: center; gap: 8px; }
.phone-header-icon { font-size: 14px; }
.phone-header-text { font-size: 12px; font-weight: 700; color: ${V.ink}; }
.phone-body { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
.phone-scan-btn { padding: 10px; background: ${V.accent}; color: #fff; border-radius: 10px; font-size: 11px; font-weight: 700; text-align: center; }
.phone-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: ${V.surface}; border-radius: 8px; border: 1px solid ${V.border}; }
.phone-item-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.phone-item-text { flex: 1; }
.phone-item-name { font-size: 10px; font-weight: 600; color: ${V.ink}; }
.phone-item-meta { font-size: 8px; color: ${V.inkMuted}; }
.phone-item-qty { font-size: 10px; font-weight: 700; color: ${V.accent}; }
.hero-float-tag {
  position: absolute; top: 20%; right: -30px; background: ${V.surface};
  border: 1.5px solid ${V.accent}; border-radius: 12px; padding: 10px 14px;
  box-shadow: 0 4px 20px rgba(15,23,42,0.08); animation: float 3s ease-in-out infinite;
  display: flex; align-items: center; gap: 8px;
}
.tag-icon { font-size: 20px; }
.tag-text { font-size: 11px; font-weight: 700; color: ${V.accentDark}; white-space: nowrap; }
@media (max-width: 768px) {
  .hero { padding: 110px 0 60px; }
  .hero-inner { grid-template-columns: 1fr; gap: 40px; text-align: left; }
  .hero-actions { justify-content: flex-start; }
  .hero-visual { order: -1; }
  .hero-phone { width: 240px; }
  .hero-float-tag { right: 10%; top: 10%; }
  .hero-sub-line { padding-left: 0; }
}

/* ── Pain ── */
.pain { background: ${V.surface}; border-top: 1px solid ${V.border}; border-bottom: 1px solid ${V.border}; }
.pain-header, .how-header, .features-header, .comparison-header, .pricing-header, .faq-header, .contact-header {
  text-align: center; margin-bottom: 48px;
}
.pain-header .section-desc, .how-header .section-desc, .features-header .section-desc,
.pricing-header .section-desc, .contact-header .section-desc { margin: 0 auto; }
.pain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.pain-card {
  padding: 28px 24px; border-radius: 16px; border: 1px solid ${V.border}; background: ${V.bg};
  transition: transform 0.2s, box-shadow 0.2s;
}
.pain-card:hover { transform: translateY(-3px); box-shadow: 0 4px 20px rgba(15,23,42,0.08); }
.pain-icon {
  width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center;
  justify-content: center; font-size: 22px; margin-bottom: 16px;
}
.pain-card:nth-child(1) .pain-icon { background: ${V.dangerLight}; }
.pain-card:nth-child(2) .pain-icon { background: ${V.warmLight}; }
.pain-card:nth-child(3) .pain-icon { background: #ede9fe; }
.pain-card h3 { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 8px; }
.pain-card p { font-size: 13px; color: ${V.inkSub}; line-height: 1.8; }
@media (max-width: 768px) { .pain-grid { grid-template-columns: 1fr; } }

/* Pain AI Callout */
.pain-ai-callout {
  margin-top: 32px; display: flex; align-items: flex-start; gap: 16px;
  padding: 24px 28px; border-radius: 16px;
  background: linear-gradient(135deg, ${V.accentLight} 0%, #f0fdfa 100%);
  border: 1.5px solid ${V.accent}20;
}
.pain-ai-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
.pain-ai-text { display: flex; flex-direction: column; gap: 4px; }
.pain-ai-text strong { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 15px; font-weight: 800; color: ${V.accentDark}; }
.pain-ai-text span { font-size: 13px; color: ${V.inkSub}; line-height: 1.8; }

/* ── How ── */
.how-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; position: relative; }
.how-steps::before {
  content: ''; position: absolute; top: 48px; left: 12.5%; right: 12.5%; height: 2px;
  background: linear-gradient(90deg, ${V.accentLight}, ${V.accent}, ${V.accentLight}); z-index: 0;
}
.how-step { text-align: center; position: relative; z-index: 1; }
.step-number {
  width: 56px; height: 56px; margin: 0 auto 18px; background: ${V.surface};
  border: 2.5px solid ${V.accent}; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 28px; position: relative;
}
.step-number::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; background: ${V.accentGlow}; z-index: -1; }
.how-step h3 { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 8px; }
.how-step p { font-size: 13px; color: ${V.inkSub}; line-height: 1.7; }
@media (max-width: 768px) { .how-steps { grid-template-columns: 1fr 1fr; gap: 32px 20px; } .how-steps::before { display: none; } }
@media (max-width: 480px) { .how-steps { grid-template-columns: 1fr; } }

/* ── Features ── */
.features { background: ${V.surface}; border-top: 1px solid ${V.border}; border-bottom: 1px solid ${V.border}; }
.features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.feature-card {
  padding: 28px 26px; border-radius: 16px; border: 1px solid ${V.border}; background: ${V.bg};
  display: flex; gap: 18px; transition: transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover { transform: translateY(-2px); box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
.feature-icon {
  width: 44px; height: 44px; border-radius: 11px; background: ${V.accentLight};
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.feature-card h3 { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 6px; }
.feature-card p { font-size: 13px; color: ${V.inkSub}; line-height: 1.7; }
@media (max-width: 768px) { .features-grid { grid-template-columns: 1fr; } }

/* ── Comparison ── */
.comparison-table-wrap {
  overflow-x: auto; border-radius: 16px; border: 1px solid ${V.border};
  background: ${V.surface}; box-shadow: 0 1px 3px rgba(15,23,42,0.06);
}
.comparison-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.comparison-table th, .comparison-table td { padding: 16px 20px; text-align: center; border-bottom: 1px solid ${V.border}; }
.comparison-table th {
  font-family: 'Zen Kaku Gothic New', sans-serif; font-weight: 700; font-size: 13px; background: ${V.bg};
}
.comparison-table th:first-child, .comparison-table td:first-child { text-align: left; font-weight: 600; }
.comparison-table td:last-child { color: ${V.accentDark}; font-weight: 700; }
.col-highlight { background: ${V.accentLight} !important; color: ${V.accentDark}; font-weight: 800 !important; }
.check { color: ${V.accent}; font-weight: 700; }
.cross { color: ${V.inkMuted}; }

/* ── Pricing ── */
.pricing { background: ${V.surface}; border-top: 1px solid ${V.border}; border-bottom: 1px solid ${V.border}; }
.pricing-grid-4 {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: start;
}
.pricing-card {
  padding: 26px 20px; border-radius: 16px; border: 1.5px solid ${V.border}; background: ${V.bg};
  text-align: center; transition: transform 0.2s, box-shadow 0.2s; position: relative;
}
.pricing-card:hover { transform: translateY(-4px); box-shadow: 0 4px 20px rgba(15,23,42,0.08); }
.pricing-card.popular { border-color: ${V.accent}; background: ${V.surface}; box-shadow: 0 4px 20px rgba(15,23,42,0.08); }
.pricing-card.promo { border-color: ${V.danger}; background: #fffbfb; }
.pricing-popular-badge {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 4px 16px;
  background: ${V.accent}; color: #fff; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap;
}
.pricing-promo-badge {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%); padding: 5px 18px;
  background: ${V.danger}; color: #fff; border-radius: 99px; font-size: 12px; font-weight: 800; white-space: nowrap;
  box-shadow: 0 2px 12px rgba(225,29,72,0.3);
  animation: pulse-badge 2s ease-in-out infinite;
}
@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 2px 12px rgba(225,29,72,0.3); }
  50% { box-shadow: 0 2px 20px rgba(225,29,72,0.5); }
}
.pricing-name { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 4px; }
.pricing-sku { font-size: 12px; color: ${V.inkMuted}; margin-bottom: 16px; }
.pricing-price { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 34px; font-weight: 900; color: ${V.ink}; line-height: 1; margin-bottom: 4px; display: flex; align-items: baseline; justify-content: center; gap: 8px; }
.pricing-price .yen { font-size: 17px; font-weight: 700; }
.pricing-price .free-label { font-size: 34px; color: ${V.danger}; font-weight: 900; }
.pricing-price .price-original { font-size: 16px; color: ${V.inkMuted}; text-decoration: line-through; font-weight: 500; }
.pricing-period { font-size: 11px; color: ${V.inkMuted}; margin-bottom: 12px; }
.pricing-tags { font-size: 12px; color: ${V.accentDark}; font-weight: 600; margin-bottom: 16px; padding: 6px 0; border-top: 1px solid ${V.border}; border-bottom: 1px solid ${V.border}; }
.pricing-features { list-style: none; text-align: left; margin-bottom: 16px; }
.pricing-features li { font-size: 13px; color: ${V.inkSub}; padding: 4px 0; display: flex; align-items: baseline; gap: 6px; }
.pricing-features li::before { content: '✓'; color: ${V.accent}; font-weight: 700; font-size: 11px; flex-shrink: 0; }
.pricing-referral {
  font-size: 11px; font-weight: 700; color: ${V.warm}; background: ${V.warmLight};
  padding: 6px 10px; border-radius: 8px; margin-bottom: 16px;
}
.pricing-btn {
  width: 100%; padding: 12px; border-radius: 8px; font-family: 'Noto Sans JP', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; display: block; text-align: center; transition: all 0.2s;
}
.pricing-btn-primary { background: ${V.accent}; color: #fff; border: none; }
.pricing-btn-primary:hover { background: ${V.accentDark}; }
.pricing-btn-outline { background: transparent; color: ${V.accent}; border: 1.5px solid ${V.accent}; }
.pricing-btn-outline:hover { background: ${V.accentLight}; }
.pricing-btn-promo { background: ${V.danger}; color: #fff; border: none; font-size: 14px; padding: 14px; }
.pricing-btn-promo:hover { background: #be123c; }
@media (max-width: 900px) { .pricing-grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .pricing-grid-4 { grid-template-columns: 1fr; max-width: 340px; margin: 0 auto; } }

/* ── Referral ── */
.referral-section { background: ${V.bg}; }
.referral-card {
  display: flex; gap: 28px; align-items: flex-start;
  padding: 40px 36px; border-radius: 20px;
  background: linear-gradient(135deg, ${V.warmLight} 0%, #fffbeb 50%, #fefce8 100%);
  border: 1.5px solid #fcd34d40;
  box-shadow: 0 2px 12px rgba(245,158,11,0.08);
}
.referral-icon { font-size: 40px; flex-shrink: 0; }
.referral-content { flex: 1; }
.referral-title {
  font-family: 'Zen Kaku Gothic New', sans-serif;
  font-size: 22px; font-weight: 900; color: ${V.ink}; margin-bottom: 10px;
}
.referral-desc { font-size: 15px; color: ${V.inkSub}; line-height: 1.8; margin-bottom: 24px; }
.referral-desc strong { color: ${V.ink}; }
.referral-steps-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.referral-step {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: ${V.surface}; border-radius: 10px;
  border: 1px solid ${V.border}; font-size: 13px; color: ${V.inkSub};
}
.referral-step-num {
  width: 24px; height: 24px; border-radius: 50%; background: ${V.warm}; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.referral-arrow { color: ${V.inkMuted}; font-size: 16px; font-weight: 700; }
.referral-note { font-size: 12px; color: ${V.inkMuted}; }
@media (max-width: 768px) {
  .referral-card { flex-direction: column; padding: 28px 24px; gap: 16px; }
  .referral-steps-row { flex-direction: column; align-items: stretch; }
  .referral-arrow { text-align: center; transform: rotate(90deg); }
}

/* ── FAQ ── */
.faq-list { max-width: 720px; margin: 0 auto; }
.faq-item { border-bottom: 1px solid ${V.border}; }
.faq-q {
  width: 100%; padding: 20px 0; background: none; border: none;
  font-family: 'Noto Sans JP', sans-serif; font-size: 15px; font-weight: 700; color: ${V.ink};
  text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px;
}
.faq-q::after { content: '+'; font-size: 20px; font-weight: 400; color: ${V.inkMuted}; flex-shrink: 0; transition: transform 0.3s; }
.faq-item.open .faq-q::after { transform: rotate(45deg); color: ${V.accent}; }
.faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(0.22,1,0.36,1), padding 0.35s; padding: 0; }
.faq-item.open .faq-a { max-height: 300px; padding-bottom: 20px; }
.faq-a p { font-size: 14px; color: ${V.inkSub}; line-height: 1.8; }

/* ── CTA ── */
.cta-section {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%);
  text-align: center; position: relative; overflow: hidden;
}
.cta-section::before {
  content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); pointer-events: none;
}
.cta-title {
  font-family: 'Zen Kaku Gothic New', sans-serif; font-size: clamp(24px, 4vw, 36px);
  font-weight: 900; color: #fff; margin-bottom: 16px;
}
.cta-desc { font-size: 15px; color: rgba(255,255,255,0.85); margin-bottom: 36px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.9; }
.btn-cta-white {
  display: inline-flex; align-items: center; gap: 8px; padding: 18px 40px;
  background: #fff; color: ${V.accentDark}; border: none; border-radius: 10px;
  font-family: 'Noto Sans JP', sans-serif; font-size: 16px; font-weight: 800;
  cursor: pointer; text-decoration: none; transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.cta-sub { margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.65); }

/* ── Contact ── */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 700px; margin: 0 auto; }
.contact-card {
  padding: 32px 28px; border-radius: 16px; border: 1px solid ${V.border};
  background: ${V.surface}; text-align: center; transition: transform 0.2s, box-shadow 0.2s;
}
.contact-card:hover { transform: translateY(-3px); box-shadow: 0 4px 20px rgba(15,23,42,0.08); }
.contact-icon {
  width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center;
  justify-content: center; font-size: 26px; margin: 0 auto 16px;
}
.contact-card h3 { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 8px; }
.contact-card p { font-size: 13px; color: ${V.inkSub}; margin-bottom: 20px; line-height: 1.7; }
.contact-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 12px 24px; border-radius: 8px;
  font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.2s;
}
.btn-line { background: #06c755; color: #fff; }
.btn-line:hover { background: #05b54c; }
.btn-mail { background: #2563eb; color: #fff; }
.btn-mail:hover { background: #1d4ed8; }
@media (max-width: 540px) { .contact-grid { grid-template-columns: 1fr; } }

/* ── Footer ── */
.lp-footer { padding: 48px 0 32px; border-top: 1px solid ${V.border}; }
.footer-inner {
  max-width: 1080px; margin: 0 auto; padding: 0 24px;
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
}
.footer-logo { display: flex; align-items: center; gap: 8px; }
.footer-logo-icon {
  width: 28px; height: 28px; background: ${V.accent}; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; font-size: 13px; color: #fff;
}
.footer-logo-text { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 15px; font-weight: 800; color: ${V.ink}; }
.footer-links { display: flex; gap: 24px; list-style: none; }
.footer-links a { font-size: 12px; color: ${V.inkMuted}; text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: ${V.accent}; }
.footer-trademark {
  width: 100%; text-align: center; font-size: 10px; color: ${V.inkMuted};
  margin-top: 20px; padding-top: 20px; border-top: 1px solid ${V.border};
}
.footer-copy {
  width: 100%; text-align: center; font-size: 11px; color: ${V.inkMuted}; margin-top: 8px;
}
`;
