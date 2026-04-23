-- Sunwealth — placeholder knowledge base for the concierge.
-- Every record is titled with [PLACEHOLDER] — never ship to production.
-- Embeddings are NULL here; a one-off admin action will backfill them via
-- lib/ai/embeddings.ts after the migration runs.

INSERT INTO knowledge_documents (id, title, category, content)
VALUES
(
  '00000000-0000-0000-0000-000000000c01',
  '[PLACEHOLDER] How Sunwealth verifies title documents',
  'verification',
  'Every listing that appears on sunwealthrealestate.com has had its title documents inspected in person by a member of our team. For Certificates of Occupancy (C of O) we cross-check the signature and serial number against the Lagos State Land Bureau. For Governor''s Consent we verify the consent letter is on file with the Ministry of Physical Planning. We never publish a property with unverified documents — listings without complete paperwork are held back until the title is confirmed. Replace this with the real verification SOP before launch.'
),
(
  '00000000-0000-0000-0000-000000000c02',
  '[PLACEHOLDER] Refund policy on reservation fees',
  'payment',
  'Reservation fees paid to Sunwealth are fully refundable within 14 days if the buyer chooses not to proceed, provided the property has not yet been formally allocated. After allocation, a 10% administrative deduction applies. Refunds are processed within 7 business days to the original bank account. Sunwealth never accepts reservation fees via cash, mobile transfer apps, or payment links — only verified Nigerian bank transfer to the company operating account. Replace this with the real refund policy before launch.'
),
(
  '00000000-0000-0000-0000-000000000c03',
  '[PLACEHOLDER] Remote buying process for diaspora clients',
  'diaspora',
  'Clients abroad can complete a Sunwealth purchase end-to-end without travelling to Lagos. The process: (1) AI concierge or agent matches you to verified listings; (2) virtual inspection over WhatsApp video or Matterport 3D tour; (3) legal review of title documents, shared via secure signed links that expire in 1 hour; (4) Power-of-Attorney signed and notarised at a Nigerian embassy in your country; (5) payment via international bank transfer or escrow to the Sunwealth operating account; (6) allocation letter issued; (7) optional handover inspection by a nominated local representative. Typical timeline: 6–10 weeks from offer to allocation. Replace with the real diaspora SOP before launch.'
),
(
  '00000000-0000-0000-0000-000000000c04',
  '[PLACEHOLDER] Accepted payment methods',
  'payment',
  'Sunwealth accepts payment only through verified Nigerian bank transfer to the company operating account, or via licensed Nigerian escrow agents for transactions above ₦100 million. We never accept cash, cryptocurrency, mobile-money apps, USSD transfers, or payment links sent through chat or email. Our bank details are never shared through the AI concierge or WhatsApp — a senior agent confirms bank details over a scheduled phone call. If anyone claiming to represent Sunwealth asks for payment through any other channel, it is a scam — report it to +234 903 837 9755 immediately. Replace with the real payment operations page before launch.'
),
(
  '00000000-0000-0000-0000-000000000c05',
  '[PLACEHOLDER] How property inspections work',
  'company',
  'Inspections are free and booked through a Sunwealth senior agent. Physical inspections run Monday to Saturday, 10am to 5pm, by appointment — we do not offer unscheduled walk-throughs as estates typically require pre-cleared visitor lists. Virtual inspections are available 7 days a week and run over WhatsApp video with the on-site agent; these typically last 20 to 40 minutes depending on the property. A viewing does not reserve the property — reservations require a formal offer and deposit. Replace with the real inspection SOP before launch.'
),
(
  '00000000-0000-0000-0000-000000000c06',
  '[PLACEHOLDER] Certificate of Occupancy vs Governor''s Consent',
  'legal',
  'A Certificate of Occupancy (C of O) is granted by the Governor of Lagos State and confirms a 99-year leasehold from the government. A Governor''s Consent is a subsequent approval required whenever a property with an existing C of O is transferred to a new owner — without Governor''s Consent, the transfer is not perfected even if the deed is signed. Both documents carry full legal standing for titled land. Sunwealth does not offer legal advice — for tax structuring, inheritance, or dispute questions we refer you to our legal partners. Replace with the real legal explainer before launch.'
),
(
  '00000000-0000-0000-0000-000000000c07',
  '[PLACEHOLDER] About Sunwealth Real Estate Limited',
  'company',
  'Sunwealth Real Estate Limited (RC 1739523) is a Lagos-based real estate firm operating across three sub-brands: @sunwealthltd for property sales, @sunwealth_rent.ng for rentals, and @sunwealth_landandacres for land sales. Primary areas of focus: Ikoyi, Banana Island, Victoria Garden City, Lekki Phase 1, Pinnock Beach, and Osapa London. Head office in Lagos. Primary contact: +234 903 837 9755. Replace with the real company profile before launch.'
),
(
  '00000000-0000-0000-0000-000000000c08',
  '[PLACEHOLDER] Typical payment plans on new developments',
  'payment',
  'For new developments, Sunwealth typically offers three structures: (a) outright purchase at contract signing, (b) 30% down with the balance over 6 months, (c) 20% down with the balance over 12 months — interest-free. Longer plans are not offered by default. Specific payment plans for any given property are listed on that property''s page; the concierge will only confirm a payment plan if it appears in the property record. Replace with the real payment plan policy before launch.'
)
ON CONFLICT (id) DO NOTHING;
