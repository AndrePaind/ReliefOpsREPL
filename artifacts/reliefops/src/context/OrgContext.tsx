import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { getActiveOrgId, setActiveOrgId } from "@/lib/orgFetch";

export interface OrgData {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  myRole: "Admin" | "Coordinator" | "Viewer";
}

interface OrgContextValue {
  org: OrgData | null;
  allOrgs: OrgData[];
  isLoading: boolean;
  refetch: () => void;
  switchOrg: (id: string) => void;
}

const OrgContext = createContext<OrgContextValue>({
  org: null,
  allOrgs: [],
  isLoading: true,
  refetch: () => {},
  switchOrg: () => {},
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  // Track active org ID in React state so switching triggers an immediate re-render.
  // localStorage is the source of truth across sessions; state is the reactive copy.
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => getActiveOrgId());

  const { data: allOrgs = [], isLoading, refetch } = useQuery<OrgData[]>({
    queryKey: ["orgs", "my-orgs"],
    queryFn: async () => {
      const r = await fetch("/api/orgs/my-orgs", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!isSignedIn,
    retry: false,
    staleTime: 30_000,
  });

  // When orgs load and there's no stored preference, pin the first one.
  useEffect(() => {
    if (allOrgs.length > 0 && !getActiveOrgId()) {
      setActiveOrgId(allOrgs[0].id);
      setActiveOrgIdState(allOrgs[0].id);
    }
  }, [allOrgs]);

  // Resolved org: use state preference, fall back to first.
  const org = (activeOrgId && allOrgs.find((o) => o.id === activeOrgId)) || allOrgs[0] || null;

  const switchOrg = useCallback((id: string) => {
    // Update both storage and React state immediately — no waiting for a refetch.
    setActiveOrgId(id);
    setActiveOrgIdState(id);
    // Remove all org-scoped query data so every page reloads fresh for the new org.
    // We deliberately keep the orgs list so the sidebar doesn't flash empty.
    queryClient.removeQueries({
      predicate: (q) => {
        const first = q.queryKey[0] as string;
        return first !== "orgs";
      },
    });
  }, [queryClient]);

  return (
    <OrgContext.Provider value={{ org, allOrgs, isLoading, refetch, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
