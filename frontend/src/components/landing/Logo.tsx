import kabisWordmark from '@/assets/logo/kabis_wordmark.png'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={kabisWordmark}
      alt="KABIS"
      className={cn('h-11 w-auto object-contain', className)}
    />
  )
}
