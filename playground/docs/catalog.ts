/* Docs catalog: every component (name, category, Free or Pro), block (family) and template the site lists. Free source lives in registry/ui, everything else in originals/. */

export type Tier = "Free" | "Pro";
export interface ComponentEntry { slug: string; name: string; category: string; tier: Tier }
export interface BlockEntry { slug: string; name: string; family: string }
export interface TemplateEntry { slug: string; name: string }

export const COMPONENTS: ComponentEntry[] = [
 {
  "slug": "prompt-input",
  "name": "Prompt input",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "message",
  "name": "Message",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "thinking-state",
  "name": "Thinking state",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "citation",
  "name": "Citation",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "suggestions",
  "name": "Suggestions",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "feedback",
  "name": "Feedback",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "attachment",
  "name": "Attachment",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "context-meter",
  "name": "Context meter",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "model-picker",
  "name": "Model picker",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "effort-slider",
  "name": "Effort slider",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "ai-recap",
  "name": "AI recap",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "suggested-edits",
  "name": "Suggested edits",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "clarifying-question",
  "name": "Clarifying question",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "correction",
  "name": "Correction",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "review-stack",
  "name": "Review stack",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "ai-summary",
  "name": "AI summary",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "connectors-strip",
  "name": "Connectors strip",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "starter-cards",
  "name": "Starter cards",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "citation-row",
  "name": "Citation row",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "prompt-composer-docked",
  "name": "Docked composer",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "voice-prompt",
  "name": "Voice prompt",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "inline-ask",
  "name": "Inline ask",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "mention-prompt",
  "name": "Mention prompt",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "prompt-attachments",
  "name": "Prompt with attachments",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "mini-prompt",
  "name": "Mini prompt",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "conversation-list",
  "name": "Conversation list",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "branch-switcher",
  "name": "Branch switcher",
  "category": "AI chat",
  "tier": "Free"
 },
 {
  "slug": "artifact-panel",
  "name": "Artifact panel",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "prompt-library",
  "name": "Prompt library",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "image-generations",
  "name": "Image generations",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "ghost-autocomplete",
  "name": "Ghost autocomplete",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "live-transcript",
  "name": "Live transcript",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "redacted-text",
  "name": "Redacted text",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "share-chat",
  "name": "Share chat",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "search-results",
  "name": "Search results",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "chart-answer",
  "name": "Chart answer",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "source-viewer",
  "name": "Source viewer",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "prompt-enhancer",
  "name": "Prompt enhancer",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "translate-panel",
  "name": "Translate panel",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "assistant-picker",
  "name": "Assistant picker",
  "category": "AI chat",
  "tier": "Pro"
 },
 {
  "slug": "approval-request",
  "name": "Approval request",
  "category": "AI agents",
  "tier": "Free"
 },
 {
  "slug": "tool-call",
  "name": "Tool call",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "run-card",
  "name": "Run card",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "diff-block",
  "name": "Diff block",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "plan-card",
  "name": "Plan card",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "agent-control-frame",
  "name": "Agent control frame",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "preflight-checks",
  "name": "Preflight checks",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "extracted-fields",
  "name": "Extracted fields",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "model-card",
  "name": "Model card",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "eval-scorecard",
  "name": "Eval scorecard",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "automation-card",
  "name": "Automation card",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "trace-waterfall",
  "name": "Trace waterfall",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "browser-frame",
  "name": "Browser frame",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "change-preview",
  "name": "Change preview",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "checks-list",
  "name": "Checks list",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "agent-roster",
  "name": "Agent roster",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "relay-timeline",
  "name": "Relay timeline",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "trust-level",
  "name": "Trust level",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "restore-points",
  "name": "Restore points",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "attention-queue",
  "name": "Attention queue",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "memory-list",
  "name": "Memory list",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "spend-breakdown",
  "name": "Spend breakdown",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "run-schedule",
  "name": "Run schedule",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "attempt-compare",
  "name": "Attempt compare",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "model-fallback",
  "name": "Model fallback",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "live-runs",
  "name": "Live runs",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "agent-map",
  "name": "Agent map",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "cost-estimate",
  "name": "Cost estimate",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "agent-permissions",
  "name": "Agent permissions",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "mcp-servers",
  "name": "MCP servers",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "prompt-versions",
  "name": "Prompt versions",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "ai-form-fill",
  "name": "AI form fill",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "session-replay",
  "name": "Session replay",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "action-items",
  "name": "Action items",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "interview-card",
  "name": "Interview card",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "nl-filter",
  "name": "NL filter",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "ai-column",
  "name": "AI column",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "agent-handoff",
  "name": "Agent handoff",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "voice-call",
  "name": "Voice call",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "email-draft",
  "name": "Email draft",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "policy-block",
  "name": "Policy block",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "agent-card",
  "name": "Agent card",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "live-pill",
  "name": "Live pill",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "connect-apps",
  "name": "Connect apps",
  "category": "AI agents",
  "tier": "Pro"
 },
 {
  "slug": "button",
  "name": "Button",
  "category": "Actions",
  "tier": "Free"
 },
 {
  "slug": "icon-button",
  "name": "Icon button",
  "category": "Actions",
  "tier": "Free"
 },
 {
  "slug": "split-button",
  "name": "Split button",
  "category": "Actions",
  "tier": "Free"
 },
 {
  "slug": "border-beam",
  "name": "Border beam",
  "category": "Actions",
  "tier": "Pro"
 },
 {
  "slug": "morph-button",
  "name": "Morph button",
  "category": "Actions",
  "tier": "Pro"
 },
 {
  "slug": "hold-to-confirm",
  "name": "Hold to confirm",
  "category": "Actions",
  "tier": "Pro"
 },
 {
  "slug": "speed-dial",
  "name": "Speed dial",
  "category": "Actions",
  "tier": "Pro"
 },
 {
  "slug": "bell-button",
  "name": "Bell button",
  "category": "Actions",
  "tier": "Free"
 },
 {
  "slug": "action-bar",
  "name": "Action bar",
  "category": "Actions",
  "tier": "Pro"
 },
 {
  "slug": "reaction-button",
  "name": "Reaction button",
  "category": "Actions",
  "tier": "Pro"
 },
 {
  "slug": "copy-button",
  "name": "Copy button",
  "category": "Actions",
  "tier": "Free"
 },
 {
  "slug": "input",
  "name": "Input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "textarea",
  "name": "Textarea",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "select",
  "name": "Select",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "chip-input",
  "name": "Chip input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "currency-input",
  "name": "Currency input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "password-input",
  "name": "Password input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "rich-text-toolbar",
  "name": "Rich text toolbar",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "address-autocomplete",
  "name": "Address autocomplete",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "card-input",
  "name": "Card input",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "otp-input",
  "name": "OTP input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "file-upload",
  "name": "File upload",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "inline-edit",
  "name": "Inline edit",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "number-input",
  "name": "Number input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "search-input",
  "name": "Search input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "phone-input",
  "name": "Phone input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "time-input",
  "name": "Time input",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "signature-pad",
  "name": "Signature pad",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "copy-field",
  "name": "Copy field",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "keypad",
  "name": "Keypad",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "amount-input",
  "name": "Amount input",
  "category": "Text entry",
  "tier": "Pro"
 },
 {
  "slug": "expanding-search",
  "name": "Expanding search",
  "category": "Text entry",
  "tier": "Free"
 },
 {
  "slug": "checkbox",
  "name": "Checkbox",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "radio-group",
  "name": "Radio group",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "switch",
  "name": "Switch",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "segmented-control",
  "name": "Segmented control",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "slider",
  "name": "Slider",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "date-picker",
  "name": "Date picker",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "histogram-range",
  "name": "Histogram range",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "time-slot-picker",
  "name": "Time slot picker",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "combobox",
  "name": "Combobox",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "color-picker",
  "name": "Color picker",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "quantity-stepper",
  "name": "Quantity stepper",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "rating",
  "name": "Rating",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "filter-chips",
  "name": "Filter chips",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "permission-matrix",
  "name": "Permission matrix",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "people-picker",
  "name": "People picker",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "wheel-picker",
  "name": "Wheel picker",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "value-stepper",
  "name": "Value stepper",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "step-slider",
  "name": "Step slider",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "date-strip",
  "name": "Date strip",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "color-swatch",
  "name": "Color swatch",
  "category": "Choice",
  "tier": "Pro"
 },
 {
  "slug": "theme-toggle",
  "name": "Theme toggle",
  "category": "Choice",
  "tier": "Free"
 },
 {
  "slug": "tabs",
  "name": "Tabs",
  "category": "Navigation",
  "tier": "Free"
 },
 {
  "slug": "accordion",
  "name": "Accordion",
  "category": "Navigation",
  "tier": "Free"
 },
 {
  "slug": "filter-bar",
  "name": "Filter bar",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "app-switcher",
  "name": "App switcher",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "pagination",
  "name": "Pagination",
  "category": "Navigation",
  "tier": "Free"
 },
 {
  "slug": "breadcrumbs",
  "name": "Breadcrumbs",
  "category": "Navigation",
  "tier": "Free"
 },
 {
  "slug": "sidebar-nav",
  "name": "Sidebar nav",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "tree-view",
  "name": "Tree view",
  "category": "Navigation",
  "tier": "Free"
 },
 {
  "slug": "form-wizard",
  "name": "Form wizard",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "scroll-spy-toc",
  "name": "Scroll-spy TOC",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "bottom-tab-bar",
  "name": "Bottom tab bar",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "dock",
  "name": "Dock",
  "category": "Navigation",
  "tier": "Pro"
 },
 {
  "slug": "tooltip",
  "name": "Tooltip",
  "category": "Overlays",
  "tier": "Free"
 },
 {
  "slug": "dialog",
  "name": "Dialog",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "dropdown-menu",
  "name": "Dropdown menu",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "command-palette",
  "name": "Command palette",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "notification-center",
  "name": "Notification center",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "bottom-sheet",
  "name": "Bottom sheet",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "coachmark",
  "name": "Coachmark",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "lightbox",
  "name": "Lightbox",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "hover-card",
  "name": "Hover card",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "context-menu",
  "name": "Context menu",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "side-sheet",
  "name": "Side sheet",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "popover",
  "name": "Popover",
  "category": "Overlays",
  "tier": "Free"
 },
 {
  "slug": "shortcuts-dialog",
  "name": "Shortcuts dialog",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "image-cropper",
  "name": "Image cropper",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "display-options",
  "name": "Display options",
  "category": "Overlays",
  "tier": "Pro"
 },
 {
  "slug": "badge",
  "name": "Badge",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "progress",
  "name": "Progress",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "toast",
  "name": "Toast",
  "category": "Feedback",
  "tier": "Pro"
 },
 {
  "slug": "onboarding-checklist",
  "name": "Onboarding checklist",
  "category": "Feedback",
  "tier": "Pro"
 },
 {
  "slug": "usage-meter",
  "name": "Usage meter",
  "category": "Feedback",
  "tier": "Pro"
 },
 {
  "slug": "forecast-alert",
  "name": "Forecast alert",
  "category": "Feedback",
  "tier": "Pro"
 },
 {
  "slug": "skeleton",
  "name": "Skeleton",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "empty-state",
  "name": "Empty state",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "alert-banner",
  "name": "Alert banner",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "priority-icon",
  "name": "Priority icon",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "status-icon",
  "name": "Status icon",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "date-chip",
  "name": "Date chip",
  "category": "Feedback",
  "tier": "Free"
 },
 {
  "slug": "kbd",
  "name": "Kbd",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "avatar",
  "name": "Avatar",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "data-table",
  "name": "Data table",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "settings-row",
  "name": "Settings row",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "api-key-row",
  "name": "API key row",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "stat-card",
  "name": "Stat card",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "code-block",
  "name": "Code block",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "week-calendar",
  "name": "Week calendar",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "resizable-panels",
  "name": "Resizable panels",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "sparkline-table",
  "name": "Sparkline table",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "avatar-stack",
  "name": "Avatar stack",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "carousel",
  "name": "Carousel",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "leaderboard",
  "name": "Leaderboard",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "timeline",
  "name": "Timeline",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "month-calendar",
  "name": "Month calendar",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "file-manager",
  "name": "File manager",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "sortable-list",
  "name": "Sortable list",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "cohort-table",
  "name": "Cohort table",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "org-chart",
  "name": "Org chart",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "gantt-chart",
  "name": "Gantt chart",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "cycle-card",
  "name": "Cycle card",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "gantt-row",
  "name": "Gantt row",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "audio-player",
  "name": "Audio player",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "rolling-number",
  "name": "Rolling number",
  "category": "Data display",
  "tier": "Free"
 },
 {
  "slug": "integration-card",
  "name": "Integration card",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "swipe-row",
  "name": "Swipe row",
  "category": "Data display",
  "tier": "Pro"
 },
 {
  "slug": "forecast-chart",
  "name": "Forecast chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "activity-heatmap",
  "name": "Activity heatmap",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "grouped-bar",
  "name": "Grouped bar",
  "category": "Charts",
  "tier": "Free"
 },
 {
  "slug": "treemap",
  "name": "Treemap",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "bullet-chart",
  "name": "Bullet chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "candlestick",
  "name": "Candlestick",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "scatter-plot",
  "name": "Scatter plot",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "waffle-chart",
  "name": "Waffle chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "dot-globe",
  "name": "Dot globe",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "dot-map",
  "name": "Dot map",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "threshold-gauge",
  "name": "Threshold gauge",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "compare-bars",
  "name": "Compare bars",
  "category": "Charts",
  "tier": "Free"
 },
 {
  "slug": "portfolio-chart",
  "name": "Portfolio chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "since-last-visit",
  "name": "Since last visit",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "uptime-bars",
  "name": "Uptime bars",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "funnel-chart",
  "name": "Funnel chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "ring-stats",
  "name": "Ring stats",
  "category": "Charts",
  "tier": "Free"
 },
 {
  "slug": "radar-chart",
  "name": "Radar chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "stacked-area",
  "name": "Stacked area",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "donut-chart",
  "name": "Donut chart",
  "category": "Charts",
  "tier": "Free"
 },
 {
  "slug": "hour-heatmap",
  "name": "Hour heatmap",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "waterfall-chart",
  "name": "Waterfall chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "sankey-chart",
  "name": "Sankey chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "annotated-line",
  "name": "Annotated line",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "box-plot",
  "name": "Box plot",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "multi-line",
  "name": "Multi-line chart",
  "category": "Charts",
  "tier": "Pro"
 },
 {
  "slug": "comment-thread",
  "name": "Comment thread",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "activity-feed",
  "name": "Activity feed",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "kanban-board",
  "name": "Kanban board",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "issue-list",
  "name": "Issue list",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "document-card",
  "name": "Document card",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "property-panel",
  "name": "Property panel",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "reaction-bar",
  "name": "Reaction bar",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "roadmap-timeline",
  "name": "Roadmap timeline",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "board-card",
  "name": "Board card",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "issue-row",
  "name": "Issue row",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "project-card",
  "name": "Project card",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "live-cursors",
  "name": "Live cursors",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "version-history",
  "name": "Version history",
  "category": "Collaboration",
  "tier": "Pro"
 },
 {
  "slug": "product-card",
  "name": "Product card",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "cart-summary",
  "name": "Cart summary",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "receipt",
  "name": "Receipt",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "payment-picker",
  "name": "Payment picker",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "pricing-table",
  "name": "Pricing table",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "supplier-compare",
  "name": "Supplier compare",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "order-tracker",
  "name": "Order tracker",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "subscription-manager",
  "name": "Subscription manager",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "pricing-calculator",
  "name": "Pricing calculator",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "order-summary",
  "name": "Order summary",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "cart-item",
  "name": "Cart item",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "billing-plan-card",
  "name": "Billing plan card",
  "category": "Commerce",
  "tier": "Pro"
 },
 {
  "slug": "swap-card",
  "name": "Swap card",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "balance-card",
  "name": "Balance card",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "transaction-list",
  "name": "Transaction list",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "budget-bars",
  "name": "Budget bars",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "watchlist",
  "name": "Watchlist",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "invoice-editor",
  "name": "Invoice editor",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "payment-card",
  "name": "Payment card",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "spend-limit",
  "name": "Spend limit",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "recurring-bills",
  "name": "Recurring bills",
  "category": "Finance",
  "tier": "Pro"
 },
 {
  "slug": "testimonial-card",
  "name": "Testimonial card",
  "category": "Marketing",
  "tier": "Pro"
 },
 {
  "slug": "faq-list",
  "name": "FAQ list",
  "category": "Marketing",
  "tier": "Pro"
 },
 {
  "slug": "feature-grid",
  "name": "Feature grid",
  "category": "Marketing",
  "tier": "Pro"
 },
 {
  "slug": "announcement-pill",
  "name": "Announcement pill",
  "category": "Marketing",
  "tier": "Free"
 },
 {
  "slug": "copy-prompt-box",
  "name": "Copy-prompt box",
  "category": "Marketing",
  "tier": "Free"
 },
 {
  "slug": "steps-card",
  "name": "Steps card",
  "category": "Marketing",
  "tier": "Pro"
 },
 {
  "slug": "newsletter-signup",
  "name": "Newsletter signup",
  "category": "Marketing",
  "tier": "Free"
 },
 {
  "slug": "changelog-entry",
  "name": "Changelog entry",
  "category": "Marketing",
  "tier": "Free"
 },
 {
  "slug": "metric-strip",
  "name": "Metric strip",
  "category": "Marketing",
  "tier": "Free"
 },
 {
  "slug": "cta-banner",
  "name": "CTA banner",
  "category": "Marketing",
  "tier": "Free"
 },
 {
  "slug": "ascii-globe",
  "name": "ASCII globe",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "ascii-text",
  "name": "ASCII text",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "ascii-image",
  "name": "ASCII image",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "ascii-field",
  "name": "ASCII field",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "ascii-loader",
  "name": "ASCII loader",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "confetti",
  "name": "Confetti",
  "category": "Effects",
  "tier": "Free"
 },
 {
  "slug": "spotlight-card",
  "name": "Spotlight card",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "text-scramble",
  "name": "Text scramble",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "shiny-text",
  "name": "Shiny text",
  "category": "Effects",
  "tier": "Pro"
 },
 {
  "slug": "dot-field",
  "name": "Dot field",
  "category": "Effects",
  "tier": "Pro"
 }
];

