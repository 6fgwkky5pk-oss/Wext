// Categories: id, emoji icon, kind (instant | field), names in 5 languages, search synonyms/jargon
export const CATEGORIES = [
  { id: 'plumber', icon: '🚰', kind: 'instant', n: { ka: 'სანტექნიკოსი', en: 'Plumber', ru: 'Сантехник', de: 'Klempner', tr: 'Tesisatçı' },
    syn: 'სანტექნიკი სანტექნიკოსი ონკანი კრანი მილი წყალი უნიტაზი ტუალეტი კანალიზაცია ბოილერი წყალგაყვანილობა сантехник кран труба унитаз вода канализация бойлер течь plumber tap faucet pipe leak toilet water boiler klempner installateur wasserhahn rohr tesisatçı musluk boru su tuvalet' },
  { id: 'electric', icon: '⚡', kind: 'instant', n: { ka: 'ელექტრიკოსი', en: 'Electrician', ru: 'Электрик', de: 'Elektriker', tr: 'Elektrikçi' },
    syn: 'ელექტრიკოსი დენი შუქი როზეტკა როზეტი ჩამრთველი ავტომატი სადენი ნათურა მოკლე ჩართვა электрик свет розетка проводка автомат выключатель лампа electrician electricity socket outlet light wiring breaker strom steckdose elektrik priz kablo sigorta' },
  { id: 'appliance', icon: '🧺', kind: 'instant', n: { ka: 'ტექნიკის შეკეთება', en: 'Appliance repair', ru: 'Ремонт техники', de: 'Geräte-Reparatur', tr: 'Beyaz eşya tamiri' },
    syn: 'სარეცხი მანქანა მაცივარი ქურა ღუმელი კონდიციონერი ტელევიზორი სტირალკა ხალადილნიკი стиральная машина холодильник плита кондиционер ремонт техники washing machine fridge oven ac air conditioner appliance waschmaschine kühlschrank çamaşır makinesi buzdolabı klima' },
  { id: 'handyman', icon: '🔧', kind: 'instant', n: { ka: 'ოსტატი ყველაფერზე', en: 'Handyman', ru: 'Мастер на час', de: 'Hausmeister', tr: 'Tamirci' },
    syn: 'ოსტატი ხელოსანი მასტერი შეკეთება კარი საკეტი ავეჯის აწყობა თარო ფარდა мастер на час муж на час ремонт сборка мебели handyman fix repair assemble furniture shelf handwerker reparatur tamirci usta montaj' },
  { id: 'painter', icon: '🎨', kind: 'instant', n: { ka: 'მღებავი', en: 'Painter', ru: 'Маляр', de: 'Maler', tr: 'Boyacı' },
    syn: 'მღებავი შეღებვა საღებავი შპალერი ობოი კედელი маляр покраска обои стены painter paint wallpaper wall maler streichen tapete boyacı boya duvar kağıdı' },
  { id: 'tiler', icon: '🧱', kind: 'instant', n: { ka: 'მეკაფელე', en: 'Tiler', ru: 'Плиточник', de: 'Fliesenleger', tr: 'Fayansçı' },
    syn: 'მეკაფელე კაფელი ფილა მეტლახი плиточник плитка кафель tiler tile tiles fliesen fliesenleger fayans seramik' },
  { id: 'carpenter', icon: '🪚', kind: 'instant', n: { ka: 'დურგალი', en: 'Carpenter', ru: 'Плотник', de: 'Tischler', tr: 'Marangoz' },
    syn: 'დურგალი ხე ავეჯი კარი ფანჯარა იატაკი ლამინატი столяр плотник мебель дерево двери ламинат carpenter wood furniture door floor laminate tischler schreiner holz marangoz ahşap mobilya' },
  { id: 'locksmith', icon: '🔑', kind: 'instant', n: { ka: 'საკეტების ოსტატი', en: 'Locksmith', ru: 'Слесарь (замки)', de: 'Schlüsseldienst', tr: 'Çilingir' },
    syn: 'საკეტი გასაღები კარი ჩამეკეტა ზამოკი замок ключ вскрыть дверь слесарь locksmith lock key locked out schlüssel schloss çilingir kilit anahtar' },
  { id: 'cleaning', icon: '🧽', kind: 'instant', n: { ka: 'სახლის დალაგება', en: 'Home cleaning', ru: 'Уборка дома', de: 'Hausreinigung', tr: 'Ev temizliği' },
    syn: 'დალაგება დასუფთავება დამლაგებელი уборка клининг cleaning cleaner clean house putzen reinigung temizlik' },
  { id: 'windows', icon: '🪟', kind: 'instant', n: { ka: 'ფანჯრების წმენდა', en: 'Window cleaning', ru: 'Мойка окон', de: 'Fensterputzen', tr: 'Cam silme' },
    syn: 'ფანჯარა მინა წმენდა окна мойка окон стекло window windows glass fenster cam pencere' },
  { id: 'harvest', icon: '🍇', kind: 'field', n: { ka: 'რთველი', en: 'Grape harvest', ru: 'Ртвели (сбор винограда)', de: 'Weinlese', tr: 'Bağ bozumu' },
    syn: 'რთველი ყურძენი ვენახი კრეფა მკრეფავი ртвели виноград сбор винограда виноградник harvest grape vineyard picking weinlese trauben bağ bozumu üzüm' },
  { id: 'land', icon: '⛏️', kind: 'field', n: { ka: 'თოხნა / მიწის სამუშაო', en: 'Hoeing / land work', ru: 'Прополка / земляные работы', de: 'Hacken / Erdarbeiten', tr: 'Çapa / toprak işi' },
    syn: 'თოხნა მიწა ბარვა თხრა ბოსტანი სარეველა прополка копать земля огород hoe hoeing dig land weeding garden bed hacken graben çapa kazmak toprak' },
  { id: 'garden', icon: '🌳', kind: 'field', n: { ka: 'ბაღი / სხვლა', en: 'Garden / pruning', ru: 'Сад / обрезка', de: 'Garten / Baumschnitt', tr: 'Bahçe / budama' },
    syn: 'ბაღი სხვლა ხე ბალახი გაკრეჭა სათიბი სად обрезка деревья газон покос garden pruning trees lawn mowing garten rasen baumschnitt bahçe budama çim' },
  { id: 'firewood', icon: '🪵', kind: 'field', n: { ka: 'შეშა', en: 'Firewood', ru: 'Дрова', de: 'Brennholz', tr: 'Odun' },
    syn: 'შეშა დაჩეხვა ხერხვა დრова дрова колоть пилить firewood wood chop split brennholz holz hacken odun kesmek' },
  { id: 'movers', icon: '📦', kind: 'instant', n: { ka: 'მზიდავები', en: 'Movers', ru: 'Грузчики', de: 'Umzugshelfer', tr: 'Nakliyeci' },
    syn: 'მზიდავი გადაზიდვა გადასვლა ტვირთი ბარგი მუშა грузчики переезд перевозка movers moving carry umzug träger nakliye taşıma hamal' },
]

