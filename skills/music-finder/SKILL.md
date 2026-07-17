---
name: music-finder
description: >
  Search and download free music (MP3 / FLAC / WAV / OGG). Use when the user
  needs to find, locate, or download a song, album, or artist by title, artist,
  or keywords. Supports Chinese and English music, covers major free music
  sources, and verifies download links before presenting them.
  Triggers: "音乐", "音乐下载", "找音乐", "mp3下载", "flac下载",
  "music download", "download music", "find a song", "无损音乐"
---

# Music Finder

Search free music sources, verify download links, and present the best options.

## Workflow

1. **Identify the target** — song title, artist, album, or keywords.
   If the user only has a vague idea, ask for title or artist first.
2. **Search multiple sources in parallel** — use `web_search` + `web_fetch`
   against the sources below. Do not rely on a single source.
3. **Verify the link** — `web_fetch` or `HEAD request` to confirm the link
   is live and the file format matches what the user requested.
4. **Rank results** — by: (a) direct download link, (b) file format match
   (FLAC > WAV > MP3 320kbps > MP3 128kbps), (c) source reputation,
   (d) file size sanity check.
5. **Present top 3 results** with: title, artist, album, format, file size,
   source, and download link. Warn if the source requires a CAPTCHA or manual step.

## Search Sources

See [references/music-sites.md](references/music-sites.md) for the full list
of sources, their search URL patterns, and notes on each site.

### Priority order

1. **Jamendo** — free CC-licensed music, direct MP3/FLAC download
2. **Free Music Archive (FMA)** — curated free/CC music, large catalog
3. **Musopen** — public domain classical music, FLAC/MP3
4. **NCS (NoCopyrightSounds)** — no-copyright BGM, popular with creators
5. **SoundCloud** — independent artists, streaming + download links
6. **Bandcamp** — independent artists, free download section
7. **Internet Archive — Audio Archive** — public domain & historical audio

### China-friendly sources

| 来源 | URL | 说明 |
|------|-----|------|
| 音乐下载网 | `hifini.com` | 国内无损音乐论坛，FLAC/APE |
| CD包音乐 | `cdbao.com` | 国内无损音乐资源 |
| 音乐磁场 | `hifini.com` | 同上，无损音乐丰富 |
| 歌曲大全 | `quge5.com` | MP3批量下载 |
| 墨灵音乐 | `moe.lol` | 在线试听+下载 |

## Search Queries

Build effective queries for each source:

```
# Generic (works on most sources)
"{title}" "{artist}" filetype:mp3
"{title}" "{artist}" filetype:flac
"{title}" "{artist}" album

# China sources (Chinese keywords)
"{歌名}" "{歌手}" 下载
"{歌名}" "{歌手}" flac
"{歌名}" "{歌手}" mp3 无损
```

## Download Notes

- **Copyright**: Always inform the user of the source's license. Prefer
  CC-licensed or public domain sources over copyrighted material.
- **Quality**: FLAC > WAV > MP3 320kbps > MP3 128kbps. State the quality
  clearly when presenting results.
- **Verification**: Use `HEAD` request or `web_fetch` to verify the link is
  live before presenting. Dead links waste the user's time.
- **CAPTCHA warning**: If a source returns a CAPTCHA page, tell the user
  to visit manually rather than attempting to bypass.
- **No piracy**: Do not assist with downloading copyrighted music from
  sources that do not have a clear free/CC license. Focus on legal sources.

## Search Script

实际搜索由 `music-search.js` 驱动（Node.js），并行查询所有书源：

```
node music-search.js "加油 AMIGO" "TFBOYS"
```

脚本位置: `workspace/skills/music-finder/music-search.js`

已覆盖书源: Internet Archive, Jamendo, Free Music Archive, Bandcamp,
歌曲海 (gequhai.com 含 API 直链解析), Bing Music。
待加: NCS, SoundCloud, hifini.com, moe.lol。

## Output Format

Present results as:

```
🎵 {Song Title}
   👤 Artist: {Artist}
   💿 Album: {Album}
   🎧 Format: {Format} | Size: {Size}
   📡 Source: {Source Name}
   🔗 Download: {URL}
   ⚠️ Note: {any warnings}
```

Present top 3 results, ranked by quality and source reputation.
