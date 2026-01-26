# Intelli Suite

Norwegian AI SaaS products built for the Norwegian market.

## Products

| Product | Description | Status |
|---------|-------------|--------|
| **IntelliClone** | Personalized AI chatbots with memory | 🔨 Building |
| **Intelli-Notes** | AI meeting transcription & notes | 🔨 Building |
| **Intelli-Law** | Norwegian legal AI assistant | 🔨 Building |
| **Intelli-Agents** | AI automation agents for SMBs | 🔨 Building |

## Architecture

```
intelli-suite/
├── apps/
│   ├── intelliclone/      # Main chatbot platform
│   ├── intelli-notes/     # Meeting AI
│   ├── intelli-law/       # Legal AI
│   └── intelli-agents/    # Agent builder
├── packages/
│   ├── memory-core/       # Shared memory system (the secret sauce)
│   ├── ai-core/           # LLM routing & prompts
│   ├── chatbot-widget/    # Embeddable widget
│   ├── billing/           # Stripe integration
│   ├── i18n/              # Norwegian localization
│   ├── ui/                # Shared components
│   └── supabase/          # Database utilities
```

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL + pgvector)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **AI:** OpenAI, Anthropic (via ai-core)
- **Styling:** Tailwind CSS + shadcn/ui
- **Monorepo:** Turborepo + pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase:start

# Run IntelliClone
pnpm dev:clone

# Run other apps
pnpm dev:notes
pnpm dev:law
pnpm dev:agents
```

## Norwegian Market Focus

All products are built with the Norwegian market in mind:
- 🇳🇴 Norwegian language support (nynorsk + bokmål)
- 📜 Norwegian legal/regulatory compliance
- 🏦 Integration with Norwegian tools (Tripletex, Fiken, Vipps)
- 🔒 Data residency in Nordic region (Azure Norway)

## License

Proprietary - Joti Business Partner AS
