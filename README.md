# TesdaBot

**TesdaBot** is a premium academic AI assistant designed specifically for vocational students in the Philippines. It provides specialized tutoring, guidance on NCII Training Regulations, and technical mastery support within a modern, responsive web interface.

---

## Features

- **Context-Aware AI Tutoring**: Powered by DeepSeek, providing tailored assistance based on the student's current track and module.
- **NCII Mastery Focus**: Specialized knowledge in Philippine vocational training standards.
- **Persistent Chat History**: Automatically saves conversations for students to refer back to.
- **Modern Design System**: A "Premium Academic" aesthetic built with Bootstrap and custom CSS.
- **Real-time Interaction**: Fast responses with Supabase Edge Functions.

## Tech Stack

- **Frontend**: React 19 (Vite), Bootstrap 5, Sass, Lucide Icons.
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions).
- **AI Engine**: DeepSeek Chat API.
- **State Management**: SWR for efficient data fetching.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development or deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/se4n-d0m1n1c/TesdaBot.git
cd TesdaBot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory and add your credentials:

```env
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
VITE_AI_PROVIDER="openai" # or 'mock' for testing
VITE_AI_API_KEY="YOUR_DEEPSEEK_OR_OPENAI_KEY"
```

### 4. Database Setup (Supabase)

Initialize your Supabase project and apply migrations:

```bash
supabase link --project-ref your-project-id
supabase db push
```

### 5. Deploy Edge Functions

Ensure you have set the `DEEPSEEK_API_KEY` in your Supabase secrets:

```bash
supabase secrets set DEEPSEEK_API_KEY=your_key_here
supabase functions deploy chat
```

### 6. Run Locally

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Project Structure

- `src/components`: UI components (Chatbot, Dashboard, etc.).
- `supabase/migrations`: SQL scripts for database schema and RLS policies.
- `supabase/functions`: Edge functions for AI integration.
- `docs/`: Additional documentation and assets.
