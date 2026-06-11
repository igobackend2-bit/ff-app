// Product name cleanup — fixes broken names imported from the legacy DB
// e.g. "Sesame500" -> "Cold-Pressed Sesame Oil (500 ml)", "Staranise" -> "Star Anise"

const NAME_FIXES: Record<string, string> = {
  'sesame500':                 'Cold-Pressed Sesame Oil (500 ml)',
  'sesame-1-l':                'Cold-Pressed Sesame Oil (1 L)',
  'coconutoil250':             'Cold-Pressed Coconut Oil (250 ml)',
  'coconut-1-l':               'Cold-Pressed Coconut Oil (1 L)',
  'groundnutoil250':           'Cold-Pressed Groundnut Oil (250 ml)',
  'ground-1-l':                'Cold-Pressed Groundnut Oil (1 L)',
  'staranise':                 'Star Anise',
  'sweetcorn':                 'Sweet Corn',
  'onionbig':                  'Onion (Big)',
  'onionred':                  'Red Onion',
  'redbanana':                 'Red Banana',
  'drygrapesgreen':            'Dry Grapes (Green)',
  'sunflowerseeds':            'Sunflower Seeds',
  'sweetpotato':               'Sweet Potato',
  'honeyamla':                 'Honey Amla',
  'ghee250':                   'Pure Cow Ghee (250 ml)',
  'a2-ghee':                   'A2 Cow Ghee',
  'sorghum-cholam-w-h-i-t-e':  'Sorghum Cholam (White)',
  'palm-jaggery-500':          'Palm Jaggery (500 g)',
};

// Legacy Supabase storage URL prefix → images now hosted locally in /public/images
const LEGACY_STORAGE_PREFIX = /^https:\/\/qwiumswrbddwmlraktvy\.supabase\.co\/storage\/v1\/object\/public\/app-images\//;

export function localizeImageUrl(url: string): string {
  return url.replace(LEGACY_STORAGE_PREFIX, '/images/');
}

export function localizeImageUrls(urls: string[] | undefined | null): string[] {
  return (urls ?? []).map(localizeImageUrl);
}

export function cleanProductName(name: string, slug?: string): string {
  if (slug && NAME_FIXES[slug]) return NAME_FIXES[slug];

  let n = (name ?? '').trim();
  // Collapse runs of single letters: "W H I T E" -> "White"
  n = n.replace(/\b(?:[A-Za-z] ){2,}[A-Za-z]\b/g, (m) => {
    const word = m.replace(/ /g, '');
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  // Insert a space between letters and trailing digits: "Sesame500" -> "Sesame 500"
  n = n.replace(/([a-zA-Z])(\d)/g, '$1 $2');
  return n;
}
