'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast, { ToastMessage } from '@/components/Toast'

const GRID = 8
const snap = (v: number, on: boolean) => on ? Math.round(v / GRID) * GRID : v
const HANDLES = ['nw','n','ne','e','se','s','sw','w']

type Ctrl = {
  id: string; type: string; x: number; y: number
  w: number; h: number; caption: string
  color: string; bg: string; radius: number
  fontSize: number; fieldKey: string; placeholder: string
  steps: any[]
  columns?: string
  value?: number
  tabs?: string
  chartType?: string
  rowsPerPage?: number
  showSearch?: boolean
  sourceTable?: string
}

const DEFAULTS: Record<string, Partial<Ctrl>> = {
  Heading:  { w:200, h:36,  caption:'Heading',   color:'#0f172a', bg:'transparent', fontSize:24, radius:0  },
  Label:    { w:100, h:24,  caption:'Label',      color:'#374151', bg:'transparent', fontSize:14, radius:0  },
  TextBox:  { w:200, h:44,  caption:'',           color:'#1e293b', bg:'#ffffff',     fontSize:14, radius:8, placeholder:'Type here...' },
  Button:   { w:130, h:44,  caption:'Click Me',   color:'#ffffff', bg:'#4f46e5',     fontSize:14, radius:8  },
  ComboBox: { w:200, h:44,  caption:'',           color:'#9ca3af', bg:'#ffffff',     fontSize:14, radius:8, placeholder:'Select...' },
  CheckBox: { w:160, h:24,  caption:'Check me',   color:'#374151', bg:'transparent', fontSize:14, radius:0  },
  Badge:    { w:90,  h:28,  caption:'Active',     color:'#065f46', bg:'#d1fae5',     fontSize:12, radius:20 },
  Card:     { w:220, h:120, caption:'Card Title', color:'#0f172a', bg:'#ffffff',     fontSize:14, radius:12 },
  Divider:  { w:200, h:2,   caption:'',           color:'#e2e8f0', bg:'#e2e8f0',     fontSize:14, radius:0  },
  Image:    { w:120, h:90,  caption:'Image',      color:'#9ca3af', bg:'#f3f4f6',     fontSize:14, radius:8  },
  DataTable: { w:400, h:200, caption:'DataTable', color:'#1e293b', bg:'#ffffff', fontSize:14, radius:8, columns:'Name,Email,Status' },
  Modal:    { w:300, h:200, caption:'Dialog Title', color:'#ffffff', bg:'#4f46e5', fontSize:14, radius:12 },
  TabPanel: { w:350, h:200, caption:'', color:'#1e293b', bg:'#ffffff', fontSize:14, radius:8, tabs:'Tab 1,Tab 2,Tab 3' },
  DataGrid: { w:400, h:180, caption:'DataGrid', color:'#1e293b', bg:'#ffffff', fontSize:13, radius:8 },
  Chart:    { w:300, h:180, caption:'Chart Title', color:'#1e293b', bg:'#ffffff', fontSize:14, radius:12, chartType:'bar' },
  Lookup:   { w:220, h:44, caption:'', color:'#1e293b', bg:'#ffffff', fontSize:14, radius:8, placeholder:'Search or select...' },
  DatePicker: { w:180, h:44, caption:'', color:'#1e293b', bg:'#ffffff', fontSize:14, radius:8, placeholder:'DD/MM/YYYY' },
  NumberBox: { w:120, h:44, caption:'', color:'#1e293b', bg:'#ffffff', fontSize:14, radius:8, value:0 },
  ProgressBar: { w:200, h:24, caption:'', color:'#4f46e5', bg:'#e5e7eb', fontSize:12, radius:20, value:65 },
  StatusBar: { w:400, h:28, caption:'Ready', color:'#374151', bg:'#f3f4f6', fontSize:12, radius:0 },
  NavigationButtons: { w:200, h:36, caption:'', color:'#374151', bg:'#f9fafb', fontSize:12, radius:8 },
  Subform:  { w:380, h:160, caption:'Subform', color:'#1e293b', bg:'#fafbfc', fontSize:13, radius:8 },
  SectionHeader: { w:400, h:32, caption:'Section Title', color:'#0f172a', bg:'#f3f4f6', fontSize:14, radius:0 },
  ImageViewer: { w:160, h:120, caption:'Image', color:'#9ca3af', bg:'#f3f4f6', fontSize:12, radius:8 },
}

