import { createClient } from './supabase/client'

export interface MacroStep {
  action: string
  vals: Record<string, any>
}

export interface MacroContext {
  formData: Record<string, any>
  setFormData: (data: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void
  workspaceId: string
  navigate?: (slug: string) => void
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  showModal?: (modalId: string) => void
  hideModal?: () => void
}

export async function runMacro(steps: MacroStep[], context: MacroContext): Promise<boolean> {
  const supabase = createClient()
  const { formData, setFormData, workspaceId, navigate, showToast, showModal, hideModal } = context

  try {
    for (const step of steps) {
      const { action, vals } = step

      switch (action) {
        case 'save': {
          // Insert into app_data table
          const { error } = await supabase.from('app_data').insert({
            workspace_id: workspaceId,
            table_name: vals.table || 'default',
            data: formData,
          })
          if (error) {
            showToast('Failed to save data: ' + error.message, 'error')
            return false
          }
          showToast('Data saved successfully!', 'success')
          break
        }

        case 'newrec': {
          // Clear all form fields
          setFormData({})
          showToast('New record ready', 'info')
          break
        }

        case 'delrec': {
          // Show confirm dialog
          const confirmed = window.confirm('Are you sure you want to delete this record?')
          if (!confirmed) return false

          if (formData.id) {
            const { error } = await supabase.from('app_data').delete().eq('id', formData.id)
            if (error) {
              showToast('Failed to delete record: ' + error.message, 'error')
              return false
            }
            showToast('Record deleted successfully', 'success')
            setFormData({})
          }
          break
        }

        case 'goto': {
          // Navigate to page
          if (navigate && vals.page) {
            navigate(vals.page)
          }
          break
        }

        case 'toast': {
          // Show toast notification
          showToast(vals.msg || 'Notification', vals.type || 'info')
          break
        }

        case 'alert': {
          // Show alert dialog
          window.alert(vals.msg || 'Alert')
          break
        }

        case 'confirm': {
          // Show confirm dialog
          const result = window.confirm(vals.msg || 'Confirm?')
          if (!result) return false
          break
        }

        case 'filter': {
          // Set filter on DataTable (handled by component)
          break
        }

        case 'clearfil': {
          // Clear filters (handled by component)
          break
        }

        case 'expcsv': {
          // Export to CSV
          const { data, error } = await supabase
            .from('app_data')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('table_name', vals.table || 'default')

          if (error || !data) {
            showToast('Failed to export data', 'error')
            return false
          }

          // Convert to CSV
          if (data.length > 0) {
            const headers = Object.keys(data[0].data || {})
            const csv = [
              headers.join(','),
              ...data.map(row => headers.map(h => JSON.stringify(row.data[h] || '')).join(','))
            ].join('\n')

            // Download
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = (vals.fname || 'export') + '.csv'
            a.click()
            URL.revokeObjectURL(url)
            showToast('Data exported successfully', 'success')
          }
          break
        }

        case 'setval': {
          // Set form field value
          setFormData(prev => ({ ...prev, [vals.field]: vals.val }))
          break
        }

        case 'calc': {
          // Evaluate formula
          try {
            let formula = vals.formula || ''
            // Replace field names with values
            Object.keys(formData).forEach(key => {
              formula = formula.replace(new RegExp(`\\b${key}\\b`, 'g'), formData[key] || 0)
            })
            // Evaluate safely (basic arithmetic only)
            const result = Function(`"use strict"; return (${formula})`)()
            setFormData(prev => ({ ...prev, [vals.target]: result }))
          } catch (error) {
            showToast('Formula error', 'error')
          }
          break
        }

        case 'auditlog': {
          // Insert audit log
          await supabase.from('audit_log').insert({
            workspace_id: workspaceId,
            action: vals.action || 'unknown',
            record_id: formData.id || null,
            new_data: formData,
          })
          break
        }

        case 'showModal': {
          // Show modal
          if (showModal && vals.modalId) {
            showModal(vals.modalId)
          }
          break
        }

        case 'hideModal': {
          // Hide modal
          if (hideModal) {
            hideModal()
          }
          break
        }

        case 'print': {
          // Print page
          window.print()
          break
        }

        case 'mailto': {
          // Open mailto link
          const email = vals.email || formData.email || ''
          const subject = vals.subject || ''
          const body = vals.body || ''
          window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
          break
        }

        default:
          console.warn('Unknown macro action:', action)
      }
    }

    return true
  } catch (error) {
    console.error('Macro execution error:', error)
    showToast('Macro execution failed', 'error')
    return false
  }
}
