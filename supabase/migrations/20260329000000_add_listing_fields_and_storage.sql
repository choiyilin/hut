-- ============================================================
-- Migration: add listing fields + storage buckets
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 0a. ALTER TABLE realtor_listings ────────────────────────

-- Classification
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS listing_type    text NOT NULL DEFAULT 'rent'
    CHECK (listing_type IN ('rent','sale')),
  ADD COLUMN IF NOT EXISTS property_type  text NOT NULL DEFAULT 'apartment'
    CHECK (property_type IN ('apartment','house','condo','townhouse','co-op','multi-family')),
  ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','pending','off-market'));

-- Location
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS unit_number  text,
  ADD COLUMN IF NOT EXISTS city         text NOT NULL DEFAULT 'New York',
  ADD COLUMN IF NOT EXISTS state        text NOT NULL DEFAULT 'NY',
  ADD COLUMN IF NOT EXISTS zip          text;

-- Pricing extras
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS security_deposit     integer,
  ADD COLUMN IF NOT EXISTS has_broker_fee       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_fee_amount    integer,
  ADD COLUMN IF NOT EXISTS broker_fee_pct       numeric(4,2),
  ADD COLUMN IF NOT EXISTS hoa_fees             integer,
  ADD COLUMN IF NOT EXISTS property_taxes_year  integer;

-- Key stats extras
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS half_baths    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lot_size      integer,
  ADD COLUMN IF NOT EXISTS floor_number  integer,
  ADD COLUMN IF NOT EXISTS total_floors  integer,
  ADD COLUMN IF NOT EXISTS year_built    integer;

-- Media
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS photo_urls     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url      text,
  ADD COLUMN IF NOT EXISTS floor_plan_url text;

-- Property details
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS parking_type  text NOT NULL DEFAULT 'none'
    CHECK (parking_type IN ('none','street','garage')),
  ADD COLUMN IF NOT EXISTS parking_spots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS laundry_type  text NOT NULL DEFAULT 'none'
    CHECK (laundry_type IN ('in-unit','in-building','none')),
  ADD COLUMN IF NOT EXISTS has_balcony   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_terrace   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_backyard  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_roof_deck boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pet_policy    text NOT NULL DEFAULT 'no-pets'
    CHECK (pet_policy IN ('no-pets','cats-ok','dogs-ok','size-limit')),
  ADD COLUMN IF NOT EXISTS is_furnished  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_storage   boolean NOT NULL DEFAULT false;

-- Building amenities
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS has_doorman       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_elevator      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_gym           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_pool          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_rooftop       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_package_room  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_bike_room     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_ev_charging   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_live_in_super boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_accessible     boolean NOT NULL DEFAULT false;

-- Unit features
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS ac_type            text NOT NULL DEFAULT 'none'
    CHECK (ac_type IN ('central','window','none')),
  ADD COLUMN IF NOT EXISTS heat_type          text
    CHECK (heat_type IN ('electric','gas','steam','radiant')),
  ADD COLUMN IF NOT EXISTS utilities_included text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flooring_type      text,
  ADD COLUMN IF NOT EXISTS has_dishwasher     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_microwave      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_washer_dryer   boolean NOT NULL DEFAULT false;

-- Listing details
ALTER TABLE public.realtor_listings
  ADD COLUMN IF NOT EXISTS available_date    date,
  ADD COLUMN IF NOT EXISTS lease_terms       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_house_slots  jsonb NOT NULL DEFAULT '[]';

-- Trigger: keep image_url in sync with photo_urls[1] (1-indexed in Postgres)
CREATE OR REPLACE FUNCTION sync_image_url()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF array_length(NEW.photo_urls, 1) > 0 THEN
    NEW.image_url := NEW.photo_urls[1];
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_image_url ON public.realtor_listings;
CREATE TRIGGER trg_sync_image_url
  BEFORE INSERT OR UPDATE OF photo_urls ON public.realtor_listings
  FOR EACH ROW EXECUTE FUNCTION sync_image_url();

-- ── 0b. Storage buckets + RLS ────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listing-photos',      'listing-photos',      true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('listing-videos',      'listing-videos',      true, 524288000,
   ARRAY['video/mp4','video/quicktime','video/webm']),
  ('listing-floor-plans', 'listing-floor-plans', true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Photos
DROP POLICY IF EXISTS "Public read listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Realtors upload listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete listing photos" ON storage.objects;
CREATE POLICY "Public read listing photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Realtors upload listing photos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'listing-photos' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete listing photos"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text);

-- Videos
DROP POLICY IF EXISTS "Public read listing videos" ON storage.objects;
DROP POLICY IF EXISTS "Realtors upload listing videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete listing videos" ON storage.objects;
CREATE POLICY "Public read listing videos"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-videos');
CREATE POLICY "Realtors upload listing videos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'listing-videos' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete listing videos"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'listing-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text);

-- Floor plans
DROP POLICY IF EXISTS "Public read floor plans" ON storage.objects;
DROP POLICY IF EXISTS "Realtors upload floor plans" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete floor plans" ON storage.objects;
CREATE POLICY "Public read floor plans"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-floor-plans');
CREATE POLICY "Realtors upload floor plans"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'listing-floor-plans' AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete floor plans"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'listing-floor-plans'
    AND (storage.foldername(name))[1] = auth.uid()::text);
