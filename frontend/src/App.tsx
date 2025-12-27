import { useState, useEffect, useRef } from 'react';
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
import { RulesScreen } from './components/RulesScreen';
import { DompetBowarScreen } from './components/DompetBowarScreen';
import { Toaster } from './components/ui/sonner';
import { NeonLogin } from './components/NeonLogin';
// Operator imports
import { OperatorLoginScreen } from './components/operator/OperatorLoginScreen';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { OperatorPCGrid } from './components/operator/OperatorPCGrid';
import { OperatorBookings } from './components/operator/OperatorBookings';
import { OperatorMembers } from './components/operator/OperatorMembers';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'regular' | 'member';
  cafeWallets?: CafeWallet[];
  avatar?: string;
  bowarWallet?: number; // Saldo DompetBowar dalam Rupiah
}

export interface RegisteredUser extends User {
  password: string; // Store password for authentication
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
  rules?: string[]; // Peraturan khusus untuk setiap warnet
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
  userId: string; // Add userId to track which user made the booking
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
  isMemberBooking?: boolean; // Track if user was member at this cafe when booking
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'operator';
  message: string;
  timestamp: number;
}

export interface Operator {
  id: string;
  username: string;
  password: string;
  name: string;
  cafeId: string;
  cafeName: string;
  role: 'operator';
}

import { AppContext, type AppContextType } from './contexts/AppContext';

