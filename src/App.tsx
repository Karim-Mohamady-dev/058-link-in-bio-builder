import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ChartBar, ChartLine, Check, Copy, Eye, Globe, InstagramLogo,
  Link as LinkIcon, CursorClick, PencilSimple, Plus, Trash, X, YoutubeLogo,
} from '@phosphor-icons/react';
import { dicts, initialLang, t, type Lang } from './i18n';

type BioLink = { id: string; label: string; url: string; visible: boolean; clicks: number };
type ThemeId = 'light' | 'dark' | 'violet' | 'sand';
type Profile = { name: string; username: string; bio: string; color: string; theme: ThemeId };
type Tab = 'builder' | 'analytics';

const LS_KEY = '058-linkly-state-v1';
const LANG_KEY = '058-linkly-lang';
const AVATAR_COLORS = ['#5b4fe9', '#0f766e', '#c2410c', '#be185d', '#181818'];
const THEMES: { id: ThemeId; bg: string; card: string; text: string; sub: string; btn: string }[] = [
  { id: 'light', bg: '#ffffff', card: '#f5f4f2', text: '#181818', sub: '#666666', btn: '#5b4fe9' },
  { id: 'dark', bg: '#181818', card: '#272727', text: '#ffffff', sub: '#b3b3b3', btn: '#8b80f9' },
  { id: 'violet', bg: '#5b4fe9', card: '#6c5ef0', text: '#ffffff', sub: '#e3e0fb', btn: '#181818' },
  { id: 'sand', bg: '#f3ead9', card: '#fffaf0', text: '#3d2f1d', sub: '#7a6a52', btn: '#8a5a1d' },
];

const DEFAULT_LINKS: BioLink[] = [
  { id: 'l1', label: 'My latest video', url: 'https://example.com/video', visible: true, clicks: 87 },
  { id: 'l2', label: 'Photo portfolio', url: 'https://example.com/photos', visible: true, clicks: 54 },
  { id: 'l3', label: 'Book a photo walk', url: 'https://example.com/book', visible: true, clicks: 31 },
];
const DEFAULT_PROFILE: Profile = { name: 'Layla Hassan', username: 'layla', bio: 'Photographer and weekend baker based in Cairo.', color: '#5b4fe9', theme: 'light' };

