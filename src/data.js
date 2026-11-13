// Categories: id, emoji icon, kind (instant | field), names in 5 languages, search synonyms/jargon
export const CATEGORIES = [
  { id: 'plumber', g: 'handy', icon: '🚰', kind: 'instant', n: { ka: 'სანტექნიკოსი', en: 'Plumber', ru: 'Сантехник', de: 'Klempner', tr: 'Tesisatçı' },
    syn: 'სანტექნიკი სანტექნიკოსი ონკანი კრანი მილი წყალი უნიტაზი ტუალეტი კანალიზაცია ბოილერი წყალგაყვანილობა сантехник кран труба унитаз вода канализация бойлер течь plumber tap faucet pipe leak toilet water boiler klempner installateur wasserhahn rohr tesisatçı musluk boru su tuvalet' },
  { id: 'electric', g: 'handy', icon: '⚡', kind: 'instant', n: { ka: 'ელექტრიკოსი', en: 'Electrician', ru: 'Электрик', de: 'Elektriker', tr: 'Elektrikçi' },
    syn: 'ელექტრიკოსი დენი შუქი როზეტკა როზეტი ჩამრთველი ავტომატი სადენი ნათურა მოკლე ჩართვა электрик свет розетка проводка автомат выключатель лампа electrician electricity socket outlet light wiring breaker strom steckdose elektrik priz kablo sigorta' },
  { id: 'appliance', g: 'handy', icon: '🧺', kind: 'instant', n: { ka: 'ტექნიკის შეკეთება', en: 'Appliance repair', ru: 'Ремонт техники', de: 'Geräte-Reparatur', tr: 'Beyaz eşya tamiri' },
    syn: 'სარეცხი მანქანა მაცივარი ქურა ღუმელი კონდიციონერი ტელევიზორი სტირალკა ხალადილნიკი стиральная машина холодильник плита кондиционер ремонт техники washing machine fridge oven ac air conditioner appliance waschmaschine kühlschrank çamaşır makinesi buzdolabı klima' },
  { id: 'handyman', g: 'handy', icon: '🔧', kind: 'instant', n: { ka: 'რემონტი / ოსტატი', en: 'Handyman', ru: 'Мастер на час', de: 'Hausmeister', tr: 'Tamirci' },
    syn: 'ოსტატი ხელოსანი მასტერი შეკეთება კარი საკეტი ავეჯის აწყობა თარო ფარდა мастер на час муж на час ремонт сборка мебели handyman fix repair assemble furniture shelf handwerker reparatur tamirci usta montaj' },
  { id: 'painter', g: 'handy', icon: '🎨', kind: 'instant', n: { ka: 'მღებავი', en: 'Painter', ru: 'Маляр', de: 'Maler', tr: 'Boyacı' },
    syn: 'მღებავი შეღებვა საღებავი შპალერი ობოი კედელი маляр покраска обои стены painter paint wallpaper wall maler streichen tapete boyacı boya duvar kağıdı' },
  { id: 'tiler', g: 'handy', icon: '🧱', kind: 'instant', n: { ka: 'მეკაფელე', en: 'Tiler', ru: 'Плиточник', de: 'Fliesenleger', tr: 'Fayansçı' },
    syn: 'მეკაფელე კაფელი ფილა მეტლახი плиточник плитка кафель tiler tile tiles fliesen fliesenleger fayans seramik' },
  { id: 'carpenter', g: 'handy', icon: '🪚', kind: 'instant', n: { ka: 'დურგალი', en: 'Carpenter', ru: 'Плотник', de: 'Tischler', tr: 'Marangoz' },
    syn: 'დურგალი ხე ავეჯი კარი ფანჯარა იატაკი ლამინატი столяр плотник мебель дерево двери ламинат carpenter wood furniture door floor laminate tischler schreiner holz marangoz ahşap mobilya' },
  { id: 'locksmith', g: 'handy', icon: '🔑', kind: 'instant', n: { ka: 'საკეტების ოსტატი', en: 'Locksmith', ru: 'Слесарь (замки)', de: 'Schlüsseldienst', tr: 'Çilingir' },
    syn: 'საკეტი გასაღები კარი ჩამეკეტა ზამოკი замок ключ вскрыть дверь слесарь locksmith lock key locked out schlüssel schloss çilingir kilit anahtar' },
  { id: 'cleaning', g: 'clean', icon: '🧽', kind: 'instant', n: { ka: 'სახლი', en: 'Home cleaning', ru: 'Уборка дома', de: 'Hausreinigung', tr: 'Ev temizliği' },
    syn: 'დალაგება დასუფთავება დამლაგებელი уборка клининг cleaning cleaner clean house putzen reinigung temizlik' },
  { id: 'windows', g: 'clean', icon: '🪟', kind: 'instant', n: { ka: 'ფანჯრები', en: 'Window cleaning', ru: 'Мойка окон', de: 'Fensterputzen', tr: 'Cam silme' },
    syn: 'ფანჯარა მინა წმენდა окна мойка окон стекло window windows glass fenster cam pencere' },
  { id: 'harvest', g: 'land', icon: '🍇', kind: 'instant', n: { ka: 'მოსავლის აღება / რთველი', en: 'Grape harvest', ru: 'Ртвели (сбор винограда)', de: 'Weinlese', tr: 'Bağ bozumu' },
    syn: 'რთველი ყურძენი ვენახი კრეფა მკრეფავი ртвели виноград сбор винограда виноградник harvest grape vineyard picking weinlese trauben bağ bozumu üzüm' },
  { id: 'land', g: 'land', icon: '⛏️', kind: 'instant', n: { ka: 'მიწის დამუშავება', en: 'Hoeing / land work', ru: 'Прополка / земляные работы', de: 'Hacken / Erdarbeiten', tr: 'Çapa / toprak işi' },
    syn: 'თოხნა მიწა ბარვა თხრა ბოსტანი სარეველა прополка копать земля огород hoe hoeing dig land weeding garden bed hacken graben çapa kazmak toprak' },
  { id: 'garden', g: 'land', icon: '🌳', kind: 'instant', n: { ka: 'ბაღის მოვლა', en: 'Garden / pruning', ru: 'Сад / обрезка', de: 'Garten / Baumschnitt', tr: 'Bahçe / budama' },
    syn: 'ბაღი სხვლა ხე ბალახი გაკრეჭა სათიბი სად обрезка деревья газон покос garden pruning trees lawn mowing garten rasen baumschnitt bahçe budama çim' },
  { id: 'firewood', g: 'land', icon: '🪵', kind: 'instant', n: { ka: 'შეშა', en: 'Firewood', ru: 'Дрова', de: 'Brennholz', tr: 'Odun' },
    syn: 'შეშა დაჩეხვა ხერხვა დრова дрова колоть пилить firewood wood chop split brennholz holz hacken odun kesmek' },
  { id: 'movers', g: 'move', icon: '📦', kind: 'instant', n: { ka: 'მტვირთავი', en: 'Movers', ru: 'Грузчики', de: 'Umzugshelfer', tr: 'Nakliyeci' },
    syn: 'მზიდავი გადაზიდვა გადასვლა ტვირთი ბარგი მუშა грузчики переезд перевозка movers moving carry umzug träger nakliye taşıma hamal' },
  { id: 'office', g: 'clean', icon: '🏢', kind: 'instant', n: { ka: 'ოფისი', en: 'Office cleaning', ru: 'Уборка офиса', de: 'Büroreinigung', tr: 'Ofis temizliği', uk: 'Прибирання офісу', es: 'Limpieza de oficinas', fr: 'Ménage de bureaux' },
    syn: 'ოფისი ოფისის დალაგება офис уборка офиса office cleaning büro ofis' },
  { id: 'tractor', g: 'machine', icon: '🚜', kind: 'instant', n: { ka: 'ტრაქტორი', en: 'Tractor', ru: 'Трактор', de: 'Traktor', tr: 'Traktör', uk: 'Трактор', es: 'Tractor', fr: 'Tracteur' },
    syn: 'ტრაქტორი ხვნა მოხვნა კულტივაცია трактор вспашка пахать tractor plough plow traktor pflügen traktör' },
  { id: 'excavator', g: 'machine', icon: '🏗️', kind: 'instant', n: { ka: 'ექსკავატორი', en: 'Excavator', ru: 'Экскаватор', de: 'Bagger', tr: 'Ekskavatör', uk: 'Екскаватор', es: 'Excavadora', fr: 'Pelleteuse' },
    syn: 'ექსკავატორი ბულდოზერი თხრა ორმო ფუნდამენტი экскаватор копать котлован bulldozer excavator digger bagger kepçe ekskavatör jcb' },
  { id: 'crane', g: 'machine', icon: '🏗', kind: 'instant', n: { ka: 'ამწე', en: 'Crane', ru: 'Кран', de: 'Kran', tr: 'Vinç', uk: 'Кран', es: 'Grúa', fr: 'Grue' },
    syn: 'ამწე კრანი манипулятор кран автокран crane lift kran vinç' },
  { id: 'cartruck', g: 'move', icon: '🚚', kind: 'instant', n: { ka: 'მანქანა მძღოლით', en: 'Truck with driver', ru: 'Грузовик с водителем', de: 'Transporter mit Fahrer', tr: 'Şoförlü kamyonet', uk: 'Вантажівка з водієм', es: 'Camión con conductor', fr: 'Camion avec chauffeur' },
    syn: 'მანქანა სატვირთო გადაზიდვა ტვირთი ფორდი газель грузовик перевозка truck van transport delivery lkw transporter kamyon kamyonet nakliye' },
  { id: 'carwash', g: 'road', icon: '🧼', kind: 'instant', n: { ka: 'მანქანის რეცხვა', en: 'Car wash', ru: 'Автомойка', de: 'Autowäsche', tr: 'Oto yıkama', uk: 'Автомийка', es: 'Lavado de coche', fr: 'Lavage auto' },
    syn: 'რეცხვა სამრეცხაო მანქანის რეცხვა ქიმწმენდა салона мойка автомойка химчистка car wash wash detailing autowäsche yıkama' },
  { id: 'bodywork', g: 'road', icon: '🔨', kind: 'instant', n: { ka: 'მეთუნუქე', en: 'Body repair', ru: 'Жестянщик', de: 'Karosserie', tr: 'Kaportacı', uk: 'Бляхар', es: 'Chapista', fr: 'Carrossier' },
    syn: 'მეთუნუქე ჟესტიანშიკი ჟეშტიანშიკი თუნუქი კუზავი ღებვა მანქანის შეღებვა жестянщик кузов покраска рихтовка body repair dent bodywork paint karosserie kaporta boya' },
  { id: 'mechanic', g: 'road', icon: '🔧', kind: 'instant', n: { ka: 'ავტომექანიკოსი', en: 'Car mechanic', ru: 'Автомеханик', de: 'Kfz-Mechaniker', tr: 'Oto tamirci', uk: 'Автомеханік', es: 'Mecánico', fr: 'Mécanicien auto' },
    syn: 'მექანიკოსი ხელოსანი მანქანის ძრავი სავალი ნაწილი მოტორისტი ავტოელექტრიკოსი механик автосервис ремонт авто mechanic car repair engine kfz werkstatt tamirci' },
  { id: 'tow', g: 'road', icon: '🛻', kind: 'instant', n: { ka: 'ევაკუატორი', en: 'Tow truck', ru: 'Эвакуатор', de: 'Abschleppdienst', tr: 'Çekici', uk: 'Евакуатор', es: 'Grúa de auto', fr: 'Dépanneuse' },
    syn: 'ევაკუატორი ევაკუაცია გაფუჭდა მანქანა эвакуатор tow towing breakdown abschleppen çekici' },
  { id: 'tire', g: 'road', icon: '🛞', kind: 'instant', n: { ka: 'ვულკანიზაცია / საბურავი', en: 'Flat tire', ru: 'Шиномонтаж', de: 'Reifenpanne', tr: 'Lastik', uk: 'Шиномонтаж', es: 'Pinchazo', fr: 'Pneu crevé' },
    syn: 'საბურავი ბორბალი ვულკანიზაცია დაეშვა шина колесо шиномонтаж прокол tire tyre flat wheel reifen lastik' },
  { id: 'battery', g: 'road', icon: '🔋', kind: 'instant', n: { ka: 'აკუმულატორი', en: 'Battery jump', ru: 'Аккумулятор', de: 'Starthilfe', tr: 'Akü takviye', uk: 'Акумулятор', es: 'Batería', fr: 'Batterie' },
    syn: 'აკუმულატორი დაჯდა არ ქოქავს аккумулятор прикурить сел battery jump start starthilfe batterie akü' },
  { id: 'fuel', g: 'road', icon: '⛽', kind: 'instant', n: { ka: 'საწვავი', en: 'Fuel delivery', ru: 'Доставка топлива', de: 'Kraftstoff', tr: 'Yakıt', uk: 'Пальне', es: 'Combustible', fr: 'Carburant' },
    syn: 'საწვავი ბენზინი დიზელი გამითავდა бензин топливо закончился fuel gas petrol diesel benzin yakıt' },
]

