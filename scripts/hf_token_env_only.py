"""
Use this instead of huggingface_hub.login() in Docker or Hugging Face Spaces.

huggingface_hub.login() calls https://huggingface.co/api/whoami-v2 on every
startup to validate the token. That endpoint is heavily rate-limited; frequent
restarts or many replicas cause HTTP 429.

The Hub libraries (transformers, datasets, huggingface_hub, etc.) already read
HF_TOKEN / HUGGING_FACE_HUB_TOKEN from the environment — no login() call is
required for normal API and download usage.

Usage in app.py (replace login + delete the huggingface_hub.login line):

    from hf_token_env_only import ensure_hf_token_from_env
    ensure_hf_token_from_env()

Or copy the body of ensure_hf_token_from_env() inline if you prefer one file.
"""

from __future__ import annotations

import os


def ensure_hf_token_from_env() -> str:
    """
    Ensure token env vars are set. Does not call the Hub (no whoami / no 429).
    Returns the token string.
    """
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if not token or not str(token).strip():
        raise RuntimeError(
            "Set the HF_TOKEN or HUGGING_FACE_HUB_TOKEN secret/environment variable."
        )
    token = str(token).strip()
    os.environ["HF_TOKEN"] = token
    os.environ["HUGGING_FACE_HUB_TOKEN"] = token
    return token
