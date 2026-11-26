import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { MdCloudDone, MdCloudOff, MdDeleteOutline, MdErrorOutline, MdGroups, MdPhotoCamera, MdSchedule, MdUpload } from 'react-icons/md'
import BottomBar from '../../components/common/BottomBar'
import TopBar from '../../components/common/TopBar'
import { Button, EmptyState, Input, Modal, Spinner } from '../../components/ui'
import { MAX_PHOTOS, PHOTO_CATEGORIES, PHOTO_TYPES } from '../../constants/visit'
import { PhotoGrid, useDraft } from '../../features/visits'
import { useGeolocation } from '../../hooks/useGeolocation'
import { addPhoto, deleteDraft, deletePhoto, updateDraft } from '../../services/drafts/draftStore'
import { uploadDraft } from '../../services/drafts/uploadQueue'
import { compressImage, geoStamp } from '../../utils/compressImage'

// Upload progress dialog content.
function UploadStatus({ upload, onDone }) {
  if (upload.phase === 'upload' || upload.phase === 'counting') {
    const pct = Math.round((upload.progress ?? 0) * 100)
    return (
      <div className="space-y-4 py-2 text-center">
        <Spinner className="mx-auto size-8 text-brand-700" />
        <p className="font-semibold">{upload.phase === 'upload' ? `Uploading photos… ${pct}%` : 'AI is counting the students…'}</p>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <motion.div className="h-full rounded-full bg-brand-700" animate={{ width: upload.phase === 'upload' ? `${pct}%` : '100%' }} />
        </div>
        <p className="text-xs text-gray-500">
          {upload.phase === 'upload' ? 'Keep the app open.' : 'This can take up to a minute. Keep the app open.'}
        </p>
      </div>
    )
  }
  const queued = upload.phase === 'queued'
  return (
    <div className="space-y-4 text-center">
      {queued ? <MdCloudOff className="mx-auto size-10 text-amber-500" /> : <MdErrorOutline className="mx-auto size-10 text-red-600" />}
      <p className="text-sm text-gray-700">
        {queued
          ? 'No internet right now. The visit is saved on this phone and will upload by itself when you’re back online (keep the app open for a moment once you have signal).'
          : upload.message}
      </p>
      <Button className="w-full" onClick={onDone}>
        {queued ? 'OK, back to my visits' : 'OK'}
      </Button>
    </div>
  )
}

