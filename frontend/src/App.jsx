import { useState, useEffect } from "react";
import WalletConnect from "./components/WalletConnect";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
function App() {
  const [role, setRole] = useState("patient"); // 'patient' or 'doctor'
  const [walletState, setWalletState] = useState(null); // { provider, signer, address, contract }
  const [darkMode, setDarkMode] = useState(true); // Dark mode default

  // Auto-refresh the app if user switches MetaMask accounts
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
    } else {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
    }
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-slate-50 text-slate-900"}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header containing Logo & Role Toggle */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 glass-panel px-6 py-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-eth-green to-eth-yellow flex items-center justify-center shadow-lg pt-1">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-eth-green to-eth-yellow">
                Netsanet
              </h1>
              <p
                className={`text-[10px] uppercase tracking-widest font-semibold ${darkMode ? "text-dark-muted" : "text-slate-500"}`}
              >
                Patient-Owned Medical Records
              </p>
            </div>
          </div>

          {/* Role Toggle Switch */}
          <div
            className={`flex shadow-sm p-1 rounded-lg border ${darkMode ? "bg-dark-surface border-dark-border" : "bg-white border-slate-200"}`}
          >
            <button
              onClick={() => setRole("patient")}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                role === "patient"
                  ? `${darkMode ? "bg-dark-card text-eth-green shadow-lg" : "bg-white text-eth-green shadow-md"}`
                  : `${darkMode ? "text-dark-muted hover:text-dark-text" : "text-slate-500 hover:text-slate-900"}`
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => setRole("doctor")}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                role === "doctor"
                  ? `${darkMode ? "bg-dark-card text-eth-yellow shadow-lg" : "bg-white text-eth-yellow shadow-md"}`
                  : `${darkMode ? "text-dark-muted hover:text-dark-text" : "text-slate-500 hover:text-slate-900"}`
              }`}
            >
              Doctor / Clinic
            </button>
          </div>

          {/* Dark Mode Toggle & Wallet Status */}
          <div className="flex items-center gap-4">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 ${
                darkMode
                  ? "bg-dark-surface text-dark-text hover:bg-slate-600"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Light</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Wallet Status indicator */}
            {walletState && (
              <div
                className={`flex items-center gap-4 shadow-sm px-4 py-1.5 rounded-full border ${darkMode ? "bg-dark-surface border-dark-border" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-eth-green animate-pulse"></span>
                  <span
                    className={`text-xs font-mono ${darkMode ? "text-dark-muted" : "text-slate-500"}`}
                  >
                    {walletState.address.substring(0, 6)}...
                    {walletState.address.substring(38)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setWalletState(null);
                    setRole("patient");
                  }}
                  className={`text-xs bg-transparent shadow-none p-0 ml-2 transition-colors ${
                    darkMode
                      ? "text-red-400 hover:text-red-300"
                      : "text-red-500 hover:text-red-700"
                  }`}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main>
          {!walletState ? (
            // User must connect their MetaMask first
            <WalletConnect onConnect={(state) => setWalletState(state)} />
          ) : (
            // Connected: Render both to preserve state, hide via CSS based on toggle
            <>
              <div style={{ display: role === "patient" ? "block" : "none" }}>
                <PatientDashboard
                  provider={walletState.provider}
                  signer={walletState.signer}
                  address={walletState.address}
                  contract={walletState.contract}
                />
              </div>
              <div style={{ display: role === "doctor" ? "block" : "none" }}>
                <DoctorDashboard
                  provider={walletState.provider}
                  signer={walletState.signer}
                  address={walletState.address}
                  contract={walletState.contract}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
