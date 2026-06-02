# Learn_Store

Static browser app for a small Play Store-style learning catalog.

## Included apps
No built-in apps are included now. Users can publish apps from the Upload section.

## Files
- `index.html`
- `assets/styles.css`
- `assets/app.js`
- `assets/logo.svg`
- `api/agent.js`
- `assets/logo.png`
- `assets/background.png`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`

## Notes
- Users log in with email id and password, then add name and mobile number.
- The browser app creates a login link and shows it in a mock inbox.
- After the login link is opened, users confirm with Okay before entering the store.
- The five official apps are available in the Store section.
- Users can install and uninstall apps into their local library.
- Users can publish apps with a name and URL. Optional category, description, and HTML file preview are supported.
- Published apps are visible to every local browser user through shared browser storage.
- Installs are saved per logged-in email, and shared app install counts are tracked.
- Help Agent answers questions about official and published apps with a local fallback.
- `api/agent.js` can call Anthropic from a backend when `ANTHROPIC_API_KEY` is configured.
- The animated Learn_Store logo and flow-field background run in the browser and respect reduced motion.
- The app can be installed as a PWA after hosting over HTTPS.
- A real production store should add backend auth, cloud storage, email delivery, app review, install analytics, and server-side security.
