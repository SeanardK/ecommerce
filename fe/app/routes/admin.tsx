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
    apiGet<Paginated<Product>>('/products'),
    apiGet<Category[]>('/categories'),
    apiAuthed<Order[]>(request, '/admin/orders'),
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

  await apiAuthed(request, '/admin/products', {
    method: 'POST',
    body: JSON.stringify({
      category_id: Number(form.get('category_id')),
      name: form.get('name'),
      description: form.get('description'),
      price_cents: Number(form.get('price_cents')),
      stock: Number(form.get('stock')),
      active: true,
    }),
  });

  return json({ ok: true });
}

export default function AdminPage() {
  const { products, categories, orders, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-semibold">Admin</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">New product</h2>
          <Form
            method="post"
            className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
          >
            <select name="category_id" className="rounded border px-2 py-1">
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input name="name" placeholder="Name" required className="rounded border px-2 py-1" />
            <input name="price_cents" type="number" placeholder="Price in cents" required className="rounded border px-2 py-1" />
            <input name="stock" type="number" placeholder="Stock" required className="rounded border px-2 py-1" />
            <input name="description" placeholder="Description" required className="rounded border px-2 py-1 sm:col-span-2" />
            <button className="rounded bg-slate-900 px-4 py-2 text-white sm:col-span-2">
              Create product
            </button>
          </Form>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Products</h2>
          <div className="space-y-2">
            {products.data.map((product) => (
              <div key={product.id} className="flex justify-between rounded border border-slate-200 bg-white p-3 text-sm">
                <span>{product.name}</span>
                <span>{formatCents(product.price_cents)} | stock {product.stock}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium">Orders</h2>
          <div className="space-y-2">
            {orders.map((order) => (
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
