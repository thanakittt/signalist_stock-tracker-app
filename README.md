# Signalist

Signalist is a stock market dashboard built with Next.js. It combines live market
widgets, stock search, company insights, and personalized email workflows in one
responsive application.

## Features

- Email and password authentication with personalized onboarding
- Market overview, heatmap, quotes, and financial news from TradingView
- Stock search powered by Finnhub
- Detailed stock pages with charts, technical analysis, company profiles, and
  financial statements
- AI-generated welcome emails and daily market summaries
- Responsive dark interface for desktop and mobile

## Tech Stack

- [Next.js 16](https://nextjs.org/) and [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/) with
  [Mongoose](https://mongoosejs.com/)
- [Better Auth](https://www.better-auth.com/)
- [Finnhub](https://finnhub.io/) and
  [TradingView widgets](https://www.tradingview.com/widget-docs/)
- [Inngest](https://www.inngest.com/) with Google Gemini
- [Nodemailer](https://nodemailer.com/)

## Prerequisites

Before getting started, install:

- [Node.js](https://nodejs.org/) 20.9 or later
- npm (included with Node.js)
- A MongoDB database
- API credentials for Finnhub and Google Gemini
- A Gmail account with an app password for outgoing emails

## Getting Started

Clone the repository and enter the project directory:

```bash
git clone https://github.com/thanakittt/signalist_stock-tracker-app.git stocks-app
cd stocks-app
```

Install the dependencies:

```bash
npm ci
```

Create a local environment file:

```bash
touch .env.local
```

Add the following values to `.env.local`:

```dotenv
MONGO_DB=mongodb+srv://<username>:<password>@<cluster>/<database>

BETTER_AUTH_SECRET=<random-secret>
BETTER_AUTH_URL=http://localhost:3000

FINNHUB_API_KEY=<finnhub-api-key>
GEMINI_API_KEY=<gemini-api-key>

NODEMAILER_EMAIL=<gmail-address>
NODEMAILER_PASSWORD=<gmail-app-password>
```

You can generate a Better Auth secret from a Bash terminal with:

```bash
openssl rand -base64 32
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
| --- | --- |
| `MONGO_DB` | MongoDB connection string used by Mongoose and Better Auth |
| `BETTER_AUTH_SECRET` | Secret used to sign and encrypt authentication data |
| `BETTER_AUTH_URL` | Base URL of the application |
| `FINNHUB_API_KEY` | Server-side Finnhub key used for stock search and market news |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Optional public fallback for the Finnhub key |
| `GEMINI_API_KEY` | Google Gemini key used by Inngest AI workflows |
| `NODEMAILER_EMAIL` | Gmail address used to authenticate the email transporter |
| `NODEMAILER_PASSWORD` | Gmail app password used to send emails |
| `INNGEST_EVENT_KEY` | Production key used to send events to Inngest |
| `INNGEST_SIGNING_KEY` | Production key used to verify requests from Inngest |

Keep secrets in `.env.local`. Environment files are excluded from Git by the
project's `.gitignore`.

## Background Workflows

The Inngest endpoint is available at `/api/inngest` and registers two workflows:

- A personalized welcome email after account creation
- A daily AI-generated market news summary

To test these workflows locally, keep the Next.js development server running and
start the Inngest development server in a second Bash terminal:

```bash
npx inngest-cli@latest dev
```

## Available Scripts

```bash
npm run dev
```

Runs the application in development mode.

```bash
npm run lint
```

Checks the project with ESLint.

```bash
npm run build
```

Creates an optimized production build.

```bash
npm run start
```

Starts the optimized production server after a successful build.

## Project Structure

```text
app/            Next.js routes, layouts, and API handlers
components/     Reusable application and UI components
database/       MongoDB connection and Mongoose models
hooks/          Client-side React hooks
lib/actions/    Server actions for auth, stocks, users, and watchlists
lib/inngest/    Background workflow definitions and AI prompts
lib/nodemailer/ Email transport and HTML templates
middleware/     Authentication middleware
public/         Static images and icons
types/          Shared TypeScript declarations
```

## Production

Create and run a production build locally:

```bash
npm run build
npm run start
```

When deploying, configure the local environment variables on your hosting
provider, set `BETTER_AUTH_URL` to the public application URL, and add
`INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from your Inngest environment.
