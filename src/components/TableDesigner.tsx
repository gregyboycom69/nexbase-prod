'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// UUID generator for field IDs
const generateId = () => crypto.randomUUID()

type Field = {
  id: string
  name: string
  type: string
  description: string
  required: boolean
  defaultValue: string
  primaryKey: boolean
  maxLength?: number
  options?: string
}

type Table = {
  id: string
  name: string
  slug: string
  fields: Field[]
}

const DATA_TYPES = [
  'Short Text',
  'Long Text',
  'Number',
  'Currency',
  'Date/Time',
  'Yes/No',
  'Choice',
  'Email',
  'Phone',
  'URL',
  'AutoNumber',
  'Lookup',
]

export default function TableDesigner({ workspaceId }: { workspaceId: string }) {
  const supabase = createClient()

  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showNewTableModal, setShowNewTableModal] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTables()
  }, [workspaceId])

  const loadTables = async () => {
    const { data } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (data) {
      const parsed = data.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        fields: Array.isArray(t.fields) ? t.fields : []
      }))
      setTables(parsed)
      if (parsed.length > 0 && !selectedTable) {
        setSelectedTable(parsed[0])
      }
    }
  }

  const createNewTable = async () => {
    if (!newTableName.trim()) return

    const tableSlug = newTableName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const defaultFields: Field[] = [
      {
        id: generateId(),
        name: 'id',
        type: 'AutoNumber',
        description: 'Primary key',
        required: true,
        defaultValue: '',
        primaryKey: true
      }
    ]

    const { data, error } = await supabase
      .from('workspace_tables')
      .insert({
        workspace_id: workspaceId,
        name: newTableName,
        slug: tableSlug,
        fields: defaultFields
      })
      .select()
      .single()

    if (!error && data) {
      const newTable: Table = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        fields: data.fields || defaultFields
      }
      setTables(prev => [...prev, newTable])
      setSelectedTable(newTable)
      setNewTableName('')
      setShowNewTableModal(false)
    }
  }

  const addField = () => {
    if (!selectedTable) return

    const newField: Field = {
      id: generateId(),
      name: '',
      type: 'Short Text',
      description: '',
      required: false,
      defaultValue: '',
      primaryKey: false
    }

    setSelectedTable({
      ...selectedTable,
      fields: [...selectedTable.fields, newField]
    })
  }

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    if (!selectedTable) return

    setSelectedTable({
      ...selectedTable,
      fields: selectedTable.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      )
    })
  }

  const deleteField = (fieldId: string) => {
    if (!selectedTable) return

    setSelectedTable({
      ...selectedTable,
      fields: selectedTable.fields.filter(f => f.id !== fieldId)
    })
  }

  const saveTable = async () => {
    if (!selectedTable) return

    setSaving(true)
    const { error } = await supabase
      .from('workspace_tables')
      .update({
        name: selectedTable.name,
        fields: selectedTable.fields
      })
      .eq('id', selectedTable.id)

    setSaving(false)

    if (!error) {
      setTables(prev => prev.map(t => t.id === selectedTable.id ? selectedTable : t))
      alert('Table saved successfully!')
    } else {
      alert('Error saving table: ' + error.message)
    }
  }

  const deleteTable = async (tableId: string) => {
    if (!confirm('Delete this table? This cannot be undone.')) return

    const { error } = await supabase.from('workspace_tables').delete().eq('id', tableId)

    if (!error) {
      setTables(prev => prev.filter(t => t.id !== tableId))
      if (selectedTable?.id === tableId) {
        setSelectedTable(tables[0] || null)
      }
    }
  }

  const selectedField = selectedTable?.fields.find(f => f.id === selectedFieldId)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* New Table Modal */}
      {showNewTableModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowNewTableModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e2035', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>Create New Table</div>
            <input
              type="text"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              placeholder="Table name (e.g. Customers)"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', background: '#252840', border: '1px solid #3a3f5c', borderRadius: 8, color: '#e2e8f0', fontSize: 14, marginBottom: 20 }}
              onKeyDown={e => e.key === 'Enter' && createNewTable()}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={createNewTable} disabled={!newTableName.trim()}
                style={{ flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: newTableName.trim() ? 'pointer' : 'not-allowed', opacity: newTableName.trim() ? 1 : 0.5 }}>
                Create
              </button>
              <button onClick={() => setShowNewTableModal(false)}
                style={{ flex: 1, padding: '10px', background: '#252840', color: '#9ca3af', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Table List */}
      <div style={{ width: 240, background: '#1e2035', borderRight: '1px solid #252840', padding: 16, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <button onClick={() => setShowNewTableModal(true)}
          style={{ padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>➕</span>
          New Table
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: '0.05em' }}>TABLES</div>

        {tables.map(table => (
          <div key={table.id}
            onClick={() => setSelectedTable(table)}
            style={{
              padding: '10px 12px',
              background: selectedTable?.id === table.id ? '#4f46e5' : 'transparent',
              color: selectedTable?.id === table.id ? '#fff' : '#9ca3af',
              borderRadius: 8,
              marginBottom: 6,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if (selectedTable?.id !== table.id) e.currentTarget.style.background = '#252840' }}
            onMouseLeave={e => { if (selectedTable?.id !== table.id) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📊</span>
              <span>{table.name}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); deleteTable(table.id) }}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: 4 }}>
              🗑
            </button>
          </div>
        ))}

        {tables.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 12 }}>
            No tables yet
            <br />
            Click New Table to start
          </div>
        )}
      </div>

      {/* Right Panel - Table Designer */}
      {selectedTable ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 24px', background: '#13141f', borderBottom: '1px solid #252840', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{selectedTable.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Table: {selectedTable.slug} • {selectedTable.fields.length} fields</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={addField}
                style={{ padding: '8px 16px', background: '#252840', color: '#e2e8f0', border: '1px solid #3a3f5c', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ➕ Add Field
              </button>
              <button onClick={saveTable} disabled={saving}
                style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : '💾 Save Table'}
              </button>
            </div>
          </div>

          {/* Field Grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <div style={{ background: '#1e2035', borderRadius: 12, overflow: 'hidden', border: '1px solid #252840' }}>
              {/* Header Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 140px 1fr 80px 140px 50px 50px', gap: 1, background: '#252840', padding: '12px 16px', borderBottom: '2px solid #3a3f5c' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>FIELD NAME</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>DATA TYPE</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>DESCRIPTION</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>REQUIRED</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>DEFAULT</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', textAlign: 'center' }}>KEY</div>
                <div></div>
              </div>

              {/* Field Rows */}
              {selectedTable.fields.map(field => (
                <div key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 140px 1fr 80px 140px 50px 50px',
                    gap: 1,
                    background: selectedFieldId === field.id ? '#252840' : '#1e2035',
                    padding: '8px 16px',
                    borderBottom: '1px solid #252840',
                    cursor: 'pointer',
                    alignItems: 'center'
                  }}>
                  <input
                    type="text"
                    value={field.name}
                    onChange={e => updateField(field.id, { name: e.target.value })}
                    placeholder="field_name"
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}
                  />
                  <select
                    value={field.type}
                    onChange={e => updateField(field.id, { type: e.target.value })}
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}>
                    {DATA_TYPES.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={field.description}
                    onChange={e => updateField(field.id, { description: e.target.value })}
                    placeholder="Description"
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => updateField(field.id, { required: e.target.checked })}
                      style={{ accentColor: '#4f46e5', width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={field.defaultValue}
                    onChange={e => updateField(field.id, { defaultValue: e.target.value })}
                    placeholder="default"
                    style={{ background: '#13141f', border: '1px solid #3a3f5c', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13 }}
                  />
                  <div style={{ textAlign: 'center', fontSize: 16 }}>
                    {field.primaryKey ? '🔑' : ''}
                  </div>
                  <button
                    onClick={() => !field.primaryKey && deleteField(field.id)}
                    disabled={field.primaryKey}
                    style={{ background: 'transparent', border: 'none', color: field.primaryKey ? '#6b7280' : '#ef4444', cursor: field.primaryKey ? 'not-allowed' : 'pointer', fontSize: 16 }}>
                    {field.primaryKey ? '🔒' : '🗑'}
                  </button>
                </div>
              ))}

              {/* Add Field Row */}
              <div onClick={addField}
                style={{ display: 'grid', gridTemplateColumns: '180px 140px 1fr 80px 140px 50px 50px', gap: 1, background: '#13141f', padding: '12px 16px', cursor: 'pointer', borderTop: '2px dashed #3a3f5c' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e2035'}
                onMouseLeave={e => e.currentTarget.style.background = '#13141f'}>
                <div style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>Click to add field...</div>
              </div>
            </div>

            {/* Field Properties Panel */}
            {selectedField && (
              <div style={{ marginTop: 24, background: '#1e2035', borderRadius: 12, padding: 20, border: '1px solid #252840' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
                  Field Properties: {selectedField.name || '(unnamed)'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6, fontWeight: 600 }}>FIELD SIZE (max length)</label>
                    <input
                      type="number"
                      value={selectedField.maxLength || ''}
                      onChange={e => updateField(selectedField.id, { maxLength: +e.target.value })}
                      placeholder={selectedField.type === 'Short Text' ? '255' : 'unlimited'}
                      style={{ width: '100%', padding: '8px 12px', background: '#252840', border: '1px solid #3a3f5c', borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}
                    />
                  </div>

                  {selectedField.type === 'Choice' && (
                    <div>
                      <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6, fontWeight: 600 }}>OPTIONS (comma-separated)</label>
                      <input
                        type="text"
                        value={selectedField.options || ''}
                        onChange={e => updateField(selectedField.id, { options: e.target.value })}
                        placeholder="Active,Inactive,Trial"
                        style={{ width: '100%', padding: '8px 12px', background: '#252840', border: '1px solid #3a3f5c', borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16, padding: 12, background: '#252840', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
                  💡 Tip: AutoNumber fields auto-increment. Choice fields show as dropdowns. Lookup fields link to other tables.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No table selected</div>
            <div style={{ fontSize: 13 }}>Select a table from the list or create a new one</div>
          </div>
        </div>
      )}
    </div>
  )
}
