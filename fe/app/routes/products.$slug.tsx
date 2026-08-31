import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Nav } from '~/components/nav';
import { getUser, requireUser } from '~/lib/auth.server';
import { apiAuthed, apiGet } from '~/lib/api.server';
import { resolveImageUrl } from '~/lib/media.server';
import { formatCents } from '~/lib/money';
import type { Product } from '~/features/shop/types';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const [product, user] = await Promise.all([
    apiGet<Product>(`/products/${params.slug}`),
    getUser(request),
  ]);
  const canonical = new URL(request.url).origin + `/products/${product.slug}`;
  return json({
    product: { ...product, image_url: resolveImageUrl(product.image_url) },
    user,
    canonical,
  });
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

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Out of stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      In stock
    </span>
  );
}

function QuantityStepper({ max }: { max: number }) {
  const [quantity, setQuantity] = useState(1);
  const clamp = (n: number) => Math.min(Math.max(n, 1), Math.max(max, 1));

  return (
    <div className="flex items-center rounded-md border border-slate-300">
      <button
        type="button"
        onClick={() => setQuantity((q) => clamp(q - 1))}
        className="px-3 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        name="quantity"
        min={1}
        max={max}
        value={quantity}
        onChange={(e) => setQuantity(clamp(Number(e.target.value) || 1))}
        className="w-14 border-x border-slate-300 py-2 text-center text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setQuantity((q) => clamp(q + 1))}
        className="px-3 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        disabled={quantity >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default function ProductDetail() {
  const { product, user, canonical } = useLoaderData<typeof loader>();
  const outOfStock = product.stock <= 0;

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema(product, canonical)),
          }}
        />

        <nav className="mb-6 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-700 hover:underline">
            Shop
          </Link>
          {product.category ? (
            <>
              <span className="mx-1.5">/</span>
              <Link
                to={`/?category=${product.category.slug}`}
                className="hover:text-slate-700 hover:underline"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  className="h-24 w-24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5m-18 0A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25m-18 0 5.03-5.03a1.5 1.5 0 0 1 2.12 0l2.35 2.35m8.5 2.68-4.65-4.65a1.5 1.5 0 0 0-2.12 0L13.5 15"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.category ? (
              <span className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
                {product.category.name}
              </span>
            ) : null}

            <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900">
                {formatCents(product.price_cents)}
              </span>
              <StockBadge stock={product.stock} />
            </div>

            <p className="mt-5 leading-relaxed text-slate-600">{product.description}</p>

            <div className="mt-auto pt-8">
              {outOfStock ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-md bg-slate-200 px-6 py-3 text-sm font-medium text-slate-400 sm:w-auto"
                >
                  Out of stock
                </button>
              ) : user ? (
                <Form method="post" className="flex flex-wrap items-center gap-3">
                  <QuantityStepper max={product.stock} />
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
                  >
                    Add to cart
                  </button>
                </Form>
              ) : (
                <Link
                  to="/auth/login"
                  className="inline-block rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
                >
                  Sign in to buy
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
