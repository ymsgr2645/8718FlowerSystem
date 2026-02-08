"use client"

import { useEffect, useState } from "react"
import { Reorder, AnimatePresence, motion } from "motion/react"
import MD3AppLayout from "@/components/layout/MD3AppLayout"
import { MD3Card, MD3CardHeader, MD3CardContent } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { MD3Select } from "@/components/md3/MD3Select"
import { MD3TextField } from "@/components/md3/MD3TextField"
import { MD3NumberField } from "@/components/md3/MD3NumberField"
import { MD3Dialog, MD3DialogHeader, MD3DialogTitle, MD3DialogBody, MD3DialogFooter } from "@/components/md3/MD3Dialog"
import { MD3StatusBadge } from "@/components/md3/MD3Badge"
import {
  MD3Table,
  MD3TableHead,
  MD3TableBody,
  MD3TableRow,
  MD3TableHeaderCell,
  MD3TableCell,
} from "@/components/md3/MD3Table"
import { storesApi, itemsApi, suppliesApi, settingsApi, Store, Item, Supply, Supplier } from "@/lib/api"
import { MD3Switch } from "@/components/md3/MD3Switch"
import { Building2, Package, Truck, Plus, Pencil, Users, GripVertical } from "lucide-react"
import { md3 } from "@/lib/md3-theme"

