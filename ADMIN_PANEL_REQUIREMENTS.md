# Admin Panel Requirements For Alka Traders

This document defines the required admin panel for the current Alka Traders storefront. It is based on the existing frontend codebase, not a generic ecommerce template.

The current frontend is a React/Vite storefront with static data. Products, brands, industries, offices, FAQs, testimonials, and categories are hardcoded in `src/data/*`. Product images are served from `public/images`. The storefront already supports product listing, filters, product details, cart, checkout, simulated login, RFQ, make-offer flow, multilingual UI text, brands, industries, contact information, emergency procurement pages, and search.

The admin panel should turn those static frontend values into managed store data.

## Current Storefront Facts

- Frontend framework: React, TypeScript, Vite, Tailwind-style CSS, Zustand, React Router.
- Main customer routes: `/`, `/shop`, `/products`, `/product/:id`, `/brands`, `/industries`, `/rfq`, `/contact`, `/search`, `/emergency`, `/network`, `/intelligence`, `/checkout`.
- Product source today: `src/data/products.ts`.
- Product image source today: `public/images/product-001_electrical.jpg` style files.
- Product model already includes: id, filename, name, brand, sku, category, industry, availability, specs, description, condition, price, sale price, stock, images, label, new-arrival flag, date added, and make-offer flag.
- Product count in data references roughly 255 products, but `public/images` currently has 133 `product-*.jpg` files. Admin image validation is required so listings do not point to missing assets.
- Cart, checkout, RFQ, offers, and auth are currently simulated in frontend state. A real admin panel requires a backend database and APIs.

## Admin Panel Goal

The admin panel must let a store manager run the complete day-to-day store without editing code. The manager should be able to:

- Add, edit, hide, publish, and organize products.
- Upload and manage product images.
- Control product pricing, stock, condition, sale badges, and availability.
- Handle RFQ submissions, product inquiries, make-offer requests, contact messages, and orders.
- Manage brands, categories, industries, homepage featured sections, contact details, and store settings.
- Review operational dashboards that directly support store work.
- Maintain SEO and multilingual content where the storefront already exposes multilingual UI.

The admin panel should not become a social feed, blog platform, CRM replacement, accounting suite, or analytics-heavy enterprise dashboard unless those are later required.

## Required Admin Navigation

The admin panel should have these primary sections:

1. Dashboard
2. Products
3. Media Library
4. Categories
5. Brands
6. Industries
7. Orders
8. RFQs
9. Offers
10. Customers
11. Messages
12. Homepage Content
13. Store Settings
14. Users And Roles
15. Audit Log

## 1. Dashboard

The dashboard should show only operational information useful to a store manager.

Required widgets:

- Products summary: total products, published products, draft products, hidden products, out-of-stock products, emergency-available products.
- Stock alerts: products with stock count at or below configured threshold.
- Missing image alerts: products with no main image or image URL not found.
- RFQ queue: new RFQs, urgent RFQs, emergency RFQs, overdue RFQs.
- Orders queue: new orders, payment pending, ready to process, shipped, cancelled.
- Offer queue: new make-offer requests, accepted, rejected, expired.
- Recent activity: latest product edits, order status changes, RFQ responses, user logins.

Useful quick actions:

- Add product.
- Upload product images.
- Create category.
- View new RFQs.
- View new orders.

Avoid:

- Decorative graphs that do not change store operations.
- Vanity metrics like page animations, theme preview counts, or non-actionable visit counters.

## 2. Product Management

Product management is the most important admin feature for this store.

### Product List

The product list should support:

- Search by product name, SKU, brand, part number, category, and internal notes.
- Filters by category, brand, industry, condition, availability, stock status, sale status, new arrival, featured status, image status, and publish status.
- Sort by newest, oldest, name, SKU, price, stock count, category, and last updated.
- Bulk actions for publish, unpublish, assign category, assign brand, mark new arrival, mark sale, update availability, export CSV, and delete/archive.
- Clear status indicators: draft, published, hidden, out of stock, sale, emergency, missing image.

### Product Fields

Each product must support these fields.

Identity:

- Product ID: system generated, stable, not manually reused.
- Product name: required.
- SKU: required and unique.
- Slug: auto-generated from name but editable.
- Brand: required, selected from brand list or created inline.
- Category: required, selected from approved category list.
- Industries: multi-select, because current frontend products can belong to multiple industries.
- Product type: physical product, sourced-on-request, spare part, surplus item.

Catalog content:

