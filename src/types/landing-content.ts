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
    primaryCta: string;
    secondaryCta: string;
    weeklyMenuTitle: string;
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
