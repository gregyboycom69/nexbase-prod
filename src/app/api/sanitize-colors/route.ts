import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BAD_COLORS = [
  '#7f1d1d', '#991b1b', '#450a0a', '#1f1d1d',
  '#2d1d1d', '#3d1d1d', '#181818', '#000000'
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
  const c = hex.replace('#', '')
  const r = parseInt(c.substr(0, 2), 16)
  const g = parseInt(c.substr(2, 2), 16)
  const b = parseInt(c.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

export async function GET() {
  const supabase = await createClient()

  const { data: controls, error } = await supabase
    .from('controls')
    .select('id, type, props')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let fixedCount = 0
  const results: string[] = []

  for (const ctrl of controls || []) {
    let modified = false
    const newProps = { ...(ctrl.props || {}) }

    if (BAD_COLORS.includes((newProps.bg || '').toLowerCase())) {
      newProps.bg = DEFAULT_BG[ctrl.type] || '#ffffff'
      modified = true
      results.push(`Fixed bad bg color for ${ctrl.type} control ${ctrl.id}`)
    }

    if (BAD_COLORS.includes((newProps.color || '').toLowerCase())) {
      newProps.color = DEFAULT_COLOR[ctrl.type] || '#1e293b'
      modified = true
      results.push(`Fixed bad text color for ${ctrl.type} control ${ctrl.id}`)
    }

    // Fix button contrast - if button has light bg, use dark text
    if (ctrl.type === 'Button') {
      const bg = newProps.bg || '#4f46e5'
      const isLightBg = isLightColor(bg)
      if (isLightBg && (!newProps.color || newProps.color === '#ffffff')) {
        newProps.color = '#1e293b'
        modified = true
        results.push(`Fixed button contrast for control ${ctrl.id}`)
      }
    }

    if (modified) {
      const { error: updateError } = await supabase
        .from('controls')
        .update({ props: newProps })
        .eq('id', ctrl.id)

      if (!updateError) {
        fixedCount++
        results.push(`✓ Fixed control ${ctrl.id}`)
      } else {
        results.push(`✗ Failed to update control ${ctrl.id}: ${updateError.message}`)
      }
    }
  }

  return NextResponse.json({
    success: true,
    fixedCount,
    totalControls: controls?.length || 0,
    results
  })
}

      const newProps = { ...(ctrl.props || {}) }

      if (BAD_COLORS.includes((newProps.bg || '').toLowerCase())) {
        newProps.bg = DEFAULT_BG[ctrl.type] || '#ffffff'
        modified = true
        results.push(`Fixed bad bg color for ${ctrl.type} on page ${page.id}`)
      }

      if (BAD_COLORS.includes((newProps.color || '').toLowerCase())) {
        newProps.color = DEFAULT_COLOR[ctrl.type] || '#1e293b'
        modified = true
        results.push(`Fixed bad text color for ${ctrl.type} on page ${page.id}`)
      }

      // Fix button contrast - if button has light bg, use dark text
      if (ctrl.type === 'Button') {
        const bg = newProps.bg || '#4f46e5'
        const isLightBg = isLightColor(bg)
        if (isLightBg && (!newProps.color || newProps.color === '#ffffff')) {
          newProps.color = '#1e293b'
          modified = true
          results.push(`Fixed button contrast on page ${page.id}`)
        }
      }

      return modified ? { ...ctrl, props: newProps } : ctrl
    })

    if (modified) {
      const { error: updateError } = await supabase
        .from('pages')
        .update({ controls: newControls })
        .eq('id', page.id)

      if (!updateError) {
        fixedCount++
        results.push(`✓ Fixed page ${page.id}`)
      } else {
        results.push(`✗ Failed to update page ${page.id}: ${updateError.message}`)
      }
    }
  }

  return NextResponse.json({
    success: true,
    fixedCount,
    totalPages: pages?.length || 0,
    results
  })
}
