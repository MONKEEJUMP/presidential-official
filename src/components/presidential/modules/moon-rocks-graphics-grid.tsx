import Image from "next/image";
import Link from "next/link";

const MOON_ROCK_GRAPHICS = [
  {
    alt: "Cherry Gelato Moon Rocks product graphic",
    href: "/moon-rocks/cherry-gelato",
    src: "/media/moonrock-cherrygelato.jpg",
  },
  {
    alt: "Garlic Cookies Moon Rocks product graphic",
    href: "/moon-rocks/presidential-line-garlic-cookies",
    src: "/media/moonrock-garlic-cookies.jpg",
  },
  {
    alt: "Ghost Haze Train Moon Rocks product graphic",
    href: "/moon-rocks/presidential-line-ghost-haze-train",
    src: "/media/moonrock-ghost-haze-train.jpg",
  },
  {
    alt: "Gorilla Goo Moon Rocks product graphic",
    href: "/moon-rocks/gorilla-goo",
    src: "/media/moonrock-gorilla-goo.jpg",
  },
  {
    alt: "Grape Moon Rocks product graphic",
    href: "/moon-rocks/grape",
    src: "/media/moonrock-grape.jpg",
  },
  {
    alt: "Nino Brown Moon Rocks product graphic",
    href: "/moon-rocks/presidential-line-nino-brown",
    src: "/media/moonrock-nino-brown.jpg",
  },
  {
    alt: "Peach Mango Moon Rocks product graphic",
    href: "/moon-rocks/peach-mango",
    src: "/media/moonrock-peach-mango.jpg",
  },
  {
    alt: "Pink Cookies Moon Rocks product graphic",
    href: "/moon-rocks/pink-cookies",
    src: "/media/moonrock-pinkcookies.jpg",
  },
  {
    alt: "Skywalker Moon Rocks product graphic",
    href: "/moon-rocks/skywalker",
    src: "/media/moonrock-skywalker.jpg",
  },
  {
    alt: "Strawberry Moon Rocks product graphic",
    href: "/moon-rocks/strawberry",
    src: "/media/moonrock-strawberry.jpg",
  },
  {
    alt: "Watermelon Moon Rocks product graphic",
    href: "/moon-rocks/watermelon",
    src: "/media/moonrock-watermelon.jpg",
  },
  {
    alt: "Waui Moon Rocks product graphic",
    href: "/moon-rocks/waui",
    src: "/media/moonrock-waui.jpg",
  },
  {
    alt: "Whoa Si Whoa Moon Rocks product graphic",
    href: "/moon-rocks/presidential-line-whoa-si-whoa",
    src: "/media/moonrock-whoa-si-whoa.jpg",
  },
  {
    alt: "XJ-13 Moon Rocks product graphic",
    href: "/moon-rocks/xj-13",
    src: "/media/moonrock-xj-13.jpg",
  },
] as const;

export function MoonRocksGraphicsGrid() {
  return (
    <section
      aria-labelledby="presidential-moon-rocks-graphics-title"
      className="bg-po-ink px-6 pb-16 pt-1 sm:px-10 lg:px-16 lg:pb-20"
      id="presidential-moon-rocks-graphics"
    >
      <div className="mx-auto w-full max-w-7xl">
        <h2
          className="font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
          id="presidential-moon-rocks-graphics-title"
        >
          Moon Rocks
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {MOON_ROCK_GRAPHICS.map((graphic) => (
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
      </div>
    </section>
  );
}
