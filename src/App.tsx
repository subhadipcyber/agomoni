/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OrderForm } from './components/OrderForm';
import { SuccessModal } from './components/SuccessModal';
import { AdminPanel } from './components/AdminPanel';
import { StoreSettings, OrderFormData } from './types';
import { getStoreSettings, DEFAULT_SETTINGS } from './services/storeService';
import { testFirestoreConnection } from './firebase';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const hash = window.location.hash.toLowerCase();
    return hash === '#/admin' || hash === '#admin';
  });

  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    orderNumber: string;
    orderData: OrderFormData | null;
  }>({
    isOpen: false,
    orderNumber: '',
    orderData: null,
  });

  // Listen to hash changes for GitHub Pages hash routing (/#/admin)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      setIsAdminRoute(hash === '#/admin' || hash === '#admin');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Validate Firestore connection and load store settings
  useEffect(() => {
    testFirestoreConnection();
    getStoreSettings().then((loaded) => {
      setSettings(loaded);
    });
  }, []);

  const handleOrderSuccess = (orderNumber: string, orderData: OrderFormData) => {
    setSuccessModalData({
      isOpen: true,
      orderNumber,
      orderData,
    });
  };

  const navigateToStore = () => {
    window.location.hash = '';
    setIsAdminRoute(false);
  };

  // If URL contains /#/admin, show Admin Panel ONLY
  if (isAdminRoute) {
    return (
      <AdminPanel
        onBackToStore={navigateToStore}
        onSettingsUpdated={(newSettings) => setSettings(newSettings)}
      />
    );
  }

  // Customer Main Store View (Strictly NO mention of Admin Panel anywhere on page)
  return (
    <div className="min-h-screen bg-[#F7F2E7] text-[#5A1310] flex flex-col justify-between selection:bg-[#851C15]/20 selection:text-[#5A1310]">
      <main className="flex-1">
        <Header settings={settings} />

        <OrderForm
          settings={settings}
          onOrderSuccess={handleOrderSuccess}
        />
      </main>

      {/* Customer Footer (Strictly brand information only, zero mention of admin) */}
      <footer className="py-6 px-4 border-t border-[#E8DFC9] text-center text-xs font-serif text-[#782823]/75 space-y-1">
        <p className="font-heading font-bold tracking-widest uppercase text-[11px] text-[#6E1510]">
          {settings.storeName || 'Agomoni Store'}
        </p>
        <p className="font-serif-vintage italic text-[#8F352E]">
          {settings.tagline || 'Exclusive Handcrafted & Curated Collection'}
        </p>
        <p className="text-[10px] text-[#9A4B44]/70 pt-1">
          © {new Date().getFullYear()} All Rights Reserved. Handcrafted with traditional warmth.
        </p>
      </footer>

      {/* Order Confirmation Modal */}
      <SuccessModal
        isOpen={successModalData.isOpen}
        orderNumber={successModalData.orderNumber}
        orderData={successModalData.orderData}
        settings={settings}
        onClose={() => setSuccessModalData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
