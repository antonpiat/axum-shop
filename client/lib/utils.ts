export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function stockLabel(stock: number): "In stock" | "Low stock" | "Out of stock" {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return "Low stock";
  return "In stock";
}

export function stockVariant(stock: number): "success" | "warning" | "danger" {
  if (stock <= 0) return "danger";
  if (stock <= 5) return "warning";
  return "success";
}
