-- Preserve existing public URLs and copy as the initial database publication set.
-- Reapplying this migration must not overwrite staff-edited articles.
insert into public.articles (
  slug, title, category, status, excerpt, body, read_time_minutes,
  published_at, created_at, updated_at
)
select
  article.slug, article.title, article.category, 'published', article.excerpt,
  article.sections, article.read_time_minutes,
  '2026-09-17T00:00:00Z'::timestamptz,
  '2026-09-17T00:00:00Z'::timestamptz,
  '2026-09-17T00:00:00Z'::timestamptz
from jsonb_to_recordset($articles$[
  {
    "slug": "kyc-homes-phase-ii-abuja-guide",
    "title": "A practical guide to KYC Homes Phase II, Abuja",
    "category": "Area guide",
    "excerpt": "What buyers should know about the Sabon Lugbe estate, its established homes, active development, and available purchase routes.",
    "read_time_minutes": 5,
    "sections": [
      {"heading": "Location and setting", "body": "KYC Homes Phase II is located in Sabon Lugbe along the Airport Road corridor in Abuja, Federal Capital Territory. Buyers should confirm the specific access route and the position of any plot or property during inspection."},
      {"heading": "An estate at different stages", "body": "The estate includes hundreds of developed properties alongside ongoing residential construction. That combination allows buyers to assess an established built environment while considering land, resale, or developing-property opportunities."},
      {"heading": "Two purchase routes", "body": "Opportunities may come from current developer inventory or from an existing owner's resale. Each route requires its own documentation, confirmation, payment, and transfer process before commitment."},
      {"heading": "Current developer product and price", "body": "KYC Interproject Limited's current virgin-land price is NGN 14,000,000 for a 600 sqm plot. Phase II follows a 4-bedroom fully detached duplex development format. Full or part payment may be available, but buyers must reconfirm availability, charges, payment schedules, and official instructions before transferring funds."}
    ]
  },
  {
    "slug": "questions-before-buying-land",
    "title": "Seven questions to ask before buying land",
    "category": "Buying guide",
    "excerpt": "A practical framework for checking ownership, documentation, access, costs, and development conditions before committing.",
    "read_time_minutes": 3,
    "sections": [
      {"heading": "Start with ownership", "body": "Confirm who owns the property, whether the seller has authority to sell, and whether the records match the exact plot being presented. A convincing story is not a substitute for documentary evidence."},
      {"heading": "Understand the complete cost", "body": "Ask for the purchase price, documentation costs, transfer fees, development obligations, and any recurring estate charges. Decisions are easier when the total commitment is visible from the beginning."}
    ]
  },
  {
    "slug": "developer-sale-versus-owner-resale",
    "title": "Developer sale or owner resale: what changes?",
    "category": "Explainer",
    "excerpt": "Both routes can be legitimate, but they require different checks, documentation, and expectations.",
    "read_time_minutes": 2,
    "sections": [
      {"heading": "The source of the property", "body": "Developer inventory is sold through the estate's established allocation process. An owner resale transfers an existing client's interest, so the seller's identity, allocation, payment history, and authority to transfer require separate confirmation."},
      {"heading": "Verification still matters", "body": "Being located within a known estate does not remove the need to verify a specific transaction. The property, owner, records, fees, and transfer procedure should all align before payment."}
    ]
  },
  {
    "slug": "remote-property-inspection",
    "title": "How to inspect property when you are abroad",
    "category": "Remote buying",
    "excerpt": "Use live video, location evidence, independent checks, and a documented process to make remote property decisions clearer.",
    "read_time_minutes": 2,
    "sections": [
      {"heading": "Request a live inspection", "body": "A live video call allows you to ask questions, see the access route, examine surrounding development, and verify that the footage relates to the property under discussion."},
      {"heading": "Keep an evidence trail", "body": "Important representations, approved prices, payment instructions, receipts, and transfer documents should be recorded. Remote convenience should never mean informal documentation."}
    ]
  }
]$articles$::jsonb) as article(
  slug text, title text, category text, excerpt text,
  read_time_minutes integer, sections jsonb
)
on conflict (slug) do nothing;
