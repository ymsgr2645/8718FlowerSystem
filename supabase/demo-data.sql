-- ダミーデータ投入スクリプト（社長プレゼン用）

-- 1. 店舗データ（11店舗）
INSERT INTO stores (name, code, address, phone) VALUES
('豊平店', 'TOYOHIRA', '札幌市豊平区豊平3条5丁目1-1', '011-811-1234'),
('月寒店', 'TSUKISAMU', '札幌市豊平区月寒中央通7丁目3-10', '011-855-5678'),
('新琴似店', 'SHINKOTONI', '札幌市北区新琴似7条15丁目5-20', '011-761-9012'),
('山の手店', 'YAMANOTE', '札幌市西区山の手4条2丁目1-1', '011-621-3456'),
('手稲店', 'TEINE', '札幌市手稲区前田7条11丁目2-10', '011-681-7890'),
('琴似店', 'KOTONI', '札幌市西区琴似2条4丁目2-6', '011-641-2345'),
('澄川店', 'SUMIKAWA', '札幌市南区澄川4条2丁目1-10', '011-821-6789'),
('大曲店', 'OMAGARI', '北広島市大曲幸町4丁目1-1', '011-377-0123'),
('北野店', 'KITANO', '札幌市清田区北野7条2丁目11-1', '011-881-4567'),
('通信販売', 'ONLINE', 'オンライン', '0120-87-1234'),
('委託販売', 'CONSIGNMENT', '札幌市中央区南2条西3丁目', '011-231-8901')
ON CONFLICT (code) DO NOTHING;

-- 2. 卸業者データ（4社）
INSERT INTO vendors (name, code) VALUES
('ブランディア', 'BRANDIA'),
('Gウイングス', 'GWINGS'),
('太田花卉', 'OHTAKAKI'),
('秀芳生花', 'SHUHO')
ON CONFLICT (code) DO NOTHING;

-- 3. 商品データ（各卸業者20-30アイテム）

-- ブランディアの商品
INSERT INTO items (vendor_id, name, code, unit_price, unit, category, is_active)
SELECT
    (SELECT id FROM vendors WHERE code = 'BRANDIA'),
    name, code, unit_price, unit, category, is_active
FROM (VALUES
    ('バラ（赤）スタンダード', 'BR-ROSE-RED-STD', 150, '本', 'バラ', true),
    ('バラ（白）スタンダード', 'BR-ROSE-WHT-STD', 150, '本', 'バラ', true),
    ('バラ（ピンク）スタンダード', 'BR-ROSE-PNK-STD', 150, '本', 'バラ', true),
    ('バラ（黄）スタンダード', 'BR-ROSE-YEL-STD', 150, '本', 'バラ', true),
    ('バラ（オレンジ）スタンダード', 'BR-ROSE-ORG-STD', 160, '本', 'バラ', true),
    ('スプレーバラ（ピンク）', 'BR-SPRAY-PNK', 180, '本', 'バラ', true),
    ('スプレーバラ（白）', 'BR-SPRAY-WHT', 180, '本', 'バラ', true),
    ('カーネーション（赤）', 'BR-CARN-RED', 80, '本', 'カーネーション', true),
    ('カーネーション（ピンク）', 'BR-CARN-PNK', 80, '本', 'カーネーション', true),
    ('カーネーション（白）', 'BR-CARN-WHT', 80, '本', 'カーネーション', true),
    ('カーネーション（複色）', 'BR-CARN-MIX', 90, '本', 'カーネーション', true),
    ('ガーベラ（赤）', 'BR-GERB-RED', 100, '本', 'ガーベラ', true),
    ('ガーベラ（ピンク）', 'BR-GERB-PNK', 100, '本', 'ガーベラ', true),
    ('ガーベラ（オレンジ）', 'BR-GERB-ORG', 100, '本', 'ガーベラ', true),
    ('ガーベラ（黄）', 'BR-GERB-YEL', 100, '本', 'ガーベラ', true),
    ('トルコキキョウ（白）', 'BR-LISI-WHT', 200, '本', 'トルコキキョウ', true),
    ('トルコキキョウ（紫）', 'BR-LISI-PRP', 200, '本', 'トルコキキョウ', true),
    ('トルコキキョウ（ピンク）', 'BR-LISI-PNK', 200, '本', 'トルコキキョウ', true),
    ('かすみ草', 'BR-GYPS', 250, '束', 'その他', true),
    ('スターチス（紫）', 'BR-STAT-PRP', 120, '束', 'その他', true),
    ('スターチス（ピンク）', 'BR-STAT-PNK', 120, '束', 'その他', true),
    ('ユーカリ', 'BR-EUCA', 150, '束', 'グリーン', true),
    ('レザーファン', 'BR-LEATH', 100, '束', 'グリーン', true),
    ('アイビー', 'BR-IVY', 130, '束', 'グリーン', true),
    ('ドラセナ', 'BR-DRAC', 140, '束', 'グリーン', true)
) AS t(name, code, unit_price, unit, category, is_active)
ON CONFLICT (vendor_id, code) DO NOTHING;

