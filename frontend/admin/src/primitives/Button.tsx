import { useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

type CommonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
};

type ButtonProps = CommonProps & (
  | { iconOnly: true; accessibleName: string }
  | { iconOnly?: false; accessibleName?: string }
);

export function Button({ accessibleName, children, className = '', disabled, iconOnly = false, loading = false, tone = 'secondary', ...props }: ButtonProps) {
  const tooltipId = useId();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const blockNextTouchActivation = useRef(false);
  const button = (
    <button
      {...props}
      aria-busy={loading || undefined}
      aria-label={loading ? '처리 중…' : iconOnly ? accessibleName : props['aria-label']}
      className={`button button--${tone} ${iconOnly ? 'button--icon' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      aria-describedby={iconOnly ? tooltipId : props['aria-describedby']}
    >
      <span className={loading ? 'button__content button__content--loading' : 'button__content'}>{children}</span>
      {loading && <span className="button__loading" aria-hidden="true">처리 중…</span>}
    </button>
  );
  if (!iconOnly) return button;
  return (
    <span
      className="tooltip-anchor"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocusCapture={() => setTooltipVisible(true)}
      onBlurCapture={() => setTooltipVisible(false)}
      onKeyDownCapture={(event) => { if (event.key === 'Escape' && tooltipVisible) { event.stopPropagation(); setTooltipVisible(false); } }}
      onTouchStart={() => {
        if (!tooltipVisible) {
          blockNextTouchActivation.current = true;
          setTooltipVisible(true);
        } else {
          blockNextTouchActivation.current = false;
        }
      }}
      onClickCapture={(event) => {
        if (blockNextTouchActivation.current) {
          blockNextTouchActivation.current = false;
          event.preventDefault();
          event.stopPropagation();
        } else if (tooltipVisible) {
          setTooltipVisible(false);
        }
      }}
    >
      {button}
      <span id={tooltipId} role="tooltip" className="tooltip" hidden={!tooltipVisible}>{accessibleName}</span>
    </span>
  );
}
