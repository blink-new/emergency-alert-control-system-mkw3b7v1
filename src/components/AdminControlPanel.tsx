import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Settings, 
  History, 
  UserPlus,
  Crown,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'
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

interface ConnectedDevice {
  id: string
  email: string
  lastSeen: string
  status: 'online' | 'offline'
}

export default function AdminControlPanel() {
  const [alertState, setAlertState] = useState<AlertState>({
    isActive: false,
    alertType: 'panic',
    message: '',
    triggeredBy: '',
    triggeredAt: ''
  })
  const [user, setUser] = useState<User | null>(null)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [alertHistory, setAlertHistory] = useState<AlertState[]>([])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Subscribe to real-time alert updates
  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await blink.realtime.subscribe('alert-system', (message) => {
        if (message.type === 'alert-update') {
          const newAlertState = message.data as AlertState;
          setAlertState(newAlertState);
          // Add to history only when alert is triggered or stopped
          if (newAlertState.isActive || (!newAlertState.isActive && alertState.isActive)) {
            setAlertHistory(prevHistory => [newAlertState, ...prevHistory]);
          }
        }
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Subscribe to real-time presence updates
  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined;

    const setupPresenceSub = async () => {
      unsubscribe = await blink.realtime.subscribe('alert-system', (message) => {
        if (message.type === 'presence-update') {
          fetchConnectedDevices()
        }
      });
    };

    setupPresenceSub();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const fetchConnectedDevices = async () => {
    try {
      const presence = await blink.realtime.presence('alert-system')
      const devices: ConnectedDevice[] = presence.map((p) => ({
        id: p.userId,
        email: p.metadata?.email || 'Unknown',
        lastSeen: new Date(p.lastSeen).toLocaleTimeString(),
        status: Date.now() - p.lastSeen < 30000 ? 'online' : 'offline'
      }))
      setConnectedDevices(devices)
    } catch (error) {
      console.error('Error fetching connected devices:', error)
    }
  }

  const handleForceStopAlert = async () => {
    if (!user) return
    
    try {
      const alertData = {
        isActive: false,
        alertType: 'stop' as const,
        message: 'Alert stopped by admin',
        triggeredBy: user.email,
        triggeredAt: new Date().toISOString()
      }

      await blink.realtime.publish('alert-system', 'alert-update', alertData)
      setAlertState(alertData)
      toast.success('✅ Alert stopped by admin')
    } catch (error) {
      console.error('Error stopping alert:', error)
      toast.error('Failed to stop alert')
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return

    setIsAddingAdmin(true)
    try {
      // In a real app, this would update the user's role in the database
      // For now, we'll just simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`✅ Admin privileges granted to ${newAdminEmail}`)
      setNewAdminEmail('')
    } catch (error) {
      console.error('Error adding admin:', error)
      toast.error('Failed to add admin')
    } finally {
      setIsAddingAdmin(false)
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Alert Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
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
                  <CheckCircle className="h-4 w-4" />
                  SYSTEM NORMAL
                </>
              )}
            </div>
            {alertState.isActive && (
              <Button 
                onClick={handleForceStopAlert}
                variant="destructive"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Force Stop
              </Button>
            )}
          </div>
          {alertState.isActive && (
            <div className="mt-3 text-sm text-gray-600">
              <p>Triggered by: {alertState.triggeredBy}</p>
              <p>Time: {new Date(alertState.triggeredAt).toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connected Devices ({connectedDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {connectedDevices.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No devices connected</p>
            ) : (
              connectedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{device.email}</p>
                    <p className="text-sm text-gray-500">Last seen: {device.lastSeen}</p>
                  </div>
                  <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                    {device.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUserManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="admin-email">Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleAddAdmin}
            disabled={!newAdminEmail.trim() || isAddingAdmin}
            className="w-full"
          >
            {isAddingAdmin ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding Admin...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Grant Admin Access
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-gray-500">Current user</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium">admin@example.com</p>
                <p className="text-sm text-gray-500">Sample admin user</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium">user@example.com</p>
                <p className="text-sm text-gray-500">Sample regular user</p>
              </div>
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                View Only
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
              <p className="text-gray-600 mt-1">Emergency Alert System Management</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
              <Crown className="h-4 w-4 mr-1" />
              Super Admin
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
            className="flex-1"
          >
            <Shield className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            User Management
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            Alert History
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Alert History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No alert events recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {alertHistory.map((event, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${event.isActive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {event.isActive ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-semibold">{event.message}</p>
                            <p className="text-sm text-gray-600">Triggered by: {event.triggeredBy}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{new Date(event.triggeredAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}