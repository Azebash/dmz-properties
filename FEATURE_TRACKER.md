# DMZ Properties Development Tracker

Last reviewed: September 17, 2026

## Status Legend

- [x] Complete
- [ ] Not started
- [~] Foundation exists but production work remains
- [!] Requires business information or a decision

## P0: Required Before Public Launch

These items are launch blockers.

### Business Information

- [x] Establish DMZ Properties as the public-facing venture
- [x] Identify DMZ Enterprises Ltd as the registered entity
- [x] Publish company registration number: RC 9121009
- [x] State that DMZ Properties is independently managed
- [x] State that the website is not the official KYC Homes Phase II website
- [~] Disclose the founder's professional relationship with KYC Homes Phase II on the About page
- [!] Confirm the final wording of the KYC Homes Phase II relationship and authorization
- [!] Add the official business email address
- [!] Add the official business phone and WhatsApp number
- [!] Add the office or contact address
- [!] Confirm the production domain

### Real Property Inventory

- [x] Property catalogue and reusable listing model
- [x] Individual property detail pages
- [!] Replace all representative listings with approved live inventory
- [x] Replace public-site stock photography with genuine estate media
- [ ] Add verified plot dimensions
- [ ] Add approved prices and complete payment terms
- [ ] Add title type and relevant documentation summary
- [ ] Add accurate availability status
- [x] Add property reference numbers
- [ ] Add exact or appropriately generalized map locations
- [ ] Add development status and current site condition
- [ ] Add nearby infrastructure and access information
- [x] Add clear developer-inventory or owner-resale labels
- [x] Add last-verified dates to listings

### Enquiries And Conversion

- [x] General enquiry page and buyer requirement form
- [~] Configure Resend credentials for secure form delivery
- [!] Connect the official WhatsApp number
- [x] Add property-specific enquiry context automatically
- [x] Add inspection booking requests
- [x] Add physical or virtual inspection selection
- [x] Add preferred contact method and contact time
- [x] Add budget and purchase timeline qualification
- [x] Add consent checkbox and privacy notice
- [x] Add submission confirmation and automated email acknowledgement
- [~] Add honeypot and basic rate-limit spam protection
- [~] Add internal email notifications for new enquiries

### Legal And Trust

- [~] Privacy policy drafted; requires legal review
- [~] Website terms of use drafted; requires legal review
- [x] Property information disclaimer
- [x] Add consent-controlled optional analytics notice
- [~] Data retention and enquiry-handling policy drafted; requires legal review
- [~] Payment guidance drafted; requires business and legal approval
- [x] Warning against unconfirmed or unauthorized payment instructions
- [ ] Lawyer review of public claims, disclosures, and forms

### Technical Launch

- [x] Responsive website foundation
- [x] Mobile navigation
- [x] Production build and lint checks
- [x] Automatic sitemap
- [x] Search-engine robots configuration
- [x] Core company structured data
- [x] Security headers and content security policy
- [x] Custom not-found and application-error pages
- [x] Unit tests for enquiry validation, rate limiting, and content integrity
- [x] Browser journey tests for navigation, filtering, and enquiries
- [x] Automated accessibility checks on priority pages
- [x] Enquiry API contract tests for validation, origin, spam, configuration, and delivery paths
- [ ] Connect production hosting
- [ ] Connect production domain and SSL
- [ ] Configure environment variables and secrets
- [x] Add a branded social-sharing image
- [ ] Add error monitoring
- [ ] Test all forms on production
- [x] Test at 375px, 768px, 1024px, and 1440px
- [~] Production performance, asset, metadata, SEO, and accessibility budgets pass; independent Lighthouse scoring remains pending
- [ ] Verify external image licensing and usage

## P1: Strongly Recommended For Initial Growth

These features should follow immediately after the launch blockers.

### Property Discovery

- [x] Filter by property type
- [x] Filter by developer inventory or owner resale
- [ ] Filter by price range
- [ ] Filter by plot size
- [ ] Filter by availability
- [ ] Sort by newest, price, and relevance
- [x] Search by property name or reference number
- [ ] Related-property recommendations
- [x] Clear empty and no-results states
- [ ] Share property links through WhatsApp and social platforms

### Property Presentation

- [x] Multi-image property gallery
- [ ] Video walkthroughs
- [ ] Drone footage
- [ ] Live development-progress media
- [ ] Downloadable property brochure
- [ ] Downloadable buyer information pack
- [ ] Amenities and infrastructure section
- [ ] Purchase-cost breakdown
- [ ] Frequently asked questions per property
- [x] Inspection availability information
- [ ] Print-friendly property page

