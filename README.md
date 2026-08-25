# Everything Remote Job — Production Website

This repository contains the current production website for **Everything Remote Job (ERJ)** at **everythingremotejob.com**.

It is a deployment repository, not a changelog. This README describes only the website and commercial structure represented by the files currently in this repository.

## Business

**Everything Remote Job** is a career-outcomes company operated by **Business Play Limited**.

- Brand: Everything Remote Job
- Tagline: **Work Beyond Borders.**
- Primary domain: **everythingremotejob.com**
- WhatsApp: **+234 803 292 5957**
- Core method: **Supply · Representation · Aim · Conversion**
- Primary conversion instruction: **Find your leak.**

The public website combines free diagnostic resources, live training, self-paced learning, done-for-you job application services and private 1:1 support.

## Current Cohort 10 campaign

- **Enrolment closes:** Sunday, 30 August 2026 · 8:00 PM WAT
- **Cohort 10 begins:** Monday, 31 August 2026 · 8:00 PM WAT
- **Remote Job Application Clinic:** Saturday, 29 August 2026 · 7:00 PM WAT · Zoom registration

### Cohort 10 reservation

Qualified Foundation Training prospects may reserve a Cohort 10 place after a **Registrar fit check**.

- Reservation: **₦50,000**
- Full Foundation Training tuition: **₦250,000**
- Balance after reservation: **₦200,000**
- Balance deadline: **Sunday, 30 August 2026 · 6:00 PM WAT**
- Payment route: official **Business Play Ltd** bank account after fit confirmation
- Reservation may be moved to the next cohort or refunded on request, less applicable bank/payment service charges actually incurred

The website should route a prospect through **COHORT FIT** before the reservation is paid.

## Current offer structure

### Free

- Four-Point Job Search Diagnostic
- 10-Point CV Self-Scan
- Remote Job Application Clinic
- Remote Career Blog
- WhatsApp Global Job Board

### Self-Learn Pack

- **₦35,000**
- Self-paced Stages 1–4

### Remote Job Foundation Training

- **Stages 1–4 together: ₦250,000**
- Stage 1 — Remote Mindset Blueprint: **₦70,000**
- Stage 2 — The Digital Toolkit: **₦130,000**
- Stage 3 — Async Communication Mastery: **₦70,000**
- Stage 4 — Start Your Remote Career: **₦100,000**

### Done-For-You Application

- 7-Day Job Hunt & Application: **₦50,000**
- Stage 5 Done-For-You Placement Engine: **₦300,000**
- Stages 1–5 / Get Your Dream Job Offer: **₦500,000**

### Inner Circle

- **₦250,000 once**
- Private 1:1
- Application-first
- Admission is confirmed before payment
- Operates one-on-one rather than on the Cohort 10 countdown

## Current payment routes

Depending on the product, the website uses:

- Paystack
- Selar
- Business Play Ltd bank transfer confirmed through WhatsApp

For the **₦50,000 Cohort 10 reservation**, the prospect completes the Registrar fit check before receiving/using the bank-transfer route.

## Website structure

The site is a static HTML/CSS/JavaScript website hosted on **GitHub Pages** with the custom domain defined in `CNAME`.

Key production areas include:

- `/` — main website
- `/register.html` — offer chooser, prices and enrolment
- `/diagnose/` — Four-Point Job Search Diagnostic and branded PDF result
- `/cvscan/` — 10-Point CV Self-Scan
- `/cvbuilder/` — CV Engine / participant CV tooling
- `/foundationtraining/` — live Foundation Training
- `/selflearn/` — self-paced programme
- `/jobapplication/` — Done-For-You Application
- `/innercircle/` — private 1:1 Inner Circle
- `/masterclass/` — Remote Job Application Clinic registration flow
- `/blog.html` — Remote Career Blog archive
- `/testimonials.html` — documented success stories
- `/dashboard.html` — participant dashboard
- `/admin.html` — admin surface
- `/instructor.html` — instructor surface

## Blog publishing

The blog archive follows the **Africa/Lagos (WAT)** daily publication schedule. The archive should expose posts according to their scheduled date rather than simply displaying every pre-generated article file at once.

## Private-content treatment

Participant, admin and instructor surfaces are treated as private operational pages and use search-engine exclusion/no-cache controls where applicable.

Paid participant material carries ERJ licensing/ownership notices and participant-facing resource controls. Public website content remains normal accessible HTML; public pages are not presented as technically “uncopyable.”

## Brand assets

Use the official supplied ERJ artwork. Do not redraw the logo.

Primary masters in this repository:

- `erj-mark-dark.png`
- `erj-mark-light.png`
- `erj-lockup-dark.png`
- `erj-lockup-light.png`

Small interface derivatives such as the 128px marks, favicons and app icons exist only where the website actually uses them.

### Brand system

- Night canvas: `#000000`
- Day canvas: `#FAFAF8`
- Brand orange: `#FF5722`
- Day fill accent: `#E8470F`
- Day small accent text: `#AD350A`
- Display: Space Grotesk
- Body: Inter

## Deployment

This ZIP is intended to be deployed directly to the GitHub Pages repository root.

1. Extract the ZIP.
2. Upload/commit the extracted production files to the repository root.
3. Keep `CNAME` in the root so the custom domain remains attached.
4. Do not add internal campaign notes, historical patch notes, test reports or old versioned deployment files to the public production repository.
5. Keep this `README.md` current when the live commercial structure or production architecture changes.

There is no required build step for ordinary deployment; the repository contains the production-ready static files.

## Production documentation rule

`README.md` is the only production Markdown document required in this package.

It should always describe **what the website is now**. Historical implementation notes, patch records and temporary campaign-working documents belong outside the production repository.

---

**Everything Remote Job** · Work Beyond Borders.  
Trading as Everything Remote Job · Business Play Limited
