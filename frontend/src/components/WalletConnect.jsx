import { useState, useEffect } from "react";
import { connectWallet } from "../utils/contract";

export default function WalletConnect({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError("");
      const { provider, signer, address, contract } = await connectWallet();
      onConnect({ provider, signer, address, contract });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 glass-panel rounded-xl mt-8">
      <div className="w-16 h-16 bg-eth-green/20 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🦊</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
      <p className="text-secondary dark:text-dark-muted text-center mb-6 max-w-md">
        Netsanet uses MetaMask to authenticate you and derive your personal
        encryption key. No usernames, no passwords.
      </p>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary text-lg px-8 py-3 disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect MetaMask"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-error rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