export const GROUPS = [
  { id: 'handy', icon: '🔧', n: { ka: 'ხელოსანი', en: 'Handyman', ru: 'Мастер', de: 'Handwerker', tr: 'Usta', uk: 'Майстер', hy: 'Վարպետ', az: 'Usta', es: 'Manitas', fr: 'Artisan', ar: 'حرفي', zh: '师傅' } },
  { id: 'clean', icon: '🧽', n: { ka: 'დალაგება', en: 'Cleaning', ru: 'Уборка', de: 'Reinigung', tr: 'Temizlik', uk: 'Прибирання', hy: 'Մաքրում', az: 'Təmizlik', es: 'Limpieza', fr: 'Ménage', ar: 'تنظيف', zh: '保洁' } },
  { id: 'ride', icon: '🚗', n: { ka: 'გამაყოლე', en: 'Ride along', ru: 'Попутка', de: 'Mitfahren', tr: 'Yolculuk', uk: 'Попутка', hy: 'Ուղեկցում', az: 'Yol yoldaşı', es: 'Viaje compartido', fr: 'Covoiturage', ar: 'توصيلة', zh: '顺风车' } },
  { id: 'land', icon: '🌾', n: { ka: 'მიწის სამუშაო', en: 'Land & farm', ru: 'Земля и сад', de: 'Feld & Garten', tr: 'Tarla & bahçe', uk: 'Земля і сад', hy: 'Հող և այգի', az: 'Torpaq və bağ', es: 'Campo y jardín', fr: 'Champs & jardin', ar: 'أعمال الأرض', zh: '田地' } },
  { id: 'machine', icon: '🚜', n: { ka: 'ტექნიკა', en: 'Machinery', ru: 'Спецтехника', de: 'Maschinen', tr: 'İş makinesi', uk: 'Спецтехніка', hy: 'Տեխնիկա', az: 'Texnika', es: 'Maquinaria', fr: 'Engins', ar: 'آليات', zh: '机械' } },
  { id: 'move', icon: '🚚', n: { ka: 'გადაზიდვა', en: 'Moving', ru: 'Перевозка', de: 'Transport', tr: 'Nakliye', uk: 'Перевезення', hy: 'Փոխադրում', az: 'Daşıma', es: 'Mudanza', fr: 'Transport', ar: 'نقل', zh: '搬运' } },
  { id: 'road', icon: '🚘', n: { ka: 'ავტო', en: 'Car services', ru: 'Авто', de: 'Auto', tr: 'Oto', uk: 'Авто', hy: 'Ավտո', az: 'Avto', es: 'Coche', fr: 'Auto', ar: 'السيارات', zh: '汽车' } },
]
export const groupName = (g, lang) => { const x = GROUPS.find(y => y.id === g); return x ? (x.n[lang] || x.n.en) : g }

