# Requirements Document

## Introduction

The polished UI refresh shall transform Relay into a cohesive, distinctive employee field guide while preserving its current knowledge, navigation, AI, checklist, search, and contribution functionality. These requirements are derived from the approved Relay Field Guide technical design and cover the home page, documentation shell, Ask AI experiences, responsive navigation, reusable primitives, accessibility, motion, themes, and operational quality.

## Glossary

- **Relay UI**: The Next.js application that presents the AFE employee wiki.
- **Field Guide system**: The semantic tokens, typography, route-line motif, reusable primitives, and interaction rules defined by the design.
- **Documentation shell**: The Fumadocs navigation, search, article, and table-of-contents layout under `/docs`.
- **Full assistant**: The Ask Relay experience at `/ask-ai`.
- **Floating assistant**: The compact Ask Relay panel available outside `/ask-ai`.
- **Contribution workflow**: The New Page and Edit Page forms that submit content as pull requests.
- **Primary routes**: Home, Handbook, New Page, Ask AI, and all existing handbook category destinations.

## Requirements

### Requirement 1: Cohesive visual system

**User Story:** As an employee, I want Relay to look deliberate and consistent, so that I can trust and understand the product quickly.

#### Acceptance Criteria

1. THE Relay UI SHALL define semantic light and dark theme tokens for canvas, surfaces, text, borders, brand ink, signal action, informational accents, success, warning, danger, and focus.

1.2 THE Relay UI SHALL map the semantic theme tokens to the Fumadocs `--color-fd-*` aliases used by existing framework components.

1.3 THE Relay UI SHALL use the Relay Field Guide visual language of ink, warm paper, signal orange, supporting accents, route-line motifs, and restrained elevation across all primary surfaces.

1.4 THE Relay UI SHALL use Manrope for display/interface typography, retain Inter for body typography, and use a system monospace stack for code and metadata.

1.5 THE Relay UI SHALL avoid raw brand color literals in component implementations and SHALL consume semantic tokens instead.

1.6 WHEN the active theme changes, THE Relay UI SHALL present equivalent distinguishable hierarchy and interaction states without a hydration flash.

### Requirement 2: Global navigation and wayfinding

**User Story:** As an employee, I want clear and responsive wayfinding, so that I can reach handbook content, search, contribution tools, and Ask Relay from any relevant page.

#### Acceptance Criteria

2.1 THE Relay UI SHALL keep Home, Handbook, New Page, Ask AI, theme controls, documentation search, and every existing handbook category destination reachable.

2.2 WHEN a navigation destination is active, THE Relay UI SHALL identify it using at least two of text, icon, weight, shape, or route-line marker rather than color alone.

2.3 WHEN the viewport is at least 1024 pixels wide, THE documentation shell SHALL present persistent page-tree navigation and SHALL present the article table of contents when page data and space permit.

2.4 WHEN the viewport is narrower than 1024 pixels, THE Relay UI SHALL provide collapsible or off-canvas navigation without compressing the primary content below its readable layout.

2.5 WHEN a navigation overlay opens, THE Relay UI SHALL move focus into it, contain focus, close on Escape, prevent background interaction, and restore focus to its trigger on dismissal.

2.6 THE Relay UI SHALL use Fumadocs page-tree, search, theme, and routing behavior as the source of truth rather than introducing duplicate navigation state.
### Requirement 3: Distinctive home experience

**User Story:** As a new employee, I want an engaging starting point with obvious next steps, so that I can orient myself without scanning the entire handbook.

#### Acceptance Criteria

3.1 THE home page SHALL present an asymmetric Relay Field Guide hero with an AFE label, a direct welcome headline, supporting copy, a Handbook action, and an Ask Relay action.

3.2 THE home page SHALL use a decorative route-map composition whose decorative elements are hidden from assistive technology and do not contain required information.

3.3 THE home page SHALL present the existing Day One checklist as a prominent progress surface without changing its item data, completion logic, persistence key, or celebration trigger.

3.4 THE home page SHALL present all nine existing category titles, descriptions, icons, and destinations in a responsive bento-style collection.

3.5 WHEN a category card receives hover or keyboard focus, THE card SHALL provide a visible interactive response without changing layout by more than two pixels or hiding its text.

3.6 THE home page SHALL provide visible paths to the FAQ, Canonical Sources, and New Page contribution workflow.

### Requirement 4: Readable documentation shell

