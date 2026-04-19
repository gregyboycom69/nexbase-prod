'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type WorkspacePageProps = {
  params: { slug: string }
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [tables, setTables] = useState<any[]>([])
  const [queries, setQueries] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    tables: true,
    queries: true,
    forms: true,
    macros: true,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')

  useEffect(() => {
    loadData()
  }, [params.slug])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (!ws) {
      router.push('/dashboard')
      return
    }

    setWorkspace(ws)
    setWorkspaceName(ws.name)

    // Load tables
    const { data: tablesData } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', ws.id)
      .order('name')
    setTables(tablesData || [])

    // Load queries
    const { data: queriesData } = await supabase
      .from('workspace_queries')
      .select('*')
      .eq('workspace_id', ws.id)
      .order('name')
    setQueries(queriesData || [])

    // Load forms (pages)
    const { data: formsData } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', ws.id)
      .order('name')
    setForms(formsData || [])

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function saveWorkspaceName() {
    if (!workspace || !workspaceName.trim()) return

    await supabase
      .from('workspaces')
      .update({ name: workspaceName })
      .eq('id', workspace.id)

    setWorkspace({ ...workspace, name: workspaceName })
    setIsEditingName(false)
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredQueries = queries.filter(q =>
    q.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredForms = forms.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff', color: '#0f172a' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Bar */}
      <div style={{ height: 56, background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <div style={{
            width: 20,
            height: 20,
            background: '#4f46e5',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600
          }}>
            N
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0f172a' }}>NexBase</div>
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          {isEditingName ? (
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onBlur={saveWorkspaceName}
              onKeyDown={(e) => e.key === 'Enter' && saveWorkspaceName()}
              autoFocus
              style={{ background: '#f8fafc', border: '1px solid #4f46e5', color: '#0f172a', padding: '4px 8px', borderRadius: 6, fontSize: 13 }}
            />
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              style={{ fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 400 }}
            >
              {workspace?.name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%' }} />
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>Live</span>
          </div>
          <button
            onClick={() => router.push(`/studio/${params.slug}`)}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          >
            Studio
          </button>
          <button
            onClick={handleSignOut}
            style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{ width: 200, background: '#f8fafc', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ padding: 12 }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}
            />
          </div>

          {/* Navigation Sections */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* TABLES */}
            <div>
              <div
                onClick={() => toggleSection('tables')}
                style={{ padding: '8px 12px 4px', color: '#94a3b8', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>TABLES</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/studio/${params.slug}/tables`)
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.tables ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.tables && (
                <div>
                  {filteredTables.map(table => (
                    <div
                      key={table.id}
                      onClick={() => router.push(`/studio/${params.slug}/tables?table=${table.id}`)}
                      onDoubleClick={() => router.push(`/studio/${params.slug}/tables?table=${table.id}&design=true`)}
                      style={{ padding: '6px 12px 6px 20px', fontSize: 12, color: '#64748b', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 10 }}>▦</span>
                      {table.name}
                    </div>
                  ))}
                  {filteredTables.length === 0 && (
                    <div style={{ padding: '6px 12px 6px 20px', fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                      No tables
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QUERIES */}
            <div>
              <div
                onClick={() => toggleSection('queries')}
                style={{ padding: '8px 12px 4px', color: '#94a3b8', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>QUERIES</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/studio/${params.slug}/queries`)
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.queries ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.queries && (
                <div>
                  {filteredQueries.map(query => (
                    <div
                      key={query.id}
                      onClick={() => router.push(`/studio/${params.slug}/queries?query=${query.id}`)}
                      onDoubleClick={() => router.push(`/studio/${params.slug}/queries?query=${query.id}&design=true`)}
                      style={{ padding: '6px 12px 6px 20px', fontSize: 12, color: '#64748b', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 10 }}>⊕</span>
                      {query.name}
                    </div>
                  ))}
                  {filteredQueries.length === 0 && (
                    <div style={{ padding: '6px 12px 6px 20px', fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                      No queries
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FORMS */}
            <div>
              <div
                onClick={() => toggleSection('forms')}
                style={{ padding: '8px 12px 4px', color: '#94a3b8', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>FORMS</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/studio/${params.slug}`)
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.forms ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.forms && (
                <div>
                  {filteredForms.map(form => (
                    <div
                      key={form.id}
                      onClick={() => router.push(`/app/${params.slug}?page=${form.id}`)}
                      onDoubleClick={() => router.push(`/studio/${params.slug}?form=${form.id}`)}
                      style={{ padding: '6px 12px 6px 20px', fontSize: 12, color: '#64748b', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 10 }}>◻</span>
                      {form.name}
                    </div>
                  ))}
                  {filteredForms.length === 0 && (
                    <div style={{ padding: '6px 12px 6px 20px', fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                      No forms
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MACROS */}
            <div>
              <div
                onClick={() => toggleSection('macros')}
                style={{ padding: '8px 12px 4px', color: '#94a3b8', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>MACROS</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.macros ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.macros && (
                <div style={{ padding: '6px 12px 6px 20px', fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                  No macros
                </div>
              )}
            </div>
          </div>

          {/* New Button */}
          <div style={{ padding: 12, borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => router.push(`/studio/${params.slug}`)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                color: '#64748b',
                border: '1px dashed #cbd5e1',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              + New object
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 40, background: '#f1f5f9' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 32 }}>
            {workspace?.name}
          </h1>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32, maxWidth: 600 }}>
            <div
              onClick={() => router.push(`/studio/${params.slug}/tables`)}
              style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Design a Table</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Create and manage database tables</div>
            </div>

            <div
              onClick={() => router.push(`/studio/${params.slug}/queries`)}
              style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Create a Query</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Build queries visually</div>
            </div>

            <div
              onClick={() => router.push(`/studio/${params.slug}`)}
              style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Design a Form</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Create custom forms</div>
            </div>

            <div
              onClick={() => window.open(`/app/${params.slug}`, '_blank')}
              style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🚀</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>View Published App</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Open the live application</div>
            </div>
          </div>

          {/* Workspace Stats */}
          <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, maxWidth: 600 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Workspace Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>{tables.length}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Tables</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>{forms.length}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Forms</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>{queries.length}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Queries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
