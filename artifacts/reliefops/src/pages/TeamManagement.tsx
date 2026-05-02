import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrg } from "@/context/OrgContext";
import { Users, UserPlus, Copy, Crown, Shield, Eye, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: "Admin" | "Coordinator" | "Viewer";
  joinedAt: string;
}

const ROLE_ICONS = { Admin: Crown, Coordinator: Shield, Viewer: Eye };
const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-orange-100 text-orange-700 border-orange-200",
  Coordinator: "bg-blue-100 text-blue-700 border-blue-200",
  Viewer: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function TeamManagement() {
  const { org } = useOrg();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Coordinator");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["org-members", org?.id],
    queryFn: async () => {
      const r = await fetch(`/api/orgs/${org!.id}/members`, { credentials: "include" });
      return r.json();
    },
    enabled: !!org?.id,
  });

  const invite = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/orgs/${org!.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail, fullName: inviteFullName || null, role: inviteRole }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", org?.id] });
      toast.success("Member added successfully");
      setInviteOpen(false);
      setInviteEmail(""); setInviteFullName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const r = await fetch(`/api/orgs/${org!.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-members", org?.id] }),
    onError: () => toast.error("Failed to change role"),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      await fetch(`/api/orgs/${org!.id}/members/${memberId}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", org?.id] });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const copyInviteCode = () => {
    if (org?.inviteCode) {
      navigator.clipboard.writeText(org.inviteCode);
      toast.success("Invite code copied!");
    }
  };

  if (!org) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
        <p className="text-slate-500 mt-1">{org.name}</p>
      </div>

      {/* Org card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{org.name}</h2>
            {org.description && <p className="text-slate-500 text-sm mt-1">{org.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Team invite code</p>
              <code className="text-lg font-mono font-bold tracking-widest text-primary bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                {org.inviteCode}
              </code>
            </div>
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Share this code with new members so they can join your organization at sign-up.</p>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Members ({members.length})</h2>
          </div>
          {org.myRole === "Admin" && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add team member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input placeholder="e.g. Amira Hassan" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email address *</Label>
                    <Input type="email" placeholder="member@ngo.org" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin — full control</SelectItem>
                        <SelectItem value="Coordinator">Coordinator — manage ops</SelectItem>
                        <SelectItem value="Viewer">Viewer — read only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => invite.mutate()} disabled={!inviteEmail || invite.isPending} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    {invite.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No members yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((m) => {
              const RoleIcon = ROLE_ICONS[m.role] ?? Shield;
              const isDemo = m.userId.startsWith("demo:");
              const isPending = m.userId.startsWith("pending:");
              return (
                <li key={m.id} className={`flex items-center gap-4 px-6 py-4 ${isDemo ? "bg-slate-50/60" : ""}`}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className={`text-sm font-semibold ${isDemo ? "bg-slate-200 text-slate-500" : "bg-primary/10 text-primary"}`}>
                      {(m.fullName || m.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900 truncate">{m.fullName || m.email}</p>
                      {isDemo && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-500 uppercase tracking-wide border border-slate-300">
                          Demo
                        </span>
                      )}
                      {isPending && !isDemo && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 uppercase tracking-wide border border-amber-200">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{m.email}</p>
                  </div>
                  {org.myRole === "Admin" ? (
                    <Select value={m.role} onValueChange={(role) => changeRole.mutate({ memberId: m.id, role })}>
                      <SelectTrigger className={`w-36 h-8 text-xs font-medium border ${ROLE_COLORS[m.role]}`}>
                        <RoleIcon className="w-3 h-3 mr-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Coordinator">Coordinator</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${ROLE_COLORS[m.role]} border text-xs`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {m.role}
                    </Badge>
                  )}
                  {org.myRole === "Admin" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={() => removeMember.mutate(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
