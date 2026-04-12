-- Fix foreign key relationships for portal system - Final Version
-- This ensures client_portals connects to clients, and portal_links connects to client_portals

-- 1. Cleanup orphaned records
DELETE FROM portal_links WHERE client_id NOT IN (SELECT id FROM clients);
DELETE FROM client_portals WHERE client_id NOT IN (SELECT id FROM clients);

-- 2. Fix client_portals -> clients link
ALTER TABLE client_portals DROP CONSTRAINT IF EXISTS client_portals_client_id_fkey;
ALTER TABLE client_portals 
  ADD CONSTRAINT client_portals_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 3. Fix portal_links -> client_portals link (Crucial for the nested join/count)
-- First drop existing FK to clients/profiles
ALTER TABLE portal_links DROP CONSTRAINT IF EXISTS portal_links_client_id_fkey;
-- Add FK to client_portals(client_id) to allow direct relationship joins
ALTER TABLE portal_links 
  ADD CONSTRAINT portal_links_portal_id_fkey 
  FOREIGN KEY (client_id) REFERENCES client_portals(client_id) ON DELETE CASCADE;

-- 4. Fix qr_redirections
ALTER TABLE qr_redirections DROP CONSTRAINT IF EXISTS qr_redirections_client_id_fkey;
ALTER TABLE qr_redirections 
  ADD CONSTRAINT qr_redirections_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
