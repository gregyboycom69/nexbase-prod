import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BAD_COLORS = [
  '#7f1d1d', '#991b1b', '#450a0a', '#1f1d1d',
  '#2d1d1d', '#3d1d1d', '#181818', '#000000',
  '#7f1818', '#8b1414', '#a01515'
]

const DEFAULT_BG: Record<string, string> = {
  TextBox: '#ffffff',
  NumberBox: '#ffffff',
  DatePicker: '#ffffff',
  ComboBox: '#ffffff',
  Button: '#4f46e5',
  Label: 'transparent',
  Heading: 'transparent',
  CheckBox: 'transparent',
  Card: '#ffffff',
}

const DEFAULT_COLOR: Record<string, string> = {
  TextBox: '#1e293b',
  NumberBox: '#1e293b',
  DatePicker: '#1e293b',
  ComboBox: '#374151',
  Button: '#ffffff',
  Label: '#374151',
  Heading: '#0f172a',
  CheckBox: '#374151',
  Card: '#0f172a',
}

function isLightColor(hex: string): boolean {
  if (!hex || hex === 'transparent') return true
  const c = hex.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.substr(0, 2), 16)
  const g = parseInt(c.substr(2, 2), 16)
  const b = parseInt(c.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

interface Control {
  id?: string
  type: string
  props?: {
    bg?: string
    color?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

function sanitizeControl(ctrl: Control): { control: Control; modified: boolean; messages: string[] } {
  const messages: string[] = []
  let modified = false
  const newProps = { ...(ctrl.props || {}) }

  // Fix bad background colors
  if (BAD_COLORS.includes((newProps.bg || '').toLowerCase())) {
    const oldBg = newProps.bg
    newProps.bg = DEFAULT_BG[ctrl.type] || '#ffffff'
    modified = true
    messages.push(`Fixed bg ${oldBg} -> ${newProps.bg} for ${ctrl.type}`)
  }

  // Fix bad text colors
  if (BAD_COLORS.includes((newProps.color || '').toLowerCase())) {
    const oldColor = newProps.color
    newProps.color = DEFAULT_COLOR[ctrl.type] || '#1e293b'
    modified = true
    messages.push(`Fixed color ${oldColor} -> ${newProps.color} for ${ctrl.type}`)
  }

  // Fix button contrast
  if (ctrl.type === 'Button') {
    const bg = newProps.bg || '#4f46e5'
    const isLightBg = isLightColor(bg)
    if (isLightBg && (!newProps.color || newProps.color === '#ffffff')) {
      newProps.color = '#1e293b'
      modified = true
      messages.push(`Fixed button contrast: dark text on light bg`)
    }
    if (!isLightBg && (!newProps.color || newProps.color === '#000000')) {
      newProps.color = '#ffffff'
      modified = true
      messages.push(`Fixed button contrast: white text on dark bg`)
    }
  }

  return {
    control: { ...ctrl, props: newProps },
    modified,
    messages,
  }
}

export async function GET() {
  const supabase = await createClient()
  const results: string[] = []
  let fixedControlsTable = 0
  let fixedPagesJsonb = 0
  let totalChecked = 0

  // Strategy 1: Check controls table (if exists)
  try {
    const { data: controls, error: controlsError } = await supabase
      .from('controls')
      .select('id, type, props')

    if (!controlsError && controls && controls.length > 0) {
      results.push(`Found ${controls.length} controls in controls table`)
      totalChecked += controls.length

      for (const ctrl of controls) {
        const { control: newCtrl, modified, messages } = sanitizeControl(ctrl as Control)
        if (modified) {
          const { error: updateError } = await supabase
            .from('controls')
            .update({ props: newCtrl.props })
            .eq('id', ctrl.id)

          if (!updateError) {
            fixedControlsTable++
            results.push(`Fixed control ${ctrl.id}: ${messages.join(', ')}`)
          } else {
            results.push(`Failed control ${ctrl.id}: ${updateError.message}`)
          }
        }
      }
    } else {
      results.push(`No controls table or empty (${controlsError?.message || 'OK'})`)
    }
  } catch (e) {
    results.push(`Skipped controls table: ${(e as Error).message}`)
  }

  // Strategy 2: Check pages.controls JSONB column
  try {
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, controls')

    if (!pagesError && pages) {
      results.push(`Found ${pages.length} pages with controls JSONB`)

      for (const page of pages) {
        if (!page.controls || !Array.isArray(page.controls)) continue
        totalChecked += page.controls.length

        let pageModified = false
        const newControls = page.controls.map((ctrl: Control) => {
          const { control: newCtrl, modified, messages } = sanitizeControl(ctrl)
          if (modified) {
            pageModified = true
            results.push(`Page ${page.id} ctrl ${ctrl.id || '?'}: ${messages.join(', ')}`)
          }
          return newCtrl
        })

        if (pageModified) {
          const { error: updateError } = await supabase
            .from('pages')
            .update({ controls: newControls })
            .eq('id', page.id)

          if (!updateError) {
            fixedPagesJsonb++
            results.push(`Saved page ${page.id}`)
          } else {
            results.push(`Failed page ${page.id}: ${updateError.message}`)
          }
        }
      }
    } else {
      results.push(`No pages or error: ${pagesError?.message || 'OK'}`)
    }
  } catch (e) {
    results.push(`Skipped pages JSONB: ${(e as Error).message}`)
  }

  return NextResponse.json({
    success: true,
    totalControlsChecked: totalChecked,
    fixedInControlsTable: fixedControlsTable,
    fixedInPagesJsonb: fixedPagesJsonb,
    totalFixed: fixedControlsTable + fixedPagesJsonb,
    results,
  })
}
