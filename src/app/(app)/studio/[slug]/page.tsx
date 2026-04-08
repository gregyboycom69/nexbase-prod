'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
  if (c.type === 'CheckBox') {
    if (isPreview) return (
      <label style={{...base,display:'flex',alignItems:'center',gap:10,background:'transparent',cursor:'pointer'}}>
        <input type="checkbox" style={{width:20,height:20}}/>
        <span>{c.caption}</span>
      </label>
    )
    return (
      <div style={{...base,display:'flex',alignItems:'center',gap:10,background:'transparent'}}>
        <div style={{width:20,height:20,borderRadius:5,border:'2px solid #d1d5db',background:'#fff',flexShrink:0}}/>
        <span>{c.caption}</span>
      </div>
    )
  }
  if (c.type === 'Badge') return (
    <div style={{...base,background:c.bg,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 12px',fontWeight:600,border:`1.5px solid ${c.color}44`}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:c.color,marginRight:6,flexShrink:0,display:'inline-block'}}/>
      {c.caption}
    </div>
  )
  if (c.type === 'Card') return (
    <div style={{...base,background:c.bg,border:'1px solid #e2e8f0',boxShadow:'0 4px 20px rgba(0,0,0,0.06)',padding:'14px 16px'}}>
      <div style={{fontWeight:700,marginBottom:8,fontSize:12,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.caption}</div>
      <div style={{height:1,background:'#f1f5f9',marginBottom:10}}/>
      <div style={{fontSize:12,color:'#cbd5e1'}}>Content area</div>
    </div>
  )
  if (c.type === 'Divider') return (
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center'}}>
      <div style={{width:'100%',height:2,background:c.bg||'#e2e8f0'}}/>
    </div>
  )
  if (c.type === 'Image') return (
    <div style={{...base,background:c.bg,border:'1.5px dashed #d1d5db',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,color:'#9ca3af'}}>
      <div style={{fontSize:28,opacity:0.3}}>🖼</div>
      <div style={{fontSize:11}}>Image</div>
    </div>
  )

  // NEW CONTROLS
  if (c.type === 'DataTable') {
    const cols = (c.columns || 'Name,Email,Status').split(',')
    return (
      <div style={{...base,background:c.bg,border:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{fontSize:10,color:'#9ca3af',padding:'4px 8px',background:'#fafbfc'}}>DataTable</div>
        <div style={{display:'flex',background:'#4f46e5',color:'#fff',fontWeight:600,fontSize:11}}>
          {cols.map((col,i) => <div key={i} style={{flex:1,padding:'6px 8px',borderRight:i<cols.length-1?'1px solid rgba(255,255,255,0.2)':'none'}}>{ col.trim()} ↕</div>)}
        </div>
        {[0,1,2].map(r => (
          <div key={r} style={{display:'flex',background:r%2===0?'#f8faff':'#fff',fontSize:11,borderBottom:'1px solid #e5e7eb'}}>
            {cols.map((col,i) => <div key={i} style={{flex:1,padding:'6px 8px'}}>---</div>)}
          </div>
        ))}
        <div style={{padding:'6px 8px',borderTop:'1px solid #e5e7eb',fontSize:11,color:'#6366f1',cursor:'pointer'}}>+ Add Row</div>
      </div>
    )
  }

  if (c.type === 'Modal') return (
    <div style={{...base,border:'3px solid rgba(0,0,0,0.1)',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{background:c.bg,color:c.color,padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',fontWeight:600}}>
        <span>{c.caption}</span>
        <span style={{cursor:'pointer'}}>✕</span>
      </div>
      <div style={{flex:1,padding:'12px',fontSize:12,color:'#6b7280'}}>Modal content here</div>
      <div style={{padding:'10px 12px',borderTop:'1px solid #e5e7eb',display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button style={{padding:'4px 12px',background:'#e5e7eb',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Cancel</button>
        <button style={{padding:'4px 12px',background:'#4f46e5',color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>OK</button>
      </div>
    </div>
  )

  if (c.type === 'TabPanel') {
    const tabs = (c.tabs || 'Tab 1,Tab 2,Tab 3').split(',')
    return (
      <div style={{...base,background:c.bg,border:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:'1px solid #e5e7eb'}}>
          {tabs.map((tab,i) => (
            <div key={i} style={{padding:'8px 16px',fontSize:12,fontWeight:i===0?600:400,color:i===0?'#4f46e5':'#6b7280',borderBottom:i===0?'2px solid #4f46e5':'2px solid transparent',cursor:'pointer'}}>{tab.trim()}</div>
          ))}
        </div>
        <div style={{flex:1,padding:'12px',fontSize:12,color:'#6b7280'}}>Tab 1 content</div>
      </div>
    )
  }

  if (c.type === 'DataGrid') return (
    <div style={{...base,background:c.bg,border:'2px solid #a0a0a0',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'flex',background:'#f0f0f0',borderBottom:'1px solid #a0a0a0'}}>
        <div style={{width:30,padding:'4px',textAlign:'center',fontSize:10,fontWeight:600,borderRight:'1px solid #a0a0a0'}}></div>
        <div style={{flex:1,padding:'4px 8px',fontSize:11,fontWeight:600,borderRight:'1px solid #a0a0a0'}}>Field1 📝</div>
        <div style={{flex:1,padding:'4px 8px',fontSize:11,fontWeight:600}}>Field2 🔢</div>
      </div>
      {[1,2,3,4].map(r => (
        <div key={r} style={{display:'flex',background:r===2?'#cfe2ff':'#fff',borderBottom:'1px solid #ddd'}}>
          <div style={{width:30,padding:'4px',textAlign:'center',fontSize:10,background:'#e8e8e8',borderRight:'1px solid #a0a0a0'}}>{r}</div>
          <div style={{flex:1,padding:'4px 8px',fontSize:11,borderRight:'1px solid #ddd'}}>Data {r}</div>
          <div style={{flex:1,padding:'4px 8px',fontSize:11}}>Value {r}</div>
        </div>
      ))}
      <div style={{display:'flex',background:'#fff',borderTop:'1px solid #a0a0a0'}}>
        <div style={{width:30,padding:'4px',textAlign:'center',fontSize:14,background:'#e8e8e8',borderRight:'1px solid #a0a0a0'}}>*</div>
        <div style={{flex:1,padding:'4px 8px',fontSize:11}}></div>
      </div>
    </div>
  )

  if (c.type === 'Chart') {
    const bars = [60,80,45,90,70]
    return (
      <div style={{...base,background:c.bg,border:'1px solid #e2e8f0',padding:'12px',display:'flex',flexDirection:'column'}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>{c.caption}</div>
        <div style={{flex:1,display:'flex',alignItems:'flex-end',gap:8,paddingLeft:20}}>
          {bars.map((h,i) => (
            <div key={i} style={{flex:1,background:`rgba(79,70,229,${0.4+i*0.1})`,height:`${h}%`,borderRadius:'4px 4px 0 0'}}/>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-around',fontSize:9,color:'#9ca3af',marginTop:4}}>
          {['Q1','Q2','Q3','Q4','Q5'].map(l => <span key={l}>{l}</span>)}
        </div>
      </div>
    )
  }

  if (c.type === 'Lookup') {
    if (isPreview) return <input type="text" placeholder={c.placeholder} style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',paddingLeft:36,outline:'none'}} />
    return (
      <div style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',display:'flex',alignItems:'center',position:'relative'}}>
        <span style={{position:'absolute',left:10,fontSize:16,color:'#9ca3af'}}>🔍</span>
        <span style={{flex:1,paddingLeft:36,color:'#9ca3af',fontSize:13}}>{c.placeholder || 'Search or select...'}</span>
        <div style={{width:32,height:'100%',background:'#4f46e5',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:`0 ${c.radius}px ${c.radius}px 0`,fontSize:12}}>▾</div>
      </div>
    )
  }

  if (c.type === 'DatePicker') {
    if (isPreview) return <input type="date" style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',padding:'0 12px',outline:'none'}} />
    return (
      <div style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',display:'flex',alignItems:'center',padding:'0 12px',justifyContent:'space-between'}}>
        <span style={{fontSize:16}}>📅</span>
        <span style={{color:'#9ca3af',fontSize:13}}>{c.placeholder || 'DD/MM/YYYY'}</span>
        <span style={{fontSize:12,color:'#9ca3af'}}>▾</span>
      </div>
    )
  }

  if (c.type === 'NumberBox') {
    if (isPreview) return <input type="number" defaultValue={c.value||0} style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',padding:'0 12px',textAlign:'right',outline:'none'}} />
    return (
      <div style={{...base,background:c.bg,border:'1.5px solid #e2e8f0',display:'flex',alignItems:'center',position:'relative',justifyContent:'flex-end',padding:'0 40px 0 12px'}}>
        <span>{c.value || 0}</span>
        <div style={{position:'absolute',right:0,top:0,bottom:0,width:32,display:'flex',flexDirection:'column',borderLeft:'1px solid #e2e8f0'}}>
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid #e2e8f0',cursor:'pointer',fontSize:10}}>▲</div>
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:10}}>▼</div>
        </div>
      </div>
    )
  }

  if (c.type === 'ProgressBar') {
    const pct = c.value || 65
    return (
      <div style={{...base,background:c.bg,borderRadius:c.radius,display:'flex',alignItems:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${pct}%`,background:c.color,borderRadius:c.radius,transition:'width 0.3s'}}/>
        <span style={{position:'relative',marginLeft:'auto',marginRight:8,fontSize:11,fontWeight:600,color:'#374151'}}>{pct}%</span>
      </div>
    )
  }

  if (c.type === 'StatusBar') return (
    <div style={{...base,background:c.bg,borderTop:'1px solid #d1d5db',display:'flex',alignItems:'center',padding:'0 12px',justifyContent:'space-between',fontSize:11}}>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:'#10b981'}}/>
        <span>{c.caption || 'Ready'}</span>
      </div>
      <div>Record: 1 of 5</div>
      <div style={{display:'flex',gap:4,fontSize:12}}>
        <button style={{border:'1px solid #d1d5db',background:'#fff',padding:'2px 6px',borderRadius:3,cursor:'pointer'}}>|&lt;</button>
        <button style={{border:'1px solid #d1d5db',background:'#fff',padding:'2px 6px',borderRadius:3,cursor:'pointer'}}>&lt;</button>
        <button style={{border:'1px solid #d1d5db',background:'#fff',padding:'2px 6px',borderRadius:3,cursor:'pointer'}}>&gt;</button>
        <button style={{border:'1px solid #d1d5db',background:'#fff',padding:'2px 6px',borderRadius:3,cursor:'pointer'}}>&gt;|</button>
      </div>
    </div>
  )

  if (c.type === 'NavigationButtons') return (
    <div style={{...base,background:c.bg,border:'1px solid #d1d5db',borderRadius:c.radius,display:'flex',alignItems:'center',overflow:'hidden'}}>
      {['|<','<','1','>','>|','+'].map((btn,i) => (
        <div key={i} style={{flex:btn==='1'?1:0,minWidth:btn==='1'?0:28,padding:'6px 8px',textAlign:'center',fontSize:11,borderRight:i<5?'1px solid #d1d5db':'none',cursor:'pointer',background:btn==='+'?'#4f46e5':'transparent',color:btn==='+'?'#fff':'#374151',fontWeight:btn==='1'?600:400}}>{btn}</div>
      ))}
    </div>
  )

  if (c.type === 'Subform') return (
    <div style={{...base,background:c.bg,border:'2px dashed #9ca3af',borderRadius:c.radius,padding:8}}>
      <div style={{fontSize:10,color:'#9ca3af',marginBottom:4}}>{c.caption}</div>
      <div style={{border:'1px solid #d1d5db',borderRadius:4,overflow:'hidden'}}>
        <div style={{display:'flex',background:'#f3f4f6',fontSize:10,fontWeight:600,borderBottom:'1px solid #d1d5db'}}>
          <div style={{flex:1,padding:'4px 8px',borderRight:'1px solid #d1d5db'}}>Column 1</div>
          <div style={{flex:1,padding:'4px 8px'}}>Column 2</div>
        </div>
        {[1,2,3].map(r => (
          <div key={r} style={{display:'flex',fontSize:10,borderBottom:r<3?'1px solid #e5e7eb':'none'}}>
            <div style={{flex:1,padding:'4px 8px',borderRight:'1px solid #e5e7eb'}}>Data {r}</div>
            <div style={{flex:1,padding:'4px 8px'}}>Value {r}</div>
          </div>
        ))}
      </div>
    </div>
  )

  if (c.type === 'SectionHeader') return (
    <div style={{...base,background:c.bg,display:'flex',alignItems:'center',padding:'0 12px',borderBottom:'1px solid #d1d5db'}}>
      <span style={{fontWeight:700,marginRight:12}}>{c.caption}</span>
      <div style={{flex:1,height:1,background:'#d1d5db'}}/>
      <span style={{marginLeft:12,fontSize:14,color:'#9ca3af',cursor:'pointer'}}>▼</span>
    </div>
  )

  if (c.type === 'ImageViewer') return (
    <div style={{...base,background:c.bg,border:'1px solid #d1d5db',borderRadius:c.radius,display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid #d1d5db',background:'#fafafa'}}>
        <span style={{fontSize:36,opacity:0.3}}>🖼</span>
      </div>
      <div style={{display:'flex',gap:4,padding:6,justifyContent:'center'}}>
        {['Browse','Clear','Zoom'].map(btn => (
          <button key={btn} style={{padding:'3px 10px',fontSize:10,background:'#f3f4f6',border:'1px solid #d1d5db',borderRadius:4,cursor:'pointer'}}>{btn}</button>
        ))}
      </div>
    </div>
  )

  return <div style={{...base,background:'#f3f4f6',border:'1px dashed #d1d5db',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#9ca3af'}}>{c.type}</div>
}

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [view, setView] = useState<'design'|'queries'>('design')
  const [controls, setControls] = useState<Ctrl[]>([])
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [activeTool, setActiveTool] = useState('select')
  const [ghostRect, setGhostRect] = useState<{x:number,y:number,w:number,h:number}|null>(null)
  const [snapOn, setSnapOn] = useState(true)
  const [gridOn, setGridOn] = useState(true)
  const [isPreview, setIsPreview] = useState(false)

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

      {/* TOP BAR */}
      <div style={{ height:44, background:'#1e2035', borderBottom:'1px solid #252840',
        display:'flex', alignItems:'center', padding:'0 14px', gap:12, flexShrink:0 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:20 }}>←</button>
        <span style={{ fontWeight:700, color:'#6366f1', fontSize:15 }}>{slug}</span>

        {/* View Tabs */}
        <div style={{ display:'flex', gap:4, marginLeft:20 }}>
          <button onClick={() => setView('design')} style={{ padding:'4px 12px', background:view==='design'?'#252840':'transparent', color:view==='design'?'#6366f1':'#7480a8', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>Design</button>
          <button onClick={() => setView('queries')} style={{ padding:'4px 12px', background:view==='queries'?'#252840':'transparent', color:view==='queries'?'#6366f1':'#7480a8', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>Queries</button>
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
          <button style={{ background:'#4f46e5', border:'none', color:'#fff',
            padding:'6px 18px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            Publish
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {view === 'design' && !isPreview && (
          /* TOOLBOX */
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
          /* CANVAS AREA */
          <div style={{ flex:1, overflow:'auto', background:'#0b0c14',
            backgroundImage: isPreview ? 'none' : 'radial-gradient(circle, #2d3150 1px, transparent 1px)',
            backgroundSize:'24px 24px', padding: isPreview ? 0 : 32 }}>
            <div
              ref={canvasRef}
              onMouseDown={onCanvasMD}
              style={{
                position:'relative', width: isPreview ? '100%' : canvasW, height: isPreview ? '100%' : canvasH, flexShrink:0,
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
                      width:ctrl.w, height:ctrl.h, borderRadius:ctrl.radius,
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
          /* QUERY BUILDER */
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* Left: Tables */}
            <div style={{ width:200, background:'#1e2035', borderRight:'1px solid #252840', padding:12, overflow:'auto' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>TABLES</div>
              {['Customers','Orders','Products'].map(t => (
                <div key={t} style={{ padding:'8px 10px', background:'#252840', borderRadius:6, marginBottom:6, fontSize:12, color:'#c8d0f0', cursor:'pointer' }}>
                  📊 {t}
                </div>
              ))}
            </div>

            {/* Center: QBE Grid */}
            <div style={{ flex:1, padding:20, overflow:'auto' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Query By Example (QBE)</div>
              <div style={{ border:'1px solid #252840', borderRadius:8, overflow:'hidden', background:'#1e2035' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', background:'#252840', fontSize:11, fontWeight:600 }}>
                  {['Field','Table','Sort','Show','Criteria','Or'].map(h => (
                    <div key={h} style={{ padding:'8px 10px', borderRight:'1px solid #3a3f5c' }}>{h}</div>
                  ))}
                </div>
                {[1,2,3].map(r => (
                  <div key={r} style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', fontSize:11, borderTop:'1px solid #252840' }}>
                    <input placeholder="Field name" style={{ padding:'8px 10px', background:'#13141f', border:'none', borderRight:'1px solid #252840', color:'#c8d0f0', outline:'none' }} />
                    <input placeholder="Table" style={{ padding:'8px 10px', background:'#13141f', border:'none', borderRight:'1px solid #252840', color:'#c8d0f0', outline:'none' }} />
                    <select style={{ padding:'8px 10px', background:'#13141f', border:'none', borderRight:'1px solid #252840', color:'#c8d0f0', outline:'none' }}>
                      <option>None</option>
                      <option>Ascending</option>
                      <option>Descending</option>
                    </select>
                    <div style={{ padding:'8px 10px', borderRight:'1px solid #252840', display:'flex', justifyContent:'center' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor:'#6366f1' }} />
                    </div>
                    <input placeholder="= value" style={{ padding:'8px 10px', background:'#13141f', border:'none', borderRight:'1px solid #252840', color:'#c8d0f0', outline:'none' }} />
                    <input placeholder="or" style={{ padding:'8px 10px', background:'#13141f', border:'none', color:'#c8d0f0', outline:'none' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button style={{ padding:'8px 20px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>▶ Run Query</button>
                <button style={{ padding:'8px 20px', background:'#252840', color:'#c8d0f0', border:'none', borderRadius:8, fontSize:13, cursor:'pointer' }}>💾 Save</button>
                <button style={{ padding:'8px 20px', background:'transparent', color:'#7480a8', border:'1px solid #3a3f5c', borderRadius:8, fontSize:13, cursor:'pointer' }}>Clear</button>
              </div>
            </div>

            {/* Right: Properties */}
            <div style={{ width:200, background:'#1e2035', borderLeft:'1px solid #252840', padding:12, overflow:'auto' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>QUERY PROPERTIES</div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, color:'#7480a8', display:'block', marginBottom:4 }}>Query Name</label>
                <input placeholder="MyQuery" style={{ width:'100%', padding:'6px 8px', background:'#13141f', border:'1px solid #252840', borderRadius:6, color:'#c8d0f0', fontSize:12, outline:'none' }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, color:'#7480a8', display:'block', marginBottom:4 }}>Query Type</label>
                <select style={{ width:'100%', padding:'6px 8px', background:'#13141f', border:'1px solid #252840', borderRadius:6, color:'#c8d0f0', fontSize:12, outline:'none' }}>
                  <option>Select</option>
                  <option>Insert</option>
                  <option>Update</option>
                  <option>Delete</option>
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, color:'#7480a8', display:'block', marginBottom:4 }}>Top N Records</label>
                <input type="number" placeholder="All" style={{ width:'100%', padding:'6px 8px', background:'#13141f', border:'1px solid #252840', borderRadius:6, color:'#c8d0f0', fontSize:12, outline:'none' }} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#c8d0f0', cursor:'pointer' }}>
                <input type="checkbox" style={{ accentColor:'#6366f1' }} />
                Unique values only
              </label>
            </div>
          </div>
        )}

        {view === 'design' && !isPreview && (
          /* PROPERTIES PANEL */
          <div style={{ width:220, background:'#181a28', borderLeft:'1px solid #252840',
            display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'10px 12px', background:'#1e2035',
              borderBottom:'1px solid #252840', fontSize:12, fontWeight:600, color:'#e2e8f0' }}>
              Properties
            </div>
            {selCtrl ? (
              <div style={{ flex:1, overflow:'auto' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                  {(['x','y','w','h'] as (keyof Ctrl)[]).map((k,i) => (
                    <div key={k} style={{ padding:'5px 8px', borderRight:'1px solid #252840',
                      borderBottom:'1px solid #252840', display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ fontSize:10, color:'#4a5070', width:12 }}>{k.toUpperCase()}</span>
                      <input type="number" value={selCtrl[k] as number}
                        onChange={e => updCtrl({[k]:Number(e.target.value)})}
                        style={{ flex:1, background:'#0b0c14', border:'none', color:'#c8d0f0',
                          fontSize:11, padding:'2px 4px', borderRadius:4, width:0, minWidth:0 }}/>
                    </div>
                  ))}
                </div>
                {[{l:'Caption',k:'caption'},{l:'Placeholder',k:'placeholder'},{l:'Field Key',k:'fieldKey'}].map(({l,k}) => (
                  <div key={k} style={{ padding:'5px 10px', borderBottom:'1px solid #252840',
                    display:'grid', gridTemplateColumns:'70px 1fr', gap:5, alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'#5a6080' }}>{l}</span>
                    <input value={(selCtrl as any)[k]||''}
                      onChange={e => updCtrl({[k]:e.target.value})}
                      style={{ background:'#0b0c14', border:'1px solid #252840',
                        borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}/>
                  </div>
                ))}
                {[{l:'Font Size',k:'fontSize'},{l:'Radius',k:'radius'}].map(({l,k}) => (
                  <div key={k} style={{ padding:'5px 10px', borderBottom:'1px solid #252840',
                    display:'grid', gridTemplateColumns:'70px 1fr', gap:5, alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'#5a6080' }}>{l}</span>
                    <input type="number" value={(selCtrl as any)[k]||0}
                      onChange={e => updCtrl({[k]:Number(e.target.value)})}
                      style={{ background:'#0b0c14', border:'1px solid #252840',
                        borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}/>
                  </div>
                ))}

                {/* DataTable specific */}
                {selCtrl.type === 'DataTable' && (
                  <>
                    <div style={{ padding:'5px 10px', borderBottom:'1px solid #252840' }}>
                      <span style={{ fontSize:10, color:'#5a6080', display:'block', marginBottom:4 }}>Columns (comma separated)</span>
                      <input value={selCtrl.columns||''} onChange={e => updCtrl({columns:e.target.value})}
                        style={{ width:'100%', background:'#0b0c14', border:'1px solid #252840', borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}/>
                    </div>
                    <div style={{ padding:'5px 10px', borderBottom:'1px solid #252840' }}>
                      <span style={{ fontSize:10, color:'#5a6080', display:'block', marginBottom:4 }}>Source Table</span>
                      <input value={selCtrl.sourceTable||''} onChange={e => updCtrl({sourceTable:e.target.value})} placeholder="table_name"
                        style={{ width:'100%', background:'#0b0c14', border:'1px solid #252840', borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}/>
                    </div>
                  </>
                )}

                {/* Chart specific */}
                {selCtrl.type === 'Chart' && (
                  <div style={{ padding:'5px 10px', borderBottom:'1px solid #252840' }}>
                    <span style={{ fontSize:10, color:'#5a6080', display:'block', marginBottom:4 }}>Chart Type</span>
                    <select value={selCtrl.chartType||'bar'} onChange={e => updCtrl({chartType:e.target.value})}
                      style={{ width:'100%', background:'#0b0c14', border:'1px solid #252840', borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}>
                      <option value="bar">Bar</option>
                      <option value="line">Line</option>
                      <option value="pie">Pie</option>
                      <option value="donut">Donut</option>
                    </select>
                  </div>
                )}

                {/* TabPanel specific */}
                {selCtrl.type === 'TabPanel' && (
                  <div style={{ padding:'5px 10px', borderBottom:'1px solid #252840' }}>
                    <span style={{ fontSize:10, color:'#5a6080', display:'block', marginBottom:4 }}>Tabs (comma separated)</span>
                    <input value={selCtrl.tabs||''} onChange={e => updCtrl({tabs:e.target.value})}
                      style={{ width:'100%', background:'#0b0c14', border:'1px solid #252840', borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}/>
                  </div>
                )}

                {/* ProgressBar specific */}
                {selCtrl.type === 'ProgressBar' && (
                  <div style={{ padding:'5px 10px', borderBottom:'1px solid #252840' }}>
                    <span style={{ fontSize:10, color:'#5a6080', display:'block', marginBottom:4 }}>Value (0-100)</span>
                    <input type="number" min="0" max="100" value={selCtrl.value||0} onChange={e => updCtrl({value:Number(e.target.value)})}
                      style={{ width:'100%', background:'#0b0c14', border:'1px solid #252840', borderRadius:5, padding:'3px 6px', color:'#c8d0f0', fontSize:12 }}/>
                  </div>
                )}

                <div style={{ padding:'8px 10px', borderBottom:'1px solid #252840' }}>
                  <div style={{ fontSize:10, color:'#5a6080', marginBottom:6 }}>BG Color</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {COLORS.map(c => (
                      <div key={c} onClick={() => updCtrl({bg:c})}
                        style={{ width:18, height:18, borderRadius:'50%', background:c, cursor:'pointer',
                          border:`2px solid ${selCtrl.bg===c?'#fff':'transparent'}`,
                          boxShadow: selCtrl.bg===c?'0 0 0 1px #6366f1':'none',
                          outline: c==='#ffffff'?'1px solid #aaa':'none' }}/>
                    ))}
                  </div>
                </div>
                <div style={{ padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'#5a6080', marginBottom:6 }}>Text Color</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {COLORS.map(c => (
                      <div key={c} onClick={() => updCtrl({color:c})}
                        style={{ width:18, height:18, borderRadius:'50%', background:c, cursor:'pointer',
                          border:`2px solid ${selCtrl.color===c?'#fff':'transparent'}`,
                          boxShadow: selCtrl.color===c?'0 0 0 1px #6366f1':'none',
                          outline: c==='#ffffff'?'1px solid #aaa':'none' }}/>
                    ))}
                  </div>
                </div>
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
