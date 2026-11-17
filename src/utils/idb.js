// Tiny IndexedDB helper: the on-device database for visits and photos (works offline, holds hundreds of MB,
// unlike localStorage's ~5 MB). Stores: visits { id, ... }, photos { id, dataUrl }.
const DB_NAME = 'my-workbench'
const VERSION = 1

let dbPromise
function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('visits')) db.createObjectStore('visits', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

const friendly = (err) =>
  err?.name === 'QuotaExceededError' ? new Error('Phone storage is full. Free up some space and try again.') : err

async function run(store, mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(friendly(tx.error))
    tx.onabort = () => reject(friendly(tx.error))
  })
}

export const idb = {
  getAll: (store) => run(store, 'readonly', (s) => s.getAll()),
  get: (store, key) => run(store, 'readonly', (s) => s.get(key)),
  put: (store, value) => run(store, 'readwrite', (s) => s.put(value)),
  delete: (store, key) => run(store, 'readwrite', (s) => s.delete(key)),
}

// Ask the browser not to clear our data when the phone is low on space.
// Chrome grants this quietly (more readily once installed); it never shows a prompt there.
export function keepDataOnDevice() {
  navigator.storage?.persist?.().catch(() => {})
}