type Saved = { profile: Profile; links: BioLink[]; views: number; socials: Record<string, string> };

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch { /* fall through to defaults */ }
  return { profile: DEFAULT_PROFILE, links: DEFAULT_LINKS, views: 412, socials: { instagram: '', x: '', youtube: '' } };
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => initialLang(LANG_KEY));
  const dict = dicts[lang];
  const tr = (k: string) => t(dict, k);
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const [tab, setTab] = useState<Tab>('builder');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [labelErr, setLabelErr] = useState('');
  const [urlErr, setUrlErr] = useState('');
  const [toast, setToast] = useState('');
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage unavailable */ }
  }, [lang]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ }
  }, [saved]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const { profile, links, views, socials } = saved;
  const visibleLinks = links.filter((l) => l.visible);
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const clickRate = views > 0 ? ((totalClicks / views) * 100).toFixed(1) : '0.0';
  const maxClicks = Math.max(1, ...links.map((l) => l.clicks));
  const theme = useMemo(() => THEMES.find((x) => x.id === profile.theme) ?? THEMES[0], [profile.theme]);
  const pageUrl = `https://linkly.demo/${profile.username || 'you'}`;

  const setProfile = (patch: Partial<Profile>) => setSaved((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  const setSocial = (key: string, value: string) => setSaved((s) => ({ ...s, socials: { ...s.socials, [key]: value } }));

  function startAdd() {
    setEditingId('new');
    setLabel('');
    setUrl('https://');
    setLabelErr('');
    setUrlErr('');
  }
  function startEdit(l: BioLink) {
    setEditingId(l.id);
    setLabel(l.label);
    setUrl(l.url);
    setLabelErr('');
    setUrlErr('');
  }
  function saveLink() {
    let ok = true;
    if (!label.trim()) { setLabelErr(tr('labelError')); ok = false; } else setLabelErr('');
    if (!/^https?:\/\/.+\..+/.test(url.trim())) { setUrlErr(tr('linkUrlError')); ok = false; } else setUrlErr('');
    if (!ok) return;
    setSaved((s) => {
      const link: BioLink = { id: editingId === 'new' ? `l${Date.now()}` : editingId ?? '', label: label.trim(), url: url.trim(), visible: true, clicks: editingId === 'new' ? 0 : s.links.find((x) => x.id === editingId)?.clicks ?? 0 };
      const list = editingId === 'new' ? [...s.links, link] : s.links.map((x) => (x.id === editingId ? link : x));
      return { ...s, links: list };
    });
    setEditingId(null);
  }
  function move(id: string, dir: -1 | 1) {
    setSaved((s) => {
      const list = [...s.links];
      const i = list.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return s;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...s, links: list };
    });
  }
  function removeLink(id: string) {
    setSaved((s) => ({ ...s, links: s.links.filter((x) => x.id !== id) }));
  }
  function toggleVisible(id: string) {
    setSaved((s) => ({ ...s, links: s.links.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)) }));
  }
  function clickPreview(id: string) {
    setSaved((s) => ({ ...s, views: s.views + 1, links: s.links.map((x) => (x.id === id ? { ...x, clicks: x.clicks + 1 } : x)) }));
  }
  async function copyPage() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setToast(tr('copied'));
    } catch {
      setToast(tr('copyFailed'));
    }
  }
  function resetDemo() {
    setSaved({ profile: DEFAULT_PROFILE, links: DEFAULT_LINKS, views: 412, socials: { instagram: '', x: '', youtube: '' } });
    setToast(tr('resetDone'));
  }

  const initials = profile.name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'L';

  return (
    <div className="min-h-screen bg-white text-[#181818]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm">
        {lang === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content'}
      </a>
      <header className="sticky top-4 z-40 mx-auto max-w-6xl px-4">
        <nav className="flex items-center justify-between rounded-2xl border border-[#e3e1de] bg-white/90 px-4 py-2 backdrop-blur" aria-label="Main">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b4fe9] text-white"><LinkIcon size={18} weight="bold" /></span>
            <span className="title-1">{tr('brand')}</span>
          </span>
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => setTab('builder')} className={`button-sm rounded-lg px-3 py-2 motion-hover active:scale-[0.98] ${tab === 'builder' ? 'bg-[#181818] text-white' : 'hover:bg-[#f5f4f2]'}`} aria-current={tab === 'builder' ? 'page' : undefined}>{tr('navBuilder')}</button>
            <button type="button" onClick={() => setTab('analytics')} className={`button-sm rounded-lg px-3 py-2 motion-hover active:scale-[0.98] ${tab === 'analytics' ? 'bg-[#181818] text-white' : 'hover:bg-[#f5f4f2]'}`} aria-current={tab === 'analytics' ? 'page' : undefined}>{tr('navAnalytics')}</button>
            <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="button-sm flex items-center gap-2 rounded-lg border border-[#e3e1de] px-3 py-2 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]">
              <Globe size={16} />{tr('langSwitch')}
            </button>
          </span>
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-8 text-center">
          <h1 className="heading-1 hero-gradient-light mx-auto max-w-[680px]">{tr('heroTitle')}</h1>
          <p className="body-3 mx-auto mt-4 max-w-[680px] text-[#666666]">{tr('heroSub')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button type="button" onClick={() => document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' })} className="button-md rounded-xl bg-[#5b4fe9] px-3 py-2 text-white motion-hover hover:bg-[#4a3fd6] active:scale-[0.98]">{tr('heroCta')}</button>
            <span className="caption-2 flex items-center gap-2 rounded-full border border-[#e3e1de] px-3 py-2"><Eye size={16} />{tr('heroNote')}</span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8" aria-label="Tagline">
          <p className="heading-3 mx-auto max-w-[680px] text-center text-[#181818]">{tr('tagline')}</p>
        </section>

        <section id="builder" className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            {tab === 'builder' ? (
              <>
                <section className="rounded-2xl border border-[#e3e1de] p-4 sm:p-6" aria-labelledby="profile-h">
                  <h2 id="profile-h" className="heading-6">{tr('profileTitle')}</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="title-4 block">{tr('displayName')}</label>
                      <input id="name" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder={tr('displayNamePh')} className="body-3 mt-2 w-full rounded-xl border border-[#e3e1de] px-3 py-2" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="username" className="title-4 block">{tr('username')}</label>
                        <input id="username" value={profile.username} onChange={(e) => setProfile({ username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '') })} placeholder={tr('usernamePh')} className="body-3 mt-2 w-full rounded-xl border border-[#e3e1de] px-3 py-2" dir="ltr" />
                      </div>
                      <div>
                        <span className="title-4 block">{tr('avatarColor')}</span>
                        <div className="mt-2 flex gap-2" role="radiogroup" aria-label={tr('avatarColor')}>
                          {AVATAR_COLORS.map((c) => (
                            <button key={c} type="button" role="radio" aria-checked={profile.color === c} aria-label={c} onClick={() => setProfile({ color: c })} className={`h-8 w-8 rounded-full motion-hover active:scale-[0.98] ${profile.color === c ? 'ring-2 ring-[#181818] ring-offset-2' : ''}`} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="bio" className="title-4 block">{tr('bio')}</label>
                      <textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ bio: e.target.value })} placeholder={tr('bioPh')} rows={3} className="body-3 mt-2 w-full rounded-xl border border-[#e3e1de] px-3 py-2" />
                    </div>
                    <div>
                      <span className="title-4 block">{tr('themeTitle')}</span>
                      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={tr('themeTitle')}>
                        {THEMES.map((th) => (
                          <button key={th.id} type="button" role="radio" aria-checked={profile.theme === th.id} onClick={() => setProfile({ theme: th.id })} className={`button-sm rounded-lg border px-3 py-2 motion-hover active:scale-[0.98] ${profile.theme === th.id ? 'border-[#181818] bg-[#181818] text-white' : 'border-[#e3e1de] hover:bg-[#f5f4f2]'}`}>
                            {tr(`theme${th.id[0].toUpperCase()}${th.id.slice(1)}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="title-4">{tr('socialTitle')}</h3>
                      <div className="mt-2 grid gap-4 sm:grid-cols-3">
                        {(['instagram', 'x', 'youtube'] as const).map((key) => (
                          <div key={key}>
                            <label htmlFor={`soc-${key}`} className="caption-4 block capitalize">{key === 'x' ? 'X' : key}</label>
                            <input id={`soc-${key}`} value={socials[key] ?? ''} onChange={(e) => setSocial(key, e.target.value)} placeholder="https://" dir="ltr" className="body-6 mt-2 w-full rounded-xl border border-[#e3e1de] px-3 py-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#e3e1de] p-4 sm:p-6" aria-labelledby="links-h">
                  <div className="flex items-center justify-between gap-4">
                    <h2 id="links-h" className="heading-6">{tr('linksTitle')}</h2>
                    <button type="button" onClick={startAdd} className="button-sm flex items-center gap-2 rounded-xl bg-[#5b4fe9] px-3 py-2 text-white motion-hover hover:bg-[#4a3fd6] active:scale-[0.98]"><Plus size={16} weight="bold" />{tr('addLink')}</button>
                  </div>
                  {editingId && (
                    <div className="mt-4 rounded-xl border border-[#e3e1de] bg-[#f5f4f2] p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="link-label" className="title-4 block">{tr('linkLabel')}</label>
                          <input id="link-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={tr('linkLabelPh')} className="body-3 mt-2 w-full rounded-xl border border-[#e3e1de] bg-white px-3 py-2" />
                          {labelErr && <p className="caption-2 mt-2 text-[#c2410c]" role="alert">{labelErr}</p>}
                        </div>
                        <div>
                          <label htmlFor="link-url" className="title-4 block">{tr('linkUrl')}</label>
                          <input id="link-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={tr('linkUrlPh')} dir="ltr" className="body-3 mt-2 w-full rounded-xl border border-[#e3e1de] bg-white px-3 py-2" />
                          {urlErr && <p className="caption-2 mt-2 text-[#c2410c]" role="alert">{urlErr}</p>}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={saveLink} className="button-sm rounded-xl bg-[#181818] px-3 py-2 text-white motion-hover active:scale-[0.98]"><Check size={16} className="inline" /> {tr('saveLink')}</button>
                        <button type="button" onClick={() => setEditingId(null)} className="button-sm rounded-xl border border-[#e3e1de] px-3 py-2 motion-hover hover:bg-white active:scale-[0.98]">{tr('cancel')}</button>
                      </div>
                    </div>
                  )}
                  {links.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-[#e3e1de] p-8 text-center">
                      <LinkIcon size={32} className="mx-auto text-[#9b9b9b]" />
                      <p className="title-2 mt-4">{tr('noLinks')}</p>
                      <p className="body-6 mt-2 text-[#666666]">{tr('noLinksBody')}</p>
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {links.map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e3e1de] px-3 py-2">
                          <span className="min-w-0 flex-1">
                            <span className="title-3 block truncate">{l.label}</span>
                            <span className="caption-5 block truncate text-[#666666]" dir="ltr">{l.url}</span>
                          </span>
                          <span className="caption-4 rounded-full bg-[#f5f4f2] px-2 py-1">{l.clicks} {tr('clicks')}</span>
                          <button type="button" onClick={() => toggleVisible(l.id)} className="button-sm rounded-lg border border-[#e3e1de] px-2 py-1 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]" aria-pressed={l.visible}>{l.visible ? tr('visible') : tr('hidden')}</button>
                          <button type="button" onClick={() => move(l.id, -1)} className="rounded-lg p-2 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]" aria-label={tr('moveUp')}><ArrowUp size={16} /></button>
                          <button type="button" onClick={() => move(l.id, 1)} className="rounded-lg p-2 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]" aria-label={tr('moveDown')}><ArrowDown size={16} /></button>
                          <button type="button" onClick={() => startEdit(l)} className="rounded-lg p-2 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]" aria-label={tr('edit')}><PencilSimple size={16} /></button>
                          <button type="button" onClick={() => removeLink(l.id)} className="rounded-lg p-2 text-[#c2410c] motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]" aria-label={tr('delete')}><Trash size={16} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : (
              <section className="rounded-2xl border border-[#e3e1de] p-4 sm:p-6" aria-labelledby="analytics-h">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="analytics-h" className="heading-6 flex items-center gap-2"><ChartBar size={24} />{tr('analyticsTitle')}</h2>
                  <span className="caption-4 rounded-full bg-[#efedfd] px-2 py-1 text-[#5b4fe9]">{tr('demoLabel')}</span>
                </div>
                <p className="body-6 mt-2 text-[#666666]">{tr('demoNote')}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-[#f5f4f2] p-4"><p className="caption-4 text-[#666666]">{tr('totalViews')}</p><p className="heading-5 mt-2">{views}</p></div>
                  <div className="rounded-xl bg-[#f5f4f2] p-4"><p className="caption-4 text-[#666666]">{tr('totalClicks')}</p><p className="heading-5 mt-2">{totalClicks}</p></div>
                  <div className="rounded-xl bg-[#f5f4f2] p-4"><p className="caption-4 text-[#666666]">{tr('clickRate')}</p><p className="heading-5 mt-2">{clickRate}%</p></div>
                </div>
                <h3 className="title-2 mt-8">{tr('clicksPerLink')}</h3>
                <ul className="mt-4 space-y-4">
                  {links.map((l) => (
                    <li key={l.id}>
                      <div className="flex justify-between gap-4"><span className="body-5 truncate">{l.label}</span><span className="caption-4">{l.clicks}</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f5f4f2]"><div className="h-full rounded-full bg-[#5b4fe9] motion-base" style={{ width: `${(l.clicks / maxClicks) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={resetDemo} className="button-sm mt-8 rounded-xl border border-[#e3e1de] px-3 py-2 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]">{tr('resetDemo')}</button>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={tr('previewTitle')}>
            <div className="rounded-2xl border border-[#e3e1de] p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="heading-6">{tr('previewTitle')}</h2>
                <button type="button" onClick={copyPage} className="button-sm flex items-center gap-2 rounded-lg border border-[#e3e1de] px-3 py-2 motion-hover hover:bg-[#f5f4f2] active:scale-[0.98]"><Copy size={16} />{tr('copyPage')}</button>
              </div>
              <p className="caption-5 mt-2 truncate text-[#666666]" dir="ltr">{pageUrl}</p>
              <div className="mx-auto mt-4 max-w-[320px] rounded-[32px] border-8 border-[#181818] p-4" style={{ backgroundColor: theme.bg, color: theme.text }}>
                <div className="flex flex-col items-center px-2 py-4 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white" style={{ backgroundColor: profile.color }}>{initials}</span>
                  <p className="title-1 mt-4">{profile.name || tr('displayName')}</p>
                  <p className="caption-2 mt-2" style={{ color: theme.sub }}>@{profile.username || 'you'}</p>
                  <p className="body-6 mt-2" style={{ color: theme.sub }}>{profile.bio}</p>
                  <div className="mt-4 flex gap-2">
                    {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="rounded-full p-2 motion-hover hover:opacity-70" style={{ backgroundColor: theme.card }} aria-label="Instagram"><InstagramLogo size={18} /></a>}
                    {socials.youtube && <a href={socials.youtube} target="_blank" rel="noreferrer" className="rounded-full p-2 motion-hover hover:opacity-70" style={{ backgroundColor: theme.card }} aria-label="YouTube"><YoutubeLogo size={18} /></a>}
                    {socials.x && <a href={socials.x} target="_blank" rel="noreferrer" className="rounded-full p-2 motion-hover hover:opacity-70" style={{ backgroundColor: theme.card }} aria-label="X"><X size={18} /></a>}
                  </div>
                  <div className="mt-4 w-full space-y-2">
                    {visibleLinks.length === 0 && <p className="caption-2 py-4" style={{ color: theme.sub }}>{tr('noLinks')}</p>}
                    {visibleLinks.map((l) => (
                      <button key={l.id} type="button" onClick={() => clickPreview(l.id)} className="button-sm flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 motion-hover hover:opacity-80 active:scale-[0.98]" style={{ backgroundColor: theme.card, color: theme.text }}>
                        <span className="truncate">{l.label}</span><CursorClick size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="caption-5 mt-4 text-center text-[#666666]">{tr('previewNote')}</p>
              <p className="caption-5 mt-2 flex items-center justify-center gap-2 text-center text-[#666666]"><ChartLine size={14} />{tr('totalClicks')}: {totalClicks}</p>
            </div>
          </aside>
        </section>
      </main>

      <footer className="border-t border-[#e3e1de] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <p className="caption-2 text-[#666666]">{tr('footerNote')}</p>
          <span className="flex gap-4">
            <button type="button" onClick={() => setLegal('privacy')} className="caption-2 underline motion-hover hover:text-[#5b4fe9]">{tr('privacy')}</button>
            <button type="button" onClick={() => setLegal('terms')} className="caption-2 underline motion-hover hover:text-[#5b4fe9]">{tr('terms')}</button>
          </span>
        </div>
      </footer>

      {legal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={tr(legal)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="heading-6">{tr(legal)}</h2><button type="button" onClick={() => setLegal(null)} className="rounded-lg p-2 motion-hover hover:bg-[#f5f4f2]" aria-label={tr('close')}><X size={18} /></button></div>
            <p className="body-3 mt-4 text-[#666666]">{tr(legal === 'privacy' ? 'privacyBody' : 'termsBody')}</p>
            <button type="button" onClick={() => setLegal(null)} className="button-sm mt-6 rounded-xl bg-[#181818] px-3 py-2 text-white motion-hover active:scale-[0.98]">{tr('close')}</button>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#181818] px-4 py-2 text-sm text-white shadow-lg" role="status">{toast}</div>
      )}
    </div>
  );
}
