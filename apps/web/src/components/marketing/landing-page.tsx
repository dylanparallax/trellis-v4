import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedTagline } from "@/components/marketing/animated-tagline"
import { ArrowRight, TrendingUp, Star, MessageSquare, Heart, Plus, Shield, Lock, Database, Eye, CheckCircle2, Server } from "lucide-react"
import StakeholderToggle from "@/components/marketing/stakeholder-toggle"
import FAQSection from "@/components/marketing/faq"

export function LandingPage() {
  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Perfect Recall",
      description: "See every teacher’s growth story over time—not scattered notes across apps. Trellis links observations, goals, and evidence so context is never lost between cycles.",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Positive-First",
      description: "Start with strengths to build trust and openness. Trellis elevates effective practices first, then frames areas for growth with specific, supportive language.",
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: "Framework-Aligned",
      description: "Works out-of-the-box with Danielson, Marzano, CSTPs, UDL, or your local rubric. Inject district- or school-specific goals into every feedback report with one click.",
    },
  ]

  // reserved for future use: benefits list

  const testimonials = [
    {
      quote:
        "Trellis has revolutionized how we approach teacher feedback. The AI enhancement feature alone saves us hours of work every week.",
      author: "Sarah Johnson",
      role: "Principal, Lincoln High School",
      rating: 5,
      avatar: "/alex-suprun-mynsNaNwVDc-unsplash.jpg",
    },
    {
      quote:
        "The comprehensive feedback reports are incredibly detailed and professional. Our teachers appreciate the growth-focused approach.",
      author: "Terrence Underwood",
      role: " Superintendent, Brighton School District",
      rating: 5,
      avatar: "/dr-terrence-underwood-Io0eEAfSMjY-unsplash.jpg",
    },
    {
      quote:
        "Finally, a platform that understands the complexity of teacher feedback while making it simple and efficient. I love Trellis so much.",
      author: "Lisa Rodriguez",
      role: "Director of Curriculum & Instruction",
      rating: 5,
      avatar: "/thisisengineering-TXxiFuQLBKQ-unsplash.jpg",
    },
  ]

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
                <Link href="/signup">
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <AnimatedTagline />
            <h1 className="text-10xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Give every teacher the
              <span className="relative bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}personalized feedback {" "}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none"></span>
              </span>
              they deserve.
            </h1>
            <h2 className="mt-6 text-3xl leading-8 text-muted-foreground sm:text-2xl">
              From scattered observations to comprehensive, continuous feedback that helps teachers thrive.
            </h2>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild className="text-lg px-8 py-6 border border-2 border-primary bg-none">
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Hours saved per teacher</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4x</div>
                <div className="text-sm text-muted-foreground">More observations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Feedback Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">5-star ratings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      <section className="py-20 sm:py-32 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trellis is a teacher-first feedback tool that saves time and empowers teacher growth</h2>
            
            
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg">
                <CardHeader>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

{/* Section 2: Enterprise-Grade Security & Privacy */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Enterprise-Grade Security
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Trellis is built on industry-leading infrastructure with multiple layers of protection for sensitive educational information.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="border-1 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                      <Lock className="w-5 h-5 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">Industry Certifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our AI infrastructure maintains the highest security standards:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>SOC 2 Type 2</strong> – Rigorous security controls audited annually</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>ISO 27001</strong> – International information security standard</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>ISO 42001</strong> – AI management system certification</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>HIPAA Compliant</strong> – Healthcare-grade data protection</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>CSA Star</strong> – Cloud security excellence verified</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-1 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                      <Database className="w-5 h-5 text-purple-500" />
                    </div>
                    <CardTitle className="text-xl">Data Protection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Your sensitive data is protected at every layer:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>End-to-end encryption</strong> for data in transit and at rest</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Zero data retention</strong> – AI providers never train on your data</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Isolated databases</strong> – Each district&apos;s data is completely separate</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Regular backups</strong> with point-in-time recovery</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>2FA authentication</strong> for added security</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-1 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                      <Eye className="w-5 h-5 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Privacy First</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We&apos;re committed to protecting teacher and student privacy:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>FERPA compliant</strong> – Meets educational privacy standards</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Role-based access</strong> – Staff only see what they need</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Audit logs</strong> – Track every data access and change</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Data ownership</strong> – Your data belongs to you, always</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Easy export</strong> – Download your data anytime</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-1 hover:border-primary/50 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                      <Server className="w-5 h-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl">Reliable Infrastructure</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Built on enterprise-grade platforms you can trust:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Database</strong> – Enterprise PostgreSQL database</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>99.9% uptime SLA</strong> – Reliable access when you need it</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Automatic scaling</strong> – Grows with your district</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Geographic redundancy</strong> – Data replicated across regions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>24/7 monitoring</strong> – Proactive threat detection</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500 rounded-lg p-8 border border-border/50">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
                    <Shield className="w-8 h-8 text-indigo-500" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold mb-2">Questions about security?</h3>
                  <p className="text-muted-foreground">
                    We&apos;re happy to provide detailed security documentation, sign BAAs, and answer any compliance questions your district may have.
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
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Trellis transforms teacher feedback cycles in three simple steps</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-2 border-primary text-primary mb-6">
                  <span className="text-2xl font-bold">{step}</span>
                </div>
                {step === 1 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">Record Observations</h3>
                    <p className="text-muted-foreground">Jot down notes during observations and upload to the app.</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">AI Enhancement</h3>
                    <p className="text-muted-foreground">Our AI transforms rough notes into professional, structured observations.</p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">Generate Feedback</h3>
                    <p className="text-muted-foreground">Create comprehensive feedback combining observations, goals, frameworks, and more.</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for every stakeholder</h2>
            <p className="mt-4 text-lg text-muted-foreground">Tailored benefits for teachers, leaders, and districts.</p>
          </div>
          <div className="mt-12">
            <StakeholderToggle />
          </div>
          <div className="mt-12 max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <p className="text-primary text-3xl">Trellis closes the gap between what research says about feedback and <strong>what actually happens in schools.</strong></p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by educational leaders</h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, index) => (
              <Card key={index} className="relative hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-base italic mb-4">“{t.quote}”</blockquote>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={t.avatar}
                      alt={`${t.author} avatar`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover ring-1 ring-primary/20 ring-offset-2 ring-offset-background shadow-sm"
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <div className="font-semibold">{t.author}</div>
                      <div className="text-sm text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/**
       * ROI Calculator (temporarily disabled)
       * Restore when ready: uncomment the section and re-add RoiCalculator import
       */}
      {false && (
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trellis is an investment in your teachers and in your productivity</h2>
              <p className="mt-4 text-lg text-muted-foreground">Calculate ROI for your school or district.</p>
            </div>
            <div className="mt-12">
              {/* <RoiCalculator /> */}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to transform your teacher feedback?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join the innovative schools and districts already using Trellis.</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="mailto:josh@gettrellis.app?subject=Trellis%20Sales%20Inquiry">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contact Sales
                </Link>
              </Button>
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
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link href="/#faq" className="hover:text-foreground">FAQs</Link></li>
                
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link href="/policies" className="hover:text-foreground">Policies</Link></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="mailto:josh@gettrellis.app" className="hover:text-foreground">Contact</a></li>
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

export default LandingPage


