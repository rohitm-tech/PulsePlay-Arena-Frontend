import type { MatchSummary } from '@/store/matches/matchesSlice';

export type LiveMatchesGroupMode = 'none' | 'date' | 'series' | 'gender' | 'venueRegion' | 'india';

/** Rough bucket for hub toggles — driven by CricAPI-style status strings (and scorecard-shaped statuses). */
export type MatchTimeBucket = 'past' | 'current' | 'upcoming';

export function matchTimeBucket(m: MatchSummary): MatchTimeBucket {
  const raw = (m.status ?? '').trim();
  const s = raw.toLowerCase();

  if (
    /\b(won|win by|won the|tied\b|tie\b|abandon|no result|\bn\/r\b|match drawn|victory|match over)\b/i.test(s) ||
    /\bbeat\s+[a-z]/i.test(s)
  ) {
    return 'past';
  }

  if (/\d+\s*\/\s*\d+/.test(raw)) {
    return 'current';
  }

  if (
    /\b(live|in progress|drinks|lunch|tea|stumps|innings break|rain|delay|requires|need\s+\d+|trail|follow on|lead by)\b/i.test(s)
  ) {
    return 'current';
  }

  if (
    s === 'scheduled' ||
    /\b(scheduled|not started|yet to begin|toss|opt(s|ted)? to|elected to|starts at|will start|pre[- ]match)\b/i.test(s)
  ) {
    return 'upcoming';
  }

  return 'current';
}

export function matchSearchBlob(m: MatchSummary): string {
  const teamBits = (m.teams ?? []).join(' ');
  const infoBits = m.teamInfo
    ? Object.values(m.teamInfo)
        .map((t) => `${t.name} ${t.shortname ?? ''}`)
        .join(' ')
    : '';
  return `${m.name} ${m.status} ${m.venue ?? ''} ${m.date ?? ''} ${teamBits} ${infoBits}`.toLowerCase();
}

export function filterMatchesByQuery(matches: MatchSummary[], q: string): MatchSummary[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return matches;
  return matches.filter((m) => matchSearchBlob(m).includes(needle));
}

function parseMatchStartMs(date?: string): number | null {
  const raw = date?.trim();
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Newest first by match date/time; undated last; tie-break on id (aligns with API ordering). */
export function sortMatchesLatestFirst(matches: MatchSummary[]): MatchSummary[] {
  return [...matches].sort((a, b) => {
    const ta = parseMatchStartMs(a.date);
    const tb = parseMatchStartMs(b.date);
    if (ta != null && tb != null && ta !== tb) return tb - ta;
    if (ta != null && tb == null) return -1;
    if (ta == null && tb != null) return 1;
    return (b.id ?? '').localeCompare(a.id ?? '');
  });
}

/** Last comma-separated segment of the venue (often city / region / country). */
export function venueRegionLabel(venue?: string): string {
  if (!venue?.trim()) return 'Venue TBC';
  const parts = venue
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return venue.trim();
}

/** Tournament / series line: prefers the tail of comma-separated match titles from CricAPI. */
export function seriesFromMatchName(name: string): string {
  const parts = name
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1];
    if (tail.length >= 8) return tail;
    return parts.slice(-2).join(' · ');
  }
  if (parts.length === 1 && parts[0].includes(' vs ')) return 'Fixture';
  return name.trim() || 'Fixture';
}

