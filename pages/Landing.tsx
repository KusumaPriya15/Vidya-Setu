import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, Video, Sparkles, ArrowRight, CheckCircle, Play } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="p-2 bg-indigo-600 rounded-xl group-hover:bg-indigo-700 transition-colors duration-300 shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              VidyaSetu
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 px-3 py-2 sm:px-4"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-indigo-600 border border-transparent rounded-full hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5"
            >
              Sign up free
            </button>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-16">
        {/* Split Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-20 lg:pb-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* Hero Text */}
            <div className="lg:col-span-6 text-center lg:text-left mb-16 lg:mb-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">The New Standard in EdTech</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                Learn Without <br className="hidden sm:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  Limitations
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Connect with world-class mentors, experience AI-driven personalized quizzes, and collaborate in pristine live sessions. Empowering your journey from curious to capable.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <button 
                  onClick={() => navigate('/register')} 
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-indigo-600 rounded-full hover:bg-indigo-700 hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:-translate-y-1"
                >
                  Start Learning Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                
                <button 
                  onClick={() => navigate('/login')} 
                  className="w-full sm:w-auto group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-700 transition-all duration-300 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                >
                  <Play className="w-4 h-4 mr-2 text-indigo-600 group-hover:scale-110 transition-transform" fill="currentColor" />
                  Watch Demo
                </button>
              </div>
              
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 font-medium">
                <div className="flex -space-x-2">
                  <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User" />
                  <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="User" />
                  <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="User" />
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold">+10k</div>
                </div>
                Trusted by 10,000+ ambitious learners
              </div>
            </div>

            {/* Hero Image */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-violet-50 rounded-3xl transform rotate-3 scale-105 -z-10"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-white">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1740&auto=format&fit=crop" 
                  alt="Students learning together" 
                  className="w-full h-auto object-cover object-center aspect-[4/3]"
                />
                
                {/* Floating Card UI */}
                <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-72 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100 animate-fade-in-up">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Course Completed!</h4>
                      <p className="text-xs text-slate-500">Advanced React Patterns</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Cloud */}
        <section className="border-y border-slate-200 bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Empowering top institutions and individuals</p>
            <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-50 grayscale">
              {/* Mock Logos - Replace with actual SVGs or Images if needed */}
              <div className="text-2xl font-black font-serif">University X</div>
              <div className="text-2xl font-black font-mono">TechCorp</div>
              <div className="text-2xl font-black tracking-tighter">GLOBAL EDU</div>
              <div className="text-2xl font-black italic">Innovate.</div>
            </div>
          </div>
        </section>

        {/* Zig-Zag Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Why VidyaSetu</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Everything you need, built in.</h3>
          </div>

          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-lg group">
              <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop" alt="AI Learning" className="w-full h-[400px] object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">AI-Powered Intelligence</h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Supercharge your study sessions with Google Gemini. Our platform instantly generates context-aware quizzes, provides intelligent hints, and dynamically adjusts difficulty based on your performance.
              </p>
              <ul className="space-y-3">
                {['Smart question generation', 'Personalized hints & explanations', 'Adaptive difficulty curves'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-indigo-500 mr-3" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-1 lg:order-1">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Elite Mentorship</h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Don't learn in a vacuum. Connect with vetted industry professionals who analyze your progress, offer bespoke career advice, and guide you through blockages.
              </p>
              <ul className="space-y-3">
                {['1-on-1 private messaging', 'Structured mentorship requests', 'Real-world industry insights'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-violet-500 mr-3" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-2 lg:order-2 relative rounded-3xl overflow-hidden shadow-lg group">
              <div className="absolute inset-0 bg-violet-600/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1740&auto=format&fit=crop" alt="Mentorship" className="w-full h-[400px] object-cover" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-lg group">
              <div className="absolute inset-0 bg-sky-600/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1738&auto=format&fit=crop" alt="Live Tutoring" className="w-full h-[400px] object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 mb-6">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Live Interactive Sessions</h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Some concepts require face-to-face breakdown. Hop into crystal-clear, secure video tutoring rooms powered by Jitsi for pair programming or deep-dive lectures.
              </p>
              <ul className="space-y-3">
                {['Seamless Jitsi integration', 'Screen sharing & chat built-in', 'Secure, private room links'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-sky-500 mr-3" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Info Cards / Stats section */}
        <section className="bg-slate-900 text-white py-24 my-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
              <div className="pt-8 md:pt-0">
                <div className="text-5xl font-black text-indigo-400 mb-2">98%</div>
                <div className="text-lg font-semibold mb-2">Completion Rate</div>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Our structured paths and mentorship model keep you completely accountable.</p>
              </div>
              <div className="pt-8 md:pt-0">
                <div className="text-5xl font-black text-violet-400 mb-2">50+</div>
                <div className="text-lg font-semibold mb-2">Expert Instructors</div>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Learn exactly what the industry demands from professionals actively working in it.</p>
              </div>
              <div className="pt-8 md:pt-0">
                <div className="text-5xl font-black text-cyan-400 mb-2">24/7</div>
                <div className="text-lg font-semibold mb-2">AI Assistance</div>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Get unblocked anytime. The AI acts as your tireless teaching assistant.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-indigo-600 rounded-3xl p-10 md:p-16 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)]">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-violet-600 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to accelerate your career?
              </h2>
              <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium">
                Join thousands of learners achieving their goals faster with VidyaSetu's AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigate('/register')} 
                  className="px-8 py-4 text-base font-bold text-indigo-600 bg-white rounded-full hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl"
                >
                  Create your free account
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-8 py-4 text-base font-bold text-white border border-indigo-400 rounded-full hover:bg-indigo-700 transition-colors"
                >
                  Log in to existing
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-indigo-700" />
                </div>
                <span className="text-xl font-bold text-slate-900">VidyaSetu</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                The most advanced AI-integrated learning and mentorship platform. Designed for the driven.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Mentors</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2024 VidyaSetu Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center justify-center transition-colors text-slate-400 hover:text-indigo-600">in</div>
              <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center justify-center transition-colors text-slate-400 hover:text-indigo-600">tw</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

