# Scholars Planet website

## What this is
A static site (built with Eleventy) + Decap CMS, so you can publish new
scholarships through a simple form at `/admin` instead of editing code.
Every opportunity gets its own page (good for Google/SEO), and the homepage
feed updates automatically.

## One-time setup (do this after uploading to GitHub)

1. **Push these files to your `scholars-planet-site` GitHub repo**
   (drag-and-drop upload on github.com works fine, or use GitHub Desktop).

2. **Netlify → New site from Git** → pick this repo.
   Build command and publish folder are already set in `netlify.toml`,
   so just click Deploy.

3. **Site settings → Identity → Enable Identity.**

4. **Site settings → Identity → Registration → set to "Invite only."**

5. **Site settings → Identity → Services → Git Gateway → Enable Git Gateway.**
   (This is what lets the `/admin` panel publish posts on your behalf.)

6. **Identity tab (top of your Netlify site dashboard) → Invite users**
   → invite your own email. Check your inbox, accept, set a password.

7. **Add your domain:** Site settings → Domain management → Add a domain
   → enter `scholarsplanet.com.ng` → follow the DNS instructions
   (add the records Netlify gives you in Truehost's DNS panel).

8. Visit `yoursite.netlify.app/admin` (or `scholarsplanet.com.ng/admin`
   once DNS is live), log in, and you'll see an "Opportunities" collection
   with the 3 example posts already in it — edit or delete them, and use
   "New Opportunities" to publish real ones.

## Replacing the example posts
The three posts in `content/posts/` are placeholders with fake application
links (`example.com`) so you can see the layout. Edit or delete them from
`/admin` once you're ready to post real opportunities.

## For Google AdSense later
- `about/` and `privacy-policy/` pages are already built and linked in the
  footer — both are commonly required for AdSense approval.
- Keep posting real opportunities regularly before applying to AdSense;
  reviewers want to see an active, genuine site.

## Local preview (optional, needs Node.js installed)
```
npm install
npm start
```
