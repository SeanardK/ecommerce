import { Link } from '@remix-run/react';

interface ErrorPageProps {
  status: number;
  message?: string;
}

interface StatusCopy {
  title: string;
  description: string;
}

function copyFor(status: number): StatusCopy {
  switch (status) {
    case 401:
      return {
        title: 'Sign in required',
        description: 'You need to be signed in to view this page.',
      };
    case 403:
      return {
        title: 'Access denied',
        description: "You don't have permission to view this page.",
      };
    case 404:
      return {
        title: 'Page not found',
        description: "The page you're looking for doesn't exist or may have moved.",
      };
    case 422:
      return {
        title: "That didn't go through",
        description: 'The request was rejected — check the details below and try again.',
      };
    case 429:
      return {
        title: 'Slow down',
        description: "You've made too many requests. Try again in a moment.",
      };
    case 500:
    case 502:
    case 503:
      return {
        title: 'Something went wrong',
        description: "We hit a snag on our end. It's not you — try again shortly.",
      };
    default:
      return {
        title: 'Unexpected error',
        description: 'Something unexpected happened.',
      };
  }
}

function StatusGlyph({ status }: { status: number }) {
  return (
    <div className="mb-2 text-6xl font-bold tracking-tight text-slate-200 sm:text-8xl">
      {status}
    </div>
  );
}

export function ErrorPage({ status, message }: ErrorPageProps) {
  const { title, description } = copyFor(status);
  const showMessage = message && message !== title && message.trim() !== '';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <StatusGlyph status={status} />
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-slate-500">{description}</p>

      {showMessage ? (
        <p className="mt-4 max-w-md rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {message}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-3">
        {status === 401 ? (
          <Link
            to="/auth/login"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
          >
            Sign in
          </Link>
        ) : null}
        <Link
          to="/"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
