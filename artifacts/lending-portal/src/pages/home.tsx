import { Link } from "wouter"
import { ArrowRight, ShieldCheck, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight tracking-tight">
            Private lending for <br className="hidden md:block" />
            <span className="text-muted-foreground italic">serious businesses.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We provide fast, reliable, and transparent financing to help your business scale. No opaque algorithms, just clear terms and human decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/apply">
              <Button size="lg" className="h-14 px-8 text-base rounded-full w-full sm:w-auto">
                Apply for a Loan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/status">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full w-full sm:w-auto">
                Check Application Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30 px-6 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium">Fast Decisions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Submit your application in minutes and get an initial assessment instantly. Final decisions are made within 48 hours.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium">Clear Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                We believe in complete transparency. You'll see exactly what your rate, payments, and terms are before you sign anything.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium">Growth Focused</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our loans are structured to support your business growth, not stifle it with unmanageable debt burdens.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 px-6">
         <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-2xl p-12 text-center space-y-8 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-serif">Ready to take the next step?</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto text-lg">
              Join hundreds of businesses that have scaled with our tailored financing solutions.
            </p>
            <Link href="/apply" className="inline-block">
              <Button size="lg" variant="secondary" className="h-12 px-8 rounded-full text-primary hover:text-primary">
                Start Application
              </Button>
            </Link>
         </div>
      </section>
    </div>
  )
}
