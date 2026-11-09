import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isLiveSupabase, DEMO_USER, DEMO_TOKEN } from '../lib/supabase'
import { createOfflineSession, createDemoSession } from '../lib/api'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check local offline auth session
    const cachedAuth = localStorage.getItem('finflow_auth_session')
    if (cachedAuth) {
      try {
        const parsed = JSON.parse(cachedAuth)
        if (parsed?.user && parsed?.access_token) {
          setUser(parsed.user)
          setSession({ access_token: parsed.access_token, user: parsed.user })
          setLoading(false)
          return
        }
      } catch {
        localStorage.removeItem('finflow_auth_session')
      }
    }

    // 2. Check local demo session
    const cachedDemo = localStorage.getItem('finflow_demo_session')
    if (cachedDemo) {
      try {
        const parsed = JSON.parse(cachedDemo)
        setUser(parsed.user || DEMO_USER)
        setSession({ access_token: parsed.access_token || DEMO_TOKEN, user: parsed.user || DEMO_USER })
        setLoading(false)
        return
      } catch {
        localStorage.removeItem('finflow_demo_session')
      }
    }

    // 3. Check live Supabase session if connected
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
      // Offline fallback: call backend to issue cryptographic local development JWT
      const res = await createOfflineSession({ email, password })
      localStorage.setItem('finflow_auth_session', JSON.stringify({
        access_token: res.access_token,
        user: res.user,
      }))
      setUser(res.user)
      setSession({ access_token: res.access_token, user: res.user })
      return { user: res.user, session: { access_token: res.access_token } }
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
      // Offline fallback: create local user profile and receive signed development JWT
      const res = await createOfflineSession({ email, password, full_name: fullName })
      localStorage.setItem('finflow_auth_session', JSON.stringify({
        access_token: res.access_token,
        user: res.user,
      }))
      setUser(res.user)
      setSession({ access_token: res.access_token, user: res.user })
      return { user: res.user, session: { access_token: res.access_token } }
    }
  }

  const signInWithDemo = async () => {
    try {
      const res = await createDemoSession()
      localStorage.setItem('finflow_demo_session', JSON.stringify({
        access_token: res.access_token,
        user: res.user,
      }))
      setUser(res.user)
      setSession({ access_token: res.access_token, user: res.user })
      return { user: res.user, session: { access_token: res.access_token } }
    } catch {
      // Direct local fallback if backend unreachable
      const demoSession = {
        access_token: DEMO_TOKEN,
        user: DEMO_USER,
      }
      localStorage.setItem('finflow_demo_session', JSON.stringify(demoSession))
      setUser(DEMO_USER)
      setSession(demoSession)
      return { user: DEMO_USER, session: demoSession }
    }
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
    localStorage.removeItem('finflow_auth_session')
    localStorage.removeItem('finflow_demo_session')
    if (isLiveSupabase && supabase) {
      try {
        await supabase.auth.signOut()
      } catch {
        // Safe ignore
      }
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
