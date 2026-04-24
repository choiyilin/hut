"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { NYC_BOROUGHS } from "@/data/nyc-neighborhoods"
import type { RealtorListingRow, OpenHouseSlot } from "@/types"

// ── Local types ────────────────────────────────────────────────────────────────

type FormState = {
  listingType: "rent" | "sale"
  propertyType: "apartment" | "house" | "condo" | "townhouse" | "co-op" | "multi-family"
  status: "active" | "pending" | "off-market" | "draft"
  streetAddress: string
  unitNumber: string
  city: string
  state: string
  zip: string
  neighborhood: string
  title: string
  titleIsManual: boolean
  price: string
  securityDeposit: string
  hasBrokerFee: boolean
  brokerFeeAmount: string
  brokerFeePct: string
  hoaFees: string
  propertyTaxesYear: string
  beds: number
  fullBaths: number
  hasHalfBath: boolean
  sqft: string
  yearBuilt: string
  floorNumber: string
  totalFloors: string
  lotSize: string
  parkingType: "none" | "street" | "garage"
  parkingSpots: number
  laundryType: "in-unit" | "in-building" | "none"
  hasBalcony: boolean
  hasTerrace: boolean
  hasBackyard: boolean
  hasRoofDeck: boolean
  petPolicy: "no-pets" | "cats-ok" | "dogs-ok" | "size-limit"
  isFurnished: boolean
  hasStorage: boolean
  hasDoorman: boolean
  hasElevator: boolean
  hasGym: boolean
  hasPool: boolean
  hasCommunalOutdoor: boolean
  hasChildrensRoom: boolean
  isSmokeFree: boolean
  isAccessible: boolean
  guarantorsAccepted: boolean
  acType: "central" | "window" | "none"
  heatType: "electric" | "gas" | "steam" | "radiant" | ""
  utilitiesIncluded: string[]
  flooringType: string
  hasDishwasher: boolean
  hasMicrowave: boolean
  hasWasherDryer: boolean
  description: string
  availableDate: string
  leaseTerms: string[]
  openHouseSlots: OpenHouseSlot[]
}

const INITIAL_FORM: FormState = {
  listingType: "rent",
  propertyType: "apartment",
  status: "active",
  streetAddress: "",
  unitNumber: "",
  city: "New York",
  state: "NY",
  zip: "",
  neighborhood: "",
  title: "",
  titleIsManual: false,
  price: "",
  securityDeposit: "",
  hasBrokerFee: false,
  brokerFeeAmount: "",
  brokerFeePct: "",
  hoaFees: "",
  propertyTaxesYear: "",
  beds: 1,
  fullBaths: 1,
  hasHalfBath: false,
  sqft: "",
  yearBuilt: "",
  floorNumber: "",
  totalFloors: "",
  lotSize: "",
  parkingType: "none",
  parkingSpots: 0,
  laundryType: "none",
  hasBalcony: false,
  hasTerrace: false,
  hasBackyard: false,
  hasRoofDeck: false,
  petPolicy: "no-pets",
  isFurnished: false,
  hasStorage: false,
  hasDoorman: false,
  hasElevator: false,
  hasGym: false,
  hasPool: false,
  hasCommunalOutdoor: false,
  hasChildrensRoom: false,
  isSmokeFree: false,
  isAccessible: false,
  guarantorsAccepted: false,
  acType: "none",
  heatType: "",
  utilitiesIncluded: [],
  flooringType: "",
  hasDishwasher: false,
  hasMicrowave: false,
  hasWasherDryer: false,
  description: "",
  availableDate: "",
  leaseTerms: [],
  openHouseSlots: [],
}

// ── Derive amenities from form booleans → exact filter strings ────────────────

function deriveAmenities(form: FormState): string[] {
  const derived: string[] = []
  if (form.hasDoorman) derived.push("doorman")
  if (form.hasElevator) derived.push("elevator")
  if (form.hasGym) derived.push("gym")
  if (form.hasPool) derived.push("swimming pool/sauna")
  if (form.hasCommunalOutdoor) derived.push("communal outdoor space")
  if (form.hasChildrensRoom) derived.push("children's room")
  if (form.isSmokeFree) derived.push("smoke free")
  if (form.isAccessible) derived.push("accessible")
  if (form.guarantorsAccepted) derived.push("guarantors accepted")
  if (form.laundryType === "in-unit") derived.push("laundry in-unit")
  if (form.laundryType === "in-building") derived.push("laundry in-building")
  if (form.hasDishwasher) derived.push("dishwasher")
  if (form.acType === "central") derived.push("central AC")
  if (form.isFurnished) derived.push("furnished")
  if (form.hasStorage) derived.push("storage")
  if (form.parkingType !== "none") derived.push("parking")
  if (form.hasBalcony || form.hasTerrace || form.hasBackyard || form.hasRoofDeck)
    derived.push("outdoor space")
  if (form.petPolicy !== "no-pets") derived.push("pets allowed")
  return [...new Set(derived)]
}

// ── Map a DB row back to FormState (for edit mode) ────────────────────────────

function parseStreetAddress(row: RealtorListingRow): string {
  let addr = row.address
  const tail = [row.city, `${row.state ?? ""} ${row.zip ?? ""}`.trim()].filter(Boolean).join(", ")
  if (tail && addr.endsWith(`, ${tail}`)) addr = addr.slice(0, addr.length - tail.length - 2)
  if (row.unit_number) {
    const unit = `, Apt ${row.unit_number}`
    if (addr.endsWith(unit)) addr = addr.slice(0, addr.length - unit.length)
  }
  return addr.trim()
}

