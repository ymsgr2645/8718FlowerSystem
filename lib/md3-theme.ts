/**
 * 8718 FLOWER SYSTEM - Material 3 Theme Configuration
 *
 * Material 3の原則に基づいた設計:
 * - Primary: ブランドカラー（テラコッタ）- メインアクション、アクティブ状態
 * - Secondary: 補助カラー（グリーン）- フィルターチップ、補助要素
 * - Tertiary: アクセントカラー（ウォームブラウン）- バランス調整
 * - Surface: 中立的な背景色（ピンクティントを抑えた）
 * - On-colors: 十分なコントラストを確保
 */

export const md3 = {
  // Primary (Terracotta - Brand Color)
  // メインコンポーネント、アクティブ状態、FAB、重要なボタン
  primary: "#C0634A",
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFDAD1",
  onPrimaryContainer: "#3B0907",

  // Secondary (Green - Nature/Flower)
  // フィルターチップ、補助ボタン、成功状態
  secondary: "#4A6741",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#CCE8BD",
  onSecondaryContainer: "#072105",

  // Tertiary (Warm Brown - Accent)
  // プライマリとセカンダリのバランス調整、アクセント要素
  tertiary: "#7D5700",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFDEAE",
  onTertiaryContainer: "#271900",

  // Error
  // エラー状態、警告、削除アクション
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",

  // Surface - 中立的な背景色（ピンクティントを抑制）
  // Material 3では、Surfaceは中立的で目立たない色にすべき
  surface: "#FFFBFF",
  onSurface: "#1C1B1F",
  surfaceVariant: "#E7E0DF",
  onSurfaceVariant: "#49454F",

  // Surface Container - コンテナの階層表現
  // 低い → 高いで視覚的な階層を表現
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F7F2F1",
  surfaceContainer: "#F2ECEB",
  surfaceContainerHigh: "#ECE6E5",
  surfaceContainerHighest: "#E6E1E0",

  // Outline - 境界線、区切り線
  outline: "#79747E",
  outlineVariant: "#CAC4D0",

  // Background
  background: "#FFFBFF",
  onBackground: "#1C1B1F",

  // Inverse - ダークモード要素をライトモードで使用
  inverseSurface: "#313033",
  inverseOnSurface: "#F4EFF4",
  inversePrimary: "#FFB4A1",

  // Scrim - モーダルオーバーレイ
  scrim: "#000000",
} as const

// Material 3のエレベーション（影のレベル）
// 階層が上がるほど影が強くなる
export const md3Elevation = {
  level0: "none",
  level1: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
  level2: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)",
  level3: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)",
  level4: "0 2px 3px 0 rgba(0, 0, 0, 0.3), 0 6px 10px 4px rgba(0, 0, 0, 0.15)",
  level5: "0 4px 4px 0 rgba(0, 0, 0, 0.3), 0 8px 12px 6px rgba(0, 0, 0, 0.15)",
} as const

// Material 3のシェイプ（角丸）
// 5段階のスケール: extraSmall → full
export const md3Shape = {
  none: "0",
  extraSmall: "4px",    // 小さな要素（バッジ、チップ内アイコン）
  small: "8px",         // コンパクトな要素（チップ、スナックバー）
  medium: "12px",       // カード、ダイアログ
  large: "16px",        // FAB、シート
  extraLarge: "28px",   // 大きなカード、フルスクリーンシート
  full: "9999px",       // 完全な丸（ボタン、バッジ）
} as const

// Material 3のモーション（アニメーション）
export const md3Motion = {
  // Duration（継続時間）
  durationShort1: "50ms",
  durationShort2: "100ms",
  durationShort3: "150ms",
  durationShort4: "200ms",
  durationMedium1: "250ms",
  durationMedium2: "300ms",
  durationMedium3: "350ms",
  durationMedium4: "400ms",
  durationLong1: "450ms",
  durationLong2: "500ms",

  // Easing（イージング）
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
  easingStandardDecelerate: "cubic-bezier(0, 0, 0, 1)",
  easingStandardAccelerate: "cubic-bezier(0.3, 0, 1, 1)",
  easingEmphasized: "cubic-bezier(0.2, 0, 0, 1)",
  easingEmphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  easingEmphasizedAccelerate: "cubic-bezier(0.3, 0, 0.8, 0.15)",
} as const

// Material 3のタイポグラフィスタイル
// 5カテゴリ × 3サイズ = 15スタイル
export const md3Typography = {
  // Display - 最大の見出し（ヒーローセクション、数字表示）
  displayLarge: {
    fontFamily: "'Abhaya Libre', serif",
    fontSize: 57,
    lineHeight: "64px",
    fontWeight: 400,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: "'Abhaya Libre', serif",
    fontSize: 45,
    lineHeight: "52px",
    fontWeight: 400,
  },
  displaySmall: {
    fontFamily: "'Abhaya Libre', serif",
    fontSize: 36,
    lineHeight: "44px",
    fontWeight: 400,
  },

  // Headline - セクション見出し
  headlineLarge: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 32,
    lineHeight: "40px",
    fontWeight: 400,
  },
  headlineMedium: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 28,
    lineHeight: "36px",
    fontWeight: 400,
  },
  headlineSmall: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 24,
    lineHeight: "32px",
    fontWeight: 400,
  },

  // Title - コンポーネントタイトル（カード、ダイアログ）
  titleLarge: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 22,
    lineHeight: "28px",
    fontWeight: 400,
  },
  titleMedium: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 16,
    lineHeight: "24px",
    fontWeight: 500,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: 0.1,
  },

  // Body - 本文テキスト
  bodyLarge: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 16,
    lineHeight: "24px",
    fontWeight: 400,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 400,
    letterSpacing: 0.4,
  },

  // Label - ボタン、ラベル、キャプション
  labelLarge: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: "'Zen Maru Gothic', sans-serif",
    fontSize: 11,
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: 0.5,
  },
} as const

// State Layer Opacity（状態レイヤーの透明度）
// ホバー、フォーカス、プレス状態の表現
export const md3StateLayer = {
  hover: 0.08,      // ホバー時
  focus: 0.12,      // フォーカス時
  pressed: 0.12,    // プレス時
  dragged: 0.16,    // ドラッグ時
} as const
