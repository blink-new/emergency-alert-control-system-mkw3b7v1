import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Shield, Crown, Eye, Settings } from 'lucide-react'
import AuthWrapper from './components/AuthWrapper'
import RemoteDevice from './components/RemoteDevice'
import AdminControlPanel from './components/AdminControlPanel'
import Navigation from './components/Navigation'
import { blink } from './lib/blink'

interface User {
  id: string
  email: string
  name?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<'device' | 'admin' | 'welcome'>('welcome')
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'super_admin'>('user')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      
      // Determine user role based on email (in real app, this would come from database)
      if (state.user?.email) {
        if (state.user.email.includes('admin') || state.user.email.includes('super')) {
          setUserRole('super_admin')
        } else if (state.user.email.includes('moderator')) {
          setUserRole('admin')
        } else {
          setUserRole('user')
        }
      }
    })
    return unsubscribe
  }, [])

  const renderWelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Shield className="h-8 w-8" />
              Emergency Alert System
            </CardTitle>
            <p className="text-red-100 mt-2">Cross-Platform Emergency Response</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* User Info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                  <Badge 
                    className={
                      userRole === 'super_admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : userRole === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {userRole === 'super_admin' && <Crown className="h-3 w-3 mr-1" />}
                    {userRole === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {userRole === 'user' && <Eye className="h-3 w-3 mr-1" />}
                    {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'View Only'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Access Options */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Access Mode</h3>
              </div>

              <Button
                onClick={() => setCurrentView('device')}
                size="lg"
                className="w-full h-16 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl shadow-lg transform transition-all duration-150 hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6" />
                  <div className="text-left">
                    <div>Emergency Remote Device</div>
                    <div className="text-sm text-red-200">Panic & Stop Controls</div>
                  </div>
                </div>
              </Button>

              {(userRole === 'admin' || userRole === 'super_admin') && (
                <Button
                  onClick={() => setCurrentView('admin')}
                  size="lg"
                  variant="outline"
                  className="w-full h-16 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg font-semibold rounded-xl shadow-lg transform transition-all duration-150 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6" />
                    <div className="text-left">
                      <div>Admin Control Panel</div>
                      <div className="text-sm text-purple-500">System Management</div>
                    </div>
                  </div>
                </Button>
              )}
            </div>

            {/* System Status */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>System Status: <span className="text-green-600 font-medium">Online</span></p>
              <p>Connected Users: <span className="font-medium">1</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <AuthWrapper>
      {!user ? (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-2">Emergency Alert System</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          <Navigation 
            user={user} 
            userRole={userRole} 
            currentView={currentView} 
            onViewChange={setCurrentView} 
          />
          
          <div className="pt-16">
            {currentView === 'welcome' && renderWelcomeScreen()}
            {currentView === 'device' && <RemoteDevice />}
            {currentView === 'admin' && <AdminControlPanel />}
          </div>
        </>
      )}
    </AuthWrapper>
  )
}

export default App