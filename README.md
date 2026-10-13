# Scholars Planet website (v8)

Static site (Eleventy) + Decap CMS. You publish through `/admin`.

## Upload (important)
Open the unzipped folder until you see `package.json` and `netlify.toml`. Select everything there and drag it into GitHub. The GitHub repository page must then show `package.json` and `netlify.toml` in its main list, not inside another folder.
GitHub accepts up to 100 files per upload. This package has fewer than 100.

## The admin has four areas
1. **Opportunities (many at once)**: add or edit as many opportunities as you like, then press **Save once**. One save is one deploy.
2. **Opportunities (one at a time)**: the same form for a single opportunity.
3. **Materials**: learning platforms, tools, guides. No deadline or application link needed.
4. **Award Notifications**: winners and results. No deadline or application link needed.

Tip: new posts are added at the top of the "many at once" list. Leave "Web address name" empty for new posts, and do not change it later so the link stays the same.

## WhatsApp list
The orange button at the bottom-right of the admin page (or `/admin/list/`) lists every OPEN opportunity grouped by category and level, in plain text ready to paste into WhatsApp. Expired ones are left out automatically.

## Expired opportunities
They stay on the website, move to the end of the list and show a red "Expired" tag. The change happens by itself on the day after the deadline (Lagos time), without any rebuild.

## Your own HTML tools
Put tool files (for example `pdf-merger.html`) in the `tools` folder, then add a Material in `/admin` with the link `/tools/pdf-merger.html`.

## Updating (v10)
This update only contains changed files. It does not touch your posts (`_data/batch.json`) or your links (`_data/site.json`). Upload everything in the update folder; it overwrites the old versions.

## Update v11
New: email signup form, Support us (sponsorship) page, editable numbers, LinkedIn, WhatsApp lists for materials and award notifications, LinkedIn share button, and an award notifications feed.
Automation feeds for Facebook and LinkedIn tools (Zapier, Make, IFTTT, Buffer):
- New opportunities: https://www.scholarsplanet.com.ng/feed.xml
- New award notifications: https://www.scholarsplanet.com.ng/feed-awards.xml
Upload v10 first if you have not already. This update never overwrites your posts, ads, links or lists.

## Admin auto-save (v11)
The admin page now copies what you type to your phone as you go. After a refresh a bar offers your unsaved text to copy and paste back. Pull-to-refresh is switched off in the admin.
