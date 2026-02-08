"use client"

import { useEffect, useState } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import { settingsApi, Setting } from "@/lib/api"
import { md3 } from "@/lib/md3-theme"

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const settingsData = await settingsApi.getAll()
      setSettings(settingsData)
      setLoading(false)
    }
    load().catch(console.error)
  }, [])

  const updateSetting = async (key: string, value: string) => {
    await settingsApi.update(key, value)
    setSettings(await settingsApi.getAll())
  }

  const getSetting = (key: string, defaultValue: string = "") => {
    return settings.find((s) => s.key === key)?.value || defaultValue
  }

  if (loading) {
    return (
      <MD3AppLayout title="設定" subtitle="システム設定">
        <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
      </MD3AppLayout>
    )
  }

  return (
    <MD3AppLayout title="設定" subtitle="税率・アラート・システム設定">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* 税率設定 */}
        <MD3Card>
          <MD3CardHeader title="税率設定" />
          <MD3CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <MD3NumberField
                label="標準税率"
                value={getSetting("tax_rate", "0.10")}
                onChange={(v) => updateSetting("tax_rate", v)}
                fullWidth
              />
              <MD3NumberField
                label="軽減税率"
                value={getSetting("tax_rate_reduced", "0.08")}
                onChange={(v) => updateSetting("tax_rate_reduced", v)}
                fullWidth
              />
            </div>
          </MD3CardContent>
        </MD3Card>

        {/* アラート設定 */}
        <MD3Card>
          <MD3CardHeader title="アラート設定" />
          <MD3CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <MD3NumberField
                label="長期在庫アラート日数"
                value={getSetting("inventory_alert_days", "5")}
                onChange={(v) => updateSetting("inventory_alert_days", v)}
                fullWidth
              />
              <MD3NumberField
                label="資材在庫少アラート閾値"
                value={getSetting("low_stock_alert_threshold", "5")}
                onChange={(v) => updateSetting("low_stock_alert_threshold", v)}
                fullWidth
              />
            </div>
          </MD3CardContent>
        </MD3Card>

        {/* 請求書設定 */}
        <MD3Card>
          <MD3CardHeader title="請求書設定" />
          <MD3CardContent>
            <MD3TextField
              label="請求書番号形式"
              value={getSetting("invoice_number_format", "")}
              onChange={(e) => updateSetting("invoice_number_format", e.target.value)}
              fullWidth
            />
          </MD3CardContent>
        </MD3Card>
      </div>
    </MD3AppLayout>
  )
}
