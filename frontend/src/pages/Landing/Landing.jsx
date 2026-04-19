import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Target, Layout } from 'lucide-react';

// Using Framer Motion for scroll animations later, for now we will use standard classes
const Landing = () => {
  // Simple intersection observer for scroll animations
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
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-surface/80 backdrop-blur-md border-b border-[rgba(73,69,79,0.15)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Hirevex</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/signup" className="btn-primary">Request Access</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[150px] opacity-20 pointer-events-none animate-pulse"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary mb-8 scroll-animate from-bottom">
            <Sparkles size={16} />
            <span className="text-sm font-semibold tracking-wide">INTRODUCING HIREVEX AI</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8 scroll-animate from-bottom delay-1 text-on-surface">
            Stop Sifting.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Start Selecting.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto mb-10 scroll-animate from-bottom delay-2">
            The intelligent hiring platform that reads resumes, ranks candidates, and explains why they match.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 scroll-animate from-bottom delay-3">
            <Link to="/signup" className="btn-primary w-full sm:w-auto text-lg px-10 py-4">Start Hiring Smarter</Link>
            <a href="#how-it-works" className="btn-secondary w-full sm:w-auto text-lg px-10 py-4">See How It Works</a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate from-bottom">
            <h2 className="text-4xl font-bold mb-4">Explainable AI Matters</h2>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
              We don't just give you a score. We show you exactly why a candidate is right for the role.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Instant Analysis", desc: "Upload 100s of resumes and get them parsed, structured, and ranked in seconds." },
              { icon: Target, title: "Precision Matching", desc: "Our algorithm matches candidate skills to your specific job requirements." },
              { icon: Layout, title: "Visual Pipeline", desc: "Drag and drop candidates through stages in a beautiful Kanban command center." }
            ].map((feature, i) => (
              <div key={i} className={`card glass-card p-8 scroll-animate from-bottom delay-${i+1}`}>
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-cta opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 scroll-animate from-bottom">
          <h2 className="text-5xl font-bold mb-8">Ready to upgrade your hiring?</h2>
          <p className="text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto">
            Join the future of intelligent recruiting today.
          </p>
          <Link to="/signup" className="btn-primary text-lg px-12 py-5 shadow-[0_0_40px_rgba(124,135,243,0.5)]">
            Create Your Command Center
          </Link>
        </div>
      </section>
      
      {/* Footer minimal */}
      <footer className="py-10 border-t border-[rgba(73,69,79,0.15)] text-center text-sm text-on-surface-variant">
        <p>© 2026 Hirevex. Designed for the future of work.</p>
      </footer>
    </div>
  );
};

export default Landing;
