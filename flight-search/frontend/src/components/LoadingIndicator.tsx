import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export function LoadingIndicator({ size = 'md', label, className = '' }: LoadingIndicatorProps) {
  return (
    <span
      className={`loading-indicator loading-indicator-${size}${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="loading-indicator-spinner" aria-hidden="true" />
      {label ? <span className="loading-indicator-label">{label}</span> : null}
    </span>
  );
}