export function genderCategoryFromName(name: string): string {
  const n = name.toLowerCase();
  if (/\bwomen'?s\b|\bwoman\b|\bwg\b|\bww\b/i.test(n)) return "Women's";
  if (/\bmen'?s\b|\bman's\b/i.test(n)) return "Men's";
  if (/\bmixed\b|\buxi\b/i.test(n)) return 'Mixed';
  return 'Other / unspecified';
}

/** Indian cities / regions often returned as the last venue segment (CricAPI-style). */
const INDIA_VENUE_HINT =
  /\b(india|bharat)\b|\b(bengaluru|bangalore|mumbai|chennai|kolkata|delhi|ahmedabad|jaipur|hyderabad|lucknow|mohali|chandigarh|dharamsala|dharamshala|pune|rajkot|kochi|indore|nagpur|kanpur|ranchi|guwahati|visakhapatnam|vizag|cuttack|baroda|vadodara|raipur|gwalior|jammu|srinagar)\b/i;

/** India bucket: domestic leagues, India internationals, or venue in India. IPL/WPL in UAE still count as India. */
export function indiaGroupHeading(m: MatchSummary): 'India' | 'Outside India' {
  const venue = m.venue ?? '';
  const region = venueRegionLabel(venue);
  const blob = matchSearchBlob(m);
  const title = (m.name ?? '').toLowerCase();

  if (
    /\b(ipl|wpl|indian premier|women'?s premier|ranji|syed mushtaq|smat|irani trophy|duleep trophy|vijay hazare|deodhar)\b/i.test(blob)
  ) {
    return 'India';
  }

  for (const t of m.teams ?? []) {
    const u = t.trim().toLowerCase();
    if (u === 'india' || u === 'ind') return 'India';
  }
  if (m.teamInfo) {
    for (const t of Object.values(m.teamInfo)) {
      const bit = `${t.name} ${t.shortname ?? ''}`.toLowerCase();
      if (/\bindia\b/.test(bit)) return 'India';
      if (/\bind\b/.test(t.shortname?.trim().toLowerCase() ?? '')) return 'India';
    }
  }

  if (/\bindia\b/.test(title) && /\bvs\.?\b|\bv\b/.test(title)) return 'India';

  if (INDIA_VENUE_HINT.test(venue) || INDIA_VENUE_HINT.test(region)) {
    return 'India';
  }
  return 'Outside India';
}

export type DateBucket = { sortKey: number; groupKey: string; heading: string };

export function dateBucketFromMatch(date?: string): DateBucket {
  if (!date?.trim()) {
    /** Sorts last when date sections are ordered newest-first (see `groupMatches`). */
    return { sortKey: Number.NEGATIVE_INFINITY, groupKey: 'unknown', heading: 'Date not listed' };
  }
  const raw = date.trim();
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const mo = String(parsed.getMonth() + 1).padStart(2, '0');
    const da = String(parsed.getDate()).padStart(2, '0');
    const groupKey = `${y}-${mo}-${da}`;
    const heading = parsed.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return { sortKey: parsed.getTime(), groupKey, heading };
  }
  return { sortKey: Number.NEGATIVE_INFINITY, groupKey: `raw:${raw}`, heading: raw };
}

export function groupMatches(matches: MatchSummary[], mode: LiveMatchesGroupMode): { heading: string; items: MatchSummary[] }[] {
  if (mode === 'none') {
    return matches.length ? [{ heading: '', items: matches }] : [];
  }

  const map = new Map<string, { heading: string; sort: number; items: MatchSummary[] }>();

  for (const m of matches) {
    let key: string;
    let heading: string;
    let sort: number;

    switch (mode) {
      case 'date': {
        const b = dateBucketFromMatch(m.date);
        key = b.groupKey;
        heading = b.heading;
        sort = b.sortKey;
        break;
      }
      case 'series': {
        const s = seriesFromMatchName(m.name);
        key = s.toLowerCase();
        heading = s;
        sort = 0;
        break;
      }
      case 'gender': {
        const g = genderCategoryFromName(m.name);
        key = g;
        heading = g;
        sort = ["Men's", "Women's", 'Mixed', 'Other / unspecified'].indexOf(g);
        if (sort < 0) sort = 99;
        break;
      }
      case 'venueRegion': {
        const v = venueRegionLabel(m.venue);
        key = v.toLowerCase();
        heading = v;
        sort = 0;
        break;
      }
      case 'india': {
        const h = indiaGroupHeading(m);
        key = h;
        heading = h;
        sort = h === 'India' ? 0 : 1;
        break;
      }
      default:
        key = 'all';
        heading = '';
        sort = 0;
    }

    const prev = map.get(key);
    if (prev) {
      prev.items.push(m);
    } else {
      map.set(key, { heading, sort, items: [m] });
    }
  }

  const rows = [...map.entries()].map(([k, v]) => ({ key: k, ...v }));

  if (mode === 'date') {
    rows.sort((a, b) => b.sort - a.sort || a.heading.localeCompare(b.heading));
  } else if (mode === 'gender') {
    rows.sort((a, b) => a.sort - b.sort || a.heading.localeCompare(b.heading));
  } else if (mode === 'india') {
    rows.sort((a, b) => a.sort - b.sort || a.heading.localeCompare(b.heading));
  } else {
    rows.sort((a, b) => a.heading.localeCompare(b.heading));
  }

  return rows.map(({ heading, items }) => ({ heading, items }));
}
