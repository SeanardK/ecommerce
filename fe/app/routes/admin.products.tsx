import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import {
  json,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { useMemo, useRef, useState } from 'react';
import { requireAdmin } from '~/lib/auth.server';
import { apiAuthed, apiGet } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
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

const inputClass =
  'rounded-md border border-slate-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';
const labelClass = 'block text-xs font-medium text-slate-500';

/** Thumbnail that falls back to a placeholder glyph on missing/broken src. */
function ImagePreview({
  src,
  alt,
  size = 'md',
}: {
  src: string | null;
  alt: string;
  size?: 'md' | 'lg';
}) {
  const [broken, setBroken] = useState(false);
  const dims = size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';

  if (!src || broken) {
    return (
      <div
        className={`flex ${dims} shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5m-18 0A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25m-18 0 5.03-5.03a1.5 1.5 0 0 1 2.12 0l2.35 2.35m8.5 2.68-4.65-4.65a1.5 1.5 0 0 0-2.12 0L13.5 15"
          />
        </svg>
        <span className="text-[10px] font-medium uppercase tracking-wide">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className={`${dims} shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm`}
    />
  );
}

/**
 * Shared image_url + file inputs with a live preview: typing a URL or picking
 * a file updates the thumbnail immediately, before the form is submitted.
 */
function ImageField({
  name,
  initialUrl,
  size,
}: {
  name: string;
  initialUrl: string | null;
  size: 'md' | 'lg';
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const objectUrlRef = useRef<string | null>(null);

  const revokePreviousObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <ImagePreview src={previewUrl} alt="Preview" size={size} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div>
          <label className={labelClass}>Image URL</label>
          <input
            name={`${name}_url`}
            defaultValue={initialUrl ?? ''}
            placeholder="https://..."
            className={`${inputClass} w-full`}
            onChange={(e) => {
              revokePreviousObjectUrl();
              setPreviewUrl(e.target.value.trim() || null);
            }}
          />
        </div>
        <div>
          <label className={labelClass}>
            Or upload <span className="font-normal normal-case text-slate-400">(JPEG/PNG/WebP, up to 2MB, wins over URL)</span>
          </label>
          <input
            name={`${name}_file`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-700"
            onChange={(e) => {
              const file = e.target.files?.[0];
              revokePreviousObjectUrl();
              if (file) {
                const url = URL.createObjectURL(file);
                objectUrlRef.current = url;
                setPreviewUrl(url);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { products, categories } = useLoaderData<typeof loader>();
  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">New product</h2>
        <Form
          method="post"
          encType="multipart/form-data"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="intent" value="product_create" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select name="category_id" className={`${inputClass} w-full`}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" placeholder="Product name" required className={`${inputClass} w-full`} />
            </div>
            <div>
              <label className={labelClass}>Price (cents)</label>
              <input name="price_cents" type="number" placeholder="1000" required className={`${inputClass} w-full`} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input name="stock" type="number" placeholder="10" required className={`${inputClass} w-full`} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <input name="description" placeholder="Short description" required className={`${inputClass} w-full`} />
            </div>
            <div className="sm:col-span-2">
              <ImageField name="image" initialUrl={null} size="lg" />
            </div>
          </div>
          <button className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700">
            Create product
          </button>
        </Form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Products <span className="text-sm font-normal text-slate-400">({products.total})</span>
        </h2>
        <div className="space-y-3">
          {products.data.map((product) => (
            <Form
              key={product.id}
              method="post"
              encType="multipart/form-data"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <input type="hidden" name="product_id" value={product.id} />
              <input type="hidden" name="category_id" value={product.category_id} />
              <input type="hidden" name="name" value={product.name} />
              <input type="hidden" name="description" value={product.description} />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ImageField name="image" initialUrl={product.image_url} size="md" />

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400">
                        {categoryNames.get(product.category_id) ?? 'Uncategorized'} · {formatCents(product.price_cents)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        product.active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label>
                      <span className={labelClass}>Price</span>
                      <input
                        name="price_cents"
                        type="number"
                        defaultValue={product.price_cents}
                        className={`${inputClass} w-28`}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Stock</span>
                      <input
                        name="stock"
                        type="number"
                        defaultValue={product.stock}
                        className={`${inputClass} w-24`}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 pb-1.5">
                      <input
                        name="active"
                        type="checkbox"
                        defaultChecked={product.active}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600">Active</span>
                    </label>
                    <div className="ml-auto flex gap-2 pb-0.5">
                      <button
                        name="intent"
                        value="product_update"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Save
                      </button>
                      <button
                        name="intent"
                        value="product_delete"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          ))}
        </div>
      </section>
    </div>
  );
}
