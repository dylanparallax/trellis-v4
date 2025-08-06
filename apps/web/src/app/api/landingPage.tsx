import {
    CheckCircle,
    Users,
    FileText,
    BarChart3,
    Shield,
    Zap,
    ArrowRight,
    Quote,
  } from "lucide-react";
  
  export default function App() {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">
                  T
                </span>
              </div>
              <span className="text-xl font-semibold">
                Trellis AI
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Testimonials
              </a>
              <button className="ml-4 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                Sign In
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Get Started
              </button>
            </nav>
          </div>
        </header>
  
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    AI-Powered Teacher Development
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                    Transform rushed evaluations into{" "}
                    <span className="text-blue-600">
                      personalized growth journeys
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Trellis AI gives every teacher what they
                    deserve: an evaluation process that remembers
                    their journey, celebrates their growth, and
                    provides truly personalized feedback powered
                    by AI.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                  <button className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-colors">
                    Watch Demo
                  </button>
                </div>
                <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>FERPA Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Privacy-First Design</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Built by Educators</span>
                  </div>
                </div>
              </div>
              <div className="lg:block">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    alt="Trellis AI Dashboard"
                    className="w-full max-w-2xl mx-auto rounded-xl shadow-2xl border border-border"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* Problem Statement */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Every principal knows the problem
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                There's never enough time to give teachers the
                thoughtful, developmental feedback they need.
                Traditional evaluations are rushed, generic, and
                don't help teachers grow. Until now.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="font-semibold">
                    Generic Feedback
                  </h3>
                  <p className="text-muted-foreground">
                    Rushed evaluations that don't connect to
                    individual teacher growth
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Limited Time</h3>
                  <p className="text-muted-foreground">
                    Administrators juggle too many
                    responsibilities to provide quality feedback
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="font-semibold">
                    No Progress Tracking
                  </h3>
                  <p className="text-muted-foreground">
                    No way to track teacher growth over time or
                    identify system-wide trends
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  How Trellis AI Works
                </h2>
                <p className="text-xl text-muted-foreground">
                  Transform your evaluation process in four simple
                  steps
                </p>
              </div>
              <div className="grid gap-8">
                {[
                  {
                    step: "1",
                    title: "Upload Your Framework",
                    description:
                      "Input your existing evaluation rubrics and teaching standards. Trellis AI adapts to YOUR system, not the other way around.",
                    icon: FileText,
                    color: "blue",
                  },
                  {
                    step: "2",
                    title: "Observe Naturally",
                    description:
                      "During classroom visits, simply type or voice-record your observations. No complex forms, just natural notes.",
                    icon: Users,
                    color: "green",
                  },
                  {
                    step: "3",
                    title: "AI Transforms Notes",
                    description:
                      "Trellis AI creates comprehensive, personalized feedback that references growth trajectory and suggests concrete next steps.",
                    icon: Zap,
                    color: "purple",
                  },
                  {
                    step: "4",
                    title: "Track Real Progress",
                    description:
                      "Every observation builds on the last. Maintain living profiles for each teacher, tracking growth over months and years.",
                    icon: BarChart3,
                    color: "orange",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex items-start space-x-6">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.color === "blue"
                              ? "bg-blue-100 text-blue-600"
                              : item.color === "green"
                                ? "bg-green-100 text-green-600"
                                : item.color === "purple"
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          <item.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              Step {item.step}
                            </span>
                            <h3 className="text-xl font-semibold">
                              {item.title}
                            </h3>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
  
        {/* Features Grid */}
        <section id="features" className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Built for every role in education
                </h2>
                <p className="text-xl text-muted-foreground">
                  From individual teachers to district leaders,
                  Trellis AI serves everyone
                </p>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">
                      For Teachers
                    </h3>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Finally receive feedback that connects to
                        your unique growth journey and helps you
                        improve your practice.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>Personalized growth plans</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>Meaningful feedback</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>Progress tracking over time</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
  
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">
                      For Administrators
                    </h3>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Transform 2-hour evaluation tasks into
                        15-minute focused observations with
                        AI-powered feedback generation.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            90% time savings on evaluations
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            AI-powered feedback generation
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            Maintains your authentic voice
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
  
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">
                      For Districts
                    </h3>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Gain unprecedented insight into
                        instructional trends across your entire
                        system with real-time analytics.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            System-wide instructional insights
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            Resource allocation intelligence
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>Early intervention alerts</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Trusted by educators nationwide
                </h2>
                <p className="text-xl text-muted-foreground">
                  See what educators are saying about Trellis AI
                </p>
              </div>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-card rounded-xl shadow-sm border border-border">
                  <div className="p-8">
                    <Quote className="h-8 w-8 text-blue-600 mb-4" />
                    <p className="text-lg mb-6 leading-relaxed">
                      "I used to dread writing evaluations—they
                      felt generic and unhelpful. Now I spend 15
                      minutes on observations that used to take me
                      2 hours, and teachers actually thank me for
                      the feedback."
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          MR
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          Maria Rodriguez
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Assistant Principal, Oakland Charter
                          Academy
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
  
                <div className="bg-card rounded-xl shadow-sm border border-border">
                  <div className="p-8">
                    <Quote className="h-8 w-8 text-green-600 mb-4" />
                    <p className="text-lg mb-6 leading-relaxed">
                      "For the first time, I can see instructional
                      trends across our 47 schools in real-time.
                      We deployed targeted support before test
                      scores could drop. That's collective
                      intelligence."
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">
                          JW
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          Dr. James Washington
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Superintendent, Riverside Unified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-12">
                <div className="inline-block bg-card rounded-xl shadow-sm border border-border">
                  <div className="p-6">
                    <Quote className="h-6 w-6 text-purple-600 mb-3 mx-auto" />
                    <p className="text-lg mb-4 max-w-2xl">
                      "For the first time in my career, I look
                      forward to observations. Not because they're
                      easier—because they finally mean something."
                    </p>
                    <p className="text-muted-foreground">
                      High School Math Teacher, Beta User
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* CTA Section */}
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Ready to transform your evaluation process?
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Join forward-thinking schools across the country
                partnering with Trellis AI in 2025. Every teacher
                deserves to grow, every administrator wants to
                help them, and every district needs to see the
                bigger picture.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                  Schedule a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <button className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
                  Learn More
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-blue-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Free pilot program available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Implementation support included</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>FERPA compliant &amp; secure</span>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* Footer */}
        <footer className="border-t bg-card py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      T
                    </span>
                  </div>
                  <span className="text-xl font-semibold">
                    Trellis AI
                  </span>
                </div>
                <p className="text-muted-foreground">
                  AI-powered teacher evaluation software built by
                  educators, for educators.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Security
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-muted-foreground">
                © 2025 Trellis AI. All rights reserved.
              </p>
              <p className="text-muted-foreground">
                Built by educators who believe teaching is the
                most important profession in the world.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }