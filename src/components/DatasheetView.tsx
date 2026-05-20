'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Field {
  name: string
  type: string
  caption?: string
  required?: boolean
  refTable?: string
  refDisplay?: string
}

interface DataRow {
  id: string
  data: Record<string, unknown>
  created_at: string
}

interface DatasheetViewProps {
  workspaceId: string
  tableName: string
  fields: Field[]
}

export default function DatasheetView({
  workspaceId,
  tableName,
  fields,
}: DatasheetViewProps) {
  const supabase = createClient()
  const [rows, setRows] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingNewRow, setSavingNewRow] = useState(false)
  const [newRowData, setNewRowData] = useState<Record<string, string>>({})
  const [dbFields, setDbFields] = useState<Field[]>(fields)

  useEffect(() => {
    loadData()
    loadFields()
  }, [tableName, workspaceId])

  const loadData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('app_data')
      .select('id, data, created_at')
      .eq('workspace_id', workspaceId)
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRows(data as DataRow[])
    }
    setLoading(false)
  }

  const loadFields = async () => {
    const { data } = await supabase
      .from('workspace_tables')
      .select('fields')
      .eq('workspace_id', workspaceId)
      .eq('name', tableName)
      .single()
    if (data?.fields) {
      setDbFields(data.fields)
    }
  }

  const startEdit = (rowId: string, field: string, currentValue: unknown) => {
    setEditingCell({ rowId, field })
    setEditValue(String(currentValue || ''))
  }

  const saveCell = async () => {
    console.log('saveCell called:', { editingCell, editValue })

    if (!editingCell) return
    const row = rows.find(r => r.id === editingCell.rowId)
    if (!row) return

    const newData = { ...row.data, [editingCell.field]: editValue }
    console.log('Updating row with:', newData)

    const { error } = await supabase
      .from('app_data')
      .update({ data: newData })
      .eq('id', row.id)

    console.log('Update result:', { error })

    if (!error) {
      setRows(rows.map(r => r.id === row.id ? { ...r, data: newData } : r))
    } else {
      alert('Save failed: ' + error.message)
    }
    setEditingCell(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const deleteRow = async (rowId: string) => {
    if (!confirm('Delete this row?')) return

    console.log('deleteRow called for:', rowId)

    const { error } = await supabase
      .from('app_data')
      .delete()
      .eq('id', rowId)

    console.log('Delete result:', { error })

    if (!error) {
      setRows(rows.filter(r => r.id !== rowId))
    } else {
      alert('Delete failed: ' + error.message)
    }
  }

  const validateNewRow = () => {
    const required = dbFields.filter(f =>
      f.required && f.type !== 'AutoNumber' && f.name !== 'id'
    )
    for (const field of required) {
      if (!newRowData[field.name]) {
        alert(`${field.caption || field.name} is required`)
        return false
      }
    }
    return true
  }

  const saveNewRow = async () => {
    console.log('saveNewRow called with:', newRowData)
    console.log('workspaceId:', workspaceId)
    console.log('tableName:', tableName)

    if (!validateNewRow()) return

    setSavingNewRow(true)
    const { data, error } = await supabase
      .from('app_data')
      .insert({
        workspace_id: workspaceId,
        table_name: tableName,
        data: newRowData,
      })
      .select('id, data, created_at')
      .single()

    console.log('Insert result:', { data, error })

    if (!error && data) {
      setRows([data as DataRow, ...rows])
      setNewRowData({})
    } else if (error) {
      alert('Save failed: ' + error.message)
    }
    setSavingNewRow(false)
  }

  // Filter out auto-generated fields (like AutoNumber id)
  const editableFields = dbFields.filter(
    f => f.type !== 'AutoNumber' && f.name !== 'id'
  )

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Loading data...
      </div>
    )
  }

  return (
    <div style={{ padding: 24, background: '#ffffff' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>{tableName}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
            {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </p>
        </div>
        <button
          onClick={() => { loadData(); loadFields(); }}
          style={{
            background: '#f1f5f9',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 280px)',
      }}>
        <table style={{
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
        }}>
          <thead style={{
            background: '#f8fafc',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}>
            <tr>
              {editableFields.map(field => (
                <th key={field.name} style={{
                  padding: 12,
                  textAlign: 'left',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#374151',
                  fontWeight: 600,
                }}>
                  {field.caption || field.name}
                  {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                </th>
              ))}
              <th style={{
                padding: 12,
                width: 60,
                borderBottom: '1px solid #e2e8f0',
              }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                style={{ borderBottom: '1px solid #f1f5f9' }}
              >
                {editableFields.map(field => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.field === field.name
                  const cellValue = row.data?.[field.name] as string | undefined
                  return (
                    <td
                      key={field.name}
                      onClick={() => !isEditing && startEdit(row.id, field.name, cellValue)}
                      style={{
                        padding: isEditing ? 0 : 12,
                        cursor: isEditing ? 'default' : 'text',
                        color: '#1e293b',
                      }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          type={field.type === 'Date/Time' ? 'date' : field.type === 'Number' ? 'number' : 'text'}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveCell}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveCell()
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          style={{
                            width: '100%',
                            padding: 12,
                            border: '2px solid #4f46e5',
                            outline: 'none',
                            background: '#ffffff',
                            color: '#1e293b',
                            fontSize: 14,
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        <span>
                          {cellValue || <span style={{ color: '#cbd5e1' }}>empty</span>}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td style={{ padding: 8, textAlign: 'center' }}>
                  <button
                    onClick={() => deleteRow(row.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 16,
                    }}
                    title="Delete row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr style={{ background: '#f8fafc' }}>
              {editableFields.map(field => (
                <td key={field.name} style={{ padding: 8 }}>
                  <input
                    type={field.type === 'Date/Time' ? 'date' : field.type === 'Number' ? 'number' : 'text'}
                    placeholder={`+ Add ${field.caption || field.name}`}
                    value={newRowData[field.name] || ''}
                    onChange={e => setNewRowData({ ...newRowData, [field.name]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      background: '#ffffff',
                      color: '#1e293b',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </td>
              ))}
              <td style={{ padding: 8, textAlign: 'center' }}>
                <button
                  onClick={saveNewRow}
                  disabled={savingNewRow || Object.keys(newRowData).length === 0}
                  style={{
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    opacity: savingNewRow || Object.keys(newRowData).length === 0 ? 0.5 : 1,
                  }}
                  title="Add row"
                >
                  {savingNewRow ? '...' : '+'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#64748b',
          background: '#f8fafc',
          borderRadius: 8,
          marginTop: 16,
        }}>
          No data yet. Add your first row using the inputs above.
        </div>
      )}
    </div>
  )
}
