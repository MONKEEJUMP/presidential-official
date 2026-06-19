import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams(): never[] {
  return [];
}

export default function LearnGuidePage(): never {
  notFound();
}

