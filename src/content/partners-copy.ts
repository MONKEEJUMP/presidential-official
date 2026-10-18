// Owner copy: 0907-PRES-KVRT-0010 and count ruling. ASCII only.
export const PARTNERS_LABEL = "Partners";
export const PARTNER_STATES = [
  {
    "code": "ca",
    "name": "California",
    "headlineDoors": 604,
    "tagline": "Pre-rolling High in the Golden State.",
    "color": "#FFD447"
  },
  {
    "code": "ok",
    "name": "Oklahoma",
    "headlineDoors": 194,
    "tagline": "The Sooner The Better. A Presidential High.",
    "color": "#C1502E"
  },
  {
    "code": "ny",
    "name": "New York",
    "headlineDoors": 170,
    "tagline": "Skyscraper High. Presidential Grade.",
    "color": "#3E6E9E"
  },
  {
    "code": "nv",
    "name": "Nevada",
    "headlineDoors": 102,
    "tagline": "From the Strip to Space - Presidential Moon Rocks Rock.",
    "color": "#C8CDD4"
  },
  {
    "code": "mi",
    "name": "Michigan",
    "headlineDoors": 101,
    "tagline": "Motor City High. Presidential Octane.",
    "color": "#2E7D8F"
  },
  {
    "code": "az",
    "name": "Arizona",
    "headlineDoors": 53,
    "tagline": "From the Canyon to the Cosmos - Presidential",
    "color": "#B5603A"
  },
  {
    "code": "wa",
    "name": "Washington",
    "headlineDoors": 0,
    "tagline": "Evergreen State. Presidential High.",
    "color": "#3C6E52"
  }
] as const;
export type PartnerStateCode = (typeof PARTNER_STATES)[number]["code"];
export const PARTNERS_COPY = {
  "hub": {
    "h1": "Our Partners",
    "title": "Presidential Partners | Licensed Retailers in Select State Markets",
    "description": "Licensed dispensaries carrying authentic Presidential in California, Oklahoma, New York, Nevada, Michigan, Arizona and Washington. Find a retailer.",
    "body": [
      "Presidential doesn't sell direct. Never has.",
      "Every jar, every blunt, every pre-roll reaches you through a licensed dispensary in select state markets that chose to carry it, and every one of them made that call on their own.",
      "These are the retailers who put Presidential on their shelves. Independent shops running one location and multi-state operators running thirty. Storefronts in downtown Los Angeles, in Tulsa, in Brooklyn, in Henderson, in Detroit, in Phoenix. Different markets, different customers, one shared decision.",
      "If you are holding a Presidential product, it came through one of them.",
      "That matters for a second reason. Authentic Presidential moves through licensed channels - the dispensaries listed here are where you find it.",
      "Pick your state below. It lists licensed retailers that carry Presidential, with a direct route to the closest one."
    ]
  },
  "ca": {
    "h1": "California Partners",
    "title": "Presidential Partners in California | Licensed Retailers",
    "description": "California's licensed dispensaries carrying authentic Presidential, from Los Angeles County to the Bay Area and San Diego. Find one near you.",
    "body": [
      "California is where Presidential started.",
      "Presidential was founded in Los Angeles, and the California retail map still reflects that - dense through LA County, deep into Orange County and the Inland Empire, running north through the Central Valley into Sacramento and the Bay Area, then south again to San Diego. Some of these partners have carried the brand since the early years. Some opened last spring.",
      "The mix tells you something about the state. California retail is not one thing. It is thirty-store operators and single-location shops on the same street, and Presidential sits on shelves in both.",
      "What is carried varies by store. Some run the full ladder - Moon Rocks, blunts, pre-rolls, minis. Some carry a few. The retailers below are licensed California partners; the locator will tell you which one is closest."
    ]
  },
  "ok": {
    "h1": "Oklahoma Partners",
    "title": "Presidential Partners in Oklahoma | Licensed Retailers",
    "description": "Oklahoma's licensed dispensaries carrying authentic Presidential - across Frontier Country, Green Country and the whole state. Find one near you.",
    "body": [
      "Licensed Oklahoma dispensaries carry Presidential.",
      "The map splits the way Oklahoma splits. Frontier Country covers the Oklahoma City metro: OKC, Edmond, Norman and the towns around them. Green Country covers the Tulsa metro. The rest run out across Great Plains Country in the southwest, Choctaw Country in the southeast, and Chickasaw Country through the south central.",
      "Outside the metros, Presidential is sold at licensed retailers in Oklahoma, and each owner decided it was worth the shelf space."
    ]
  },
  "ny": {
    "h1": "New York Partners",
    "title": "Presidential Partners in New York | Licensed Retailers",
    "description": "New York's licensed dispensaries carrying authentic Presidential - across the five boroughs, Long Island, the Hudson Valley and upstate. Find one.",
    "body": [
      "Listings start in the five boroughs - Manhattan, Brooklyn, Queens, the Bronx, Staten Island - and run out through Long Island, up the Hudson Valley, west to Buffalo and Rochester, and north toward the Adirondacks.",
      "New York's legal market opened late and moved fast.",
      "That is worth saying plainly: a New York licensed dispensary is a licensed operator. When you buy Presidential from one, the chain of custody is documented end to end.",
      "The locator will find you the nearest."
    ]
  },
  "nv": {
    "h1": "Nevada Partners",
    "title": "Presidential Partners in Nevada | Licensed Retailers",
    "description": "Nevada's licensed dispensaries carrying authentic Presidential - from the Las Vegas Strip to Reno, Henderson and the Silver Trails. Find one.",
    "body": [
      "No state has a customer quite like Nevada.",
      "Presidential does well in that room. It is a recognizable name to somebody who already knows the brand from California, and it is an obvious pick for somebody who does not know anything and wants the good stuff.",
      "Outside the valley, listings run north to Reno and Sparks, through Carson City, and out into the Silver Trails and Cowboy Country.",
      "Every Nevada partner is listed below."
    ]
  },
  "mi": {
    "h1": "Michigan Partners",
    "title": "Presidential Partners in Michigan | Licensed Retailers",
    "description": "Michigan's licensed dispensaries carrying authentic Presidential - across Detroit, Ann Arbor, Grand Rapids and the state. Find one near you.",
    "body": [
      "Licensed Michigan retailers carry Presidential.",
      "Listings start in Detroit and the surrounding metro - Inkster, Center Line, River Rouge, Riverview. Ann Arbor and Kalamazoo hold their own clusters. Listings run west toward Grand Rapids and north into the towns along the lakes.",
      "Formats vary by store. The locator below will route you to your closest Michigan partner."
    ]
  },
  "az": {
    "h1": "Arizona Partners",
    "title": "Presidential Partners in Arizona | Licensed Retailers",
    "description": "Arizona's licensed dispensaries carrying authentic Presidential - across Phoenix, Tucson, Sedona and the state. Find one near you.",
    "body": [
      "Arizona is the newest state on the Presidential map.",
      "Phoenix and the surrounding metro carry most of it. Tucson holds a cluster. The rest run north through Sedona and Flagstaff and out to the smaller desert towns.",
      "Presidential entered Arizona recently. What is below is current."
    ]
  },
  "wa": {
    "h1": "Washington Partners",
    "title": "Presidential Partners in Washington | Launching Soon",
    "description": "Presidential is coming to Washington State. Retailer partnerships in progress across Seattle, Spokane and the Evergreen State.",
    "body": [
      "Washington is next.",
      "Washington is landing soon in Presidential's [select state markets](/find-us), and retail partnerships there are in progress.",
      "Nothing is on shelves yet. Washington retailers carrying Presidential will be listed here as they are confirmed.",
      "Retailers interested in carrying Presidential in Washington can reach us through the contact page."
    ]
  }
} as const;
export const PARTNERS_UI = {home:"Home", eyebrow:"Presidential", chains:"Multi-Location Partners", independents:"Independent Partners", landing:"LANDING SOON", contact:"Contact Presidential", close:"Find your nearest location", visit:"Visit site", callout:"Carry Presidential and want your logo on this page? Send it over. Every partner listed here gets their mark, their name, and a link out."} as const;
export const partnersCountLine = (state:string) => `Licensed Presidential partners in ${state}.`;
export const partnerLocations = (count:number) => `${count} locations`;
export const partnerLogoAlt = (name:string,city:string,state:string) => `${name} - licensed Presidential retailer in ${city}, ${state}`;
export const partnerExplore = (name:string) => `Explore ${name}`;
export const PARTNERS_STATE_NAV_LABELS = {top:'Partner states - top',bottom:'Partner states - bottom'} as const;
