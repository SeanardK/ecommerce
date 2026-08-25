import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { requireUser } from '~/lib/auth.server';
import { apiAuthed } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Order } from '~/features/shop/types';

const CANCELLABLE_STATUSES = ['pending', 'paid'];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const order = await apiAuthed<Order>(request, `/orders/${params.id}`);
  return json({ order, user });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUser(request);
  await apiAuthed(request, `/orders/${params.id}/cancel`, { method: 'POST' });
  return redirect(`/orders/${params.id}`);
}

export default function OrderDetailPage() {
  const { order, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/orders" className="text-sm text-slate-500 hover:underline">
          Back to orders
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">
              {order.status}
            </span>
            {CANCELLABLE_STATUSES.includes(order.status) ? (
              <Form method="post">
                <button className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">
                  Cancel order
                </button>
              </Form>
            ) : null}
          </div>
        </div>

        <div className="mt-4 divide-y rounded border border-slate-200 bg-white">
          {order.items?.map((item) => (
            <div
              key={item.product_id}
              className="flex justify-between p-3 text-sm"
            >
              <span>
                {item.product_name} x {item.quantity}
              </span>
              <span>{formatCents(item.unit_price_cents * item.quantity)}</span>
            </div>
          ))}
        </div>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd>{formatCents(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tax</dt>
            <dd>{formatCents(order.tax_cents)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{formatCents(order.total_cents)}</dd>
          </div>
        </dl>

        {order.address ? (
          <div className="mt-4 rounded border border-slate-200 bg-white p-3 text-sm text-slate-600">
            <p className="mb-1 font-medium text-slate-800">Shipping to</p>
            <p>{order.address.line1}</p>
            {order.address.line2 ? <p>{order.address.line2}</p> : null}
            <p>
              {order.address.city}, {order.address.region}{' '}
              {order.address.postal_code}
            </p>
            <p>{order.address.country}</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
