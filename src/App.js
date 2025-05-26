import "./styles.css";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function FinanceTracker() {
  // State for all application data
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([
    { category: "Housing", limit: 1500 },
    { category: "Food", limit: 600 },
    { category: "Transportation", limit: 300 },
    { category: "Entertainment", limit: 200 },
    { category: "Other", limit: 300 },
  ]);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    category: "Housing",
    type: "expense",
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState("month");

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTransactions =
      JSON.parse(localStorage.getItem("transactions")) || [];
    const savedBudgets = JSON.parse(localStorage.getItem("budgets")) || budgets;
    setTransactions(savedTransactions);
    setBudgets(savedBudgets);
  }, []);

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [transactions, budgets]);

  // Helper functions
  const handleAddTransaction = (e) => {
    e.preventDefault();
    const amount = parseFloat(newTransaction.amount);
    const signedAmount = newTransaction.type === "income" ? amount : -amount;

    setTransactions([
      ...transactions,
      {
        ...newTransaction,
        amount: signedAmount,
        id: Date.now(),
      },
    ]);

    setNewTransaction({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      category: "Housing",
      type: "expense",
    });
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const updateBudget = (category, newLimit) => {
    setBudgets(
      budgets.map((b) =>
        b.category === category ? { ...b, limit: parseFloat(newLimit) } : b
      )
    );
  };

  // Data processing for visualizations
  const currentMonth = new Date().toISOString().slice(0, 7);

  const filteredTransactions = transactions.filter((t) => {
    if (timeRange === "month") return t.date.startsWith(currentMonth);
    if (timeRange === "year")
      return t.date.startsWith(currentMonth.slice(0, 4));
    return true;
  });

  const income = filteredTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filteredTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const net = income - expenses;

  const categoryData = budgets.map((budget) => {
    const spent = filteredTransactions
      .filter((t) => t.category === budget.category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      category: budget.category,
      spent,
      limit: budget.limit,
      remaining: budget.limit - spent,
    };
  });

  const pieData = categoryData.map((d) => ({
    name: d.category,
    value: d.spent,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // Main render
  return (
    <div className="finance-app">
      <header>
        <h1>Personal Finance Visualizer</h1>
        <nav>
          <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveTab("transactions")}>
            Transactions
          </button>
          <button onClick={() => setActiveTab("budgets")}>Budgets</button>
        </nav>
      </header>

      <main>
        <div className="time-range-selector">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {activeTab === "dashboard" && (
          <div className="dashboard">
            <div className="summary-cards">
              <div className="card">
                <h3>Income</h3>
                <p>${income.toFixed(2)}</p>
              </div>
              <div className="card">
                <h3>Expenses</h3>
                <p>${expenses.toFixed(2)}</p>
              </div>
              <div className="card">
                <h3>Net</h3>
                <p style={{ color: net >= 0 ? "green" : "red" }}>
                  ${net.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="charts">
              <div className="chart-container">
                <h3>Spending by Category</h3>
                <PieChart width={400} height={300}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              <div className="chart-container">
                <h3>Budget vs Actual</h3>
                <BarChart
                  width={500}
                  height={300}
                  data={categoryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spent" fill="#8884d8" name="Spent" />
                  <Bar dataKey="limit" fill="#82ca9d" name="Budget Limit" />
                </BarChart>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="transactions">
            <h2>Add Transaction</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount:</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value,
                    })
                  }
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category:</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      category: e.target.value,
                    })
                  }
                >
                  {budgets.map((b) => (
                    <option key={b.category} value={b.category}>
                      {b.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Type:</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="expense"
                      checked={newTransaction.type === "expense"}
                      onChange={() =>
                        setNewTransaction({
                          ...newTransaction,
                          type: "expense",
                        })
                      }
                    />
                    Expense
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="income"
                      checked={newTransaction.type === "income"}
                      onChange={() =>
                        setNewTransaction({ ...newTransaction, type: "income" })
                      }
                    />
                    Income
                  </label>
                </div>
              </div>

              <button type="submit">Add Transaction</button>
            </form>

            <h2>Transaction History</h2>
            <div className="transaction-list">
              {filteredTransactions.length === 0 ? (
                <p>No transactions found</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.date}</td>
                        <td>{transaction.description}</td>
                        <td
                          style={{
                            color: transaction.amount >= 0 ? "green" : "red",
                          }}
                        >
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td>{transaction.category}</td>
                        <td>
                          {transaction.amount >= 0 ? "Income" : "Expense"}
                        </td>
                        <td>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "budgets" && (
          <div className="budgets">
            <h2>Budget Management</h2>
            <div className="budget-list">
              {budgets.map((budget) => (
                <div key={budget.category} className="budget-item">
                  <h3>{budget.category}</h3>
                  <div className="budget-controls">
                    <label>
                      Monthly Limit:
                      <input
                        type="number"
                        value={budget.limit}
                        onChange={(e) =>
                          updateBudget(budget.category, e.target.value)
                        }
                        step="10"
                        min="0"
                      />
                    </label>
                    <div className="budget-status">
                      <span>
                        Spent: $
                        {categoryData
                          .find((d) => d.category === budget.category)
                          ?.spent.toFixed(2) || 0}
                      </span>
                      <span>
                        Remaining: $
                        {categoryData
                          .find((d) => d.category === budget.category)
                          ?.remaining.toFixed(2) || budget.limit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .finance-app {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        nav button {
          margin-left: 10px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .summary-cards {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          flex: 1;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .charts {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .chart-container {
          flex: 1;
          min-width: 300px;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input,
        select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .radio-group {
          display: flex;
          gap: 15px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: normal;
        }
        button {
          padding: 8px 16px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #45a049;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th,
        td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
        .budget-item {
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .budget-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .budget-status {
          text-align: right;
        }
        .budget-status span {
          display: block;
        }
      `}</style>
    </div>
  );
}
