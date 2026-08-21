// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  // Spins are only ever read/written by the server (via the admin SDK in
  // /api/spin), so the weighted draw and the one-spin-per-phone check can't
  // be tampered with from the browser. Lock the client out entirely.
  spins: {
    allow: {
      view: "false",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
  // Settings (which popup fields to ask for) are read through the public
  // /api/settings GET and written only through the password-gated
  // /api/admin/settings route — never directly from the client SDK.
  settings: {
    allow: {
      view: "false",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
  // Companies and prizes follow the same rule as spins/settings above —
  // every read/write goes through password-gated /api/admin/* routes using
  // the admin SDK, never the client SDK.
  companies: {
    allow: {
      view: "false",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
  prizes: {
    allow: {
      view: "false",
      create: "false",
      update: "false",
      delete: "false",
    },
  },
} satisfies InstantRules;

export default rules;
