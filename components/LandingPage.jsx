"use client";
import { useEffect, useRef } from "react";
import "./landing.css";

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
            <p className="hero-note">※ クレジットカード不要・3/31まで限定で完全無料</p>
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
          {/* Desktop: table */}
          <div className="comparison-table-wrap anim comparison-desktop">
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
          {/* Mobile: cards */}
          <div className="comparison-mobile anim">
            {[
              ["月額料金", "¥0", "¥5,000〜30,000", "¥0〜¥9,800"],
              ["棚卸し作業", "毎月必要", "毎月必要", "不要", true],
              ["発注リスト自動作成", "✕", "✕", "✓", true],
              ["導入の手軽さ", "すぐ", "数週間", "即日", true],
              ["入力作業", "手入力", "施術ごとに入力", "スキャンのみ", true],
            ].map(([label, a, b, c, highlight], i) => (
              <div className="comp-card" key={i}>
                <div className="comp-card-label">{label}</div>
                <div className="comp-card-row">
                  <div className="comp-card-item">
                    <span className="comp-card-method">手書き / Excel</span>
                    <span className={`comp-card-value ${highlight ? "cross" : ""}`}>{a}</span>
                  </div>
                  <div className="comp-card-item">
                    <span className="comp-card-method">POS一体型</span>
                    <span className={`comp-card-value ${highlight ? "cross" : ""}`}>{b}</span>
                  </div>
                  <div className="comp-card-item comp-card-highlight">
                    <span className="comp-card-method">在庫番</span>
                    <span className={`comp-card-value ${highlight ? "check" : ""}`}>{c}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing (B案: CTA統一) ═══ */}
      <section className="section pricing" id="pricing">
        <div className="container">
          <div className="pricing-header anim">
            <span className="section-label">料金プラン</span>
            <h2 className="section-title">まずは無料で、試してみてください</h2>
            <p className="section-desc">3/31までの登録でクレジットカード不要、30商品まで無料でお使いいただけます。商品数が増えたらアプリ内でいつでもアップグレードできます。</p>
            {/* ★ 3/31期間限定バッジ（完全静的 = ハイドレーションエラーなし） */}
            <div className="campaign-badge">
              <span className="campaign-badge-dot" />
              <span className="campaign-badge-text">🎉 3/31まで — エントリープラン無料キャンペーン中！</span>
            </div>
          </div>

          {/* ★ B案: メインCTAを1つに集約 */}
          <div className="pricing-main-cta anim">
            <a href={APP_URL} className="btn-pricing-cta">
              無料アカウントを作成する →
            </a>
            <p className="pricing-cta-note">※ クレジットカード不要・30秒で登録完了</p>
          </div>

          <div className="pricing-grid-4">
            {[
              { name: "エントリー", sku: "30 商品まで", price: "500", period: "/ 月（税別）", tags: "QRタグ 36枚付き", features: ["QRスキャン", "発注リスト自動作成", "LINE送信", "メールサポート"], popular: false, promo: true },
              { name: "ライト", sku: "100 商品まで", price: "2,980", period: "/ 月（税別）", tags: "QRタグ 120枚付き", features: ["QRスキャン", "発注リスト自動作成", "LINE送信", "メールサポート"], popular: false, promo: false },
              { name: "スタンダード", sku: "300 商品まで", price: "5,980", period: "/ 月（税別）", tags: "QRタグ 360枚付き", features: ["QRスキャン", "発注リスト自動作成", "LINE送信", "メールサポート"], popular: true, promo: false },
              { name: "プロ", sku: "500 商品まで", price: "9,800", period: "/ 月（税別）", tags: "QRタグ 600枚付き", features: ["QRスキャン", "発注リスト自動作成", "LINE送信", "メールサポート"], popular: false, promo: false },
            ].map((plan, i) => (
              <div className={`pricing-card anim${plan.popular ? " popular" : ""}${plan.promo ? " promo" : ""}`} key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                {plan.popular && <div className="pricing-popular-badge">おすすめ</div>}
                {plan.promo && <div className="pricing-promo-badge">🔥 3/31まで無料！</div>}
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-sku">{plan.sku}</div>
                <div className="pricing-price">
                  {plan.promo ? (
                    <><span className="price-original"><span className="yen">¥</span>{plan.price}</span><span className="free-label">¥0</span></>
                  ) : (
                    <><span className="yen">¥</span>{plan.price}</>
                  )}
                </div>
                <div className="pricing-period">{plan.promo ? "4/1以降 ¥500 / 月" : plan.period}</div>
                <div className="pricing-tags">{plan.tags}</div>
                <ul className="pricing-features">
                  {plan.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="pricing-upgrade-note anim">アップグレード・ダウングレードはアプリ内からいつでも変更できます。</p>
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
                お知り合いのサロンをご紹介いただくと、<strong>紹介した方もされた方も月額500円OFF</strong>、
                永続適用されます。
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
            <p className="cta-desc">3/31までの登録でエントリープラン（30商品）が無料。クレジットカードの登録も不要です。</p>
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
