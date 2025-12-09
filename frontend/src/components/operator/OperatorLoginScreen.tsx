import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../App';
import { Shield, Eye, EyeOff, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function OperatorLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState('');
  const navigate = useNavigate();
  const context = useContext(AppContext);

  const handleLogin = () => {
    if (!username || !password) {
      toast.error('Silakan isi semua field');
      return;
    }

    if (!selectedCafe) {
      toast.error('Silakan pilih warnet Anda');
      return;
    }

    // Find operator account
    const operator = context?.operators?.find(
      (op) => op.username === username && op.password === password && op.cafeId === selectedCafe
    );

    if (operator) {
      context?.setOperator(operator);
      toast.success(`Selamat datang, ${operator.name}! Mengelola ${operator.cafeName}`);
      navigate('/operator/dashboard');
    } else {
      toast.error('Kredensial atau penugasan cafe tidak valid');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Container with Glow */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />

            {/* Logo */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-xl">
              <Shield className="w-16 h-16 text-purple-400" />
            </div>
          </div>

          {/* App Name & Tagline */}
          <h1 className="text-slate-100 text-4xl mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
            Bowar Operator
          </h1>
          <p className="text-purple-400 text-sm tracking-wider mb-1">
            Sistem Manajemen Warnet
          </p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Masuk untuk mengelola warnet Anda
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl shadow-purple-500/5">
          <div className="space-y-5">
            {/* Operator Badge */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300">Akses Operator</span>
              </div>
              <p className="text-slate-400 text-xs">
                Hanya untuk staf cafe yang berwenang
              </p>
            </div>

            {/* Cafe Selection */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Warnet
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  value={selectedCafe}
                  onChange={(e) => setSelectedCafe(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="">Pilih warnet Anda</option>
                  {context?.cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Username Operator
              </label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-4 rounded-2xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              MASUK SEBAGAI OPERATOR
            </button>

            {/* Back to Customer Login */}
            <div className="text-center pt-4 border-t border-slate-800/50">
              <p className="text-slate-400 text-sm mb-3">
                Bukan operator?
              </p>
              <button
                onClick={() => navigate('/login')}
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                Ke Login Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}