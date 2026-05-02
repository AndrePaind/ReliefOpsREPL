import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Activity, MapPin, Package, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between z-10 sticky top-0 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">ReliefOps</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Log in
          </Link>
          <Link href="/sign-up">
            <Button className="font-semibold shadow-sm active-elevate-2">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-8">
            <ShieldAlert className="h-3.5 w-3.5" />
            Crisis Logistics Command Center
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Coordinate relief. <br/>
            <span className="text-primary">Save lives faster.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The mission-critical platform for NGO coordinators and volunteer leads. 
            Manage supplies, track transfers, and route critical resources across multiple hubs under pressure.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold shadow-lg shadow-primary/20 active-elevate-2">
                Deploy ReliefOps <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-semibold bg-white">
                Access Command Center
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-24 relative z-10 text-left"
        >
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
              <MapPin className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Hub Visibility</h3>
            <p className="text-slate-600 leading-relaxed">
              Monitor inventory across your entire logistics network in real-time. Identify bottlenecks before they become critical shortages.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
              <Activity className="h-6 w-6 text-orange-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Urgent Prioritization</h3>
            <p className="text-slate-600 leading-relaxed">
              Triage incoming requests by severity. Smart matching algorithms automatically suggest the optimal hub to fulfill critical needs.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
              <Package className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Rapid Stock Import</h3>
            <p className="text-slate-600 leading-relaxed">
              Onboard hundreds of donated items in seconds via CSV import or live barcode scanning. Keep data dense and entry fast.
            </p>
          </div>
        </motion.div>
      </main>
      
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200 bg-white">
        <p>Built for resilience. Ready for impact.</p>
      </footer>
    </div>
  );
}
