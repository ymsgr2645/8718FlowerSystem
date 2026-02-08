-- 問題のあるusersポリシーを削除
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- 修正されたポリシーを作成
-- ユーザーは自分自身のプロファイルを見ることができる
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分自身のプロファイルを更新できる
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 注意: 管理者用のポリシーは、JWTクレームまたは別の方法で実装する必要があります
-- 現時点では、ユーザーは自分のプロファイルのみアクセス可能
