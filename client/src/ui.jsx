import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { AlertCircle, Check, CheckCircle2, Info, PackageOpen, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);
const ease = [0.22, 1, 0.36, 1];

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const notify = useCallback((message, kind = 'success') => {
    const id = `${kind}:${message}`;
    setItems(current => current.some(item => item.id === id) ? current : [...current, { id, message, kind }]);
  }, []);
  const dismiss = useCallback(id => setItems(current => current.filter(item => item.id !== id)), []);
  return <ToastContext.Provider value={notify}>{children}<div className="toast-stack" aria-live="polite"><AnimatePresence>{items.map(item => <Toast key={item.id} item={item} dismiss={dismiss} />)}</AnimatePresence></div></ToastContext.Provider>;
}

function Toast({ item, dismiss }) {
  useEffect(() => { const timer = setTimeout(() => dismiss(item.id), 4000); return () => clearTimeout(timer); }, [item.id, dismiss]);
  const Icon = item.kind === 'error' ? AlertCircle : item.kind === 'warning' ? Info : CheckCircle2;
  return <motion.div role={item.kind === 'error' ? 'alert' : 'status'} className={`toast ${item.kind}`} initial={{ opacity: 0, x: 24, scale: .97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 18, scale: .97 }} transition={{ duration: .22, ease }}><Icon size={19}/><span>{item.message}</span><button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification"><X size={16}/></button></motion.div>;
}

export function Page({ children, className = '' }) {
  const reduced = useReducedMotion();
  return <motion.div className={`page ${className}`} initial={reduced ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -5 }} transition={{ duration: .28, ease }}>{children}</motion.div>;
}

export function PageHeading({ eyebrow, title, description, action, meta }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p>{meta && <span className="heading-meta">{meta}</span>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}

export function Field({ label, value, onChange, type = 'text', placeholder, required, minLength, min, step, as = 'input', hint, error, suffix }) {
  const id = React.useId();
  const props = { id, value, onChange: e => onChange(e.target.value), placeholder, required, minLength, min, step, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined };
  return <div className="field"><label htmlFor={id}>{label}{required && <span className="required"> *</span>}</label><div className="input-wrap">{as === 'textarea' ? <textarea {...props} rows="3" /> : <input {...props} type={type} />}{suffix}</div>{error ? <small className="field-error" id={`${id}-error`}><AlertCircle size={13}/>{error}</small> : hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}

export function Status({ value }) {
  const tone = value === 'In Stock' ? 'in' : value === 'Low Stock' ? 'low' : 'out';
  return <span className={`status ${tone}`}><span className="status-dot"/>{value}</span>;
}

export function EmptyState({ title, description, action, icon: Icon = PackageOpen }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={24} strokeWidth={1.7}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Alert({ message, retry }) {
  return <div className="alert error" role="alert"><AlertCircle size={17}/><span>{message}</span>{retry && <button type="button" onClick={retry}>Try again</button>}</div>;
}

export function Skeleton({ rows = 4, cards = false }) {
  if (cards) return <>{Array.from({ length: 4 }, (_, i) => <div className="stat skeleton-card" key={i}><div className="skeleton block-icon"/><div className="skeleton block-label"/><div className="skeleton block-number"/></div>)}</>;
  return <div className="skeleton-table" aria-label="Loading inventory">{Array.from({ length: rows }, (_, i) => <div className="skeleton-row" key={i}><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>)}</div>;
}

export function Counter({ value }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    const controls = animate(count, value, { duration: .8, ease: 'easeOut', onUpdate: latest => setDisplay(Math.round(latest)) });
    return () => controls.stop();
  }, [value, reduced, count]);
  return <>{display.toLocaleString()}</>;
}

export function ConfirmModal({ product, busy, onCancel, onConfirm }) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    if (!product) return;
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
    const onKey = event => {
      if (event.key === 'Escape' && !busy) onCancel();
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === cancelRef.current ? confirmRef : cancelRef).current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previousFocus.current?.focus?.(); };
  }, [product, busy, onCancel]);
  return <AnimatePresence>{product && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }} onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}><motion.div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 7, scale: .97 }} transition={{ duration: .22, ease }}><div className="modal-icon"><AlertCircle size={23}/></div><h2 id="delete-title">Delete product?</h2><p id="delete-description">You’re about to permanently delete <strong>{product.name}</strong>. This action cannot be undone.</p><div className="modal-actions"><button type="button" className="btn secondary" onClick={onCancel} disabled={busy} ref={cancelRef}>Cancel</button><button type="button" className="btn danger" onClick={onConfirm} disabled={busy} ref={confirmRef}>{busy ? <><span className="spinner"/> Deleting…</> : <><Check size={16}/> Delete product</>}</button></div></motion.div></motion.div>}</AnimatePresence>;
}
