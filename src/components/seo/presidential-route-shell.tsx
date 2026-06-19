import Link from "next/link";

import { getStaticRouteShellLinks } from "@/lib/seo/route-page";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

type PresidentialRouteShellProps = {
  route: SeoRouteRecord;
};

export function PresidentialRouteShell({ route }: PresidentialRouteShellProps) {
  const links = getStaticRouteShellLinks(route);

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-emerald-800">
            Official Presidential
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            {route.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
            {route.description}
          </p>
        </header>

        <section
          aria-label="Approval status"
          className="border-l-4 border-emerald-800 bg-zinc-50 px-5 py-4"
        >
          <p className="text-base leading-7 text-zinc-700">
            This page is prepared as an official route shell while final source
            records, content, metadata, and compliance approvals are completed.
          </p>
          <p className="mt-3 text-sm font-medium text-zinc-600">
            For adults 21+ where legal.
          </p>
        </section>

        {links.length > 0 ? (
          <nav aria-label="Presidential route shells">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.path}
                    className="block border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 transition-colors hover:border-emerald-800 hover:text-emerald-900"
                  >
                    {link.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
