import { motion } from 'framer-motion'
import Spinner from './Spinner'

const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  accent: 'bg-accent-600 text-white hover:bg-accent-700',
  secondary: 'bg-white text-brand-700 ring-1 ring-gray-300 hover:bg-brand-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-accent-600 text-white hover:bg-accent-700',
}

const SIZES = { sm: 'px-3 py-1.5', md: 'px-4 py-2.5', lg: 'px-4 py-3', xl: 'px-4 py-3.5' }

export default function Button({ variant = 'primary', size = 'md', type = 'button', loading, disabled, className = '', children, ...props }) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </motion.button>
  )
}
