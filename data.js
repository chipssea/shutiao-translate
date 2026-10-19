/* ============================================================
   Gloss 词下 · 数据层
   WORDS     词条库（按词根小写索引，一词多义）
   PHRASES   短语 / 固定搭配
   SENTENCES 语料：逐词 token 带「本题义项」绑定
   CN2EN     中 → 英 多表达（带语域标签）
   ARTICLES  阅读素材
   ============================================================ */

const WORDS = {
  i: {
    lemma: 'I', pos: 'pron.', phon: '/aɪ/',
    senses: [{ id: 'i-1', p: 'pron.', zh: '我', en: 'I', freq: 3, ex: ['I am ready.', '我准备好了。'] }]
  },

  pick: {
    lemma: 'pick', pos: 'v.', phon: '/pɪk/',
    syn: ['choose', 'select', 'gather', 'lift'], 
    colloc: ['pick up the phone', 'pick a fight', 'the pick of the bunch', 'pick and choose'],
    timeline: [
      { era: '12 世纪', sense: '用尖物刺、啄（本义）' },
      { era: '15 世纪', sense: '用手指摘取、剔下' },
      { era: '17 世纪', sense: '在众多中挑选 → 现代主义' },
      { era: '19 世纪', sense: 'pick up：捡起 → 接人 → 学会' },
      { era: '当代', sense: '口语高频：接人、学到、收拾' }
    ],
    senses: [
      { id: 'pick-1', p: 'v.', zh: '拿起；拾起', en: 'lift up', freq: 3, ex: ['She picked the pen up off the floor.', '她把笔从地上拾了起来。'] },
      { id: 'pick-2', p: 'v.', zh: '挑选；选择', en: 'choose', freq: 3, ex: ['Pick the one you like best.', '挑一个你最喜欢的。'] },
      { id: 'pick-3', p: 'v.', zh: '（开车）接人', en: 'collect sb.', freq: 2, ex: ['I’ll pick you up at six.', '我六点来接你。'] },
      { id: 'pick-4', p: 'v.', zh: '采摘', en: 'harvest', freq: 2, ex: ['We pick apples in autumn.', '我们在秋天摘苹果。'] },
      { id: 'pick-5', p: 'v.', zh: '（指尖）抠、剔', en: 'pick at', freq: 1, ex: ['Don’t pick your nose.', '别抠鼻子。'] }
    ]
  },

  up: {
    lemma: 'up', pos: 'adv. / prep.', phon: '/ʌp/',
    senses: [
      { id: 'up-1', p: 'adv.', zh: '向上；起来', en: 'upward', freq: 3, ex: ['Look up at the sky.', '抬头看天空。'] },
      { id: 'up-2', p: 'adv.', zh: '（与动词连用）完成、彻底', en: 'completely', freq: 3, ex: ['Eat up your dinner.', '把晚饭吃光。'] }
    ]
  },

  a: {
    lemma: 'a / an', pos: 'art.', phon: '/ə/',
    senses: [{ id: 'a-1', p: 'art.', zh: '一个', en: 'a', freq: 3, ex: ['A dog is barking.', '一只狗在叫。'] }]
  },

  the: {
    lemma: 'the', pos: 'art.', phon: '/ðə/',
    senses: [{ id: 'the-1', p: 'art.', zh: '特指', en: 'the', freq: 3, ex: ['The book on the desk is mine.', '桌上那本书是我的。'] }]
  },

  book: {
    lemma: 'book', pos: 'n. / v.', phon: '/bʊk/',
    syn: ['reserve', 'volume', 'register'],
    colloc: ['book a table', 'book a ticket', 'by the book'],
    timeline: [
      { era: '古英语', sense: 'bōc：山毛榉木片（用于刻字）' },
      { era: '中世纪', sense: '装订成册的书' },
      { era: '16 世纪', sense: '账簿、名册 → 登记' },
      { era: '19 世纪', sense: '预订（把名字写进册子）' }
    ],
    senses: [
      { id: 'book-1', p: 'n.', zh: '书；书籍', en: 'book', freq: 3, ex: ['I read a book every week.', '我每周读一本书。'] },
      { id: 'book-2', p: 'v.', zh: '预订；预约', en: 'reserve', freq: 3, ex: ['Book a table for two.', '订一张两人桌。'] },
      { id: 'book-3', p: 'n.', zh: '账簿；名册', en: 'ledger', freq: 1, ex: ['The numbers are in the books.', '数字都记在账上。'] },
      { id: 'book-4', p: 'v.', zh: '（警察）登记备案', en: 'be booked', freq: 1, ex: ['He was booked for speeding.', '他因超速被登记处罚。'] }
    ]
  },

  at: {
    lemma: 'at', pos: 'prep.', phon: '/æt/',
    senses: [
      { id: 'at-1', p: 'prep.', zh: '在；于', en: 'at', freq: 3, ex: ['Meet me at the door.', '在门口等我。'] },
      { id: 'at-2', p: 'prep.', zh: '以（速度 / 价格）', en: 'at a rate', freq: 2, ex: ['He drove at 90 miles an hour.', '他以每小时 90 英里的速度开车。'] }
    ]
  },

  station: {
    lemma: 'station', pos: 'n.', phon: '/ˈsteɪʃn/',
    syn: ['stop', 'terminal', 'depot'],
    colloc: ['train station', 'police station', 'radio station'],
    senses: [
      { id: 'station-1', p: 'n.', zh: '车站', en: 'station', freq: 3, ex: ['The train left the station.', '火车驶离了车站。'] },
      { id: 'station-2', p: 'n.', zh: '岗位；驻地', en: 'post', freq: 2, ex: ['The guard returned to his station.', '卫兵回到了岗位。'] },
      { id: 'station-3', p: 'n.', zh: '广播电台', en: 'broadcasting station', freq: 1, ex: ['A local radio station.', '一家本地广播电台。'] }
    ]
  },

  hotel: {
    lemma: 'hotel', pos: 'n.', phon: '/həʊˈtel/',
    senses: [{ id: 'hotel-1', p: 'n.', zh: '旅馆；酒店', en: 'hotel', freq: 3, ex: ['We stayed at a small hotel.', '我们住在一家小旅馆。'] }]
  },

  charge: {
    lemma: 'charge', pos: 'v. / n.', phon: '/tʃɑːdʒ/',
    syn: ['bill', 'accuse', 'recharge', 'rush'],
    colloc: ['in charge of', 'free of charge', 'charge sb. with sth.'],
    timeline: [
      { era: '13 世纪', sense: '古法语 chargier：装载、使负载' },
      { era: '14 世纪', sense: '委托、托付 → 责任' },
      { era: '15 世纪', sense: '要价、收费（让人背负）' },
      { era: '17 世纪', sense: '指控；冲锋（骑兵冲击）' },
      { era: '19 世纪', sense: '充电（负载电量）' }
    ],
    senses: [
      { id: 'charge-1', p: 'v.', zh: '收费；索价', en: 'ask a price', freq: 3, ex: ['They charge ten dollars a night.', '他们每晚收费十美元。'] },
      { id: 'charge-2', p: 'v.', zh: '指控；控告', en: 'accuse', freq: 3, ex: ['He was charged with theft.', '他被控盗窃。'] },
      { id: 'charge-3', p: 'v.', zh: '充电', en: 'recharge', freq: 3, ex: ['Charge your phone before you go.', '出门前把手机充好电。'] },
      { id: 'charge-4', p: 'v.', zh: '负责；掌管', en: 'be in charge of', freq: 3, ex: ['She is in charge of the team.', '她负责这个团队。'] },
      { id: 'charge-5', p: 'v.', zh: '冲锋；猛冲', en: 'rush', freq: 1, ex: ['The kids charged out of the gate.', '孩子们冲出大门。'] }
    ]
  },

  thirty: {
    lemma: 'thirty', pos: 'num.', phon: '/ˈθɜːti/',
    senses: [{ id: 'thirty-1', p: 'num.', zh: '三十', en: 'thirty', freq: 3, ex: ['Thirty students came.', '三十名学生来了。'] }]
  },

  dollar: {
    lemma: 'dollar', pos: 'n.', phon: '/ˈdɒlə/',
    senses: [{ id: 'dollar-1', p: 'n.', zh: '美元；元', en: 'dollar', freq: 3, ex: ['It costs five dollars.', '这个五美元。'] }]
  },

  for: {
    lemma: 'for', pos: 'prep.', phon: '/fɔː/',
    senses: [
      { id: 'for-1', p: 'prep.', zh: '为了；给', en: 'for', freq: 3, ex: ['This gift is for you.', '这个礼物给你。'] },
      { id: 'for-2', p: 'prep.', zh: '（时间 / 距离）达、计', en: 'lasting', freq: 3, ex: ['I waited for two hours.', '我等了两个小时。'] }
    ]
  },

  breakfast: {
    lemma: 'breakfast', pos: 'n.', phon: '/ˈbrekfəst/',
    senses: [{ id: 'breakfast-1', p: 'n.', zh: '早餐', en: 'breakfast', freq: 3, ex: ['Breakfast is at seven.', '早餐七点开始。'] }]
  },

  she: {
    lemma: 'she', pos: 'pron.', phon: '/ʃiː/',
    senses: [{ id: 'she-1', p: 'pron.', zh: '她', en: 'she', freq: 3, ex: ['She called you.', '她给你打过电话。'] }]
  },

  run: {
    lemma: 'run', pos: 'v. / n.', phon: '/rʌn/',
    syn: ['operate', 'manage', 'sprint', 'flow'],
    colloc: ['run a business', 'in the long run', 'run out of', 'run for office'],
    timeline: [
      { era: '古英语', sense: 'rinnan：流动、奔流' },
      { era: '中世纪', sense: '人、动物快速地跑' },
      { era: '16 世纪', sense: '（机器）运转' },
      { era: '18 世纪', sense: '经营、管理（使持续运转）' },
      { era: '当代', sense: '最常见：run a company / run late' }
    ],
    senses: [
      { id: 'run-1', p: 'v.', zh: '经营；管理', en: 'run / manage', freq: 3, ex: ['He runs a bookshop.', '他经营一家书店。'] },
      { id: 'run-2', p: 'v.', zh: '跑；奔跑', en: 'sprint', freq: 3, ex: ['I run every morning.', '我每天早上跑步。'] },
      { id: 'run-3', p: 'v.', zh: '（机器 / 系统）运转', en: 'operate', freq: 2, ex: ['The engine runs smoothly.', '发动机运转顺畅。'] },
      { id: 'run-4', p: 'v.', zh: '（液体）流淌', en: 'flow', freq: 2, ex: ['Tears ran down her face.', '泪水从她脸上流下。'] },
      { id: 'run-5', p: 'v.', zh: '持续；延续', en: 'last', freq: 2, ex: ['The play ran for a year.', '这部剧连演了一年。'] }
    ]
  },

  small: {
    lemma: 'small', pos: 'adj.', phon: '/smɔːl/',
    senses: [
      { id: 'small-1', p: 'adj.', zh: '小的', en: 'little', freq: 3, ex: ['A small room.', '一个小房间。'] },
      { id: 'small-2', p: 'adj.', zh: '轻微的；琐碎的', en: 'minor', freq: 2, ex: ['A small mistake.', '一个小错误。'] }
    ]
  },

  'café': {
    lemma: 'café', pos: 'n.', phon: '/ˈkæfeɪ/',
    senses: [{ id: 'cafe-1', p: 'n.', zh: '咖啡馆', en: 'café', freq: 2, ex: ['A quiet café on the corner.', '街角一家安静的咖啡馆。'] }]
  },

  by: {
    lemma: 'by', pos: 'prep.', phon: '/baɪ/',
    senses: [
      { id: 'by-1', p: 'prep.', zh: '在…旁边', en: 'beside', freq: 3, ex: ['Sit by the window.', '坐在窗边。'] },
      { id: 'by-2', p: 'prep.', zh: '通过；靠（手段）', en: 'by means of', freq: 3, ex: ['I go to work by bus.', '我坐公交上班。'] },
      { id: 'by-3', p: 'prep.', zh: '被（被动语态）', en: 'by (passive)', freq: 3, ex: ['Written by a student.', '由一名学生所写。'] }
    ]
  },

  river: {
    lemma: 'river', pos: 'n.', phon: '/ˈrɪvə/',
    senses: [{ id: 'river-1', p: 'n.', zh: '河；江', en: 'river', freq: 3, ex: ['A bridge over the river.', '河上的一座桥。'] }]
  },

  it: {
    lemma: 'it', pos: 'pron.', phon: '/ɪt/',
    senses: [{ id: 'it-1', p: 'pron.', zh: '它', en: 'it', freq: 3, ex: ['It looks new.', '它看起来是新的。'] }]
  },

  be: {
    lemma: 'be', pos: 'v.', phon: '/biː/',
    senses: [
      { id: 'be-1', p: 'v.', zh: '是', en: 'be', freq: 3, ex: ['She is a teacher.', '她是老师。'] },
      { id: 'be-2', p: 'v.', zh: '存在；在', en: 'exist', freq: 3, ex: ['There is a café nearby.', '附近有一家咖啡馆。'] }
    ]
  },

  fair: {
    lemma: 'fair', pos: 'adj. / n.', phon: '/feə/',
    syn: ['just', 'reasonable', 'blond', 'exhibition'],
    colloc: ['fair enough', 'fair play', 'trade fair'],
    timeline: [
      { era: '古英语', sense: 'fæger：美丽的、悦目的' },
      { era: '13 世纪', sense: '（天气）晴好的' },
      { era: '14 世纪', sense: '肤色白皙的、金发的' },
      { era: '15 世纪', sense: '公正的（看起来"该是这样"）' },
      { era: '17 世纪', sense: '集市、博览会（另一词源）' }
    ],
    senses: [
      { id: 'fair-1', p: 'adj.', zh: '公平的；公道的', en: 'just', freq: 3, ex: ['That’s a fair question.', '这是个公道的问题。'] },
      { id: 'fair-2', p: 'adj.', zh: '相当的；不错的', en: 'fairly good', freq: 3, ex: ['She has a fair chance of winning.', '她有相当大的胜算。'] },
      { id: 'fair-3', p: 'n.', zh: '集市；博览会', en: 'exhibition', freq: 2, ex: ['The book fair opens on Monday.', '书展周一开幕。'] },
      { id: 'fair-4', p: 'adj.', zh: '（肤色）白皙的', en: 'light', freq: 1, ex: ['fair skin and blue eyes', '白皙的皮肤和蓝眼睛'] },
      { id: 'fair-5', p: 'adj.', zh: '（天气）晴好的', en: 'clear', freq: 1, ex: ['Fair weather is expected.', '预计天气晴好。'] }
    ]
  },

  question: {
    lemma: 'question', pos: 'n. / v.', phon: '/ˈkwestʃən/',
    senses: [
      { id: 'question-1', p: 'n.', zh: '问题；疑问', en: 'question', freq: 3, ex: ['May I ask a question?', '我可以问个问题吗？'] },
      { id: 'question-2', p: 'v.', zh: '质疑；怀疑', en: 'doubt', freq: 2, ex: ['Nobody questioned his honesty.', '没人质疑他的诚实。'] }
    ]
  },

  but: {
    lemma: 'but', pos: 'conj.', phon: '/bʌt/',
    senses: [
      { id: 'but-1', p: 'conj.', zh: '但是', en: 'but', freq: 3, ex: ['It is small but strong.', '它小但结实。'] },
      { id: 'but-2', p: 'prep.', zh: '除了', en: 'except', freq: 2, ex: ['Everyone but Tom came.', '除了汤姆，大家都来了。'] }
    ]
  },

  answer: {
    lemma: 'answer', pos: 'n. / v.', phon: '/ˈɑːnsə/',
    senses: [
      { id: 'answer-1', p: 'n.', zh: '答案；回答', en: 'answer', freq: 3, ex: ['Your answer is right.', '你的答案是对的。'] },
      { id: 'answer-2', p: 'v.', zh: '回应；接（电话）', en: 'respond', freq: 2, ex: ['Nobody answered the door.', '没人来应门。'] }
    ]
  },

  not: {
    lemma: 'not', pos: 'adv.', phon: '/nɒt/',
    senses: [{ id: 'not-1', p: 'adv.', zh: '不；没有', en: 'not', freq: 3, ex: ['I am not sure.', '我不确定。'] }]
  },

  simple: {
    lemma: 'simple', pos: 'adj.', phon: '/ˈsɪmpl/',
    senses: [
      { id: 'simple-1', p: 'adj.', zh: '简单的；容易的', en: 'easy', freq: 3, ex: ['It is a simple rule.', '这是一条简单的规则。'] },
      { id: 'simple-2', p: 'adj.', zh: '朴素的；简朴的', en: 'plain', freq: 2, ex: ['A simple meal.', '一顿简朴的饭菜。'] }
    ]
  },

  let: {
    lemma: 'let', pos: 'v.', phon: '/let/',
    senses: [
      { id: 'let-1', p: 'v.', zh: '让；允许', en: 'allow', freq: 3, ex: ['Let me help you.', '让我帮你。'] },
      { id: 'let-2', p: 'v.', zh: '出租', en: 'rent out', freq: 1, ex: ['The flat is to let.', '这套公寓出租。'] }
    ]
  },

  me: {
    lemma: 'me', pos: 'pron.', phon: '/miː/',
    senses: [{ id: 'me-1', p: 'pron.', zh: '我（宾格）', en: 'me', freq: 3, ex: ['Give it to me.', '把它给我。'] }]
  },

  table: {
    lemma: 'table', pos: 'n.', phon: '/ˈteɪbl/',
    senses: [
      { id: 'table-1', p: 'n.', zh: '桌子', en: 'table', freq: 3, ex: ['Sit at the table.', '坐到桌边。'] },
      { id: 'table-2', p: 'n.', zh: '表格', en: 'chart', freq: 2, ex: ['See the table below.', '见下表。'] }
    ]
  },

  two: {
    lemma: 'two', pos: 'num.', phon: '/tuː/',
    senses: [{ id: 'two-1', p: 'num.', zh: '二；两个', en: 'two', freq: 3, ex: ['Two coffees, please.', '请来两杯咖啡。'] }]
  },

  he: {
    lemma: 'he', pos: 'pron.', phon: '/hiː/',
    senses: [{ id: 'he-1', p: 'pron.', zh: '他', en: 'he', freq: 3, ex: ['He is waiting.', '他在等。'] }]
  },

  present: {
    lemma: 'present', pos: 'adj. / n. / v.', phon: '/ˈpreznt/',
    syn: ['gift', 'current', 'attend', 'show'],
    colloc: ['be present at', 'at present', 'present a plan'],
    timeline: [
      { era: '13 世纪', sense: '拉丁 praesens：在眼前的' },
      { era: '14 世纪', sense: '在场的、出席的' },
      { era: '15 世纪', sense: '现在（时间上的"眼前"）' },
      { era: '15 世纪', sense: '呈献 → 礼物（呈上之物）' },
      { era: '17 世纪', sense: '陈述、展示（动词，重音后移）' }
    ],
    senses: [
      { id: 'present-1', p: 'adj.', zh: '出席的；在场的', en: 'attending', freq: 2, ex: ['He was present at the meeting.', '他出席了会议。'] },
      { id: 'present-2', p: 'n.', zh: '礼物', en: 'gift', freq: 3, ex: ['A birthday present.', '一份生日礼物。'] },
      { id: 'present-3', p: 'adj.', zh: '现在的；当前的', en: 'current', freq: 3, ex: ['At the present time.', '在目前。'] },
      { id: 'present-4', p: 'v.', zh: '呈现；提交（/prɪˈzent/）', en: 'show / submit', freq: 3, ex: ['She presented her plan.', '她提交了她的方案。'] },
      { id: 'present-5', p: 'n.', zh: '主持人', en: 'host', freq: 1, ex: ['The TV present.', '电视节目主持人。'] }
    ]
  },

  every: {
    lemma: 'every', pos: 'det.', phon: '/ˈevri/',
    senses: [{ id: 'every-1', p: 'det.', zh: '每一个', en: 'every', freq: 3, ex: ['Every seat was taken.', '每个座位都有人。'] }]
  },

  meeting: {
    lemma: 'meeting', pos: 'n.', phon: '/ˈmiːtɪŋ/',
    senses: [
      { id: 'meeting-1', p: 'n.', zh: '会议', en: 'meeting', freq: 3, ex: ['The meeting starts at nine.', '会议九点开始。'] },
      { id: 'meeting-2', p: 'n.', zh: '（偶然的）相遇', en: 'encounter', freq: 1, ex: ['A chance meeting in Paris.', '在巴黎的一次偶遇。'] }
    ]
  },

  never: {
    lemma: 'never', pos: 'adv.', phon: '/ˈnevə/',
    senses: [{ id: 'never-1', p: 'adv.', zh: '从不；永不', en: 'never', freq: 3, ex: ['He never complains.', '他从不抱怨。'] }]
  },

  say: {
    lemma: 'say', pos: 'v.', phon: '/seɪ/',
    senses: [
      { id: 'say-1', p: 'v.', zh: '说；讲', en: 'say', freq: 3, ex: ['Say it again, please.', '请再说一遍。'] },
      { id: 'say-2', p: 'v.', zh: '（书 / 牌子）写着', en: 'read', freq: 2, ex: ['The sign says "closed".', '牌子上写着"关闭"。'] }
    ]
  },

  word: {
    lemma: 'word', pos: 'n.', phon: '/wɜːd/',
    senses: [
      { id: 'word-1', p: 'n.', zh: '话；一句话', en: 'word', freq: 3, ex: ['He said a few words.', '他说了几句话。'] },
      { id: 'word-2', p: 'n.', zh: '单词', en: 'vocabulary item', freq: 3, ex: ['Learn ten words a day.', '每天学十个单词。'] },
      { id: 'word-3', p: 'n.', zh: '消息；音信', en: 'news', freq: 1, ex: ['Send me word when you arrive.', '到了给我个信。'] }
    ]
  }
};