-- Gウイングスの商品
INSERT INTO items (vendor_id, name, code, unit_price, unit, category, is_active)
SELECT
    (SELECT id FROM vendors WHERE code = 'GWINGS'),
    name, code, unit_price, unit, category, is_active
FROM (VALUES
    ('ユリ（白）カサブランカ', 'GW-LILY-WHT-CASA', 350, '本', 'ユリ', true),
    ('ユリ（ピンク）ソルボンヌ', 'GW-LILY-PNK-SORB', 320, '本', 'ユリ', true),
    ('ユリ（黄）イエローウィン', 'GW-LILY-YEL-WIN', 300, '本', 'ユリ', true),
    ('ユリ（オレンジ）', 'GW-LILY-ORG', 280, '本', 'ユリ', true),
    ('オリエンタルユリMIX', 'GW-LILY-ORI-MIX', 300, '本', 'ユリ', true),
    ('バラ（赤）プレミアム', 'GW-ROSE-RED-PRM', 180, '本', 'バラ', true),
    ('バラ（ピンク）プレミアム', 'GW-ROSE-PNK-PRM', 180, '本', 'バラ', true),
    ('バラ（白）プレミアム', 'GW-ROSE-WHT-PRM', 180, '本', 'バラ', true),
    ('ヒマワリ', 'GW-SUNF', 200, '本', 'その他', true),
    ('トルコキキョウ（白）八重', 'GW-LISI-WHT-DBL', 250, '本', 'トルコキキョウ', true),
    ('トルコキキョウ（紫）八重', 'GW-LISI-PRP-DBL', 250, '本', 'トルコキキョウ', true),
    ('デンファレ（白）', 'GW-DEND-WHT', 400, '本', '洋蘭', true),
    ('デンファレ（ピンク）', 'GW-DEND-PNK', 400, '本', '洋蘭', true),
    ('胡蝶蘭（白）3本立', 'GW-PHAL-WHT-3', 15000, '鉢', '洋蘭', true),
    ('胡蝶蘭（ピンク）3本立', 'GW-PHAL-PNK-3', 15000, '鉢', '洋蘭', true),
    ('アルストロメリア（ピンク）', 'GW-ALST-PNK', 120, '本', 'その他', true),
    ('アルストロメリア（白）', 'GW-ALST-WHT', 120, '本', 'その他', true),
    ('スイートピー（ピンク）', 'GW-SWTP-PNK', 180, '本', 'その他', true),
    ('スイートピー（白）', 'GW-SWTP-WHT', 180, '本', 'その他', true),
    ('チューリップ（赤）', 'GW-TULP-RED', 150, '本', 'その他', true),
    ('チューリップ（黄）', 'GW-TULP-YEL', 150, '本', 'その他', true),
    ('ラナンキュラス（ピンク）', 'GW-RANU-PNK', 200, '本', 'その他', true),
    ('フリージア（黄）', 'GW-FREE-YEL', 130, '本', 'その他', true),
    ('アネモネ（赤）', 'GW-ANEM-RED', 140, '本', 'その他', true),
    ('モカラ（オレンジ）', 'GW-MOKA-ORG', 180, '本', '洋蘭', true)
) AS t(name, code, unit_price, unit, category, is_active)
ON CONFLICT (vendor_id, code) DO NOTHING;

-- 太田花卉の商品
INSERT INTO items (vendor_id, name, code, unit_price, unit, category, is_active)
SELECT
    (SELECT id FROM vendors WHERE code = 'OHTAKAKI'),
    name, code, unit_price, unit, category, is_active
