import { useContext, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import type { ChatMessage } from '../../App';
import {
  Monitor,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  LogOut,
  Activity,
} from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { getWarnetStatistics } from '../../services/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export function OperatorDashboard() {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const operator = context?.operator;
  const [statistics, setStatistics] = useState<{
    todayRevenue: number;
    todayBookings: number;
    activeBookings: number;
    totalMembers: number;
    pendingTopups: number;
    transactions: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!operator) {
    navigate('/operator/login');
    return null;
  }

  const cafe = context?.cafes.find((c) => c.id === operator.cafeId);

  // Fetch statistics from backend
  useEffect(() => {
    const loadStatistics = async () => {
      if (!operator?.cafeId) return;
      
      try {
        setLoading(true);
        const warnetId = parseInt(operator.cafeId);
        const response = await getWarnetStatistics(warnetId);
        
        if (response.data) {
          setStatistics({
            todayRevenue: response.data.todayRevenue || 0,
            todayBookings: response.data.todayBookings || 0,
            activeBookings: response.data.activeBookings || 0,
            totalMembers: response.data.totalMembers || 0,
            pendingTopups: response.data.pendingTopups || 0,
            transactions: response.data.transactions || [],
          });
        }
      } catch (error: any) {
        console.error('Failed to load statistics:', error);
        toast.error('Gagal memuat statistik');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [operator?.cafeId]);

  // Calculate statistics (fallback to context data if API fails)
  const stats = useMemo(() => {
    const cafeBookings = context?.bookings.filter((b) => b.cafeId === operator.cafeId) || [];
    const todayBookings = cafeBookings.filter((b) => {
      const bookingDate = new Date(b.date);
      const today = new Date();
      return bookingDate.toDateString() === today.toDateString();
    });

    const activeBookings = cafeBookings.filter((b) => b.status === 'active').length;

    const cafeMembers = context?.registeredUsers.filter((u) =>
      u.cafeWallets?.some((w) => w.cafeId === operator.cafeId)
    ) || [];

    // PC Statistics
    const totalPCs = cafe?.totalPCs || 50;
    const occupiedPCs = activeBookings;
    const availablePCs = totalPCs - occupiedPCs;
    const utilizationRate = ((occupiedPCs / totalPCs) * 100).toFixed(1);

    // Pending actions
    const pendingPayments = cafeBookings.filter((b) => b.paymentStatus === 'pending' && b.status !== 'cancelled').length;
    const unreadMessages = Object.values(context?.chatMessages || {}).flat().filter(
      (m: ChatMessage) => m.sender === 'user'
    ).length % 5; // Mock unread count

    // Use API data if available, otherwise use context data
    return {
      todayBookings: statistics?.todayBookings ?? todayBookings.length,
      activeBookings: statistics?.activeBookings ?? activeBookings,
      todayRevenue: statistics?.todayRevenue ?? 0,
      totalMembers: statistics?.totalMembers ?? cafeMembers.length,
      totalPCs,
      occupiedPCs,
      availablePCs,
      utilizationRate,
      pendingPayments,
      unreadMessages,
      pendingTopups: statistics?.pendingTopups ?? 0,
    };
  }, [context?.bookings, context?.registeredUsers, context?.chatMessages, operator.cafeId, cafe?.totalPCs, statistics]);

  const handleLogout = () => {
    context?.setOperator(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_operator');
    toast.success('👋 Anda berhasil keluar dari panel operator.');
    navigate('/operator/login');
  };

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
          <div className="flex items-center justify-between">
            {/* Operator Info */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-2">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-slate-100 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Operator Panel
                </h1>
                <p className="text-slate-400 text-xs">{cafe?.name}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="bg-slate-800/50 border border-slate-700/50 hover:border-red-500/50 rounded-2xl px-4 py-2 transition-all group"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                <span className="text-slate-400 group-hover:text-red-400 text-sm transition-colors">
                  Keluar
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-slate-200 mb-2">
                Selamat datang kembali, {operator.name}! 👋
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Inilah yang terjadi di warnet Anda hari ini
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-slate-400">Sistem Online</span>
                </div>
                <div className="text-slate-500">•</div>
                <div className="text-slate-400">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today's Bookings */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-2">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs">Booking Hari Ini</p>
                <p className="text-slate-100 text-2xl">{stats.todayBookings}</p>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-2">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs">Sesi Aktif</p>
                <p className="text-slate-100 text-2xl">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5 col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl p-2">
                <DollarSign className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs">Pendapatan Hari Ini</p>
                <p className="text-teal-300 text-2xl">
                  {loading ? '...' : `Rp ${stats.todayRevenue.toLocaleString('id-ID')}`}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-2">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs">Total Member</p>
                <p className="text-slate-100 text-2xl">{stats.totalMembers}</p>
              </div>
            </div>
          </div>

          {/* Utilization Rate */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-2xl p-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs">Utilisasi PC</p>
                <p className="text-slate-100 text-2xl">{stats.utilizationRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* PC Status Overview */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            Ringkasan Status PC
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 text-center">
              <p className="text-3xl text-slate-100 mb-1">{stats.totalPCs}</p>
              <p className="text-slate-400 text-sm">Total PC</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
              <p className="text-3xl text-green-400 mb-1">{stats.availablePCs}</p>
              <p className="text-slate-400 text-sm">Tersedia</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
              <p className="text-3xl text-blue-400 mb-1">{stats.occupiedPCs}</p>
              <p className="text-slate-400 text-sm">Terpakai</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {statistics && statistics.transactions.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
            <h3 className="text-slate-200 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-400" />
              Transaksi Terkini
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {statistics.transactions.slice(0, 10).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === 'topup'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {transaction.type === 'topup' ? 'Top Up' : 'Pembayaran'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' || transaction.status === 'paid'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {transaction.status === 'paid' ? 'Lunas' : transaction.status === 'completed' ? 'Selesai' : transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-semibold">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="text-slate-400 text-sm mb-1">{transaction.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{transaction.username}</span>
                    <span>
                      {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-slate-300 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/operator/pc-grid')}
              className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 hover:border-blue-500/50 rounded-3xl p-5 transition-all hover:shadow-lg hover:shadow-blue-500/10 text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-2 group-hover:scale-110 transition-transform">
                  <Monitor className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-200">Manajemen PC</h4>
                  <p className="text-slate-400 text-xs">Login/logout member</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/operator/bookings')}
              className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 hover:border-purple-500/50 rounded-3xl p-5 transition-all hover:shadow-lg hover:shadow-purple-500/10 text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-2 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-200">Booking</h4>
                  <p className="text-slate-400 text-xs">Kelola reservasi</p>
                </div>
              </div>
              {stats.pendingPayments > 0 && (
                <div className="mt-2 bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-1.5 inline-block">
                  <span className="text-red-400 text-xs">
                    {stats.pendingPayments} pembayaran tertunda
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => navigate('/operator/topups')}
              className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 border border-amber-500/30 hover:border-amber-500/50 rounded-3xl p-5 transition-all hover:shadow-lg hover:shadow-amber-500/10 text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-2 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-200">Top Up</h4>
                  <p className="text-slate-400 text-xs">Konfirmasi top up</p>
                </div>
              </div>
              {stats.pendingTopups > 0 && (
                <div className="mt-2 bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-1.5 inline-block">
                  <span className="text-red-400 text-xs">
                    {stats.pendingTopups} pending
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => navigate('/operator/members')}
              className="bg-gradient-to-br from-teal-900/20 to-teal-800/20 border border-teal-500/30 hover:border-teal-500/50 rounded-3xl p-5 transition-all hover:shadow-lg hover:shadow-teal-500/10 text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl p-2 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-200">Member</h4>
                  <p className="text-slate-400 text-xs">Kelola akun member</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <OperatorBottomNav />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-400" />
              Konfirmasi Keluar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Apakah Anda yakin ingin keluar dari panel operator? Anda perlu login kembali untuk mengakses panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}