/* ------------------------------------------------------------ */
const PHRASES = {
  'pick up': {
    id: 'ph-pickup', pos: 'phr. v. /pɪk ʌp/',
    note: '可分短语动词：宾语是代词时，代词必须放在中间 → pick it up（√）/ pick up it（×）。up 在这里表示"完成、到手"。',
    senses: [
      { zh: '拿起；捡起', ex: ['Pick up the bag.', '把包拿起来。'] },
      { zh: '（开车）接人', ex: ['I’ll pick you up at six.', '我六点来接你。'] },
      { zh: '（偶然）学会、听到', ex: ['She picked up Spanish in a year.', '她一年就学会了西班牙语。'] },
      { zh: '收拾（房间）', ex: ['Pick up your room.', '收拾一下你的房间。'] }
    ]
  },
  'be present at': {
    id: 'ph-present-at', pos: 'phr. ',
    note: '正式用语，多用于会议、仪式、课堂等场合；口语更常说 be at / show up for。',
    senses: [
      { zh: '出席；在场', ex: ['All members were present at the vote.', '全体成员都出席了表决。'] }
    ]
  },
  'run a business': {
    id: 'ph-run-business', pos: 'phr. ',
    note: 'run 表"经营"时，主语通常是经营者本人，后面直接跟经营对象。',
    senses: [
      { zh: '经营一家企业', ex: ['She runs a small shop.', '她经营一家小店。'] }
    ]
  }
};

