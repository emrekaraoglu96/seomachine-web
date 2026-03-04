import type { ResearchBrief } from "@/lib/types";

export function getWritePrompt(context: {
  companyName: string;
  companyUrl?: string;
  industry?: string;
  targetAudience?: string;
  toneOfVoice: string;
  toneDescription?: string;
  researchBrief: ResearchBrief;
  authorVoice?: string;
}) {
  const brief = context.researchBrief;

  return `You are an elite SEO content writer. Write a comprehensive, engaging, publish-ready article.

## Brand Context
- Company: ${context.companyName}${context.companyUrl ? ` (${context.companyUrl})` : ""}
${context.industry ? `- Industry: ${context.industry}` : ""}
${context.targetAudience ? `- Target Audience: ${context.targetAudience}` : ""}
- Tone: ${context.toneOfVoice}${context.toneDescription ? ` — ${context.toneDescription}` : ""}
${
  context.authorVoice
    ? `
## Author's Voice Sample
The author described their vision in their own words:
"""
${context.authorVoice}
"""

Match the author's natural style throughout the article:
- Mirror their vocabulary level (simple vs technical)
- Echo their sentence rhythm (short punchy vs flowing)
- Use their terminology and phrasing patterns
- Capture their unique perspective and angle on the topic
`
    : ""
}
## Content Brief
- Target Keyword: "${brief.targetKeyword}"
- Secondary Keywords: ${brief.secondaryKeywords.join(", ")}
- Search Intent: ${brief.searchIntent}
- Target Word Count: ${brief.estimatedWordCount}+

## Article Structure
Title: ${brief.contentOutline.title}

${brief.contentOutline.sections
  .map(
    (s, i) =>
      `### Section ${i + 1}: ${s.heading}\nKey points: ${s.keyPoints.join("; ")}`
  )
  .join("\n\n")}

## Writing Rules

### SEO Requirements
1. Use the target keyword in: H1, first 100 words, 1-2 H2s, meta description, naturally throughout (1-2% density)
2. Use secondary keywords naturally in H2s and body text
3. Write a clear H1 title with the keyword near the beginning
4. Include 6-8 H2 sections minimum
5. Use H3 subsections where appropriate
6. Aim for 2000+ words

### Engagement Rules (APP Framework)
1. **Hook**: Start with a surprising stat, bold claim, or relatable pain point in the first paragraph
2. **Mini-stories**: Weave in 2-3 brief scenarios or examples that readers recognize
3. **Data points**: Include specific numbers, percentages, or metrics (use realistic but illustrative figures)
4. **Transitions**: Each section should flow naturally into the next
5. **CTA placement**: Include 1-2 contextual CTAs woven into the content (not salesy)

### Content Quality
1. Write in short paragraphs (2-4 sentences max)
2. Use bullet points and numbered lists for scanability
3. Keep sentences under 20 words when possible
4. Avoid passive voice
5. Use "you" and "your" to address the reader directly
6. Include a compelling introduction and strong conclusion
7. Add practical, actionable advice — not generic fluff

### Link Placeholders
1. Include 3-5 internal link placeholders: [Internal: anchor text](internal-link)
2. Include 2-3 external link placeholders: [External: anchor text](external-link)

### Format
Output in clean Markdown with proper heading hierarchy (# for H1, ## for H2, ### for H3).
Do NOT include meta title or meta description in the article body.
Start directly with the H1 heading.`;
}
