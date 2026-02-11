import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="space-y-4 w-80">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Setting up your authentication</p>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}