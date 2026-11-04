import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Boxes, CheckCircle2, Package, PackagePlus, Pencil, Plus, Search, Settings, Trash2 } from 'lucide-react';
import { api } from './api';
import { Alert, ConfirmModal, Counter, EmptyState, Field, Page, PageHeading, Skeleton, Status, useToast } from './ui';

const money = value => value == null ? '—' : new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const stats = [
  { label: 'Total products', key: 'totalProducts', icon: Package, tone: 'blue' },
  { label: 'Inventory units', key: 'totalInventoryUnits', icon: Boxes, tone: 'indigo' },
  { label: 'Low stock products', key: 'lowStockProducts', icon: AlertTriangle, tone: 'amber' },
  { label: 'Out of stock', key: 'outOfStockProducts', icon: Package, tone: 'red' },
];

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [key, setKey] = useState(0);
  const notify = useToast();
  useEffect(() => { let active = true; api('/dashboard/overview').then(result => { if (active) setData(result); }).catch(err => { if (active) { setError(err.message); notify(err.message, 'error'); } }); return () => { active = false; }; }, [key]);
  return <Page><PageHeading eyebrow="OVERVIEW" title="Dashboard" description="A clear view of your inventory today." action={<NavLink className="btn primary" to="/products/new"><Plus size={17}/> Add product</NavLink>}/>{error ? <Alert message={error} retry={() => { setError(''); setData(null); setKey(key + 1); }}/> : <><div className="stats">{data ? stats.map((stat, i) => <motion.div className="stat" key={stat.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, delay: i * .06 }}><div className={`stat-icon ${stat.tone}`}><stat.icon size={21} strokeWidth={1.9}/></div><span>{stat.label}</span><strong><Counter value={data[stat.key]}/></strong><div className="stat-trace"/></motion.div>) : <Skeleton cards/>}</div><motion.section className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .34, delay: .18 }}><div className="panel-head"><div><div className="section-label">STOCK HEALTH</div><h2>Products needing attention</h2><p>Items at or below their stock threshold</p></div><NavLink to="/products" className="subtle-link">View all products <ArrowRight size={15}/></NavLink></div>{!data ? <Skeleton/> : data.totalProducts === 0 ? <EmptyState title="Your inventory starts here" description="Add your first product to see inventory insights." action={<NavLink to="/products/new" className="btn primary"><Plus size={16}/> Add your first product</NavLink>}/> : data.attentionProducts.length === 0 ? <EmptyState title="Everything looks stocked" description="No products are currently low or out of stock." icon={CheckCircle2}/> : <div className="table-wrap"><table><thead><tr><th>Product name</th><th>SKU</th><th>Available quantity</th><th>Low stock threshold</th><th>Status</th></tr></thead><tbody>{data.attentionProducts.map(item => <tr key={item._id}><td className="strong">{item.name}</td><td className="mono">{item.sku}</td><td>{item.quantityOnHand}</td><td>{item.applicableThreshold}</td><td><Status value={item.stockStatus}/></td></tr>)}</tbody></table></div>}</motion.section></>}</Page>;
}

