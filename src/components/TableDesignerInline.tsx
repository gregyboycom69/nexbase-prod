'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { theme } from '@/lib/theme'

const generateId = () => crypto.randomUUID()

type Field = {
  id: string
  name: string
  type: string
  description: string
  required: boolean
  defaultValue: string
  isPrimaryKey: boolean
  maxLength?: number
  options?: string
  refTable?: string
  refDisplay?: string
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
  'Ref',
]

export default function TableDesignerInline({
  workspaceId,
  tableId,
  tableName
}: {
  workspaceId: string
  tableId: string
  tableName: string
}) {
  const supabase = createClient()

  const [fields, setFields] = useState<Field[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTable()
  }, [tableId])

  const loadTable = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('id', tableId)
      .single()

    if (data) {
      const loadedFields = Array.isArray(data.fields) && data.fields.length > 0
        ? data.fields
        : [
            {
              id: generateId(),
              name: 'id',
              type: 'AutoNumber',
              description: 'Primary Key',
              required: true,
              defaultValue: '',
              isPrimaryKey: true,
            },
          ]
      setFields(loadedFields)
      if (loadedFields.length > 0) {
        setSelectedFieldId(loadedFields[0].id)
      }
    }
    setLoading(false)
  }

  const addField = () => {
    const newField: Field = {
      id: generateId(),
      name: '',
      type: 'Short Text',
      description: '',
      required: false,
      defaultValue: '',
      isPrimaryKey: false,
    }
    setFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id)
  }

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }

  const deleteField = (fieldId: string) => {
    if (!confirm('Delete this field?')) return
    setFields(prev => prev.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(fields[0]?.id || null)
    }
  }

  const saveTable = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('workspace_tables')
      .update({ fields: fields })
      .eq('id', tableId)

    setSaving(false)

    if (!error) {
      alert('✓ Table saved successfully!')
    } else {
      alert('Error saving table: ' + error.message)
    }
  }

  const selectedField = fields.find(f => f.id === selectedFieldId)

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg.page }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 14, color: theme.text.muted }}>Loading table...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: theme.bg.page }}>
      {/* Toolbar */}
      <div style={{
        padding: '16px 24px',
        background: theme.bg.card,
        borderBottom: `1px solid ${theme.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: theme.text.primary, marginBottom: 4 }}>
            {tableName}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>
            Table Designer • {fields.length} fields
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={addField}
            style={{
              padding: '8px 16px',
              background: theme.bg.panel,
              color: theme.text.primary,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.md,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ➕ Add Field
          </button>
          <button
            onClick={saveTable}
            disabled={saving}
            style={{
              padding: '8px 20px',
              background: theme.brand.primary,
              color: theme.brand.primaryText,
              border: 'none',
              borderRadius: theme.radius.md,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : '💾 Save Table'}
          </button>
        </div>
      </div>

      {/* Field Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{
          background: theme.bg.card,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          border: `1px solid ${theme.border.default}`,
          boxShadow: theme.shadow.sm
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 150px 1fr 80px 140px 50px 50px',
            gap: 1,
            background: theme.bg.panel,
            padding: '12px 16px',
            borderBottom: `2px solid ${theme.border.strong}`
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.text.secondary, letterSpacing: '0.05em' }}>
              FIELD NAME
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.text.secondary, letterSpacing: '0.05em' }}>
              DATA TYPE
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.text.secondary, letterSpacing: '0.05em' }}>
              DESCRIPTION
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.text.secondary, letterSpacing: '0.05em' }}>
              REQUIRED
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.text.secondary, letterSpacing: '0.05em' }}>
              DEFAULT
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.text.secondary, letterSpacing: '0.05em', textAlign: 'center' }}>
              KEY
            </div>
            <div></div>
          </div>

          {/* Field Rows */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              onClick={() => setSelectedFieldId(field.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 150px 1fr 80px 140px 50px 50px',
                gap: 1,
                background: selectedFieldId === field.id ? theme.bg.hover : (index % 2 === 0 ? theme.bg.card : theme.bg.page),
                padding: '8px 16px',
                borderBottom: `1px solid ${theme.border.light}`,
                cursor: 'pointer',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                defaultValue={field.name}
                onBlur={e => {
                  if (e.target.value !== field.name) {
                    updateField(field.id, { name: e.target.value })
                  }
                }}
                disabled={field.isPrimaryKey}
                placeholder="field_name"
                key={`name-${field.id}-${field.name}`}
                style={{
                  background: field.isPrimaryKey ? theme.bg.panel : theme.bg.card,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  padding: '6px 10px',
                  color: field.isPrimaryKey ? theme.text.muted : theme.text.primary,
                  fontSize: 13
                }}
              />
              <select
                value={field.type}
                onChange={e => updateField(field.id, { type: e.target.value })}
                style={{
                  background: theme.bg.card,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  padding: '6px 10px',
                  color: theme.text.primary,
                  fontSize: 13
                }}
              >
                {DATA_TYPES.map(dt => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
              <input
                type="text"
                defaultValue={field.description}
                onBlur={e => {
                  if (e.target.value !== field.description) {
                    updateField(field.id, { description: e.target.value })
                  }
                }}
                placeholder="Description"
                key={`desc-${field.id}-${field.description}`}
                style={{
                  background: theme.bg.card,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  padding: '6px 10px',
                  color: theme.text.primary,
                  fontSize: 13
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e => updateField(field.id, { required: e.target.checked })}
                  style={{ accentColor: theme.brand.primary, width: 16, height: 16, cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                defaultValue={field.defaultValue}
                onBlur={e => {
                  if (e.target.value !== field.defaultValue) {
                    updateField(field.id, { defaultValue: e.target.value })
                  }
                }}
                placeholder="default"
                key={`default-${field.id}-${field.defaultValue}`}
                style={{
                  background: theme.bg.card,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  padding: '6px 10px',
                  color: theme.text.primary,
                  fontSize: 13
                }}
              />
              <div style={{ textAlign: 'center', fontSize: 16 }}>
                {field.isPrimaryKey ? '🔑' : ''}
              </div>
              <button
                onClick={() => !field.isPrimaryKey && deleteField(field.id)}
                disabled={field.isPrimaryKey}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: field.isPrimaryKey ? theme.text.disabled : theme.status.danger,
                  cursor: field.isPrimaryKey ? 'not-allowed' : 'pointer',
                  fontSize: 16
                }}
              >
                {field.isPrimaryKey ? '🔒' : '🗑'}
              </button>
            </div>
          ))}

          {/* Add Field Row */}
          <div
            onClick={addField}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 150px 1fr 80px 140px 50px 50px',
              gap: 1,
              background: theme.bg.panel,
              padding: '12px 16px',
              cursor: 'pointer',
              borderTop: `2px dashed ${theme.border.default}`
            }}
            onMouseEnter={e => e.currentTarget.style.background = theme.bg.hover}
            onMouseLeave={e => e.currentTarget.style.background = theme.bg.panel}
          >
            <div style={{ color: theme.text.muted, fontSize: 13, fontStyle: 'italic' }}>
              Click to add field...
            </div>
          </div>
        </div>

        {/* Field Properties Panel */}
        {selectedField && (
          <div style={{
            marginTop: 24,
            background: theme.bg.card,
            borderRadius: theme.radius.lg,
            padding: 20,
            border: `1px solid ${theme.border.default}`,
            boxShadow: theme.shadow.sm
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text.primary, marginBottom: 16 }}>
              Field Properties: {selectedField.name || '(unnamed)'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: theme.text.secondary, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  FIELD SIZE (max length)
                </label>
                <input
                  type="number"
                  value={selectedField.maxLength || ''}
                  onChange={e => updateField(selectedField.id, { maxLength: +e.target.value })}
                  placeholder={selectedField.type === 'Short Text' ? '255' : 'unlimited'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: theme.bg.card,
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.md,
                    color: theme.text.primary,
                    fontSize: 13
                  }}
                />
              </div>

              {selectedField.type === 'Choice' && (
                <div>
                  <label style={{ fontSize: 11, color: theme.text.secondary, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    OPTIONS (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={selectedField.options || ''}
                    onChange={e => updateField(selectedField.id, { options: e.target.value })}
                    placeholder="Active,Inactive,Trial"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: theme.bg.card,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.md,
                      color: theme.text.primary,
                      fontSize: 13
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{
              marginTop: 16,
              padding: 12,
              background: theme.status.infoLight,
              borderRadius: theme.radius.md,
              fontSize: 12,
              color: theme.status.info,
              border: `1px solid ${theme.status.info}33`
            }}>
              💡 Tip: AutoNumber fields auto-increment. Choice fields show as dropdowns. Lookup fields link to other tables.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
