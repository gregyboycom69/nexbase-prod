'use client'

import { useState } from 'react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  limitType: string
}

export default function UpgradeModal({ isOpen, onClose, currentPlan, limitType }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async (plan: 'starter' | 'builder' | 'agency') => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert('Error: ' + error)
        setLoading(false)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginBottom: 12 }}>
          Upgrade Your Plan
        </div>
        <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
          You've reached the {limitType} limit on the <span style={{ fontWeight: 600, color: '#4f46e5' }}>{currentPlan}</span> plan.
        </div>

        {currentPlan !== 'builder' && (
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>MOST POPULAR</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Builder Plan</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>
                €49<span style={{ fontSize: 16, fontWeight: 400 }}>/mo</span>
              </div>
            </div>
            <ul style={{ margin: '16px 0', padding: 0, listStyle: 'none' }}>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> 10 Workspaces
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Unlimited Pages
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> 50,000 Data Rows/month
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Custom Branding
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Priority Support
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade('builder')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#fff',
                color: '#667eea',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Upgrade to Builder'}
            </button>
          </div>
        )}

        {currentPlan !== 'agency' && (
          <div
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>UNLIMITED</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Agency Plan</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>
                €149<span style={{ fontSize: 16, fontWeight: 400 }}>/mo</span>
              </div>
            </div>
            <ul style={{ margin: '16px 0', padding: 0, listStyle: 'none' }}>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Unlimited Workspaces
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Unlimited Pages
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Unlimited Data Rows
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> White-label (Remove Branding)
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> API Access
              </li>
              <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> 24/7 Support
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade('agency')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#fff',
                color: '#a855f7',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Upgrade to Agency'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: '#6b7280',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}
