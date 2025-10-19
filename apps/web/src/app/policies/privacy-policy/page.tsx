export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy (SOPIPA)</h1>
        
        <p className="text-base leading-relaxed mb-6">
          Effective as of [EFFECTIVE_DATE]. This Privacy Policy describes how Trellis LLC (&quot;Trellis&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, discloses, and safeguards information in connection with our educator observation and evaluation platform (the &quot;Service&quot;). This policy is aligned with California&apos;s Student Online Personal Information Protection Act (SOPIPA) for K–12 contexts. If you are a Local Education Agency (LEA), district, or school, this policy should be read together with any Data Processing Agreement (DPA) in place.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Scope and Roles</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We operate as an &quot;operator&quot; under SOPIPA for LEAs using the Service.</li>
            <li>We do not build profiles for targeted advertising and do not sell personal information.</li>
            <li>We provide product functionality to staff users (e.g., evaluators, administrators, teachers). The Service is not directed to students.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data We Process</h2>
          <p className="mb-4">We use Supabase for authentication and Postgres (via Prisma) for application storage. The Service may process the following information provided by staff users:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Account and school data: user email, name, role, school affiliation.</li>
            <li>Observation and evaluation content: free-text notes, summaries, recommendations, and structured rubric data.</li>
            <li>RAG and chat content: conversation messages used to assist staff workflows; embeddings derived from text via OpenAI Embeddings.</li>
          </ul>
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 my-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              <strong>Important:</strong> We do not intentionally collect student personal information. However, free-text fields (e.g., observation notes) could incidentally include student references if entered by staff. We provide guidance to avoid including student PII in free text.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and improve the Service, including text enhancement and evaluation generation with Anthropic (primary), OpenAI (fallback), and, in some paths, Groq.</li>
            <li>To support RAG features: we compute embeddings with OpenAI and store them with related text to improve retrieval for staff.</li>
            <li>For security, troubleshooting, and required service communications.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">SOPIPA Commitments</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <ul className="list-disc pl-6 space-y-3 mb-0">
              <li>No targeted advertising based on information acquired through the Service.</li>
              <li>No sale of covered information.</li>
              <li>No building of profiles for purposes other than K–12 school purposes requested by the LEA.</li>
              <li>Use limitation: we process information solely to provide the Service and as permitted by law or contract.</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Service Providers</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Supabase</strong> (authentication and managed Postgres).</li>
            <li><strong>Anthropic (Claude)</strong> for AI text generation (primary).</li>
            <li><strong>OpenAI</strong> for AI text generation (fallback) and embeddings for RAG.</li>
            <li><strong>Groq</strong> (OpenAI-compatible) for certain generation paths.</li>
          </ul>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We share information with these providers only to the extent necessary to deliver the Service features. Prompts to AI providers may include free-text content submitted by staff. Generated outputs (e.g., enhanced notes) may be stored in our database.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Security Measures</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption in transit via TLS for all network communications.</li>
            <li>At-rest encryption via managed Postgres (per provider defaults).</li>
            <li>Access control by user role; httpOnly session cookies managed via Supabase SSR.</li>
            <li>Content Security Policy (CSP) restricting connections to Supabase, Anthropic, OpenAI, and Groq; clickjacking protections and strict referrer policy.</li>
            <li>Environment-based secret management; least-privilege operational access.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Retention and Deletion</h2>
          <p>
            We retain information for the term of the LEA relationship or as required by law. Upon verified request from the LEA, we will delete or return covered information within a commercially reasonable timeframe, subject to legal holds and provider backups.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Deidentified and Aggregated Data</h2>
          <p>
            We may use deidentified and aggregated information for service improvement and analytics. We will not attempt to reidentify deidentified data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Incident Response</h2>
          <p>
            We maintain procedures for detecting, investigating, and notifying the LEA of security incidents consistent with applicable law and contractual timelines.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Student and Parent Rights</h2>
          <p>
            Requests to access, correct, or delete student information should be initiated through the LEA. We will support the LEA in fulfilling such verified requests.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
          <p>
            We may update this policy to reflect changes to the Service or applicable law. We will provide notice of material changes via the Service or to the LEA.
          </p>
        </section>

        <section className="mb-8 border-t border-gray-300 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5">
            <p className="mb-2">
              For privacy inquiries, please contact Trellis LLC at:
            </p>
            <p className="font-medium">
              Email: [CONTACT_EMAIL]
            </p>
            <p className="font-medium">
              Address: [CONTACT_ADDRESS]
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              For DPAs, use the contact information in the agreement.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}