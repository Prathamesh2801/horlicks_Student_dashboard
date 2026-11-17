import logoNavy from '../../assets/horlicks-logo.svg'
import logoWhite from '../../assets/horlicks-logo-white.svg'

// Client's Horlicks logo (wordmark + orange chevron). variant "white" is for navy backgrounds.
export default function Logo({ variant = 'navy', className = 'h-8 w-auto' }) {
  return <img src={variant === 'white' ? logoWhite : logoNavy} alt="Horlicks" className={className} />
}
