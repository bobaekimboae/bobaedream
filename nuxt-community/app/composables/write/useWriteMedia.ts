// 글쓰기 사진 · 영상 첨부. 원본: public/community/chzzk-write.js (addFiles · renderMedia · storeMedia)
// 원본 파일은 노션식 글쓰기와 같은 브라우저 저장소(IndexedDB bbm-notion-write-media)에 넣어 목록 · 상세가 읽는다.
import { ref } from 'vue'
import { MEDIA_DB } from './writeUtils'

export interface WriteMediaItem {
  id: string
  kind: 'photo' | 'video'
  name: string
  url: string
  saved: Promise<boolean>
}

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

let mediaDb: Promise<IDBDatabase> | null = null
function openMediaDb(): Promise<IDBDatabase> {
  if (mediaDb) return mediaDb
  mediaDb = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('no indexedDB')); return }
    const request = indexedDB.open(MEDIA_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('media')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return mediaDb
}

function storeMedia(id: string, blob: Blob): Promise<void> {
  return openMediaDb().then(db => new Promise<void>((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite')
    tx.objectStore('media').put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  }))
}

export function useWriteMedia(showToast: (message: string) => void) {
  const photos = ref<WriteMediaItem[]>([])
  const videos = ref<WriteMediaItem[]>([])

  function addFiles(files: FileList | File[] | null, kind: 'photo' | 'video'): WriteMediaItem[] {
    if (!files) return []
    const target = kind === 'photo' ? photos : videos
    const room = (kind === 'photo' ? 20 : 5) - target.value.length
    if (room <= 0) { showToast(kind === 'photo' ? '사진은 최대 20장입니다.' : '동영상은 최대 5개입니다.'); return [] }
    const added = [...files].slice(0, room).map((file) => {
      const id = uid(kind)
      return { id, kind, name: file.name, url: URL.createObjectURL(file), saved: storeMedia(id, file).then(() => true).catch(() => false) }
    })
    target.value = [...target.value, ...added]
    return added
  }

  function removeMedia(id: string) {
    for (const list of [photos, videos]) {
      const item = list.value.find(entry => entry.id === id)
      if (item) { URL.revokeObjectURL(item.url); list.value = list.value.filter(entry => entry.id !== id) }
    }
  }

  function revokeAll() {
    ;[...photos.value, ...videos.value].forEach(item => URL.revokeObjectURL(item.url))
  }

  return { photos, videos, addFiles, removeMedia, revokeAll }
}
