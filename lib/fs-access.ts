/**
 * File System Access API ユーティリティ
 * ブラウザからローカルフォルダに直接ファイルを保存する
 * IndexedDBでディレクトリハンドルを永続化
 */

interface FileSystemPermissionDescriptor {
  mode: "read" | "readwrite"
}

interface FileSystemHandlePermissionApi {
  queryPermission(desc: FileSystemPermissionDescriptor): Promise<PermissionState>
  requestPermission(desc: FileSystemPermissionDescriptor): Promise<PermissionState>
}

const DB_NAME = "8718fs"
const STORE_NAME = "handles"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDirHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(handle, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadDirHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

/**
 * ディレクトリの書き込み権限を確認・リクエスト
 */
export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as FileSystemDirectoryHandle & FileSystemHandlePermissionApi
  const opts = { mode: "readwrite" as const }
  if ((await h.queryPermission(opts)) === "granted") return true
  if ((await h.requestPermission(opts)) === "granted") return true
  return false
}

/**
 * ユーザーにフォルダを選ばせて保存
 */
export async function pickDirectory(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    await saveDirHandle(key, handle)
    return handle
  } catch {
    return null
  }
}

/**
 * 保存済みハンドルを取得、または新規選択
 */
export async function getOrPickDirectory(key: string): Promise<FileSystemDirectoryHandle | null> {
  const saved = await loadDirHandle(key)
  if (saved) {
    const ok = await verifyPermission(saved)
    if (ok) return saved
  }
  return pickDirectory(key)
}

/**
 * ファイルを指定ディレクトリに保存
 * サブフォルダ（日付など）を自動作成
 */
export async function saveFileToDir(
  dirHandle: FileSystemDirectoryHandle,
  subFolder: string | null,
  fileName: string,
  data: Blob
): Promise<string> {
  let targetDir = dirHandle
  if (subFolder) {
    targetDir = await dirHandle.getDirectoryHandle(subFolder, { create: true })
  }
  const fileHandle = await targetDir.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(data)
  await writable.close()
  return subFolder ? `${subFolder}/${fileName}` : fileName
}

/**
 * File System Access APIが利用可能か
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window
}
