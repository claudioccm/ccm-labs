// /skills/<slug>.zip for a prompt with a `skill` field: a folder <slug>/ with
// the generated SKILL.md (see server/utils/promptSkill.ts).
import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file') ?? ''
  const slug = file.endsWith('.zip') ? file.slice(0, -4) : ''
  const prompt = slug ? await queryCollection(event, 'prompts').path(`/prompts/${slug}`).first() : null
  if (!prompt?.skill) throw createError({ statusCode: 404, statusMessage: 'Skill not found' })
  setHeader(event, 'content-type', 'application/zip')
  return promptSkillZip(prompt)
})
