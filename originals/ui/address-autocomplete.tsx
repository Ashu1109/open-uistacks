"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { LoaderCircle, MapPin } from "lucide-react";

/* Address autocomplete: a combobox that asks getSuggestions(query) after a short debounce, ignores stale answers, and lets you pick with arrows and Enter. */

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[var(--select)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export interface AddressSuggestion {
  id: string;
  primary: string;
  secondary?: string;
}

export interface AddressAutocompleteProps {
  getSuggestions: (query: string) => Promise<AddressSuggestion[]>;
  onSelect: (suggestion: AddressSuggestion) => void;
  label?: string;
  placeholder?: string;
  /** Milliseconds to wait after typing before asking. */
  debounceMs?: number;
  /** Fewest characters before suggestions are requested. */
  minChars?: number;
  className?: string;
}

export function AddressAutocomplete({ getSuggestions, onSelect, label = "Address", placeholder = "Start typing an address", debounceMs = 250, minChars = 2, className = "" }: AddressAutocompleteProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const suppress = useRef(false);

  useEffect(() => {
    if (suppress.current) {
      suppress.current = false;
      return;
    }
    const ticket = ++request.current;
    if (query.trim().length < minChars) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await getSuggestions(query.trim());
        if (ticket !== request.current) return;
        setItems(found);
        setFailed(false);
        setActive(-1);
        setOpen(true);
      } catch {
        if (ticket !== request.current) return;
        setItems([]);
        setFailed(true);
        setOpen(true);
      } finally {
        if (ticket === request.current) setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs, minChars, getSuggestions]);

  const choose = (s: AddressSuggestion) => {
    suppress.current = true;
    setQuery(s.secondary ? `${s.primary}, ${s.secondary}` : s.primary);
    setOpen(false);
    onSelect(s);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % items.length : (a - 1 + items.length) % items.length));
    } else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const message = failed ? "Could not load suggestions" : items.length === 0 ? "No matches" : "";

  return (
    <div className={`relative w-80 ${className}`}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
        <input
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={`h-10 w-full rounded-[12px] bg-surface pl-9 pr-9 text-sm text-fg shadow-[var(--shadow-card)] placeholder:text-fg-subtle ${ring}`}
        />
        {loading && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-fg-subtle" aria-hidden />}
      </div>
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[14px] bg-surface p-1 shadow-[var(--shadow-overlay)] dark:bg-raised">
          {items.map((s, i) => (
            <li key={s.id} id={`${id}-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(s)} onPointerEnter={() => setActive(i)} className={`flex cursor-default items-start gap-2 rounded-[10px] px-2.5 py-2 text-sm ${i === active ? "bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))]" : ""}`}>
              <MapPin className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-fg">{s.primary}</span>
                {s.secondary && <span className="block truncate text-xs text-fg-muted">{s.secondary}</span>}
              </span>
            </li>
          ))}
          {message && <li role="presentation" className="px-2.5 py-2 text-sm text-fg-muted">{message}</li>}
        </ul>
      )}
    </div>
  );
}
