/**
 * Module regroupant la logique métier concernant les actions possibles sur les centres
 *
 * @module routes/common/centre-business
 */

import {
  countAvailablePlacesByCentre,
  findAllPlacesByCentre,
  verifyIsAvailablePlacesByCentre,
} from '../../models/place'

import { findUserById } from '../../models/user'

import {
  createCentre,
  findAllActiveCentres,
  findAllCentres,
  findCentreByGeoDepartement,
  findCentreById,
  findCentreByNameAndDepartement,
  findCentreByNameAndGeoDepartement,
  findCentresByDepartement,
  updateCentreActiveState,
  updateCentreLabel,
} from '../../models/centre'
import { getFrenchLuxon } from '../../util'
import { getDateDisplayPlaces } from '../candidat/util/date-to-display'

export async function findCentresWithNbPlaces (departement, beginDate, endDate) {
  const centres = departement
    ? await findCentresByDepartement(departement)
    : await findAllActiveCentres()

  if (!beginDate) {
    beginDate = getFrenchLuxon().toISODate()
  }

  const centresWithNbPlaces = await Promise.all(
    centres.map(async centre => {
      const count = await countAvailablePlacesByCentre(
        centre._id,
        beginDate,
        endDate,
        getDateDisplayPlaces(),
        getFrenchLuxon(),
      )
      return { centre, count }
    }),
  )
  return centresWithNbPlaces
}

/**
 * Récupérer les centres avec leur nombre de places disponible
 * Utilisé que dans la partie Candidat pour obtenir la listes des centres et la liste des départements
 *
 * @async
 * @function
 * @param {*} geoDepartement
 * @param {*} beginDate
 * @param {*} endDate
 * @param {*} createdBefore
 */
export async function findCentresWithNbPlacesByGeoDepartement (
  geoDepartement,
  beginDate,
  endDate,
  justIsCentreHaveAvailablePlace = true,
) {
  const centres = geoDepartement
    ? await findCentreByGeoDepartement(geoDepartement, {
      nom: 1,
      geoDepartement: 1,
      _id: 1,
      geoloc: 1,
    })
    : await findAllActiveCentres()

  if (!beginDate) {
    beginDate = getFrenchLuxon().toISODate()
  }

  if (justIsCentreHaveAvailablePlace) {
    const centresWithNbPlaces = await Promise.all(
      centres.map(async centre => ({
        centre,
        count: await verifyIsAvailablePlacesByCentre(
          centre._id,
          beginDate,
          endDate,
          getDateDisplayPlaces(),
          getFrenchLuxon(),
        ),
      })),
    )

    const result = [
      ...Object.values(
        centresWithNbPlaces.reduce((accu, { centre, count }) => {
          if (!accu[centre.nom]) {
            accu[centre.nom] = { count: 0 }
          }
          accu[centre.nom].centre = centre
          accu[centre.nom].count = !accu[centre.nom].count ? count : accu[centre.nom].count
          return accu
        }, {}),
      ),
    ]

    return result
  }

  const centresWithNbPlaces = await Promise.all(
    centres.map(async centre => ({
      centre,
      count: await countAvailablePlacesByCentre(
        centre._id,
        beginDate,
        endDate,
        getDateDisplayPlaces(),
        getFrenchLuxon(),
      ),
    })),
  )

  // TODO: Refactor next block
  const result = [
    ...Object.values(
      centresWithNbPlaces.reduce((accu, { centre, count }) => {
        if (!accu[centre.nom]) {
          accu[centre.nom] = { count: 0 }
        }
        accu[centre.nom].centre = centre
        accu[centre.nom].count += count
        return accu
      }, {}),
    ),
  ]

  return result
}

export async function findCentresWithPlaces (departement, beginDate, endDate) {
  if (!departement) throw new Error('departement value is undefined')

  const centres = await findCentresByDepartement(departement)

  if (!beginDate) {
    beginDate = getFrenchLuxon().toISODate()
  }

  const centresWithPlaces = await Promise.all(
    centres.map(async centre => {
      const places = await findAllPlacesByCentre(centre._id, beginDate, endDate)
      return { centre, places }
    }),
  )
  return centresWithPlaces
}

/**
 * Retourne une liste de centre pour les départements voulus
 *
 * @async
 * @function
 *
 * @param {string[]} departements - Départements pour lesquels récupérer les centres
 *
 * @returns {Promise.<CentreMongooseDocument[]>} Liste des centres correspondants
 */
export async function findAllCentresForAdmin (departements) {
  if (!departements || !departements.length) {
    throw new Error('departement value is undefined')
  }

  const centres = await findAllCentres(departements)

  return centres
}

/**
 * Met à jour le statut (actif ou inactif) d'un centre
 * @async
 * @function
 *
 * @param {string} id - Id du centre à modifier
 * @param {boolean} status - Statut désiré, `true` pour un centre à activer, `false` pour le désactiver
 *
 * @returns {Promise.<CentreMongooseDocument>} Centre modifié
 */
