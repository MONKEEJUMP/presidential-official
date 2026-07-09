"use client";

import Link from "next/link";

type ErrorPageProps = {
  readonly error: Error & { digest?: string };
  readonly unstable_retry: () => void;
};

export default function ErrorPage({ unstable_retry }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center bg-po-soft px-6 py-20 text-po-ink">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 border border-po-line bg-po-canvas p-8">
        <p className="text-sm font-semibold uppercase text-po-brand">
          Official Presidential
        </p>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight">
            This page could not load
          </h1>
          <p className="max-w-2xl text-base leading-7 text-po-body">
            The official Presidential experience is still protected. Try again
            or return to the official home.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="border border-po-brand bg-po-brand px-4 py-3 text-sm font-semibold text-po-on-dark transition-colors hover:bg-po-brand-hover"
            onClick={() => unstable_retry()}
            type="button"
          >
            Try again
          </button>
          <Link
            className="border border-po-subtle px-4 py-3 text-sm font-semibold text-po-body transition-colors hover:border-po-muted"
            href="/"
          >
            Return home
          </Link>
        </div>
        <p className="text-sm font-medium text-po-muted">
          For adults 21+ where legal.
        </p>
      </section>
    </main>
  );
}
