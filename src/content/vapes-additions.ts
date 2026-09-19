export const VAPES_ADDITIONS = {
  builtForOil: {
    title: "BUILT FOR THE OIL.",
  },
  performance: {
    panels: [
      {
        number: "01",
        title: "FLAVOR THAT ACTUALLY LASTS",
        intro: "Most disposables lose flavor halfway through.",
        chart: {
          title: "FLAVOR OVER TIME",
          lines: ["ORBIT HARDWARE", "OTHER VAPES"],
          axes: ["GREAT FLAVOR", "FADES FAST"],
        },
        checks: [
          "Post less hardware heats oil more evenly",
          "Less burn (no cotton wick)",
          "Cleaner flavor",
          "More consistent hits",
        ],
      },
      {
        number: "02",
        title: "BIGGER CLOUDS. BETTER EXPERIENCE.",
        intro: "Orbit hardware produces strong vapor output designed for experienced consumers.",
        callouts: [
          { icon: "CloudArrowDown", title: "LARGER HITS" },
          { icon: "Cloud", title: "MORE SATISFYING CLOUDS" },
          { icon: "Wind", title: "SMOOTH PULLS" },
        ],
        image: {
          src: "/media/vapes/showroom/teal-lre-front-left.webp",
          alt: "Teal Presidential Orbit with Live Resin Moon Pod, front left angle",
        },
      },
    ],
  },
  modeSystem: {
    eyebrow: ["THREE OILS", "THREE MODES", "ONE SMART SYSTEM"],
    title: "SMART MULTI-MODE FLAVOR SYSTEM",
    lead: "Different oils need different heat. Orbit makes it simple: select the oil type and the device automatically applies the optimized heat.",
    modesHeading: "OPTIMIZED MODES INCLUDE:",
    howTo: "Press the device button three times, then select the oil type.",
    benefitsHeading: "CONSUMER BENEFITS",
    closing: "ORBIT™ KNOWS THE DIFFERENCE.",
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
  hardware: {
    panels: [
      {
        number: "03",
        title: "BETTER HARDWARE. MADE TO PERFORM.",
        intro: "Unlike most value disposables, Orbit includes premium features that elevate every hit.",
        features: [
          { icon: "Monitor", title: "LED SCREEN", description: "See everything. Stay in control." },
          { icon: "Lightning", title: "VARIABLE VOLTAGE", description: "Dial in your perfect experience." },
          { icon: "Fire", title: "PREHEAT FUNCTION", description: "Preheats oil for smoother, more consistent hits." },
        ],
        image: {
          src: "/media/vapes/showroom/teal-ld-screen.webp",
          alt: "LD display on the teal Presidential Orbit device",
        },
      },
      {
        number: "04",
        title: "REAL BENEFITS. EVERY TIME.",
        features: [
          { icon: "Prohibit", title: "PREVENTS CLOGGING", description: "Better airflow. Fewer issues." },
          { icon: "SlidersHorizontal", title: "BETTER VAPOR CONTROL", description: "More precision. More satisfaction." },
          { icon: "BatteryFull", title: "CONSISTENT BATTERY PERFORMANCE", description: "All-day power. Every day." },
        ],
      },
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
      number: "05",
      title: "WHY ORBIT?",
      items: [
        { title: "FLAVOR THAT LASTS", description: "All the way to the last hit." },
        { title: "BIGGER CLOUDS", description: "Stronger output. Better experience." },
        { title: "BETTER HARDWARE", description: "LED screen. Variable voltage. Preheat function." },
        { title: "REAL BENEFITS", description: "Prevents clogging. Better vapor control. Consistent battery performance." },
      ],
      oils: {
        title: "THREE OILS. THREE MODES. ONE SMART SYSTEM.",
        items: [
          { name: "LIQUID DIAMONDS (LD)", tier: "SILVER" },
          { name: "LIVE RESIN (LR)", tier: "GOLD" },
          { name: "LIVE ROSIN (LRO)", tier: "ROSE GOLD" },
        ],
      },
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
  userExperience: {
    title: "USER EXPERIENCE FEATURES",
    blinker: {
      title: "10-SECOND BLINKER CHALLENGE MODE",
      checks: [
        "Stronger consumer interaction",
        "Social sharing potential",
        "More engaging experience",
      ],
    },
    badge: ["PRESIDENTIAL", "HEAVY METAL TESTED"],
  },
  value: {
    bandTitle: "COMMERCIAL & CONSUMER ADVANTAGES",
    subhead: "REUSABLE BATTERY + DISPOSABLE POD CONCEPT",
    title: "REUSABLE BATTERY + DISPOSABLE POD = SMARTER VALUE",
    body: "Combines the convenience of a disposable device with the cost-saving advantage of a reusable battery system.",
    benefits: ["Lower long-term consumer cost", "Better sustainability positioning"],
    taglines: [
      ["SMART TECHNOLOGY", "PERFECTED HEAT"],
      ["PREMIUM FLAVOR", "EVERY TIME"],
      ["MAX CLOUDS", "MAX SATISFACTION"],
      ["UNMATCHED QUALITY", "ALWAYS"],
    ],
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
