-- Guide feedback from the Objection Lab. Read and triaged by tools/feedback.py.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  kind TEXT NOT NULL,              -- card | roleplay | general
  target TEXT,                     -- objection id, "persona|objection", or general subtype (bug, idea, missing, other)
  helpful INTEGER,                 -- card: 1 helpful, 0 needs work
  rating_realism INTEGER,          -- roleplay: 1-5
  rating_feedback INTEGER,         -- roleplay: 1-5
  name TEXT,                       -- optional, as the guide typed it
  message TEXT,
  transcript TEXT,                 -- roleplay, only when the guide opted in
  page_version TEXT,
  status TEXT NOT NULL DEFAULT 'new',   -- new | done | wontfix
  resolution TEXT,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS feedback_status ON feedback(status, created_at);
