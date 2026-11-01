/**
 * Skill downloads (2026-10-29). Each folder in `skills/` (repo root) is one
 * Agent Skill, kept exactly as people install it: `skills/<name>/SKILL.md`
 * plus any supporting files. On every build and dev start this module writes
 *
 *   /skills/<name>.zip         the folder zipped, `<name>/SKILL.md` inside
 *   /skills/<name>/<file>      each file as-is ("View the file")
 *
 * into node_modules/.cache/skill-downloads, which Nitro serves as public
 * assets, so `nuxt generate` copies them to .output/public. (Not the build
 * dir: `nuxt generate` clears that after modules run.) The zip is always built from the
 * repo copy, so it can't drift from the file on the page. The page entry for a
 * skill lives in content/skills/<name>.md.
 *
 * Prompts with a `skill` field are skills too (2026-11-01): their files are
 * built by Nitro routes from the prompt (server/utils/promptSkill.ts), and this
 * module adds those routes to the prerender list, since the crawler doesn't
 * follow links to .zip or .md files.
 */
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { includePromptDrafts } from '../../app/utils/promptDrafts'
import { buildSkillDownloads, promptSkillSlugs } from './build'

export default defineNuxtModule({
  meta: { name: 'skill-downloads' },
  setup(_options, nuxt) {
    // Built once at startup: in dev, restart after editing a skill.
    const outDir = join(nuxt.options.rootDir, 'node_modules/.cache/skill-downloads')
    buildSkillDownloads(join(nuxt.options.rootDir, 'skills'), outDir)
    nuxt.options.nitro.publicAssets ||= []
    nuxt.options.nitro.publicAssets.push({ dir: outDir, baseURL: '/', maxAge: 0 })

    const slugs = promptSkillSlugs(join(nuxt.options.rootDir, 'content/prompts'), includePromptDrafts(process.env))
    nuxt.options.nitro.prerender ||= {}
    nuxt.options.nitro.prerender.routes ||= []
    nuxt.options.nitro.prerender.routes.push(...slugs.flatMap(s => [`/skills/${s}.zip`, `/skills/${s}/SKILL.md`]))
  },
})
