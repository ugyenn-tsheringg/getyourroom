I just finished $ARGUMENTS. Update the three docs for this change only:

- DATA_MODEL.md — any new/changed tables, fields, types, constraints,
  relationships. Skip if the schema didn't change.
- PRD.md — the feature: what it does, who it's for, current state
  (done / partial / stubbed). No schema detail.
- CLAUDE.md — only if a command, convention, or gotcha changed.
  Usually this means no edit. Don't add feature descriptions here.

Verify against the code I actually wrote, not your memory of the
conversation. Touch nothing unrelated to this feature. If a file needs
no change, say so and skip it.

Then show me `git diff` on the docs.