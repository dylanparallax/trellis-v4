export const metadata = {
  title: 'Security Measures and Data Flow – Trellis LLC',
  description: 'Security, architecture, and AI data flows (Anthropic/OpenAI/Groq) as implemented in Trellis LLC.',
}

export default function Page() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Security Measures and Data Flow</h1>
      <p>This document describes Trellis LLC security controls and how data flows through our platform and AI providers based on the current implementation.</p>

      <h2>Architecture Overview</h2>
      <ul>
        <li>Next.js App Router with React Server Components.</li>
        <li>Authentication and session via Supabase SSR using httpOnly cookies.</li>
        <li>Application data in Postgres (managed) accessed via Prisma.</li>
        <li>Retrieval-Augmented Generation (RAG): OpenAI Embeddings; embeddings and source chunks stored in Postgres.</li>
        <li>AI text generation: Anthropic (primary), OpenAI (fallback), and Groq (OpenAI-compatible) for some paths.</li>
      </ul>

      <h2>Data Categories</h2>
      <ul>
        <li>Account metadata for staff users (email, name, role, school).</li>
        <li>Observation/evaluation content including free-text notes and summaries.</li>
        <li>RAG/chat content and derived embeddings.</li>
      </ul>
      <p>We do not intentionally collect student personal information. Staff are advised to avoid including student PII in free-text fields.</p>

      <h2>Security Controls</h2>
      <ul>
        <li>Encryption in transit (TLS) and at rest (managed Postgres defaults).</li>
        <li>Strict session handling via Supabase SSR; cookies set as httpOnly, sameSite=lax, secure in production.</li>
        <li>Role-based access control enforced at application level.</li>
        <li>Content Security Policy limiting external connections to Supabase, Anthropic, OpenAI, and Groq; clickjacking and referrer protections enabled.</li>
        <li>Secret management via environment variables; least-privilege access for operators.</li>
        <li>Rate limiting on sensitive API routes where applicable.</li>
      </ul>

      <h2>Data Flow to AI Providers</h2>
      <p>When a staff user invokes enhancement or evaluation features, the Service may send relevant free-text input and minimal context to AI providers to generate outputs. The following apply:</p>
      <ul>
        <li><strong>Anthropic (Claude)</strong>: Primary provider for generation; prompts may include staff-entered notes. Outputs (e.g., enhanced notes) may be stored in Postgres.</li>
        <li><strong>OpenAI</strong>: Fallback for generation and used for embeddings. Only necessary text is sent to obtain embeddings or generation outputs.</li>
        <li><strong>Groq</strong>: OpenAI-compatible provider used on certain generation paths.</li>
      </ul>
      <p>The application does not implement third-party prompt logging; however, providers may process data per their own policies and DPAs.</p>

      <h2>Retention and Deletion</h2>
      <ul>
        <li>Data retained for the duration of the LEA relationship or as required by law.</li>
        <li>Upon verified LEA request, Trellis will delete or return data within a commercially reasonable timeframe, subject to provider backups.</li>
      </ul>

      <h2>Incident Response</h2>
      <ul>
        <li>We maintain procedures for detection, investigation, containment, and notification.</li>
        <li>LEA will be notified without undue delay upon confirmation of a breach affecting Student Data.</li>
      </ul>

      <h2>Vulnerability Management</h2>
      <ul>
        <li>Regular maintenance updates and dependency management.</li>
        <li>Security headers enforced via middleware (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).</li>
      </ul>

      <h2>Contact</h2>
      <p>For security inquiries, contact Trellis LLC at [CONTACT_EMAIL].</p>
    </article>
  )
}