/* ------------------------------------------------------------ */
const SENTENCES = [
  {
    id: 's1',
    zh: '我在车站拿起了一本书。',
    level: 'A2',
    tokens: [
      { t: 'I', k: 'i', s: 'i-1' },
      { t: 'picked', k: 'pick', s: 'pick-1', ph: 'pick up' },
      { t: 'up', k: 'up', s: 'up-1', ph: 'pick up' },
      { t: 'a', k: 'a', s: 'a-1' },
      { t: 'book', k: 'book', s: 'book-1' },
      { t: 'at', k: 'at', s: 'at-1' },
      { t: 'the', k: 'the', s: 'the-1' },
      { t: 'station.', k: 'station', s: 'station-1' }
    ],
    chunks: [
      { from: 0, to: 0, zh: '我' },
      { from: 1, to: 2, zh: '拿起了' },
      { from: 3, to: 4, zh: '一本书' },
      { from: 5, to: 7, zh: '在车站' }
    ]
  },
  {
    id: 's2',
    zh: '这家酒店的早餐收费三十美元。',
    level: 'B1',
    tokens: [
      { t: 'The', k: 'the', s: 'the-1' },
      { t: 'hotel', k: 'hotel', s: 'hotel-1' },
      { t: 'charges', k: 'charge', s: 'charge-1' },
      { t: 'thirty', k: 'thirty', s: 'thirty-1' },
      { t: 'dollars', k: 'dollar', s: 'dollar-1' },
      { t: 'for', k: 'for', s: 'for-1' },
      { t: 'breakfast.', k: 'breakfast', s: 'breakfast-1' }
    ],
    chunks: [
      { from: 0, to: 1, zh: '这家酒店' },
      { from: 2, to: 2, zh: '收取' },
      { from: 3, to: 4, zh: '三十美元' },
      { from: 5, to: 6, zh: '作为早餐费' }
    ]
  },
  {
    id: 's3',
    zh: '她在河边经营着一家小咖啡馆。',
    level: 'B1',
    tokens: [
      { t: 'She', k: 'she', s: 'she-1' },
      { t: 'runs', k: 'run', s: 'run-1' },
      { t: 'a', k: 'a', s: 'a-1' },
      { t: 'small', k: 'small', s: 'small-1' },
      { t: 'café', k: 'café', s: 'cafe-1' },
      { t: 'by', k: 'by', s: 'by-1' },
      { t: 'the', k: 'the', s: 'the-1' },
      { t: 'river.', k: 'river', s: 'river-1' }
    ],
    chunks: [
      { from: 0, to: 0, zh: '她' },
      { from: 1, to: 1, zh: '经营着' },
      { from: 2, to: 4, zh: '一家小咖啡馆' },
      { from: 5, to: 7, zh: '在河边' }
    ]
  },
  {
    id: 's4',
    zh: '这是个公道的问题，但答案并不简单。',
    level: 'B2',
    tokens: [
      { t: 'It', k: 'it', s: 'it-1' },
      { t: 'is', k: 'be', s: 'be-1' },
      { t: 'a', k: 'a', s: 'a-1' },
      { t: 'fair', k: 'fair', s: 'fair-1' },
      { t: 'question,', k: 'question', s: 'question-1' },
      { t: 'but', k: 'but', s: 'but-1' },
      { t: 'the', k: 'the', s: 'the-1' },
      { t: 'answer', k: 'answer', s: 'answer-1' },
      { t: 'is', k: 'be', s: 'be-1' },
      { t: 'not', k: 'not', s: 'not-1' },
      { t: 'simple.', k: 'simple', s: 'simple-1' }
    ],
    chunks: [
      { from: 0, to: 1, zh: '这确实是' },
      { from: 2, to: 4, zh: '一个公道的问题，' },
      { from: 5, to: 7, zh: '但答案' },
      { from: 8, to: 10, zh: '并不简单' }
    ]
  },
  {
    id: 's5',
    zh: '让我订一张两人桌。',
    level: 'A2',
    tokens: [
      { t: 'Let', k: 'let', s: 'let-1' },
      { t: 'me', k: 'me', s: 'me-1' },
      { t: 'book', k: 'book', s: 'book-2' },
      { t: 'a', k: 'a', s: 'a-1' },
      { t: 'table', k: 'table', s: 'table-1' },
      { t: 'for', k: 'for', s: 'for-1' },
      { t: 'two.', k: 'two', s: 'two-1' }
    ],
    chunks: [
      { from: 0, to: 1, zh: '让我' },
      { from: 2, to: 4, zh: '订一张桌子' },
      { from: 5, to: 6, zh: '两个人的' }
    ]
  },
  {
    id: 's6',
    zh: '他每次都出席会议，却从不发言。',
    level: 'B2',
    tokens: [
      { t: 'He', k: 'he', s: 'he-1' },
      { t: 'was', k: 'be', s: 'be-1' },
      { t: 'present', k: 'present', s: 'present-1' },
      { t: 'at', k: 'at', s: 'at-1' },
      { t: 'every', k: 'every', s: 'every-1' },
      { t: 'meeting,', k: 'meeting', s: 'meeting-1' },
      { t: 'but', k: 'but', s: 'but-1' },
      { t: 'never', k: 'never', s: 'never-1' },
      { t: 'said', k: 'say', s: 'say-1' },
      { t: 'a', k: 'a', s: 'a-1' },
      { t: 'word.', k: 'word', s: 'word-1' }
    ],
    chunks: [
      { from: 0, to: 1, zh: '他' },
      { from: 2, to: 2, zh: '都出席' },
      { from: 3, to: 5, zh: '每一次会议，' },
      { from: 6, to: 7, zh: '但从不' },
      { from: 8, to: 10, zh: '说一句话' }
    ]
  }
];

