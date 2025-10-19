export default function SecurityMeasures() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-6">Security Measures and Data Flow</h1>
        
        <p className="text-base leading-relaxed mb-8">
          This document describes Trellis LLC security controls and how data flows through our platform and AI providers based on the current implementation.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Architecture Overview</h2>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
            <ul className="list-disc pl-6 space-y-2 mb-0">
              <li>Next.js App Router with React Server Components.</li>
              <li>Authentication and session via Supabase SSR using httpOnly cookies.</li>
              <li>Application data in Postgres (managed) accessed via Prisma.</li>
              <li>Retrieval-Augmented Generation (RAG): OpenAI Embeddings; embeddings and source chunks stored in Postgres.</li>
              <li>AI text generation: Anthropic (primary), OpenAI (fallback), and Groq (OpenAI-compatible) for some paths.</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Categories</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Account metadata for staff users (email, name, role, school).</li>
            <li>Observation/evaluation content including free-text notes and summaries.</li>
            <li>RAG/chat content and derived embeddings.</li>
          </ul>
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 my-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-0">
              We do not intentionally collect student personal information. Staff are advised to avoid including student PII in free-text fields.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Security Controls</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-base mb-0">Encryption in transit (TLS) and at rest (managed Postgres defaults).</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-base mb-0">Strict session handling via Supabase SSR; cookies set as httpOnly, sameSite=lax, secure in production.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-base mb-0">Role-based access control enforced at application level.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-base mb-0">Content Security Policy limiting external connections to Supabase, Anthropic, OpenAI, and Groq; clickjacking and referrer protections enabled.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-base mb-0">Secret management via environment variables; least-privilege access for operators.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-base mb-0">Rate limiting on sensitive API routes where applicable.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Flow to AI Providers</h2>
          <p className="mb-4">
            When a staff user invokes enhancement or evaluation features, the Service may send relevant free-text input and minimal context to AI providers to generate outputs. The following apply:
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2">Anthropic (Claude)</h3>
              <p className="text-sm text-purple-900 dark:text-purple-200 mb-0">
                Primary provider for generation; prompts may include staff-entered notes. Outputs (e.g., enhanced notes) may be stored in Postgres.
              </p>
            </div>

            <div className="border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-2">OpenAI</h3>
              <p className="text-sm text-emerald-900 dark:text-emerald-200 mb-0">
                Fallback for generation and used for embeddings. Only necessary text is sent to obtain embeddings or generation outputs.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">Groq</h3>
              <p className="text-sm text-blue-900 dark:text-blue-200 mb-0">
                OpenAI-compatible provider used on certain generation paths.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 italic">
            The application does not implement third-party prompt logging; however, providers may process data per their own policies and DPAs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Retention and Deletion</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Data retained for the duration of the LEA relationship or as required by law.</li>
            <li>Upon verified LEA request, Trellis will delete or return data within a commercially reasonable timeframe, subject to provider backups.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Incident Response</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We maintain procedures for detection, investigation, containment, and notification.</li>
            <li>LEA will be notified without undue delay upon confirmation of a breach affecting Student Data.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Vulnerability Management</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Regular maintenance updates and dependency management.</li>
            <li>Security headers enforced via middleware (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).</li>
          </ul>
        </section>

        <section className="mb-8 border-t border-gray-300 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5">
            <p className="mb-2">
              For security inquiries, contact Trellis LLC at:
            </p>
            <p className="font-medium mb-0">
              [CONTACT_EMAIL]
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}