export function Products() {
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [key, setKey] = useState(0);
  const notify = useToast();
  useEffect(() => { let active = true; setItems(null); api(`/products?search=${encodeURIComponent(search)}`).then(data => { if (active) { setItems(data); if (!search) setTotal(data.length); } }).catch(err => { if (active) { setError(err.message); notify(err.message, 'error'); } }); return () => { active = false; }; }, [search, key]);
  async function remove() {
    setDeleting(true); setError('');
    try { await api(`/products/${selected._id}`, { method: 'DELETE' }); setItems(current => current.filter(product => product._id !== selected._id)); setTotal(current => current == null ? null : Math.max(0, current - 1)); setSelected(null); notify('Product deleted successfully.'); }
    catch (err) { setError(err.message); notify(err.message, 'error'); } finally { setDeleting(false); }
  }
  return <Page><PageHeading eyebrow="INVENTORY" title="Products" description="Manage and monitor everything in your catalog." meta={total != null ? `${total} total ${total === 1 ? 'product' : 'products'}` : undefined} action={<NavLink className="btn primary" to="/products/new"><Plus size={17}/> Add product</NavLink>}/><section className="panel"><div className="list-toolbar"><div><div className="section-label">YOUR CATALOG</div><h2>All products</h2><p>{items ? search ? `${items.length} matching ${items.length === 1 ? 'product' : 'products'}` : `${items.length} ${items.length === 1 ? 'product' : 'products'}` : 'Loading products…'}</p></div><div className="search-wrap"><Search size={17}/><input type="search" placeholder="Search name or SKU…" value={search} onChange={event => { setSearch(event.target.value); setError(''); }} aria-label="Search products"/></div></div>{error && <div className="inside-alert"><Alert message={error} retry={() => { setError(''); setKey(key + 1); }}/></div>}{!items && !error ? <Skeleton rows={5}/> : items?.length === 0 ? <EmptyState title={search ? 'No matching products' : 'No products yet'} description={search ? 'Try a different name or SKU.' : 'Add your first product to start tracking inventory.'} icon={search ? Search : PackagePlus} action={!search && <NavLink className="btn primary" to="/products/new"><Plus size={16}/> Add product</NavLink>}/> : items && <div className="table-wrap"><table><thead><tr><th>Product name</th><th>SKU</th><th>Quantity</th><th>Stock status</th><th>Selling price</th><th className="right">Actions</th></tr></thead><tbody>{items.map(item => <tr key={item._id}><td><div className="strong">{item.name}</div>{item.description && <div className="cell-sub">{item.description}</div>}</td><td className="mono">{item.sku}</td><td>{item.quantityOnHand}</td><td><Status value={item.stockStatus}/></td><td>{money(item.sellingPrice)}</td><td className="right action-cell"><NavLink to={`/products/${item._id}/edit`} title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`}><Pencil size={16}/></NavLink><button type="button" title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} onClick={() => setSelected(item)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}</section><ConfirmModal product={selected} busy={deleting} onCancel={() => setSelected(null)} onConfirm={remove}/></Page>;
}

const initialProduct = { name: '', sku: '', description: '', quantityOnHand: '0', costPrice: '', sellingPrice: '', lowStockThreshold: '' };
export function ProductForm({ edit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState(initialProduct);
  const [loading, setLoading] = useState(edit);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!edit) return; let active = true; api(`/products/${id}`).then(item => { if (active) setForm(Object.fromEntries(Object.keys(initialProduct).map(key => [key, item[key] ?? '']))); }).catch(err => { if (active) { setError(err.message); notify(err.message, 'error'); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [edit, id]);
  const change = key => value => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); setError(''); };
  async function submit(event) {
    event.preventDefault(); setError('');
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required.';
    if (!form.sku.trim()) next.sku = 'SKU is required.';
    if (form.quantityOnHand === '' || !Number.isSafeInteger(Number(form.quantityOnHand)) || Number(form.quantityOnHand) < 0) next.quantityOnHand = 'Enter a non-negative whole number.';
    if (form.lowStockThreshold !== '' && (!Number.isSafeInteger(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0)) next.lowStockThreshold = 'Enter a non-negative whole number.';
    for (const key of ['costPrice', 'sellingPrice']) if (form[key] !== '' && (!Number.isFinite(Number(form[key])) || Number(form[key]) < 0)) next[key] = 'Enter a non-negative number.';
    setErrors(next);
    if (Object.keys(next).length) { notify('Please check the highlighted fields.', 'warning'); return; }
    const parsed = { ...form, quantityOnHand: Number(form.quantityOnHand), costPrice: form.costPrice === '' ? null : Number(form.costPrice), sellingPrice: form.sellingPrice === '' ? null : Number(form.sellingPrice), lowStockThreshold: form.lowStockThreshold === '' ? null : Number(form.lowStockThreshold) };
    setBusy(true);
    try { await api(edit ? `/products/${id}` : '/products', { method: edit ? 'PUT' : 'POST', body: parsed }); notify(edit ? 'Product updated successfully.' : 'Product created successfully.'); navigate('/products'); }
    catch (err) { setError(err.message); notify(err.message, 'error'); } finally { setBusy(false); }
  }
  return <Page><PageHeading eyebrow="INVENTORY" title={edit ? 'Edit product' : 'Add product'} description={edit ? 'Update product details and stock levels.' : 'Add a new item to your inventory.'} action={<NavLink className="btn secondary" to="/products"><ArrowLeft size={16}/> Back to products</NavLink>}/>{loading ? <div className="form-panel"><Skeleton rows={6}/></div> : <form onSubmit={submit} className="form-panel" noValidate><div className="form-section"><div className="section-label">01 / PRODUCT DETAILS</div><h2>Product details</h2><p>Basic information to identify this product.</p><div className="form-grid"><Field label="Product name" required value={form.name} onChange={change('name')} error={errors.name} placeholder="e.g. Wireless keyboard"/><Field label="SKU" required value={form.sku} onChange={change('sku')} error={errors.sku} placeholder="e.g. KEY-001"/><div className="span-2"><Field label="Description" as="textarea" value={form.description} onChange={change('description')} placeholder="Optional product details"/></div></div></div><div className="form-section"><div className="section-label">02 / STOCK & PRICING</div><h2>Inventory & pricing</h2><p>Set your current quantity and optional prices.</p><div className="form-grid"><Field label="Quantity on hand" type="number" required min="0" step="1" value={form.quantityOnHand} onChange={change('quantityOnHand')} error={errors.quantityOnHand}/><Field label="Low stock threshold" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={change('lowStockThreshold')} error={errors.lowStockThreshold} placeholder="Use organization default" hint="Leave blank to use the organization setting."/><Field label="Cost price" type="number" min="0" step="any" value={form.costPrice} onChange={change('costPrice')} error={errors.costPrice} placeholder="0.00"/><Field label="Selling price" type="number" min="0" step="any" value={form.sellingPrice} onChange={change('sellingPrice')} error={errors.sellingPrice} placeholder="0.00"/></div></div>{error && <div className="form-alert"><Alert message={error}/></div>}<div className="form-actions"><NavLink to="/products" className="btn secondary">Cancel</NavLink><button className="btn primary" disabled={busy}>{busy ? <><span className="spinner"/> Saving…</> : <>{edit ? 'Save changes' : 'Save product'} <ArrowRight size={16}/></>}</button></div></form>}</Page>;
}

export function SettingsPage() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const notify = useToast();
  useEffect(() => { let active = true; api('/settings').then(data => { if (active) setValue(String(data.defaultLowStockThreshold)); }).catch(err => { if (active) { setError(err.message); notify(err.message, 'error'); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  async function submit(event) {
    event.preventDefault(); setError(''); setFieldError('');
    if (value === '' || !Number.isSafeInteger(Number(value)) || Number(value) < 0) { setFieldError('Enter a non-negative whole number.'); notify('Enter a valid low stock threshold.', 'warning'); return; }
    setBusy(true);
    try { const result = await api('/settings', { method: 'PUT', body: { defaultLowStockThreshold: Number(value) } }); setValue(String(result.defaultLowStockThreshold)); notify('Settings saved successfully.'); }
    catch (err) { setError(err.message); notify(err.message, 'error'); } finally { setBusy(false); }
  }
  return <Page><PageHeading eyebrow="PREFERENCES" title="Settings" description="Configure how StockFlow tracks your inventory."/><section className="form-panel settings-panel"><div className="form-section"><div className="settings-icon"><Settings size={22}/></div><div className="section-label">ORGANIZATION SETTINGS</div><h2>Stock settings</h2><p>These settings apply to your organization’s products.</p>{loading ? <Skeleton rows={2}/> : <form onSubmit={submit} className="settings-form" noValidate><Field label="Default low stock threshold" type="number" required min="0" step="1" value={value} onChange={v => { setValue(v); setFieldError(''); setError(''); }} error={fieldError} hint="Products without their own threshold use this value. Default: 5."/>{error && <Alert message={error}/>}<button className="btn primary" disabled={busy}>{busy ? <><span className="spinner"/> Saving…</> : 'Save changes'}</button></form>}</div></section></Page>;
}
