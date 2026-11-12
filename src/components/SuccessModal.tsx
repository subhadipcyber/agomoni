import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Check, ShoppingBag, PhoneCall, ArrowRight } from 'lucide-react';
import { OrderFormData, StoreSettings } from '../types';

interface SuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  orderData: OrderFormData | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  orderNumber,
  orderData,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fire festive warm-colored confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#851C15', '#A82E25', '#D4813B', '#D4AF37', '#FFF3D6'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg neu-flat-lg p-6 sm:p-8 rounded-3xl border border-[#EADBCA] bg-[#F7F2E7] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-3">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto rounded-full neu-flat flex items-center justify-center text-[#851C15] border border-[#F0E5D4]">
            <CheckCircle2 className="w-9 h-9 text-[#851C15]" />
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#5A1310] tracking-wide">
            Order Submitted!
          </h2>

          <p className="font-serif-vintage italic text-sm sm:text-base text-[#80241E]">
            Thank you for ordering with Agomoni Store.
          </p>

          {/* Order Reference Number */}
          <div className="neu-inset p-3 rounded-2xl flex items-center justify-between gap-3 text-sm border border-[#E5DAC6]">
            <div className="text-left">
              <span className="block text-[11px] font-body uppercase tracking-wider text-[#9E3932] font-semibold">
                Order Reference Code
              </span>
              <span className="font-heading font-black text-[#5A1310] text-base tracking-wider">
                {orderNumber}
              </span>
            </div>
            <button
              onClick={copyOrderNumber}
              className="p-2 rounded-xl neu-btn text-[#781B15] hover:text-[#5A1310] flex items-center gap-1 text-xs font-serif"
              title="Copy Reference Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Quick Summary Card */}
          <div className="neu-inset p-4 rounded-2xl text-left space-y-2 text-xs sm:text-sm font-serif border border-[#E5DAC6]">
            <div className="flex justify-between items-start border-b border-[#E0D4BE] pb-2">
              <span className="text-[#872A23] font-medium">Product Ordered:</span>
              <span className="font-bold text-[#5A1310] text-right">{orderData.productName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#E0D4BE] pb-2">
              <span className="text-[#872A23] font-medium">Customer:</span>
              <span className="font-bold text-[#5A1310]">{orderData.customerName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#E0D4BE] pb-2">
              <span className="text-[#872A23] font-medium">Contact Number:</span>
              <span className="font-bold text-[#5A1310]">{orderData.contactNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#872A23] font-medium">Payment Mode:</span>
              <span className="font-bold uppercase tracking-wider text-[#851C15] px-2 py-0.5 rounded-full neu-flat-sm text-[11px]">
                {orderData.paymentMode}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#EFE6D5]/60 text-xs text-[#70241E] leading-relaxed font-serif text-left flex items-start gap-2.5">
            <PhoneCall className="w-4 h-4 text-[#851C15] shrink-0 mt-0.5" />
            <div>
              Our team will verify your details and connect with you shortly via phone/WhatsApp for order confirmation and dispatch schedule.
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl neu-btn-maroon font-serif text-sm sm:text-base font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Place Another Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
