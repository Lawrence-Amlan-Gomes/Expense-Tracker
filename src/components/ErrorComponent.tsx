'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ErrorComponent({ is404 = false }) {
  const pathname = usePathname();
  const trimmedPathname = pathname.split('/').pop() || 'unknown';

  const message = is404
    ? `The route '/${trimmedPathname}' isn't a valid page for this application.`
    : 'We hit an unexpected error. Please try again later or contact support.';

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-soft px-4">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="eyebrow mb-3">{is404 ? 'Error 404' : 'Error'}</p>
        <h1 className="mb-4 text-3xl sm:text-5xl">
          {is404 ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="mb-8 text-base font-light text-body sm:text-lg">{message}</p>
        <Link href="/" className="btn-primary">
          Go back home
        </Link>
      </div>
    </div>
  );
}
