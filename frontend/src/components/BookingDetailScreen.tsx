import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, Clock, Calendar, CreditCard, Monitor, MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNav } from './BottomNav';

export function BookingDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const context = useContext(AppContext);
  
  const [remainingTime, setRemainingTime] = useState(0);
  const [cancelTimeLeft, setCancelTimeLeft] = useState(120); // 2 minutes in seconds
  const [canCancel, setCanCancel] = useState(true);

  // Get booking - either by ID or get active booking
  const booking = id === 'active' 
    ? context?.activeBooking 
    : context?.bookings.find(b => b.id === id);

  useEffect(() => {
    if (!booking) return;

    // Initialize remaining time
    if (booking.remainingTime) {
      setRemainingTime(booking.remainingTime);
    }

    // Calculate cancel time left
    const timeSinceCreation = Math.floor((Date.now() - booking.createdAt.getTime()) / 1000);
    const timeLeft = Math.max(0, 120 - timeSinceCreation);
    setCancelTimeLeft(timeLeft);
    setCanCancel(timeLeft > 0 && booking.status === 'pending');

    // Timer for remaining session time (only updates if logged in)
    const sessionInterval = setInterval(() => {
      if (booking.loggedIn && booking.remainingTime && booking.remainingTime > 0) {
        setRemainingTime(prev => {
          const newTime = Math.max(0, prev - 1);
          context?.updateBooking(booking.id, { remainingTime: newTime });
          return newTime;
        });
      }
    }, 1000);

    // Timer for cancel window
    const cancelInterval = setInterval(() => {
      const timeSinceCreation = Math.floor((Date.now() - booking.createdAt.getTime()) / 1000);
      const timeLeft = Math.max(0, 120 - timeSinceCreation);
      setCancelTimeLeft(timeLeft);
      setCanCancel(timeLeft > 0 && booking.status === 'pending');
    }, 1000);

    return () => {
      clearInterval(sessionInterval);
      clearInterval(cancelInterval);
    };
  }, [booking, context]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCancelTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelBooking = () => {
    if (!booking || !canCancel) return;
    
    context?.cancelBooking(booking.id);
    toast.success('❌ Booking canceled successfully.');
    setTimeout(() => {
      navigate('/home');
    }, 1000);
  };

  const handleLogin = () => {
    if (!booking) return;
    
    context?.updateBooking(booking.id, { 
      loggedIn: true, 
      status: 'active'
    });
    toast.success('🕒 Billing time will begin now — enjoy your gaming!');
  };

  const handleExtendSession = () => {
    if (!booking) return;
    
    // Mock extension - add 1 hour
    const newTime = remainingTime + 3600;
    setRemainingTime(newTime);
    context?.updateBooking(booking.id, { remainingTime: newTime });
    toast.success('⏱️ Session extended by 1 hour!');
  };

  if (!booking) {
    return (
      <div className="min-h-screen pb-24">
        <div className="bg-slate-900/30 backdrop-blur-lg border-b border-slate-800/50">
          <div className="px-6 py-5">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-slate-200">My Booking</h1>
          </div>
        </div>
        
        <div className="px-6 py-12 text-center">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-6">No active bookings</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-2xl px-8 py-3 transition-all"
            >
              Browse Warnets
            </button>
          </div>
        </div>
        
        <BottomNav active="booking" />
      </div>
    );
  }

  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    active: 'text-green-400 bg-green-400/10 border-green-400/30',
    completed: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/30'
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-900/30 backdrop-blur-lg border-b border-slate-800/50">
        <div className="px-6 py-5">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-200 mb-1">Booking Detail</h1>
              <p className="text-slate-400">#{booking.id.slice(-8)}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border ${statusColors[booking.status]}`}>
              {booking.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Remaining Time - Big Display */}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 text-center">
            <Clock className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Remaining Time</p>
            <p className="text-cyan-400 text-5xl mb-2">{formatTime(remainingTime)}</p>
            {!booking.loggedIn && (
              <p className="text-slate-400 text-sm">Timer will start after login at café</p>
            )}
          </div>
        )}

        {/* Cancel Countdown */}
        {canCancel && booking.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <p className="text-yellow-400 text-center mb-2">
              Cancel available for: {formatCancelTime(cancelTimeLeft)}
            </p>
            <p className="text-slate-400 text-sm text-center">
              You can cancel within 2 minutes after payment
            </p>
          </div>
        )}

        {/* Booking Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Booking Information</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-1">Warnet</p>
                <p className="text-slate-200">{booking.warnetName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Monitor className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-1">PC Number</p>
                <p className="text-slate-200">PC {booking.pcNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-1">Order Date</p>
                <p className="text-slate-200">{booking.orderDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-1">Order Time</p>
                <p className="text-slate-200">{booking.orderTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-1">Duration</p>
                <p className="text-slate-200">{booking.duration} hours</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-1">Payment Method</p>
                <p className="text-slate-200">{booking.paymentMethod}</p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-slate-400">Total Price</p>
                <p className="text-cyan-400 text-xl">Rp {booking.totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {booking.status === 'pending' && !booking.loggedIn && (
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-2xl py-4 transition-all shadow-lg shadow-green-500/25"
            >
              LOGIN AT CAFÉ (Start Timer)
            </button>
          )}

          {booking.status === 'active' && booking.loggedIn && (
            <button
              onClick={handleExtendSession}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5" />
              EXTEND SESSION (+1 Hour)
            </button>
          )}

          {canCancel && booking.status === 'pending' && (
            <button
              onClick={handleCancelBooking}
              className="w-full bg-slate-900/50 backdrop-blur-xl border border-red-500/50 hover:bg-red-500/10 text-red-400 rounded-2xl py-4 transition-all"
            >
              CANCEL BOOKING
            </button>
          )}
        </div>
      </div>

      <BottomNav active="booking" />
    </div>
  );
}
