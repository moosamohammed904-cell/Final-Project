import React, { useState, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar'; 
import Sidebar from './Sidebar';
import { styles } from '../assets/dummyStyles';
import { 
  PiggyBank, 
  TrendingUp, 
  Utensils, 
  Home, 
  Car, 
  ShoppingCart, 
  Gift, 
  Zap, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  CreditCard, 
  Clock,
  RefreshCw,
  Info,
  ChevronUp,
  ChevronDown,
  PieChart
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

const CATEGORY_ICONS = {
  Food: <Utensils className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingCart className="w-4 h-4" />,
  Entertainment: <Gift className="w-4 h-4" />,
  Utilities: <Zap className="w-4 h-4" />,
  Healthcare: <Activity className="w-4 h-4" />,
  Salary: <ArrowUp className="w-4 h-4" />,
  Freelance: <CreditCard className="w-4 h-4" />,
  Savings: <PiggyBank className="w-4 h-4" />,
};

// Filter transactions by time frame
const filterTransactions = (transactions, frame) => {
  const now = new Date();
  const today = new Date(now).setHours(0, 0, 0, 0);

  switch (frame) {
    case "daily":
      return transactions.filter((t) => new Date(t.date) >= today);
    case "weekly": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return transactions.filter((t) => new Date(t.date) >= startOfWeek);
    }
    case "monthly":
      return transactions.filter(
        (t) => new Date(t.date).getMonth() === now.getMonth()
      );
    default:
      return transactions;
  }
};

const safeArrayFromResponse = (res) => {
  const body = res?.data;
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.incomes)) return body.incomes;
  if (Array.isArray(body.expenses)) return body.expenses;
  return [];
};

