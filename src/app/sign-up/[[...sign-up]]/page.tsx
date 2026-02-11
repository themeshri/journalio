import { SignUp } from '@clerk/nextjs'
import { Suspense } from 'react'
import { AuthLoading } from '@/components/auth/auth-loading'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-600 mt-2">Start your crypto trading journal</p>
        </div>
        <Suspense fallback={<AuthLoading />}>
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg border border-gray-200",
                headerTitle: "hidden", 
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700",
                formFieldInput: "border-gray-300 focus:border-primary focus:ring-primary",
              }
            }}
            redirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
          />
        </Suspense>
      </div>
    </div>
  )
}