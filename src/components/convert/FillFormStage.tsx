"use client";

import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";
import { listPdfFields, type PdfFormDraft } from "@/lib/convert/pdf";

type Props = {
  file: File;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
};

export function FillFormStage({ file, values, onChange }: Props) {
  const [fields, setFields] = useState<PdfFormDraft[]>([]);
  const [status, setStatus] = useState("Reading form fields…");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let alive = true;
    setStatus("Reading form fields…");
    listPdfFields(file)
      .then((next) => {
        if (!alive) return;
        setFields(next);
        setStatus("");
        onChangeRef.current(Object.fromEntries(next.map((field) => [field.name, field.value])));
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setFields([]);
        setStatus(error instanceof Error ? error.message : "The form could not be read.");
      });
    return () => {
      alive = false;
    };
  }, [file]);

  if (status) return <p className="mt-5 text-sm text-mute">{status}</p>;

  return (
    <div className="mt-5 flex max-h-64 flex-col gap-3 overflow-auto pr-1">
      {fields.map((field) => {
        const value = values[field.name] ?? field.value;
        if (field.type === "check") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm text-mute">
              <input
                type="checkbox"
                checked={value === "yes"}
                onChange={(e) => onChange({ ...values, [field.name]: e.target.checked ? "yes" : "no" })}
              />
              {field.name}
            </label>
          );
        }
        if (field.type === "choice") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm text-mute">
              {field.name}
              <select
                className="h-8 rounded-control border border-line bg-bone px-2.5 text-sm text-ink outline-none transition duration-180 focus:border-accent focus:shadow-glow"
                value={value}
                onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
              >
                <option value="">Select</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <Field
            key={field.name}
            label={field.name}
            value={value}
            onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
            className="min-w-[12rem] flex-1"
          />
        );
      })}
    </div>
  );
}
