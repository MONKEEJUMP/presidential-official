export const VAPES_ADDITIONS = {
  modeSystem: {
    eyebrow: ["THREE OILS", "THREE MODES", "ONE SMART SYSTEM"],
    title: "SMART MULTI-MODE FLAVOR SYSTEM",
    lead: "Different oils need different heat. Orbit makes it simple: select the oil type and the device automatically applies the optimized heat.",
    howTo: "Press the device button three times, then select the oil type.",
    modes: [
      {
        title: "LIQUID DIAMOND MODE",
        code: "LD",
        tier: "silver",
        description: "Stronger vapor output and throat hit for a fuller experience.",
      },
      {
        title: "LIVE RESIN MODE",
        code: "LR",
        tier: "gold",
        description: "Balanced vapor production and flavor performance.",
      },
      {
        title: "LIVE ROSIN MODE",
        code: "LRO",
        tier: "rose-gold",
        description: "Lower temperature preserves natural flavor and terpenes.",
      },
    ],
    benefits: [
      "Easier for beginners to use",
      "Reduced risk of burnt taste",
      "Better flavor consistency",
      "Less oil waste from overheating",
    ],
  },
  advantage: {
    eyebrow: "DIFFERENT OILS NEED DIFFERENT HEAT.",
    title: "THE ORBIT ADVANTAGE",
    features: [
      { icon: "modes", title: "3 OIL MODES", parts: ["LD", "LR", "LRO"] },
      { icon: "heat", title: "SMART HEATING", description: "Optimizes for each oil" },
      { icon: "precision", title: "PRECISION TEMP CONTROL", description: "Every oil has a sweet spot" },
      { icon: "display", title: "DIGITAL DISPLAY", description: "Real-time session feedback" },
      { icon: "battery", title: "LONG-LASTING BATTERY", description: "All-day performance" },
      { icon: "flavor", title: "BUILT FOR EVERY OIL", description: "Engineered for maximum flavor" },
    ],
  },
  ceramic: {
    title: "ADVANCED CERAMIC HEATING SYSTEM",
    items: [
      {
        title: "UNIVERSAL CERAMIC PLATFORM",
        description: "Supports multiple oil viscosities and extract types. Maintains optimal flavor and vapor across different formulations.",
      },
      {
        title: "DUAL-COIL CERAMIC SYSTEM",
        description: "Large-surface dual-coil design for more efficient vaporization and bigger, smoother hits.",
      },
      {
        title: "COTTON-FREE FLAT CERAMIC",
        description: "Flat ceramic structure without cotton for more even heating, cleaner flavor, and less burnt taste.",
      },
      {
        title: "CENTER-TUBE-FREE DESIGN",
        description: "Eliminates the center airflow tube to reduce clogging and maintain smooth airflow during long-term use.",
      },
    ],
    benefits: [
      "Larger vapor production than traditional pods",
      "Better terpene preservation at lower temperatures",
      "Richer and smoother flavor experience",
      "Better heat distribution for maximum efficiency",
    ],
  },
  standards: {
    ariaLabel: "Why Orbit and safety and material standards",
    orbit: {
      title: "WHY ORBIT",
      items: [
        { title: "FLAVOR THAT LASTS", description: "All the way to the last hit." },
        { title: "BIGGER CLOUDS", description: "Stronger output. Better experience." },
        { title: "BETTER HARDWARE", description: "LED screen. Variable voltage. Preheat function." },
        { title: "REAL BENEFITS", description: "Prevents clogging. Better vapor control. Consistent battery performance." },
      ],
    },
    safety: {
      title: "SAFETY & MATERIAL STANDARDS",
      groups: [
        {
          title: "HEAVY METAL TESTED COMPONENTS",
          body: "Core materials are tested for heavy metals and built using food-grade safety materials.",
          checks: ["Safer consumer use", "Reduced harmful material risks", "More reliable long-term performance"],
        },
        {
          title: "10-SECOND OVERHEAT PROTECTION",
          checks: ["Prevents overheating", "Protects device lifespan", "Improves long-term reliability", "Stable, comfortable vapor output"],
        },
      ],
    },
  },
  value: {
    title: "REUSABLE BATTERY + DISPOSABLE POD = SMARTER VALUE",
    body: "Combines the convenience of a disposable device with the cost-saving advantage of a reusable battery system.",
    pillars: [
      { icon: "flavor", title: "PREMIUM FLAVOR", description: "Engineered for flavor that lasts from first hit to last." },
      { icon: "cloud", title: "BIGGER CLOUDS", description: "Stronger output. Smoother pulls. More satisfying experience." },
      { icon: "smart", title: "SMART TECHNOLOGY", description: "Advanced features for a seamless, high-performance experience." },
      { icon: "shield", title: "SAFETY FIRST", description: "Built with trusted materials and smart protections." },
      { icon: "user", title: "USER FRIENDLY", description: "Simple. Intuitive. Designed for everyone." },
      { icon: "value", title: "COST SMART", description: "Reusable battery + disposable pods = smarter value." },
    ],
  },
} as const;
