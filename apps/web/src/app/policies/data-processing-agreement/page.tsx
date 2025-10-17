export const metadata = {
  title: 'Data Processing Agreement (California CSDPA-Style) – Trellis LLC',
  description: 'California Student Data Privacy Agreement–style DPA tailored to Trellis LLC and actual data flows.',
}

export default function Page() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Data Processing Agreement</h1>
      <p>
        This Data Processing Agreement ("Agreement") is entered into as of [EFFECTIVE_DATE] between Trellis LLC ("Provider")
        and [LEA_NAME] ("LEA"), collectively the "Parties". This Agreement follows the structure and substantive protections of
        the California Student Data Privacy Agreement (CSDPA/NDPA style) and applies to Provider's educator observation and evaluation platform.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li><strong>Student Data</strong>: information relating to a K–12 student that is provided by LEA users or collected on behalf of LEA.</li>
        <li><strong>Covered Information</strong>: information subject to SOPIPA and applicable student privacy laws.</li>
        <li><strong>Services</strong>: Provider's web-based platform used by LEA staff for observations, evaluations, and related workflows.</li>
      </ul>

      <h2>2. Roles and Scope</h2>
      <ul>
        <li>LEA acts as controller/owner of Student Data; Provider acts as service provider/operator processing on behalf of LEA.</li>
        <li>Provider shall process Student Data solely to provide the Services and as instructed by LEA.</li>
        <li>Provider does not sell Student Data and does not engage in targeted advertising.</li>
      </ul>

      <h2>3. Data Ownership and Access</h2>
      <ul>
        <li>LEA retains all ownership rights in Student Data.</li>
        <li>LEA may access, export, correct, and delete Student Data during the term.</li>
        <li>Upon request or termination, Provider will delete or return Student Data, subject to legal holds and backups.</li>
      </ul>

      <h2>4. Data Categories and Sources</h2>
      <p>The Services primarily store staff-entered content and metadata in Postgres (via Prisma), authenticated via Supabase:</p>
      <ul>
        <li>User account data: staff email, name, role, and school affiliations.</li>
        <li>Observation/Evaluation content: free-text notes, summaries, recommendations, and rubric-aligned data.</li>
        <li>RAG and chat content: staff-entered messages; embeddings derived via OpenAI Embeddings.</li>
      </ul>
      <p>Note: The Services do not intentionally collect Student Data; however, staff free-text may incidentally reference students.</p>

      <h2>5. Subprocessors</h2>
      <p>Provider uses subprocessors necessary to deliver the Services. Provider shall impose written obligations providing at least the same level of protection.</p>
      <ul>
        <li>Supabase: authentication and managed Postgres database.</li>
        <li>Anthropic (Claude): AI text generation (primary).</li>
        <li>OpenAI: AI text generation (fallback) and embeddings for RAG.</li>
        <li>Groq: OpenAI-compatible API for certain generation paths.</li>
      </ul>
      <p>Provider will maintain an up-to-date list of subprocessors and notify LEA of material changes where required.</p>

      <h2>6. Security</h2>
      <ul>
        <li>Encryption in transit via TLS; at-rest encryption via managed Postgres.</li>
        <li>Role-based access control; session security via httpOnly cookies managed with Supabase SSR.</li>
        <li>Secret management via environment variables; least-privilege operational access.</li>
        <li>Content Security Policy limiting external connections; clickjacking and referrer protections.</li>
        <li>Vulnerability management, incident response procedures, and logging appropriate to the Services.</li>
      </ul>

      <h2>7. Confidentiality</h2>
      <p>Provider shall ensure personnel and subprocessors are bound by confidentiality obligations with respect to Student Data.</p>

      <h2>8. Prohibited Uses</h2>
      <ul>
        <li>No sale or disclosure of Student Data except to provide the Services or as required by law.</li>
        <li>No targeted advertising or profiling beyond service provision.</li>
        <li>No use of Student Data to create student profiles unrelated to LEA purposes.</li>
      </ul>

      <h2>9. Breach Notification</h2>
      <p>Provider will notify LEA without undue delay after confirming a breach of security leading to unauthorized access to Student Data, and will cooperate in required notifications.</p>

      <h2>10. Audits and Assessments</h2>
      <p>Upon reasonable written request, Provider will make available information necessary to demonstrate compliance and allow LEA or its designee to conduct assessments, subject to confidentiality and security constraints.</p>

      <h2>11. Data Subject Requests</h2>
      <p>Provider will assist LEA in responding to verified requests to access, correct, or delete Student Data, to the extent applicable.</p>

      <h2>12. Data Deletion and Return</h2>
      <p>At termination or upon LEA instruction, Provider will delete or return Student Data within a commercially reasonable timeframe, subject to legal holds and provider backups.</p>

      <h2>13. Term; Termination</h2>
      <p>This Agreement remains in effect for the term of the Service agreement. Either party may terminate as provided in the Master Agreement.</p>

      <h2>14. Insurance; Indemnification</h2>
      <p>As set forth in the Master Agreement or applicable order form between the Parties.</p>

      <h2>15. Governing Law</h2>
      <p>State of California, without regard to conflict of laws principles, unless otherwise agreed by the Parties.</p>

      <h2>Exhibits</h2>
      <ul>
        <li><strong>Exhibit A</strong> – Security Measures (see Security Measures page)</li>
        <li><strong>Exhibit B</strong> – Data Elements and Purposes</li>
        <li><strong>Exhibit C</strong> – Subprocessor List</li>
      </ul>

      <h2>Signatures</h2>
      <p>
        Trellis LLC, by: ________________________________  Name/Title: __________________  Date: ____________
      </p>
      <p>
        [LEA_NAME], by: _________________________________  Name/Title: __________________  Date: ____________
      </p>
      <p>
        Notices: [CONTACT_EMAIL], [CONTACT_ADDRESS]; For LEA: [DISTRICT_ADDRESS]
      </p>
    </article>
  )
}


