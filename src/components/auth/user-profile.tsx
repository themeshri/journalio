'use client';

import { UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user } = useUser();
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <p className="font-medium">{user?.fullName}</p>
        <p className="text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
      </div>
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-8 w-8"
          }
        }}
      />
    </div>
  );
}