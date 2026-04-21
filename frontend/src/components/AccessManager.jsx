import { useEffect, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../utils/records";

function truncateAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.substring(0, 8)}...${address.substring(38)}`;
}

function formatDate(timestampSeconds) {
  if (!timestampSeconds) {
    return "Just now";
  }

  return new Date(Number(timestampSeconds) * 1000).toLocaleString();
}

function getErrorMessage(error, fallbackMessage) {
  return error?.reason || error?.shortMessage || error?.message || fallbackMessage;
}

export default function AccessManager({ contract, address }) {
  const [grants, setGrants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestActionKey, setRequestActionKey] = useState(null);

  const [showGrantForm, setShowGrantForm] = useState(false);
  const [newDocAddress, setNewDocAddress] = useState("");
  const [newCat, setNewCat] = useState("0");
  const [newDuration, setNewDuration] = useState("24");
  const [granting, setGranting] = useState(false);

  const fetchAccessData = async () => {
    try {
      setLoading(true);

      const [grantData, pendingRequestData] = await Promise.all([
        contract.getMyAccessGrants(),
        contract.getMyPendingAccessRequests(),
      ]);

      setGrants(grantData);
      setPendingRequests(pendingRequestData);
    } catch (error) {
      console.error("Failed to load access data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && address) {
      fetchAccessData();
    }
  }, [contract, address]);

  const handleRevoke = async (doctor, category) => {
    try {
      const tx = await contract.revokeAccess(doctor, category);
      await tx.wait();
      await fetchAccessData();
    } catch (error) {
      console.error("Failed to revoke access:", error);
      alert(
        getErrorMessage(
          error,
          "Failed to revoke access. Ensure it is not already expired or revoked.",
        ),
      );
    }
  };

  const handleGrant = async (event) => {
    event.preventDefault();

    if (!newDocAddress.trim()) {
      return;
    }

    try {
      setGranting(true);

      const tx = await contract.grantAccess(
        newDocAddress.trim(),
        parseInt(newCat, 10),
        parseInt(newDuration, 10),
      );
      await tx.wait();

      setNewDocAddress("");
      setNewCat("0");
      setNewDuration("24");
      setShowGrantForm(false);
      await fetchAccessData();
    } catch (error) {
      console.error("Failed to grant access:", error);
      alert(
        getErrorMessage(
          error,
          "Failed to grant access. Please check the address and try again.",
        ),
      );
    } finally {
      setGranting(false);
    }
  };

  const handleRequestResponse = async (doctor, category, approve) => {
    const actionKey = `${doctor}-${category}-${approve ? "approve" : "decline"}`;

    try {
      setRequestActionKey(actionKey);
      const tx = await contract.respondToAccessRequest(doctor, category, approve);
      await tx.wait();
      await fetchAccessData();
    } catch (error) {
      console.error("Failed to respond to request:", error);
      alert(
        getErrorMessage(
          error,
          "Failed to respond to the doctor's request. Please try again.",
        ),
      );
    } finally {
      setRequestActionKey(null);
    }
  };

  const getGrantStatus = (grant) => {
    if (grant.revoked) {
      return { text: "Revoked", color: "text-error" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now >= Number(grant.expiresAt)) {
      return { text: "Expired", color: "text-slate-500" };
    }

    return { text: "Active", color: "text-success" };
  };

  if (loading) {
    return (
      <div className="p-4 text-secondary animate-pulse">
        Loading access grants...
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl border dark:border-dark-border border-slate-200 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Who Has Access?</h3>
        <button
          onClick={() => setShowGrantForm((current) => !current)}
          className="text-xs btn-ghost text-eth-green border border-eth-green px-3 py-1 rounded transition-colors hover:border-eth-green"
        >
          {showGrantForm ? "Cancel" : "+ Grant Access"}
        </button>
      </div>

      {showGrantForm && (
        <form
          onSubmit={handleGrant}
          className="dark:bg-dark-card bg-white shadow-sm p-4 rounded-lg border dark:border-dark-border border-slate-300 space-y-3"
        >
          <div>
            <label className="block text-xs text-secondary mb-1">
              Doctor Wallet Address
            </label>
            <input
              type="text"
              required
              value={newDocAddress}
              onChange={(event) => setNewDocAddress(event.target.value)}
              placeholder="0x..."
              className="w-full rounded p-2 text-sm font-mono"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-secondary mb-1">
                Category
              </label>
              <select
                value={newCat}
                onChange={(event) => setNewCat(event.target.value)}
                className="w-full rounded p-2 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label className="block text-xs text-secondary mb-1">Hours</label>
              <input
                type="number"
                required
                min="1"
                max="168"
                value={newDuration}
                onChange={(event) => setNewDuration(event.target.value)}
                className="w-full rounded p-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={granting || !newDocAddress}
            className="w-full btn-primary disabled:opacity-50 mt-2"
          >
            {granting ? "Broadcasting Tx..." : "Authorize Doctor"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-eth-yellow">
            Incoming Requests
          </h4>
          <button onClick={fetchAccessData} className="text-xs btn-ghost">
            Refresh
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-secondary text-sm">
            No pending doctor requests right now.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request, index) => {
              const requestKey = `${request.doctor}-${request.category}-${index}`;
              const color = CATEGORY_COLORS[request.category] || "#ccc";
              const isApproving =
                requestActionKey ===
                `${request.doctor}-${request.category}-approve`;
              const isDeclining =
                requestActionKey ===
                `${request.doctor}-${request.category}-decline`;

              return (
                <div
                  key={requestKey}
                  className="bg-slate-50 dark:bg-dark-surface p-4 rounded-lg border dark:border-dark-border border-slate-300 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-sm">
                      {CATEGORY_LABELS[request.category]}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-secondary">
                    <p className="font-mono" title={request.doctor}>
                      Doctor: {truncateAddress(request.doctor)}
                    </p>
                    <p>Requested for {Number(request.requestedDurationHours)} hours</p>
                    <p>Requested at {formatDate(request.requestedAt)}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleRequestResponse(
                          request.doctor,
                          request.category,
                          true,
                        )
                      }
                      disabled={isApproving || isDeclining}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {isApproving
                        ? "Approving..."
                        : `Accept ${Number(request.requestedDurationHours)}h`}
                    </button>
                    <button
                      onClick={() =>
                        handleRequestResponse(
                          request.doctor,
                          request.category,
                          false,
                        )
                      }
                      disabled={isApproving || isDeclining}
                      className="flex-1 btn-danger disabled:opacity-50"
                    >
                      {isDeclining ? "Declining..." : "Decline"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-eth-green">
          Active And Past Grants
        </h4>

        {grants.length === 0 ? (
          <p className="text-secondary text-sm">
            No one currently has access to your records.
          </p>
        ) : (
          <div className="space-y-4">
            {grants.map((grant, index) => {
              const status = getGrantStatus(grant);
              const isActive = status.text === "Active";

              return (
                <div
                  key={`${grant.doctor}-${grant.category}-${index}`}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-300"
                >
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[grant.category] || "#ccc",
                        }}
                      />
                      <span className="font-medium text-sm">
                        {CATEGORY_LABELS[grant.category]}
                      </span>
                    </div>
                    <p
                      className="text-xs font-mono text-slate-500 mb-1 truncate max-w-[220px]"
                      title={grant.doctor}
                    >
                      Doc: {truncateAddress(grant.doctor)}
                    </p>
                    <p className={`text-xs font-semibold ${status.color}`}>
                      {status.text}
                    </p>
                  </div>

                  {isActive && (
                    <button
                      onClick={() => handleRevoke(grant.doctor, grant.category)}
                      className="btn-danger text-xs px-3 py-1.5"
                    >
                      Revoke Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
