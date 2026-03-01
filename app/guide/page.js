'use client';

import { useState } from 'react';

export default function OwnerGuidePage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'タグを紛失・破損した場合は？',
      a: '3段階で対応できます。① 予備タグを使う（お届け時に6枚の予備を同梱しています）。② 予備がなくなったら、LINEまたはメールで追加タグを注文できます。③ 緊急時は、アプリから普通紙に応急タグを印刷できます（今後対応予定）。'
    },
    {
      q: '「後ろからN個目」のNはいくつにすべき？',
      a: '「常に新品をいくつ手元に置いておきたいか」がNの数字です。例えば、カラー剤を常に新品2個はキープしたいなら、後ろから2個目にタグを付けます。前から使っていき、タグ付きの商品を開封した瞬間＝新品が2個を下回った瞬間なので、自動で発注リストに追加されます。迷ったら「2」か「3」で始めて、在庫切れ報告のデータを見ながら調整するのがおすすめです。'
    },
    {
      q: 'スタッフは何人でも使える？',
      a: 'はい。1店舗につき1アカウント（メールアドレスとパスワード）を共有する方式です。スタッフ全員が同じアカウントでログインして使えます。追加料金はかかりません。'
    },
    {
      q: 'ディーラー（仕入先）への発注はどうやって送る？',
      a: '発注リスト画面で発注する商品にチェックを入れ、「LINEで送信」ボタンを押すと、商品名と数量がテキスト形式でコピーされます。それをLINEやメールでディーラーに送ってください。'
    },
    {
      q: 'バーコード（JAN）で商品登録できる？',
      a: '現在は手入力での登録のみとなっています。バーコードスキャンによる自動登録は今後のアップデートで対応予定です。'
    },
    {
      q: 'プランを変更したい',
      a: '設定画面の「プラン変更」から、いつでもアップグレード・ダウングレードできます。アップグレードは即時反映、ダウングレードは次の請求日から適用されます。'
    },
    {
      q: '解約したい',
      a: '設定画面の「プラン変更」→「サブスクリプション管理」から解約できます。解約後も請求期間の終了日まではご利用いただけます。'
    },
    {
      q: 'ログインできない',
      a: 'パスワードをお忘れの場合は、ログイン画面の「パスワードを忘れた方」からリセットメールを送信できます。メールが届かない場合は、迷惑メールフォルダをご確認ください。'
    },
  ];

  const tabs = [
    { id: 'setup', label: '初期セットアップ', icon: '📦' },
    { id: 'daily', label: '日々の運用', icon: '🔄' },
    { id: 'manage', label: '設定・管理', icon: '⚙️' },
  ];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease-out; }

        .tab-btn {
          transition: all 0.2s ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          border: none;
          outline: none;
        }

        .faq-item {
          transition: all 0.2s ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .faq-item:active {
          background: #f0f9f0 !important;
        }

        .staff-link:hover {
          box-shadow: 0 4px 16px rgba(46,125,50,0.2) !important;
          transform: translateY(-1px);
        }

        .section-card {
          transition: all 0.2s ease;
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>在庫番</div>
          <div style={styles.headerBadge}>オーナー向けガイド</div>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>在庫番 ご利用ガイド</h1>
        <p style={styles.heroSub}>
          初期セットアップから日々の運用まで、すべてをご説明します。
        </p>
      </section>

      {/* Staff Link Banner */}
      <section style={styles.staffBannerSection}>
        <a href="/guide/staff" className="staff-link" style={styles.staffBanner}>
          <div style={styles.staffBannerContent}>
            <div style={styles.staffBannerIcon}>👥</div>
            <div>
              <div style={styles.staffBannerTitle}>スタッフ用ガイドはこちら</div>
              <div style={styles.staffBannerSub}>URLを共有するだけでスタッフが使い方を確認できます</div>
            </div>
          </div>
          <div style={styles.staffBannerArrow}>→</div>
        </a>
        <div style={styles.staffUrlBox}>
          <span style={styles.staffUrlLabel}>共有URL：</span>
          <code style={styles.staffUrlCode}>zaiko-ban.com/guide/staff</code>
        </div>
      </section>

      {/* Tab Navigation */}
      <section style={styles.tabSection}>
        <div style={styles.tabContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="tab-btn"
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      <section style={styles.contentSection}>

        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="fade-in">
            <div style={styles.sectionIntro}>
              <p>QRタグが届いたら、以下の手順でセットアップしてください。所要時間は商品数によりますが、20商品で約15〜20分です。</p>
            </div>

            {/* Step 1 */}
            <div style={styles.guideCard}>
              <div style={styles.guideStep}>
                <div style={styles.guideStepNum}>1</div>
                <h3 style={styles.guideStepTitle}>箱の中身を確認</h3>
              </div>
              <div style={styles.guideBody}>
                <p style={styles.guideText}>
                  お届けする箱には以下が入っています。
                </p>
                <div style={styles.checkList}>
                  <div style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>QRタグ 36枚（30枚＋予備6枚）※ゴム紐付き</span>
                  </div>
                  <div style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>予備のゴム紐（数本）</span>
                  </div>
                  <div style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>かんたんスタートガイド（紙）</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={styles.guideCard}>
              <div style={styles.guideStep}>
                <div style={styles.guideStepNum}>2</div>
                <h3 style={styles.guideStepTitle}>アカウント登録（まだの方）</h3>
              </div>
              <div style={styles.guideBody}>
                <p style={styles.guideText}>
                  <a href="/app" style={styles.inlineLink}>zaiko-ban.com/app</a> にアクセスし、メールアドレスとパスワードで新規登録してください。確認メールが届きますので、メール内のリンクをクリックして認証を完了してください。
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={styles.guideCard}>
              <div style={styles.guideStep}>
                <div style={styles.guideStepNum}>3</div>
                <h3 style={styles.guideStepTitle}>商品を登録する</h3>
              </div>
              <div style={styles.guideBody}>
                <p style={styles.guideText}>
                  管理したい商品を登録します。まずは発注頻度が高い上位10〜20商品だけでOKです。
                </p>
                <p style={styles.guideText}>
                  ホーム画面の「商品管理」→「＋ 新規登録」から、商品名・カテゴリ・保管場所などを入力して登録します。登録すると、QRタグが自動で紐付けられます。
                </p>
                <div style={styles.tipBox}>
                  <div style={styles.tipIcon}>💡</div>
                  <div style={styles.tipText}>
                    全商品を一度に登録する必要はありません。よく発注するものだけ先に登録して、慣れてきたら追加していくのがおすすめです。
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div style={styles.guideCard}>
              <div style={styles.guideStep}>
                <div style={styles.guideStepNum}>4</div>
                <h3 style={styles.guideStepTitle}>タグを商品に取り付ける</h3>
              </div>
              <div style={styles.guideBody}>
                <p style={styles.guideText}>
                  QRタグを商品の「後ろからN個目」に取り付けます。ゴム紐はタグに結ばれた状態でお届けしますので、そのまま商品に掛けてください。
                </p>
                <div style={styles.highlightBox}>
                  <div style={styles.highlightIcon}>💡</div>
                  <div>
                    <p style={styles.highlightTitle}>「後ろからN個目」とは？</p>
                    <p style={styles.highlightText}>
                      Nは「常に新品をいくつキープしておきたいか」の数字です。
                    </p>
                    <div style={styles.exampleBox}>
                      <p style={styles.exampleTitle}>例：カラー剤を常に新品2個はキープしたい場合</p>
                      <div style={styles.exampleSteps}>
                        <p style={styles.exampleStep}>→ 後ろから<strong>2個目</strong>にタグを付ける</p>
                        <p style={styles.exampleStep}>→ 前から順に使っていく</p>
                        <p style={styles.exampleStep}>→ タグ付きの商品を開封した瞬間＝<strong>「新品が2個を下回った」</strong>瞬間</p>
                        <p style={styles.exampleStep}>→ 自動で発注リストに追加される</p>
                      </div>
                    </div>
                    <p style={{...styles.highlightText, marginTop: 10}}>
                      迷ったら「2」か「3」で始めましょう。在庫切れが起きた商品は、報告データをもとにNの数を増やしていけばOKです。
                    </p>
                  </div>
                </div>
                <div style={styles.tipBox}>
                  <div style={styles.tipIcon}>📌</div>
                  <div style={styles.tipText}>
                    タグは棚に固定するものではなく、商品間を移動する「着脱式」です。商品を受け取ったら、新しい在庫のN個目の位置に付け直してください。
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div style={styles.guideCard}>
              <div style={styles.guideStep}>
                <div style={styles.guideStepNum}>5</div>
                <h3 style={styles.guideStepTitle}>スタッフに使い方を共有</h3>
              </div>
              <div style={styles.guideBody}>
                <p style={styles.guideText}>
                  以下のURLをLINEやメッセージでスタッフに送ってください。1分で読める簡潔なガイドです。
                </p>
                <div style={styles.shareBox}>
                  <div style={styles.shareUrl}>zaiko-ban.com/guide/staff</div>
                </div>
                <p style={{...styles.guideText, marginTop: 12, marginBottom: 0}}>
                  あわせて、アプリのログイン情報（メールアドレスとパスワード）もスタッフに共有してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Tab */}
        {activeTab === 'daily' && (
          <div className="fade-in">
            <div style={styles.sectionIntro}>
              <p>日々の運用は非常にシンプルです。「数える」作業は一切ありません。</p>
            </div>

            {/* Daily Flow */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>スタッフが行うこと（毎日）</h3>
              <div style={styles.dailySteps}>
                <div style={styles.dailyStep}>
                  <div style={{...styles.dailyNum, background: '#E8F5E9', color: '#2E7D32'}}>1</div>
                  <div>
                    <p style={styles.dailyStepTitle}>タグ付き商品を開封 → タグをカゴへ</p>
                    <p style={styles.dailyStepSub}>施術中にスマホを触る必要はありません</p>
                  </div>
                </div>
                <div style={styles.dailyStep}>
                  <div style={{...styles.dailyNum, background: '#E3F2FD', color: '#1565C0'}}>2</div>
                  <div>
                    <p style={styles.dailyStepTitle}>手が空いたら → カゴのタグをまとめてスキャン</p>
                    <p style={styles.dailyStepSub}>スキャンした商品が自動で発注リストに追加されます</p>
                  </div>
                </div>
                <div style={styles.dailyStep}>
                  <div style={{...styles.dailyNum, background: '#FFF3E0', color: '#E65100'}}>3</div>
                  <div>
                    <p style={styles.dailyStepTitle}>商品が届いたら → タップで受取 → タグ付け直し</p>
                    <p style={styles.dailyStepSub}>受取画面で商品をタップし、タグを新在庫のN個目に移動</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Specific */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>オーナーが行うこと</h3>
              <div style={styles.dailySteps}>
                <div style={styles.dailyStep}>
                  <div style={{...styles.dailyNum, background: '#F3E5F5', color: '#7B1FA2'}}>📋</div>
                  <div>
                    <p style={styles.dailyStepTitle}>発注リストを確認 → ディーラーに送信</p>
                    <p style={styles.dailyStepSub}>
                      発注リスト画面でチェックを入れ、「LINEで送信」を押すと商品名と数量がテキストでコピーされます。それをLINEやメールでディーラーに送ってください。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stockout Report */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>在庫切れが起きたとき</h3>
              <p style={styles.guideText}>
                タグが付いていなかった商品が切れてしまった場合は、アプリのホーム画面から「欠品報告」を行ってください。報告データが蓄積されると、システムが最適な発注点（N個目）を提案します。
              </p>
              <div style={styles.tipBox}>
                <div style={styles.tipIcon}>📊</div>
                <div style={styles.tipText}>
                  欠品報告は「失敗」ではなく「データ」です。報告が多いほど、システムが賢くなり、最適な発注タイミングを提案できるようになります。
                </div>
              </div>
            </div>

            {/* LINE送信Tips */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>発注リストのLINE送信について</h3>
              <p style={styles.guideText}>
                「LINEで送信」ボタンを押すと、以下のようなテキストがコピーされます。
              </p>
              <div style={styles.codeBox}>
                <div style={styles.codeContent}>
                  【発注依頼】在庫番より{'\n'}
                  ──────────{'\n'}
                  ・カラー剤 アディクシー N9 × 2本{'\n'}
                  ・シャンプー オージュア × 1本{'\n'}
                  ・グローブ Mサイズ × 3箱{'\n'}
                  ──────────{'\n'}
                  よろしくお願いいたします。
                </div>
              </div>
              <p style={{...styles.guideText, marginTop: 12, marginBottom: 0}}>
                このテキストをLINEのトーク画面に貼り付けてディーラーに送信してください。
              </p>
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="fade-in">
            <div style={styles.sectionIntro}>
              <p>商品の追加・編集、プランの変更、紹介プログラムなどの管理機能です。</p>
            </div>

            {/* Product Management */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>商品の追加・編集</h3>
              <p style={styles.guideText}>
                ホーム画面の「商品管理」から、商品の追加・編集・削除ができます。商品を追加すると、QRタグが自動で紐付けられます。
              </p>
              <div style={styles.tipBox}>
                <div style={styles.tipIcon}>💡</div>
                <div style={styles.tipText}>
                  全商品を一度に登録する必要はありません。まずは発注頻度が高い上位10〜20商品から始めて、慣れてきたら徐々に追加するのがおすすめです。
                </div>
              </div>
            </div>

            {/* Tag Management */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>タグの管理</h3>
              <p style={styles.guideText}>
                設定画面の「タグ管理」から、全タグの状態（取付中・取外し済み・未割当）を確認できます。商品を削除すると、紐付いていたタグは自動で「未割当」に戻ります。
              </p>
            </div>

            {/* Plan */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>料金プランの変更</h3>
              <p style={styles.guideText}>
                設定画面の「プラン変更」から変更できます。管理する商品数（SKU数）に応じて最適なプランをお選びください。
              </p>
              <div style={styles.planTable}>
                <div style={styles.planRow}>
                  <div style={styles.planName}>エントリー</div>
                  <div style={styles.planDetail}>〜30商品 / ¥500/月</div>
                </div>
                <div style={styles.planRow}>
                  <div style={styles.planName}>ライト</div>
                  <div style={styles.planDetail}>〜100商品 / ¥2,980/月</div>
                </div>
                <div style={styles.planRow}>
                  <div style={styles.planName}>スタンダード</div>
                  <div style={styles.planDetail}>〜300商品 / ¥5,980/月</div>
                </div>
                <div style={styles.planRow}>
                  <div style={styles.planName}>プロ</div>
                  <div style={styles.planDetail}>〜500商品 / ¥9,800/月</div>
                </div>
              </div>
            </div>

            {/* Referral */}
            <div style={styles.guideCard}>
              <h3 style={styles.dailyTitle}>紹介プログラム</h3>
              <p style={styles.guideText}>
                設定画面に表示される紹介コード（ZB-XXXXXX）を他のサロンオーナーに共有してください。
              </p>
              <div style={styles.referralBox}>
                <div style={styles.referralItem}>
                  <div style={styles.referralLabel}>紹介した方</div>
                  <div style={styles.referralValue}>1件につき月額 ¥500 OFF（永久累積）</div>
                </div>
                <div style={styles.referralDivider}></div>
                <div style={styles.referralItem}>
                  <div style={styles.referralLabel}>紹介された方</div>
                  <div style={styles.referralValue}>全プラン永久 ¥500 OFF</div>
                </div>
              </div>
              <p style={{...styles.guideText, marginTop: 12, marginBottom: 0}}>
                例：6人紹介すればライトプラン（¥2,980）が実質無料になります。
              </p>
            </div>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section style={styles.faqSection}>
        <h2 style={styles.faqSectionTitle}>よくある質問</h2>
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

      {/* Contact */}
      <section style={styles.contactSection}>
        <div style={styles.contactCard}>
          <h3 style={styles.contactTitle}>お問い合わせ</h3>
          <p style={styles.contactText}>
            ご不明な点がございましたら、お気軽にお問い合わせください。
          </p>
          <div style={styles.contactInfo}>
            <div style={styles.contactRow}>
              <span style={styles.contactLabel}>メール</span>
              <span style={styles.contactValue}>info@zaiko-ban.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <a href="/app" style={styles.ctaButton}>
          アプリを開く →
        </a>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerLogo}>在庫番 — 在庫管理システム</p>
        <div style={styles.footerLinks}>
          <a href="/guide/staff" style={styles.footerLink}>スタッフ用ガイド</a>
          <span style={styles.footerDivider}>|</span>
          <a href="/" style={styles.footerLink}>トップページ</a>
          <span style={styles.footerDivider}>|</span>
          <a href="/legal" style={styles.footerLink}>特定商取引法</a>
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
    maxWidth: 680,
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
    background: '#1565C0',
    padding: '4px 12px',
    borderRadius: 20,
  },

  // Hero
  hero: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '40px 24px 24px',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 900,
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    lineHeight: 1.8,
  },

  // Staff Banner
  staffBannerSection: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '0 20px 24px',
  },
  staffBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#2E7D32',
    color: '#fff',
    borderRadius: 14,
    padding: '16px 20px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  staffBannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  staffBannerIcon: {
    fontSize: 28,
  },
  staffBannerTitle: {
    fontSize: 15,
    fontWeight: 700,
  },
  staffBannerSub: {
    fontSize: 12,
    opacity: 0.85,
    marginTop: 2,
  },
  staffBannerArrow: {
    fontSize: 20,
    fontWeight: 300,
    opacity: 0.7,
  },
  staffUrlBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    fontSize: 12,
    color: '#888',
  },
  staffUrlLabel: {
    fontWeight: 500,
  },
  staffUrlCode: {
    background: '#f0f0ec',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#555',
  },

  // Tabs
  tabSection: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '0 20px 8px',
    position: 'sticky',
    top: 49,
    zIndex: 99,
    background: '#FAFAF8',
    paddingTop: 8,
  },
  tabContainer: {
    display: 'flex',
    gap: 6,
    background: '#fff',
    padding: 4,
    borderRadius: 14,
    border: '1px solid #e8e8e4',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '10px 8px',
    borderRadius: 10,
    background: 'transparent',
    color: '#888',
    fontFamily: '"Noto Sans JP", sans-serif',
  },
  tabActive: {
    background: '#E8F5E9',
    color: '#2E7D32',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: 700,
  },

  // Content
  contentSection: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '16px 20px 32px',
  },
  sectionIntro: {
    fontSize: 14,
    color: '#555',
    lineHeight: 1.8,
    marginBottom: 20,
    padding: '0 4px',
  },

  // Guide Card
  guideCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '24px 20px',
    marginBottom: 12,
    border: '1px solid #f0f0ec',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  guideStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  guideStepNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#E8F5E9',
    color: '#2E7D32',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 900,
    flexShrink: 0,
  },
  guideStepTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  guideBody: {},
  guideText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 1.8,
    marginBottom: 14,
  },
  inlineLink: {
    color: '#2E7D32',
    fontWeight: 700,
    textDecoration: 'underline',
  },

  // Check list
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: '#444',
  },
  checkIcon: {
    color: '#4CAF50',
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
  },

  // Method box
  methodBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  methodItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  methodBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1565C0',
    background: '#E3F2FD',
    padding: '2px 10px',
    borderRadius: 20,
    flexShrink: 0,
    marginTop: 2,
  },
  methodText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 1.7,
  },

  // Highlight box
  highlightBox: {
    display: 'flex',
    gap: 12,
    background: '#FFFBF0',
    border: '1px solid #F0E6C8',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 14,
  },
  highlightIcon: {
    fontSize: 20,
    flexShrink: 0,
    lineHeight: 1.4,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 1.8,
  },

  // Example box (inside highlight)
  exampleBox: {
    background: '#fff',
    border: '1px solid #F0E6C8',
    borderRadius: 10,
    padding: '14px 16px',
    marginTop: 10,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 10,
  },
  exampleSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  exampleStep: {
    fontSize: 13,
    color: '#444',
    lineHeight: 1.6,
  },

  // Tip box
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

  // Share box
  shareBox: {
    background: '#f5f5f2',
    borderRadius: 10,
    padding: '12px 16px',
    textAlign: 'center',
  },
  shareUrl: {
    fontSize: 15,
    fontWeight: 700,
    color: '#2E7D32',
    fontFamily: 'monospace',
    letterSpacing: '0.02em',
  },

  // Daily
  dailyTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  dailySteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  dailyStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  dailyNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 900,
    flexShrink: 0,
  },
  dailyStepTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  dailyStepSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 1.6,
  },

  // Code box
  codeBox: {
    background: '#f5f5f2',
    borderRadius: 10,
    padding: '14px 16px',
    border: '1px solid #e8e8e4',
  },
  codeContent: {
    fontSize: 13,
    color: '#444',
    lineHeight: 1.8,
    fontFamily: 'monospace',
    whiteSpace: 'pre-line',
  },

  // Plan table
  planTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #e8e8e4',
  },
  planRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: '#fff',
    borderBottom: '1px solid #f0f0ec',
  },
  planName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  planDetail: {
    fontSize: 13,
    color: '#666',
  },

  // Referral box
  referralBox: {
    background: '#FFFBF0',
    border: '1px solid #F0E6C8',
    borderRadius: 12,
    padding: '16px',
    marginTop: 12,
  },
  referralItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  referralLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#E65100',
  },
  referralValue: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
  },
  referralDivider: {
    height: 1,
    background: '#F0E6C8',
    margin: '12px 0',
  },

  // FAQ
  faqSection: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '0 20px 40px',
  },
  faqSectionTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: '#1a1a1a',
    marginBottom: 16,
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

  // Contact
  contactSection: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '0 20px 32px',
  },
  contactCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '24px 20px',
    border: '1px solid #f0f0ec',
    textAlign: 'center',
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 1.8,
  },
  contactInfo: {},
  contactRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#888',
  },
  contactValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },

  // CTA
  ctaSection: {
    maxWidth: 680,
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

  // Footer
  footer: {
    background: '#fff',
    borderTop: '1px solid #e8e8e4',
    padding: '24px 20px',
    textAlign: 'center',
  },
  footerLogo: {
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