### Trust System

- [x] Dedicated verification-process page
- [x] Explain developer-sale verification
- [x] Explain owner-resale verification
- [x] Show what DMZ verifies and what buyers must verify independently
- [ ] Publish named founder and team profiles
- [ ] Publish genuine client testimonials with permission
- [ ] Publish completed transaction case studies
- [ ] Add dated construction and estate progress updates
- [x] Provide independent lawyer and surveyor guidance
- [ ] Add visible reporting process for incorrect listing information

### KYC Homes Phase II Authority

- [x] Dedicated KYC Homes Phase II area page
- [x] Developer inventory and owner-resale explanation
- [x] Confirmed titled-estate and development messaging
- [x] Add KYC Homes Phase II location and access introduction
- [ ] Add accurate estate map
- [ ] Add estate development timeline
- [ ] Add infrastructure and amenity details
- [ ] Add approved estate documentation guide
- [x] Add KYC Homes Phase II frequently asked questions
- [ ] Add recurring development-update posts
- [x] Add genuine photographs of completed and ongoing development

### SEO And Content

- [x] Insights index
- [x] Individual article pages
- [x] Search-friendly URLs
- [x] Page-level metadata foundation
- [x] Canonical URL on priority landing pages
- [ ] Confirm keyword targets using real search data
- [x] Add Article structured data
- [x] Add Breadcrumb structured data
- [x] Add property-specific structured data
- [x] Create dynamic social-sharing images
- [x] Add author, published date, and updated date to articles
- [ ] Add article categories and topic pages
- [ ] Add internal links between articles, areas, and properties
- [ ] Add XML image sitemap support if needed
- [ ] Connect Google Search Console
- [ ] Connect Bing Webmaster Tools
- [ ] Establish a content publishing calendar

### Priority Content Topics

- [x] Questions to ask before buying land
- [x] Developer sale versus owner resale
- [x] Remote property inspection guide
- [x] Complete introductory guide to KYC Homes Phase II in Abuja
- [ ] Current KYC Homes Phase II land prices
- [ ] KYC Homes Phase II title and documentation guide
- [ ] Total costs of buying property in KYC Homes Phase II
- [ ] How property resale works within KYC Homes Phase II
- [ ] Building and development considerations within KYC Homes Phase II
- [ ] Monthly KYC Homes Phase II development update
- [ ] Common property-buying mistakes
- [ ] Buying land from abroad safely

### Analytics

- [~] Add configurable Google Analytics integration
- [ ] Connect Google Search Console
- [ ] Track property page views
- [ ] Track enquiry submissions
- [ ] Track WhatsApp clicks
- [ ] Track inspection requests
- [ ] Track brochure downloads
- [ ] Track buyer versus seller enquiries
- [ ] Record lead source and campaign details
- [ ] Define monthly acquisition and conversion reports

## P2: Operational Efficiency

These features reduce manual work after enquiry volume grows.

### Content Management System

- [ ] Select a CMS
- [ ] Create secure administrator authentication
- [ ] Create property editor
- [ ] Create article editor
- [ ] Create area-guide editor
- [ ] Create development-update editor
- [ ] Add draft, review, scheduled, published, sold, and archived states
- [ ] Add image and document media management
- [ ] Add SEO title and description controls
- [ ] Add content preview before publication
- [ ] Add audit history for important listing changes

### Admin Roles

- [ ] Administrator role with complete access
- [ ] Property manager role for listings and enquiries
- [ ] Content editor role for articles and SEO
- [ ] Read-only reporting role
- [ ] Two-factor authentication for administrators

### Lead Management

- [ ] Central enquiry inbox
- [ ] Buyer profile and requirement records
- [ ] Seller and property-submission records
- [ ] Lead stages: new, qualified, inspection, offer, won, and lost
- [ ] Follow-up reminders
- [ ] Internal notes and activity history
- [ ] Assign leads to staff
- [ ] Inspection scheduling and outcome tracking
- [ ] Export leads to CSV
- [ ] CRM integration
- [ ] Duplicate-lead detection
- [x] Marketing-consent tracking at enquiry submission

### Owner Resale Operations

