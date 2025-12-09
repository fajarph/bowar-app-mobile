import { useContext, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Calendar, Monitor, Clock, CheckCircle2, XCircle, Timer, Play, Wallet } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { toast } from 'sonner';

// Helper function to get current timestamp
const getCurrentTimestamp = () => Date.now();

export function BookingHistoryScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);

  const handleStartSession = useCallback((bookingId: string, e: MouseEvent) => {
    e.stopPropagation();
    
    // Start the session with current timestamp
    const now = getCurrentTimestamp();
    context?.updateBooking(bookingId, {
      isSessionActive: true,
      sessionStartTime: now,
    });
    
    toast.success('🕒 Waktu billing dimulai sekarang — selamat bermain!');
    navigate(`/session/${bookingId}`);
  }, [context, navigate]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'from-slate-900/50 to-slate-800/50 border-cyan-500/30';
      case 'completed':
        return 'from-slate-900/50 to-slate-800/50 border-slate-700/30';
      case 'cancelled':
        return 'from-slate-900/50 to-slate-800/50 border-slate-700/30';
      default:
        return 'from-slate-900/50 to-slate-800/50 border-slate-700/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Timer className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Monitor className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return 'Tidak Diketahui';
    }
  };

  // Get user-specific bookings and sort: active first, then by date
  const sortedBookings = [...(context?.getUserBookings() || [])].sort((a, b) => {
    // Active bookings first
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Then by date
    return b.bookedAt - a.bookedAt;
  });

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <h1 className="text-slate-200">Riwayat Booking</h1>
          <p className="text-slate-400 text-sm">Sesi gaming & pembelian waktu Anda</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {sortedBookings.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">Belum ada riwayat</p>
              <p className="text-slate-500 text-sm mb-6">
                Mulai dengan booking PC atau tambah waktu tersimpan
              </p>
              <button
                onClick={() => navigate('/home')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/25"
              >
                Jelajahi Warnet
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => {
              const isStoredTimePurchase = booking.pcNumber === 0;
              
              return (
                <div
                  key={booking.id}
                  onClick={() => {
                    if (booking.status === 'active' && !isStoredTimePurchase) {
                      navigate(`/session/${booking.id}`);
                    }
                  }}
                  className={`bg-gradient-to-br ${getStatusColor(
                    booking.status
                  )} border backdrop-blur-xl rounded-3xl p-5 transition-all ${
                    booking.status === 'active' && !isStoredTimePurchase
                      ? 'cursor-pointer hover:shadow-xl hover:shadow-cyan-500/10 hover:scale-[1.01]'
                      : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-2xl ${
                          isStoredTimePurchase
                            ? 'bg-purple-500/20 border border-purple-500/30'
                            : booking.status === 'active'
                            ? 'bg-cyan-500/20 border border-cyan-500/30'
                            : booking.status === 'completed'
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        {isStoredTimePurchase ? (
                          <Wallet className="w-5 h-5 text-purple-400" />
                        ) : (
                          getStatusIcon(booking.status)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-slate-200">{booking.cafeName}</h3>
                          {booking.isMemberBooking && (
                            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs">
                              Member
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {isStoredTimePurchase ? '⏱️ Pembelian Waktu Tersimpan' : `PC #${booking.pcNumber}`}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-full text-xs ${
                        booking.status === 'active'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : booking.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {getStatusText(booking.status)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {booking.date} • {booking.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {booking.duration} {booking.duration === 1 ? 'jam' : 'jam'}
                        {isStoredTimePurchase && ' ditambahkan ke wallet'}
                      </span>
                    </div>

                    {/* Active Session Countdown */}
                    {booking.status === 'active' && booking.isSessionActive && booking.remainingMinutes !== undefined && !isStoredTimePurchase && (
                      <div className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span className="text-cyan-300 text-sm">
                              ⏳ Sesi aktif — Waktu Tersisa
                            </span>
                          </div>
                          <span className="text-cyan-400 tabular-nums">
                            {formatTime(booking.remainingMinutes)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Start Session Button */}
                    {booking.status === 'active' && !booking.isSessionActive && booking.paymentStatus === 'paid' && !isStoredTimePurchase && (
                      <button
                        onClick={(e) => handleStartSession(booking.id, e)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
                      >
                        <Play className="w-5 h-5" />
                        <span>Mulai Sesi Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}