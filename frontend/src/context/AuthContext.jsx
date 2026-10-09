import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isLiveSupabase, DEMO_USER, DEMO_TOKEN } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check local session cache
    const cachedDemo = localStorage.getItem('finflow_demo_session')
    if (cachedDemo) {
      try {
        const parsed = JSON.parse(cachedDemo)
        setUser(parsed.user)
        setSession(parsed.session)
        setLoading(false)
        return
      } catch {
        localStorage.removeItem('finflow_demo_session')
      }
    }

    // 2. Check live Supabase session if connected
    if (isLiveSupabase && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = async (email, password) => {
    // Check if demo user
    if (email.toLowerCase() === 'demo@finflow.app') {
      return signInWithDemo()
    }

    if (isLiveSupabase && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setUser(data.user)
      setSession(data.session)
      return data
    } else {
      // Offline fallback: sign in with provided email
      const mockUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: email.split('@')[0] },
      }
      const mockSession = { access_token: 'local_token_' + Date.now(), user: mockUser }
      localStorage.setItem('finflow_demo_session', JSON.stringify({ user: mockUser, session: mockSession }))
      setUser(mockUser)
      setSession(mockSession)
      return { user: mockUser, session: mockSession }
    }
  }

  const signUp = async (email, password, fullName) => {
    if (isLiveSupabase && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) throw error
      return data
    } else {
      const mockUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: fullName || email.split('@')[0] },
      }
      const mockSession = { access_token: 'local_token_' + Date.now(), user: mockUser }
      localStorage.setItem('finflow_demo_session', JSON.stringify({ user: mockUser, session: mockSession }))
      setUser(mockUser)
      setSession(mockSession)
      return { user: mockUser, session: mockSession }
    }
  }

  const signInWithDemo = () => {
    const demoSession = {
      access_token: DEMO_TOKEN,
      user: DEMO_USER,
    }
    localStorage.setItem('finflow_demo_session', JSON.stringify({ user: DEMO_USER, session: demoSession }))
    setUser(DEMO_USER)
    setSession(demoSession)
    return { user: DEMO_USER, session: demoSession }
  }

  const signInWithGoogle = async () => {
    if (isLiveSupabase && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      })
      if (error) throw error
      return data
    } else {
      return signInWithDemo()
    }
  }

  const resetPassword = async (email) => {
    if (isLiveSupabase && supabase) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      return data
    }
    return true
  }

  const signOut = async () => {
    localStorage.removeItem('finflow_demo_session')
    if (isLiveSupabase && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
  }

  const value = {
    user,
    session,
    token: session?.access_token,
    loading,
    isAuthenticated: Boolean(user),
    isDemo: user?.id === DEMO_USER.id,
    signIn,
    signUp,
    signInWithDemo,
    signInWithGoogle,
    resetPassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
