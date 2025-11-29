# Rizzbot - Your AI Wingman for Texting

Your AI-powered texting coach that helps you craft the perfect responses.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```

2. Set up your API key:
   - Copy `.env.local.example` to `.env.local`
   - Add your Gemini API key: `GEMINI_API_KEY=your_key_here`

3. Run the app:
   ```
   npm run dev
   ```

## Deploy to Cloudflare Pages

When deploying, make sure to set the environment variable `GEMINI_API_KEY` in your Cloudflare Pages dashboard under Settings > Environment variables.
