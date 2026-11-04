import React, { createContext, useContext, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Boxes, ChartNoAxesCombined, ChevronLeft, ChevronRight, Eye, EyeOff, LogOut, Menu, Settings, ShieldCheck, Warehouse, X } from 'lucide-react';
import { api } from './api';
import { Alert, Field, Page, ToastProvider, useToast } from './ui';
import { Dashboard, Products, ProductForm, SettingsPage } from './pages';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api('/auth/me').then(account => { if (active) setUser(account); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); });
    const expired = () => setUser(null);
    window.addEventListener('stockflow:unauthorized', expired);
    return () => { active = false; window.removeEventListener('stockflow:unauthorized', expired); };
  }, []);
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } finally { setUser(null); } };
  return <AuthContext.Provider value={{ user, setUser, loading, logout }}>{children}</AuthContext.Provider>;
}

function PrivateRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="boot"><span className="spinner"/> Loading StockFlow…</div>;
  return user ? <AppShell/> : <Navigate to="/login" state={{ from: location }} replace/>;
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function AppShell() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => setDrawer(false), [location.pathname]);
  async function signOut() {
    try { await logout(); notify('You have logged out.'); navigate('/login', { replace: true }); }
    catch (error) { notify(error.message, 'error'); navigate('/login', { replace: true }); }
  }
  return <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-top"><div className="brand"><span className="brand-mark"><Warehouse size={19} strokeWidth={2.4}/></span><span className="brand-name">StockFlow</span></div><button type="button" className="collapse-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(v => !v)}>{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</button><button type="button" className="drawer-close" aria-label="Close navigation" onClick={() => setDrawer(false)}><X size={20}/></button></div>
      <div className="org-chip" title={user.organization.name}><span className="org-avatar">{user.organization.name.slice(0, 1).toUpperCase()}</span><span className="org-text"><strong>{user.organization.name}</strong><small>Workspace</small></span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.9}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="user-line" title={user.email}><span className="user-avatar">{user.email.slice(0, 1).toUpperCase()}</span><span>{user.email}</span></div><button type="button" className="logout" title={collapsed ? 'Log out' : undefined} onClick={signOut}><LogOut size={18}/><span>Log out</span></button></div>
    </aside>
    <AnimatePresence>{drawer && <motion.button type="button" className="backdrop" aria-label="Close navigation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}/>}</AnimatePresence>
    <div className="main-area"><header className="topbar"><button type="button" className="menu-button" onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu size={21}/></button><span className="topbar-label">Inventory workspace</span><span className="topbar-right"><span className="online-dot"/>{user.organization.name}</span></header><main className="content"><AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: .15 }}><Outlet/></motion.div></AnimatePresence></main></div>
  </div>;
}

function AuthPage({ mode }) {
  const signup = mode === 'signup';
  const [form, setForm] = useState({ organizationName: '', email: '', password: '', confirmPassword: '' });
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const { user, setUser, loading } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  if (loading) return <div className="boot"><span className="spinner"/> Loading StockFlow…</div>;
  if (user) return <Navigate to="/dashboard" replace/>;
  const change = key => value => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); setError(''); };
  async function submit(event) {
    event.preventDefault(); setError('');
    const next = {};
    if (signup && !form.organizationName.trim()) next.organizationName = 'Enter your organization name.';
    if (!form.email.trim()) next.email = 'Enter your email address.';
    if (!form.password) next.password = 'Enter your password.';
    else if (signup && form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (signup && form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) { notify('Please check the highlighted fields.', 'warning'); return; }
    setBusy(true);
    try { const account = await api(`/auth/${mode}`, { method: 'POST', body: form }); setUser(account); notify(signup ? 'Workspace created successfully.' : 'Welcome back to StockFlow.'); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(err.message); notify(err.message, 'error'); } finally { setBusy(false); }
  }
  return <div className="auth-layout"><div className="auth-panel"><div className="auth-brand"><span className="brand-mark"><Warehouse size={20}/></span> StockFlow</div><div className="auth-copy"><div className="auth-orbit"><span><Boxes size={25}/></span><span><ChartNoAxesCombined size={23}/></span><span><ShieldCheck size={22}/></span></div><span className="eyebrow">INVENTORY, SIMPLIFIED</span><h1>Clarity for every<br/>item you manage.</h1><p>Stay on top of your products, spot low stock early, and make every inventory decision with confidence.</p><div className="auth-proof"><ShieldCheck size={17}/> A clearer way to manage inventory</div></div><div className="auth-foot">© StockFlow · Your inventory, in focus</div></div><div className="auth-main"><Page className="auth-card"><div className="mobile-brand"><span className="brand-mark"><Warehouse size={19}/></span> StockFlow</div><div className="auth-kicker">{signup ? 'GET STARTED' : 'WELCOME BACK'}</div><h2>{signup ? 'Create your workspace' : 'Sign in to StockFlow'}</h2><p className="muted">{signup ? 'A better view of inventory starts here.' : 'Enter your details to continue to your workspace.'}</p><form onSubmit={submit} className="form-stack" noValidate>{signup && <Field label="Organization name" required value={form.organizationName} onChange={change('organizationName')} error={errors.organizationName} placeholder="Acme Supply Co."/>}<Field label="Email address" type="email" required value={form.email} onChange={change('email')} error={errors.email} placeholder="you@company.com"/><Field label="Password" type={visible ? 'text' : 'password'} required value={form.password} onChange={change('password')} error={errors.password} placeholder={signup ? 'At least 8 characters' : 'Enter your password'} suffix={<button className="input-action" type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>}/>{signup && <Field label="Confirm password" type={visible ? 'text' : 'password'} required value={form.confirmPassword} onChange={change('confirmPassword')} error={errors.confirmPassword} placeholder="Confirm your password"/>}{error && <Alert message={error}/>}<button className="btn primary full" disabled={busy}>{busy ? <><span className="spinner"/> Please wait…</> : <>{signup ? 'Create workspace' : 'Sign in'} <ArrowRight size={16}/></>}</button></form><p className="auth-switch">{signup ? 'Already have an account?' : 'New to StockFlow?'} <NavLink to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</NavLink></p></Page></div></div>;
}

export default function App() { return <MotionConfig reducedMotion="user"><ToastProvider><AuthProvider><Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/><Route element={<PrivateRoute/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/products" element={<Products/>}/><Route path="/products/new" element={<ProductForm/>}/><Route path="/products/:id/edit" element={<ProductForm edit/>}/><Route path="/settings" element={<SettingsPage/>}/></Route><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></AuthProvider></ToastProvider></MotionConfig>; }