export async function updateCentreStatus (id, status, userId) {
  const centre = await findCentreById(id)

  if (!centre) {
    const error = new Error('Centre introuvable')
    error.status = 404
    throw error
  }

  const user = await findUserById(userId)

  if (!user.departements.includes(centre.departement)) {
    const error = new Error("Vous n'avez pas accès à ce centre")
    error.status = 403
    throw error
  }

  const places = await findAllPlacesByCentre(id)

  if (places.length && !status) {
    const error = new Error(
      'Le centre possède des places à venir, il ne peut pas être archivé.',
    )
    error.status = 409
    throw error
  }

  const updatedCentre = await updateCentreActiveState(
    centre,
    status,
    user.email,
  )

  return updatedCentre
}

/**
 * Crée un centre dans la base de données
 *
 * @async
 * @function
 *
 * @param {string} nom - Nom du centre (de la ville du centre)
 * @param {string} label - Information complémentaire pour retrouver le point de rencontre du centre
 * @param {string} adresse - Adresse du centre
 * @param {number} lon - Longitude géographique du centre
 * @param {number} lat - Latitude géographique du centre
 * @param {string} departement - Département du centre
 *
 * @returns {Promise.<CentreMongooseDocument>} Centre créé
 */
export async function addCentre (
  nom,
  label,
  adresse,
  lon,
  lat,
  departement,
  geoDepartement,
) {
  if (
    !nom ||
    !label ||
    !adresse ||
    !Number(lon) ||
    !Number(lat) ||
    !departement
  ) {
    const error = new Error(
      'Tous les paramètres doivent être correctement renseignés',
    )
    error.status = 400
    throw error
  }

  const alreadyCreatedCentre = await findCentreByNameAndDepartement(
    nom,
    departement,
  )

  if (alreadyCreatedCentre && alreadyCreatedCentre.length) {
    const error = new Error('Centre déjà présent dans la base de données')
    error.status = 409
    throw error
  }
  const centre = await createCentre(
    nom,
    label,
    adresse,
    Number(lon),
    Number(lat),
    departement,
    geoDepartement,
  )
  return centre
}

/**
 * Modifie un centre dans la base de données
 *
 * @async
 * @function
 *
 * @param {string} id - Id du centre à modifier
 * @param {string} nom - Nom du centre (de la ville du centre)
 * @param {string} label - Information complémentaire pour retrouver le point de rencontre du centre
 * @param {string} adresse - Adresse du centre
 * @param {number} lon - Longitude géographique du centre
 * @param {number} lat - Latitude géographique du centre
 * @param {string} userId - Identifiant de l'utilisateur souhaitant effectuer l'action
 *
 * @returns {Promise.<CentreMongo>} Centre modifié
 */
export async function updateCentre (
  id,
  { nom, label, adresse, lon, lat, geoDepartement },
  userId,
) {
  const centre = await findCentreById(id)

  if (!centre) {
    const error = new Error('Centre introuvable')
    error.status = 404
    throw error
  }

  const user = await findUserById(userId)

  if (!user.departements.includes(centre.departement)) {
    const error = new Error("Vous n'avez pas accès à ce centre")
    error.status = 403
    throw error
  }

  if (nom && nom.toUpperCase() !== centre.nom.toUpperCase()) {
    const alreadyExistingCentre = await findCentreByNameAndDepartement(
      nom,
      centre.departement,
    )

    if (
      alreadyExistingCentre &&
      alreadyExistingCentre.length &&
      alreadyExistingCentre[0].nom.toUpperCase() === nom.toUpperCase()
    ) {
      const error = new Error('Centre déjà présent dans la base de données')
      error.status = 409
      throw error
    }
  }

  // TODO: To update old data
  if (!centre.geoDepartement && !geoDepartement) {
    geoDepartement = centre.getGeoDepartement
  }

  const updatedCentre = await updateCentreLabel(centre, {
    nom,
    label,
    adresse,
    lon,
    lat,
    geoDepartement,
  })

  return updatedCentre
}

/**
 * Recupère un centre dans la base de données par son identifiant
 *
 * @async
 * @function
 *
 * @param {string} centreId - Id du centre
 *
 * @returns {Promise.<CentreMongo>} Centre
 */
export async function getCentreById (centreId) {
  if (!centreId) {
    const error = new Error('Centre introuvable')
    error.status = 404
    throw error
  }

  return findCentreById(centreId)
}

/**
 * Recupère les centres dans la base de données par son nom et geoDepartement
 *
 * @async
 * @function
 *
 * @param {string} nom - Non du centre
 * @param {string} geoDepartement - Departement geographique du centre
 *
 * @returns {Promise.<CentreMongo>} Centre
 */
export async function getCentresByNameAndGeoDepartement (nom, geoDepartement) {
  if (!nom) {
    const error = new Error('Centre introuvable')
    error.status = 404
    throw error
  }

  return findCentreByNameAndGeoDepartement(nom, geoDepartement)
}
