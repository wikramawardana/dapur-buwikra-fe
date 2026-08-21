export interface LandingContent {
  header: {
    brand: string;
    cta: string;
  };
  hero: {
    badge: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    weeklyMenuTitle: string;
    weeklyMenuFeature1: string;
    weeklyMenuFeature2: string;
    weeklyMenuFeature3: string;
    weeklyMenuEmpty: string;
  };
  featured: {
    title: string;
    emptyTitle: string;
    emptyBody: string;
  };
  area: {
    title: string;
    body: string;
  };
}
