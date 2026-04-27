import { useState } from "react";
import { submitRecord, CATEGORY_LABELS } from "../utils/records";
import { importKeyFromBase64 } from "../utils/encryption";

export default function RecordSubmissionForm({
  patientAddress,
  base64Key,
  onRecordAdded,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("0");
  const [recordType, setRecordType] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medication, setMedication] = useState("");
  const [cd4Count, setCd4Count] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!base64Key) {
      setError(
        "Cannot submit record without decrypting the session (missing patient key).",
      );
      return;
    }

    if (!recordType) {
      setError("Title/Record Type is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const cryptoKey = await importKeyFromBase64(base64Key);
      const recordData = {
        diagnosis,
        medication,
        cd4Count,
        notes,
      };

      const cid = await submitRecord(
        cryptoKey,
        recordData,
        patientAddress,
        CATEGORY_LABELS[category],
        recordType,
      );

      await onRecordAdded(cid, category, recordType);

      setCategory("0");
      setRecordType("");
      setDiagnosis("");
      setMedication("");
      setCd4Count("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setError(`Failed to submit record: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel px-6 py-7 sm:px-7">
      <p className="section-kicker">Record authoring</p>
      <h3 className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
        Add a new record
      </h3>
      <p className="panel-copy mt-3">
        Encrypt with the patient's shared session key, upload the payload to
        IPFS, and write the CID on-chain from this session.
      </p>

      {!base64Key && (
        <div className="mt-5 rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          A patient key is required to encrypt records. Missing key.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Category
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Record type / title
          </label>
          <input
            type="text"
            required
            value={recordType}
            onChange={(event) => setRecordType(event.target.value)}
            placeholder="e.g. CD4 Checkup, MRI Scan..."
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Diagnosis
          </label>
          <textarea
            rows="3"
            value={diagnosis}
            onChange={(event) => setDiagnosis(event.target.value)}
            placeholder="e.g. Type 2 Diabetes"
            className="min-h-[96px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Medication
            </label>
            <textarea
              rows="3"
              value={medication}
              onChange={(event) => setMedication(event.target.value)}
              placeholder="e.g. Metformin 500mg"
              className="min-h-[96px] resize-y"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Vitals / CD4 count
            </label>
            <textarea
              rows="3"
              value={cd4Count}
              onChange={(event) => setCd4Count(event.target.value)}
              placeholder="e.g. 600"
              className="min-h-[96px] resize-y"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Doctor notes
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Observations, next steps..."
          />
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !base64Key}
          className="btn-secondary w-full disabled:opacity-50"
        >
          {loading ? "Encrypting & Storing..." : "Sign & Submit Record"}
        </button>
      </form>
    </div>
  );
}
