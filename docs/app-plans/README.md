# Phone app implementation plan

## Scope and baseline

The launcher contains **42 apps**, not a real copy of iOS. The initial source baseline is `2fec7c2`. Its main gaps were simulated service actions, seeded data presented as personal/live data, transient state, and controls that changed labels without doing the underlying work.

Seven isolated Copilot worktrees own the app groups below. Each linked survey records app-specific findings, the implementation, and remaining limitations. The integration branch is local `main`; no remote deployment or account provisioning is implied.

## App-by-app work map

| App | Functional target | Survey and implementation |
| --- | --- | --- |
| Phone | Dialer, contacts and explicit handoff to a real calling application; no invented connected calls | [Communication and internet](communications-internet.md) |
| Contacts | Persistent contact editing, search, import/export and real communication handoffs | [Communication and internet](communications-internet.md) |
| FaceTime | Real external FaceTime handoff with accurate availability and permission feedback | [Communication and internet](communications-internet.md) |
| Messages | Local drafts and explicit SMS handoff; never claim delivery or synthesize replies | [Communication and internet](communications-internet.md) |
| Mail | Editable persistent drafts and mail-client handoff; no simulated sent messages | [Communication and internet](communications-internet.md) |
| Safari | Actual URL/search navigation, bookmarks and history; external browsing when embedding is unavailable | [Communication and internet](communications-internet.md) |
| Maps | Real place lookup and location/directions handoff, not fictional streets and travel times | [Communication and internet](communications-internet.md) |
| Weather | Location-based forecast retrieval with sources, units, loading and failure states | [Communication and internet](communications-internet.md) |
| Calendar | Persistent event creation/editing/deletion, date navigation and portable calendars | [Productivity](productivity.md) |
| Reminders | Persistent lists, tasks, completion, scheduling, filtering and editing | [Productivity](productivity.md) |
| Clock | Accurate stopwatch, timers, alarms and time zones with browser-lifecycle limits stated | [Productivity](productivity.md) |
| Notes | Persistent editable/searchable notes, deletion and portable import/export | [Productivity](productivity.md) |
| Calculator | Correct arithmetic, percentage/repeated-equals behavior and useful history | [Productivity](productivity.md) |
| Camera | Explicit real camera access, capture and durable gallery, with resource cleanup | [Media](media.md) |
| Photos | Imported/captured images, persistent library, viewing, organization and export | [Media](media.md) |
| Music | Real audio playback, seeking, library import and transport state from the media element | [Media](media.md) |
| Podcasts | Real episode audio playback and user-owned subscriptions/library, not fake progress | [Media](media.md) |
| TV | Real video playback/import and library; no claimed Apple TV subscription | [Media](media.md) |
| Books | Read actual imported text and retain reading progress; no fictional downloads | [Media](media.md) |
| Games | Actually playable local games and honest separation from Game Center | [Media](media.md) |
| Wallet | Local non-payment pass organizer; no card provisioning or simulated payment | [Home and wellness](home-wellness.md) |
| Find My | Manual belongings/places and opt-in device geolocation, not invented people tracking | [Home and wellness](home-wellness.md) |
| Home | Persistent room/accessory inventory and maintenance tasks, not pretend hardware controls | [Home and wellness](home-wellness.md) |
| iTunes Store | Personal media wishlist and external store lookup; no fake purchases | [Home and wellness](home-wellness.md) |
| Health | Validated manual health entries, editing, history and clear provenance | [Home and wellness](home-wellness.md) |
| Fitness | Real elapsed workouts and persistent history without fabricated calories or distance | [Home and wellness](home-wellness.md) |
| Watch | Usable local clock-face customization, not false pairing/synchronization | [Home and wellness](home-wellness.md) |
| Files | Real local document editing, folder operations and file import/export | [Creation](creation.md) |
| Freeform | Editable persistent boards with portable board and image exports | [Creation](creation.md) |
| Journal | Persistent searchable entries, editing and backups | [Creation](creation.md) |
| Voice Memos | Real microphone recording, playback, durable audio and import/export | [Creation](creation.md) |
| App Store | Real store discovery and links; clearly distinguish saved items from installed native apps | [Discovery](discovery.md) |
| Shortcuts | Execute supported local workflows and navigate to real registered apps | [Discovery](discovery.md) |
| Translate | Clearly scoped local translation tools and explicit full-translation handoff | [Discovery](discovery.md) |
| Tips | Actionable guides and navigation matching functionality that actually exists | [Discovery](discovery.md) |
| Compass | Real supported device orientation or an explicit unavailable state | [System](system.md) |
| Measure | Honest calibrated on-screen measurement; no invented AR dimensions | [System](system.md) |
| Stocks | Real market lookup/import or attributed external quotes, never randomized live prices | [System](system.md) |
| News | Real articles/source links and reading organization, not fictional current reporting | [System](system.md) |
| Passwords | Explicit local-vault security model and usable credential management; no claimed iCloud Keychain | [System](system.md) |
| Settings | Genuine app-scoped appearance, text size, reduced motion and visual brightness | [System](system.md) |
| Magnifier | Permission-driven live camera magnification and cleanup; honest unsupported state | [System](system.md) |

