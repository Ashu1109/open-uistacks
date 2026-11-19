"use client";

import { useId, useState, type ReactNode } from "react";

/* SettingsRow: a label and description on the left with a control on the right; give it `checked` handling for a built-in switch or pass any control as children. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface SettingsRowProps {
  title: string;
  description?: string;
  /** Any control; ignored when `checked` or `defaultChecked` is set. */
  children?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SettingsRow({ title, description, children, checked, defaultChecked, onCheckedChange, disabled = false, className = "" }: SettingsRowProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultChecked ?? false);
  const isSwitch = checked !== undefined || defaultChecked !== undefined;
  const on = checked ?? inner;
  const flip = () => {
    if (checked === undefined) setInner(!on);
    onCheckedChange?.(!on);
  };

  return (
    <div className={`flex items-center justify-between gap-6 py-3.5 ${className}`}>
      <div className="min-w-0">
        <p id={`${id}-t`} className="text-sm font-medium text-fg">{title}</p>
        {description && <p id={`${id}-d`} className="mt-0.5 text-[13px] leading-[18px] text-fg-muted">{description}</p>}
      </div>
      <div className="shrink-0">
        {isSwitch ? (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby={`${id}-t`}
            aria-describedby={description ? `${id}-d` : undefined}
            disabled={disabled}
            onClick={flip}
            className={`relative h-6 w-10 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-select" : "bg-track-strong"} ${ring}`}
          >
            <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-4" : ""}`} />
          </button>
        ) : children}
      </div>
    </div>
  );
}
