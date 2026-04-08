'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TEMPLATES = [
  { id: 1, name: 'Customer CRM', category: 'CRM', description: 'Basic customer management with contacts and notes', price: 0, image: '📊' },
  { id: 2, name: 'Golf Club Manager', category: 'Sports', description: 'Membership, events, scores tracking', price: 49, image: '⛳' },
  { id: 3, name: 'Lending Tracker', category: 'Finance', description: 'Loan management with payment tracking', price: 39, image: '💰' },
  { id: 4, name: 'Inventory System', category: 'Inventory', description: 'Products, stock levels, reorder alerts', price: 49, image: '📦' },
  { id: 5, name: 'HR System', category: 'HR', description: 'Employees, leave requests, performance', price: 49, image: '👥' },
  { id: 6, name: 'Order Planning', category: 'Operations', description: 'Purchase orders, suppliers, shipments', price: 79, image: '📋' },
  { id: 7, name: 'Event Manager', category: 'Events', description: 'Events, registrations, attendance', price: 29, image: '🎉' },
  { id: 8, name: 'Invoice Tracker', category: 'Finance', description: 'Invoices, payments, clients', price: 39, image: '🧾' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))]

  const filteredTemplates = selectedCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory)

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    if (!user) {
      router.push('/signup')
      return
    }

    if (template.price === 0) {
      // Free template - just copy it
      alert(`Would copy ${template.name} to your account (feature coming soon)`)
    } else {
      // Paid template - go to checkout
      alert(`Would redirect to Stripe checkout for ${template.name} at €${template.price} (feature coming soon)`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '20px 40px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5' }}>NexBase</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Home</a>
            <a href="/pricing" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Pricing</a>
            <a href="/templates" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Templates</a>
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
      <div style={{ padding: '60px 40px 40px', textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #f9fafb 100%)' }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#1f2937', marginBottom: 16 }}>
          Template Marketplace
        </div>
        <div style={{ fontSize: 20, color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>
          Start with a pre-built template and customize it to your needs
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 32px' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 20px',
                background: selectedCategory === cat ? '#4f46e5' : '#fff',
                color: selectedCategory === cat ? '#fff' : '#6b7280',
                border: `1px solid ${selectedCategory === cat ? '#4f46e5' : '#e5e7eb'}`,
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              {/* Preview */}
              <div
                style={{
                  height: 180,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 72,
                }}
              >
                {template.image}
              </div>

              {/* Content */}
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                      {template.name}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {template.category}
                    </div>
                  </div>
                  {template.price === 0 ? (
                    <div
                      style={{
                        padding: '4px 12px',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      FREE
                    </div>
                  ) : (
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>
                      €{template.price}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, minHeight: 40 }}>
                  {template.description}
                </div>

                <button
                  onClick={() => handleUseTemplate(template)}
                  style={{
                    width: '100%',
                    padding: '10px 20px',
                    background: template.price === 0 ? '#4f46e5' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {template.price === 0 ? 'Use Template' : 'Buy & Use'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Need a Custom Template?
        </div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          We can build a custom template for your specific industry or use case
        </div>
        <a
          href="mailto:support@nexbase.app"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#fff',
            color: '#667eea',
            textDecoration: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Contact Us
        </a>
      </div>
    </div>
  )
}
