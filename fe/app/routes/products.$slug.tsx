import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { getUser, requireUser } from '~/lib/auth.server';
import { apiAuthed, apiGet } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Product } from '~/features/shop/types';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const [product, user] = await Promise.all([
    apiGet<Product>(`/products/${params.slug}`),
    getUser(request),
  ]);
  return json({ product, user });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUser(request);
  const product = await apiGet<Product>(`/products/${params.slug}`);
  const form = await request.formData();

  await apiAuthed(request, '/cart/items', {
    method: 'POST',
    body: JSON.stringify({
      product_id: product.id,
      quantity: Number(form.get('quantity') ?? 1),
    }),
  });

  return redirect('/cart');
}

export default function ProductDetail() {
  const { product, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="mt-2 text-slate-600">{product.description}</p>
        <p className="mt-4 text-xl font-bold">{formatCents(product.price_cents)}</p>
        <p className="mt-1 text-sm text-slate-500">In stock: {product.stock}</p>

        <Form method="post" className="mt-6 flex items-end gap-3">
          <label className="text-sm">
            Quantity
            <input
              type="number"
              name="quantity"
              min={1}
              max={product.stock}
              defaultValue={1}
              className="mt-1 block w-24 rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            Add to cart
          </button>
        </Form>
      </main>
    </div>
  );
}
