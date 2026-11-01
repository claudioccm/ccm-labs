// /skills/<slug>/SKILL.md for a prompt with a `skill` field (see
// server/utils/promptSkill.ts). Hand-written skills (skills/<name>/) are
// static files from modules/skill-downloads and never reach this route.
import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const prompt = await queryCollection(event, 'prompts').path(`/prompts/${slug}`).first()
  if (!prompt?.skill) throw createError({ statusCode: 404, statusMessage: 'Skill not found' })
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return promptSkillMarkdown(prompt)
})
