'use client'

import { useState } from 'react'

type PropertySheetProps = {
  selectedControl: any | null
  controls: any[]
  onUpdateControl: (changes: any) => void
  onUpdateForm: (changes: any) => void
  formProperties: any
  tables: any[]
  queries: any[]
  pages: any[]
  workspaceId: string
}

export default function PropertySheet({
  selectedControl,
  controls,
  onUpdateControl,
  onUpdateForm,
  formProperties,
  tables,
  queries,
  pages,
}: PropertySheetProps) {
  const [activeTab, setActiveTab] = useState<'format' | 'data' | 'event' | 'other'>('format')

  const getFormFields = () => {
    if (!formProperties?.recordSource) return []
    const table = tables.find(t => t.name === formProperties.recordSource)
    return table?.fields || []
  }

  const formFields = getFormFields()

  const renderPropertyInput = (propName: string, value: any, onChange: (v: any) => void, type: string = 'text') => {
    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '2px 4px',
      fontSize: 11,
      border: 'none',
      background: 'transparent',
      color: 'var(--color-text-primary)',
      fontFamily: 'inherit',
      minHeight: 22,
      borderRadius: 4,
    }

    const focusStyle = {
      background: 'var(--color-background-secondary)',
      borderRadius: 4
    }

    if (type === 'yesno') {
      return (
        <select value={value ? 'Yes' : 'No'} onChange={e => onChange(e.target.value === 'Yes')} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option>Yes</option>
          <option>No</option>
        </select>
      )
    }

    if (type === 'dropdown') {
      const options: { [key: string]: string[] } = {
        controlSource: ['(none)', ...formFields.map((f: any) => f.name)],
        fieldKey: ['(none)', ...formFields.map((f: any) => f.name)],
        recordSource: ['(none)', ...tables.map(t => t.name), ...queries.map(q => q.name)],
        fontName: ['Plus Jakarta Sans', 'Arial', 'Times New Roman', 'Courier New'],
        fontWeight: ['Normal', 'Semi-bold', 'Bold'],
        textAlign: ['Left', 'Center', 'Right'],
        borderStyle: ['Solid', 'Dashed', 'Dotted', 'None'],
        sourceObject: ['(none)', ...pages.map(p => p.id)],
        linkMasterFields: ['(none)', ...formFields.map((f: any) => f.name)],
        linkChildFields: ['(none)', ...formFields.map((f: any) => f.name)],
      }

      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {(options[propName] || []).map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    if (type === 'color') {
      return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{
            width: 14,
            height: 14,
            background: value || '#000000',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 2
          }} />
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => Object.assign(e.target.style, focusStyle)}
            onBlur={(e) => e.target.style.background = 'transparent'}
          />
        </div>
      )
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          value={value || 0}
          onChange={e => onChange(+e.target.value)}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => e.target.style.background = 'transparent'}
        />
      )
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => Object.assign(e.target.style, focusStyle)}
        onBlur={(e) => e.target.style.background = 'transparent'}
      />
    )
  }

  const renderPropertyRow = (label: string, propName: string, value: any, onChange: (v: any) => void, type: string = 'text') => {
    return (
      <div
        key={propName}
        style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          minHeight: 26,
          alignItems: 'center',
          padding: '0 10px',
        }}
      >
        <span style={{
          fontSize: 10,
          color: 'var(--color-text-secondary)',
        }}>
          {label}
        </span>
        <div>
          {renderPropertyInput(propName, value, onChange, type)}
        </div>
      </div>
    )
  }

  const renderSectionHeader = (title: string) => {
    return (
      <div key={`section-${title}`} style={{
        padding: '4px 10px',
        fontSize: 9,
        fontWeight: 500,
        color: '#4f46e5',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: 'var(--color-background-secondary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}>
        {title}
      </div>
    )
  }

  const getControlTypeProperties = (controlType: string) => {
    const props = {
      format: [] as any[],
      data: [] as any[],
      event: [] as any[],
      other: [] as any[],
    }

    // Common FORMAT properties
    const positionProps = [
      { label: 'Left (X)', prop: 'x', type: 'number' },
      { label: 'Top (Y)', prop: 'y', type: 'number' },
      { label: 'Width', prop: 'w', type: 'number' },
      { label: 'Height', prop: 'h', type: 'number' },
    ]

    const appearanceProps = [
      { label: 'Back Color', prop: 'bg', type: 'color' },
      { label: 'Text Color', prop: 'color', type: 'color' },
      { label: 'Border Radius', prop: 'radius', type: 'number' },
      { label: 'Visible', prop: 'visible', type: 'yesno' },
    ]

    const typographyProps = [
      { label: 'Font Size', prop: 'fontSize', type: 'number' },
      { label: 'Bold', prop: 'bold', type: 'yesno' },
      { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
    ]

    // Common DATA properties
    const bindingProps = [
      { label: 'Control Source', prop: 'fieldKey', type: 'dropdown' },
      { label: 'Default Value', prop: 'defaultValue', type: 'text' },
      { label: 'Enabled', prop: 'enabled', type: 'yesno' },
      { label: 'Locked', prop: 'locked', type: 'yesno' },
    ]

    // Common EVENT properties
    const eventProps = [
      { label: 'On Click', prop: 'onClickMacro', type: 'text' },
      { label: 'On Double Click', prop: 'onDblClickMacro', type: 'text' },
      { label: 'On Got Focus', prop: 'onGotFocusMacro', type: 'text' },
      { label: 'On Lost Focus', prop: 'onLostFocusMacro', type: 'text' },
    ]

    // Common OTHER properties
    const otherProps = [
      { label: 'Name', prop: 'name', type: 'text' },
      { label: 'ControlTip', prop: 'controlTipText', type: 'text' },
      { label: 'Tab Stop', prop: 'tabStop', type: 'yesno' },
      { label: 'Tab Index', prop: 'tabIndex', type: 'number' },
    ]

    // Build properties based on control type
    props.format = [
      'section:Position',
      ...positionProps,
      'section:Appearance',
      ...appearanceProps,
    ]

    // Add content property for text-based controls
    if (['Label', 'Heading', 'Button', 'Badge'].includes(controlType)) {
      props.format.splice(6, 0, 'section:Content')
      props.format.splice(7, 0, { label: 'Caption', prop: 'caption', type: 'text' })
    }

    // Add typography for text-based controls
    if (!['Divider', 'Image', 'ProgressBar'].includes(controlType)) {
      props.format.push('section:Typography')
      props.format.push(...typographyProps)
    }

    // DATA tab
    if (['TextBox', 'ComboBox', 'CheckBox', 'DatePicker', 'NumberBox'].includes(controlType)) {
      props.data = [
        'section:Binding',
        ...bindingProps,
      ]
    }

    // EVENT tab
    props.event = eventProps

    // OTHER tab
    props.other = otherProps

    return props
  }

  const getFormProperties = () => {
    return {
      format: [],
      data: [
        'section:Record Source',
        { label: 'Record Source', prop: 'recordSource', type: 'dropdown' },
        { label: 'Filter', prop: 'formFilter', type: 'text' },
        { label: 'Order By', prop: 'orderBy', type: 'text' },
        'section:Permissions',
        { label: 'Allow Edits', prop: 'allowEdits', type: 'yesno' },
        { label: 'Allow Additions', prop: 'allowAdditions', type: 'yesno' },
        { label: 'Allow Deletions', prop: 'allowDeletions', type: 'yesno' },
      ],
      event: [],
      other: [],
    }
  }

  const getActiveProperties = () => {
    const props = selectedControl ? getControlTypeProperties(selectedControl.type) : getFormProperties()
    return props[activeTab] || []
  }

  const properties = getActiveProperties()

  const handleChange = (prop: string, value: any) => {
    if (selectedControl) {
      onUpdateControl({ [prop]: value })
    } else {
      onUpdateForm({ [prop]: value })
    }
  }

  const getValue = (prop: string) => {
    if (selectedControl) {
      return selectedControl[prop]
    } else {
      return formProperties[prop]
    }
  }

  const selectionType = selectedControl ? selectedControl.type : 'Form'

  return (
    <div style={{
      width: 260,
      background: 'var(--color-background-primary)',
      borderLeft: '0.5px solid var(--color-border-tertiary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--color-text-primary)' }}>
          Property Sheet
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          Selection: {selectionType}
        </div>
      </div>

      {/* Control Name Box */}
      {selectedControl && (
        <div style={{ padding: '6px 12px', background: 'var(--color-background-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <input
            type="text"
            value={selectedControl.name || selectedControl.id}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{
              width: '100%',
              fontSize: 11,
              padding: '4px 6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
            }}
            placeholder="Control name"
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}>
        {(['format', 'data', 'event', 'other'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 11,
              fontWeight: activeTab === tab ? 500 : 400,
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? '#4f46e5' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === tab ? '#4f46e5' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              textAlign: 'center',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Properties */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {formFields.length === 0 && activeTab === 'data' && selectedControl && (
          <div style={{
            padding: 10,
            background: '#fef3c7',
            border: '0.5px solid #f59e0b',
            margin: 8,
            borderRadius: 4,
            fontSize: 10,
            color: '#92400e'
          }}>
            💡 Set Record Source on the form first
          </div>
        )}
        {properties.map((prop: any, idx: number) => {
          if (typeof prop === 'string' && prop.startsWith('section:')) {
            return renderSectionHeader(prop.replace('section:', ''))
          }
          return renderPropertyRow(prop.label, prop.prop, getValue(prop.prop), (v) => handleChange(prop.prop, v), prop.type)
        })}
        {properties.length === 0 && (
          <div style={{
            padding: 20,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--color-text-tertiary)'
          }}>
            No properties
          </div>
        )}
      </div>
    </div>
  )
}