- [x] Dedicated seller information page
- [x] Private review positioning instead of public self-listing
- [x] Resale requirements checklist
- [x] Dedicated seller submission form
- [ ] Secure document upload
- [ ] Internal ownership-review checklist
- [ ] Authority-to-sell confirmation
- [ ] Estate record confirmation
- [ ] Asking-price and terms approval
- [ ] Representation agreement tracking
- [ ] Listing approval and rejection workflow
- [ ] Seller status updates

## P3: Buyer Experience Enhancements

These features improve retention and remote buying but are not launch requirements.

### Remote And Diaspora Buying

- [x] Dedicated buying-from-abroad page
- [x] Virtual inspection request pathway
- [ ] Time-zone-aware scheduling
- [ ] Live video inspection checklist
- [ ] Secure remote document delivery
- [x] Remote purchase process timeline
- [ ] Currency display guidance without misleading conversion promises
- [ ] Diaspora-specific frequently asked questions
- [ ] Webinar and virtual event registration
- [ ] Downloadable remote-buyer guide

### Buyer Tools

- [ ] Save favorite properties
- [ ] Compare selected properties
- [ ] Email or WhatsApp property alerts
- [ ] Recently viewed properties
- [ ] New-listing notifications
- [ ] Price-change notifications
- [ ] Inspection reminders
- [ ] Buyer document checklist
- [ ] Secure buyer account only when justified by usage

### Communication

- [ ] Email newsletter subscription
- [ ] Segmented buyer updates
- [ ] New-property announcements
- [ ] Development-progress newsletters
- [ ] Monthly market briefing
- [ ] Webinar registration and reminders
- [ ] Referral tracking

## P4: Future DMZ Development Platform

These capabilities become relevant when DMZ Properties begins developing its own projects.

### Development Portfolio

- [ ] DMZ development-project index
- [ ] Individual development landing pages
- [ ] Master plans and unit or plot availability
- [ ] Construction milestones
- [ ] Progress photography and video archive
- [ ] Development team and partner profiles
- [ ] Project brochures and specification downloads
- [ ] Project-specific enquiry funnels
- [ ] Completed development portfolio

### Client Portal

- [ ] Secure client authentication
- [ ] Allocation and purchase records
- [ ] Payment schedule and receipt history
- [ ] Document access
- [ ] Construction or infrastructure updates
- [ ] Support requests
- [ ] Appointment scheduling
- [ ] Notification preferences

### Commercial Operations

- [ ] Inventory and reservation management
- [ ] Sales allocation workflow
- [ ] Payment-plan tracking
- [ ] Commission and referral tracking
- [ ] Partner and agent management
- [ ] Transaction reporting
- [ ] Development performance reporting
- [ ] Accounting integration

## Brand And Design Tracker

- [x] Establish the Plotline logo concept
- [x] Create primary, reversed, monochrome, and mark-only logos
- [x] Apply the logo to the website
- [x] Create a non-indexed brand preview page
- [x] Document initial logo and color usage
- [ ] Review and approve the final logo geometry
- [ ] Convert all final logo typography to vector outlines
- [ ] Create print-ready PDF and EPS assets
- [ ] Create social profile and cover assets
- [ ] Create email signature
- [ ] Create property sign templates
- [ ] Create property brochure template
- [ ] Create letterhead and business card templates
- [ ] Define final photography direction using genuine property images
- [ ] Complete a formal brand guideline document

## Current Technical Debt And Temporary Content

- [!] Property records in `src/lib/content.ts` are representative placeholders
- [x] Replace Unsplash photography with supplied KYC Homes Phase II images
- [!] Enquiry delivery requires Resend credentials in the production environment
- [!] In-memory rate limiting must be replaced by a shared production store at scale
- [!] `dmzproperties.com` is currently assumed in metadata and must be confirmed
- [!] Title type, pricing, dimensions, and payment terms are not yet supplied
- [x] Estate location confirmed as KYC Homes Phase II, Sabon Lugbe, Airport Road, Abuja, FCT
- [!] The logo remains a first design direction pending final approval
- [ ] Replace temporary content before indexing or advertising the website

## Launch Completion Definition

The website is ready for public launch only when:

- [ ] All P0 items are complete
- [ ] Every published property has current, approved, and verifiable information
- [ ] All temporary images and contact details are replaced
- [ ] Enquiries are delivered reliably and tested end to end
- [ ] Legal and privacy content has been reviewed
- [ ] Analytics and search tools are connected
- [ ] Mobile, accessibility, performance, and SEO checks pass
- [ ] The production domain, SSL, sitemap, and metadata are verified
