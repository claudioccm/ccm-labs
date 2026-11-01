// Writes the skill downloads; see index.ts. Kept apart from the module so the
// tests can import it without Nuxt.
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { createZip, type ZipEntry } from './zip'

function listFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter(name => !name.startsWith('.'))
    .sort()
    .flatMap((name) => {
      const path = join(dir, name)
      return statSync(path).isDirectory() ? listFiles(path) : [path]
    })
}

export function buildSkillDownloads(skillsDir: string, outDir: string): string[] {
  rmSync(outDir, { recursive: true, force: true })
  let names: string[] = []
  try {
    names = readdirSync(skillsDir).filter(n => statSync(join(skillsDir, n)).isDirectory()).sort()
  }
  catch {
    return []
  }

  for (const name of names) {
    const root = join(skillsDir, name)
    const files = listFiles(root)
    const entries: ZipEntry[] = [{ name: `${name}/` }]
    for (const file of files) {
      const rel = relative(root, file).split('\\').join('/')
      const data = readFileSync(file)
      entries.push({ name: `${name}/${rel}`, data })
      const target = join(outDir, 'skills', name, rel)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, data)
    }
    mkdirSync(join(outDir, 'skills'), { recursive: true })
    writeFileSync(join(outDir, 'skills', `${name}.zip`), createZip(entries))
  }
  return names
}

// Slugs of prompts that are also offered as skills: a top-level `skill:` key in
// the frontmatter. Drafts only when the build shows drafts (see
// app/utils/promptDrafts.ts). The files themselves come from Nitro routes.
export function promptSkillSlugs(promptsDir: string, includeDrafts: boolean): string[] {
  let files: string[] = []
  try {
    files = readdirSync(promptsDir).filter(f => f.endsWith('.md')).sort()
  }
  catch {
    return []
  }
  return files.filter((f) => {
    const frontmatter = readFileSync(join(promptsDir, f), 'utf8').split(/^---\s*$/m)[1] ?? ''
    if (!/^skill:/m.test(frontmatter)) return false
    return includeDrafts || !/^draft:\s*true\s*$/m.test(frontmatter)
  }).map(f => f.slice(0, -3))
}
