import Image from "next/image";
import Link from "next/link";

const PREROLL_GRAPHICS = [
  {
    alt: "Blue Raspberry Presidential preroll product graphic",
    href: "/moon-rocks/blue-raspberry",
    src: "/media/preroll-blue-raspberry.jpg",
  },
  {
    alt: "Cap Junky Presidential preroll product graphic",
    href: "/moon-rocks/cap-junky",
    src: "/media/preroll-cap-junky.jpg",
  },
  {
    alt: "Cherry Gelato Presidential preroll product graphic",
    href: "/moon-rocks/cherry-gelato",
    src: "/media/preroll-cherry-gelato.jpg",
  },
  {
    alt: "Garlic Cookies Presidential preroll product graphic",
    href: "/moon-rocks/presidential-line-garlic-cookies",
    src: "/media/preroll-garlic-cookies.jpg",
  },
  {
    alt: "Ghost Haze Train Presidential preroll product graphic",
    href: "/moon-rocks/presidential-line-ghost-haze-train",
    src: "/media/preroll-ghost-haze-train.jpg",
  },
  {
    alt: "Gorilla Goo Presidential preroll product graphic",
    href: "/moon-rocks/gorilla-goo",
    src: "/media/preroll-gorilla-goo.jpg",
  },
  {
    alt: "Grape Presidential preroll product graphic",
    href: "/moon-rocks/grape",
    src: "/media/preroll-grape.jpg",
  },
  {
    alt: "Orange Push Pop Presidential preroll product graphic",
    href: "/moon-rocks/orange-push-pop",
    src: "/media/preroll-orange-push-pop.jpg",
  },
  {
    alt: "Peach Mango Presidential preroll product graphic",
    href: "/moon-rocks/peach-mango",
    src: "/media/preroll-peach-mango.jpg",
  },
  {
    alt: "Pineapple Presidential preroll product graphic",
    href: "/moon-rocks/pineapple",
    src: "/media/preroll-pineapple.jpg",
  },
  {
    alt: "Pink Cookies Presidential preroll product graphic",
    href: "/moon-rocks/pink-cookies",
    src: "/media/preroll-pink-cookies.jpg",
  },
  {
    alt: "Skywalker Presidential preroll product graphic",
    href: "/moon-rocks/skywalker",
    src: "/media/preroll-skywalker.jpg",
  },
  {
    alt: "Strawberry Presidential preroll product graphic",
    href: "/moon-rocks/strawberry",
    src: "/media/preroll-strawberry.jpg",
  },
  {
    alt: "Tropical Presidential preroll product graphic",
    href: "/moon-rocks/tropical",
    src: "/media/preroll-tropical.jpg",
  },
  {
    alt: "Watermelon Presidential preroll product graphic",
    href: "/moon-rocks/watermelon",
    src: "/media/preroll-watermelon.jpg",
  },
  {
    alt: "Waui Presidential preroll product graphic",
    href: "/moon-rocks/waui",
    src: "/media/preroll-waui.jpg",
  },
  {
    alt: "XJ-13 Presidential preroll product graphic",
    href: "/moon-rocks/xj-13",
    src: "/media/preroll-xj-13.jpg",
  },
  {
    alt: "XXX Presidential preroll product graphic",
    href: "/moon-rocks/xxx",
    src: "/media/preroll-xxx.jpg",
  },
] as const;

export function OurStoryPrerollGraphicsGrid() {
  return (
    <section
      aria-label="Presidential preroll product graphics"
      className="bg-po-ink"
      id="presidential-preroll-graphics"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {PREROLL_GRAPHICS.map((graphic) => (
          <Link
            className="relative aspect-square overflow-hidden rounded-[20px] border border-po-brand bg-po-ink transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
            href={graphic.href}
            key={graphic.href}
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
    </section>
  );
}
