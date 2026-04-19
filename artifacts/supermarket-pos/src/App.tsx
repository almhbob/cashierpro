import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/Sidebar";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Sales from "@/pages/Sales";
import SaleDetail from "@/pages/SaleDetail";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="flex min-h-[100dvh] w-full" dir="rtl">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/sales" component={Sales} />
          <Route path="/sales/:id" component={SaleDetail} />
          <Route path="/dashboard" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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
