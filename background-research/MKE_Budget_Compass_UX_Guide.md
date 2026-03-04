**MKE Budget Compass**

UX/UI Design Guide

Design system, component architecture, interaction patterns, and implementation reference

Amazon Nova AI Hackathon • Version 1.0 • February 2026

*Design Language: Civic Modernism*

**Contents**

1\. Design Philosophy & Milwaukee Identity

2\. Design System: Color, Typography & Spacing

3\. Layout Architecture

4\. Component Library

5\. Mode 1: Ask (Conversational Q&A)

6\. Mode 2: Hear (Audio Briefings)

7\. Mode 3: See (Visual Stories)

8\. Mode 4: Remix (Budget Simulator)

9\. Responsive & Accessibility

10\. Motion & Animation

11\. Persona-Driven Design Decisions

12\. Implementation Reference

**1. Design Philosophy & Milwaukee Identity**

MKE Budget Compass uses a design language called Civic Modernism that draws from three Milwaukee identity anchors to create an interface that feels unmistakably local while remaining clean, modern, and accessible to all residents.

**Lake Michigan Depth**

The primary color palette flows from deep navy (#0C2340) through rich teals (#1B5E8A) to bright lake blue (#4DA8DA). These colors are used for the navigation bar, active states, data visualizations, and the floating ambient orb. The gradient evokes the lakefront that defines Milwaukee's eastern edge without resorting to literal water imagery.

**Cream City Warmth**

Milwaukee is nicknamed the Cream City for its distinctive cream-colored brick. The interface uses a subtle brick-pattern texture at 2.5% opacity across the full background, with cream tones (#F5E6C8, #FBF3E4) for warm accent areas. This provides organic warmth that softens the technical nature of budget data without competing with the content layer.

**Industrial Boldness**

Milwaukee's manufacturing heritage informs the confident typography choices, monospaced number displays (DM Mono), high-contrast data bars, and the overall structural clarity of the interface. Data is presented with the precision of engineering blueprints, making complex fiscal information feel authoritative and trustworthy.

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Why Not Generic Tech Aesthetics?**                                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                                                        |
| Hackathon judges see dozens of purple-gradient chatbots. By grounding the visual identity in Milwaukee's physical landscape and architectural history, Budget Compass immediately communicates that this is a civic tool built for a specific community --- not a generic AI demo. This specificity is the difference between a project and a product. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**2. Design System**

**2.1 Color Palette**

**Primary: Lake Michigan Depth**

+--------------------+----------------+----------------+--------------------+-------------------------+
| ■■■                | ■■■            | ■■■            | ■■■                | ■■■                     |
|                    |                |                |                    |                         |
| #0C2340            | #13375B        | #1B5E8A        | #2B7FB5            | #4DA8DA                 |
|                    |                |                |                    |                         |
| **Lake Dark**      | **Lake Deep**  | **Lake Mid**   | **Lake Light**     | **Lake Glow**           |
|                    |                |                |                    |                         |
| Nav, headers, CTAs | Card gradients | Active borders | Links, focus rings | Ambient orb, highlights |
+--------------------+----------------+----------------+--------------------+-------------------------+

**Accent: Cream City Warmth**

+-----------------------+-----------------------+-----------------------+
| ■■■                   | ■■■                   | ■■■                   |
|                       |                       |                       |
| #F5E6C8               | #FBF3E4               | #C4956A               |
|                       |                       |                       |
| **Cream**             | **Cream Light**       | **Brick**             |
|                       |                       |                       |
| Warm backgrounds      | Page background top   | Texture pattern       |
+-----------------------+-----------------------+-----------------------+

**Signal Colors (One per Mode)**

+-----------------+-----------------+-----------------+------------------+
| ■■■             | ■■■             | ■■■             | ■■■              |
|                 |                 |                 |                  |
| #2B7FB5         | #34D399         | #FBBF24         | #A78BFA          |
|                 |                 |                 |                  |
| **Ask Blue**    | **Hear Mint**   | **See Amber**   | **Remix Violet** |
|                 |                 |                 |                  |
| Mode 1 active   | Mode 2 active   | Mode 3 active   | Mode 4 active    |
+-----------------+-----------------+-----------------+------------------+

**Semantic Colors**

+-----------------------+-----------------------+-----------------------+
| ■■■                   | ■■■                   | ■■■                   |
|                       |                       |                       |
| #059669               | #EF4444               | #D97706               |
|                       |                       |                       |
| **Positive / Mint**   | **Negative / Coral**  | **Warning / Amber**   |
|                       |                       |                       |
| Budget surplus, gains | Over budget, cuts     | Caution states        |
+-----------------------+-----------------------+-----------------------+

**2.2 Typography**

  ------------- ------------------ ------------- -------------- --------------------------
  **Role**      **Font**           **Weight**    **Size**       **Usage**

  Display       Instrument Serif   400           28--36px       Mode titles, headlines

  Body          DM Sans            400--600      14--15px       All body copy, UI labels

  Data          DM Mono            500--700      12--18px       Dollar amounts, %

  Code          Courier New        400           18--19px       Technical docs only

  Logo          Instrument Serif   400           20px           \"Budget Compass\"
  ------------- ------------------ ------------- -------------- --------------------------

**Key decision:** Instrument Serif for display type creates editorial authority (like a newspaper masthead), while DM Sans for body text ensures modern readability. DM Mono for all financial figures guarantees number alignment and signals data precision. This three-font system avoids the generic feel of single-font interfaces.

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Anti-Pattern: Avoided Fonts**                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                   |
| Inter, Roboto, Arial, and system fonts are explicitly banned from the design system. These fonts signal "generic AI tool" and undermine the Milwaukee-specific identity. Similarly, Space Grotesk and Poppins are overused in hackathon projects. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**2.3 Spacing Scale**

The spacing system uses a 4px base unit with specific tokens for consistent rhythm:

  --------------- ----------- ---------------------------------------------
  **Token**       **Value**   **Usage**

  xs              4px         Inline gaps, icon padding

  sm              8px         Pill gaps, tight element spacing

  md              12--16px    Card padding, message gaps, section spacing

  lg              24px        Content area padding, mode card gaps

  xl              32px        Section padding, panel insets

  2xl             48px        Welcome screen vertical centering
  --------------- ----------- ---------------------------------------------

**2.4 Border Radius Scale**

  ------------------ ----------- ----------------------------------------------
  **Token**          **Value**   **Components**

  rounded-sm         6px         Data bars, progress indicators

  rounded-md         12px        Agent avatar, send button, input fields

  rounded-lg         16--20px    Mode cards, content panels, chart containers

  rounded-xl         24px        Main content area

  rounded-full       50%         Audio buttons, typing dots, pills
  ------------------ ----------- ----------------------------------------------

**3. Layout Architecture**

**3.1 Page Structure**

The interface is built as a single-page application with a vertical stack layout. Every element is contained within a max-width of 960px, centered with auto margins, creating comfortable reading widths on all screen sizes.

  ------------------ ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Layer**          **Description**

  Background         Full-viewport gradient (cream → snow → white) with Cream City brick texture at 2.5% opacity and floating Lake Orb (600px radial gradient, blur: 80px)

  Sticky Nav         Glassmorphism bar (background: #FFFFFFE8, backdrop-filter: blur(16px) saturate(180%)). Contains logo, location badge, budget ticker. Sticks to top on scroll.

  Mode Selector      Flex row of 4 mode cards. Active card expands (flex: 2.5), inactive cards compress (flex: 1). 12px gap between cards.

  Content Panel      White card with 24px border-radius, 1px border (#E2E8F0), subtle box-shadow. Contains mode-specific content. Min-height: 480px.

  Footer             Centered text: project name, data source attribution, hackathon badge. Padding: 24px top, 32px bottom.
  ------------------ ---------------------------------------------------------------------------------------------------------------------------------------------------------------

**3.2 Visual Hierarchy**

The interface uses three levels of visual depth to guide attention:

-   **Level 1 --- Ambient:** Background gradient, brick texture, and lake orb create atmosphere. These elements are perceived subconsciously and establish the Milwaukee identity without demanding attention.

-   **Level 2 --- Structural:** The sticky nav bar, mode selector cards, and content panel form the interactive skeleton. These use white/near-white backgrounds with subtle borders and shadows.

-   **Level 3 --- Focal:** Active mode card gradient, chat messages, data visualizations, and interactive controls. These use the strongest colors and highest contrast to draw the eye.

**3.3 The Mode Card System**

The mode selector is the primary navigation pattern. Rather than tabs, sidebar links, or a hamburger menu, the four modes are presented as fluid cards that physically expand and contract.

**Inactive Card (flex: 1)**

-   Min-width: 140px, height: 180px

-   Background: #F8FAFC (snow), border: 1.5px solid #E2E8F0

-   Content: centered icon (32px) + label (18px, Instrument Serif)

-   Hover: white background, colored border, translateY(-4px), 32px box-shadow

**Active Card (flex: 2.5)**

-   Min-width: 320px, height: 220px

-   Background: mode-specific gradient (135deg)

-   Content: left-aligned icon (36px), label (28px), tagline (14px), persona pills

-   Shadow: 20px 60px spread with mode color at 30% opacity

**Transition:** All properties animate over 0.5s with cubic-bezier(0.4, 0, 0.2, 1) --- a deceleration curve that feels organic and intentional. The flex change creates a fluid squeeze/expand motion that draws the eye to the newly active mode.

**4. Component Library**

**4.1 Chat Message Bubble**

Chat messages use asymmetric bubble shapes to clearly distinguish user from assistant:

  ------------------ -------------------------- -------------------------------------
  **Property**       **User Message**           **Assistant Message**

  Alignment          Right                      Left

  Background         #0C2340 (Lake Dark)        #FFFFFF (White)

  Text color         #FFFFFF                    #333333

  Border radius      18/18/4/18px               18/18/18/4px

  Border             None                       1px solid #E2E8F0

  Shadow             None                       0 2px 12px rgba(0,0,0,0.06)

  Max width          80%                        80%

  Avatar             None                       🏛️ in 36px navy square (rounded-12)
  ------------------ -------------------------- -------------------------------------

**The asymmetric radius** (4px on the tail corner) creates a subtle speech-bubble effect without the cartoon-like triangle pointer. The assistant avatar uses the city hall emoji to reinforce civic identity. Charts render inside the assistant bubble in a nested container with snow background and mist border.

**4.2 Typing Indicator**

Three pulsing dots (7px circles, #94A3B8) with staggered animation delays (0s, 0.15s, 0.3s) on a 1.2s cycle. The dots scale between 0.8x and 1.1x and fade between 30% and 100% opacity. This creates a gentle breathing rhythm that feels alive without being distracting.

**4.3 Quick Prompt Pills**

Suggested questions appear as horizontally-wrapping pills below the welcome message or input bar:

-   Background: white, border: 1px solid #E2E8F0, border-radius: 20px

-   Padding: 8px 16px, font: DM Sans 13px, color: #374151

-   Hover: border color transitions to mode accent color, text darkens, translateY(-1px)

-   Four prompts per mode, written in plain language matching each persona

**4.4 Budget Data Bars**

Horizontal bar charts used in Ask and See modes:

-   Container: full-width row with 72px label column, flexible bar, 40px percentage column

-   Bar background: #E2E8F0 (mist), bar fill: department-specific color with 80% opacity tail

-   Amount label: DM Mono 11px white, right-aligned inside the bar with text-shadow

-   Animation: width transitions from 0% to target over 0.8s with staggered 0.08s delay per row

-   Purpose: animated bars create a reveal moment that makes budget proportions viscerally clear

**4.5 Input Bar**

The chat input uses a contained design inspired by messaging apps:

-   Container: #F8FAFC background, 16px border-radius, 1.5px #E2E8F0 border

-   Focus state: border color transitions to #2B7FB5 (Lake Light) over 0.2s

-   Send button: 42px square, rounded-12, navy when text is present, mist when empty

-   Send icon: up-arrow (↑) in white, 18px

-   Layout: flex row with 6px padding and 20px left padding for text input

**4.6 Remix Sliders**

Budget allocation sliders in Mode 4:

-   Label row: department name (DM Sans 14px bold) left, dollar amount (DM Mono 14px bold) right

-   Delta badge: appears when value changes from original; green (+) or coral (-) background at 15% opacity with matching text

-   Slider track: 6px height, rounded-3, gradient fill from department color to position

-   Slider thumb: 18px circle, #0C2340 fill, 3px white border, 6px drop shadow

-   Range: 0 to 2x original value, step: 0.1M

**4.7 Budget Balance Indicator**

A live-updating badge in the Remix header showing the net effect of slider changes:

-   Balanced (±0.1M): mint green background (#05966910), mint border (#05966930), shows "0.0M"

-   Over budget: coral background (#EF444410), coral border, shows positive delta

-   Under budget: mint, shows negative delta with impact translation (potholes, jobs)

**4.8 Consequence Panel**

A dark-gradient panel at the bottom of Remix mode that provides AI-generated plain-language analysis of the user's budget changes:

-   Background: linear-gradient(135deg, #0C2340, #13375B)

-   Label: uppercase, 13px, 60% white opacity, with robot emoji prefix

-   Body: 14px, 90% white opacity, line-height 1.7

-   Content updates in real time as sliders move, translating abstract dollar amounts into tangible civic impacts

**5. Mode 1: Ask (Conversational Q&A)**

**5.1 User Flow**

1.  User arrives at welcome screen with centered icon, Instrument Serif headline, descriptive subtitle, and four quick-prompt pills

2.  User either types a question in the input bar or clicks a quick-prompt pill

3.  Welcome screen fades out (fadeSlideUp animation), chat history begins

4.  User message appears right-aligned in navy bubble

5.  Typing indicator pulses in assistant position (left-aligned with city hall avatar)

6.  After 1.8s simulated delay, assistant response appears with inline chart if the query involves budget data

7.  User can continue asking follow-up questions; chat scrolls automatically via scrollIntoView

**5.2 Inline Chart Rendering**

When the Q&A or Analyst agent determines a chart would help answer the question, it calls the renderBudgetChart tool. CopilotKit intercepts this tool call via AG-UI and renders the BudgetChart component inside the assistant's message bubble:

-   Chart container: 16px padding, #F8FAFC background, 12px border-radius, 1px mist border

-   Chart title: DM Sans 13px, bold, Lake Dark color

-   Chart body: animated horizontal bars (see Component 4.4)

-   Insight callout (optional): light blue box below chart with key takeaway

**5.3 Design Rationale**

The Ask mode prioritizes speed and trust. Every number displayed comes from verified Convex queries, never LLM estimation. The inline chart renders within the conversation flow so users never lose context. The city hall avatar and navy-white color scheme create a sense of institutional authority appropriate for fiscal data.

**6. Mode 2: Hear (Audio Briefings)**

**6.1 User Flow**

1.  Mode switches to centered layout with headline and description

2.  Audio player card appears: gradient green background (#065F46 → #059669), 20px border-radius, 48px box-shadow

3.  Player shows: "Now Playing" label, briefing title (Instrument Serif 22px), waveform visualizer, transport controls, progress bar

4.  User clicks play; waveform bars animate, progress bar fills linearly

5.  Below the player: topic pills let user choose different briefings

**6.2 Waveform Visualizer**

32 vertical bars, 3px wide with 2px gap. When idle: all bars at 4px height, #E2E8F0. When playing: heights oscillate via sin(i \* 0.6 + timestamp \* 0.004) between 8px and 24px, with a mint-to-blue gradient fill. Transition: 0.15s ease for responsive feel. This creates a podcast-like visual that signals "audio is active" without requiring actual audio processing.

**6.3 Transport Controls**

Three buttons in a centered row: skip-back (44px circle, 15% white opacity), play/pause (64px circle, white background, green icon, 16px box-shadow), skip-forward (matching back). The large central button uses box-shadow to create a raised, pressable feel.

**7. Mode 3: See (Visual Stories)**

**7.1 User Flow**

8.  Centered header with headline and description

9.  Sample infographic preview renders in a snow-background container

10. Chart displays with animated bars revealing department allocations

11. Key insight callout appears below chart in tinted box

12. Below: "Generate an Infographic" section with topic prompts

**7.2 Infographic Container**

The infographic preview uses a card-within-a-card pattern:

-   Outer: white content panel (the mode container)

-   Inner: #F8FAFC card, 16px border-radius, 24px padding, 1px mist border

-   Title: Instrument Serif 20px, Lake Dark color

-   Subtitle: 12px fog color with fund name and total

-   Chart: animated budget bars (Component 4.4)

-   Insight box: 12px padding, Lake Glow at 10% opacity background, 20% opacity border, Lake Mid text

**7.3 Shareable Design**

The infographic container is designed to be screenshot-friendly and shareable on social media. Clean white background, self-contained data with source attribution, and a readable layout at any crop size. In production, Nova 2 Omni would generate actual infographic images that can be downloaded directly.

**8. Mode 4: Remix (Budget Simulator)**

**8.1 User Flow**

13. Split header: title and description on left, live budget balance indicator on right

14. Six department sliders appear (Police, Fire, DPW, Health, Library, Parks --- "Other" is excluded as non-adjustable)

15. User drags any slider; delta badge appears instantly, budget balance updates

16. Consequence panel at bottom updates in real time with AI-generated analysis

17. Panel translates abstract dollar changes into tangible impacts: property tax change, potholes, youth jobs

**8.2 Consequence Engine**

The consequence panel uses pre-computed multipliers to translate budget changes into real-world impacts:

-   Property tax: delta / 6.1 (levy rate per \$1M) × median home value factor

-   Potholes: surplus / \$65,000 (average pothole repair cost)

-   Youth jobs: surplus / \$850,000 (average program cost per cohort)

In production, the Simulator Agent (Nova 2 Pro) would generate more nuanced consequence analysis considering department interdependencies, union contracts, and federal funding match requirements.

**8.3 Emotional Design**

Remix mode is deliberately designed to create an emotional connection to budget data. The real-time slider feedback makes abstract fiscal policy feel tangible --- users experience the tradeoffs that city officials face daily. The green/coral color coding creates immediate positive/negative framing. The consequence panel's use of concrete examples (potholes, not "infrastructure maintenance") makes impact visceral.

**9. Responsive & Accessibility**

**9.1 Responsive Breakpoints**

  ---------------- ------------------ ---------------------------------------------------------------------------------------------
  **Breakpoint**   **Width**          **Adaptations**

  Desktop          ≥ 960px            Full layout, 4 horizontal mode cards, side-by-side elements

  Tablet           640--959px         Mode cards in 2x2 grid, content panel full-width, nav condensed

  Mobile           \< 640px           Mode cards as horizontal scroll strip, stacked layout, full-bleed content, bottom input bar
  ---------------- ------------------ ---------------------------------------------------------------------------------------------

**9.2 Accessibility Standards**

The design system targets WCAG 2.1 AA compliance across all four modes:

-   **Color contrast:** All text meets 4.5:1 minimum. Navy (#0C2340) on white exceeds 14:1. White on gradient backgrounds maintains minimum 4.5:1 by using deeper gradient stops.

-   **Focus indicators:** All interactive elements receive a 2px Lake Light (#2B7FB5) focus ring on keyboard navigation, with 2px offset for visibility.

-   **Screen readers:** Mode cards include aria-selected and aria-label attributes. Chart data is duplicated as screen-reader-only tables. Audio player uses standard media ARIA roles.

-   **Reduced motion:** All animations respect prefers-reduced-motion: reduce. Transitions become instant, waveform bars remain static, and sliding effects are replaced with opacity fades.

-   **Font sizing:** Base font size is 14--15px with 1.5--1.7 line-height. All text scales with user font-size preferences via rem units.

-   **Touch targets:** Minimum 44px for all interactive elements (mode cards, buttons, slider thumbs). Quick-prompt pills have 8px vertical padding ensuring 36px+ height.

**9.3 Hear Mode Accessibility**

The audio briefing mode is designed as an accessibility-first feature. Users who cannot read the 208-page budget PDF --- whether due to visual impairment, literacy challenges, or simply lack of time --- can access the same information through spoken briefings. The waveform visualizer provides a visual confirmation that audio is playing for deaf/hard-of-hearing users who may use the feature with captions enabled.

**10. Motion & Animation**

Every animation in Budget Compass serves a functional purpose. Motion is used to direct attention, communicate state changes, and create a sense of polish --- never for decoration.

  ---------------- -------------- ------------------------- ----------------------------------------------------
  **Animation**    **Duration**   **Easing**                **Purpose**

  fadeSlideUp      0.4s           ease                      Chat messages entering

  slideIn          0.5--0.6s      ease                      Mode content appearing

  Mode card flex   0.5s           cubic-bezier(.4,0,.2,1)   Mode switching expand/contract

  Card hover       0.2s           ease                      Hover lift: translateY(-4px)

  Bar chart fill   0.8s           cubic-bezier(.4,0,.2,1)   Budget bar width reveal (staggered 0.08s)

  Typing pulse     1.2s           ease-in-out               Three dots scale + opacity loop

  Waveform         0.15s          ease                      Audio bar height oscillation

  Lake Orb         1.5s           cubic-bezier(.4,0,.2,1)   Background orb scale/opacity shift on state change

  Focus ring       0.2s           ease                      Input border color on focus
  ---------------- -------------- ------------------------- ----------------------------------------------------

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Motion Principle: One Hero Moment Per Mode Switch**                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                  |
| When the user switches modes, only one "hero" animation plays: the mode card expansion. The content area uses a simple slideIn fade. This creates a single focal point of motion rather than competing animations. The staggered bar chart reveal is the hero moment within each mode's content. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**11. Persona-Driven Design Decisions**

Every UX decision maps to one or more of the four target personas defined in the PRD. This section documents how the design serves each persona's specific needs.

**11.1 Milwaukee Residents**

  ---------------------- ----------------------------------------------------------------------------------------------------------
  **Need**               **Design Response**

  Plain language         Quick prompts use everyday phrasing: "What's the total city budget?" not "Aggregate GCP fund allocation"

  Trust in numbers       DM Mono for all dollar figures signals precision. Source attribution on every chart.

  Low barrier to entry   Welcome screen with suggested questions means zero learning curve. No signup required.

  Mobile access          Full responsive design. Touch-friendly 44px+ targets. Bottom input bar on mobile.
  ---------------------- ----------------------------------------------------------------------------------------------------------

**11.2 Journalists**

  --------------------- ---------------------------------------------------------------------------------------------------------------
  **Need**              **Design Response**

  Quick facts           Ask mode with inline charts provides instant story-ready data with verified sourcing

  Shareable visuals     See mode infographics designed for social media: clean backgrounds, self-contained data, readable at any crop

  Comparison data       Analyst Agent handles multi-year trends and cross-department comparisons

  Source verification   Every data point traced to page number in the 208-page PDF source document
  --------------------- ---------------------------------------------------------------------------------------------------------------

**11.3 Students & Educators**

  ----------------------- --------------------------------------------------------------------------------------------------------
  **Need**                **Design Response**

  Experiential learning   Remix mode's sliders make budget tradeoffs tangible. Students experience fiscal constraints firsthand.

  Consequence modeling    AI consequence panel translates dollar amounts into real-world impacts (jobs, potholes, tax changes)

  Visual engagement       Animated bar charts and mode card transitions maintain attention for younger users

  Classroom ready         Clean layout works on projectors. Infographics printable. No login barriers for student access.
  ----------------------- --------------------------------------------------------------------------------------------------------

**11.4 Community Advocates**

  --------------------- -----------------------------------------------------------------------------------------------
  **Need**              **Design Response**

  Data for testimony    Ask mode provides exact verified figures with source attribution for budget hearings

  Proposal modeling     Remix mode lets advocates build and present alternative budget proposals with impact analysis

  Accessibility         Hear mode provides audio access for community members who prefer spoken information

  Shareable advocacy    Infographics and Remix proposals can be shared to build community support
  --------------------- -----------------------------------------------------------------------------------------------

**12. Implementation Reference**

**12.1 Component File Structure**

> src/
>
> app/
>
> layout.tsx \# Font imports, global styles
>
> page.tsx \# Main MKEBudgetCompass component
>
> globals.css \# CSS variables, animations
>
> components/
>
> ui/
>
> mode-card.tsx \# Expanding mode selector card
>
> chat-message.tsx \# Message bubble + inline charts
>
> typing-indicator.tsx \# Three-dot pulse animation
>
> quick-prompts.tsx \# Suggested question pills
>
> budget-bars.tsx \# Animated horizontal bar chart
>
> input-bar.tsx \# Chat input with send button
>
> remix-slider.tsx \# Department allocation slider
>
> budget-balance.tsx \# Live balance indicator
>
> consequence-panel.tsx \# AI analysis dark panel
>
> audio-player.tsx \# Voice briefing player card
>
> audio-waveform.tsx \# Animated bar waveform
>
> lake-orb.tsx \# Ambient background orb
>
> brick-pattern.tsx \# Cream City texture overlay
>
> modes/
>
> ask-mode.tsx \# Chat interface + welcome
>
> hear-mode.tsx \# Audio briefing player
>
> see-mode.tsx \# Infographic generator
>
> remix-mode.tsx \# Budget simulator
>
> copilotkit/
>
> copilotkit-provider.tsx \# CopilotKit wrapper
>
> budget-chart-action.tsx \# Generative UI action
>
> lib/
>
> design-tokens.ts \# Color, spacing, typography constants
>
> budget-data.ts \# Sample/fallback data
>
> animation.ts \# Shared animation configs

**12.2 Key Dependencies**

  ------------------------- ------------------------------------------------------------------
  **Package**               **Purpose in UX**

  next                      App Router, server components, API routes

  \@copilotkit/react-core   CopilotKit provider, useCopilotAction for Generative UI

  \@copilotkit/react-ui     CopilotChat base component (customized with our design system)

  recharts                  Bar, line, pie, treemap charts rendered inline via Generative UI

  tailwindcss               Utility classes for responsive layout and spacing

  framer-motion             Mode card transitions, page animations, staggered reveals

  shadcn/ui                 Base components (Slider, Dialog, Tooltip) with custom theme
  ------------------------- ------------------------------------------------------------------

**12.3 CSS Variables**

All design tokens are defined as CSS custom properties in globals.css for runtime theming:

> :root {
>
> /\* Lake Michigan Depth \*/
>
> \--color-lake-dark: #0C2340;
>
> \--color-lake-deep: #13375B;
>
> \--color-lake-mid: #1B5E8A;
>
> \--color-lake-light: #2B7FB5;
>
> \--color-lake-glow: #4DA8DA;
>
> /\* Cream City Warmth \*/
>
> \--color-cream: #F5E6C8;
>
> \--color-cream-light: #FBF3E4;
>
> \--color-brick: #C4956A;
>
> /\* Mode Signal Colors \*/
>
> \--color-ask: #2B7FB5;
>
> \--color-hear: #34D399;
>
> \--color-see: #FBBF24;
>
> \--color-remix: #A78BFA;
>
> /\* Semantic \*/
>
> \--color-positive: #059669;
>
> \--color-negative: #EF4444;
>
> \--color-warning: #D97706;
>
> /\* Typography \*/
>
> \--font-display: \'Instrument Serif\', Georgia, serif;
>
> \--font-body: \'DM Sans\', system-ui, sans-serif;
>
> \--font-mono: \'DM Mono\', monospace;
>
> /\* Spacing \*/
>
> \--space-xs: 4px;
>
> \--space-sm: 8px;
>
> \--space-md: 16px;
>
> \--space-lg: 24px;
>
> \--space-xl: 32px;
>
> \--space-2xl: 48px;
>
> /\* Radii \*/
>
> \--radius-sm: 6px;
>
> \--radius-md: 12px;
>
> \--radius-lg: 20px;
>
> \--radius-xl: 24px;
>
> }

**12.4 Animation Keyframes**

> \@keyframes fadeSlideUp {
>
> from { opacity: 0; transform: translateY(12px); }
>
> to { opacity: 1; transform: translateY(0); }
>
> }
>
> \@keyframes slideIn {
>
> from { opacity: 0; transform: translateY(20px); }
>
> to { opacity: 1; transform: translateY(0); }
>
> }
>
> \@keyframes pulse {
>
> 0%, 100% { opacity: 0.3; transform: scale(0.8); }
>
> 50% { opacity: 1; transform: scale(1.1); }
>
> }
>
> \@media (prefers-reduced-motion: reduce) {
>
> \*, \*::before, \*::after {
>
> animation-duration: 0.01ms !important;
>
> transition-duration: 0.01ms !important;
>
> }
>
> }

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Next Steps**                                                                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                                             |
| This guide documents the UX prototype as built. During implementation, integrate with the Mastra agent backend (see Mastra Agent Implementation Guide) to replace simulated responses with live Nova model output. The CopilotKit Generative UI actions will render the same chart components shown here but populated with real-time Convex query results. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
