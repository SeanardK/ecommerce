import { Form, Link } from '@remix-run/react';
import type { SessionUser } from '~/lib/auth.server';

export function Nav({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          Shop
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/cart" className="hover:underline">
            Cart
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="hover:underline">
                Orders
              </Link>
              {user.roles.includes('admin') ? (
                <Link to="/admin" className="hover:underline">
                  Admin
                </Link>
              ) : null}
              <span className="text-slate-500">{user.email}</span>
              <Form method="post" action="/auth/logout">
                <button type="submit" className="rounded border px-2 py-1">
                  Sign out
                </button>
              </Form>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="rounded bg-slate-900 px-3 py-1 text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
