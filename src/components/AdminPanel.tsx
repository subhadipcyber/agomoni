import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ShieldCheck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Upload,
  QrCode,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  Save,
  Check,
  ArrowLeft,
  Settings as SettingsIcon,
  CreditCard,
  Building,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Order, StoreSettings, OrderStatus } from '../types';
import {
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder,
  getStoreSettings,
  saveStoreSettings,
  DEFAULT_SETTINGS,
} from '../services/storeService';
import { compressImage } from '../utils/imageCompressor';
import { ImageModal } from './ImageModal';

const STATIC_ADMIN_PASSWORD = 'agomonistoresct2026';
const AUTH_STORAGE_KEY = 'agomoni_admin_authenticated';

interface AdminPanelProps {
  onBackToStore: () => void;
  onSettingsUpdated?: (settings: StoreSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore, onSettingsUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active tab in admin: 'orders' | 'branding'
  const [activeTab, setActiveTab] = useState<'orders' | 'branding'>('orders');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'offline' | 'online'>('all');

  // Store settings state
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Upload loaders
  const [compressingLogo, setCompressingLogo] = useState(false);
  const [compressingQr, setCompressingQr] = useState(false);

  // Image lightbox
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  // Delete confirm modal state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial settings
  useEffect(() => {
    getStoreSettings().then((res) => {
      setSettings(res);
    });
  }, []);

  // Listen to Firestore orders when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoadingOrders(true);
    const unsubscribe = subscribeToOrders(
      (data) => {
        setOrders(data);
        setLoadingOrders(false);
      },
      (err) => {
        console.error('Orders subscription error:', err);
        setLoadingOrders(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === STATIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect admin password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setPasswordInput('');
  };

  // Status management
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status in Firestore.');
    }
  };

  // Admin notes update
  const handleNotesBlur = async (orderId: string, notes: string) => {
    try {
      await updateOrderStatus(orderId, (orders.find((o) => o.id === orderId)?.status || 'pending'), notes);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  // Delete order
  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to delete order:', err);
      alert('Failed to delete order from Firestore.');
    }
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingLogo(true);
      const compressed = await compressImage(file, 600, 0.8);
      setSettings((prev) => ({ ...prev, logoUrl: compressed }));
    } catch (err) {
      alert('Failed to compress logo image: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setCompressingLogo(false);
    }
  };

  // QR Code upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingQr(true);
      const compressed = await compressImage(file, 700, 0.8);
      setSettings((prev) => ({ ...prev, qrCodeUrl: compressed }));
    } catch (err) {
      alert('Failed to compress QR image: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setCompressingQr(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await saveStoreSettings(settings);
      setSettingsSaveSuccess(true);
      if (onSettingsUpdated) {
        onSettingsUpdated(settings);
      }
      setTimeout(() => setSettingsSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings to Firestore.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Export to CSV
  const exportToCsv = () => {
    if (orders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Contact Number',
      'Address',
      'Email',
      'Product Name',
      'Payment Mode',
      'Status',
      'Admin Notes',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber || o.id}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.contactNumber.replace(/"/g, '""')}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${(o.email || '').replace(/"/g, '""')}"`,
      `"${o.productName.replace(/"/g, '""')}"`,
      `"${o.paymentMode}"`,
      `"${o.status}"`,
      `"${(o.adminNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agomoni_store_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.contactNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.address || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentMode === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Order Counts
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const onlineCount = orders.filter((o) => o.paymentMode === 'online').length;
  const offlineCount = orders.filter((o) => o.paymentMode === 'offline').length;

  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F2E7] flex items-center justify-center p-4">
        <div className="w-full max-w-md neu-flat p-8 rounded-3xl border border-[#EADBCA] text-center space-y-6 relative">
          <div className="w-16 h-16 mx-auto rounded-full neu-flat flex items-center justify-center text-[#851C15] border border-[#F2EAE0]">
            <Lock className="w-8 h-8 text-[#851C15]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest font-heading text-[#9C2A22] font-bold">
              Restricted Area
            </span>
            <h2 className="font-heading text-2xl font-black text-[#5A1310] tracking-wide">
              Agomoni Admin Portal
            </h2>
            <p className="font-serif-vintage italic text-xs text-[#8A3730]">
              Authorized Store Administration Only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="neu-inset rounded-2xl overflow-hidden p-1 neu-inset-focus transition-all">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError('');
                }}
                placeholder="Enter Admin Password"
                className="w-full px-4 py-3 bg-transparent text-[#5A1310] placeholder-[#A07068]/60 font-serif focus:outline-hidden text-sm text-center tracking-widest"
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-xs text-[#9E2018] font-serif font-medium bg-[#FDEDEC] p-2 rounded-xl border border-[#D9534F]/30 animate-shake">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-2xl neu-btn-maroon font-serif text-sm font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#FFE082]" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="pt-2">
            <button
              onClick={onBackToStore}
              className="text-xs font-serif text-[#872A23] hover:text-[#5A1310] underline cursor-pointer"
            >
              Return to Store Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#F7F2E7] text-[#5A1310] pb-20">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#F7F2E7]/90 backdrop-blur-md border-b border-[#E2D6C0] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neu-flat flex items-center justify-center border border-[#ECE0CC] overflow-hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-black text-sm text-[#851C15]">A</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-lg text-[#5A1310] tracking-wide">
                  Agomoni Admin
                </h1>
                <span className="px-2 py-0.5 rounded-full neu-flat-sm text-[10px] font-bold text-emerald-700 bg-emerald-50/50">
                  Live Firestore
                </span>
              </div>
              <p className="font-serif-vintage italic text-xs text-[#8F352E]">
                Orders & Store Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToStore}
              className="py-2 px-3 rounded-xl neu-btn text-xs font-serif text-[#6E1510] flex items-center gap-1.5 cursor-pointer"
              title="View Customer Store"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Store View</span>
            </button>

            <button
              onClick={handleLogout}
              className="py-2 px-3 rounded-xl neu-btn text-xs font-serif text-[#9E2018] hover:text-red-700 flex items-center gap-1.5 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs (Orders vs Branding/Settings) */}
        <div className="flex items-center justify-center gap-3 p-1.5 rounded-2xl neu-inset max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-serif transition-all cursor-pointer text-xs sm:text-sm ${
              activeTab === 'orders'
                ? 'neu-btn-maroon font-bold'
                : 'neu-btn text-[#6E1510] font-medium hover:text-[#5A1310]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-serif transition-all cursor-pointer text-xs sm:text-sm ${
              activeTab === 'branding'
                ? 'neu-btn-maroon font-bold'
                : 'neu-btn text-[#6E1510] font-medium hover:text-[#5A1310]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Store Logo & QR</span>
          </button>
        </div>

        {/* TAB 1: ORDERS DASHBOARD */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              {/* Total Orders */}
              <div className="neu-flat p-4 rounded-2xl border border-[#ECE0CC] text-center">
                <span className="text-[11px] font-body uppercase font-bold text-[#8C3A33]">
                  Total Orders
                </span>
                <p className="font-heading text-2xl sm:text-3xl font-black text-[#5A1310] mt-0.5">
                  {orders.length}
                </p>
              </div>

              {/* Pending Orders */}
              <div
                onClick={() => setStatusFilter('pending')}
                className={`neu-flat p-4 rounded-2xl border cursor-pointer transition-all text-center ${
                  statusFilter === 'pending'
                    ? 'border-amber-600 ring-2 ring-amber-500/30'
                    : 'border-[#ECE0CC]'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-body uppercase font-bold text-amber-800">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Pending</span>
                </div>
                <p className="font-heading text-2xl sm:text-3xl font-black text-amber-900 mt-0.5">
                  {pendingCount}
                </p>
              </div>

              {/* Completed Orders */}
              <div
                onClick={() => setStatusFilter('completed')}
                className={`neu-flat p-4 rounded-2xl border cursor-pointer transition-all text-center ${
                  statusFilter === 'completed'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'border-[#ECE0CC]'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-body uppercase font-bold text-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Completed</span>
                </div>
                <p className="font-heading text-2xl sm:text-3xl font-black text-emerald-900 mt-0.5">
                  {completedCount}
                </p>
              </div>

              {/* Cancelled */}
              <div
                onClick={() => setStatusFilter('cancelled')}
                className={`neu-flat p-4 rounded-2xl border cursor-pointer transition-all text-center ${
                  statusFilter === 'cancelled'
                    ? 'border-red-600 ring-2 ring-red-500/30'
                    : 'border-[#ECE0CC]'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-body uppercase font-bold text-rose-800">
                  <XCircle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Cancelled</span>
                </div>
                <p className="font-heading text-2xl sm:text-3xl font-black text-rose-900 mt-0.5">
                  {cancelledCount}
                </p>
              </div>

              {/* Online vs Offline */}
              <div className="col-span-2 sm:col-span-1 neu-flat p-4 rounded-2xl border border-[#ECE0CC] text-center">
                <span className="text-[11px] font-body uppercase font-bold text-[#8C3A33]">
                  Payment Modes
                </span>
                <div className="flex items-center justify-center gap-3 mt-1 text-xs font-serif font-bold">
                  <span className="text-sky-800">Online: {onlineCount}</span>
                  <span className="text-amber-800">Off: {offlineCount}</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="neu-flat p-4 rounded-2xl border border-[#ECE0CC] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 neu-inset rounded-xl overflow-hidden p-0.5 neu-inset-focus">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#851C15]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name, phone, product, or order #..."
                  className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-serif text-[#5A1310] placeholder-[#9E5F58]/60 focus:outline-hidden"
                />
              </div>

              {/* Status and Mode Dropdowns & CSV Export */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status select */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl neu-btn text-xs font-serif text-[#5A1310] focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Only</option>
                  <option value="completed">Completed Only</option>
                  <option value="cancelled">Cancelled Only</option>
                </select>

                {/* Payment filter */}
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl neu-btn text-xs font-serif text-[#5A1310] focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Payments</option>
                  <option value="online">Online Mode</option>
                  <option value="offline">Offline Mode</option>
                </select>

                {/* Export CSV button */}
                <button
                  onClick={exportToCsv}
                  className="py-2 px-3 rounded-xl neu-btn text-xs font-serif text-[#6E1510] flex items-center gap-1.5 cursor-pointer hover:text-[#5A1310]"
                  title="Export orders to CSV file"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Orders List */}
            {loadingOrders ? (
              <div className="neu-flat p-12 rounded-3xl text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#851C15] animate-spin mx-auto" />
                <p className="font-serif text-sm text-[#732722]">Loading orders from Firestore...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="neu-flat p-12 rounded-3xl text-center space-y-3 border border-[#EADBCA]">
                <Package className="w-10 h-10 text-[#851C15]/40 mx-auto" />
                <h3 className="font-heading text-lg font-bold text-[#5A1310]">No Orders Found</h3>
                <p className="text-xs font-serif text-[#8A3730] max-w-sm mx-auto">
                  {orders.length === 0
                    ? 'No orders have been submitted yet. Submissions from the customer store will appear here in real time.'
                    : 'No orders match your current search and filter criteria.'}
                </p>
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setPaymentFilter('all');
                    }}
                    className="py-1.5 px-3 rounded-xl neu-btn text-xs font-serif text-[#851C15]"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="neu-flat p-5 sm:p-6 rounded-3xl border border-[#EADBCA] space-y-4 transition-all"
                  >
                    {/* Header line of the Order Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2D5BE]">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl neu-inset font-mono text-xs font-bold text-[#5A1310]">
                          {order.orderNumber || order.id}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-serif text-[#8C3A33]">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Status Badges & Quick Change */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold font-serif uppercase tracking-wider ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {order.status}
                        </span>

                        {/* Status dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="text-xs font-serif px-2 py-1 rounded-lg neu-btn text-[#5A1310] focus:outline-hidden cursor-pointer"
                        >
                          <option value="pending">Set Pending</option>
                          <option value="completed">Set Completed</option>
                          <option value="cancelled">Set Cancelled</option>
                        </select>

                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 rounded-lg neu-btn text-[#901D17] hover:text-red-700 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Column 1: Customer Details */}
                      <div className="space-y-2 neu-inset p-3.5 rounded-2xl text-xs font-serif border border-[#E2D6C0]">
                        <div className="font-heading font-bold text-sm text-[#5A1310] flex items-center justify-between">
                          <span>{order.customerName}</span>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#E9DDCB] text-[#70201A]">
                            Customer
                          </span>
                        </div>

                        {/* Phone with WhatsApp & Call direct action */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-1.5 text-[#5A1310] font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#851C15]" />
                            <span>{order.contactNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://wa.me/${order.contactNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md neu-btn text-emerald-700 hover:text-emerald-800"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${order.contactNumber}`}
                              className="p-1 rounded-md neu-btn text-[#851C15]"
                              title="Call Customer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {order.email && (
                          <div className="flex items-center gap-1.5 text-[#6E1510] truncate">
                            <Mail className="w-3.5 h-3.5 text-[#851C15] shrink-0" />
                            <a href={`mailto:${order.email}`} className="truncate underline">
                              {order.email}
                            </a>
                          </div>
                        )}

                        <div className="flex items-start gap-1.5 text-[#5A1310] pt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#851C15] shrink-0 mt-0.5" />
                          <span className="leading-relaxed text-[11px]">{order.address}</span>
                        </div>
                      </div>

                      {/* Column 2: Product & Reference Photo */}
                      <div className="space-y-2 neu-inset p-3.5 rounded-2xl text-xs font-serif border border-[#E2D6C0]">
                        <span className="block text-[10px] font-body uppercase tracking-wider text-[#8C3A33] font-bold">
                          Product Requested
                        </span>
                        <p className="font-serif-vintage font-bold text-sm text-[#5A1310]">
                          {order.productName}
                        </p>

                        {order.productImage ? (
                          <div className="pt-2 flex items-center gap-2.5">
                            <img
                              src={order.productImage}
                              alt="Product reference"
                              className="w-14 h-14 object-cover rounded-xl neu-flat cursor-pointer border border-[#D5C9B3]"
                              onClick={() =>
                                setSelectedImage({
                                  url: order.productImage || '',
                                  title: `Product Reference: ${order.productName}`,
                                })
                              }
                            />
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedImage({
                                    url: order.productImage || '',
                                    title: `Product Reference: ${order.productName}`,
                                  })
                                }
                                className="text-xs font-serif font-bold text-[#851C15] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Photo</span>
                              </button>
                              <span className="text-[10px] text-[#9A4B44] block">
                                Reference uploaded by customer
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8C3A33]/70 italic pt-1">
                            No reference photo attached
                          </p>
                        )}
                      </div>

                      {/* Column 3: Payment Mode & Screenshot */}
                      <div className="space-y-2 neu-inset p-3.5 rounded-2xl text-xs font-serif border border-[#E2D6C0]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-body uppercase tracking-wider text-[#8C3A33] font-bold">
                            Payment Details
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              order.paymentMode === 'online'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.paymentMode} Mode
                          </span>
                        </div>

                        {order.paymentMode === 'online' ? (
                          order.paymentScreenshot ? (
                            <div className="pt-1 flex items-center gap-2.5">
                              <img
                                src={order.paymentScreenshot}
                                alt="Payment screenshot"
                                className="w-14 h-14 object-cover rounded-xl neu-flat cursor-pointer border border-[#D5C9B3]"
                                onClick={() =>
                                  setSelectedImage({
                                    url: order.paymentScreenshot || '',
                                    title: `Payment Screenshot (${order.customerName})`,
                                  })
                                }
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedImage({
                                      url: order.paymentScreenshot || '',
                                      title: `Payment Screenshot (${order.customerName})`,
                                    })
                                  }
                                  className="text-xs font-serif font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>
                                <span className="text-[10px] text-emerald-700 block">
                                  Screenshot Attached
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-rose-700 italic pt-1">
                              ⚠ Online selected, but no screenshot found.
                            </p>
                          )
                        ) : (
                          <div className="pt-1 text-[11px] text-[#8C3A33] italic">
                            Offline: Collect payment via Cash / In-store upon fulfillment.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Internal Notes input */}
                    <div className="pt-1 flex items-center gap-2 text-xs font-serif">
                      <span className="text-[#8C3A33] font-medium shrink-0">Admin Note:</span>
                      <input
                        type="text"
                        defaultValue={order.adminNotes || ''}
                        onBlur={(e) => handleNotesBlur(order.id, e.target.value)}
                        placeholder="Add internal dispatch notes, courier AWB #, or customer instructions (auto-saves on blur)..."
                        className="flex-1 px-3 py-1.5 rounded-xl neu-inset bg-transparent text-[#5A1310] placeholder-[#A07068]/50 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STORE BRANDING & PAYMENT QR MANAGEMENT */}
        {activeTab === 'branding' && (
          <form
            onSubmit={handleSaveSettings}
            className="neu-flat p-6 sm:p-9 rounded-3xl border border-[#EADBCA] space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200"
          >
            <div className="border-b border-[#E2D5BE] pb-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-black text-[#5A1310]">
                  Store Branding & Payment Setup
                </h2>
                <p className="font-serif-vintage italic text-xs text-[#8A3730] mt-0.5">
                  Upload your Agomoni Store logo and Payment QR code. These will update on the customer order form immediately.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="py-2.5 px-5 rounded-2xl neu-btn-maroon font-serif text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : settingsSaveSuccess ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Save className="w-4 h-4 text-[#FFE082]" />
                )}
                <span>{settingsSaveSuccess ? 'Saved to Firestore!' : 'Save All Settings'}</span>
              </button>
            </div>

            {settingsSaveSuccess && (
              <div className="neu-inset p-3 rounded-2xl bg-emerald-50/60 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-serif flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Store configuration updated successfully in Firestore!</span>
              </div>
            )}

            {/* 1. AGOMONI STORE LOGO UPLOAD */}
            <div className="space-y-3 p-4 rounded-2xl neu-inset border border-[#E2D6C0]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-vintage font-bold text-sm sm:text-base text-[#5A1310] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#851C15]" />
                    <span>Agomoni Store Logo</span>
                  </h3>
                  <p className="text-[11px] text-[#8C3A33] font-serif">
                    Appears in the header of the customer order form and admin portal.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-full neu-flat p-2 border border-[#E0D5C0] flex items-center justify-center shrink-0">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Agomoni Store Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-center text-[10px] font-serif text-[#851C15]/60 px-2 leading-tight">
                      No logo uploaded yet
                    </div>
                  )}
                </div>

                {/* Upload action buttons */}
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      disabled={compressingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="py-2 px-4 rounded-xl neu-btn text-xs font-serif font-bold text-[#851C15] flex items-center gap-1.5 cursor-pointer"
                    >
                      {compressingLogo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload Store Logo</span>
                    </button>

                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, logoUrl: '' }))}
                        className="py-2 px-3 rounded-xl neu-btn text-xs font-serif text-rose-700 hover:text-red-800 cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9E4F47] font-serif">
                    Recommended: Square image (PNG or JPG). It will be scaled and stored securely in Firestore.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. PAYMENT QR CODE UPLOAD */}
            <div className="space-y-3 p-4 rounded-2xl neu-inset border border-[#E2D6C0]">
              <div>
                <h3 className="font-serif-vintage font-bold text-sm sm:text-base text-[#5A1310] flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#851C15]" />
                  <span>Payment QR Code</span>
                </h3>
                <p className="text-[11px] text-[#8C3A33] font-serif">
                  Crucial: This QR code is displayed directly above the "Upload Payment Screenshot" button when the customer selects "Online" payment mode.
                </p>
              </div>

              <input
                type="file"
                ref={qrInputRef}
                onChange={handleQrUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* QR Preview */}
                <div className="w-28 h-28 rounded-2xl neu-flat p-2 border border-[#E0D5C0] flex items-center justify-center shrink-0 bg-white">
                  {settings.qrCodeUrl ? (
                    <img
                      src={settings.qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-[10px] font-serif text-[#851C15]">
                      <QrCode className="w-8 h-8 mx-auto text-[#851C15] mb-1" />
                      <span>Fallback UPI QR</span>
                    </div>
                  )}
                </div>

                {/* Upload action buttons */}
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      disabled={compressingQr}
                      onClick={() => qrInputRef.current?.click()}
                      className="py-2 px-4 rounded-xl neu-btn text-xs font-serif font-bold text-[#851C15] flex items-center gap-1.5 cursor-pointer"
                    >
                      {compressingQr ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload Store QR Code</span>
                    </button>

                    {settings.qrCodeUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, qrCodeUrl: '' }))}
                        className="py-2 px-3 rounded-xl neu-btn text-xs font-serif text-rose-700 hover:text-red-800"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9E4F47] font-serif">
                    Upload your official Google Pay, PhonePe, Paytm, or BHIM UPI merchant QR screenshot.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. STORE DETAILS & UPI */}
            <div className="space-y-4 pt-2">
              <h3 className="font-serif-vintage font-bold text-sm text-[#5A1310] tracking-wide">
                Store Information & UPI
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-[#5A1310]">Store Name</label>
                  <div className="neu-inset rounded-xl p-1">
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                      placeholder="Agomoni Store"
                      className="w-full px-3 py-2 bg-transparent text-sm font-serif text-[#5A1310] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* UPI ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-[#5A1310]">
                    Official UPI ID
                  </label>
                  <div className="neu-inset rounded-xl p-1">
                    <input
                      type="text"
                      value={settings.upiId || ''}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                      placeholder="e.g. agomonistore@upi"
                      className="w-full px-3 py-2 bg-transparent text-sm font-mono text-[#5A1310] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-[#5A1310]">
                    Support Phone / WhatsApp
                  </label>
                  <div className="neu-inset rounded-xl p-1">
                    <input
                      type="text"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 bg-transparent text-sm font-serif text-[#5A1310] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-[#5A1310]">Store Tagline</label>
                  <div className="neu-inset rounded-xl p-1">
                    <input
                      type="text"
                      value={settings.tagline || ''}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      placeholder="Exclusive Handcrafted & Curated Collection"
                      className="w-full px-3 py-2 bg-transparent text-sm font-serif text-[#5A1310] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="pt-4 border-t border-[#E2D5BE]">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3.5 px-6 rounded-2xl neu-btn-maroon font-serif text-sm sm:text-base font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {savingSettings ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 text-[#FFE082]" />
                )}
                <span>Save All Store Branding Changes</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="neu-flat p-6 rounded-3xl max-w-sm w-full border border-[#EADBCA] text-center space-y-4">
            <div className="w-12 h-12 rounded-full neu-flat mx-auto flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg text-[#5A1310]">Delete Order?</h3>
              <p className="text-xs font-serif text-[#8C3A33]">
                Are you sure you want to delete order {orderToDelete.orderNumber || orderToDelete.id}? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 rounded-xl neu-btn text-xs font-serif text-[#5A1310]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="flex-1 py-2.5 rounded-xl neu-btn-maroon text-xs font-serif font-bold text-white bg-rose-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-view Lightbox */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};
