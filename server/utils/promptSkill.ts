// Prompts as skills (2026-11-01). A prompt with a `skill` field in its
// frontmatter is also served as an Agent Skill, built from the prompt itself
// so an edit to the prompt updates the skill:
//
//   /skills/<slug>/SKILL.md   server/routes/skills/[slug]/SKILL.md.ts
//   /skills/<slug>.zip        server/routes/skills/[file].ts
//
// Both are prerendered (modules/skill-downloads lists the routes). The prompt
// text goes in word for word; only a short preamble is added so the model
// knows to ask for the inputs a pasted prompt would have had alongside it.

import { createZip } from '../../modules/skill-downloads/zip'

export interface PromptSkillSource {
  path: string
  title: string
  description: string
  prompts: { label?: string, text: string }[]
  skill?: { description: string }
}

// Same rule as app/utils/prompts.ts splitPlaceholders: a [bracket] with a
// letter or digit in it, on one line.
const PLACEHOLDER = /\[[^[\]\n]*\w[^[\]\n]*\]/g

export function promptSkillSlug(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? ''
}

// YAML double-quoted scalar, so any description is safe in the frontmatter.
function yamlString(value: string): string {
  return JSON.stringify(value.replace(/\s+/g, ' ').trim())
}

export function promptSkillMarkdown(prompt: PromptSkillSource): string {
  const slug = promptSkillSlug(prompt.path)
  const placeholders = [...new Set(prompt.prompts.flatMap(p => p.text.match(PLACEHOLDER) ?? []))]
  const multi = prompt.prompts.length > 1

  const lines = [
    '---',
    `name: ${slug}`,
    `description: ${yamlString(prompt.skill?.description ?? prompt.description)}`,
    '---',
    '',
    `# ${prompt.title}`,
    '',
    `${prompt.description}`,
    '',
    '## How to run this skill',
    '',
    multi
      ? `This skill is the CCM Labs prompt "${prompt.title}", in ${prompt.prompts.length} parts. Follow each part below as if the user had just pasted it into the chat, in order.`
      : `This skill is the CCM Labs prompt "${prompt.title}". Follow the prompt below as if the user had just pasted it into the chat.`,
    '',
    '- Where the prompt says the user will paste, attach or give you something (notes, a link, a file, messages), and they haven\'t yet, ask for it first.',
  ]
  if (placeholders.length) {
    lines.push(`- The prompt has parts in [brackets] for the user's own details: ${placeholders.join(', ')}. Ask for them in one short message before you start, then use the answers wherever the brackets appear.`)
  }
  lines.push(
    '- Apart from that, follow the prompt exactly. Don\'t skip its rules or steps.',
    '',
  )

  prompt.prompts.forEach((part, i) => {
    lines.push('---', '')
    if (multi) lines.push(`## Part ${i + 1}${part.label ? `: ${part.label}` : ''}`, '')
    lines.push(part.text.trimEnd(), '')
  })

  lines.push('---', '', `Source: https://ccm-labs.ca${prompt.path}`, '')
  return lines.join('\n')
}

export function promptSkillZip(prompt: PromptSkillSource): Buffer {
  const slug = promptSkillSlug(prompt.path)
  return createZip([
    { name: `${slug}/` },
    { name: `${slug}/SKILL.md`, data: Buffer.from(promptSkillMarkdown(prompt), 'utf8') },
  ])
}
