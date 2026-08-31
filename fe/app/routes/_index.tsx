import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { getUser } from '~/lib/auth.server';
import { apiGet } from '~/lib/api.server';
import { resolveImageUrl } from '~/lib/media.server';
import { formatCents } from '~/lib/money';
import type { Category, Paginated, Product } from '~/features/shop/types';

export const meta: MetaFunction = () => [{ title: 'Shop' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') ?? '';
  const search = url.searchParams.get('search') ?? '';
  const page = url.searchParams.get('page') ?? '1';

  const query = new URLSearchParams();
  if (category) query.set('category', category);
  if (search) query.set('search', search);
  query.set('page', page);

  const [products, categories, user] = await Promise.all([
    apiGet<Paginated<Product>>(`/products?${query.toString()}`),
    apiGet<Category[]>('/categories'),
    getUser(request),
  ]);

  return json({
    products: {
      ...products,
      data: products.data.map((product) => ({
        ...product,
        image_url: resolveImageUrl(product.image_url),
      })),
    },
    categories,
    category,
    search,
    user,
  });
}

function pageLink(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `/?${next.toString()}`;
}

export default function Index() {
  const { products, categories, category, search, user } =
    useLoaderData<typeof loader>();
  const [params] = useSearchParams();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Form method="get" className="mb-4 flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search products"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          {category ? (
            <input type="hidden" name="category" value={category} />
          ) : null}
          <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Search
          </button>
        </Form>

        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            to="/"
            className={`rounded border px-3 py-1 text-sm ${category === '' ? 'bg-slate-900 text-white' : ''}`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/?category=${cat.slug}`}
              className={`rounded border px-3 py-1 text-sm ${category === cat.slug ? 'bg-slate-900 text-white' : ''}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {products.data.length === 0 ? (
          <p className="text-slate-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white hover:shadow"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-slate-400">
                    No image
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-medium">{product.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {product.description}
                  </p>
                  <p className="mt-2 font-semibold">
                    {formatCents(product.price_cents)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {products.last_page > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            {products.current_page > 1 ? (
              <Link
                to={pageLink(params, products.current_page - 1)}
                className="rounded border px-3 py-1"
              >
                Previous
              </Link>
            ) : null}
            <span className="text-slate-500">
              Page {products.current_page} of {products.last_page}
            </span>
            {products.current_page < products.last_page ? (
              <Link
                to={pageLink(params, products.current_page + 1)}
                className="rounded border px-3 py-1"
              >
                Next
              </Link>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
