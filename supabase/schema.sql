-- ============================================
-- LYNTO Supabase Schema
-- Healthcare Observation & Alert Management
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('manager', 'carer', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE admin_role AS ENUM ('primary_admin', 'admin', 'readonly_admin');
CREATE TYPE agency_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE client_status AS ENUM ('active', 'inactive');
CREATE TYPE risk_level AS ENUM ('green', 'amber', 'red');
CREATE TYPE alert_action AS ENUM ('monitor', 'called_family', 'informed_gp', 'community_nurse', 'emergency_escalation');

CREATE TYPE carer_deactivation_reason AS ENUM (
  'left_organisation',
  'on_long_term_leave',
  'internal_decision'
);

CREATE TYPE client_deactivation_reason AS ENUM (
  'moved_to_another_provider',
  'deceased',
  'no_longer_receiving_service',
  'other'
);

CREATE TYPE activity_event_type AS ENUM (
  'agency_created',
  'agency_status_changed',
  'carer_created',
  'carer_deactivated',
  'carer_reactivated',
  'client_created',
  'client_deactivated',
  'client_reactivated',
  'admin_created',
  'admin_deactivated',
  'admin_reactivated',
  'admin_login',
  'admin_logout'
);

-- ============================================
-- TABLES
-- ============================================

-- Agencies (must be created first - no dependencies)
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status agency_status NOT NULL DEFAULT 'pending',
  contact_email TEXT,
  contact_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform Admins (separate from agency users)
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  admin_role admin_role NOT NULL DEFAULT 'readonly_admin',
  status user_status NOT NULL DEFAULT 'active',
  deactivation_reason TEXT,
  deactivated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (managers and carers within agencies)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'pending',
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  deactivation_reason carer_deactivation_reason,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update agencies to reference manager
ALTER TABLE agencies ADD COLUMN manager_id UUID REFERENCES users(id);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  internal_reference TEXT,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  status client_status NOT NULL DEFAULT 'active',
  deactivation_reason client_deactivation_reason,
  deactivation_note TEXT,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Carer-Client assignments (many-to-many)
CREATE TABLE carer_client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(carer_id, client_id)
);

-- Visit Entries
CREATE TABLE visit_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  carer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Symptoms (stored as array of symptom IDs)
  selected_symptom_ids TEXT[] NOT NULL DEFAULT '{}',

  -- Vitals
  temperature DECIMAL(4,1),
  pulse INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  oxygen_saturation INTEGER,
  respiratory_rate INTEGER,

  -- Notes and scoring
  note TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'green',
  reasons TEXT[] NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Correction Notes (for visit entries)
CREATE TABLE correction_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_entry_id UUID NOT NULL REFERENCES visit_entries(id) ON DELETE CASCADE,
  carer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_entry_id UUID NOT NULL REFERENCES visit_entries(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  carer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  risk_level risk_level NOT NULL CHECK (risk_level IN ('amber', 'red')),

  -- Review status
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken alert_action,
  manager_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Log (platform-wide)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type activity_event_type NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  agency_name TEXT,
  entity_id UUID,
  entity_name TEXT,
  performed_by UUID NOT NULL,
  performed_by_name TEXT NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_agency ON users(agency_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_auth_user ON users(auth_user_id);

-- Clients
CREATE INDEX idx_clients_agency ON clients(agency_id);
CREATE INDEX idx_clients_status ON clients(status);

-- Carer-Client Assignments
CREATE INDEX idx_assignments_carer ON carer_client_assignments(carer_id);
CREATE INDEX idx_assignments_client ON carer_client_assignments(client_id);

-- Visit Entries
CREATE INDEX idx_visits_client ON visit_entries(client_id);
CREATE INDEX idx_visits_carer ON visit_entries(carer_id);
CREATE INDEX idx_visits_agency ON visit_entries(agency_id);
CREATE INDEX idx_visits_created ON visit_entries(created_at DESC);
CREATE INDEX idx_visits_risk ON visit_entries(risk_level);

-- Alerts
CREATE INDEX idx_alerts_agency ON alerts(agency_id);
CREATE INDEX idx_alerts_client ON alerts(client_id);
CREATE INDEX idx_alerts_reviewed ON alerts(is_reviewed);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_risk ON alerts(risk_level);

-- Activity Log
CREATE INDEX idx_activity_agency ON activity_log(agency_id);
CREATE INDEX idx_activity_type ON activity_log(event_type);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE carer_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current user's agency_id
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: Check if current user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- RLS POLICIES: AGENCIES
-- ============================================

-- Platform admins can see all agencies
CREATE POLICY "Admins can view all agencies"
  ON agencies FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Users can see their own agency
CREATE POLICY "Users can view own agency"
  ON agencies FOR SELECT
  TO authenticated
  USING (id = get_user_agency_id());

-- Platform admins can manage agencies
CREATE POLICY "Admins can manage agencies"
  ON agencies FOR ALL
  TO authenticated
  USING (is_platform_admin());

-- ============================================
-- RLS POLICIES: USERS
-- ============================================

-- Users can see others in their agency
CREATE POLICY "Users can view agency members"
  ON users FOR SELECT
  TO authenticated
  USING (agency_id = get_user_agency_id() OR is_platform_admin());

-- Managers can manage carers in their agency
CREATE POLICY "Managers can manage agency users"
  ON users FOR ALL
  TO authenticated
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() = 'manager')
    OR is_platform_admin()
  );

