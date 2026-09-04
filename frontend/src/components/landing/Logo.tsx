import kabisWordmark from '@/assets/logo/kabis_wordmark.png'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={kabisWordmark}
      alt="KABIS"
      className={`h-11 w-auto object-contain ${className ?? ''}`}
    />
  )
}
