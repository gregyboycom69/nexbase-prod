'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const TOOLS = [
  { type: 'select', icon: '↖', label: 'Select', defaultW: 0, defaultH: 0 },
  { type: 'heading', icon: 'H', label: 'Heading', defaultW: 200, defaultH: 40 },
  { type: 'label', icon: 'L', label: 'Label', defaultW: 120, defaultH: 24 },
  { type: 'textbox', icon: '□', label: 'TextBox', defaultW: 200, defaultH: 40 },
  { type: 'button', icon: '▭', label: 'Button', defaultW: 120, defaultH: 40 },
  { type: 'combobox', icon: '▼', label: 'ComboBox', defaultW: 200, defaultH: 40 },
  { type: 'checkbox', icon: '☐', label: 'CheckBox', defaultW: 150, defaultH: 24 },
  { type: 'badge', icon: '●', label: 'Badge', defaultW: 100, defaultH: 28 },
  { type: 'card', icon: '▢', label: 'Card', defaultW: 300, defaultH: 200 },
  { type: 'divider', icon: '─', label: 'Divider', defaultW: 300, defaultH: 1 },
  { type: 'image', icon: '🖼', label: 'Image', defaultW: 200, defaultH: 150 },
];

export default function StudioPage({ params }: any) {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [workspaceId, setWorkspaceId] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [pages, setPages] = useState<any[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [controls, setControls] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState('select');
  const [ghostRect, setGhostRect] = useState<any>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapGrid, setSnapGrid] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const drawStart = useRef<any>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<any>(null);
  const isResizing = useRef(false);
  const resizeInfo = useRef<any>(null);

  // Snap function
  const snap = (v: number) => (snapGrid ? Math.round(v / 8) * 8 : v);

  // Load workspace and pages
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const slug = resolvedParams.slug;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('slug', slug)
        .eq('owner_id', user.id)
        .single();

      if (!workspace) {
        router.push('/dashboard');
        return;
      }

      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name);

      const { data: pagesData } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('display_order', { ascending: true });

      if (pagesData && pagesData.length > 0) {
        setPages(pagesData);
        setCurrentPageId(pagesData[0].id);
      } else {
        // Create default page
        const { data: newPage } = await supabase
          .from('pages')
          .insert({
            workspace_id: workspace.id,
            name: 'Home',
            slug: 'home',
            is_home: true,
            display_order: 0,
          })
          .select()
          .single();

        if (newPage) {
          setPages([newPage]);
          setCurrentPageId(newPage.id);
        }
      }
    };

    loadData();
  }, []);

  // Load controls when page changes
  useEffect(() => {
    if (!currentPageId) return;

    const loadControls = async () => {
      const { data } = await supabase
        .from('controls')
        .select('*')
        .eq('page_id', currentPageId)
        .order('display_order', { ascending: true });

      if (data) {
        setControls(data);
      }
    };

    loadControls();
  }, [currentPageId]);

  // Canvas mousedown
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    if (activeTool === 'select') {
      setSelectedId(null);
      return;
    }

    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    isDrawing.current = true;
    drawStart.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setGhostRect({ x: drawStart.current.x, y: drawStart.current.y, w: 0, h: 0 });
  };

  // Control mousedown (for moving)
  const onControlMouseDown = (e: React.MouseEvent, ctrl: any) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedId(ctrl.id);
    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      ctrlX: ctrl.x,
      ctrlY: ctrl.y,
    };
  };

  // Handle mousedown (for resizing)
  const onHandleMouseDown = (e: React.MouseEvent, ctrl: any, handle: string) => {
    e.stopPropagation();
    isResizing.current = true;
    resizeInfo.current = {
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: ctrl.x,
      startY: ctrl.y,
      startW: ctrl.w,
      startH: ctrl.h,
      ctrlId: ctrl.id,
    };
  };

  // Window mousemove and mouseup
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Drawing
      if (isDrawing.current && canvasRef.current && drawStart.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const x = Math.min(currentX, drawStart.current.x);
        const y = Math.min(currentY, drawStart.current.y);
        const w = Math.abs(currentX - drawStart.current.x);
        const h = Math.abs(currentY - drawStart.current.y);
        setGhostRect({ x, y, w, h });
      }

      // Dragging
      if (isDragging.current && selectedId && dragStart.current) {
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;
        const newX = snap(dragStart.current.ctrlX + dx);
        const newY = snap(dragStart.current.ctrlY + dy);

        setControls((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, x: newX, y: newY } : c))
        );
      }

      // Resizing
      if (isResizing.current && resizeInfo.current) {
        const dx = e.clientX - resizeInfo.current.startMouseX;
        const dy = e.clientY - resizeInfo.current.startMouseY;
        const handle = resizeInfo.current.handle;

        let newX = resizeInfo.current.startX;
        let newY = resizeInfo.current.startY;
        let newW = resizeInfo.current.startW;
        let newH = resizeInfo.current.startH;

        if (handle.includes('e')) newW = Math.max(20, resizeInfo.current.startW + dx);
        if (handle.includes('w')) {
          newW = Math.max(20, resizeInfo.current.startW - dx);
          newX = resizeInfo.current.startX + dx;
        }
        if (handle.includes('s')) newH = Math.max(20, resizeInfo.current.startH + dy);
        if (handle.includes('n')) {
          newH = Math.max(20, resizeInfo.current.startH - dy);
          newY = resizeInfo.current.startY + dy;
        }

        setControls((prev) =>
          prev.map((c) =>
            c.id === resizeInfo.current.ctrlId
              ? { ...c, x: snap(newX), y: snap(newY), w: snap(newW), h: snap(newH) }
              : c
          )
        );
      }
    };

    const onMouseUp = async (e: MouseEvent) => {
      // Finish drawing
      if (isDrawing.current && ghostRect && currentPageId) {
        isDrawing.current = false;
        if (ghostRect.w > 10 && ghostRect.h > 10) {
          const tool = TOOLS.find((t) => t.type === activeTool);
          if (tool) {
            const newControl = {
              page_id: currentPageId,
              control_type: activeTool,
              x: snap(ghostRect.x),
              y: snap(ghostRect.y),
              w: snap(Math.max(ghostRect.w, tool.defaultW)),
              h: snap(Math.max(ghostRect.h, tool.defaultH)),
              props: {
                caption: tool.label,
                backgroundColor: activeTool === 'button' ? '#4f46e5' : 'transparent',
                textColor: activeTool === 'button' ? '#fff' : '#000',
                borderRadius: activeTool === 'button' ? 6 : 0,
                fontSize: activeTool === 'heading' ? 24 : 14,
                bold: activeTool === 'heading',
              },
              macro_steps: [],
              display_order: controls.length,
            };

            const { data } = await supabase.from('controls').insert(newControl).select().single();

            if (data) {
              setControls([...controls, data]);
              setSelectedId(data.id);
            }
          }
        }
        setGhostRect(null);
        setActiveTool('select');
      }

      // Finish dragging
      if (isDragging.current && selectedId) {
        const ctrl = controls.find((c) => c.id === selectedId);
        if (ctrl) {
          await supabase.from('controls').update({ x: ctrl.x, y: ctrl.y }).eq('id', selectedId);
        }
        isDragging.current = false;
        dragStart.current = null;
      }

      // Finish resizing
      if (isResizing.current && resizeInfo.current) {
        const ctrl = controls.find((c) => c.id === resizeInfo.current.ctrlId);
        if (ctrl) {
          await supabase
            .from('controls')
            .update({ x: ctrl.x, y: ctrl.y, w: ctrl.w, h: ctrl.h })
            .eq('id', ctrl.id);
        }
        isResizing.current = false;
        resizeInfo.current = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [ghostRect, selectedId, controls, currentPageId, activeTool, snapGrid]);

  // Delete key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId && !isPreview) {
        supabase.from('controls').delete().eq('id', selectedId);
        setControls((prev) => prev.filter((c) => c.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, isPreview]);

  const selectedControl = controls.find((c) => c.id === selectedId);

  const updateProp = async (key: string, value: any) => {
    if (!selectedId) return;
    const ctrl = controls.find((c) => c.id === selectedId);
    if (!ctrl) return;

    const newProps = { ...ctrl.props, [key]: value };
    setControls((prev) => prev.map((c) => (c.id === selectedId ? { ...c, props: newProps } : c)));
    await supabase.from('controls').update({ props: newProps }).eq('id', selectedId);
  };

  const updatePosition = async (updates: any) => {
    if (!selectedId) return;
    setControls((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...updates } : c)));
    await supabase.from('controls').update(updates).eq('id', selectedId);
  };

  const renderControl = (ctrl: any) => {
    const props = ctrl.props || {};
    const style: any = {
      position: 'absolute',
      left: ctrl.x,
      top: ctrl.y,
      width: ctrl.w,
      height: ctrl.h,
      backgroundColor: props.backgroundColor || 'transparent',
      color: props.textColor || '#000',
      borderRadius: props.borderRadius || 0,
      fontSize: props.fontSize || 14,
      fontWeight: props.bold ? 'bold' : 'normal',
      cursor: activeTool === 'select' ? 'move' : 'default',
    };

    let content = null;

    switch (ctrl.control_type) {
      case 'label':
        content = <div style={{ ...style, display: 'flex', alignItems: 'center', padding: '0 8px' }}>{props.caption || 'Label'}</div>;
        break;
      case 'heading':
        content = <h2 style={{ ...style, fontSize: 24, fontWeight: 'bold', display: 'flex', alignItems: 'center', padding: '0 8px', margin: 0 }}>{props.caption || 'Heading'}</h2>;
        break;
      case 'textbox':
        content = isPreview ? (
          <input type="text" placeholder={props.placeholder} style={{ ...style, backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 12px' }} />
        ) : (
          <div style={{ ...style, backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af' }}>{props.placeholder || 'TextBox'}</span>
          </div>
        );
        break;
      case 'button':
        content = (
          <button type="button" style={{ ...style, backgroundColor: props.backgroundColor || '#4f46e5', color: props.textColor || '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>
            {props.caption || 'Button'}
          </button>
        );
        break;
      case 'combobox':
        content = isPreview ? (
          <select style={{ ...style, backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 12px' }}>
            <option>{props.placeholder || 'Select...'}</option>
          </select>
        ) : (
          <div style={{ ...style, backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#9ca3af' }}>{props.placeholder || 'ComboBox'}</span>
            <span>▼</span>
          </div>
        );
        break;
      case 'checkbox':
        content = (
          <label style={{ ...style, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" disabled={!isPreview} />
            <span>{props.caption || 'CheckBox'}</span>
          </label>
        );
        break;
      case 'badge':
        content = (
          <div style={{ ...style, backgroundColor: props.backgroundColor || '#e0e7ff', color: props.textColor || '#4f46e5', borderRadius: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', minWidth: ctrl.w }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{props.caption || 'Badge'}</span>
          </div>
        );
        break;
      case 'card':
        content = (
          <div style={{ ...style, backgroundColor: props.backgroundColor || '#fff', border: '1px solid #e5e7eb', borderRadius: props.borderRadius || 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 8, margin: 0 }}>{props.caption || 'Card Title'}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Card content</p>
          </div>
        );
        break;
      case 'divider':
        content = <div style={{ ...style, backgroundColor: props.backgroundColor || '#e5e7eb', height: 1 }} />;
        break;
      case 'image':
        content = (
          <div style={{ ...style, backgroundColor: props.backgroundColor || '#f3f4f6', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 48 }}>🖼</span>
          </div>
        );
        break;
      default:
        content = <div style={style}>{ctrl.control_type}</div>;
    }

    return (
      <div key={ctrl.id} onMouseDown={(e) => onControlMouseDown(e, ctrl)} style={{ position: 'absolute', left: ctrl.x, top: ctrl.y }}>
        {content}
        {ctrl.id === selectedId && !isPreview && (
          <>
            {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((handle) => (
              <div
                key={handle}
                onMouseDown={(e) => onHandleMouseDown(e, ctrl, handle)}
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  backgroundColor: '#4f46e5',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                  cursor: `${handle}-resize`,
                  top: handle.includes('n') ? -6 : handle.includes('s') ? ctrl.h - 6 : ctrl.h / 2 - 6,
                  left: handle.includes('w') ? -6 : handle.includes('e') ? ctrl.w - 6 : ctrl.w / 2 - 6,
                }}
              />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#13141f', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Bar */}
      <div style={{ height: 64, backgroundColor: '#1e2035', borderBottom: '1px solid #252840', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/dashboard" style={{ color: '#9ca3af' }}>←</a>
          <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#818cf8', margin: 0 }}>{workspaceName}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid
          </label>
          <label style={{ fontSize: 14, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={snapGrid} onChange={(e) => setSnapGrid(e.target.checked)} /> Snap
          </label>
          <button onClick={() => setIsPreview(!isPreview)} style={{ padding: '6px 12px', backgroundColor: isPreview ? '#4f46e5' : '#252840', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}>
            {isPreview ? 'Design' : 'Preview'}
          </button>
          <button style={{ padding: '6px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}>Publish</button>
          <span style={{ fontSize: 14, color: '#9ca3af' }}>{userEmail}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Toolbox */}
        <div style={{ width: 64, backgroundColor: '#1e2035', borderRight: '1px solid #252840', overflowY: 'auto' }}>
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              style={{
                width: '100%',
                height: 64,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                backgroundColor: activeTool === tool.type ? '#252840' : 'transparent',
                color: activeTool === tool.type ? '#818cf8' : '#9ca3af',
                border: 'none',
                borderBottom: '1px solid #252840',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              <span>{tool.icon}</span>
              <span style={{ fontSize: 9 }}>{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          <div
            ref={canvasRef}
            onMouseDown={onCanvasMouseDown}
            style={{
              position: 'relative',
              width: 800,
              height: 600,
              margin: '0 auto',
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              backgroundImage: showGrid ? 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? '8px 8px' : 'auto',
              cursor: activeTool !== 'select' ? 'crosshair' : 'default',
            }}
          >
            {ghostRect && (
              <div
                style={{
                  position: 'absolute',
                  left: ghostRect.x,
                  top: ghostRect.y,
                  width: ghostRect.w,
                  height: ghostRect.h,
                  border: '2px dashed #6366f1',
                  background: 'rgba(99,102,241,0.08)',
                  borderRadius: 4,
                  pointerEvents: 'none',
                }}
              />
            )}
            {controls.map((ctrl) => renderControl(ctrl))}
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedControl && !isPreview && (
          <div style={{ width: 220, backgroundColor: '#1e2035', borderLeft: '1px solid #252840', padding: 16, overflowY: 'auto' }}>
            <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: 16, marginTop: 0 }}>Properties</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>X</label>
                <input type="number" value={selectedControl.x} onChange={(e) => updatePosition({ x: +e.target.value })} style={{ width: '100%', backgroundColor: '#0b0c14', border: '1px solid #252840', borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Y</label>
                <input type="number" value={selectedControl.y} onChange={(e) => updatePosition({ y: +e.target.value })} style={{ width: '100%', backgroundColor: '#0b0c14', border: '1px solid #252840', borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>W</label>
                <input type="number" value={selectedControl.w} onChange={(e) => updatePosition({ w: +e.target.value })} style={{ width: '100%', backgroundColor: '#0b0c14', border: '1px solid #252840', borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>H</label>
                <input type="number" value={selectedControl.h} onChange={(e) => updatePosition({ h: +e.target.value })} style={{ width: '100%', backgroundColor: '#0b0c14', border: '1px solid #252840', borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Caption</label>
                <input type="text" value={selectedControl.props?.caption || ''} onChange={(e) => updateProp('caption', e.target.value)} style={{ width: '100%', backgroundColor: '#0b0c14', border: '1px solid #252840', borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14 }} />
              </div>
              {(selectedControl.control_type === 'textbox' || selectedControl.control_type === 'combobox') && (
                <div>
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Placeholder</label>
                  <input type="text" value={selectedControl.props?.placeholder || ''} onChange={(e) => updateProp('placeholder', e.target.value)} style={{ width: '100%', backgroundColor: '#0b0c14', border: '1px solid #252840', borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14 }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Page Tabs */}
      <div style={{ height: 48, backgroundColor: '#1e2035', borderTop: '1px solid #252840', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', overflowX: 'auto' }}>
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setCurrentPageId(page.id)}
            style={{
              padding: '6px 16px',
              backgroundColor: page.id === currentPageId ? '#4f46e5' : '#252840',
              color: page.id === currentPageId ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {page.name}
          </button>
        ))}
        <button
          onClick={async () => {
            const name = prompt('Page name:');
            if (name && workspaceId) {
              const { data } = await supabase
                .from('pages')
                .insert({
                  workspace_id: workspaceId,
                  name,
                  slug: name.toLowerCase().replace(/\s+/g, '-'),
                  is_home: false,
                  display_order: pages.length,
                })
                .select()
                .single();

              if (data) {
                setPages([...pages, data]);
                setCurrentPageId(data.id);
              }
            }
          }}
          style={{
            padding: '6px 16px',
            backgroundColor: '#252840',
            color: '#9ca3af',
            border: 'none',
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add Page
        </button>
      </div>
    </div>
  );
}
