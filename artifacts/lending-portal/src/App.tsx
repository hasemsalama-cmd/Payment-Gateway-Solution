import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/public-layout";
import { AdminLayout } from "@/components/layout/admin-layout";

import Home from "@/pages/home";
import Apply from "@/pages/apply";
import Status from "@/pages/status";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminApplicationsList from "@/pages/admin/applications/list";
import AdminApplicationDetail from "@/pages/admin/applications/detail";
import AdminLoansList from "@/pages/admin/loans/list";
import AdminLoanDetail from "@/pages/admin/loans/detail";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient();

function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/apply" component={Apply} />
        <Route path="/status" component={Status} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  )
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/applications" component={AdminApplicationsList} />
        <Route path="/admin/applications/:id" component={AdminApplicationDetail} />
        <Route path="/admin/loans" component={AdminLoansList} />
        <Route path="/admin/loans/:id" component={AdminLoanDetail} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  )
}

function Router() {
  return (
    <Switch>
      {/* Admin routes need to be declared before generic catch-alls */}
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/*" component={AdminRoutes} />
      
      {/* Public routes */}
      <Route path="/" component={PublicRoutes} />
      <Route path="/apply" component={PublicRoutes} />
      <Route path="/status" component={PublicRoutes} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