-- ============================================
-- RLS POLICIES: CLIENTS
-- ============================================

-- Users can see clients in their agency
CREATE POLICY "Users can view agency clients"
  ON clients FOR SELECT
  TO authenticated
  USING (agency_id = get_user_agency_id() OR is_platform_admin());

-- Managers can manage clients
CREATE POLICY "Managers can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() = 'manager')
    OR is_platform_admin()
  );

-- ============================================
-- RLS POLICIES: CARER-CLIENT ASSIGNMENTS
-- ============================================

-- Users can see assignments in their agency
CREATE POLICY "Users can view assignments"
  ON carer_client_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = carer_client_assignments.carer_id
      AND users.agency_id = get_user_agency_id()
    )
    OR is_platform_admin()
  );

-- Managers can manage assignments
CREATE POLICY "Managers can manage assignments"
  ON carer_client_assignments FOR ALL
  TO authenticated
  USING (
    (get_user_role() = 'manager' AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = carer_client_assignments.carer_id
      AND users.agency_id = get_user_agency_id()
    ))
    OR is_platform_admin()
  );

-- ============================================
-- RLS POLICIES: VISIT ENTRIES
-- ============================================

-- Users can see visits in their agency
CREATE POLICY "Users can view agency visits"
  ON visit_entries FOR SELECT
  TO authenticated
  USING (agency_id = get_user_agency_id() OR is_platform_admin());

-- Carers can create visits
CREATE POLICY "Carers can create visits"
  ON visit_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    agency_id = get_user_agency_id()
    AND carer_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: CORRECTION NOTES
-- ============================================

-- Users can see correction notes for their agency's visits
CREATE POLICY "Users can view correction notes"
  ON correction_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visit_entries
      WHERE visit_entries.id = correction_notes.visit_entry_id
      AND visit_entries.agency_id = get_user_agency_id()
    )
    OR is_platform_admin()
  );

-- Carers can add correction notes to their own visits
CREATE POLICY "Carers can add corrections"
  ON correction_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    carer_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM visit_entries
      WHERE visit_entries.id = correction_notes.visit_entry_id
      AND visit_entries.carer_id = carer_id
    )
  );

-- ============================================
-- RLS POLICIES: ALERTS
-- ============================================

-- Users can see alerts in their agency
CREATE POLICY "Users can view agency alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (agency_id = get_user_agency_id() OR is_platform_admin());

-- Managers can update alerts (review)
CREATE POLICY "Managers can review alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    (agency_id = get_user_agency_id() AND get_user_role() = 'manager')
    OR is_platform_admin()
  );

-- ============================================
-- RLS POLICIES: PLATFORM ADMINS
-- ============================================

-- Only admins can see admin list
CREATE POLICY "Admins can view admins"
  ON platform_admins FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Only primary admins can manage admins
CREATE POLICY "Primary admins can manage admins"
  ON platform_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE auth_user_id = auth.uid()
      AND admin_role = 'primary_admin'
      AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES: ACTIVITY LOG
-- ============================================

-- Only admins can view activity log
CREATE POLICY "Admins can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- System can insert activity log entries
CREATE POLICY "System can log activities"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create alert when visit entry has amber/red risk
CREATE OR REPLACE FUNCTION create_alert_on_risk()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_level IN ('amber', 'red') THEN
    INSERT INTO alerts (
      visit_entry_id,
      client_id,
      carer_id,
      agency_id,
      risk_level
    ) VALUES (
      NEW.id,
      NEW.client_id,
      NEW.carer_id,
      NEW.agency_id,
      NEW.risk_level
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_alert
  AFTER INSERT ON visit_entries
  FOR EACH ROW EXECUTE FUNCTION create_alert_on_risk();

-- ============================================
-- VIEWS (for convenience)
-- ============================================

-- Agency stats view
CREATE OR REPLACE VIEW agency_stats AS
SELECT
  a.id,
  a.name,
  a.status,
  a.contact_email,
  a.contact_name,
  a.created_at,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'carer') AS total_carers,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'carer' AND u.status = 'active') AS active_carers,
  COUNT(DISTINCT c.id) AS total_clients,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_clients,
  COUNT(DISTINCT al.id) AS total_alerts,
  COUNT(DISTINCT al.id) FILTER (WHERE al.is_reviewed = FALSE) AS unreviewed_alerts,
  MAX(v.created_at) AS last_activity_at
FROM agencies a
LEFT JOIN users u ON u.agency_id = a.id
LEFT JOIN clients c ON c.agency_id = a.id
LEFT JOIN alerts al ON al.agency_id = a.id
LEFT JOIN visit_entries v ON v.agency_id = a.id
GROUP BY a.id;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- To seed data, run these after schema creation:
-- INSERT INTO agencies (name, status, contact_email, contact_name)
-- VALUES ('Sunrise Care Services', 'active', 'sarah.jones@sunrisecare.co.uk', 'Sarah Jones');
