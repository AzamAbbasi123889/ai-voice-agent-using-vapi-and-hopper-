# Preuss | Foster — AI Receptionist Concept Demo

A premium, responsive React + TypeScript demo for illustrating how a law-office receptionist could handle first inquiries, initial non-sensitive intake, consultation preferences and staff routing.

> **Concept demo only.** This project is not an official law-firm service and must not be presented as connected to the firm's actual staff, calendar, phone system, client database or case-management tools.

## Features

- Editorial boutique-law-office design with responsive mobile navigation.
- Five interactive scripted workflows that run without API credentials.
- Clear scripted-preview labels and fictional on-screen intake summaries.
- Vapi Web SDK integration for genuine browser voice calls after configuration.
- Actual Vapi final transcript messages, call events, volume status, mute and end-call controls.
- Friendly error handling for missing configuration and failed calls.
- No database and no browser storage for transcript persistence.
- GitHub Pages deployment through GitHub Actions.
- Accessible labels, keyboard focus styles, semantic sections and reduced-motion support.

## Requirements

- Node.js 20 or newer and npm.
- A Vapi account if you need live browser voice.
- A Vapi assistant configured with a compatible speech provider and transcription provider.
- Optional Hopper account/API credentials for using Hopper as the model provider behind Vapi.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. The scripted scenario cards work without credentials.

Before publishing, run:

```bash
npm run typecheck
npm run build
npm run preview
```

## Enable live Vapi voice

1. Create or select an assistant in the [Vapi dashboard](https://dashboard.vapi.ai/).
2. Configure the assistant's first message, model, voice, transcription and system prompt. Use the complete text in [`receptionist-system-prompt.md`](./receptionist-system-prompt.md).
3. Copy the Vapi **Public Key** and the assistant ID. Do not use a Vapi private API key in the browser.
4. Add the values to `.env.local`:

   ```env
   VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
   VITE_VAPI_ASSISTANT_ID=your_assistant_id
   ```

5. Restart Vite after changing the environment file. For Vite, `VITE_` values are bundled into the static frontend and visible to site visitors; only public values belong here.
6. Open the page on `localhost` or HTTPS, approve microphone access when prompted, and press **Start live conversation**. Test start/end repeatedly and verify the assistant respects the system prompt.

The site uses `@vapi-ai/web`. It listens to Vapi `call-start`, `call-end`, `speech-start`, `speech-end`, `volume-level`, `message` and `error` events. Actual transcripts are accepted from final Vapi transcript messages; the scripted preview is separately labeled.

### Configure Hopper through Vapi

The intended setup described for this demo is Vapi's Custom LLM provider, Hopper's OpenAI-compatible endpoint, and model `gemma-4-31b`. The endpoint supplied for this project is `https://api.withhopper.com/v1`.

In Vapi's model settings, select **Custom LLM** (wording may vary), enter the endpoint and model supported by your Hopper account, and store the Hopper API credential in Vapi's provider/model configuration. **Do not put the Hopper API key in `.env`, a Vite variable, GitHub Pages variables or frontend source.**

Provider fields and model names can change. Before using this in production, verify the exact endpoint, model identifier, authentication format and compatibility with Vapi in the current Hopper and Vapi dashboards/docs. Configure speech-to-text and text-to-speech separately with providers supported by Vapi; do not assume a text-model endpoint also provides speech.

## GitHub Pages deployment

This repository includes [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). It builds on pushes to `main` and deploys the `dist/` directory to GitHub Pages. Vite automatically uses the GitHub repository's subpath during Actions builds.

1. Push this project to a GitHub repository with the default branch named `main`.
2. On GitHub, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. For live mode, open **Settings → Secrets and variables → Actions → Variables** and create:
   - `VITE_VAPI_PUBLIC_KEY`
   - `VITE_VAPI_ASSISTANT_ID`
4. The workflow passes those **public** values into the Vite build. They are visible in the deployed JavaScript, so never store private credentials there.
5. Push to `main` or use **Actions → Build and deploy to GitHub Pages → Run workflow**. Check the workflow run before sharing the Pages URL.

If the variables are not set, the site safely stays in scripted preview mode. You do not need to put any Hopper secret in GitHub.

## Optional production integrations

The current public demo does **not** save leads, access a real calendar, transfer calls, notify staff, or write to a CRM. Before adding these capabilities, implement and test authenticated server-side integrations for consultation requests, intake submission, office-information lookup and staff routing. Use minimum necessary data, access controls, retention limits, clear consent and audit-friendly error handling. Do not make privileged API calls from browser code.

## Privacy and legal review

The demo deliberately uses fictional details and does not persist transcripts to local storage or a database. Live call audio/transcription may be processed by Vapi and the configured model/speech providers according to their settings and terms.

Before a production rollout, the firm should approve the wording, recording disclosures, consent process, privacy notice, retention policy, vendor/data-processing arrangements, applicable legal/ethical requirements and the verified office information. Do not suggest that using the demo forms an attorney-client relationship or guarantees confidentiality.

## Manual configuration still required

- Vapi public key and assistant ID for browser live voice.
- Assistant settings and a compatible voice/transcription provider in Vapi.
- Hopper account/model provider setup in Vapi if Hopper is selected.
- GitHub Pages setting set to GitHub Actions and repository variables if enabling live mode on Pages.
- A secure backend and firm-approved integrations for any real intake submission, office routing or booking.
- Firm review and approval of all copy, privacy and legal boundaries before client-facing deployment.

## Project structure

```text
src/
  App.tsx                 Main responsive experience and demo interactions
  hooks/useVapi.ts        Vapi client lifecycle, events, transcript, mute and stop
  lib/scenarios.ts        Five fictional scripted demo workflows
  styles.css              Theme, layout, responsive styles and motion controls
  main.tsx                React entry point
.github/workflows/
  deploy.yml              GitHub Pages CI/CD
receptionist-system-prompt.md
.env.example
```

## QA checklist

- [x] Scripted preview works without Vapi configuration.
- [x] Five scenario cards populate the transcript and simulated summary.
- [x] Scenario input guards against common sensitive-detail patterns.
- [x] Live mode checks for missing credentials before starting.
- [x] Live mode uses Vapi events for connection status and final transcript messages.
- [x] Mute/end controls are wired to the Vapi SDK.
- [x] No database or local-storage transcript persistence.
- [x] GitHub Pages workflow and subpath-aware Vite base configured.
- [ ] Live call, microphone permission and Vapi transcript handling must be tested with your actual Vapi assistant credentials.
- [ ] Hopper configuration must be validated in the connected account.
- [ ] GitHub Pages deployment must be run after this project is pushed.
