import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrg } from "@/context/OrgContext";
import { Globe, Plus, Package, AlertCircle, Megaphone, CheckCircle, X, MapPin, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

interface BoardPost {
  id: string;
  orgId: string;
  orgName: string;
  type: "Availability" | "Need" | "Announcement";
  title: string;
  content: string | null;
  itemName: string | null;
  quantity: number | null;
  location: string | null;
  status: "Active" | "Fulfilled" | "Closed";
  createdAt: string;
}

const TYPE_CONFIG = {
  Availability: { icon: Package, color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Availability" },
  Need: { icon: AlertCircle, color: "bg-red-100 text-red-700 border-red-200", label: "Need" },
  Announcement: { icon: Megaphone, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Announcement" },
};

export default function SharedBoard() {
  const { org } = useOrg();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [postOpen, setPostOpen] = useState(false);
  const [form, setForm] = useState({ type: "Need", title: "", content: "", itemName: "", quantity: "", location: "" });

  const { data: posts = [], isLoading } = useQuery<BoardPost[]>({
    queryKey: ["board", filterType],
    queryFn: async () => {
      const params = filterType !== "all" ? `?type=${filterType}` : "";
      const r = await fetch(`/api/board${params}`, { credentials: "include" });
      return r.json();
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          content: form.content.trim() || null,
          itemName: form.itemName.trim() || null,
          quantity: form.quantity ? parseInt(form.quantity) : null,
          location: form.location.trim() || null,
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      toast.success("Post published to shared board");
      setPostOpen(false);
      setForm({ type: "Need", title: "", content: "", itemName: "", quantity: "", location: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/board/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Shared NGO Board
          </h1>
          <p className="text-slate-500 mt-1">Inter-organization availability and needs — visible to all NGOs on ReliefOps</p>
        </div>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post to Board
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New board post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label>Post type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Need">Need — we urgently need supplies</SelectItem>
                    <SelectItem value="Availability">Availability — we have surplus to share</SelectItem>
                    <SelectItem value="Announcement">Announcement — general update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="e.g. Urgent need for water purification tablets" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Item / Supply</Label>
                  <Input placeholder="e.g. ORS packets" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" placeholder="500" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Khartoum North, Sudan" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Details (optional)</Label>
                <Textarea placeholder="Additional context, contact preferences, etc." rows={2} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              <Button onClick={() => createPost.mutate()} disabled={!form.title.trim() || createPost.isPending} className="w-full">
                {createPost.isPending ? "Publishing..." : "Publish Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["all", "All Posts"], ["Need", "Needs"], ["Availability", "Availability"], ["Announcement", "Announcements"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterType(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === val ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading board posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No posts yet. Be the first to share availability or a need.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => {
            const cfg = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.Announcement;
            const TypeIcon = cfg.icon;
            const isOwn = post.orgId === org?.id;
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color.replace("text-", "text-").replace("bg-", "bg-")}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Badge className={`${cfg.color} border text-xs mb-1`}>{cfg.label}</Badge>
                        <h3 className="font-semibold text-slate-900 text-base">{post.title}</h3>
                      </div>
                      {isOwn && (
                        <div className="flex gap-1.5 shrink-0">
                          {post.status === "Active" && (
                            <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200" onClick={() => updateStatus.mutate({ id: post.id, status: "Fulfilled" })}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Fulfilled
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={() => updateStatus.mutate({ id: post.id, status: "Closed" })}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{post.orgName}</span>
                      {post.itemName && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {post.itemName}{post.quantity ? ` — ${post.quantity.toLocaleString()} units` : ""}
                        </span>
                      )}
                      {post.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {post.location}
                        </span>
                      )}
                    </div>

                    {post.content && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{post.content}</p>}

                    <p className="mt-3 text-xs text-slate-400">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
