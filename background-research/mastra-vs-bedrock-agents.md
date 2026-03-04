# Mastra vs Bedrock Agents — Architecture Decision

**Budget Compass | Amazon Nova Hackathon | March 2026**

---

## Decision: Use Mastra

Clear answer, no hedge.

---

## The Core Issue

Bedrock Agents and Mastra are both orchestration layers. You don't need both and can't effectively run both. The question is which one to build on — and the answer comes down to one thing that actually matters for your demo.

**CopilotKit Generative UI is your biggest demo differentiator.** Inline charts rendering in the chat stream as the agent responds — that's the visual moment judges remember. That feature runs on the **AG-UI protocol**, and Mastra ships `registerCopilotKit()` as a one-line integration. Bedrock Agents has no native AG-UI support. You'd spend 3+ days building a custom bridge, and it still might not stream properly.

Mastra + CopilotKit is the stack your PRD and Mastra Guide were specifically designed around. That guide is already in your project. The architecture is already mapped out. Don't throw that away.

---

## What Each One Actually Gives You

| | Mastra | Bedrock Agents |
|---|---|---|
| CopilotKit Generative UI (inline charts) | ✅ Native — `registerCopilotKit()` one liner | ❌ No native support, custom bridge required |
| Nova models (hackathon requirement) | ✅ Via `@ai-sdk/amazon-bedrock` | ✅ Native |
| Multi-agent routing | ✅ Sub-agents pattern, already in your guide | ✅ Native |
| RAG over budget PDF | ✅ Calls Bedrock Knowledge Base as a tool | ✅ Native managed |
| Setup time | ✅ `npx mastra dev` and you're running | ❌ Lambda + IAM + OpenSearch Serverless = 2-3 days |
| Local dev/debug | ✅ Playground at localhost:4111 | ❌ AWS console only |
| TypeScript-native tooling | ✅ Zod schemas, typed tools | ❌ JSON schema + Lambda cold starts |
| Session memory | ✅ Built in | ✅ Built in |
| Hackathon story | "We built agents with Mastra + Nova" | Same story, more infrastructure |

---

## The Smart Hybrid

Don't abandon the Bedrock Knowledge Base — use it **from inside Mastra** as one of your tools. Best of both worlds.

```
User question
    ↓
Mastra Query Router (Nova 2 Lite)
    ├── Factual/narrative → searchBudgetDocs tool → Bedrock KB retrieval → answer
    ├── Math/calculation  → queryBudgetData tool  → Convex → verified numbers
    ├── Property lookup   → lookupPropertyLive tool → Nova Act
    └── Chart needed      → renderBudgetChart tool  → CopilotKit renders inline ← the demo moment
```

Bedrock Knowledge Base becomes a **data source**, not an orchestration layer. Mastra stays in charge of everything that touches the UI.

---

## Concrete Next Step

You already have the Mastra guide in your project. Start here — you'll be running in an hour:

```bash
npm install @mastra/core mastra @ai-sdk/amazon-bedrock zod \
  @ag-ui/mastra @copilotkit/runtime \
  @copilotkit/react-core @copilotkit/react-ui

npx mastra dev
# → localhost:4111 playground, test agents immediately
```

Build the Q&A Agent first (Nova 2 Lite + Convex budget data), wire CopilotKit, confirm the inline chart renders. That working loop — **question → agent → chart appears in chat** — is your demo foundation. Everything else (Nova Act, Sonic, Remix) plugs into that foundation as additional Mastra tools.
