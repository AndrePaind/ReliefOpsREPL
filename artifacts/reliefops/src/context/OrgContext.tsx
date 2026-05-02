import { createContext, useContext, ReactNode, useCallback } from "react";
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

  // Active org: prefer the one stored in localStorage, else first in list
  const activeId = getActiveOrgId();
  const org = (activeId && allOrgs.find((o) => o.id === activeId)) || allOrgs[0] || null;

  // Keep localStorage in sync with the resolved org
  if (org && org.id !== activeId) {
    setActiveOrgId(org.id);
  }

  const switchOrg = useCallback((id: string) => {
    setActiveOrgId(id);
    // Clear all cached API data so everything reloads for the new org context
    queryClient.clear();
    // Refetch the org list so the context updates
    queryClient.invalidateQueries({ queryKey: ["orgs", "my-orgs"] });
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
