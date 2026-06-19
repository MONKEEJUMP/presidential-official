import Link from "next/link";

import {
  buildRouteShellBreadcrumbItems,
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import { getStaticRouteShellLinks } from "@/lib/seo/route-page";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

type PresidentialRouteShellProps = {
  route: SeoRouteRecord;
};

export function PresidentialRouteShell({ route }: PresidentialRouteShellProps) {
  const links = getStaticRouteShellLinks(route);
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const breadcrumbs = buildRouteShellBreadcrumbItems(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      <main className="min-h-screen bg-white px-6 py-12 text-zinc-950 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          {breadcrumbs.length > 1 ? (
            <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
              <ol className="flex flex-wrap items-center gap-2">
                {breadcrumbs.map((breadcrumb, index) => {
                  const isCurrent = index === breadcrumbs.length - 1;

                  return (
                    <li key={breadcrumb.path} className="flex items-center gap-2">
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-zinc-400">
                          /
                        </span>
                      ) : null}
                      {isCurrent ? (
                        <span aria-current="page" className="text-zinc-800">
                          {breadcrumb.name}
                        </span>
                      ) : (
                        <Link
                          href={breadcrumb.path}
                          className="font-medium text-emerald-800 hover:text-emerald-900"
                        >
                          {breadcrumb.name}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}

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
    </>
  );
}
