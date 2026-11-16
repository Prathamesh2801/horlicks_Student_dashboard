import logo from '../../assets/logo.png'

export default function Logo({ className = 'h-8 w-auto' }) {
  return <img src={logo} alt="Horlicks" className={className} />
}
