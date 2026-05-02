import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrg } from "@/context/OrgContext";
import { Users, UserPlus, Copy, Crown, Shield, Eye, Trash2, Mail, Car, CheckCircle, Clock, XCircle, ClipboardList, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useListVolunteers, getListVolunteersQueryKey,
  useCreateVolunteer, useUpdateVolunteer, useDeleteVolunteer,
} from "@workspace/api-client-react";

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

function availabilityStyle(status: string) {
  switch (status) {
    case "Available": return { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle };
    case "Busy": return { bg: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
    default: return { bg: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle };
  }
}

// ── Volunteer form dialog ──────────────────────────────────────────────────────
interface VolunteerFormProps {
  initial?: { id: string; fullName: string; email?: string | null; phone?: string | null; hasVehicle: boolean; availabilityStatus: string } | null;
  onClose: () => void;
}

function VolunteerFormDialog({ initial, onClose }: VolunteerFormProps) {
  const queryClient = useQueryClient();
  const createVolunteer = useCreateVolunteer();
  const updateVolunteer = useUpdateVolunteer();

  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [hasVehicle, setHasVehicle] = useState(initial?.hasVehicle ?? false);
  const [availability, setAvailability] = useState(initial?.availabilityStatus ?? "Available");

  const isPending = createVolunteer.isPending || updateVolunteer.isPending;

  const save = () => {
    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    const data = {
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      hasVehicle,
      availabilityStatus: availability as any,
    };
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListVolunteersQueryKey() });
      toast.success(initial ? "Volunteer updated" : "Volunteer added");
      onClose();
    };
    if (initial) {
      updateVolunteer.mutate({ volunteerId: initial.id, data }, { onSuccess: invalidate, onError: () => toast.error("Failed to update volunteer") });
    } else {
      createVolunteer.mutate({ data }, { onSuccess: invalidate, onError: () => toast.error("Failed to create volunteer") });
    }
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="space-y-1.5">
        <Label>Full name *</Label>
        <Input placeholder="e.g. Amira Hassan" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="amira@ngo.org" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Availability</Label>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Busy">Busy</SelectItem>
            <SelectItem value="Offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hasVehicle}
          onChange={(e) => setHasVehicle(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Car className="h-4 w-4 text-blue-500" /> Has access to a vehicle
        </span>
      </label>
      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" disabled={!fullName.trim() || isPending} onClick={save}>
          {isPending ? "Saving…" : initial ? "Save Changes" : "Add Volunteer"}
        </Button>
      </div>
    </div>
  );
}

// ── Volunteers tab ─────────────────────────────────────────────────────────────
function VolunteersTab() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data: volunteers = [], isLoading } = useListVolunteers(undefined, {
    query: { queryKey: getListVolunteersQueryKey() },
  });
  const updateVolunteer = useUpdateVolunteer();
  const deleteVolunteer = useDeleteVolunteer();

  const handleStatusChange = (id: string, status: string) => {
    updateVolunteer.mutate(
      { volunteerId: id, data: { availabilityStatus: status as any } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListVolunteersQueryKey() }); toast.success("Availability updated"); },
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteVolunteer.mutate(
      { volunteerId: deleteTarget.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVolunteersQueryKey() });
          toast.success(`${deleteTarget.fullName} removed`);
          setDeleteTarget(null);
        },
        onError: () => toast.error("Failed to delete volunteer"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{(volunteers as any[]).length} volunteer{(volunteers as any[]).length !== 1 ? "s" : ""} registered</p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Volunteer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add volunteer</DialogTitle></DialogHeader>
            <VolunteerFormDialog onClose={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading volunteers…</div>
      ) : (volunteers as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No volunteers yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first volunteer to assign them to transfer tasks.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(volunteers as any[]).map((vol) => {
            const { bg, icon: Icon } = availabilityStyle(vol.availabilityStatus);
            return (
              <Card key={vol.id} className="bg-white shadow-sm border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {vol.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{vol.fullName}</p>
                        {vol.email && <p className="text-xs text-slate-400 truncate">{vol.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => setEditTarget(vol)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleteTarget(vol)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {vol.hasVehicle && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 gap-1">
                        <Car className="h-3 w-3" /> Vehicle
                      </Badge>
                    )}
                    {vol.activeTasks > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <ClipboardList className="h-3 w-3" /> {vol.activeTasks} active task{vol.activeTasks !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-xs gap-1 ml-auto ${bg}`}>
                      <Icon className="h-3 w-3" />
                      {vol.availabilityStatus}
                    </Badge>
                  </div>
                  <Select value={vol.availabilityStatus} onValueChange={(v) => handleStatusChange(vol.id, v)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit volunteer</DialogTitle></DialogHeader>
            <VolunteerFormDialog initial={editTarget} onClose={() => setEditTarget(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-destructive">Remove volunteer</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-1">
              <p className="text-sm text-slate-700">
                Remove <span className="font-bold">{deleteTarget.fullName}</span> from the volunteer roster?
                Any tasks assigned to them will become unassigned.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" disabled={deleteVolunteer.isPending} onClick={confirmDelete}>
                  {deleteVolunteer.isPending ? "Removing…" : "Remove"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
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

      {/* Tabbed section */}
      <Tabs defaultValue="members">
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1">
            <Users className="h-4 w-4 mr-1.5" /> Members ({(members as Member[]).length})
          </TabsTrigger>
          <TabsTrigger value="volunteers" className="flex-1">
            <Car className="h-4 w-4 mr-1.5" /> Volunteers
          </TabsTrigger>
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Members ({(members as Member[]).length})</h2>
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
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
            ) : (members as Member[]).length === 0 ? (
              <div className="p-8 text-center text-slate-400">No members yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(members as Member[]).map((m) => {
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
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-500 uppercase tracking-wide border border-slate-300">Demo</span>
                          )}
                          {isPending && !isDemo && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 uppercase tracking-wide border border-amber-200">Pending</span>
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
        </TabsContent>

        {/* Volunteers tab */}
        <TabsContent value="volunteers" className="mt-4">
          <VolunteersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
