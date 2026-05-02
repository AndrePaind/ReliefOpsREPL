import { UserProfile } from "@clerk/react";
import { useOrg } from "@/context/OrgContext";
import { Settings as SettingsIcon, Building2, LogIn, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { setActiveOrgId } from "@/lib/orgFetch";

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-orange-100 text-orange-700",
  Coordinator: "bg-blue-100 text-blue-700",
  Viewer: "bg-slate-100 text-slate-600",
};

export default function Settings() {
  const { allOrgs, switchOrg } = useOrg();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const joinOrg = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/orgs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          inviteCode: joinCode.trim().toUpperCase(),
          userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
          userFullName: user?.fullName ?? "",
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orgs", "my-orgs"] });
      setActiveOrgId(data.id);
      toast.success(`Joined ${data.name}!`);
      setJoinCode("");
      setShowJoin(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Account Settings
        </h1>
        <p className="text-slate-500 mt-1">Manage your profile, security, and team memberships</p>
      </div>

      {/* Teams / Orgs section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Your Teams & Missions</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowJoin((v) => !v)}>
            <LogIn className="w-4 h-4 mr-2" />
            Join another team
          </Button>
        </div>

        {showJoin && (
          <div className="flex gap-2 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1 space-y-1.5">
              <Label>Invite code</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono text-center tracking-widest uppercase"
                placeholder="ABC123"
              />
            </div>
            <Button onClick={() => joinOrg.mutate()} disabled={joinCode.length < 6 || joinOrg.isPending}>
              {joinOrg.isPending ? "Joining..." : "Join"}
            </Button>
          </div>
        )}

        {allOrgs.length === 0 ? (
          <p className="text-slate-400 text-sm">You aren't in any organization yet.</p>
        ) : (
          <ul className="space-y-2">
            {allOrgs.map((o) => (
              <li key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{o.name}</p>
                  {o.description && <p className="text-xs text-slate-400 truncate">{o.description}</p>}
                </div>
                <Badge className={`text-xs shrink-0 ${ROLE_COLORS[o.myRole] ?? ""}`}>{o.myRole}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => switchOrg(o.id)}
                >
                  Switch
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clerk UserProfile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <UserProfile routing="hash" appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none border-0 rounded-none",
            card: "!shadow-none !border-0 !bg-transparent !rounded-none",
            navbar: "hidden",
            pageScrollBox: "pt-0",
          },
        }} />
      </div>
    </div>
  );
}
