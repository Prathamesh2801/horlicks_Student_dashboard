import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { MdCloudDone, MdGroups, MdPhotoCamera, MdUpload } from 'react-icons/md'
import BottomBar from '../../components/common/BottomBar'
import TopBar from '../../components/common/TopBar'
import { Button, Modal, Spinner } from '../../components/ui'
import { PHOTO_TYPES } from '../../constants/visit'
import { PhotoGrid, useVisit } from '../../features/visits'
import { useGeolocation } from '../../hooks/useGeolocation'
import { deletePhoto, submitVisit, uploadPhoto } from '../../services/api/visits.service'
import { compressImage } from '../../utils/compressImage'

const HELP = { normal: 'Banner, leaflet, marketing and other activity photos.' }

export default function VisitPhotosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { visit, error, reload } = useVisit(id)
  const { locate } = useGeolocation()
  const [tab, setTab] = useState('normal')
  const [uploading, setUploading] = useState({ normal: 0, headcount: 0 })
  const [confirm, setConfirm] = useState(null) // 'submit' or the photo to delete
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const cameraRef = useRef(null)
  const uploadRef = useRef(null)

  if (error) return <p className="pt-6 text-red-600">{error}</p>
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  if (visit.status !== 'draft') return <Navigate to={`/staff/visits/${id}`} replace />

  const photos = {
    normal: visit.photos.filter((p) => p.type !== 'headcount'),
    headcount: visit.photos.filter((p) => p.type === 'headcount'),
  }
  const stillUploading = uploading.normal + uploading.headcount > 0

  const handleFiles = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    const type = tab
    setMessage(null)
    setUploading((u) => ({ ...u, [type]: u[type] + files.length }))
    // Fall back to the visit's location if GPS is unavailable for this photo.
    const coords = await locate().catch(() => ({ lat: visit.lat, lng: visit.lng }))
    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        await uploadPhoto(id, { file: compressed, type, lat: coords.lat, lng: coords.lng, takenAt: new Date().toISOString() })
      } catch (err) {
        setMessage(err.message)
      }
      setUploading((u) => ({ ...u, [type]: u[type] - 1 }))
      await reload()
    }
  }

  const handleConfirm = async () => {
    setBusy(true)
    try {
      if (confirm === 'submit') {
        await submitVisit(id)
        navigate(`/staff/visits/${id}`, { replace: true })
        return
      }
      await deletePhoto(id, confirm.id)
      await reload()
      setConfirm(null)
    } catch (err) {
      setMessage(err.message)
      setConfirm(null)
    }
    setBusy(false)
  }

  return (
    <>
      <TopBar title="Photos" subtitle={`Step 2 of 2 · ${visit.schoolName}`} back="/staff" />

      <div role="tablist" aria-label="Photo type" className="grid grid-cols-2 gap-1 rounded-xl bg-gray-200/70 p-1">
        {PHOTO_TYPES.map((t) => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600'}`}
            >
              {t.value === 'headcount' && <MdGroups className={`size-4 ${active ? 'text-accent-600' : ''}`} />}
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-brand-700 text-white' : 'bg-gray-300/80 text-gray-700'}`}>
                {photos[t.value].length}
              </span>
            </button>
          )
        })}
      </div>

      {tab === 'normal' ? (
        <p className="mt-3 text-sm text-gray-600">{HELP.normal}</p>
      ) : (
        <div className="mt-3 flex gap-3 rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-100">
          <MdGroups className="size-6 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">Take 5–6 clear photos of the class</p>
            <p className="text-xs text-gray-600">AI detects faces and counts students automatically.</p>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button onClick={() => cameraRef.current.click()} size="lg">
          <MdPhotoCamera className="size-5" /> Take photo
        </Button>
        <Button variant="secondary" onClick={() => uploadRef.current.click()} size="lg">
          <MdUpload className="size-5" /> Upload
        </Button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFiles} />
      <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {message && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}

      <div className="mt-4">
        <PhotoGrid
          photos={photos[tab]}
          editable
          pending={uploading[tab]}
          onDelete={setConfirm}
          onAdd={() => uploadRef.current.click()}
          className="grid-cols-2"
        />
      </div>

      <BottomBar>
        <p className="mb-2 text-center text-xs text-gray-600">
          {photos.normal.length} normal · {photos.headcount.length} headcount photos
          {!photos.headcount.length && ' · add at least one headcount photo'}
        </p>
        <p className="mb-2 flex items-center justify-center gap-1 text-center text-[11px] text-green-700">
          <MdCloudDone className="size-3.5" /> Saved on this phone. Works offline; you can close the app and continue later.
        </p>
        <Button
          variant="accent"
          size="xl"
          className="w-full"
          onClick={() => setConfirm('submit')}
          disabled={!photos.headcount.length || stillUploading}
        >
          {stillUploading ? 'Uploading…' : 'Submit & count students'}
        </Button>
      </BottomBar>

      <Modal
        open={!!confirm}
        title={confirm === 'submit' ? 'Submit this visit?' : 'Delete this photo?'}
        onClose={() => !busy && setConfirm(null)}
      >
        <p className="text-sm text-gray-600">
          {confirm === 'submit'
            ? `${photos.normal.length} normal and ${photos.headcount.length} headcount photos will be sent and the AI will count the students. You can't change photos after submitting.`
            : 'The photo will be removed from this visit.'}
        </p>
        {confirm === 'submit' && photos.headcount.length < 5 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Tip: 5–6 class photos give a more accurate count.
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant={confirm === 'submit' ? 'accent' : 'danger'} onClick={handleConfirm} loading={busy}>
            {confirm === 'submit' ? 'Submit' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
