import { getUserDetails } from '@/lib/auth';
import { Card } from '@/components/ui/card';

export default async function DashboardPage() {
  const user = await getUserDetails();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Trades</h3>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-muted-foreground">No trades recorded yet</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Portfolio Value</h3>
          <p className="text-3xl font-bold text-green-600">$0.00</p>
          <p className="text-sm text-muted-foreground">Connect wallet to view</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">P&L Today</h3>
          <p className="text-3xl font-bold text-gray-600">$0.00</p>
          <p className="text-sm text-muted-foreground">No trades today</p>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <h4 className="font-medium">Connect Wallet</h4>
            <p className="text-sm text-muted-foreground">Link your crypto wallet to import trades automatically</p>
          </div>
          <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <h4 className="font-medium">Import from OKX</h4>
            <p className="text-sm text-muted-foreground">Connect your OKX account to sync trading history</p>
          </div>
        </div>
      </Card>
    </div>
  );
}