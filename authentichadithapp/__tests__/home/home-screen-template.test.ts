import fs from 'fs'

describe('home screen study template', () => {
  const source = fs.readFileSync('app/(tabs)/index.tsx', 'utf8')

  it('frames the first viewport as deeper Sahihayn study', () => {
    expect(source).toContain('Go deeper into Bukhari and Muslim')
    expect(source).toContain('Browse Sahihayn')
    expect(source).toContain('Ask Context')
  })

  it('keeps the study loop visible on the home screen', () => {
    expect(source).toContain('STUDY LOOP')
    expect(source).toContain('Choose a path into the text')
    expect(source).toContain('Read')
    expect(source).toContain('Reflect')
    expect(source).toContain('Ask')
  })
})
