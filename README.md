# Cityvora

Cityvora is a premium city discovery and city-guide platform. It is intentionally independent from the `tech-blog` repository.

## Stack
- Hugo static site
- Premium dark editorial / marketplace-inspired UI
- Markdown city guides with structured front matter
- GitHub Actions for automated city article generation
- Vercel-ready deployment configuration

## Local development

```bash
hugo server -D
```

Build:

```bash
hugo --minify
```

## Automation

Use the **City Article** workflow with a city name to generate a new guide. The workflow uses `GROQ_API_KEY` from GitHub Actions secrets and commits the generated Markdown back to this repository.
