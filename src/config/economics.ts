export const economics = {
  hangerWeightGrams: 42,
  scrapPricePerKgSar: 1.1,
  newHangerPriceSar: 0.3,
  boxCapacityHangers: 400,
  boxReadyRatio: 1,
  usablePointsPerHanger: 5,
  damagedPointsPerHanger: 2,
  couponValidityDays: 30,
  pointsPerTree: 500,
  tiers: [
    { id: 'bronze', minHangers: 0 },
    { id: 'silver', minHangers: 150 },
    { id: 'gold', minHangers: 400 },
  ],
} as const

export type TierId = (typeof economics.tiers)[number]['id']

export const kgFromHangers = (count: number) => (count * economics.hangerWeightGrams) / 1000

export const scrapValueSar = (count: number, pricePerKg: number = economics.scrapPricePerKgSar) =>
  kgFromHangers(count) * pricePerKg

export const savingsSar = (usable: number) => usable * economics.newHangerPriceSar
