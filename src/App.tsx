import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, 
  Calendar, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Share2, 
  Copy, 
  RotateCcw, 
  Save, 
  Trash2, 
  History, 
  Plus, 
  Check, 
  Info,
  Clock,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExpenseItem, DailyReport } from "./types";

const INITIAL_EXPENSE_NAMES = [
  "کریانہ",
  "منڈی",
  "رول",
  "سلنڈر",
  "مصالحہ",
  "بل بجلی",
  "کرایہ",
  "مزدوری",
  "کیچپ وغیرہ",
  "دیگر"
];

export default function App() {
  // --- States ---
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const [sale1, setSale1] = useState<number | string>("");
  const [sale2, setSale2] = useState<number | string>("");
  const [customExpenseName, setCustomExpenseName] = useState<string>("");
  
  // Custom + Default expenses combined state
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(() => 
    INITIAL_EXPENSE_NAMES.map((name, idx) => ({
      id: `default-${idx}`,
      name,
      isSelected: false,
      amount: 0
    }))
  );

  const [notes, setNotes] = useState<string>("");
  const [history, setHistory] = useState<DailyReport[]>([]);
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- Sync History from Local Storage ---
  useEffect(() => {
    const saved = localStorage.getItem("chaska_point_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveHistoryToLocalStorage = (newHistory: DailyReport[]) => {
    setHistory(newHistory);
    localStorage.setItem("chaska_point_history", JSON.stringify(newHistory));
  };

  // --- Show Temporary Feedback ---
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- Calculations ---
  const numSale1 = typeof sale1 === "number" ? sale1 : parseFloat(sale1) || 0;
  const numSale2 = typeof sale2 === "number" ? sale2 : parseFloat(sale2) || 0;
  const totalSale = useMemo(() => numSale1 + numSale2, [numSale1, numSale2]);

  const totalExpense = useMemo(() => {
    return expenseItems.reduce((acc, curr) => {
      if (curr.isSelected) {
        return acc + curr.amount;
      }
      return acc;
    }, 0);
  }, [expenseItems]);

  const profit = useMemo(() => totalSale - totalExpense, [totalSale, totalExpense]);

  // --- Actions & Handlers ---
  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    setExpenseItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isSelected: isChecked,
            amount: isChecked ? item.amount || "" : 0 as any // Clear or reset
          };
        }
        return item;
      })
    );
  };

  const handleAmountChange = (id: string, amountVal: string) => {
    const parsed = amountVal === "" ? "" : parseFloat(amountVal) || 0;
    setExpenseItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            amount: parsed as number
          };
        }
        return item;
      })
    );
  };

  const handleAddCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExpenseName.trim()) return;

    // Check if it already exists
    const normalizedNew = customExpenseName.trim();
    if (expenseItems.some(i => i.name === normalizedNew)) {
      showToast("یہ خرچہ پہلے سے فہرست میں موجود ہے!");
      return;
    }

    const newItem: ExpenseItem = {
      id: `custom-${Date.now()}`,
      name: normalizedNew,
      isSelected: true,
      amount: "" as any // ready to type
    };

    setExpenseItems(prev => [...prev, newItem]);
    setCustomExpenseName("");
    showToast(`نیا خرچہ "${normalizedNew}" شامل ہو گیا!`);
  };

  const handleResetForm = () => {
    setSale1("");
    setSale2("");
    setNotes("");
    setExpenseItems(
      INITIAL_EXPENSE_NAMES.map((name, idx) => ({
        id: `default-${idx}`,
        name,
        isSelected: false,
        amount: 0
      }))
    );
    setSelectedDate(new Date().toISOString().split("T")[0]);
    showToast("فارم صاف کر دیا گیا ہے!");
  };

  // --- Save Report Locally ---
  const handleSaveReport = () => {
    // Validate
    if (totalSale === 0 && totalExpense === 0) {
      showToast("براہ کرم محفوظ کرنے کے لیے سیل یا اخراجات درج کریں۔");
      return;
    }

    const activeExpenses = expenseItems
      .filter(item => item.isSelected && item.amount > 0)
      .map(item => ({ name: item.name, amount: item.amount }));

    const newReport: DailyReport = {
      id: selectedDate, // Store with selected date as unique ID
      date: selectedDate,
      sale1: numSale1,
      sale2: numSale2,
      totalSale,
      expenses: activeExpenses,
      totalExpense,
      profit,
      notes: notes.trim() || undefined
    };

    // Replace if same date report exists or add new
    const existingIndex = history.findIndex(h => h.date === selectedDate);
    let updatedHistory = [...history];
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = newReport;
      showToast(`تاریخ ${selectedDate} کی رپورٹ اپ ڈیٹ کر دی گئی ہے!`);
    } else {
      updatedHistory = [newReport, ...updatedHistory];
      showToast(`رپورٹ برائے تاریخ ${selectedDate} کامیابی سے محفوظ کرلی گئی!`);
    }

    // Sort history by date descending
    updatedHistory.sort((a, b) => b.date.localeCompare(a.date));
    saveHistoryToLocalStorage(updatedHistory);
  };

  // --- Load a historical report ---
  const handleLoadReport = (report: DailyReport) => {
    setSelectedDate(report.date);
    setSale1(report.sale1 || "");
    setSale2(report.sale2 || "");
    setNotes(report.notes || "");

    // map expenses
    const updatedExpenses = INITIAL_EXPENSE_NAMES.map((name, idx) => {
      const savedEx = report.expenses.find(e => e.name === name);
      return {
        id: `default-${idx}`,
        name,
        isSelected: !!savedEx,
        amount: savedEx ? savedEx.amount : 0
      };
    });

    // append any custom expenses from saved report that are not in defaults
    report.expenses.forEach(savedEx => {
      if (!INITIAL_EXPENSE_NAMES.includes(savedEx.name)) {
        updatedExpenses.push({
          id: `custom-${Math.random()}`,
          name: savedEx.name,
          isSelected: true,
          amount: savedEx.amount
        });
      }
    });

    setExpenseItems(updatedExpenses);
    setActiveTab("form");
    showToast(`تاریخ ${report.date} کا ڈیٹا فارم میں لوڈ کر لیا گیا ہے۔`);
  };

  // --- Delete Report ---
  const handleDeleteReport = (id: string, dateStr: string) => {
    if (confirm(`کیا آپ واقعی تاریخ ${dateStr} کی رپورٹ حذف کرنا چاہتے ہیں؟`)) {
      const updated = history.filter(h => h.id !== id);
      saveHistoryToLocalStorage(updated);
      showToast("رپورٹ کامیابی سے حذف کر دی گئی۔");
    }
  };

  // --- Build Shareable Urdu Report Text ---
  const buildUrduReportText = () => {
    const dateObj = new Date(selectedDate);
    const options: Intl.DateTimeFormatOptions = { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      weekday: "long" 
    };
    
    // Fallback localization display
    let displayDate = selectedDate;
    try {
      displayDate = dateObj.toLocaleDateString("ur-PK", options);
    } catch (e) {
      displayDate = selectedDate;
    }

    let expenseDetailsStr = "";
    expenseItems.forEach(item => {
      if (item.isSelected && item.amount > 0) {
        expenseDetailsStr += `🔸 ${item.name}: ${item.amount.toLocaleString("ur-PK")} روپے\n`;
      }
    });

    const resultType = profit >= 0 ? "نفع (Profit)" : "نقصان (Loss)";
    const absProfit = Math.abs(profit);

    let reportText = "\u200F"; // RTL Unicode formatting helper
    reportText += `*ایم نوید چسکا پوائنٹ، رینالہ کلاں*\n`;
    reportText += `📝 *روزانہ سیل و اخراجات رپورٹ*\n\n`;
    reportText += `📅 *تاریخ:* ${displayDate}\n`;
    reportText += `━━━━━━━━━━━━━━━━━\n`;
    reportText += `💵 *سیل نمبر 1:* ${numSale1.toLocaleString("ur-PK")} روپے\n`;
    reportText += `💵 *سیل نمبر 2:* ${numSale2.toLocaleString("ur-PK")} روپے\n`;
    reportText += `💰 *کل ٹوٹل سیل:* *${totalSale.toLocaleString("ur-PK")} روپے*\n`;
    reportText += `━━━━━━━━━━━━━━━━━\n\n`;
    
    reportText += `💸 *اخراجات کی تفصیل (Expenses):*\n`;
    if (expenseDetailsStr) {
      reportText += expenseDetailsStr;
    } else {
      reportText += `• کوئی خرچہ درج نہیں ہوا\n`;
    }
    reportText += `🛑 *کل ٹوٹل خرچہ:* *${totalExpense.toLocaleString("ur-PK")} روپے*\n`;
    reportText += `━━━━━━━━━━━━━━━━━\n\n`;

    if (notes.trim()) {
      reportText += `✍️ *اضافی نوٹ:* ${notes}\n\n`;
    }

    reportText += `📊 *حتمی نتیجہ (Net Status):*\n`;
    reportText += `🌟 *کل ${resultType}:* *${absProfit.toLocaleString("ur-PK")} روپے*\n`;
    reportText += `━━━━━━━━━━━━━━━━━\n\n`;
    reportText += `🕌 _ہمیشہ نماز کی پابندی کریں_\n`;
    reportText += `📍 _رپورٹ مرتب کردہ: ایم نوید چسکا پوائنٹ ورچوئل اسسٹنٹ_`;

    return reportText;
  };

  // --- Share via WhatsApp ---
  const handleSendWhatsApp = () => {
    const reportText = buildUrduReportText();
    const whatsappNumber = "923458081903";
    const encodedText = encodeURIComponent(reportText);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
    showToast("واٹس ایپ کھولا جا رہا ہے...");
  };

  // --- Copy Report to Clipboard ---
  const handleCopyToClipboard = () => {
    const reportText = buildUrduReportText();
    navigator.clipboard.writeText(reportText).then(() => {
      showToast("رپورٹ کامیابی سے کلپ بورڈ پر کاپی ہو گئی ہے!");
    }).catch(() => {
      showToast("کاپی کرنے میں خرابی پیش آئی۔");
    });
  };

  // --- Search history filtering ---
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const searchLower = searchQuery.toLowerCase();
      const dateMatch = h.date.includes(searchLower);
      const expenseMatch = h.expenses.some(e => e.name.toLowerCase().includes(searchLower));
      const noteMatch = h.notes?.toLowerCase().includes(searchLower);
      return dateMatch || expenseMatch || noteMatch;
    });
  }, [history, searchQuery]);

  // --- Statistics for aggregate cards ---
  const stats = useMemo(() => {
    if (history.length === 0) return { totalSales: 0, totalExpenses: 0, netProfit: 0, count: 0 };
    const totalSales = history.reduce((sum, h) => sum + h.totalSale, 0);
    const totalExpenses = history.reduce((sum, h) => sum + h.totalExpense, 0);
    const netProfit = totalSales - totalExpenses;
    return {
      totalSales,
      totalExpenses,
      netProfit,
      count: history.length
    };
  }, [history]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 selection:bg-orange-100 selection:text-orange-900 flex flex-col" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-medium px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700/50"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            <span className="text-lg font-sans leading-relaxed">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto shadow-xl bg-white border-x border-slate-200/60 min-h-screen">
        
        {/* RIGHT SIDEBAR NAVIGATION - Dark Slate High Density Vibe */}
        <nav className="w-full lg:w-80 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 border-l border-slate-800">
          
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md">
              <Coffee className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-orange-400 font-bold block text-[10px] tracking-wider font-sans">شاندار ذائقہ، بھرپور چسکا</span>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans leading-tight">ایم نوید چسکا پوائنٹ</h1>
            </div>
          </div>

          {/* Practical Date Picker Widget inside Sidebar */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-2.5 mb-2 text-slate-400">
              <Calendar className="w-4 h-4 text-orange-400" />
              <label className="text-xs font-bold leading-none">رپورٹ کی تاریخ منتخب کریں:</label>
            </div>
            <input 
              type="date" 
              id="current-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 text-white font-bold outline-none text-sm cursor-pointer focus:text-orange-300 transition-colors py-2 px-3 rounded-lg border border-slate-700 uppercase"
            />
          </div>

          {/* Navigation Mode Tabs stacked vertically in sidebar */}
          <div className="flex-1 p-4 space-y-1.5">
            <button
              id="tab-new"
              onClick={() => setActiveTab("form")}
              className={`w-full py-3 px-4 font-semibold flex items-center gap-3 rounded-lg text-base transition-all text-right cursor-pointer ${
                activeTab === "form" 
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
              }`}
            >
              <Calculator className="w-4 h-4 text-blue-400" />
              آج کا حساب کتاب (فارم)
            </button>
            <button
              id="tab-history"
              onClick={() => setActiveTab("history")}
              className={`w-full py-3 px-4 font-semibold flex items-center gap-3 rounded-lg text-base transition-all text-right cursor-pointer ${
                activeTab === "history" 
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
              }`}
            >
              <History className="w-4 h-4 text-blue-400" />
              <span>گزشتہ ہسٹری لاگز</span>
              {history.length > 0 && (
                <span className="mr-auto bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-md border border-slate-700/50 font-sans">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* Proprietor avatar card at bottom pin */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/20">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow">
                ن
              </div>
              <div className="flex-grow">
                <div className="text-xs text-white font-bold leading-none">مینیجر: ایم نوید چسکا</div>
                <div className="text-[10px] text-slate-500 mt-1 font-sans">بیک اب: لوکل براؤزر اسٹوریج</div>
              </div>
            </div>
          </div>

        </nav>

        {/* LEFT WORKSPACE - White/slate-50 high density dashboard content pane */}
        <main className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-y-auto p-5 md:p-6 lg:p-8">
          
          {/* Workspace Header Bar */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
            <div>
              <span className="text-blue-600 text-xs font-bold uppercase tracking-wider font-sans block mb-1">مین کنٹرول سینٹر</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                {activeTab === "form" ? "روزانہ کاؤنٹر رپورٹ جنریٹر" : "محفوظ شدہ بزنس لاگز کی کتاب"}
              </h2>
            </div>
            
            {/* Quick action buttons in header - matches High Density premium layout */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleResetForm}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer hover:shadow-sm"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                فارم صاف کریں
              </button>
              
              <button 
                onClick={() => {
                  setActiveTab("form");
                  handleResetForm();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/10 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-white" />
                نیا ریکارڈ لکھیں
              </button>
            </div>
          </header>

          {/* High Density Top Multi-metric statistics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Metric 1: Counts */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">🗓</div>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">دن</span>
              </div>
              <div className="text-2xl lg:text-3xl font-black font-sans leading-none text-slate-800">{stats.count}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-wider leading-none">کل ریکارڈ شدہ دن</div>
            </div>

            {/* Metric 2: Revenue */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm">💵</div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">آمدنی</span>
              </div>
              <div className="text-xl lg:text-2xl font-black font-sans leading-none text-slate-800 truncate" style={{ direction: "ltr" }}>
                {stats.totalSales.toLocaleString("ur-PK")} <span className="text-[11px] font-bold">Rs</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-wider leading-none">مجموعی فروخت (سیل)</div>
            </div>

            {/* Metric 3: Expense */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold text-sm">💸</div>
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">اخراجات</span>
              </div>
              <div className="text-xl lg:text-2xl font-black font-sans leading-none text-slate-800 truncate" style={{ direction: "ltr" }}>
                {stats.totalExpenses.toLocaleString("ur-PK")} <span className="text-[11px] font-bold">Rs</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-wider leading-none">مجموعی بھرتی اخراجات</div>
            </div>

            {/* Metric 4: Net Balance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${stats.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  {stats.netProfit >= 0 ? "💹" : "🔻"}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${stats.netProfit >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>
                  {stats.netProfit >= 0 ? "خالص بچت" : "نقصان"}
                </span>
              </div>
              <div className={`text-xl lg:text-2xl font-black font-sans leading-none truncate ${stats.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`} style={{ direction: "ltr" }}>
                {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString("ur-PK")} <span className="text-[11px] font-bold">Rs</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-wider leading-none">بزنس خالص منافع</div>
            </div>
          </div>

          {/* Active view workspace */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "form" ? (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  
                  {/* Grid of Sales & Basic Inputs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Sales Column - span 7 */}
                    <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 mb-5">
                          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">کاؤنٹر کی آمدنی (Sales Track)</h3>
                            <p className="text-slate-400 text-xs">اجناس، چائے اور کچن کاؤنٹر سے روزانہ کی کلش درآمدات دیکھیں</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label htmlFor="sale1" className="text-slate-600 font-bold text-sm block">
                              سیل نمبر 1 (صبح کی شفٹ)
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                id="sale1" 
                                placeholder="0" 
                                value={sale1}
                                onChange={(e) => setSale1(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                                className="w-full text-base font-bold pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left focus:bg-white focus:border-blue-500 transition-all outline-none"
                                style={{ direction: 'ltr' }}
                              />
                              <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-semibold pointer-events-none">Rs</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="sale2" className="text-slate-600 font-bold text-sm block">
                              سیل نمبر 2 (شام کی شفٹ)
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                id="sale2" 
                                placeholder="0" 
                                value={sale2}
                                onChange={(e) => setSale2(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                                className="w-full text-base font-bold pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left focus:bg-white focus:border-blue-500 transition-all outline-none"
                                style={{ direction: 'ltr' }}
                              />
                              <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-semibold pointer-events-none">Rs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Total display inside Sales widget */}
                      <div className="mt-8 bg-blue-50/60 border border-blue-100/80 rounded-lg p-4 flex justify-between items-center">
                        <span className="text-base font-bold text-slate-700">ٹوٹل فروخت بکس:</span>
                        <span className="text-2xl font-black text-blue-900 font-sans tracking-tight" style={{ direction: 'ltr' }}>
                          {totalSale.toLocaleString('ur-PK')} <span className="text-sm font-bold">روپے</span>
                        </span>
                      </div>
                    </div>

                    {/* Final Status Net result - span 5 */}
                    <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 mb-5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">حتمی خلاصی (Status Summary)</h3>
                            <p className="text-slate-400 text-xs">نفع یا نقصان کا حساب کارکردگی گراف</p>
                          </div>
                        </div>

                        {/* Density Net Profit visual display widget */}
                        <div className={`p-4 rounded-xl flex items-center justify-between border ${
                          profit >= 0 
                            ? "bg-emerald-50/70 border-emerald-100 text-emerald-900" 
                            : "bg-rose-50/70 border-rose-100 text-rose-900"
                        }`}>
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              profit >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                            }`}>
                              {profit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div>
                              <span className="text-xs opacity-75 block font-bold leading-none">نیٹ اسٹیٹس:</span>
                              <span className="text-xl font-extrabold tracking-wide mt-1 block">
                                {profit >= 0 ? "صحیح نفع (Profit)" : "عدم خسارہ (Loss)"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-left font-sans font-black text-2xl" style={{ direction: 'ltr' }}>
                            {Math.abs(profit).toLocaleString('ur-PK')} <span className="text-xs font-bold block opacity-60">Rs</span>
                          </div>
                        </div>
                      </div>

                      {/* Active Actions Strip */}
                      <div className="grid grid-cols-2 gap-2 mt-6">
                        <button
                          onClick={handleSendWhatsApp}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-2 font-bold rounded-lg text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          واٹس ایپ رپورٹ
                        </button>
                        
                        <button
                          onClick={handleSaveReport}
                          className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 px-2 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer"
                        >
                          <Save className="w-4 h-4 text-orange-400" />
                          ریکارد محفوظ کریں
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Dense Expense inputs */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3.5 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">اخراجات کی تفصیل (Daily Shop Payments)</h3>
                          <p className="text-slate-400 text-xs">اسٹور، سلنڈر، پتی یا منڈی کے خرچے چیک کر کے رقم لکھیں</p>
                        </div>
                      </div>

                      {/* Tiny report total */}
                      <div className="bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-lg border border-red-100/50 text-sm font-sans flex items-center gap-2">
                        <span>ٹوٹل کٹوتی:</span>
                        <strong className="text-base font-black" style={{ direction: 'ltr' }}>{totalExpense.toLocaleString('ur-PK')} Rs</strong>
                      </div>
                    </div>

                    {/* Dense checkbox grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {expenseItems.map((item) => (
                        <div 
                          key={item.id}
                          className={`border rounded-lg p-3 transition-all flex flex-col justify-center ${
                            item.isSelected 
                              ? "border-orange-200 bg-orange-50/20 shadow-xs" 
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer select-none">
                            <span className="text-base font-bold text-slate-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={item.isSelected}
                                onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                item.isSelected 
                                  ? "border-orange-500 bg-orange-500 text-white" 
                                  : "border-slate-300 bg-white"
                              }`}>
                                {item.isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                              </div>
                            </div>
                          </label>

                          <AnimatePresence initial={false}>
                            {item.isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.1 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 relative">
                                  <input 
                                    type="number"
                                    placeholder="رقم (Rs.)"
                                    value={item.amount === 0 ? "" : item.amount}
                                    onChange={(e) => handleAmountChange(item.id, e.target.value)}
                                    className="w-full text-sm font-bold pl-8 pr-3 py-1.5 bg-white border border-orange-200 rounded focus:border-orange-500 outline-none transition-colors text-left font-sans"
                                    style={{ direction: 'ltr' }}
                                    autoFocus
                                  />
                                  <span className="absolute left-2.5 top-4 text-slate-400 text-[10px] font-bold">Rs</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Add custom creator */}
                    <form onSubmit={handleAddCustomExpense} className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="نیا خرچہ شامل کریں (مثلاً: گاڑی کا کرایہ یا دودھ)..."
                        value={customExpenseName}
                        onChange={(e) => setCustomExpenseName(e.target.value)}
                        className="flex-grow text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-right"
                      />
                      <button 
                        type="submit"
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-400" />
                        بریک پلس
                      </button>
                    </form>
                  </div>

                  {/* Comments field */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5">اضافی تبصرہ یا دن کا حال (اختیاری نوٹ):</h3>
                    <textarea
                      rows={2}
                      placeholder="کسی خاص ادائیگی یا ریمارکس کی تفصیل یہاں لکھیں..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-orange-500 outline-none transition-all text-right"
                    />
                  </div>

                  {/* Dense clipboard action row */}
                  <div className="flex justify-between items-center bg-slate-800 text-slate-300 p-3 rounded-lg border border-slate-700 text-xs">
                    <span className="font-medium">بجٹ کا حتمی نتیجہ تیار ہے۔ اب آپ واٹس ایپ پر براہ راست شیئر کر سکتے ہیں۔</span>
                    <button 
                      onClick={handleCopyToClipboard}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded text-xs cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      رپورٹ کاپی کریں
                    </button>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="history-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  
                  {/* List of Registered Accounts logs */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3.5 mb-5">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">محفوظ شدہ ریکارڈز کی جامع لسٹ</h3>
                        <p className="text-slate-400 text-xs">دن وار اکاؤنٹنٹ شیٹ دیکھنے کے لیے تاریخ فلٹر کریں</p>
                      </div>

                      {/* Live Date search filter */}
                      <div className="relative w-full sm:w-64">
                        <input 
                          type="text" 
                          placeholder="ریکارڈ میں تاریخ یا آئٹم تلاش کریں..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs font-bold px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-right"
                        />
                      </div>
                    </div>

                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-12 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                        <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">کوئی ریکارڈ نہیں ملا!</h4>
                        <p className="text-xs text-slate-400 mt-0.5">تاریخ فلٹر چیک کریں یا نئی رپورٹ محفوظ کریں</p>
                        <button 
                          onClick={() => setActiveTab("form")}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                        >
                          نئی رپورٹ بنائیں
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredHistory.map((report) => {
                          const isProfit = report.profit >= 0;
                          return (
                            <div 
                              key={report.id}
                              className="border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-slate-50/70 p-4 transition-all"
                            >
                              
                              {/* Log item header */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 bg-slate-800/10 text-slate-800 font-bold rounded-md font-sans text-xs">
                                    🗓 {report.date}
                                  </span>
                                  <span className="text-sm font-bold text-slate-700">
                                    {new Date(report.date).toLocaleDateString("ur-PK", { weekday: "long" })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleLoadReport(report)}
                                    className="px-2.5 py-1 bg-slate-900 text-slate-200 hover:bg-slate-950 font-bold rounded text-[10px] cursor-pointer"
                                  >
                                    لوڈ اور واٹس ایپ کریں
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReport(report.id, report.date)}
                                    className="p-1 text-rose-500 hover:text-white hover:bg-rose-500 rounded border border-transparent hover:border-rose-600 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Numbers list in report */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3 font-sans">
                                <div className="bg-white border border-slate-200/60 p-2 rounded-lg text-right">
                                  <span className="text-slate-400 font-medium block">آمدنی 1 (صبح):</span>
                                  <span className="font-bold text-slate-800 block mt-0.5" style={{ direction: "ltr" }}>
                                    {report.sale1.toLocaleString()} Rs
                                  </span>
                                </div>
                                <div className="bg-white border border-slate-200/60 p-2 rounded-lg text-right">
                                  <span className="text-slate-400 font-medium block">آمدنی 2 (شام):</span>
                                  <span className="font-bold text-slate-800 block mt-0.5" style={{ direction: "ltr" }}>
                                    {report.sale2.toLocaleString()} Rs
                                  </span>
                                </div>
                                <div className="bg-white border border-slate-200/60 p-2 rounded-lg text-right">
                                  <span className="text-slate-400 font-medium block">کل سیل:</span>
                                  <span className="font-extrabold text-blue-700 block mt-0.5" style={{ direction: "ltr" }}>
                                    {report.totalSale.toLocaleString()} Rs
                                  </span>
                                </div>
                                <div className="bg-white border border-slate-200/60 p-2 rounded-lg text-right">
                                  <span className="text-slate-400 font-medium block">کل خرچہ:</span>
                                  <span className="font-extrabold text-rose-700 block mt-0.5" style={{ direction: "ltr" }}>
                                    {report.totalExpense.toLocaleString()} Rs
                                  </span>
                                </div>
                              </div>

                              {/* Expenditures strip */}
                              {report.expenses.length > 0 && (
                                <div className="bg-white border border-slate-200/60 px-3 py-2 rounded-lg text-xs mb-2">
                                  <span className="text-slate-400 font-semibold block mb-1">بل میں کٹے ہوئے اخراجات:</span>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-sans">
                                    {report.expenses.map((ex, exIdx) => (
                                      <span key={exIdx} className="inline-flex items-center gap-1 text-slate-600">
                                        <span className="w-1 h-1 rounded-full bg-orange-400"></span>
                                        {ex.name}: <strong>{ex.amount.toLocaleString()} Rs</strong>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Log comments summary */}
                              {report.notes && (
                                <p className="text-xs text-slate-500 bg-orange-50/40 border border-orange-100/40 p-2 rounded-lg mb-2 font-sans">
                                  ✍️ *ریمارکس:* {report.notes}
                                </p>
                              )}

                              {/* Final Status */}
                              <div className={`p-2 rounded-lg flex justify-between items-center text-xs font-sans border ${
                                isProfit 
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-100" 
                                  : "bg-rose-50 text-rose-900 border-rose-100"
                              }`}>
                                <span className="font-bold">خالص بچت کی تفصیل:</span>
                                <strong className="text-sm font-extrabold" style={{ direction: "ltr" }}>
                                  {isProfit ? "کل نفع" : "کل نقصان"}: {Math.abs(report.profit).toLocaleString()} Rs
                                </strong>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Business advice banner at the very bottom of workspace */}
          <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-800 font-sans leading-relaxed text-center">
            ”کاروبار میں برکت پانے کے لیے ہمیشہ سچائی، امانت داری، اور روزانہ محنت اور ایمانداری سے حساب لکھ کر حاصل ہوتی ہے۔ گاہک کو اچھے اخلاق سے ڈیل کریں۔“
          </div>

          {/* Elegant layout footer */}
          <footer className="mt-12 text-center py-4 border-t border-slate-200">
            <p className="text-slate-400 font-sans text-xs">
              © {new Date().getFullYear()} ایم نوید چسکا پوائنٹ، رینالہ کلاں۔ موبائل ڈیجیٹل اسسٹنٹ بذریعہ آپریٹر۔
            </p>
          </footer>

        </main>

      </div>
    </div>
  );
}
