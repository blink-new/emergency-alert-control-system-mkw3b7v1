import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Shield, Crown, Eye, Settings, Home, LogOut } from 'lucide-react'
import { blink } from '../lib/blink'

interface NavigationProps {
  user: {
    id: string
    email: string
    name?: string
  }
  userRole: 'user' | 'admin' | 'super_admin'
  currentView: 'device' | 'admin' | 'welcome'
  onViewChange: (view: 'device' | 'admin' | 'welcome') => void
}

export default function Navigation({ user, userRole, currentView, onViewChange }: NavigationProps) {
  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Emergency Alert System</h1>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant={currentView === 'welcome' ? 'default' : 'ghost'}
              onClick={() => onViewChange('welcome')}
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>

            <Button
              variant={currentView === 'device' ? 'default' : 'ghost'}
              onClick={() => onViewChange('device')}
              size="sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              Device
            </Button>

            {(userRole === 'admin' || userRole === 'super_admin') && (
              <Button
                variant={currentView === 'admin' ? 'default' : 'ghost'}
                onClick={() => onViewChange('admin')}
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
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

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}