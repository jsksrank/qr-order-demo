'use client';

import { useState } from 'react';

export default function StaffGuidePage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'QRコードが読み取れない',
      a: 'カメラとQRコードの距離を15〜20cmに調整してください。暗い場所ではスマホのライトをONにしてみてください。それでも読めない場合は、商品名で検索して手動でスキャンできます。'
    },
    {
      q: 'タグをなくした・壊れた',
      a: '予備タグがあればそれを使ってください。予備もない場合は、オーナーに伝えてください。オーナーが追加タグを注文できます。'
    },
    {
      q: '間違えてスキャンした',
      a: '発注リスト画面で、間違えた商品の「✕」ボタンを押すと取り消せます。タグも自動で元に戻ります。'
    },
    {
      q: 'タグをどこに付ければいい？',
      a: '後ろからN本目の商品に付けてください。Nはオーナーが決めた数字です。わからなければオーナーに確認してください。基本は「残り2〜3本目」が多いです。'
    },
  ];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        html { scroll-behavior: smooth; }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .step-card {
          animation: fadeInUp 0.5s ease-out both;
        }
        .step-card:nth-child(1) { animation-delay: 0.1s; }
        .step-card:nth-child(2) { animation-delay: 0.25s; }
        .step-card:nth-child(3) { animation-delay: 0.4s; }

        .faq-item {
          transition: all 0.2s ease;
        }
        .faq-item:active {
          background: #f0f9f0 !important;
        }

        .accent-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          flex-shrink: 0;
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>在庫番</div>
          <div style={styles.headerBadge}>スタッフ用ガイド</div>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          毎日やることは<br />
          <span style={styles.heroAccent}>3つだけ</span>
        </h1>
        <p style={styles.heroSub}>
          在庫の数を数える必要はありません。<br />
          タグを外す・スキャンする・受け取る。それだけです。
        </p>
      </section>

      {/* 3 Steps */}
      <section style={styles.stepsSection}>

        {/* Step 1 */}
        <div className="step-card" style={styles.stepCard}>
          <div style={styles.stepNumberContainer}>
            <div style={{...styles.stepNumber, background: '#E8F5E9', color: '#2E7D32'}}>1</div>
          </div>
          <div style={styles.stepContent}>
            <div style={styles.stepWhen}>商品を開封したとき</div>
            <h2 style={styles.stepTitle}>タグを外してカゴへ</h2>
            <div style={styles.stepBody}>
              <p style={styles.stepText}>
                タグ付きの商品を開けたら、タグを外して決まったカゴに入れるだけ。
              </p>
              <div style={styles.tipBox}>
                <div style={styles.tipIcon}>💡</div>
                <div style={styles.tipText}>
                  施術中にスマホを触る必要はありません。<br />
                  タグをカゴに入れるだけでOKです。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div style={styles.arrow}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Step 2 */}
        <div className="step-card" style={styles.stepCard}>
          <div style={styles.stepNumberContainer}>
            <div style={{...styles.stepNumber, background: '#E3F2FD', color: '#1565C0'}}>2</div>
          </div>
          <div style={styles.stepContent}>
            <div style={styles.stepWhen}>手が空いたとき</div>
            <h2 style={styles.stepTitle}>カゴのタグをまとめてスキャン</h2>
            <div style={styles.stepBody}>
              <p style={styles.stepText}>
                スマホでアプリを開いて「スキャン」ボタンを押し、カゴのタグのQRコードを1つずつ読み取ります。
              </p>
              <div style={styles.infoBox}>
                <span style={styles.infoIcon}>📋</span>
                <span>スキャンした商品は自動で発注リストに追加されます</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div style={styles.arrow}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Step 3 */}
        <div className="step-card" style={styles.stepCard}>
          <div style={styles.stepNumberContainer}>
            <div style={{...styles.stepNumber, background: '#FFF3E0', color: '#E65100'}}>3</div>
          </div>
          <div style={styles.stepContent}>
            <div style={styles.stepWhen}>新しい商品が届いたとき</div>
            <h2 style={styles.stepTitle}>タップで受取 → タグを付け直す</h2>
            <div style={styles.stepBody}>
              <p style={styles.stepText}>
                「受取」画面で届いた商品をタップして受取完了。タグを新しい在庫の所定の位置に付け直します。
              </p>
              <div style={styles.tipBox}>
                <div style={styles.tipIcon}>📌</div>
                <div style={styles.tipText}>
                  タグは「後ろからN本目」に付けてください。<br />
                  位置はオーナーが決めています。
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional: 欠品報告 */}
      <section style={styles.optionalSection}>
        <div style={styles.optionalCard}>
          <div style={styles.optionalHeader}>
            <span style={styles.optionalBadge}>＋α</span>
            <h3 style={styles.optionalTitle}>在庫が切れたとき</h3>
          </div>
          <p style={styles.optionalText}>
            タグが付いていなかった商品が切れてしまった場合は、アプリの「欠品報告」ボタンで報告してください。報告データをもとに、次回からタグを付ける最適な位置をシステムが提案します。
          </p>
        </div>
      </section>

      {/* Flow Summary */}
      <section style={styles.summarySection}>
        <h2 style={styles.summaryTitle}>全体の流れ</h2>
        <div style={styles.flowChart}>
          <div style={styles.flowItem}>
            <div style={{...styles.flowIcon, background: '#E8F5E9'}}>📦</div>
            <div style={styles.flowLabel}>商品開封</div>
          </div>
          <div style={styles.flowArrow}>→</div>
          <div style={styles.flowItem}>
            <div style={{...styles.flowIcon, background: '#FFF9C4'}}>🧺</div>
            <div style={styles.flowLabel}>タグをカゴへ</div>
          </div>
          <div style={styles.flowArrow}>→</div>
          <div style={styles.flowItem}>
            <div style={{...styles.flowIcon, background: '#E3F2FD'}}>📱</div>
            <div style={styles.flowLabel}>スキャン</div>
          </div>
          <div style={styles.flowArrow}>→</div>
          <div style={styles.flowItem}>
            <div style={{...styles.flowIcon, background: '#F3E5F5'}}>📝</div>
            <div style={styles.flowLabel}>自動で<br/>発注リストへ</div>
          </div>
          <div style={styles.flowArrow}>→</div>
          <div style={styles.flowItem}>
            <div style={{...styles.flowIcon, background: '#FFF3E0'}}>🚚</div>
            <div style={styles.flowLabel}>届いたら受取</div>
          </div>
          <div style={styles.flowArrow}>→</div>
          <div style={styles.flowItem}>
            <div style={{...styles.flowIcon, background: '#E8F5E9'}}>🏷️</div>
            <div style={styles.flowLabel}>タグ付け直し</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={styles.faqSection}>
        <h2 style={styles.faqTitle}>よくある質問</h2>
        <div style={styles.faqList}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="faq-item"
              style={styles.faqItem}
              onClick={() => toggleFaq(i)}
            >
              <div style={styles.faqQuestion}>
                <span style={styles.faqQ}>Q.</span>
                <span style={styles.faqQuestionText}>{faq.q}</span>
                <span style={{
                  ...styles.faqToggle,
                  transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>▼</span>
              </div>
              {openFaq === i && (
                <div style={styles.faqAnswer}>
                  <span style={styles.faqA}>A.</span>
                  <span>{faq.a}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <a href="/app" style={styles.ctaButton}>
          アプリを開く →
        </a>
        <p style={styles.ctaSub}>ブックマーク登録しておくと便利です</p>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          在庫番 — 在庫管理システム
        </p>
        <div style={styles.footerLinks}>
          <a href="/guide" style={styles.footerLink}>オーナー向けガイド</a>
          <span style={styles.footerDivider}>|</span>
          <a href="/" style={styles.footerLink}>トップページ</a>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: '"Noto Sans JP", sans-serif',
    color: '#1a1a1a',
    background: '#FAFAF8',
    minHeight: '100vh',
    maxWidth: '100vw',
    overflowX: 'hidden',
  },

  // Header
  header: {
    background: '#fff',
    borderBottom: '1px solid #e8e8e4',
    padding: '12px 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 600,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 18,
    fontWeight: 900,
    color: '#2E7D32',
    letterSpacing: '-0.02em',
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    background: '#4CAF50',
    padding: '4px 12px',
    borderRadius: 20,
  },

  // Hero
  hero: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '48px 24px 32px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.4,
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
  },
  heroAccent: {
    color: '#2E7D32',
    fontSize: 36,
  },
  heroSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    lineHeight: 1.8,
  },

  // Steps
  stepsSection: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '0 20px 32px',
  },
  stepCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '24px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #f0f0ec',
  },
  stepNumberContainer: {
    marginBottom: 16,
  },
  stepNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 900,
  },
  stepContent: {},
  stepWhen: {
    fontSize: 12,
    fontWeight: 500,
    color: '#999',
    marginBottom: 6,
    letterSpacing: '0.05em',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  stepBody: {},
  stepText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 1.8,
    marginBottom: 12,
  },
  tipBox: {
    display: 'flex',
    gap: 10,
    background: '#F9FBF7',
    border: '1px solid #E8F0E0',
    borderRadius: 10,
    padding: '12px 14px',
  },
  tipIcon: {
    fontSize: 18,
    flexShrink: 0,
    lineHeight: 1.6,
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 1.7,
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#EEF5FF',
    border: '1px solid #D6E6FF',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#1565C0',
  },
  infoIcon: {
    fontSize: 16,
    flexShrink: 0,
  },

  // Arrow between steps
  arrow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 0',
  },

  // Optional section
  optionalSection: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '0 20px 32px',
  },
  optionalCard: {
    background: '#FFFBF0',
    border: '1px solid #F0E6C8',
    borderRadius: 16,
    padding: '20px',
  },
  optionalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#E65100',
    background: '#FFF3E0',
    padding: '3px 10px',
    borderRadius: 20,
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  optionalText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 1.8,
  },

  // Flow summary
  summarySection: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '16px 20px 40px',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  flowChart: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '6px 4px',
    padding: '20px 12px',
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #f0f0ec',
  },
  flowItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
  },
  flowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  flowArrow: {
    fontSize: 16,
    color: '#bbb',
    fontWeight: 300,
  },

  // FAQ
  faqSection: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '0 20px 40px',
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  faqItem: {
    background: '#fff',
    borderRadius: 12,
    padding: '14px 16px',
    border: '1px solid #f0f0ec',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  faqQuestion: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: 900,
    color: '#4CAF50',
    flexShrink: 0,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
    flex: 1,
  },
  faqToggle: {
    fontSize: 10,
    color: '#bbb',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
  },
  faqAnswer: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f0f0ec',
    fontSize: 13,
    color: '#555',
    lineHeight: 1.8,
  },
  faqA: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1565C0',
    flexShrink: 0,
  },

  // CTA
  ctaSection: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '0 20px 48px',
    textAlign: 'center',
  },
  ctaButton: {
    display: 'inline-block',
    background: '#2E7D32',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    padding: '14px 48px',
    borderRadius: 12,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(46,125,50,0.25)',
  },
  ctaSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },

  // Footer
  footer: {
    background: '#fff',
    borderTop: '1px solid #e8e8e4',
    padding: '24px 20px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#2E7D32',
    marginBottom: 8,
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    fontSize: 12,
  },
  footerLink: {
    color: '#888',
    textDecoration: 'none',
  },
  footerDivider: {
    color: '#ddd',
  },
};
