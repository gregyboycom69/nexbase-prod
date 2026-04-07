import { Control } from './types';

interface ControlRendererProps {
  control: Control;
  isSelected: boolean;
  isPreview: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function ControlRenderer({
  control,
  isSelected,
  isPreview,
  onClick,
  onMouseDown,
}: ControlRendererProps) {
  const {
    control_type,
    x,
    y,
    w,
    h,
    props = {},
  } = control;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: w,
    height: h,
    backgroundColor: props.backgroundColor || 'transparent',
    color: props.textColor || '#000',
    borderRadius: props.borderRadius || 0,
    fontSize: props.fontSize || 14,
    fontWeight: props.bold ? 'bold' : 'normal',
    cursor: isPreview ? 'default' : 'move',
  };

  const commonProps = {
    style,
    onClick,
    onMouseDown: !isPreview ? onMouseDown : undefined,
    className: `${isSelected && !isPreview ? 'ring-2 ring-indigo-500' : ''}`,
  };

  switch (control_type) {
    case 'label':
      return (
        <div {...commonProps} className={`${commonProps.className} flex items-center px-2`}>
          {props.caption || 'Label'}
        </div>
      );

    case 'heading':
      return (
        <div {...commonProps} className={`${commonProps.className} flex items-center px-2`}>
          <h2 style={{ ...style, fontSize: props.fontSize || 24, fontWeight: 'bold' }}>
            {props.caption || 'Heading'}
          </h2>
        </div>
      );

    case 'textbox':
      if (isPreview) {
        return (
          <input
            type="text"
            placeholder={props.placeholder || ''}
            style={{
              ...style,
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              outline: 'none',
            }}
            className="focus:ring-2 focus:ring-indigo-500"
          />
        );
      }
      return (
        <div
          {...commonProps}
          style={{
            ...style,
            backgroundColor: '#fff',
            border: '1px solid #d1d5db',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span className="text-gray-400">{props.placeholder || 'TextBox'}</span>
        </div>
      );

    case 'button':
      return (
        <button
          {...commonProps}
          style={{
            ...style,
            backgroundColor: props.backgroundColor || '#4f46e5',
            color: props.textColor || '#fff',
            border: 'none',
            padding: '8px 16px',
            cursor: isPreview ? 'pointer' : 'move',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          className={`${commonProps.className} hover:opacity-90 transition-opacity font-medium`}
          type="button"
        >
          {props.caption || 'Button'}
        </button>
      );

    case 'combobox':
      if (isPreview) {
        const options = (props.options || '').split(',').map(opt => opt.trim()).filter(Boolean);
        return (
          <select
            style={{
              ...style,
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              outline: 'none',
            }}
            className="focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{props.placeholder || 'Select...'}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }
      return (
        <div
          {...commonProps}
          style={{
            ...style,
            backgroundColor: '#fff',
            border: '1px solid #d1d5db',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span className="text-gray-400">{props.placeholder || 'ComboBox'}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      );

    case 'checkbox':
      return (
        <label
          {...commonProps}
          style={{ ...style, display: 'flex', alignItems: 'center', gap: '8px', cursor: isPreview ? 'pointer' : 'move' }}
        >
          <input
            type="checkbox"
            disabled={!isPreview}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span>{props.caption || 'CheckBox'}</span>
        </label>
      );

    case 'badge':
      return (
        <div
          {...commonProps}
          style={{
            ...style,
            backgroundColor: props.backgroundColor || '#e0e7ff',
            color: props.textColor || '#4f46e5',
            borderRadius: props.borderRadius || 12,
            padding: '4px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            width: 'auto',
            minWidth: w,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-current"></span>
          <span className="text-sm font-medium">{props.caption || 'Badge'}</span>
        </div>
      );

    case 'card':
      return (
        <div
          {...commonProps}
          style={{
            ...style,
            backgroundColor: props.backgroundColor || '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: props.borderRadius || 8,
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3 className="font-bold mb-2">{props.caption || 'Card Title'}</h3>
          <p className="text-sm text-gray-600">Card content</p>
        </div>
      );

    case 'divider':
      return (
        <div
          {...commonProps}
          style={{
            ...style,
            backgroundColor: props.backgroundColor || '#e5e7eb',
            height: 1,
          }}
        />
      );

    case 'image':
      return (
        <div
          {...commonProps}
          style={{
            ...style,
            backgroundColor: props.backgroundColor || '#f3f4f6',
            border: '1px dashed #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
}