**User Story:** As an employee reading guidance, I want calm, structured articles and clear local navigation, so that I can find and understand authoritative information efficiently.

#### Acceptance Criteria

4.1 THE documentation shell SHALL preserve the existing Fumadocs page tree, grouped section order, route resolution, search behavior, and table-of-contents input.

4.2 THE documentation page SHALL render the existing MDX body, title, description, links, and custom widgets without content migration.

4.3 THE documentation page SHALL constrain primary prose to a readable measure between 65 and 75 characters on layouts with sufficient width.

4.4 THE documentation presentation SHALL provide distinguishable styles for headings, links, lists, tables, blockquotes, callouts, cards, inline code, and code blocks in both themes.

4.5 WHEN an article heading is active in the table of contents, THE shell SHALL expose the active state using text treatment and a route-line marker rather than color alone.

4.6 WHEN horizontal space is insufficient for the table of contents, THE shell SHALL remove or relocate it instead of narrowing the article below its readable measure.

4.7 THE documentation page SHALL retain the Edit Page entry point after article content and SHALL present it as a clearly labeled contribution action.

### Requirement 5: Unified Ask Relay experience

**User Story:** As an employee with a question, I want a focused and trustworthy AI experience in either full or compact form, so that I can find handbook guidance without losing context.

#### Acceptance Criteria

5.1 THE full assistant SHALL provide an empty state with a concise purpose statement, the three existing starter prompts, and a visible guidance-verification disclaimer.

5.2 THE full and floating assistants SHALL use shared visual contracts for user messages, assistant messages, prompt suggestions, composer controls, streaming state, and trust messaging.

5.3 WHEN a user submits a non-empty prompt while no response is streaming, THE assistant SHALL send the existing ordered `{ role, content }` conversation to `POST /api/chat` with JSON content type.

5.4 WHILE a response streams, THE assistant SHALL append chunks to one assistant message, expose a screen-reader status without announcing every token, and keep existing conversation content visible.

5.5 WHEN the user presses Enter in the composer, THE assistant SHALL submit once if submission is enabled; WHEN the user presses Shift+Enter, THE composer SHALL insert a newline.

5.6 WHEN the full assistant is streaming, THE full assistant SHALL expose the existing stop action and SHALL preserve received content when stopped.

5.7 WHEN an assistant response completes, THE full assistant SHALL retain the existing copy, download, like, and dislike actions.

5.8 WHEN the current route is `/ask-ai`, THE Relay UI SHALL NOT render the floating assistant trigger or panel.

5.9 WHEN the floating assistant is available, THE floating assistant SHALL retain open, close, maximize, suggestion, send, and error-recovery behavior.
### Requirement 6: Reusable primitives and interaction states

**User Story:** As a maintainer, I want a small, semantic set of UI primitives, so that future UI work remains consistent and accessible.

#### Acceptance Criteria

6.1 THE Relay UI SHALL provide reusable semantic variants for buttons, links, cards, badges, icon actions, fields, section headings, page frames, and status banners.

6.2 THE reusable primitives SHALL expose hover, pressed, focus-visible, disabled, loading, expanded, selected, success, and error states where applicable.

6.3 THE Button primitive SHALL preserve native button semantics, and link-styled actions SHALL preserve native anchor semantics.

6.4 THE Icon Action primitive SHALL require a non-empty accessible label.

6.5 THE Field primitive SHALL associate one visible label with one form control and SHALL associate rendered hints and errors through accessible descriptions.

6.6 THE Card primitive SHALL support plain, interactive, feature, and inset visual roles without requiring nested interactive controls.

6.7 THE existing Button, Card, and Badge call sites SHALL remain migratable without changing their business data or event handlers.

### Requirement 7: Contribution and editor workflow preservation

**User Story:** As a contributor, I want polished creation and editing forms that retain my work and clearly communicate status, so that I can safely improve the handbook.

#### Acceptance Criteria

7.1 THE New Page form SHALL preserve the existing title-to-slug generation and manual slug sanitization behavior.

7.2 THE New Page form SHALL submit the existing slug, title, optional description, and Markdown content payload to `/api/content/create`.

7.3 THE Edit Page control SHALL load raw content from the existing raw-content endpoint before showing an editable form.

7.4 THE Edit Page form SHALL submit the existing slug, title, optional description, and Markdown content payload to `/api/content/edit`.

7.5 THE Wiki Editor SHALL preserve every existing toolbar action, edit/preview mode, selection handling, Markdown content, and change callback behavior.

