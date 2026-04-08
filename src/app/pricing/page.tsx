'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleGetStarted = async (plan: 'starter' | 'builder' | 'agency') => {
    if (!user) {
      router.push(`/signup?plan=${plan}`)
      return
    }

    setLoading(plan)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert('Error: ' + error)
        setLoading('')
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout')
      setLoading('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f9fafb 0%, #fff 100%)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '20px 40px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5' }}>NexBase</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Home</a>
            <a href="/templates" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Templates</a>
            <a href="/pricing" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Pricing</a>
            {user ? (
              <a href="/dashboard" style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Dashboard</a>
            ) : (
              <>
                <a href="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Sign In</a>
                <a href="/signup" style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Get Started</a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#1f2937', marginBottom: 16 }}>
          Simple, Transparent Pricing
        </div>
        <div style={{ fontSize: 20, color: '#6b7280', marginBottom: 8 }}>
          Choose the plan that's right for you
        </div>
        <div style={{ fontSize: 16, color: '#9ca3af' }}>
          Start free trial • No credit card required
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

        {/* Starter */}
        <div style={{ background: '#fff', border: '2px solid #e5e7eb', borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>STARTER</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>
            €19<span style={{ fontSize: 20, fontWeight: 400, color: '#9ca3af' }}>/mo</span>
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Perfect for individuals</div>

          <ul style={{ margin: '24px 0', padding: 0, listStyle: 'none' }}>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> 1 Workspace
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> 5 Pages per workspace
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> 1,000 data rows/month
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> Email support
            </li>
          </ul>

          <button
            onClick={() => handleGetStarted('starter')}
            disabled={loading === 'starter'}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#fff',
              color: '#4f46e5',
              border: '2px solid #4f46e5',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading === 'starter' ? 'not-allowed' : 'pointer',
              opacity: loading === 'starter' ? 0.6 : 1,
            }}
          >
            {loading === 'starter' ? 'Processing...' : 'Get Started'}
          </button>
        </div>

        {/* Builder */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 16, padding: 32, position: 'relative', color: '#fff', boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)' }}>
          <div style={{ position: 'absolute', top: -12, right: 24, background: '#fbbf24', color: '#78350f', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            POPULAR
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>BUILDER</div>
          <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 4 }}>
            €49<span style={{ fontSize: 20, fontWeight: 400, opacity: 0.8 }}>/mo</span>
          </div>
          <div style={{ fontSize: 14, marginBottom: 24, opacity: 0.9 }}>For professionals</div>

          <ul style={{ margin: '24px 0', padding: 0, listStyle: 'none' }}>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span> 10 Workspaces
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span> Unlimited pages
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span> 50,000 data rows/month
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span> Priority support
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span> Custom branding
            </li>
          </ul>

          <button
            onClick={() => handleGetStarted('builder')}
            disabled={loading === 'builder'}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#fff',
              color: '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading === 'builder' ? 'not-allowed' : 'pointer',
              opacity: loading === 'builder' ? 0.6 : 1,
            }}
          >
            {loading === 'builder' ? 'Processing...' : 'Get Started'}
          </button>
        </div>

        {/* Agency */}
        <div style={{ background: '#fff', border: '2px solid #e5e7eb', borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>AGENCY</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>
            €149<span style={{ fontSize: 20, fontWeight: 400, color: '#9ca3af' }}>/mo</span>
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>For teams & agencies</div>

          <ul style={{ margin: '24px 0', padding: 0, listStyle: 'none' }}>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> Unlimited workspaces
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> Unlimited pages
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> Unlimited data rows
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> White-label
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> API access
            </li>
            <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ color: '#10b981' }}>✓</span> 24/7 support
            </li>
          </ul>

          <button
            onClick={() => handleGetStarted('agency')}
            disabled={loading === 'agency'}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading === 'agency' ? 'not-allowed' : 'pointer',
              opacity: loading === 'agency' ? 0.6 : 1,
            }}
          >
            {loading === 'agency' ? 'Processing...' : 'Get Started'}
          </button>
        </div>
      </div>

      {/* FAQ or Comparison Table */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 40px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
          All plans include
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, textAlign: 'left', marginTop: 32 }}>
          <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>Drag & Drop Designer</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Visual form builder with 25+ control types</div>
          </div>
          <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>Real Database</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Powered by Supabase with RLS security</div>
          </div>
          <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>One-Click Publish</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Your clients get instant access</div>
          </div>
          <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>Custom Branding</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Use your brand colors and logo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
