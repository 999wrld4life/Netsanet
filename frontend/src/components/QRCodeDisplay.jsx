import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeDisplay({ address, base64Key }) {
  if (!address) return null;

  // Embebding the symmetric key in the QR code is explicitly a Hackathon MVP shortcut
  // to allow the doctor's frontend to encrypt/decrypt records without doing a full
  // asymmetric key exchange.
  const qrValue = base64Key ? `netsanet:${address}:${base64Key}` : address;

  return (
    <div className="glass-panel p-6 rounded-xl border dark:border-dark-border border-slate-200 flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-2">Your Medical ID</h3>
      <p className="text-sm text-dark-muted text-center mb-6">
        Show this QR code to a doctor so they can request access to your records
        or add new ones.
      </p>

      <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-eth-yellow mb-4">
        <QRCodeSVG
          value={qrValue}
          size={180}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={false}
        />
      </div>

      <div className="dark:bg-dark-surface bg-slate-50 px-4 py-2 rounded-lg font-mono text-xs text-dark-muted break-all w-full text-center">
        {address}
      </div>

      {qrValue && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(qrValue);
            alert(
              "QR String copied to clipboard! Switch to Doctor view and paste it in the scanner.",
            );
          }}
          className="mt-4 w-full btn-secondary text-sm"
        >
          📄 Copy QR String for Testing
        </button>
      )}
    </div>
  );
}
