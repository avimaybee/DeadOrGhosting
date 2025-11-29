-- Create personas and style_profiles tables
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
