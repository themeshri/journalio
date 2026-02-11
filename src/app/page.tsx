export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">ChainJournal</h1>
        <p className="text-xl text-muted-foreground">
          Professional crypto trading journal and analytics
        </p>
        <div className="space-y-4">
          <p className="text-blue-600">✓ Next.js 16 initialized</p>
          <p className="text-gray-500">Authentication setup in progress...</p>
        </div>
      </div>
    </main>
  )
}