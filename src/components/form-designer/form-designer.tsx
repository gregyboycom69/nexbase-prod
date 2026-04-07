'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Control, ControlType, Page, ToolDefinition } from './types';
import { ControlRenderer } from './control-renderer';

interface FormDesignerProps {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userEmail: string;
}

const TOOLS: ToolDefinition[] = [
  { type: 'select', icon: '↖', label: 'Select', defaultWidth: 0, defaultHeight: 0 },
  { type: 'heading', icon: 'H', label: 'Heading', defaultWidth: 200, defaultHeight: 40 },
  { type: 'label', icon: 'L', label: 'Label', defaultWidth: 120, defaultHeight: 24 },
  { type: 'textbox', icon: '□', label: 'TextBox', defaultWidth: 200, defaultHeight: 40 },
  { type: 'button', icon: '▭', label: 'Button', defaultWidth: 120, defaultHeight: 40 },
  { type: 'combobox', icon: '▼', label: 'ComboBox', defaultWidth: 200, defaultHeight: 40 },
  { type: 'checkbox', icon: '☐', label: 'CheckBox', defaultWidth: 150, defaultHeight: 24 },
  { type: 'badge', icon: '●', label: 'Badge', defaultWidth: 100, defaultHeight: 28 },
  { type: 'card', icon: '▢', label: 'Card', defaultWidth: 300, defaultHeight: 200 },
  { type: 'divider', icon: '─', label: 'Divider', defaultWidth: 300, defaultHeight: 1 },
  { type: 'image', icon: '🖼', label: 'Image', defaultWidth: 200, defaultHeight: 150 },
];

const GRID_SIZE = 8;

