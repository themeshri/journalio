import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/navigation/header';
import { Sidebar } from '@/components/navigation/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(); // Protect all dashboard routes
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}