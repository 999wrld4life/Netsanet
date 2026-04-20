import { useState } from "react";
import DoctorQRScanner from "../components/DoctorQRScanner";
import DoctorAccessManager from "../components/DoctorAccessManager";
import RecordSubmissionForm from "../components/RecordSubmissionForm";
import DoctorMedicalTimeline from "../components/DoctorMedicalTimeline";

export default function DoctorDashboard({
  provider,
  signer,
  address,
  contract,
}) {
  // patientData will hold { address: string, base64Key: string | null }
  const [scannedPatient, setScannedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // When patient QR is scanned
  const handleScan = (patientData) => {
    setScannedPatient(patientData);
  };

  const handleClearPatient = () => {
    setScannedPatient(null);
  };

  const handleRecordAdded = async (cid, category, recordType) => {
    try {
      const tx = await contract.addRecord(
        scannedPatient.address,
        cid,
        category,
        recordType,
      );
      await tx.wait();
      alert("Record stored on-chain successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to save on chain: " + err.message);
      throw err; // throw back to form so it stops loading state
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center dark:bg-dark-surface bg-slate-50 p-4 rounded-xl border dark:border-dark-border border-slate-300 shadow-sm">
        <h2 className="text-xl font-bold text-eth-yellow">Doctor Dashboard</h2>
        <span className="text-xs text-dark-muted font-mono dark:bg-dark-card bg-white shadow-sm px-3 py-1 rounded border dark:border-dark-border border-slate-200">
          Clinic: {address}
        </span>
      </div>

      {!scannedPatient ? (
        <DoctorQRScanner onScan={handleScan} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center dark:bg-dark-card bg-white shadow-sm p-4 rounded-xl border dark:border-dark-border border-slate-200">
            <div>
              <p className="text-sm text-secondary">Active Patient</p>
              <p className="font-mono text-sm">{scannedPatient.address}</p>
              {scannedPatient.base64Key && (
                <p className="text-xs text-eth-green mt-1">
                  ✓ Encryption Key Received
                </p>
              )}
            </div>
            <button
              onClick={handleClearPatient}
              className="btn-danger text-xs px-4 py-2"
            >
              Close Session
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <DoctorAccessManager
                contract={contract}
                doctorAddress={address}
                patientAddress={scannedPatient.address}
              />
              <RecordSubmissionForm
                patientAddress={scannedPatient.address}
                base64Key={scannedPatient.base64Key}
                onRecordAdded={handleRecordAdded}
              />
            </div>

            <div className="lg:col-span-2">
              {/* key prop forces full re-mount and re-fetch of timeline when refreshKey changes */}
              <DoctorMedicalTimeline
                key={refreshKey}
                contract={contract}
                doctorAddress={address}
                patientAddress={scannedPatient.address}
                base64Key={scannedPatient.base64Key}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