export default function FormDesigner({
  workspaceId,
  workspaceName,
  workspaceSlug,
  userEmail,
}: FormDesignerProps) {
  // State
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [activeTool, setActiveTool] = useState<ControlType>('select');
  const [selected, setSelected] = useState<string | null>(null);
  const [ghostRect, setGhostRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  // Refs for drawing/dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragInfo = useRef<any>({});

  const supabase = createClient();

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, [workspaceId]);

  // Load controls when page changes
  useEffect(() => {
    if (currentPageId) {
      loadControls(currentPageId);
    }
  }, [currentPageId]);

  const loadPages = async () => {
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true });

    if (data && data.length > 0) {
      setPages(data);
      setCurrentPageId(data[0].id);
    } else {
      await createPage('Home', true);
    }
  };

  const loadControls = async (pageId: string) => {
    const { data } = await supabase
      .from('controls')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order', { ascending: true });

    if (data) {
      setControls(data as Control[]);
    }
  };

  const createPage = async (name: string, isHome: boolean = false) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const displayOrder = pages.length;

    const { data } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        name,
        slug,
        is_home: isHome,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (data) {
      setPages([...pages, data]);
      setCurrentPageId(data.id);
    }
  };

  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const addControl = async (type: ControlType, rect: { x: number; y: number; w: number; h: number }) => {
    if (!currentPageId) return;

    const tool = TOOLS.find((t) => t.type === type);
    if (!tool) return;

    const newControl: any = {
      page_id: currentPageId,
      control_type: type,
      x: snap(rect.x),
      y: snap(rect.y),
      w: snap(Math.max(rect.w, tool.defaultWidth)),
      h: snap(Math.max(rect.h, tool.defaultHeight)),
      props: {
        caption: tool.label,
        backgroundColor: type === 'button' ? '#4f46e5' : 'transparent',
        textColor: type === 'button' ? '#fff' : '#000',
        borderRadius: type === 'button' ? 6 : 0,
        fontSize: type === 'heading' ? 24 : 14,
        bold: type === 'heading',
      },
      macro_steps: [],
      display_order: controls.length,
    };

    const { data } = await supabase
      .from('controls')
      .insert(newControl)
      .select()
      .single();

    if (data) {
      setControls([...controls, data as Control]);
      setSelected(data.id);
    }
  };

  // ===== CANVAS MOUSEDOWN =====
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'select') {
      setSelected(null);
      return;
    }

    // Start drawing
    isDrawing.current = true;
    dragInfo.current = {
      startX: x,
      startY: y,
      type: activeTool,
    };
  };

  // ===== CONTROL MOUSEDOWN =====
  const handleControlMouseDown = (e: React.MouseEvent, controlId: string) => {
    if (isPreview || activeTool !== 'select') return;

    e.preventDefault();
    e.stopPropagation();

    setSelected(controlId);

    if (!canvasRef.current) return;

    const control = controls.find((c) => c.id === controlId);
    if (!control) return;

    isDragging.current = true;
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      controlX: control.x,
      controlY: control.y,
      controlId: controlId,
    };
  };

  // ===== RESIZE HANDLE MOUSEDOWN =====
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!selected) return;

    e.preventDefault();
    e.stopPropagation();

    const control = controls.find((c) => c.id === selected);
    if (!control) return;

    isResizing.current = true;
    dragInfo.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      controlX: control.x,
      controlY: control.y,
      controlW: control.w,
      controlH: control.h,
      controlId: selected,
    };
  };

  // ===== WINDOW MOUSEMOVE AND MOUSEUP =====
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();

      // DRAWING
      if (isDrawing.current) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setGhostRect({
          x: Math.min(x, dragInfo.current.startX),
          y: Math.min(y, dragInfo.current.startY),
          w: Math.abs(x - dragInfo.current.startX),
          h: Math.abs(y - dragInfo.current.startY),
        });
      }

      // DRAGGING
      if (isDragging.current && dragInfo.current.controlId) {
        const deltaX = e.clientX - dragInfo.current.startX;
        const deltaY = e.clientY - dragInfo.current.startY;

        const newX = snap(dragInfo.current.controlX + deltaX);
        const newY = snap(dragInfo.current.controlY + deltaY);

        setControls((prev) =>
          prev.map((c) =>
            c.id === dragInfo.current.controlId ? { ...c, x: newX, y: newY } : c
          )
        );
      }

      // RESIZING
      if (isResizing.current && dragInfo.current.controlId) {
        const deltaX = e.clientX - dragInfo.current.startX;
        const deltaY = e.clientY - dragInfo.current.startY;
        const handle = dragInfo.current.handle;

        let newX = dragInfo.current.controlX;
        let newY = dragInfo.current.controlY;
        let newW = dragInfo.current.controlW;
        let newH = dragInfo.current.controlH;

        if (handle.includes('e')) {
          newW = Math.max(20, dragInfo.current.controlW + deltaX);
        }
        if (handle.includes('w')) {
          newW = Math.max(20, dragInfo.current.controlW - deltaX);
          newX = dragInfo.current.controlX + deltaX;
        }
        if (handle.includes('s')) {
          newH = Math.max(20, dragInfo.current.controlH + deltaY);
        }
        if (handle.includes('n')) {
          newH = Math.max(20, dragInfo.current.controlH - deltaY);
          newY = dragInfo.current.controlY + deltaY;
        }

        setControls((prev) =>
          prev.map((c) =>
            c.id === dragInfo.current.controlId
              ? { ...c, x: snap(newX), y: snap(newY), w: snap(newW), h: snap(newH) }
              : c
          )
        );
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      // FINISH DRAWING
      if (isDrawing.current) {
        isDrawing.current = false;
        if (ghostRect && ghostRect.w > 10 && ghostRect.h > 10) {
          await addControl(dragInfo.current.type, ghostRect);
        }
        setGhostRect(null);
        setActiveTool('select');
        dragInfo.current = {};
      }

      // FINISH DRAGGING
      if (isDragging.current && dragInfo.current.controlId) {
        const control = controls.find((c) => c.id === dragInfo.current.controlId);
        if (control) {
          await supabase
            .from('controls')
            .update({ x: control.x, y: control.y })
            .eq('id', dragInfo.current.controlId);
        }
        isDragging.current = false;
        dragInfo.current = {};
      }

      // FINISH RESIZING
      if (isResizing.current && dragInfo.current.controlId) {
        const control = controls.find((c) => c.id === dragInfo.current.controlId);
        if (control) {
          await supabase
            .from('controls')
            .update({ x: control.x, y: control.y, w: control.w, h: control.h })
            .eq('id', dragInfo.current.controlId);
        }
        isResizing.current = false;
        dragInfo.current = {};
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [ghostRect, controls, activeTool, currentPageId, snapToGrid]);

  // ===== CONTROL ACTIONS =====
  const updateControlProps = async (props: any) => {
    if (!selected) return;

    const control = controls.find((c) => c.id === selected);
    if (!control) return;

    const newProps = { ...control.props, ...props };

    setControls((prev) =>
      prev.map((c) => (c.id === selected ? { ...c, props: newProps } : c))
    );

    await supabase.from('controls').update({ props: newProps }).eq('id', selected);
  };

  const updateControlPosition = async (updates: any) => {
    if (!selected) return;

    setControls((prev) =>
      prev.map((c) => (c.id === selected ? { ...c, ...updates } : c))
    );

    await supabase.from('controls').update(updates).eq('id', selected);
  };

  const deleteControl = async () => {
    if (!selected) return;

    await supabase.from('controls').delete().eq('id', selected);

    setControls((prev) => prev.filter((c) => c.id !== selected));
    setSelected(null);
  };

  const duplicateControl = async () => {
    if (!selected || !currentPageId) return;

    const control = controls.find((c) => c.id === selected);
    if (!control) return;

    const newControl: any = {
      page_id: currentPageId,
      control_type: control.control_type,
      x: control.x + 20,
      y: control.y + 20,
      w: control.w,
      h: control.h,
      props: { ...control.props },
      macro_steps: [...control.macro_steps],
      display_order: controls.length,
    };

    const { data } = await supabase
      .from('controls')
      .insert(newControl)
      .select()
      .single();

    if (data) {
      setControls([...controls, data as Control]);
      setSelected(data.id);
    }
  };

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selected && !isPreview) {
        deleteControl();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, isPreview]);

  const selectedControl = controls.find((c) => c.id === selected);

  return (
    <div className="h-screen flex flex-col bg-[#13141f] font-sans">
      {/* Top Bar */}
      <div className="h-16 bg-[#1e2035] border-b border-[#252840] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <h1 className="text-xl font-bold text-indigo-400">{workspaceName}</h1>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded"
            />
            Grid
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded"
            />
            Snap
          </label>
          <button
            onClick={duplicateControl}
            disabled={!selected}
            className="px-3 py-1.5 bg-[#252840] text-gray-300 rounded hover:bg-[#2a2d45] disabled:opacity-50 text-sm"
          >
            Duplicate
          </button>
          <button
            onClick={deleteControl}
            disabled={!selected}
            className="px-3 py-1.5 bg-[#252840] text-gray-300 rounded hover:bg-[#2a2d45] disabled:opacity-50 text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              isPreview ? 'bg-indigo-600 text-white' : 'bg-[#252840] text-gray-300'
            }`}
          >
            {isPreview ? 'Design' : 'Preview'}
          </button>
          <button className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium">
            Publish
          </button>
          <span className="text-sm text-gray-400">{userEmail}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Toolbox */}
        <div className="w-16 bg-[#1e2035] border-r border-[#252840] overflow-y-auto">
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              className={`w-full h-16 flex flex-col items-center justify-center gap-1 border-b border-[#252840] hover:bg-[#252840] transition-colors ${
                activeTool === tool.type ? 'bg-[#252840] text-indigo-400' : 'text-gray-400'
              }`}
              title={tool.label}
            >
              <span className="text-xl">{tool.icon}</span>
              <span className="text-[9px]">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="relative mx-auto bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: 800,
              height: 600,
              backgroundImage: showGrid
                ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: showGrid ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto',
              cursor: activeTool !== 'select' ? 'crosshair' : 'default',
            }}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Ghost rect while drawing */}
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

            {/* Render controls */}
            {controls.map((control) => (
              <div
                key={control.id}
                style={{
                  position: 'absolute',
                  left: control.x,
                  top: control.y,
                }}
              >
                <ControlRenderer
                  control={control}
                  isSelected={control.id === selected}
                  isPreview={isPreview}
                  onClick={() => activeTool === 'select' && setSelected(control.id)}
                  onMouseDown={(e) => handleControlMouseDown(e, control.id)}
                />

                {/* Resize Handles */}
                {control.id === selected && !isPreview && (
                  <>
                    {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((handle) => (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                        className="absolute w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-md hover:bg-indigo-600"
                        style={{
                          top: handle.includes('n')
                            ? -6
                            : handle.includes('s')
                            ? control.h - 6
                            : control.h / 2 - 6,
                          left: handle.includes('w')
                            ? -6
                            : handle.includes('e')
                            ? control.w - 6
                            : control.w / 2 - 6,
                          cursor: `${handle}-resize`,
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        {selectedControl && !isPreview && (
          <div className="w-[220px] bg-[#1e2035] border-l border-[#252840] overflow-y-auto p-4">
            <h3 className="text-white font-bold mb-4">Properties</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">X</label>
                <input
                  type="number"
                  value={selectedControl.x}
                  onChange={(e) => updateControlPosition({ x: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Y</label>
                <input
                  type="number"
                  value={selectedControl.y}
                  onChange={(e) => updateControlPosition({ y: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">W</label>
                <input
                  type="number"
                  value={selectedControl.w}
                  onChange={(e) => updateControlPosition({ w: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">H</label>
                <input
                  type="number"
                  value={selectedControl.h}
                  onChange={(e) => updateControlPosition({ h: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Caption</label>
                <input
                  type="text"
                  value={selectedControl.props.caption || ''}
                  onChange={(e) => updateControlProps({ caption: e.target.value })}
                  className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                />
              </div>

              {(selectedControl.control_type === 'textbox' ||
                selectedControl.control_type === 'combobox') && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={selectedControl.props.placeholder || ''}
                    onChange={(e) => updateControlProps({ placeholder: e.target.value })}
                    className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 block mb-1">Field Key</label>
                <input
                  type="text"
                  value={selectedControl.props.fieldKey || ''}
                  onChange={(e) => updateControlProps({ fieldKey: e.target.value })}
                  className="w-full bg-[#0b0c14] border border-[#252840] rounded px-2 py-1 text-white text-sm"
                />
              </div>

              {selectedControl.control_type === 'button' && (
                <button className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                  Edit Macro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom - Page Manager */}
      <div className="h-12 bg-[#1e2035] border-t border-[#252840] flex items-center gap-2 px-4 overflow-x-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setCurrentPageId(page.id)}
            className={`px-4 py-1.5 rounded text-sm whitespace-nowrap ${
              page.id === currentPageId
                ? 'bg-indigo-600 text-white'
                : 'bg-[#252840] text-gray-400 hover:text-white'
            }`}
          >
            {page.name}
          </button>
        ))}
        <button
          onClick={() => {
            const name = prompt('Page name:');
            if (name) createPage(name);
          }}
          className="px-4 py-1.5 bg-[#252840] text-gray-400 rounded text-sm hover:text-white whitespace-nowrap"
        >
          + Add Page
        </button>
      </div>
    </div>
  );
}