export const catById = id => CATEGORIES.find(c => c.id === id)
export const catName = (id, lang) => { const c = catById(id); return c ? (c.n[lang] || c.n.en) : id }

// Search: matches names in all languages + synonyms, prefix-tolerant
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
export function searchCats(q, lang) {
  const t = norm(q.trim())
  if (!t) return CATEGORIES
  const words = t.split(/\s+/)
  return CATEGORIES.map(c => {
    const hay = norm(Object.values(c.n).join(' ') + ' ' + c.syn)
    const tokens = hay.split(/\s+/)
    let score = 0
    for (const w of words) {
      if (tokens.some(x => x === w)) score += 3
      else if (tokens.some(x => x.startsWith(w) || (w.length >= 4 && x.startsWith(w.slice(0, -1))))) score += 2
      else if (w.length >= 3 && hay.includes(w)) score += 1
    }
    return { c, score }
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.c)
}

// Multi-city / multi-country from day one. Location decides region + currency.
export const REGIONS = [
  { id: 'ge', currency: 'GEL', symbol: '₾', center: [41.92, 45.47], bbox: [41.0, 40.0, 43.6, 46.8] },
  { id: 'tr', currency: 'TRY', symbol: '₺', center: [41.01, 28.97], bbox: [35.8, 25.6, 42.2, 44.9] },
  { id: 'de', currency: 'EUR', symbol: '€', center: [52.52, 13.4], bbox: [47.2, 5.8, 55.1, 15.1] },
]
export function regionFor([lat, lng]) {
  return REGIONS.find(r => lat >= r.bbox[0] && lat <= r.bbox[2] && lng >= r.bbox[1] && lng <= r.bbox[3]) || REGIONS[0]
}

export function distKm(a, b) {
  const R = 6371, toR = x => x * Math.PI / 180
  const dLat = toR(b[0] - a[0]), dLng = toR(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const FIRST = ['გიორგი', 'ლევანი', 'დავითი', 'ნიკა', 'ზურაბი', 'ირაკლი', 'გოჩა', 'თემური', 'ბექა', 'სანდრო', 'ვახტანგი', 'მამუკა', 'ნინო', 'თამარი', 'ეკა', 'მარიამი', 'ლაშა', 'შოთა', 'კახა', 'ალექსი']
const LAST = ['ბ.', 'კ.', 'მ.', 'ჯ.', 'ხ.', 'ც.', 'გ.', 'ნ.', 'ტ.', 'ჩ.']
const FEMALE = new Set(['ნინო', 'თამარი', 'ეკა', 'მარიამი'])

// Deterministic sample network of pros around a point so the app is alive before the realtime backend is attached.
export function seedPros(center) {
  let s = Math.floor((center[0] * 1000 + center[1] * 1000)) % 2147483647 || 7
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const pros = []
  CATEGORIES.forEach((c, ci) => {
    const count = c.kind === 'field' ? 3 : 4
    for (let i = 0; i < count; i++) {
      let fn = FIRST[Math.floor(rnd() * FIRST.length)]
      if (['cleaning', 'windows'].includes(c.id) && rnd() < .6) fn = [...FEMALE][Math.floor(rnd() * 4)]
      if (!['cleaning', 'windows', 'harvest', 'garden'].includes(c.id) && FEMALE.has(fn)) fn = 'გიორგი'
      const type = c.kind === 'field' ? (i === 0 ? 'company' : i === 1 ? 'brigade' : 'individual') : (i === 3 ? 'company' : i === 2 && rnd() < .5 ? 'brigade' : 'individual')
      const r = 0.4 + rnd() * 5.5, a = rnd() * Math.PI * 2
      const pos = [center[0] + (r / 111) * Math.cos(a), center[1] + (r / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(a)]
      const companyNames = { plumber: 'AquaFix', electric: 'Volt Service', appliance: 'TechnoMaster', handyman: 'HomeHelp', painter: 'ColorPro', tiler: 'TileArt', carpenter: 'WoodLine', locksmith: 'KeyPoint', cleaning: 'CleanHouse', windows: 'ClearView', harvest: 'კახური ვენახი', land: 'AgroTeam', garden: 'GreenCut', firewood: 'შეშა 24', movers: 'MoveIt' }
      pros.push({
        id: `p_${c.id}_${i}`,
        name: type === 'company' ? companyNames[c.id] : type === 'brigade' ? `${fn}ს ბრიგადა` : `${fn} ${LAST[Math.floor(rnd() * LAST.length)]}`,
        type, cat: c.id, cats: [c.id],
        members: type === 'brigade' ? 3 + Math.floor(rnd() * 4) : type === 'company' ? 6 + Math.floor(rnd() * 10) : 1,
        verified: type === 'company' || rnd() < .4,
        rating: +(4.3 + rnd() * 0.7).toFixed(1), jobs: 8 + Math.floor(rnd() * 240),
        pos, online: rnd() < .82, hue: Math.floor(rnd() * 360), female: FEMALE.has(fn),
      })
    }
  })
  return pros
}

export function initials(name) {
  const p = name.replace(/ს ბრიგადა$/, '').split(' ')
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}
