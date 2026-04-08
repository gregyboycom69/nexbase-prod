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
  const [activeTab, setActiveTab] = useState<'format' | 'data' | 'event' | 'other' | 'all'>('format')

  const getFormFields = () => {
    if (!formProperties?.recordSource) return []
    const table = tables.find(t => t.name === formProperties.recordSource)
    return table?.fields || []
  }

  const formFields = getFormFields()

  const renderPropertyInput = (propName: string, value: any, onChange: (v: any) => void, type: string = 'text') => {
    const inputStyle: React.CSSProperties = {
      width: '100%', padding: '2px 6px', fontSize: 11, border: 'none',
      background: '#0f1117', color: '#c8d0f0', fontFamily: 'inherit', height: 22,
    }

    if (type === 'yesno') {
      return (
        <select value={value ? 'Yes' : 'No'} onChange={e => onChange(e.target.value === 'Yes')} style={inputStyle}>
          <option>Yes</option><option>No</option>
        </select>
      )
    }

    if (type === 'dropdown') {
      // Special handling for Subform-specific dropdowns
      if (propName === 'sourceObject') {
        return (
          <select value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
            <option value="">(none)</option>
            {pages.map((page: any) => (
              <option key={page.id} value={page.id}>{page.title || page.slug}</option>
            ))}
          </select>
        )
      }

      if (propName === 'linkMasterFields') {
        // Show fields from parent form's Record Source
        return (
          <select value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
            <option value="">(none)</option>
            {formFields.map((f: any) => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        )
      }

      if (propName === 'linkChildFields') {
        // Show fields from subform's Record Source
        const subformPage = selectedControl?.sourceObject ? pages.find((p: any) => p.id === selectedControl.sourceObject) : null
        const subformTable = subformPage?.record_source ? tables.find((t: any) => t.name === subformPage.record_source) : null
        const subformFields = subformTable?.fields || []

        return (
          <select value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
            <option value="">(none)</option>
            {subformFields.map((f: any) => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        )
      }

      const options: { [key: string]: string[] } = {
        controlSource: ['(none)', ...formFields.map((f: any) => f.name)],
        fieldKey: ['(none)', ...formFields.map((f: any) => f.name)],
        recordSource: ['(none)', ...tables.map(t => `📊 ${t.name}`), ...queries.map(q => `🔍 ${q.name}`)],
        fontName: ['Plus Jakarta Sans', 'Arial', 'Times New Roman', 'Courier New', 'Georgia'],
        fontWeight: ['Thin', 'Light', 'Normal', 'Semi-bold', 'Bold', 'Extra Bold'],
        textAlign: ['General', 'Left', 'Center', 'Right', 'Distribute'],
        borderStyle: ['Transparent', 'Solid', 'Dashes', 'Dots'],
        specialEffect: ['Flat', 'Raised', 'Sunken', 'Etched', 'Shadowed', 'Chiseled'],
        borderWidth: ['Hairline', '1pt', '2pt', '3pt'],
        backStyle: ['Normal', 'Transparent'],
        rowSourceType: ['Table/Query', 'Value List', 'Field List'],
        format: ['General', 'Currency', 'Fixed', 'Standard', 'Percent', 'Scientific', 'Short Date', 'Long Date', 'Medium Date', 'Short Time', 'Long Time', 'Yes/No', 'True/False'],
        decimalPlaces: ['Auto', '0', '1', '2', '3', '4'],
        verticalAlignment: ['Top', 'Center', 'Bottom'],
        displayWhen: ['Always', 'Print Only', 'Screen Only'],
        chartType: ['Bar', 'Line', 'Pie', 'Donut', 'Area', 'Scatter'],
        legendPosition: ['Bottom', 'Right', 'Top', 'Left'],
        colorScheme: ['Indigo', 'Green', 'Orange', 'Multi', 'Monochrome'],
        modalStyle: ['Default', 'Info', 'Warning', 'Error', 'Success'],
        tabPosition: ['Top', 'Bottom', 'Left', 'Right'],
        tabStyle: ['Tabs', 'Buttons', 'None'],
        sizeMode: ['Clip', 'Stretch', 'Zoom', 'Stretch Horizontal', 'Stretch Vertical'],
        dateFormat: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'Long Date', 'Short Date'],
        defaultView: ['Single Form', 'Continuous Forms', 'Datasheet', 'Split Form'],
      }

      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {(options[propName] || []).map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    if (type === 'color') {
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: value || '#000000', border: '1px solid #2d3055', borderRadius: 2, alignSelf: 'center' }} />
          <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
      )
    }

    if (type === 'number') {
      return <input type="number" value={value || 0} onChange={e => onChange(+e.target.value)} style={inputStyle} />
    }

    return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={inputStyle} />
  }

  const renderPropertyRow = (label: string, propName: string, value: any, onChange: (v: any) => void, type: string = 'text', index: number) => {
    return (
      <div key={propName} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', borderBottom: '1px solid #252840', padding: '3px 8px', background: index % 2 === 0 ? '#1a1d2e' : '#1e2139' }}>
        <span style={{ fontSize: 11, color: '#8890b8', fontFamily: "'JetBrains Mono', monospace", alignSelf: 'center' }}>
          {label}
        </span>
        <div>
          {renderPropertyInput(propName, value, onChange, type)}
        </div>
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

    // Common FORMAT properties for most controls
    const commonFormat = [
      { label: 'Width', prop: 'w', type: 'number' },
      { label: 'Height', prop: 'h', type: 'number' },
      { label: 'Left', prop: 'x', type: 'number' },
      { label: 'Top', prop: 'y', type: 'number' },
    ]

    // Common EVENT properties for most controls
    const commonEvents = [
      { label: 'On Click', prop: 'onClickMacro', type: 'text' },
      { label: 'On Double Click', prop: 'onDblClickMacro', type: 'text' },
      { label: 'On Got Focus', prop: 'onGotFocusMacro', type: 'text' },
      { label: 'On Lost Focus', prop: 'onLostFocusMacro', type: 'text' },
    ]

    // Common OTHER properties
    const commonOther = [
      { label: 'Name', prop: 'name', type: 'text' },
      { label: 'Status Bar Text', prop: 'statusBarText', type: 'text' },
      { label: 'Tab Stop', prop: 'tabStop', type: 'yesno' },
      { label: 'Tab Index', prop: 'tabIndex', type: 'number' },
      { label: 'ControlTip Text', prop: 'controlTipText', type: 'text' },
      { label: 'Tag', prop: 'tag', type: 'text' },
    ]

    switch (controlType) {
      case 'TextBox':
        props.format = [
          { label: 'Format', prop: 'format', type: 'dropdown' },
          { label: 'Decimal Places', prop: 'decimalPlaces', type: 'dropdown' },
          { label: 'Input Mask', prop: 'inputMask', type: 'text' },
          ...commonFormat,
          { label: 'Back Style', prop: 'backStyle', type: 'dropdown' },
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Special Effect', prop: 'specialEffect', type: 'dropdown' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Border Width', prop: 'borderWidth', type: 'dropdown' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Font Weight', prop: 'fontWeight', type: 'dropdown' },
          { label: 'Font Italic', prop: 'fontItalic', type: 'yesno' },
          { label: 'Font Underline', prop: 'fontUnderline', type: 'yesno' },
          { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
          { label: 'Vertical Alignment', prop: 'verticalAlignment', type: 'dropdown' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
          { label: 'Display When', prop: 'displayWhen', type: 'dropdown' },
        ]
        props.data = [
          { label: 'Control Source', prop: 'fieldKey', type: 'dropdown' },
          { label: 'Default Value', prop: 'defaultValue', type: 'text' },
          { label: 'Validation Rule', prop: 'validationRule', type: 'text' },
          { label: 'Validation Text', prop: 'validationText', type: 'text' },
          { label: 'Enabled', prop: 'enabled', type: 'yesno' },
          { label: 'Locked', prop: 'locked', type: 'yesno' },
        ]
        props.event = [
          { label: 'Before Update', prop: 'beforeUpdateMacro', type: 'text' },
          { label: 'After Update', prop: 'afterUpdateMacro', type: 'text' },
          { label: 'On Change', prop: 'onChangeMacro', type: 'text' },
          ...commonEvents,
        ]
        props.other = commonOther
        break

      case 'Label':
        props.format = [
          { label: 'Caption', prop: 'caption', type: 'text' },
          ...commonFormat,
          { label: 'Back Style', prop: 'backStyle', type: 'dropdown' },
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Special Effect', prop: 'specialEffect', type: 'dropdown' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Font Weight', prop: 'fontWeight', type: 'dropdown' },
          { label: 'Font Italic', prop: 'fontItalic', type: 'yesno' },
          { label: 'Font Underline', prop: 'fontUnderline', type: 'yesno' },
          { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = []
        props.event = commonEvents.filter(e => ['On Click', 'On Double Click'].includes(e.label))
        props.other = [
          { label: 'Name', prop: 'name', type: 'text' },
          { label: 'ControlTip Text', prop: 'controlTipText', type: 'text' },
          { label: 'Tag', prop: 'tag', type: 'text' },
        ]
        break

      case 'Button':
        props.format = [
          { label: 'Caption', prop: 'caption', type: 'text' },
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Special Effect', prop: 'specialEffect', type: 'dropdown' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Font Weight', prop: 'fontWeight', type: 'dropdown' },
          { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = []
        props.event = commonEvents
        props.other = commonOther
        break

      case 'ComboBox':
        props.format = [
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
          { label: 'List Rows', prop: 'listRows', type: 'number' },
          { label: 'List Width', prop: 'listWidth', type: 'number' },
        ]
        props.data = [
          { label: 'Control Source', prop: 'fieldKey', type: 'dropdown' },
          { label: 'Row Source Type', prop: 'rowSourceType', type: 'dropdown' },
          { label: 'Row Source', prop: 'rowSource', type: 'text' },
          { label: 'Bound Column', prop: 'boundColumn', type: 'number' },
          { label: 'Column Count', prop: 'columnCount', type: 'number' },
          { label: 'Limit To List', prop: 'limitToList', type: 'yesno' },
          { label: 'Default Value', prop: 'defaultValue', type: 'text' },
          { label: 'Validation Rule', prop: 'validationRule', type: 'text' },
          { label: 'Validation Text', prop: 'validationText', type: 'text' },
          { label: 'Enabled', prop: 'enabled', type: 'yesno' },
          { label: 'Locked', prop: 'locked', type: 'yesno' },
        ]
        props.event = [
          { label: 'Before Update', prop: 'beforeUpdateMacro', type: 'text' },
          { label: 'After Update', prop: 'afterUpdateMacro', type: 'text' },
          { label: 'On Change', prop: 'onChangeMacro', type: 'text' },
          ...commonEvents,
        ]
        props.other = commonOther
        break

      case 'CheckBox':
        props.format = [
          { label: 'Caption', prop: 'caption', type: 'text' },
          ...commonFormat,
          { label: 'Back Style', prop: 'backStyle', type: 'dropdown' },
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Special Effect', prop: 'specialEffect', type: 'dropdown' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = [
          { label: 'Control Source', prop: 'fieldKey', type: 'dropdown' },
          { label: 'Triple State', prop: 'tripleState', type: 'yesno' },
          { label: 'Default Value', prop: 'defaultValue', type: 'text' },
          { label: 'Enabled', prop: 'enabled', type: 'yesno' },
          { label: 'Locked', prop: 'locked', type: 'yesno' },
        ]
        props.event = commonEvents
        props.other = commonOther
        break

      case 'DatePicker':
        props.format = [
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
          { label: 'Date Format', prop: 'dateFormat', type: 'dropdown' },
        ]
        props.data = [
          { label: 'Control Source', prop: 'fieldKey', type: 'dropdown' },
          { label: 'Default Value', prop: 'defaultValue', type: 'text' },
          { label: 'Minimum Date', prop: 'minimumDate', type: 'text' },
          { label: 'Maximum Date', prop: 'maximumDate', type: 'text' },
          { label: 'Enabled', prop: 'enabled', type: 'yesno' },
          { label: 'Locked', prop: 'locked', type: 'yesno' },
        ]
        props.event = commonEvents
        props.other = commonOther
        break

      case 'NumberBox':
        props.format = [
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Text Align', prop: 'textAlign', type: 'dropdown' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
          { label: 'Show Spinner', prop: 'showSpinner', type: 'yesno' },
        ]
        props.data = [
          { label: 'Control Source', prop: 'fieldKey', type: 'dropdown' },
          { label: 'Format', prop: 'format', type: 'dropdown' },
          { label: 'Decimal Places', prop: 'decimalPlaces', type: 'dropdown' },
          { label: 'Minimum Value', prop: 'minimumValue', type: 'number' },
          { label: 'Maximum Value', prop: 'maximumValue', type: 'number' },
          { label: 'Step', prop: 'step', type: 'number' },
          { label: 'Default Value', prop: 'defaultValue', type: 'text' },
          { label: 'Enabled', prop: 'enabled', type: 'yesno' },
          { label: 'Locked', prop: 'locked', type: 'yesno' },
        ]
        props.event = commonEvents
        props.other = commonOther
        break

      case 'DataTable':
      case 'DataGrid':
        props.format = [
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Grid Lines Color', prop: 'gridLinesColor', type: 'color' },
          { label: 'Header Back Color', prop: 'headerBackColor', type: 'color' },
          { label: 'Header Fore Color', prop: 'headerForeColor', type: 'color' },
          { label: 'Alternate Back Color', prop: 'alternateBackColor', type: 'color' },
          { label: 'Font Name', prop: 'fontName', type: 'dropdown' },
          { label: 'Font Size', prop: 'fontSize', type: 'number' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = [
          { label: 'Record Source', prop: 'sourceTable', type: 'text' },
          { label: 'Columns', prop: 'columns', type: 'text' },
          { label: 'Allow Edits', prop: 'allowEdits', type: 'yesno' },
          { label: 'Allow Additions', prop: 'allowAdditions', type: 'yesno' },
          { label: 'Allow Deletions', prop: 'allowDeletions', type: 'yesno' },
          { label: 'Filter', prop: 'filter', type: 'text' },
          { label: 'Order By', prop: 'orderBy', type: 'text' },
        ]
        props.event = commonEvents
        props.other = [
          { label: 'Name', prop: 'name', type: 'text' },
          { label: 'Show Search Box', prop: 'showSearch', type: 'yesno' },
          { label: 'Records Per Page', prop: 'rowsPerPage', type: 'number' },
          { label: 'Tag', prop: 'tag', type: 'text' },
        ]
        break

      case 'Chart':
        props.format = [
          ...commonFormat,
          { label: 'Chart Type', prop: 'chartType', type: 'dropdown' },
          { label: 'Chart Title', prop: 'caption', type: 'text' },
          { label: 'Show Legend', prop: 'showLegend', type: 'yesno' },
          { label: 'Legend Position', prop: 'legendPosition', type: 'dropdown' },
          { label: 'Color Scheme', prop: 'colorScheme', type: 'dropdown' },
          { label: 'Show Data Labels', prop: 'showDataLabels', type: 'yesno' },
          { label: 'Background Color', prop: 'bg', type: 'color' },
        ]
        props.data = [
          { label: 'Record Source', prop: 'recordSource', type: 'text' },
          { label: 'X Axis Field', prop: 'xAxisField', type: 'text' },
          { label: 'Y Axis Field', prop: 'yAxisField', type: 'text' },
          { label: 'Series Field', prop: 'seriesField', type: 'text' },
        ]
        props.event = [{ label: 'On Click', prop: 'onClickMacro', type: 'text' }]
        props.other = [
          { label: 'Name', prop: 'name', type: 'text' },
          { label: 'Tag', prop: 'tag', type: 'text' },
        ]
        break

      case 'TabPanel':
        props.format = [
          ...commonFormat,
          { label: 'Tab Names', prop: 'tabs', type: 'text' },
          { label: 'Tab Position', prop: 'tabPosition', type: 'dropdown' },
          { label: 'Tab Style', prop: 'tabStyle', type: 'dropdown' },
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Tab Back Color', prop: 'tabBackColor', type: 'color' },
          { label: 'Tab Fore Color', prop: 'tabForeColor', type: 'color' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = []
        props.event = [{ label: 'On Change', prop: 'onChangeMacro', type: 'text' }]
        props.other = [
          { label: 'Name', prop: 'name', type: 'text' },
          { label: 'Tag', prop: 'tag', type: 'text' },
        ]
        break

      case 'Subform':
        props.format = [
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
          { label: 'Border Color', prop: 'borderColor', type: 'color' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = [
          { label: 'Source Object', prop: 'sourceObject', type: 'dropdown' },
          { label: 'Link Master Fields', prop: 'linkMasterFields', type: 'dropdown' },
          { label: 'Link Child Fields', prop: 'linkChildFields', type: 'dropdown' },
          { label: 'Enabled', prop: 'enabled', type: 'yesno' },
        ]
        props.event = commonEvents.filter(e => ['On Enter', 'On Exit'].includes(e.label))
        props.other = [
          { label: 'Name', prop: 'name', type: 'text' },
          { label: 'Tag', prop: 'tag', type: 'text' },
        ]
        break

      default:
        // Default properties for other control types
        props.format = [
          { label: 'Caption', prop: 'caption', type: 'text' },
          ...commonFormat,
          { label: 'Back Color', prop: 'bg', type: 'color' },
          { label: 'Fore Color', prop: 'color', type: 'color' },
          { label: 'Border Radius', prop: 'radius', type: 'number' },
          { label: 'Visible', prop: 'visible', type: 'yesno' },
        ]
        props.data = []
        props.event = commonEvents
        props.other = commonOther
    }

    return props
  }

  const getFormProperties = () => {
    return {
      format: [
        { label: 'Caption', prop: 'caption', type: 'text' },
        { label: 'Default View', prop: 'defaultView', type: 'dropdown' },
        { label: 'Navigation Buttons', prop: 'navigationButtons', type: 'yesno' },
        { label: 'Border Style', prop: 'borderStyle', type: 'dropdown' },
      ],
      data: [
        { label: 'Record Source', prop: 'recordSource', type: 'dropdown' },
        { label: 'Filter', prop: 'formFilter', type: 'text' },
        { label: 'Order By', prop: 'orderBy', type: 'text' },
        { label: 'Allow Edits', prop: 'allowEdits', type: 'yesno' },
        { label: 'Allow Additions', prop: 'allowAdditions', type: 'yesno' },
        { label: 'Allow Deletions', prop: 'allowDeletions', type: 'yesno' },
      ],
      event: [
        { label: 'On Open', prop: 'onOpenMacro', type: 'text' },
        { label: 'On Load', prop: 'onLoadMacro', type: 'text' },
        { label: 'On Close', prop: 'onCloseMacro', type: 'text' },
        { label: 'On Current', prop: 'onCurrentMacro', type: 'text' },
      ],
      other: [
        { label: 'Name', prop: 'name', type: 'text' },
        { label: 'Tag', prop: 'tag', type: 'text' },
      ],
    }
  }

  const getActiveProperties = () => {
    const props = selectedControl ? getControlTypeProperties(selectedControl.type) : getFormProperties()

    switch (activeTab) {
      case 'format': return props.format
      case 'data': return props.data
      case 'event': return props.event
      case 'other': return props.other
      case 'all': return [...props.format, ...props.data, ...props.event, ...props.other]
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
    <div style={{ width: 260, background: '#1a1d2e', borderLeft: '1px solid #252840', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ padding: '6px 8px', background: '#252840', borderBottom: '1px solid #252840' }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#c8d0f0' }}>Property Sheet</div>
        <div style={{ fontSize: 10, color: '#8890b8' }}>Selection type: {selectionType}</div>
        {selectedControl && (
          <select value={selectedControl.name || selectedControl.id} style={{ width: '100%', marginTop: 4, fontSize: 11, padding: '2px 6px', border: 'none', background: '#0f1117', color: '#c8d0f0' }}>
            {controls.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.type}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', background: '#1a1d2e', borderBottom: '1px solid #252840' }}>
        {(['format', 'data', 'event', 'other', 'all'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '5px 4px', fontSize: 10, fontWeight: 500, border: 'none',
              borderRight: '1px solid #252840',
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? '#fff' : '#7480a8',
              cursor: 'pointer', textTransform: 'capitalize',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: '#1a1d2e' }}>
        {formFields.length === 0 && activeTab === 'data' && selectedControl && (
          <div style={{ padding: 12, background: '#252840', border: '1px solid #6366f1', margin: 8, borderRadius: 4, fontSize: 10, color: '#c8d0f0' }}>
            💡 Set Record Source on the form first to bind controls to data fields
          </div>
        )}
        {properties.map((prop, index) =>
          renderPropertyRow(prop.label, prop.prop, getValue(prop.prop), (v) => handleChange(prop.prop, v), prop.type, index)
        )}
        {properties.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#7480a8' }}>
            No properties available
          </div>
        )}
      </div>
    </div>
  )
}
