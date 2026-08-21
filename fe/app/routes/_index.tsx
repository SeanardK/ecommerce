import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Nav } from '~/components/nav';
import { getUser } from '~/lib/auth.server';
import { apiGet } from '~/lib/api.server';
import { formatCents } from '~/lib/money';
import type { Category, Paginated, Product } from '~/features/shop/types';

export const meta: MetaFunction = () => [{ title: 'Shop' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') ?? '';
  const query = category ? `?category=${encodeURIComponent(category)}` : '';

  const [products, categories, user] = await Promise.all([
    apiGet<Paginated<Product>>(`/products${query}`),
    apiGet<Category[]>('/categories'),
    getUser(request),
  ]);

  return json({ products, categories, category, user });
}

export default function Index() {
  const { products, categories, category, user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Nav user={user} />
      <main className="mx-auto max-w-5xl px-4 py-6">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow"
            >
              <h2 className="font-medium">{product.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{product.description}</p>
              <p className="mt-2 font-semibold">{formatCents(product.price_cents)}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
