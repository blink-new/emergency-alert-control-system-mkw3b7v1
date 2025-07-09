import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { AlertTriangle, Shield, Eye } from 'lucide-react'
import { blink } from '../lib/blink'
import toast from 'react-hot-toast'

interface AlertState {
  isActive: boolean
  alertType: 'panic' | 'stop'
  message: string
  triggeredBy: string
  triggeredAt: string
}

interface User {
  id: string
  email: string
  name?: string
}

export default function RemoteDevice() {
  const [alertState, setAlertState] = useState<AlertState>({
    isActive: false,
    alertType: 'panic',
    message: '',
    triggeredBy: '',
    triggeredAt: ''
  })
  const [user, setUser] = useState<User | null>(null)
  const [isPanicPressed, setIsPanicPressed] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined

    const setupSubscription = async () => {
      unsubscribe = await blink.realtime.subscribe('alert-system', (message) => {
        if (message.type === 'alert-update') {
          setAlertState(message.data)
        }
      })
    }

    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user])

  const handlePanicPress = async () => {
    if (!user) return
    
    setIsPanicPressed(true)
    
    try {
      const alertData = {
        isActive: true,
        alertType: 'panic' as const,
        message: 'PANIC ALERT ACTIVATED',
        triggeredBy: user.email,
        triggeredAt: new Date().toISOString()
      }

      // Publish real-time alert
      await blink.realtime.publish('alert-system', 'alert-update', alertData)
      
      setAlertState(alertData)
      toast.error('🚨 PANIC ALERT ACTIVATED!')
    } catch (error) {
      console.error('Error activating panic alert:', error)
      toast.error('Failed to activate panic alert')
    } finally {
      setIsPanicPressed(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-md mx-auto">
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Shield className="h-6 w-6" />
              Emergency Remote
            </CardTitle>
            <Badge variant="secondary" className="w-fit mx-auto mt-2">
              <Eye className="h-3 w-3 mr-1" />
              View Only Access
            </Badge>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Alert Status */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                alertState.isActive 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {alertState.isActive ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    ALERT ACTIVE
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    SYSTEM NORMAL
                  </>
                )}
              </div>
              {alertState.isActive && (
                <p className="text-sm text-gray-600 mt-2">
                  Triggered by: {alertState.triggeredBy}
                </p>
              )}
            </div>

            {/* Emergency Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handlePanicPress}
                disabled={isPanicPressed || alertState.isActive}
                size="lg"
                className="w-full h-20 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-xl shadow-lg transform transition-all duration-150 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPanicPressed ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ACTIVATING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8" />
                    PANIC
                  </div>
                )}
              </Button>
            </div>

            {/* Device Info */}
            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p>Device ID: {user?.id?.substring(0, 8)}...</p>
              <p>Status: Connected</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}