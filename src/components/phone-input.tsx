"use client";

import { ChangeEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { maskPhoneBR } from "@/lib/phone";

type PhoneInputProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  ariaLabel?: string;
  id?: string;
  autoFocus?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function PhoneInput({
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  required,
  placeholder = "(49) 9 9999-0000",
  className,
  autoComplete = "tel",
  ariaLabel,
  id,
  autoFocus,
  onKeyDown,
}: PhoneInputProps) {
  const [inner, setInner] = useState(() => maskPhoneBR(defaultValue));
  const value = valueProp ?? inner;
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const pos = caretRef.current;
    const el = inputRef.current;
    if (pos == null || !el) return;
    el.setSelectionRange(pos, pos);
    caretRef.current = null;
  });

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const el = event.target;
    const raw = el.value;
    const caret = el.selectionStart ?? raw.length;
    let digitCaret = raw.slice(0, caret).replace(/\D/g, "").length;
    let digits = raw.replace(/\D/g, "");
    const previous = value.replace(/\D/g, "");

    if (raw.length < value.length && digits.length === previous.length && digitCaret > 0) {
      digits = digits.slice(0, digitCaret - 1) + digits.slice(digitCaret);
      digitCaret -= 1;
    }

    const next = maskPhoneBR(digits);
    const pos = caretAfterDigits(next, digitCaret);
    if (next === value) {
      el.value = next;
      el.setSelectionRange(pos, pos);
      return;
    }
    caretRef.current = pos;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  }

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      inputMode="tel"
      autoComplete={autoComplete}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
}

function caretAfterDigits(masked: string, count: number) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < masked.length; index += 1) {
    if (/\d/.test(masked[index] ?? "")) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return masked.length;
}
