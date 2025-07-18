"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UpgradeStatusHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const upgradeStatus = searchParams.get('upgrade')

  const handleDismiss = () => {
    const newUrl = window.location.pathname
    router.replace(newUrl, { scroll: false })
  }

  if (!upgradeStatus || (upgradeStatus !== 'success' && upgradeStatus !== 'cancelled')) {
    return null
  }

  return (
    <div className="mb-6">
      {upgradeStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50 relative">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 pr-8">
            🎉 Your subscription has been successfully upgraded! Your new plan is now active.
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0 text-green-600 hover:text-green-800"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      {upgradeStatus === 'cancelled' && (
        <Alert className="border-orange-200 bg-orange-50 relative">
          <XCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 pr-8">
            Your upgrade was cancelled. You can try again anytime from the pricing page.
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
    </div>
  )
}