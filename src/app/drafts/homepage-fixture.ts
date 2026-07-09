export const draftHomepageFixture = {
  _id: "local.cms-shaped.homepage.fixture",
  _type: "sitePage",
  title: "Presidential Homepage Draft",
  slug: "home",
  routePhase: "draft_preview_only",
  summary: "CMS-shaped homepage draft used to build the private module renderer before live Sanity homepage records exist.",
  modules: [
    {
      _key: "hero-official-home",
      _type: "heroBlock",
      headline: "Official Presidential Cannabis",
      description:
        "A first-party Presidential experience for product platforms, learning, and licensed retail discovery.",
      ctaLabel: "Explore Moon Rocks",
      ctaHref: "/moon-rocks",
      moduleControl: {
        internalLabel: "Homepage Hero",
        componentKey: "hero",
        renderEligibility: "draft_preview_only",
        sortIntent: 10,
      },
    },
    {
      _key: "act-brand-belief",
      _type: "homepageActBlock",
      actNumber: 1,
      actTitle: "Cannabis deserves better",
      description:
        "Lead with the brand belief, then move visitors into product clarity and official source confidence.",
      moduleControl: {
        internalLabel: "Act 1 Brand Belief",
        componentKey: "homepage_act",
        renderEligibility: "draft_preview_only",
        sortIntent: 20,
      },
    },
    {
      _key: "platform-pillars",
      _type: "productPlatformBlock",
      heading: "Three product pillars, one official ecosystem",
      description:
        "Moon Rocks, Moon Pods, and Orbit stay distinct while sharing one Presidential source of truth.",
      items: [
        {
          label: "Flagship",
          title: "Moon Rocks",
          description: "The flagship Presidential product platform and primary brand-recognition path.",
        },
        {
          label: "Flavor",
          title: "Moon Pods",
          description: "A dedicated product lane for flavor, format, and product education.",
        },
        {
          label: "Technology",
          title: "Orbit",
          description: "A supporting platform connected to the Moon Pods experience.",
        },
      ],
      moduleControl: {
        internalLabel: "Product Pillars",
        componentKey: "product_platform",
        renderEligibility: "draft_preview_only",
        sortIntent: 30,
      },
    },
    {
      _key: "find-presidential",
      _type: "locatorShellBlock",
      heading: "Find Presidential products",
      description:
        "Retail discovery should point adults 21+ toward licensed retailers once verified store records are ready.",
      ctaLabel: "Find us",
      ctaHref: "/find-us",
      moduleControl: {
        internalLabel: "Find Us CTA",
        componentKey: "locator_shell",
        renderEligibility: "draft_preview_only",
        sortIntent: 40,
      },
    },
  ],
} as const;
