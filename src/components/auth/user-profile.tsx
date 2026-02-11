'use client';

// Development mode - bypass Clerk entirely
export function UserProfile() {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <p className="font-medium">Dev User</p>
        <p className="text-muted-foreground">dev@chainjournal.com</p>
      </div>
      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-sm font-medium">DU</span>
      </div>
    </div>
  );
}