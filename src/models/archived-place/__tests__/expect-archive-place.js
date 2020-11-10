import { getFrenchLuxon, getFrenchLuxonFromJSDate } from '../../../util'

export const expectedArchivedPlace = (
  archivedPlace,
  place,
  reason,
  byUser,
  isCandilib,
) => {
  expect(archivedPlace).toBeDefined()
  expect(archivedPlace).toHaveProperty('placeId', place._id)
  expect(archivedPlace).toHaveProperty('date', place.date)
  expect(archivedPlace).toHaveProperty('centre', place.centre)
  expect(archivedPlace).toHaveProperty('inspecteur', place.inspecteur)
  if (reason) {
    const expectedReason = Array.isArray(reason) ? reason : [reason]
    expect(archivedPlace.archiveReasons).toEqual(
      expect.arrayContaining(expectedReason),
    )
  } else {
    expect(archivedPlace.archiveReasons).toBeUndefined()
  }
  expect(archivedPlace).toHaveProperty('byUser', byUser)
  expect(archivedPlace).toHaveProperty('isCandilib', isCandilib)
  const now = getFrenchLuxon()
  const archivedAt = getFrenchLuxonFromJSDate(archivedPlace.archivedAt)
  expect(now.hasSame(archivedAt, 'day')).toBeTruthy()
}
