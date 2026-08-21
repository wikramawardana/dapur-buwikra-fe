import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import type { LandingContent } from "@/types/landing-content";

const CONTENT_PATH = path.join(process.cwd(), "content", "landing.md");

function sectionKey(heading: string): string {
  const words = heading.trim().split(/\s+/);
  return words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : `${word[0]?.toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join("");
}

function parseSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = markdown.matchAll(
    /^##\s+(.+)\n([\s\S]*?)(?=^##\s+|$(?![\s\S]))/gm,
  );

  for (const match of matches) {
    const heading = match[1]?.trim();
    const value = match[2]?.trim();
    if (heading && value) {
      sections[sectionKey(heading)] = value;
    }
  }

  return sections;
}

function required(sections: Record<string, string>, key: string): string {
  const value = sections[key];
  if (!value) {
    throw new Error(`Missing "${key}" section in ${CONTENT_PATH}`);
  }
  return value;
}

function optional(
  sections: Record<string, string>,
  key: string,
  fallback = "",
): string {
  return sections[key] ?? fallback;
}

export function loadLandingContent(): LandingContent {
  const sections = parseSections(readFileSync(CONTENT_PATH, "utf8"));

  return {
    header: {
      brand: required(sections, "headerBrand"),
      cta: required(sections, "headerCta"),
    },
    hero: {
      badge: required(sections, "heroBadge"),
      titleBefore: required(sections, "heroTitleBefore"),
      titleHighlight: required(sections, "heroTitleHighlight"),
      titleAfter: optional(sections, "heroTitleAfter", ""),
      description: required(sections, "heroDescription"),
      primaryCta: required(sections, "primaryCta"),
      secondaryCta: required(sections, "secondaryCta"),
      weeklyMenuTitle: required(sections, "weeklyMenuTitle"),
      weeklyMenuFeature1: required(sections, "weeklyMenuFeature1"),
      weeklyMenuFeature2: required(sections, "weeklyMenuFeature2"),
      weeklyMenuFeature3: required(sections, "weeklyMenuFeature3"),
      weeklyMenuEmpty: required(sections, "weeklyMenuEmpty"),
    },
    featured: {
      title: required(sections, "featuredTitle"),
      emptyTitle: required(sections, "featuredEmptyTitle"),
      emptyBody: required(sections, "featuredEmptyBody"),
    },
    area: {
      title: required(sections, "areaTitle"),
      body: required(sections, "areaBody"),
    },
  };
}
