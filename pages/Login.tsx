
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { validateLoginForm } from '../lib/formValidation';
import { FormError } from '../components/ui/FormError';

const DEMO_CREDENTIALS = {
  student: { email: 'student@skillforge.com', password: 'student123' },
  instructor: { email: 'instructor@skillforge.com', password: 'instructor123' },
  admin: { email: 'admin@skillforge.com', password: 'admin123' },
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Redirect if already logged in
  if (user) {
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'mentor':
        navigate('/mentor');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        break;
    }
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    // Validate form
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }
    
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);

      // Role-based redirect
      switch (loggedInUser.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'mentor':
          navigate('/mentor');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          setError('Account has no valid role assigned. Please contact support.');
          break;
      }
    } catch (err: any) {
      console.error("Login Check Failed:", err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'student' | 'instructor' | 'admin') => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="auth-page">
      <div className="w-full max-w-[1040px]">
        <div className="auth-card flex flex-col lg:flex-row overflow-hidden">

          {/* ─── Left: Auth Form ─── */}
          <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(250 60% 50%), hsl(260 55% 45%))' }}>
                <FlameIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold auth-text-heading">VidyaSetu</span>
            </div>

            <div className="mb-7">
              <h1 className="text-[1.625rem] font-bold auth-text-heading leading-tight">Welcome back</h1>
              <p className="auth-text-muted text-sm mt-1.5">Sign in to continue to your dashboard</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="auth-error-banner mb-5">
                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="auth-label">Email address</label>
                <div className="relative">
                  <MailIcon className="auth-input-icon" />
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ 
                      paddingLeft: '3rem',
                      borderColor: fieldErrors.email ? 'hsl(0 65% 50%)' : undefined
                    }}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  />
                </div>
                {fieldErrors.email && <FormError error={fieldErrors.email} />}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                  <button type="button" className="auth-link text-xs" tabIndex={-1} aria-label="Forgot password">Forgot password?</button>
                </div>
                <div className="relative">
                  <LockIcon className="auth-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                      paddingLeft: '3rem', 
                      paddingRight: '2.75rem',
                      borderColor: fieldErrors.password ? 'hsl(0 65% 50%)' : undefined
                    }}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-toggle-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {fieldErrors.password && <FormError error={fieldErrors.password} />}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  aria-label="Remember me"
                />
                <label htmlFor="remember" className="text-sm auth-text-muted cursor-pointer select-none">Remember me</label>
              </div>

              {/* Submit */}
              <button type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="auth-spinner" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="auth-divider flex-1" />
              <span className="text-xs auth-text-muted uppercase tracking-wider font-medium">Demo Accounts</span>
              <div className="auth-divider flex-1" />
            </div>

            {/* Demo accounts toggle */}
            <button
              type="button"
              onClick={() => setShowDemoPanel(!showDemoPanel)}
              className="w-full text-sm auth-text-muted auth-sandbox-toggle flex items-center justify-center gap-1.5 mb-3 hover:underline transition-all"
            >
              <BeakerIcon className="w-4 h-4" />
              {showDemoPanel ? 'Hide sandbox accounts' : 'Try with sandbox accounts'}
              <ChevronIcon className={`w-3.5 h-3.5 transition-transform ${showDemoPanel ? 'rotate-180' : ''}`} />
            </button>

            {showDemoPanel && (
              <div className="space-y-2.5">
                <button type="button" className="demo-card" onClick={() => handleDemoLogin('student')}>
                  <div className="demo-card-icon" style={{ background: 'hsla(240, 60%, 55%, 0.1)' }}>
                    <GraduationCapIcon className="w-[18px] h-[18px]" style={{ color: 'hsl(240 60% 55%)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold auth-text-heading">Student</p>
                    <p className="text-xs auth-text-muted">student@skillforge.com</p>
                  </div>
                </button>
                <button type="button" className="demo-card" onClick={() => handleDemoLogin('instructor')}>
                  <div className="demo-card-icon" style={{ background: 'hsla(145, 60%, 40%, 0.1)' }}>
                    <PresentationIcon className="w-[18px] h-[18px]" style={{ color: 'hsl(145 60% 40%)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold auth-text-heading">Instructor</p>
                    <p className="text-xs auth-text-muted">instructor@skillforge.com</p>
                  </div>
                </button>
                <button type="button" className="demo-card" onClick={() => handleDemoLogin('admin')}>
                  <div className="demo-card-icon" style={{ background: 'hsla(0, 65%, 50%, 0.1)' }}>
                    <UserCogIcon className="w-[18px] h-[18px]" style={{ color: 'hsl(0 65% 50%)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold auth-text-heading">Administrator</p>
                    <p className="text-xs auth-text-muted">admin@skillforge.com</p>
                  </div>
                </button>
              </div>
            )}

            {/* Sign up link */}
            <p className="text-center text-sm auth-text-muted mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
          </div>

          {/* ─── Right: Image Branding Panel ─── */}
          <div
            className="hidden lg:flex w-[440px] flex-shrink-0 relative overflow-hidden"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          >
            {/* Dark gradient overlay for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(20,18,60,0.78) 0%, rgba(20,18,60,0.55) 40%, rgba(20,18,60,0.82) 100%)',
              }}
            />


            {/* Content over image */}
            <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
              <div>
                <h2 className="text-2xl font-bold leading-snug mb-3">
                  Your learning<br />journey starts here.
                </h2>
                <p className="text-white text-[0.9375rem] leading-relaxed" style={{ opacity: 1 }}>
                  Access courses, track progress, and connect with instructors — all in one place.
                </p>
              </div>

              <div className="space-y-4 mt-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white">AI-powered quiz generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white">Live 1-on-1 tutoring sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white">Real-time progress tracking</span>
                </div>
              </div>

              {/* Testimonial quote */}
              <div className="mt-10 pt-6 border-t border-white/15">
                <p className="text-sm text-white italic leading-relaxed" style={{ opacity: 0.9 }}>
                  "VidyaSetu has completely transformed how I manage my courses and connect with students."
                </p>
                <p className="text-xs text-white mt-2" style={{ opacity: 0.75 }}>— Instructor, Computer Science</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ─── Icons ─── */
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);
const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const GraduationCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
);
const PresentationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="M7 21h10" /><path d="M12 16v5" /></svg>
);
const UserCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3" /><circle cx="9" cy="7" r="4" /><path d="M10 15H6a4 4 0 0 0-4 4v2" /><path d="m21.7 16.4-.9-.3" /><path d="m15.2 13.9-.9-.3" /><path d="m16.6 18.7.3-.9" /><path d="m19.1 12.2.3-.9" /><path d="m19.5 17.3-.3-.9" /><path d="m16.8 12.3-.3-.9" /><path d="m14.3 16.6 1-2.7" /><path d="m20.7 13.8 1-2.7" /></svg>
);
const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
);
const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" /></svg>
);
const ChevronIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

export default LoginPage;
