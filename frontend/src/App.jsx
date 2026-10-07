import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Login from './components/Login';
import Signup from './components/Signup';
import Expense from './pages/Expense';
import Profile from './pages/Profile'; 

const API_URL = 'http://localhost:4000/api';

// Protected Route wrapper component
const ProtectedRoute = ({ user, token, children }) => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  const hasToken = localToken || sessionToken;

  if (!user || !hasToken || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  
  return null;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Get auth headers helper
  const getAuthHeaders = useCallback(() => {
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    const activeToken = token || localToken || sessionToken;
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  }, [token]);

  // Fetch all transactions (Income & Expense) from backend
  const refreshTransactions = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    try {
      const [incomeRes, expenseRes] = await Promise.all([
        axios.get(`${API_URL}/income`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/expense`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      const incomeList = (incomeRes.data?.data || incomeRes.data || []).map(item => ({
        ...item,
        id: item._id || item.id,
        type: 'income'
      }));

      const expenseList = (expenseRes.data?.data || expenseRes.data || []).map(item => ({
        ...item,
        id: item._id || item.id,
        type: 'expense'
      }));

      // Combine and sort by date descending
      const combined = [...incomeList, ...expenseList].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(combined);
    } catch (err) {
      console.error("Error refreshing transactions from backend:", err);
    }
  }, [getAuthHeaders]);

  // Restore session / persist auth helper
  const persistAuth = useCallback((userObj, tokenStr, remember = false) => {
    try {
      if (remember) {
        if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) localStorage.setItem("token", tokenStr);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        if (userObj) sessionStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) sessionStorage.setItem("token", tokenStr);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      setUser(userObj || null);
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  }, []);

  const clearAuth = useCallback(() => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } catch (err) {
      console.error("clearAuth error:", err);    
    }
    setUser(null);
    setToken(null);
    setTransactions([]);
  }, []);

  // Try to load user with token when mounted
  useEffect(() => {
    (async () => {
      try {
        const localUserRaw = localStorage.getItem("user");
        const sessionUserRaw = sessionStorage.getItem("user");
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");

        const storedUser = localUserRaw 
          ? JSON.parse(localUserRaw) 
          : sessionUserRaw 
          ? JSON.parse(sessionUserRaw) 
          : null;

        const storedToken = localToken || sessionToken || null;
        const tokenFromLocal = !!localToken;

        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
        } else if (storedToken) {
          try {
            const res = await axios.get(`${API_URL}/user/me`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            const profile = res.data;
            persistAuth(profile, storedToken, tokenFromLocal);
          } catch (fetchErr) {
            console.warn("Could not fetch profile with the stored token:", fetchErr);
            clearAuth();
          }
        }
      } catch (err) {
        console.error("error bootstrapping auth:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [persistAuth, clearAuth]);

  // Fetch transactions once user and token are loaded
  useEffect(() => {
    if (token) {
      refreshTransactions();
    }
  }, [token, refreshTransactions]);

  const handleLogin = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/");
  };

  const handleSignup = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
        
        {/* Protected Routes */}
        <Route 
          element={
            <ProtectedRoute user={user} token={token}>
              <Layout 
                user={user} 
                onLogout={handleLogout} 
                transactions={transactions} 
                refreshTransactions={refreshTransactions}
              />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expense" element={<Expense />} />
          <Route 
            path="/profile" 
            element={
              <Profile 
                user={user}
                onUpdateProfile={(updatedUserData) => setUser(updatedUserData)}
                onLogout={handleLogout}
              />
            } 
          />
        </Route>

        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
};

export default App;