import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ImportTrigger } from '@/components/import/import-trigger';

interface ImportPageProps {
  params: Promise<{ walletId: string }>;
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { walletId } = await params;
  const userId = await requireAuth();
  
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId,
      isActive: true
    },
    include: {
      importJobs: {
        orderBy: { startedAt: 'desc' },
        take: 5
      },
      _count: {
        select: { trades: true }
      }
    }
  });

  if (!wallet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/wallet/${wallet.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wallet
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Import Trades</h1>
          <p className="text-muted-foreground font-mono">
            {wallet.address}
          </p>
        </div>
      </div>

      <ImportTrigger 
        walletId={wallet.id}
        walletAddress={wallet.address}
        onImportComplete={() => {
          // Redirect back to wallet page after successful import
          redirect(`/dashboard/wallet/${wallet.id}`);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Recent import jobs for this wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallet.importJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No import jobs yet</p>
              <p className="text-sm">Start your first import above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.importJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {job.status === 'COMPLETED' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {job.status === 'FAILED' && <XCircle className="h-4 w-4 text-red-500" />}
                    {['PENDING', 'PROCESSING'].includes(job.status) && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    
                    <div>
                      <p className="font-medium">
                        Import Job {job.id.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Started {job.startedAt.toLocaleDateString()} at {job.startedAt.toLocaleTimeString()}
                      </p>
                      {job.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {job.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium capitalize">
                      {job.status.toLowerCase()}
                    </p>
                    {job.status === 'PROCESSING' && (
                      <p className="text-sm text-muted-foreground">
                        {job.progress}% complete
                      </p>
                    )}
                    {job.completedAt && (
                      <p className="text-sm text-muted-foreground">
                        Completed {job.completedAt.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Overview of imported trade data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{wallet._count.trades}</p>
              <p className="text-sm text-muted-foreground">Total Trades</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{wallet.importJobs.length}</p>
              <p className="text-sm text-muted-foreground">Import Jobs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}