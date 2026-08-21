import type { LoaderFunctionArgs } from '@remix-run/node';
import { handleCallback } from '~/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  return handleCallback(request);
}