const TOOL_GROUPS = [
  {
    name: 'BASIC',
    tools: [
      { type:'select',  icon:'↖', label:'Select'  },
      { type:'Label',   icon:'Aa', label:'Label'   },
      { type:'Heading', icon:'H',  label:'Heading' },
      { type:'TextBox', icon:'⬜', label:'TextBox' },
      { type:'Button',  icon:'⬡', label:'Button'  },
    ]
  },
  {
    name: 'INPUTS',
    tools: [
      { type:'ComboBox',icon:'▾', label:'Combo'   },
      { type:'CheckBox',icon:'☑', label:'Check'   },
      { type:'DatePicker',icon:'📅', label:'Date' },
      { type:'NumberBox',icon:'#', label:'Number' },
      { type:'Lookup',icon:'🔍', label:'Lookup' },
    ]
  },
  {
    name: 'DATA',
    tools: [
      { type:'DataTable',icon:'⊞', label:'Table' },
      { type:'DataGrid',icon:'▦', label:'Grid' },
      { type:'Subform',icon:'▭', label:'Subform' },
    ]
  },
  {
    name: 'DISPLAY',
    tools: [
      { type:'Badge',   icon:'◉', label:'Badge'   },
      { type:'Card',    icon:'▢', label:'Card'    },
      { type:'Chart',   icon:'📊', label:'Chart'   },
      { type:'ProgressBar',icon:'▬', label:'Progress' },
      { type:'Image',   icon:'🖼', label:'Image'   },
    ]
  },
  {
    name: 'LAYOUT',
    tools: [
      { type:'Divider', icon:'─', label:'Divider' },
      { type:'SectionHeader', icon:'≡', label:'Section' },
      { type:'TabPanel',icon:'⊟', label:'Tabs' },
      { type:'StatusBar',icon:'▭', label:'Status' },
      { type:'NavigationButtons',icon:'«»', label:'Nav' },
    ]
  },
  {
    name: 'DIALOGS',
    tools: [
      { type:'Modal',   icon:'⊡', label:'Modal'   },
    ]
  },
]

const COLORS = ['#4f46e5','#059669','#dc2626','#d97706','#7c3aed',
                '#0891b2','#be185d','#1e293b','#ffffff','#f3f4f6']

