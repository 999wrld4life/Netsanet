import { useEffect, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../utils/records";

const REQUEST_STATUS = {
  NONE: 0,
  PENDING: 1,
  APPROVED: 2,
  DECLINED: 3,
};

function getErrorMessage(error, fallbackMessage) {
  return error?.reason || error?.shortMessage || error?.message || fallbackMessage;
}

function formatDate(timestampSeconds) {
  if (!timestampSeconds) {
    return "No timestamp";
  }

  return new Date(Number(timestampSeconds) * 1000).toLocaleString();
}

function getCategoryViewModel(categoryData) {
  if (!categoryData) {
    return {
      label: "Checking...",
      badgeClassName: "text-secondary bg-slate-200",
      helperText: "",
      canRequest: false,
      requestLabel: "Request Access",
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const requestStatus = categoryData.requestExists
    ? Number(categoryData.request.status)
    : REQUEST_STATUS.NONE;

  if (categoryData.hasAccess) {
    return {
      label: "Granted",
      badgeClassName: "text-success bg-green-900/20",
      helperText: `Active until ${formatDate(categoryData.grant.expiresAt)}`,
      canRequest: false,
      requestLabel: "Request Access",
    };
  }

  if (requestStatus === REQUEST_STATUS.PENDING) {
    return {
      label: "Pending",
      badgeClassName: "text-eth-yellow bg-eth-yellow/15",
      helperText: `Waiting for patient response on ${formatDate(
        categoryData.request.requestedAt,
      )} for ${Number(categoryData.request.requestedDurationHours)} hours`,
      canRequest: false,
      requestLabel: "Request Access",
    };
  }

  if (categoryData.grantExists && categoryData.grant.revoked) {
    return {
      label: "Revoked",
      badgeClassName: "text-error bg-red-900/20",
      helperText: "Access was revoked by the patient.",
      canRequest: true,
      requestLabel: "Request Again",
    };
  }

  if (categoryData.grantExists && now >= Number(categoryData.grant.expiresAt)) {
    return {
      label: "Expired",
      badgeClassName: "text-slate-400 bg-slate-500/10",
      helperText: `Previous access ended on ${formatDate(
        categoryData.grant.expiresAt,
      )}`,
      canRequest: true,
      requestLabel: "Request Again",
    };
  }

  if (requestStatus === REQUEST_STATUS.DECLINED) {
    return {
      label: "Declined",
      badgeClassName: "text-error bg-red-900/20",
      helperText: `Patient declined this request on ${formatDate(
        categoryData.request.respondedAt,
      )}`,
      canRequest: true,
      requestLabel: "Request Again",
    };
  }

  return {
    label: "Not Granted",
    badgeClassName: "text-slate-400 bg-slate-500/10",
    helperText: "Request access to let the patient approve this category.",
    canRequest: true,
    requestLabel: "Request Access",
  };
}

export default function DoctorAccessManager({
  contract,
  doctorAddress,
  patientAddress,
}) {
  const [categoryStates, setCategoryStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState("");
  const [openRequestCategory, setOpenRequestCategory] = useState(null);
  const [requestDuration, setRequestDuration] = useState("24");
  const [submittingCategory, setSubmittingCategory] = useState(null);

  const fetchAccessStatuses = async () => {
    try {
      setLoading(true);
      setPanelError("");

      const entries = await Promise.all(
        Object.keys(CATEGORY_LABELS).map(async (catId) => {
          const [hasAccess, grantResult, requestResult] = await Promise.all([
            contract.hasActiveAccess(patientAddress, doctorAddress, catId),
            contract.getGrantDetails(patientAddress, doctorAddress, catId),
            contract.getAccessRequestDetails(patientAddress, doctorAddress, catId),
          ]);

          const [grant, grantExists] = grantResult;
          const [request, requestExists] = requestResult;

          return [
            catId,
            {
              hasAccess,
              grant,
              grantExists,
              request,
              requestExists,
            },
          ];
        }),
      );

      setCategoryStates(Object.fromEntries(entries));
    } catch (error) {
      console.error("Failed to fetch doctor access state:", error);
      setPanelError(
        getErrorMessage(
          error,
          "Failed to fetch category access for this patient session.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && patientAddress && doctorAddress) {
      fetchAccessStatuses();
    }
  }, [contract, patientAddress, doctorAddress]);

  const handleStartRequest = (catId, existingRequest) => {
    setOpenRequestCategory(catId);
    setRequestDuration(
      existingRequest?.requestedDurationHours
        ? String(Number(existingRequest.requestedDurationHours))
        : "24",
    );
    setPanelError("");
  };

  const handleSubmitRequest = async (event, catId) => {
    event.preventDefault();

    try {
      setSubmittingCategory(catId);
      setPanelError("");

      const tx = await contract.requestAccess(
        patientAddress,
        parseInt(catId, 10),
        parseInt(requestDuration, 10),
      );
      await tx.wait();

      setOpenRequestCategory(null);
      setRequestDuration("24");
      await fetchAccessStatuses();
    } catch (error) {
      console.error("Failed to submit access request:", error);
      setPanelError(
        getErrorMessage(
          error,
          "Failed to submit the access request. Please try again.",
        ),
      );
    } finally {
      setSubmittingCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse text-secondary">
        Checking access permissions...
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl border dark:border-dark-border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Category Access</h3>
        <button onClick={fetchAccessStatuses} className="text-xs btn-ghost">
          Refresh
        </button>
      </div>

      <p className="text-sm text-dark-muted mb-4">
        You can only view records for categories where the patient has granted
        access. For missing categories, request the category and duration here,
        then wait for the patient to approve or decline it.
      </p>

      {panelError && (
        <div className="mb-4 text-xs text-error bg-red-900/20 border border-red-900/40 rounded-lg p-3">
          {panelError}
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(CATEGORY_LABELS).map(([catId, label]) => {
          const color = CATEGORY_COLORS[catId] || "#ccc";
          const categoryData = categoryStates[catId];
          const viewModel = getCategoryViewModel(categoryData);
          const isFormOpen = openRequestCategory === catId;
          const isSubmitting = submittingCategory === catId;

          return (
            <div
              key={catId}
              className={`p-4 rounded-lg border ${
                categoryData?.hasAccess
                  ? "dark:bg-dark-surface bg-white shadow-sm dark:border-dark-border border-slate-300"
                  : "bg-transparent dark:border-dark-border border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className={`text-sm ${
                        categoryData?.hasAccess
                          ? "font-semibold"
                          : "text-dark-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="text-xs text-secondary">{viewModel.helperText}</div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${viewModel.badgeClassName}`}
                  >
                    {viewModel.label}
                  </span>

                  {viewModel.canRequest && !isFormOpen && (
                    <button
                      onClick={() =>
                        handleStartRequest(catId, categoryData?.request)
                      }
                      className="text-xs text-eth-yellow underline hover:text-yellow-300"
                    >
                      {viewModel.requestLabel}
                    </button>
                  )}
                </div>
              </div>

              {viewModel.canRequest && isFormOpen && (
                <form
                  onSubmit={(event) => handleSubmitRequest(event, catId)}
                  className="mt-4 pt-4 border-t dark:border-dark-border border-slate-200 space-y-3"
                >
                  <div className="flex gap-3 items-end">
                    <div className="w-28">
                      <label className="block text-xs text-secondary mb-1">
                        Hours
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        required
                        value={requestDuration}
                        onChange={(event) => setRequestDuration(event.target.value)}
                        className="w-full rounded p-2 text-sm"
                      />
                    </div>

                    <div className="flex-1 text-xs text-secondary pb-1">
                      The patient will receive this request with your selected
                      duration.
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                    >
                      {isSubmitting ? "Sending..." : "Send Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenRequestCategory(null);
                        setRequestDuration("24");
                      }}
                      disabled={isSubmitting}
                      className="btn-ghost text-xs px-4 py-2 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
