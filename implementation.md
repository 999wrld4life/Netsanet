# Implementation Plan

Branch confirmed: `qr`

This plan is for review only. No feature implementation has been started yet.

## What I checked first

- Root docs: `README.md` and `SETUP.md`
- Current frontend flow:
  - `frontend/src/components/DoctorQRScanner.jsx`
  - `frontend/src/components/DoctorAccessManager.jsx`
  - `frontend/src/components/AccessManager.jsx`
  - `frontend/src/pages/DoctorDashboard.jsx`
  - `frontend/src/pages/PatientDashboard.jsx`
  - `frontend/src/utils/contract.js`
- Current smart contract and tests:
  - `contracts/src/NetsanetCore.sol`
  - `contracts/test/NetsanetCore.t.sol`

## Current state of the project

### QR scanning

- The QR payload format already exists and is correct:
  - `netsanet:<patientAddress>:<base64Key>`
- The doctor dashboard currently does **not** use the real scanner.
- `DoctorQRScanner.jsx` only shows a fake camera panel and supports manual paste.
- The manual paste flow works and should stay.

### Doctor access requests

- The doctor dashboard has `Request Access` buttons, but they only show an alert.
- The patient dashboard currently grants access manually by entering:
  - doctor address
  - category
  - duration
- The smart contract currently supports:
  - granting access
  - revoking access
  - checking active access
  - reading category-scoped records
- The smart contract currently does **not** support access-request persistence, pending requests, approvals, or declines.

## Recommended implementation direction

I recommend doing this in two layers:

1. Real QR scanning in the frontend
2. Contract-backed doctor access requests

I recommend **contract-backed** requests instead of `localStorage` because requests need to survive refreshes and work across separate patient/doctor sessions or devices. A frontend-only queue would look okay in one browser, but it would break as soon as the patient and doctor are not using the exact same local storage.

## Feature 1: Real QR scanning on the doctor dashboard

### Goal

Let the doctor dashboard scan the same QR payload that the manual paste flow already accepts, while keeping manual paste available.

### Proposed approach

Use the already-installed `html5-qrcode` package for real scanning.

### Scanner behavior

- Keep the existing manual text input and `Connect Patient` button.
- Replace the fake scanner panel with a real scanner experience.
- Support both:
  - live camera scanning from the PC webcam
  - image-file scanning as a fallback
- Reuse the existing QR parsing rules:
  - full Netsanet QR payload
  - raw `0x...` address fallback

### Why include file scanning too

The library in this repo supports both camera scan and local-file scan. Adding both gives a safer demo path:

- show QR on phone screen and scan with PC camera
- or upload a saved photo/screenshot of the QR if camera permission or focus is unreliable

### Planned frontend changes

- `frontend/src/components/DoctorQRScanner.jsx`
  - instantiate and clean up `html5-qrcode`
  - add camera start/stop lifecycle
  - add image upload scan fallback
  - preserve manual input flow
  - preserve current `onScan({ address, base64Key })` contract with parent
- `frontend/src/pages/DoctorDashboard.jsx`
  - no large architectural change expected
  - only minor session/reset handling if needed after a successful live scan

## Feature 2: Doctor requests category access from doctor dashboard

### Goal

Move the access initiation flow to the doctor dashboard:

- doctor requests a category
- patient sees pending requests
- patient accepts or declines
- if accepted, the existing grant system continues to enforce category/time limits

### Important assumption

Revised direction:

- the **doctor requests both the category and the duration**
- the **patient accepts or declines that exact request**
- the patient can still use the existing manual grant form separately when they
  want to grant a different duration directly

## Contract changes needed

This feature is not real yet unless requests are persisted somewhere, so I plan to extend `NetsanetCore.sol`.

### New contract data

Add an `AccessRequest` model, likely with:

- `doctor`
- `category`
- `requestedAt`
- `respondedAt`
- `status`

And a status enum such as:

- `PENDING`
- `APPROVED`
- `DECLINED`

### New contract events

Add events for request lifecycle, for example:

- `AccessRequested`
- `AccessRequestResponded`

### New contract functions

Planned additions:

- `requestAccess(address patient, RecordCategory category)`
  - called by doctor
  - creates a pending request with the doctor's requested duration
