export async function onRequest(context: any) {
  const { env, request } = context;
  const db = env.RIZZBOT_DATA || env.RIZZBOT || env.RIZZBOT_DB || env.RIZZBOT_D1 || env.RIZZBOT_DATASET;

  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 binding not found. Check your Pages project bindings.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Simple in-function list of migrations. Keep ids stable.
  const migrations: Array<{ id: string; sql: string }> = [
    {
      id: '000_create_migrations_table',
      sql: `
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`,
    },
    // create users and feedback first so sessions can reference users
    {
      id: '002_create_users_and_feedback',
      sql: `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anon_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source TEXT,
  suggestion_type TEXT,
  rating INTEGER,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`,
    },
    {
      id: '001_create_sessions',
      sql: `
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`,
    },
    {
      id: '003_create_personas',
      sql: `
CREATE TABLE IF NOT EXISTS personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  relationship_context TEXT,
  harshness_level INTEGER,
  communication_tips TEXT,
  conversation_starters TEXT,
  things_to_avoid TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS style_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  emoji_usage TEXT,
  capitalization TEXT,
  punctuation TEXT,
  average_length TEXT,
  slang_level TEXT,
  signature_patterns TEXT,
  preferred_tone TEXT,
  raw_samples TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`,
    },
  ];

  try {
    // Ensure migrations table exists (in case it's the first run)
    await db.prepare(migrations[0].sql).run();

    const applied = await db.prepare('SELECT id FROM migrations').all();
    const appliedIds = new Set((applied.results || []).map((r: any) => r.id));

    const appliedNow: string[] = [];

    for (const m of migrations) {
      if (appliedIds.has(m.id)) continue;
      // Run migration SQL
      await db.prepare(m.sql).run();
      // Record it
      await db.prepare('INSERT INTO migrations (id) VALUES (?)').bind(m.id).run();
      appliedNow.push(m.id);
    }

    return new Response(JSON.stringify({ success: true, applied: appliedNow }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
