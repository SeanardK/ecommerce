import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { requireUser } from '~/lib/auth.server';
import { apiAuthed } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Order } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const orders = await apiAuthed<Order[]>(request, '/orders');
  return json({ orders, user });
}

export default function OrdersPage() {
  const { orders, user } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const placed = params.get('placed');

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Your orders</h1>
        {placed ? (
          <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            Order #{placed} placed successfully.
          </p>
        ) : null}
        {orders.length === 0 ? (
          <p className="text-slate-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">
                    {order.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Total {formatCents(order.total_cents)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
