# Hysteria 2 documentation website

This is the source code repository for the [Hysteria 2 documentation website](https://v2.hysteria.network/).

It's built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/). With [uv](https://docs.astral.sh/uv/) installed, use the pinned Python version and dependencies to get started:

```bash
uv sync --locked

uv run --locked mkdocs serve
```

Validate the site in all configured languages before publishing:

```bash
uv run --locked mkdocs build --clean --strict
```
