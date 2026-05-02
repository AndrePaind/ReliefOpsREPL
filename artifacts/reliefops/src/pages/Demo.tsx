import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, MapPin, Package, Truck, Users, Globe,
  UserCog, Activity, ArrowRight, Copy, Check, BookOpen,
  Zap, Building2, ClipboardList, BarChart3, Bell,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied "${code}" to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors shadow-sm"
    >
      <span className="text-primary tracking-wider">{code}</span>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  );
}

const missions = [
  {
    code: "SUDAN1",
    org: "UNICEF Sudan",
    description: "Humanitarian response in Khartoum, El Fasher and Port Sudan. Tracks food, medicine and NFIs across 3 major hubs.",
    color: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 text-blue-700",
    hubs: 3,
    role: "Admin",
  },
  {
    code: "SYRIA1",
    org: "MSF Syria",
    description: "Médecins Sans Frontières operations across Aleppo, Damascus, Idlib and Raqqa with medical supply tracking.",
    color: "from-red-500 to-red-600",
    badge: "bg-red-100 text-red-700",
    hubs: 4,
    role: "Admin",
  },
  {
    code: "YEMEN1",
    org: "IRC Yemen",
    description: "International Rescue Committee covering Sana'a, Aden, Marib and Hodeidah. Pre-assigned Admin for andrea.paindelli@gmail.com.",
    color: "from-orange-500 to-orange-600",
    badge: "bg-orange-100 text-orange-700",
    hubs: 4,
    role: "Admin (andrea.paindelli@gmail.com)",
  },
];

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    href: "/dashboard",
    color: "text-blue-500 bg-blue-50",
    description: "Real-time overview of supply levels, open requests, active transfers and recent activity across all your hubs.",
    tips: ["Check critical low-stock alerts at a glance", "See all open supply requests by priority", "Monitor active transfers in progress"],
  },
  {
    icon: MapPin,
    title: "Hubs & Stock",
    href: "/hubs",
    color: "text-emerald-500 bg-emerald-50",
    description: "Manage inventory across every logistics hub. Add stock, scan barcodes, import CSVs, and track expiry dates.",
    tips: ["Click any hub to view and edit its inventory", "Use the pencil icon to edit stock quantities inline", "Red rows flag items below 10 units — act fast"],
  },
  {
    icon: Package,
    title: "Supply Requests",
    href: "/requests",
    color: "text-violet-500 bg-violet-50",
    description: "Create and manage resupply requests between hubs. Set priority levels and track fulfilment status.",
    tips: ["Create a request with a specific item list and quantities", "Priorities: Draft → Open → Fulfilled → Cancelled", "Critical requests appear highlighted in red"],
  },
  {
    icon: Truck,
    title: "Transfers",
    href: "/transfers",
    color: "text-amber-500 bg-amber-50",
    description: "Track physical movement of supplies from origin to destination hub with status updates.",
    tips: ["Transfers link directly to supply requests", "Status flows: Pending → In Transit → Delivered", "Assign a volunteer driver to each transfer"],
  },
  {
    icon: Users,
    title: "Volunteers",
    href: "/volunteers",
    color: "text-pink-500 bg-pink-50",
    description: "Manage field volunteers: availability status, GPS location and vehicle capability.",
    tips: ["Filter by 'Available' to find who can take a delivery now", "Vehicle flag shows who has transport capacity", "Availability updates in real-time"],
  },
  {
    icon: Globe,
    title: "Shared Board",
    href: "/board",
    color: "text-teal-500 bg-teal-50",
    description: "Inter-NGO notice board — post surplus stock availability or critical needs visible to all organisations.",
    tips: ["Post a Need when you urgently require supplies", "Post Availability when you have surplus to offer", "All NGOs across all missions can see and respond"],
  },
  {
    icon: UserCog,
    title: "Team Management",
    href: "/team",
    color: "text-indigo-500 bg-indigo-50",
    description: "Manage who is on your team. Three roles: Admin (full access), Coordinator (operations), Viewer (read-only).",
    tips: ["Invite teammates by sharing your org invite code", "Admins can change roles and remove members", "Demo members show with a grey badge; pending with amber"],
  },
  {
    icon: Activity,
    title: "Activity Log",
    href: "/activity",
    color: "text-slate-500 bg-slate-100",
    description: "Full audit trail of every action taken in your organisation — stock changes, requests, transfers and team events.",
    tips: ["Scrollable timeline of all org activity", "Useful for accountability and reporting", "Filters by entity type coming soon"],
  },
];

