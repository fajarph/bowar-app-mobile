import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext, type PCStatus } from '../App';
import { ArrowLeft, Monitor, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function PCAvailabilityScreen() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [pcs, setPcs] = useState<PCStatus[]>([]);

  const cafe = context?.cafes.find((c) => c.id === cafeId);

  // Get PCs from context in useEffect to avoid setState during render
  useEffect(() => {
    if (cafeId && context) {
      const pcList = context.getPCsForCafe(cafeId);
      setPcs(pcList);
    }
  }, [cafeId, context]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (!selectedPC) {
      toast.error('Silakan pilih PC');
      return;
    }

    const pc = pcs.find((p) => p.number === selectedPC);
    if (pc?.status === 'occupied') {
      toast.error('PC ini sedang terpakai');
      return;
    }

    navigate(`/booking/${cafeId}/${selectedPC}`);
  };

  if (!cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Warnet tidak ditemukan</p>
      </div>
    );
  }

  const availableCount = pcs.filter((pc) => pc.status === 'available').length;
  const occupiedCount = pcs.filter((pc) => pc.status === 'occupied').length;

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
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
          <div className="flex-1">
            <h1 className="text-slate-200">Pilih PC</h1>
            <p className="text-slate-400 text-sm">{cafe.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-slate-300 text-sm">Tersedia</span>
            </div>
            <p className="text-green-400 text-2xl tabular-nums">{availableCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
              <span className="text-slate-300 text-sm">Terpakai</span>
            </div>
            <p className="text-red-400 text-2xl tabular-nums">{occupiedCount}</p>
          </div>
        </div>

        {/* PC Grid */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Pilih PC Anda</h3>
          <div className="grid grid-cols-3 gap-3">
            {pcs.map((pc) => {
              const isSelected = selectedPC === pc.number;
              const isAvailable = pc.status === 'available';

              return (
                <button
                  key={pc.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedPC(pc.number);
                    } else {
                      toast.error(`PC ${pc.number} sedang terpakai`);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`
                    aspect-square rounded-2xl p-3 transition-all
                    ${
                      isAvailable
                        ? isSelected
                          ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-teal-400 shadow-lg shadow-blue-500/30'
                          : 'bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800'
                        : 'bg-slate-900/50 border border-red-500/30 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <Monitor
                      className={`w-6 h-6 ${
                        isAvailable
                          ? isSelected
                            ? 'text-teal-400'
                            : 'text-slate-400'
                          : 'text-red-400'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isAvailable
                          ? isSelected
                            ? 'text-teal-300'
                            : 'text-slate-300'
                          : 'text-red-300'
                      }`}
                    >
                      PC {pc.number}
                    </span>
                    {!isAvailable && pc.remainingMinutes !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400 tabular-nums">
                          {formatTime(pc.remainingMinutes)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span className="text-slate-300">Tersedia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span className="text-slate-300">Terpakai</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-400 rounded-full" />
              <span className="text-slate-300">Dipilih</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6 z-50">
        <button
          onClick={handleContinue}
          disabled={!selectedPC}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
        >
          {selectedPC ? `Lanjut dengan PC ${selectedPC}` : 'Pilih PC untuk Lanjut'}
        </button>
      </div>
    </div>
  );
}