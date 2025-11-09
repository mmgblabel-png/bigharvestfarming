# Technical Architecture & Development Roadmap

## Client Technology Stack
- **Engine:** Unity (URP) for cross-platform mobile deployment.
- **Language:** C# scripting for gameplay logic; Shader Graph for stylized visuals.
- **UI Framework:** Unity UI Toolkit with custom responsive components for both portrait and landscape orientations.
- **Platform Integrations:**
  - iOS: Game Center, Apple Sign-In, in-app purchases.
  - Android: Google Play Games Services, Google Sign-In, Play Billing Library.
  - Cross-platform: Firebase/OneSignal for push notifications, Adjust for attribution.

## Backend Services
| Service | Responsibility | Technology Candidates |
| --- | --- | --- |
| Authentication | Account creation, SSO, guest upgrades | Cognito, Firebase Auth |
| Player Data | Persistent farm state, inventory, progression | DynamoDB, Firestore, or PostgreSQL via Hasura |
| Matchmaking & Social | Co-op membership, leaderboards, chat | Redis, Pub/Sub, AWS GameLift Realtime |
| Economy & Transactions | Currency balance, IAP validation, offers | Custom microservice + Stripe/Platform APIs |
| Live Ops Config | Remote events, offers, A/B tests | LaunchDarkly, Firebase Remote Config |
| Analytics | Telemetry pipeline, dashboards | BigQuery + Looker, Amplitude |

## Network Model
- **Authoritative Server:** Server validates production timers, currency changes, and order completions.
- **Client Prediction:** Limited to cosmetic actions; major actions require server acknowledgment.
- **Delta Sync:** Only changed entities transmitted to reduce bandwidth.
- **Offline Mode:** Players can queue actions offline; server reconciliation resolves conflicts on reconnect.

## Data Model Highlights
- **Farm Layout:** Grid of tiles storing building type, tier, and orientation.
- **Production Queues:** Each building has queue entries with start time, end time, input/output references.
- **Inventory:** Item catalog with stack limits and metadata (rarity, expiration).
- **Player Profile:** Contains XP, currencies, quest progress, social connections.

## Scalability Considerations
- Auto-scaling groups for API servers behind load balancers.
- Read/write separation for databases using replicas.
- Scheduled jobs for event rollovers and season resets.
- CDN delivery for asset bundles and remote config payloads.

## Tooling & Pipeline
- **Version Control:** Git with trunk-based development and gated merges.
- **CI/CD:** GitHub Actions or Jenkins building nightly beta, running automated tests, linting, and static analysis.
- **Automated Testing:**
  - Unit tests for economy math, quest logic, and data parsers.
  - Integration tests for API endpoints and timer reconciliation.
  - UI automation (Appium) for onboarding flow.
- **Build Distribution:** App Center/TestFlight/Internal Track for QA and stakeholder testing.

## Security
- HTTPS/TLS for all communication.
- Server-side validation of IAP receipts.
- Regular vulnerability scans and dependency patching.
- Player data encrypted at rest; comply with GDPR/CCPA for data privacy.

## Development Roadmap (Milestones)
1. **Prototype (0–3 months)**
   - Implement core farming loop (plant, harvest, sell).
   - Temporary UI and art; focus on feel and pacing.
   - Stubbed backend with local persistence.
2. **Alpha (4–6 months)**
   - Add livestock, basic processing, storage management.
   - Integrate live backend for account persistence.
   - Introduce order board and co-op skeleton.
3. **Beta (7–10 months)**
   - Full social features, events, monetization hooks.
   - First art pass with finalized UI/UX flows.
   - Soft launch in limited territories for telemetry.
4. **Global Launch (11–14 months)**
   - Content complete with 45+ buildings, 90+ products, 100+ decorations.
   - Seasonal pass and live ops calendar ready.
   - Marketing integration, localization, accessibility polish.
5. **Post-Launch Live Ops**
   - Weekly content drops, event rotation, economy tuning.
   - Introduce new regions, machines, and cooperative mega-projects.

## Risk Mitigation
- **Economy Complexity:** Build simulation tools to model resource flow before implementation.
- **Content Volume:** Establish modular asset pipeline with outsourced support for decorations.
- **Social Dependence:** Provide solo-friendly progression to avoid blocking players without co-ops.
- **Device Fragmentation:** Target 60 FPS on mid-tier devices; implement adaptive quality scaling.

## Collaboration Notes
- Design, engineering, art, and live-ops teams should maintain a shared product backlog (Jira/Notion).
- Weekly syncs align roadmap updates; monthly playtests gather qualitative feedback.
- Documentation stored in version control for traceability.