FROM (VALUES
    ('バラ（赤）国産', 'OH-ROSE-RED-DOM', 200, '本', 'バラ', true),
    ('バラ（白）国産', 'OH-ROSE-WHT-DOM', 200, '本', 'バラ', true),
    ('バラ（ピンク）国産', 'OH-ROSE-PNK-DOM', 200, '本', 'バラ', true),
    ('カーネーション（赤）国産', 'OH-CARN-RED-DOM', 100, '本', 'カーネーション', true),
    ('カーネーション（ピンク）国産', 'OH-CARN-PNK-DOM', 100, '本', 'カーネーション', true),
    ('菊（白）輪菊', 'OH-CHRY-WHT-STD', 150, '本', '菊', true),
    ('菊（黄）輪菊', 'OH-CHRY-YEL-STD', 150, '本', '菊', true),
    ('菊（ピンク）輪菊', 'OH-CHRY-PNK-STD', 150, '本', '菊', true),
    ('スプレー菊（白）', 'OH-SPRY-CHR-WHT', 180, '本', '菊', true),
    ('スプレー菊（黄）', 'OH-SPRY-CHR-YEL', 180, '本', '菊', true),
    ('スプレー菊（ピンク）', 'OH-SPRY-CHR-PNK', 180, '本', '菊', true),
    ('トルコキキョウ（白）国産', 'OH-LISI-WHT-DOM', 230, '本', 'トルコキキョウ', true),
    ('トルコキキョウ（紫）国産', 'OH-LISI-PRP-DOM', 230, '本', 'トルコキキョウ', true),
    ('トルコキキョウ（グリーン）', 'OH-LISI-GRN', 250, '本', 'トルコキキョウ', true),
    ('ダリア（赤）', 'OH-DAHL-RED', 280, '本', 'その他', true),
    ('ダリア（ピンク）', 'OH-DAHL-PNK', 280, '本', 'その他', true),
    ('ダリア（白）', 'OH-DAHL-WHT', 280, '本', 'その他', true),
    ('芍薬（ピンク）', 'OH-PEON-PNK', 500, '本', 'その他', true),
    ('芍薬（白）', 'OH-PEON-WHT', 500, '本', 'その他', true),
    ('アジサイ（青）', 'OH-HYDR-BLU', 350, '本', 'その他', true),
    ('アジサイ（ピンク）', 'OH-HYDR-PNK', 350, '本', 'その他', true),
    ('リンドウ（青）', 'OH-GENT-BLU', 200, '本', 'その他', true),
    ('ストック（白）', 'OH-STCK-WHT', 180, '本', 'その他', true),
    ('ストック（ピンク）', 'OH-STCK-PNK', 180, '本', 'その他', true),
    ('スカビオサ（紫）', 'OH-SCAB-PRP', 160, '本', 'その他', true),
    ('雪柳', 'OH-SPIR', 200, '束', 'グリーン', true),
    ('ドウダンツツジ', 'OH-DODN', 250, '束', 'グリーン', true),
    ('丸葉ルスカス', 'OH-RUSC-RND', 150, '束', 'グリーン', true)
) AS t(name, code, unit_price, unit, category, is_active)
ON CONFLICT (vendor_id, code) DO NOTHING;

-- 秀芳生花の商品
INSERT INTO items (vendor_id, name, code, unit_price, unit, category, is_active)
SELECT
    (SELECT id FROM vendors WHERE code = 'SHUHO'),
    name, code, unit_price, unit, category, is_active
