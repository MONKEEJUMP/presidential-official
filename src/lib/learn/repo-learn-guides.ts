// SURFER-R13: learn guides owned by the repo (no Sanity record). Copy lives in
// repo-owned-page-copy.ts under the same /learn/<slug> path.
export type RepoLearnGuide = {
  readonly slug: string;
  readonly title: string;
  readonly intro: string;
  readonly guideTopic: string;
};

export const REPO_LEARN_GUIDES: Readonly<Record<string, RepoLearnGuide>> = {
  "what-is-thc-distillate": {
    slug: "what-is-thc-distillate",
    title: "What Is THC Distillate",
    intro:
      "THC distillate is a refined, essentially neutral concentrate, and it is the extract behind the Presidential Silver Flavor Series.",
    guideTopic: "THC distillate",
  },
};
