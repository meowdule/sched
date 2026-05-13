import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type DropdownOption = { value: number; label: string };

type Props = {
  id: string;
  ariaLabel: string;
  value: number;
  options: DropdownOption[];
  onChange: (value: number) => void;
  /** 연도는 넓게, 월은 좁게 */
  variant?: "year" | "month";
};

export default function DropdownSelect({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  variant = "year",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const currentLabel =
    options.find((o) => o.value === value)?.label ?? String(value);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !selectedRef.current) return;
    selectedRef.current.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`dropdown-select ${open ? "is-open" : ""} ${variant === "month" ? "dropdown-select--month" : ""}`}
    >
      <button
        type="button"
        id={id}
        className={`cal-ym-select dropdown-select-trigger ${variant === "month" ? "cal-ym-select--month" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-listbox` : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dropdown-select-value">{currentLabel}</span>
        <ChevronDown className="dropdown-select-chevron" size={18} strokeWidth={2.2} aria-hidden />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          className="dropdown-select-list"
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                ref={opt.value === value ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className="dropdown-select-option"
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
