import { useEffect, useId, useRef, useState } from "react";
import { isAddress } from "ethers";
import {
  Html5QrcodeScanType,
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

const INVALID_QR_MESSAGE =
  "Invalid QR code format or Ethereum address. Use the patient's Netsanet QR or a valid 0x address.";

function parsePatientQr(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith("netsanet:")) {
    const parts = trimmedValue.split(":");

    if (parts.length < 3) {
      return null;
    }

    const address = parts[1]?.trim();
    const base64Key = parts.slice(2).join(":").trim();

    if (isAddress(address) && base64Key) {
      return { address, base64Key };
    }

    return null;
  }

  if (isAddress(trimmedValue)) {
    return { address: trimmedValue, base64Key: null };
  }

  return null;
}

export default function DoctorQRScanner({ onScan }) {
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const scannerId = useId().replace(/:/g, "");
  const scannerElementId = `doctor-qr-reader-${scannerId}`;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let isMounted = true;

    const scanner = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          Html5QrcodeScanType.SCAN_TYPE_FILE,
        ],
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      },
      false,
    );

    scannerRef.current = scanner;

    scanner.render(async (decodedText) => {
      const parsedPatient = parsePatientQr(decodedText);

      if (!parsedPatient) {
        if (isMounted) {
          setError(INVALID_QR_MESSAGE);
        }
        return;
      }

      if (isMounted) {
        setError("");
      }

      try {
        await scanner.clear();
      } catch (clearError) {
        console.error("Failed to clear QR scanner after a successful scan:", clearError);
      }

      if (isMounted) {
        onScanRef.current(parsedPatient);
      }
    });

    return () => {
      isMounted = false;

      const activeScanner = scannerRef.current;
      scannerRef.current = null;

      if (activeScanner) {
        activeScanner.clear().catch((clearError) => {
          console.error("Failed to clean up QR scanner:", clearError);
        });
      }
    };
  }, [scannerElementId]);

  const handleManualSubmit = (event) => {
    event.preventDefault();

    const parsedPatient = parsePatientQr(manualInput);

    if (!parsedPatient) {
      setError(INVALID_QR_MESSAGE);
      return;
    }

    setError("");
    onScan(parsedPatient);
  };

  return (
    <div className="glass-panel p-8 rounded-xl border-eth-yellow border-t-4 max-w-2xl mx-auto text-center shadow-xl">
      <div className="w-16 h-16 rounded-full bg-eth-yellow/20 flex items-center justify-center mx-auto mb-4">
        <span className="text-lg font-bold tracking-[0.2em] text-eth-yellow">
          QR
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-2">Scan Patient Medical ID</h2>
      <p className="text-dark-muted mb-6 max-w-lg mx-auto">
        Scan the patient's QR code with your webcam, upload a saved photo of the
        QR image, or paste the full Netsanet QR string manually.
      </p>

      <div className="doctor-qr-reader-shell mb-4">
        <div id={scannerElementId} />
      </div>

      <p className="text-xs text-dark-muted mb-8 max-w-lg mx-auto">
        Tip: for a live demo, open the patient QR on your phone and point your
        PC camera at it. If camera access is unreliable, switch to file scan and
        upload a saved QR photo instead.
      </p>

      <form onSubmit={handleManualSubmit} className="max-w-md mx-auto relative">
        <input
          type="text"
          value={manualInput}
          onChange={(event) => setManualInput(event.target.value)}
          placeholder="netsanet:0x... or 0x..."
          className="w-full shadow-sm rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-eth-yellow transition-colors"
        />
        <button type="submit" className="mt-4 w-full btn-secondary">
          Connect Patient
        </button>
        {error && <p className="text-error text-xs mt-2">{error}</p>}
      </form>
    </div>
  );
}
