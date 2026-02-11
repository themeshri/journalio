import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

export async function getUserDetails() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: user.fullName,
    avatar: user.imageUrl
  };
}