- Short description: used on cards and search previews.
- Full description: used on product detail page.
- Key features: repeatable bullet list.
- Technical specifications: dynamic key-value table.
- Included items: optional list.
- Excluded items: optional list.
- Compatibility notes: optional text for engines, vessels, systems, part numbers, or OEM replacements.
- Condition notes: required for used, refurbished, reconditioned, unused, or surplus equipment.
- Warranty or guarantee notes.

Pricing:

- Regular price.
- Sale price.
- Sale start date.
- Sale end date.
- Currency.
- Price visibility: show price, hide price and show RFQ, or show "contact for price".
- Make-offer enabled.
- Minimum acceptable offer value, visible only to admins.

Inventory:

- In stock toggle.
- Stock count.
- Low-stock threshold.
- Availability status: in stock, sourced, emergency, out of stock.
- Warehouse/location.
- Item location shown to customer.
- Lead time.
- Reserved quantity.
- Backorder/sourcing allowed.

Condition:

- New.
- Unused/new old stock.
- Used.
- Refurbished.
- Reconditioned.

Images:

- Main image.
- Gallery images.
- Image alt text.
- Image labels such as Main, Side, Detail, Nameplate, Serial Plate, Packaging, Test Report.
- Drag-and-drop image ordering.
- Replace image without changing product data.
- Remove image from product without deleting from media library.

Badges and merchandising:

- New arrival toggle.
- Featured product toggle.
- Sale badge toggle.
- Emergency availability badge.
- Custom label text.
- Custom label color.
- Homepage section placement.
- Sort priority/manual ranking.

SEO:

- Meta title.
- Meta description.
- Open Graph image.
- Canonical URL.
- Search keywords, including part numbers and alternate spellings.

Publishing:

- Draft.
- Published.
- Hidden.
- Archived.
- Scheduled publish date.
- Last updated by.
- Last updated date.

Admin-only data:

- Internal notes.
- Purchase/source cost.
- Supplier reference.
- Original source link.
- Internal quality checklist.
- Admin attachments such as invoices, test reports, or supplier documents.

### Product Create/Edit UX

The add/edit product screen should be divided into practical tabs:

- Basics
- Images
- Pricing
- Inventory
- Specifications
- Shipping
- SEO
- Admin Notes

Required validation:

- Name is required.
- SKU is required and unique.
- Category is required.
- Brand is required.
- At least one image is required before publishing.
- Main image must exist.
- Sale price must be lower than regular price.
- Stock count cannot be negative.
- Out-of-stock products cannot show as in stock.
- Emergency products should require a response/handling note.
- Published products should have a description and valid image alt text.

## 3. Media Library

Because this storefront depends heavily on product images, the media manager is required.

Required features:

- Upload JPG, PNG, WebP, and AVIF.
- Bulk upload.
- Drag-and-drop upload.
- Automatic image optimization.
- Automatic thumbnail generation.
- Optional WebP/AVIF conversion.
- File size limit warnings.
- Duplicate detection by filename and image hash.
- Rename file safely.
- Search images by filename, product, SKU, brand, category, and upload date.
- Show which products use each image.
- Prevent deleting images currently used by published products unless replaced.
- Add alt text and labels to images.
- Detect missing images referenced by products.

Recommended image rules:

- Main product image should be square or close to square.
- Minimum recommended size: 800x800.
- Admin should be warned for blurry, very small, or extremely large images.
- Product gallery should support at least 8 images per product.
- Image types should include main view, side view, detail view, serial/nameplate, packaging, and condition proof.

## 4. Categories

Current frontend categories include marine equipment, electrical automation, hydraulic systems, pneumatic systems, spares, surplus inventory, lifting and handling, tools, safety, hand tools, ship navigation, marine pumps, engine spare parts, engine parts, motors and components, ship machinery, hydraulic pumps, rigging, and other business/industrial.

Required category fields:

- Category name.
- Slug.
- Parent category, optional.
- Description.
- Icon name.
- SEO title.
- SEO description.
- Sort order.
- Published/hidden status.
- Product count, calculated automatically.

Required features:

- Add/edit/delete/archive category.
- Reorder categories.
- Assign products to category.
- Prevent deleting categories with products unless products are moved first.
- Category page preview.

## 5. Brands

Brands are first-class storefront data and are used in filters, brand pages, product detail pages, and marquee sections.

Required brand fields:

- Brand name.
- Slug.
- Logo.
- Sectors such as Marine, Industrial, Automation, Hydraulic, Pneumatic.
- Description.
- Website, optional.
- Country, optional.
- Published/hidden status.
- Product count, calculated automatically.
- SEO title and description.

Required features:

- Add/edit/archive brand.
- Upload brand logo.
- Assign products to brand.
- Show missing logo warnings if brand pages require logos.
- Manage brand marquee lists.

