import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { queryClient } from '../providers/react-query-provider'

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isGuest: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isGuest: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Track whether a session existed before a SIGNED_OUT event fires
  const hadSessionRef = useRef(false)
  const suppressNextSignOutAlertRef = useRef(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      hadSessionRef.current = !!session
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear()               // clear private user cache immediately
        AsyncStorage.removeItem('onboarded')
        if (suppressNextSignOutAlertRef.current) {
          suppressNextSignOutAlertRef.current = false
        } else if (hadSessionRef.current) {
          Alert.alert('Session Expired', 'Please sign in again.')
        }
      }
      hadSessionRef.current = !!session
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error

    // FIX-159B: DO NOT INSERT into profiles here. The supabase_auth_admin trigger
    // creates the profiles row on auth.users INSERT (privileged role, bypasses the
    // broken BEFORE INSERT trigger on profiles). Any client-side INSERT hits that
    // broken trigger ("permission denied for table users") and throws, causing the
    // signup glitch. Name is saved in onboarding via UPDATE (FIX-159).
    if (data.session) {
      suppressNextSignOutAlertRef.current = true
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) throw signOutError
      setSession(null)
      setUser(null)
      hadSessionRef.current = false
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'authentichadith://auth/reset-password',
    })
    if (error) throw error
  }

  const value = {
    session,
    user,
    isLoading,
    isGuest: !user,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
