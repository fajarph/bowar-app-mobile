import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, type User, type CafeWallet } from '../App';
import { User as UserIcon, Mail, Crown, Edit, LogOut, Clock, MapPin } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { toast } from 'sonner';
import { logout, clearAuth } from '../services/api';

export function ProfileScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);

  const handleLogout = async () => {
    try {
      // Call logout API
      await logout();
      // Clear auth data from localStorage
      clearAuth();
      // Clear user from context
      context?.setUser(null);
      toast.success('👋 Anda berhasil keluar dari Bowar.');
      navigate('/login');
    } catch (error: any) {
      // Even if API fails, clear local data
      clearAuth();
    context?.setUser(null);
    toast.success('👋 Anda berhasil keluar dari Bowar.');
    navigate('/login');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Get all memberships for this email (from all accounts with same email)
  const getAllMemberships = () => {
    if (!context?.user?.email) return [];
    
    const allWallets: Array<{
      userId: string;
      cafeId: string;
      cafeName: string;
      remainingMinutes: number;
      isActive: boolean;
      isCurrentAccount: boolean;
    }> = [];
    
    // Find all users with the same email
    context.users
      .filter((u: User) => u.email === context.user?.email && u.role === 'member')
      .forEach((user: User) => {
        if (user.cafeWallets) {
          user.cafeWallets.forEach((wallet: CafeWallet) => {
            // Check if this wallet is from current logged-in account
            const isCurrentAccount = user.id === context.user?.id;
            allWallets.push({
              userId: user.id, // Add userId for unique key
              ...wallet,
              isCurrentAccount,
            });
          });
        }
      });
    
    return allWallets;
  };

  const allMemberships = getAllMemberships();

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5">
          <h1 className="text-slate-200">Profil</h1>
          <p className="text-slate-400 text-sm">Kelola akun Anda</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {/* Glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full blur-xl opacity-40" />
              
              {/* Avatar container */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 flex items-center justify-center overflow-hidden">
                {context?.user?.avatar ? (
                  <img
                    src={context.user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-cyan-400" />
                )}
              </div>
            </div>

            {/* User Info */}
            <h2 className="text-slate-100 text-2xl mb-1">{context?.user?.username}</h2>
            <p className="text-slate-400 text-sm mb-3">{context?.user?.email}</p>

            {/* Role Badge */}
            {context?.user?.role === 'member' ? (
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                <Crown className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm">Member Premium</span>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2">
                <span className="text-slate-400 text-sm">Pengguna Reguler</span>
              </div>
            )}
          </div>

          {/* Member Wallets (if member) - Show ALL memberships across all accounts with same email */}
          {allMemberships.length > 0 && (
            <div className="border-t border-slate-800/50 pt-6">
              <div className="mb-4">
                <h3 className="text-slate-300 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Membership Anda
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Semua membership terdaftar dengan {context?.user?.email}
                </p>
              </div>
              <div className="space-y-3">
                {allMemberships.map((wallet) => (
                  <div
                    key={`${wallet.userId}-${wallet.cafeId}`}
                    className={`bg-slate-900/50 border rounded-2xl p-4 ${
                      wallet.isCurrentAccount
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-200 text-sm">{wallet.cafeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {wallet.isCurrentAccount && (
                          <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-1">
                            <span className="text-blue-400 text-xs">Aktif</span>
                          </div>
                        )}
                        {wallet.isActive && (
                          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-400 text-xs">Sedang Digunakan</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Waktu Tersimpan</span>
                      <span className={`tabular-nums ${wallet.isCurrentAccount ? 'text-blue-400' : 'text-cyan-400'}`}>
                        {formatTime(wallet.remainingMinutes)}
                      </span>
                    </div>
                    {!wallet.isCurrentAccount && (
                      <p className="text-slate-500 text-xs mt-2 italic">
                        Login dengan akun member untuk menggunakan membership ini
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account Details */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Detail Akun</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs">Username</p>
                <p className="text-slate-200 text-sm">{context?.user?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs">Email</p>
                <p className="text-slate-200 text-sm">{context?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
                <Crown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs">Tipe Akun</p>
                <p className="text-slate-200 text-sm capitalize">{context?.user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Multiple Membership Info */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-3xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-2">
              <Crown className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-200 mb-1">Ingin Manfaat Member di Cafe Lain?</h3>
              <p className="text-slate-400 text-sm">
                Anda bisa daftar membership di beberapa cafe menggunakan email yang sama dengan username berbeda.
              </p>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-2xl p-4 space-y-2">
            <p className="text-slate-300 text-sm">✓ Gunakan email yang sama: <span className="text-blue-400">{context?.user?.email}</span></p>
            <p className="text-slate-300 text-sm">✓ Pilih username yang berbeda</p>
            <p className="text-slate-300 text-sm">✓ Pilih cafe yang ingin Anda ikuti</p>
            <p className="text-slate-300 text-sm">✓ Dapatkan harga member dan benefit di cafe tersebut</p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="w-full mt-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/50 hover:border-blue-500/70 text-blue-300 py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Daftar Membership Baru
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/edit-profile')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Edit Profil
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-900/50 backdrop-blur-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>

        {/* App Info */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 text-center">
          <p className="text-slate-500 text-xs mb-1">Bowar - Booking Warnet</p>
          <p className="text-slate-600 text-xs">Version 1.0.0</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}