// typical job price (paid directly to the pro), GEL. u: '' per job, h hour, d day, m2, pc
export const TYPICAL = { plumber: [20, 60], electric: [20, 60], appliance: [30, 100], handyman: [30, 80], painter: [8, 15, 'm2'], tiler: [20, 35, 'm2'], carpenter: [40, 150], locksmith: [30, 80],
  cleaning: [60, 150], office: [80, 200], windows: [5, 10, 'pc'], harvest: [50, 70, 'd'], land: [60, 100, 'd'], garden: [50, 80, 'd'], firewood: [150, 220, 'm3'],
  movers: [20, 40, 'h'], cartruck: [50, 150], tractor: [60, 120, 'h'], excavator: [70, 120, 'h'], crane: [100, 200, 'h'],
  carwash: [15, 30], bodywork: [50, 300], mechanic: [30, 150], tow: [50, 150], tire: [10, 30], battery: [15, 30], fuel: [10, 20] }
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
    const count = c.g === 'land' ? 4 : 3
    for (let i = 0; i < count; i++) {
      let fn = FIRST[Math.floor(rnd() * FIRST.length)]
      if (['cleaning', 'windows'].includes(c.id) && rnd() < .6) fn = [...FEMALE][Math.floor(rnd() * 4)]
      if (!['cleaning', 'windows', 'harvest', 'garden'].includes(c.id) && FEMALE.has(fn)) fn = 'გიორგი'
      const type = c.g === 'land' ? (i === 0 ? 'company' : i === 1 ? 'brigade' : 'individual') : (i === 2 ? 'brigade' : 'individual')
      const r = 0.4 + rnd() * 5.5, a = rnd() * Math.PI * 2
      const pos = [center[0] + (r / 111) * Math.cos(a), center[1] + (r / (111 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(a)]
      const companyNames = { carwash: 'ShineWash', bodywork: 'BodyFix', mechanic: 'AutoMaster', office: 'CleanOffice', tractor: 'AgroTech', excavator: 'BuildMach', crane: 'LiftPro', cartruck: 'CargoGo', tow: 'Evakuatori 24', tire: 'TireHelp', battery: 'PowerStart', fuel: 'FuelGo', plumber: 'AquaFix', electric: 'Volt Service', appliance: 'TechnoMaster', handyman: 'HomeHelp', painter: 'ColorPro', tiler: 'TileArt', carpenter: 'WoodLine', locksmith: 'KeyPoint', cleaning: 'CleanHouse', windows: 'ClearView', harvest: 'კახური ვენახი', land: 'AgroTeam', garden: 'GreenCut', firewood: 'შეშა 24', movers: 'MoveIt' }
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
