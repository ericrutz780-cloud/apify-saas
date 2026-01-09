import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Zap, 
  Search, 
  Eye, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Globe,
  LayoutGrid,
  Bookmark,
  CreditCard,
  LogOut,
  User,
  Menu,
  X,
  HelpCircle,
  MousePointerClick,
  ArrowUpDown
} from 'lucide-react';

// --- Components ---

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-[11px] font-bold uppercase tracking-wider mb-4 shadow-sm select-none">
    <Zap className="w-3 h-3 fill-brand-600" />
    {children}
  </div>
);

const SectionHeader = ({ 
  badge, 
  title, 
  subtitle, 
  centered = true,
  className = ""
}: { 
  badge: string, 
  title: React.ReactNode, 
  subtitle?: string, 
  centered?: boolean,
  className?: string
}) => (
  <div className={`mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : ''} ${className}`}>
    <SectionBadge>{badge}</SectionBadge>
    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
      {title}
    </h2>
    {subtitle && <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium">{subtitle}</p>}
  </div>
);

// Mock Data for Ad Versions Modal (Code erhalten)
const AD_VERSIONS_DATA = [
  { id: '5458701543975786', status: 'Active', startDate: '12/29/2025', targeting: 'United States, Canada', reach: '8,500,000', score: 94, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458916033257559', status: 'Active', startDate: '12/29/2025', targeting: '6 Countries', reach: '10,452,100', score: 45, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458876823905231', status: 'Active', startDate: '12/28/2025', targeting: '6 Countries', reach: '10,452,100', score: 83, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458186784830746', status: 'Active', startDate: '12/27/2025', targeting: '6 Countries', reach: '10,452,100', score: 91, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458861318115398', status: 'Active', startDate: '12/26/2025', targeting: '6 Countries', reach: '10,452,100', score: 43, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458473604549379', status: 'Active', startDate: '12/26/2025', targeting: 'United States, Canada', reach: '8,500,000', score: 84, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458794538222036', status: 'Active', startDate: '12/25/2025', targeting: 'Germany', reach: '1,200,000', score: 77, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { id: '5458367918309571', status: 'Active', startDate: '12/25/2025', targeting: 'Germany', reach: '1,200,000', score: 66, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
];

const AdVersionsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-white z-10">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0 shadow-sm">
              <Layers className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">36 Ad Versions</h3>
              <p className="text-slate-500 text-sm mt-0.5">Shared creative text • Different targeting/dates</p>
              
              <div className="mt-4 flex gap-2">
                 <button className="text-xs font-semibold text-brand-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm">
                    <LayoutGrid className="w-3.5 h-3.5" /> Overview
                 </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-white">
           <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-lg font-bold text-slate-900">Version History & Performance</h4>
                 <button className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm bg-white">
                    Export CSV
                 </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-4">Ad Version</th>
                      <th className="px-6 py-4">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">Start Date <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4">Targeting</th>
                      <th className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-slate-700">Reach Est. <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-slate-700">Viral Score <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {AD_VERSIONS_DATA.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors group bg-white">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                              <img src={row.img} alt="Ad Thumbnail" className="w-10 h-10 rounded-md object-cover border border-slate-200 shadow-sm" />
                              <div>
                                 <div className="font-bold text-slate-900 text-xs tracking-wide">ID: {row.id}</div>
                                 <div className="text-green-600 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"></span>
                                    {row.status}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{row.startDate}</td>
                        <td className="px-6 py-4 text-slate-600">{row.targeting}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{row.reach}</td>
                        <td className="px-6 py-4 text-center">
                           <div className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${
                              row.score >= 80 ? 'bg-green-100 text-green-700' :
                              row.score >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-500'
                           }`}>
                              {row.score}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-brand-600 font-bold text-xs hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};


const LandingHeader = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const navLinks = [
    { name: 'The Logic', id: 'logic' },
    { name: 'The Viral Score', id: 'viral-score' },
    { name: 'Workflow', id: 'workflow' },
    { name: 'Use Cases', id: 'use-cases' },
    { name: 'Pricing', id: 'pricing' },
    { name: 'FAQ', id: 'faq' },
  ];

  // Handle scroll spy to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map(link => document.getElementById(link.id));
      const scrollPosition = window.scrollY + 100; // Offset

      for (const section of sections) {
        if (section && section.offsetTop <= scrollPosition && (section.offsetTop + section.offsetHeight) > scrollPosition) {
          setActiveSection(section.id);
          return;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Header height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={scrollToTop}>
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-600/20 group-hover:scale-105 transition-transform">
            <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">StellaAds</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a 
              key={link.id}
              href={`#${link.id}`} 
              onClick={(e) => scrollToSection(e, link.id)} 
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeSection === link.id 
                  ? 'text-brand-600 bg-brand-50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </button>
          <a 
            href="#pricing" 
            onClick={(e) => scrollToSection(e, 'pricing')} 
            className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Analysis
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-slate-600 hover:text-slate-900 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 shadow-2xl absolute top-16 left-0 right-0 h-screen flex flex-col gap-6 animate-in slide-in-from-top-5">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a 
                key={link.id}
                href={`#${link.id}`} 
                onClick={(e) => scrollToSection(e, link.id)} 
                className="text-lg font-medium text-slate-600 hover:text-brand-600 py-2 border-b border-slate-50"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <button 
              onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} 
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Log in
            </button>
            <a 
              href="#pricing" 
              onClick={(e) => scrollToSection(e, 'pricing')} 
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 text-center shadow-lg shadow-brand-600/20"
            >
              Start Analysis
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  const scrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('pricing');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden bg-slate-50">
      {/* Background Decorations */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(50%_50%_at_50%_0%,#f5f3ff_0%,transparent_100%)] -z-10"></div>

      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold mb-8 shadow-sm hover:shadow-md transition-shadow cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Tracking 12 European Markets Live
        </div>
        
        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.05]">
          Find Winning Ads <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-purple-600 to-blue-600 animate-gradient-x">Before They Go Viral.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          The fastest way to identify winning ads. We track <strong>live performance</strong> data to show you exactly which creatives are scaling right now.
        </p>
        
        {/* CTA Button */}
        <div className="flex flex-col items-center gap-4">
          <a href="#pricing" onClick={scrollToPricing} className="group bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-[1.02] flex items-center gap-2 shadow-xl shadow-brand-600/30">
            Start Finding Winners
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <span className="text-sm text-slate-400 font-medium">Starts at €19/mo</span>
        </div>

        {/* --- HIER IST DAS EINGEBAUTE VIDEO --- */}
        <div className="mt-20 relative mx-auto max-w-6xl group perspective-1000">
          <div className="relative rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden bg-white ring-1 ring-slate-900/5 transition-transform duration-500 hover:scale-[1.01]">
              
              {/* Browser Leiste (Design-Element) */}
              <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/30"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/30"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/30"></div>
                  </div>
                  {/* Fake URL Bar */}
                  <div className="mx-auto bg-white border border-slate-200 rounded-md px-3 py-1 text-[10px] text-slate-400 font-medium w-64 text-center flex items-center justify-center gap-1 shadow-sm">
                    <ShieldCheck className="w-2.5 h-2.5 text-slate-300" />
                    stellaads.com/dashboard
                  </div>
              </div>
              
              {/* Der Video Player */}
              <div className="relative aspect-video bg-slate-100">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                >
                  {/* Pfad zum Video im public Ordner */}
                  <source src="/demo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Optionaler Schatten unten */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
              </div>
          </div>
          
          {/* Schwebendes Statistik-Badge (Viral Score) */}
          <div className="absolute -right-6 top-1/4 bg-white p-5 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 hidden lg:block animate-bounce-slow z-10 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Viral Score</div>
                      <div className="text-xl font-bold text-slate-900">98/100</div>
                  </div>
              </div>
              <div className="h-1.5 w-40 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-[98%] animate-pulse"></div>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Section 2: The Logic
const LogicSection = () => (
  <section id="logic" className="py-32 bg-white relative scroll-mt-20">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
      <div>
        <SectionHeader 
          badge="The Logic"
          title={<>Efficiency Over <span className="text-slate-400">Volume</span></>}
          subtitle="Standard tools rely on cumulative metrics, often flagging saturated winners too late. We analyze the growth velocity relative to the estimated ad spend."
          centered={false}
        />
        
        <div className="space-y-6">
           <div className="flex gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="mt-1 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                 <MousePointerClick className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                 <h3 className="text-slate-900 font-bold mb-2">Acceleration vs. History</h3>
                 <p className="text-slate-600 leading-relaxed">We prioritize current acceleration over historical accumulation. Our system identifies ads that generate high media value in a short timeframe, distinguishing fresh scalers from saturated campaigns.</p>
              </div>
           </div>
        </div>
      </div>

      <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        
        <h3 className="text-xl font-bold mb-10 relative z-10">Detection Speed Comparison</h3>
        <div className="space-y-10 relative z-10">
            <div>
                <div className="flex justify-between text-sm font-medium text-slate-400 mb-3">
                    <span>Standard Spy Tools</span>
                    <span>Late Detection (High Volume)</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 w-[80%] rounded-full"></div>
                </div>
            </div>
            
            <div>
                <div className="flex justify-between text-sm font-bold text-white mb-3">
                    <span className="flex items-center gap-2 text-brand-400"><Zap className="w-4 h-4 fill-brand-400" /> StellaAds</span>
                    <span>Early Detection (High Velocity)</span>
                </div>
                <div className="h-5 bg-slate-800 rounded-full overflow-hidden ring-1 ring-slate-700">
                    <div className="h-full bg-gradient-to-r from-brand-600 to-blue-500 w-[30%] rounded-full relative shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-800 pt-8">
            <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">48h</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Avg. Detection</div>
            </div>
            <div className="text-center border-l border-slate-800">
                <div className="text-4xl font-bold text-green-400 mb-1">Live</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Data Refresh</div>
            </div>
        </div>
      </div>
    </div>
  </section>
);

// Section 3: The Viral Score
const USPSection = () => (
  <section id="viral-score" className="py-24 px-6 bg-slate-50 border-t border-slate-200 scroll-mt-20">
    <div className="max-w-7xl mx-auto">
      <SectionHeader 
        badge="The Viral Score"
        title="The Unfair Advantage"
        subtitle="Stop guessing. Our proprietary scoring engine separates the winners from the noise using three key vectors."
      />

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <TrendingUp className="w-6 h-6 text-brand-600" />,
            title: "Spot Fresh Scalers",
            description: "Don't wait for 50k likes. Our velocity metric highlights campaigns with high daily spend and reach, even if they launched just 48 hours ago."
          },
          {
            icon: <ShieldCheck className="w-6 h-6 text-brand-600" />,
            title: "Quality over Quantity",
            description: "We filter out \"empty\" metrics. The score identifies ads backed by real budget commitment (CPR) and scaling potential."
          },
          {
            icon: <Globe className="w-6 h-6 text-brand-600" />,
            title: "Live-Market Intelligence",
            description: "While others rely on static data, our system calibrates itself in real-time against current market conditions."
          }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-6 border border-brand-100 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Section 4: Workflow
const WorkflowSection = () => (
  <section id="workflow" className="py-32 bg-white px-6 scroll-mt-20">
    <div className="max-w-7xl mx-auto">
      <SectionHeader 
        badge="Workflow"
        title="Three Steps to Win"
        subtitle="Streamlined for speed. Go from blank page to winning product idea in under 60 seconds."
      />

      <div className="grid md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-slate-200 via-brand-200 to-slate-200 -z-10"></div>

        {[
          {
            step: "01",
            title: "Search",
            desc: "Query the live ad libraries for your specific keyword (e.g., 'Skincare', 'Tech').",
            icon: <Search className="w-6 h-6 text-slate-700" />
          },
          {
            step: "02",
            title: "Score",
            desc: "Sort results by Viral Score to see the most efficient ads first.",
            icon: <BarChart2 className="w-6 h-6 text-slate-700" />
          },
          {
            step: "03",
            title: "Analyze",
            desc: "Inspect active ad details to understand targeting and creative structure.",
            icon: <Eye className="w-6 h-6 text-slate-700" />
          }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-300 group-hover:border-brand-200">
              <span className="absolute -top-1 -right-1 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold border-4 border-white shadow-sm">{item.step}</span>
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mx-auto">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Section 5: Use Cases
const UseCasesSection = () => (
  <section id="use-cases" className="py-24 px-6 bg-slate-50 border-y border-slate-200 scroll-mt-20">
    <div className="max-w-7xl mx-auto">
      <SectionHeader 
        badge="Use Cases"
        title="Built for Speed"
        subtitle="Whether you are a solo founder or a scaling agency, speed to market is your only competitive advantage."
      />

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { 
            role: "Dropshippers", 
            text: "Find products currently scaling in specific European markets.",
            icon: <Globe className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-50 border-blue-100" 
          },
          { 
            role: "Brand Owners", 
            text: "Monitor active competitor creatives in your niche.",
            icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
            bg: "bg-purple-50 border-purple-100"
          },
          { 
            role: "Agencies", 
            text: "Gather data-backed creative references for your clients.",
            icon: <Layers className="w-6 h-6 text-indigo-600" />,
            bg: "bg-indigo-50 border-indigo-100"
          },
        ].map((useCase, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-start">
            <div className={`w-14 h-14 rounded-xl ${useCase.bg} border flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
              {useCase.icon}
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">{useCase.role}</h4>
            <p className="text-slate-600 leading-relaxed text-sm">{useCase.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Section 6: Pricing
const PricingSection = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-32 px-6 relative bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <SectionHeader 
            badge="Pricing"
            title="Flexible Plans"
            subtitle="Start small and scale as you grow. No hidden fees."
        />
        
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Yearly <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wide">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white rounded-3xl p-10 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col shadow-sm hover:shadow-lg relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Starter</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium">Best for: Occasional Research</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-slate-900 tracking-tight">€{isAnnual ? '15' : '19'}</span>
              <span className="text-slate-500 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-slate-600" /></div> 1,500 Credits
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-slate-600" /></div> Meta & TikTok Search
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-700 font-bold hover:border-slate-300 hover:bg-slate-50 transition-all">
              Select Starter
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 flex flex-col relative shadow-2xl shadow-slate-900/10 transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg border-4 border-white">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Pro</h3>
              <p className="text-slate-400 text-sm mt-2 font-medium">Best for: Heavy Users & Scaling</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white tracking-tight">€{isAnnual ? '39' : '49'}</span>
              <span className="text-slate-400 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-brand-400" /></div> 5,000 Credits
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-brand-400" /></div> Deep Viral Score Details
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-brand-400" /></div> CSV/JSON Export
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500 transition-all shadow-lg shadow-brand-900/30">
              Select Pro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Section 7: FAQ
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:border-brand-200 hover:shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 pr-8">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-brand-600 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="p-6 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-50 bg-slate-50/50">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQSection = () => {
  const faqs = [
    { q: "How is the score calculated?", a: "It combines reach, runtime, and regional benchmarks into a normalized value (0-100) to measure efficiency." },
    { q: "Is the data live?", a: "Yes, we scrape the data in real-time when you execute a search." },
    { q: "What is a Credit?", a: "1 Credit = 1 Ad Result loaded and analyzed. You pay only for the data you request." },
    { q: "Does it work for Europe?", a: "Yes, our algorithm includes market benchmarks for all major European countries." }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50 px-6 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <SectionHeader 
            badge="FAQ"
            title="Common Questions"
            subtitle="Everything you need to know about the platform and billing."
            className="mb-12"
        />
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <FAQItem key={idx} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 px-6 border-t border-slate-200 bg-white text-center">
    <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
      <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
        <Zap className="text-white w-3.5 h-3.5 fill-white" />
      </div>
      <span className="font-bold text-slate-900">StellaAds</span>
    </div>
    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} StellaAds. All rights reserved.</p>
  </footer>
);

// --- Pages ---

export const LandingPage = () => (
  <div className="bg-slate-50 min-h-screen">
    <LandingHeader />
    <main>
      <Hero />
      <LogicSection />
      <USPSection />
      <WorkflowSection />
      <UseCasesSection />
      <PricingSection />
      <FAQSection />
    </main>
    <Footer />
  </div>
);

// --- Original Mock Pages (Preserved as requested) ---

const LoginPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md border border-slate-200 shadow-xl">
      <div className="flex justify-center mb-8">
        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-xl shadow-brand-600/30">
          <Zap className="text-white w-7 h-7 fill-white" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Welcome back</h2>
      <p className="text-slate-500 text-center mb-8">Enter your credentials to access the live dashboard.</p>
      
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onNavigate('DASHBOARD'); }}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
          <input 
            type="email" 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-slate-50 font-medium text-slate-900"
            placeholder="name@company.com" 
            defaultValue="marketer@stellaads.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            type="password" 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-slate-50 font-medium text-slate-900"
            placeholder="••••••••" 
            defaultValue="password"
          />
        </div>
        
        <button type="submit" className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg mt-4">
          Sign In
        </button>
      </form>
      
      <div className="mt-8 text-center text-sm">
        <span className="text-slate-500">Don't have an account? </span>
        <button onClick={() => onNavigate('LANDING')} className="text-brand-600 font-bold hover:underline">
          Sign up
        </button>
      </div>
    </div>
  </div>
);

const DashboardPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AdVersionsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Dashboard Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('LANDING')}>
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md">
                    <Zap className="text-white w-5 h-5 fill-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">StellaAds</span>
                </div>
                
                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                    <button className="px-3 py-1.5 bg-white text-slate-900 text-sm font-medium rounded-md shadow-sm border border-slate-200 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-brand-600" />
                        Dashboard
                    </button>
                    <button className="px-3 py-1.5 text-slate-500 text-sm font-medium rounded-md hover:bg-slate-100 hover:text-slate-700 flex items-center gap-2 transition-colors">
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                    <button className="px-3 py-1.5 text-slate-500 text-sm font-medium rounded-md hover:bg-slate-100 hover:text-slate-700 flex items-center gap-2 transition-colors">
                        <Bookmark className="w-4 h-4" />
                        Saved
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-semibold text-slate-700">1500 <span className="text-slate-400 font-normal">credits</span></span>
                </div>
                <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                    Buy more
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                 <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center border border-purple-200">
                    A
                </div>
                <button onClick={() => onNavigate('LANDING')} className="text-slate-400 hover:text-slate-600">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 md:p-8">
        {/* Page Title */}
        <div className="flex items-end justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
                <p className="text-slate-500">Overview of your activity and available credits.</p>
            </div>
            <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                New Search
            </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-500 text-sm font-medium">Credits Available</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                        <CreditCard className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">1500</span>
                    <span className="text-slate-400 font-medium">credits</span>
                </div>
                <a href="#" className="text-brand-600 text-sm font-semibold hover:text-brand-700 flex items-center gap-1">
                    Top up credits <ArrowRight className="w-3 h-3" />
                </a>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-500 text-sm font-medium">Total Searches</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                        <BarChart2 className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">6</span>
                </div>
                <div className="flex gap-2">
                    {['Skincare', 'Nike', 'SaaS', 'Coffee'].map(tag => (
                        <span key={tag} className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-500 text-sm font-medium">Active Plan</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                        <Zap className="w-4 h-4" />
                    </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">Starter</span>
                </div>
                <div className="text-sm text-slate-400">
                    Renews on Nov 1, 2023
                </div>
            </div>
        </div>

        {/* Recent Searches Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Recent Searches</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Query</th>
                            <th className="px-6 py-4">Platform</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[
                            { q: 'Skincare', p: 'Both', d: '12/26/2025' },
                            { q: 'Nike', p: 'Meta', d: '12/25/2025' },
                            { q: 'SaaS', p: 'Meta', d: '12/24/2025' },
                            { q: 'Coffee', p: 'Tiktok', d: '12/23/2025' },
                            { q: 'Skincare', p: 'Meta', d: '12/22/2025' },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.q}</td>
                                <td className="px-6 py-4 text-slate-500">{row.p}</td>
                                <td className="px-6 py-4 text-slate-500">{row.d}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => setIsModalOpen(true)}
                                      className="text-brand-600 hover:text-brand-700 font-medium hover:underline text-xs"
                                    >
                                        View Versions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};