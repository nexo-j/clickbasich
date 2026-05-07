describe('Test Puppeteer', () => {
  beforeAll(async () => {
    await page.goto('https://google.com')
  })

  it('should be titled "Google"', async () => {
    await expect(page.title()).resolves.toMatch('Google')
  })
})

/* describe('Test Marco con Imagen', () => {
  beforeAll(async () => {
    await page.goto('https://marcos.clickmarqueteria.com/imagen/')
  })

  it('should be titled "Google"', async () => {
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('.fsp-drop-area') // some button that triggers file selection
    ])
    await fileChooser.accept(['/public/images/clicklogo.png'])
  })
}) */
