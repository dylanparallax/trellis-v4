import Link from 'next/link'

export const metadata = {
  title: 'Policies Index – Trellis LLC',
  description: 'Index of privacy, security, data processing, and accessibility policies for Trellis LLC.',
}

export default function Page() {
  const links = [
    { href: '/policies/privacy-policy', title: 'Privacy Policy (SOPIPA)' },
    { href: '/policies/data-processing-agreement', title: 'Data Processing Agreement (California – CSDPA-Style)' },
    { href: '/policies/security-measures', title: 'Security Measures and Data Flow' },
    { href: '/policies/accessibility-vpat', title: 'Accessibility Conformance Report (WCAG 2.1 AA)' },
  ]
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <p>Find Trellis LLC policy documents below. These documents reflect the current architecture and services used by the application.</p>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <Link className="no-underline hover:underline" href={l.href}>{l.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}


