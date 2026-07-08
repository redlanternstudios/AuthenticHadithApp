import { getCanonicalBookTitle } from '@/lib/hadith/bookTitles'

describe('canonical Sahihayn book titles', () => {
  it('labels Bukhari book zero as Introduction', () => {
    expect(getCanonicalBookTitle('sahih-bukhari', 0, null)).toBe('Introduction')
  })

  it('labels early Bukhari books with recognizable names', () => {
    expect(getCanonicalBookTitle('sahih-bukhari', 1, null)).toBe('Revelation')
    expect(getCanonicalBookTitle('sahih-bukhari', 3, null)).toBe('Knowledge')
    expect(getCanonicalBookTitle('sahih-bukhari', 10, null)).toBe('Call to Prayer')
  })

  it('labels Muslim books with recognizable names', () => {
    expect(getCanonicalBookTitle('sahih-muslim', 0, null)).toBe('Introduction')
    expect(getCanonicalBookTitle('sahih-muslim', 1, null)).toBe('Faith')
    expect(getCanonicalBookTitle('sahih-muslim', 47, null)).toBe('Knowledge')
  })

  it('does not trust numeric database placeholders', () => {
    expect(getCanonicalBookTitle('sahih-bukhari', 4, 'Book 4')).toBe('Ablutions')
  })

  it('keeps meaningful database titles when present', () => {
    expect(getCanonicalBookTitle('sahih-bukhari', 4, 'Ablutions (Wudu)')).toBe('Ablutions (Wudu)')
  })
})

describe('topic screen visibility logic', () => {
  const topicIndexSource = require('fs').readFileSync('app/topics/index.tsx', 'utf8')
  const topicDetailSource = require('fs').readFileSync('app/topics/[slug].tsx', 'utf8')
  const collectionSource = require('fs').readFileSync('app/collection/[slug].tsx', 'utf8')

  it('counts topic hadiths after applying the visible collection allow list', () => {
    expect(topicIndexSource).toContain('VISIBLE_COLLECTION_SLUGS')
    expect(topicIndexSource).toContain(".in('collection_slug', VISIBLE_COLLECTION_SLUGS as string[])")
    expect(topicIndexSource).toContain('visible_count')
    expect(topicIndexSource).not.toContain('tag.usage_count} hadiths')
  })

  it('loads topic detail results only from the visible collection allow list', () => {
    expect(topicDetailSource).toContain('VISIBLE_COLLECTION_SLUGS')
    expect(topicDetailSource).toContain(".in('collection_slug', VISIBLE_COLLECTION_SLUGS as string[])")
    expect(topicDetailSource).not.toContain('HIDDEN_COLLECTION_FILTER')
  })

  it('derives collection books from hadith rows so partial book metadata cannot hide books', () => {
    expect(collectionSource).toContain(".from('hadiths')")
    expect(collectionSource).toContain(".select('id, book_number')")
    expect(collectionSource).toContain(".order('book_number', { ascending: true })")
    expect(collectionSource).toContain(".order('id', { ascending: true })")
    expect(collectionSource).toContain('BOOK_NUMBER_PAGE_SIZE')
    expect(collectionSource).toContain('.range(from, from + BOOK_NUMBER_PAGE_SIZE - 1)')
    expect(collectionSource).toContain('const titleMap = new Map<number, Book>()')
    expect(collectionSource).not.toContain('return bookRows as Book[];')
  })
})
