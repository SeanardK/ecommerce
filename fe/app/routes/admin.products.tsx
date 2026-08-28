import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  json,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { requireAdmin } from '~/lib/auth.server';
import { apiAuthed, apiGet } from '~/lib/api.server';
import type { Category, Paginated, Product } from '~/features/shop/types';

const uploadHandler = unstable_createMemoryUploadHandler({
  maxPartSize: 2 * 1024 * 1024,
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [products, categories] = await Promise.all([
    apiAuthed<Paginated<Product>>(request, '/admin/products?per_page=50'),
    apiGet<Category[]>('/categories'),
  ]);
  return json({ products, categories });
}

async function resolveImageUrl(
  request: Request,
  form: FormData,
): Promise<string | null> {
  const file = form.get('image_file');
  if (file instanceof File && file.size > 0) {
    const upload = new FormData();
    upload.append('image', file, file.name);
    const uploaded = await apiAuthed<{ url: string }>(
      request,
      '/admin/products/images',
      { method: 'POST', body: upload },
    );
    return uploaded.url;
  }

  const url = form.get('image_url');
  return typeof url === 'string' && url.trim() !== '' ? url.trim() : null;
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  const contentType = request.headers.get('Content-Type') ?? '';
  const form = contentType.includes('multipart/form-data')
    ? await unstable_parseMultipartFormData(request, uploadHandler)
    : await request.formData();

  const intent = form.get('intent');

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
    image_url: await resolveImageUrl(request, form),
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

const inputClass = 'rounded border border-slate-300 px-2 py-1';

export default function AdminProducts() {
  const { products, categories } = useLoaderData<typeof loader>();

  return (
    <div>
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">New product</h2>
        <Form
          method="post"
          encType="multipart/form-data"
          className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="intent" value="product_create" />
          <select name="category_id" className={inputClass}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input name="name" placeholder="Name" required className={inputClass} />
          <input
            name="price_cents"
            type="number"
            placeholder="Price in cents"
            required
            className={inputClass}
          />
          <input name="stock" type="number" placeholder="Stock" required className={inputClass} />
          <input name="description" placeholder="Description" required className={inputClass} />
          <input name="image_url" placeholder="Image URL" className={inputClass} />
          <label className="text-sm text-slate-600 sm:col-span-2">
            Or upload an image
            <input
              name="image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm"
            />
            <span className="text-xs text-slate-400">
              JPEG, PNG or WebP up to 2 MB. An uploaded file wins over the URL.
            </span>
          </label>
          <button className="rounded bg-slate-900 px-4 py-2 text-white sm:col-span-2">
            Create product
          </button>
        </Form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Products</h2>
        <div className="space-y-2">
          {products.data.map((product) => (
            <Form
              key={product.id}
              method="post"
              encType="multipart/form-data"
              className="rounded border border-slate-200 bg-white p-3 text-sm"
            >
              <input type="hidden" name="product_id" value={product.id} />
              <input type="hidden" name="category_id" value={product.category_id} />
              <input type="hidden" name="name" value={product.name} />
              <input type="hidden" name="description" value={product.description} />

              <div className="flex flex-wrap items-center gap-2">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                    none
                  </span>
                )}
                <span className="w-40 truncate font-medium">{product.name}</span>
                <label className="flex items-center gap-1">
                  Price
                  <input
                    name="price_cents"
                    type="number"
                    defaultValue={product.price_cents}
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Stock
                  <input
                    name="stock"
                    type="number"
                    defaultValue={product.stock}
                    className="w-20 rounded border border-slate-300 px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Active
                  <input name="active" type="checkbox" defaultChecked={product.active} />
                </label>
                <button name="intent" value="product_update" className="rounded border px-2 py-1">
                  Save
                </button>
                <button
                  name="intent"
                  value="product_delete"
                  className="rounded border px-2 py-1 text-red-600"
                >
                  Delete
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <input
                  name="image_url"
                  defaultValue={product.image_url ?? ''}
                  placeholder="Image URL"
                  className="w-72 rounded border border-slate-300 px-2 py-1"
                />
                <input
                  name="image_file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs"
                />
              </div>
            </Form>
          ))}
        </div>
      </section>
    </div>
  );
}
