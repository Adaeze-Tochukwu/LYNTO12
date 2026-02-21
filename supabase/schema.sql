-- ============================================
-- LYNTO - Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type user_role as enum ('manager', 'carer');
create type user_status as enum ('active', 'inactive', 'pending', 'suspended');
create type admin_role as enum ('primary_admin', 'admin', 'readonly_admin');
create type agency_status as enum ('active', 'inactive', 'suspended', 'pending', 'rejected');
create type client_status as enum ('active', 'inactive');
create type risk_level as enum ('green', 'amber', 'red');
create type alert_action as enum ('monitor', 'called_family', 'informed_gp', 'community_nurse', 'emergency_escalation');
create type carer_deactivation_reason as enum ('left_organisation', 'on_long_term_leave', 'internal_decision');
create type client_deactivation_reason as enum ('moved_to_another_provider', 'deceased', 'no_longer_receiving_service', 'other');
create type activity_event_type as enum (
  'agency_created', 'agency_status_changed',
  'carer_created', 'carer_deactivated', 'carer_reactivated',
  'client_created', 'client_deactivated', 'client_reactivated',
  'admin_created', 'admin_deactivated', 'admin_reactivated',
  'admin_login', 'admin_logout'
);

-- ============================================
-- TABLES
-- ============================================

-- Agencies
create table agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status agency_status not null default 'active',
  contact_email text,
  contact_name text,
  notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Platform admins (references auth.users)
