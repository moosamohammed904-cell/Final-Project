import React, { useEffect, useState, useMemo } from 'react';
import { dashboardStyles, trendStyles, chartStyles }  from '../assets/dummyStyles';
import {
  GAUGE_COLORS, 
  COLORS, 
  INCOME_CATEGORY_ICONS, 
  EXPENSE_CATEGORY_ICONS 
} from '../assets/color';
import { useOutletContext } from "react-router-dom";
import { getTimeFrameRange, getPreviousTimeFrameRange, calculateData } from "../components/Helper";
import axios from "axios";
import { 
  Plus,
  TrendingDown,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingUp as ProfitIcon,
  ShoppingCart,
  PieChart as PieChartIcon,
  ChevronUp,
  Wallet,
  ArrowDown,
  PiggyBank,
  BarChart2,
} from "lucide-react"; 
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from "recharts";
import FinancialCard from '../components/FinancialCard';

const API_BASE = "http://localhost:4000/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Proper Semi-Circular SVG Gauge Card
const GaugeCard = ({ gauge, colorInfo, timeFrameLabel }) => {
  const radius = 60;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; 
  
  const percent = gauge.max > 0 ? Math.min(Math.max((gauge.value / gauge.max) * 100, 0), 100) : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-between">
      <h3 className="font-semibold text-gray-700 mb-2">{gauge.name}</h3>
      
      <div className="relative flex items-center justify-center my-2">
        <svg width="140" height="80" className="overflow-visible">
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke={colorInfo?.stroke || "#0D9488"}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <span className="text-xl font-bold text-gray-900">${Math.round(gauge.value).toLocaleString()}</span>
          <span className="text-xs text-gray-500 font-medium">{Math.round(percent)}%</span>
        </div>
      </div>

      <span className="text-xs text-gray-400 mt-2">{timeFrameLabel} data</span>
    </div>
  );
};

