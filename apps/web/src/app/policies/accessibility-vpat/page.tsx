export const metadata = {
  title: 'Accessibility Conformance Report (WCAG 2.1 AA) – Trellis LLC',
  description: 'VPAT/ACR summary of conformance to WCAG 2.1 Level AA for Trellis LLC.',
}

type Criterion = {
  id: string
  name: string
  level: 'A' | 'AA' | 'AAA'
  status: 'Supports' | 'Partially Supports' | 'Does Not Support' | 'Not Applicable'
  remarks: string
}

const criteria: Criterion[] = [
  { id: '1.1.1', name: 'Non-text Content', level: 'A', status: 'Supports', remarks: 'Informative images have alt text; decorative images are ignored.' },
  { id: '1.3.1', name: 'Info and Relationships', level: 'A', status: 'Supports', remarks: 'Semantic headings, lists, and landmarks used throughout.' },
  { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', status: 'Supports', remarks: 'Meets 4.5:1 for text; dark mode uses #222 for comfort.' },
  { id: '1.4.10', name: 'Reflow', level: 'AA', status: 'Supports', remarks: 'Responsive layout; content reflows without loss up to 400% zoom.' },
  { id: '2.1.1', name: 'Keyboard', level: 'A', status: 'Supports', remarks: 'All interactive elements operable by keyboard; visible focus.' },
  { id: '2.4.3', name: 'Focus Order', level: 'A', status: 'Supports', remarks: 'Logical tab order; skip-to-content patterns used where applicable.' },
  { id: '2.4.6', name: 'Headings and Labels', level: 'AA', status: 'Supports', remarks: 'Clear and descriptive headings and labels.' },
  { id: '3.2.3', name: 'Consistent Navigation', level: 'AA', status: 'Supports', remarks: 'Navigation placement and styling are consistent across pages.' },
  { id: '3.3.1', name: 'Error Identification', level: 'A', status: 'Supports', remarks: 'Forms identify errors with text and ARIA when applicable.' },
  { id: '4.1.2', name: 'Name, Role, Value', level: 'A', status: 'Supports', remarks: 'Controls expose name/role/value via semantic HTML/ARIA.' },
]

export default function Page() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Accessibility Conformance Report (ACR)</h1>
      <p>
        This ACR documents conformance of the Trellis LLC web application with WCAG 2.1 Level AA criteria. Testing includes keyboard navigation,
        screen reader semantics, contrast checks, and responsive reflow. The application uses semantic HTML, accessible components, and Tailwind CSS-based
        patterns with dark mode support.
      </p>

      <h2>Standards and Guidelines</h2>
      <ul>
        <li>WCAG 2.1, Levels A and AA</li>
        <li>WAI-ARIA 1.2 authoring practices for interactive controls</li>
      </ul>

      <h2>Evaluation Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Level</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => (
            <tr key={c.id}>
              <td>{c.id} {c.name}</td>
              <td>{c.level}</td>
              <td>{c.status}</td>
              <td>{c.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Assistive Technology Support</h2>
      <ul>
        <li>Keyboard-only navigation supported; visible focus indicators present.</li>
        <li>Landmarks and headings convey structure to screen readers.</li>
        <li>Form errors announced via text and ARIA where applicable.</li>
      </ul>

      <h2>Known Gaps and Roadmap</h2>
      <ul>
        <li>Continuous audit of dynamic components and charts for ARIA labeling.</li>
        <li>Ongoing color contrast verification for newly added brand elements.</li>
      </ul>

      <h2>Contact</h2>
      <p>Accessibility feedback: [CONTACT_EMAIL]. We address valid issues promptly and track remediation to meet WCAG 2.1 AA.</p>
    </article>
  )
}


