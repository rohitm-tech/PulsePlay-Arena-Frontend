'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Bell,
  Brain,
  ChevronDown,
  Crown,
  Gauge,
  LineChart,
  Lock,
  MessageCircle,
  Radio,
  Rocket,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Tv,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteInShell } from '@/lib/site-layout';

type FeatureLine = { title: string; desc: string };

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  id,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-reveal mb-10 max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-ink-600 dark:text-ink-400">{subtitle}</p>
    </div>
  );
}

type CapabilityTab = {
  id: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  spotlightIcons: [LucideIcon, LucideIcon, LucideIcon];
  items: FeatureLine[];
};

function SpotlightCard({
  title,
  desc,
  icon: Icon,
  index,
}: FeatureLine & { icon: LucideIcon; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="group relative overflow-hidden rounded-2xl border border-ink-200/90 bg-gradient-to-b from-white to-ink-50/80 p-5 dark:border-ink-700/90 dark:from-ink-900/90 dark:to-ink-950/80"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ink-900/5 blur-2xl transition-opacity group-hover:opacity-100 dark:bg-white/10" />
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200/90 bg-white text-ink-900 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-50">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-ink-900 dark:text-ink-50">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">{desc}</p>
    </motion.div>
  );
}

function CapabilityExplorer({ tabs }: { tabs: CapabilityTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  const spotlights = current.items.slice(0, 3).map((item, i) => ({
    ...item,
    icon: current.spotlightIcons[i] ?? Sparkles,
    index: i,
  }));

  return (
    <div className="scroll-reveal">
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin [-webkit-overflow-scrolling:touch]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isOn = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                isOn
                  ? 'border-ink-900 bg-ink-900 text-white dark:border-ink-100 dark:bg-ink-100 dark:text-ink-950'
                  : 'border-ink-200/90 bg-white/70 text-ink-700 hover:border-ink-300 hover:bg-white dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:border-ink-500'
              )}
            >
              <Icon className="h-4 w-4 opacity-80" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="mt-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200/60 pb-8 dark:border-ink-800/60">
            <div className="max-w-2xl">
              <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-400">{current.blurb}</p>
            </div>
            <div className="rounded-full border border-ink-200/80 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400">
              {current.items.length} capabilities
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {spotlights.map((s) => (
              <SpotlightCard key={s.title} {...s} />
            ))}
          </div>

          <details className="group mt-10 rounded-2xl border border-ink-200/80 bg-white/50 open:bg-white/80 dark:border-ink-800/80 dark:bg-ink-900/30 dark:open:bg-ink-900/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-ink-900 outline-none transition hover:bg-ink-50/80 dark:text-ink-50 dark:hover:bg-ink-800/40 [&::-webkit-details-marker]:hidden">
              <span>Full checklist in this area</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-ink-500 transition group-open:rotate-180 dark:text-ink-400" aria-hidden />
            </summary>
            <div className="border-t border-ink-200/60 px-5 pb-5 pt-4 dark:border-ink-800/60">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {current.items.map((item) => (
                  <li key={item.title} className="text-sm leading-snug">
                    <span className="font-medium text-ink-900 dark:text-ink-100">{item.title}</span>
                    <span className="text-ink-400 dark:text-ink-600"> — </span>
                    <span className="text-ink-600 dark:text-ink-400">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function IconRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
      <Icon className="h-4 w-4 shrink-0 text-ink-500 dark:text-ink-400" />
      {label}
    </div>
  );
}

export default function LandingPage() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in-view');
          else e.target.classList.remove('in-view');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('.scroll-reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const heroPillars = [
    { icon: Radio, label: 'Socket.IO live rooms' },
    { icon: Lock, label: 'JWT + refresh sessions' },
    { icon: Zap, label: 'TanStack Query + Redis-backed API' },
  ];

  const liveMatch: FeatureLine[] = [
    { title: 'Real-time live scores', desc: 'Score payloads pushed on the matches namespace — pick up from CricAPI in real time.' },
    { title: 'Ball-by-ball commentary', desc: 'Structured events (six, four, wicket, milestones) parsed from each delivery line.' },
    { title: 'Instant event pulses', desc: 'Pulse moments toast the room and trigger reaction bursts on big plays.' },
    { title: 'Interactive match timeline', desc: 'Key moments rail derived from the same commentary feed you see in-match.' },
    { title: 'Run worm & momentum', desc: 'Cumulative runs plus a heuristic momentum curve for narrative tension.' },
    { title: 'Win-probability lean', desc: 'A simple two-side lean from recent ball mix — honest about not being bookmaker-grade.' },
    { title: 'AI highlights feed', desc: 'Gemini digest: summary bullets, highlight lines, and hype vs analytical cards.' },
    { title: 'Multi-match tracking', desc: 'Live hub lists every current match; “For you” reorders by your favorite team.' },
  ];

  const fanEngagement: FeatureLine[] = [
    { title: 'Live emoji reactions', desc: 'One tap from the reaction rail; animations stay on-brand in monochrome.' },
    { title: 'Reaction bursts', desc: 'Socket-driven bursts stack when pulse moments fire — stadium energy on a second screen.' },
    { title: 'Match-specific fan chat', desc: 'Rooms per match with typing hints, persisted history, and message reactions.' },
    { title: 'Team fan rooms', desc: 'Join your favorite franchise namespace alongside the main match room.' },
    { title: 'Watch-party ready', desc: 'Share match links; same room works for friends on phones and laptops together.' },
    { title: 'Fan polls & predictions', desc: 'Timed questions with optional correct answers — XP when admins close and score.' },
    { title: 'Trivia & quizzes', desc: 'Fan hub serves random cricket trivia with instant verify for quick engagement loops.' },
    { title: 'MVP-style voting', desc: 'Use polls for “Player of the match” — same engine, flexible copy.' },
  ];

  const gamification: FeatureLine[] = [
    { title: 'XP points system', desc: 'Earn XP from correct poll calls; reflected on profile and leaderboards.' },
    { title: 'Daily streaks', desc: 'Streak fields on user + leaderboard documents reward consistent play.' },
    { title: 'Match badges & achievements', desc: 'Definitions unlock from XP, streaks, predictions, and follows — sync to profile.' },
    { title: 'Fan tiers', desc: 'Five tiers derived from lifetime XP so fans can flex progression.' },
    { title: 'Prediction leaderboard', desc: 'Global board with correct prediction counts alongside XP and streak.' },
    { title: 'Team loyalty', desc: 'Favorite team powers personalized ordering and team socket rooms.' },
    { title: 'Season challenges', desc: 'Achievement copy maps to season-long goals as your stats grow.' },
    { title: 'Fantasy-style contests', desc: 'Polls + XP mimic lightweight prediction leagues without a separate fantasy engine.' },
  ];

  const aiPowered: FeatureLine[] = [
    { title: 'AI match summaries', desc: 'Gemini reads live match JSON + commentary to produce a tight snapshot paragraph.' },
    { title: 'Commentary explanations', desc: '“What happened?” on any ball posts to Gemini for a plain-language recap.' },
    { title: 'Smart in-game insights', desc: 'Structured insight cards mixing hype and analytical tones from the same context.' },
    { title: 'Player comparison', desc: 'Side-by-side Gemini bullets with optional match context JSON for grounding.' },
    { title: 'Personalized recommendations', desc: 'For-you feed surfaces matches mentioning your saved favorite team first.' },
    { title: 'AI hype moments', desc: 'Insight cards explicitly carry hype tone when the model sees boundary pressure.' },
    { title: 'Smart notifications', desc: 'In-app notification documents on poll wins; header inbox with read state.' },
    { title: 'Chat safety filter', desc: 'Keyword guard on send plus user reports stored for admin review.' },
    { title: 'Sentiment heuristics', desc: 'Lightweight text scoring endpoint for moderation experiments and UI badges.' },
    { title: 'Wicket explainers', desc: 'Dedicated Gemini path for dismissal snippets in analyst voice.' },
  ];

  const personalization: FeatureLine[] = [
    { title: 'Favorite teams', desc: 'Profile field drives feed ordering and optional team room auto-join.' },
    { title: 'Favorite players', desc: 'Comma-separated list on profile for future stats tie-ins and UI badges.' },
    { title: 'Personalized match feed', desc: 'Authenticated “For you” route sorts live cards toward your franchise.' },
    { title: 'Notification preferences', desc: 'Toggle boundaries, wickets, milestones, and poll alerts for toast noise level.' },
    { title: 'Smart content hooks', desc: 'AI digest and analytics reuse the same match id — one coherent second screen.' },
    { title: 'Dark mode canvas', desc: 'System-aware theme toggle with calm ink palette across every route.' },
    { title: 'Language-ready UI', desc: 'Copy is structured in sections so localization can layer in when you add i18n.' },
    { title: 'Follow graph', desc: 'Search fans, follow up to hundreds, and unlock social achievements as you grow.' },
  ];

  const social: FeatureLine[] = [
    { title: 'Fan discovery', desc: 'User search endpoint surfaces public avatars, teams, and XP for serendipitous follows.' },
    { title: 'Share reactions & rooms', desc: 'Web Share API or clipboard on match pages so clips of banter travel fast.' },
    { title: 'Social profiles', desc: 'Profile shows tier, XP, streak, badges, and personalization fields you control.' },
    { title: 'Fan communities', desc: 'Match + team namespaces act as lightweight communities without separate forums.' },
    { title: 'Rivalry energy', desc: 'Polls and leaderboards frame head-to-head nights without toxic mechanics.' },
    { title: 'Match discussions', desc: 'Chronological chat with reactions models threaded banter for big overs.' },
    { title: 'Community polls', desc: 'Admins spawn questions everyone sees over the polls namespace in-room.' },
    { title: 'Activity signals', desc: 'Typing indicators and pulse toasts mimic presence without invasive tracking.' },
  ];

  const notifications: FeatureLine[] = [
    { title: 'Wicket & boundary pulses', desc: 'Socket pulse moments pair with profile toggles so fans choose their noise floor.' },
    { title: 'Poll result alerts', desc: 'Winners receive persisted notifications describing the question and XP grant.' },
    { title: 'Inbox in the header', desc: 'Bell drawer lists notifications; tap marks read and refreshes unread counts.' },
    { title: 'Match-start reminders', desc: 'Hook your own scheduler or marketing tool — API already exposes live lists.' },
    { title: 'Close-match alerts', desc: 'Combine pulse events with client-side rules to badge “nail-biter” sessions later.' },
    { title: 'Friend activity (foundation)', desc: 'Following ids stored — ready for activity feeds when you add events.' },
  ];

  const content: FeatureLine[] = [
    { title: 'Match previews', desc: 'Gemini preview endpoint turns match_info JSON into neutral copy blocks.' },
    { title: 'Post-match analysis', desc: 'Reuse digest + compare endpoints after final ball for recap pages.' },
    { title: 'Expert tone via prompts', desc: 'Prompts emphasize honesty when CricAPI data is thin — no invented scorelines.' },
    { title: 'Trending moments', desc: 'Timeline + highlights surface what the model and heuristics agree is loud.' },
    { title: 'Short-form highlight cards', desc: 'Digest cards are sized for second-screen skim, not long essays.' },
    { title: 'Team news hooks', desc: 'Favorite team metadata is ready for CMS or RSS injection on your roadmap.' },
  ];

  const ux: FeatureLine[] = [
    { title: 'Smooth motion', desc: 'Framer Motion on hero, cards, and match widgets keeps energy without jitter.' },
    { title: 'Dark mode first', desc: 'next-themes integration with accessible contrast on ink neutrals.' },
    { title: 'Fast-loading UI', desc: 'Route-level code splitting, optimistic sockets, and query caching by design.' },
    { title: 'Offline-friendly shell', desc: 'Persisted auth state survives refresh; sockets reconnect gracefully.' },
    { title: 'Mobile-first layouts', desc: 'Grids collapse to single column with touch-sized controls in match rooms.' },
    { title: 'Keyboard-friendly controls', desc: 'Buttons and forms use native focus rings aligned to the design system.' },
    { title: 'Multi-device sync', desc: 'JWT access + refresh means phone and laptop share the same PulsePlay identity.' },
    { title: 'Clear navigation', desc: 'Live, Fan hub, Leaderboards, Profile, and Admin paths stay one tap away.' },
  ];

  const moderation: FeatureLine[] = [
    { title: 'Spam keyword guard', desc: 'Chat pipeline rejects known spam / slur patterns before messages broadcast.' },
    { title: 'User reports', desc: 'Report endpoint logs message ids, rooms, and reporters for moderation queues.' },
    { title: 'Admin deletion', desc: 'Privileged route removes abusive chat lines when investigations finish.' },
    { title: 'Rate limiting', desc: 'API limiter middleware protects auth and public routes from brute force.' },
    { title: 'Secure authentication', desc: 'Bcrypt passwords, rotating refresh tokens, and HttpOnly-friendly patterns.' },
    { title: 'Session hygiene', desc: 'Refresh versioning invalidates stolen refresh tokens in one bump.' },
  ];

  const premium: FeatureLine[] = [
    { title: 'Ad-free posture', desc: 'No ad slots ship in the OSS layout — premium tier can hide future promos cleanly.' },
    { title: 'Advanced analytics', desc: 'Momentum + win-lean APIs are ready to gate for subscribers with a feature flag.' },
    { title: 'Exclusive rooms', desc: 'Socket namespaces can segment VIP rooms with the same infra — add auth checks.' },
    { title: 'VIP badges', desc: 'Badge array on user documents can mark subscription tiers without schema churn.' },
    { title: 'Premium predictions', desc: 'Poll limits, longer expiry windows, or private leagues map to billing later.' },
    { title: 'Deeper player intel', desc: 'Gemini compare + preview endpoints become paywalled insights with one toggle.' },
  ];

  const adminOps: FeatureLine[] = [
    { title: 'Live event moderation', desc: 'Chat reports + admin deletes close the loop on in-match incidents.' },
    { title: 'Poll management', desc: 'Admins create, close, and score polls; winners auto-notify + XP.' },
    { title: 'Analytics dashboard', desc: 'Admin route surfaces aggregate counts for polls, chat, and live matches.' },
    { title: 'User management hooks', desc: 'User search + follow data sets you up for richer admin tooling later.' },
    { title: 'Content moderation backlog', desc: 'ChatReport collection is the start of a case queue — extend with statuses.' },
    { title: 'Feature toggles', desc: 'Environment-driven keys for CricAPI and Gemini let you stage rollouts safely.' },
    { title: 'Campaign placeholders', desc: 'Notification meta fields can carry UTM payloads for growth experiments.' },
    { title: 'Operational monitoring', desc: 'Health route, structured logs on AI fallbacks, and socket error channels.' },
  ];

  const future: FeatureLine[] = [
    { title: 'AR overlays', desc: 'Export match timelines + scores to WebXR or native shells when you are ready.' },
    { title: 'Smartwatch glance', desc: 'Pulse payloads are JSON-friendly for companion widgets and complications.' },
    { title: 'Voice assistant hooks', desc: 'Gemini text endpoints can feed voice UIs with the same prompts server-side.' },
    { title: 'Regulated betting integrations', desc: 'Keep probability copy disclaimers; partner APIs can consume analytics JSON.' },
    { title: 'Collectible moments', desc: 'Mint-ready metadata: match ids, over markers, and pulse kinds for NFT drops.' },
    { title: 'Stadium mode', desc: 'Full-screen match view + haptics-ready reaction bursts for venue Wi-Fi.' },
    { title: 'AI highlight reels', desc: 'Stack Gemini summaries with FFmpeg later for auto-cut social clips.' },
    { title: 'Multi-language commentary', desc: 'Pipe CricAPI lines through translation models using the same socket fan-out.' },
    { title: 'Crowd sentiment meter', desc: 'Blend chat sentiment endpoint with reaction velocity for a live index.' },
    { title: 'TV sync', desc: 'Timestamp commentary batches to align with broadcast latency compensation logic.' },
  ];

  const highlights = [
    {
      icon: <Radio className="h-5 w-5" />,
      title: 'Live stack',
      body: 'CricAPI + Socket.IO + TanStack Query — scores, commentary, pulses, and analytics in one room.',
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Fan mesh',
      body: 'Chat, reactions, polls, trivia hub, team rooms, and share flows tuned for IPL nights.',
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'Gemini copilots',
      body: 'Summaries, highlights, insight cards, compare, previews, wicket explainers, and sentiment helpers.',
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: 'XP & reputation',
      body: 'Poll scoring, streaks, tiers, badges, leaderboards, achievements, and follow graph foundations.',
    },
  ];

  const capabilityTabs: CapabilityTab[] = [
    {
      id: 'live',
      label: 'Live match',
      icon: Tv,
      blurb: 'Second-screen telemetry: live scores, commentary parsing, timelines, momentum, and digest-ready AI hooks — all on the same match id.',
      spotlightIcons: [Tv, Radio, Gauge],
      items: liveMatch,
    },
    {
      id: 'fans',
      label: 'Fan room',
      icon: MessageCircle,
      blurb: 'Rooms that feel like a stadium: reactions, bursts, chat, polls, trivia, and team namespaces without leaving the match surface.',
      spotlightIcons: [MessageCircle, Zap, Users],
      items: fanEngagement,
    },
    {
      id: 'xp',
      label: 'XP & boards',
      icon: Trophy,
      blurb: 'Lightweight progression that maps to your Mongo user doc — XP, streaks, badges, tiers, and leaderboards without a separate fantasy engine.',
      spotlightIcons: [Trophy, Crown, LineChart],
      items: gamification,
    },
    {
      id: 'ai',
      label: 'AI layer',
      icon: Brain,
      blurb: 'Where Gemini keys are set: structured summaries, cards, compares, previews, wicket explainers, and guardrails that stay grounded in live JSON.',
      spotlightIcons: [Brain, Sparkles, Shield],
      items: aiPowered,
    },
    {
      id: 'you',
      label: 'You & alerts',
      icon: Users,
      blurb: 'Profiles, follows, feeds, notification prefs, and inbox patterns — the personalization and social fabric around every live room.',
      spotlightIcons: [Users, Bell, Target],
      items: [...personalization, ...social, ...notifications],
    },
    {
      id: 'platform',
      label: 'Ship & scale',
      icon: Rocket,
      blurb: 'Editorial hooks, motion, resilience, moderation, monetization seams, admin controls, and forward-looking experiments — everything around the core fan loop.',
      spotlightIcons: [Rocket, Shield, Settings2],
      items: [...content, ...ux, ...moderation, ...premium, ...adminOps, ...future],
    },
  ];

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-50">
      <main className="relative pt-28">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-ink-200/60 dark:border-ink-800/60">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]">
              <div className="absolute inset-0 pattern-dots text-ink-300 dark:text-ink-700" />
            </div>
            <div
              className="absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-ink-200/40 to-transparent blur-3xl dark:from-ink-800/25"
              style={{ left: mouse.x, top: mouse.y * 0.4 }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-50 to-transparent dark:from-ink-950 dark:to-transparent" />
          </div>

          <div className={cn('relative pb-20', siteInShell)}>
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <p className="scroll-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200/90 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-ink-500 backdrop-blur dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink-900 opacity-25 dark:bg-ink-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-ink-900 dark:bg-ink-50" />
                  </span>
                  Second-screen IPL
                </p>
                <h1 className="scroll-reveal max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="text-gradient">PulsePlay</span>
                  <span className="text-ink-800 dark:text-ink-100"> — live cricket, fan rooms, and AI in one calm canvas.</span>
                </h1>
                <p className="scroll-reveal mt-6 max-w-xl text-lg text-ink-600 dark:text-ink-400">
                  Follow the match with pulses and commentary, banter in sync with friends, and Gemini-backed context when you want depth — not a wall of marketing bullets.
                </p>
                <div className="scroll-reveal mt-10 flex flex-wrap gap-3">
                  <Link href="/matches">
                    <Button size="lg" className="group gap-2">
                      Enter live hub
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="lg" variant="outline">
                      Create account
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button size="lg" variant="outline">
                      Fan hub
                    </Button>
                  </Link>
                </div>

                <div className="scroll-reveal mt-14 flex flex-wrap gap-4 border-t border-ink-200/60 pt-10 dark:border-ink-800/60">
                  {heroPillars.map((p) => (
                    <IconRow key={p.label} icon={p.icon} label={p.label} />
                  ))}
                </div>

                <div className="scroll-reveal mt-8 flex flex-wrap gap-2 text-xs text-ink-500 dark:text-ink-500">
                  <span className="rounded-full border border-ink-200/80 px-3 py-1 dark:border-ink-700">Live scores</span>
                  <span className="rounded-full border border-ink-200/80 px-3 py-1 dark:border-ink-700">Gemini</span>
                  <span className="rounded-full border border-ink-200/80 px-3 py-1 dark:border-ink-700">Polls & XP</span>
                  <span className="rounded-full border border-ink-200/80 px-3 py-1 dark:border-ink-700">Sockets</span>
                </div>
              </motion.div>

              {/* Product preview */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="scroll-reveal relative hidden lg:block"
              >
                <div className="glass-panel relative overflow-hidden p-6">
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-ink-900 dark:bg-ink-100" />
                      Live room
                    </span>
                    <span>Over 12.4</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-ink-500 dark:text-ink-400">RCB</p>
                      <p className="text-4xl font-semibold tabular-nums tracking-tight">142/3</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-500 dark:text-ink-400">CSK</p>
                      <p className="text-4xl font-semibold tabular-nums tracking-tight text-ink-400 dark:text-ink-500">138/5</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl border border-ink-200/80 bg-ink-50/80 p-3 text-sm dark:border-ink-700 dark:bg-ink-900/50">
                    <p className="font-medium text-ink-900 dark:text-ink-50">SIX — picked up from CricAPI, pushed on the wire</p>
                    <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">Reactions, digest, and momentum chart subscribe to the same event.</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {['Chat', 'Polls', 'AI'].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-lg border border-ink-200/70 bg-white/80 px-2.5 py-1 text-xs font-medium dark:border-ink-700 dark:bg-ink-950/60"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute -bottom-16 right-0 h-40 w-40 rounded-full bg-ink-900/5 blur-3xl dark:bg-white/10" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-b border-ink-200/50 bg-ink-100/50 dark:border-ink-800/50 dark:bg-ink-900/40">
          <div className={cn('grid gap-6 py-10 sm:grid-cols-3', siteInShell)}>
            {[
              { n: '6', label: 'product areas', sub: 'Tabs below group 80+ shipped behaviors.' },
              { n: 'Live', label: 'Socket-first', sub: 'Scores, pulses, chat, polls — same room.' },
              { n: 'Gemini', label: 'when keys set', sub: 'Summaries, cards, compare, explainers.' },
            ].map((s) => (
              <div key={s.label} className="scroll-reveal text-center sm:text-left">
                <p className="text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">{s.n}</p>
                <p className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-200">{s.label}</p>
                <p className="mt-1 text-xs text-ink-600 dark:text-ink-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* At a glance */}
        <section className={cn('border-b border-ink-200/40 py-16 dark:border-ink-800/40', siteInShell)}>
          <SectionHeading
            eyebrow="At a glance"
            title="Four pillars that cover match night"
            subtitle="Skim the pillars, then use the explorer for the full depth — long lists stay tucked away until you need them."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="glass-panel-interactive scroll-reveal p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 bg-ink-50 text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Capability explorer */}
        <section className={cn('border-b border-ink-200/40 py-16 dark:border-ink-800/40', siteInShell)} id="explore">
          <SectionHeading
            eyebrow="Capability explorer"
            title="Depth without the wall of cards"
            subtitle="Pick a layer to see what stands out first. Expand the checklist when you want every line item in one place."
          />
          <CapabilityExplorer tabs={capabilityTabs} />
        </section>

        {/* Wayfinding */}
        <section className={cn('border-b border-ink-200/40 py-14 dark:border-ink-800/40', siteInShell)}>
          <div className="scroll-reveal rounded-3xl border border-ink-200/80 bg-gradient-to-br from-white to-ink-50/90 p-8 dark:border-ink-800/80 dark:from-ink-900/80 dark:to-ink-950/90">
            <h2 className="text-2xl font-semibold tracking-tight">Jump into the product</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
              Each route exercises a different slice of the stack — sign in for personalized feeds, notifications, and AI.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/matches"
                className="group flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white/80 p-4 transition hover:border-ink-400 dark:border-ink-800 dark:bg-ink-950/50 dark:hover:border-ink-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
                  <Tv className="h-5 w-5 text-ink-700 dark:text-ink-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Live matches</span>
                  <span className="text-xs text-ink-500 dark:text-ink-500">Rooms & scores</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 dark:text-ink-500" />
              </Link>
              <Link
                href="/features"
                className="group flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white/80 p-4 transition hover:border-ink-400 dark:border-ink-800 dark:bg-ink-950/50 dark:hover:border-ink-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
                  <Target className="h-5 w-5 text-ink-700 dark:text-ink-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Fan hub</span>
                  <span className="text-xs text-ink-500 dark:text-ink-500">Trivia & badges</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 dark:text-ink-500" />
              </Link>
              <Link
                href="/leaderboards"
                className="group flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white/80 p-4 transition hover:border-ink-400 dark:border-ink-800 dark:bg-ink-950/50 dark:hover:border-ink-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
                  <LineChart className="h-5 w-5 text-ink-700 dark:text-ink-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Leaderboards</span>
                  <span className="text-xs text-ink-500 dark:text-ink-500">XP & predictions</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 dark:text-ink-500" />
              </Link>
              <Link
                href="/profile"
                className="group flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white/80 p-4 transition hover:border-ink-400 dark:border-ink-800 dark:bg-ink-950/50 dark:hover:border-ink-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
                  <Users className="h-5 w-5 text-ink-700 dark:text-ink-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Profile</span>
                  <span className="text-xs text-ink-500 dark:text-ink-500">Team & tier</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 dark:text-ink-500" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-ink-200/60 bg-ink-900 py-20 text-ink-50 dark:border-ink-800/60 dark:bg-ink-100 dark:text-ink-950">
          <div className={cn('text-center', siteInShell)}>
            <h2 className="scroll-reveal text-3xl font-semibold tracking-tight">Ready when the toss lands</h2>
            <p className="scroll-reveal mx-auto mt-4 max-w-2xl text-sm text-ink-300 dark:text-ink-600">
              Sign in, pick a match room, and feel the stack: pulses, digest, analytics, chat, polls, and XP — all on the monochrome canvas.
            </p>
            <div className="scroll-reveal mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="dark:bg-ink-900 dark:text-ink-50 dark:hover:bg-ink-800">
                  Sign in
                </Button>
              </Link>
              <Link href="/matches">
                <Button size="lg" variant="outline" className="border-ink-600 text-ink-50 hover:bg-ink-800 dark:border-ink-400 dark:text-ink-950 dark:hover:bg-ink-200">
                  Browse matches
                </Button>
              </Link>
            </div>
            <div className="scroll-reveal mt-10 flex flex-wrap justify-center gap-6 text-xs text-ink-400 dark:text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" /> Live analytics
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Notifications
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Moderation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" /> Premium-ready
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" /> Admin ops
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5" /> Roadmap
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
