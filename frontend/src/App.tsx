import { createContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HomeScreen } from './components/HomeScreen';
import { CafeDetailsScreen } from './components/CafeDetailsScreen';
import { BookingScreen } from './components/BookingScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { ActiveSessionScreen } from './components/ActiveSessionScreen';
import { ChatScreen } from './components/ChatScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PCLoginScreen } from './components/PCLoginScreen';
import { BookingHistoryScreen } from './components/BookingHistoryScreen';
import { PCAvailabilityScreen } from './components/PCAvailabilityScreen';
import { EditProfileScreen } from './components/EditProfileScreen';
import { MapScreen } from './components/MapScreen';
import { Toaster } from './components/ui/sonner';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'regular' | 'member';
  cafeWallets?: CafeWallet[];
  credits: number;
  avatar?: string;
}

export interface CafeWallet {
  cafeId: string;
  cafeName: string;
  remainingMinutes: number;
  isActive: boolean; // true when logged in at cafe
  lastUpdated: number;
}

export interface Cafe {
  id: string;
  name: string;
  location: string;
  image: string;
  regularPricePerHour: number;
  memberPricePerHour: number;
  totalPCs: number;
}

export interface PCStatus {
  id: string;
  number: number;
  status: 'available' | 'occupied';
  remainingMinutes?: number;
  sessionStartTime?: number;
}

export interface Booking {
  id: string;
  userId: string;
  cafeId: string;
  cafeName: string;
  pcNumber: number;
  date: string;
  time: string;
  duration: number;
  status: 'active' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending';
  bookedAt: number;
  canCancelUntil?: number;
  remainingMinutes?: number;
  isSessionActive?: boolean;
  sessionStartTime?: number; // Timestamp when session actually started
  isMemberBooking?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'operator';
  message: string;
  timestamp: number;
}

interface AppContextType {
  users: User[];
  user: User | null;
  setUser: (user: User | null) => void;
  cafes: Cafe[];
  bookings: Booking[];
  getUserBookings: () => Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  updateWallet: (cafeId: string, minutes: number, isActive: boolean) => void;
  extendWallet: (cafeId: string, minutes: number) => void;
  chatMessages: { [cafeId: string]: ChatMessage[] };
  addChatMessage: (cafeId: string, message: ChatMessage) => void;
  pcStatuses: { [cafeId: string]: PCStatus[] };
  getPCsForCafe: (cafeId: string) => PCStatus[];
  registerUser: (user: User) => void;
  findUserByCredentials: (
    username: string,
    password: string,
    role: 'regular' | 'member'
  ) => User | null;
}

