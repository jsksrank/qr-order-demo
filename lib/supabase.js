-- ============================================
-- 一時的なanon読み取り許可ポリシー
-- Step 2（認証実装）完了後に削除すること！
-- ============================================
-- ⚠️ Supabaseダッシュボード → SQL Editor で実行

-- stores: 店舗情報の読み取り
CREATE POLICY "temp_anon_select_stores"
  ON stores FOR SELECT TO anon USING (true);

-- products: 商品の読み書き
CREATE POLICY "temp_anon_select_products"
  ON products FOR SELECT TO anon USING (true);

CREATE POLICY "temp_anon_insert_products"
  ON products FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "temp_anon_update_products"
  ON products FOR UPDATE TO anon USING (true);


-- ============================================
-- ★ Step 2完了後に実行する削除SQL（今は実行しない）
-- ============================================
-- DROP POLICY "temp_anon_select_stores" ON stores;
-- DROP POLICY "temp_anon_select_products" ON products;
-- DROP POLICY "temp_anon_insert_products" ON products;
-- DROP POLICY "temp_anon_update_products" ON products;
