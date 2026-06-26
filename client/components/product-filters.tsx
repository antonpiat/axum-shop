import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";

export interface FilterValues {
  query: string;
  category_id: string;
  min_price: string;
  max_price: string;
}

interface ProductFiltersProps {
  categories: Category[];
  initialValues: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

export function ProductFilters({
  categories,
  initialValues,
  onApply,
  onReset,
  mobile,
  onClose,
}: ProductFiltersProps) {
  const [values, setValues] = useState(initialValues);

  const set = (key: keyof FilterValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const content = (
    <div className="space-y-4">
      <Input
        label="Search"
        placeholder="Search products..."
        value={values.query}
        onChange={(e) => set("query", e.target.value)}
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">Category</label>
        <select
          value={values.category_id}
          onChange={(e) => set("category_id", e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id ?? ""}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min price"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={values.min_price}
          onChange={(e) => set("min_price", e.target.value)}
        />
        <Input
          label="Max price"
          type="number"
          min="0"
          step="0.01"
          placeholder="999"
          value={values.max_price}
          onChange={(e) => set("max_price", e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            onApply(values);
            onClose?.();
          }}
        >
          Apply
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onReset();
            onClose?.();
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center sm:justify-center">
        <div className="w-full rounded-t-2xl border border-zinc-800 bg-zinc-900 p-5 sm:max-w-md sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Filters</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Filters
      </h2>
      {content}
    </div>
  );
}
