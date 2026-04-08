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
          background: '#1a1d2e',
          borderRight: '1px solid #252840',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        onClick={() => setContextMenu(null)}
      >
        {/* Search */}
        <div style={{ padding: 12, borderBottom: '1px solid #252840' }}>
          <input
            type="text"
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#0f1117',
              border: '1px solid #252840',
              color: '#c8d0f0',
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 11,
            }}
          />
        </div>

        {/* Objects List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* TABLES */}
          {showSection('tables') && (
            <div>
              <div
                onClick={() => toggleSection('tables')}
                style={{
                  padding: '8px 12px',
                  background: '#252840',
                  color: '#8890b8',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>📊 TABLES</span>
                <span>{expandedSections.tables ? '▼' : '▶'}</span>
              </div>
              {expandedSections.tables &&
                filteredTables.map((table) => (
                  <div
                    key={table.id}
                    onDoubleClick={() => onOpenObject('table', table.id, table.name)}
                    onContextMenu={(e) => handleContextMenu(e, 'table', table.id, table.name)}
                    style={{
                      padding: '6px 12px 6px 24px',
                      fontSize: 11,
                      color: '#c8d0f0',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#252840')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {table.name}
                  </div>
                ))}
              {expandedSections.tables && filteredTables.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 24px',
                    fontSize: 10,
                    color: '#4a5277',
                    fontStyle: 'italic',
                  }}
                >
                  No tables
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
                  padding: '8px 12px',
                  background: '#252840',
                  color: '#8890b8',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>🔍 QUERIES</span>
                <span>{expandedSections.queries ? '▼' : '▶'}</span>
              </div>
              {expandedSections.queries &&
                filteredQueries.map((query) => (
                  <div
                    key={query.id}
                    onDoubleClick={() => onOpenObject('query', query.id, query.name)}
                    onContextMenu={(e) => handleContextMenu(e, 'query', query.id, query.name)}
                    style={{
                      padding: '6px 12px 6px 24px',
                      fontSize: 11,
                      color: '#c8d0f0',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#252840')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {query.name}
                  </div>
                ))}
              {expandedSections.queries && filteredQueries.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 24px',
                    fontSize: 10,
                    color: '#4a5277',
                    fontStyle: 'italic',
                  }}
                >
                  No queries
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
                  padding: '8px 12px',
                  background: '#252840',
                  color: '#8890b8',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>📄 FORMS</span>
                <span>{expandedSections.forms ? '▼' : '▶'}</span>
              </div>
              {expandedSections.forms &&
                filteredForms.map((form) => (
                  <div
                    key={form.id}
                    onDoubleClick={() => onOpenObject('form', form.id, form.name || form.title || form.slug)}
                    onContextMenu={(e) => handleContextMenu(e, 'form', form.id, form.name || form.title || form.slug)}
                    style={{
                      padding: '6px 12px 6px 24px',
                      fontSize: 11,
                      color: '#c8d0f0',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#252840')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {form.name || form.title || form.slug}
                  </div>
                ))}
              {expandedSections.forms && filteredForms.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 24px',
                    fontSize: 10,
                    color: '#4a5277',
                    fontStyle: 'italic',
                  }}
                >
                  No forms
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
                  padding: '8px 12px',
                  background: '#252840',
                  color: '#8890b8',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>⚡ MACROS</span>
                <span>{expandedSections.macros ? '▼' : '▶'}</span>
              </div>
              {expandedSections.macros &&
                filteredMacros.map((macro) => (
                  <div
                    key={macro.id}
                    onDoubleClick={() => onOpenObject('macro', macro.id, macro.name)}
                    onContextMenu={(e) => handleContextMenu(e, 'macro', macro.id, macro.name)}
                    style={{
                      padding: '6px 12px 6px 24px',
                      fontSize: 11,
                      color: '#c8d0f0',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#252840')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {macro.name}
                  </div>
                ))}
              {expandedSections.macros && filteredMacros.length === 0 && (
                <div
                  style={{
                    padding: '6px 12px 6px 24px',
                    fontSize: 10,
                    color: '#4a5277',
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
        <div style={{ padding: 12, borderTop: '1px solid #252840', position: 'relative' }}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
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
                background: '#252840',
                border: '1px solid #3a3f5c',
                borderRadius: 4,
                marginBottom: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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
                    color: '#c8d0f0',
                    cursor: 'pointer',
                    borderBottom: '1px solid #1a1d2e',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1d2e')}
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
              onOpenObject(contextMenu.type, contextMenu.id, contextMenu.name)
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
            Open
          </div>
          <div
            onClick={() => {
              // Design view
              onOpenObject(contextMenu.type + '-design', contextMenu.id, contextMenu.name)
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
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1d2e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Delete
          </div>
        </div>
      )}
    </>
  )
}
