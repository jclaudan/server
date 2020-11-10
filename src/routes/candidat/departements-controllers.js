/**
 * Module concernant les actions des departements
 * @module routes/candidat/departements-controllers
 */

import { appLogger } from '../../util'
import { getGeoDepartementsFromCentres } from '../../models/centre'
import { UNKNOWN_ERROR_GET_DEPARTEMENTS_INFOS } from '../admin/message.constants'
import { getGeoDepartementsInfos } from './departements-business'

/**
 * Récupérer les géo-départements actives
 * @async
 * @function
 *
 * @param {import('express').Request} req
 * @param {string} req.userId Id de l'utilisateur
 * @param {import('express').Response} res
 */
export async function getActiveGeoDepartementsInfos (req, res) {
  const { userId } = req
  const loggerContent = {
    action: 'Getting active departements infos controller',
    section: 'candidat-departements-controllers',
    candidatId: userId,
  }

  try {
    const geoDepartementsInfos = await getGeoDepartementsOnlyIdsOrWithInfos(loggerContent, userId)
    return res.status(200).json({
      success: true,
      geoDepartementsInfos,
    })
  } catch (error) {
    appLogger.error({
      ...loggerContent,
      error,
      description: error.message,
    })

    return res.status(500).json({
      success: false,
      message: UNKNOWN_ERROR_GET_DEPARTEMENTS_INFOS,
    })
  }
}

const getGeoDepartementsOnlyIdsOrWithInfos = async (loggerContent, userId, justIsCentreHaveAvailablePlace = true) => {
  const geoDepartementsId = await getGeoDepartementsFromCentres()
  appLogger.info({
    ...loggerContent,
    description: `nombres d'élements trouvé: ${geoDepartementsId.length ||
      0}`,
  })

  if (justIsCentreHaveAvailablePlace) {
    return geoDepartementsId.map(geoDepartement => ({
      geoDepartement,
      centres: null,
      count: null,
    }))
  }

  const geoDepartementsInfos = await getGeoDepartementsInfos(
    geoDepartementsId,
    userId,
  )
  return geoDepartementsInfos
}