// Re-export for backward compatibility
export { AppContext };

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  
  // Load bookings from localStorage
  const getInitialBookings = (): Booking[] => {
    const stored = localStorage.getItem('bowar_bookings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored bookings:', e);
      }
    }
    return [];
  };
  
  const [bookings, setBookings] = useState<Booking[]>(getInitialBookings());
  const [chatMessages, setChatMessages] = useState<{ [cafeId: string]: ChatMessage[] }>({});
  const [pcStatuses, setPcStatuses] = useState<{ [cafeId: string]: PCStatus[] }>({});
  
  // Load registered users from localStorage or use defaults
  // Use lazy initializer to avoid calling Date.now() during render
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const stored = localStorage.getItem('bowar_registered_users');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored users:', e);
      }
    }
    
    // Default mock users for testing
    // Use a fixed timestamp for initial mock data (avoiding Date.now() during render)
    const initialTimestamp = 0;
    return [
      {
        id: '1',
        username: 'regular',
        email: 'regular@bowar.com',
        password: 'regular',
        role: 'regular',
        bowarWallet: 0, // DompetBowar balance
      },
      {
        id: '2',
        username: 'member',
        email: 'member@bowar.com',
        password: 'member',
        role: 'member',
        bowarWallet: 250000, // DompetBowar balance with initial amount
        cafeWallets: [
          {
            cafeId: 'cafe1',
            cafeName: 'CyberArena Gaming',
            remainingMinutes: 300,
            isActive: false,
            lastUpdated: initialTimestamp,
          },
          {
            cafeId: 'cafe2',
            cafeName: 'GameZone Elite',
            remainingMinutes: 180,
            isActive: false,
            lastUpdated: initialTimestamp,
          },
          {
            cafeId: 'cafe3',
            cafeName: 'Netplay Station',
            remainingMinutes: 240,
            isActive: false,
            lastUpdated: initialTimestamp,
          },
        ],
      },
    ];
  });

  // Mock operators data
  const operators: Operator[] = [
    {
      id: 'op1',
      username: 'operator1',
      password: 'op123',
      name: 'Ahmad Operator',
      cafeId: 'cafe1',
      cafeName: 'CyberArena Gaming',
      role: 'operator',
    },
    {
      id: 'op2',
      username: 'operator2',
      password: 'op123',
      name: 'Budi Manager',
      cafeId: 'cafe2',
      cafeName: 'GameZone Elite',
      role: 'operator',
    },
    {
      id: 'op3',
      username: 'operator3',
      password: 'op123',
      name: 'Citra Admin',
      cafeId: 'cafe3',
      cafeName: 'Netplay Station',
      role: 'operator',
    },
    {
      id: 'op4',
      username: 'operator4',
      password: 'op123',
      name: 'Doni Staff',
      cafeId: 'cafe4',
      cafeName: 'Warnet Premium',
      role: 'operator',
    },
    {
      id: 'op5',
      username: 'operator5',
      password: 'op123',
      name: 'Eka Supervisor',
      cafeId: 'cafe5',
      cafeName: 'Esports Hub',
      role: 'operator',
    },
  ];

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
      rules: [
        'Dilarang merokok di dalam ruangan gaming',
        'Wajib menjaga kebersihan area PC',
        'Makanan dan minuman hanya dari kantin warnet',
        'Dilarang mengakses konten ilegal atau pornografi',
        'Headset wajib digunakan untuk game dengan audio'
      ],
    },
    {
      id: 'cafe2',
      name: 'GameZone Elite',
      location: 'Jl. Gatot Subroto No. 12, Jakarta Selatan',
      image: 'https://images.unsplash.com/photo-1726442116417-de02f3116eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwcm9vbXxlbnwxfHx8fDE3NjQzMzUzMTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 10000,
      memberPricePerHour: 7500,
      totalPCs: 25,
      rules: [
        'Area bebas asap rokok 100%',
        'Deposit Rp 50.000 untuk penggunaan perangkat VR',
        'Maksimal 4 orang per booth untuk party gaming',
        'Wajib scan member card sebelum menggunakan PC',
        'Perangkat gaming tidak boleh dipindahkan tanpa izin staff'
      ],
    },
    {
      id: 'cafe3',
      name: 'Netplay Station',
      location: 'Jl. Thamrin No. 88, Jakarta Pusat',
      image: 'https://images.unsplash.com/photo-1758410473607-e78a23fd6e57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcmNhZmUlMjBjb21wdXRlcnN8ZW58MXx8fHwxNzY0MzM1MzE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 7000,
      memberPricePerHour: 5500,
      totalPCs: 20,
      rules: [
        'Minimal booking 1 jam untuk weekend',
        'Dilarang tidur atau berbaring di kursi gaming',
        'Volume speaker maksimal 50% setelah jam 22:00',
        'Free 1 soft drink untuk setiap 3 jam bermain',
        'Parkir sepeda gratis, motor Rp 2.000'
      ],
    },
    {
      id: 'cafe4',
      name: 'Warnet Premium',
      location: 'Jl. MH Thamrin No. 22, Jakarta Pusat',
      image: 'https://images.unsplash.com/photo-1516691660293-39fdef9f145b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5ldCUyMGNhZmUlMjBuZW9ufGVufDF8fHx8MTc2NDMzNTMxNnww&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 9000,
      memberPricePerHour: 7000,
      totalPCs: 35,
      rules: [
        'Kartu identitas wajib dititipkan untuk non-member',
        'Dilarang install/uninstall software tanpa izin',
        'Area VIP khusus member premium (lantai 2)',
        'Overtime dikenakan biaya 150% dari harga normal',
        'Gratis printing hingga 10 lembar untuk member'
      ],
    },
    {
      id: 'cafe5',
      name: 'Esports Hub',
      location: 'Jl. Rasuna Said No. 5, Jakarta Selatan',
      image: 'https://images.unsplash.com/photo-1704871132546-d1d3b845ae65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBzZXR1cCUyMHJnYnxlbnwxfHx8fDE3NjQyMzE2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      regularPricePerHour: 12000,
      memberPricePerHour: 9000,
      totalPCs: 40,
      rules: [
        'Tournament room dapat di-booking untuk acara (min. 10 orang)',
        'Livestreaming diperbolehkan dengan pemberitahuan ke staff',
        'Coaching session dikenakan biaya tambahan Rp 25.000/jam',
        'Anak dibawah 12 tahun wajib didampingi orang tua',
        'Member berhak menggunakan locker pribadi gratis'
      ],
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

  // Save registered users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bowar_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Sync logged-in user data with registeredUsers (keep data in sync)
  // Use ref to track previous registeredUsers to avoid cascading renders
  const prevRegisteredUsersRef = useRef<RegisteredUser[]>(registeredUsers);
  const userIdRef = useRef<string | null>(user?.id || null);
  
  useEffect(() => {
    // Update ref when user changes
    userIdRef.current = user?.id || null;
  }, [user?.id]);
  
  useEffect(() => {
    // Only sync if registeredUsers actually changed (not just a re-render)
    if (JSON.stringify(prevRegisteredUsersRef.current) === JSON.stringify(registeredUsers)) {
      return;
    }
    
    prevRegisteredUsersRef.current = registeredUsers;
    
    // Only sync if we have a logged-in user
    const currentUserId = userIdRef.current;
    if (currentUserId) {
      const updatedUserData = registeredUsers.find((u) => u.id === currentUserId);
      if (updatedUserData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = updatedUserData;
        // Use functional update to avoid dependency on user state
        setUser((currentUser) => {
          if (!currentUser || currentUser.id !== currentUserId) {
            return currentUser;
          }
          // Only update if cafeWallets changed
          const userWalletsStr = JSON.stringify(currentUser.cafeWallets);
          const updatedWalletsStr = JSON.stringify(updatedUserData.cafeWallets);
          if (userWalletsStr !== updatedWalletsStr) {
            return userWithoutPassword;
          }
          return currentUser;
        });
      }
    }
  }, [registeredUsers]);

  // Save bookings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bowar_bookings', JSON.stringify(bookings));
  }, [bookings]);

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

  const updateBookingStatus = (bookingId: string, status: 'active' | 'completed' | 'cancelled') => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
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

      const updatedUser = { ...prev, cafeWallets: updatedWallets };

      // Sync to registeredUsers for persistence
      setRegisteredUsers((users) =>
        users.map((u) => (u.id === prev.id ? { ...u, cafeWallets: updatedWallets } : u))
      );

      return updatedUser;
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

      const updatedUser = { ...prev, cafeWallets: updatedWallets };

      // Sync to registeredUsers for persistence
      setRegisteredUsers((users) =>
        users.map((u) => (u.id === prev.id ? { ...u, cafeWallets: updatedWallets } : u))
      );

      return updatedUser;
    });
  };

  const updateMemberWallet = (userId: string, cafeId: string, updates: Partial<CafeWallet>) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && u.cafeWallets) {
          const updatedWallets = u.cafeWallets.map((wallet) =>
            wallet.cafeId === cafeId ? { ...wallet, ...updates } : wallet
          );
          return { ...u, cafeWallets: updatedWallets };
        }
        return u;
      })
    );
  };

  const addChatMessage = (cafeId: string, message: ChatMessage) => {
    setChatMessages((prev) => ({
      ...prev,
      [cafeId]: [...(prev[cafeId] || []), message],
    }));
  };

  // Register a new user
  const registerUser = (user: RegisteredUser) => {
    setRegisteredUsers((prev) => [...prev, user]);
  };

  // Find user by credentials for login
  const findUserByCredentials = (
    username: string,
    password: string,
    role: 'regular' | 'member'
  ): User | null => {
    const registered = registeredUsers.find(
      (u) => u.username === username && u.password === password && u.role === role
    );
    
    if (registered) {
      // Return user without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } = registered;
      return userWithoutPassword;
    }
    
    return null;
  };

  // Get bookings for current logged-in user only
  const getUserBookings = (): Booking[] => {
    if (!user) return [];
    return bookings.filter((booking) => booking.userId === user.id);
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
    user,
    setUser,
    operator,
    setOperator,
    pcStatuses,
    getPCsForCafe,
    cafes,
    bookings,
    getUserBookings,
    addBooking,
    cancelBooking,
    updateBooking,
    updateBookingStatus,
    updateWallet,
    extendWallet,
    updateMemberWallet,
    chatMessages,
    addChatMessage,
    registeredUsers,
    registerUser,
    findUserByCredentials,
    operators,
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
            <Route path="/neon-login" element={<NeonLogin />} />
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
              path="/cafe/:cafeId/rules"
              element={user ? <RulesScreen /> : <Navigate to="/login" />}
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
            <Route
              path="/dompet-bowar"
              element={user ? <DompetBowarScreen /> : <Navigate to="/login" />}
            />
            {/* Operator routes */}
            <Route
              path="/operator/login"
              element={operator ? <Navigate to="/operator/dashboard" /> : <OperatorLoginScreen />}
            />
            <Route
              path="/operator/dashboard"
              element={operator ? <OperatorDashboard /> : <Navigate to="/operator/login" />}
            />
            <Route
              path="/operator/pc-grid"
              element={operator ? <OperatorPCGrid /> : <Navigate to="/operator/login" />}
            />
            <Route
              path="/operator/bookings"
              element={operator ? <OperatorBookings /> : <Navigate to="/operator/login" />}
            />
            <Route
              path="/operator/members"
              element={operator ? <OperatorMembers /> : <Navigate to="/operator/login" />}
            />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;