const Layout = ({ onLogout, user }) => {
  const [transactions, setTransactions] = useState([]);
  const [timeFrame, setTimeFrame] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch transactions from server
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Using token for request:", token);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [incomeRes, expenseRes] = await Promise.all([
        axios.get(`${API_BASE}/income/get`, { headers }),
        axios.get(`${API_BASE}/expense/get`, { headers }),
      ]);

      const incomes = safeArrayFromResponse(incomeRes).map((i) => ({
        ...i,
        type: "income",
      }));
      const expenses = safeArrayFromResponse(expenseRes).map((e) => ({
        ...e,
        type: "expense",
      }));

      const allTransactions = [...incomes, ...expenses]
        .map((t) => ({
          id: t._id || t.id || t.id_str || Math.random().toString(36).slice(2),
          description: t.description || t.title || t.note || "",
          amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
          date: t.date || t.createdAt || new Date().toISOString(),
          category: t.category || t.type || "Other",
          type: t.type,
          raw: t,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(allTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Failed to fetch transactions",
        err?.response || err.message || err
      );
    } finally {
      setLoading(false);
    }
  };

  // Add transaction
  const addTransaction = async (transaction) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        transaction.type === "income" ? "income/add" : "expense/add";
      await axios.post(`${API_BASE}/${endpoint}`, transaction, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to add transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };

  // Edit transaction
  const editTransaction = async (id, transaction) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        transaction.type === "income" ? "income/update" : "expense/update";
      await axios.put(`${API_BASE}/${endpoint}/${id}`, transaction, {
        headers,
      });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to edit transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };

  // Delete transaction
  const deleteTransaction = async (id, type) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint = type === "income" ? "income/delete" : "expense/delete";
      await axios.delete(`${API_BASE}/${endpoint}/${id}`, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to delete transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, timeFrame),
    [transactions, timeFrame]
  );

  // Calculate top spending categories
  const topCategories = useMemo(() => {
    const totals = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});

    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [transactions]);

  // Statistics calculation
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const last30DaysTransactions = transactions.filter(
      (t) => new Date(t.date) >= thirtyDaysAgo
    );

    const last30DaysIncome = last30DaysTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const last30DaysExpenses = last30DaysTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate =
      last30DaysIncome > 0
        ? Math.round(
            ((last30DaysIncome - last30DaysExpenses) / last30DaysIncome) * 100
          )
        : 0;

    const last60DaysAgo = new Date(now);
    last60DaysAgo.setDate(now.getDate() - 60);

    const previous30DaysTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= last60DaysAgo && date < thirtyDaysAgo;
    });

    const previous30DaysExpenses = previous30DaysTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseChange =
      previous30DaysExpenses > 0
        ? Math.round(
            ((last30DaysExpenses - previous30DaysExpenses) /
              previous30DaysExpenses) *
              100
          )
        : 0;

    return {
      totalTransactions: transactions.length,
      last30DaysIncome,
      last30DaysExpenses,
      last30DaysSavings: last30DaysIncome - last30DaysExpenses,
      allTimeIncome,
      allTimeExpenses,
      allTimeSavings: allTimeIncome - allTimeExpenses,
      last30DaysCount: last30DaysTransactions.length,
      savingsRate,
      expenseChange,
    };
  }, [transactions]);

  const timeFrameLabel = useMemo(
    () =>
      timeFrame === "daily"
        ? "Today"
        : timeFrame === "weekly"
        ? "This Week"
        : "This Month",
    [timeFrame]
  );

  const outletContext = {
    user,
    transactions: filteredTransactions,
    allTransactions: transactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
    timeFrame,
    setTimeFrame,
    lastUpdated,
    stats,
    loading,
  };

  const getSavingsRating = (rate) =>
    rate > 30 ? "Excellent" : rate > 20 ? "Good" : "Needs improvement";

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="flex flex-1 items-stretch">
        <Sidebar 
          user={user} 
          isCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
        />
        
        <main className={styles?.Layout?.mainContainer ? styles.Layout.mainContainer(sidebarCollapsed) : "flex-1 p-6"}>
          <div className={styles?.header?.container || "mb-6"}>
            <div>
              <h1 className={styles?.header?.title || "text-2xl font-bold text-gray-800"}>Dashboard</h1>
              <p className={styles?.header?.subtitle || "text-sm text-gray-500"}>Welcome Back</p>
            </div>
          </div>
          
          {/* Stat Cards */}
          <div className={styles?.statCards?.grid || "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"}>
            {/* Total Balance */}
            <div className={styles?.statCards?.card || "bg-white p-4 rounded-xl border border-gray-100 shadow-sm"}>
              <div className={styles?.statCards?.cardHeader || "flex justify-between items-start"}>
                <div>
                  <p className={styles?.statCards?.cardTitle || "text-xs font-medium text-gray-500"}>Total Balance</p>
                  <p className={styles?.statCards?.cardValue || "text-xl font-bold text-gray-800"}>
                    ${stats.allTimeSavings.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={styles?.statCards?.iconContainer ? styles.statCards.iconContainer("teal") : "p-2 bg-teal-50 rounded-lg text-teal-600"}>
                  <DollarSign className={styles?.statCards?.icon ? styles.statCards.icon("teal") : "w-5 h-5"} />
                </div>
              </div>
              <p className={styles?.statCards?.cardFooter || "text-xs text-gray-500 mt-2"}>
                <span className="text-teal-600 font-medium">
                  +${stats.last30DaysSavings.toLocaleString()} 
                </span>{" "}
                this month
              </p>
            </div>

            {/* Monthly Income */}
            <div className={styles?.statCards?.card || "bg-white p-4 rounded-xl border border-gray-100 shadow-sm"}>
              <div className={styles?.statCards?.cardHeader || "flex justify-between items-start"}>
                <div>
                  <p className={styles?.statCards?.cardTitle || "text-xs font-medium text-gray-500"}>Monthly Income</p>
                  <p className={styles?.statCards?.cardValue || "text-xl font-bold text-gray-800"}>
                    ${stats.last30DaysIncome.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={styles?.statCards?.iconContainer ? styles.statCards.iconContainer("green") : "p-2 bg-green-50 rounded-lg text-green-600"}>
                  <ArrowUp className={styles?.statCards?.icon ? styles.statCards.icon("green") : "w-5 h-5"} />
                </div>
              </div>
              <p className={styles?.statCards?.cardFooter || "text-xs text-gray-500 mt-2"}>
                <span className="text-green-600 font-medium">+12.5% </span>
                from last month
              </p>
            </div>

            {/* Monthly Expenses */}
            <div className={styles?.statCards?.card || "bg-white p-4 rounded-xl border border-gray-100 shadow-sm"}>
              <div className={styles?.statCards?.cardHeader || "flex justify-between items-start"}>
                <div>
                  <p className={styles?.statCards?.cardTitle || "text-xs font-medium text-gray-500"}>Monthly Expenses</p>
                  <p className={styles?.statCards?.cardValue || "text-xl font-bold text-gray-800"}>
                    ${stats.last30DaysExpenses.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={styles?.statCards?.iconContainer ? styles.statCards.iconContainer("orange") : "p-2 bg-orange-50 rounded-lg text-orange-600"}>
                  <ArrowDown className={styles?.statCards?.icon ? styles.statCards.icon("orange") : "w-5 h-5"} />
                </div>
              </div>
              <p className={styles?.statCards?.cardFooter || "text-xs text-gray-500 mt-2"}>
                <span className={styles?.colors?.expenseChange ? `${styles.colors.expenseChange(stats.expenseChange)} font-medium` : "font-medium"}>
                  {stats.expenseChange > 0 ? "+" : ""}
                  {stats.expenseChange}%
                </span>{" "}
                from last month
              </p>
            </div>

            {/* Saving Rate */}
            <div className={styles?.statCards?.card || "bg-white p-4 rounded-xl border border-gray-100 shadow-sm"}>
              <div className={styles?.statCards?.cardHeader || "flex justify-between items-start"}>
                <div>
                  <p className={styles?.statCards?.cardTitle || "text-xs font-medium text-gray-500"}>Saving Rate</p>
                  <p className={styles?.statCards?.cardValue || "text-xl font-bold text-gray-800"}>
                    {stats.savingsRate}%
                  </p>
                </div>
                <div className={styles?.statCards?.iconContainer ? styles.statCards.iconContainer("blue") : "p-2 bg-blue-50 rounded-lg text-blue-600"}>
                  <PiggyBank className={styles?.statCards?.icon ? styles.statCards.icon("blue") : "w-5 h-5"} />
                </div>
              </div>
              <p className={styles?.statCards?.cardFooter || "text-xs text-gray-500 mt-2"}>
                {getSavingsRating(stats.savingsRate)}
              </p>
            </div>
          </div>

          {/* Overview Card */}
          <div className={styles?.grid?.main || "grid grid-cols-1 gap-6 mb-6"}>
            <div className={styles?.grid?.leftColumn || "w-full"}>
              <div className={styles?.cards?.base || "bg-white p-6 rounded-xl border border-gray-100 shadow-sm"}>
                <div className={styles?.cards?.header || "flex items-center gap-2 mb-4"}>
                  <h3 className={styles?.cards?.title || "text-lg font-semibold text-gray-800 flex items-center gap-2"}>
                    <TrendingUp className="w-6 h-6 text-teal-500" />
                    Financial Overview
                    <span className="text-sm text-gray-500 font-normal">
                      ({timeFrameLabel})
                    </span>
                  </h3>
                </div> 
                {/* Child Routes Outlet */}
                <Outlet context={outletContext} />
              </div>
            </div>

            {/* Right side */}
            <div className={styles?.grid?.rightColumn || "w-full space-y-6"}> 
              <div className={styles?.cards?.base || "bg-white p-6 rounded-xl border border-gray-100 shadow-sm"}> 
                <div className={styles?.transactions?.cardHeader || "flex justify-between items-center mb-4"}>
                  <h3 className={styles?.transactions?.cardTitle || "text-lg font-semibold text-gray-800 flex items-center gap-2"}>
                    <Clock className="w-6 h-6 text-purple-500"/>
                    Recent Transactions
                  </h3>
                  <button 
                    onClick={fetchTransactions} 
                    disabled={loading}
                    className={styles?.transactions?.refreshButton || "p-2 hover:bg-gray-100 rounded-lg transition-colors"}
                  >
                    <RefreshCw className={styles?.refreshIcon ? styles.refreshIcon(loading) : `w-4 h-4 ${loading ? "animate-spin" : ""}`}/>
                  </button>
                </div>

                <div className={styles?.transactions?.dataStackingInfo || "flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-md"}>
                  <Info className={styles?.transactions?.dataStackingIcon || "w-4 h-4 text-blue-500"}/>
                  <span>Transactions are stacked by date (newest first)</span>
                </div>

                <div className={styles?.transactions?.listContainer || "space-y-3"}>
                  {displayedTransactions.map((transaction) => {
                    const { id, type, category, description, date, amount } = transaction;
                    return (
                      <div key={id} className={styles?.transactions?.transactionItem || "flex items-center justify-between p-3 bg-gray-50 rounded-lg"}>
                        <div className="flex items-center gap-1 md:gap-4 lg:gap-3">
                          <div className={`p-2 rounded-lg ${styles?.colors?.transaction?.bg ? styles.colors.transaction.bg(type) : "bg-gray-200"}`}>
                            {CATEGORY_ICONS[category] || (
                              <DollarSign className={styles?.transactions?.icon || "w-4 h-4"}/>
                            )}
                          </div>

                          <div className={styles?.transactions?.details}>
                            <p className={styles?.transactions?.description || "font-medium text-gray-800 text-sm"}>
                              {description}
                            </p>

                            <p className={styles?.transactions?.meta || "text-xs text-gray-500"}>
                              {date ? new Date(date).toLocaleDateString() : 'N/A'}
                              <span className="ml-2 capitalize">
                                {category}
                              </span>
                            </p>
                          </div>
                        </div>

                        <span className={styles?.colors?.transaction?.text ? styles.colors.transaction.text(type) : (type === "income" ? "text-green-600 font-semibold" : "text-red-600 font-semibold")}>
                          {type === "income" ? "+" : "-"}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                  
                  {transactions.length === 0 ? (
                    <div className={styles?.transactions?.emptyState || "flex flex-col items-center p-4 text-center"}>
                      <div className={styles?.transactions?.emptyIconContainer || "p-3 bg-gray-100 rounded-full mb-2"}>
                        <Clock className={styles?.cards?.transactions?.emptyIcon || "w-6 h-6 text-gray-400"} />
                      </div>
                      <p className={styles?.transactions?.emptytext || "text-xs text-gray-500"}>
                        No recent Transaction
                      </p>
                    </div>
                  ) : (
                    <div className={styles?.transactions?.viewAllContainer || "text-center pt-2"}>
                      <button 
                        onClick={() => setShowAllTransactions(!showAllTransactions)} 
                        className={styles?.transactions?.viewAllButton || "inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"}
                      >
                        {showAllTransactions ? (
                          <>
                            <ChevronUp className="w-5 h-5"/>
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5"/>
                            View All Transactions ({transactions.length})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Spending by Category Card */}
              <div className={styles?.cards?.base || "bg-white p-6 rounded-xl border border-gray-100 shadow-sm"}>
                <h3 className={styles?.categories?.title || "text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4"}>
                  <PieChart className={styles?.categories?.titleIcon || "w-6 h-6 text-teal-500"} />
                  Spending by Category
                </h3>

                <div className={styles?.categories?.list || "space-y-3"}>
                  {topCategories.map(([category, amount]) => ( 
                    <div key={category} className={styles?.categories?.categoryItem || "flex items-center justify-between p-2 rounded-lg bg-gray-50"}> 
                      <div className="flex items-center gap-3">
                        <div className={styles?.categories?.categoryIconContainer || "p-2 bg-teal-50 rounded-lg text-teal-600"}>
                          {CATEGORY_ICONS[category] || (
                            <DollarSign className={styles?.categories?.categoryIcon || "w-4 h-4 text-gray-500"} />
                          )}
                        </div>
                        <span className={styles?.categories?.categoryName || "text-sm font-medium text-gray-700"}>
                          {category}
                        </span>
                      </div>
                      <span className={styles?.categories?.categoryAmount || "text-sm font-semibold text-gray-800"}>
                        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>      
                    </div>
                  ))}
                  {topCategories.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">No category expenses found</p>
                  )}
                </div>

                <div className={styles?.categories?.summaryContainer || "mt-6 pt-4 border-t border-gray-100"}>
                  <div className={styles?.categories?.summaryGrid || "grid grid-cols-2 gap-4"}>
                    <div className={styles?.categories?.summaryIncomeCard || "bg-green-50 p-3 rounded-lg"}>
                      <p className={styles?.categories?.summaryTitle || "text-xs font-medium text-green-600"}>
                        Total Income
                      </p>
                      <p className={styles?.categories?.summaryValue || "text-base font-bold text-green-700 mt-1"}>
                        ${stats.allTimeIncome.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </p>      
                    </div>

                    <div className={styles?.categories?.summaryExpenseCard || "bg-red-50 p-3 rounded-lg"}>
                      <p className={styles?.categories?.summaryTitle || "text-xs font-medium text-red-600"}>
                        Total Expense
                      </p>
                      <p className={styles?.categories?.summaryValue || "text-base font-bold text-red-700 mt-1"}>
                        ${stats.allTimeExpenses.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </p>      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;