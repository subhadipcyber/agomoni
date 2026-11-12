import React, { useState, useRef } from 'react';
import {
  User,
  Phone,
  MapPin,
  Mail,
  Package,
  CreditCard,
  UploadCloud,
  FileCheck,
  Trash2,
  QrCode,
  AlertCircle,
  Eye,
  Loader2,
  ArrowRight,
  Banknote,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import { OrderFormData, FormErrors, StoreSettings, PaymentMode } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { submitOrder } from '../services/storeService';
import { ImageModal } from './ImageModal';

interface OrderFormProps {
  settings: StoreSettings;
  onOrderSuccess: (orderNumber: string, orderData: OrderFormData) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ settings, onOrderSuccess }) => {
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    contactNumber: '',
    address: '',
    email: '',
    productName: '',
    paymentMode: 'online', // default to online
    paymentScreenshot: '',
    productImage: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressingPayment, setCompressingPayment] = useState(false);
  const [compressingProduct, setCompressingProduct] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Lightbox modal state for previews
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const paymentInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Name is mandatory
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Please enter your full name';
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = 'Name must be at least 2 characters long';
    }

    // 2. Contact Number is mandatory
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Please enter your contact / WhatsApp number';
    } else if (formData.contactNumber.trim().length < 7) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }

    // 3. Address is mandatory
    if (!formData.address.trim()) {
      newErrors.address = 'Please enter your complete delivery address';
    } else if (formData.address.trim().length < 6) {
      newErrors.address = 'Please provide detailed house/street/city address';
    }

    // 4. Email is optional, but if provided, must be valid
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // 5. Product Name is mandatory
    if (!formData.productName.trim()) {
      newErrors.productName = 'Please enter the product name you want to order';
    }

    // 6. Payment Mode is mandatory
    if (!formData.paymentMode) {
      newErrors.paymentMode = 'Please select a payment mode';
    }

    // 7. Payment screenshot: mandatory IF payment mode is online
    if (formData.paymentMode === 'online' && !formData.paymentScreenshot) {
      newErrors.paymentScreenshot = 'Please upload your payment screenshot to confirm online payment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user begins typing
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handlePaymentModeSelect = (mode: PaymentMode) => {
    setFormData((prev) => ({ ...prev, paymentMode: mode }));
    if (errors.paymentMode) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.paymentMode;
        return updated;
      });
    }
    // If switching to offline, clear payment screenshot error
    if (mode === 'offline' && errors.paymentScreenshot) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.paymentScreenshot;
        return updated;
      });
    }
  };

  const handlePaymentScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingPayment(true);
      const compressedDataUrl = await compressImage(file, 900, 0.75);
      setFormData((prev) => ({ ...prev, paymentScreenshot: compressedDataUrl }));
      if (errors.paymentScreenshot) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.paymentScreenshot;
          return updated;
        });
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        paymentScreenshot: err instanceof Error ? err.message : 'Failed to process image',
      }));
    } finally {
      setCompressingPayment(false);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingProduct(true);
      const compressedDataUrl = await compressImage(file, 900, 0.75);
      setFormData((prev) => ({ ...prev, productImage: compressedDataUrl }));
    } catch (err) {
      console.error('Error reading product image:', err);
    } finally {
      setCompressingProduct(false);
    }
  };

  const copyUpiId = () => {
    const upi = settings.upiId || 'agomonistore@upi';
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to top or first error
      const firstError = document.querySelector('.form-error-badge');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitOrder(formData);
      onOrderSuccess(result.orderNumber, formData);
      // Reset form
      setFormData({
        customerName: '',
        contactNumber: '',
        address: '',
        email: '',
        productName: '',
        paymentMode: 'online',
        paymentScreenshot: '',
        productImage: '',
      });
      setErrors({});
    } catch (err) {
      console.error('Submission failed:', err);
      setErrors((prev) => ({
        ...prev,
        general: 'Could not submit your order. Please check your internet connection and try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="neu-flat p-6 sm:p-9 rounded-3xl border border-[#ECE2D2] relative space-y-6 sm:space-y-7 transition-all duration-300"
      >
        <div className="text-center pb-2 border-b border-[#E8DFC9]">
          <h2 className="font-heading text-xl sm:text-2xl font-black text-[#5A1310] tracking-wide">
            Exclusive Order Form
          </h2>
          <p className="font-serif-vintage italic text-xs sm:text-sm text-[#8F2820] mt-0.5">
            Fields marked with <span className="text-[#A82E25] font-bold">*</span> are mandatory
          </p>
        </div>

        {errors.general && (
          <div className="neu-inset p-3.5 rounded-2xl border border-[#D9534F]/40 bg-[#FDEDEC] text-[#901D17] text-xs sm:text-sm font-serif flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#901D17]" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* 1. Name */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#851C15]" />
              <span>Full Name</span>
              <span className="text-[#A82E25]">*</span>
            </span>
          </label>
          <div className="neu-inset rounded-2xl overflow-hidden p-1 neu-inset-focus transition-all">
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="e.g. Priyam Mukherjee"
              className="w-full px-4 py-3 bg-transparent text-[#5A1310] placeholder-[#A07068]/60 font-serif focus:outline-hidden text-sm sm:text-base"
            />
          </div>
          {errors.customerName && (
            <p className="form-error-badge flex items-center gap-1 text-xs text-[#9E2018] font-serif font-medium pl-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.customerName}</span>
            </p>
          )}
        </div>

        {/* 2. Contact Number */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#851C15]" />
              <span>Contact Number</span>
              <span className="text-[#A82E25]">*</span>
            </span>
            <span className="text-[11px] font-normal text-[#96423C] italic">Phone / WhatsApp</span>
          </label>
          <div className="neu-inset rounded-2xl overflow-hidden p-1 neu-inset-focus transition-all">
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-3 bg-transparent text-[#5A1310] placeholder-[#A07068]/60 font-serif focus:outline-hidden text-sm sm:text-base"
            />
          </div>
          {errors.contactNumber && (
            <p className="form-error-badge flex items-center gap-1 text-xs text-[#9E2018] font-serif font-medium pl-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.contactNumber}</span>
            </p>
          )}
        </div>

        {/* 3. Address */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#851C15]" />
              <span>Delivery Address</span>
              <span className="text-[#A82E25]">*</span>
            </span>
          </label>
          <div className="neu-inset rounded-2xl overflow-hidden p-1 neu-inset-focus transition-all">
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="House/Apartment #, Street, Locality, City, State, PIN Code"
              className="w-full px-4 py-2.5 bg-transparent text-[#5A1310] placeholder-[#A07068]/60 font-serif focus:outline-hidden text-sm sm:text-base resize-none"
            />
          </div>
          {errors.address && (
            <p className="form-error-badge flex items-center gap-1 text-xs text-[#9E2018] font-serif font-medium pl-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.address}</span>
            </p>
          )}
        </div>

        {/* 4. Email (Optional) */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#851C15]" />
              <span>Email Address</span>
            </span>
            <span className="text-[11px] font-normal text-[#96423C] italic font-serif">
              Optional
            </span>
          </label>
          <div className="neu-inset rounded-2xl overflow-hidden p-1 neu-inset-focus transition-all">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g. yourname@example.com"
              className="w-full px-4 py-3 bg-transparent text-[#5A1310] placeholder-[#A07068]/60 font-serif focus:outline-hidden text-sm sm:text-base"
            />
          </div>
          {errors.email && (
            <p className="form-error-badge flex items-center gap-1 text-xs text-[#9E2018] font-serif font-medium pl-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* 5. Product Name */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#851C15]" />
              <span>Product Name</span>
              <span className="text-[#A82E25]">*</span>
            </span>
          </label>
          <div className="neu-inset rounded-2xl overflow-hidden p-1 neu-inset-focus transition-all">
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              placeholder="e.g. Royal Maroon Silk Chanderi Saree / Dokra Idol"
              className="w-full px-4 py-3 bg-transparent text-[#5A1310] placeholder-[#A07068]/60 font-serif focus:outline-hidden text-sm sm:text-base"
            />
          </div>
          {errors.productName && (
            <p className="form-error-badge flex items-center gap-1 text-xs text-[#9E2018] font-serif font-medium pl-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.productName}</span>
            </p>
          )}
        </div>

        {/* Option to upload Product Screenshot / Reference Image */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-[#851C15]" />
              <span>Product Reference Photo / Screenshot</span>
            </span>
            <span className="text-[11px] font-normal text-[#96423C] italic font-serif">
              Optional reference
            </span>
          </div>

          <input
            type="file"
            ref={productInputRef}
            onChange={handleProductImageUpload}
            accept="image/*"
            className="hidden"
          />

          {formData.productImage ? (
            <div className="neu-inset p-3 rounded-2xl flex items-center justify-between gap-3 border border-[#E0D5C0]">
              <div className="flex items-center gap-3">
                <img
                  src={formData.productImage}
                  alt="Product Reference"
                  className="w-14 h-14 object-cover rounded-xl neu-flat cursor-pointer border border-[#D5C9B3]"
                  onClick={() =>
                    setPreviewImage({ url: formData.productImage, title: 'Product Reference Image' })
                  }
                />
                <div>
                  <p className="font-serif-vintage font-bold text-xs sm:text-sm text-[#5A1310]">
                    Product Photo Attached
                  </p>
                  <p className="text-[11px] text-[#8C3A33] font-serif">
                    Click image to inspect in full view
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImage({ url: formData.productImage, title: 'Product Reference Image' })
                  }
                  className="p-2 rounded-xl neu-btn text-[#781B15]"
                  title="View Image"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, productImage: '' }))}
                  className="p-2 rounded-xl neu-btn text-[#901D17] hover:text-red-700"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={compressingProduct}
              onClick={() => productInputRef.current?.click()}
              className="w-full py-4 px-4 rounded-2xl neu-inset hover:border-[#851C15]/40 border-2 border-dashed border-[#D6CBB7] flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all duration-200 group"
            >
              {compressingProduct ? (
                <div className="flex items-center gap-2 text-xs font-serif text-[#851C15]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing image...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-[#851C15] group-hover:scale-110 transition-transform" />
                  <span className="font-serif-vintage font-bold text-xs sm:text-sm text-[#6E1510]">
                    Click to upload product screenshot or photo
                  </span>
                  <span className="text-[11px] text-[#9A4B44] font-serif">
                    Helps us verify the exact color, design or variant you desire
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 6. Payment Mode (Mandatory: 1. Offline, 2. Online) */}
        <div className="space-y-2 pt-2 border-t border-[#E8DFC9]">
          <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#851C15]" />
              <span>Payment Mode</span>
              <span className="text-[#A82E25]">*</span>
            </span>
          </label>

          {/* Neumorphic Dual Toggle Selector */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-1 rounded-2xl neu-inset">
            {/* Offline Option */}
            <button
              type="button"
              onClick={() => handlePaymentModeSelect('offline')}
              className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-serif cursor-pointer ${
                formData.paymentMode === 'offline'
                  ? 'neu-btn-maroon font-bold text-sm sm:text-base'
                  : 'neu-btn text-[#6E1510] font-medium text-xs sm:text-sm hover:text-[#5A1310]'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>1) Offline</span>
            </button>

            {/* Online Option */}
            <button
              type="button"
              onClick={() => handlePaymentModeSelect('online')}
              className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-serif cursor-pointer ${
                formData.paymentMode === 'online'
                  ? 'neu-btn-maroon font-bold text-sm sm:text-base'
                  : 'neu-btn text-[#6E1510] font-medium text-xs sm:text-sm hover:text-[#5A1310]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>2) Online</span>
            </button>
          </div>

          <div className="text-center">
            {formData.paymentMode === 'offline' ? (
              <p className="text-[11px] sm:text-xs text-[#8F352E] font-serif italic py-1">
                Cash on delivery / In-store payment upon receipt of your package.
              </p>
            ) : (
              <p className="text-[11px] sm:text-xs text-[#8F352E] font-serif italic py-1">
                Scan our Payment QR code below and attach your payment receipt screenshot.
              </p>
            )}
          </div>
        </div>

        {/* Payment QR Code & Screenshot Upload (Conditioned on Online Payment) */}
        {formData.paymentMode === 'online' && (
          <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* PAYMENT QR CODE: Placed just above the upload screenshot button as requested */}
            <div className="neu-flat p-4 sm:p-5 rounded-2xl border border-[#E8DFC9] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left bg-[#F7F2E7]">
              {/* QR Code Container */}
              <div className="shrink-0 p-2.5 rounded-2xl neu-inset bg-[#FFFFFF] border border-[#DDD3BF]">
                {settings.qrCodeUrl ? (
                  <img
                    src={settings.qrCodeUrl}
                    alt="Agomoni Store Payment QR Code"
                    className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl cursor-pointer"
                    onClick={() =>
                      setPreviewImage({
                        url: settings.qrCodeUrl || '',
                        title: 'Official Agomoni Store Payment QR Code',
                      })
                    }
                  />
                ) : (
                  <div
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl flex flex-col items-center justify-center text-[#851C15] bg-[#F9F5EC] border border-dashed border-[#851C15]/30 cursor-pointer"
                    onClick={() =>
                      setPreviewImage({
                        url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=agomonistore@upi&pn=Agomoni%20Store',
                        title: 'Agomoni Store UPI QR Code',
                      })
                    }
                  >
                    <QrCode className="w-12 h-12 text-[#851C15] mb-1" />
                    <span className="text-[10px] font-serif uppercase tracking-wider font-bold">
                      UPI QR Code
                    </span>
                    <span className="text-[9px] text-[#8C3A33]">Click to enlarge</span>
                  </div>
                )}
              </div>

              {/* QR Instructions & UPI copy */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#851C15] font-serif-vintage font-bold text-sm sm:text-base">
                  <QrCode className="w-4 h-4 text-[#851C15]" />
                  <span>Official Agomoni Payment QR</span>
                </div>
                <p className="text-xs text-[#732722] font-serif leading-relaxed">
                  Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app to complete payment.
                </p>

                {/* UPI ID Pill with Copy button */}
                <div className="neu-inset p-2 px-3 rounded-xl flex items-center justify-between gap-2 max-w-xs mx-auto sm:mx-0 border border-[#DDD3BF]">
                  <div className="text-left overflow-hidden">
                    <span className="block text-[10px] text-[#9A423A] font-body uppercase font-bold">
                      UPI ID
                    </span>
                    <span className="text-xs font-mono font-bold text-[#5A1310] truncate">
                      {settings.upiId || 'agomonistore@upi'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="p-1.5 rounded-lg neu-btn text-[#781B15] text-[11px] font-serif flex items-center gap-1"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 7. UPLOAD PAYMENT SCREENSHOT: Directly below the QR code */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs sm:text-sm font-serif-vintage font-bold text-[#5A1310] tracking-wide">
                <span className="flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-[#851C15]" />
                  <span>Upload Payment Screenshot</span>
                  <span className="text-[#A82E25]">*</span>
                </span>
                <span className="text-[11px] font-normal text-[#96423C] italic font-serif">
                  Mandatory for online mode
                </span>
              </label>

              <input
                type="file"
                ref={paymentInputRef}
                onChange={handlePaymentScreenshotUpload}
                accept="image/*"
                className="hidden"
              />

              {formData.paymentScreenshot ? (
                <div className="neu-inset p-3 rounded-2xl flex items-center justify-between gap-3 border border-[#E0D5C0]">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.paymentScreenshot}
                      alt="Payment Receipt"
                      className="w-14 h-14 object-cover rounded-xl neu-flat cursor-pointer border border-[#D5C9B3]"
                      onClick={() =>
                        setPreviewImage({
                          url: formData.paymentScreenshot,
                          title: 'Payment Transaction Screenshot',
                        })
                      }
                    />
                    <div>
                      <div className="flex items-center gap-1 text-emerald-700 font-serif-vintage font-bold text-xs sm:text-sm">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>Screenshot Uploaded</span>
                      </div>
                      <p className="text-[11px] text-[#8C3A33] font-serif">
                        Click thumbnail to inspect receipt
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: formData.paymentScreenshot,
                          title: 'Payment Transaction Screenshot',
                        })
                      }
                      className="p-2 rounded-xl neu-btn text-[#781B15]"
                      title="Inspect Screenshot"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, paymentScreenshot: '' }))}
                      className="p-2 rounded-xl neu-btn text-[#901D17] hover:text-red-700"
                      title="Remove Screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={compressingPayment}
                  onClick={() => paymentInputRef.current?.click()}
                  className={`w-full py-4 px-4 rounded-2xl neu-inset hover:border-[#851C15]/40 border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all duration-200 group ${
                    errors.paymentScreenshot ? 'border-[#C93B32] bg-[#FDF2F0]' : 'border-[#D6CBB7]'
                  }`}
                >
                  {compressingPayment ? (
                    <div className="flex items-center gap-2 text-xs font-serif text-[#851C15]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing screenshot...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-[#851C15] group-hover:scale-110 transition-transform" />
                      <span className="font-serif-vintage font-bold text-xs sm:text-sm text-[#6E1510]">
                        Click to select payment screenshot
                      </span>
                      <span className="text-[11px] text-[#9A4B44] font-serif">
                        Supports PNG, JPG, JPEG from UPI apps (GPay, PhonePe, Paytm, etc.)
                      </span>
                    </>
                  )}
                </button>
              )}

              {errors.paymentScreenshot && (
                <p className="form-error-badge flex items-center gap-1 text-xs text-[#9E2018] font-serif font-medium pl-2 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.paymentScreenshot}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || compressingPayment || compressingProduct}
            className="w-full py-4 px-6 rounded-2xl neu-btn-maroon font-serif text-base sm:text-lg font-bold tracking-wider flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Your Order...</span>
              </>
            ) : (
              <>
                <span>Confirm & Place Order</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#FFE082]" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[#8C3A33]/80 font-serif italic mt-2.5">
            Agomoni Store • Safe Transactions & Quality Assurance
          </p>
        </div>
      </form>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <ImageModal
          isOpen={!!previewImage}
          imageUrl={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};
