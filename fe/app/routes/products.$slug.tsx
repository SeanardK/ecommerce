import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
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
  const canonical = new URL(request.url).origin + `/products/${product.slug}`;
  return json({ product, user, canonical });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: 'Product not found | Shop' }];
  }

  const { product, canonical } = data;
  const description = product.description.slice(0, 160);

  return [
    { title: `${product.name} | Shop` },
    { name: 'description', content: description },
    { property: 'og:type', content: 'product' },
    { property: 'og:title', content: product.name },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    ...(product.image_url ? [{ property: 'og:image', content: product.image_url }] : []),
    { name: 'twitter:card', content: product.image_url ? 'summary_large_image' : 'summary' },
    { tagName: 'link', rel: 'canonical', href: canonical },
  ];
};

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

function productSchema(product: Product, canonical: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.slug,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'USD',
      price: (product.price_cents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };
}

export default function ProductDetail() {
  const { product, user, canonical } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema(product, canonical)),
          }}
        />
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="mb-4 h-64 w-full rounded-lg object-cover"
          />
        ) : null}
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
