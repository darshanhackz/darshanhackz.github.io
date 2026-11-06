# Darshan Naik Portfolio & Blog — Full Documentation

> Your complete guide to updating and growing the site. No code knowledge needed for most tasks.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [How to Update Your Info](#2-how-to-update-your-info)
3. [Socials & Email](#3-socials--email)
4. [Profile Photo](#4-profile-photo)
5. [Writing & Publishing Blog Posts](#5-writing--publishing-blog-posts)
6. [Adding a New Page](#6-adding-a-new-page)
7. [Design System (colors, fonts, layout)](#7-design-system)
8. [Opening Animation](#8-opening-animation)
9. [Running Locally](#9-running-locally)
10. [Deploying to GitHub Pages](#10-deploying-to-github-pages)
11. [Image Zoom & Lightbox](#11-image-zoom--lightbox)

---

## 1. Architecture Overview

This is a **Jekyll** static site. Jekyll takes simple text files and turns them into a full website.

```
site/
├── _config.yml          ← 🔑 Master settings (name, socials, URL)
├── index.html           ← Homepage
├── about.md             ← About page (plain text / Markdown)
├── blog.html            ← Blog listing page (auto-generated, don't edit)
│
├── _posts/              ← 📝 YOUR BLOG POSTS LIVE HERE
│   └── 2024-01-15-my-first-post.md
│
├── _layouts/
│   ├── default.html     ← Wraps every page (header, footer, loader)
│   ├── page.html        ← Used for About and similar static pages
│   └── post.html        ← Used for every blog post
│
├── _includes/
│   ├── lightbox.html    ← 🔍 Image popup & zoom modal component
│   ├── social.html      ← Social icon links (auto-reads _config.yml)
│   └── post-list.html   ← The post list component on homepage & blog page
│
└── assets/
    ├── profile.png      ← 📸 Your profile photo
    ├── js/
    │   └── lightbox.js  ← 🔍 Image zoom, pan, and lightbox logic
    └── css/
        └── style.css    ← All visual styling
```

**How it all connects:**
- Every page uses `layout: default` or `layout: page` in its front matter
- `default.html` injects `{{ content }}` — the page's body goes there
- `_config.yml` is the single source of truth for your name, socials, and site URL

---

## 2. How to Update Your Info

Open **`site/_config.yml`** and change these lines:

```yaml
title: Darshan Naik          # Browser tab title
tagline: Security researcher…  # Short tagline (used by SEO plugin)
description: AI security…    # Meta description for Google

author: Darshan Naik         # Your name — shown in header, footer, hero
email: you@example.com       # Used on the About page contact line
url: "https://your-site.com" # Your live site URL (for SEO)
```

Save the file. If running locally, the change is instant.

---

## 3. Socials, Topmate & Email

Open **`site/_config.yml`** and fill in your handles:

```yaml
social:
  linkedin: "darshnahackz"        # LinkedIn username or full URL
  x: "darshnahackz"               # Your X / Twitter handle (no @)
  instagram: "darshanhacks"       # Your Instagram handle (no @)
  medium: "darshnahackz"          # Your Medium handle (e.g. username)
  topmate: "darshnahackz"         # Your Topmate handle (e.g. darshnahackz)
  email: "darshanhackz@gmail.com" # Full email address
```

**Rules:**
- Leave a field as `""` (empty quotes) to hide that icon entirely.
- The icons appear in **two places**: the hero section on the homepage, and the footer on every page.
- Topmate booking also links automatically in the **About** page under "Work with me".
- **Important**: Whenever you edit `_config.yml`, restart the Jekyll local server (`Ctrl+C` then re-run) so Jekyll loads the updated settings.
- You don't need to touch `social.html` — it reads from this config automatically.

---

## 4. Profile Photo

Your photo is at **`site/assets/profile.png`**.

To replace it:
1. Name your new photo `profile.png`
2. Drop it into `site/assets/`, replacing the existing file
3. That's it — the homepage will automatically pick it up

> **Tip:** The photo is displayed as a circle (160 × 160 px on desktop). For best results, use a square image with your face centred.

To use a **different filename**:
Open `site/index.html` and change this line:
```html
src="{{ '/assets/profile.png' | relative_url }}"
```
to e.g.
```html
src="{{ '/assets/darshan-photo.jpg' | relative_url }}"
```

---

## 5. Writing & Publishing Blog Posts

### Create a new post

1. Go to the **`site/_posts/`** folder
2. Create a new file. The filename format is **required** and must be:
   ```
   YYYY-MM-DD-url-friendly-title.md
   ```
   Example: `2025-03-20-prompt-injection-deep-dive.md`

3. Paste this template at the top of the file (called *front matter*):

```markdown
---
layout: post
title: "Your Post Title Here"
date: 2025-03-20
---

Your content starts here. Use normal Markdown.

## Section Heading

Write your paragraphs normally. Links work like [this](https://example.com).

### Sub-heading

- Bullet list item
- Another item

```python
# Code blocks work too
print("Hello!")
```
```

4. Save the file. Your post will instantly appear on:
   - The homepage "Latest writing" section (up to 5 posts)
   - The `/blog/` page (all posts, grouped by year)

### Markdown Quick Reference

| What you want | How to write it |
|---|---|
| **Bold** | `**bold**` |
| *Italic* | `*italic*` |
| [Link](url) | `[text](https://url.com)` |
| `inline code` | `` `code` `` |
| ## Heading 2 | `## Heading 2` |
| Image | `![alt text](/assets/myimage.png)` |
| Blockquote | `> Your quote here` |

---

## 6. Adding a New Page

1. Create a `.md` file in `site/`, e.g. `speaking.md`
2. Add front matter at the top:

```markdown
---
layout: page
title: Speaking
permalink: /speaking/
---

Your page content here in Markdown.
```

3. Add it to the nav by editing **`site/_layouts/default.html`**:

```html
<nav aria-label="Main">
  <a href="{{ '/blog/' | relative_url }}">Blog</a>
  <a href="{{ '/speaking/' | relative_url }}">Speaking</a>  ← add this line
  <a href="{{ '/about/' | relative_url }}">About</a>
</nav>
```

---

## 7. Design System

All colours, fonts, and spacing live as CSS variables in **`site/assets/css/style.css`** at the very top.

### Colours

```css
:root {
  --bg:     #f6f7f9;   /* Page background */
  --ink:    #15171c;   /* Main text */
  --muted:  #5d6370;   /* Secondary text, timestamps */
  --line:   #dcdfe5;   /* Borders and dividers */
  --accent: #2f3fd6;   /* Links, highlights */
  --code:   #eceef2;   /* Code block background */
}
```

Dark mode overrides are directly below — the browser applies them automatically based on system preference.

To **change the accent colour**, just replace `#2f3fd6` (light) and `#8c9bff` (dark) with your new colour.

### Fonts

- **Headings & UI** — *Inter Tight* (loaded from Google Fonts)
- **Body prose / blog posts** — *Source Serif 4* (loaded from Google Fonts)

To change fonts, update both the `<link>` in `_layouts/default.html` and the `--sans` / `--serif` variables in `style.css`.

---

## 8. Opening Animation

The loader runs automatically on every page load:

1. A full-screen overlay appears with your name typing out
2. A blinking cursor appears briefly
3. After the page fully loads, the overlay fades out
4. The page content fades in underneath

**To adjust the animation speed**, find this block in `style.css`:
```css
.loader-name {
  animation: typing 0.9s steps(20, end) both, …
}
```
Change `0.9s` to make the typing faster or slower.

**To turn the loader off**, remove the `<div id="page-loader">` block from `_layouts/default.html` and delete the `#page-loader` CSS block.

---

## 9. Running Locally

You need Ruby and Jekyll installed. Then:

```bash
cd "darshanhacks Website/site"
bundle install        # first time only
bundle exec jekyll serve
```

Open [http://localhost:4000](http://localhost:4000) in your browser. Changes to files auto-reload instantly (except `_config.yml` — restart the server for those).

---

## 10. Deploying & Updating via GitHub

Your site is connected to GitHub and automatically deployed on GitHub Pages:
- **Repository**: [https://github.com/darshanhackz/darshanhackz.github.io](https://github.com/darshanhackz/darshanhackz.github.io)
- **Live Website**: [https://darshanhacks.com/](https://darshanhacks.com/) (also redirects from [https://darshanhackz.github.io/](https://darshanhackz.github.io/))

### How to push updates in the future (3 simple steps)

Whenever you edit a file, write a new blog post, or update your info:

```bash
# 1. Move into the site directory
cd "/Users/darshannareshnaik/Desktop/darshanhacks Website/site"

# 2. Stage and commit your changes
git add .
git commit -m "Add new blog post / update site"

# 3. Push to GitHub
git push origin main
```

Within 30–60 seconds, GitHub automatically builds and updates your live site!

---

## 11. Image Zoom & Lightbox

All screenshots and images inside blog posts are automatically interactive:
- **Click / Tap to Enlarge**: Tapping any image opens a full-screen, focused modal overlay.
- **Double-Tap / Click to Zoom**: Toggles between 1x (fit-to-screen) and 2.2x zoom focused on where you tapped.
- **Pinch-to-Zoom (Mobile)**: Natural two-finger pinch-to-zoom in and out up to 4.5x.
- **Swipe Down to Dismiss (Mobile)**: Swipe down on the image to dismiss smoothly, just like native iOS / Android apps.
- **1-Finger Drag / Pan**: When zoomed in, easily pan in any direction across screenshots and code payloads.
- **Mouse Wheel / Trackpad (Desktop)**: Smoothly zoom in and out with cursor focal point.
- **On-Screen Toolbar**: Accessible touch-friendly buttons (44px+ hit targets) for Zoom Out (−), Zoom Level Indicator (%), Zoom In (+), Reset (1:1), and Close (✕).
- **Safe-Area Aware**: Automatically respects iOS notch, dynamic island, and home indicator with `env(safe-area-inset-*)`.
- **Keyboard Shortcuts**: `Esc` to close, `+` / `-` to zoom, `0` to reset, Arrow keys to pan.

---

*Last updated: October 2026*
