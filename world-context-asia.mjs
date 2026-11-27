const warringStates = 'https://www.cambridge.org/core/books/abs/cambridge-history-of-ancient-china/warring-states-political-history/1BCAF34A599BA322F3812203EB74F7D8';
const territorialStates = 'https://www.cambridge.org/core/books/abs/early-china/age-of-territorial-states-warring-states-politics-and-institutions-480221-bc/BE5E15C1F0B8AB9650D6AA6708925A62';

// Keys match the selected Cliopatria v0.2.2 features covering 401 BCE.
export const asiaPolities = {
  Qi: {
    name: 'Qi', group: 'east-asia', source: warringStates,
    note: 'State centered on Linzi in present-day Shandong. The Tian house held power within Qi by this period. Formal recognition of its ruler came later.',
  },
  Chu: {
    name: 'Chu', group: 'east-asia', source: warringStates,
    note: 'Large southern state based in the middle Yangtze region. The outline represents a broad early Warring States reconstruction.',
  },
  Yue: {
    name: 'Yue', group: 'east-asia',
    source: 'https://escholarship.org/content/qt3q06g51j/qt3q06g51j_noSplash_7ec7c53fbd5d81d46ace66dd7e7a1121.pdf',
    note: 'State rooted near Kuaiji in the lower Yangtze region. Yue had conquered neighboring Wu in the fifth century BCE, and the reach of its subsequent rule remains debated.',
  },
  Zhao: {
    name: 'Zhao', group: 'east-asia', source: territorialStates,
    note: 'One of three states that emerged from Jin. Its lords received Zhou recognition in 403 BCE, and its territorial reach continued to change.',
  },
  Song: {
    name: 'Song', group: 'east-asia', source: warringStates,
    note: 'A smaller state around Shangqiu on the Central Plains, still independent in the early Warring States period.',
  },
  Lu: {
    name: 'Lu', group: 'east-asia', source: warringStates,
    note: 'A smaller Zhou-period state around Qufu in present-day Shandong, associated with the life of Confucius.',
  },
  Wey: {
    name: 'Wey', group: 'east-asia', source: warringStates,
    note: 'The small state written 衛, around the Puyang area. The larger state of Wei is written 魏 and emerged from Jin.',
  },
};

export const asiaSites = [
  {
    id: 'qin-yong', name: 'Qin', group: 'east-asia', kind: 'polity', coords: [107.39, 34.52],
    source: 'https://wwj.baoji.gov.cn/col1896/col9958/202608/t20260826_1297017.html',
    note: 'Qin’s early political center at Yong, near modern Fengxiang in the western Wei River valley.',
  },
  {
    id: 'wei-anyi', name: 'Wei', group: 'east-asia', kind: 'polity', coords: [111.22, 35.14],
    source: 'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002254327',
    note: 'The early center of Wei in the Anyi area of southern Shanxi. Its court moved to Daliang later in the Warring States period.',
  },
  {
    id: 'han-central-plains', name: 'Han', group: 'east-asia', kind: 'polity', coords: [113.47, 34.16],
    source: territorialStates,
    note: 'A representative Central Plains point for Han (韓), one of the three states that emerged from Jin in the early Warring States period.',
  },
  {
    id: 'eastern-zhou-luoyang', name: 'Eastern Zhou', group: 'east-asia', kind: 'polity', coords: [112.42, 34.65],
    source: 'https://english.henan.gov.cn/2021/10-28/2337009.html',
    note: 'The Zhou royal center near Luoyang. Its kings retained ceremonial standing while territorial power increasingly lay with the regional states.',
  },
  {
    id: 'yan-ji', name: 'Yan', group: 'east-asia', kind: 'polity', coords: [116.35, 39.87],
    source: 'https://api.pageplace.de/preview/DT0400.9781134150335_A24934275/preview-9781134150335_A24934275.pdf',
    note: 'The vicinity of Ji, the northern state of Yan’s center in the area of present-day Beijing.',
  },
  {
    id: 'magadha-rajgir', name: 'Magadha', group: 'south-asia', kind: 'polity', coords: [85.42, 25.02],
    source: 'https://www.repository.cam.ac.uk/items/98ac155f-27d9-4b1d-b1d2-e231c4fcc05c',
    note: 'An early kingdom of the middle Ganges basin, marked at its old center of Rajgir. The chronology of its expansion and rulers remains debated.',
  },
  {
    id: 'pazyryk-altai', name: 'Pazyryk communities', group: 'east-asia', kind: 'community', coords: [88.04, 50.74],
    source: 'https://whc.unesco.org/en/tentativelists/6283/',
    note: 'Altai communities known archaeologically through burial mounds, textiles and objects associated with mobile pastoral life. The marker indicates the Pazyryk burial area.',
  },
  {
    id: 'mumun-communities', name: 'Mumun communities', group: 'east-asia', kind: 'community', coords: [126.94, 36.25],
    source: 'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002798954',
    note: 'Farming communities of the Korean Bronze Age, represented near the Songguk-ri archaeological site. The material culture takes its wider name from plain Mumun pottery.',
  },
  {
    id: 'yayoi-kyushu', name: 'Yayoi communities', group: 'east-asia', kind: 'community', coords: [130.46, 33.57],
    source: 'https://www.cambridge.org/core/services/aop-cambridge-core/content/view/B7D3C965B0155D8455AC73198547FFBC/S0033822223000504a.pdf/radiocarbon_dating_of_tree_rings_from_the_beginning_and_end_of_the_yayoi_period_japan.pdf',
    note: 'Early rice-farming communities, represented in northern Kyushu. The timing and spread of Yayoi lifeways varied across the Japanese archipelago.',
  },
  {
    id: 'dong-son', name: 'Đông Sơn communities', group: 'east-asia', kind: 'community', coords: [105.78, 19.82],
    source: 'https://baotanglichsu.vn/en/Articles/3188/16665/dong-son-culture-in-vietnam-90-years-of-discovery-and-study-part-1.html',
    note: 'Communities known for their bronze work along northern Vietnam’s river valleys, represented at the culture’s namesake archaeological site near Thanh Hóa.',
  },
];