## 6. Industries

Industries are used to position products for marine shipping, shipyards, oil and gas, power generation, manufacturing, and chemical processing.

Required industry fields:

- Industry name.
- Slug.
- Icon.
- Description.
- Pain points.
- Product count, calculated automatically.
- Related products/categories.
- SEO title and description.
- Published/hidden status.

Required features:

- Add/edit/archive industry.
- Assign products to industries.
- Reorder industry display.
- Manage industry copy without editing code.

## 7. Orders

The current checkout creates simulated orders. A real admin panel must persist and manage them.

Required order fields:

- Order ID.
- Customer.
- Email.
- Phone, if collected.
- Items.
- Quantities.
- Product price at purchase time.
- Subtotal.
- Shipping cost.
- Tax.
- Grand total.
- Payment method.
- Payment status.
- Fulfillment status.
- Shipping address.
- Billing address, if different.
- Tracking number.
- Courier.
- Admin notes.
- Customer notes.
- Cancellation request and reason.

Order statuses:

- Pending.
- Confirmed.
- Payment pending.
- Paid.
- Processing.
- Packed.
- Shipped.
- Delivered.
- Cancel requested.
- Cancelled.
- Refunded.

Required features:

- View all orders.
- Filter by status, date, customer, payment method, country, and product.
- Update order status.
- Add tracking information.
- Print or download order summary.
- Email/send status updates.
- Handle cancellation requests.
- Restore stock when order is cancelled.
- Reduce stock when order is confirmed or paid, depending on business rule.

## 8. RFQ Management

RFQ is central to this store because marine buyers often need rare parts, urgent sourcing, or quote-based buying.

Current RFQ form collects:

- Full name.
- Company.
- Email.
- Phone.
- Country.
- Role.
- Product description.
- Part number.
- Brand.
- Quantity.
- Delivery location.
- Urgency: standard, urgent, emergency.
- Notes.
- Source.
- Consent.

Required RFQ admin features:

- View RFQ inbox.
- Filter by urgency, status, country, date, assigned manager, brand, part number, and source.
- Assign RFQ to staff member.
- Add internal notes.
- Attach product images, supplier quotes, PDFs, or test reports.
- Change RFQ status.
- Convert RFQ to quote.
- Convert RFQ to order.
- Link RFQ to existing product or create new product from RFQ.
- Send response email or WhatsApp-ready message.
- Track response deadline.

RFQ statuses:

- New.
- Reviewing.
- Awaiting supplier.
- Quote sent.
- Customer replied.
- Won.
- Lost.
- Closed.

Emergency handling:

- Emergency RFQs should appear at top of dashboard.
- Emergency RFQs should have a required response SLA.
- Admin should be able to mark "called customer", "WhatsApp sent", or "supplier contacted".

## 9. Offers

Product detail includes a make-offer flow. The admin panel must capture and manage these offers.

Required offer fields:

- Offer ID.
- Product.
- Product SKU.
- Customer email.
- Offered price.
- Quantity, if added later.
- Message, optional.
- Status.
- Created date.
- Expiry date.
- Admin notes.

Offer statuses:

- New.
- Accepted.
- Rejected.
- Countered.
- Expired.
- Converted to order.

Required features:

- View offers by product, customer, date, and status.
- Accept offer.
- Reject offer.
- Send counter-offer.
- Convert accepted offer into order.
- Show product regular price, sale price, stock count, and minimum acceptable offer to admin.

## 10. Customer Management

Current auth is simulated. A real admin panel should support customer records.

Required customer fields:

- Name.
- Email.
- Phone.
- Company.
- Country.
- Role.
- Addresses.
- Orders.
- RFQs.
- Offers.
- Last login.
- Account status.

Required features:

- Search customers.
- View customer order/RFQ/offer history.
- Add admin notes.
- Disable customer account.
- Reset password or send reset link.
- Merge duplicate customers by email, if needed.

Not required for MVP:

- Loyalty points.
- Customer segmentation campaigns.
- Complex CRM pipelines.

## 11. Contact Messages

The contact page currently has a form but no backend submission.

Required fields:

- Name.
- Email.
- Subject.
- Message.
- Created date.
- Status.
- Assigned manager.
- Internal notes.

Required features:

- View contact message inbox.
- Mark as new, read, replied, archived.
- Reply via email integration or copy response.
- Convert message to RFQ if product sourcing is requested.

## 12. Homepage And Storefront Content

The storefront has several content-driven sections: hero, shipping badges, new arrivals, categories, how-it-works, industries, brand marquees, RFQ CTA, testimonials, footer, contact offices, and navigation.

