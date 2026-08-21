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
} satisfies InstantRules;

export default rules;
