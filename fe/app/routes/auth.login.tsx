import type { LoaderFunctionArgs } from '@remix-run/node';
import { startLogin } from '~/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  return startLogin(request);
}
