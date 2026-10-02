import Image from "next/image";
import Link from "next/link";
import { vaultProductForImage } from "@/lib/products/vault-links";

const BLUNT_GRAPHICS = [
  {
    alt: "Apricotti Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-apricotti",
    src: "/media/blunt-apricotti.jpg",
  },
  {
    alt: "Blue Raspberry Presidential blunt product graphic",
    href: "/moon-rocks/blue-raspberry",
    src: "/media/blunt-blue-raspberry.jpg",
  },
  {
    alt: "Cap Junky Presidential blunt product graphic",
    href: "/moon-rocks/cap-junky",
    src: "/media/blunt-cap-junky.jpg",
  },
  {
    alt: "Cherry Gelato Presidential blunt product graphic",
    href: "/moon-rocks/cherry-gelato",
    src: "/media/blunt-cherry-gelato.jpg",
  },
  {
    alt: "Crescendo Presidential blunt product graphic",
    href: "/moon-rocks/crescendo",
    src: "/media/blunt-crescendo.jpg",
  },
  {
    alt: "Daniel LaRusso Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-daniel-larusso",
    src: "/media/blunt-daniel-larusso.jpg",
  },
  {
    alt: "Garlic Cookies Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-garlic-cookies",
    src: "/media/blunt-garlic-cookies.jpg",
  },
  {
    alt: "Ghost Haze Train Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-ghost-haze-train",
    src: "/media/blunt-ghost-haze-train.jpg",
  },
  {
    alt: "Gorilla Goo Presidential blunt product graphic",
    href: "/moon-rocks/gorilla-goo",
    src: "/media/blunt-gorilla-goo.jpg",
  },
  {
    alt: "Grape Presidential blunt product graphic",
    href: "/moon-rocks/grape",
    src: "/media/blunt-grape.jpg",
  },
  {
    alt: "Laura Charles Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-laura-charles",
    src: "/media/blunt-laura-charles.jpg",
  },
  {
    alt: "Nino Brown Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-nino-brown",
    src: "/media/blunt-nino-brown.jpg",
  },
  {
    alt: "Orange Push Pop Presidential blunt product graphic",
    href: "/moon-rocks/orange-push-pop",
    src: "/media/blunt-orange-push-pop.jpg",
  },
  {
    alt: "Peach Mango Presidential blunt product graphic",
    href: "/moon-rocks/peach-mango",
    src: "/media/blunt-peach-mango.jpg",
  },
  {
    alt: "Pineapple Presidential blunt product graphic",
    href: "/moon-rocks/pineapple",
    src: "/media/blunt-pineapple.jpg",
  },
  {
    alt: "Pink Cookies Presidential blunt product graphic",
    href: "/moon-rocks/pink-cookies",
    src: "/media/blunt-pink-cookies.jpg",
  },
  {
    alt: "Skywalker Presidential blunt product graphic",
    href: "/moon-rocks/skywalker",
    src: "/media/blunt-skywalker.jpg",
  },
  {
    alt: "Strawberry Presidential blunt product graphic",
    href: "/moon-rocks/strawberry",
    src: "/media/blunt-strawberry.jpg",
  },
  {
    alt: "Tropical Presidential blunt product graphic",
    href: "/moon-rocks/tropical",
    src: "/media/blunt-tropical.jpg",
  },
  {
    alt: "Watermelon Presidential blunt product graphic",
    href: "/moon-rocks/watermelon",
    src: "/media/blunt-watermelon.jpg",
  },
  {
    alt: "Waui Presidential blunt product graphic",
    href: "/moon-rocks/waui",
    src: "/media/blunt-waui.jpg",
  },
  {
    alt: "Whoa Si Whoa Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-whoa-si-whoa",
    src: "/media/blunt-whoa-si-whoa.jpg",
  },
  {
    alt: "XJ-13 Presidential blunt product graphic",
    href: "/moon-rocks/xj-13",
    src: "/media/blunt-xj-13.jpg",
  },
  {
    alt: "XXX Presidential blunt product graphic",
    href: "/moon-rocks/xxx",
    src: "/media/blunt-xxx-ca.jpg",
  },
  {
    alt: "XXX Presidential blunt product graphic",
    href: "/moon-rocks/xxx",
    src: "/media/blunt-xxx.jpg",
  },
] as const;

export function BluntsGraphicsGrid() {
  return (
    <section
      aria-labelledby="presidential-blunts-graphics-title"
      className="bg-po-ink px-6 pb-16 pt-1 sm:px-10 lg:px-16 lg:pb-20"
      id="presidential-blunts-graphics"
    >
      <div className="mx-auto w-full max-w-7xl">
        <h2
          className="font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
          id="presidential-blunts-graphics-title"
        >
          Blunts
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {BLUNT_GRAPHICS.map((graphic) => (
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
