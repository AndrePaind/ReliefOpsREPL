import { useState } from "react";
import { useUser } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Users, ArrowRight, LogIn, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setActiveOrgId } from "@/lib/orgFetch";

type Mode = "choose" | "create" | "join";

export default function Onboarding() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("choose");
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createOrg = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: orgName.trim(),
          description: orgDesc.trim() || null,
          userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
          userFullName: user?.fullName ?? "",
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? "Failed to create organization"); }
      return r.json();
    },
    onSuccess: (data) => {
      setActiveOrgId(data.id);
      queryClient.invalidateQueries({ queryKey: ["orgs", "my-orgs"] });
      toast.success("Organization created! Welcome to ReliefOps.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinOrg = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/orgs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
          userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
          userFullName: user?.fullName ?? "",
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? "Failed to join organization"); }
      return r.json();
    },
    onSuccess: (data) => {
      setActiveOrgId(data.id);
      queryClient.invalidateQueries({ queryKey: ["orgs", "my-orgs"] });
      toast.success("You're in! Welcome to the team.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-4 shadow-lg">
            <Globe className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome to ReliefOps</h1>
          <p className="text-slate-500 mt-2">The global platform for humanitarian logistics</p>
        </div>

        {mode === "choose" && (
          <div className="space-y-4">
            <p className="text-center text-slate-600 mb-6">
              Create a new team for your mission, or join an existing one with an invite code.
            </p>
            <button
              onClick={() => setMode("create")}
              className="w-full p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-orange-50/50 transition-all text-left group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Building2 className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Create a new organization</p>
                  <p className="text-sm text-slate-500 mt-0.5">Start fresh and invite your team members</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-orange-50/50 transition-all text-left group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Users className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Join an existing team</p>
                  <p className="text-sm text-slate-500 mt-0.5">Enter an invite code from your coordinator</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Create your organization</h2>
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name *</Label>
              <Input id="orgName" placeholder="e.g. UNICEF Sudan, MSF Khartoum, IRC Yemen" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDesc">Description (optional)</Label>
              <Textarea id="orgDesc" placeholder="Your NGO's focus area or mission description" value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">Back</Button>
              <Button onClick={() => createOrg.mutate()} disabled={!orgName.trim() || createOrg.isPending} className="flex-1">
                {createOrg.isPending ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Join a team</h2>
            <p className="text-sm text-slate-500">Ask your team admin for the 6-character invite code.</p>
            <div className="space-y-2">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                placeholder="e.g. A3BX7K"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono text-center text-xl tracking-widest uppercase"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">Back</Button>
              <Button onClick={() => joinOrg.mutate()} disabled={inviteCode.trim().length < 6 || joinOrg.isPending} className="flex-1">
                <LogIn className="w-4 h-4 mr-2" />
                {joinOrg.isPending ? "Joining..." : "Join Team"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
