// Development auth bypass - no Clerk imports
export async function auth() {
  // Always return dev user in development
  if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
    return {
      userId: 'dev-user-123',
      sessionId: 'dev-session-123'
    };
  }
  
  // Production would use real auth here
  return { userId: null, sessionId: null };
}

export async function requireAuth() {
  // Development bypass - always return success in development
  if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
    return 'dev-user-123';
  }

  const session = await auth();
  
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }
  
  return session.userId;
}

export async function getUserDetails() {
  // Development bypass
  if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
    return {
      id: 'dev-user-123',
      email: 'dev@chainjournal.com',
      name: 'Dev User',
      avatar: '/placeholder-avatar.jpg'
    };
  }

  const session = await auth();
  
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }
  
  return {
    id: session.userId,
    email: 'dev@chainjournal.com',
    name: 'Dev User',
    avatar: '/placeholder-avatar.jpg'
  };
}