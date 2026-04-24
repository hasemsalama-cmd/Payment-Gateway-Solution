import { Link } from "wouter"
import { Building2 } from "lucide-react"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-20 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground font-serif text-xl tracking-tight">
            <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-semibold">Lending Portal</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/status" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Check Status
            </Link>
            <Link href="/apply" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Apply Now
            </Link>
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-4 border-l pl-4">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground font-serif text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-medium">Lending Portal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lending Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
