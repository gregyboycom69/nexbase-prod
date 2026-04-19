'use client'

import { useState } from 'react'

type NavPaneProps = {
  tables: any[]
  queries: any[]
  forms: any[]
  macros: any[]
  activeFilter: 'all' | 'tables' | 'queries' | 'forms' | 'macros'
  onOpenObject: (type: string, id: string, name: string) => void
  onNewObject: (type: string) => void
  onDeleteObject: (type: string, id: string) => void
}

export default function NavPane({
  tables,
  queries,
  forms,
  macros,
  activeFilter,
  onOpenObject,
  onNewObject,
  onDeleteObject,
}: NavPaneProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    tables: true,
    queries: true,
    forms: true,
    macros: true,
  })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id: string; name: string } | null>(null)
  const [showNewMenu, setShowNewMenu] = useState(false)

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  function handleContextMenu(e: React.MouseEvent, type: string, id: string, name: string) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, name })
  }

  function handleDelete() {
    if (contextMenu && confirm(`Delete ${contextMenu.name}?`)) {
      onDeleteObject(contextMenu.type, contextMenu.id)
    }
    setContextMenu(null)
  }

  const filterObjects = (objects: any[], type: string) => {
    if (activeFilter !== 'all' && activeFilter !== type) return []
    return objects.filter((obj) =>
      obj.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredTables = filterObjects(tables, 'tables')
  const filteredQueries = filterObjects(queries, 'queries')
  const filteredForms = filterObjects(forms, 'forms')
  const filteredMacros = filterObjects(macros, 'macros')

  const showSection = (type: string) => activeFilter === 'all' || activeFilter === type

  return (
    <>
      <div
        style={{
          width: 200,
          background: 'var(--color-background-secondary)',
          borderRight: '0.5px solid var(--color-border-tertiary)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        onClick={() => setContextMenu(null)}
      >
        {/* Objects List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* TABLES */}
          {showSection('tables') && (
            <div>
              <div
                onClick={() => toggleSection('tables')}
                style={{
                  padding: '8px 12px 4px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>TABLES</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewObject('table')
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.tables ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.tables &&
                filteredTables.map((table) => (
                  <div
                    key={table.id}
                    onDoubleClick={() => onOpenObject('table', table.id, table.name)}
                    onContextMenu={(e) => handleContextMenu(e, 'table', table.id, table.name)}
                    style={{
                      padding: '6px 12px 6px 20px',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 10 }}>▦</span>
                    {table.name}
                  </div>
                ))}
              {expandedSections.tables && filteredTables.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 20px',
                    fontSize: 10,
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  No tables
                </div>
              )}
            </div>
          )}

          {/* FORMS */}
          {showSection('forms') && (
            <div>
              <div
                onClick={() => toggleSection('forms')}
                style={{
                  padding: '8px 12px 4px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>FORMS</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewObject('form')
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.forms ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.forms &&
                filteredForms.map((form) => (
                  <div
                    key={form.id}
                    onDoubleClick={() => onOpenObject('form', form.id, form.name || form.title || form.slug)}
                    onContextMenu={(e) => handleContextMenu(e, 'form', form.id, form.name || form.title || form.slug)}
                    style={{
                      padding: '6px 12px 6px 20px',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 10 }}>◻</span>
                    {form.name || form.title || form.slug}
                  </div>
                ))}
              {expandedSections.forms && filteredForms.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 20px',
                    fontSize: 10,
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  No forms
                </div>
              )}
            </div>
          )}

          {/* QUERIES */}
          {showSection('queries') && (
            <div>
              <div
                onClick={() => toggleSection('queries')}
                style={{
                  padding: '8px 12px 4px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>QUERIES</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewObject('query')
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.queries ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.queries &&
                filteredQueries.map((query) => (
                  <div
                    key={query.id}
                    onDoubleClick={() => onOpenObject('query', query.id, query.name)}
                    onContextMenu={(e) => handleContextMenu(e, 'query', query.id, query.name)}
                    style={{
                      padding: '6px 12px 6px 20px',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 10 }}>⊕</span>
                    {query.name}
                  </div>
                ))}
              {expandedSections.queries && filteredQueries.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 20px',
                    fontSize: 10,
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  No queries
                </div>
              )}
            </div>
          )}

          {/* MACROS */}
          {showSection('macros') && (
            <div>
              <div
                onClick={() => toggleSection('macros')}
                style={{
                  padding: '8px 12px 4px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>MACROS</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewObject('macro')
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', fontSize: 14, cursor: 'pointer', padding: 0 }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 10 }}>{expandedSections.macros ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedSections.macros &&
                filteredMacros.map((macro) => (
                  <div
                    key={macro.id}
                    onDoubleClick={() => onOpenObject('macro', macro.id, macro.name)}
                    onContextMenu={(e) => handleContextMenu(e, 'macro', macro.id, macro.name)}
                    style={{
                      padding: '6px 12px 6px 20px',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 10 }}>⚡</span>
                    {macro.name}
                  </div>
                ))}
              {expandedSections.macros && filteredMacros.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 20px',
                    fontSize: 10,
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  No macros
                </div>
              )}
            </div>
          )}
        </div>

        {/* New Button */}
        <div style={{ padding: 12, borderTop: '0.5px solid var(--color-border-tertiary)', position: 'relative' }}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '0.5px dashed var(--color-border-secondary)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + New
          </button>
          {showNewMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 12,
                right: 12,
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 4,
                marginBottom: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {['table', 'query', 'form', 'macro'].map((type) => (
                <div
                  key={type}
                  onClick={() => {
                    onNewObject(type)
                    setShowNewMenu(false)
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: 11,
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  New {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: 150,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              onOpenObject(contextMenu.type, contextMenu.id, contextMenu.name)
              setContextMenu(null)
            }}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Open
          </div>
          <div
            onClick={() => {
              onOpenObject(contextMenu.type + '-design', contextMenu.id, contextMenu.name)
              setContextMenu(null)
            }}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Design View
          </div>
          <div
            onClick={handleDelete}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: '#ef4444',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Delete
          </div>
        </div>
      )}
    </>
  )
}
