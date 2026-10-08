import Image from "next/image";
import Link from "next/link";
import { vaultProductForImage } from "@/lib/products/vault-links";

type ConveyorPack = {
  readonly alt: string;
  readonly href: string;
  readonly name: string;
  readonly objectPosition: "center 54%" | "center 55%" | "center 56%";
  readonly src: string;
};

const CONVEYOR_IMAGE_POSITION_CLASSES = {
  "center 54%": "object-[center_54%]",
  "center 55%": "object-[center_55%]",
  "center 56%": "object-[center_56%]",
} as const;

const CONVEYOR_PACKS: readonly ConveyorPack[] = [
  {
    alt: "Cherry Gelato Moon Rocks product graphic",
    href: "/moon-rocks/cherry-gelato",
    name: "Cherry Gelato",
    objectPosition: "center 54%",
    src: "/media/moonrock-cherrygelato.jpg",
  },
  {
    alt: "Gorilla Goo Moon Rocks product graphic",
    href: "/moon-rocks/gorilla-goo",
    name: "Gorilla Goo",
    objectPosition: "center 55%",
    src: "/media/moonrock-gorilla-goo.jpg",
  },
  {
    alt: "Grape Moon Rocks product graphic",
    href: "/moon-rocks/grape",
    name: "Grape",
    objectPosition: "center 54%",
    src: "/media/moonrock-grape.jpg",
  },
  {
    alt: "Nino Brown Moon Rocks product graphic",
    href: "/moon-rocks/presidential-line-nino-brown",
    name: "Nino Brown",
    objectPosition: "center 55%",
    src: "/media/moonrock-nino-brown.jpg",
  },
  {
    alt: "Peach Mango Moon Rocks product graphic",
    href: "/moon-rocks/peach-mango",
    name: "Peach Mango",
    objectPosition: "center 55%",
    src: "/media/moonrock-peach-mango.jpg",
  },
  {
    alt: "Waui Moon Rocks product graphic",
    href: "/moon-rocks/waui",
    name: "Waui",
    objectPosition: "center 55%",
    src: "/media/moonrock-waui.jpg",
  },
  {
    alt: "Blue Raspberry Presidential blunt product graphic",
    href: "/moon-rocks/blue-raspberry",
    name: "Blue Raspberry",
    objectPosition: "center 55%",
    src: "/media/blunt-blue-raspberry.jpg",
  },
  {
    alt: "Cap Junky Presidential blunt product graphic",
    href: "/moon-rocks/cap-junky",
    name: "Cap Junky",
    objectPosition: "center 55%",
    src: "/media/blunt-cap-junky.jpg",
  },
  {
    alt: "Crescendo Presidential blunt product graphic",
    href: "/moon-rocks/crescendo",
    name: "Crescendo",
    objectPosition: "center 55%",
    src: "/media/blunt-crescendo.jpg",
  },
  {
    alt: "Ghost Haze Train Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-ghost-haze-train",
    name: "Ghost Haze Train",
    objectPosition: "center 55%",
    src: "/media/blunt-ghost-haze-train.jpg",
  },
  {
    alt: "Orange Push Pop Presidential blunt product graphic",
    href: "/moon-rocks/orange-push-pop",
    name: "Orange Push Pop",
    objectPosition: "center 55%",
    src: "/media/blunt-orange-push-pop.jpg",
  },
  {
    alt: "Pineapple Presidential blunt product graphic",
    href: "/moon-rocks/pineapple",
    name: "Pineapple",
    objectPosition: "center 55%",
    src: "/media/blunt-pineapple.jpg",
  },
  {
    alt: "Whoa Si Whoa Presidential blunt product graphic",
    href: "/moon-rocks/presidential-line-whoa-si-whoa",
    name: "Whoa Si Whoa",
    objectPosition: "center 55%",
    src: "/media/blunt-whoa-si-whoa.jpg",
  },
  {
    alt: "Garlic Cookies Presidential preroll product graphic",
    href: "/moon-rocks/presidential-line-garlic-cookies",
    name: "Garlic Cookies",
    objectPosition: "center 56%",
    src: "/media/preroll-garlic-cookies.jpg",
  },
  {
    alt: "Pink Cookies Presidential preroll product graphic",
    href: "/moon-rocks/pink-cookies",
    name: "Pink Cookies",
    objectPosition: "center 56%",
    src: "/media/preroll-pink-cookies.jpg",
  },
  {
    alt: "Skywalker Presidential preroll product graphic",
    href: "/moon-rocks/skywalker",
    name: "Skywalker",
    objectPosition: "center 56%",
    src: "/media/preroll-skywalker.jpg",
  },
  {
    alt: "Strawberry Presidential preroll product graphic",
    href: "/moon-rocks/strawberry",
    name: "Strawberry",
    objectPosition: "center 56%",
    src: "/media/preroll-strawberry.jpg",
  },
  {
    alt: "Tropical Presidential preroll product graphic",
    href: "/moon-rocks/tropical",
    name: "Tropical",
    objectPosition: "center 56%",
    src: "/media/preroll-tropical.jpg",
  },
  {
    alt: "Watermelon Presidential preroll product graphic",
    href: "/moon-rocks/watermelon",
    name: "Watermelon",
    objectPosition: "center 56%",
    src: "/media/preroll-watermelon.jpg",
  },
  {
    alt: "XJ-13 Presidential preroll product graphic",
    href: "/moon-rocks/xj-13",
    name: "XJ-13",
    objectPosition: "center 56%",
    src: "/media/preroll-xj-13.jpg",
  },
  {
    alt: "XXX Presidential preroll product graphic",
    href: "/moon-rocks/xxx",
    name: "XXX",
    objectPosition: "center 56%",
    src: "/media/preroll-xxx.jpg",
  },
] as const;

export function GemTicker() {
  return (
    <div className="po-home-canvas-surface px-6 pt-10">
      <div
        aria-label="Presidential product packaging conveyor"
        className="po-product-conveyor mx-auto flex h-[101px] w-full max-w-[1392px] items-center overflow-hidden rounded-[20px] bg-[#0A0A0A]"
      >
        <div className="po-product-conveyor-track flex w-max items-center">
          {[false, true].map((clone) => (
            <ul
              aria-hidden={clone || undefined}
              className={`flex items-center gap-[10px] pr-[10px] ${clone ? "po-product-conveyor-clone" : ""}`}
              key={String(clone)}
            >
              {CONVEYOR_PACKS.map((pack) => (
                <li className="shrink-0" key={`${clone ? "clone" : "primary"}-${pack.src}`}>
                  <Link
                    aria-label={`View ${pack.name}`}
                    className="po-product-conveyor-pack relative block h-[91px] w-[142px] cursor-pointer overflow-hidden rounded-[10px] border border-po-brand/70 bg-po-ink transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] focus-visible:-translate-y-1 focus-visible:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none"
                    href={vaultProductForImage(pack.src)?.productUrl ?? pack.href}
                    prefetch={false}
                    tabIndex={clone ? -1 : undefined}
                  >
                    <Image
                      alt={pack.alt}
                      className={`object-cover ${CONVEYOR_IMAGE_POSITION_CLASSES[pack.objectPosition]}`}
                      fill
                      sizes="142px"
                      src={pack.src}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
