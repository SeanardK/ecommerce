import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { requireAdmin } from '~/lib/auth.server';
import { apiAuthed, apiGet } from '~/lib/api.server';
import type { Category } from '~/features/shop/types';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const categories = await apiGet<Category[]>('/categories');
  return json({ categories });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();

  if (form.get('intent') === 'category_delete') {
    await apiAuthed(request, `/admin/categories/${form.get('category_id')}`, {
      method: 'DELETE',
    });
    return json({ ok: true });
  }

  await apiAuthed(request, '/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name: form.get('name') }),
  });
  return json({ ok: true });
}

export default function AdminCategories() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div>
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">New category</h2>
        <Form method="post" className="flex gap-2">
          <input type="hidden" name="intent" value="category_create" />
          <input
            name="name"
            placeholder="Category name"
            required
            className="rounded border border-slate-300 px-2 py-1"
          />
          <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Add category
          </button>
        </Form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Categories</h2>
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 text-sm"
            >
              <span>
                <span className="font-medium">{category.name}</span>
                <span className="ml-2 text-slate-400">{category.slug}</span>
              </span>
              <Form method="post">
                <input type="hidden" name="intent" value="category_delete" />
                <input type="hidden" name="category_id" value={category.id} />
                <button className="rounded border px-2 py-1 text-red-600">Delete</button>
              </Form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