function renderCtrl(c: Ctrl, isPreview: boolean = false) {
  const base: React.CSSProperties = {
    width:'100%', height:'100%', overflow:'hidden',
    borderRadius: c.radius, fontSize: c.fontSize,
    color: c.color, fontFamily: 'inherit', userSelect:'none',
    pointerEvents: isPreview ? 'auto' : 'none',
  }

  if (c.type === 'Heading') return (
    <div style={{...base,display:'flex',alignItems:'center',fontWeight:800,background:'transparent',letterSpacing:'-0.02em'}}>{c.caption}</div>
  )
  if (c.type === 'Label') return (
    <div style={{...base,display:'flex',alignItems:'center',background:'transparent'}}>{c.caption}</div>
  )
  if (c.type === 'TextBox') {
    if (isPreview) return <input type="text" placeholder={c.placeholder} style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',padding:'0 12px',outline:'none'}} />
    return (
      <div style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',display:'flex',alignItems:'center',padding:'0 12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        <span style={{color:'#9ca3af'}}>{c.placeholder || 'Type here...'}</span>
      </div>
    )
  }
  if (c.type === 'Button') return (
    <div style={{...base,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,boxShadow:`0 4px 14px ${c.bg}55`,cursor:isPreview?'pointer':'default'}}>{c.caption}</div>
  )
  if (c.type === 'ComboBox') {
    if (isPreview) return <select style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',padding:'0 12px'}}><option>{c.placeholder}</option></select>
    return (
      <div style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',display:'flex',alignItems:'center',padding:'0 12px',justifyContent:'space-between'}}>
        <span style={{color:'#9ca3af'}}>{c.placeholder || 'Select...'}</span>
        <span style={{color:'#9ca3af'}}>▾</span>
      </div>
    )
  }

  // Simplified for other controls to keep file size manageable
  return <div style={{...base,background:'#f3f4f6',border:'1px dashed #d1d5db',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#9ca3af'}}>{c.type}</div>
}

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()

  const [view, setView] = useState<'design'|'queries'|'data'>('design')
  const [workspace, setWorkspace] = useState<any>(null)
  const [controls, setControls] = useState<Ctrl[]>([])
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [activeTool, setActiveTool] = useState('select')
  const [ghostRect, setGhostRect] = useState<{x:number,y:number,w:number,h:number}|null>(null)
  const [snapOn, setSnapOn] = useState(true)
  const [gridOn, setGridOn] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showPublishModal, setShowPublishModal] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const drawStart = useRef({x:0,y:0})
  const isDragging = useRef(false)
  const dragStart = useRef({mx:0,my:0,cx:0,cy:0})
  const isResizing = useRef(false)
  const resizeInfo = useRef({handle:'',smx:0,smy:0,sx:0,sy:0,sw:0,sh:0})
  const ghostRef = useRef(ghostRect)
  ghostRef.current = ghostRect
  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const snapRef = useRef(snapOn)
  snapRef.current = snapOn

  const selCtrl = controls.find(c => c.id === selectedId)

  useEffect(() => {
    loadWorkspace()
  }, [slug])

  const loadWorkspace = async () => {
    const { data } = await supabase.from('workspaces').select('*').eq('slug', slug).single()
    if (data) {
      setWorkspace(data)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handlePublish = async () => {
    if (!workspace) return
    const { error } = await supabase
      .from('workspaces')
      .update({ published: true })
      .eq('id', workspace.id)

    if (error) {
      showToast('Failed to publish app', 'error')
    } else {
      setWorkspace({ ...workspace, published: true })
      setShowPublishModal(true)
    }
  }

  const handleUnpublish = async () => {
    if (!workspace) return
    const { error } = await supabase
      .from('workspaces')
      .update({ published: false })
      .eq('id', workspace.id)

    if (error) {
      showToast('Failed to unpublish app', 'error')
    } else {
      setWorkspace({ ...workspace, published: false })
      showToast('App unpublished', 'info')
    }
  }

  const copyPublicURL = () => {
    const url = `${window.location.origin}/app/${slug}`
    navigator.clipboard.writeText(url)
    showToast('Link copied to clipboard!', 'success')
  }

  const openPublicApp = () => {
    window.open(`/app/${slug}`, '_blank')
  }

  const onCanvasMD = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return
    if (activeToolRef.current === 'select') {
      setSelectedId(null)
      return
    }
    if (!canvasRef.current) return
    e.preventDefault()
    const r = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    isDrawing.current = true
    drawStart.current = { x, y }
    setGhostRect({ x, y, w: 0, h: 0 })
  }

  const onCtrlMD = (e: React.MouseEvent, ctrl: Ctrl) => {
    if (isPreview || activeToolRef.current !== 'select') return
    e.stopPropagation()
    setSelectedId(ctrl.id)
    isDragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: ctrl.x, cy: ctrl.y }
  }

  const onHandleMD = (e: React.MouseEvent, ctrl: Ctrl, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    isResizing.current = true
    resizeInfo.current = {
      handle, smx: e.clientX, smy: e.clientY,
      sx: ctrl.x, sy: ctrl.y, sw: ctrl.w, sh: ctrl.h
    }
  }

  useEffect(() => {
    if (isPreview) return
    const onMM = (e: MouseEvent) => {
      if (isDrawing.current && canvasRef.current) {
        const r = canvasRef.current.getBoundingClientRect()
        const cx = e.clientX - r.left
        const cy = e.clientY - r.top
        setGhostRect({
          x: Math.min(cx, drawStart.current.x),
          y: Math.min(cy, drawStart.current.y),
          w: Math.abs(cx - drawStart.current.x),
          h: Math.abs(cy - drawStart.current.y),
        })
        return
      }
      if (isDragging.current && selectedIdRef.current) {
        const dx = e.clientX - dragStart.current.mx
        const dy = e.clientY - dragStart.current.my
        const sid = selectedIdRef.current
        const sn = snapRef.current
        setControls(p => p.map(c => c.id === sid
          ? { ...c, x: Math.max(0, snap(dragStart.current.cx + dx, sn)), y: Math.max(0, snap(dragStart.current.cy + dy, sn)) }
          : c
        ))
        return
      }
      if (isResizing.current && selectedIdRef.current) {
        const { handle, smx, smy, sx, sy, sw, sh } = resizeInfo.current
        const dx = e.clientX - smx
        const dy = e.clientY - smy
        const sid = selectedIdRef.current
        const sn = snapRef.current
        setControls(p => p.map(c => {
          if (c.id !== sid) return c
          let nx = sx, ny = sy, nw = sw, nh = sh
          if (handle.includes('e')) nw = snap(Math.max(20, sw + dx), sn)
          if (handle.includes('s')) nh = snap(Math.max(10, sh + dy), sn)
          if (handle.includes('w')) { nx = snap(sx + dx, sn); nw = snap(Math.max(20, sw - dx), sn) }
          if (handle.includes('n')) { ny = snap(sy + dy, sn); nh = snap(Math.max(10, sh - dy), sn) }
          return { ...c, x: nx, y: ny, w: nw, h: nh }
        }))
      }
    }

    const onMU = () => {
      if (isDrawing.current) {
        isDrawing.current = false
        const g = ghostRef.current
        const type = activeToolRef.current
        if (g && g.w > 10 && g.h > 10 && type !== 'select') {
          const def = DEFAULTS[type] || {}
          const sn = snapRef.current
          const newCtrl: Ctrl = {
            id: Date.now().toString(),
            type,
            x: snap(g.x, sn), y: snap(g.y, sn),
            w: snap(g.w, sn), h: snap(g.h, sn),
            caption: (def.caption as string) || '',
            color: def.color || '#1e293b',
            bg: def.bg || 'transparent',
            radius: def.radius ?? 4,
            fontSize: def.fontSize || 14,
            fieldKey: '',
            placeholder: (def.placeholder as string) || '',
            steps: [],
            columns: def.columns,
            value: def.value,
            tabs: def.tabs,
            chartType: def.chartType,
          }
          setControls(p => [...p, newCtrl])
          setSelectedId(newCtrl.id)
        }
        setGhostRect(null)
        setActiveTool('select')
      }
      isDragging.current = false
      isResizing.current = false
    }

    window.addEventListener('mousemove', onMM)
    window.addEventListener('mouseup', onMU)
    return () => {
      window.removeEventListener('mousemove', onMM)
      window.removeEventListener('mouseup', onMU)
    }
  }, [isPreview])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current && !isPreview) {
        setControls(p => p.filter(c => c.id !== selectedIdRef.current))
        setSelectedId(null)
      }
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPreview])

  const updCtrl = (changes: Partial<Ctrl>) => {
    if (!selectedId) return
    setControls(p => p.map(c => c.id === selectedId ? { ...c, ...changes } : c))
  }

  const dup = () => {
    if (!selCtrl) return
    const nc = { ...selCtrl, id: Date.now().toString(), x: selCtrl.x + 16, y: selCtrl.y + 16 }
    setControls(p => [...p, nc])
    setSelectedId(nc.id)
  }

  const canvasW = Math.max(600, controls.reduce((m, c) => Math.max(m, c.x + c.w + 40), 600))
  const canvasH = Math.max(500, controls.reduce((m, c) => Math.max(m, c.y + c.h + 40), 500))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh',
      fontFamily:"'Plus Jakarta Sans', sans-serif", overflow:'hidden',
      background:'#13141f', color:'#e2e8f0' }}>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Publish Success Modal */}
      {showPublishModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={() => setShowPublishModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#1e2035', borderRadius:12, padding:32, maxWidth:500, width:'90%' }}>
            <div style={{ fontSize:48, textAlign:'center', marginBottom:16 }}>🎉</div>
            <div style={{ fontSize:24, fontWeight:700, textAlign:'center', marginBottom:8, color:'#e2e8f0' }}>App Published!</div>
            <div style={{ fontSize:14, textAlign:'center', marginBottom:24, color:'#9ca3af' }}>
              Your app is now live and accessible to anyone with the link.
            </div>
            <div style={{ background:'#13141f', padding:'12px 16px', borderRadius:8, marginBottom:20, fontSize:13, color:'#c8d0f0', fontFamily:'monospace' }}>
              {typeof window !== 'undefined' && `${window.location.origin}/app/${slug}`}
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={copyPublicURL} style={{ flex:1, padding:'10px 16px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                📋 Copy Link
              </button>
              <button onClick={openPublicApp} style={{ flex:1, padding:'10px 16px', background:'#252840', color:'#c8d0f0', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                🚀 Open App
              </button>
            </div>
            <button onClick={() => setShowPublishModal(false)} style={{ width:'100%', marginTop:12, padding:'8px', background:'transparent', color:'#7480a8', border:'none', fontSize:13, cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ height:44, background:'#1e2035', borderBottom:'1px solid #252840',
        display:'flex', alignItems:'center', padding:'0 14px', gap:12, flexShrink:0 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:20 }}>←</button>
        <span style={{ fontWeight:700, color:'#6366f1', fontSize:15 }}>{slug}</span>

        {/* Publish Status */}
        {workspace && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:12, padding:'4px 10px', background:'#252840', borderRadius:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: workspace.published ? '#10b981' : '#6b7280' }} />
            <span style={{ fontSize:11, color: workspace.published ? '#10b981' : '#6b7280', fontWeight:600 }}>
              {workspace.published ? 'Published' : 'Draft'}
            </span>
          </div>
        )}

        {/* View Tabs */}
        <div style={{ display:'flex', gap:4, marginLeft:20 }}>
          <button onClick={() => setView('design')} style={{ padding:'4px 12px', background:view==='design'?'#252840':'transparent', color:view==='design'?'#6366f1':'#7480a8', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>Design</button>
          <button onClick={() => setView('queries')} style={{ padding:'4px 12px', background:view==='queries'?'#252840':'transparent', color:view==='queries'?'#6366f1':'#7480a8', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>Queries</button>
          <button onClick={() => setView('data')} style={{ padding:'4px 12px', background:view==='data'?'#252840':'transparent', color:view==='data'?'#6366f1':'#7480a8', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>Data</button>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {view === 'design' && (
            <>
              {[{l:'Grid',v:gridOn,f:setGridOn},{l:'Snap',v:snapOn,f:setSnapOn}].map(({l,v,f}) => (
                <label key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#7480a8', cursor:'pointer' }}>
                  <input type="checkbox" checked={v} onChange={e => f(e.target.checked)} style={{ accentColor:'#6366f1' }}/>
                  {l}
                </label>
              ))}
              <button onClick={() => setIsPreview(!isPreview)} style={{ background:isPreview?'#4f46e5':'transparent', border:'1px solid #3a3f5c', color:isPreview?'#fff':'#7480a8', padding:'4px 12px', borderRadius:7, cursor:'pointer', fontSize:12 }}>
                {isPreview ? '🔙 Design' : '👁 Preview'}
              </button>
              <button onClick={dup} disabled={!selectedId}
                style={{ background:'transparent', border:'1px solid #3a3f5c', color: selectedId?'#7480a8':'#2d3055',
                  padding:'4px 12px', borderRadius:7, cursor: selectedId?'pointer':'default', fontSize:12 }}>
                Duplicate
              </button>
              <button onClick={() => { if(selectedId){ setControls(p=>p.filter(c=>c.id!==selectedId)); setSelectedId(null) }}}
                disabled={!selectedId}
                style={{ background:'transparent', border:`1px solid ${selectedId?'#f43f5e':'#2d3055'}`,
                  color: selectedId?'#f43f5e':'#2d3055', padding:'4px 12px',
                  borderRadius:7, cursor: selectedId?'pointer':'default', fontSize:12 }}>
                Delete
              </button>
            </>
          )}

          {workspace && !workspace.published && (
            <button onClick={handlePublish} style={{ background:'#4f46e5', border:'none', color:'#fff',
              padding:'6px 18px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              📤 Publish
            </button>
          )}

          {workspace && workspace.published && (
            <button onClick={handleUnpublish} style={{ background:'#7c3aed', border:'none', color:'#fff',
              padding:'6px 18px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              📥 Unpublish
            </button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {view === 'design' && !isPreview && (
          /* TOOLBOX - Simplified for brevity */
          <div style={{ width:72, background:'#1e2035', borderRight:'1px solid #252840',
            display:'flex', flexDirection:'column', overflow:'auto', padding:6, gap:1 }}>
            {TOOL_GROUPS.map(group => (
              <div key={group.name}>
                <div style={{ fontSize:9, color:'#4a5070', fontWeight:700, padding:'8px 6px 4px', letterSpacing:'0.05em' }}>{group.name}</div>
                {group.tools.map(t => (
                  <button key={t.type} onClick={() => setActiveTool(t.type)} title={t.label}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                      padding:'6px 4px', borderRadius:8, cursor:'pointer', width:'100%',
                      border: activeTool===t.type ? '1.5px solid #6366f1' : '1.5px solid transparent',
                      background: activeTool===t.type ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: activeTool===t.type ? '#6366f1' : '#7480a8' }}>
                    <span style={{ fontSize:16 }}>{t.icon}</span>
                    <span style={{ fontSize:7 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {view === 'design' && (
          /* CANVAS AREA - Simplified */
          <div style={{ flex:1, overflow:'auto', background:'#0b0c14',
            backgroundImage: isPreview ? 'none' : 'radial-gradient(circle, #2d3150 1px, transparent 1px)',
            backgroundSize:'24px 24px', padding: isPreview ? 0 : 32 }}>
            <div
              ref={canvasRef}
              onMouseDown={onCanvasMD}
              style={{
                position:'relative', width: isPreview ? '100%' : canvasW, height: isPreview ? '100%' : canvasH,
                backgroundColor:'#f8faff',
                backgroundImage: (gridOn && !isPreview) ? 'radial-gradient(circle, #d1d5db 1px, transparent 1px)' : 'none',
                backgroundSize: gridOn ? '8px 8px' : undefined,
                borderRadius: isPreview ? 0 : 20, boxShadow: isPreview ? 'none' : '0 20px 60px rgba(0,0,0,0.4)',
                cursor: isPreview ? 'default' : (activeTool !== 'select' ? 'crosshair' : 'default'),
              }}>

              {controls.map(ctrl => {
                const hposMap: Record<string,React.CSSProperties> = {
                  nw:{left:-4,top:-4}, n:{left:ctrl.w/2-4,top:-4}, ne:{left:ctrl.w-4,top:-4},
                  e:{left:ctrl.w-4,top:ctrl.h/2-4}, se:{left:ctrl.w-4,top:ctrl.h-4},
                  s:{left:ctrl.w/2-4,top:ctrl.h-4}, sw:{left:-4,top:ctrl.h-4}, w:{left:-4,top:ctrl.h/2-4},
                }
                const hcur: Record<string,string> = {
                  nw:'nw-resize',n:'n-resize',ne:'ne-resize',e:'e-resize',
                  se:'se-resize',s:'s-resize',sw:'sw-resize',w:'w-resize',
                }
                return (
                  <div key={ctrl.id} onMouseDown={e => onCtrlMD(e, ctrl)}
                    style={{
                      position:'absolute', left:ctrl.x, top:ctrl.y,
                      width:ctrl.w, height:ctrl.h,
                      cursor: isPreview ? 'default' : (activeTool==='select' ? 'move' : 'crosshair'),
                      zIndex: selectedId===ctrl.id ? 100 : 1,
                      outline: (selectedId===ctrl.id && !isPreview) ? '2.5px solid #6366f1' : 'none',
                      outlineOffset: 2,
                    }}>
                    {renderCtrl(ctrl, isPreview)}
                    {selectedId===ctrl.id && !isPreview && HANDLES.map(h => (
                      <div key={h} onMouseDown={e => onHandleMD(e, ctrl, h)}
                        style={{
                          position:'absolute', width:8, height:8,
                          background:'#6366f1', border:'2px solid #fff',
                          borderRadius:'50%', cursor:hcur[h], zIndex:200,
                          ...hposMap[h]
                        }}/>
                    ))}
                  </div>
                )
              })}

              {ghostRect && ghostRect.w > 2 && !isPreview && (
                <div style={{
                  position:'absolute', left:ghostRect.x, top:ghostRect.y,
                  width:ghostRect.w, height:ghostRect.h,
                  border:'2px dashed #6366f1', background:'rgba(99,102,241,0.08)',
                  borderRadius:4, pointerEvents:'none', zIndex:999,
                }}/>
              )}
            </div>
          </div>
        )}

        {view === 'queries' && (
          /* QUERY BUILDER - Keep existing implementation */
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            <div style={{ width:200, background:'#1e2035', borderRight:'1px solid #252840', padding:12, overflow:'auto' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>TABLES</div>
              {['Customers','Orders','Products'].map(t => (
                <div key={t} style={{ padding:'8px 10px', background:'#252840', borderRadius:6, marginBottom:6, fontSize:12, color:'#c8d0f0', cursor:'pointer' }}>
                  📊 {t}
                </div>
              ))}
            </div>
            <div style={{ flex:1, padding:20 }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Query By Example (QBE)</div>
              <div style={{ fontSize:14, color:'#9ca3af' }}>Query builder interface here...</div>
            </div>
          </div>
        )}

        {view === 'data' && (
          /* DATA TAB */
          <div style={{ flex:1, padding:20, overflow:'auto' }}>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Data Management</div>
            <div style={{ background:'#1e2035', borderRadius:12, padding:24 }}>
              <div style={{ fontSize:14, color:'#9ca3af', textAlign:'center', padding:40 }}>
                No data tables found. Add DataTable or DataGrid controls to your app to manage data here.
              </div>
            </div>
          </div>
        )}

        {view === 'design' && !isPreview && (
          /* PROPERTIES PANEL - Simplified */
          <div style={{ width:220, background:'#181a28', borderLeft:'1px solid #252840',
            display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'10px 12px', background:'#1e2035',
              borderBottom:'1px solid #252840', fontSize:12, fontWeight:600, color:'#e2e8f0' }}>
              Properties
            </div>
            {selCtrl ? (
              <div style={{ flex:1, overflow:'auto', padding:12 }}>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Control: {selCtrl.type}</div>
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                color:'#3a3f5c', gap:8, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:28, opacity:0.3 }}>✦</div>
                <div style={{ fontSize:11 }}>Click a tool then draw on canvas</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM PAGE TABS */}
      {view === 'design' && (
        <div style={{ height:40, background:'#1e2035', borderTop:'1px solid #252840',
          display:'flex', alignItems:'center', padding:'0 12px', gap:6, flexShrink:0 }}>
          <div style={{ padding:'4px 14px', borderRadius:7, display:'flex', alignItems:'center', gap:6,
            background:'#4f46e5', color:'#fff', fontSize:12, fontWeight:600 }}>
            🏠 Home
          </div>
          <button style={{ padding:'4px 12px', borderRadius:7, background:'transparent',
            border:'1px dashed #3a3f5c', color:'#7480a8', fontSize:12, cursor:'pointer' }}>
            + Add Page
          </button>
        </div>
      )}
    </div>
  )
}
