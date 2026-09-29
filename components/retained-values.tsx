"use client";

import { useEffect, useRef } from "react";

/**
 * Vraća unesene vrijednosti u obrazac nakon neuspjelog spremanja.
 *
 * React 19 nakon svake server akcije isprazni obrazac, pa i onda kad je
 * spremanje odbijeno. Umjesto da se svako polje pretvori u kontrolirano —
 * što bi značilo izmjenu svakog `input`-a u aplikaciji — ovdje se nakon
 * praznjenja jednom prođe kroz polja obrasca i upiše natrag ono što je
 * server vratio.
 *
 * Komponenta se stavlja unutar `<form>`; sama pronađe obrazac u kojem se
 * nalazi i ništa ne iscrtava.
 */
export function RetainedValues({ values }: { values?: Record<string, string[]> }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!values) return;
    const form = anchor.current?.closest("form");
    if (!form) return;

    for (const element of Array.from(form.elements)) {
      const field = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const name = field.name;
      if (!name || !("value" in field)) continue;

      const submitted = values[name];

      if (field instanceof HTMLInputElement) {
        if (field.type === "file" || field.type === "submit" || field.type === "hidden") continue;
        if (field.type === "checkbox" || field.type === "radio") {
          field.checked = submitted?.includes(field.value) ?? false;
          continue;
        }
      }

      if (field instanceof HTMLSelectElement && field.multiple) {
        for (const option of Array.from(field.options)) {
          option.selected = submitted?.includes(option.value) ?? false;
        }
        continue;
      }

      field.value = submitted?.[0] ?? "";
    }
  }, [values]);

  return <span ref={anchor} hidden />;
}
