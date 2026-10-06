# Malani Tailor Management — Frontend Prototype

## Interface

The app uses a simple, flat interface with a navy, orange, and olive palette,
subtle borders, and responsive layouts. Existing hover and wizard animations are
preserved. The sun/moon button switches between
light and dark themes and saves the preference in this browser. `ui.js` adds
dashboard summaries using loaded orders: advance collections, outstanding
balances, scheduled deliveries for the last six months, and production stages.

Run `node tests/ui.test.cjs` for view rendering, theme persistence, and summary
checks, and `node tests/wizard-measurements.test.cjs` for the measurement workflow.

A no-backend clickable frontend prototype for a tailoring/order management system.

## Included screens
- Dashboard
- Orders
- Customers
- Measurements
- Production board
- Products & Styles
- Staff
- Reports
- Settings
- Guided New Order wizard:
  Customer → Garment → Measurements → Style → Schedule → Payment → Review → Success

## Run
Simply open `index.html` in a modern browser. No installation or server is required.

For local development you can also run:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000

## Forms and working actions
Customer, product/style, staff, measurement, order editing, and store settings forms include validation. The order wizard saves dates, measurements, styles, payment details, and unique order numbers. Search, status/staff filters, duplication, work queues, production updates, notifications, receipt printing, and CSV exports are connected.

Changes are saved in this browser's local storage. This remains a standalone frontend without shared server storage or authentication. WhatsApp receipts open a preview and link; sending is completed in WhatsApp.

`interactions.js` supplies the functional forms and overrides the initial prototype screens. Keep it loaded after `app.js`.

## Verification
Run `node tests/interactions.test.cjs` to check forms, order validation, rendering, escaping, and persistence. These are logic checks; printing and WhatsApp require browser interaction.
