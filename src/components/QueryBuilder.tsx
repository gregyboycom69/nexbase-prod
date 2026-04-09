'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// UUID generator for query row IDs
const generateId = () => crypto.randomUUID()

type Table = {
  id: string
  name: string
  slug: string
  fields: any[]
}

type QBERow = {
  id: string
  field: string
  table: string
  sort: 'None' | 'Ascending' | 'Descending'
  show: boolean
  criteria: string
}

type Query = {
  id: string
  name: string
  definition: any
}

export default function QueryBuilder({ workspaceId }: { workspaceId: string }) {
  const supabase = createClient()

  const [tables, setTables] = useState<Table[]>([])
  const [queries, setQueries] = useState<Query[]>([])
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [qbeRows, setQbeRows] = useState<QBERow[]>([])
  const [results, setResults] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [showNewQueryModal, setShowNewQueryModal] = useState(false)
  const [newQueryName, setNewQueryName] = useState('')

  useEffect(() => {
    loadTables()
    loadQueries()
  }, [workspaceId])

  const loadTables = async () => {
    const { data } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (data) {
      setTables(data.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        fields: t.fields || []
      })))
    }
  }

  const loadQueries = async () => {
    const { data } = await supabase
      .from('workspace_queries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (data) {
      setQueries(data.map(q => ({
        id: q.id,
        name: q.name,
        definition: q.definition || {}
      })))
    }
  }

  const createNewQuery = async () => {
    if (!newQueryName.trim()) return

    const { data, error } = await supabase
      .from('workspace_queries')
      .insert({
        workspace_id: workspaceId,
        name: newQueryName,
        definition: { qbeRows: [] }
      })
      .select()
      .single()

    if (!error && data) {
      const newQuery: Query = {
        id: data.id,
        name: data.name,
        definition: data.definition || {}
      }
      setQueries(prev => [...prev, newQuery])
      setSelectedQuery(newQuery)
      setQbeRows([])
      setNewQueryName('')
      setShowNewQueryModal(false)
    }
  }

  const addQBERow = () => {
    const newRow: QBERow = {
      id: generateId(),
      field: '',
      table: tables[0]?.name || '',
      sort: 'None',
      show: true,
      criteria: ''
    }
    setQbeRows(prev => [...prev, newRow])
  }

  const updateQBERow = (rowId: string, updates: Partial<QBERow>) => {
    setQbeRows(prev => prev.map(r => r.id === rowId ? { ...r, ...updates } : r))
  }

  const deleteQBERow = (rowId: string) => {
    setQbeRows(prev => prev.filter(r => r.id !== rowId))
  }

  const runQuery = async () => {
    setRunning(true)
    setResults([])

    // For demo: show sample data
    // In production, this would build SQL and execute against app_data
    const sampleData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
    ]

    setTimeout(() => {
      setResults(sampleData)
      setRunning(false)
    }, 500)
  }

  const saveQuery = async () => {
    if (!selectedQuery) return

    const { error } = await supabase
      .from('workspace_queries')
      .update({
        definition: { qbeRows }
      })
      .eq('id', selectedQuery.id)

    if (!error) {
      alert('Query saved successfully!')
    } else {
      alert('Error saving query: ' + error.message)
    }
  }

  const deleteQuery = async (queryId: string) => {
    if (!confirm('Delete this query?')) return

    const { error } = await supabase.from('workspace_queries').delete().eq('id', queryId)

    if (!error) {
      setQueries(prev => prev.filter(q => q.id !== queryId))
      if (selectedQuery?.id === queryId) {
        setSelectedQuery(null)
        setQbeRows([])
      }
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* New Query Modal */}
      {showNewQueryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowNewQueryModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e2035', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>Create New Query</div>
            <input
              type="text"
              value={newQueryName}
              onChange={e => setNewQueryName(e.target.value)}
              placeholder="Query name (e.g. Active Customers)"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', background: '#252840', border: '1px solid #3a3f5c', borderRadius: 8, color: '#e2e8f0', fontSize: 14, marginBottom: 20 }}
              onKeyDown={e => e.key === 'Enter' && createNewQuery()}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={createNewQuery} disabled={!newQueryName.trim()}
                style={{ flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: newQueryName.trim() ? 'pointer' : 'not-allowed', opacity: newQueryName.trim() ? 1 : 0.5 }}>
                Create
              </button>
              <button onClick={() => setShowNewQueryModal(false)}
                style={{ flex: 1, padding: '10px', background: '#252840', color: '#9ca3af', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Query List */}
      <div style={{ width: 240, background: '#1e2035', borderRight: '1px solid #252840', padding: 16, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <button onClick={() => setShowNewQueryModal(true)}
          style={{ padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>➕</span>
          New Query
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: '0.05em' }}>QUERIES</div>

        {queries.map(query => (
          <div key={query.id}
            onClick={() => { setSelectedQuery(query); setQbeRows(query.definition.qbeRows || []) }}
            style={{
              padding: '10px 12px',
              background: selectedQuery?.id === query.id ? '#4f46e5' : 'transparent',
              color: selectedQuery?.id === query.id ? '#fff' : '#9ca3af',
              borderRadius: 8,
              marginBottom: 6,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if (selectedQuery?.id !== query.id) e.currentTarget.style.background = '#252840' }}
            onMouseLeave={e => { if (selectedQuery?.id !== query.id) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔍</span>
              <span>{query.name}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); deleteQuery(query.id) }}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: 4 }}>
              🗑
            </button>
          </div>
        ))}

        {queries.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 12 }}>
            No queries yet
            <br />
            Click New Query to start
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #252840' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: '0.05em' }}>TABLES</div>
          {tables.map(t => (
            <div key={t.id} style={{ padding: '8px 10px', background: '#252840', borderRadius: 6, marginBottom: 6, fontSize: 12, color: '#9ca3af' }}>
              📊 {t.name}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Query Designer */}
      {selectedQuery ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 24px', background: '#13141f', borderBottom: '1px solid #252840', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{selectedQuery.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Query By Example (QBE)</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={addQBERow}
                style={{ padding: '8px 16px', background: '#252840', color: '#e2e8f0', border: '1px solid #3a3f5c', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ➕ Add Field
              </button>
              <button onClick={runQuery} disabled={running}
                style={{ padding: '8px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
                {running ? 'Running...' : '▶️ Run'}
              </button>
              <button onClick={saveQuery}
                style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                💾 Save
              </button>
            </div>
          </div>

          {/* QBE Grid */}
          <div style={{ padding: 24, overflow: 'auto' }}>
            <div style={{ background: '#1e2035', borderRadius: 12, overflow: 'hidden', border: '1px solid #252840', marginBottom: 24 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 150px 120px 80px 200px 50px', gap: 1, background: '#252840', padding: '12px 16px', borderBottom: '2px solid #3a3f5c' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>FIELD</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>TABLE</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>SORT</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>SHOW</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>CRITERIA</div>
                <div></div>
              </div>

              {/* QBE Rows */}
              {qbeRows.map(row => (
                <div key={row.id}
                  style={{ display: 'grid', gridTemplateColumns: '200px 150px 120px 80px 200px 50px', gap: 1, background: '#1e2035', padding: '8px 16px', borderBottom: '1px solid #252840', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={row.field}
                    onChange={e => updateQBERow(row.id, { field: e.target.value })}
                    placeholder="field_name"
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}
                  />
                  <select
                    value={row.table}
                    onChange={e => updateQBERow(row.id, { table: e.target.value })}
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}>
                    {tables.map(t => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={row.sort}
                    onChange={e => updateQBERow(row.id, { sort: e.target.value as any })}
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}>
                    <option>None</option>
                    <option>Ascending</option>
                    <option>Descending</option>
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.show}
                      onChange={e => updateQBERow(row.id, { show: e.target.checked })}
                      style={{ accentColor: '#4f46e5', width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={row.criteria}
                    onChange={e => updateQBERow(row.id, { criteria: e.target.value })}
                    placeholder='e.g. "USA" or >100'
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}
                  />
                  <button onClick={() => deleteQBERow(row.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>
                    🗑
                  </button>
                </div>
              ))}

              {qbeRows.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                  No fields selected. Click Add Field to start building your query.
                </div>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
                  Query Results ({results.length} records)
                </div>
                <div style={{ background: '#1e2035', borderRadius: 12, overflow: 'hidden', border: '1px solid #252840' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#252840' }}>
                        {Object.keys(results[0] || {}).map(key => (
                          <th key={key} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>
                            {key.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #252840', background: idx % 2 === 0 ? '#1e2035' : '#1a1b2e' }}>
                          {Object.values(row).map((val: any, vidx) => (
                            <td key={vidx} style={{ padding: '10px 16px', fontSize: 13, color: '#e2e8f0' }}>
                              {val?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No query selected</div>
            <div style={{ fontSize: 13 }}>Select a query from the list or create a new one</div>
          </div>
        </div>
      )}
    </div>
  )
}
