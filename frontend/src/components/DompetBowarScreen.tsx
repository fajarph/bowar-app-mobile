import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, Wallet, Plus, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { getBowarTransactions, topupBowar } from '../services/api';

export function DompetBowarScreen() {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const balance = context?.user?.bowarWallet || 0;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load transactions from API
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const response = await getBowarTransactions(1, 20);
        if (response.data) {
          setTransactions(response.data);
        }
      } catch (error: any) {
        console.error('Load transactions error:', error);
        // Keep empty array on error
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    
    if (isNaN(amount) || amount < 10000) {
      toast.error('Minimal top up Rp 10.000');
      return;
    }

    if (amount > 10000000) {
      toast.error('Maksimal top up Rp 10.000.000');
      return;
    }

    try {
      // TODO: Implement image upload for proof
      // For now, we'll use a placeholder
      const response = await topupBowar({
        amount,
        description: `Top Up DompetBowar sebesar Rp ${amount.toLocaleString()}`,
        proofImage: '', // TODO: Implement image upload
        senderName: context?.user?.username || 'User',
      });

      toast.success('Permintaan top up berhasil dibuat. Menunggu konfirmasi.');
      setShowTopUp(false);
      setTopUpAmount('');
      
      // Reload transactions
      const transactionsResponse = await getBowarTransactions(1, 20);
      if (transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      }
    } catch (error: any) {
      console.error('Topup error:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat permintaan top up');
    }
  };

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-slate-100 text-2xl">DompetBowar</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola saldo dan transaksi Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-slate-400 text-sm">Saldo Tersedia</span>
            </div>
            <h2 className="text-4xl text-slate-100 mb-6 tabular-nums">
              Rp {balance.toLocaleString()}
            </h2>

            <button
              onClick={() => setShowTopUp(true)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Top Up Saldo</span>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-2 flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-300 mb-1">Tentang DompetBowar</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                DompetBowar adalah wallet khusus untuk transaksi di aplikasi Bowar. Saldo akan otomatis dikembalikan jika PC yang Anda booking tidak tersedia.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50">
            <h3 className="text-slate-200">Riwayat Transaksi</h3>
          </div>
          
          <div className="divide-y divide-slate-800/50">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-400 text-sm">Memuat riwayat transaksi...</p>
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-xl ${
                          tx.type === 'topup'
                            ? 'bg-green-500/20 border border-green-500/30'
                            : tx.type === 'refund'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        {tx.type === 'topup' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-400" />
                        ) : tx.type === 'refund' ? (
                          <ArrowDownRight className="w-5 h-5 text-blue-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm mb-1">{tx.description || 'Transaksi'}</p>
                        <p className="text-slate-500 text-xs">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        tx.type === 'payment' ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {tx.type === 'payment' ? '-' : '+'}Rp {Math.abs(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4">
              <h3 className="text-slate-200 text-lg">Top Up DompetBowar</h3>
              <p className="text-slate-400 text-sm mt-1">Pilih atau masukkan nominal</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Quick Amounts */}
              <div>
                <label className="text-slate-300 text-sm mb-3 block">Nominal Cepat</label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount.toString())}
                      className={`py-3 rounded-2xl border transition-all ${
                        topUpAmount === amount.toString()
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/30'
                      }`}
                    >
                      <span className="text-sm">Rp {(amount / 1000).toFixed(0)}k</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Nominal Custom <span className="text-slate-500">(Min. Rp 10.000)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-300 text-sm">
                  💡 Saldo DompetBowar dapat digunakan untuk pembayaran booking dan akan otomatis dikembalikan jika terjadi refund.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTopUp(false);
                    setTopUpAmount('');
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-2xl hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={!topUpAmount || parseInt(topUpAmount) < 10000}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none"
                >
                  Top Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}