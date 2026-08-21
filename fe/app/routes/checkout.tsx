import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { requireUser } from '~/lib/auth.server';
import { apiAuthed } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { CartSummary, Order } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const cart = await apiAuthed<CartSummary>(request, '/cart');
  return json({ cart, user });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);
  const form = await request.formData();

  const order = await apiAuthed<Order>(request, '/checkout', {
    method: 'POST',
    body: JSON.stringify({
      line1: form.get('line1'),
      line2: form.get('line2'),
      city: form.get('city'),
      region: form.get('region'),
      postal_code: form.get('postal_code'),
      country: form.get('country'),
    }),
  });

  return redirect(`/orders?placed=${order.id}`);
}

const field = 'mt-1 block w-full rounded border border-slate-300 px-2 py-1';

export default function CheckoutPage() {
  const { cart, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Checkout</h1>
        <p className="mb-4 text-slate-600">
          Subtotal {formatCents(cart.subtotal_cents)}
        </p>
        <Form method="post" className="space-y-3">
          <label className="block text-sm">
            Address line 1
            <input name="line1" required className={field} />
          </label>
          <label className="block text-sm">
            Address line 2
            <input name="line2" className={field} />
          </label>
          <label className="block text-sm">
            City
            <input name="city" required className={field} />
          </label>
          <label className="block text-sm">
            Region
            <input name="region" required className={field} />
          </label>
          <label className="block text-sm">
            Postal code
            <input name="postal_code" required className={field} />
          </label>
          <label className="block text-sm">
            Country
            <input name="country" required className={field} />
          </label>
          <button
            type="submit"
            className="w-full rounded bg-slate-900 px-4 py-2 text-white"
          >
            Pay and place order
          </button>
        </Form>
      </main>
    </div>
  );
}