## Shared integration

- All apps use the same launcher on Duo; the 15 Pro also exposes the shared HTML app preview. The 15 Pro preview is not a texture mapped onto that model.
- Instances retain in-memory state, while optional `onActivate()` / `onDeactivate()` hooks manage foreground resources. Home, app switching, preview dismissal, hiding the document, and hiding the Duo display deactivate the foreground app. Returning activates it without implicitly granting hardware permissions.
- Cross-app navigation uses a bubbling, cancelable `duo:open-app` event with `{ name: string }`, accepting an exact app name or ID. The shell prevents default only when the app exists.
- Settings persist under `duo-system-settings`, with a `prefs` object containing `darkMode`, `largeText`, `reduceMotion`, and `brightness` (10–100). A window `duo:preferences-change` event updates the current shell. These preferences affect this app interface, not macOS, iOS, radios, or physical display brightness. Dark appearance converts light app surfaces; it is not native iOS dynamic-color rendering.
- Status bars show the actual local time and browser connection status, not fictional cellular reception or battery charge.
- Existing browser data must not be silently erased, overwritten on parse errors, or reported as saved after a storage failure. Media uses browser storage rather than pretending a thumbnail represents saved audio/video.

## Delivery stages and acceptance

1. **Survey and parallel implementation:** replace simulated outcomes with actual local workflows, browser APIs or truthful user-triggered external handoffs. Keep the existing visual language and registry stable.
2. **Integrate on local main:** merge each isolated worktree, reconcile shared navigation/preferences/lifecycle contracts, and exercise the combined launcher and app workflows.
3. **Service-backed parity, separate future work:** integrations that require real accounts, servers, credentials, hardware, licensing or native entitlements need explicit product decisions and authorization. A browser-only implementation cannot supply these by relabeling buttons.

For each app, acceptance means opening from the launcher, performing its primary supported action, seeing the actual result, returning Home and reopening, checking persistence after reload where promised, and seeing explicit permission/network/storage failures. Cross-app paths must open the intended app. Capturing apps must release camera/microphone resources on dismissal. The repository build is `npm run build`; interactive checks use a separate browser profile, not the user's accounts.

## Native and service boundaries

Real Apple Pay, iMessage delivery, cellular service, FaceTime sessions, HomeKit, Apple Watch pairing, HealthKit, Find My networks, iCloud Keychain, App Store installation, subscription entitlements, background iOS alarms and ARKit cannot be implemented by this static website. External handoffs do not establish that a call connected, a message was delivered, a payment succeeded, or a destination app is installed.

Network-backed features depend on provider availability, CORS, rate limits and browser permission. Experimental HTML-in-Canvas cannot render all cross-origin embedded content; opening an external source is intentional where necessary. Local browser data is not a cloud backup and can be lost if site data is cleared; use the individual apps' export tools.
