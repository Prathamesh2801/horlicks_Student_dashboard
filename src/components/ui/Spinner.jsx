import { ImSpinner2 } from 'react-icons/im'

export default function Spinner({ className = 'size-5' }) {
  return <ImSpinner2 className={`animate-spin ${className}`} aria-label="Loading" />
}
