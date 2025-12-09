import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, Monitor, Calendar, Clock, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export function BookingScreen() {
  const { cafeId, pcNumber } = useParams<{ cafeId: string; pcNumber: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [duration, setDuration] = useState(1);
  
  // Set current date and time
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(
    now.toTimeString().slice(0, 5) // HH:MM format
  );

  const cafe = context?.cafes.find((c) => c.id === cafeId);
  const isMemberCafe =
    context?.user?.role === 'member' &&
    context.user.cafeWallets?.some((w) => w.cafeId === cafe?.id);

  // Check if this is first member booking
  const isFirstMemberBooking =
    context?.user?.role === 'member' &&
    isMemberCafe &&
    context.user.cafeWallets?.find((w) => w.cafeId === cafeId)?.remainingMinutes === 0;

  // Minimum duration for first member booking
  const minDuration = isFirstMemberBooking ? 2 : 1;

  if (!cafe || !pcNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Booking tidak valid</p>
      </div>
    );
  }

  const pricePerHour = isMemberCafe
    ? cafe.memberPricePerHour
    : cafe.regularPricePerHour;
  const totalPrice = pricePerHour * duration;

  const handleProceedToPayment = () => {
    if (duration < minDuration) {
      toast.error(`Booking member pertama membutuhkan minimum ${minDuration} jam`);
      return;
    }

    const booking = {
      id: Date.now().toString(),
      userId: context?.user?.id || '', // Add userId
      cafeId: cafe.id,
      cafeName: cafe.name,
      pcNumber: parseInt(pcNumber),
      date,
      time,
      duration,
      status: 'active' as const,
      paymentStatus: 'pending' as const,
      bookedAt: Date.now(),
      remainingMinutes: duration * 60,
      isSessionActive: false,
      isMemberBooking: isMemberCafe, // Save member status at time of booking
    };

    context?.addBooking(booking);
    navigate(`/payment/${booking.id}`);
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
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
            <h1 className="text-slate-200">Detail Booking</h1>
            <p className="text-slate-400 text-sm">Lengkapi pesanan Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* PC Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-2xl p-4">
              <Monitor className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-slate-200 mb-1">PC #{pcNumber}</h2>
              <p className="text-slate-400 text-sm">{cafe.name}</p>
              {isMemberCafe && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-2 py-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-cyan-400 text-xs">Tarif Member</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Detail Pesanan</h3>
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">📅 Tanggal Pesanan</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">🕗 Waktu Pesanan</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Durasi</h3>
          {isFirstMemberBooking && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-3 mb-4">
              <p className="text-cyan-300 text-sm">
                ℹ️ Booking member pertama membutuhkan minimum 2 jam
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDuration(Math.max(minDuration, duration - 1))}
              disabled={duration <= minDuration}
              className="bg-slate-800/50 border border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-2xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all"
            >
              <Minus className="w-6 h-6 text-slate-300" />
            </button>
            <div className="text-center">
              <p className="text-5xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tabular-nums mb-2">
                {duration}
              </p>
              <p className="text-slate-400">
                {duration === 1 ? 'jam' : 'jam'}
              </p>
            </div>
            <button
              onClick={() => setDuration(duration + 1)}
              className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all"
            >
              <Plus className="w-6 h-6 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Ringkasan Harga</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span>Tarif per Jam</span>
              <span>Rp {pricePerHour.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Durasi</span>
              <span>{duration} {duration === 1 ? 'jam' : 'jam'}</span>
            </div>
            {isMemberCafe && (
              <div className="flex items-center justify-between text-cyan-400 text-sm">
                <span>💎 Diskon Member</span>
                <span>Diterapkan</span>
              </div>
            )}
            <div className="border-t border-slate-700/50 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Total Pembayaran</span>
                <span className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tabular-nums">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={handleProceedToPayment}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          Lanjut ke Pembayaran
        </button>
      </div>
    </div>
  );
}