create table platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  admin_role admin_role not null default 'admin',
  status user_status not null default 'pending',
  last_login_at timestamptz,
  deactivated_at timestamptz,
  deactivation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users (managers and carers, references auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null,
  status user_status not null default 'pending',
  agency_id uuid not null references agencies(id) on delete cascade,
  deactivation_reason carer_deactivation_reason,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clients
create table clients (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  internal_reference text,
  agency_id uuid not null references agencies(id) on delete cascade,
  status client_status not null default 'active',
  deactivation_reason client_deactivation_reason,
  deactivation_note text,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Carer-client assignments
create table carer_client_assignments (
  id uuid primary key default uuid_generate_v4(),
  carer_id uuid not null references users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(carer_id, client_id)
);

-- Visit entries
create table visit_entries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  carer_id uuid not null references users(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  selected_symptom_ids text[] not null default '{}',
  vitals jsonb not null default '{}',
  note text not null default '',
  score integer not null default 0,
  risk_level risk_level not null default 'green',
  reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Correction notes
create table correction_notes (
  id uuid primary key default uuid_generate_v4(),
  visit_entry_id uuid not null references visit_entries(id) on delete cascade,
  carer_id uuid not null references users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Alerts
create table alerts (
  id uuid primary key default uuid_generate_v4(),
  visit_entry_id uuid not null references visit_entries(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  carer_id uuid not null references users(id) on delete cascade,
  agency_id uuid not null references agencies(id) on delete cascade,
  risk_level risk_level not null check (risk_level in ('amber', 'red')),
  is_reviewed boolean not null default false,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  action_taken alert_action,
  manager_note text,
  created_at timestamptz not null default now()
);

-- Activity log
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  event_type activity_event_type not null,
  agency_id uuid references agencies(id),
  agency_name text,
  entity_id uuid,
  entity_name text,
  performed_by uuid not null,
  performed_by_name text not null,
  reason text,
  timestamp timestamptz not null default now()
);

-- ============================================
-- HELPER FUNCTIONS (used by RLS policies)
-- ============================================

-- Get the agency_id for a user
create or replace function get_user_agency_id(uid uuid)
returns uuid as $$
  select agency_id from users where id = uid limit 1;
$$ language sql security definer stable;

-- Get the role for a user
create or replace function get_user_role(uid uuid)
returns user_role as $$
  select role from users where id = uid limit 1;
$$ language sql security definer stable;

-- Check if a user is a platform admin
create or replace function is_platform_admin(uid uuid)
returns boolean as $$
  select exists(select 1 from platform_admins where id = uid and status = 'active');
$$ language sql security definer stable;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_agencies_updated_at
  before update on agencies
  for each row execute function update_updated_at();

create trigger update_users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger update_clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger update_platform_admins_updated_at
  before update on platform_admins
  for each row execute function update_updated_at();

-- Auto-create alert when visit entry has amber/red risk
create or replace function create_alert_on_risk()
returns trigger as $$
begin
  if new.risk_level in ('amber', 'red') then
    insert into alerts (visit_entry_id, client_id, carer_id, agency_id, risk_level)
    values (new.id, new.client_id, new.carer_id, new.agency_id, new.risk_level);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger create_alert_on_visit_risk
  after insert on visit_entries
  for each row execute function create_alert_on_risk();

-- ============================================
-- VIEWS
-- ============================================

-- Agency stats view (aggregates carers, clients, alerts per agency)
create or replace view agency_stats with (security_invoker = true) as
select
  a.id,
  a.name,
  a.status,
  a.contact_email,
  a.contact_name,
  a.notes,
  a.rejection_reason,
  a.created_at,
  a.updated_at,
  (select u.id from users u where u.agency_id = a.id and u.role = 'manager' limit 1) as manager_id,
  (select count(*) from users u where u.agency_id = a.id and u.role = 'carer') as total_carers,
  (select count(*) from users u where u.agency_id = a.id and u.role = 'carer' and u.status = 'active') as active_carers,
  (select count(*) from clients c where c.agency_id = a.id) as total_clients,
  (select count(*) from clients c where c.agency_id = a.id and c.status = 'active') as active_clients,
  (select count(*) from alerts al where al.agency_id = a.id) as total_alerts,
  (select count(*) from alerts al where al.agency_id = a.id and al.is_reviewed = false) as unreviewed_alerts,
  (select max(act.timestamp) from activity_log act where act.agency_id = a.id) as last_activity_at
from agencies a;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Register a new agency (called after signUp, bypasses RLS)
create or replace function register_agency(
  p_agency_name text,
  p_full_name text,
  p_email text
)
returns json as $$
declare
  v_agency_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check user doesn't already have a profile
  if exists(select 1 from users where id = v_user_id) then
    raise exception 'User already registered';
  end if;

  -- Create the agency (pending until admin approves)
  insert into agencies (name, status, contact_email, contact_name)
  values (p_agency_name, 'pending', p_email, p_full_name)
  returning id into v_agency_id;

  -- Create the manager user (pending until agency is approved)
  insert into users (id, email, full_name, role, status, agency_id)
  values (v_user_id, p_email, p_full_name, 'manager', 'pending', v_agency_id);

  -- Log activity
  insert into activity_log (event_type, agency_id, agency_name, entity_id, entity_name, performed_by, performed_by_name)
  values ('agency_created', v_agency_id, p_agency_name, v_agency_id, p_agency_name, v_user_id, p_full_name);

  return json_build_object('agency_id', v_agency_id, 'user_id', v_user_id);
end;
$$ language plpgsql security definer;

-- Activate an invited user (called when user sets password)
create or replace function activate_user()
returns json as $$
declare
  v_user_id uuid;
  v_found boolean;
begin
  v_user_id := auth.uid();

  -- Try users table first
  update users set status = 'active' where id = v_user_id and status = 'pending'
  returning true into v_found;

  if v_found then
    return json_build_object('activated', true, 'table', 'users');
  end if;

  -- Try platform_admins table
  update platform_admins set status = 'active' where id = v_user_id and status = 'pending'
  returning true into v_found;

  if v_found then
    return json_build_object('activated', true, 'table', 'platform_admins');
  end if;

  return json_build_object('activated', false);
end;
$$ language plpgsql security definer;

-- Get current user profile (works for all user types)
create or replace function get_my_profile()
returns json as $$
declare
  v_user_id uuid;
  v_user_row json;
  v_admin_row json;
  v_agency_row json;
begin
  v_user_id := auth.uid();

  -- Check platform_admins first
  select json_build_object(
    'id', pa.id,
    'email', pa.email,
    'full_name', pa.full_name,
    'admin_role', pa.admin_role,
    'status', pa.status,
    'last_login_at', pa.last_login_at,
    'created_at', pa.created_at
  ) into v_admin_row
  from platform_admins pa where pa.id = v_user_id;

  if v_admin_row is not null then
    return json_build_object('type', 'admin', 'profile', v_admin_row);
  end if;

  -- Check users table
  select json_build_object(
    'id', u.id,
    'email', u.email,
    'full_name', u.full_name,
    'role', u.role,
    'status', u.status,
    'agency_id', u.agency_id,
    'created_at', u.created_at
  ) into v_user_row
  from users u where u.id = v_user_id;

  if v_user_row is not null then
    -- Also get the agency
    select json_build_object(
      'id', a.id,
      'name', a.name,
      'status', a.status,
      'rejection_reason', a.rejection_reason,
      'created_at', a.created_at
    ) into v_agency_row
    from agencies a
    join users u on u.agency_id = a.id
    where u.id = v_user_id;

    return json_build_object('type', 'user', 'profile', v_user_row, 'agency', v_agency_row);
  end if;

  -- No profile found (new user, needs registration)
  return json_build_object('type', 'none');
end;
$$ language plpgsql security definer;

-- Approve a pending agency (admin only)
create or replace function approve_agency(p_agency_id uuid)
returns json as $$
declare
  v_admin_id uuid;
  v_admin_name text;
  v_agency_name text;
begin
  v_admin_id := auth.uid();

  -- Verify caller is a platform admin
  if not is_platform_admin(v_admin_id) then
    raise exception 'Only platform admins can approve agencies';
  end if;

  -- Get admin name
  select full_name into v_admin_name from platform_admins where id = v_admin_id;

  -- Get agency name and verify it's pending
  select name into v_agency_name from agencies where id = p_agency_id and status = 'pending';
  if v_agency_name is null then
    raise exception 'Agency not found or not in pending status';
  end if;

  -- Activate the agency
  update agencies set status = 'active', rejection_reason = null where id = p_agency_id;

  -- Activate the manager user
  update users set status = 'active' where agency_id = p_agency_id and role = 'manager' and status = 'pending';

  -- Log activity
  insert into activity_log (event_type, agency_id, agency_name, entity_id, entity_name, performed_by, performed_by_name, reason)
  values ('agency_status_changed', p_agency_id, v_agency_name, p_agency_id, v_agency_name, v_admin_id, v_admin_name, 'Agency approved');

  return json_build_object('approved', true);
end;
$$ language plpgsql security definer;

-- Reject a pending agency (admin only)
create or replace function reject_agency(p_agency_id uuid, p_reason text)
returns json as $$
declare
  v_admin_id uuid;
  v_admin_name text;
  v_agency_name text;
begin
  v_admin_id := auth.uid();

  -- Verify caller is a platform admin
  if not is_platform_admin(v_admin_id) then
    raise exception 'Only platform admins can reject agencies';
  end if;

  -- Get admin name
  select full_name into v_admin_name from platform_admins where id = v_admin_id;

  -- Get agency name and verify it's pending
  select name into v_agency_name from agencies where id = p_agency_id and (status = 'pending' or status = 'rejected');
  if v_agency_name is null then
    raise exception 'Agency not found or not in pending/rejected status';
  end if;

  -- Reject the agency
  update agencies set status = 'rejected', rejection_reason = p_reason where id = p_agency_id;

  -- Log activity
  insert into activity_log (event_type, agency_id, agency_name, entity_id, entity_name, performed_by, performed_by_name, reason)
  values ('agency_status_changed', p_agency_id, v_agency_name, p_agency_id, v_agency_name, v_admin_id, v_admin_name, 'Agency rejected: ' || coalesce(p_reason, 'No reason provided'));

  return json_build_object('rejected', true);
end;
$$ language plpgsql security definer;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table agencies enable row level security;
alter table platform_admins enable row level security;
alter table users enable row level security;
alter table clients enable row level security;
alter table carer_client_assignments enable row level security;
alter table visit_entries enable row level security;
alter table correction_notes enable row level security;
alter table alerts enable row level security;
alter table activity_log enable row level security;

-- ==================
-- AGENCIES policies
-- ==================

-- Admins can read all agencies
create policy "admin_read_agencies"
  on agencies for select
  using (is_platform_admin(auth.uid()));

-- Manager can read their own agency
create policy "manager_read_own_agency"
  on agencies for select
  using (id = get_user_agency_id(auth.uid()));

-- Admins can update agencies
create policy "admin_update_agencies"
  on agencies for update
  using (is_platform_admin(auth.uid()));

-- ========================
-- PLATFORM_ADMINS policies
-- ========================

-- Admins can read all platform admins
create policy "admin_read_platform_admins"
  on platform_admins for select
  using (is_platform_admin(auth.uid()));

-- Self-read for platform admins
create policy "admin_self_read"
  on platform_admins for select
  using (id = auth.uid());

-- Admins can update platform admins
create policy "admin_update_platform_admins"
  on platform_admins for update
  using (is_platform_admin(auth.uid()));

-- Admins can insert platform admins
create policy "admin_insert_platform_admins"
  on platform_admins for insert
  with check (is_platform_admin(auth.uid()));

-- ================
-- USERS policies
-- ================

-- Manager can read all users in their agency
create policy "manager_read_agency_users"
  on users for select
  using (agency_id = get_user_agency_id(auth.uid()));

-- User can read their own record
create policy "user_self_read"
  on users for select
  using (id = auth.uid());

-- Admin can read all users
create policy "admin_read_all_users"
  on users for select
  using (is_platform_admin(auth.uid()));

-- Manager can insert users in their agency (invite carer)
create policy "manager_insert_agency_users"
  on users for insert
  with check (agency_id = get_user_agency_id(auth.uid()));

-- Manager can update users in their agency
create policy "manager_update_agency_users"
  on users for update
  using (agency_id = get_user_agency_id(auth.uid()));

-- ==================
-- CLIENTS policies
-- ==================

-- Manager can read all clients in their agency
create policy "manager_read_agency_clients"
  on clients for select
  using (agency_id = get_user_agency_id(auth.uid()));

-- Carer can read clients assigned to them
create policy "carer_read_assigned_clients"
  on clients for select
  using (
    exists(
      select 1 from carer_client_assignments
      where carer_id = auth.uid()
      and client_id = clients.id
    )
  );

-- Admin can read all clients
create policy "admin_read_all_clients"
  on clients for select
  using (is_platform_admin(auth.uid()));

-- Manager can insert clients in their agency
create policy "manager_insert_agency_clients"
  on clients for insert
  with check (agency_id = get_user_agency_id(auth.uid()));

-- Manager can update clients in their agency
create policy "manager_update_agency_clients"
  on clients for update
  using (agency_id = get_user_agency_id(auth.uid()));

-- ================================
-- CARER_CLIENT_ASSIGNMENTS policies
-- ================================

-- Manager can read assignments in their agency
create policy "manager_read_agency_assignments"
  on carer_client_assignments for select
  using (agency_id = get_user_agency_id(auth.uid()));

-- Carer can read their own assignments
create policy "carer_read_own_assignments"
  on carer_client_assignments for select
  using (carer_id = auth.uid());

-- Admin can read all assignments
create policy "admin_read_all_assignments"
  on carer_client_assignments for select
  using (is_platform_admin(auth.uid()));

-- Manager can insert assignments in their agency
create policy "manager_insert_agency_assignments"
  on carer_client_assignments for insert
  with check (agency_id = get_user_agency_id(auth.uid()));

-- Manager can delete assignments in their agency
create policy "manager_delete_agency_assignments"
  on carer_client_assignments for delete
  using (agency_id = get_user_agency_id(auth.uid()));

-- =======================
-- VISIT_ENTRIES policies
-- =======================

-- Carer can insert visit entries for assigned clients
create policy "carer_insert_visit_entries"
  on visit_entries for insert
  with check (
    carer_id = auth.uid()
    and exists(
      select 1 from carer_client_assignments
      where carer_id = auth.uid()
      and client_id = visit_entries.client_id
    )
  );

-- Carer can read their own visit entries
create policy "carer_read_own_visit_entries"
  on visit_entries for select
  using (carer_id = auth.uid());

-- Manager can read all visit entries in their agency
create policy "manager_read_agency_visit_entries"
  on visit_entries for select
  using (agency_id = get_user_agency_id(auth.uid()));

-- Admin can read all visit entries
create policy "admin_read_all_visit_entries"
  on visit_entries for select
  using (is_platform_admin(auth.uid()));

-- =========================
-- CORRECTION_NOTES policies
-- =========================

-- Carer can insert correction notes for their own visit entries
create policy "carer_insert_correction_notes"
  on correction_notes for insert
  with check (
    carer_id = auth.uid()
    and exists(
      select 1 from visit_entries
      where id = correction_notes.visit_entry_id
      and carer_id = auth.uid()
    )
  );

-- Read correction notes if you can see the visit entry
create policy "read_correction_notes"
  on correction_notes for select
  using (
    exists(
      select 1 from visit_entries
      where id = correction_notes.visit_entry_id
      and (
        carer_id = auth.uid()
        or agency_id = get_user_agency_id(auth.uid())
        or is_platform_admin(auth.uid())
      )
    )
  );

-- ================
-- ALERTS policies
-- ================

-- Manager can read alerts in their agency
create policy "manager_read_agency_alerts"
  on alerts for select
  using (agency_id = get_user_agency_id(auth.uid()));

-- Carer can read alerts for their visits
create policy "carer_read_own_alerts"
  on alerts for select
  using (carer_id = auth.uid());

-- Admin can read all alerts
create policy "admin_read_all_alerts"
  on alerts for select
  using (is_platform_admin(auth.uid()));

-- Manager can update alerts in their agency (review them)
create policy "manager_update_agency_alerts"
  on alerts for update
  using (agency_id = get_user_agency_id(auth.uid()));

-- ========================
-- ACTIVITY_LOG policies
-- ========================

-- Admin can read all activity log
create policy "admin_read_activity_log"
  on activity_log for select
  using (is_platform_admin(auth.uid()));

-- Manager can read activity log for their agency
create policy "manager_read_agency_activity_log"
  on activity_log for select
  using (agency_id = get_user_agency_id(auth.uid()));

-- Any authenticated user can insert activity log
create policy "authenticated_insert_activity_log"
  on activity_log for insert
  with check (auth.uid() is not null);

-- ============================================
-- INDEXES for performance
-- ============================================

create index idx_users_agency_id on users(agency_id);
create index idx_users_role on users(role);
create index idx_users_email on users(email);
create index idx_clients_agency_id on clients(agency_id);
create index idx_clients_status on clients(status);
create index idx_carer_client_assignments_carer_id on carer_client_assignments(carer_id);
create index idx_carer_client_assignments_client_id on carer_client_assignments(client_id);
create index idx_visit_entries_client_id on visit_entries(client_id);
create index idx_visit_entries_carer_id on visit_entries(carer_id);
create index idx_visit_entries_agency_id on visit_entries(agency_id);
create index idx_visit_entries_created_at on visit_entries(created_at desc);
create index idx_alerts_agency_id on alerts(agency_id);
create index idx_alerts_is_reviewed on alerts(is_reviewed);
create index idx_alerts_created_at on alerts(created_at desc);
create index idx_activity_log_agency_id on activity_log(agency_id);
create index idx_activity_log_timestamp on activity_log(timestamp desc);
create index idx_correction_notes_visit_entry_id on correction_notes(visit_entry_id);
