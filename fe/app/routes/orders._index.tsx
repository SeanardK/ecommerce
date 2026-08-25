import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { requireUser } from '~/lib/auth.server';
import { apiAuthed } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Order, Paginated } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';
  const orders = await apiAuthed<Paginated<Order>>(request, `/orders?page=${page}`);
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
        {orders.data.length === 0 ? (
          <p className="text-slate-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.data.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block rounded border border-slate-200 bg-white p-4 hover:shadow"
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
              </Link>
            ))}
          </div>
        )}
        {orders.last_page > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              to={`?page=${Math.max(1, orders.current_page - 1)}`}
              className="rounded border px-3 py-1 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              aria-disabled={orders.current_page <= 1}
            >
              Previous
            </Link>
            <span className="text-slate-500">
              Page {orders.current_page} of {orders.last_page}
            </span>
            <Link
              to={`?page=${Math.min(orders.last_page, orders.current_page + 1)}`}
              className="rounded border px-3 py-1 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              aria-disabled={orders.current_page >= orders.last_page}
            >
              Next
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
