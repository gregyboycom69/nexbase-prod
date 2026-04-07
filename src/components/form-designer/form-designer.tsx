'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedTool, setSelectedTool] = useState<ControlType>('select');
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; controlX: number; controlY: number } | null>(null);

  // Resize states
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<any>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [showMacroBuilder, setShowMacroBuilder] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
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

  // ===== DRAWING NEW CONTROLS =====
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || selectedTool === 'select' || isPreview) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);

    setIsDrawing(true);
    setDrawStart({ x, y });
    setDrawRect({ x, y, w: 0, h: 0 });
  };

  // Window mousemove for drawing
  useEffect(() => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const w = Math.abs(currentX - drawStart.x);
      const h = Math.abs(currentY - drawStart.y);

      setDrawRect({ x: snap(x), y: snap(y), w: snap(w), h: snap(h) });
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!drawRect || !currentPageId) {
        setIsDrawing(false);
        setDrawStart(null);
        setDrawRect(null);
        return;
      }

      // Only create if dragged more than 10px
      if (drawRect.w < 10 || drawRect.h < 10) {
        setIsDrawing(false);
        setDrawStart(null);
        setDrawRect(null);
        return;
      }

      const tool = TOOLS.find((t) => t.type === selectedTool);
      if (!tool) return;

      // Create new control
      const newControl: any = {
        page_id: currentPageId,
        control_type: selectedTool,
        x: drawRect.x,
        y: drawRect.y,
        w: Math.max(drawRect.w, tool.defaultWidth),
        h: Math.max(drawRect.h, tool.defaultHeight),
        props: {
          caption: tool.label,
          backgroundColor: selectedTool === 'button' ? '#4f46e5' : 'transparent',
          textColor: selectedTool === 'button' ? '#fff' : '#000',
          borderRadius: selectedTool === 'button' ? 6 : 0,
          fontSize: selectedTool === 'heading' ? 24 : 14,
          bold: selectedTool === 'heading',
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
        setSelectedControlId(data.id);
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawRect(null);
      setSelectedTool('select');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, drawStart, drawRect, currentPageId, selectedTool, controls, snapToGrid]);

  // ===== MOVING CONTROLS =====
  const handleControlMouseDown = (e: React.MouseEvent, controlId: string) => {
    if (isPreview || selectedTool !== 'select') return;

    e.preventDefault();
    e.stopPropagation();

    setSelectedControlId(controlId);
    const control = controls.find((c) => c.id === controlId);
    if (!control || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      controlX: control.x,
      controlY: control.y,
    });
  };

  // Window mousemove for dragging
  useEffect(() => {
    if (!isDragging || !dragStart || !selectedControlId || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newX = snap(dragStart.controlX + deltaX);
      const newY = snap(dragStart.controlY + deltaY);

      setControls((prev) =>
        prev.map((c) =>
          c.id === selectedControlId ? { ...c, x: newX, y: newY } : c
        )
      );
    };

    const handleMouseUp = async () => {
      const control = controls.find((c) => c.id === selectedControlId);
      if (control) {
        await supabase
          .from('controls')
          .update({ x: control.x, y: control.y })
          .eq('id', selectedControlId);
      }

      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, selectedControlId, controls, snapToGrid]);

  // ===== RESIZE HANDLES =====
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!selectedControlId) return;

    e.preventDefault();
    e.stopPropagation();

    const control = controls.find((c) => c.id === selectedControlId);
    if (!control) return;

    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: control.x,
      y: control.y,
      w: control.w,
      h: control.h,
    });
  };

  // Window mousemove for resizing
  useEffect(() => {
    if (!isResizing || !resizeHandle || !resizeStart || !selectedControlId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;

      let newX = resizeStart.x;
      let newY = resizeStart.y;
      let newW = resizeStart.w;
      let newH = resizeStart.h;

      // Resize based on handle
      if (resizeHandle.includes('e')) {
        newW = Math.max(20, resizeStart.w + deltaX);
      }
      if (resizeHandle.includes('w')) {
        newW = Math.max(20, resizeStart.w - deltaX);
        newX = resizeStart.x + deltaX;
      }
      if (resizeHandle.includes('s')) {
        newH = Math.max(20, resizeStart.h + deltaY);
      }
      if (resizeHandle.includes('n')) {
        newH = Math.max(20, resizeStart.h - deltaY);
        newY = resizeStart.y + deltaY;
      }

      setControls((prev) =>
        prev.map((c) =>
          c.id === selectedControlId
            ? { ...c, x: snap(newX), y: snap(newY), w: snap(newW), h: snap(newH) }
            : c
        )
      );
    };

    const handleMouseUp = async () => {
      const control = controls.find((c) => c.id === selectedControlId);
      if (control) {
        await supabase
          .from('controls')
          .update({ x: control.x, y: control.y, w: control.w, h: control.h })
          .eq('id', selectedControlId);
      }

      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, selectedControlId, controls, snapToGrid]);

  // ===== PROPERTY UPDATES =====
  const updateControlProps = async (props: any) => {
    if (!selectedControlId) return;

    const control = controls.find((c) => c.id === selectedControlId);
    if (!control) return;

    const newProps = { ...control.props, ...props };

    setControls((prev) =>
      prev.map((c) =>
        c.id === selectedControlId ? { ...c, props: newProps } : c
      )
    );

    await supabase
      .from('controls')
      .update({ props: newProps })
      .eq('id', selectedControlId);
  };

  const updateControlPosition = async (updates: any) => {
    if (!selectedControlId) return;

    setControls((prev) =>
      prev.map((c) =>
        c.id === selectedControlId ? { ...c, ...updates } : c
      )
    );

    await supabase
      .from('controls')
      .update(updates)
      .eq('id', selectedControlId);
  };

  // ===== CONTROL ACTIONS =====
  const deleteControl = async () => {
    if (!selectedControlId) return;

    await supabase
      .from('controls')
      .delete()
      .eq('id', selectedControlId);

    setControls((prev) => prev.filter((c) => c.id !== selectedControlId));
    setSelectedControlId(null);
  };

  const duplicateControl = async () => {
    if (!selectedControlId || !currentPageId) return;

    const control = controls.find((c) => c.id === selectedControlId);
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
      setSelectedControlId(data.id);
    }
  };

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedControlId && !isPreview) {
        deleteControl();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedControlId, isPreview]);

  const selectedControl = controls.find((c) => c.id === selectedControlId);

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
            disabled={!selectedControlId}
            className="px-3 py-1.5 bg-[#252840] text-gray-300 rounded hover:bg-[#2a2d45] disabled:opacity-50 text-sm"
          >
            Duplicate
          </button>
          <button
            onClick={deleteControl}
            disabled={!selectedControlId}
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
              onClick={() => setSelectedTool(tool.type)}
              className={`w-full h-16 flex flex-col items-center justify-center gap-1 border-b border-[#252840] hover:bg-[#252840] transition-colors ${
                selectedTool === tool.type ? 'bg-[#252840] text-indigo-400' : 'text-gray-400'
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
            className="relative mx-auto bg-white rounded-lg shadow-2xl"
            style={{
              width: 800,
              height: 600,
              backgroundImage: showGrid
                ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: showGrid ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto',
              cursor: selectedTool === 'select' ? 'default' : 'crosshair',
            }}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Ghost rectangle while drawing */}
            {isDrawing && drawRect && drawRect.w > 0 && drawRect.h > 0 && (
              <div
                className="absolute border-2 border-dashed border-indigo-500 bg-indigo-50 bg-opacity-20 pointer-events-none"
                style={{
                  left: drawRect.x,
                  top: drawRect.y,
                  width: drawRect.w,
                  height: drawRect.h,
                }}
              />
            )}

            {/* Render all controls */}
            {controls.map((control) => (
              <div key={control.id} className="absolute" style={{ left: control.x, top: control.y }}>
                <ControlRenderer
                  control={control}
                  isSelected={control.id === selectedControlId}
                  isPreview={isPreview}
                  onClick={() => selectedTool === 'select' && setSelectedControlId(control.id)}
                  onMouseDown={(e) => handleControlMouseDown(e, control.id)}
                />

                {/* Resize Handles */}
                {control.id === selectedControlId && !isPreview && (
                  <>
                    {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((handle) => (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                        className="absolute w-3 h-3 bg-indigo-500 rounded-full cursor-pointer border-2 border-white shadow-md hover:bg-indigo-600"
                        style={{
                          top: handle.includes('n') ? -6 : handle.includes('s') ? control.h - 6 : control.h / 2 - 6,
                          left: handle.includes('w') ? -6 : handle.includes('e') ? control.w - 6 : control.w / 2 - 6,
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

              {(selectedControl.control_type === 'textbox' || selectedControl.control_type === 'combobox') && (
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
                <button
                  onClick={() => setShowMacroBuilder(true)}
                  className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
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
