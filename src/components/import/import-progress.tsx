'use client';

interface ImportProgressProps {
  progress: number;
  total?: number;
  status: string;
}

export function ImportProgress({ progress, total, status }: ImportProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{status}</span>
        <span className="text-sm text-muted-foreground">
          {progress}%{total && ` (${Math.floor((progress / 100) * total)}/${total})`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}