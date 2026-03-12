'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const next = searchParams.get('next') || '/dashboard'
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')

    async function handleAuth() {
      // ─── Scenario 1: token_hash aanwezig (Supabase default email template) ───
      // De magic link / invite link stuurt de gebruiker hierheen met
      // ?token_hash=xxx&type=magiclink (of type=invite, type=email)
      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        })

        if (verifyError) {
          // Token verlopen of ongeldig → toon foutmelding
          router.replace(`/?error=otp_expired`)
          return
        }

        // Sessie is nu actief → doorsturen
        router.replace(next)
        return
      }

      // ─── Scenario 2: code aanwezig (PKCE flow) ───
      // Doorsturen naar server-side callback voor code exchange
      if (code) {
        router.replace(`/auth/callback?code=${code}&next=${encodeURIComponent(next)}`)
        return
      }

      // ─── Scenario 3: sessie bestaat al ───
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace(next)
        return
      }

      // ─── Scenario 4: wacht op auth state change via hash fragment ───
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
            subscription.unsubscribe()
            router.replace(next)
          }
        }
      )

      // ─── Scenario 5: timeout na 8 seconden ───
      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/?error=auth_timeout')
      }, 8000)
    }

    handleAuth()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-danger mb-2">{error}</p>
          <a href="/" className="text-sm text-primary underline">
            Terug naar home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-text-secondary">
          Even geduld, je wordt ingelogd...
        </p>
      </div>
    </div>
  )
}

export default function AuthConfirm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-text-secondary">
              Even geduld, je wordt ingelogd...
            </p>
          </div>
        </div>
      }
    >
      <AuthConfirmInner />
    </Suspense>
  )
}
