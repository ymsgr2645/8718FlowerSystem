// 8718 Dashboard Data - Phase 1

export const metrics = [
  { label: "本日仕入額", value: "¥284,500", change: "+12.3%", positive: true },
  { label: "倉庫在庫金額", value: "¥8,924,300", change: "-2.1%", positive: false },
  { label: "持ち出し合計", value: "¥56,800", change: "+8.7%", positive: true },
  { label: "次の請求書", value: "1/10", change: "あと3日", positive: true },
]

// 11店舗: 本部直営4店 + 業務委託7店
export const storeBreakdown = [
  { name: "委託", sales: 84500, ratio: 100, type: "headquarters" },
  { name: "通信販売", sales: 62300, ratio: 74, type: "headquarters" },
  { name: "山の手店", sales: 48200, ratio: 57, type: "headquarters" },
  { name: "新琴似店", sales: 35600, ratio: 42, type: "headquarters" },
  { name: "豊平店", sales: 32400, ratio: 38, type: "franchise" },
  { name: "月寒店", sales: 28500, ratio: 34, type: "franchise" },
  { name: "手稲店", sales: 25800, ratio: 31, type: "franchise" },
  { name: "琴似店", sales: 22300, ratio: 26, type: "franchise" },
  { name: "澄川店", sales: 19500, ratio: 23, type: "franchise" },
  { name: "大曲店", sales: 17200, ratio: 20, type: "franchise" },
  { name: "北野店", sales: 15000, ratio: 18, type: "franchise" },
]

// 在庫アラート（欠品・低在庫・長期在庫）
export const stockAlerts = [
  { product: "バラ 赤", store: "豊平店", qty: 0, status: "欠品" as const, days: 0 },
  { product: "カーネーション", store: "月寒店", qty: 5, status: "低在庫" as const, days: 2 },
  { product: "スプレーバラ", store: "倉庫", qty: 30, status: "長期在庫" as const, days: 7 },
  { product: "チューリップ", store: "手稲店", qty: 8, status: "低在庫" as const, days: 1 },
]

// 最近のメモ
export const recentMemos = [
  {
    title: "バラ赤の仕切値変更",
    author: "田中太郎",
    store: "仕入部",
    time: "3時間前",
    priority: "urgent" as const,
  },
  {
    title: "母の日フェア準備開始",
    author: "佐藤花子",
    store: "本部",
    time: "昨日",
    priority: "important" as const,
  },
  {
    title: "冷蔵庫メンテナンス完了",
    author: "鈴木一郎",
    store: "豊平店",
    time: "昨日",
    priority: "normal" as const,
  },
]

// 月次売上推移チャート
export const chartData = [
  { month: "8月", sales: 3200000 },
  { month: "9月", sales: 2800000 },
  { month: "10月", sales: 3100000 },
  { month: "11月", sales: 3500000 },
  { month: "12月", sales: 4200000 },
  { month: "1月", sales: 3842500 },
]

// 請求書締め日情報
export const invoiceDeadlines = [
  { type: "花の請求書", deadline: "10日", remaining: 3, stores: 10 },
  { type: "備品請求書", deadline: "月末", remaining: 24, stores: 9 },
]

// 今日の入荷予定
export const todayArrivals = [
  { supplier: "札幌花卉", items: 45, expectedTime: "08:00" },
  { supplier: "はなます", items: 32, expectedTime: "09:30" },
  { supplier: "阿部花園", items: 18, expectedTime: "10:00" },
]