// Step 2: photos for a draft on the phone, then upload the whole visit.
export default function VisitPhotosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { draft, error } = useDraft(id)
  const { locate } = useGeolocation()
  const [tab, setTab] = useState('normal')
  const [adding, setAdding] = useState({ normal: 0, headcount: 0 })
  const [confirm, setConfirm] = useState(null) // 'submit' | 'discard' | photo to delete
  const [upload, setUpload] = useState(null) // { phase: 'upload' | 'counting' | 'queued' | 'error', progress, message }
  const [message, setMessage] = useState(null)
  const [category, setCategory] = useState('') // normal photos: chosen before taking the photo
  const [covered, setCovered] = useState(null) // typed value (saved to the draft as you type)
  const cameraRef = useRef(null)
  const uploadRef = useRef(null)

  if (error) return <p className="pt-6 text-red-600">{error}</p>
  if (draft === undefined) return <Spinner className="mx-auto mt-10 size-6 text-brand-700" />
  if (draft === null && !upload)
    return (
      <>
        <TopBar title="Photos" back="/staff" />
        <EmptyState
          icon={MdCloudDone}
          title="This visit is no longer on the phone"
          text="It was uploaded or deleted."
          action={
            <Link to="/staff" className="text-sm font-semibold text-brand-700">
              Back to my visits
            </Link>
          }
        />
      </>
    )

  const photos = {
    normal: draft?.photos.filter((p) => p.type !== 'headcount') ?? [],
    headcount: draft?.photos.filter((p) => p.type === 'headcount') ?? [],
  }
  const stillAdding = adding.normal + adding.headcount > 0
  const max = MAX_PHOTOS[tab]
  const full = photos[tab].length + adding[tab] >= max
  const kind = tab === 'normal' ? 'normal' : 'headcount'
  // Students covered in this session: typed by the Ground Team, shown next to the AI count.
  const coveredText = covered ?? (draft?.studentsCovered ? String(draft.studentsCovered) : '')
  const setCoveredText = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCovered(v)
    updateDraft(id, { studentsCovered: v ? Number(v) : null })
  }
  const coveredOk = Number(coveredText) > 0

  const handleFiles = async (e) => {
    const room = max - photos[tab].length - adding[tab]
    const all = [...e.target.files]
    e.target.value = ''
    const files = all.slice(0, Math.max(0, room))
    setMessage(all.length > files.length ? `Maximum ${max} ${kind} photos per visit. ${all.length - files.length} not added.` : null)
    if (!files.length) return
    const type = tab
    const cat = type === 'normal' ? category : null
    setAdding((u) => ({ ...u, [type]: u[type] + files.length }))
    // Fall back to the visit's location if GPS is unavailable for this photo.
    const coords = await locate().catch(() => ({ lat: draft.lat, lng: draft.lng, accuracy: draft.accuracy, fromVisit: true }))
    for (const file of files) {
      try {
        // Geo-tag printed on the image itself: coordinates, date/time, school.
        const stamp = geoStamp(coords, new Date(), draft, cat)
        await addPhoto(id, { file: await compressImage(file, { stamp }), type, category: cat, lat: coords.lat, lng: coords.lng })
      } catch (err) {
        setMessage(err.message)
      }
      setAdding((u) => ({ ...u, [type]: u[type] - 1 }))
    }
  }

  const submit = async () => {
    setConfirm(null)
    if (!navigator.onLine) {
      await updateDraft(id, { state: 'queued', error: null })
      setUpload({ phase: 'queued' })
      return
    }
    setUpload({ phase: 'upload', progress: 0 })
    try {
      const { visit } = await uploadDraft(draft, (progress) =>
        setUpload(progress >= 1 ? { phase: 'counting' } : { phase: 'upload', progress }),
      )
      navigate(`/staff/visits/${visit.id}`, { replace: true })
    } catch (err) {
      setUpload(err.offline ? { phase: 'queued' } : { phase: 'error', message: err.message })
    }
  }

  const handleConfirm = async () => {
    if (confirm === 'submit') return submit()
    if (confirm === 'discard') {
      await deleteDraft(id)
      navigate('/staff', { replace: true })
      return
    }
    await deletePhoto(id, confirm.id)
    setConfirm(null)
  }

  const queued = draft?.state === 'queued'
  const failed = draft?.state === 'failed'
  const closeUpload = () => (upload?.phase === 'queued' ? navigate('/staff') : upload?.phase === 'error' && setUpload(null))

  return (
    <>
      <TopBar
        title="Photos"
        subtitle={`Step 2 of 2 · ${draft?.schoolName ?? ''}`}
        back="/staff"
        action={
          <button
            onClick={() => setConfirm('discard')}
            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete draft"
            title="Delete draft"
          >
            <MdDeleteOutline className="size-5" />
          </button>
        }
      />

      {queued && (
        <div className="mb-3 flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-100">
          <MdSchedule className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Waiting for internet</p>
            <p className="text-xs text-amber-900/80">Submitted. It uploads by itself when you’re online with the app open.</p>
          </div>
        </div>
      )}
      {failed && (
        <div role="alert" className="mb-3 flex items-start gap-3 rounded-xl bg-red-50 p-3.5 ring-1 ring-red-100">
          <MdErrorOutline className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">Not uploaded. Please fix and submit again</p>
            <p className="text-xs text-red-700">{draft.error}</p>
          </div>
        </div>
      )}

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
              className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-[13px] font-semibold transition sm:gap-1.5 sm:text-sm ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600'}`}
            >
              {t.value === 'headcount' && <MdGroups className={`size-4 ${active ? 'text-accent-600' : ''}`} />}
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-brand-700 text-white' : 'bg-gray-300/80 text-gray-700'}`}>
                {photos[t.value].length}/{MAX_PHOTOS[t.value]}
              </span>
            </button>
          )
        })}
      </div>

      {tab === 'normal' ? (
        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold text-gray-800">1 · Choose the photo category</p>
          <div role="radiogroup" aria-label="Photo category" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PHOTO_CATEGORIES.map((c) => {
              const n = photos.normal.filter((p) => p.category === c).length
              const on = category === c
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCategory(c)}
                  className={`flex items-center justify-between gap-1 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ring-1 transition ${on ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-gray-800 ring-gray-300 hover:bg-brand-50'}`}
                >
                  {c}
                  {n > 0 && <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/25' : 'bg-gray-200'}`}>{n}</span>}
                </button>
              )
            })}
          </div>
          <p className="mb-1 mt-3 text-sm font-semibold text-gray-800">2 · Take the photo</p>
        </div>
      ) : (
        <div className="mt-3 flex gap-3 rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-100">
          <MdGroups className="size-6 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">Take 5–6 clear photos of the class</p>
            <p className="text-xs text-gray-600">AI detects faces and counts students when the visit is uploaded.</p>
          </div>
        </div>
      )}
      {tab === 'headcount' && (
        <Input
          className="mt-3"
          label="Students covered in this session"
          inputMode="numeric"
          placeholder="e.g. 45"
          value={coveredText}
          onChange={setCoveredText}
          maxLength={4}
          hint="Count the students who attended. The AI count from the photos is shown next to it."
          required
        />
      )}

      {tab === 'normal' ? (
        // Camera only: the geo-tag must be where and when the photo is taken.
        <Button className="w-full" onClick={() => cameraRef.current.click()} size="lg" disabled={full || !category}>
          <MdPhotoCamera className="size-5" /> {category ? `Take photo · ${category}` : 'Choose a category first'}
        </Button>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button onClick={() => cameraRef.current.click()} size="lg" disabled={full}>
            <MdPhotoCamera className="size-5" /> Take photo
          </Button>
          <Button variant="secondary" onClick={() => uploadRef.current.click()} size="lg" disabled={full}>
            <MdUpload className="size-5" /> Upload
          </Button>
        </div>
      )}
      <p className={`mt-1.5 text-right text-[11px] ${full ? 'font-semibold text-amber-700' : 'text-gray-500'}`}>
        {full && !adding[tab] && !message
          ? `Maximum reached: ${max} ${kind} photos. Delete one to add another.`
          : `${photos[tab].length} / ${max} ${kind} photos`}
      </p>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFiles} />
      <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {message && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}

      <div className="mt-3">
        <PhotoGrid
          photos={photos[tab]}
          editable
          pending={adding[tab]}
          onDelete={setConfirm}
          onAdd={full || (tab === 'normal' && !category) ? undefined : () => (tab === 'normal' ? cameraRef : uploadRef).current.click()}
          className="grid-cols-2"
        />
      </div>

      <BottomBar>
        <p className="mb-1 text-center text-xs text-gray-600">
          {photos.normal.length} normal · {photos.headcount.length} headcount photos
          {!draft?.photos.length && ' · add at least one photo'}
          {!coveredOk && ' · enter students covered (Headcount tab)'}
        </p>
        <p className="mb-2 flex items-center justify-center gap-1 text-center text-[11px] text-green-700">
          <MdCloudDone className="size-3.5" /> Saved on this phone. Works offline; you can close the app and continue later.
        </p>
        <Button
          variant="accent"
          size="xl"
          className="w-full"
          onClick={() => setConfirm('submit')}
          disabled={!draft?.photos.length || !coveredOk || stillAdding}
        >
          {stillAdding ? 'Adding photos…' : queued ? 'Upload now' : 'Submit & count students'}
        </Button>
      </BottomBar>

      <Modal
        open={!!confirm}
        title={confirm === 'submit' ? 'Submit this visit?' : confirm === 'discard' ? 'Delete this draft?' : 'Delete this photo?'}
        onClose={() => setConfirm(null)}
      >
        <p className="text-sm text-gray-600">
          {confirm === 'submit'
            ? `${photos.normal.length} normal and ${photos.headcount.length} headcount photos will be uploaded and the AI will count the students. You can’t change the visit after it’s uploaded. No internet? It will upload by itself later.`
            : confirm === 'discard'
              ? `The visit and its ${draft?.photos.length ?? 0} photos will be removed from this phone. This can’t be undone.`
              : 'The photo will be removed from this visit.'}
        </p>
        {confirm === 'submit' && photos.headcount.length < 5 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {photos.headcount.length
              ? 'Tip: 5–6 class photos give a more accurate count.'
              : 'No headcount photos: the AI won’t count students for this visit.'}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button variant={confirm === 'submit' ? 'accent' : 'danger'} onClick={handleConfirm}>
            {confirm === 'submit' ? 'Submit' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!upload}
        title={upload?.phase === 'queued' ? 'Saved, will upload later' : upload?.phase === 'error' ? 'Couldn’t upload' : 'Uploading visit'}
        onClose={closeUpload}
      >
        {upload && <UploadStatus upload={upload} onDone={closeUpload} />}
      </Modal>
    </>
  )
}