function rowToFormState(row: RealtorListingRow): FormState {
  const hasHalf = (row.half_baths ?? 0) > 0
  return {
    listingType: (row.listing_type as FormState["listingType"]) ?? "rent",
    propertyType: (row.property_type as FormState["propertyType"]) ?? "apartment",
    status: row.status! ?? "active",
    streetAddress: parseStreetAddress(row),
    unitNumber: row.unit_number ?? "",
    city: row.city ?? "New York",
    state: row.state ?? "NY",
    zip: row.zip ?? "",
    neighborhood: row.neighborhood,
    title: row.title,
    titleIsManual: true,
    price: String(row.price),
    securityDeposit: row.security_deposit ? String(row.security_deposit) : "",
    hasBrokerFee: row.has_broker_fee,
    brokerFeeAmount: row.broker_fee_amount ? String(row.broker_fee_amount) : "",
    brokerFeePct: row.broker_fee_pct ? String(row.broker_fee_pct) : "",
    hoaFees: row.hoa_fees ? String(row.hoa_fees) : "",
    propertyTaxesYear: row.property_taxes_year ? String(row.property_taxes_year) : "",
    beds: row.beds,
    fullBaths: row.baths,
    hasHalfBath: hasHalf,
    sqft: String(row.sqft),
    yearBuilt: row.year_built ? String(row.year_built) : "",
    floorNumber: row.floor_number ? String(row.floor_number) : "",
    totalFloors: row.total_floors ? String(row.total_floors) : "",
    lotSize: row.lot_size ? String(row.lot_size) : "",
    parkingType: (row.parking_type as FormState["parkingType"]) ?? "none",
    parkingSpots: row.parking_spots ?? 0,
    laundryType: (row.laundry_type as FormState["laundryType"]) ?? "none",
    hasBalcony: row.has_balcony,
    hasTerrace: row.has_terrace,
    hasBackyard: row.has_backyard,
    hasRoofDeck: row.has_roof_deck,
    petPolicy: (row.pet_policy as FormState["petPolicy"]) ?? "no-pets",
    isFurnished: row.is_furnished,
    hasStorage: row.has_storage,
    hasDoorman: row.has_doorman,
    hasElevator: row.has_elevator,
    hasGym: row.has_gym,
    hasPool: row.has_pool,
    hasCommunalOutdoor: row.amenities?.includes("communal outdoor space") ?? false,
    hasChildrensRoom: row.amenities?.includes("children's room") ?? false,
    isSmokeFree: row.amenities?.includes("smoke free") ?? false,
    isAccessible: row.is_accessible,
    guarantorsAccepted: row.amenities?.includes("guarantors accepted") ?? false,
    acType: (row.ac_type as FormState["acType"]) ?? "none",
    heatType: (row.heat_type as FormState["heatType"]) ?? "",
    utilitiesIncluded: row.utilities_included ?? [],
    flooringType: row.flooring_type ?? "",
    hasDishwasher: row.has_dishwasher,
    hasMicrowave: row.has_microwave,
    hasWasherDryer: row.has_washer_dryer,
    description: row.description ?? "",
    availableDate: row.available_date ?? "",
    leaseTerms: row.lease_terms ?? [],
    openHouseSlots: row.open_house_slots ?? [],
  }
}

