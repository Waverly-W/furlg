/**
 * 图标缓存管理器（IndexedDB + chrome.storage 索引）
 * - 首次从网络获取并缓存到 IndexedDB
 * - 后续优先从缓存读取，失效则后台刷新
 * - 支持对象URL缓存与撤销，避免泄露
 */

export interface IconMeta {
  key: string // 使用完整图标URL作为 key（包含 sz 参数）
  url: string
  updatedAt: number
  size: number
  contentType: string
  errorCount?: number
}

export class IconCacheManager {
  private static readonly DB_NAME = 'IconCache'
  private static readonly STORE_NAME = 'icons'
  private static readonly INDEX_KEY = 'iconCacheIndex'
  private static readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000 // 7天
  private static readonly MAX_ENTRIES = 500 // 简单容量控制

  // 运行期对象URL缓存
  private static urlCache = new Map<string, string>()

  /** 生成 key；目前直接使用完整URL */
  static makeKey(url: string) {
    return url
  }

  /** 获取（或拉取）图标并返回可用于 <img src> 的 URL（object URL） */
  static async getOrFetchIconURL(url: string, ttl: number = this.DEFAULT_TTL): Promise<string | null> {
    const key = this.makeKey(url)

    // 优先返回对象URL缓存
    const cachedUrl = this.urlCache.get(key)
    if (cachedUrl) return cachedUrl

    // 读取索引
    const index = await this.getIndex()
    const meta = index.find(i => i.key === key)
    const now = Date.now()

    // 尝试从IDB读取已缓存 Blob
    const cachedBlob = await this.getFromIDB(key)

    // 未过期直接返回
    if (meta && cachedBlob && now - meta.updatedAt < ttl) {
      const objUrl = URL.createObjectURL(cachedBlob)
      this.urlCache.set(key, objUrl)
      return objUrl
    }

    // 过期或不存在：尝试网络拉取
    try {
      const fetched = await this.fetchIcon(url)
      if (fetched) {
        await this.saveToIDB(key, fetched.blob)
        await this.upsertIndex({
          key,
          url,
          updatedAt: now,
          size: fetched.blob.size,
          contentType: fetched.blob.type || 'image/png',
          errorCount: 0
        })
        const objUrl = URL.createObjectURL(fetched.blob)
        this.urlCache.set(key, objUrl)
        // 容量管理
        await this.evictIfNeeded()
        return objUrl
      }
    } catch (e) {
      console.warn('图标网络获取失败，将尝试使用旧缓存:', e)
    }

    // 网络失败时，如有旧缓存（即使过期）也返回
    if (cachedBlob) {
      const objUrl = URL.createObjectURL(cachedBlob)
      this.urlCache.set(key, objUrl)
      return objUrl
    }

    return null
  }

  /** 失效缓存（下次会重新拉取） */
  static async invalidate(url: string) {
    const key = this.makeKey(url)
    this.revokeObjectURL(key)
    await this.deleteFromIDB(key)
    await this.removeFromIndex(key)
  }

  /** 尝试强制刷新（用于 onError 时的补救） */
  static async refetch(url: string): Promise<string | null> {
    const key = this.makeKey(url)
    try {
      const fetched = await this.fetchIcon(url)
      if (!fetched) return null
      await this.saveToIDB(key, fetched.blob)
      await this.upsertIndex({
        key,
        url,
        updatedAt: Date.now(),
        size: fetched.blob.size,
        contentType: fetched.blob.type || 'image/png',
        errorCount: 0
      })
      this.revokeObjectURL(key)
      const objUrl = URL.createObjectURL(fetched.blob)
      this.urlCache.set(key, objUrl)
      await this.evictIfNeeded()
      return objUrl
    } catch (e) {
      console.error('图标强制刷新失败:', e)
      return null
    }
  }

  /** 撤销对象URL */
  static revokeObjectURL(key: string) {
    const url = this.urlCache.get(key)
    if (url) {
      URL.revokeObjectURL(url)
      this.urlCache.delete(key)
    }
  }

  /** 关闭页面时可批量撤销 */
  static revokeAll() {
    for (const [, url] of this.urlCache) URL.revokeObjectURL(url)
    this.urlCache.clear()
  }

  // ================== 内部：网络与IDB ==================

  private static async fetchIcon(url: string): Promise<{ blob: Blob } | null> {
    try {
      const res = await fetch(url, { mode: 'no-cors' as RequestMode }).catch(() => fetch(url))
      // no-cors 下可能无法读取状态，尝试直接取 blob
      if (!res) return null
      // 某些情况下 res.ok 不可用，直接尝试 blob
      const blob = await res.blob()
      if (!blob || blob.size === 0) return null
      return { blob }
    } catch (e) {
      console.warn('fetchIcon error:', e)
      return null
    }
  }

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME)
        }
      }
    })
  }

  private static async saveToIDB(key: string, blob: Blob) {
    const db = await this.openDB()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readwrite')
      const store = tx.objectStore(this.STORE_NAME)
      const r = store.put(blob, key)
      r.onsuccess = () => resolve()
      r.onerror = () => reject(r.error)
    })
  }

  private static async getFromIDB(key: string): Promise<Blob | null> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readonly')
      const store = tx.objectStore(this.STORE_NAME)
      const r = store.get(key)
      r.onsuccess = () => resolve(r.result || null)
      r.onerror = () => reject(r.error)
    })
  }

  private static async deleteFromIDB(key: string) {
    const db = await this.openDB()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readwrite')
      const store = tx.objectStore(this.STORE_NAME)
      const r = store.delete(key)
      r.onsuccess = () => resolve()
      r.onerror = () => reject(r.error)
    })
  }

  // ================== 索引管理（chrome.storage.local） ==================

  private static async getIndex(): Promise<IconMeta[]> {
    try {
      const res = await chrome.storage.local.get(this.INDEX_KEY)
      return (res[this.INDEX_KEY] as IconMeta[]) || []
    } catch (e) {
      console.warn('获取图标索引失败:', e)
      return []
    }
  }

  private static async setIndex(list: IconMeta[]) {
    try {
      await chrome.storage.local.set({ [this.INDEX_KEY]: list })
    } catch (e) {
      console.warn('保存图标索引失败:', e)
    }
  }

  private static async upsertIndex(meta: IconMeta) {
    const list = await this.getIndex()
    const idx = list.findIndex(i => i.key === meta.key)
    if (idx >= 0) list[idx] = meta; else list.push(meta)
    await this.setIndex(list)
  }

  private static async removeFromIndex(key: string) {
    const list = await this.getIndex()
    const next = list.filter(i => i.key !== key)
    await this.setIndex(next)
  }

  /** 简单的淘汰策略：超过 MAX_ENTRIES 时，按 updatedAt 升序删除前 N 个 */
  private static async evictIfNeeded() {
    const list = await this.getIndex()
    if (list.length <= this.MAX_ENTRIES) return
    const sorted = [...list].sort((a, b) => a.updatedAt - b.updatedAt)
    const remove = sorted.slice(0, sorted.length - this.MAX_ENTRIES)
    // 删除多余
    for (const m of remove) {
      await this.deleteFromIDB(m.key)
      this.revokeObjectURL(m.key)
    }
    const keepSet = new Set(sorted.slice(sorted.length - this.MAX_ENTRIES).map(m => m.key))
    const kept = list.filter(m => keepSet.has(m.key))
    await this.setIndex(kept)
  }
}