export const BLOCKS: BlockEntry[] = [
 {
  "slug": "agents-overview",
  "name": "Agents overview",
  "family": "Agents"
 },
 {
  "slug": "app-shell",
  "name": "App shell",
  "family": "Application"
 },
 {
  "slug": "approval-with-history",
  "name": "Approval with history",
  "family": "Agents"
 },
 {
  "slug": "approvals-inbox",
  "name": "Approvals inbox",
  "family": "Agents"
 },
 {
  "slug": "assistant-home",
  "name": "Assistant home",
  "family": "Assistant"
 },
 {
  "slug": "assistant-start",
  "name": "Assistant start",
  "family": "Assistant"
 },
 {
  "slug": "chat-answer-sources",
  "name": "Chat answer sources",
  "family": "Assistant"
 },
 {
  "slug": "chat-thread-composer",
  "name": "Chat thread composer",
  "family": "Assistant"
 },
 {
  "slug": "contact-record",
  "name": "Contact record",
  "family": "CRM"
 },
 {
  "slug": "customers-summary",
  "name": "Customers summary",
  "family": "CRM"
 },
 {
  "slug": "data-pipelines-connector-health",
  "name": "Connector health",
  "family": "Data pipelines"
 },
 {
  "slug": "data-pipelines-data-tests",
  "name": "Data tests",
  "family": "Data pipelines"
 },
 {
  "slug": "data-pipelines-failed-sync",
  "name": "Failed sync",
  "family": "Data pipelines"
 },
 {
  "slug": "data-pipelines-freshness",
  "name": "Freshness",
  "family": "Data pipelines"
 },
 {
  "slug": "data-pipelines-nightly-run",
  "name": "Nightly run",
  "family": "Data pipelines"
 },
 {
  "slug": "data-pipelines-rows-loaded",
  "name": "Rows loaded",
  "family": "Data pipelines"
 },
 {
  "slug": "data-pipelines-warehouse-spend",
  "name": "Warehouse spend",
  "family": "Data pipelines"
 },
 {
  "slug": "deal-pipeline-board",
  "name": "Deal pipeline board",
  "family": "CRM"
 },
 {
  "slug": "deals-closing-soon",
  "name": "Deals closing soon",
  "family": "CRM"
 },
 {
  "slug": "dev-tools-build-health",
  "name": "Build health",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-ci-minutes",
  "name": "CI minutes",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-deploys-today",
  "name": "Deploys today",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-dora",
  "name": "DORA",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-flaky-tests",
  "name": "Flaky tests",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-release-gate",
  "name": "Release gate",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-review-queue",
  "name": "Review queue",
  "family": "Dev tools"
 },
 {
  "slug": "dev-tools-top-errors",
  "name": "Top errors",
  "family": "Dev tools"
 },
 {
  "slug": "devops-active-incidents",
  "name": "Active incidents",
  "family": "DevOps"
 },
 {
  "slug": "devops-error-budget",
  "name": "Error budget",
  "family": "DevOps"
 },
 {
  "slug": "devops-hot-hosts",
  "name": "Hot hosts",
  "family": "DevOps"
 },
 {
  "slug": "devops-latency",
  "name": "Latency",
  "family": "DevOps"
 },
 {
  "slug": "devops-on-call",
  "name": "On call",
  "family": "DevOps"
 },
 {
  "slug": "devops-regions",
  "name": "Regions",
  "family": "DevOps"
 },
 {
  "slug": "devops-service-status",
  "name": "Service status",
  "family": "DevOps"
 },
 {
  "slug": "devops-uptime-history",
  "name": "Uptime history",
  "family": "DevOps"
 },
 {
  "slug": "invoices-workspace",
  "name": "Invoices workspace",
  "family": "Finance"
 },
 {
  "slug": "knowledge-sources",
  "name": "Knowledge sources",
  "family": "Assistant"
 },
 {
  "slug": "llm-ops-agent-runs",
  "name": "Agent runs",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-cost-by-feature",
  "name": "Cost by feature",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-cost-by-provider",
  "name": "Cost by provider",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-eval-scorecard",
  "name": "Eval scorecard",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-latency",
  "name": "Latency",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-model-spend",
  "name": "Model spend",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-prompt-cache",
  "name": "Prompt cache",
  "family": "LLM ops"
 },
 {
  "slug": "llm-ops-provider-health",
  "name": "Provider health",
  "family": "LLM ops"
 },
 {
  "slug": "orders-workspace",
  "name": "Orders workspace",
  "family": "Commerce"
 },
 {
  "slug": "pnl-overview",
  "name": "P&L overview",
  "family": "Finance"
 },
 {
  "slug": "product-catalog",
  "name": "Product catalog",
  "family": "Commerce"
 },
 {
  "slug": "revenue-overview",
  "name": "Revenue overview",
  "family": "Commerce"
 },
 {
  "slug": "run-trace",
  "name": "Run trace",
  "family": "Agents"
 },
 {
  "slug": "sales-kpi-row",
  "name": "Sales KPI row",
  "family": "CRM"
 },
 {
  "slug": "sales-today",
  "name": "Sales today",
  "family": "CRM"
 },
 {
  "slug": "shipment-tracking",
  "name": "Shipment tracking",
  "family": "Commerce"
 },
 {
  "slug": "treasury-overview",
  "name": "Treasury overview",
  "family": "Finance"
 }
];

export const TEMPLATES: TemplateEntry[] = [
 {
  "slug": "data-pipelines",
  "name": "Data pipelines"
 },
 {
  "slug": "dev-tools",
  "name": "Dev tools"
 },
 {
  "slug": "devops",
  "name": "DevOps"
 },
 {
  "slug": "llm-ops",
  "name": "LLM ops"
 },
 {
  "slug": "stacks-agents",
  "name": "Agents"
 },
 {
  "slug": "stacks-assist",
  "name": "Assistant"
 },
 {
  "slug": "stacks-books",
  "name": "Books"
 },
 {
  "slug": "stacks-crm",
  "name": "CRM"
 },
 {
  "slug": "stacks-crypto",
  "name": "Crypto"
 },
 {
  "slug": "stacks-shop",
  "name": "Shop"
 }
];
