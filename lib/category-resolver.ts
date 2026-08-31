// Resolve a product's real category from its name. Used to clean up the
// "Valluvam" catch-all bucket into proper categories (millets, spices, nuts,
// dry-fruits, oils, ghee, honey, palm-jaggery) and to keep veg/fruit correct.

export interface CatRule { slug: string; name: string; test: RegExp }

// Order matters — first match wins.
export const CATEGORY_RULES: CatRule[] = [
  { slug: 'ghee',          name: 'Ghee',          test: /\bghee\b|buffalo\s*ghee|cow\s*ghee|a2\s*ghee/i },
  { slug: 'honey',         name: 'Honey',         test: /\bhoney\b/i },
  { slug: 'palm-jaggery',  name: 'Palm Jaggery',  test: /jaggery|karupatti|karupu?atti|panai\s*vellam|palm\s*candy|palm\s*sugar|naatu\s*sarkarai|nattu\s*sakkarai|panang?\s*kalkandu/i },
  { slug: 'oils',          name: 'Cold-Pressed Oils', test: /\boil\b|gingelly|sesame\s*oil|coconut\s*oil|groundnut\s*oil|castor\s*oil|marachekku/i },
  { slug: 'millets',       name: 'Millets',       test: /millet|cholam|sorghum|thinai|varagu|kambu|\bragi\b|samai|kuthiraivali|panivaragu|barnyard|foxtail|little\s*millet|pearl\s*millet|browntop|kodo/i },
  { slug: 'spices',        name: 'Spices',        test: /cardamom|cinnamon|\bclove\b|\bpepper\b|\bjeera\b|cumin|fennel|\bsombu\b|mustard\s*seed|methi|fenugreek|bay\s*leaf|bay\s*leaves|star\s*anise|\bmasala\b|turmeric|\bmanjal\b|coriander\s*seed|dhania|nutmeg|mace|\bsaunf\b/i },
  { slug: 'nuts',          name: 'Nuts',          test: /cashew|mundhiri|walnut|akrot|pista(chio)?|almond|badam|\bpeanut\b|raw\s*groundnut/i },
  { slug: 'dry-fruits',    name: 'Dry Fruits',    test: /dry\s*grapes|raisin|kishmish|kismis|\bdates?\b|\bfig\b|anjeer|dry\s*kiwi|dried|apricot|\bprune\b|padam\s*pisin|blackcurrant/i },
  { slug: 'seeds-health-mix', name: 'Seeds & Health Mix', test: /chia\s*seed|flax\s*seed|\bomega\b|sunflower\s*seed|pumpkin\s*seed|cucumber\s*seed|basil\s*seed|sabja|health\s*mix|sathu\s*maavu/i },
];

const FRUIT_WORDS = /banana|mango|guava|apple|orange|kiwi|papaya|pineapple|pomegranate|sapota|sapodilla|strawberry|watermelon|musk\s*melon|muskmelon|sweet\s*lime|mosambi|dragon\s*fruit|amla|nellikai|grape\b|jackfruit|custard\s*apple|litchi|lychee|pear\b|plum\b|cherry|fig\s*fresh/i;
const VEG_WORDS = /tomato|onion|potato|carrot|beetroot|cabbage|cauliflower|broccoli|brinjal|eggplant|okra|ladies\s*finger|vendakkai|beans|peas|capsicum|bell\s*pepper|cucumber|radish|mooli|pumpkin|gourd|drumstick|murungai|spinach|keerai|coriander\s*leaves|mint\s*leaves|curry\s*leaves|garlic|ginger|mushroom|corn\b|zucchini|chow\s*chow|avarakkai|kovakkai|kovaikkai|banana\s*flower|banana\s*stem|snake\s*gourd|ridge\s*gourd|bitter\s*gourd|ash\s*gourd|bottle\s*gourd|cluster\s*beans|green\s*chil|nookal|kohlrabi|yam|kizhangu|sprouts|lemon|elumichai|coconut\b(?!\s*oil)/i;

export function resolveCategory(name?: string, currentSlug?: string):
  { slug: string; name: string } | null {
  const n = (name ?? '').trim();
  if (!n) return null;
  for (const r of CATEGORY_RULES) if (r.test.test(n)) return { slug: r.slug, name: r.name };
  if (FRUIT_WORDS.test(n)) return { slug: 'fruits', name: 'Fruits' };
  if (VEG_WORDS.test(n))   return { slug: 'vegetables', name: 'Vegetables' };
  return null; // leave as-is
}