type TabId = "stores" | "items" | "supplies" | "suppliers" | "users"

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "stores", label: "店舗", icon: Building2 },
  { id: "items", label: "商品", icon: Package },
  { id: "supplies", label: "資材", icon: Package },
  { id: "suppliers", label: "卸売業者", icon: Truck },
  { id: "users", label: "ユーザー", icon: Users },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("stores")

  const [stores, setStores] = useState<Store[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [storeDialogOpen, setStoreDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [storeForm, setStoreForm] = useState({
    name: "",
    operation_type: "headquarters",
    store_type: "store",
    email: "",
  })

  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [itemForm, setItemForm] = useState({
    item_code: "",
    name: "",
    variety: "",
    category: "",
    default_unit_price: "",
    tax_rate: "0.10",
  })

  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false)
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null)
  const [supplyForm, setSupplyForm] = useState({
    name: "",
    specification: "",
    unit_price: "",
    category: "",
  })

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    csv_encoding: "utf-8",
    csv_format: "",
  })

  // 有効/無効で分けた資材リスト
  const activeSupplies = supplies.filter((s) => s.is_active)
  const inactiveSupplies = supplies.filter((s) => !s.is_active)

  // Reorderで並び替え時の処理
  const handleReorder = async (newOrder: Supply[]) => {
    const reorderedSupplies = [...newOrder, ...inactiveSupplies]
    setSupplies(reorderedSupplies)

    // APIに保存
    const reorderItems = newOrder.map((s, index) => ({
      id: s.id,
      sort_order: index,
    }))
    await suppliesApi.reorder(reorderItems)
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [storesData, itemsData, suppliesData, suppliersData] = await Promise.all([
          storesApi.getAll(),
          itemsApi.getAll({ limit: 500 }),
          suppliesApi.getAll(true),  // 無効な資材も含めて取得
          settingsApi.getSuppliers(),
        ])
        setStores(storesData)
        setItems(itemsData)
        setSupplies(suppliesData)
        setSuppliers(suppliersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "データの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openStoreDialog = (store?: Store) => {
    setEditingStore(store || null)
    setStoreForm({
      name: store?.name || "",
      operation_type: store?.operation_type || "headquarters",
      store_type: store?.store_type || "store",
      email: store?.email || "",
    })
    setStoreDialogOpen(true)
  }

  const saveStore = async () => {
    if (!storeForm.name) return
    if (editingStore) {
      await storesApi.update(editingStore.id, storeForm)
    } else {
      await storesApi.create(storeForm)
    }
    setStores(await storesApi.getAll())
    setStoreDialogOpen(false)
  }

  const openItemDialog = (item?: Item) => {
    setEditingItem(item || null)
    setItemForm({
      item_code: item?.item_code || "",
      name: item?.name || "",
      variety: item?.variety || "",
      category: item?.category || "",
      default_unit_price: item?.default_unit_price ? String(item.default_unit_price) : "",
      tax_rate: item?.tax_rate ? String(item.tax_rate) : "0.10",
    })
    setItemDialogOpen(true)
  }

  const saveItem = async () => {
    if (!itemForm.name) return
    if (editingItem) {
      await itemsApi.update(editingItem.id, {
        item_code: itemForm.item_code || undefined,
        name: itemForm.name,
        variety: itemForm.variety || undefined,
        category: itemForm.category || undefined,
        default_unit_price: itemForm.default_unit_price ? Number(itemForm.default_unit_price) : undefined,
        tax_rate: itemForm.tax_rate ? Number(itemForm.tax_rate) : undefined,
      })
    } else {
      await itemsApi.create({
        item_code: itemForm.item_code || undefined,
        name: itemForm.name,
        variety: itemForm.variety || undefined,
        category: itemForm.category || undefined,
        default_unit_price: itemForm.default_unit_price ? Number(itemForm.default_unit_price) : undefined,
        tax_rate: itemForm.tax_rate ? Number(itemForm.tax_rate) : undefined,
      })
    }
    setItems(await itemsApi.getAll({ limit: 500 }))
    setItemDialogOpen(false)
  }

  const openSupplyDialog = (supply?: Supply) => {
    setEditingSupply(supply || null)
    setSupplyForm({
      name: supply?.name || "",
      specification: supply?.specification || "",
      unit_price: supply?.unit_price ? String(supply.unit_price) : "",
      category: supply?.category || "",
    })
    setSupplyDialogOpen(true)
  }

  const saveSupply = async () => {
    if (!supplyForm.name) return
    if (editingSupply) {
      await suppliesApi.update(editingSupply.id, {
        name: supplyForm.name,
        specification: supplyForm.specification || undefined,
        unit_price: supplyForm.unit_price ? Number(supplyForm.unit_price) : undefined,
        category: supplyForm.category || undefined,
      })
    } else {
      await suppliesApi.create({
        name: supplyForm.name,
        specification: supplyForm.specification || undefined,
        unit_price: supplyForm.unit_price ? Number(supplyForm.unit_price) : undefined,
        category: supplyForm.category || undefined,
      })
    }
    setSupplies(await suppliesApi.getAll(true))  // 無効な資材も含めて取得
    setSupplyDialogOpen(false)
  }

  const toggleSupplyActive = async (supply: Supply) => {
    const newIsActive = !supply.is_active
    await suppliesApi.update(supply.id, { is_active: newIsActive })
    // ローカルステートを更新し、無効を後ろにソート
    setSupplies((prev) => {
      const updated = prev.map((s) => (s.id === supply.id ? { ...s, is_active: newIsActive } : s))
      // 有効を先に、無効を後ろに
      return updated.sort((a, b) => {
        if (a.is_active === b.is_active) return (a.sort_order || 0) - (b.sort_order || 0)
        return a.is_active ? -1 : 1
      })
    })
  }

  const openSupplierDialog = (supplier?: Supplier) => {
    setEditingSupplier(supplier || null)
    setSupplierForm({
      name: supplier?.name || "",
      email: supplier?.email || "",
      csv_encoding: supplier?.csv_encoding || "utf-8",
      csv_format: supplier?.csv_format || "",
    })
    setSupplierDialogOpen(true)
  }

  const saveSupplier = async () => {
    if (!supplierForm.name) return
    if (editingSupplier) {
      await settingsApi.updateSupplier(editingSupplier.id, supplierForm)
    } else {
      await settingsApi.createSupplier(supplierForm)
    }
    setSuppliers(await settingsApi.getSuppliers())
    setSupplierDialogOpen(false)
  }

  if (loading) {
    return (
      <MD3AppLayout title="マスタ管理" subtitle="店舗・商品・資材・卸売業者の管理">
        <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
      </MD3AppLayout>
    )
  }

  if (error) {
    return (
      <MD3AppLayout title="マスタ管理" subtitle="店舗・商品・資材・卸売業者の管理">
        <MD3Card>
          <MD3CardContent>
            <div style={{ textAlign: "center", padding: 48, color: md3.error }}>
              <p>エラー: {error}</p>
              <MD3Button onClick={() => window.location.reload()}>再読み込み</MD3Button>
            </div>
          </MD3CardContent>
        </MD3Card>
      </MD3AppLayout>
    )
  }

  return (
    <MD3AppLayout title="マスタ管理" subtitle="店舗・商品・資材・卸売業者の管理">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <MD3Button key={tab.id} variant={activeTab === tab.id ? "filled" : "text"} onClick={() => setActiveTab(tab.id)}>
              <Icon size={18} style={{ marginRight: 8 }} />
              {tab.label}
            </MD3Button>
          )
        })}
      </div>

      {activeTab === "stores" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            onClick={() => openStoreDialog()}
            style={{
              padding: 20,
              borderRadius: 16,
              border: `2px dashed ${md3.primary}`,
              backgroundColor: md3.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = md3.primary
              e.currentTarget.style.color = md3.onPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = md3.primaryContainer
              e.currentTarget.style.color = md3.onPrimaryContainer
            }}
          >
            <Plus size={24} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>新しい店舗を追加</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {stores.map((store) => (
              <div
                key={store.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${store.is_active ? md3.outlineVariant : md3.outline}`,
                  backgroundColor: store.is_active ? md3.surface : md3.surfaceContainerHighest,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: store.is_active ? md3.onSurface : md3.outline }}>
                      {store.name}
                    </p>
                    {store.email && (
                      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: md3.onSurfaceVariant }}>
                        {store.email}
                      </p>
                    )}
                  </div>
                  <MD3Button variant="text" size="small" onClick={() => openStoreDialog(store)}>
                    <Pencil size={14} />
                  </MD3Button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <MD3StatusBadge
                    status={store.operation_type === "headquarters" ? "info" : "neutral"}
                    label={store.operation_type === "headquarters" ? "直営" : "委託"}
                    size="small"
                  />
                  <MD3StatusBadge
                    status={store.is_active ? "success" : "neutral"}
                    label={store.is_active ? "稼働中" : "停止"}
                    size="small"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            onClick={() => openItemDialog()}
            style={{
              padding: 20,
              borderRadius: 16,
              border: `2px dashed ${md3.primary}`,
              backgroundColor: md3.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = md3.primary
              e.currentTarget.style.color = md3.onPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = md3.primaryContainer
              e.currentTarget.style.color = md3.onPrimaryContainer
            }}
          >
            <Plus size={24} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>新しい商品を追加</span>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
              商品がありません
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${md3.outlineVariant}`,
                    backgroundColor: md3.surface,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: md3.onSurface }}>
                        {item.name}
                      </p>
                      {item.item_code && (
                        <p style={{ margin: "4px 0 0 0", fontSize: 11, fontFamily: "monospace", color: md3.onSurfaceVariant }}>
                          {item.item_code}
                        </p>
                      )}
                    </div>
                    <MD3Button variant="text" size="small" onClick={() => openItemDialog(item)}>
                      <Pencil size={14} />
                    </MD3Button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {item.category && (
                      <MD3StatusBadge status="neutral" label={item.category} size="small" />
                    )}
                    <span style={{ fontSize: 14, fontWeight: 500, color: md3.primary, marginLeft: "auto" }}>
                      {item.default_unit_price ? `¥${Number(item.default_unit_price).toLocaleString()}` : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "supplies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 追加ボタンを大きく目立たせる */}
          <div
            onClick={() => openSupplyDialog()}
            style={{
              padding: 20,
              borderRadius: 16,
              border: `2px dashed ${md3.primary}`,
              backgroundColor: md3.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = md3.primary
              e.currentTarget.style.color = md3.onPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = md3.primaryContainer
              e.currentTarget.style.color = md3.onPrimaryContainer
            }}
          >
            <Plus size={24} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>新しい資材を追加</span>
          </div>

          <p style={{ margin: 0, fontSize: 13, color: md3.onSurfaceVariant }}>
            ドラッグで並び替え可能 ・ 無効な資材は後ろに表示されます
          </p>

          {/* 有効な資材（ドラッグ可能） */}
          <Reorder.Group
            axis="y"
            values={activeSupplies}
            onReorder={handleReorder}
            style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", padding: 0, margin: 0 }}
          >
            <AnimatePresence>
              {activeSupplies.map((supply) => (
                <Reorder.Item
                  key={supply.id}
                  value={supply}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  whileDrag={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${md3.outlineVariant}`,
                    backgroundColor: md3.surface,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "grab",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ color: md3.outlineVariant, marginRight: 8, cursor: "grab" }}>
                      <GripVertical size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: md3.onSurface }}>
                        {supply.name}
                      </p>
                      {supply.specification && (
                        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: md3.onSurfaceVariant }}>
                          {supply.specification}
                        </p>
                      )}
                    </div>
                    <MD3Button variant="text" size="small" onClick={() => openSupplyDialog(supply)}>
                      <Pencil size={14} />
                    </MD3Button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: md3.primary }}>
                      {supply.unit_price ? `¥${Number(supply.unit_price).toLocaleString()}` : "-"}
                    </span>
                    <MD3Switch checked={true} onChange={() => toggleSupplyActive(supply)} />
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          {/* 無効な資材（ドラッグ不可） */}
          {inactiveSupplies.length > 0 && (
            <>
              <p style={{ margin: "16px 0 0 0", fontSize: 12, color: md3.outline, fontWeight: 500 }}>
                無効な資材
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <AnimatePresence>
                  {inactiveSupplies.map((supply) => (
                    <motion.div
                      key={supply.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      layout
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${md3.outline}`,
                        backgroundColor: md3.surfaceContainerHighest,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 600,
                            color: md3.outline,
                            textDecoration: "line-through",
                          }}>
                            {supply.name}
                          </p>
                          {supply.specification && (
                            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: md3.outline }}>
                              {supply.specification}
                            </p>
                          )}
                        </div>
                        <MD3Button variant="text" size="small" onClick={() => openSupplyDialog(supply)}>
                          <Pencil size={14} />
                        </MD3Button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: md3.outline }}>
                          {supply.unit_price ? `¥${Number(supply.unit_price).toLocaleString()}` : "-"}
                        </span>
                        <MD3Switch checked={false} onChange={() => toggleSupplyActive(supply)} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "suppliers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            onClick={() => openSupplierDialog()}
            style={{
              padding: 20,
              borderRadius: 16,
              border: `2px dashed ${md3.primary}`,
              backgroundColor: md3.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = md3.primary
              e.currentTarget.style.color = md3.onPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = md3.primaryContainer
              e.currentTarget.style.color = md3.onPrimaryContainer
            }}
          >
            <Plus size={24} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>新しい卸売業者を追加</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${md3.outlineVariant}`,
                  backgroundColor: md3.surface,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: md3.onSurface }}>
                      {supplier.name}
                    </p>
                    {supplier.email && (
                      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: md3.onSurfaceVariant }}>
                        {supplier.email}
                      </p>
                    )}
                  </div>
                  <MD3Button variant="text" size="small" onClick={() => openSupplierDialog(supplier)}>
                    <Pencil size={14} />
                  </MD3Button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <MD3StatusBadge status="neutral" label={supplier.csv_encoding} size="small" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <MD3Card>
          <MD3CardHeader
            title="ユーザー"
            action={
              <MD3Button variant="filled" size="small" disabled>
                <Plus size={16} style={{ marginRight: 4 }} />
                追加
              </MD3Button>
            }
          />
          <MD3CardContent>
            <div style={{ textAlign: "center", padding: "48px 16px", color: md3.onSurfaceVariant }}>
              <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: 14, fontFamily: "'Zen Maru Gothic', sans-serif" }}>
                ユーザー管理機能は今後のアップデートで追加予定です
              </p>
            </div>
          </MD3CardContent>
        </MD3Card>
      )}

      {/* Dialogs */}
      <MD3Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
        <MD3DialogHeader>
          <MD3DialogTitle>{editingStore ? "店舗編集" : "店舗追加"}</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MD3TextField label="店舗名" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} fullWidth />
            <MD3Select
              label="運営種別"
              value={storeForm.operation_type}
              onChange={(e) => setStoreForm({ ...storeForm, operation_type: e.target.value })}
              options={[
                { value: "headquarters", label: "直営" },
                { value: "franchise", label: "委託" },
              ]}
              fullWidth
            />
            <MD3Select
              label="店舗種別"
              value={storeForm.store_type}
              onChange={(e) => setStoreForm({ ...storeForm, store_type: e.target.value })}
              options={[
                { value: "store", label: "店舗" },
                { value: "online", label: "通販" },
                { value: "consignment", label: "委託店" },
              ]}
              fullWidth
            />
            <MD3TextField label="メール" value={storeForm.email} onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })} fullWidth />
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="outlined" onClick={() => setStoreDialogOpen(false)}>キャンセル</MD3Button>
          <MD3Button onClick={saveStore}>保存</MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>

      <MD3Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <MD3DialogHeader>
          <MD3DialogTitle>{editingItem ? "商品編集" : "商品追加"}</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MD3TextField label="商品コード" value={itemForm.item_code} onChange={(e) => setItemForm({ ...itemForm, item_code: e.target.value })} fullWidth />
            <MD3TextField label="商品名" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} fullWidth />
            <MD3TextField label="品種" value={itemForm.variety} onChange={(e) => setItemForm({ ...itemForm, variety: e.target.value })} fullWidth />
            <MD3TextField label="カテゴリ" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} fullWidth />
            <MD3NumberField label="デフォルト単価" value={itemForm.default_unit_price} onChange={(v) => setItemForm({ ...itemForm, default_unit_price: v })} fullWidth />
            <MD3NumberField label="税率" value={itemForm.tax_rate} onChange={(v) => setItemForm({ ...itemForm, tax_rate: v })} fullWidth />
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="outlined" onClick={() => setItemDialogOpen(false)}>キャンセル</MD3Button>
          <MD3Button onClick={saveItem}>保存</MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>

      <MD3Dialog open={supplyDialogOpen} onOpenChange={setSupplyDialogOpen}>
        <MD3DialogHeader>
          <MD3DialogTitle>{editingSupply ? "資材編集" : "資材追加"}</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MD3TextField label="資材名" value={supplyForm.name} onChange={(e) => setSupplyForm({ ...supplyForm, name: e.target.value })} fullWidth />
            <MD3TextField label="規格" value={supplyForm.specification} onChange={(e) => setSupplyForm({ ...supplyForm, specification: e.target.value })} fullWidth />
            <MD3NumberField label="単価" value={supplyForm.unit_price} onChange={(v) => setSupplyForm({ ...supplyForm, unit_price: v })} fullWidth />
            <MD3TextField label="カテゴリ" value={supplyForm.category} onChange={(e) => setSupplyForm({ ...supplyForm, category: e.target.value })} fullWidth />
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="outlined" onClick={() => setSupplyDialogOpen(false)}>キャンセル</MD3Button>
          <MD3Button onClick={saveSupply}>保存</MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>

      <MD3Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <MD3DialogHeader>
          <MD3DialogTitle>{editingSupplier ? "卸売業者編集" : "卸売業者追加"}</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MD3TextField label="業者名" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} fullWidth />
            <MD3TextField label="メール" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} fullWidth />
            <MD3Select
              label="CSV文字コード"
              value={supplierForm.csv_encoding}
              onChange={(e) => setSupplierForm({ ...supplierForm, csv_encoding: e.target.value })}
              options={[
                { value: "utf-8", label: "UTF-8" },
                { value: "shift_jis", label: "Shift_JIS" },
              ]}
              fullWidth
            />
            <MD3TextField label="CSV形式（任意）" value={supplierForm.csv_format} onChange={(e) => setSupplierForm({ ...supplierForm, csv_format: e.target.value })} fullWidth />
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="outlined" onClick={() => setSupplierDialogOpen(false)}>キャンセル</MD3Button>
          <MD3Button onClick={saveSupplier}>保存</MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>
    </MD3AppLayout>
  )
}