export const AppContext = createContext<AppContextType | null>(null);

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [cafeId: string]: ChatMessage[] }>({});
  const [pcStatuses, setPcStatuses] = useState<{ [cafeId: string]: PCStatus[] }>({});

  // Mock cafes data
  const cafes: Cafe[] = [
    {
      id: 'cafe1',
      name: 'CyberArena Gaming',
      location: 'Jl. Sudirman No. 45, Jakarta Pusat',
      image: 'https://images.unsplash.com/photo-1708065342541-c54362d52a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjYWZlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY0MzA5MjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 8000,
      memberPricePerHour: 6000,
      totalPCs: 30,
    },
    {
      id: 'cafe2',
      name: 'GameZone Elite',
      location: 'Jl. Gatot Subroto No. 12, Jakarta Selatan',
      image: 'https://images.unsplash.com/photo-1726442116417-de02f3116eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwcm9vbXxlbnwxfHx8fDE3NjQzMzUzMTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 10000,
      memberPricePerHour: 7500,
      totalPCs: 25,
    },
    {
      id: 'cafe3',
      name: 'Netplay Station',
      location: 'Jl. Thamrin No. 88, Jakarta Pusat',
      image: 'https://images.unsplash.com/photo-1758410473607-e78a23fd6e57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcmNhZmUlMjBjb21wdXRlcnN8ZW58MXx8fHwxNzY0MzM1MzE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 7000,
      memberPricePerHour: 5500,
      totalPCs: 20,
    },
    {
      id: 'cafe4',
      name: 'Warnet Premium',
      location: 'Jl. MH Thamrin No. 22, Jakarta Pusat',
      image: 'https://images.unsplash.com/photo-1516691660293-39fdef9f145b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5ldCUyMGNhZmUlMjBuZW9ufGVufDF8fHx8MTc2NDMzNTMxNnww&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 9000,
      memberPricePerHour: 7000,
      totalPCs: 35,
    },
    {
      id: 'cafe5',
      name: 'Esports Hub',
      location: 'Jl. Rasuna Said No. 5, Jakarta Selatan',
      image: 'https://images.unsplash.com/photo-1704871132546-d1d3b845ae65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBzZXR1cCUyMHJnYnxlbnwxfHx8fDE3NjQyMzE2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 12000,
      memberPricePerHour: 9000,
      totalPCs: 40,
    },
  ];

  // Realtime wallet countdown
  useEffect(() => {
    if (!user?.cafeWallets) return;

    const interval = setInterval(() => {
      setUser((prev) => {
        if (!prev?.cafeWallets) return prev;

        const now = Date.now();
        const updatedWallets = prev.cafeWallets.map((wallet) => {
          if (wallet.isActive && wallet.remainingMinutes > 0) {
            const elapsedMinutes = (now - wallet.lastUpdated) / 60000; // milliseconds to minutes
            
            if (elapsedMinutes >= 0.0167) { // ~1 second in minutes
              return {
                ...wallet,
                remainingMinutes: Math.max(0, wallet.remainingMinutes - elapsedMinutes),
                lastUpdated: now,
              };
            }
          }
          return wallet;
        });

        return { ...prev, cafeWallets: updatedWallets };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Realtime booking countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setBookings((prev) =>
        prev.map((booking) => {
          if (booking.isSessionActive && booking.sessionStartTime && booking.duration) {
            const now = Date.now();
            const elapsedMinutes = (now - booking.sessionStartTime) / 60000; // milliseconds to minutes
            const remainingMinutes = Math.max(0, (booking.duration * 60) - elapsedMinutes);
            
            return {
              ...booking,
              remainingMinutes,
            };
          }
          return booking;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getUserBookings = () => {
    if (!user) return [];
    return bookings.filter((b) => b.userId === user.id);
  };

  const registerUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const findUserByCredentials = (
    username: string,
    password: string,
    role: 'regular' | 'member'
  ): User | null => {
    const foundUser =
      users.find(
        (u) =>
          u.username === username &&
          u.password === password &&
          u.role === role
      ) || null;

    return foundUser;
  };

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [...prev, booking]);
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      )
    );
  };

  const updateBooking = (bookingId: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b))
    );
  };

  const updateWallet = (cafeId: string, minutes: number, isActive: boolean) => {
    setUser((prev) => {
      if (!prev?.cafeWallets) return prev;

      const updatedWallets = prev.cafeWallets.map((wallet) =>
        wallet.cafeId === cafeId
          ? { ...wallet, remainingMinutes: minutes, isActive, lastUpdated: Date.now() }
          : wallet
      );

      return { ...prev, cafeWallets: updatedWallets };
    });
  };

  const extendWallet = (cafeId: string, minutes: number) => {
    setUser((prev) => {
      if (!prev?.cafeWallets) return prev;

      const updatedWallets = prev.cafeWallets.map((wallet) =>
        wallet.cafeId === cafeId
          ? { ...wallet, remainingMinutes: wallet.remainingMinutes + minutes, lastUpdated: Date.now() }
          : wallet
      );

      return { ...prev, cafeWallets: updatedWallets };
    });
  };

  const addChatMessage = (cafeId: string, message: ChatMessage) => {
    setChatMessages((prev) => ({
      ...prev,
      [cafeId]: [...(prev[cafeId] || []), message],
    }));
  };

  // Initialize PCs for a cafe if not already initialized
  const getPCsForCafe = (cafeId: string): PCStatus[] => {
    if (pcStatuses[cafeId]) {
      return pcStatuses[cafeId];
    }

    const cafe = cafes.find((c) => c.id === cafeId);
    if (!cafe) return [];

    // Initialize PCs for this cafe
    const newPCs: PCStatus[] = [];
    for (let i = 1; i <= cafe.totalPCs; i++) {
      // 70% available, 30% occupied for initial state
      const isOccupied = Math.random() < 0.3;
      
      newPCs.push({
        id: `${cafeId}-pc-${i}`,
        number: i,
        status: isOccupied ? 'occupied' : 'available',
        remainingMinutes: isOccupied ? Math.floor(Math.random() * 120) + 10 : undefined,
        sessionStartTime: isOccupied ? Date.now() - Math.random() * 3600000 : undefined,
      });
    }

    // Store the initialized PCs
    setPcStatuses((prev) => ({
      ...prev,
      [cafeId]: newPCs,
    }));

    return newPCs;
  };

  // Real-time countdown for occupied PCs
  useEffect(() => {
    const interval = setInterval(() => {
      setPcStatuses((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((cafeId) => {
          updated[cafeId] = updated[cafeId].map((pc) => {
            if (pc.status === 'occupied' && pc.sessionStartTime && pc.remainingMinutes !== undefined) {
              const elapsed = (Date.now() - pc.sessionStartTime) / 60000; // minutes
              const remaining = Math.max(0, pc.remainingMinutes - elapsed / 60);
              
              hasChanges = true;
              return {
                ...pc,
                remainingMinutes: remaining,
              };
            }
            return pc;
          });
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const contextValue: AppContextType = {
    users,
    user,
    setUser,
    getUserBookings,
    pcStatuses,
    getPCsForCafe,
    cafes,
    bookings,
    addBooking,
    cancelBooking,
    updateBooking,
    updateWallet,
    extendWallet,
    chatMessages,
    addChatMessage,
    registerUser,
    findUserByCredentials,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/home" /> : <Navigate to="/login" />}
            />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route
              path="/home"
              element={user ? <HomeScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/cafe/:cafeId"
              element={user ? <CafeDetailsScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/cafe/:cafeId/pcs"
              element={user ? <PCAvailabilityScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/booking/:cafeId/:pcNumber"
              element={user ? <BookingScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/payment/:bookingId"
              element={user ? <PaymentScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/session/:bookingId"
              element={user ? <ActiveSessionScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/chat"
              element={user ? <ChatScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/chat/:cafeId"
              element={user ? <ChatScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/booking-history"
              element={user ? <BookingHistoryScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={user ? <ProfileScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/edit-profile"
              element={user ? <EditProfileScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/pc-login/:cafeId"
              element={user ? <PCLoginScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/bookings"
              element={user ? <BookingHistoryScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/map"
              element={user ? <MapScreen /> : <Navigate to="/login" />}
            />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
