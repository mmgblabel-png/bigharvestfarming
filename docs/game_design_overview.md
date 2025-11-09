# Big Harvest Farming – Game Design Overview

## Vision Statement
Big Harvest Farming is a cozy-yet-deep mobile farming simulation where players rebuild a family homestead into a thriving agricultural enterprise. The experience blends satisfying production loops, social collaboration, and a steady cadence of live events that give players new goals every session.

## Target Audience
- Casual and mid-core players who enjoy relaxed management sims.
- Fans of farming games (e.g., Goodgame Big Farm) looking for modern mobile polish.
- Cooperative gamers interested in collaborative goals and friendly competition.

## Platform & Business Model
- **Platforms:** iOS and Android (tablets and phones).
- **Model:** Free-to-play with optional in-app purchases for speed-ups, cosmetics, seasonal passes, and premium currencies.
- **Fairness Principles:** Every feature is accessible without spending; purchases shorten timers, unlock exclusive vanity, or provide flexible resource bundles.

## Core Pillars
1. **Meaningful Growth:** Players feel tangible progress through building upgrades, land expansion, and evolving production chains.
2. **Community First:** Co-ops, shared events, and player-to-player support foster friendships and retention.
3. **Player Agency:** Multiple viable strategies (crop specialization, animal husbandry, artisan goods) ensure choice and replayability.
4. **Live World:** Recurring events, rotating quests, and seasonal content keep the farm feeling alive.

## Gameplay Loop
1. **Plant & Harvest:** Select crops suited to season and demand, nurture them, and harvest on time.
2. **Raise Livestock:** Maintain feed cycles, keep animals happy, and collect produce (eggs, milk, wool, meat).
3. **Process Goods:** Convert raw ingredients into higher-tier products via bakeries, dairies, smokehouses, etc.
4. **Trade & Fulfill Orders:** Deliver goods to market stands, cooperative requests, and timed contracts.
5. **Invest & Expand:** Use profits to expand land, upgrade buildings, and unlock decorations that improve happiness multipliers.

## Progression Structure
- **Player Level:** Earned via XP from farming actions, orders, and quests. Unlocks new crops, animals, and buildings.
- **Land Expansions:** Grid-based plots purchased with coins, certificates, and cooperative reputation.
- **Building Upgrades:** Each building has up to 6 upgrade tiers, improving output, reducing production time, or unlocking new recipes.
- **Research Tree:** Cooperative-driven research grants passive boosts (e.g., crop yield +5%, animal happiness decay -10%).

## Economy Overview
- **Currencies:**
  - Coins (soft): Standard purchases, upgrades, land expansions.
  - Gems (hard): Premium currency used for speed-ups, exclusive decor, event bundles.
  - Reputation Points (RP): Earned via co-op activities; spend on community buildings and research.
  - Certificates: Rewarded from events/missions; required for late-game expansions and machines.
- **Production Timers:** Range from 2 minutes (lettuce) to 12 hours (aged cheese). Timers can be reduced via upgrades, boosts, or premium items.
- **Storage Management:** Barn and Silo capacity upgrades gate hoarding, encouraging regular selling/processing.

## Narrative & Setting
- Idyllic countryside with seasonal shifts (spring bloom, summer harvest, autumn festival, winter wonderland).
- Friendly cast of NPCs guiding tutorials and delivering story-driven quest lines.
- Players customize avatar and farm name; asynchronous friend visits show off personal style.

## Live Ops & Events
- **Seasonal Journeys:** 6-week themed passes (e.g., "Caribbean Cruise") with unique crops, decorations, and story beats.
- **Weekend Flash Events:** Short competitions (harvest races, crafting marathons) awarding limited-time boosters.
- **Community Milestones:** Server-wide goals that unlock rewards when combined contributions reach milestones.
- **Rotating Mini-Games:** Fishing derby, delivery drones, and treasure hunts break core loop monotony.

## Social Systems
- **Cooperatives:** Up to 30 members, shared chat, donation board, and co-op quests with shared reward pools.
- **Research Lab:** Co-op members contribute resources/time to unlock tech bonuses.
- **Visitor Board:** Players request specific goods; friends fulfill for XP, coins, and relationship points.
- **Leaderboards:** Rotating, skill-based, and bracketed by player level to keep competition fair.

## Monetization & Retention
- **Hard Currency Bundles:** Tiered offers with best value at first purchase (one-time double bonus).
- **Season Pass:** Paid track with premium rewards; free track ensures non-paying players still progress.
- **Decor Packs:** Limited-time visual sets matching event themes.
- **Ad Monetization:** Optional rewarded ads for small speed-ups or bonus yields (capped daily).
- **Retention Hooks:** Daily quests, streak rewards, farmhands that collect while offline, and social reminders.

## Technical Considerations
- **Architecture:** Client built in Unity or Unreal Mobile; backend services (player data, matchmaking, events) hosted via scalable cloud infrastructure (e.g., AWS/GCP) with real-time messaging for co-op chat.
- **Data Integrity:** Deterministic timers managed server-side to prevent cheating; delta synchronization to minimize bandwidth.
- **Content Pipeline:** Weekly content updates delivered via remote config to reduce app store submissions.
- **Analytics:** Event tracking for onboarding, conversion, retention, and economy health.

## Art & Audio Direction
- **Visuals:** Bright, cartoon-inspired, high saturation palette. Buildings have clear silhouettes and upgrade states.
- **Animation:** Emphasize lively farm activities—animals bounce, crops sway, machines chug.
- **Audio:** Relaxed acoustic soundtrack with seasonal variations; dynamic SFX for actions (watering, feeding, crafting).

## Next Steps
1. Build detailed economy spreadsheets for crops, animals, and recipes.
2. Prototype core farming loop with placeholder art and UI.
3. Conduct playtests focusing on onboarding clarity and session length.
4. Expand documentation for live ops calendar, social UX flows, and monetization pricing.
