"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Label } from "@/components/ui/label";

const MENU = {
  background: "#1c1c1e",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.22)",
} as const;

export function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const maxHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < 160 && rect.top > spaceBelow;
      setBox({
        top: openUp ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 180),
      });
    }
    place();
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="grid gap-1.5">
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <button
        ref={buttonRef}
        id={fieldId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={MENU}
        className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium"
      >
        <span className="truncate">{selected}</span>
        <span className="ml-2" style={{ color: "rgba(255,255,255,0.55)" }}>
          ▾
        </span>
      </button>
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              maxHeight: 280,
              ...MENU,
            }}
            className="fixed z-[120] overflow-auto rounded-lg py-1 text-sm font-medium shadow-[0_16px_40px_rgba(0,0,0,0.7)]"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    style={{
                      color: "#ffffff",
                      background: active ? "rgba(255,255,255,0.18)" : "transparent",
                    }}
                    className="flex min-h-11 w-full px-3 text-left hover:bg-white/15"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