The admin panel should manage only the content that store staff realistically needs to change.

Required content controls:

- Hero heading, subheading, CTA labels, CTA links, and hero media.
- Homepage new-arrivals selection or automatic mode.
- Featured product selection.
- Shipping/service badges.
- RFQ CTA text and links.
- Testimonials.
- Office/contact locations.
- Footer contact details.
- WhatsApp number.
- RFQ email.
- Phone number.
- Social links.
- Brand marquee entries.

Recommended:

- Page preview before publishing.
- Content draft/publish workflow.
- Basic version history.

Avoid:

- Full visual page builder for MVP.
- Arbitrary layout editing that can break the storefront design.

## 13. Store Settings

Required store settings:

- Store name.
- Logo.
- Favicon.
- Default currency.
- Supported currencies, if needed later.
- Default country.
- Contact email.
- RFQ email.
- WhatsApp number.
- Phone number.
- Business address.
- Office locations.
- Tax percentage.
- Shipping flat rate.
- Free shipping threshold, if used.
- Order ID prefix.
- RFQ ID prefix.
- Low-stock threshold.
- Default product publish status.
- Default image placeholder.

Payment settings:

- Enable/disable card payment.
- Enable/disable PayPal.
- Enable/disable manual bank transfer.
- Payment provider credentials should be configured securely outside the frontend.

Shipping settings:

- Shipping countries.
- Blocked countries/regions.
- Courier options.
- Default handling time.
- Shipping cost rules.

## 14. Multilingual Content

The storefront supports English, Arabic, and Spanish through locale JSON files. Admin-created content should be ready for multilingual fields.

Required:

- English fields required.
- Arabic and Spanish fields optional at first.
- Translation fields for product name, descriptions, category names, brand descriptions, industry descriptions, homepage text, badges, and SEO metadata.
- RTL preview for Arabic.
- Fallback to English when translation is missing.

Do not require full translation workflow in MVP, but structure the database so translations can be added without redesign.

## 15. Admin Users And Roles

Required roles:

- Owner: full access, user management, settings, billing/payment settings.
- Store Manager: products, orders, RFQs, offers, customers, messages, content.
- Inventory Manager: products, stock, media, categories, brands.
- Sales/RFQ Agent: RFQs, offers, customers, messages, order viewing.
- Content Manager: homepage content, testimonials, offices, SEO fields.
- Viewer: read-only access.

Required security:

- Admin login.
- Strong password requirements.
- Password reset.
- Optional two-factor authentication.
- Role-based permissions.
- Session timeout.
- Audit log for important changes.

## 16. Audit Log

The audit log should record:

- Product created, edited, published, hidden, archived, deleted.
- Price changes.
- Stock changes.
- Image changes.
- Order status changes.
- RFQ status changes.
- Offer decisions.
- User login/logout.
- Settings changes.
- Admin user permission changes.

Each log entry should include:

- Actor.
- Action.
- Entity type.
- Entity ID.
- Previous value where practical.
- New value where practical.
- Timestamp.
- IP/device metadata if available.

## 17. Search And Filtering Admin Controls

The public product search currently checks product name, SKU, and brand. Admin data should support stronger search.

Required searchable fields:

- Product name.
- SKU.
- Brand.
- Category.
- Industry.
- Description.
- Specs.
- Part number aliases.
- Internal tags.

Admin should be able to add:

- Search keywords.
- Alternate SKUs.
- OEM references.
- Compatible model numbers.

## 18. Backend And Database Requirements

The current frontend cannot support a real admin panel by itself because data is static in TypeScript files and browser state. A backend is required.

Minimum backend entities:

- users
- admin_users
- roles
- permissions
- products
- product_images
- media_assets
- categories
- brands
- industries
- product_industries
- orders
- order_items
- rfqs
- offers
- customers
- contact_messages
- homepage_sections
- store_settings
- audit_logs

Recommended API groups:

- `/api/admin/auth`
- `/api/admin/products`
- `/api/admin/media`
- `/api/admin/categories`
- `/api/admin/brands`
- `/api/admin/industries`
- `/api/admin/orders`
- `/api/admin/rfqs`
- `/api/admin/offers`
- `/api/admin/customers`
- `/api/admin/messages`
- `/api/admin/content`
- `/api/admin/settings`
- `/api/storefront/products`
- `/api/storefront/categories`
- `/api/storefront/brands`
- `/api/storefront/industries`
- `/api/storefront/rfq`
- `/api/storefront/contact`
- `/api/storefront/orders`

Storefront should read product/catalog data from public storefront APIs, while admin should use protected admin APIs.

