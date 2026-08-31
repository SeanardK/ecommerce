import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { requireAdmin } from '~/lib/auth.server';
import { apiAuthed } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Order, Paginated } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const orders = await apiAuthed<Paginated<Order>>(request, '/admin/orders?per_page=50');
  return json({ orders });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();

  await apiAuthed(request, `/admin/orders/${form.get('order_id')}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: form.get('status') }),
  });
  return json({ ok: true });
}

export default function AdminOrders() {
  const { orders } = useLoaderData<typeof loader>();

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Orders</h2>
      <div className="space-y-2">
        {orders.data.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 text-sm"
          >
            <span>
              Order #{order.id} - {formatCents(order.total_cents)}
              <span className="ml-2 text-slate-400">{order.status}</span>
            </span>
            <Form method="post" className="flex items-center gap-2">
              <input type="hidden" name="intent" value="status" />
              <input type="hidden" name="order_id" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="rounded border border-slate-300 px-2 py-1"
              >
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
  );
}
