---
name: ebook-finder
description: >
  Search and download ebooks (PDF / EPUB / MOBI / AZW3). Use when the user
  needs to find, locate, or download a book by title, author, ISBN, or keyword.
  Supports Chinese and English titles, covers major free ebook sources, and
  verifies download links before presenting them.
  Triggers: "电子书", "ebook", "下载书", "找书", "PDF下载", "EPUB下载",
  "book download", "find a book", "download ebook"
---

# Ebook Finder

Search free ebook sources, verify download links, and present the best options.

## Workflow

1. **Identify the target** — title, author, ISBN, or keywords.
   If the user only has a vague idea, ask for title or author first.
2. **Search multiple sources in parallel** — use `web_search` + `web_fetch`
   against the sources below. Do not rely on a single source.
3. **Verify the link** — `web_fetch` or `HEAD request` to confirm the link
   is live and the file format matches what the user requested.
4. **Rank results** — by: (a) direct download link, (b) file format match,
   (c) source reputation, (d) file size sanity check.
5. **Present top 3 results** with: title, author, format, file size, source,
   and download link. Warn if the source requires a CAPTCHA or manual step.

## Search Sources

See [references/ebook-sites.md](references/ebook-sites.md) for the full list
of sources, their search URL patterns, and notes on each site.

### Priority order

1. **Anna's Archive** — largest meta-index, mirrors LibGen / Sci-Hub
2. **Z-Library** — popular, wide format coverage
3. **LibGen (Library Genesis)** — academic focus, massive collection
4. **PDF Drive** — direct PDF search engine
5. **Internet Archive** — public domain and scanned books
6. **Google Books preview** — for ISBN lookups and bibliographic data

## Search Queries

Build effective queries for each source:

```
# Generic (works on most sources)
"{title}" "{author}" filetype:pdf
"{title}" "{author}" filetype:epub
"{title}" "{author}" ebook

# With ISBN (best accuracy)
isbn:{isbn13} pdf
isbn:{isbn10} epub

# Chinese books
"{中文书名}" "{作者}" pdf
"{中文书名}" epub 下载
```

## Verification

Before presenting a link to the user:

- `web_fetch` the result page (not the direct file URL) to confirm it is
  accessible and the book details match.
- If the page requires a CAPTCHA, note it and skip — do not attempt to solve.
- If `web_fetch` returns 403/404, discard the result.
- If the link is a redirect chain, follow one hop with `web_fetch` to verify
  the final destination before presenting.

## Download

When the user asks to download:

1. If a direct file URL was found and verified, use `exec` with `curl` or
   `Invoke-WebRequest` to download it.
2. Save to the user's Downloads folder or a path the user specifies.
3. Confirm the file size after download and report any discrepancy.

### Download command templates

```bash
# curl
curl -L -o "C:\Users\Administrator\Downloads\{filename}.pdf" "{url}"

# PowerShell
Invoke-WebRequest -Uri "{url}" -OutFile "C:\Users\Administrator\Downloads\{filename}.pdf"
```

## Handling Edge Cases

- **No results found**: Try alternate title translations, abbreviated titles,
  or search by ISBN only. Check at least 3 different sources before giving up.
- **Multiple editions**: Present options clearly with year/edition info.
- **DRM-protected**: Note that the book may be DRM-protected if found on
  commercial platforms; direct download links should only come from free sources.
- **Partial previews**: Google Books / Amazon previews are not full downloads;
  do not present them as such.
- **Large files (>100 MB)**: Warn the user before downloading.
