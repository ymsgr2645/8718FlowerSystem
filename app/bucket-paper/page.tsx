"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { md3 } from "@/lib/md3-theme"
import { inventoryApi, itemsApi, settingsApi, storesApi, type Arrival, type Item, type Supplier, type Store } from "@/lib/api"
import { isFileSystemAccessSupported, loadDirHandle, pickDirectory, verifyPermission, saveFileToDir } from "@/lib/fs-access"
import { Printer, Flower2, CheckSquare, Square, FolderOpen, FolderCheck } from "lucide-react"

interface ArrivalView extends Arrival {
  item_name: string
  variety: string
  color: string
  supplier_name: string
}

const FALLBACK_STORES = [
  "豊平", "月寒", "新琴似", "山の手", "手稲",
  "琴似", "澄川", "大曲", "北野", "通信販売", "委託",
]
const STORE_COLS = 6
const REFERENCE_WIDTH = 1122
const STORAGE_KEY = "8718-printed-arrivals"

export default function BucketPaperPage() {
  const [arrivals, setArrivals] = useState<ArrivalView[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [printCounts, setPrintCounts] = useState<Map<number, number>>(() => {
    if (typeof window === "undefined") return new Map()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return new Map()
      const parsed = JSON.parse(stored)
      // 旧形式（配列）との後方互換
      if (Array.isArray(parsed)) {
        return new Map(parsed.map((id: number) => [id, 1]))
      }
      return new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v as number]))
    } catch { return new Map() }
  })
  const [saveDir, setSaveDir] = useState<FileSystemDirectoryHandle | null>(null)
  const [saveDirName, setSaveDirName] = useState<string>("")
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // 在庫ありの入荷を日付ごとにグループ化（新しい順）
  const dateGroups = useMemo(() => {
    const groups = new Map<string, ArrivalView[]>()
    for (const a of arrivals) {
      const date = a.arrived_at?.split("T")[0] || ""
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date)!.push(a)
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }))
  }, [arrivals])

  // 表示順でフラット化した選択済みアイテム（印刷順序と一致）
  const selectedArrivals = useMemo(
    () => dateGroups.flatMap(g => g.items).filter(a => selected.has(a.id)),
    [dateGroups, selected],
  )

  // 初期データ読み込み
  useEffect(() => {
    Promise.all([
      settingsApi.getSuppliers(),
      itemsApi.getAll({ limit: 1000 }),
      storesApi.getAll(),
    ]).then(([sup, it, st]) => {
      setSuppliers(sup)
      setItems(it)
      setStores(st)
    }).catch(() => {})
    if (isFileSystemAccessSupported()) {
      loadDirHandle("bucket-paper-dir").then(async (h) => {
        if (h && await verifyPermission(h).catch(() => false)) {
          setSaveDir(h)
          setSaveDirName(h.name)
        }
      }).catch(() => {})
    }
  }, [])

  // 在庫のある入荷データ取得
  useEffect(() => {
    if (suppliers.length === 0 || items.length === 0) return
    setLoading(true)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    inventoryApi.getArrivals({ date_from: sixMonthsAgo.toISOString().split("T")[0], limit: 5000 })
      .then((data) => {
        const itemMap = new Map(items.map(i => [i.id, i]))
        const supMap = new Map(suppliers.map(s => [s.id, s.name]))
        const inStock = data
          .filter(a => (a.remaining_quantity ?? a.quantity) > 0)
          .map(a => {
            const item = itemMap.get(a.item_id)
            return {
              ...a,
              item_name: a.item_name || item?.name || "",
              variety: a.item_variety || item?.variety || "",
              color: a.color || "",
              supplier_name: a.supplier_name || (a.supplier_id ? supMap.get(a.supplier_id) || "" : ""),
            }
          })
        setArrivals(inStock)
        // 未印刷を自動選択
        setSelected(new Set(inStock.filter(a => !(printCounts.get(a.id) || 0)).map(a => a.id)))
      })
      .catch(() => setArrivals([]))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliers, items])

  const formatDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`
  }
  const formatShortDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAll = () => setSelected(new Set(arrivals.map(a => a.id)))
  const selectNone = () => setSelected(new Set())

  const scrollToDate = (date: string) => {
    sectionRefs.current.get(date)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const markAsPrinted = (ids: number[]) => {
    setPrintCounts(prev => {
      const next = new Map(prev)
      ids.forEach(id => next.set(id, (next.get(id) || 0) + 1))
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(next))) } catch {}
      return next
    })
  }

  const handlePickDir = async () => {
    const h = await pickDirectory("bucket-paper-dir")
    if (h) { setSaveDir(h); setSaveDirName(h.name) }
  }

  // 印刷 + PDF自動保存
  const handlePrintAndSave = async () => {
    if (selectedArrivals.length === 0) return
    setGenerating(true)
    const targets = selectedArrivals
    const today = new Date().toISOString().split("T")[0]
    // 各アイテムの次の印刷番号を事前計算
    const nextNums = new Map(targets.map(a => [a.id, (printCounts.get(a.id) || 0) + 1]))

    // 1) ブラウザ印刷
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>カップ印刷 ${today}</title>
        <style>
          @page { size: A4 landscape; margin: 3mm; }
          .page { width: 100%; height: 100vh; display: flex; page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
          ${getPrintCSS()}
          .half { padding: 4mm; }
          .store-table { width: 100%; }
        </style></head><body>`)
      for (let i = 0; i < targets.length; i += 2) {
        printWindow.document.write(`<div class="page">`)
        printWindow.document.write(renderPrintHalf(targets[i], nextNums.get(targets[i].id) || 1))
        if (targets[i + 1]) {
          printWindow.document.write(renderPrintHalf(targets[i + 1], nextNums.get(targets[i + 1].id) || 1))
        } else {
          printWindow.document.write(`<div class="half"></div>`)
        }
        printWindow.document.write(`</div>`)
      }
      printWindow.document.write(`</body></html>`)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 300)
    }

    // 2) PDF自動保存
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas").then(m => m.default),
      ])
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      const W = 297, H = 210

      const container = document.createElement("div")
      container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1122px;"
      document.body.appendChild(container)
      const style = document.createElement("style")
      style.textContent = getPrintCSS()
      container.appendChild(style)

      for (let i = 0; i < targets.length; i += 2) {
        const pageDiv = document.createElement("div")
        pageDiv.style.cssText = "width:1122px;height:793px;display:flex;background:#fff;"
        pageDiv.innerHTML = renderPrintHalf(targets[i], nextNums.get(targets[i].id) || 1)
        if (targets[i + 1]) {
          pageDiv.innerHTML += renderPrintHalf(targets[i + 1], nextNums.get(targets[i + 1].id) || 1)
        } else {
          pageDiv.innerHTML += `<div class="half"></div>`
        }
        container.appendChild(pageDiv)
        const canvas = await html2canvas(pageDiv, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
        if (i > 0) doc.addPage()
        doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W, H)
        container.removeChild(pageDiv)
      }
      document.body.removeChild(container)

      const fileName = `カップ印刷_${today}.pdf`
      if (saveDir) {
        try {
          const pdfBlob = doc.output("blob")
          const savedPath = await saveFileToDir(saveDir, today, fileName, pdfBlob)
          console.info(`Saved: ${saveDirName}/${savedPath}`)
        } catch { doc.save(fileName) }
      } else {
        doc.save(fileName)
      }
    } catch (err) {
      console.error("PDF save failed:", err)
    }

    // 3) 印刷済みマーク
    markAsPrinted(targets.map(a => a.id))
    setGenerating(false)
  }

  // 印刷用CSS（ブラウザ印刷・PDF・プレビューで共有）
  function getPrintCSS(scope = ""): string {
    const s = scope ? `${scope} ` : ""
    return `
      ${scope ? `${scope} *` : "*"} { box-sizing: border-box; margin: 0; padding: 0; }
      ${scope || "body"}, ${s}div, ${s}span, ${s}td, ${s}th, ${s}table { font-family: 'Zen Maru Gothic', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif; }
      ${s}.half { flex: 1; padding: 15px; display: flex; flex-direction: column; color: #444; border-right: 1px dotted #999; }
      ${s}.half:last-child { border-right: none; }
      ${s}.top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      ${s}.notice { font-weight: 600; font-size: 9pt; color: #777; }
      ${s}.hero { margin-bottom: 4px; }
      ${s}.hero-name { font-weight: 900; font-size: 22pt; line-height: 1.2; word-break: break-word; color: #222; }
      ${s}.hero-variety { font-weight: 700; font-size: 15pt; color: #555; margin-top: 2px; word-break: break-word; }
      ${s}.hero-price { font-weight: 800; font-size: 16pt; margin-top: 3px; color: #333; }
      ${s}.hero-price .label { font-size: 8pt; font-weight: 500; color: #888; }
      ${s}.sub-info { display: flex; gap: 10px; font-size: 11pt; color: #777; margin-bottom: 6px; border-bottom: 0.5px dotted #ccc; padding-bottom: 5px; flex-wrap: wrap; }
      ${s}.sub-info span { white-space: nowrap; }
      ${s}.sub-info .val { font-weight: 600; color: #444; }
      ${s}.grade-row { display: flex; gap: 5px; margin-bottom: 6px; }
      ${s}.grade-box { flex: 1; border: 0.3px solid #aaa; border-radius: 2px; padding: 2px 4px; position: relative; height: 28px; }
      ${s}.grade-box .lbl { font-size: 6.5pt; color: #aaa; font-weight: 500; }
      ${s}.grade-box::before { content: ''; position: absolute; top: 14px; bottom: 3px; left: 33.33%; border-left: 0.3px dotted #ddd; }
      ${s}.grade-box::after { content: ''; position: absolute; top: 14px; bottom: 3px; left: 66.67%; border-left: 0.3px dotted #ddd; }
      ${s}.store-table { table-layout: fixed; width: 100%; flex: 1; border-collapse: collapse; }
      ${s}.store-table td.store-name { text-align: left; width: 22%; font-size: 10pt; font-weight: 700; border: 0.3px solid #bbb; padding: 2px 5px; color: #444; white-space: nowrap; }
      ${s}.store-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; vertical-align: middle; margin-right: 3px; }
      ${s}.guide-cell { position: relative; height: 22px; padding: 0; border: 0.3px solid #bbb; }
      ${s}.guide-cell::before { content: ''; position: absolute; top: 3px; bottom: 3px; left: 33.33%; border-left: 0.3px dotted #ddd; }
      ${s}.guide-cell::after { content: ''; position: absolute; top: 3px; bottom: 3px; left: 66.67%; border-left: 0.3px dotted #ddd; }
      ${s}.print-date { display: flex; justify-content: flex-end; align-items: center; gap: 8px; font-size: 6pt; color: #ccc; margin-top: 3px; }
      ${s}.print-num { font-size: 8pt; color: #aaa; font-weight: 600; }
    `
  }

  function renderPrintHalf(a: ArrivalView, printNum: number): string {
    const arrivalDate = a.arrived_at?.split("T")[0] || ""
    const now = new Date()
    const printDate = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
    const guideCells = Array.from({ length: STORE_COLS }).map(() => `<td class="guide-cell"></td>`).join("")
    const storeList = stores.length > 0 ? stores : FALLBACK_STORES.map(n => ({ name: n, color: undefined } as { name: string; color?: string }))
    const storeRows = storeList.map(s => {
      const dot = s.color ? `<span class="store-dot" style="background:${s.color}"></span>` : ""
      return `<tr><td class="store-name">${dot}${s.name}</td>${guideCells}</tr>`
    }).join("")
    return `<div class="half">
      <div class="top-row">
        <span class="notice">数量を記入してから持ち出すように</span>
      </div>
      <div class="hero">
        <div class="hero-name">${a.item_name}</div>
        <div class="hero-variety">${a.variety}</div>
        <div class="hero-price"><span class="label">仕入値 </span>&yen;${Number(a.wholesale_price || 0)}</div>
      </div>
      <div class="sub-info">
        ${a.display_id ? `<span>ID: <span class="val">${a.display_id}</span></span>` : ""}
        <span>仕入先: <span class="val">${a.supplier_name}</span></span>
        <span>仕入日: <span class="val">${formatDate(arrivalDate)}</span></span>
        <span>本数: <span class="val">${a.quantity}</span></span>
        ${a.color ? `<span>色: <span class="val">${a.color}</span></span>` : ""}
      </div>
      <div class="grade-row">
        <div class="grade-box"><span class="lbl">等級</span></div>
        <div class="grade-box"><span class="lbl">階級</span></div>
        <div class="grade-box"><span class="lbl">長さ</span></div>
        <div class="grade-box"><span class="lbl">輪数</span></div>
      </div>
      <table class="store-table">
        <colgroup><col style="width:22%">${Array.from({ length: STORE_COLS }).map(() => `<col style="width:${78 / STORE_COLS}%">`).join("")}</colgroup>
        ${storeRows}
      </table>
      <div class="print-date">
        ${printNum > 1 ? `<span class="print-num">${printNum}枚目</span>` : ""}
        印刷日: ${printDate}
      </div>
    </div>`
  }

  const totalTypes = arrivals.length
  const selectedCount = selected.size
  const selectedSheets = Math.ceil(selectedCount / 2)

  return (
    <MD3AppLayout title="カップ印刷" subtitle="倉庫在庫から印刷">
      {/* 仕入日ナビゲーション */}
      {dateGroups.length > 0 && (
        <MD3Card style={{ marginBottom: 16 }}>
          <MD3CardContent style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: md3.onSurfaceVariant, marginRight: 4 }}>仕入日:</span>
              {dateGroups.map(({ date, items: groupItems }) => {
                const unprintedCount = groupItems.filter(a => !(printCounts.get(a.id) || 0)).length
                return (
                  <button
                    key={date}
                    onClick={() => scrollToDate(date)}
                    style={{
                      border: "none", borderRadius: 8, padding: "6px 12px",
                      cursor: "pointer", fontSize: 13, fontWeight: 600,
                      backgroundColor: unprintedCount > 0 ? md3.primaryContainer : md3.surfaceContainerHighest,
                      color: unprintedCount > 0 ? md3.onPrimaryContainer : md3.onSurfaceVariant,
                      fontFamily: "'Zen Maru Gothic', sans-serif",
                      transition: "all 100ms ease",
                    }}
                  >
                    {formatShortDate(date)}
                    <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4, opacity: 0.7 }}>
                      ({groupItems.length})
                    </span>
                    {unprintedCount > 0 && (
                      <span style={{
                        marginLeft: 4, fontSize: 10, fontWeight: 700,
                        backgroundColor: md3.primary, color: md3.onPrimary,
                        borderRadius: 10, padding: "1px 5px",
                      }}>
                        {unprintedCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </MD3CardContent>
        </MD3Card>
      )}

      {/* サマリー + 操作 */}
      <MD3Card style={{ marginBottom: 16 }}>
        <MD3CardContent>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
              <Flower2 size={18} color={md3.primary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: md3.onSurface }}>
                在庫 {totalTypes}種類
              </span>
              {totalTypes > 0 && (
                <span style={{ fontSize: 13, color: md3.primary, fontWeight: 600 }}>
                  {selectedCount}件選択 / A4 {selectedSheets}枚
                </span>
              )}
            </div>
            {isFileSystemAccessSupported() && (
              <MD3Button variant="outlined" onClick={handlePickDir}>
                {saveDir ? <FolderCheck size={16} /> : <FolderOpen size={16} />}
                {saveDir ? saveDirName : "保存先"}
              </MD3Button>
            )}
            {totalTypes > 0 && (
              <>
                <MD3Button
                  variant="outlined"
                  onClick={selected.size === arrivals.length ? selectNone : selectAll}
                >
                  {selected.size === arrivals.length ? <Square size={16} /> : <CheckSquare size={16} />}
                  {selected.size === arrivals.length ? "全解除" : "全選択"}
                </MD3Button>
                <MD3Button variant="filled" onClick={handlePrintAndSave} disabled={selectedCount === 0 || loading || generating}>
                  <Printer size={16} /> {generating ? "処理中..." : "印刷 / 保存"}
                </MD3Button>
              </>
            )}
          </div>
        </MD3CardContent>
      </MD3Card>

      {/* 在庫一覧 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
      ) : arrivals.length === 0 ? (
        <MD3Card>
          <MD3CardContent>
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
              倉庫に在庫がありません
            </div>
          </MD3CardContent>
        </MD3Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <style dangerouslySetInnerHTML={{ __html: getPrintCSS(".bp-preview") }} />
          {dateGroups.map(({ date, items: groupItems }) => (
            <div key={date} ref={el => { if (el) sectionRefs.current.set(date, el) }}>
              {/* 日付ヘッダー */}
              <div style={{
                fontSize: 14, fontWeight: 700, color: md3.onSurfaceVariant,
                marginBottom: 8, paddingBottom: 4,
                borderBottom: `2px solid ${md3.outlineVariant}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>{formatDate(date)}</span>
                <span style={{ fontSize: 12, fontWeight: 400 }}>({groupItems.length}種類)</span>
              </div>
              {/* A4ページグリッド */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {Array.from({ length: Math.ceil(groupItems.length / 2) }).map((_, pageIdx) => {
                  const left = groupItems[pageIdx * 2]
                  const right = groupItems[pageIdx * 2 + 1]
                  const leftSel = selected.has(left.id)
                  const rightSel = right ? selected.has(right.id) : false
                  const leftPrinted = (printCounts.get(left.id) || 0) > 0
                  const rightPrinted = right ? (printCounts.get(right.id) || 0) > 0 : false
                  return (
                    <ScaledPage key={left.id}>
                      <div className="bp-preview" style={{ display: "flex", height: "100%" }}>
                        <div
                          style={{
                            flex: 1, position: "relative", cursor: "pointer", display: "flex",
                            opacity: leftSel ? 1 : leftPrinted ? 0.25 : 0.5,
                            transition: "opacity 150ms",
                          }}
                          onClick={() => toggleSelect(left.id)}
                        >
                          <SelectBadge selected={leftSel} />
                          <div dangerouslySetInnerHTML={{ __html: renderPrintHalf(left, (printCounts.get(left.id) || 0) + 1) }} style={{ display: "contents" }} />
                        </div>
                        <div style={{ width: 0, borderLeft: "1px dotted #999", flexShrink: 0 }} />
                        {right ? (
                          <div
                            style={{
                              flex: 1, position: "relative", cursor: "pointer", display: "flex",
                              opacity: rightSel ? 1 : rightPrinted ? 0.25 : 0.5,
                              transition: "opacity 150ms",
                            }}
                            onClick={() => toggleSelect(right.id)}
                          >
                            <SelectBadge selected={rightSel} />
                            <div dangerouslySetInnerHTML={{ __html: renderPrintHalf(right, (printCounts.get(right.id) || 0) + 1) }} style={{ display: "contents" }} />
                          </div>
                        ) : (
                          <div style={{ flex: 1 }} />
                        )}
                      </div>
                    </ScaledPage>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </MD3AppLayout>
  )
}

function ScaledPage({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setScale(w / REFERENCE_WIDTH)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={containerRef} style={{
      aspectRatio: "297 / 210", overflow: "hidden", position: "relative",
      border: `1px solid ${md3.outlineVariant}`, borderRadius: 8, backgroundColor: "#fff",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: REFERENCE_WIDTH, height: REFERENCE_WIDTH * 210 / 297,
        transform: `scale(${scale})`, transformOrigin: "top left",
      }}>
        {children}
      </div>
    </div>
  )
}

function SelectBadge({ selected }: { selected: boolean }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 2,
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: selected ? "transparent" : "rgba(0,0,0,0.08)",
      pointerEvents: "none",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: selected ? md3.primary : md3.surfaceContainerHighest,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: selected ? md3.onPrimary : md3.onSurfaceVariant,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        opacity: selected ? 0.85 : 1,
      }}>
        {selected ? <CheckSquare size={22} /> : <Square size={22} />}
      </div>
    </div>
  )
}
