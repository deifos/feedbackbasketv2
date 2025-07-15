import { Mail } from "lucide-react"

export function FlyingEnvelopes() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Mail className="absolute top-20 left-10 w-6 h-6 text-sky-200/30 dark:text-sky-800/30 animate-float-slow" style={{ animationDelay: '0s' }} />
      <Mail className="absolute top-32 right-20 w-4 h-4 text-blue-200/40 dark:text-blue-800/40 animate-float-medium" style={{ animationDelay: '2s' }} />
      <Mail className="absolute top-48 left-1/4 w-5 h-5 text-sky-300/25 dark:text-sky-700/25 animate-float-fast" style={{ animationDelay: '4s' }} />
      <Mail className="absolute top-64 right-1/3 w-3 h-3 text-blue-300/35 dark:text-blue-700/35 animate-float-slow" style={{ animationDelay: '1s' }} />
      <Mail className="absolute top-80 left-2/3 w-4 h-4 text-sky-200/30 dark:text-sky-800/30 animate-float-medium" style={{ animationDelay: '3s' }} />
      <Mail className="absolute top-96 right-10 w-5 h-5 text-blue-200/25 dark:text-blue-800/25 animate-float-fast" style={{ animationDelay: '5s' }} />
      <Mail className="absolute bottom-32 left-16 w-4 h-4 text-sky-300/40 dark:text-sky-700/40 animate-float-slow" style={{ animationDelay: '6s' }} />
      <Mail className="absolute bottom-48 right-24 w-3 h-3 text-blue-300/30 dark:text-blue-700/30 animate-float-medium" style={{ animationDelay: '8s' }} />
    </div>
  )
}