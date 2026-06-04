import assert from 'node:assert/strict'
import test from 'node:test'
import {
  confidenceText,
  intensity,
  seasonFromMonth,
  strongIntro,
  timespan,
  withStrongIntro,
} from '../insightText'

test('intensity tiers', () => {
  assert.equal(intensity(3), 'Das taucht immer wieder auf.')
  assert.equal(intensity(8), 'Du kennst das gut.')
  assert.equal(intensity(20), 'Das begleitet dich schon lange.')
})

test('timespan buckets', () => {
  assert.equal(timespan(30), 'in den letzten Wochen')
  assert.equal(timespan(120), 'seit einigen Monaten')
  assert.equal(timespan(200, new Date('2026-06-15')), 'seit dem Sommer')
  assert.equal(timespan(400), 'seit über einem Jahr')
})

test('seasonFromMonth', () => {
  assert.equal(seasonFromMonth(4), 'Frühling')
  assert.equal(seasonFromMonth(7), 'Sommer')
  assert.equal(seasonFromMonth(10), 'Herbst')
  assert.equal(seasonFromMonth(1), 'Winter')
})

test('confidenceText threshold', () => {
  assert.equal(confidenceText(0.9), '90% der Fälle')
  assert.equal(confidenceText(0.85), 'oft')
})

test('strongIntro only for strong', () => {
  assert.match(strongIntro('strong'), /Mir ist etwas aufgefallen/)
  assert.equal(strongIntro('moderate'), '')
  assert.equal(withStrongIntro('strong', 'Du kennst das gut.'), 'Mir ist etwas aufgefallen.\n\nDu kennst das gut.')
})
