import Image from "next/image";
import Link from "next/link";
import { vaultProductForImage } from "@/lib/products/vault-links";

const MINI_BLUNT_GRAPHICS = [
  {
    alt: "Cap Junky Presidential Mini Blunts product graphic",
    href: "/moon-rocks/cap-junky",
    src: "/media/mini-blunt-cap-junky.jpg",
  },
  {
    alt: "Cherry Gelato Presidential Mini Blunts product graphic",
    href: "/moon-rocks/cherry-gelato",
    src: "/media/mini-blunt-cherry-gelato.jpg",
  },
  {
    alt: "Crescendo Presidential Mini Blunts product graphic",
    href: "/moon-rocks/crescendo",
    src: "/media/mini-blunt-crescendo.jpg",
  },
  {
    alt: "Gorilla Goo Presidential Mini Blunts product graphic",
    href: "/moon-rocks/gorilla-goo",
    src: "/media/mini-blunt-gorilla-goo.jpg",
  },
  {
    alt: "Orange Push Pop Presidential Mini Blunts product graphic",
    href: "/moon-rocks/orange-push-pop",
    src: "/media/mini-blunt-orange-push-pop.jpg",
  },
  {
    alt: "Peach Mango Presidential Mini Blunts product graphic",
    href: "/moon-rocks/peach-mango",
    src: "/media/mini-blunt-peach-mango.jpg",
  },
  {
    alt: "Pink Cookies Presidential Mini Blunts product graphic",
    href: "/moon-rocks/pink-cookies",
    src: "/media/mini-blunt-pink-cookies.jpg",
  },
  {
    alt: "Presidential Mini Blunts product graphic",
    href: "/moon-rocks/presidential-blunts",
    src: "/media/mini-blunt-presidential.jpg",
  },
  {
    alt: "Skywalker Presidential Mini Blunts product graphic",
    href: "/moon-rocks/skywalker",
    src: "/media/mini-blunt-skywalker.jpg",
  },
  {
    alt: "Strawberry Presidential Mini Blunts product graphic",
    href: "/moon-rocks/strawberry",
    src: "/media/mini-blunt-strawberry.jpg",
  },
  {
    alt: "Watermelon Presidential Mini Blunts product graphic",
    href: "/moon-rocks/watermelon",
    src: "/media/mini-blunt-watermelon.jpg",
  },
  {
    alt: "Waui Presidential Mini Blunts product graphic",
    href: "/moon-rocks/waui",
    src: "/media/mini-blunt-waui.jpg",
  },
  {
    alt: "XJ-13 Presidential Mini Blunts product graphic",
    href: "/moon-rocks/xj-13",
    src: "/media/mini-blunt-xj-13.jpg",
  },
  {
    alt: "XXX Presidential Mini Blunts product graphic",
    href: "/moon-rocks/xxx",
    src: "/media/mini-blunt-xxx.jpg",
  },
] as const;

export function FindUsMiniBluntsGrid() {
  return (
    <section
      aria-labelledby="presidential-find-us-mini-blunts-title"
      className="bg-po-ink px-6 py-16 sm:px-10 lg:px-16 lg:py-20"
      id="presidential-find-us-mini-blunts"
    >
      <div className="mx-auto w-full max-w-7xl">
        <h2
          className="font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
          id="presidential-find-us-mini-blunts-title"
        >
          Mini Blunts
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {MINI_BLUNT_GRAPHICS.map((graphic) => (
            <Link
              className="relative aspect-square overflow-hidden rounded-[20px] border border-po-brand bg-po-ink transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
              href={vaultProductForImage(graphic.src)?.productUrl ?? graphic.href}
              key={graphic.src}
            >
              <Image
                alt={graphic.alt}
                className="object-contain"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                src={graphic.src}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
