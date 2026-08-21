export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  stock: number;
  active: boolean;
  category?: Category;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface CartLine {
  product_id: number;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface CartSummary {
  items: CartLine[];
  subtotal_cents: number;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
}

export interface Order {
  id: number;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  payment_reference: string | null;
  created_at: string;
  items?: OrderItem[];
}
