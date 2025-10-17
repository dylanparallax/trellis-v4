export const metadata = {
  title: 'Privacy Policy (SOPIPA) – Trellis LLC',
  description: 'SOPIPA-aligned privacy policy tailored to the Trellis LLC stack and data flows.',
}

export default function Page() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Privacy Policy (SOPIPA)</h1>
      <p>Effective as of [EFFECTIVE_DATE]. This Privacy Policy describes how Trellis LLC ("Trellis", "we", "us") collects, uses, discloses, and safeguards information in connection with our educator observation and evaluation platform (the "Service"). This policy is aligned with California’s Student Online Personal Information Protection Act (SOPIPA) for K–12 contexts. If you are a Local Education Agency (LEA), district, or school, this policy should be read together with any Data Processing Agreement (DPA) in place.</p>

      <h2>Scope and Roles</h2>
      <ul>
        <li>We operate as an "operator" under SOPIPA for LEAs using the Service.</li>
        <li>We do not build profiles for targeted advertising and do not sell personal information.</li>
        <li>We provide product functionality to staff users (e.g., evaluators, administrators, teachers). The Service is not directed to students.</li>
      </ul>

      <h2>Data We Process</h2>
      <p>We use Supabase for authentication and Postgres (via Prisma) for application storage. The Service may process the following information provided by staff users:</p>
      <ul>
        <li>Account and school data: user email, name, role, school affiliation.</li>
        <li>Observation and evaluation content: free-text notes, summaries, recommendations, and structured rubric data.</li>
        <li>RAG and chat content: conversation messages used to assist staff workflows; embeddings derived from text via OpenAI Embeddings.</li>
      </ul>
      <p>Important: We do not intentionally collect student personal information. However, free-text fields (e.g., observation notes) could incidentally include student references if entered by staff. We provide guidance to avoid including student PII in free text.</p>

      <h2>How We Use Information</h2>
      <ul>
        <li>To provide and improve the Service, including text enhancement and evaluation generation with Anthropic (primary), OpenAI (fallback), and, in some paths, Groq.</li>
        <li>To support RAG features: we compute embeddings with OpenAI and store them with related text to improve retrieval for staff.</li>
        <li>For security, troubleshooting, and required service communications.</li>
      </ul>

      <h2>SOPIPA Commitments</h2>
      <ul>
        <li>No targeted advertising based on information acquired through the Service.</li>
        <li>No sale of covered information.</li>
        <li>No building of profiles for purposes other than K–12 school purposes requested by the LEA.</li>
        <li>Use limitation: we process information solely to provide the Service and as permitted by law or contract.</li>
      </ul>

      <h2>Third-Party Service Providers</h2>
      <ul>
        <li>Supabase (authentication and managed Postgres).</li>
        <li>Anthropic (Claude) for AI text generation (primary).</li>
        <li>OpenAI for AI text generation (fallback) and embeddings for RAG.</li>
        <li>Groq (OpenAI-compatible) for certain generation paths.</li>
      </ul>
      <p>We share information with these providers only to the extent necessary to deliver the Service features. Prompts to AI providers may include free-text content submitted by staff. Generated outputs (e.g., enhanced notes) may be stored in our database.</p>

      <h2>Security Measures</h2>
      <ul>
        <li>Encryption in transit via TLS for all network communications.</li>
        <li>At-rest encryption via managed Postgres (per provider defaults).</li>
        <li>Access control by user role; httpOnly session cookies managed via Supabase SSR.</li>
        <li>Content Security Policy (CSP) restricting connections to Supabase, Anthropic, OpenAI, and Groq; clickjacking protections and strict referrer policy.</li>
        <li>Environment-based secret management; least-privilege operational access.</li>
      </ul>

      <h2>Retention and Deletion</h2>
      <p>We retain information for the term of the LEA relationship or as required by law. Upon verified request from the LEA, we will delete or return covered information within a commercially reasonable timeframe, subject to legal holds and provider backups.</p>

      <h2>Deidentified and Aggregated Data</h2>
      <p>We may use deidentified and aggregated information for service improvement and analytics. We will not attempt to reidentify deidentified data.</p>

      <h2>Incident Response</h2>
      <p>We maintain procedures for detecting, investigating, and notifying the LEA of security incidents consistent with applicable law and contractual timelines.</p>

      <h2>Student and Parent Rights</h2>
      <p>Requests to access, correct, or delete student information should be initiated through the LEA. We will support the LEA in fulfilling such verified requests.</p>

      <h2>Changes to This Policy</h2>
      <p>We may update this policy to reflect changes to the Service or applicable law. We will provide notice of material changes via the Service or to the LEA.</p>

      <h2>Contact</h2>
      <p>For privacy inquiries, please contact Trellis LLC at [CONTACT_EMAIL] or [CONTACT_ADDRESS]. For DPAs, use the contact information in the agreement.</p>
    </article>
  )
}


