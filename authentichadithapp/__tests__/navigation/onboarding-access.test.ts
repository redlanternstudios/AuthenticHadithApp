import fs from 'fs'

describe('onboarding and app access gates', () => {
  const onboardingSource = fs.readFileSync('app/onboarding.tsx', 'utf8')
  const layoutSource = fs.readFileSync('app/_layout.tsx', 'utf8')
  const paywallSource = fs.readFileSync('app/paywall.tsx', 'utf8')

  it('shows only Sahih Bukhari and Sahih Muslim during onboarding', () => {
    const collectionBlock = onboardingSource.match(/const COLLECTIONS = \[[\s\S]*?\n\]/)?.[0] ?? ''

    expect(collectionBlock).toContain('Sahih Bukhari')
    expect(collectionBlock).toContain('Sahih Muslim')
    expect(collectionBlock).not.toContain('Tirmidhi')
    expect(collectionBlock).not.toContain('Abu Dawud')
    expect(collectionBlock).not.toContain("Nasa'i")
    expect(collectionBlock).not.toContain('Ibn Majah')
  })

  it('sends completed onboarding users to the trial paywall before the app', () => {
    const completionRoutes = [...onboardingSource.matchAll(/router\.replace\('([^']+)'\)/g)]
      .map((match) => match[1])

    expect(completionRoutes).toContain('/paywall')
  })

  it('forces onboarded non subscribers to the paywall before interior routes', () => {
    const gateSource = layoutSource.match(/function NavigationGate\(\)[\s\S]*?return null\n\}/)?.[0] ?? ''

    expect(gateSource).toContain("router.replace('/paywall')")
    expect(gateSource).toContain('!isPro')
    expect(layoutSource).toContain('trial paywall before app interior')
  })

  it('describes the visible corpus as Sahihayn only on the optional support screen', () => {
    expect(paywallSource).toContain('VISIBLE_HADITH_TOTAL')
    expect(paywallSource).toContain('Sahih Bukhari and Sahih Muslim')
    expect(paywallSource).not.toContain('All 6 major hadith books')
    expect(paywallSource).not.toContain('over 30,000')
  })
})
