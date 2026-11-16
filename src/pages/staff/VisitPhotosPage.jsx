import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { MdAddAPhoto } from 'react-icons/md'
import PageHeader from '../../components/common/PageHeader'
import { Button, Card, EmptyState, Spinner } from '../../components/ui'
import { PhotoCapture, PhotoGrid, useVisit } from '../../features/visits'
import { useGeolocation } from '../../hooks/useGeolocation'
import { deletePhoto, submitVisit, updatePhoto, uploadPhoto } from '../../services/api/visits'
import { compressImage } from '../../utils/compressImage'

export default function VisitPhotosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { visit, error, reload } = useVisit(id)
  const { locate } = useGeolocation()
  const [uploading, setUploading] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  if (error) return <p className="text-red-600">{error}</p>
  if (!visit) return <Spinner className="mx-auto mt-10 size-6 text-brand-600" />
  if (visit.status !== 'draft') return <Navigate to={`/staff/visits/${id}`} replace />

  const headcountPhotos = visit.photos.filter((p) => p.needsHeadcount).length

  const handleFiles = async (files, type) => {
    setMessage(null)
    setUploading((n) => n + files.length)
    // Fall back to the visit's location if GPS is unavailable for this photo.
    const coords = await locate().catch(() => ({ lat: visit.lat, lng: visit.lng }))
    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        await uploadPhoto(id, {
          file: compressed,
          type,
          needsHeadcount: type === 'headcount',
          lat: coords.lat,
          lng: coords.lng,
          takenAt: new Date().toISOString(),
        })
      } catch (err) {
        setMessage(err.message)
      }
      setUploading((n) => n - 1)
      await reload()
    }
  }

  const toggle = async (photo) => {
    await updatePhoto(id, photo.id, { needsHeadcount: !photo.needsHeadcount })
    reload()
  }

  const remove = async (photo) => {
    await deletePhoto(id, photo.id)
    reload()
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      await submitVisit(id)
      navigate(`/staff/visits/${id}`, { replace: true })
    } catch (err) {
      setMessage(err.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Photos" subtitle={`Step 2 of 2 · ${visit.schoolName}`} back="/staff" />

      <Card className="mb-4">
        <PhotoCapture onFiles={handleFiles} disabled={submitting} />
        {uploading > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Spinner className="size-4" /> Uploading {uploading} photo{uploading > 1 ? 's' : ''}…
          </p>
        )}
        {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
      </Card>

      {visit.photos.length === 0 ? (
        <EmptyState
          icon={MdAddAPhoto}
          title="No photos yet"
          text="Add banner, leaflet and place photos, plus 5–6 photos showing the students' faces."
        />
      ) : (
        <>
          <p className="mb-2 text-sm text-gray-600">
            Tick <b>Count heads</b> on the photos the AI should count ({headcountPhotos} selected, 5–6 recommended).
          </p>
          <PhotoGrid photos={visit.photos} editable onToggle={toggle} onDelete={remove} />
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-md">
          <Button className="w-full" onClick={submit} loading={submitting} disabled={!headcountPhotos || uploading > 0}>
            Submit visit & count students
          </Button>
          {!headcountPhotos && visit.photos.length > 0 && (
            <p className="mt-1 text-center text-xs text-gray-500">Select at least one photo for headcount.</p>
          )}
        </div>
      </div>
    </>
  )
}
