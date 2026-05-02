import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { OrgProvider, useOrg } from "@/context/OrgContext";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import HubList from "@/pages/HubList";
import HubDetail from "@/pages/HubDetail";
import RequestList from "@/pages/RequestList";
import RequestCreate from "@/pages/RequestCreate";
import RequestDetail from "@/pages/RequestDetail";
import TransferList from "@/pages/TransferList";
import TransferDetail from "@/pages/TransferDetail";
import VolunteerList from "@/pages/VolunteerList";
import ActivityLog from "@/pages/ActivityLog";
import Onboarding from "@/pages/Onboarding";
import TeamManagement from "@/pages/TeamManagement";
import SharedBoard from "@/pages/SharedBoard";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(14 100% 50%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(214 32% 91%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "Plus Jakarta Sans",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-slate-900",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-semibold",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-500",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all",
    formFieldInput: "border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary",
    footerAction: "border-t border-slate-100 bg-slate-50 p-4",
    dividerLine: "bg-slate-200",
    main: "p-6 sm:p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

/** Gates any authenticated route: if user has no org, shows onboarding. */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isSignedIn } = useAuth();
  const { org, isLoading } = useOrg();

  if (!isSignedIn) return <Redirect to="/" />;

  // While checking org status, show nothing (avoids flash)
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // No org yet — show onboarding
  if (!org) return <Onboarding />;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome to ReliefOps", subtitle: "Sudan Crisis Logistics Command Center" } },
        signUp: { start: { title: "Join ReliefOps", subtitle: "Coordinate relief efforts across Sudan" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <OrgProvider>
          <ClerkQueryClientCacheInvalidator />
          <Toaster position="top-right" richColors closeButton />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />

            <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
            <Route path="/hubs"><ProtectedRoute component={HubList} /></Route>
            <Route path="/hubs/:hubId"><ProtectedRoute component={HubDetail} /></Route>
            <Route path="/requests/new"><ProtectedRoute component={RequestCreate} /></Route>
            <Route path="/requests/:requestId"><ProtectedRoute component={RequestDetail} /></Route>
            <Route path="/requests"><ProtectedRoute component={RequestList} /></Route>
            <Route path="/transfers/:transferId"><ProtectedRoute component={TransferDetail} /></Route>
            <Route path="/transfers"><ProtectedRoute component={TransferList} /></Route>
            <Route path="/volunteers"><ProtectedRoute component={VolunteerList} /></Route>
            <Route path="/activity"><ProtectedRoute component={ActivityLog} /></Route>
            <Route path="/board"><ProtectedRoute component={SharedBoard} /></Route>
            <Route path="/team"><ProtectedRoute component={TeamManagement} /></Route>

            <Route component={NotFound} />
          </Switch>
        </OrgProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
