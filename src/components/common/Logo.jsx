import navy from '@brand-logo.svg'
import white from '@brand-logo-white.svg'
import { brand } from '../../config/brand'

// Brand logo, chosen at build time (src/config/brand.js → @brand-logo alias in vite.config.js).
// variant "white" is for navy backgrounds.
export default function Logo({ variant = 'navy', className = 'h-8 w-auto' }) {
  return <img src={variant === 'white' ? white : navy} alt={brand.company || brand.fullName} className={className} />
}
