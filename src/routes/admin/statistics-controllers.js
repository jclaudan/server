/**
 * Module de gestion des statistiques d'examen
 * @module
 */
import { parseAsync } from 'json2csv'

import { appLogger, getFrenchLuxon, getFrenchLuxonFromISO } from '../../util'
import {
  getAllPlacesProposeInFutureByDpt,
  getCountCandidatsLeaveRetentionArea,
  getCountCandidatsLeaveRetentionAreaByWeek,
  getResultsExamAllDpt,
} from './statistics.business'

/**
 * @constant {LabelValue[]}
 */

const fieldsResultExams = [
  {
    label: 'Date',
    value: 'date',
  },
  {
    label: 'Département',
    value: 'departement',
  },
  {
    label: 'Inscrits',
    value: 'registered',
  },
  {
    label: 'Validés',
    value: 'checked',
  },
  {
    label: 'En attente',
    value: 'waiting',
  },
  {
    label: 'Non examinés',
    value: 'notExamined',
  },
  {
    label: 'Absents',
    value: 'absent',
  },
  {
    label: 'Reçus',
    value: 'received',
  },
  {
    label: 'Echecs',
    value: 'failed',
  },
]

/**
 * @constant {LabelValue[]}
 */

const fieldsPlacesExams = [
  {
    label: 'Date de début période',
    value: 'beginDate',
  },
  {
    label: 'Département',
    value: 'departement',
  },
  {
    label: 'Total Places Reservées',
    value: 'totalBookedPlaces',
  },
  {
    label: 'Total Places Disponibles',
    value: 'totalAvailablePlaces',
  },
  {
    label: 'Total Candidats Inscrits',
    value: 'totalCandidatsInscrits',
  },
]

/**
 * @constant {LabelValue[]}
 */

const fieldsCandidatsLeaveRetentionArea = [
  {
    label: 'Département',
    value: '_id',
  },
  {
    label: 'nombre de Candidats',
    value: 'count',
  },
  {
    label: 'Date de début période',
    value: 'beginPeriode',
  },
  {
    label: 'Date de fin période',
    value: 'endPeriode',
  },
]

/**
 * @constant {CSVOptions}
 */

const optionsPlacesExam = {
  fields: fieldsPlacesExams,
  delimiter: ';',
  quote: '',
}

/**
 * @constant {CSVOptions}
 */

const optionsCandidatsLeaveRetentionArea = {
  fields: fieldsCandidatsLeaveRetentionArea,
  delimiter: ';',
  quote: '',
}

/**
 * @constant {CSVOptions}
 */

const optionsResultsExams = {
  fields: fieldsResultExams,
  delimiter: ';',
  quote: '',
}

/**
 * Crée le CSV à partir du contenu `statsData`
 * @function
 *
 * @param {Object[]} statsData Données statistiques
 */

const parseStatsResultsExams = statsData =>
  parseAsync(statsData, optionsResultsExams)

/**
 * Crée le CSV à partir du contenu `statsData`
 * @function
 *
 * @param {Object[]} statsData Données statistiques
 */

const parseStatsCandidatRetention = statsData =>
  parseAsync(statsData, optionsCandidatsLeaveRetentionArea)

/**
 * Crée le CSV à partir du contenu `statsData`
 * @function
 *
 * @param {Object[]} statsData Données statistiques
 */

const parseStatsPlacesExams = statsData =>
  parseAsync(statsData, optionsPlacesExam)

/**
 * Obtenir les statistiques des réussites des examens
 * @async
 * @function
 *
 * @param {import('express').Request} req Requête express
 * @param {Object} req.query Query string de la requête
 * @param {Object} req.query.departement Département selectionné
 * @param {string} req.query.beginPeriod Date de début de période
 * @param {string} req.query.endPeriod Date de fin de période
 * @param {string} req.query.isCsv Indique si l'on souhaite un CSV en réponse
 * @param {import('express').Response} res Réponse express
 */

export const getStatsResultsExam = async (req, res) => {
  const { beginPeriod, endPeriod, isCsv, departement } = req.query
  const { departements, userId } = req

  const loggerContent = {
    section: 'admin-getStatsResultsExam',
    admin: userId,
    beginPeriod,
    endPeriod,
    isCsv,
    selectedDepartement: departement,
  }

  const begin = getFrenchLuxonFromISO(beginPeriod)
    .startOf('day')
    .toJSDate()
  const end = getFrenchLuxonFromISO(endPeriod)
    .endOf('day')
    .toJSDate()

  let dpts = departements
  if (departement && departements.includes(departement)) {
    dpts = [departement]
  }

  const statsKpi = await getResultsExamAllDpt(dpts, begin, end)

  if (isCsv === 'true') {
    const statsKpiCsv = await parseStatsResultsExams(statsKpi)
    const filename = 'statsCandidats.csv'
    appLogger.info({
      ...loggerContent,
      action: 'GET STATS KPI RESULTS EXAMS CSV',
      statsKpi,
    })
    return res
      .status(200)
      .attachment(filename)
      .send(statsKpiCsv)
  }

  appLogger.info({
    ...loggerContent,
    action: 'GET STATS KPI RESULTS EXAMS',
    statsKpi,
  })

  res.status(200).json({
    success: true,
    message: 'Les stats ont bien été mises à jour',
    statsKpi,
  })
}

/**
 * Obtenir les statistiques des candidats en rétentions
 * @aysnc
 * @function
 * @param {import('express').Request} req Requête express
 * @param {Object} req.query Query string de la requête
 * @param {Object} req.query.departement Département selectionné
 * @param {string} req.query.beginPeriod Date de début de période
 * @param {string} req.query.endPeriod Date de fin de période
 * @param {import('express').Response} res Réponse express
 */

