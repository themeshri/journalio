'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, User, Bell, Shield, CreditCard, Database, 
  AlertCircle, Save, Plus, X, Trash2, Edit2 
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomMistakeManager } from '@/components/mistakes/custom-mistake-manager';

interface NotificationSettings {
  emailNotifications: boolean;
  tradeAlerts: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  mistakeAlerts: boolean;
}

interface TradingSettings {
  defaultSlippage: string;
  defaultGasLimit: string;
  autoSync: boolean;
  syncInterval: string;
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    tradeAlerts: true,
    dailySummary: false,
    weeklyReport: true,
    mistakeAlerts: true,
  });

  const [tradingSettings, setTradingSettings] = useState<TradingSettings>({
    defaultSlippage: '0.5',
    defaultGasLimit: '300000',
    autoSync: true,
    syncInterval: '24',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotifications = async () => {
    try {
      setIsSaving(true);
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTradingSettings = async () => {
    try {
      setIsSaving(true);
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Trading settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" defaultValue="Dev User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" defaultValue="dev@chainjournal.io" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Display Preferences</h3>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="UTC">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="CST">Central Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trade-alerts">Trade Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when trades are imported or synced
                    </p>
                  </div>
                  <Switch
                    id="trade-alerts"
                    checked={notifications.tradeAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, tradeAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="daily-summary">Daily Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily trading performance summary
                    </p>
                  </div>
                  <Switch
                    id="daily-summary"
                    checked={notifications.dailySummary}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, dailySummary: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-report">Weekly Report</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly analytics and performance reports
                    </p>
                  </div>
                  <Switch
                    id="weekly-report"
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, weeklyReport: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mistake-alerts">Mistake Pattern Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when recurring mistake patterns are detected
                    </p>
                  </div>
                  <Switch
                    id="mistake-alerts"
                    checked={notifications.mistakeAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, mistakeAlerts: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Settings</CardTitle>
              <CardDescription>
                Configure default trading parameters and sync options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slippage">Default Slippage (%)</Label>
                  <Input 
                    id="slippage" 
                    type="number" 
                    step="0.1"
                    value={tradingSettings.defaultSlippage}
                    onChange={(e) => 
                      setTradingSettings(prev => ({ ...prev, defaultSlippage: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gas">Default Gas Limit</Label>
                  <Input 
                    id="gas" 
                    type="number"
                    value={tradingSettings.defaultGasLimit}
                    onChange={(e) => 
                      setTradingSettings(prev => ({ ...prev, defaultGasLimit: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Auto-Sync Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync">Enable Auto-Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync wallet trades at regular intervals
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={tradingSettings.autoSync}
                    onCheckedChange={(checked) => 
                      setTradingSettings(prev => ({ ...prev, autoSync: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval (hours)</Label>
                  <Select 
                    value={tradingSettings.syncInterval}
                    onValueChange={(value) => 
                      setTradingSettings(prev => ({ ...prev, syncInterval: value }))
                    }
                    disabled={!tradingSettings.autoSync}
                  >
                    <SelectTrigger id="sync-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every hour</SelectItem>
                      <SelectItem value="6">Every 6 hours</SelectItem>
                      <SelectItem value="12">Every 12 hours</SelectItem>
                      <SelectItem value="24">Every 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveTradingSettings} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Trading Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mistake Categories</CardTitle>
              <CardDescription>
                Manage your custom mistake categories for better trade analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomMistakeManager />
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Custom mistake categories help you track specific patterns in your trading. 
              You can assign these to trades along with the predefined categories.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <div>
                  <h3 className="font-semibold">Current Plan: Trial</h3>
                  <p className="text-sm text-muted-foreground">
                    5 days remaining in your free trial
                  </p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your trial includes full access to all features. 
                  After the trial, you'll be switched to the free tier with limited features.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Free</CardTitle>
                    <CardDescription>Basic features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">$0/mo</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li>✓ 1 wallet</li>
                      <li>✓ Basic journaling</li>
                      <li>✗ Advanced analytics</li>
                      <li>✗ Mistake tracking</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Pro</CardTitle>
                    <CardDescription>For active traders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">$29/mo</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li>✓ Unlimited wallets</li>
                      <li>✓ Full journaling suite</li>
                      <li>✓ Advanced analytics</li>
                      <li>✓ Mistake tracking</li>
                    </ul>
                    <Button className="w-full mt-4">Upgrade</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team</CardTitle>
                    <CardDescription>For trading teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">$99/mo</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li>✓ Everything in Pro</li>
                      <li>✓ Team collaboration</li>
                      <li>✓ API access</li>
                      <li>✓ Priority support</li>
                    </ul>
                    <Button variant="outline" className="w-full mt-4">Contact Sales</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}