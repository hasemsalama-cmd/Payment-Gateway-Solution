import { Link, useLocation } from "wouter"
import { Building2, LayoutDashboard, FileText, CreditCard, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Applications", href: "/admin/applications", icon: FileText },
  { name: "Loans", href: "/admin/loans", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar flex-shrink-0 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <Link href="/admin" className="flex items-center gap-2 text-sidebar-foreground font-serif font-bold text-lg">
            <Building2 className="h-5 w-5 text-sidebar-primary" />
            <span>Lending Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-medium text-sidebar-foreground/50 mb-4 px-2 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href + "/") && item.href !== "/admin")
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border/50">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4 w-4" />
            Public Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10 md:hidden">
           <Link href="/admin" className="flex items-center gap-2 text-foreground font-serif font-bold text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Lending Portal</span>
          </Link>
        </header>
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
