<!-- One prompt: what it does, Copy button(s), how-to steps, CTA to /consulting, related prompts.
     The prompt text is copied, never rendered (Claudio, 2026-10-16).
     Rendered by pages/prompts/[slug].vue, which also serves skills (SkillDetail). -->
<script setup lang="ts">
import { computed } from 'vue'
import type { PromptsCollectionItem } from '@nuxt/content'

const props = defineProps<{ doc: PromptsCollectionItem }>()

const route = useRoute()
const prompt = computed(() => props.doc)
const slug = computed(() => promptSlug(prompt.value.path))
const skill = computed(() => skillFiles(slug.value))
const hasNotes = computed(() => (prompt.value.body?.value?.length ?? 0) > 0)

// Related: same category first, then the newest others, three at most.
const { data: others } = await useAsyncData(`prompts-related-${route.path}`, () =>
  queryCollection('prompts')
    .where('draft', '=', false)
    .where('path', '<>', route.path)
    .order('date', 'DESC')
    .all(),
)
const related = computed(() => {
  const list = others.value ?? []
  const same = list.filter(p => p.category === prompt.value.category)
  const rest = list.filter(p => p.category !== prompt.value.category)
  return [...same, ...rest].slice(0, 3)
})

const ctaBody = computed(() =>
  `${prompt.value.builtVersion ?? 'The version I build is connected to your own tools and records, so there is nothing to paste.'} Tell me the task that keeps coming back. If a free prompt fixes it, you’ll hear that first.`,
)

const canonical = computed(() => `https://ccm-labs.ca${prompt.value.path}`)
useHead({ link: [{ rel: 'canonical', href: canonical.value }] })
useSeoMeta({
  title: () => `${prompt.value.title} — Free AI prompt — CCM Labs`,
  description: () => prompt.value.description,
  ogTitle: () => prompt.value.title,
  ogDescription: () => prompt.value.description,
  ogUrl: () => canonical.value,
  twitterTitle: () => prompt.value.title,
  twitterDescription: () => prompt.value.description,
  robots: () => (prompt.value.draft ? 'noindex, nofollow' : undefined),
})
</script>

<template>
  <div>
    <article class="article prompt-page">
      <div class="article__head">
        <NuxtLink to="/prompts" class="article__back mono">← All prompts</NuxtLink>

        <div class="article__meta mono">
          <span>{{ prompt.category }}</span>
          <span>For: {{ prompt.audience }}</span>
          <template v-if="prompt.draft">
            <span class="article__sep" aria-hidden="true">/</span>
            <span class="prompt-draft">Draft, not published</span>
          </template>
        </div>

        <h1 class="article__title">{{ prompt.title }}</h1>
        <p class="article__dek">{{ prompt.description }}</p>
      </div>

      <div class="article__body prompt-page__body">
        <div class="prompt-page__prompts">
          <PromptBlock
            v-for="(item, i) in prompt.prompts"
            :key="i"
            :text="item.text"
            :label="item.label"
            :slug="slug"
            :category="prompt.category"
            :part="i + 1"
          />
        </div>

        <!-- Also a skill (2026-11-01): the same prompt as a SKILL.md built from
             it (server/utils/promptSkill.ts). Copy stays the primary action. -->
        <div v-if="prompt.skill" class="prompt-copy prompt-skill">
          <div class="prompt-copy__text">
            <p class="prompt-copy__label">Use it as a skill</p>
            <p class="prompt-copy__note">
              Install it once and your AI runs this prompt when you ask for it. No pasting.
            </p>
          </div>
          <a
            class="btn btn-ghost prompt-copy__btn"
            :href="skill.zip"
            :download="`${slug}.zip`"
            @click="trackSkillDownload(slug, 'zip', 'prompt_page')"
          >Download .zip</a>
          <ul class="prompt-skill__install">
            <li>Claude app or claude.ai: Customize, then Skills, then + and Upload a skill. Pick the .zip.</li>
            <li>Claude Code: unzip it into <code>~/.claude/skills/</code>, then type <code>/{{ slug }}</code>.</li>
          </ul>
          <a
            class="skill-download__view mono"
            :href="skill.md"
            target="_blank"
            rel="noopener"
            @click="trackSkillDownload(slug, 'view', 'prompt_page')"
          >View SKILL.md <span aria-hidden="true">↗</span></a>
        </div>

        <div v-if="prompt.steps?.length" class="prompt-page__section">
          <h2 id="how-to-use" class="prompt-page__heading">How to use it</h2>
          <ol class="prompt-steps">
            <li v-for="(step, i) in prompt.steps" :key="i">
              <span class="prompt-steps__n mono" aria-hidden="true">{{ padIndex(i + 1) }}</span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </div>

        <p v-if="prompt.check" class="prompt-check">{{ prompt.check }}</p>

        <div v-if="hasNotes" class="prose prompt-page__notes">
          <ContentRenderer :value="prompt" />
        </div>
      </div>
    </article>

    <CtaBanner
      heading="That’s the DIY version."
      :body="ctaBody"
      cta-label="Start with one thing"
      cta-href="/consulting#contact"
    />

    <section v-if="related.length" class="writing-grid-section prompt-related">
      <div class="shell">
        <h2 class="writing-grid-section__head">More prompts</h2>
        <div class="prompt-grid-wrap">
          <ul class="prompt-grid" aria-label="More prompts">
            <li v-for="item in related" :key="item.path">
              <PromptCard
                :to="item.path"
                :title="item.title"
                :category="item.category"
                :audience="item.audience"
                :description="item.description"
                :also-skill="!!item.skill"
              />
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