FROM (VALUES
    ('バラ（赤）エクアドル産', 'SH-ROSE-RED-ECU', 170, '本', 'バラ', true),
    ('バラ（白）エクアドル産', 'SH-ROSE-WHT-ECU', 170, '本', 'バラ', true),
    ('バラ（ピンク）エクアドル産', 'SH-ROSE-PNK-ECU', 170, '本', 'バラ', true),
    ('バラ（黄）エクアドル産', 'SH-ROSE-YEL-ECU', 170, '本', 'バラ', true),
    ('バラ（紫）エクアドル産', 'SH-ROSE-PRP-ECU', 190, '本', 'バラ', true),
    ('バラ（複色）エクアドル産', 'SH-ROSE-MIX-ECU', 180, '本', 'バラ', true),
    ('カーネーション（赤）コロンビア産', 'SH-CARN-RED-COL', 90, '本', 'カーネーション', true),
    ('カーネーション（ピンク）コロンビア産', 'SH-CARN-PNK-COL', 90, '本', 'カーネーション', true),
    ('カーネーション（白）コロンビア産', 'SH-CARN-WHT-COL', 90, '本', 'カーネーション', true),
    ('カーネーション（オレンジ）', 'SH-CARN-ORG', 95, '本', 'カーネーション', true),
    ('カーネーション（紫）', 'SH-CARN-PRP', 95, '本', 'カーネーション', true),
    ('ガーベラ（赤）', 'SH-GERB-RED', 110, '本', 'ガーベラ', true),
    ('ガーベラ（ピンク）', 'SH-GERB-PNK', 110, '本', 'ガーベラ', true),
    ('ガーベラ（白）', 'SH-GERB-WHT', 110, '本', 'ガーベラ', true),
    ('ガーベラ（黄）', 'SH-GERB-YEL', 110, '本', 'ガーベラ', true),
    ('ガーベラ（オレンジ）', 'SH-GERB-ORG', 110, '本', 'ガーベラ', true),
    ('カラー（白）', 'SH-CALA-WHT', 250, '本', 'その他', true),
    ('カラー（ピンク）', 'SH-CALA-PNK', 250, '本', 'その他', true),
    ('カラー（黄）', 'SH-CALA-YEL', 250, '本', 'その他', true),
    ('カラー（紫）', 'SH-CALA-PRP', 260, '本', 'その他', true),
    ('グロリオサ', 'SH-GLOR', 280, '本', 'その他', true),
    ('クルクマ（ピンク）', 'SH-CURC-PNK', 200, '本', 'その他', true),
    ('アンスリウム（赤）', 'SH-ANTH-RED', 300, '本', 'その他', true),
    ('アンスリウム（ピンク）', 'SH-ANTH-PNK', 300, '本', 'その他', true),
    ('プロテア', 'SH-PROT', 600, '本', 'その他', true),
    ('バンクシア', 'SH-BANK', 500, '本', 'その他', true),
    ('リューカデンドロン', 'SH-LEUC', 350, '本', 'その他', true),
    ('エリンジウム', 'SH-ERYN', 220, '本', 'その他', true)
) AS t(name, code, unit_price, unit, category, is_active)
ON CONFLICT (vendor_id, code) DO NOTHING;

-- 4. 過去3ヶ月分の取引データ（100-200件）
-- 各店舗から様々な商品を発注したデータを生成
DO $$
DECLARE
    store_record RECORD;
    item_record RECORD;
    transaction_date DATE;
    days_ago INT;
    quantity INT;
    i INT;
BEGIN
    -- 過去90日間のランダムな取引を生成
    FOR i IN 1..150 LOOP
        -- ランダムな日付（過去90日以内）
        days_ago := floor(random() * 90)::int;
        transaction_date := CURRENT_DATE - days_ago;

        -- ランダムな店舗を選択（通信販売と委託販売以外）
        SELECT id INTO store_record
        FROM stores
        WHERE code NOT IN ('ONLINE', 'CONSIGNMENT')
        ORDER BY random()
        LIMIT 1;

        -- ランダムな商品を選択
        SELECT id, unit_price INTO item_record
        FROM items
        WHERE is_active = true
        ORDER BY random()
        LIMIT 1;

        -- ランダムな数量（1-50本）
        quantity := floor(random() * 50 + 1)::int;

        -- 取引を挿入
        INSERT INTO transactions (
            store_id,
            item_id,
            quantity,
            unit_price,
            subtotal,
            transaction_date,
            created_by
        ) VALUES (
            store_record.id,
            item_record.id,
            quantity,
            item_record.unit_price,
            item_record.unit_price * quantity,
            transaction_date,
            (SELECT id FROM users WHERE role = 'store' LIMIT 1)
        );
    END LOOP;
END $$;

-- テストユーザーに店舗を割り当て
-- store@example.com には豊平店を割り当て
UPDATE users
SET store_id = (SELECT id FROM stores WHERE code = 'TOYOHIRA')
WHERE email = 'store@example.com';

-- 完了メッセージ
SELECT
    (SELECT COUNT(*) FROM stores) as stores_count,
    (SELECT COUNT(*) FROM vendors) as vendors_count,
    (SELECT COUNT(*) FROM items) as items_count,
    (SELECT COUNT(*) FROM transactions) as transactions_count,
    (SELECT name FROM stores WHERE id = (SELECT store_id FROM users WHERE email = 'store@example.com')) as test_store_assigned;
