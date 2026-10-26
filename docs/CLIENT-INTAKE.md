# Client intake (one family's site)

The WhatsApp message Sandeep sends a family that wants its own invitation
site, and where each answer goes in `src/data.js`. When both families want
sites, send it to each family separately; each reply becomes its own repo.
A Claude session filling a family repo should map the reply with the table at
the bottom, then follow `docs/NEW-COUPLE-GUIDE.md`.

## The message (copy into WhatsApp)

```text
Hi! 😊 Congratulations once again! I'd love to make your family's digital wedding invitation.

It's a small website your guests open on their phone: an opening envelope, the couple's names, a short film for each function, venue maps, a countdown, a reel of your photos, and RSVP straight to WhatsApp. You can choose which functions each guest sees and personalise it with their name. It stays off Google, so only people with the link can open it.

To build it I need the details below. Send them whenever you can, in parts or as voice notes, whatever is easiest.

*1. The couple*
• Bride's and groom's names, exactly as you want them on the invite
• Is this invite from the bride's family or the groom's family?
• A wedding hashtag, if you have one

*2. The main ceremony*
• Date and time of the pheras / main ceremony (the countdown counts to this)

*3. Your family's invitation*
• Who is inviting, e.g. "Mrs. & Mr. Rajesh Mehta" or "The Mehta Family"
• The invitation line, e.g. "joyfully invite you to celebrate the wedding of their daughter"
• Parents' line under each name, e.g. "D/o Mrs. Neha & Mr. Rajesh Mehta" and "S/o Mrs. Anita & Mr. Vikram Kapoor"
• Any prayer or blessing line at the top, e.g. "॥ श्री गणेशाय नमः ॥" or "Ik Onkar", and whether you'd like the Ganesha image
• Closing line, e.g. "With love, the Mehta Family"
• 1–2 names and numbers guests can call
• The WhatsApp number where RSVPs should arrive

*4. Functions your guests are invited to* (for each one)
• Name, e.g. Mehndi, Haldi, Sangeet, Wedding, Reception
• Date and time
• Venue name, address and Google Maps link
• Dress code or colour theme, if any

*5. For the films*
• A few photos of the couple, and any videos you love
• A song you'd like as background music
• Anything special you'd like in a particular function's film

*6. Look and feel*
• A photo of your printed card, or colours you like
• English only, or Hindi / Punjabi lines too

*7. Guest groups*
• Which guests get which functions, e.g. "office friends: Sangeet and Wedding only", so I can set up quick picks for you

Once I have these I'll send you a preview link to check before anything goes out. 🙏
```

## Where each answer goes

| Answer | `src/data.js` | Notes |
| --- | --- | --- |
| Names | `couple.bride.first/full`, `couple.groom.first/full` | |
| Bride's or groom's family | `host.side` (`'bride'` / `'groom'`) | Also in the repo name: `invite-<couple>-<side>` |
| Hashtag | `couple.hashtag` | |
| Main ceremony date/time | `wedding.dateTimeISO`, `wedding.dateLabel`, `wedding.dayLabel` | Check the weekday |
| Who is inviting | `host.hosts` | |
| Invitation line | `host.inviteLine` | |
| Parents' lines | `host.parents.bride`, `host.parents.groom` | Omit a key to hide it |
| Blessing line | `host.ganesha` (array of lines) or `host.invocation` (one line) | Omit for none |
| Ganesha image yes/no | `config.showGanesha` | |
| Closing line | `host.sign` | |
| Contact numbers | `host.contacts` | `+` and country code |
| RSVP WhatsApp | `host.rsvpWhatsApp` | Digits only, with country code |
| Functions | `events[]` + a venue `const` per venue | `id` kebab-case; film path in `video` |
| Dress code | `events[].dressCode` | Mainly goes into the film; only the colour dot shows in the builder |
| Photos | `public/photos/` (run `scripts/compress-photos.ps1` first) + `photos` in `src/data.js` | 4–8 photos for the photo reel; also material for the films |
| Videos, song | Sandeep's films → `public/videos/`; song → music `.mp3` in `public/` + `config.bgMusic` | H.264 MP4 ≤ 25 MiB |
| Printed card / colours | `src/styles/tokens.css` palette, fonts in `index.html` | |
| Hindi / Punjabi lines | `host.ganesha` / `host.invocation`, or custom copy | |
| Guest groups | `presets` | Keep `all` |
| Link preview text | `site.title`, `site.shareTitle`, `site.shareDescription` | Write from the names and date |
| Preview image | `public/og-image.jpg` (1200×630) | Make from a couple photo or the card |