7.6 WHEN a create or edit request is pending, THE relevant form SHALL prevent duplicate submission and expose a labeled loading state.

7.7 WHEN a create or edit request fails, THE form SHALL present an accessible error status and SHALL preserve all entered user content for retry.

7.8 WHEN a create or edit request succeeds, THE form SHALL present the returned pull-request link and the existing review-before-publishing guidance.

### Requirement 8: Responsive and accessible behavior

**User Story:** As an employee using any device or input method, I want Relay to remain readable and operable, so that disability or viewport size does not block access.

#### Acceptance Criteria

8.1 THE Relay UI SHALL conform to WCAG 2.2 AA for the refreshed surfaces.

8.2 THE Relay UI SHALL maintain at least 4.5:1 contrast for normal text and at least 3:1 for large text, focus indicators, and meaningful non-text UI boundaries.

8.3 EVERY pointer-operable application action SHALL have a keyboard-operable equivalent and a visible focus indicator.

8.4 THE Relay UI SHALL provide at least 44-by-44-pixel targets for primary mobile controls and adequately spaced compact desktop controls.

8.5 THE Relay UI SHALL preserve semantic landmarks, logical heading order, native control roles, lists, and accessible names.

8.6 WHEN content is zoomed to 400 percent or reflowed to a 320 CSS-pixel viewport, THE Relay UI SHALL not require two-dimensional scrolling except for intrinsically wide content such as code or tables.

8.7 THE Relay UI SHALL expose errors, progress, selection, and active state through more than color alone.

8.8 THE Relay UI SHALL keep essential navigation and article content available before client-side enhancement completes.
### Requirement 9: Purposeful motion and theme preferences

**User Story:** As an employee, I want feedback that feels polished without distraction or discomfort, so that interactions remain clear and comfortable.

#### Acceptance Criteria

9.1 THE Relay UI SHALL limit standard interface transitions to 300 milliseconds or less.

9.2 THE Relay UI SHALL use motion only to communicate entrance, hierarchy, navigation state, overlay state, progress, or streaming feedback.

9.3 WHEN the operating system requests reduced motion, THE Relay UI SHALL disable non-essential transforms, smooth scrolling, pulsing, staggering, and confetti while preserving immediate state feedback.

9.4 THE Relay UI SHALL preserve the existing one-time checklist celebration only when reduced motion is not requested.

9.5 THE Relay UI SHALL avoid continuously moving decorative backgrounds and SHALL avoid bouncing-dot streaming indicators in the refreshed assistant.

9.6 WHEN forced-colors or increased-contrast preferences apply, THE Relay UI SHALL preserve visible boundaries, active state, and focus indication.

### Requirement 10: Functional compatibility and quality

**User Story:** As a product owner, I want the refresh to improve presentation without breaking functionality or performance, so that it can ship safely.

#### Acceptance Criteria

10.1 THE refreshed Relay UI SHALL preserve every existing public route and internal destination represented in the current navigation and home category data.

10.2 THE refreshed Relay UI SHALL preserve chat, search, checklist persistence, MDX rendering, create-page, and edit-page endpoint contracts.

10.3 THE refresh SHALL add no analytics, external service, new persistence mechanism, authorization path, or runtime animation library.

10.4 THE refreshed UI SHALL render AI Markdown through the existing React Markdown pipeline and SHALL retain safe external-link attributes.

10.5 THE refreshed UI SHALL NOT log AI message text, form content, or personal user input from presentation components.

10.6 THE refreshed UI SHALL target cumulative layout shift no greater than 0.1, largest contentful paint no greater than 2.5 seconds at the 75th percentile, and interaction to next paint no greater than 200 milliseconds at the 75th percentile.

10.7 THE refresh SHALL preserve server rendering for the home page and documentation pages and SHALL restrict client components to interactive surfaces.

10.8 THE refresh SHALL use CSS or SVG decoration instead of adding large decorative raster assets.

10.9 BEFORE completion, THE refreshed UI SHALL pass type checking, linting, production build, responsive visual regression, accessibility checks, and targeted workflow smoke tests.

## Out of Scope

- Changes to handbook editorial content or information architecture.
- Changes to chat retrieval, model invocation, grounding, or backend response format.
- Changes to GitHub pull-request creation or authorization behavior.
- Changes to checklist item definitions or persistence semantics.
- Addition of analytics, personalization, user accounts, or new backend services.