/* ------------------------------------------------------------ */
const CN2EN = [
  {
    zh: '车站', pinyin: 'chē zhàn',
    items: [
      { en: 'station', tag: '通用', note: '火车 / 地铁站，最常用的说法。', ex: ['We met at the station.', '我们在车站见的面。'] },
      { en: 'stop', tag: '口语', note: '公交车站；美式口语也可指任何站点。', ex: ['Get off at the next stop.', '下一站下车。'] },
      { en: 'terminal', tag: '书面', note: '机场 / 大型客运的终点站、航站楼。', ex: ['Terminal 2 is on the left.', '2 号航站楼在左边。'] }
    ]
  },
  {
    zh: '拿起', pinyin: 'ná qǐ',
    items: [
      { en: 'pick up', tag: '口语', note: '最自然，可用于物、人、语言。', ex: ['He picked up the phone.', '他拿起了电话。'] },
      { en: 'lift', tag: '书面', note: '强调"抬起"的重力感，多用于重物。', ex: ['Lift the box with both hands.', '用双手抬起箱子。'] },
      { en: 'grab', tag: '俚语', note: '一把抓过，带匆忙感。', ex: ['Grab your coat and go.', '抓起外套就走。'] }
    ]
  },
  {
    zh: '挑选', pinyin: 'tiāo xuǎn',
    items: [
      { en: 'pick', tag: '口语', note: '最日常，语气轻。', ex: ['Pick one, any one.', '挑一个，随便哪个。'] },
      { en: 'choose', tag: '通用', note: '中性、正式度适中，书面口语皆可。', ex: ['You may choose either.', '两个里你可以任选。'] },
      { en: 'select', tag: '书面', note: '带筛选标准的正式选择。', ex: ['Three were selected from 200.', '200 人中选出了 3 位。'] }
    ]
  },
  {
    zh: '忍受', pinyin: 'rěn shòu',
    items: [
      { en: 'stand', tag: '口语', note: '否定句最常用：can’t stand。', ex: ['I can’t stand the noise.', '我受不了这噪音。'] },
      { en: 'bear', tag: '书面', note: '承受痛苦、重压，较文雅。', ex: ['She bore the pain quietly.', '她默默承受着痛苦。'] },
      { en: 'put up with', tag: '口语', note: '长期忍受某人或某种状况。', ex: ['I won’t put up with it.', '我不会忍受这个。'] }
    ]
  },
  {
    zh: '预订', pinyin: 'yù dìng',
    items: [
      { en: 'book', tag: '通用', note: '英式口语最常用，餐厅、票、房间都行。', ex: ['Book a table for two.', '订一张两人桌。'] },
      { en: 'reserve', tag: '书面', note: '更正式，常见于酒店、正式场合。', ex: ['A table has been reserved.', '已为您预留了座位。'] },
      { en: 'make a reservation', tag: '通用', note: '名词形式，服务场景高频。', ex: ['I’d like to make a reservation.', '我想预订。'] }
    ]
  },
  {
    zh: '礼物', pinyin: 'lǐ wù',
    items: [
      { en: 'present', tag: '通用', note: '偏正式的"赠礼"，常指仪式性礼物。', ex: ['A wedding present.', '一份结婚礼物。'] },
      { en: 'gift', tag: '通用', note: '最宽的词，可指天赋（a gift for music）。', ex: ['A small gift for you.', '给你的一份小礼物。'] }
    ]
  },
  {
    zh: '充电', pinyin: 'chōng diàn',
    items: [
      { en: 'charge', tag: '通用', note: '给设备充电；也可指"收费"，注意语境。', ex: ['Charge your phone.', '给手机充电。'] },
      { en: 'recharge', tag: '通用', note: '强调"重新充满"；也可指人休整。', ex: ['I need to recharge.', '我需要充个电（休整）。'] }
    ]
  },
  {
    zh: '经营', pinyin: 'jīng yíng',
    items: [
      { en: 'run', tag: '口语', note: '口语最常说 run a shop / a company。', ex: ['She runs a café.', '她经营一家咖啡馆。'] },
      { en: 'operate', tag: '书面', note: '偏商业/技术语境。', ex: ['They operate three factories.', '他们经营三家工厂。'] },
      { en: 'manage', tag: '通用', note: '强调管理与统筹。', ex: ['He manages the store.', '他管理这家店。'] }
    ]
  }
];

/* ------------------------------------------------------------ */
const ARTICLES = [
  {
    id: 'a1', title: '清晨的车站', en: 'Morning at the Station', level: 'A2',
    desc: '两个高频场景句，讲清 pick up 与 book 的两种用法。',
    ids: ['s1', 's5']
  },
  {
    id: 'a2', title: '河边的小店', en: 'A Small Place by the River', level: 'B1',
    desc: 'run 与 present 的多义对比，B1 阅读起步。',
    ids: ['s3', 's6']
  },
  {
    id: 'a3', title: '一次并不简单的提问', en: 'A Fair Question', level: 'B2',
    desc: 'fair / charge 的抽象义，即将上线。',
    ids: [], soon: true
  }
];

const VOICE_SAMPLES = ['station', '车站', 'pick up', '忍受'];
