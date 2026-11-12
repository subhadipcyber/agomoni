import React from 'react';
import { StoreSettings } from '../types';

interface HeaderProps {
  settings: StoreSettings;
}

export const Header: React.FC<HeaderProps> = ({ settings }) => {
  return (
    <header className="pt-10 pb-5 px-4 text-center select-none">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* Only display logo if uploaded by admin via the admin panel (no pre-hardcoded logo) */}
        {settings.logoUrl && (
          <div className="mb-5 animate-in fade-in duration-300">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full neu-flat p-2 flex items-center justify-center border border-[#F2EAE0]">
              <img
                src={settings.logoUrl}
                alt="Agomoni Store Logo"
                className="w-full h-full object-cover rounded-full border border-[#D9CEBC]"
              />
            </div>
          </div>
        )}

        {/* Vintage Curvy Header Title */}
        <div className="space-y-1.5">
          <div className="inline-block px-3.5 py-1 rounded-full neu-inset text-xs tracking-widest uppercase font-semibold text-[#8B231B] mb-1">
            Curated Heritage & Elegance
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-[#6E1510] tracking-wide leading-tight drop-shadow-xs">
            Agomoni Store
          </h1>

          <p className="font-serif-vintage italic text-base sm:text-lg text-[#942E25] font-medium max-w-lg mx-auto">
            Our exclusive products & handcrafted bespoke orders
          </p>
        </div>

        {/* Clean Vintage Divider (no stars or ornamental symbols) */}
        <div className="h-[1px] w-24 bg-[#851C15]/25 my-4"></div>

        {/* Subtitle / Description Note */}
        <p className="text-xs sm:text-sm font-serif text-[#782823]/85 max-w-md px-2 leading-relaxed">
          Please fill out the order form below with your required product details. We ensure safe packaging, prompt dispatch, and personalized customer support.
        </p>
      </div>
    </header>
  );
};
