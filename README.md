# open-uistacks

**Animated React components you own.** 282 components, 54 blocks and 10 full-app templates, built on React 19, Tailwind CSS v4 and Motion. Add them to your project with one command; the source lands in your codebase, ready to change.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Components](https://img.shields.io/badge/components-282-6e56cf)
![Blocks](https://img.shields.io/badge/blocks-54-6e56cf)
![Templates](https://img.shields.io/badge/templates-10-6e56cf)

```sh
npx github:Ashu1109/open-uistacks init
npx github:Ashu1109/open-uistacks add prompt-input
```

> open-uistacks is an independent project. It is not made by, affiliated with or endorsed by UI Stacks; it includes their free MIT components, credited below.

## Why open-uistacks

- **Everything moves.** Entrances, hover and press feedback, sliding selections, numbers that count up, charts that draw in, lists that animate items in and out. With the system's reduced-motion setting on, all of it falls back to short fades.
- **You own the code.** The CLI copies plain `.tsx` files into your project. There is no runtime package to upgrade and nothing to configure around.
- **Accessible by default.** Real buttons, labelled controls, keyboard support (arrow keys, Escape, Home and End where they make sense) and live announcements for things like drag and drop.
- **One theme.** Every component reads the same CSS variables, so a token change restyles the whole kit in light and dark mode.
- **Beyond components.** Blocks are ready-made sections with sample data (dashboards, inboxes, workspaces); templates are complete app screens built from them.

## Requirements

- React 19 with TypeScript or JavaScript
- Tailwind CSS v4
- Node.js 18.17 or later, and git (the `npx github:` form clones the CLI)

## Quick start

**1. Initialise** once per project:

```sh
npx github:Ashu1109/open-uistacks init
```

This creates `open-uistacks.json`, writes the theme to `components/open-uistacks.css` (or `src/components/` when you have a `src` folder) and imports it right after `@import "tailwindcss";` in your global stylesheet.

**2. Add** what you need, by name:

```sh
npx github:Ashu1109/open-uistacks add prompt-input model-picker   # components
npx github:Ashu1109/open-uistacks add revenue-overview             # a block
npx github:Ashu1109/open-uistacks add devops                       # a whole template
```

Each item arrives with everything it imports, and the CLI installs the npm packages it needs (`motion`, `lucide-react`) with your package manager (npm, pnpm, yarn or bun, detected from your lockfile).

**3. Use** it:

```tsx
import { PromptInput } from "@/components/ui/prompt-input";

export function Chat() {
  return <PromptInput placeholder="Ask anything" onSubmit={(text) => console.log(text)} />;
}
```

Dark mode follows a `dark` class on the root element (`<html class="dark">`).

## CLI

```
npx github:Ashu1109/open-uistacks <command> [options]
```

| Command | What it does |
|---|---|
| `init` | Create `open-uistacks.json`, add the theme stylesheet and import it after Tailwind |
| `add <name...>` | Add components, blocks or templates, plus everything they import |
| `list [kind]` | List every name; `kind` is `component`, `block` or `template` |

| Option | Applies to | Meaning |
|---|---|---|
| `--dir <path>` | `init` | Folder for `ui/`, `blocks/` and `templates/` (default `src/components` or `components`) |
| `--css <file>` | `init` | Global stylesheet to import the theme into (found automatically) |
| `--overwrite` | `add` | Replace files that changed without asking |
| `--dry-run` | `add` | Show what would be written and installed, change nothing |
| `--no-install` | `add` | Skip installing npm packages |
| `--registry <src>` | all | Use another registry folder or URL (see [Registry](#registry)) |

`add` never silently replaces your edits: a file that differs from the registry is skipped (or you are asked, in an interactive terminal) unless you pass `--overwrite`.

### What gets installed

```
src/components/
├── open-uistacks.css      theme tokens (from init)
├── ui/                    components, e.g. prompt-input.tsx, chart-utils.ts
├── blocks/                blocks, e.g. revenue-overview.tsx, app-shell.tsx
└── templates/             templates, e.g. devops.tsx
```

Files import each other with relative paths, so nothing depends on your path aliases.

## Theming

Tokens live on `:root` (light) and `.dark` (dark) in `open-uistacks.css` and are exposed to Tailwind through `@theme inline`, which is why classes like `bg-surface`, `text-fg-muted` and `ring-track` work. Change a value there to restyle every component:

```css
:root {
  --select: #6e56cf;      /* accent used for selection, focus rings and primary actions */
  --surface: #ffffff;
}
.dark {
  --select: #8e7cf0;
}
```

## Catalog

Every name below works with `add`. Run `list` for the same list in your terminal, or open the docs site locally (see [Development](#development)) to try each one live.

<!-- catalog:start -->
### Components (282)

<details>
<summary><strong>AI chat</strong> (40)</summary>

| Name | Add it |
|---|---|
| Prompt input | `add prompt-input` |
| Message | `add message` |
| Thinking state | `add thinking-state` |
| Citation | `add citation` |
| Suggestions | `add suggestions` |
| Feedback | `add feedback` |
| Attachment | `add attachment` |
| Context meter | `add context-meter` |
| Model picker | `add model-picker` |
| Effort slider | `add effort-slider` |
| AI recap | `add ai-recap` |
| Suggested edits | `add suggested-edits` |
| Clarifying question | `add clarifying-question` |
| Correction | `add correction` |
| Review stack | `add review-stack` |
| AI summary | `add ai-summary` |
| Connectors strip | `add connectors-strip` |
| Starter cards | `add starter-cards` |
| Citation row | `add citation-row` |
| Docked composer | `add prompt-composer-docked` |
| Voice prompt | `add voice-prompt` |
| Inline ask | `add inline-ask` |
| Mention prompt | `add mention-prompt` |
| Prompt with attachments | `add prompt-attachments` |
| Mini prompt | `add mini-prompt` |
| Conversation list | `add conversation-list` |
| Branch switcher | `add branch-switcher` |
| Artifact panel | `add artifact-panel` |
| Prompt library | `add prompt-library` |
| Image generations | `add image-generations` |
| Ghost autocomplete | `add ghost-autocomplete` |
| Live transcript | `add live-transcript` |
| Redacted text | `add redacted-text` |
| Share chat | `add share-chat` |
| Search results | `add search-results` |
| Chart answer | `add chart-answer` |
| Source viewer | `add source-viewer` |
| Prompt enhancer | `add prompt-enhancer` |
| Translate panel | `add translate-panel` |
| Assistant picker | `add assistant-picker` |

</details>

<details>
<summary><strong>AI agents</strong> (44)</summary>

| Name | Add it |
|---|---|
| Approval request | `add approval-request` |
| Tool call | `add tool-call` |
| Run card | `add run-card` |
| Diff block | `add diff-block` |
| Plan card | `add plan-card` |
| Agent control frame | `add agent-control-frame` |
| Preflight checks | `add preflight-checks` |
| Extracted fields | `add extracted-fields` |
| Model card | `add model-card` |
| Eval scorecard | `add eval-scorecard` |
| Automation card | `add automation-card` |
| Trace waterfall | `add trace-waterfall` |
| Browser frame | `add browser-frame` |
| Change preview | `add change-preview` |
| Checks list | `add checks-list` |
| Agent roster | `add agent-roster` |
| Relay timeline | `add relay-timeline` |
| Trust level | `add trust-level` |
| Restore points | `add restore-points` |
| Attention queue | `add attention-queue` |
| Memory list | `add memory-list` |
| Spend breakdown | `add spend-breakdown` |
| Run schedule | `add run-schedule` |
| Attempt compare | `add attempt-compare` |
| Model fallback | `add model-fallback` |
| Live runs | `add live-runs` |
| Agent map | `add agent-map` |
| Cost estimate | `add cost-estimate` |
| Agent permissions | `add agent-permissions` |
| MCP servers | `add mcp-servers` |
| Prompt versions | `add prompt-versions` |
| AI form fill | `add ai-form-fill` |
| Session replay | `add session-replay` |
| Action items | `add action-items` |
| Interview card | `add interview-card` |
| NL filter | `add nl-filter` |
| AI column | `add ai-column` |
| Agent handoff | `add agent-handoff` |
| Voice call | `add voice-call` |
| Email draft | `add email-draft` |
| Policy block | `add policy-block` |
| Agent card | `add agent-card` |
| Live pill | `add live-pill` |
| Connect apps | `add connect-apps` |

</details>

<details>
<summary><strong>Actions</strong> (11)</summary>

| Name | Add it |
|---|---|
| Button | `add button` |
| Icon button | `add icon-button` |
| Split button | `add split-button` |
| Border beam | `add border-beam` |
| Morph button | `add morph-button` |
| Hold to confirm | `add hold-to-confirm` |
| Speed dial | `add speed-dial` |
| Bell button | `add bell-button` |
| Action bar | `add action-bar` |
| Reaction button | `add reaction-button` |
| Copy button | `add copy-button` |

</details>

<details>
<summary><strong>Text entry</strong> (21)</summary>

| Name | Add it |
|---|---|
| Input | `add input` |
| Textarea | `add textarea` |
| Select | `add select` |
| Chip input | `add chip-input` |
| Currency input | `add currency-input` |
| Password input | `add password-input` |
| Rich text toolbar | `add rich-text-toolbar` |
| Address autocomplete | `add address-autocomplete` |
| Card input | `add card-input` |
| OTP input | `add otp-input` |
| File upload | `add file-upload` |
| Inline edit | `add inline-edit` |
| Number input | `add number-input` |
| Search input | `add search-input` |
| Phone input | `add phone-input` |
| Time input | `add time-input` |
| Signature pad | `add signature-pad` |
| Copy field | `add copy-field` |
| Keypad | `add keypad` |
| Amount input | `add amount-input` |
| Expanding search | `add expanding-search` |

</details>

<details>
<summary><strong>Choice</strong> (21)</summary>

| Name | Add it |
|---|---|
| Checkbox | `add checkbox` |
| Radio group | `add radio-group` |
| Switch | `add switch` |
| Segmented control | `add segmented-control` |
| Slider | `add slider` |
| Date picker | `add date-picker` |
| Histogram range | `add histogram-range` |
| Time slot picker | `add time-slot-picker` |
| Combobox | `add combobox` |
| Color picker | `add color-picker` |
| Quantity stepper | `add quantity-stepper` |
| Rating | `add rating` |
| Filter chips | `add filter-chips` |
| Permission matrix | `add permission-matrix` |
| People picker | `add people-picker` |
| Wheel picker | `add wheel-picker` |
| Value stepper | `add value-stepper` |
| Step slider | `add step-slider` |
| Date strip | `add date-strip` |
| Color swatch | `add color-swatch` |
| Theme toggle | `add theme-toggle` |

</details>

<details>
<summary><strong>Navigation</strong> (12)</summary>

| Name | Add it |
|---|---|
| Tabs | `add tabs` |
| Accordion | `add accordion` |
| Filter bar | `add filter-bar` |
| App switcher | `add app-switcher` |
| Pagination | `add pagination` |
| Breadcrumbs | `add breadcrumbs` |
| Sidebar nav | `add sidebar-nav` |
| Tree view | `add tree-view` |
| Form wizard | `add form-wizard` |
| Scroll-spy TOC | `add scroll-spy-toc` |
| Bottom tab bar | `add bottom-tab-bar` |
| Dock | `add dock` |

</details>

<details>
<summary><strong>Overlays</strong> (15)</summary>

| Name | Add it |
|---|---|
| Tooltip | `add tooltip` |
| Dialog | `add dialog` |
| Dropdown menu | `add dropdown-menu` |
| Command palette | `add command-palette` |
| Notification center | `add notification-center` |
| Bottom sheet | `add bottom-sheet` |
| Coachmark | `add coachmark` |
| Lightbox | `add lightbox` |
| Hover card | `add hover-card` |
| Context menu | `add context-menu` |
| Side sheet | `add side-sheet` |
| Popover | `add popover` |
| Shortcuts dialog | `add shortcuts-dialog` |
| Image cropper | `add image-cropper` |
| Display options | `add display-options` |

</details>

<details>
<summary><strong>Feedback</strong> (12)</summary>

| Name | Add it |
|---|---|
| Badge | `add badge` |
| Progress | `add progress` |
| Toast | `add toast` |
| Onboarding checklist | `add onboarding-checklist` |
| Usage meter | `add usage-meter` |
| Forecast alert | `add forecast-alert` |
| Skeleton | `add skeleton` |
| Empty state | `add empty-state` |
| Alert banner | `add alert-banner` |
| Priority icon | `add priority-icon` |
| Status icon | `add status-icon` |
| Date chip | `add date-chip` |

</details>

<details>
<summary><strong>Data display</strong> (26)</summary>

| Name | Add it |
|---|---|
| Kbd | `add kbd` |
| Avatar | `add avatar` |
| Data table | `add data-table` |
| Settings row | `add settings-row` |
| API key row | `add api-key-row` |
| Stat card | `add stat-card` |
| Code block | `add code-block` |
| Week calendar | `add week-calendar` |
| Resizable panels | `add resizable-panels` |
| Sparkline table | `add sparkline-table` |
| Avatar stack | `add avatar-stack` |
| Carousel | `add carousel` |
| Leaderboard | `add leaderboard` |
| Timeline | `add timeline` |
| Month calendar | `add month-calendar` |
| File manager | `add file-manager` |
| Sortable list | `add sortable-list` |
| Cohort table | `add cohort-table` |
| Org chart | `add org-chart` |
| Gantt chart | `add gantt-chart` |
| Cycle card | `add cycle-card` |
| Gantt row | `add gantt-row` |
| Audio player | `add audio-player` |
| Rolling number | `add rolling-number` |
| Integration card | `add integration-card` |
| Swipe row | `add swipe-row` |

</details>

<details>
<summary><strong>Charts</strong> (26)</summary>

| Name | Add it |
|---|---|
| Forecast chart | `add forecast-chart` |
| Activity heatmap | `add activity-heatmap` |
| Grouped bar | `add grouped-bar` |
| Treemap | `add treemap` |
| Bullet chart | `add bullet-chart` |
| Candlestick | `add candlestick` |
| Scatter plot | `add scatter-plot` |
| Waffle chart | `add waffle-chart` |
| Dot globe | `add dot-globe` |
| Dot map | `add dot-map` |
| Threshold gauge | `add threshold-gauge` |
| Compare bars | `add compare-bars` |
| Portfolio chart | `add portfolio-chart` |
| Since last visit | `add since-last-visit` |
| Uptime bars | `add uptime-bars` |
| Funnel chart | `add funnel-chart` |
| Ring stats | `add ring-stats` |
| Radar chart | `add radar-chart` |
| Stacked area | `add stacked-area` |
| Donut chart | `add donut-chart` |
| Hour heatmap | `add hour-heatmap` |
| Waterfall chart | `add waterfall-chart` |
| Sankey chart | `add sankey-chart` |
| Annotated line | `add annotated-line` |
| Box plot | `add box-plot` |
| Multi-line chart | `add multi-line` |

</details>

<details>
<summary><strong>Collaboration</strong> (13)</summary>

| Name | Add it |
|---|---|
| Comment thread | `add comment-thread` |
| Activity feed | `add activity-feed` |
| Kanban board | `add kanban-board` |
| Issue list | `add issue-list` |
| Document card | `add document-card` |
| Property panel | `add property-panel` |
| Reaction bar | `add reaction-bar` |
| Roadmap timeline | `add roadmap-timeline` |
| Board card | `add board-card` |
| Issue row | `add issue-row` |
| Project card | `add project-card` |
| Live cursors | `add live-cursors` |
| Version history | `add version-history` |

</details>

<details>
<summary><strong>Commerce</strong> (12)</summary>

| Name | Add it |
|---|---|
| Product card | `add product-card` |
| Cart summary | `add cart-summary` |
| Receipt | `add receipt` |
| Payment picker | `add payment-picker` |
| Pricing table | `add pricing-table` |
| Supplier compare | `add supplier-compare` |
| Order tracker | `add order-tracker` |
| Subscription manager | `add subscription-manager` |
| Pricing calculator | `add pricing-calculator` |
| Order summary | `add order-summary` |
| Cart item | `add cart-item` |
| Billing plan card | `add billing-plan-card` |

</details>

<details>
<summary><strong>Finance</strong> (9)</summary>

| Name | Add it |
|---|---|
| Swap card | `add swap-card` |
| Balance card | `add balance-card` |
| Transaction list | `add transaction-list` |
| Budget bars | `add budget-bars` |
| Watchlist | `add watchlist` |
| Invoice editor | `add invoice-editor` |
| Payment card | `add payment-card` |
| Spend limit | `add spend-limit` |
| Recurring bills | `add recurring-bills` |

</details>

<details>
<summary><strong>Marketing</strong> (10)</summary>

| Name | Add it |
|---|---|
| Testimonial card | `add testimonial-card` |
| FAQ list | `add faq-list` |
| Feature grid | `add feature-grid` |
| Announcement pill | `add announcement-pill` |
| Copy-prompt box | `add copy-prompt-box` |
| Steps card | `add steps-card` |
| Newsletter signup | `add newsletter-signup` |
| Changelog entry | `add changelog-entry` |
| Metric strip | `add metric-strip` |
| CTA banner | `add cta-banner` |

</details>

<details>
<summary><strong>Effects</strong> (10)</summary>

| Name | Add it |
|---|---|
| ASCII globe | `add ascii-globe` |
| ASCII text | `add ascii-text` |
| ASCII image | `add ascii-image` |
| ASCII field | `add ascii-field` |
| ASCII loader | `add ascii-loader` |
| Confetti | `add confetti` |
| Spotlight card | `add spotlight-card` |
| Text scramble | `add text-scramble` |
| Shiny text | `add shiny-text` |
| Dot field | `add dot-field` |

</details>

### Blocks (54)

<details>
<summary><strong>Agents</strong> (4)</summary>

| Name | Add it |
|---|---|
| Agents overview | `add agents-overview` |
| Approval with history | `add approval-with-history` |
| Approvals inbox | `add approvals-inbox` |
| Run trace | `add run-trace` |

</details>

<details>
<summary><strong>Application</strong> (1)</summary>

| Name | Add it |
|---|---|
| App shell | `add app-shell` |

</details>

<details>
<summary><strong>Assistant</strong> (5)</summary>

| Name | Add it |
|---|---|
| Assistant home | `add assistant-home` |
| Assistant start | `add assistant-start` |
| Chat answer sources | `add chat-answer-sources` |
| Chat thread composer | `add chat-thread-composer` |
| Knowledge sources | `add knowledge-sources` |

</details>

<details>
<summary><strong>CRM</strong> (6)</summary>

| Name | Add it |
|---|---|
| Contact record | `add contact-record` |
| Customers summary | `add customers-summary` |
| Deal pipeline board | `add deal-pipeline-board` |
| Deals closing soon | `add deals-closing-soon` |
| Sales KPI row | `add sales-kpi-row` |
| Sales today | `add sales-today` |

</details>

<details>
<summary><strong>Data pipelines</strong> (7)</summary>

| Name | Add it |
|---|---|
| Connector health | `add data-pipelines-connector-health` |
| Data tests | `add data-pipelines-data-tests` |
| Failed sync | `add data-pipelines-failed-sync` |
| Freshness | `add data-pipelines-freshness` |
| Nightly run | `add data-pipelines-nightly-run` |
| Rows loaded | `add data-pipelines-rows-loaded` |
| Warehouse spend | `add data-pipelines-warehouse-spend` |

</details>

<details>
<summary><strong>Dev tools</strong> (8)</summary>

| Name | Add it |
|---|---|
| Build health | `add dev-tools-build-health` |
| CI minutes | `add dev-tools-ci-minutes` |
| Deploys today | `add dev-tools-deploys-today` |
| DORA | `add dev-tools-dora` |
| Flaky tests | `add dev-tools-flaky-tests` |
| Release gate | `add dev-tools-release-gate` |
| Review queue | `add dev-tools-review-queue` |
| Top errors | `add dev-tools-top-errors` |

</details>

<details>
<summary><strong>DevOps</strong> (8)</summary>

| Name | Add it |
|---|---|
| Active incidents | `add devops-active-incidents` |
| Error budget | `add devops-error-budget` |
| Hot hosts | `add devops-hot-hosts` |
| Latency | `add devops-latency` |
| On call | `add devops-on-call` |
| Regions | `add devops-regions` |
| Service status | `add devops-service-status` |
| Uptime history | `add devops-uptime-history` |

</details>

<details>
<summary><strong>Finance</strong> (3)</summary>

| Name | Add it |
|---|---|
| Invoices workspace | `add invoices-workspace` |
| P&L overview | `add pnl-overview` |
| Treasury overview | `add treasury-overview` |

</details>

<details>
<summary><strong>LLM ops</strong> (8)</summary>

| Name | Add it |
|---|---|
| Agent runs | `add llm-ops-agent-runs` |
| Cost by feature | `add llm-ops-cost-by-feature` |
| Cost by provider | `add llm-ops-cost-by-provider` |
| Eval scorecard | `add llm-ops-eval-scorecard` |
| Latency | `add llm-ops-latency` |
| Model spend | `add llm-ops-model-spend` |
| Prompt cache | `add llm-ops-prompt-cache` |
| Provider health | `add llm-ops-provider-health` |

</details>

<details>
<summary><strong>Commerce</strong> (4)</summary>

| Name | Add it |
|---|---|
| Orders workspace | `add orders-workspace` |
| Product catalog | `add product-catalog` |
| Revenue overview | `add revenue-overview` |
| Shipment tracking | `add shipment-tracking` |

</details>

### Templates (10)

| Name | Add it |
|---|---|
| Data pipelines | `add data-pipelines` |
| Dev tools | `add dev-tools` |
| DevOps | `add devops` |
| LLM ops | `add llm-ops` |
| Agents | `add stacks-agents` |
| Assistant | `add stacks-assist` |
| Books | `add stacks-books` |
| CRM | `add stacks-crm` |
| Crypto | `add stacks-crypto` |
| Shop | `add stacks-shop` |

<!-- catalog:end -->

## Development

```sh
git clone https://github.com/Ashu1109/open-uistacks.git
cd open-uistacks
npm install
npm run dev         # docs site with live previews, source and props for every item
npm test            # Vitest + Testing Library (600 tests)
npm run build       # type check and production build of the docs site
npm run registry    # rebuild r/ and this README's catalog after changing a component
```

Project layout:

| Folder | Contents |
|---|---|
| `originals/ui/` | 211 components written for open-uistacks, plus `chart-utils.ts` |
| `registry/ui/` | 71 free UI Stacks components, unchanged |
| `originals/blocks/`, `originals/templates/` | 54 blocks and 10 templates |
| `playground/` | The docs site |
| `bin/open-uistacks.mjs` | The CLI (no dependencies) |
| `scripts/build-registry.mjs` | Builds `r/` from the sources |
| `r/` | The registry the CLI reads: one JSON file per item plus `index.json` |

## Registry

The CLI reads `r/<name>.json`. Each item lists its files (with paths already rewritten for the installed layout), the other items it `requires` and its npm `dependencies`; `r/index.json` lists every item. By default the CLI uses the copy bundled with it, so installs work offline once it is downloaded. To host your own fork, point `--registry` (or the `OPEN_UISTACKS_REGISTRY` environment variable) at a folder or a URL that serves those files.

## Contributing

1. Change or add a component under `originals/`, with a test next to it and a demo in `playground/sections/`.
2. Run `npm test` and `npm run build`.
3. Run `npm run registry` and commit the updated `r/` and README; the test suite fails if they are out of date.

## License

[MIT](LICENSE) for everything written for open-uistacks.

The 71 components in `registry/ui/` are the free [UI Stacks](https://uistacks.dev) components, MIT licensed, copyright UI Stacks, included unchanged with their notice. UI Stacks Pro components are not included; the components in `originals/ui/` that share their names were written from scratch and contain no UI Stacks Pro code.
