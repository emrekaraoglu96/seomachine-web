import type { SeoScoreBreakdown } from "./types";

interface ScorerInput {
  content: string;
  targetKeyword: string;
  metaTitle?: string;
  metaDescription?: string;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function getHeadings(content: string, level: number): string[] {
  const regex = new RegExp(`^#{${level}}\\s+(.+)$`, "gm");
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function countOccurrences(text: string, keyword: string): number {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = lower.indexOf(kw, pos)) !== -1) {
    count++;
    pos += kw.length;
  }
  return count;
}

function getSentences(text: string): string[] {
  return text
    .replace(/#{1,6}\s+.+/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "link")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

function getParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0 && !p.trim().startsWith("#"));
}

export function calculateSeoScore(input: ScorerInput): {
  score: number;
  breakdown: SeoScoreBreakdown;
  wordCount: number;
} {
  const { content, targetKeyword, metaTitle, metaDescription } = input;
  const keyword = targetKeyword.toLowerCase();
  const wordCount = countWords(content);
  const h1s = getHeadings(content, 1);
  const h2s = getHeadings(content, 2);
  const h3s = getHeadings(content, 3);
  const paragraphs = getParagraphs(content);
  const sentences = getSentences(content);
  const keywordCount = countOccurrences(content.toLowerCase(), keyword);
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  const first100Words = content.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
  const internalLinks = (content.match(/\[Internal:.*?\]\(.*?\)/g) || []).length;
  const externalLinks = (content.match(/\[External:.*?\]\(.*?\)/g) || []).length;
  const allLinks = (content.match(/\[.*?\]\(.*?\)/g) || []).length;

  // 1. Content Score (20 points)
  const contentDetails: string[] = [];
  let contentScore = 0;

  if (wordCount >= 2000) {
    contentScore += 8;
    contentDetails.push(`Word count: ${wordCount} (good, 2000+)`);
  } else if (wordCount >= 1500) {
    contentScore += 5;
    contentDetails.push(`Word count: ${wordCount} (aim for 2000+)`);
  } else {
    contentScore += 2;
    contentDetails.push(`Word count: ${wordCount} (too short, aim for 2000+)`);
  }

  const avgParagraphLength =
    paragraphs.length > 0
      ? paragraphs.reduce((sum, p) => sum + countWords(p), 0) / paragraphs.length
      : 0;

  if (avgParagraphLength <= 80) {
    contentScore += 6;
    contentDetails.push(`Avg paragraph length: ${Math.round(avgParagraphLength)} words (good)`);
  } else if (avgParagraphLength <= 120) {
    contentScore += 3;
    contentDetails.push(
      `Avg paragraph length: ${Math.round(avgParagraphLength)} words (try shorter paragraphs)`
    );
  } else {
    contentScore += 1;
    contentDetails.push(
      `Avg paragraph length: ${Math.round(avgParagraphLength)} words (too long)`
    );
  }

  const hasList = /^[-*]\s|^\d+\.\s/m.test(content);
  if (hasList) {
    contentScore += 6;
    contentDetails.push("Contains bullet/numbered lists (good)");
  } else {
    contentDetails.push("No lists found (add bullet points for scanability)");
  }

  // 2. Keywords Score (25 points)
  const keywordsDetails: string[] = [];
  let keywordsScore = 0;

  const h1HasKeyword = h1s.some((h) => h.toLowerCase().includes(keyword));
  if (h1HasKeyword) {
    keywordsScore += 7;
    keywordsDetails.push("Keyword in H1 (good)");
  } else {
    keywordsDetails.push("Keyword missing from H1");
  }

  const h2HasKeyword = h2s.some((h) => h.toLowerCase().includes(keyword));
  if (h2HasKeyword) {
    keywordsScore += 5;
    keywordsDetails.push("Keyword in at least one H2 (good)");
  } else {
    keywordsDetails.push("Keyword missing from H2 headings");
  }

  if (keywordDensity >= 0.8 && keywordDensity <= 2.5) {
    keywordsScore += 7;
    keywordsDetails.push(`Keyword density: ${keywordDensity.toFixed(1)}% (optimal)`);
  } else if (keywordDensity >= 0.5 && keywordDensity <= 3) {
    keywordsScore += 4;
    keywordsDetails.push(`Keyword density: ${keywordDensity.toFixed(1)}% (acceptable)`);
  } else {
    keywordsScore += 1;
    keywordsDetails.push(
      `Keyword density: ${keywordDensity.toFixed(1)}% (aim for 1-2%)`
    );
  }

  if (first100Words.includes(keyword)) {
    keywordsScore += 6;
    keywordsDetails.push("Keyword in first 100 words (good)");
  } else {
    keywordsDetails.push("Keyword missing from first 100 words");
  }

  // 3. Meta Score (15 points)
  const metaDetails: string[] = [];
  let metaScore = 0;

  if (metaTitle) {
    const titleLen = metaTitle.length;
    if (titleLen >= 50 && titleLen <= 60) {
      metaScore += 4;
      metaDetails.push(`Meta title length: ${titleLen} chars (optimal)`);
    } else if (titleLen >= 30 && titleLen <= 70) {
      metaScore += 2;
      metaDetails.push(`Meta title length: ${titleLen} chars (aim for 50-60)`);
    } else {
      metaDetails.push(`Meta title length: ${titleLen} chars (bad, aim for 50-60)`);
    }

    if (metaTitle.toLowerCase().includes(keyword)) {
      metaScore += 4;
      metaDetails.push("Keyword in meta title (good)");
    } else {
      metaDetails.push("Keyword missing from meta title");
    }
  } else {
    metaDetails.push("No meta title set");
  }

  if (metaDescription) {
    const descLen = metaDescription.length;
    if (descLen >= 140 && descLen <= 160) {
      metaScore += 4;
      metaDetails.push(`Meta description length: ${descLen} chars (optimal)`);
    } else if (descLen >= 100 && descLen <= 170) {
      metaScore += 2;
      metaDetails.push(
        `Meta description length: ${descLen} chars (aim for 140-160)`
      );
    } else {
      metaDetails.push(
        `Meta description length: ${descLen} chars (bad, aim for 140-160)`
      );
    }

    if (metaDescription.toLowerCase().includes(keyword)) {
      metaScore += 3;
      metaDetails.push("Keyword in meta description (good)");
    } else {
      metaDetails.push("Keyword missing from meta description");
    }
  } else {
    metaDetails.push("No meta description set");
  }

  // 4. Structure Score (15 points)
  const structureDetails: string[] = [];
  let structureScore = 0;

  if (h1s.length === 1) {
    structureScore += 5;
    structureDetails.push("Single H1 (good)");
  } else if (h1s.length === 0) {
    structureDetails.push("No H1 found");
  } else {
    structureScore += 2;
    structureDetails.push(`${h1s.length} H1s found (should be exactly 1)`);
  }

  if (h2s.length >= 5) {
    structureScore += 5;
    structureDetails.push(`${h2s.length} H2 sections (good)`);
  } else if (h2s.length >= 3) {
    structureScore += 3;
    structureDetails.push(`${h2s.length} H2 sections (aim for 5+)`);
  } else {
    structureScore += 1;
    structureDetails.push(`${h2s.length} H2 sections (too few, aim for 5+)`);
  }

  if (h3s.length >= 2) {
    structureScore += 5;
    structureDetails.push(`${h3s.length} H3 subsections (good depth)`);
  } else if (h3s.length >= 1) {
    structureScore += 3;
    structureDetails.push("1 H3 subsection (add more for depth)");
  } else {
    structureDetails.push("No H3 subsections (add for better structure)");
  }

  // 5. Links Score (15 points)
  const linksDetails: string[] = [];
  let linksScore = 0;

  if (internalLinks >= 3 && internalLinks <= 5) {
    linksScore += 8;
    linksDetails.push(`${internalLinks} internal links (optimal)`);
  } else if (internalLinks >= 1) {
    linksScore += 4;
    linksDetails.push(`${internalLinks} internal links (aim for 3-5)`);
  } else if (allLinks >= 3) {
    linksScore += 4;
    linksDetails.push(`${allLinks} links found (mark internal vs external)`);
  } else {
    linksDetails.push("No internal links (add 3-5)");
  }

  if (externalLinks >= 2 && externalLinks <= 3) {
    linksScore += 7;
    linksDetails.push(`${externalLinks} external links (optimal)`);
  } else if (externalLinks >= 1) {
    linksScore += 4;
    linksDetails.push(`${externalLinks} external links (aim for 2-3)`);
  } else if (allLinks >= 5) {
    linksScore += 4;
    linksDetails.push("Links present but not categorized");
  } else {
    linksDetails.push("No external links (add 2-3)");
  }

  // 6. Readability Score (10 points)
  const readabilityDetails: string[] = [];
  let readabilityScore = 0;

  const avgSentenceLength =
    sentences.length > 0
      ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length
      : 0;

  if (avgSentenceLength <= 18) {
    readabilityScore += 5;
    readabilityDetails.push(
      `Avg sentence length: ${Math.round(avgSentenceLength)} words (good)`
    );
  } else if (avgSentenceLength <= 25) {
    readabilityScore += 3;
    readabilityDetails.push(
      `Avg sentence length: ${Math.round(avgSentenceLength)} words (slightly long)`
    );
  } else {
    readabilityScore += 1;
    readabilityDetails.push(
      `Avg sentence length: ${Math.round(avgSentenceLength)} words (too long, aim for <20)`
    );
  }

  const passivePatterns =
    /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi;
  const passiveCount = (content.match(passivePatterns) || []).length;
  const passiveRatio =
    sentences.length > 0 ? (passiveCount / sentences.length) * 100 : 0;

  if (passiveRatio <= 10) {
    readabilityScore += 5;
    readabilityDetails.push(`Passive voice: ${Math.round(passiveRatio)}% (good)`);
  } else if (passiveRatio <= 20) {
    readabilityScore += 3;
    readabilityDetails.push(
      `Passive voice: ${Math.round(passiveRatio)}% (aim for <10%)`
    );
  } else {
    readabilityScore += 1;
    readabilityDetails.push(
      `Passive voice: ${Math.round(passiveRatio)}% (too high, aim for <10%)`
    );
  }

  const totalScore =
    contentScore +
    keywordsScore +
    metaScore +
    structureScore +
    linksScore +
    readabilityScore;

  const breakdown: SeoScoreBreakdown = {
    content: { score: contentScore, max: 20, details: contentDetails },
    keywords: { score: keywordsScore, max: 25, details: keywordsDetails },
    meta: { score: metaScore, max: 15, details: metaDetails },
    structure: { score: structureScore, max: 15, details: structureDetails },
    links: { score: linksScore, max: 15, details: linksDetails },
    readability: { score: readabilityScore, max: 10, details: readabilityDetails },
  };

  return { score: totalScore, breakdown, wordCount };
}
