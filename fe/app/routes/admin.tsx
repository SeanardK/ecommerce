import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { requireAdmin } from '~/lib/auth.server';
import { apiAuthed, apiGet } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Category, Order, Paginated, Product } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const [products, categories, orders] = await Promise.all([
    apiGet<Paginated<Product>>('/products?per_page=50'),
    apiGet<Category[]>('/categories'),
    apiAuthed<Paginated<Order>>(request, '/admin/orders?per_page=50'),
  ]);
  return json({ products, categories, orders, user });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get('intent');

  if (intent === 'status') {
    await apiAuthed(request, `/admin/orders/${form.get('order_id')}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: form.get('status') }),
    });
    return json({ ok: true });
  }

  if (intent === 'category_create') {
    await apiAuthed(request, '/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: form.get('name') }),
    });
    return json({ ok: true });
  }

  if (intent === 'product_delete') {
    await apiAuthed(request, `/admin/products/${form.get('product_id')}`, {
      method: 'DELETE',
    });
    return json({ ok: true });
  }

  const payload = {
    category_id: Number(form.get('category_id')),
    name: form.get('name'),
    description: form.get('description'),
    image_url: form.get('image_url') || null,
    price_cents: Number(form.get('price_cents')),
    stock: Number(form.get('stock')),
    active: form.get('active') === 'on' || form.get('active') === 'true',
  };

  if (intent === 'product_update') {
    await apiAuthed(request, `/admin/products/${form.get('product_id')}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return json({ ok: true });
  }

  await apiAuthed(request, '/admin/products', {
    method: 'POST',
    body: JSON.stringify({ ...payload, active: true }),
  });
  return json({ ok: true });
}

const inputClass = 'rounded border px-2 py-1';

export default function AdminPage() {
  const { products, categories, orders, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-semibold">Admin</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">New category</h2>
          <Form method="post" className="flex gap-2">
            <input type="hidden" name="intent" value="category_create" />
            <input name="name" placeholder="Category name" required className={inputClass} />
            <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
              Add category
            </button>
          </Form>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">New product</h2>
          <Form
            method="post"
            className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
          >
            <select name="category_id" className={inputClass}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input name="name" placeholder="Name" required className={inputClass} />
            <input name="price_cents" type="number" placeholder="Price in cents" required className={inputClass} />
            <input name="stock" type="number" placeholder="Stock" required className={inputClass} />
            <input name="image_url" placeholder="Image URL" className={inputClass} />
            <input name="description" placeholder="Description" required className={inputClass} />
            <button className="rounded bg-slate-900 px-4 py-2 text-white sm:col-span-2">
              Create product
            </button>
          </Form>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Products</h2>
          <div className="space-y-2">
            {products.data.map((product) => (
              <Form
                key={product.id}
                method="post"
                className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white p-3 text-sm"
              >
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="category_id" value={product.category_id} />
                <input type="hidden" name="name" value={product.name} />
                <input type="hidden" name="description" value={product.description} />
                <input type="hidden" name="image_url" value={product.image_url ?? ''} />
                <span className="w-40 truncate font-medium">{product.name}</span>
                <label className="flex items-center gap-1">
                  Price
                  <input name="price_cents" type="number" defaultValue={product.price_cents} className="w-24 rounded border px-2 py-1" />
                </label>
                <label className="flex items-center gap-1">
                  Stock
                  <input name="stock" type="number" defaultValue={product.stock} className="w-20 rounded border px-2 py-1" />
                </label>
                <label className="flex items-center gap-1">
                  Active
                  <input name="active" type="checkbox" defaultChecked={product.active} />
                </label>
                <button
                  name="intent"
                  value="product_update"
                  className="rounded border px-2 py-1"
                >
                  Save
                </button>
                <button
                  name="intent"
                  value="product_delete"
                  className="rounded border px-2 py-1 text-red-600"
                >
                  Delete
                </button>
              </Form>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium">Orders</h2>
          <div className="space-y-2">
            {orders.data.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 text-sm">
                <span>Order #{order.id} - {formatCents(order.total_cents)}</span>
                <Form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="intent" value="status" />
                  <input type="hidden" name="order_id" value={order.id} />
                  <select name="status" defaultValue={order.status} className="rounded border px-2 py-1">
                    <option value="paid">paid</option>
                    <option value="fulfilled">fulfilled</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  <button className="rounded border px-2 py-1">Update</button>
                </Form>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
