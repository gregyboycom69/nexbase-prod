'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  isPrimaryKey: boolean
  caption?: string
  validationRule?: string
  validationText?: string
  size?: string | number
  format?: string
  decimalPlaces?: string
  allowZeroLength?: boolean
  indexed?: string
  options?: string
  relatedTable?: string
  relatedField?: string
  displayField?: string
  allowOtherValues?: boolean
  displayControl?: string
  rowSourceType?: string
  rowSource?: string
  boundColumn?: number
  columnCount?: number
  limitToList?: boolean
}

const DATA_TYPES = [
  'Short Text',
  'Long Text',
  'Number',
  'Currency',
  'AutoNumber',
  'Date/Time',
  'Yes/No',
  'Email',
  'Phone',
  'URL',
  'Choice',
  'Lookup',
]

export default function TableDesignerPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()

  const [workspace, setWorkspace] = useState<any>(null)
  const [tables, setTables] = useState<any[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [tableName, setTableName] = useState('')
  const [view, setView] = useState<'design' | 'datasheet'>('design')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tableId: string } | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [datasheetData, setDatasheetData] = useState<any[]>([])
  const [activePropertyTab, setActivePropertyTab] = useState<'general' | 'lookup'>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingTable, setIsLoadingTable] = useState(false) // FIX 19.2: Add loading state

  useEffect(() => {
    loadWorkspace()
  }, [slug])

  useEffect(() => {
    if (selectedTableId) {
      loadTable(selectedTableId)
    }
  }, [selectedTableId])

  useEffect(() => {
    if (view === 'datasheet' && selectedTable) {
      loadDatasheetData()
    }
  }, [view, selectedTable])

  async function loadWorkspace() {
    console.log('📂 Loading workspace...', slug)
    const { data: ws, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !ws) {
      console.error('❌ Workspace load error:', error)
      router.push('/dashboard')
      return
    }

    console.log('✅ Workspace loaded:', ws.id)
    setWorkspace(ws)
    await loadTables(ws.id)
  }

  async function loadTables(workspaceId: string) {
    console.log('📋 Loading tables for workspace:', workspaceId)
    const { data, error } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')

    if (error) {
      console.error('❌ Tables load error:', error)
      return
    }

    console.log(`✅ Loaded ${data?.length || 0} tables`)
    setTables(data || [])
  }

  // FIX 19.2: Added loading state to prevent blank screen race condition
  async function loadTable(tableId: string) {
    console.log('📊 Loading table:', tableId)
    setIsLoadingTable(true)

    const table = tables.find((t) => t.id === tableId)
    if (!table) {
      console.warn('⚠️ Table not found:', tableId)
      setIsLoadingTable(false)
      return
    }

    setSelectedTable(table)
    setTableName(table.name)

    const loadedFields = Array.isArray(table.fields) && table.fields.length > 0
      ? table.fields
      : [
          {
            id: 'field-0',
            name: 'id',
            type: 'AutoNumber',
            description: 'Primary Key',
            required: true,
            defaultValue: '',
            isPrimaryKey: true,
          },
        ]

    console.log('✅ Loaded fields:', loadedFields.length)
    setFields(loadedFields)
    if (loadedFields.length > 0) {
      setSelectedFieldId(loadedFields[0].id)
    }

    setIsLoadingTable(false)
  }

  async function loadDatasheetData() {
    if (!workspace || !selectedTable) return

    const { data } = await supabase
      .from('app_data')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('table_name', selectedTable.slug)
      .order('created_at')

    setDatasheetData(data?.map((d) => d.data) || [])
  }

  async function handleSaveTable() {
    console.log('💾 Saving table...')

    if (!workspace) {
      console.error('❌ Workspace not loaded')
      alert('Error: Workspace not loaded. Please refresh the page.')
      return
    }

    if (!selectedTable) {
      console.error('❌ No table selected')
      alert('Error: No table selected')
      return
    }

    if (!tableName.trim()) {
      alert('Error: Table name cannot be empty')
      return
    }

    setIsSaving(true)

    const tableSlug = tableName.toLowerCase().replace(/\s+/g, '_')
    console.log('📝 Table data:', {
      id: selectedTable.id,
      name: tableName,
      slug: tableSlug,
      fieldsCount: fields.length,
    })

    // UPSERT table (insert if doesn't exist, update if it does)
    const { data, error } = await supabase
      .from('workspace_tables')
      .upsert(
        {
          id: selectedTable.id,
          workspace_id: workspace.id,
          name: tableName,
          slug: tableSlug,
          fields: fields,
        },
        {
          onConflict: 'id',
        }
      )
      .select()

    setIsSaving(false)

    if (error) {
      console.error('❌ Save error:', error)
      alert('Error saving table: ' + error.message)
      return
    }

    console.log('✅ Table saved successfully')
    alert('✓ Table saved successfully!')
    await loadTables(workspace.id)
  }

  async function handleCreateNewTable() {
    console.log('🆕 Creating new table...')
    console.log('Workspace:', workspace)
    console.log('New table name:', newTableName)

    if (!workspace) {
      console.error('❌ Workspace not loaded')
      alert('Error: Workspace not loaded. Please refresh the page.')
      return
    }

    if (!newTableName.trim()) {
      console.log('❌ Table name is empty')
      setIsCreatingNew(false)
      return
    }

    const slug = newTableName.toLowerCase().replace(/\s+/g, '_')
    console.log('Generated slug:', slug)

    const defaultFields = [
      {
        id: 'field-0',
        name: 'id',
        type: 'AutoNumber',
        description: 'Primary Key',
        required: true,
        defaultValue: '',
        isPrimaryKey: true,
      },
    ]

    console.log('📤 Inserting into workspace_tables...')
    const { data, error } = await supabase
      .from('workspace_tables')
      .insert({
        workspace_id: workspace.id,
        name: newTableName,
        slug,
        fields: defaultFields,
      })
      .select()
      .single()

    console.log('📥 Insert response:', { data, error })

    if (error) {
      console.error('❌ Insert error:', error)
      alert('Error creating table: ' + error.message)
      return
    }

    if (data) {
      console.log('✅ Table created successfully:', data.id)
      await loadTables(workspace.id)
      setSelectedTableId(data.id)
      setIsCreatingNew(false)
      setNewTableName('')
    } else {
      console.error('⚠️ No data returned from insert')
      alert('Error: Table creation returned no data')
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm('Delete this table? This cannot be undone.')) return

    console.log('🗑️ Deleting table:', tableId)
    const { error } = await supabase.from('workspace_tables').delete().eq('id', tableId)

    if (error) {
      console.error('❌ Delete error:', error)
      alert('Error deleting table: ' + error.message)
      return
    }

    console.log('✅ Table deleted')
    await loadTables(workspace?.id)

    if (selectedTableId === tableId) {
      setSelectedTableId(null)
      setSelectedTable(null)
      setFields([])
    }
  }

  async function handleRenameTable(tableId: string, currentName: string) {
    const newName = prompt('Enter new table name:', currentName)
    if (!newName || !newName.trim() || newName === currentName) return

    console.log('✏️ Renaming table:', tableId, 'to:', newName)
    const { error } = await supabase
      .from('workspace_tables')
      .update({
        name: newName,
        slug: newName.toLowerCase().replace(/\s+/g, '_'),
      })
      .eq('id', tableId)

    if (error) {
      console.error('❌ Rename error:', error)
      alert('Error renaming table: ' + error.message)
      return
    }

    console.log('✅ Table renamed')
    await loadTables(workspace.id)
  }

  function handleAddField() {
    const newField: Field = {
      id: generateId(),
      name: '',
      type: 'Short Text',
      description: '',
      required: false,
      defaultValue: '',
      isPrimaryKey: false,
    }
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  function handleUpdateField(fieldId: string, updates: Partial<Field>) {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
  }

  function handleDeleteField(fieldId: string) {
    const field = fields.find((f) => f.id === fieldId)
    if (field?.isPrimaryKey) {
      alert('Cannot delete primary key field')
      return
    }
    if (!confirm('Delete this field?')) return
    setFields(fields.filter((f) => f.id !== fieldId))
  }

  function handleContextMenu(e: React.MouseEvent, tableId: string) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tableId })
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#13141f',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#c8d0f0',
      }}
      onClick={() => setContextMenu(null)}
    >
      {/* Left Panel - Table List */}
      <div
        style={{
          width: 220,
          background: '#1e2035',
          borderRight: '1px solid #252840',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #252840',
            fontSize: 13,
            fontWeight: 700,
            color: '#c8d0f0',
          }}
        >
          Tables
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              onContextMenu={(e) => handleContextMenu(e, table.id)}
              style={{
                padding: '10px 16px',
                fontSize: 12,
                cursor: 'pointer',
                background: selectedTableId === table.id ? '#1e2844' : 'transparent',
                borderLeft: selectedTableId === table.id ? '3px solid #6366f1' : '3px solid transparent',
                color: selectedTableId === table.id ? '#fff' : '#c8d0f0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (selectedTableId !== table.id) e.currentTarget.style.background = '#1a1d2e'
              }}
              onMouseLeave={(e) => {
                if (selectedTableId !== table.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>📊</span>
              <span>{table.name}</span>
            </div>
          ))}

          {isCreatingNew && (
            <div style={{ padding: '10px 16px' }}>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNewTable()
                  if (e.key === 'Escape') {
                    setIsCreatingNew(false)
                    setNewTableName('')
                  }
                }}
                onBlur={() => {
                  if (newTableName.trim()) {
                    handleCreateNewTable()
                  } else {
                    setIsCreatingNew(false)
                  }
                }}
                autoFocus
                placeholder="Table name..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: '#0f1117',
                  border: '1px solid #6366f1',
                  borderRadius: 4,
                  color: '#c8d0f0',
                  fontSize: 12,
                }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #252840' }}>
          <button
            onClick={() => {
              setIsCreatingNew(true)
              setNewTableName('')
            }}
            disabled={isCreatingNew}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: isCreatingNew ? '#4f46e5' : '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: isCreatingNew ? 'not-allowed' : 'pointer',
              opacity: isCreatingNew ? 0.6 : 1,
            }}
          >
            + New Table
          </button>
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #252840' }}>
          <button
            onClick={() => router.push(`/studio/${slug}`)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#252840',
              color: '#c8d0f0',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            ← Back to Studio
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selectedTable ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 48, opacity: 0.3 }}>📊</div>
            <div style={{ fontSize: 18, color: '#7480a8' }}>Select a table or create a new one</div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div
              style={{
                background: '#1e2035',
                borderBottom: '1px solid #252840',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 48,
              }}
            >
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: '#0f1117',
                  border: '1px solid #252840',
                  color: '#c8d0f0',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              />
              <button
                onClick={handleSaveTable}
                disabled={isSaving}
                style={{
                  padding: '6px 16px',
                  background: isSaving ? '#059669' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? '💾 Saving...' : '💾 Save Table'}
              </button>
              <button
                onClick={() => setView('design')}
                style={{
                  padding: '6px 16px',
                  background: view === 'design' ? '#6366f1' : '#252840',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Design View
              </button>
              <button
                onClick={() => setView('datasheet')}
                style={{
                  padding: '6px 16px',
                  background: view === 'datasheet' ? '#6366f1' : '#252840',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Datasheet View
              </button>
            </div>

            {view === 'design' ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* FIX 19.2: Show loading state */}
                {isLoadingTable ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                      <div style={{ fontSize: 14, color: '#8890b8' }}>Loading table fields...</div>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Field Grid */}
                <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                  <div
                    style={{
                      background: '#1a1d2e',
                      border: '1px solid #252840',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '30px 200px 160px 1fr',
                        background: '#252840',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#8890b8',
                        borderBottom: '2px solid #1a1d2e',
                      }}
                    >
                      <div style={{ padding: '8px 6px', textAlign: 'center' }}>🔑</div>
                      <div style={{ padding: '8px 12px' }}>Field Name</div>
                      <div style={{ padding: '8px 12px' }}>Data Type</div>
                      <div style={{ padding: '8px 12px' }}>Description</div>
                    </div>

                    {/* Rows */}
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' && !field.isPrimaryKey) {
                            handleDeleteField(field.id)
                          }
                        }}
                        tabIndex={0}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '30px 200px 160px 1fr',
                          background: index % 2 === 0 ? '#1e2035' : '#1a1d2e',
                          borderBottom: '1px solid #252840',
                          borderLeft: selectedFieldId === field.id ? '3px solid #6366f1' : '3px solid transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ padding: '6px', textAlign: 'center', fontSize: 14 }}>
                          {field.isPrimaryKey ? '🔑' : ''}
                        </div>
                        <div style={{ padding: '6px 12px' }}>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                            disabled={field.isPrimaryKey}
                            style={{
                              width: '100%',
                              background: field.isPrimaryKey ? '#252840' : 'transparent',
                              border: 'none',
                              color: field.isPrimaryKey ? '#7480a8' : '#c8d0f0',
                              fontSize: 12,
                              padding: 0,
                              outline: 'none',
                            }}
                            onFocus={(e) => {
                              if (!field.isPrimaryKey) e.target.style.background = '#0f1117'
                            }}
                            onBlur={(e) => {
                              e.target.style.background = 'transparent'
                            }}
                          />
                        </div>
                        <div style={{ padding: '6px 12px' }}>
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(field.id, { type: e.target.value })}
                            disabled={field.isPrimaryKey}
                            style={{
                              width: '100%',
                              background: field.isPrimaryKey ? '#252840' : '#1e2035',
                              border: 'none',
                              color: field.isPrimaryKey ? '#7480a8' : '#c8d0f0',
                              fontSize: 12,
                              padding: 0,
                              cursor: field.isPrimaryKey ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {DATA_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ padding: '6px 12px' }}>
                          <input
                            type="text"
                            value={field.description}
                            onChange={(e) => handleUpdateField(field.id, { description: e.target.value })}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              color: '#c8d0f0',
                              fontSize: 12,
                              padding: 0,
                              outline: 'none',
                            }}
                            onFocus={(e) => (e.target.style.background = '#0f1117')}
                            onBlur={(e) => (e.target.style.background = 'transparent')}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add Field Row */}
                    <div
                      onClick={handleAddField}
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: '#7480a8',
                        cursor: 'pointer',
                        borderTop: '2px dashed #252840',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#1e2035')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      + Add Field
                    </div>
                  </div>
                </div>

                {/* Field Properties */}
                <div
                  style={{
                    height: 280,
                    borderTop: '2px solid #252840',
                    background: '#1a1d2e',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      background: '#252840',
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#8890b8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Field Properties</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => setActivePropertyTab('general')}
                        style={{
                          padding: '4px 14px',
                          background: activePropertyTab === 'general' ? '#6366f1' : '#252840',
                          color: activePropertyTab === 'general' ? '#fff' : '#7480a8',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        General
                      </button>
                      <button
                        onClick={() => setActivePropertyTab('lookup')}
                        style={{
                          padding: '4px 14px',
                          background: activePropertyTab === 'lookup' ? '#6366f1' : '#252840',
                          color: activePropertyTab === 'lookup' ? '#fff' : '#7480a8',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Lookup
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                    {selectedField ? (
                      activePropertyTab === 'general' ? (
                        <>
                          <PropertyRow
                            label="Caption"
                            value={selectedField.caption || ''}
                            onChange={(v) => handleUpdateField(selectedField.id, { caption: v })}
                          />
                          <PropertyRow
                            label="Description"
                            value={selectedField.description || ''}
                            onChange={(v) => handleUpdateField(selectedField.id, { description: v })}
                          />
                          <PropertyRow
                            label="Required"
                            value={selectedField.required ? 'Yes' : 'No'}
                            onChange={(v) => handleUpdateField(selectedField.id, { required: v === 'Yes' })}
                            type="yesno"
                          />
                          <PropertyRow
                            label="Default Value"
                            value={selectedField.defaultValue || ''}
                            onChange={(v) => handleUpdateField(selectedField.id, { defaultValue: v })}
                          />
                          <PropertyRow
                            label="Validation Rule"
                            value={selectedField.validationRule || ''}
                            onChange={(v) => handleUpdateField(selectedField.id, { validationRule: v })}
                          />
                          <PropertyRow
                            label="Validation Text"
                            value={selectedField.validationText || ''}
                            onChange={(v) => handleUpdateField(selectedField.id, { validationText: v })}
                          />

                          {selectedField.type === 'Short Text' && (
                            <>
                              <PropertyRow
                                label="Field Size"
                                value={String(selectedField.size || 255)}
                                onChange={(v) => handleUpdateField(selectedField.id, { size: v })}
                                type="number"
                              />
                              <PropertyRow
                                label="Allow Zero Length"
                                value={selectedField.allowZeroLength ? 'Yes' : 'No'}
                                onChange={(v) =>
                                  handleUpdateField(selectedField.id, { allowZeroLength: v === 'Yes' })
                                }
                                type="yesno"
                              />
                              <PropertyRow
                                label="Indexed"
                                value={selectedField.indexed || 'No'}
                                onChange={(v) => handleUpdateField(selectedField.id, { indexed: v })}
                                type="select"
                                options={['No', 'Yes (Duplicates OK)', 'Yes (No Duplicates)']}
                              />
                            </>
                          )}

                          {selectedField.type === 'Number' && (
                            <>
                              <PropertyRow
                                label="Field Size"
                                value={String(selectedField.size || 'Long Integer')}
                                onChange={(v) => handleUpdateField(selectedField.id, { size: v })}
                                type="select"
                                options={['Integer', 'Long Integer', 'Double']}
                              />
                              <PropertyRow
                                label="Decimal Places"
                                value={selectedField.decimalPlaces || 'Auto'}
                                onChange={(v) => handleUpdateField(selectedField.id, { decimalPlaces: v })}
                                type="select"
                                options={['Auto', '0', '1', '2', '3', '4']}
                              />
                              <PropertyRow
                                label="Format"
                                value={selectedField.format || 'General'}
                                onChange={(v) => handleUpdateField(selectedField.id, { format: v })}
                                type="select"
                                options={['General', 'Fixed', 'Standard', 'Currency', 'Percent']}
                              />
                            </>
                          )}

                          {selectedField.type === 'Currency' && (
                            <>
                              <PropertyRow
                                label="Decimal Places"
                                value={selectedField.decimalPlaces || 'Auto'}
                                onChange={(v) => handleUpdateField(selectedField.id, { decimalPlaces: v })}
                                type="select"
                                options={['Auto', '0', '1', '2']}
                              />
                              <PropertyRow
                                label="Format"
                                value={selectedField.format || 'Currency'}
                                onChange={(v) => handleUpdateField(selectedField.id, { format: v })}
                                type="select"
                                options={['Currency', 'Fixed', 'Standard', 'Percent']}
                              />
                            </>
                          )}

                          {selectedField.type === 'Date/Time' && (
                            <PropertyRow
                              label="Format"
                              value={selectedField.format || 'Short Date'}
                              onChange={(v) => handleUpdateField(selectedField.id, { format: v })}
                              type="select"
                              options={['Short Date', 'Long Date', 'Medium Date', 'Short Time', 'Long Time']}
                            />
                          )}

                          {selectedField.type === 'Choice' && (
                            <>
                              <PropertyRow
                                label="Options"
                                value={selectedField.options || ''}
                                onChange={(v) => handleUpdateField(selectedField.id, { options: v })}
                              />
                              <PropertyRow
                                label="Allow Other Values"
                                value={selectedField.allowOtherValues ? 'Yes' : 'No'}
                                onChange={(v) =>
                                  handleUpdateField(selectedField.id, { allowOtherValues: v === 'Yes' })
                                }
                                type="yesno"
                              />
                            </>
                          )}

                          {selectedField.type === 'Lookup' && (
                            <>
                              <PropertyRow
                                label="Related Table"
                                value={selectedField.relatedTable || ''}
                                onChange={(v) => handleUpdateField(selectedField.id, { relatedTable: v })}
                                type="select"
                                options={tables.map((t: any) => t.name)}
                              />
                              <PropertyRow
                                label="Related Field"
                                value={selectedField.relatedField || ''}
                                onChange={(v) => handleUpdateField(selectedField.id, { relatedField: v })}
                              />
                              <PropertyRow
                                label="Display Field"
                                value={selectedField.displayField || ''}
                                onChange={(v) => handleUpdateField(selectedField.id, { displayField: v })}
                              />
                            </>
                          )}
                        </>
                      ) : (
                        // Lookup Tab
                        <>
                          <PropertyRow
                            label="Display Control"
                            value={selectedField.displayControl || 'Text Box'}
                            onChange={(v) => handleUpdateField(selectedField.id, { displayControl: v })}
                            type="select"
                            options={['Text Box', 'Combo Box', 'List Box']}
                          />
                          <PropertyRow
                            label="Row Source Type"
                            value={selectedField.rowSourceType || 'Table/Query'}
                            onChange={(v) => handleUpdateField(selectedField.id, { rowSourceType: v })}
                            type="select"
                            options={['Table/Query', 'Value List']}
                          />
                          <PropertyRow
                            label="Row Source"
                            value={selectedField.rowSource || ''}
                            onChange={(v) => handleUpdateField(selectedField.id, { rowSource: v })}
                          />
                          <PropertyRow
                            label="Bound Column"
                            value={String(selectedField.boundColumn || 1)}
                            onChange={(v) => handleUpdateField(selectedField.id, { boundColumn: Number(v) })}
                            type="number"
                          />
                          <PropertyRow
                            label="Column Count"
                            value={String(selectedField.columnCount || 1)}
                            onChange={(v) => handleUpdateField(selectedField.id, { columnCount: Number(v) })}
                            type="number"
                          />
                          <PropertyRow
                            label="Limit To List"
                            value={selectedField.limitToList ? 'Yes' : 'No'}
                            onChange={(v) => handleUpdateField(selectedField.id, { limitToList: v === 'Yes' })}
                            type="yesno"
                          />
                        </>
                      )
                    ) : (
                      <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#7480a8' }}>
                        Select a field to view properties
                      </div>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>
            ) : (
              // Datasheet View
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                <div
                  style={{
                    background: '#1a1d2e',
                    border: '1px solid #252840',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#252840' }}>
                        {fields.map((field, i) => (
                          <th
                            key={i}
                            style={{
                              padding: '8px 12px',
                              textAlign: 'left',
                              borderRight: '1px solid #1a1d2e',
                              color: '#c8d0f0',
                              fontWeight: 600,
                            }}
                          >
                            {field.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasheetData.map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            background: i % 2 === 0 ? '#1a1d2e' : '#1e2139',
                            borderBottom: '1px solid #252840',
                          }}
                        >
                          {fields.map((field, j) => (
                            <td
                              key={j}
                              style={{
                                padding: '6px 12px',
                                borderRight: '1px solid #252840',
                                color: '#8890b8',
                              }}
                            >
                              {row[field.name] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr style={{ background: '#1e2035' }}>
                        <td
                          colSpan={fields.length}
                          style={{
                            padding: '6px 12px',
                            color: '#7480a8',
                            fontStyle: 'italic',
                            textAlign: 'center',
                          }}
                        >
                          {datasheetData.length === 0 ? 'No records yet' : '* New Record'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#252840',
            border: '1px solid #3a3f5c',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            minWidth: 150,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              const table = tables.find((t) => t.id === contextMenu.tableId)
              if (table) {
                handleRenameTable(table.id, table.name)
              }
              setContextMenu(null)
            }}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: '#c8d0f0',
              cursor: 'pointer',
              borderBottom: '1px solid #1a1d2e',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1d2e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Rename
          </div>
          <div
            onClick={() => {
              handleDeleteTable(contextMenu.tableId)
              setContextMenu(null)
            }}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: '#ef4444',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1d2e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Delete
          </div>
        </div>
      )}
    </div>
  )
}

// Property Row Component
function PropertyRow({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'yesno' | 'select'
  options?: string[]
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        borderBottom: '1px solid #252840',
        padding: '4px 10px',
        height: 26,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 11, color: '#8890b8', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
      {type === 'yesno' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: '#0f1117',
            color: '#c8d0f0',
            border: 'none',
            fontSize: 11,
            padding: '2px 4px',
          }}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: '#0f1117',
            color: '#c8d0f0',
            border: 'none',
            fontSize: 11,
            padding: '2px 4px',
          }}
        >
          <option value="">(none)</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: '#0f1117',
            color: '#c8d0f0',
            border: 'none',
            fontSize: 11,
            padding: '2px 4px',
            outline: 'none',
          }}
        />
      )}
    </div>
  )
}
