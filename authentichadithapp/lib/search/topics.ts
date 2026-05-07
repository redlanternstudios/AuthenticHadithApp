// TruthSerum v2 - 35 Topic Synonym Engine for Islamic Search
export const TOPIC_SYNONYMS: Record<string, string[]> = {
  prayer: ['salah', 'salat', 'namaz', 'worship', 'praying', 'prayer time', 'tahajjud', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'qiyam'],
  fasting: ['sawm', 'siyam', 'ramadan', 'iftar', 'suhoor', 'sehri', 'fasts', 'breaking fast', 'voluntary fast'],
  charity: ['zakat', 'sadaqah', 'alms', 'giving', 'donation', 'spending', 'helping poor', 'wealth distribution'],
  washing: ['wudu', 'ablution', 'ghusl', 'tayammum', 'purification', 'cleansing', 'ritual bath', 'purity'],
  pilgrimage: ['hajj', 'umrah', 'mecca', 'kaaba', 'tawaf', 'safa', 'marwa', 'arafat', 'mina', 'muzdalifah'],
  marriage: ['nikah', 'wedding', 'spouse', 'husband', 'wife', 'marital', 'matrimony', 'dowry', 'mahr'],
  divorce: ['talaq', 'khula', 'separation', 'divorcing', 'divorced', 'marriage dissolution'],
  parents: ['mother', 'father', 'obedience', 'respect', 'honoring parents', 'kindness to parents', 'birr al walidayn'],
  patience: ['sabr', 'perseverance', 'steadfastness', 'endurance', 'forbearance', 'resilience'],
  forgiveness: ['maghfirah', 'pardon', 'mercy', 'overlooking', 'forgiving others', 'seeking forgiveness'],
  repentance: ['tawbah', 'taubah', 'turning back', 'seeking forgiveness', 'regret', 'remorse'],
  prophet: ['muhammad', 'messenger', 'rasul', 'nabi', 'prophet pbuh', 'sunnah', 'prophetic'],
  quran: ['holy quran', 'book of allah', 'recitation', 'revelation', 'scripture', 'kitab'],
  angels: ['malaikah', 'jibril', 'gabriel', 'angel', 'israfil', 'mikail'],
  death: ['maut', 'dying', 'afterlife', 'grave', 'barzakh', 'passing away', 'mortality'],
  judgment: ['qiyamah', 'day of judgment', 'resurrection', 'reckoning', 'yawm al qiyamah', 'last day'],
  paradise: ['jannah', 'heaven', 'gardens', 'eternal bliss', 'reward', 'hereafter'],
  hell: ['jahannam', 'hellfire', 'punishment', 'torment', 'gehenna', 'fire'],
  knowledge: ['ilm', 'learning', 'education', 'seeking knowledge', 'study', 'wisdom', 'understanding'],
  faith: ['iman', 'belief', 'believing', 'conviction', 'trust in allah', 'creed'],
  sincerity: ['ikhlas', 'sincerity', 'pure intention', 'truthfulness', 'honesty'],
  humility: ['tawadu', 'modesty', 'humble', 'meekness', 'lowliness'],
  arrogance: ['kibr', 'pride', 'haughtiness', 'vanity', 'conceit', 'boasting'],
  backbiting: ['gheebah', 'gossip', 'slander', 'talking behind back', 'speaking ill'],
  envy: ['hasad', 'jealousy', 'covetousness', 'envious'],
  greed: ['tamaa', 'avarice', 'stinginess', 'hoarding', 'miserliness'],
  anger: ['ghadab', 'rage', 'fury', 'wrath', 'temper', 'controlling anger'],
  kindness: ['ihsan', 'excellence', 'benevolence', 'compassion', 'gentleness'],
  justice: ['adl', 'fairness', 'equity', 'righteousness', 'being just'],
  oppression: ['zulm', 'injustice', 'tyranny', 'wrongdoing', 'transgression'],
  modesty: ['haya', 'shame', 'shyness', 'bashfulness', 'decency', 'chastity'],
  gratitude: ['shukr', 'thankfulness', 'appreciation', 'being grateful', 'thanking allah'],
  trust: ['tawakkul', 'reliance', 'dependence on allah', 'putting trust', 'faith in god'],
  hope: ['raja', 'optimism', 'expectation', 'hoping in allah', 'aspiration'],
  fear: ['khawf', 'awe', 'reverence', 'fearing allah', 'taqwa', 'god consciousness'],
}

export function expandSearchQuery(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const expandedTerms: Set<string> = new Set([query])

  // Check each topic and add synonyms if matched
  for (const [topic, synonyms] of Object.entries(TOPIC_SYNONYMS)) {
    if (lowerQuery.includes(topic) || synonyms.some(syn => lowerQuery.includes(syn.toLowerCase()))) {
      expandedTerms.add(topic)
      synonyms.forEach(syn => expandedTerms.add(syn))
    }
  }

  return Array.from(expandedTerms)
}

export function detectTopic(query: string): string | null {
  const lowerQuery = query.toLowerCase()

  for (const [topic, synonyms] of Object.entries(TOPIC_SYNONYMS)) {
    if (lowerQuery.includes(topic) || synonyms.some(syn => lowerQuery.includes(syn.toLowerCase()))) {
      return topic
    }
  }

  return null
}

/**
 * Returns up to 4 search terms: the original query, canonical topic (if found),
 * and two key synonyms. Keeps OR conditions manageable in Supabase queries.
 */
export function getSearchTerms(query: string): string[] {
  const terms: string[] = [query]
  const topic = detectTopic(query)
  if (topic) {
    if (topic.toLowerCase() !== query.toLowerCase()) terms.push(topic)
    const synonyms = TOPIC_SYNONYMS[topic] || []
    if (synonyms[0] && !terms.includes(synonyms[0])) terms.push(synonyms[0])
    if (synonyms[1] && !terms.includes(synonyms[1])) terms.push(synonyms[1])
  }
  return [...new Set(terms)]
}
