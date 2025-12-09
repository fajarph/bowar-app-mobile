import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, CreditCard, Wallet, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const booking = context?.bookings.find((b) => b.id === bookingId);
  const cafe = context?.cafes.find((c) => c.id === booking?.cafeId);

  const pricePerHour =
    context?.user?.role === 'member' &&
    context.user.cafeWallets?.some((w) => w.cafeId === booking?.cafeId)
      ? cafe?.memberPricePerHour || 0
      : cafe?.regularPricePerHour || 0;

  const totalPrice = pricePerHour * (booking?.duration || 0);

  // Payment methods
  const banks = [
    { id: 'bca', name: 'BCA', color: 'from-blue-500 to-blue-600' },
    { id: 'bri', name: 'BRI', color: 'from-blue-600 to-blue-700' },
    { id: 'mandiri', name: 'Mandiri', color: 'from-yellow-500 to-yellow-600' },
    { id: 'bni', name: 'BNI', color: 'from-orange-500 to-orange-600' },
    { id: 'bsi', name: 'BSI', color: 'from-green-600 to-green-700' },
  ];

  const ewallets = [
    { id: 'gopay', name: 'GoPay', color: 'from-green-500 to-green-600' },
    { id: 'ovo', name: 'OVO', color: 'from-purple-600 to-purple-700' },
    { id: 'dana', name: 'DANA', color: 'from-blue-400 to-blue-500' },
    { id: 'shopeepay', name: 'ShopeePay', color: 'from-orange-500 to-orange-600' },
    { id: 'linkaja', name: 'LinkAja', color: 'from-red-500 to-red-600' },
  ];

  const handlePayment = () => {
    if (!selectedMethod) {
      toast.error('Silakan pilih metode pembayaran');
      return;
    }

    // Update booking to paid
    context?.updateBooking(bookingId!, {
      paymentStatus: 'paid',
      canCancelUntil: Date.now() + 120000, // 2 minutes from now
    });

    // For members at THIS cafe, add time to wallet
    // IMPORTANT: Only add to wallet if user is already a member at this specific cafe
    if (context?.user?.role === 'member' && booking?.cafeId) {
      const existingWallet = context.user.cafeWallets?.find(
        (w) => w.cafeId === booking.cafeId
      );

      // Only extend wallet if user is ALREADY a member at this cafe
      if (existingWallet) {
        context.extendWallet(booking.cafeId, booking.duration * 60);
      }
      // DO NOT create new wallet automatically - user must register as member first!
    }

    toast.success('✅ Pembayaran berhasil! Timer dimulai setelah login di warnet.');
    
    // Navigate to booking history
    setTimeout(() => {
      navigate('/booking-history');
    }, 1500);
  };

  if (!booking || !cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Booking tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-200">Pembayaran</h1>
            <p className="text-slate-400 text-sm">Pilih metode pembayaran</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Ringkasan Pesanan</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">Warnet</span>
              <span>{cafe.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">Nomor PC</span>
              <span>#{booking.pcNumber}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">📅 Tanggal</span>
              <span>{booking.date}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">🕗 Waktu</span>
              <span>{booking.time}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sm">Durasi</span>
              <span>{booking.duration} {booking.duration === 1 ? 'jam' : 'jam'}</span>
            </div>
            <div className="border-t border-cyan-500/30 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Pembayaran</span>
                <span className="text-2xl text-cyan-400 tabular-nums">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Transfer */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h3 className="text-slate-200">Transfer Bank</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {banks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelectedMethod(bank.id)}
                className={`
                  relative aspect-[3/2] rounded-2xl p-4 transition-all
                  ${
                    selectedMethod === bank.id
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950'
                      : ''
                  }
                  bg-gradient-to-br ${bank.color} hover:scale-105
                `}
              >
                <div className="h-full flex items-center justify-center">
                  <span className="text-white text-sm">{bank.name}</span>
                </div>
                {selectedMethod === bank.id && (
                  <div className="absolute top-2 right-2 bg-cyan-400 rounded-full p-1">
                    <Check className="w-3 h-3 text-slate-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* E-Wallet */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <h3 className="text-slate-200">E-Wallet</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ewallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => setSelectedMethod(wallet.id)}
                className={`
                  relative aspect-[3/2] rounded-2xl p-4 transition-all
                  ${
                    selectedMethod === wallet.id
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950'
                      : ''
                  }
                  bg-gradient-to-br ${wallet.color} hover:scale-105
                `}
              >
                <div className="h-full flex items-center justify-center">
                  <span className="text-white text-xs text-center">{wallet.name}</span>
                </div>
                {selectedMethod === wallet.id && (
                  <div className="absolute top-2 right-2 bg-cyan-400 rounded-full p-1">
                    <Check className="w-3 h-3 text-slate-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* QRIS */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-slate-200">QRIS</h3>
          </div>
          <button
            onClick={() => setSelectedMethod('qris')}
            className={`
              w-full rounded-2xl p-6 transition-all
              ${
                selectedMethod === 'qris'
                  ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400'
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3">
                  <QrCode className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-slate-200">Scan QR Code</p>
                  <p className="text-slate-400 text-sm">Semua aplikasi yang mendukung QRIS</p>
                </div>
              </div>
              {selectedMethod === 'qris' && (
                <div className="bg-cyan-400 rounded-full p-1.5">
                  <Check className="w-4 h-4 text-slate-900" />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Confirm Payment Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={handlePayment}
          disabled={!selectedMethod}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
        >
          Konfirmasi & Bayar Rp {totalPrice.toLocaleString()}
        </button>
      </div>
    </div>
  );
}