const steps = [
  {
    step: "01",
    title: "Sign in and join a mission",
    description: "Create your account with Google or email, then enter one of the demo invite codes below in Settings → Join another team. You'll immediately see all that mission's data.",
    icon: Building2,
  },
  {
    step: "02",
    title: "Explore a hub's inventory",
    description: "Go to Hubs & Stock, click any hub card. You'll see live stock levels with low-stock and expiry warnings. Click the pencil icon on any row to edit quantities inline.",
    icon: MapPin,
  },
  {
    step: "03",
    title: "Create a supply request",
    description: "Head to Supply Requests → New Request. Pick the requesting hub, set priority (Critical/Urgent/Normal), and add the items needed with quantities. Save as Draft or publish as Open.",
    icon: ClipboardList,
  },
  {
    step: "04",
    title: "Switch between missions",
    description: "Join multiple missions and use the org switcher in the top-left of the sidebar to jump between them. Each mission's data loads fresh — no page reload required.",
    icon: Zap,
  },
  {
    step: "05",
    title: "Check the Shared Board",
    description: "Visit the Shared Board to see what other NGOs have posted. You can post your own surplus stock offers or critical needs — visible across all organisations.",
    icon: Bell,
  },
  {
    step: "06",
    title: "Manage your team",
    description: "As an Admin, go to Team Management to see your roster, change member roles, or share your invite code so colleagues can join. Roles control what each person can edit.",
    icon: BarChart3,
  },
];

export default function Demo() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-orange-600 p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0tNiA2aDZ2Nmgtdi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-xs uppercase tracking-widest">
            <BookOpen className="h-3 w-3 mr-1" /> Interactive Demo Guide
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Welcome to ReliefOps
          </h1>
          <p className="text-white/80 text-lg max-w-2xl leading-relaxed">
            ReliefOps is a humanitarian logistics platform for NGO coordinators. Track stock across field hubs, manage supply requests and transfers, coordinate volunteers, and collaborate with other organisations — all in one place.
          </p>
          <p className="text-white/60 mt-3 text-sm">
            Three live demo missions are pre-loaded with real-world data. Join any of them below to start exploring.
          </p>
        </div>
      </div>

      {/* Demo Missions */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Demo Missions</h2>
            <p className="text-sm text-slate-500">Join any mission using its invite code in Settings → Join another team</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {missions.map((m) => (
            <Card key={m.code} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className={`h-2 bg-gradient-to-r ${m.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{m.org}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{m.hubs} logistics hubs</p>
                  </div>
                  <Badge className={`text-xs ${m.badge}`}>{m.hubs} hubs</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{m.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Invite Code</p>
                    <CopyCode code={m.code} />
                  </div>
                  <Link href="/settings">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-slate-500">
                      Join <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Step-by-step */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Getting Started</h2>
            <p className="text-sm text-slate-500">Follow these steps to get the most out of ReliefOps</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Step {s.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Deep-dives */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Feature Guide</h2>
            <p className="text-sm text-slate-500">What each section does and how to use it</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.href} className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-bold text-slate-900">{f.title}</h3>
                        <Link href={f.href}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-slate-400 group-hover:text-primary transition-colors">
                            Go <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{f.description}</p>
                      <ul className="space-y-1">
                        {f.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to explore?</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">Join a demo mission and experience the full ReliefOps workflow. Use the invite codes above to get started.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
            </Button>
          </Link>
          <Link href="/settings">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
              <Building2 className="h-4 w-4" /> Join a Mission
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