- `respondToAccessRequest(address doctor, RecordCategory category, bool approve)`
  - called by patient
  - `approve = true` grants access using the requested duration
  - `approve = false` marks the request declined
- read helpers for UI, likely:
  - patient-facing pending requests getter
  - doctor-facing latest request status getter for a specific patient/category

### Preserve the current manual grant flow

The existing patient-side manual grant form will stay.

To avoid stale pending requests, I plan for one of these behaviors:

- preferred: if a matching pending request exists and the patient manually grants access, treat that request as approved automatically
- otherwise: update the frontend manual grant flow to resolve the request explicitly before or during grant

I prefer the first option because it keeps both workflows consistent even if the contract is used from another UI later.

### Consequence

Because the smart contract ABI and storage layout will change, this will require:

- updating `frontend/src/utils/contract.js`
- rerunning contract tests
- redeploying the contract
- updating `frontend/.env` with the new `VITE_CONTRACT_ADDRESS`

## Frontend changes for doctor requests

### Doctor dashboard

- `frontend/src/components/DoctorAccessManager.jsx`
  - replace the alert-only `Request Access` button with a real contract call
  - show per-category state such as:
    - `Granted`
    - `Pending`
    - `Declined`
    - `Request Access`
  - let the doctor choose the requested duration before submitting
  - refresh request/grant state after each action

### Patient dashboard

- `frontend/src/components/AccessManager.jsx`
  - keep the current manual grant form
  - add a new subsection for incoming doctor requests
  - each request should show:
    - doctor address
    - category
    - requested duration
    - requested time
  - actions:
    - `Accept`
    - `Decline`
  - on accept:
    - use the duration already requested by the doctor
    - call the new contract response flow
  - on decline:
    - mark request declined without granting access

### Contract bindings

- `frontend/src/utils/contract.js`
  - add new ABI entries for request structs/functions/events/getters

### Possible page-level glue

- `frontend/src/pages/DoctorDashboard.jsx`
  - may need a refresh trigger so the access panel updates cleanly after a request
- `frontend/src/pages/PatientDashboard.jsx`
  - likely minimal change unless we want explicit refresh coordination after patient actions

## Testing plan

### Smart contract tests

Extend `contracts/test/NetsanetCore.t.sol` to cover at least:

- doctor can request access for a registered patient
- request is visible to patient
- duplicate pending request for same doctor/category is rejected
- patient can approve request and grant becomes active
- patient can decline request and grant does not become active
- approved request still respects normal expiry behavior
- doctor cannot read records while request is only pending
- manual grant still works
- manual grant resolves a matching pending request if we implement that behavior

### Frontend verification

After implementation, I plan to verify:

- manual QR paste still works
- webcam scan works from doctor dashboard
- image upload scan works
- successful scan still opens the same patient session shape
- doctor can request category access
- patient sees pending request without losing existing manual grant UI
- patient can accept with duration
- patient can decline
- doctor panel reflects pending/approved/declined states
- existing timeline and record submission flows still work

## Files I expect to change

### Contract

- `contracts/src/NetsanetCore.sol`
- `contracts/test/NetsanetCore.t.sol`

### Frontend

- `frontend/src/utils/contract.js`
- `frontend/src/components/DoctorQRScanner.jsx`
- `frontend/src/components/DoctorAccessManager.jsx`
- `frontend/src/components/AccessManager.jsx`
- `frontend/src/pages/DoctorDashboard.jsx`
- possibly `frontend/src/pages/PatientDashboard.jsx`

## Risks to keep in mind

- Contract changes mean redeployment is required.
- Camera permission behavior can differ by browser, so file-upload fallback is important for the demo.
- If we do not persist requests on-chain, the feature will feel incomplete across refresh/device changes.
- We should be careful not to break the already-working manual QR and manual access flows.

## Review points for you

Please confirm whether these assumptions match what you want:

1. Doctor requests only the category; patient chooses duration during approval.
2. Access requests should be persisted on-chain, not only in browser state.
3. The doctor scanner should support both webcam scanning and image-file scanning, while keeping manual paste.

If these are good, I’ll implement from this plan on the `qr` branch only and will not merge anything into `master`.
