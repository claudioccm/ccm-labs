// Skill downloads (/prompts/<slug> for a skill, 2026-10-29). Hand-written
// skills are written by modules/skill-downloads; prompts with a `skill` field
// are served by server/routes/skills (2026-11-01). Nuxt auto-imports app/utils/*.

export type SkillDownloadFormat = 'zip' | 'md' | 'view'

/** Which page the click came from. */
export type SkillDownloadSource = 'skill_page' | 'prompt_page'

export function skillFiles(slug: string): { zip: string, md: string } {
  return {
    zip: `/skills/${slug}.zip`,
    md: `/skills/${slug}/SKILL.md`,
  }
}

type Gtag = (command: 'event', name: string, params: Record<string, string>) => void

// GA4 `skill_download`, same guard as trackPromptCopy: gtag comes from the
// inline snippet in nuxt.config.ts and may be blocked.
export function trackSkillDownload(slug: string, format: SkillDownloadFormat, source: SkillDownloadSource): void {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  if (typeof gtag !== 'function') return
  try {
    gtag('event', 'skill_download', { skill: slug, format, source })
  }
  catch {
    // Never let analytics break the download.
  }
}
