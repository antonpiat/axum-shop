import type {
  ApiErrorBody,
  Category,
  CreateCategoryInput,
  CreateProductInput,
  LoginInput,
  Paginated,
  Product,
  ProductQueryParams,
  RegisterInput,
  UpdateCategoryInput,
  UpdateProductInput,
  UploadImageResponse,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error || response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export function register(input: RegisterInput) {
  return apiFetch<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return apiFetch<string>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiFetch<string>("/api/auth/logout");
}

export function getMe() {
  return apiFetch<User>("/api/auth/me");
}

export function getCategories() {
  return apiFetch<Category[]>("/api/categories");
}

export function getCategory(id: number) {
  return apiFetch<Category | null>(`/api/categories/${id}`);
}

export function createCategory(input: CreateCategoryInput) {
  return apiFetch<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: number, input: UpdateCategoryInput) {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: number) {
  return apiFetch<string>(`/api/categories/${id}`, { method: "DELETE" });
}

export function getProducts(params: ProductQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.category_id != null) search.set("category_id", String(params.category_id));
  if (params.min_price != null) search.set("min_price", String(params.min_price));
  if (params.max_price != null) search.set("max_price", String(params.max_price));
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  return apiFetch<Paginated<Product>>(`/api/products${query ? `?${query}` : ""}`);
}

export function getProduct(id: number) {
  return apiFetch<Product | null>(`/api/products/${id}`);
}

export function createProduct(input: CreateProductInput) {
  return apiFetch<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(id: number, input: UpdateProductInput) {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteProduct(id: number) {
  return apiFetch<string>(`/api/products/${id}`, { method: "DELETE" });
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<UploadImageResponse>("/api/products/upload", {
    method: "POST",
    body: formData,
  });
}
