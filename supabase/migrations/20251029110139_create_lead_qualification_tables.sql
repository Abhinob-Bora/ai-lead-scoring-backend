/*
  # Lead Qualification System Schema

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `name` (text, product/offer name)
      - `value_props` (jsonb, array of value propositions)
      - `ideal_use_cases` (jsonb, array of ideal use cases)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text, prospect name)
      - `role` (text, job role)
      - `company` (text, company name)
      - `industry` (text, industry)
      - `location` (text, location)
      - `linkedin_bio` (text, LinkedIn bio)
      - `created_at` (timestamp)
    
    - `scoring_results`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `offer_id` (uuid, foreign key to offers)
      - `rule_score` (integer, 0-50 points from rules)
      - `ai_score` (integer, 0-50 points from AI)
      - `total_score` (integer, 0-100 total)
      - `intent` (text, High/Medium/Low)
      - `reasoning` (text, explanation)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a hiring assignment demo)

  3. Indexes
    - Add indexes for foreign keys and frequently queried columns
*/

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value_props jsonb DEFAULT '[]'::jsonb,
  ideal_use_cases jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  company text,
  industry text,
  location text,
  linkedin_bio text,
  created_at timestamptz DEFAULT now()
);

-- Create scoring_results table
CREATE TABLE IF NOT EXISTS scoring_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  rule_score integer DEFAULT 0,
  ai_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  intent text NOT NULL,
  reasoning text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scoring_results_lead_id ON scoring_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_offer_id ON scoring_results(offer_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_intent ON scoring_results(intent);
CREATE INDEX IF NOT EXISTS idx_scoring_results_total_score ON scoring_results(total_score DESC);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY;

-- Public access policies (for demo purposes)
CREATE POLICY "Public can read offers"
  ON offers FOR SELECT
  USING (true);

CREATE POLICY "Public can insert offers"
  ON offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read leads"
  ON leads FOR SELECT
  USING (true);

CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read scoring results"
  ON scoring_results FOR SELECT
  USING (true);

CREATE POLICY "Public can insert scoring results"
  ON scoring_results FOR INSERT
  WITH CHECK (true);