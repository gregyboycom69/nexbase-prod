'use client'

import { useState } from 'react'

type FieldListProps = {
  isOpen: boolean
  onClose: () => void
  recordSource: string | null
  tables: any[]
  onAddField: (fieldName: string, fieldType: string) => void
}

export default function FieldList({
  isOpen,
  onClose,
  recordSource,
  tables,
  onAddField,
}: FieldListProps) {
  const [draggedField, setDraggedField] = useState<string | null>(null)

  if (!isOpen) return null

  const table = recordSource ? tables.find(t => t.name === recordSource) : null
  const fields = table?.fields || []

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'Short Text':
      case 'Long Text':
        return '📝'
      case 'Number':
      case 'Currency':
        return '🔢'
      case 'Date/Time':
        return '📅'
      case 'Yes/No':
        return '☑'
      case 'Choice':
        return '▾'
      case 'Email':
        return '📧'
      case 'Phone':
        return '📞'
      case 'URL':
        return '🔗'
      default:
        return '📄'
    }
  }

  const handleDragStart = (e: React.DragEvent, fieldName: string, fieldType: string) => {
    e.dataTransfer.setData('fieldName', fieldName)
    e.dataTransfer.setData('fieldType', fieldType)
    e.dataTransfer.effectAllowed = 'copy'
    setDraggedField(fieldName)
  }

  const handleDragEnd = () => {
    setDraggedField(null)
  }

  const handleDoubleClick = (fieldName: string, fieldType: string) => {
    onAddField(fieldName, fieldType)
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 274,
        top: 120,
        width: 220,
        background: '#fff',
        border: '1px solid #b0b0b0',
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 500,
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 10px',
          background: '#f0f0f0',
          borderBottom: '1px solid #b0b0b0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: '#000' }}>Field List</div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
            color: '#666',
            padding: 0,
            width: 20,
            height: 20,
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      {!recordSource ? (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            fontSize: 11,
            color: '#666',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
          <div style={{ marginBottom: 8 }}>No Record Source set</div>
          <div style={{ fontSize: 10, color: '#999' }}>
            Click on the canvas background and set Record Source in the Data tab
          </div>
        </div>
      ) : fields.length === 0 ? (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            fontSize: 11,
            color: '#666',
          }}
        >
          No fields in this table
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            style={{
              padding: '6px 10px',
              fontSize: 10,
              color: '#666',
              background: '#fafafa',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            Table: <strong>{recordSource}</strong>
          </div>
          <div style={{ padding: '4px 0' }}>
            {fields.map((field: any) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, field.name, field.type)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => handleDoubleClick(field.name, field.type)}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  color: '#333',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: draggedField === field.name ? '#e3f2fd' : 'transparent',
                  borderLeft: draggedField === field.name ? '3px solid #2196f3' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (draggedField !== field.name) {
                    e.currentTarget.style.background = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggedField !== field.name) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: 14 }}>{getFieldIcon(field.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{field.name}</div>
                  <div style={{ fontSize: 9, color: '#999' }}>{field.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      {recordSource && fields.length > 0 && (
        <div
          style={{
            padding: '6px 10px',
            fontSize: 9,
            color: '#666',
            background: '#fafafa',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center',
          }}
        >
          Drag field to canvas or double-click to add
        </div>
      )}
    </div>
  )
}
