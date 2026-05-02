import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

export interface OrgData {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  myRole: "Admin" | "Coordinator" | "Viewer";
}

interface OrgContextValue {
  org: OrgData | null;
  isLoading: boolean;
  refetch: () => void;
}

const OrgContext = createContext<OrgContextValue>({ org: null, isLoading: true, refetch: () => {} });

export function OrgProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();

  const { data, isLoading, refetch } = useQuery<OrgData | null>({
    queryKey: ["org", "me"],
    queryFn: async () => {
      const r = await fetch("/api/orgs/me", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!isSignedIn,
    retry: false,
    staleTime: 30_000,
  });

  return (
    <OrgContext.Provider value={{ org: data ?? null, isLoading, refetch }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
