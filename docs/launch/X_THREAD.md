# X / Twitter thread

Seven tweets. No emojis. Tweet 1 carries the hero image. Replace the URL
placeholder once deployed.

---

**1/** (attach: docs/screenshots/hero-chinese.png)

The same Chinese paragraph, tokenized by nine different LLM tokenizers.

GPT-2 spends 175 tokens on it. DeepSeek-V3 spends 51. Same text, 3.4x the cost.

I built a tool to see this for any text, side by side, in the browser.

---

**2/**

Tokenizer choice is not a rounding error. It sets your API cost, your
latency, and how much fits in the context window.

The reference corpus shows the spread on one translated passage:

- Chinese: 51 to 175 tokens (3.4x)
- Japanese: 59 to 158 (2.7x)
- Arabic: 65 to 213 (3.3x)

---

**3/**

The quieter finding is about fairness.

The Swahili version of that passage costs 83 tokens at best — versus 60 for
English. Swahili uses the Latin alphabet, so it is not penalised for its
script. The gap is training-data coverage.

This is the effect Petrov et al. and Ahia et al. documented in 2023.

---

**4/**

It is not just languages. Code and notation diverge too.

Paste a Python function with type hints and watch the indentation, the
brackets, and the `->` get tokenized completely differently across model
families. GPT-2 in particular shreds the leading whitespace.

There is a gallery of these cases built in.

---

**5/**

Under the side-by-side view there is an analysis layer: bytes-per-token
efficiency, how often common words get split, and a cross-tokenizer
"agreement" view that highlights exactly where the tokenizers stop cutting
in the same places.

---

**6/**

It all runs in your browser. The text you paste never goes to a server —
no backend, no analytics, no third-party scripts.

Each of the nine tokenizers is verified in the test suite against a
canonical reference, so the segmentation you see is the real thing.

---

**7/**

Open source, MIT licensed. Try it with your own text — multilingual content
and source files are where it gets interesting:

https://bettyguo.github.io/tokenviewer/

Repo and design notes: https://github.com/bettyguo/tokenviewer

(Bug reports welcome — tokenizer edge cases especially.)
