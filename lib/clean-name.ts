// Product name cleanup — fixes broken names imported from the legacy DB
// e.g. "Sesame500" -> "Cold-Pressed Sesame Oil (500 ml)", "Staranise" -> "Star Anise"

// Name fixes keyed by EXACT product name (case-insensitive) — used when slug is unknown
const NAME_FIXES_BY_NAME: Record<string, string> = {
  'ponni boiled rice':  'Naatu Sarkarai',
  'seeraga samba rice': 'Palm Candy',
  'palm jaggery':       'Palm Jaggery (Karupatti)',
};

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
  'ponni-boiled-rice':         'Naatu Sarkarai',
  'ponni-boiled-rice-5-kg':    'Naatu Sarkarai',
  'seeraga-samba-rice':        'Palm Candy',
  'seeraga-samba-rice-5-kg':   'Palm Candy',
};

// Known local images that exist in /public/images — anything else keeps its original URL
const LOCAL_IMAGE_NAMES = new Set([
  'amla','apple','BananaElakki','BananaKarpooravalli','BananaNendhiram','BananaPoovan',
  'droganfruit','GuavaWhite','kiwi','MangoBanganapalli','MuskMelon','orange','papaya',
  'pineapple','Pomegranate','redbanana','Sapota','SenthooraMango','Strawberry','SweetLime',
  'WatermelonKiran','WatermelonStrips','Guava','Banana',
]);

const LEGACY_STORAGE_PREFIX = /^https:\/\/qwiumswrbddwmlraktvy\.supabase\.co\/storage\/v1\/object\/public\/app-images\//;

export function localizeImageUrl(url: string): string {
  if (!url) return url;
  // .jfif files were renamed to .jpg — fix refs in already-local paths
  if (url.startsWith('/images/')) return url.replace(/\.jfif(\?.*)?$/, '.jpg');
  // For CDN URLs: only localize if we know the file exists locally; otherwise keep original CDN URL
  if (LEGACY_STORAGE_PREFIX.test(url)) {
    const local = url.replace(LEGACY_STORAGE_PREFIX, '/images/').replace(/\.jfif(\?.*)?$/, '.jpg');
    const filename = local.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
    if (LOCAL_IMAGE_NAMES.has(filename)) return local;
    return url; // keep original CDN URL for images not copied locally
  }
  return url;
}

export function localizeImageUrls(urls: string[] | undefined | null): string[] {
  return (urls ?? []).map(localizeImageUrl);
}

// Category name overrides — keyed by category slug
const CATEGORY_NAME_FIXES: Record<string, string> = {
  'valluvam':          'Naatu Sarkarai & Karupatti',
  'naadu-sarkarai':    'Naatu Sarkarai',
  'naatu-sarkarai':    'Naatu Sarkarai',
  'palm-jaggery':      'Palm Jaggery (Karupatti)',
};

export function cleanCategoryName(name: string, slug?: string): string {
  if (slug && CATEGORY_NAME_FIXES[slug.toLowerCase()]) return CATEGORY_NAME_FIXES[slug.toLowerCase()];
  return name;
}

export function cleanProductName(name: string, slug?: string): string {
  if (slug && NAME_FIXES[slug]) return NAME_FIXES[slug];
  // Name-based fallback (catches products regardless of slug format)
  const byName = NAME_FIXES_BY_NAME[(name ?? '').trim().toLowerCase()];
  if (byName) return byName;

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
