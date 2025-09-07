# Security, Privacy, and Data Processing

This document explains Trellis V4's current security posture, vendor data flows, and data processing agreements (DPAs).

## Data Storage and Processing

- Application database: PostgreSQL (via Prisma)
- Authentication and storage: Supabase
- AI processing: Anthropic and OpenAI (configurable)

### Supabase Storage
- Bucket intended for user-uploaded images is configured as private. Public bucket access is not required.
- Files are uploaded using a service role key on the server; the API returns a storage path and a short-lived signed URL for client display.
- The database stores only the storage path (not a public URL). API responses sign paths on-demand to minimize public exposure.

### Authentication Cookies
- Server-written cookies are set with httpOnly: true, sameSite: lax, and secure in production.
- Session handling uses Supabase SSR helpers; middleware also enforces secure flags and clears tokens on redirect.

## API Security

- Mutating routes implement basic, in-memory rate limiting keyed by client IP.
- Validation uses Zod for payloads, early returns for invalid/unauthorized requests.
- Authorization restricts entities by `schoolId`.

## Content Security Policy and Headers

Middleware sets a baseline set of headers:
- Content-Security-Policy with self defaults and required connect-src/img-src for Supabase and AI APIs
- Referrer-Policy: strict-origin-when-cross-origin
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Permissions-Policy: camera=(), microphone=(), geolocation=()

Adjust CSP directives if you add new third-party domains or inline scripts.

## Third-Party Providers and Data Policies

- Supabase: Authentication, Postgres, Storage
  - Data stored: user profiles, tokens (by provider), uploaded files (e.g., teacher photos)
  - Recommended agreements: DPA and SCCs as applicable
- Anthropic (Claude) / OpenAI
  - Data sent: prompts and minimal context needed for generation; avoid sending PII unnecessarily
  - Configure provider settings to disable training on customer content where available
  - Recommended agreements: Enterprise terms and DPA/SCCs as applicable

## DPAs and Compliance

- Execute DPAs with Supabase, OpenAI, and Anthropic prior to production usage with personal data.
- Ensure records of processing activities (RoPA) and a data retention policy.
- Honor data subject requests: deletion from DB and storage; reissue signed URLs as needed.

## Incident Response

- Log errors server-side without sensitive payloads.
- On credential leakage or data exposure, rotate Supabase service keys, invalidate tokens, and audit access logs.

## Configuration Checklist

- SUPABASE_STORAGE_BUCKET private; disable public URLs
- SUPABASE_SERVICE_ROLE_KEY configured only on server
- NEXT_PUBLIC_SUPABASE_URL/ANON_KEY required for client auth
- Enable HTTPS and set `NODE_ENV=production` in production
- Verify CSP covers all required domains


