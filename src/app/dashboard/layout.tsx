import { requireAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In development, skip auth completely to avoid any errors
  let user = undefined;
  
  if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
    // Mock user for development
    user = {
      name: 'Demo Trader',
      email: 'trader@chainjournal.com',
      avatarUrl: undefined
    };
  } else {
    // Get real user in production
    await requireAuth();
    // TODO: Fetch actual user data from Clerk
  }
  
  return (
    <AppLayout user={user}>
      {children}
    </AppLayout>
  );
}