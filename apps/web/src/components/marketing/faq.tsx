import { ChevronDown } from "lucide-react"

type FaqItem = {
  question: string
  answer: React.ReactNode
}

const faqItems: FaqItem[] = [
  {
    question: "Is Trellis an evaluation tool?",
    answer: (
      <>
        <p className="mb-3">No. Trellis is a professional growth platform, not an evaluation system.</p>
        <p className="mb-3">It helps leaders capture and organize feedback from walkthroughs, coaching sessions, and classroom visits so feedback becomes faster, clearer, and more actionable. Trellis doesn’t generate scores, ratings, or evaluation forms — it simply helps make good feedback easier.</p>
      </>
    ),
  },
  {
    question: "Who can see the notes or feedback entered in Trellis?",
    answer: (
      <>
        <p className="mb-3">Administrators decide what information to share with teachers — just like in any walkthrough or coaching process.</p>
        <p>When feedback is shared, it’s visible to the teacher and designed to start a professional conversation. Nothing in Trellis is automatically pushed into personnel files or formal evaluations.</p>
      </>
    ),
  },
  {
    question: "How does Trellis support teachers?",
    answer: (
      <>
        <p className="mb-3">Trellis makes feedback:</p>
        <ul className="list-disc pl-5 space-y-2 mb-3 text-muted-foreground">
          <li><strong>Timely</strong> — Teachers get feedback sooner, while it’s still relevant.</li>
          <li><strong>Clear</strong> — Notes are focused on instructional practices and next steps.</li>
          <li><strong>Actionable</strong> — Teachers can reflect, respond, and track their own growth.</li>
        </ul>
        <p>It’s about learning, not compliance — creating more frequent, lower-stakes conversations around teaching.</p>
      </>
    ),
  },
  {
    question: "How does Trellis support administrators?",
    answer: (
      <>
        <p className="mb-3">Trellis helps leaders spend less time writing reports and more time in classrooms.</p>
        <p>By organizing feedback across classrooms, it helps identify schoolwide trends and guide PD decisions — without singling out individual teachers.</p>
      </>
    ),
  },
  {
    question: "Is Trellis connected to formal evaluations or HR systems?",
    answer: (
      <>
        <p className="mb-3">No. Trellis is intentionally separate.</p>
        <p>It’s a coaching and growth tool, not an evaluation platform. Districts can use Trellis to complement their existing systems, but the data inside Trellis is meant to support professional learning, not personnel decisions.</p>
      </>
    ),
  },
  {
    question: "How does Trellis protect teacher trust?",
    answer: (
      <>
        <p className="mb-3">Trellis was built by educators who understand that trust is everything.</p>
        <p className="mb-3">Administrators control visibility, but the tool encourages openness, reflection, and clarity. Teachers always know when feedback has been shared — there are no surprises.</p>
        <p>The spirit of Trellis is collaboration: helping good feedback happen more often, and making growth visible in supportive, transparent ways.</p>
      </>
    ),
  },
  {
    question: "Can Trellis be customized to our school or district?",
    answer: (
      <>
        <p>Yes. Trellis can align with your instructional framework, walkthrough forms, and focus areas. The platform is flexible so each district or school can shape how it’s used — from pilot feedback cycles to full instructional coaching models.</p>
      </>
    ),
  },
  {
    question: "What about union concerns?",
    answer: (
      <>
        <p>Trellis aligns with union values: fairness, professionalism, and respect for teacher voice. It’s non-evaluative, transparent about how data is used, and designed to reduce stress around feedback and evaluations — not increase it.</p>
      </>
    ),
  },
  {
    question: "Why “Trellis”?",
    answer: (
      <>
        <p>Because growth takes structure. Just like a trellis supports a plant’s upward path, Trellis helps teachers and leaders grow together — organized, supported, and connected.</p>
      </>
    ),
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-32 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-muted-foreground">Everything you need to know about Trellis as a growth-first feedback platform.</p>
        </div>

        <div className="mx-auto max-w-3xl mt-12 space-y-4">
          {faqItems.map((item, idx) => (
            <details key={idx} className="group rounded-lg border border-border/60 bg-background/60 p-4 transition-colors open:border-primary/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-left text-base font-medium">{item.question}</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-sm leading-6 text-foreground/90">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQSection


