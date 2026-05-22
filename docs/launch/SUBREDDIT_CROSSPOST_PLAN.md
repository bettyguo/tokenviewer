# Subreddit and cross-post plan

Beyond Hacker News. The goal is reach without looking like a spam campaign, so
the posts are spaced and each is tailored to the community rather than
copy-pasted.

## Ordering and cadence

Lead with HN and X on day 0. Then space the community posts at roughly
2–3 day intervals. Never post the same text to two communities on the same
day. Each post is rewritten for its audience — the title and the first
paragraph in particular.

| Day | Venue                 | Angle                                                                                                                           |
| --: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
|   0 | Hacker News (Show HN) | The tool, plainly described. See HN_SUBMISSION.md.                                                                              |
|   0 | X / Twitter           | The hero clip. See X_THREAD.md.                                                                                                 |
|   0 | Blog post published   | The durable write-up; HN and X link to it.                                                                                      |
|  +2 | r/LocalLLaMA          | Open-weight angle: how Llama 3, DeepSeek-V3, Qwen3 tokenize the same text differently; relevant to anyone picking a base model. |
|  +4 | r/MachineLearning     | Lead with the reference corpus and the fairness numbers; cite Petrov and Ahia. Flair as a project/[P].                          |
|  +6 | Lobsters              | The tool, with the client-side/no-backend architecture as the hook; the Lobsters audience cares about that. Tag `ml`, `web`.    |
|  +9 | r/programming         | The code/whitespace angle — how source code tokenizes differently across families.                                              |
| +12 | r/linguistics         | The multilingual fairness angle, framed as a writing-systems and language-representation question, not an ML-ops one.           |

## Per-venue notes

**r/LocalLLaMA** — the most receptive audience; people here choose between
open-weight models constantly. Do not oversell; this community is quick to
spot hype. Lead with a concrete comparison they would actually run.

**r/MachineLearning** — use the `[P]` (project) flair. The reference corpus
and the canonical-verification methodology are what earn credibility here. Be
upfront that the corpus is small (10 texts) and illustrative of a documented
effect, not a benchmark.

**Lobsters** — invite-only and allergic to marketing. Submit the repo or blog
post, not a landing page, and let the architecture speak. Engage in comments
technically.

**r/programming** — broad and skeptical. The Python-with-type-hints gallery
sample is the strongest hook; "your tokenizer shreds your indentation" is
concrete and surprising.

**r/linguistics** — a non-ML audience. Drop the jargon. Frame it as: writing
systems and languages are not billed equally by language models, and here is a
tool to see it. The Swahili-vs-English finding (same alphabet, more tokens) is
the one that resonates here.

## Hygiene

- Always disclose authorship ("I built this").
- Respond to comments in every thread; a cross-post with no author replies
  reads as a drive-by.
- If a community's rules require it, ask a moderator before posting.
- If one venue's post does poorly, do not retry it elsewhere with the same
  framing the next day — adjust and slow down.
- Skip any niche subreddit that does not clearly fit; r/InternationalLLM and
  similar may not exist or may be inactive — only post where there is a real
  audience.
