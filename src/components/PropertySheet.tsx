'use client'

import { useState, useEffect } from 'react'

type PropertySheetProps = {
  selectedControl: any | null
  controls: any[]
  onUpdateControl: (changes: any) => void
  onUpdateForm: (changes: any) => void
  formProperties: any
  tables: any[]
  queries: any[]
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
  workspaceId,
}: PropertySheetProps) {
  const [activeTab, setActiveTab] = useState<'format' | 'data' | 'event' | 'other' | 'all'>('format')

  // Get fields from the form's record source table
  const getFormFields = () => {
    if (!formProperties?.recordSource) return []
    const table = tables.find(t => t.name === formProperties.recordSource)
    return table?.fields || []
  }

  const formFields = getFormFields()

  // Render property input based on type
  const renderPropertyInput = (propName: string, value: any, onChange: (v: any) => void, type: string = 'text') => {
    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '2px 4px',
      fontSize: 11,
      border: '1px solid #b0b0b0',
      background: '#fff',
      fontFamily: 'inherit',
      height: 22,
    }

    if (type === 'yesno') {
      return (
        <select value={value ? 'Yes' : 'No'} onChange={e => onChange(e.target.value === 'Yes')} style={inputStyle}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      )
    }

    if (type === 'dropdown') {
      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {(propName === 'controlSource' || propName === 'fieldKey') && (
            <>
              <option value="">(none)</option>
              {formFields.map((field: any) => (
                <option key={field.id} value={field.name}>{field.name}</option>
              ))}
            </>
          )}
          {propName === 'recordSource' && (
            <>
              <option value="">(none)</option>
              {tables.map(t => (
                <option key={t.id} value={t.name}>📊 {t.name}</option>
              ))}
              {queries.map(q => (
                <option key={q.id} value={q.name}>🔍 {q.name}</option>
              ))}
            </>
          )}
          {propName === 'fontName' && (
            <>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
            </>
          )}
          {propName === 'fontWeight' && (
            <>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </>
          )}
          {propName === 'textAlign' && (
            <>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </>
          )}
          {propName === 'borderStyle' && (
            <>
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
            </>
          )}
          {propName === 'specialEffect' && (
            <>
              <option value="flat">Flat</option>
              <option value="raised">Raised</option>
              <option value="sunken">Sunken</option>
              <option value="shadow">Shadow</option>
            </>
          )}
          {propName === 'defaultView' && (
            <>
              <option value="single">Single Form</option>
              <option value="continuous">Continuous Forms</option>
              <option value="datasheet">Datasheet</option>
              <option value="split">Split Form</option>
            </>
          )}
          {propName === 'rowSourceType' && (
            <>
              <option value="table">Table/Query</option>
              <option value="valuelist">Value List</option>
            </>
          )}
        </select>
      )
    }

    if (type === 'color') {
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} style={{ width: 24, height: 22, border: '1px solid #b0b0b0', cursor: 'pointer' }} />
          <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
      )
    }

    if (type === 'number') {
      return (
        <input type="number" value={value || 0} onChange={e => onChange(+e.target.value)} style={inputStyle} />
      )
    }

    return (
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
    )
  }

  // Render a property row
  const renderPropertyRow = (label: string, propName: string, value: any, onChange: (v: any) => void, type: string = 'text', index: number) => {
    return (
      <div key={propName} style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', background: index % 2 === 0 ? '#fff' : '#f8f8f8' }}>
        <div style={{ width: 120, padding: '4px 6px', fontSize: 11, color: '#666', fontWeight: 500, borderRight: '1px solid #e0e0e0' }}>
          {label}
        </div>
        <div style={{ flex: 1, padding: '2px' }}>
          {renderPropertyInput(propName, value, onChange, type)}
        </div>
      </div>
    )
  }

  // FORMAT TAB properties
  const formatProperties = () => {
    if (!selectedControl) {
      // Form format properties
      return [
        { label: 'Caption', prop: 'caption', type: 'text' },
        { label: 'Default View', prop: 'defaultView', type: 'dropdown' },
        { label: 'Scroll Bars', prop: 'scrollBars', type: 'text' },
        { label: 'Navigation Buttons', prop: 'navigationButtons', type: 'yesno' },
        { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
      ]
    }

    // Control format properties
    const props: any[] = []

    if (!['Divider'].includes(selectedControl.type)) {
      props.push({ label: 'Caption', prop: 'caption', type: 'text' })
    }

    props.push(
      { label: 'Width', prop: 'w', type: 'number' },
      { label: 'Height', prop: 'h', type: 'number' },
      { label: 'Left', prop: 'x', type: 'number' },
      { label: 'Top', prop: 'y', type: 'number' },
    )

    if (!['Label', 'Heading', 'CheckBox'].includes(selectedControl.type)) {
      props.push({ label: 'Back Color', prop: 'bg', type: 'color' })
    }

    props.push(
      { label: 'Fore Color', prop: 'color', type: 'color' },
      { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
      { label: 'Font Size', prop: 'fontSize', type: 'number' },
      { label: 'Font Weight', prop: 'fontWeight', type: 'dropdown' },
      { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
      { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
      { label: 'Border Color', prop: 'borderColor', type: 'color' },
      { label: 'Border Width', prop: 'borderWidth', type: 'number' },
      { label: 'Border Radius', prop: 'radius', type: 'number' },
      { label: 'Visible', prop: 'visible', type: 'yesno' },
    )

    return props
  }

  // DATA TAB properties
  const dataProperties = () => {
    if (!selectedControl) {
      // Form data properties
      return [
        { label: 'Record Source', prop: 'recordSource', type: 'dropdown' },
        { label: 'Filter', prop: 'formFilter', type: 'text' },
        { label: 'Order By', prop: 'orderBy', type: 'text' },
        { label: 'Allow Edits', prop: 'allowEdits', type: 'yesno' },
        { label: 'Allow Additions', prop: 'allowAdditions', type: 'yesno' },
        { label: 'Allow Deletions', prop: 'allowDeletions', type: 'yesno' },
      ]
    }

    // Control data properties
    const props: any[] = []

    if (['TextBox', 'ComboBox', 'CheckBox', 'DatePicker', 'NumberBox', 'Lookup'].includes(selectedControl.type)) {
      props.push({ label: 'Control Source', prop: 'fieldKey', type: 'dropdown' })
      props.push({ label: 'Default Value', prop: 'defaultValue', type: 'text' })
      props.push({ label: 'Validation Rule', prop: 'validationRule', type: 'text' })
      props.push({ label: 'Validation Text', prop: 'validationText', type: 'text' })
      props.push({ label: 'Enabled', prop: 'enabled', type: 'yesno' })
      props.push({ label: 'Locked', prop: 'locked', type: 'yesno' })
    }

    if (selectedControl.type === 'ComboBox') {
      props.push({ label: 'Row Source Type', prop: 'rowSourceType', type: 'dropdown' })
      props.push({ label: 'Row Source', prop: 'rowSource', type: 'text' })
      props.push({ label: 'Bound Column', prop: 'boundColumn', type: 'number' })
      props.push({ label: 'Column Count', prop: 'columnCount', type: 'number' })
    }

    if (['TextBox', 'ComboBox', 'Lookup', 'DatePicker'].includes(selectedControl.type)) {
      props.push({ label: 'Placeholder', prop: 'placeholder', type: 'text' })
    }

    return props
  }

  // EVENT TAB properties
  const eventProperties = () => {
    if (!selectedControl) {
      // Form events
      return [
        { label: 'On Open', prop: 'onOpenMacro', type: 'text' },
        { label: 'On Load', prop: 'onLoadMacro', type: 'text' },
        { label: 'On Close', prop: 'onCloseMacro', type: 'text' },
        { label: 'On Current', prop: 'onCurrentMacro', type: 'text' },
        { label: 'Before Insert', prop: 'beforeInsertMacro', type: 'text' },
        { label: 'After Insert', prop: 'afterInsertMacro', type: 'text' },
        { label: 'Before Update', prop: 'beforeUpdateMacro', type: 'text' },
        { label: 'After Update', prop: 'afterUpdateMacro', type: 'text' },
      ]
    }

    // Control events
    return [
      { label: 'On Click', prop: 'onClickMacro', type: 'text' },
      { label: 'On Double Click', prop: 'onDblClickMacro', type: 'text' },
      { label: 'On Got Focus', prop: 'onGotFocusMacro', type: 'text' },
      { label: 'On Lost Focus', prop: 'onLostFocusMacro', type: 'text' },
      { label: 'Before Update', prop: 'beforeUpdateMacro', type: 'text' },
      { label: 'After Update', prop: 'afterUpdateMacro', type: 'text' },
      { label: 'On Change', prop: 'onChangeMacro', type: 'text' },
    ]
  }

  // OTHER TAB properties
  const otherProperties = () => {
    if (!selectedControl) {
      // Form other properties
      return [
        { label: 'Name', prop: 'name', type: 'text' },
        { label: 'Tag', prop: 'tag', type: 'text' },
      ]
    }

    // Control other properties
    return [
      { label: 'Name', prop: 'name', type: 'text' },
      { label: 'Status Bar Text', prop: 'statusBarText', type: 'text' },
      { label: 'Tab Stop', prop: 'tabStop', type: 'yesno' },
      { label: 'Tab Index', prop: 'tabIndex', type: 'number' },
      { label: 'Tag', prop: 'tag', type: 'text' },
    ]
  }

  // ALL TAB - combines all properties
  const allProperties = () => {
    return [
      ...formatProperties(),
      ...dataProperties(),
      ...eventProperties(),
      ...otherProperties(),
    ]
  }

  // Get properties for active tab
  const getActiveProperties = () => {
    switch (activeTab) {
      case 'format': return formatProperties()
      case 'data': return dataProperties()
      case 'event': return eventProperties()
      case 'other': return otherProperties()
      case 'all': return allProperties()
      default: return []
    }
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
    <div style={{ width: 260, background: '#f0f0f0', borderLeft: '1px solid #b0b0b0', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '6px 8px', background: '#fff', borderBottom: '1px solid #b0b0b0' }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Property Sheet</div>
        <div style={{ fontSize: 10, color: '#666' }}>Selection type: {selectionType}</div>
        {selectedControl && (
          <select
            value={selectedControl.name || selectedControl.id}
            onChange={e => {
              const ctrl = controls.find(c => c.id === e.target.value || c.name === e.target.value)
              if (ctrl) {
                // Would need to pass a setSelectedId callback here
              }
            }}
            style={{ width: '100%', marginTop: 4, fontSize: 11, padding: '2px 4px', border: '1px solid #b0b0b0', background: '#fff' }}
          >
            {controls.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.id}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f0f0f0', borderBottom: '1px solid #b0b0b0' }}>
        {(['format', 'data', 'event', 'other', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '5px 4px',
              fontSize: 10,
              fontWeight: 500,
              border: 'none',
              borderRight: '1px solid #b0b0b0',
              background: activeTab === tab ? '#fff' : '#e8e8e8',
              borderBottom: activeTab === tab ? 'none' : '1px solid #b0b0b0',
              cursor: 'pointer',
              textTransform: 'capitalize',
              color: '#000',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Properties List */}
      <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
        {properties.map((prop, index) =>
          renderPropertyRow(prop.label, prop.prop, getValue(prop.prop), (v) => handleChange(prop.prop, v), prop.type, index)
        )}
        {properties.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#999' }}>
            No properties available
          </div>
        )}
      </div>
    </div>
  )
}
