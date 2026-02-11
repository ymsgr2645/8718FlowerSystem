"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import { Building2, Package, Flower2, Truck, Plus, Pencil, Users, GripVertical, Trash2 } from "lucide-react"
import { md3 } from "@/lib/md3-theme"
import { MD3ColorWheel } from "@/components/md3/MD3ColorWheel"

type TabId = "stores" | "items" | "supplies" | "suppliers" | "users"

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "stores", label: "店舗", icon: Building2 },
  { id: "items", label: "花", icon: Flower2 },
  { id: "supplies", label: "資材", icon: Package },
  { id: "suppliers", label: "卸売業者", icon: Truck },
  { id: "users", label: "ユーザー", icon: Users },
]

function SortableTile({ id, children, style }: { id: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

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
  const [storeForm, setStoreForm] = useState<{
    name: string
    operation_type: "headquarters" | "franchise"
    store_type: "store" | "online" | "consignment"
    email: string
    color: string
  }>({
    name: "",
    operation_type: "headquarters",
    store_type: "store",
    email: "",
    color: "#E53935",
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

  // 削除確認ステート
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 有効/無効で分けた資材リスト
  const activeSupplies = supplies.filter((s) => s.is_active)
  const inactiveSupplies = supplies.filter((s) => !s.is_active)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleStoreDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = stores.findIndex((s) => s.id === active.id)
    const newIndex = stores.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(stores, oldIndex, newIndex)
    setStores(newOrder)
    await storesApi.reorder(newOrder.map((s, i) => ({ id: s.id, sort_order: i })))
  }

  const handleItemDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((s) => s.id === active.id)
    const newIndex = items.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(items, oldIndex, newIndex)
    setItems(newOrder)
    await itemsApi.reorder(newOrder.map((s, i) => ({ id: s.id, sort_order: i })))
  }

  const handleSupplyDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = activeSupplies.findIndex((s) => s.id === active.id)
    const newIndex = activeSupplies.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(activeSupplies, oldIndex, newIndex)
    setSupplies([...newOrder, ...inactiveSupplies])
    await suppliesApi.reorder(newOrder.map((s, i) => ({ id: s.id, sort_order: i })))
  }

  const handleSupplierDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = suppliers.findIndex((s) => s.id === active.id)
    const newIndex = suppliers.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(suppliers, oldIndex, newIndex)
    setSuppliers(newOrder)
    await settingsApi.reorderSuppliers(newOrder.map((s, i) => ({ id: s.id, sort_order: i })))
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

  const executeDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      if (confirmDelete.type === "store") {
        await storesApi.delete(confirmDelete.id)
        setStores(await storesApi.getAll())
        setStoreDialogOpen(false)
      } else if (confirmDelete.type === "item") {
        await itemsApi.delete(confirmDelete.id)
        setItems(await itemsApi.getAll({ limit: 500 }))
        setItemDialogOpen(false)
      } else if (confirmDelete.type === "supply") {
        await suppliesApi.delete(confirmDelete.id)
        setSupplies(await suppliesApi.getAll(true))
        setSupplyDialogOpen(false)
      } else if (confirmDelete.type === "supplier") {
        await settingsApi.deleteSupplier(confirmDelete.id)
        setSuppliers(await settingsApi.getSuppliers())
        setSupplierDialogOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました")
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const openStoreDialog = (store?: Store) => {
    setEditingStore(store || null)
    setStoreForm({
      name: store?.name || "",
      operation_type: store?.operation_type || "headquarters",
      store_type: store?.store_type || "store",
      email: store?.email || "",
      color: store?.color || "#E53935",
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
      <MD3AppLayout title="マスタ管理" subtitle="店舗・花・資材・卸売業者の管理">
        <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>読み込み中...</div>
      </MD3AppLayout>
    )
  }

  if (error) {
    return (
      <MD3AppLayout title="マスタ管理" subtitle="店舗・花・資材・卸売業者の管理">
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
    <MD3AppLayout title="マスタ管理" subtitle="店舗・花・資材・卸売業者の管理">
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
              padding: 12,
              borderRadius: 10,
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

          <p style={{ margin: 0, fontSize: 13, color: md3.onSurfaceVariant }}>
            ドラッグで並び替え可能
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStoreDragEnd}>
            <SortableContext items={stores.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {stores.map((store) => (
                  <SortableTile
                    key={store.id}
                    id={store.id}
                    style={{
                      width: 150,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${store.is_active ? md3.outlineVariant : md3.outline}`,
                      backgroundColor: store.is_active ? md3.surface : md3.surfaceContainerHighest,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      cursor: "grab",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <GripVertical size={12} style={{ color: md3.outlineVariant }} />
                      <MD3Button variant="text" size="small" onClick={() => openStoreDialog(store)} style={{ padding: 2 }}>
                        <Pencil size={11} />
                      </MD3Button>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: store.is_active ? md3.onSurface : md3.outline, display: "flex", alignItems: "center", gap: 6 }}>
                      {store.color && <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: store.color, flexShrink: 0 }} />}
                      {store.name}
                    </p>
                    {store.email && (
                      <p style={{ margin: 0, fontSize: 10, color: md3.onSurfaceVariant, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {store.email}
                      </p>
                    )}
                    <MD3StatusBadge
                      status={store.operation_type === "headquarters" ? "info" : "neutral"}
                      label={store.operation_type === "headquarters" ? "直営" : "委託"}
                      size="small"
                    />
                  </SortableTile>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {activeTab === "items" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            onClick={() => openItemDialog()}
            style={{
              padding: 12,
              borderRadius: 10,
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
            <span style={{ fontSize: 16, fontWeight: 600 }}>新しい花を追加</span>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: md3.onSurfaceVariant }}>
              花がありません
            </div>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 13, color: md3.onSurfaceVariant }}>
                ドラッグで並び替え可能
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {items.map((item) => (
                      <SortableTile
                        key={item.id}
                        id={item.id}
                        style={{
                          width: 150,
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1px solid ${md3.outlineVariant}`,
                          backgroundColor: md3.surface,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          cursor: "grab",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <GripVertical size={12} style={{ color: md3.outlineVariant }} />
                          <MD3Button variant="text" size="small" onClick={() => openItemDialog(item)} style={{ padding: 2 }}>
                            <Pencil size={11} />
                          </MD3Button>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: md3.onSurface }}>
                          {item.name}
                        </p>
                        {item.variety && (
                          <p style={{ margin: 0, fontSize: 11, color: md3.onSurfaceVariant }}>{item.variety}</p>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: md3.outline }}>{item.item_code}</span>
                          {item.default_unit_price && (
                            <span style={{ fontSize: 12, fontWeight: 500, color: md3.primary }}>
                              ¥{Number(item.default_unit_price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </SortableTile>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      )}

      {activeTab === "supplies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 追加ボタンを大きく目立たせる */}
          <div
            onClick={() => openSupplyDialog()}
            style={{
              padding: 12,
              borderRadius: 10,
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSupplyDragEnd}>
            <SortableContext items={activeSupplies.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeSupplies.map((supply) => (
                  <SortableTile
                    key={supply.id}
                    id={supply.id}
                    style={{
                      width: 160,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${md3.outlineVariant}`,
                      backgroundColor: md3.surface,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      cursor: "grab",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <GripVertical size={12} style={{ color: md3.outlineVariant }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MD3Switch checked={true} onChange={() => toggleSupplyActive(supply)} size="small" />
                        <MD3Button variant="text" size="small" onClick={() => openSupplyDialog(supply)} style={{ padding: 2 }}>
                          <Pencil size={11} />
                        </MD3Button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: md3.onSurface }}>
                      {supply.name}
                    </p>
                    {supply.specification && (
                      <p style={{ margin: 0, fontSize: 11, color: md3.onSurfaceVariant }}>{supply.specification}</p>
                    )}
                    {supply.unit_price && (
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: md3.primary }}>
                        ¥{Number(supply.unit_price).toLocaleString()}
                      </p>
                    )}
                  </SortableTile>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* 無効な資材（ドラッグ不可） */}
          {inactiveSupplies.length > 0 && (
            <>
              <p style={{ margin: "16px 0 0 0", fontSize: 12, color: md3.outline, fontWeight: 500 }}>
                無効な資材
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {inactiveSupplies.map((supply) => (
                  <div
                    key={supply.id}
                    style={{
                      width: 160,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${md3.outline}`,
                      backgroundColor: md3.surfaceContainerHighest,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <MD3Switch checked={false} onChange={() => toggleSupplyActive(supply)} size="small" />
                      <MD3Button variant="text" size="small" onClick={() => openSupplyDialog(supply)} style={{ padding: 2 }}>
                        <Pencil size={11} />
                      </MD3Button>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: md3.outline, textDecoration: "line-through" }}>
                      {supply.name}
                    </p>
                  </div>
                ))}
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
              padding: 12,
              borderRadius: 10,
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

          <p style={{ margin: 0, fontSize: 13, color: md3.onSurfaceVariant }}>
            ドラッグで並び替え可能
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSupplierDragEnd}>
            <SortableContext items={suppliers.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {suppliers.map((supplier) => (
                  <SortableTile
                    key={supplier.id}
                    id={supplier.id}
                    style={{
                      width: 160,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${md3.outlineVariant}`,
                      backgroundColor: md3.surface,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      cursor: "grab",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <GripVertical size={12} style={{ color: md3.outlineVariant }} />
                      <MD3Button variant="text" size="small" onClick={() => openSupplierDialog(supplier)} style={{ padding: 2 }}>
                        <Pencil size={11} />
                      </MD3Button>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: md3.onSurface }}>
                      {supplier.name}
                    </p>
                    <MD3StatusBadge status="neutral" label={supplier.csv_encoding} size="small" />
                  </SortableTile>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {activeTab === "users" && (
        <MD3Card>
          <MD3CardHeader title="ユーザー一覧" />
          <MD3CardContent style={{ padding: 0 }}>
            <MD3Table>
              <MD3TableHead>
                <MD3TableRow hoverable={false}>
                  <MD3TableHeaderCell>名前</MD3TableHeaderCell>
                  <MD3TableHeaderCell>メールアドレス</MD3TableHeaderCell>
                  <MD3TableHeaderCell>ロール</MD3TableHeaderCell>
                  <MD3TableHeaderCell>所属店舗</MD3TableHeaderCell>
                </MD3TableRow>
              </MD3TableHead>
              <MD3TableBody>
                {[
                  { name: "管理者", email: "admin@8718.jp", role: "admin", store: "全店舗" },
                  { name: "花市屋", email: "hanaichiya@8718.jp", role: "boss", store: "全店舗" },
                  { name: "本部管理", email: "410@8718.jp", role: "manager", store: "全店舗" },
                  ...stores.map((s) => ({
                    name: s.name,
                    email: s.email || `${s.name}@8718.jp`,
                    role: "staff" as const,
                    store: s.name,
                  })),
                ].map((u) => {
                  const roleConfig: Record<string, { bg: string; color: string; label: string }> = {
                    admin: { bg: md3.errorContainer, color: md3.onErrorContainer, label: "Admin" },
                    boss: { bg: md3.primaryContainer, color: md3.onPrimaryContainer, label: "Boss" },
                    manager: { bg: md3.secondaryContainer, color: md3.onSecondaryContainer, label: "Manager" },
                    staff: { bg: md3.surfaceContainerHigh, color: md3.onSurface, label: "Staff" },
                  }
                  const rc = roleConfig[u.role] || roleConfig.staff
                  return (
                    <MD3TableRow key={u.email}>
                      <MD3TableCell highlight>{u.name}</MD3TableCell>
                      <MD3TableCell>
                        <span style={{ fontSize: 13, fontFamily: "monospace" }}>{u.email}</span>
                      </MD3TableCell>
                      <MD3TableCell>
                        <span style={{
                          padding: "2px 10px",
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: rc.bg,
                          color: rc.color,
                        }}>
                          {rc.label}
                        </span>
                      </MD3TableCell>
                      <MD3TableCell>{u.store}</MD3TableCell>
                    </MD3TableRow>
                  )
                })}
              </MD3TableBody>
            </MD3Table>
            <p style={{
              padding: "12px 16px",
              margin: 0,
              fontSize: 12,
              color: md3.onSurfaceVariant,
              fontFamily: "'Zen Maru Gothic', sans-serif",
            }}>
              ※ ユーザーの追加・編集は権限設定ページから行えます
            </p>
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
              onChange={(e) => setStoreForm({ ...storeForm, operation_type: e.target.value as "headquarters" | "franchise" })}
              options={[
                { value: "headquarters", label: "直営" },
                { value: "franchise", label: "委託" },
              ]}
              fullWidth
            />
            <MD3Select
              label="店舗種別"
              value={storeForm.store_type}
              onChange={(e) => setStoreForm({ ...storeForm, store_type: e.target.value as "store" | "online" | "consignment" })}
              options={[
                { value: "store", label: "店舗" },
                { value: "online", label: "通販" },
                { value: "consignment", label: "委託店" },
              ]}
              fullWidth
            />
            <MD3TextField label="メール" value={storeForm.email} onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })} fullWidth />
            <div>
              <label style={{ fontSize: 14, color: md3.onSurfaceVariant, display: "block", marginBottom: 8 }}>店舗カラー</label>
              <MD3ColorWheel
                value={storeForm.color}
                onChange={(color) => setStoreForm({ ...storeForm, color })}
                size={150}
              />
            </div>
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {editingStore ? (
              <MD3Button
                variant="text"
                onClick={() => setConfirmDelete({ type: "store", id: editingStore.id, name: editingStore.name })}
                style={{ color: md3.error }}
              >
                <Trash2 size={16} style={{ marginRight: 6 }} />
                削除
              </MD3Button>
            ) : <div />}
            <div style={{ display: "flex", gap: 8 }}>
              <MD3Button variant="outlined" onClick={() => setStoreDialogOpen(false)}>キャンセル</MD3Button>
              <MD3Button onClick={saveStore}>保存</MD3Button>
            </div>
          </div>
        </MD3DialogFooter>
      </MD3Dialog>

      <MD3Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <MD3DialogHeader>
          <MD3DialogTitle>{editingItem ? "花編集" : "花追加"}</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MD3TextField label="花コード" value={itemForm.item_code} onChange={(e) => setItemForm({ ...itemForm, item_code: e.target.value })} fullWidth />
            <MD3TextField label="花名" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} fullWidth />
            <MD3TextField label="品種" value={itemForm.variety} onChange={(e) => setItemForm({ ...itemForm, variety: e.target.value })} fullWidth />
            <MD3TextField label="カテゴリ" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} fullWidth />
            <MD3NumberField label="デフォルト単価" value={itemForm.default_unit_price} onChange={(v) => setItemForm({ ...itemForm, default_unit_price: v })} fullWidth />
            <MD3NumberField label="税率" value={itemForm.tax_rate} onChange={(v) => setItemForm({ ...itemForm, tax_rate: v })} fullWidth />
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {editingItem ? (
              <MD3Button
                variant="text"
                onClick={() => setConfirmDelete({ type: "item", id: editingItem.id, name: editingItem.name })}
                style={{ color: md3.error }}
              >
                <Trash2 size={16} style={{ marginRight: 6 }} />
                削除
              </MD3Button>
            ) : <div />}
            <div style={{ display: "flex", gap: 8 }}>
              <MD3Button variant="outlined" onClick={() => setItemDialogOpen(false)}>キャンセル</MD3Button>
              <MD3Button onClick={saveItem}>保存</MD3Button>
            </div>
          </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {editingSupply ? (
              <MD3Button
                variant="text"
                onClick={() => setConfirmDelete({ type: "supply", id: editingSupply.id, name: editingSupply.name })}
                style={{ color: md3.error }}
              >
                <Trash2 size={16} style={{ marginRight: 6 }} />
                削除
              </MD3Button>
            ) : <div />}
            <div style={{ display: "flex", gap: 8 }}>
              <MD3Button variant="outlined" onClick={() => setSupplyDialogOpen(false)}>キャンセル</MD3Button>
              <MD3Button onClick={saveSupply}>保存</MD3Button>
            </div>
          </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {editingSupplier ? (
              <MD3Button
                variant="text"
                onClick={() => setConfirmDelete({ type: "supplier", id: editingSupplier.id, name: editingSupplier.name })}
                style={{ color: md3.error }}
              >
                <Trash2 size={16} style={{ marginRight: 6 }} />
                削除
              </MD3Button>
            ) : <div />}
            <div style={{ display: "flex", gap: 8 }}>
              <MD3Button variant="outlined" onClick={() => setSupplierDialogOpen(false)}>キャンセル</MD3Button>
              <MD3Button onClick={saveSupplier}>保存</MD3Button>
            </div>
          </div>
        </MD3DialogFooter>
      </MD3Dialog>
      {/* 削除確認ダイアログ */}
      <MD3Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <MD3DialogHeader>
          <MD3DialogTitle>削除確認</MD3DialogTitle>
        </MD3DialogHeader>
        <MD3DialogBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 15, color: md3.onSurface }}>
              <strong>{confirmDelete?.name}</strong> を削除しますか？
            </p>
            <p style={{ margin: 0, fontSize: 13, color: md3.error, fontWeight: 500 }}>
              関連するデータ（持ち出し・入荷・在庫など）も全て削除されます。この操作は取り消せません。
            </p>
          </div>
        </MD3DialogBody>
        <MD3DialogFooter>
          <MD3Button variant="outlined" onClick={() => setConfirmDelete(null)} disabled={deleting}>キャンセル</MD3Button>
          <MD3Button
            onClick={executeDelete}
            disabled={deleting}
            style={{ backgroundColor: md3.error, color: md3.onError }}
          >
            <Trash2 size={16} style={{ marginRight: 6 }} />
            {deleting ? "削除中..." : "削除する"}
          </MD3Button>
        </MD3DialogFooter>
      </MD3Dialog>
    </MD3AppLayout>
  )
}