export const getCandidatsLeaveRetentionArea = async (req, res) => {
  const { beginPeriod, endPeriod, isCsv, departement } = req.query
  const { departements, userId } = req

  const loggerContent = {
    section: 'admin-get-candidats-leave-retention-area',
    admin: userId,
    begin: beginPeriod,
    end: endPeriod,
    selectedDepartement: departement,
  }

  const begin = getFrenchLuxonFromISO(beginPeriod)
    .startOf('day')
    .toJSDate()
  const end = getFrenchLuxonFromISO(endPeriod)
    .endOf('day')
    .toJSDate()

  let dpts = departements
  if (departement && departements.includes(departement)) {
    dpts = [departement]
  }

  const statsKpiCandidatsLeaveRetention = await getCountCandidatsLeaveRetentionArea(
    dpts,
    begin,
    end,
  )
  const candidatsInRetention = statsKpiCandidatsLeaveRetention.reduce(
    (accu, currValue) => {
      accu.departements = accu.departements + currValue._id + ', '
      accu.totalCount = accu.totalCount + currValue.count
      return accu
    },
    {
      departements: '',
      totalCount: 0,
    },
  )

  appLogger.info({
    ...loggerContent,
    action: 'GET STATS KPI NUMBER CANDIDAT IN RETENTION AREA',
    candidatsInRetention,
  })

  if (isCsv === 'true') {
    const statsKpiCsv = await parseStatsCandidatRetention(
      statsKpiCandidatsLeaveRetention,
    )
    const filename = 'statsCandidatsInRetention.csv'
    appLogger.info({
      ...loggerContent,
      action: 'GET STATS KPI NUMBER CANDIDAT IN RETENTION AREA CSV',
      filename,
    })
    return res
      .status(200)
      .attachment(filename)
      .send(statsKpiCsv)
  }

  res.status(200).json({
    success: true,
    message: 'Les stats ont bien été mises à jour',
    statsKpiCandidatsLeaveRetention,
  })
}

/**
 * Obtenir les statistiques des candidats en rétention par semaine et départemenet
 * @async
 * @function
 * @param {import('express').Request} req Requête express
 * @param {Object} req.query Query string de la requête
 * @param {Object} req.query.departement Département selectionné
 * @param {Object} req.departements Départements dont l'utilisateur à accès
 * @param {Object} req.userId Id de l'utilisateur faisant l'action
 * @param {import('express').Response} res Réponse express
 */

export const getCandidatsLeaveRetentionAreaByWeekAndDepartement = async (
  req,
  res,
) => {
  const { departement } = req.query
  const { departements, userId } = req

  const loggerContent = {
    section: 'admin-get-candidats-leave-retention-area-by-week-and-departement',
    admin: userId,
    selectedDepartement: departement,
  }

  let dpts = departements
  if (departement && departements.includes(departement)) {
    dpts = [departement]
  }

  try {
    const candidatsLeaveRetentionByWeekAndDepartement = await getCountCandidatsLeaveRetentionAreaByWeek(
      dpts,
    )

    appLogger.info({
      ...loggerContent,
      action:
        'GET STATS KPI NUMBER CANDIDAT LEAVE RETENTION AREA BY WEEK AND DEPARTEMENT',
      departements: dpts,
    })

    return res.status(200).json({
      success: true,
      message: 'Les stats ont bien été mises à jour',
      candidatsLeaveRetentionByWeekAndDepartement,
    })
  } catch (error) {
    appLogger.error({
      ...loggerContent,
      action:
        'ERROR GET STATS KPI NUMBER CANDIDAT LEAVE RETENTION AREA BY WEEK AND DEPARTEMENT',
      description: error.message,
      error,
    })
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Obtenir les statistiques des places d'examins
 * @async
 * @function
 * @param {import('express').Request} req Requête express
 * @param {Object} req.query Query string de la requête
 * @param {string} req.query.isCsv Indique si l'on souhaite un CSV en réponse
 * @param {import('express').Response} res Réponse express
 */

export const getStatsPlacesExam = async (req, res) => {
  const { isCsv } = req.query

  const beginDate = getFrenchLuxon()
    .startOf('day')
    .toJSDate()

  const loggerContent = {
    section: 'admin-getStatsPlacesExam',
    admin: req.userId,
    beginDate,
    isCsv,
  }

  try {
    const statsKpi = await getAllPlacesProposeInFutureByDpt(beginDate)

    if (isCsv === 'true') {
      appLogger.info({
        ...loggerContent,
        action: 'GET STATS KPI CSV',
        description: `Calcul de stats des départements: ${statsKpi.map(
          el => el.departement,
        )}`,
      })

      const statsKpiCsv = await parseStatsPlacesExams(statsKpi)
      const filename = 'statsPlacesExam.csv'

      return res
        .status(200)
        .attachment(filename)
        .send(statsKpiCsv)
    }

    appLogger.info({
      ...loggerContent,
      action: 'GET STATS KPI PROPOSE IN FUTURE',
      statsKpi,
    })

    return res.status(200).json({
      success: true,
      message: 'Les stats ont bien été mises à jour',
      statsKpi,
    })
  } catch (error) {
    appLogger.error({
      ...loggerContent,
      action: 'ERROR GET STATS KPI',
      description: error.message,
      error,
    })
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @typedef {Object} LabelValue Objet contenant une paire de clé-valeur
 * @property {string} label Label
 * @property {string | number | boolean} value Valeur
 *
 * @typedef {Object} CSVOptions Options pour la lecture du CSV
 * @property {string[]} fields Liste des champs du CSV
 * @property {string} delimiter Délimiteur de champ (`;` ou `,`)
 * @property {string} quote Délimiteur de contenu du champ
 */
