"use client"

type LoadingAnimationProps = {
  label?: string
  size?: number
}

export function LoadingAnimation({ label = "Loading…", size = 24 }: LoadingAnimationProps) {
  return (
    <div className="flex items-center justify-center" role="status" aria-busy aria-label={label}>
      <div className="relative" style={{ width: size, height: size }}>
        <span className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-slate-700 opacity-40" />
        <span className="absolute inset-0 rounded-full border-2 border-t-transparent border-slate-900 dark:border-slate-200 animate-spin" />
      </div>
    </div>
  )
}

export default LoadingAnimation


