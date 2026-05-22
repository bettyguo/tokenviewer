"""
Generates canonical tokenization references for the test suite.

The OpenAI encodings are taken from `tiktoken` (OpenAI's own library); the
Hugging Face tokenizers are taken from the `tokenizers` library (the canonical
Rust fast-tokenizer) loading the exact `tokenizer.json` the app ships. The JS
adapters in `tests/tokenizers.test.ts` are then asserted to reproduce these
ids exactly.

Run:  pip install tiktoken tokenizers  &&  python scripts/gen_reference.py
Requires `public/tokenizers/` to be populated (npm run fetch:tokenizers).
"""
import json
import os

import tiktoken
from tokenizers import Tokenizer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TEXTS = {
    "ascii": "hello world",
    "sentence": "The quick brown fox jumps over the lazy dog.",
    "cjk": "你好,世界!这是一个分词测试。",
    "code": "def add(a: int, b: int) -> int:\n    return a + b",
    "whitespace": "a\n\nb\tc   d",
    "unicode": "café 🌍 naïve — résumé",
}

TIKTOKEN = {"gpt2": "gpt2", "cl100k": "cl100k_base", "o200k": "o200k_base"}
HF = ["llama3", "deepseek", "qwen3", "mt5"]


def main() -> None:
    ids: dict[str, dict[str, list[int]]] = {}

    for code, enc_name in TIKTOKEN.items():
        enc = tiktoken.get_encoding(enc_name)
        ids[code] = {k: enc.encode(v) for k, v in TEXTS.items()}

    for code in HF:
        path = os.path.join(ROOT, "public", "tokenizers", code, "tokenizer.json")
        tok = Tokenizer.from_file(path)
        ids[code] = {
            k: tok.encode(v, add_special_tokens=False).ids for k, v in TEXTS.items()
        }

    out = {
        "about": (
            "Canonical reference token ids. OpenAI encodings from tiktoken; "
            "HF tokenizers from the tokenizers library on the shipped "
            "tokenizer.json. Regenerate with scripts/gen_reference.py."
        ),
        "texts": TEXTS,
        "ids": ids,
    }
    dest = os.path.join(ROOT, "tests", "fixtures", "reference.json")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"Wrote {dest}")


if __name__ == "__main__":
    main()
