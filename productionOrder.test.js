const { sumWorkingDays, calculateBox } = require('./productionOrder')

test('Add working days and skip weekend', () => {
  const startDate = new Date('2020-06-05T05:56:24.355Z')
  expect(sumWorkingDays(startDate, 3).toISOString()).toBe((new Date('2020-06-10T05:56:24.355Z')).toISOString())
})

test('Add working days and skip weekend and skip holiday', () => {
  const startDate = new Date('2020-06-14T05:56:24.355Z')
  expect(sumWorkingDays(startDate, 2).toISOString()).toBe((new Date('2020-06-18T05:56:24.355Z')).toISOString())
})

test('1 marco of 15x15x3 returns box Fedex', () => expect(calculateBox([[15, 15, 3]])).toEqual([expect.objectContaining({ name: 'Fedex' })]))
test('marco of 95x50x3 returns box Fedex', () => expect(calculateBox([[95, 50, 5]])).toEqual([expect.objectContaining({ name: 'D' })]))
test('marcos of 50x30x3 returns box Fedex', () => expect(calculateBox([[50, 30, 3]])).toEqual([expect.objectContaining({ name: 'B' })]))
test('marcos of 150x150x150 returns Caja Especial', () => expect(calculateBox([[150, 150, 150]])).toEqual([expect.objectContaining({ name: 'Caja Especial' })]))
test('3 marcos of 60x45x3 returns box B Gorda', () => expect(calculateBox([[60, 45, 3], [60, 45, 3], [60, 45, 3]])).toEqual([expect.objectContaining({ name: 'B Gorda' })]))
test('3 marcos of 60x45x3, 1 of 100x70x5 and 1 60x45x10 returns box B Gorda and D', () => expect(calculateBox([[60, 45, 3], [60, 45, 3], [60, 45, 3], [100, 70, 5], [60, 45, 10]])).toEqual([expect.objectContaining({ name: 'B Gorda' }), expect.objectContaining({ name: 'D' })]))