// ── Shared UI primitives ───────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {children}
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1.5 text-sm font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </p>
  )
}

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  required,
  min,
  max,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  type?: string
  required?: boolean
  min?: string | number
  max?: string | number
  className?: string
}) {
  return (
    <input
      type={type}
      required={required}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none ${className ?? ""}`}
    />
  )
}

function Pills<T>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  size?: "sm" | "md"
}) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            `${sz} rounded-full border-2 font-semibold transition-colors`,
            value === opt.value
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#c9a96e]"
      />
      <span className="text-sm font-medium text-gray-700 capitalize transition-colors select-none group-hover:text-gray-900">
        {label}
      </span>
    </label>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AddListingForm({ initialData }: { initialData?: RealtorListingRow }) {
  const isEditMode = !!initialData
  const isDraft = isEditMode && initialData?.status === "draft"
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [form, setForm] = useState<FormState>(
    initialData ? rowToFormState(initialData) : INITIAL_FORM,
  )
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Photo / media state
  // existingPhotoUrls: already-uploaded URLs kept from the original listing (edit mode)
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(
    initialData?.photo_urls ?? [],
  )
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const floorPlanInputRef = useRef<HTMLInputElement>(null)
  const draggedFile = useRef<File | null>(null)
  const isSubmitting = useRef(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState({ lat: initialData?.lat ?? 0, lng: initialData?.lng ?? 0 })
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "found" | "error">("idle")

  // Auth check — use getSession() (reads cached session) so user_metadata.role
  // is always present immediately after sign-up, unlike getUser() which makes
  // a network call that can return stale metadata on freshly-created accounts.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user || user.user_metadata?.["role"] !== "realtor") {
        router.replace("/login")
        return
      }
      setUser(user)
      setAuthLoading(false)
    })
  }, [router])

  // Auto-compose title from street address + unit
  useEffect(() => {
    if (form.titleIsManual) return
    const parts = [form.streetAddress, form.unitNumber ? `Apt ${form.unitNumber}` : ""].filter(
      Boolean,
    )
    setForm((prev) => ({ ...prev, title: parts.join(", ") }))
  }, [form.streetAddress, form.unitNumber, form.titleIsManual])

  // Build / revoke object URLs when photoFiles changes
  useEffect(() => {
    const urls = photoFiles.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photoFiles])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const MAX_BYTES = 10 * 1024 * 1024
    const oversized: string[] = []
    const valid = Array.from(files).filter((f) => {
      if (!f.type.startsWith("image/")) return false
      if (f.size > MAX_BYTES) {
        oversized.push(f.name)
        return false
      }
      return true
    })
    if (oversized.length > 0)
      setError(`${oversized.length} photo(s) exceed 10MB and were skipped: ${oversized.join(", ")}`)
    if (valid.length > 0) setPhotoFiles((prev) => [...prev, ...valid])
  }

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, j) => j !== index))
  }

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    const file = draggedFile.current
    draggedFile.current = null
    if (!file) return
    setPhotoFiles((prev) => {
      const from = prev.indexOf(file)
      if (from === -1 || from === targetIndex) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      if (!moved) return prev
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const toggleUtility = (u: string) => {
    setField(
      "utilitiesIncluded",
      form.utilitiesIncluded.includes(u)
        ? form.utilitiesIncluded.filter((x) => x !== u)
        : [...form.utilitiesIncluded, u],
    )
  }

  const toggleLeaseTerm = (t: string) => {
    setField(
      "leaseTerms",
      form.leaseTerms.includes(t)
        ? form.leaseTerms.filter((x) => x !== t)
        : [...form.leaseTerms, t],
    )
  }

  const addOpenHouseSlot = () => {
    if (form.openHouseSlots.length >= 5) return
    setField("openHouseSlots", [...form.openHouseSlots, { date: "", time: "", notes: "" }])
  }

  const updateOpenHouseSlot = (i: number, key: keyof OpenHouseSlot, val: string) => {
    setField(
      "openHouseSlots",
      form.openHouseSlots.map((s, j) => (j === i ? { ...s, [key]: val } : s)),
    )
  }

  const removeOpenHouseSlot = (i: number) => {
    setField(
      "openHouseSlots",
      form.openHouseSlots.filter((_, j) => j !== i),
    )
  }

  // ── Shared upload + persist logic ─────────────────────────────────────────

  const buildPayload = async (
    supabase: ReturnType<typeof createClient>,
    overrideStatus?: FormState["status"],
    overrideCoords?: { lat: number; lng: number },
  ) => {
    const newPhotoUrls = await Promise.all(
      photoFiles.map(async (file, i) => {
        const ext = file.name.split(".").pop() ?? "jpg"
        const path = `${user!.id}/${Date.now()}-${i}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, file, { upsert: true })
        if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`)
        return supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl
      }),
    )
    const allPhotoUrls = [...existingPhotoUrls, ...newPhotoUrls]

    let videoUrl: string | null = initialData?.video_url ?? null
    if (videoFile) {
      const ext = videoFile.name.split(".").pop() ?? "mp4"
      const path = `${user!.id}/${Date.now()}-video.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("listing-videos")
        .upload(path, videoFile, { upsert: true })
      if (uploadErr) throw new Error(`Video upload failed: ${uploadErr.message}`)
      videoUrl = supabase.storage.from("listing-videos").getPublicUrl(path).data.publicUrl
    }

    let floorPlanUrl: string | null = initialData?.floor_plan_url ?? null
    if (floorPlanFile) {
      const ext = floorPlanFile.name.split(".").pop() ?? "pdf"
      const path = `${user!.id}/${Date.now()}-floor-plan.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("listing-floor-plans")
        .upload(path, floorPlanFile, { upsert: true })
      if (uploadErr) throw new Error(`Floor plan upload failed: ${uploadErr.message}`)
      floorPlanUrl = supabase.storage.from("listing-floor-plans").getPublicUrl(path).data.publicUrl
    }

    const amenities = deriveAmenities(form)
    const addressParts = [
      form.streetAddress,
      form.unitNumber ? `Apt ${form.unitNumber}` : "",
      form.city,
      `${form.state} ${form.zip}`.trim(),
    ].filter(Boolean)
    const address = addressParts.join(", ") || form.neighborhood
    const baths = form.fullBaths + (form.hasHalfBath ? 0.5 : 0)
    const effectiveStatus = overrideStatus ?? form.status

    return {
      fields: {
        title: form.title || address || "Untitled Draft",
        listing_type: form.listingType,
        property_type: form.propertyType,
        status: effectiveStatus,
        price: Number(form.price) || 0,
        beds: form.beds,
        baths,
        half_baths: form.hasHalfBath ? 1 : 0,
        sqft: Number(form.sqft) || 0,
        address,
        unit_number: form.unitNumber || null,
        city: form.city,
        state: form.state,
        zip: form.zip || null,
        neighborhood: form.neighborhood,
        lat: (overrideCoords ?? coords).lat,
        lng: (overrideCoords ?? coords).lng,
        photo_urls: allPhotoUrls,
        image_url: allPhotoUrls[0] ?? "",
        video_url: videoUrl,
        floor_plan_url: floorPlanUrl,
        amenities,
        description: form.description,
        security_deposit: form.securityDeposit ? Number(form.securityDeposit) : null,
        has_broker_fee: form.hasBrokerFee,
        broker_fee_amount: form.brokerFeeAmount ? Number(form.brokerFeeAmount) : null,
        broker_fee_pct: form.brokerFeePct ? Number(form.brokerFeePct) : null,
        hoa_fees: form.hoaFees ? Number(form.hoaFees) : null,
        property_taxes_year: form.propertyTaxesYear ? Number(form.propertyTaxesYear) : null,
        year_built: form.yearBuilt ? Number(form.yearBuilt) : null,
        floor_number: form.floorNumber ? Number(form.floorNumber) : null,
        total_floors: form.totalFloors ? Number(form.totalFloors) : null,
        lot_size: form.lotSize ? Number(form.lotSize) : null,
        parking_type: form.parkingType,
        parking_spots: form.parkingSpots,
        laundry_type: form.laundryType,
        has_balcony: form.hasBalcony,
        has_terrace: form.hasTerrace,
        has_backyard: form.hasBackyard,
        has_roof_deck: form.hasRoofDeck,
        pet_policy: form.petPolicy,
        is_furnished: form.isFurnished,
        has_storage: form.hasStorage,
        has_doorman: form.hasDoorman,
        has_elevator: form.hasElevator,
        has_gym: form.hasGym,
        has_pool: form.hasPool,
        is_accessible: form.isAccessible,
        ac_type: form.acType,
        heat_type: form.heatType || null,
        utilities_included: form.utilitiesIncluded,
        flooring_type: form.flooringType || null,
        has_dishwasher: form.hasDishwasher,
        has_microwave: form.hasMicrowave,
        has_washer_dryer: form.hasWasherDryer,
        available_date: form.availableDate || null,
        lease_terms: form.leaseTerms,
        open_house_slots: form.openHouseSlots,
      },
    }
  }

  // ── Geocode address → lat/lng ──────────────────────────────────────────────

  const geocodeAddress = async (
    streetAddress: string,
    city: string,
    state: string,
    zip: string,
  ): Promise<{ lat: number; lng: number } | null> => {
    const parts = [streetAddress, city, state, zip].filter(Boolean)
    if (parts.length < 2) return null
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: parts.join(", ") }),
      })
      const { lat, lng } = await res.json()
      if (lat && lng) return { lat, lng }
      return null
    } catch {
      return null
    }
  }

  const handleGeocode = async () => {
    setGeoStatus("loading")
    const result = await geocodeAddress(form.streetAddress, form.city, form.state, form.zip)
    if (result) {
      setCoords(result)
      setGeoStatus("found")
    } else {
      setGeoStatus("error")
    }
  }

  // ── Submit (publish / update) ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || isSubmitting.current) return
    const hasPhotos = existingPhotoUrls.length > 0 || photoFiles.length > 0
    if (!hasPhotos) {
      setError("Please add at least one photo before posting.")
      return
    }
    if (
      form.floorNumber &&
      form.totalFloors &&
      Number(form.floorNumber) > Number(form.totalFloors)
    ) {
      setError("Floor number cannot exceed total floors.")
      return
    }
    isSubmitting.current = true
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      let resolvedCoords = coords
      if (resolvedCoords.lat === 0 && resolvedCoords.lng === 0) {
        const geo = await geocodeAddress(form.streetAddress, form.city, form.state, form.zip)
        if (geo) {
          resolvedCoords = geo
          setCoords(geo)
          setGeoStatus("found")
        }
      }

      const { fields } = await buildPayload(
        supabase,
        isDraft ? "active" : undefined,
        resolvedCoords,
      )

      if (isEditMode) {
        const { error: updateErr } = await supabase
          .from("realtor_listings")
          .update(fields)
          .eq("id", initialData.id)
          .eq("user_id", user.id)
        if (updateErr) throw new Error(updateErr.message)
      } else {
        const { error: insertErr } = await supabase
          .from("realtor_listings")
          .insert({ ...fields, user_id: user.id })
        if (insertErr) throw new Error(insertErr.message)
      }

      router.push("/profile")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
      isSubmitting.current = false
    }
  }

  // ── Save as draft ──────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!user || isSubmitting.current) return
    isSubmitting.current = true
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      let resolvedCoords = coords
      if (resolvedCoords.lat === 0 && resolvedCoords.lng === 0) {
        const geo = await geocodeAddress(form.streetAddress, form.city, form.state, form.zip)
        if (geo) {
          resolvedCoords = geo
          setCoords(geo)
          setGeoStatus("found")
        }
      }

      const { fields } = await buildPayload(supabase, "draft", resolvedCoords)

      if (isEditMode) {
        const { error: updateErr } = await supabase
          .from("realtor_listings")
          .update(fields)
          .eq("id", initialData.id)
          .eq("user_id", user.id)
        if (updateErr) throw new Error(updateErr.message)
      } else {
        const { error: insertErr } = await supabase
          .from("realtor_listings")
          .insert({ ...fields, user_id: user.id })
        if (insertErr) throw new Error(insertErr.message)
      }

      router.push("/profile")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
      isSubmitting.current = false
    }
  }

  if (authLoading) return <div className="min-h-screen bg-[#f0e9dc]" />

  const today = new Date().toISOString().slice(0, 10)

  const pricePerSqft =
    Number(form.price) > 0 && Number(form.sqft) > 0
      ? (Number(form.price) / Number(form.sqft)).toFixed(2)
      : null

  return (
    <div className="min-h-screen bg-[#f0e9dc] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c9a96e] hover:underline"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back to Profile
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            {isEditMode ? "Edit Listing" : "Post a Listing"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? "Update your listing details below."
              : "Fill in the details to list your property in the HUT marketplace."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── 1. Listing Type ──────────────────────────────────────────── */}
          <SectionCard title="Listing Type">
            <div>
              <FieldLabel>For</FieldLabel>
              <div className="flex gap-3">
                {(["rent", "sale"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setField("listingType", v)}
                    className={[
                      "flex-1 rounded-xl border-2 py-3 text-base font-bold transition-colors",
                      form.listingType === v
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                    ].join(" ")}
                  >
                    {v === "rent" ? "For Rent" : "For Sale"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Property Type</FieldLabel>
              <Pills
                options={
                  [
                    { label: "Apartment", value: "apartment" },
                    { label: "House", value: "house" },
                    { label: "Condo", value: "condo" },
                    { label: "Townhouse", value: "townhouse" },
                    { label: "Co-op", value: "co-op" },
                    { label: "Multi-family", value: "multi-family" },
                  ] as { label: string; value: FormState["propertyType"] }[]
                }
                value={form.propertyType}
                onChange={(v) => setField("propertyType", v)}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <Pills
                options={
                  [
                    { label: "Active", value: "active" },
                    { label: "Pending", value: "pending" },
                    { label: "Off Market", value: "off-market" },
                  ] as { label: string; value: FormState["status"] }[]
                }
                value={form.status}
                onChange={(v) => setField("status", v)}
                size="sm"
              />
            </div>
          </SectionCard>

          {/* ── 2. Location ──────────────────────────────────────────────── */}
          <SectionCard title="Location">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FieldLabel required>Street Address</FieldLabel>
                <TextInput
                  value={form.streetAddress}
                  onChange={(v) => setField("streetAddress", v)}
                  placeholder="247 Garfield Place"
                  required
                />
              </div>
              <div>
                <FieldLabel>Unit #</FieldLabel>
                <TextInput
                  value={form.unitNumber}
                  onChange={(v) => setField("unitNumber", v)}
                  placeholder="3R"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>City</FieldLabel>
                <TextInput
                  value={form.city}
                  onChange={(v) => setField("city", v)}
                  placeholder="New York"
                />
              </div>
              <div>
                <FieldLabel>State</FieldLabel>
                <TextInput
                  value={form.state}
                  onChange={(v) => setField("state", v)}
                  placeholder="NY"
                />
              </div>
              <div>
                <FieldLabel>ZIP</FieldLabel>
                <TextInput
                  value={form.zip}
                  onChange={(v) => setField("zip", v)}
                  onBlur={handleGeocode}
                  placeholder="11215"
                />
                {geoStatus === "loading" && (
                  <p className="mt-1 text-xs text-gray-400">Finding location…</p>
                )}
                {geoStatus === "found" && (
                  <p className="mt-1 text-xs text-green-600">✓ Location found</p>
                )}
                {geoStatus === "error" && (
                  <p className="mt-1 text-xs text-amber-500">
                    Couldn&apos;t pinpoint address — listing will still save
                  </p>
                )}
              </div>
            </div>

            <div>
              <FieldLabel required>Neighborhood</FieldLabel>
              <select
                required
                value={form.neighborhood}
                onChange={(e) => setField("neighborhood", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
              >
                <option value="" disabled>
                  Select a neighborhood…
                </option>
                {NYC_BOROUGHS.map((borough) =>
                  borough.areas.map((area) => (
                    <optgroup
                      key={`${borough.id}-${area.area}`}
                      label={`${borough.label} — ${area.area}`}
                    >
                      {area.neighborhoods.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.sub ? `    ${n.name}` : n.name}
                        </option>
                      ))}
                    </optgroup>
                  )),
                )}
              </select>
            </div>

            <div>
              <FieldLabel>Listing Title</FieldLabel>
              <TextInput
                value={form.title}
                onChange={(v) => setForm((prev) => ({ ...prev, title: v, titleIsManual: true }))}
                placeholder="Auto-generated from address"
              />
              {!form.titleIsManual && form.title && (
                <p className="mt-1 text-xs text-gray-400">
                  Auto-composed from address. Edit to override.
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── 3. Pricing ───────────────────────────────────────────────── */}
          <SectionCard title="Pricing">
            <div>
              <FieldLabel required>
                {form.listingType === "rent" ? "Monthly Rent" : "Asking Price"} ($)
              </FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder={form.listingType === "rent" ? "2800" : "750000"}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-8 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
                />
              </div>
              {pricePerSqft && (
                <p className="mt-1.5 text-xs font-semibold text-[#c9a96e]">
                  ${pricePerSqft} / sqft
                </p>
              )}
            </div>

            {form.listingType === "rent" ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel>Security Deposit ($)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    value={form.securityDeposit}
                    onChange={(v) => setField("securityDeposit", v)}
                    placeholder="2800"
                  />
                </div>
                <CheckboxField
                  label="Has broker fee"
                  checked={form.hasBrokerFee}
                  onChange={(v) => setField("hasBrokerFee", v)}
                />
                {form.hasBrokerFee && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <FieldLabel>Fee Amount ($)</FieldLabel>
                      <TextInput
                        type="number"
                        min={0}
                        value={form.brokerFeeAmount}
                        onChange={(v) => setField("brokerFeeAmount", v)}
                        placeholder="2800"
                      />
                    </div>
                    <div>
                      <FieldLabel>Or % of Rent</FieldLabel>
                      <TextInput
                        type="number"
                        min={0}
                        max={100}
                        value={form.brokerFeePct}
                        onChange={(v) => setField("brokerFeePct", v)}
                        placeholder="15"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>HOA Fees ($/mo)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    value={form.hoaFees}
                    onChange={(v) => setField("hoaFees", v)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <FieldLabel>Property Taxes ($/yr)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    value={form.propertyTaxesYear}
                    onChange={(v) => setField("propertyTaxesYear", v)}
                    placeholder="12000"
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── 4. Key Stats ─────────────────────────────────────────────── */}
          <SectionCard title="Key Stats">
            <div>
              <FieldLabel required>Bedrooms</FieldLabel>
              <Pills
                options={
                  [
                    { label: "Studio", value: 0 },
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                    { label: "3", value: 3 },
                    { label: "4+", value: 4 },
                  ] as { label: string; value: number }[]
                }
                value={form.beds}
                onChange={(v) => setField("beds", v)}
              />
            </div>

            <div>
              <FieldLabel required>Full Bathrooms</FieldLabel>
              <div className="flex flex-wrap items-center gap-4">
                <Pills
                  options={
                    [
                      { label: "1", value: 1 },
                      { label: "2", value: 2 },
                      { label: "3+", value: 3 },
                    ] as { label: string; value: number }[]
                  }
                  value={form.fullBaths}
                  onChange={(v) => setField("fullBaths", v)}
                />
                <CheckboxField
                  label="+ half bath"
                  checked={form.hasHalfBath}
                  onChange={(v) => setField("hasHalfBath", v)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Sq ft</FieldLabel>
                <TextInput
                  type="number"
                  required
                  value={form.sqft}
                  onChange={(v) => setField("sqft", v)}
                  placeholder="750"
                  min={1}
                />
              </div>
              <div>
                <FieldLabel>Year Built</FieldLabel>
                <TextInput
                  type="number"
                  value={form.yearBuilt}
                  onChange={(v) => setField("yearBuilt", v)}
                  placeholder="1965"
                  min={1800}
                  max={2030}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Floor #</FieldLabel>
                <TextInput
                  type="number"
                  value={form.floorNumber}
                  onChange={(v) => setField("floorNumber", v)}
                  placeholder="3"
                  min={1}
                />
              </div>
              <div>
                <FieldLabel>Total Floors</FieldLabel>
                <TextInput
                  type="number"
                  value={form.totalFloors}
                  onChange={(v) => setField("totalFloors", v)}
                  placeholder="12"
                  min={1}
                />
              </div>
              <div>
                <FieldLabel>Lot Size (sqft)</FieldLabel>
                <TextInput
                  type="number"
                  value={form.lotSize}
                  onChange={(v) => setField("lotSize", v)}
                  placeholder="2200"
                  min={1}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── 5. Photos & Media ────────────────────────────────────────── */}
          <SectionCard title="Photos & Media">
            <div>
              <FieldLabel required>Photos</FieldLabel>
              <div
                onDrop={(e) => {
                  e.preventDefault()
                  addPhotos(e.dataTransfer.files)
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => photoInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-[#c9a96e] hover:bg-[#c9a96e]/5"
              >
                <i className="fa-solid fa-images mb-2 block text-3xl text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  Drag photos here or{" "}
                  <span className="font-semibold text-[#c9a96e]">browse files</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">JPEG, PNG, WEBP, HEIC · Max 10MB each</p>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files)
                  e.target.value = ""
                }}
              />
            </div>

            {(existingPhotoUrls.length > 0 || previewUrls.length > 0) && (
              <div className="grid grid-cols-4 gap-3">
                {/* Existing (already-uploaded) photos */}
                {existingPhotoUrls.map((url, i) => (
                  <div
                    key={`existing-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gray-100"
                  >
                    <Image
                      src={url}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {i === 0 && previewUrls.length === 0 && (
                      <span className="pointer-events-none absolute top-1 left-1 rounded-full bg-[#c9a96e] px-2 py-0.5 text-xs font-semibold text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setExistingPhotoUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
                {/* Newly added photos */}
                {previewUrls.map((url, i) => (
                  <div
                    key={`new-${i}`}
                    draggable
                    onDragStart={() => {
                      draggedFile.current = photoFiles[i] ?? null
                    }}
                    onDragEnd={() => {
                      draggedFile.current = null
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handlePhotoDrop(e, i)}
                    className="group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 border-gray-100 active:cursor-grabbing"
                  >
                    <Image
                      src={url}
                      alt={`New photo ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {existingPhotoUrls.length === 0 && i === 0 && (
                      <span className="pointer-events-none absolute top-1 left-1 rounded-full bg-[#c9a96e] px-2 py-0.5 text-xs font-semibold text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                    <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/40 py-0.5 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      drag to reorder
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div>
              <FieldLabel>Video Tour</FieldLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400"
                >
                  <i className="fa-solid fa-video mr-2 text-gray-400" />
                  {videoFile ? videoFile.name : "Choose video"}
                </button>
                {videoFile && (
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-xs text-gray-400 transition-colors hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (f && f.size > 200 * 1024 * 1024) {
                    setError("Video exceeds 200MB. Please compress it before uploading.")
                    e.target.value = ""
                  } else {
                    setVideoFile(f)
                    setError(null)
                  }
                  e.target.value = ""
                }}
              />
              <p className="mt-1 text-xs text-gray-400">MP4, MOV, WEBM · Warn if &gt;200MB</p>
            </div>

            <div>
              <FieldLabel>Floor Plan</FieldLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => floorPlanInputRef.current?.click()}
                  className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400"
                >
                  <i className="fa-solid fa-ruler-combined mr-2 text-gray-400" />
                  {floorPlanFile ? floorPlanFile.name : "Choose floor plan"}
                </button>
                {floorPlanFile && (
                  <button
                    type="button"
                    onClick={() => setFloorPlanFile(null)}
                    className="text-xs text-gray-400 transition-colors hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={floorPlanInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (f && f.size > 10 * 1024 * 1024) {
                    setError("Floor plan exceeds 10MB. Please use a smaller file.")
                  } else {
                    setFloorPlanFile(f)
                    setError(null)
                  }
                  e.target.value = ""
                }}
              />
              <p className="mt-1 text-xs text-gray-400">JPEG, PNG, WEBP or PDF · Max 10MB</p>
            </div>
          </SectionCard>

          {/* ── 6. Property Details ──────────────────────────────────────── */}
          <SectionCard title="Property Details">
            <div>
              <FieldLabel>Parking</FieldLabel>
              <div className="flex flex-wrap items-center gap-4">
                <Pills
                  options={
                    [
                      { label: "None", value: "none" },
                      { label: "Street", value: "street" },
                      { label: "Garage", value: "garage" },
                    ] as { label: string; value: FormState["parkingType"] }[]
                  }
                  value={form.parkingType}
                  onChange={(v) => setField("parkingType", v)}
                />
                {form.parkingType !== "none" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Spots:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.parkingSpots || ""}
                      onChange={(e) => setField("parkingSpots", Number(e.target.value))}
                      className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <FieldLabel>Laundry</FieldLabel>
              <Pills
                options={
                  [
                    { label: "None", value: "none" },
                    { label: "In-unit", value: "in-unit" },
                    { label: "In-building", value: "in-building" },
                  ] as { label: string; value: FormState["laundryType"] }[]
                }
                value={form.laundryType}
                onChange={(v) => setField("laundryType", v)}
              />
            </div>

            <div>
              <FieldLabel>Outdoor Space</FieldLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CheckboxField
                  label="Balcony"
                  checked={form.hasBalcony}
                  onChange={(v) => setField("hasBalcony", v)}
                />
                <CheckboxField
                  label="Terrace"
                  checked={form.hasTerrace}
                  onChange={(v) => setField("hasTerrace", v)}
                />
                <CheckboxField
                  label="Backyard"
                  checked={form.hasBackyard}
                  onChange={(v) => setField("hasBackyard", v)}
                />
                <CheckboxField
                  label="Roof Deck"
                  checked={form.hasRoofDeck}
                  onChange={(v) => setField("hasRoofDeck", v)}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Pet Policy</FieldLabel>
              <Pills
                options={
                  [
                    { label: "No Pets", value: "no-pets" },
                    { label: "Cats OK", value: "cats-ok" },
                    { label: "Dogs OK", value: "dogs-ok" },
                    { label: "Size Limit", value: "size-limit" },
                  ] as { label: string; value: FormState["petPolicy"] }[]
                }
                value={form.petPolicy}
                onChange={(v) => setField("petPolicy", v)}
              />
            </div>

            <div className="flex gap-6">
              <CheckboxField
                label="Furnished"
                checked={form.isFurnished}
                onChange={(v) => setField("isFurnished", v)}
              />
              <CheckboxField
                label="Storage included"
                checked={form.hasStorage}
                onChange={(v) => setField("hasStorage", v)}
              />
            </div>
          </SectionCard>

          {/* ── 7. Building Amenities ────────────────────────────────────── */}
          <SectionCard title="Building Amenities">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <CheckboxField
                label="Doorman"
                checked={form.hasDoorman}
                onChange={(v) => setField("hasDoorman", v)}
              />
              <CheckboxField
                label="Elevator"
                checked={form.hasElevator}
                onChange={(v) => setField("hasElevator", v)}
              />
              <CheckboxField
                label="Gym"
                checked={form.hasGym}
                onChange={(v) => setField("hasGym", v)}
              />
              <CheckboxField
                label="Swimming pool/sauna"
                checked={form.hasPool}
                onChange={(v) => setField("hasPool", v)}
              />
              <CheckboxField
                label="Communal outdoor space"
                checked={form.hasCommunalOutdoor}
                onChange={(v) => setField("hasCommunalOutdoor", v)}
              />
              <CheckboxField
                label="Children's room"
                checked={form.hasChildrensRoom}
                onChange={(v) => setField("hasChildrensRoom", v)}
              />
              <CheckboxField
                label="Smoke free"
                checked={form.isSmokeFree}
                onChange={(v) => setField("isSmokeFree", v)}
              />
              <CheckboxField
                label="ADA accessible"
                checked={form.isAccessible}
                onChange={(v) => setField("isAccessible", v)}
              />
              <CheckboxField
                label="Guarantors accepted"
                checked={form.guarantorsAccepted}
                onChange={(v) => setField("guarantorsAccepted", v)}
              />
            </div>
          </SectionCard>

          {/* ── 8. Unit Features ─────────────────────────────────────────── */}
          <SectionCard title="Unit Features">
            <div>
              <FieldLabel>Air Conditioning</FieldLabel>
              <Pills
                options={
                  [
                    { label: "None", value: "none" },
                    { label: "Central AC", value: "central" },
                    { label: "Window AC", value: "window" },
                  ] as { label: string; value: FormState["acType"] }[]
                }
                value={form.acType}
                onChange={(v) => setField("acType", v)}
              />
            </div>

            <div>
              <FieldLabel>Heat Type</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {(["electric", "gas", "steam", "radiant"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setField("heatType", form.heatType === h ? "" : h)}
                    className={[
                      "rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors",
                      form.heatType === h
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                    ].join(" ")}
                  >
                    {h.charAt(0).toUpperCase() + h.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Utilities Included</FieldLabel>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
                {["heat", "hot water", "electric", "gas", "internet", "cable"].map((u) => (
                  <CheckboxField
                    key={u}
                    label={u}
                    checked={form.utilitiesIncluded.includes(u)}
                    onChange={() => toggleUtility(u)}
                  />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Flooring</FieldLabel>
              <TextInput
                value={form.flooringType}
                onChange={(v) => setField("flooringType", v)}
                placeholder="e.g. Hardwood, Tile, Carpet"
              />
            </div>

            <div>
              <FieldLabel>Appliances</FieldLabel>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
                <CheckboxField
                  label="Dishwasher"
                  checked={form.hasDishwasher}
                  onChange={(v) => setField("hasDishwasher", v)}
                />
                <CheckboxField
                  label="Microwave"
                  checked={form.hasMicrowave}
                  onChange={(v) => setField("hasMicrowave", v)}
                />
                <CheckboxField
                  label="Washer/Dryer"
                  checked={form.hasWasherDryer}
                  onChange={(v) => setField("hasWasherDryer", v)}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── 9. Description & Availability ────────────────────────────── */}
          <SectionCard title="Description & Availability">
            <div>
              <FieldLabel required>Description</FieldLabel>
              <textarea
                required
                rows={6}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe the apartment, building, and neighborhood…"
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a96e] focus:outline-none"
              />
              <p
                className={`mt-1 text-right text-xs ${
                  form.description.length >= 950 ? "font-semibold text-red-500" : "text-gray-400"
                }`}
              >
                {form.description.length}/1000
              </p>
            </div>

            {form.listingType === "rent" && (
              <>
                <div>
                  <FieldLabel>Available Date</FieldLabel>
                  <TextInput
                    type="date"
                    min={today}
                    value={form.availableDate}
                    onChange={(v) => setField("availableDate", v)}
                    className="max-w-xs"
                  />
                </div>

                <div>
                  <FieldLabel>Lease Terms</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {["month-to-month", "6 months", "1 year", "2+ years"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleLeaseTerm(t)}
                        className={[
                          "rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors",
                          form.leaseTerms.includes(t)
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                        ].join(" ")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <FieldLabel>Open House Slots</FieldLabel>
                    {form.openHouseSlots.length < 5 && (
                      <button
                        type="button"
                        onClick={addOpenHouseSlot}
                        className="text-xs font-semibold text-[#c9a96e] hover:underline"
                      >
                        + Add slot
                      </button>
                    )}
                  </div>
                  {form.openHouseSlots.length === 0 ? (
                    <p className="text-xs text-gray-400">No open house slots added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {form.openHouseSlots.map((slot, i) => (
                        <div key={i} className="grid grid-cols-3 items-end gap-2">
                          <div>
                            <p className="mb-1 text-xs text-gray-500">Date</p>
                            <TextInput
                              type="date"
                              min={today}
                              value={slot.date}
                              onChange={(v) => updateOpenHouseSlot(i, "date", v)}
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-gray-500">Time</p>
                            <TextInput
                              type="time"
                              value={slot.time}
                              onChange={(v) => updateOpenHouseSlot(i, "time", v)}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <p className="mb-1 text-xs text-gray-500">Notes</p>
                              <TextInput
                                value={slot.notes}
                                onChange={(v) => updateOpenHouseSlot(i, "notes", v)}
                                placeholder="Optional"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOpenHouseSlot(i)}
                              className="pb-0.5 text-gray-400 transition-colors hover:text-red-500"
                            >
                              <i className="fa-solid fa-trash-can text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </SectionCard>

          {/* Error & submit */}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-3 pb-6">
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="flex-1 rounded-full border-2 border-gray-200 py-3 text-center text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-[#c9a96e] py-3 text-sm font-bold text-white transition-colors hover:bg-[#b8935a] disabled:opacity-60"
              >
                {loading ? "Saving…" : isEditMode && !isDraft ? "Save Changes" : "Post Listing"}
              </button>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveDraft}
              className="w-full rounded-full border-2 border-gray-300 py-3 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save as Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