const Dashboard = () => {
  const { 
    transactions: outletTransactions = [], 
    timeFrame = "monthly", 
    setTimeFrame = () => {},
    refreshTransactions 
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [showAllIncome, setShowAllIncome] = useState(false); 
  const [showAllExpense, setShowAllExpense] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame), [timeFrame]);
  const prevTimeFrameRange = useMemo(() => getPreviousTimeFrameRange(timeFrame), [timeFrame]);
  const timeFrameLabel = timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1);
 
  const isDateInRange = (date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return transactionDate >= startDate && transactionDate <= endDate;
  };

  const filteredTransactions = useMemo(
    () => (outletTransactions || []).filter((t) => isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)),
    [outletTransactions, timeFrameRange]
  );

  const prevFilteredTransactions = useMemo(
    () => (outletTransactions || []).filter((t) => isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end)),
    [outletTransactions, prevTimeFrameRange]
  );

  const currentTimeFrameData = useMemo(() => {
    const data = calculateData(filteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [filteredTransactions]);

  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [prevFilteredTransactions]);

  useEffect(() => {
    const maxValues = {
      income: Math.max(currentTimeFrameData.income, 5000),
      expenses: Math.max(currentTimeFrameData.expenses, 3000),
      savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
    };

    setGaugeData([
      { name: "Income", value: currentTimeFrameData.income, max: maxValues.income },
      { name: "Spent", value: currentTimeFrameData.expenses, max: maxValues.expenses },
      { name: "Savings", value: currentTimeFrameData.savings, max: maxValues.savings },
    ]);
  }, [currentTimeFrameData, timeFrame]);

  const displayIncome = timeFrame === "monthly" && typeof overviewMeta.monthlyIncome === "number" ? overviewMeta.monthlyIncome : currentTimeFrameData.income;
  const displayExpenses = timeFrame === "monthly" && typeof overviewMeta.monthlyExpense === "number" ? overviewMeta.monthlyExpense : currentTimeFrameData.expenses;
  const displaySavings = timeFrame === "monthly" && typeof overviewMeta.savings === "number" ? overviewMeta.savings : currentTimeFrameData.savings;

  const expenseChange = useMemo(() => {
    const prev = prevTimeFrameData.expenses;
    const curr = displayExpenses;
    if (!prev) return curr ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  const financialOverviewData = useMemo(() => {
    const categories = {};
    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        // Normalize category name to capitalize first letter (avoids duplicate lowercase/uppercase keys)
        const rawCategory = transaction.category || "Other";
        const normalizedCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
        
        categories[normalizedCategory] = (categories[normalizedCategory] || 0) + transaction.amount;
      }
    });

    return Object.keys(categories).map((category) => ({
      name: category,
      value: Math.round(categories[category]),
    }));
  }, [filteredTransactions]);

  const incomeTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === "income").sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions]
  );

  const expenseTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === "expense").sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions]
  );

  const incomeListForDisplay = showAllIncome ? incomeTransactions : incomeTransactions.slice(0, 3);
  const expenseListForDisplay = showAllExpense ? expenseTransactions : expenseTransactions.slice(0, 3);

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/dashboard`, { headers: getAuthHeader() });
      if (res?.data?.success) {
        const data = res.data;
        setOverviewMeta((prev) => ({
          ...prev,
          monthlyIncome: Number(data.monthlyIncome || 0),
          monthlyExpense: Number(data.monthlyExpense || 0),
          savings: Number(data.savings || 0),
          savingsRate: data.savingsRate ?? null,
          expenseDistribution: data.expenseDistribution || [],
        }));
      }
    } catch (err) {
      console.error("Failed to fetch dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const handleAddTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = newTransaction.type === 'income' ? `${API_BASE}/income/add` : `${API_BASE}/expense/add`;
      await axios.post(endpoint, newTransaction, { headers: getAuthHeader() });
      setShowModal(false);
      if (refreshTransactions) refreshTransactions();
      fetchDashboardOverview();
    } catch (err) {
      console.error("Failed to add transaction:", err);
      alert("Error adding transaction");
    }
  };

  return (
    <div className={dashboardStyles.container}>
      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <div className={dashboardStyles.headerContent}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>Expense Tracker</h1>
            <p className={dashboardStyles.headerSubtitle}>Track your income and expenses</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className={dashboardStyles.addButton}>
            <Plus size={20} /> Add Transaction 
          </button>
        </div>

        <div className={dashboardStyles.timeFrameContainer}>
         <div className={dashboardStyles.timeFrameWrapper}>
           {["daily", "weekly", "monthly"].map((frame) => (
            <button key={frame} onClick={() => setTimeFrame(frame)} className={dashboardStyles.timeFrameButton(timeFrame === frame)}>
               {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </button>
           ))}
         </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={dashboardStyles.summaryGrid}>
        <FinancialCard 
          icon={<div className={dashboardStyles.walletIconContainer}><Wallet className="w-5 h-5 text-teal-600"/></div>} 
          label="Total Balance" 
          value={`$${Math.round(displayIncome - displayExpenses).toLocaleString()}`}
          additionalContent={
            <div className="flex items-center gap-2 mt-2 text-sm">
             <span className={dashboardStyles.balanceBadge}>+${Math.round(displayIncome).toLocaleString()}</span>
             <span className={dashboardStyles.expenseBadge}>-${Math.round(displayExpenses).toLocaleString()}</span>
            </div>
          }
        />

        <FinancialCard 
          icon={<div className={dashboardStyles.arrowDownIconContainer}><ArrowDown className="w-5 h-5 text-orange-600"/></div>} 
          label={`${timeFrameLabel} Expenses`} 
          value={`$${Math.round(displayExpenses).toLocaleString()}`}
          additionalContent={
            <div className={`mt-2 text-xs flex items-center gap-1 ${expenseChange >= 0 ? trendStyles.positive : trendStyles.negative}`}>
             {expenseChange >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
             <span>{Math.abs(expenseChange)}% {expenseChange >= 0 ? "increase" : "decrease"} from Last Period</span>
            </div>
          }
        />

        <FinancialCard 
          icon={<div className={dashboardStyles.piggyBankIconContainer}><PiggyBank className="w-5 h-5 text-cyan-600"/></div>} 
          label={`${timeFrameLabel} Savings`} 
          value={`$${Math.round(displaySavings).toLocaleString()}`}
          additionalContent={
            <div className="flex items-center gap-2 mt-2 text-xs text-cyan-600">
             <div className="flex items-center gap-1">
              <BarChart2 className="w-4 h-4"/>
              <span>{displayIncome > 0 ? Math.round((displaySavings / displayIncome) * 100) : 0}% of income</span>
             </div>
            </div>
          }
        />
      </div>

      {/* Semi-Circular Gauges Grid */}
      <div className={dashboardStyles.gaugeGrid}>
        {gaugeData.map((gauge) => (
          <GaugeCard 
            key={gauge.name}
            gauge={gauge}
            colorInfo={GAUGE_COLORS[gauge.name]}
            timeFrameLabel={timeFrameLabel}
          />
        ))}
      </div>

      {/* Expense distribution pie chart */}
      <div className={dashboardStyles.pieChartContainer}>
        <div className={dashboardStyles.pieChartHeader}>
          <h3 className={dashboardStyles.pieChartTitle}>
            <PieChartIcon className="w-6 h-6 text-teal-500" />
            Expense Distribution
            <span className={dashboardStyles.listSubtitle}> ({timeFrameLabel})</span>
          </h3>
        </div>

        <div className={dashboardStyles.pieChartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className={chartStyles.pieChart} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={financialOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                labelLine={true}
              >
                {financialOverviewData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`$${Math.round(value).toLocaleString()}`, "Amount"]}
                contentStyle={dashboardStyles.tooltipContent}
                itemStyle={dashboardStyles.tooltipItem}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(v) => <span className={dashboardStyles.legendText}>{v}</span>}
                iconSize={10}
                iconType="circle"
                wrapperStyle={dashboardStyles.legendWrapper}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={dashboardStyles.listsGrid}>
        {/* Income Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className={dashboardStyles.listTitle}>
              <ProfitIcon className="w-6 h-6 text-green-500" /> Recent Income{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameLabel})</span>
            </h3>
            <span className={dashboardStyles.incomeCountBadge}>
              {incomeTransactions.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {incomeListForDisplay.map((transaction) => {
              const IconComponent = INCOME_CATEGORY_ICONS[transaction.category] || INCOME_CATEGORY_ICONS.Other;
              return (
                <div key={transaction.id || transaction._id} className={dashboardStyles.incomeTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.incomeIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.incomeAmount}>+${Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {incomeTransactions.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-green-50")}>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No income transactions</p>
              </div>
            )}

            {incomeTransactions.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button 
                  onClick={() => setShowAllIncome(!showAllIncome)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllIncome ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Income ({incomeTransactions.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className="text-lg md:text-xl lg:text-xl xl:text-xl font-bold text-gray-800 md:mt-3 mt-3 flex items-center gap-3">
              <ArrowDown className="w-6 h-6 text-orange-500" /> Recent Expenses{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameLabel})</span>
            </h3>
            <span className={dashboardStyles.expenseCountBadge}>
              {expenseTransactions.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {expenseListForDisplay.map((transaction) => {
              const IconComponent = EXPENSE_CATEGORY_ICONS[transaction.category] || EXPENSE_CATEGORY_ICONS.Other;
              return (
                <div key={transaction.id || transaction._id} className={dashboardStyles.expenseTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.expenseIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.expenseAmount}>-${Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {expenseTransactions.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-orange-50")}>
                  <ShoppingCart className="w-8 h-8 text-orange-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No expense transactions</p>
              </div>
            )}

            {expenseTransactions.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button 
                  onClick={() => setShowAllExpense(!showAllExpense)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllExpense ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Expenses ({expenseTransactions.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Transaction</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="Salary, Funds, etc."
                  value={newTransaction.description} 
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  required
                  placeholder="0.00"
                  value={newTransaction.amount} 
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
                      newTransaction.type === 'income' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
                      newTransaction.type === 'expense' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <select 
                    value={newTransaction.category} 
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none pr-10"
                  >
                    <option value="Food">Food</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Transport">Transport</option>
                    <option value="Salary">Salary</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={newTransaction.date} 
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-semibold transition-colors shadow-sm"
                >
                  {loading ? "Saving..." : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;