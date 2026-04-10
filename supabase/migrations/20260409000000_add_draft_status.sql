-- Add 'draft' to the allowed status values for realtor_listings.
-- Drafts are incomplete listings saved by realtors; they are excluded
-- from the public listings feed and only visible to their owner in the profile.

ALTER TABLE realtor_listings DROP CONSTRAINT IF EXISTS realtor_listings_status_check;

ALTER TABLE realtor_listings
  ADD CONSTRAINT realtor_listings_status_check
  CHECK (status IN ('active', 'pending', 'off-market', 'draft'));
