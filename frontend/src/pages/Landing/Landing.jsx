import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Play, CheckCircle2, BarChart3, Users, Briefcase, UserCheck, ArrowRight, Activity, Zap, FileText, Layout, ChevronDown } from 'lucide-react';

const Landing = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C14] text-white font-sans overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#7c87f3] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-[#ffb783] rounded-full blur-[180px] opacity-[0.08] pointer-events-none"></div>

      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 bg-[#0A0C14]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-primary grid grid-cols-2 gap-0.5 p-1.5">
              <div className="bg-white/80 rounded-sm"></div>
              <div className="bg-white/40 rounded-sm"></div>
              <div className="bg-white/60 rounded-sm"></div>
              <div className="bg-white/90 rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">HireVex</h1>
              <span className="text-[9px] font-semibold text-primary tracking-widest uppercase">Intelligent ATS</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <button className="hover:text-white flex items-center gap-1">Product <ChevronDown size={14} className="opacity-50"/></button>
            <button className="hover:text-white flex items-center gap-1">Solutions <ChevronDown size={14} className="opacity-50"/></button>
            <button className="hover:text-white flex items-center gap-1">Resources <ChevronDown size={14} className="opacity-50"/></button>
            <button className="hover:text-white">Pricing</button>
            <button className="hover:text-white">About Us</button>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Log In</Link>
            <Link to="/signup" className="text-sm font-semibold px-6 py-2.5 rounded-full bg-[#7c87f3] text-white hover:bg-[#6b75e6] shadow-[0_0_20px_rgba(124,135,243,0.3)] transition-all">Request Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 min-h-[90vh] max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7c87f3]/30 bg-[#7c87f3]/10 text-white mb-6 scroll-animate from-bottom shadow-[0_0_15px_rgba(124,135,243,0.15)]">
            <Sparkles size={14} className="text-[#bdc2ff]" />
            <span className="text-xs font-semibold tracking-wide">AI-Powered Hiring, Simplified</span>
          </div>
          
          <h1 className="text-5xl md:text-[4rem] font-bold tracking-tight leading-[1.1] mb-6 scroll-animate from-bottom delay-1">
            Hire the right talent,<br />
            faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#bdc2ff] via-[#e2c1eb] to-[#ffb783]">HireVex</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-8 scroll-animate from-bottom delay-2 leading-relaxed max-w-xl">
            Automate your recruitment workflow, rank candidates with precision using AI, and make data-driven hiring decisions effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 scroll-animate from-bottom delay-3">
            <Link to="/signup" className="w-full sm:w-auto text-base font-semibold px-8 py-4 rounded-full bg-[#7c87f3] text-white hover:bg-[#6b75e6] shadow-[0_4px_20px_rgba(124,135,243,0.4)] transition-all flex items-center justify-center gap-2 group">
              Request Demo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto text-base font-semibold px-8 py-4 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Play size={18} /> Watch Video
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400 font-medium scroll-animate from-bottom delay-4">
            <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#4ade80]" /> 14-Day Free Trial</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#4ade80]" /> No Credit Card</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#4ade80]" /> Cancel Anytime</div>
          </div>
        </div>

        {/* Right: Dashboard Visual */}
        <div className="relative z-10 w-full aspect-square md:aspect-[4/3] perspective-1000 scroll-animate from-right delay-2 hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c87f3]/10 to-transparent rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl p-6 transform rotate-y-[-5deg] rotate-x-[2deg] translate-z-10 flex flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-semibold text-lg">Dashboard Overview</h3>
              <div className="px-3 py-1 bg-white/5 rounded-lg text-xs text-gray-400 border border-white/5">This Month</div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { l: 'Total Candidates', v: '1,248', c: '+12%', i: Users },
                { l: 'Jobs Posted', v: '32', c: '+4%', i: Briefcase },
                { l: 'Applications', v: '892', c: '+18%', i: FileText },
                { l: 'Hires', v: '46', c: '+8%', i: UserCheck }
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <s.i size={14} className="text-[#bdc2ff]" />
                    <span className="text-[10px] font-bold text-[#4ade80] bg-[#4ade80]/10 px-1.5 py-0.5 rounded">{s.c}</span>
                  </div>
                  <div className="text-xl font-bold">{s.v}</div>
                  <div className="text-[10px] text-gray-400">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {/* Chart Area */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col">
                <h4 className="text-xs font-semibold mb-4 text-gray-300">Applications Over Time</h4>
                <div className="flex-1 flex items-end gap-1.5 pt-4">
                  {[40, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-[#7c87f3] to-[#bdc2ff] rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col">
                <h4 className="text-xs font-semibold mb-4 text-gray-300">Recent Activity</h4>
                <div className="space-y-3 flex-1 overflow-hidden">
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded bg-[#4ade80]/20 flex items-center justify-center text-[#4ade80]"><FileText size={12}/></div>
                    <div><p className="text-[11px] font-medium">New application received</p><p className="text-[9px] text-gray-500">2 mins ago</p></div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded bg-[#bdc2ff]/20 flex items-center justify-center text-[#bdc2ff]"><UserCheck size={12}/></div>
                    <div><p className="text-[11px] font-medium">Interview scheduled</p><p className="text-[9px] text-gray-500">15 mins ago</p></div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded bg-[#ffb783]/20 flex items-center justify-center text-[#ffb783]"><Zap size={12}/></div>
                    <div><p className="text-[11px] font-medium">AI Analysis completed</p><p className="text-[9px] text-gray-500">1 hr ago</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-center text-sm text-gray-500 font-medium mb-8 scroll-animate from-bottom">
            Trusted by growing companies around the world
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 scroll-animate from-bottom delay-1">
            {['Acme Corp', 'Boltshift', 'Layers', 'Magnolia', 'Vertica', 'Spherule'].map((company, i) => (
              <span key={i} className="text-xl md:text-2xl font-bold tracking-tight text-gray-600 hover:text-gray-400 transition-colors cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16 scroll-animate from-bottom">
            <h2 className="text-4xl font-bold mb-4">Everything you need to hire better</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              A complete toolkit designed to streamline your recruitment process from sourcing to hiring.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "AI-Powered Matching", desc: "Instantly score and rank candidates based on deep analysis of skills and experience." },
              { icon: Activity, title: "Automated Workflows", desc: "Set up rules to automatically move candidates through stages and send communications." },
              { icon: BarChart3, title: "Data-Driven Insights", desc: "Make informed decisions with real-time analytics on pipeline health and sourcing." },
              { icon: Users, title: "Better Candidate Experience", desc: "Keep candidates engaged with automated updates and a seamless application process." }
            ].map((feature, i) => (
              <div key={i} className={`bg-[#131b2e]/50 border border-white/5 rounded-[24px] p-8 hover:bg-[#131b2e] transition-colors scroll-animate from-bottom delay-${i+1}`}>
                <div className="w-12 h-12 rounded-2xl bg-[#7c87f3]/10 text-[#7c87f3] flex items-center justify-center mb-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 scroll-animate from-bottom">
          <h2 className="text-5xl font-bold mb-8">Ready to transform your hiring?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto text-lg font-semibold px-10 py-4 rounded-full bg-[#7c87f3] text-white hover:bg-[#6b75e6] shadow-[0_4px_20px_rgba(124,135,243,0.3)] transition-all">
              Request Demo
            </Link>
            <Link to="/signup" className="w-full sm:w-auto text-lg font-semibold px-10 py-4 rounded-full border border-white/20 hover:bg-white/5 transition-all">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-[#0A0C14]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-gradient-primary grid grid-cols-2 gap-[1px] p-1">
                <div className="bg-white/80"></div><div className="bg-white/40"></div><div className="bg-white/60"></div><div className="bg-white/90"></div>
              </div>
              <span className="font-bold text-lg tracking-tight">HireVex</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Integrations</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Solutions</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white">Startups</a></li>
              <li><a href="#" className="hover:text-white">Enterprise</a></li>
              <li><a href="#" className="hover:text-white">Agencies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold mb-4 text-gray-200">Stay Updated</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:border-[#7c87f3]" />
              <button className="bg-[#7c87f3] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6b75e6]">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 HireVex Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">LinkedIn</a>
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
