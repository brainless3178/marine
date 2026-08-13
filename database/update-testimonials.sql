-- Alka Traders — refresh the three seeded testimonials with the new
-- customer reviews shared Aug 12, 2026.
--
-- Safe: updates by primary key only (no deletes), idempotent (safe to run
-- more than once). Run this in the Neon SQL console for PRODUCTION.
-- (The full reseed in database/MEGA_SETUP.sql also contains these, but it
--  DROPs tables — prefer this file for a running production DB.)

UPDATE testimonials
SET name = 'fuegocat77 (276)',
    text = 'Record 91 ½ C Pipe Vise received as pictured on eBay. Shipping was very fast and FREE, with unexpectedly quick delivery from India. Packaging could have been better. Item shipped in corrugated cardboard box completely wrapped in duck tape. Vise itself was heavily covered in bubble wrap. Box was padded with pieces of Styrofoam on the sides and top, but not the bottom. As a result, the front mounting pad wore through the box, resulting in scraped paint. Nothing broken, so not an issue.',
    rating = 5
WHERE id = 'a0000001-0000-0000-0000-000000000001';

UPDATE testimonials
SET name = 'noraedward (1104)',
    text = 'Very helpful seller. They investigated the issue I had when the delivery company delivered my parcel to the wrong person. Was very quick to address the situation, keep me informed and get the parcel delivered to me. Would recommend.',
    rating = 5
WHERE id = 'a0000002-0000-0000-0000-000000000002';

UPDATE testimonials
SET name = 'b2esurplus (7400)',
    text = 'Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Good appearance. Thank you for the good transaction! All five stars. At B2E Surplus (aka Back to Earth Surplus), we buy and sell a lot of similar merchandise. We are always interested in bulk lots and/or good deals on industrial supplies. Look us up anytime!',
    rating = 5
WHERE id = 'a0000003-0000-0000-0000-000000000003';