## 19. Product Database Shape

Recommended product fields:

```text
id
slug
name
sku
brand_id
category_id
status
availability
condition
short_description
description
regular_price
sale_price
sale_starts_at
sale_ends_at
currency
show_price
make_offer_enabled
minimum_offer_price
stock_count
low_stock_threshold
warehouse_location
public_item_location
lead_time
is_new_arrival
is_featured
custom_label
custom_label_color
sort_priority
seo_title
seo_description
og_image_id
internal_notes
created_at
updated_at
created_by
updated_by
```

Recommended product image fields:

```text
id
product_id
media_asset_id
url
alt_text
label
sort_order
is_main
created_at
```

Recommended specification fields:

```text
id
product_id
name
value
sort_order
is_public
```

## 20. Product Publishing Workflow

Recommended workflow:

1. Admin creates draft product.
2. Admin uploads images and sets main image.
3. Admin enters price, stock, category, brand, condition, and description.
4. System validates required fields.
5. Admin previews product page.
6. Admin publishes product.
7. Product appears in `/products`, `/shop`, search, category filters, brand filters, and related product sections.

Publishing blockers:

- Missing name.
- Missing unique SKU.
- Missing brand.
- Missing category.
- Missing main image.
- Main image file missing.
- Invalid price.
- Negative stock.

Publishing warnings:

- Missing SEO title.
- Missing SEO description.
- Missing alt text.
- Description too short.
- No specifications.
- Brand has no logo.

## 21. Admin Panel MVP Priority

Build in this order.

### Phase 1: Essential Store Management

- Admin authentication.
- Product CRUD.
- Product image upload and media library.
- Category management.
- Brand management.
- Product publish/draft/hidden status.
- Product stock, price, sale price, condition, availability.
- RFQ inbox.
- Contact message inbox.
- Basic dashboard.

### Phase 2: Commerce Operations

- Real customer accounts.
- Real cart/order persistence.
- Order management.
- Offer management.
- Cancellation requests.
- Email notifications.
- Stock adjustments from orders.
- Audit log.

### Phase 3: Content And Growth

- Homepage content management.
- Testimonials/offices/footer management.
- Industry pages management.
- SEO fields.
- Multilingual product/content fields.
- CSV import/export.
- Advanced search keywords and aliases.

### Phase 4: Advanced Operations

- Supplier management.
- Purchase cost and margin tracking.
- Quote PDF generation.
- Multi-warehouse inventory.
- Role-level approval workflows.
- Advanced reporting.

## 22. Features Not Worth Building Now

These are not required for this store manager admin panel at MVP stage:

- Blog/news CMS.
- Loyalty points.
- Gift cards.
- Coupons and complex promotion engine.
- Marketplace seller portal.
- Subscription billing.
- Live chat system built from scratch.
- AI chatbot.
- Complex CRM pipeline.
- Accounting ledger.
- Warehouse barcode scanning.
- Mobile app admin.
- Drag-and-drop page builder.
- Social media scheduler.
- Product reviews, unless customer trust strategy later requires it.
- Wishlists, unless real customer accounts become a priority.

## 23. Store Manager Daily Workflow

A practical store manager should be able to complete these workflows quickly.

Add product:

1. Open Products.
2. Click Add Product.
3. Enter name, SKU, brand, category, condition, price, stock, availability.
4. Upload main image and gallery images.
5. Add description and specifications.
6. Preview product.
7. Publish.

Update stock:

1. Search SKU.
2. Open quick stock editor.
3. Change stock count and availability.
4. Save.
5. Audit log records the change.

Handle RFQ:

1. Open RFQ queue.
2. Filter emergency/urgent first.
3. Review customer and product details.
4. Assign to staff or self.
5. Add supplier notes.
6. Send quote or response.
7. Mark status.

Handle order:

1. Open Orders.
2. Review new order.
3. Confirm payment.
4. Pack item.
5. Add tracking.
6. Mark shipped.
7. Customer receives update.

Replace product image:

1. Open product.
2. Go to Images tab.
3. Upload new image.
4. Set as main image.
5. Add alt text.
6. Save.
7. Storefront updates automatically.

## 24. Success Criteria

The admin panel is successful when:

- Store staff can publish a new product with images without editing code.
- Public catalog updates immediately after publish.
- Product image references never break silently.
- RFQs and offers are captured and visible to staff.
- Orders are persistent and manageable.
- Stock and availability shown on the storefront are controlled from admin.
- Contact details, WhatsApp number, homepage featured products, brands, categories, and industries can be updated safely.
- Admin actions are permission-controlled and audit logged.

