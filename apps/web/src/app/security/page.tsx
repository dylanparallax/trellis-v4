import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Database, Eye, CheckCircle2, Server, ArrowLeft } from "lucide-react"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/trellis-light.svg" 
                  alt="Trellis" 
                  width={120} 
                  height={32} 
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </section>

      <section className="pb-20 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                Enterprise-Grade Security
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Trellis is built on industry-leading infrastructure with multiple layers of protection for sensitive educational information. Your district&apos;s data security and privacy is our top priority.
              </p>
            </div>

            <div className="prose prose-lg max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl font-bold mb-4">Our Commitment to Security</h2>
              <p className="text-muted-foreground">
                We understand that educational institutions handle sensitive information about teachers, students, and staff. That&apos;s why we&apos;ve built Trellis with security and privacy as foundational principles, not afterthoughts. Every aspect of our platform is designed to protect your data and maintain compliance with educational privacy standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <Card className="border-2 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                      <Lock className="w-6 h-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl">Industry Certifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our AI infrastructure maintains the highest security standards through rigorous third-party audits and certifications:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">SOC 2 Type 2</strong>
                        <span className="text-sm text-muted-foreground">Rigorous security controls audited annually by independent third parties</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">ISO 27001</strong>
                        <span className="text-sm text-muted-foreground">International standard for information security management systems</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">ISO 42001</strong>
                        <span className="text-sm text-muted-foreground">AI management system certification ensuring responsible AI practices</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">HIPAA Compliant</strong>
                        <span className="text-sm text-muted-foreground">Healthcare-grade data protection standards applied to all data</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">CSA Star</strong>
                        <span className="text-sm text-muted-foreground">Cloud Security Alliance certification for cloud security excellence</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                      <Database className="w-6 h-6 text-purple-500" />
                    </div>
                    <CardTitle className="text-2xl">Data Protection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Your sensitive data is protected at every layer with enterprise-grade security measures:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">End-to-end encryption</strong>
                        <span className="text-sm text-muted-foreground">Data encrypted in transit (TLS 1.3+) and at rest (AES-256)</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Zero data retention</strong>
                        <span className="text-sm text-muted-foreground">AI providers never train on your data or retain it after processing</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Isolated databases</strong>
                        <span className="text-sm text-muted-foreground">Each district&apos;s data is completely separate with row-level security</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Regular backups</strong>
                        <span className="text-sm text-muted-foreground">Automated backups with point-in-time recovery capabilities</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">2FA authentication</strong>
                        <span className="text-sm text-muted-foreground">Multi-factor authentication for enhanced account security</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                      <Eye className="w-6 h-6 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Privacy First</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We&apos;re committed to protecting teacher and student privacy with comprehensive safeguards:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">FERPA compliant</strong>
                        <span className="text-sm text-muted-foreground">Full compliance with Family Educational Rights and Privacy Act</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Role-based access</strong>
                        <span className="text-sm text-muted-foreground">Granular permissions ensure staff only access what they need</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Comprehensive audit logs</strong>
                        <span className="text-sm text-muted-foreground">Track every data access and change with detailed logging</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Data ownership</strong>
                        <span className="text-sm text-muted-foreground">Your data belongs to you, always. We never sell or share it.</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Easy data export</strong>
                        <span className="text-sm text-muted-foreground">Download your complete data set anytime in standard formats</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                      <Server className="w-6 h-6 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl">Reliable Infrastructure</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Built on enterprise-grade platforms you can trust for reliability and performance:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Enterprise database</strong>
                        <span className="text-sm text-muted-foreground">PostgreSQL database with Supabase infrastructure</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">99.9% uptime SLA</strong>
                        <span className="text-sm text-muted-foreground">Reliable access when you need it with guaranteed availability</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Automatic scaling</strong>
                        <span className="text-sm text-muted-foreground">Infrastructure grows seamlessly with your district</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">Geographic redundancy</strong>
                        <span className="text-sm text-muted-foreground">Data replicated across multiple regions for disaster recovery</span>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block">24/7 monitoring</strong>
                        <span className="text-sm text-muted-foreground">Proactive threat detection and incident response</span>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mb-16">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">Additional Security Measures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                        Secure Development Practices
                      </h3>
                      <p className="text-sm text-muted-foreground ml-7">
                        Regular security audits, penetration testing, and code reviews ensure our platform remains secure against emerging threats.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                        DDoS Protection
                      </h3>
                      <p className="text-sm text-muted-foreground ml-7">
                        Enterprise-grade DDoS mitigation protects your access to the platform from malicious attacks.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                        Incident Response
                      </h3>
                      <p className="text-sm text-muted-foreground ml-7">
                        Documented incident response procedures with immediate notification protocols for any security events.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                        Employee Training
                      </h3>
                      <p className="text-sm text-muted-foreground ml-7">
                        All team members undergo regular security training and background checks to protect your data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500 rounded-lg p-8 mb-16">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
                    <Shield className="w-8 h-8 text-indigo-500" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold mb-2">Questions about security?</h3>
                  <p className="text-muted-foreground">
                    We&apos;re happy to provide detailed security documentation, sign Business Associate Agreements (BAAs), and answer any compliance questions your district may have.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button asChild variant="default" size="lg">
                    <Link href="mailto:josh@gettrellis.app?subject=Trellis%20Security%20Inquiry">
                      Contact Security Team
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Compliance & Legal</h2>
              <p className="text-muted-foreground mb-4">
                Trellis is designed to help educational institutions maintain compliance with applicable laws and regulations:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>FERPA (Family Educational Rights and Privacy Act)</strong> – We comply with all FERPA requirements for protecting student and educational records.</li>
                <li><strong>COPPA (Children&apos;s Online Privacy Protection Act)</strong> – Our platform follows COPPA guidelines for any data related to children under 13.</li>
                <li><strong>State Privacy Laws</strong> – We maintain compliance with state-specific privacy requirements including California&apos;s Student Privacy Laws.</li>
                <li><strong>Data Processing Agreements</strong> – We&apos;re happy to execute DPAs with districts to formally document our data handling responsibilities.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Trellis</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered teacher feedback platform.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="mailto:josh@gettrellis.app" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-muted-foreground">© 2025 Trellis. All rights reserved.</p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground">Privacy Policy</a>
                <a href="#" className="hover:text-foreground">Terms of Service</a>
                <Link href="/security" className="hover:text-foreground">Security</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

