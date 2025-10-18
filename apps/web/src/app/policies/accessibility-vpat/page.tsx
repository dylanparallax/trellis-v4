export default function AccessibilityReport() {
  const criteria = [
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
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-4">Accessibility Conformance Report (ACR)</h1>
        
        <p className="text-lg mb-6">
          This ACR documents conformance of the Trellis LLC web application with WCAG 2.1 Level AA criteria. Testing includes keyboard navigation,
          screen reader semantics, contrast checks, and responsive reflow. The application uses semantic HTML, accessible components, and Tailwind CSS-based
          patterns with dark mode support.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Standards and Guidelines</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>WCAG 2.1, Levels A and AA</li>
          <li>WAI-ARIA 1.2 authoring practices for interactive controls</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Evaluation Summary</h2>
        
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700">
                  Criterion
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {criteria.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    <span className="font-medium">{c.id}</span> {c.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {c.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {c.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Assistive Technology Support</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Keyboard-only navigation supported; visible focus indicators present.</li>
          <li>Landmarks and headings convey structure to screen readers.</li>
          <li>Form errors announced via text and ARIA where applicable.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Known Gaps and Roadmap</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Continuous audit of dynamic components and charts for ARIA labeling.</li>
          <li>Ongoing color contrast verification for newly added brand elements.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact</h2>
        <p className="text-lg">
          Accessibility feedback: <span className="font-medium">[CONTACT_EMAIL]</span>. We address valid issues promptly and track remediation to meet WCAG 2.1 AA.
        </p>
      </article>
    </div>
  );
}