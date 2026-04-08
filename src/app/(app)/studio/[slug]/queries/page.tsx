'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type QueryField = {
  field: string
  table: string
  sort: string
  show: boolean
  criteria: string
}

export default function QueriesPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  const [workspace, setWorkspace] = useState<any>(null)
  const [tables, setTables] = useState<any[]>([])
  const [queries, setQueries] = useState<any[]>([])
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [queryName, setQueryName] = useState('New Query')
  const [queryFields, setQueryFields] = useState<QueryField[]>([])
  const [addedTables, setAddedTables] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadWorkspace()
  }, [slug])

  async function loadWorkspace() {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!ws) {
      router.push('/dashboard')
      return
    }

    setWorkspace(ws)
    loadTables(ws.id)
    loadQueries(ws.id)
  }

  async function loadTables(workspaceId: string) {
    const { data } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')

    setTables(data || [])
  }

  async function loadQueries(workspaceId: string) {
    const { data } = await supabase
      .from('workspace_queries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at')

    setQueries(data || [])
  }

  function handleAddTable(tableName: string) {
    if (!addedTables.includes(tableName)) {
      setAddedTables([...addedTables, tableName])
    }
  }

  function handleAddField(tableName: string, fieldName: string) {
    setQueryFields([
      ...queryFields,
      { field: fieldName, table: tableName, sort: 'None', show: true, criteria: '' }
    ])
  }

  function handleAddColumn() {
    setQueryFields([
      ...queryFields,
      { field: '', table: '', sort: 'None', show: true, criteria: '' }
    ])
  }

  function handleFieldChange(index: number, updates: Partial<QueryField>) {
    const updated = [...queryFields]
    updated[index] = { ...updated[index], ...updates }
    setQueryFields(updated)
  }

  function handleDeleteField(index: number) {
    setQueryFields(queryFields.filter((_, i) => i !== index))
  }

  async function handleRunQuery() {
    if (!workspace || queryFields.length === 0) return

    // For now, just fetch all records from the first table
    const firstField = queryFields[0]
    if (!firstField.table) return

    const { data } = await supabase
      .from('app_data')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('table_name', firstField.table)

    setResults(data?.map(d => d.data) || [])
    setShowResults(true)
  }

  async function handleSaveQuery() {
    if (!workspace) return

    const queryDef = {
      name: queryName,
      tables: addedTables,
      fields: queryFields
    }

    if (selectedQuery) {
      await supabase
        .from('workspace_queries')
        .update({ name: queryName, definition: queryDef })
        .eq('id', selectedQuery.id)
    } else {
      await supabase
        .from('workspace_queries')
        .insert({
          workspace_id: workspace.id,
          name: queryName,
          definition: queryDef
        })
    }

    setSaveMessage('Saved!')
    setTimeout(() => setSaveMessage(''), 2000)
    loadQueries(workspace.id)
  }

  function handleNewQuery() {
    setSelectedQuery(null)
    setQueryName('New Query')
    setQueryFields([])
    setAddedTables([])
    setShowResults(false)
    setResults([])
  }

  const allFieldsForDropdown = addedTables.flatMap(tableName => {
    const table = tables.find(t => t.name === tableName)
    const fields = table?.fields || []
    return fields.map((f: any) => ({ table: tableName, field: f.name }))
  })

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1117', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#c8d0f0' }}>
      {/* Left Panel - Tables */}
      <div style={{ width: 200, background: '#1a1d2e', borderRight: '1px solid #252840', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #252840' }}>
          <button
            onClick={handleNewQuery}
            style={{ width: '100%', padding: '8px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            + New Query
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #252840', fontSize: 10, fontWeight: 700, color: '#8890b8', textTransform: 'uppercase' }}>
          Tables
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {tables.map(table => (
            <div
              key={table.id}
              onClick={() => handleAddTable(table.name)}
              style={{
                padding: '8px 16px',
                fontSize: 11,
                cursor: 'pointer',
                background: addedTables.includes(table.name) ? '#252840' : 'transparent',
                borderLeft: addedTables.includes(table.name) ? '3px solid #6366f1' : '3px solid transparent',
                color: addedTables.includes(table.name) ? '#fff' : '#8890b8'
              }}
              onMouseEnter={(e) => {
                if (!addedTables.includes(table.name)) e.currentTarget.style.background = '#1e2139'
              }}
              onMouseLeave={(e) => {
                if (!addedTables.includes(table.name)) e.currentTarget.style.background = 'transparent'
              }}
            >
              📊 {table.name}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #252840', fontSize: 10, fontWeight: 700, color: '#8890b8', textTransform: 'uppercase' }}>
          Saved Queries
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {queries.map(query => (
            <div
              key={query.id}
              onClick={() => {
                setSelectedQuery(query)
                setQueryName(query.name)
                const def = query.definition || {}
                setQueryFields(def.fields || [])
                setAddedTables(def.tables || [])
                setShowResults(false)
              }}
              style={{
                padding: '8px 16px',
                fontSize: 11,
                cursor: 'pointer',
                background: selectedQuery?.id === query.id ? '#252840' : 'transparent',
                borderLeft: selectedQuery?.id === query.id ? '3px solid #6366f1' : '3px solid transparent',
                color: selectedQuery?.id === query.id ? '#fff' : '#8890b8'
              }}
              onMouseEnter={(e) => {
                if (selectedQuery?.id !== query.id) e.currentTarget.style.background = '#1e2139'
              }}
              onMouseLeave={(e) => {
                if (selectedQuery?.id !== query.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              🔍 {query.name}
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #252840' }}>
          <button
            onClick={() => router.push(`/workspace/${slug}`)}
            style={{ width: '100%', padding: '8px 12px', background: '#252840', color: '#c8d0f0', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
          >
            ← Back to Workspace
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ background: '#1a1d2e', borderBottom: '1px solid #252840', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            style={{ flex: 1, padding: '6px 12px', background: '#0f1117', border: '1px solid #252840', color: '#c8d0f0', borderRadius: 4, fontSize: 14, fontWeight: 600 }}
          />
          <button
            onClick={handleRunQuery}
            style={{ padding: '6px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            ▶ Run Query
          </button>
          <button
            onClick={handleSaveQuery}
            style={{ padding: '6px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            💾 Save Query
          </button>
          <button
            onClick={() => {
              setQueryFields([])
              setAddedTables([])
              setShowResults(false)
            }}
            style={{ padding: '6px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
          >
            Clear
          </button>
          {saveMessage && (
            <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>{saveMessage}</span>
          )}
        </div>

        {/* Query Workspace */}
        {showResults ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: '#8890b8' }}>
                Results: {results.length} record{results.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={() => setShowResults(false)}
                style={{ padding: '6px 12px', background: '#252840', color: '#c8d0f0', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
              >
                ✕ Close Results
              </button>
            </div>
            <div style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 4, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#252840' }}>
                    {queryFields.filter(f => f.show).map((field, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #1a1d2e', color: '#c8d0f0', fontWeight: 600 }}>
                        {field.field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#1a1d2e' : '#1e2139', borderBottom: '1px solid #252840' }}>
                      {queryFields.filter(f => f.show).map((field, j) => (
                        <td key={j} style={{ padding: '6px 12px', borderRight: '1px solid #252840', color: '#8890b8' }}>
                          {row[field.field] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={queryFields.filter(f => f.show).length} style={{ padding: 20, textAlign: 'center', color: '#7480a8', fontStyle: 'italic' }}>
                        No results
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Added Tables Display */}
            {addedTables.length > 0 && (
              <div style={{ padding: 20, borderBottom: '1px solid #252840' }}>
                <div style={{ fontSize: 11, color: '#8890b8', marginBottom: 8 }}>Tables in Query:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {addedTables.map(tableName => {
                    const table = tables.find(t => t.name === tableName)
                    const fields = table?.fields || []
                    return (
                      <div key={tableName} style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 4, padding: 12, minWidth: 180 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#c8d0f0', marginBottom: 8 }}>
                          📊 {tableName}
                        </div>
                        <div style={{ fontSize: 10, color: '#8890b8' }}>
                          {fields.map((f: any) => (
                            <div
                              key={f.name}
                              onClick={() => handleAddField(tableName, f.name)}
                              style={{ padding: '4px 0', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#8890b8'}
                            >
                              {f.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* QBE Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#c8d0f0', marginBottom: 12 }}>Query Design Grid</div>
              <div style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 150px 120px 80px 200px 60px', background: '#252840', fontSize: 10, fontWeight: 600, color: '#c8d0f0' }}>
                  <div style={{ padding: '8px 12px', borderRight: '1px solid #1a1d2e' }}>Field</div>
                  <div style={{ padding: '8px 12px', borderRight: '1px solid #1a1d2e' }}>Table</div>
                  <div style={{ padding: '8px 12px', borderRight: '1px solid #1a1d2e' }}>Sort</div>
                  <div style={{ padding: '8px 12px', borderRight: '1px solid #1a1d2e' }}>Show</div>
                  <div style={{ padding: '8px 12px', borderRight: '1px solid #1a1d2e' }}>Criteria</div>
                  <div style={{ padding: '8px 12px' }}>Action</div>
                </div>

                {queryFields.map((field, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '200px 150px 120px 80px 200px 60px', background: index % 2 === 0 ? '#1a1d2e' : '#1e2139', borderBottom: '1px solid #252840' }}>
                    <div style={{ padding: '6px 12px', borderRight: '1px solid #252840' }}>
                      <select
                        value={`${field.table}.${field.field}`}
                        onChange={(e) => {
                          const [table, fieldName] = e.target.value.split('.')
                          handleFieldChange(index, { table, field: fieldName })
                        }}
                        style={{ width: '100%', padding: '4px 8px', background: '#0f1117', border: 'none', color: '#c8d0f0', borderRadius: 3, fontSize: 11 }}
                      >
                        <option value="">Select field...</option>
                        {allFieldsForDropdown.map((f, i) => (
                          <option key={i} value={`${f.table}.${f.field}`}>{f.table}.{f.field}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ padding: '6px 12px', borderRight: '1px solid #252840', fontSize: 11, color: '#8890b8', display: 'flex', alignItems: 'center' }}>
                      {field.table}
                    </div>
                    <div style={{ padding: '6px 12px', borderRight: '1px solid #252840' }}>
                      <select
                        value={field.sort}
                        onChange={(e) => handleFieldChange(index, { sort: e.target.value })}
                        style={{ width: '100%', padding: '4px 8px', background: '#0f1117', border: 'none', color: '#c8d0f0', borderRadius: 3, fontSize: 11 }}
                      >
                        <option value="None">None</option>
                        <option value="Ascending">Ascending</option>
                        <option value="Descending">Descending</option>
                      </select>
                    </div>
                    <div style={{ padding: '6px 12px', borderRight: '1px solid #252840', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={field.show}
                        onChange={(e) => handleFieldChange(index, { show: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ padding: '6px 12px', borderRight: '1px solid #252840' }}>
                      <input
                        type="text"
                        value={field.criteria}
                        onChange={(e) => handleFieldChange(index, { criteria: e.target.value })}
                        placeholder="e.g. >100"
                        style={{ width: '100%', padding: '4px 8px', background: '#0f1117', border: 'none', color: '#c8d0f0', borderRadius: 3, fontSize: 11 }}
                      />
                    </div>
                    <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleDeleteField(index)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ padding: 12, borderTop: '1px solid #252840', background: '#1a1d2e' }}>
                  <button
                    onClick={handleAddColumn}
                    style={{ padding: '6px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                  >
                    + Add Column
                  </button>
                </div>
              </div>

              {addedTables.length === 0 && (
                <div style={{ marginTop: 20, textAlign: 'center', color: '#7480a8', fontSize: 12 }}>
                  Click a table from the left panel to add it to the query
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
