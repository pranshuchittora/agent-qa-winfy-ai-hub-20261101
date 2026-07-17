#!/usr/bin/env node
/**
 * Music Finder v5 — 国内音乐站优先搜索脚本
 * 
 * 书源优先级：
 *  ① 酷我音乐 Kuwo — 公开API，直链MP3/AAC/FLAC
 *  ② 歌曲海 gequhai.com — Kuwo源+自有API
 *  ③ Internet Archive / Jamendo / Bandcamp — CC/公版兜底
 *  ④ Bing — 泛搜兜底
 * 
 * 用法: node music-search.js "歌名" ["歌手"]
 *  例:   node music-search.js "加油 AMIGO" "TFBOYS"
 */

const http = require('http');
const https = require('https');

// ─── HTTP helpers ───

function httpGet(url, headers = {}, timeout = 12000) {
    const mod = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), timeout);
        mod.get(url, { rejectUnauthorized: false, headers }, r => {
            if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                clearTimeout(timer);
                return httpGet(r.headers.location, headers, timeout).then(resolve).catch(reject);
            }
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => { clearTimeout(timer); resolve({ status: r.statusCode, body: d }); });
        }).on('error', e => { clearTimeout(timer); reject(e); });
    });
}

function httpsPost(url, postData, headers = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData), ...headers },
            rejectUnauthorized: false
        }, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, body: d }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function decodeHTML(s) {
    return (s || '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

// Kuwo uses single-quoted pseudo-JSON — handle it
function safeJSON(str) {
    try { return JSON.parse(str); } catch(_) {}
    try {
        return JSON.parse(str.replace(/\\'/g, '__SQ__').replace(/'/g, '"').replace(/__SQ__/g, "\\'").replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
    } catch(_) { return null; }
}

// Score how well a result matches the query (higher = better match)
function scoreMatch(item, queryWords, artistWords) {
    const title = (item.title || '').toLowerCase();
    const artist = (item.artist || '').toLowerCase();
    const qLower = queryWords.map(w => w.toLowerCase());
    const aLower = artistWords.map(w => w.toLowerCase());
    let score = 0;

    // Exact title match = best
    const fullQuery = qLower.join(' ');
    if (title === fullQuery) score += 100;
    // Title starts with query
    else if (title.startsWith(fullQuery)) score += 80;
    // All query words in title
    else if (qLower.every(w => title.includes(w))) score += 60;

    // Partial query word matches
    for (const w of qLower) {
        if (w.length >= 3 && title.includes(w)) score += Math.min(w.length, 20);
    }

    // Artist match
    if (aLower.some(w => artist.includes(w))) score += 30;

    // Penalty: cover/翻唱/live versions slightly
    if (/cover|翻唱|live|现场|伴奏|instrumental/i.test(title)) score -= 15;

    // Bonus: priority source
    if (item.source.includes('kuwo')) score += 5;
    if (item.source.includes('gequhai')) score += 3;

    return score;
}

// ═══ ① Kuwo 酷我音乐 ═══

async function searchKuwo(query, artist) {
    try {
        const q = encodeURIComponent(`${query} ${artist}`.trim());
        const r = await httpGet(`https://search.kuwo.cn/r.s?all=${q}&ft=music&itemset=web_2013&client=kt&pn=0&rn=10&rformat=json&encoding=utf8`);
        if (r.status !== 200) return [];

        let body = r.body.trim();
        const start = body.indexOf('{');
        if (start < 0) return [];
        body = body.substring(start).replace(/&nbsp;/g, ' ');
        const j = safeJSON(body);
        if (!j?.abslist?.length) return [];

        const queryWords = query.split(/\s+/).filter(Boolean);
        const artistWords = artist.split(/\s+/).filter(Boolean);
        const results = [];
        const formatPriority = [
            { label: 'FLAC', api: 'flac', type: 'convert_url' },
            { label: 'AAC', api: 'aac', type: 'convert_url' },
            { label: 'MP3 320kbps', api: 'mp3', type: 'convert_url' },
        ];

        for (const s of j.abslist) {
            const dcId = s.DC_TARGETID;
            if (!dcId) continue;
            const rawName = (s.SONGNAME || s.NAME || '').replace(/\u00a0.*$/, '').replace(/&nbsp;.*$/, '').trim();
            if (!rawName) continue;

            for (const fmt of formatPriority) {
                try {
                    const dlR = await httpGet(
                        `http://antiserver.kuwo.cn/anti.s?format=${fmt.api}&rid=${dcId}&type=${fmt.type}&response=url`,
                        {}, 6000
                    );
                    if (dlR.status === 200) {
                        const dlUrl = dlR.body.trim();
                        if (dlUrl.startsWith('http')) {
                            results.push({
                                title: decodeHTML(rawName),
                                artist: decodeHTML(s.ARTIST || 'Unknown'),
                                album: decodeHTML(s.ALBUM || ''),
                                url: dlUrl,
                                source: '酷我音乐 (kuwo.cn)',
                                format: fmt.label,
                                duration: s.DURATION ? `${Math.floor(+s.DURATION/60)}:${String(+s.DURATION%60).padStart(2,'0')}` : '',
                            });
                            break;
                        }
                    }
                } catch(_) { continue; }
            }
        }

        // Sort by match score descending
        results.sort((a, b) => scoreMatch(b, queryWords, artistWords) - scoreMatch(a, queryWords, artistWords));
        return results;
    } catch (_) { return []; }
}

// ═══ ② 歌曲海 gequhai.com ═══

async function searchGequhai(query, artist) {
    try {
        const q = encodeURIComponent(`site:gequhai.com ${query} ${artist}`.trim());
        const r = await httpGet(`https://www.bing.com/search?q=${q}`, {}, 8000);
        if (r.status !== 200) return [];

        const playUrls = [];
        const linkRe = /<a[^>]+href="(https?:\/\/www\.gequhai\.com\/play\/\d+)"[^>]*>/gi;
        let m, seen = new Set();
        while ((m = linkRe.exec(r.body)) !== null) {
            if (seen.has(m[1])) continue;
            seen.add(m[1]);
            playUrls.push(m[1]);
        }
        if (!playUrls.length) return [];

        const results = [];
        for (const playUrl of playUrls.slice(0, 3)) {
            try {
                const id = playUrl.split('/play/')[1];
                const apiR = await httpsPost('https://www.gequhai.com/api/music', `id=${id}&type=0`, { 'Referer': playUrl });
                if (apiR.status === 200) {
                    const data = JSON.parse(apiR.body);
                    if (data.code === 200 && data.data?.url) {
                        results.push({
                            title: decodeHTML(data.data.title || query),
                            artist: artist || 'Unknown',
                            url: data.data.url,
                            source: '歌曲海 (gequhai.com)',
                            format: data.data.url.includes('.aac') ? 'AAC' : 'MP3'
                        });
                    }
                }
            } catch (_) { /* skip */ }
        }
        return results;
    } catch (_) { return []; }
}

// ═══ ③④⑤ 兜底书源 ═══

async function searchArchiveOrg(query) {
    try {
        const r = await httpGet(`https://archive.org/search?query=${encodeURIComponent(query)}&mediatype=audio&rows=5`, {}, 10000);
        if (r.status !== 200) return [];
        const items = [], ids = [], titles = [];
        let m;
        const idRe = /"identifier"\s*:\s*"([^"]{5,80})"/g, titleRe = /"title"\s*:\s*"([^"]{3,150})"/g;
        while ((m = idRe.exec(r.body)) !== null) { if (!ids.includes(m[1])) ids.push(m[1]); }
        while ((m = titleRe.exec(r.body)) !== null) titles.push(decodeHTML(m[1]));
        for (let i = 0; i < Math.min(ids.length, 4); i++)
            items.push({ title: titles[i] || ids[i], artist: 'Internet Archive', url: `https://archive.org/details/${ids[i]}`, source: 'Internet Archive', format: 'Various' });
        return items;
    } catch (_) { return []; }
}

async function searchJamendo(query) {
    try {
        const r = await httpGet(`https://api.jamendo.com/v3.0/tracks/?client_id=demo&format=json&search=${encodeURIComponent(query)}&limit=5`, {}, 10000);
        if (r.status !== 200) return [];
        return JSON.parse(r.body).results?.map(t => ({ title: t.name, artist: t.artist_name, url: `https://www.jamendo.com/track/${t.id}/`, source: 'Jamendo', format: 'MP3/FLAC' })) || [];
    } catch (_) { return []; }
}

async function searchBandcamp(query) {
    try {
        const r = await httpGet(`https://bandcamp.com/search?q=${encodeURIComponent(query)}`, {}, 10000);
        if (r.status !== 200) return [];
        const items = [], urlRe = /data-href="(https?:\/\/[^"]+)"[^>]*class="[^"]*itemurl/g;
        let m;
        while ((m = urlRe.exec(r.body)) !== null) { if (m[1]) items.push({ title: query, artist: 'Bandcamp', url: m[1], source: 'Bandcamp', format: 'Various' }); }
        return items.slice(0, 5);
    } catch (_) { return []; }
}

// ═══ MAIN ═══

function printBanner(query, artist) {
    console.log('\n  🎵 Music Finder — 多书源音乐搜索');
    console.log('  ' + '─'.repeat(46));
    console.log(`  🔍 "${query}"${artist ? ` — ${artist}` : ''}\n`);
}

function printItem(n, item) {
    console.log(`  ${String(n).padStart(2,'.')} 🎶 ${item.title}`);
    if (item.artist && item.artist !== 'Unknown') console.log(`     👤 ${item.artist}`);
    if (item.album) console.log(`     💿 ${item.album}`);
    console.log(`     🎧 ${item.format}${item.duration ? `  |  ⏱ ${item.duration}` : ''}`);
    console.log(`     📡 ${item.source}`);
    console.log(`     🔗 ${item.url}`);
    console.log('');
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('用法: node music-search.js "歌名" ["歌手"]');
        console.log('示例: node music-search.js "加油 AMIGO" "TFBOYS"');
        process.exit(1);
    }
    const [query, artist] = [args[0], args[1] || ''];

    printBanner(query, artist);
    const all = [], seen = new Set();
    function add(items) {
        if (!Array.isArray(items)) return;
        for (const item of items) {
            if (!seen.has(item.url)) { seen.add(item.url); all.push(item); }
        }
    }

    // Phase 1: Kuwo + gequhai (priority, fast)
    console.log('  ⏳ 正在查询酷我音乐 / 歌曲海...');
    const [kuwoRes, gequhaiRes] = await Promise.allSettled([searchKuwo(query, artist), searchGequhai(query, artist)]);
    if (kuwoRes.status === 'fulfilled') add(kuwoRes.value);
    if (gequhaiRes.status === 'fulfilled') add(gequhaiRes.value);

    // Re-sort priority results by match score
    const queryWords = query.split(/\s+/).filter(Boolean);
    const artistWords = artist.split(/\s+/).filter(Boolean);
    all.sort((a, b) => scoreMatch(b, queryWords, artistWords) - scoreMatch(a, queryWords, artistWords));

    const priorityCount = all.length;
    if (priorityCount > 0) {
        all.forEach((item, i) => printItem(i + 1, item));
        console.log(`  ✅ 已找到 ${priorityCount} 条可下载结果`);
    }

    // Phase 2: Backup sources
    console.log('  ⏳ 正在补充其他书源...\n');
    const backup = await Promise.allSettled([searchArchiveOrg(query), searchJamendo(query), searchBandcamp(query)]);
    backup.forEach(r => { if (r.status === 'fulfilled') add(r.value); });

    if (all.length === 0) {
        console.log('  ❌ 没有找到相关结果');
        console.log('  💡 建议: 试试换关键词或确认歌手名字');
        console.log('');
        return;
    }

    // Re-sort all with backup included
    all.sort((a, b) => scoreMatch(b, queryWords, artistWords) - scoreMatch(a, queryWords, artistWords));

    if (all.length > priorityCount) {
        console.log('  ─── 补充结果 ───\n');
        all.forEach((item, i) => {
            if (i >= priorityCount) printItem(i + 1, item);
        });
    }

    console.log(`  ✅ 共 ${all.length} 条结果\n`);
}

main().catch(e => console.error('Error:', e.message));
