import { useEffect, useState } from "react";
import {
  submitRecord,
  CATEGORY_LABELS,
  getCategoryFieldSchema,
} from "../utils/records";
import { importKeyFromBase64 } from "../utils/encryption";

function createEmptyFieldState(category) {
  return getCategoryFieldSchema(category).reduce((accumulator, field) => {
    accumulator[field.key] = "";
    return accumulator;
  }, {});
}

export default function RecordSubmissionForm({
  patientAddress,
  base64Key,
  onRecordAdded,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [category, setCategory] = useState("0");
  const [recordType, setRecordType] = useState("");
  const [formValues, setFormValues] = useState(() => createEmptyFieldState("0"));

  const categoryFields = getCategoryFieldSchema(category);

  useEffect(() => {
    setFormValues(createEmptyFieldState(category));
    setError("");
  }, [category]);

  const handleFieldChange = (fieldKey, value) => {
    setFormValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  };

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

    if (!doctorName.trim()) {
      setError("Doctor name is required.");
      return;
    }

    if (!clinicName.trim()) {
      setError("Clinic or hospital name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const cryptoKey = await importKeyFromBase64(base64Key);
      const recordData = Object.fromEntries(
        Object.entries(formValues).filter(([, value]) => value.trim().length > 0),
      );

      const cid = await submitRecord(
        cryptoKey,
        recordData,
        patientAddress,
        CATEGORY_LABELS[category],
        recordType,
        {
          doctorName,
          clinicName,
        },
      );

      await onRecordAdded(cid, category, recordType);

      setCategory("0");
      setRecordType("");
      setFormValues(createEmptyFieldState("0"));
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Doctor Name
            </label>
            <input
              type="text"
              required
              value={doctorName}
              onChange={(event) => setDoctorName(event.target.value)}
              placeholder="e.g. Dr. Amina Hassan"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Clinic / Hospital
            </label>
            <input
              type="text"
              required
              value={clinicName}
              onChange={(event) => setClinicName(event.target.value)}
              placeholder="e.g. Tikur Anbessa Specialized Hospital"
            />
          </div>
        </div>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categoryFields.map((field) => (
            <div
              key={field.key}
              className={field.input === "textarea" ? "sm:col-span-2" : ""}
            >
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {field.label}
              </label>
              {field.input === "textarea" ? (
                <textarea
                  rows={field.rows ?? 3}
                  value={formValues[field.key] ?? ""}
                  onChange={(event) =>
                    handleFieldChange(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                  className="min-h-[96px] resize-y"
                />
              ) : (
                <input
                  type={field.input ?? "text"}
                  value={formValues[field.key] ?? ""}
                  onChange={(event) =>
                    handleFieldChange(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
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
