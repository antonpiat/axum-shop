export type UserRole = "Admin" | "User" | "Guest";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  photo: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number | null;
  name: string;
  description: string | null;
}

export interface Product {
  id: number | null;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  image_url: string | null;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiErrorBody {
  status: number;
  error: string;
}

export interface ProductQueryParams {
  query?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  pageSize?: number;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  name: string;
  description?: string | null;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  category_id?: number | null;
  stock: number;
  image_url?: string | null;
}

export interface UpdateProductInput {
  name: string;
  description?: string | null;
  price: number;
  category_id?: number | null;
  stock: number;
  image_url?: string | null;
}

export interface UploadImageResponse {
  url: string;
}
