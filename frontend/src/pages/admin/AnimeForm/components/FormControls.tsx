import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export function FieldRow({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500 font-bold">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TitleOtherEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Nhập tên rồi nhấn Enter hoặc +"
          className="border-slate-300 bg-white"
        />
        <Button type="button" size="icon" variant="outline" onClick={add} className="shrink-0 border-slate-300 hover:bg-slate-50 transition-colors">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200"
            >
              {t}
              <button type="button" onClick={() => remove(i)} className="hover:text-red-500 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiCheckList({
  items,
  selected,
  onChange,
}: {
  items: { id: number; name: string; nameVi?: string | null }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) =>
    selected.includes(id) ? onChange(selected.filter((x) => x !== id)) : onChange([...selected, id]);

  return (
    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2.5 custom-scrollbar">
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs font-medium text-slate-400">Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600 rounded"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              <span className="font-medium">{item.nameVi || item.name || `#${item.id}`}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
