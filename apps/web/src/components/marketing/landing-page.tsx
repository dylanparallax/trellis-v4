import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedTagline } from "@/components/marketing/animated-tagline"
import { ArrowRight, CheckCircle, FileText, Shield, TrendingUp, Users, Wand2, Zap, Star, MessageSquare } from "lucide-react"

export interface LandingPageProps {
  onGetStarted?: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "AI-Powered Note Enhancement",
      description: "Transform rough observation notes into professional, structured reports with intelligent AI processing.",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Comprehensive Evaluations",
      description: "Generate detailed 8-12 page evaluation reports that combine all available data and observations.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Teacher Management",
      description: "Track teacher profiles, goals, and professional development history in one centralized system.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Growth Tracking",
      description: "Monitor progress over time with institutional memory that maintains context across evaluations.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Enterprise-grade security ensuring your data stays protected.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Built with modern Next.js for instant loading and smooth experience.",
    },
  ]

  // reserved for future use: benefits list

  const testimonials = [
    {
      quote:
        "Trellis has revolutionized how we approach teacher evaluations. The AI enhancement feature alone saves us hours of work every week.",
      author: "Dr. Sarah Johnson",
      role: "Principal, Lincoln High School",
      rating: 5,
      avatar: "👩‍🏫",
    },
    {
      quote:
        "The comprehensive evaluation reports are incredibly detailed and professional. Our teachers appreciate the growth-focused approach.",
      author: "Michael Chen",
      role: "Assistant Superintendent, Metro School District",
      rating: 5,
      avatar: "👨‍💼",
    },
    {
      quote:
        "Finally, a platform that understands the complexity of teacher evaluation while making it simple and efficient.",
      author: "Lisa Rodriguez",
      role: "Director of Curriculum & Instruction",
      rating: 5,
      avatar: "👩‍🎓",
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
          <div className="mx-auto max-w-5xl text-center">
            <AnimatedTagline />
            <h1 className="text-6xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Give every teacher the
              <span className="relative bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}personalized feedback {" "}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none"></span>
              </span>
              they deserve.
            </h1>
            <h2 className="mt-6 text-2xl leading-8 text-muted-foreground sm:text-2xl">
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
                <div className="text-3xl font-bold text-primary">80%</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Schools Using</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Evaluations Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need for modern teacher evaluation</h2>
            <p className="mt-4 text-lg text-muted-foreground">From AI-powered note enhancement to comprehensive evaluation reports, Trellis provides the complete solution.</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Trellis Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Our AI-powered platform transforms the teacher evaluation process in three simple steps</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
                  <span className="text-2xl font-bold">{step}</span>
                </div>
                {step === 1 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">Record Observations</h3>
                    <p className="text-muted-foreground">Jot down quick notes during classroom observations using our intuitive interface.</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">AI Enhancement</h3>
                    <p className="text-muted-foreground">Our AI transforms your rough notes into professional, structured observations.</p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">Generate Evaluations</h3>
                    <p className="text-muted-foreground">Create comprehensive 8-12 page evaluation reports combining all observations.</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by educational leaders nationwide</h2>
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
                    <div className="text-2xl">{t.avatar}</div>
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

      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Start free and scale as your needs grow</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            <Card className="relative p-8">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold">Free</div>
                <CardDescription>Perfect for small schools getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Up to 10 teachers",
                    "AI note enhancement",
                    "Basic evaluation reports",
                    "Email support",
                  ].map((item) => (
                    <li key={item} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-auto" variant="outline">Get Started Free</Button>
              </CardContent>
            </Card>

            <Card className="relative p-8 border-2 border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-4xl font-bold">
                  $99<span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription>For growing school districts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Unlimited teachers",
                    "Advanced AI features",
                    "Comprehensive reports",
                    "Priority support",
                    "Custom frameworks",
                  ].map((item) => (
                    <li key={item} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-auto">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card className="relative p-8">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold">Custom</div>
                <CardDescription>For large districts and organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Everything in Professional",
                    "Custom integrations",
                    "Dedicated support",
                    "On-premise options",
                    "Custom training",
                  ].map((item) => (
                    <li key={item} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-auto" variant="outline">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to transform your teacher evaluation process?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join hundreds of schools already using Trellis.</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/login">
                  Get started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <MessageSquare className="mr-2 h-5 w-5" />
                Contact Sales
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
              <p className="text-sm text-muted-foreground">AI-powered teacher evaluation platform.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Demo</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
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
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-muted-foreground">© 2025 Trellis. All rights reserved.</p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground">Privacy Policy</a>
                <a href="#" className="hover:text-foreground">Terms of Service</a>
                <a href="#" className="hover:text-foreground">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage


