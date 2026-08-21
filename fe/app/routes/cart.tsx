import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { requireUser } from '~/lib/auth.server';
import { apiAuthed } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { CartSummary } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const cart = await apiAuthed<CartSummary>(request, '/cart');
  return json({ cart, user });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const intent = form.get('intent');
  const productId = Number(form.get('product_id'));

  if (intent === 'remove') {
    await apiAuthed(request, `/cart/items/${productId}`, { method: 'DELETE' });
  } else {
    await apiAuthed(request, `/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: Number(form.get('quantity')) }),
    });
  }

  return json({ ok: true });
}

export default function CartPage() {
  const { cart, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Your cart</h1>
        {cart.items.length === 0 ? (
          <p className="text-slate-500">Your cart is empty.</p>
        ) : (
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between rounded border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatCents(item.unit_price_cents)} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Form method="post" className="flex items-center gap-2">
                    <input type="hidden" name="product_id" value={item.product_id} />
                    <input
                      type="number"
                      name="quantity"
                      min={1}
                      defaultValue={item.quantity}
                      className="w-20 rounded border border-slate-300 px-2 py-1"
                    />
                    <button className="rounded border px-2 py-1 text-sm">
                      Update
                    </button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="product_id" value={item.product_id} />
                    <input type="hidden" name="intent" value="remove" />
                    <button className="rounded border px-2 py-1 text-sm text-red-600">
                      Remove
                    </button>
                  </Form>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-semibold">
                Subtotal {formatCents(cart.subtotal_cents)}
              </span>
              <Link
                to="/checkout"
                className="rounded bg-slate-900 px-4 py-2 text-white"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
