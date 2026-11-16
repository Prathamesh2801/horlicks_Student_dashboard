import { useRef, useState } from 'react'
import { MdPhotoCamera, MdUpload } from 'react-icons/md'
import { Button } from '../../../components/ui'
import { PHOTO_TYPES } from '../../../constants/visit'

// Pick a photo type, then take a photo with the native camera or upload from the device.
export default function PhotoCapture({ onFiles, disabled }) {
  const [type, setType] = useState('banner')
  const cameraRef = useRef(null)
  const uploadRef = useRef(null)

  const handleChange = (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (files.length) onFiles(files, type)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-100 p-1" role="radiogroup" aria-label="Photo type">
        {PHOTO_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => setType(t.value)}
            className={`rounded-md px-2 py-2 text-xs font-medium transition ${type === t.value ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => cameraRef.current.click()} disabled={disabled}>
          <MdPhotoCamera className="size-5" /> Take photo
        </Button>
        <Button variant="secondary" onClick={() => uploadRef.current.click()} disabled={disabled}>
          <MdUpload className="size-5" /> Upload
        </Button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
    </div>
  )
}
