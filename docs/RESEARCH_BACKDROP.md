# RESEARCH_BACKDROP

The research thread that makes a tokenizer-comparison tool relevant in 2026,
and the specific claims the reference corpus should let a user verify.

## 1. Tokenizer fairness across languages

**Petrov, La Malfa, Torr, Bibi — "Language Model Tokenizers Introduce
Unfairness Between Languages" (NeurIPS 2023, arXiv:2305.15425).**

- The same text translated into different languages can have tokenized
  lengths differing by **up to ~15x**.
- The disparity persists even for tokenizers explicitly trained to be
  multilingual.
- Even character-level and byte-level models show >4x encoding-length
  differences for some language pairs.
- Consequence: unequal API cost, latency, and effective context window for
  speakers of under-served languages.

Note: the master brief attributes this to "Petroni et al." — that is a
misattribution. The fairness paper is **Petrov et al.** (Aleksandar Petrov,
Oxford). Fabio Petroni is a different researcher (knowledge probing). The
README and blog post use the correct citation.

## 2. The cost of tokenization for low-resource languages

**Ahia, Kumar, Gonen, Kasai, Mortensen, Smith, Tsvetkov — "Do All Languages
Cost the Same? Tokenization in the Era of Commercial Language Models"
(EMNLP 2023, arXiv:2305.13707).**

- Systematic study of OpenAI API cost/utility across 22 typologically diverse
  languages.
- What counts as a "token" is training-data- and model-dependent; conveying
  the same information costs very different token counts per language.
- Speakers of many supported languages are **overcharged and get worse
  results**, and disproportionately come from regions where the API is least
  affordable.

Together, Petrov and Ahia establish "tokenizer choice is an equity issue, not
just an engineering detail." tokenviewer makes that measurable interactively.

## 3. Byte-level and tokenizer-free models

- **Byte Latent Transformer (BLT)** — Meta, Dec 2024 (arXiv:2412.09871, ACL
  2025). No fixed vocabulary; raw bytes are grouped into variable-size patches
  by an entropy model. Matches Llama-3 quality with ~50% fewer inference
  FLOPs.
- **Fast BLT** — Meta + Stanford, May 2026: cuts inference memory bandwidth
  > 50% with no tokenization.
- Lineage: ByT5, CANINE, Charformer, MambaByte.

Relevance: the tokenizer-free thread is the implicit "what if none of this?"
backdrop. tokenviewer's bytes-per-token metric is exactly the quantity these
models try to make irrelevant. A future "byte-level baseline" pseudo-tokenizer
(1 token == 1 UTF-8 byte) is a natural reference row — noted as a stretch idea.

## 4. Long-context efficiency

As context windows grew through 2024-2026, tokenizer efficiency moved from a
rounding error to a real cost and latency lever: a tokenizer that needs 30%
more tokens for your domain shrinks your usable context by 30% and raises cost
proportionally. This is the pragmatic, non-equity reason an engineer reaches
for a comparison tool — and the reason the comparison table leads with
bytes-per-token, not raw count.

## Claims the reference corpus must let a user verify

The precomputed corpus (CORPUS_DESIGN.md) should make these concrete and
honest:

1. CJK text costs dramatically more tokens under older/smaller-vocab
   tokenizers (GPT-2) than newer large-vocab ones (o200k, Qwen3).
2. The cost ratio between the best and worst tokenizer for a given language is
   itself language-dependent — i.e. the "fairness gap" is visible.
3. Low-resource languages (Swahili control) are not served as well as
   high-resource ones even by nominally multilingual tokenizers.
4. Code and math are tokenized very differently across families; whitespace
   and digit handling are the usual culprits.

Every number shown comes from a real precompute run over the committed corpus.
No illustrative or rounded-for-effect figures. (See the anti-pattern warnings
in the master brief.)

## Sources

- Petrov et al., NeurIPS 2023 — arxiv.org/abs/2305.15425
- Ahia et al., EMNLP 2023 — aclanthology.org/2023.emnlp-main.614
- Byte Latent Transformer — arxiv.org/abs/2412.09871
