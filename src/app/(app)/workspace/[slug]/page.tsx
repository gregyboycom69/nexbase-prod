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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f1117', color: '#c8d0f0' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Bar */}
      <div style={{ height: 56, background: '#1a1d2e', borderBottom: '1px solid #252840', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>NexBase</div>
          <div style={{ color: '#4a5277', fontSize: 20 }}>|</div>
          {isEditingName ? (
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onBlur={saveWorkspaceName}
              onKeyDown={(e) => e.key === 'Enter' && saveWorkspaceName()}
              autoFocus
              style={{ background: '#0f1117', border: '1px solid #6366f1', color: '#c8d0f0', padding: '4px 8px', borderRadius: 4, fontSize: 14 }}
            />
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              style={{ fontSize: 14, color: '#c8d0f0', cursor: 'pointer', fontWeight: 500 }}
            >
              {workspace?.name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#7480a8' }}>{user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{ background: '#252840', color: '#c8d0f0', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{ width: 200, background: '#1a1d2e', borderRight: '1px solid #252840', display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ padding: 12 }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: '#0f1117', border: '1px solid #252840', color: '#c8d0f0', padding: '6px 8px', borderRadius: 4, fontSize: 11 }}
            />
          </div>

          {/* Navigation Sections */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* TABLES */}
            <div>
              <div
                onClick={() => toggleSection('tables')}
                style={{ padding: '8px 12px', background: '#252840', color: '#8890b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📊 Tables</span>
                <span>{expandedSections.tables ? '▼' : '▶'}</span>
              </div>
              {expandedSections.tables && (
                <div>
                  {filteredTables.map(table => (
                    <div
                      key={table.id}
                      onClick={() => router.push(`/studio/${params.slug}/tables?table=${table.id}`)}
                      onDoubleClick={() => router.push(`/studio/${params.slug}/tables?table=${table.id}&design=true`)}
                      style={{ padding: '6px 12px 6px 24px', fontSize: 11, color: '#c8d0f0', cursor: 'pointer', background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#252840'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {table.name}
                    </div>
                  ))}
                  {filteredTables.length === 0 && (
                    <div style={{ padding: '6px 12px 6px 24px', fontSize: 10, color: '#4a5277', fontStyle: 'italic' }}>
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
                style={{ padding: '8px 12px', background: '#252840', color: '#8890b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🔍 Queries</span>
                <span>{expandedSections.queries ? '▼' : '▶'}</span>
              </div>
              {expandedSections.queries && (
                <div>
                  {filteredQueries.map(query => (
                    <div
                      key={query.id}
                      onClick={() => router.push(`/studio/${params.slug}/queries?query=${query.id}`)}
                      onDoubleClick={() => router.push(`/studio/${params.slug}/queries?query=${query.id}&design=true`)}
                      style={{ padding: '6px 12px 6px 24px', fontSize: 11, color: '#c8d0f0', cursor: 'pointer', background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#252840'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {query.name}
                    </div>
                  ))}
                  {filteredQueries.length === 0 && (
                    <div style={{ padding: '6px 12px 6px 24px', fontSize: 10, color: '#4a5277', fontStyle: 'italic' }}>
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
                style={{ padding: '8px 12px', background: '#252840', color: '#8890b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📄 Forms</span>
                <span>{expandedSections.forms ? '▼' : '▶'}</span>
              </div>
              {expandedSections.forms && (
                <div>
                  {filteredForms.map(form => (
                    <div
                      key={form.id}
                      onClick={() => router.push(`/app/${params.slug}?page=${form.id}`)}
                      onDoubleClick={() => router.push(`/studio/${params.slug}?form=${form.id}`)}
                      style={{ padding: '6px 12px 6px 24px', fontSize: 11, color: '#c8d0f0', cursor: 'pointer', background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#252840'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {form.name}
                    </div>
                  ))}
                  {filteredForms.length === 0 && (
                    <div style={{ padding: '6px 12px 6px 24px', fontSize: 10, color: '#4a5277', fontStyle: 'italic' }}>
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
                style={{ padding: '8px 12px', background: '#252840', color: '#8890b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>⚡ Macros</span>
                <span>{expandedSections.macros ? '▼' : '▶'}</span>
              </div>
              {expandedSections.macros && (
                <div style={{ padding: '6px 12px 6px 24px', fontSize: 10, color: '#4a5277', fontStyle: 'italic' }}>
                  No macros
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#c8d0f0', marginBottom: 40 }}>
            {workspace?.name}
          </h1>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 40, maxWidth: 600 }}>
            <div
              onClick={() => router.push(`/studio/${params.slug}/tables`)}
              style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 8, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#252840'}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#c8d0f0', marginBottom: 4 }}>Design a Table</div>
              <div style={{ fontSize: 12, color: '#7480a8' }}>Create and manage database tables</div>
            </div>

            <div
              onClick={() => router.push(`/studio/${params.slug}/queries`)}
              style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 8, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#252840'}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#c8d0f0', marginBottom: 4 }}>Create a Query</div>
              <div style={{ fontSize: 12, color: '#7480a8' }}>Build queries visually</div>
            </div>

            <div
              onClick={() => router.push(`/studio/${params.slug}`)}
              style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 8, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#252840'}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#c8d0f0', marginBottom: 4 }}>Design a Form</div>
              <div style={{ fontSize: 12, color: '#7480a8' }}>Create custom forms</div>
            </div>

            <div
              onClick={() => window.open(`/app/${params.slug}`, '_blank')}
              style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 8, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#252840'}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#c8d0f0', marginBottom: 4 }}>View Published App</div>
              <div style={{ fontSize: 12, color: '#7480a8' }}>Open the live application</div>
            </div>
          </div>

          {/* Workspace Stats */}
          <div style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 8, padding: 24, maxWidth: 600 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8890b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Workspace Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{tables.length}</div>
                <div style={{ fontSize: 11, color: '#7480a8' }}>Tables</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{forms.length}</div>
                <div style={{ fontSize: 11, color: '#7480a8' }}>Forms</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{queries.length}</div>
                <div style={{ fontSize: 11, color: '#7480a8' }}>Queries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
