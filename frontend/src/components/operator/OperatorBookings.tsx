import { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import {
  Calendar,
  Clock,
  Monitor,
  Crown,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { toast } from 'sonner';

export function OperatorBookings() {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const operator = context?.operator;
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  const cafe = context?.cafes.find((c) => c.id === operator.cafeId);

  // Get all bookings for this cafe
  const cafeBookings = useMemo(() => {
    const bookings = context?.bookings.filter((b) => b.cafeId === operator.cafeId) || [];
    
    // Apply filters
    let filtered = bookings;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter((b) => {
        const user = context?.registeredUsers.find((u) => u.id === b.userId);
        return (
          user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.pcNumber.toString().includes(searchQuery)
        );
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [context?.bookings, operator.cafeId, filterStatus, searchQuery, context?.registeredUsers]);

  const handleConfirmPayment = (bookingId: string) => {
    context?.updateBooking(bookingId, { paymentStatus: 'paid' });
    toast.success('Pembayaran dikonfirmasi!');
  };

  const handleCancelBooking = (bookingId: string) => {
    context?.updateBookingStatus(bookingId, 'cancelled');
    toast.success('Booking dibatalkan');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Statistics
  const stats = useMemo(() => {
    const allCafeBookings = context?.bookings.filter((b) => b.cafeId === operator.cafeId) || [];
    return {
      total: allCafeBookings.length,
      active: allCafeBookings.filter((b) => b.status === 'active').length,
      pending: allCafeBookings.filter((b) => b.paymentStatus === 'pending' && b.status !== 'cancelled').length,
      completed: allCafeBookings.filter((b) => b.status === 'completed').length,
    };
  }, [context?.bookings, operator.cafeId]);

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <div className="mb-4">
            <h1 className="text-slate-200 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Manajemen Booking
            </h1>
            <p className="text-slate-400 text-sm">{cafe?.name}</p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari berdasarkan username, email, atau nomor PC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${
                filterStatus === 'all'
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${
                filterStatus === 'active'
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
              }`}
            >
              Aktif ({stats.active})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
              }`}
            >
              Pembayaran Tertunda ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${
                filterStatus === 'completed'
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
              }`}
            >
              Selesai ({stats.completed})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6">
        {cafeBookings.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">Tidak ada booking ditemukan</p>
              <p className="text-slate-500 text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Coba sesuaikan filter Anda'
                  : 'Booking akan muncul di sini'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {cafeBookings.map((booking) => {
              const user = context?.registeredUsers.find((u) => u.id === booking.userId);
              const isMember = user?.cafeWallets?.some((w) => w.cafeId === operator.cafeId);
              const isStoredTimePurchase = booking.pcNumber === 0;

              return (
                <div
                  key={booking.id}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className={`rounded-2xl p-3 ${
                        isStoredTimePurchase
                          ? 'bg-teal-500/20 border border-teal-500/30'
                          : booking.status === 'active'
                          ? 'bg-green-500/20 border border-green-500/30'
                          : booking.status === 'completed'
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-slate-800/50 border border-slate-700/50'
                      }`}>
                        {isStoredTimePurchase ? (
                          <Clock className="w-5 h-5 text-teal-400" />
                        ) : (
                          <Monitor className="w-5 h-5 text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isMember && <Crown className="w-4 h-4 text-purple-400" />}
                          <h3 className="text-slate-200">{user?.username || 'Tidak diketahui'}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{user?.email}</p>

                        {/* Booking Details */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {!isStoredTimePurchase && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3.5 h-3.5" />
                              <span>PC {booking.pcNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(booking.date)}</span>
                          </div>
                          {!isStoredTimePurchase && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{booking.time} • {booking.duration}j</span>
                            </div>
                          )}
                          {isStoredTimePurchase && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{booking.duration} jam dibeli</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {booking.status === 'active' && (
                        <span className="bg-green-500/20 border border-green-500/50 text-green-400 text-xs px-3 py-1.5 rounded-full">
                          Aktif
                        </span>
                      )}
                      {booking.status === 'completed' && (
                        <span className="bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs px-3 py-1.5 rounded-full">
                          Selesai
                        </span>
                      )}
                      {booking.paymentStatus === 'pending' && (
                        <span className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs px-3 py-1.5 rounded-full">
                          Tertunda
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="bg-red-500/20 border border-red-500/50 text-red-400 text-xs px-3 py-1.5 rounded-full">
                          Dibatalkan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Payment Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-300">
                        {formatCurrency(0)} {/* TODO: Calculate total price from duration and cafe price */}
                      </span>
                      {booking.paymentStatus === 'paid' ? (
                        <span className="text-xs text-green-400 flex items-center gap-1 ml-2">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Lunas
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1 ml-2">
                          <XCircle className="w-3.5 h-3.5" />
                          Belum Lunas
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleConfirmPayment(booking.id)}
                          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 px-4 py-2 rounded-xl text-sm transition-all"
                        >
                          Konfirmasi Pembayaran
                        </button>
                      )}
                      {booking.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm transition-all"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <OperatorBottomNav />
    </div>
  );
}