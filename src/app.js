/**
 * Module de configuration principale du serveur express
 * @module app
 */
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import fileupload from 'express-fileupload'

import { loggerStream, jsonFormat } from './util/logger'
import routes from './routes'

import npmVersion from '../package.json'

/**
 * @swagger
 *
 * tags:
 *   - name: Authentification
 *     description: Pour s'authentifier à l'application
 *   - name: Administrateur
 *     description: Pour toutes les actions liées aux administrateurs
 *   - name: Candidat
 *     description: Pour toutes les actions liées aux candidats
 *   - name: Public
 *     description: Pour toutes les actions publiques (sans besoin d'authentification)
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     AdminInfo:
 *       type: object
 *       required:
 *         - email
 *         - departements
 *         - features
 *         - emailsDepartements
 *       properties:
 *         email:
 *           type: string
 *           description: Adresse courriel de l'administrateur
 *         departements:
 *           type: array
 *           description: Liste des départements accessibles par l'administrateur
 *           items:
 *             type: number
 *         features:
 *           type: array
 *           description: Liste de fonctionnalités accessibles par l'administrateur
 *           items:
 *             type: string
 *         emailsDepartements:
 *           type: array
 *           description: Liste contenant les objets départements de la base de données accessibles par l'administrateur
 *           items:
 *             type: object
 *             required:
 *               - _id
 *               - email
 *             properties:
 *               _id:
 *                 type: number
 *                 description: le code du département
 *               email:
 *                 type: string
 *                 description: l'adresse courriel liée au département
 *       example:
 *         email: admin@exemple.com
 *         departements: [
 *           75
 *         ]
 *         features: [
 *           aurige
 *         ]
 *         emailsDepartements: [ {
 *           _id: 75,
 *           email: email75@departement.com
 *         } ]
 *
 *     CandidatInfo:
 *       type: object
 *       properties:
 *         candidat:
 *           type: object
 *           description: Informations sur le candidat
 *           properties:
 *             adresse:
 *               type: string
 *               description: Adresse postale du candidat où lui seront envoyés les correspondances de l'adiminstation
 *             codeNeph:
 *               type: string
 *               description: NEPH du candidat
 *             email:
 *               type: string
 *               description: Adresse courriel du candidat
 *             nomNaissance:
 *               type: string
 *               description: Nom de naissance du candidat
 *             portable:
 *               type: string
 *               description: Numéro de mobile du candidat
 *             prenom:
 *               type: string
 *               description: Prénom du candidat
 *             departement:
 *               type: string
 *               description: Département du candidat
 *       example:
 *         "candidat":
 *           "adresse": "40 Avenue des terroirs de France 93000 Villepinte"
 *           "codeNeph": "093496239512"
 *           "email": "mayswaisey@candilib.com"
 *           "nomNaissance": "SWAISEY"
 *           "portable": "0603765291"
 *           "prenom": "MAY"
 *           "departement": "93"
 *
 *     CandidatObject:
 *       type: object
 *       description: Objet candidat dans la base de données
 *       required:
 *         - isValidatedByAurige
 *         - isValidatedEmail
 *         - nbEchecsPratiques
 *         - _id
 *         - adresse
 *         - codeNeph
 *         - email
 *         - nomNaissance
 *         - portable
 *         - prenom
 *         - presignedUpAt
 *         - departement
 *         - noReussites
 *       properties:
 *         isValidatedByAurige:
 *           type: boolean
 *           description: Vaut `true` si le candidat a été validé par aurige
 *         isValidatedEmail:
 *           type: boolean
 *           description: Vaut `true` si le candidat a validé son adresse courriel
 *         nbEchecsPratiques:
 *           type: number
 *           description: Nombre d'échecs du candidat à l'épreuve pratique
 *         _id:
 *           type: string
 *           description: Identifiant du candidat
 *         adresse:
 *           type: string
 *           description: Adresse postale du candidat où lui seront envoyés les correspondances de l'adminstation
 *         codeNeph:
 *           type: string
 *           description: NEPH du candidat
 *         email:
 *           type: string
 *           description: Adresse courriel du candidat
 *         emailValidationHash:
 *           type: string
 *           description: Hash de validation du courriel
 *         nomNaissance:
 *           type: string
 *           description: Nom de naissance du candidat
 *         portable:
 *           type: string
 *           description: Numéro de mobile du candidat
 *         prenom:
 *           type: string
 *           description: Prénom du candidat
 *         presignedUpAt:
 *           type: string
 *           description: Date et heure de la préinscription du candidat
 *         departement:
 *           type: string
 *           description: Département du candidat
 *         noReussites:
 *           type: array
 *           description: Liste des précédents échecs à l'épreuve pratique et causes
 *           items:
 *             type: object
 *             description: Informations sur l'échec à l'épreuve pratique
 *             required:
 *               - _id
 *               - date
 *               - reason
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Identifiant de l'échec
 *               date:
 *                 type: string
 *                 description: Date et heure de l'échec
 *               reason:
 *                 type: string
 *                 description: Raison de l'échec
 *         canBookFrom:
 *           type: string
 *           description: Date et heure à partir de laquelle le candidat peut réserver une place
 *         dateReussiteETG:
 *           type: string
 *           description: Date et heure de la réussite de l'épreuve théorique
 *         firstConnection:
 *           type: string
 *           description: Date et heure de la première connexion à Candilib
 *         places:
 *           type: array
 *           description: Liste des places réservées par le candidat
 *           items:
 *             type: object
 *             description: Informations sur la place
 *             required:
 *               - _id
 *               - inspecteur
 *               - centre
 *               - date
 *               - bookedAt
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Identifiant de la place
 *               inspecteur:
 *                 type: string
 *                 description: Identifiant de l'inspecteur affecté à la place
 *               centre:
 *                 type: string
 *                 description: Identifiant du centre d'examen
 *               date:
 *                 type: string
 *                 description: Date et heure de l'examen
 *               archivedAt:
 *                 type: string
 *                 description: Date et heure à laquelle la place a été archivée
 *               archiveReason:
 *                 type: string
 *                 description: Raison pour l'archivage de la place
 *               byUser:
 *                 type: string
 *                 description: Adresse courriel de l'utilisateur responsable de l'archivage
 *               bookedAt:
 *                 type: string
 *                 description: Date et heure à laquelle la réservation a été prise
 *               bookedByAdmin:
 *                 type: object
 *                 description: Information sur l'administrateur ayant fait la réservation, si applicable
 *                 required:
 *                   - _id
 *                   - departements
 *                   - signUpDate
 *                   - status
 *                   - email
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Identifiant de l'administrateur
 *                   departements:
 *                     type: array
 *                     description: Liste des départements accessibles par l'administrateur
 *                     items:
 *                       type: number
 *                   signUpDate:
 *                     type: string
 *                     description: Date et heure à laquelle l'administrateur à été créé
 *                   status:
 *                     type: string
 *                     description: Role de l'administrateur, par exemple répartiteur
 *                   email:
 *                     type: string
 *                     description: Adresse courriel de l'administrateur
 *         resaCanceledByAdmin:
 *           type: string
 *           description: Date et heure de la dernière annulation de place faite par un administrateur
 *
 *     CenterObject:
 *       type: object
 *       required:
 *         - geoloc
 *         - _id
 *         - nom
 *         - label
 *         - adresse
 *         - departement
 *       properties:
 *         geoloc:
 *           $ref: '#/components/schemas/GeolocObject'
 *         _id:
 *           type: string
 *           description: identifiant du centre
 *           example: 5dce6ec901353671dead895e
 *         nom:
 *           type: string
 *           description: Nom du centre (de la ville du centre)
 *           example: Noisy le Grand
 *         label:
 *           type: string
 *           description: Information complémentaire pour retrouver le point de rencontre du centre
 *           example: Centre d'examen du permis de conduire de Noisy le Grand
 *         adresse:
 *           type: string
 *           description: Adresse du centre
 *           example: 5 boulevard de Champs Richardets 93160 Noisy le Grand
 *         departement:
 *           type: string
 *           description: Département du centre
 *           example: 75
 *         active:
 *           type: boolean
 *           description: Si `false`, le centre n'apparaîtra pas dans les requêtes des utilisateurs
 *           example: true
 *         disabledBy:
 *           type: string
 *           description: Adresse courriel du dernier utilisateur ayant désactivé le centre
 *           example: admin@exemple.com
 *         disabledAt:
 *           type: Date
 *           description: Date à laquelle le centre a été désactivé
 *           example: 2020-01-01 00:00:00
 *
 *     DepartementObject:
 *       type: object
 *       required:
 *         - _id
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Identifiant du département
 *           example: 75
 *         email:
 *           type: string
 *           description: Adresse couriel de contact pour le département
 *           example: email75@departement.com
 *
 *     GeolocObject:
 *       type: object
 *       required:
 *         - coordinates
 *         - type
 *       properties:
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *             description: Latitude ou longitude
 *           example: [ 2.552847, 48.962099 ]
 *         type:
 *           type: string
 *           example: "Point"
 *
 *     GeoDepartementsInfos:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *         geoDepartementsInfos:
 *           type: array
 *           description: Liste des géo-départements
 *           items:
 *             type: object
 *             properties:
 *               geoDepartement:
 *                 type: string
 *                 description: Géo-département concerné
 *               centres:
 *                 type: array
 *                 description: Contient la liste des centres disponibles
 *               count:
 *                 type: string
 *                 description: Total de places disponible sur le géo-departement concerné
 *
 *     InfoObject:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *
 *     StatsKpiPlacesExams:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *         statsKpi:
 *           type: array
 *           description: Liste des stats par département
 *           items:
 *             type: object
 *             properties:
 *               beginDate:
 *                 type: string
 *                 description: Date de début de période
 *               departement:
 *                 type: string
 *                 description: Département concerné
 *               totalBookedPlaces:
 *                 type: number
 *                 description: Total de places reservées
 *               totalPlaces:
 *                 type: number
 *                 description: Total des places disponibles
 *               totalCandidatsInscrits:
 *                 type: number
 *                 description: Nombre de candidats inscrits
 *       example:
 *         success: true
 *         message: Les stats ont bien été mises à jour
 *         statsKpi: [{
 *           beginDate: 2019-10-10T22:00:00.000Z,
 *           departement: 93,
 *           totalBookedPlaces: 2,
 *           totalPlaces: 622,
 *           totalCandidatsInscrits: 2
 *         }]
 *
 *     StatsKpiResultsExams:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *         statsKpi:
 *           type: array
 *           description: Liste des stats par département
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 description: Date de la demande de stats
 *               departement:
 *                 type: string
 *                 description: Département concerné
 *               beginPeriode:
 *                 type: string
 *                 description: Date de début de période
 *               endPeriode:
 *                 type: string
 *                 description: Date de fin de période
 *               absent:
 *                 type: number
 *                 description: Nombre de candidats absents lors d'examens
 *               failed:
 *                 type: number
 *                 description: Nombre de candidats qui ont échoués à l'examen
 *               notExamined:
 *                 type: number
 *                 description: Nombre de candidats ne remplissant pas les conditions pour être examinés
 *               received:
 *                 type: number
 *                 description: Nombre de candidats reçus à l'examen
 *       example:
 *         success: true
 *         message: Les stats ont bien été mises à jour
 *         statsKpi: [{
 *           departement: "93",
 *           date: "15/10/2019 à 11:00",
 *           beginPeriode: "2019-09-14T22:00:00.000Z",
 *           endPeriode: "2019-10-15T21:59:59.999Z",
 *           absent: 3,
 *           failed: 5,
 *           notExamined: 2,
 *           received: 15
 *         }]
 *
 *     StatsKpiCandidatsLeaveRetentionArea:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *         statsKpi:
 *           type: array
 *           description: Liste des stats par département et période
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 description: Date de la demande de stats
 *               departement:
 *                 type: string
 *                 description: Département concerné
 *               beginPeriode:
 *                 type: string
 *                 description: Date de début de période
 *               endPeriode:
 *                 type: string
 *                 description: Date de fin de période
 *               count:
 *                 type: number
 *                 description: Nombre de candidats dans la zone de rétention
 *       example:
 *         success: true
 *         message: Les stats ont bien été mises à jour
 *         statsKpiCandidatsLeaveRetention: [{
 *           departement: "93",
 *           beginPeriode: "2019-09-14T22:00:00.000Z",
 *           endPeriode: "2019-10-15T21:59:59.999Z",
 *           count: 3
 *         }]
 *
 *     StatsKpiCandidatsLeaveRetentionAreaByWeek:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *         statsKpi:
 *           type: array
 *           description: Liste des stats par département et période
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 description: Date de la demande de stats
 *               departement:
 *                 type: string
 *                 description: Département concerné
 *               beginPeriode:
 *                 type: string
 *                 description: Date de début de période
 *               endPeriode:
 *                 type: string
 *                 description: Date de fin de période
 *               count:
 *                 type: number
 *                 description: Nombre de candidats dans la zone de rétention
 *       example:
 *         success: true
 *         message: Les stats ont bien été mises à jour
 *         statsKpiCandidatsLeaveRetention: [{
 *           departement: "93",
 *           beginPeriode: "2019-09-14T22:00:00.000Z",
 *           endPeriode: "2019-10-15T21:59:59.999Z",
 *           count: 3
 *         }]
 *
 *     lastSyncAurigeInfos:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *         message:
 *           type: string
 *           description: Un message compréhensible par l'usager
 *         aurigeInfo:
 *           type: object
 *           description: Contient la Date/heure et le message concernant la dernière étape éffectué par le batch Aurige
 *           properties:
 *             date:
 *               type: string
 *               description: Date/heure du dernier passage du batch Aurige
 *             message:
 *               type: string
 *               description: Message indiquant la dernière étape éffectué par le batch Aurige depuis son lancement
 *       example:
 *         success: true
 *         message: Les stats ont bien été mises à jour
 *
 *     WhitelistedInfo:
 *       type: object
 *       description: Informations sur l'ajout d'adresses dans la liste blanche
 *       required:
 *         - code
 *         - result
 *         - status
 *         - message
 *       properties:
 *         code:
 *           type: number
 *           description: Code du status http du résultat, habituellement `201`, `207` ou `422`
 *         result:
 *           type: array
 *           description: Liste des adresses et le résultat de la requête
 *           items:
 *             type: object
 *             description: Informations sur l'état de l'ajout d'une adresse
 *             required:
 *               - code
 *               - email
 *               - success
 *             properties:
 *               code:
 *                 type: number
 *                 description: Code du status http du résultat, habituellement `201`, `400` ou `409`
 *               email:
 *                 type: string
 *                 description: Adresse entrée dans la requête
 *               success:
 *                 type: boolean
 *                 description: Vaut `true` si l'adresse est bien entrée dans la base de données, `false` sinon
 *               message:
 *                 type: string
 *                 description: En cas d'erreur, ce message donne plus de précision
 *         status:
 *           type: string
 *           description: Réussite ou échec de la requête
 *         message:
 *           type: string
 *           description: Message décrivant le résultat
 *
 *     WhitelistedObject:
 *       type: object
 *       description: Informations de l'adresse dans la liste blanche
 *       required:
 *         - _id
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Identifiant de l'adresse
 *         email:
 *           type: string
 *           description: Adresse courriel dans la liste
 *         departement:
 *           type: string
 *           description: Code du département où a été rentré l'adresse
 *
 *   responses:
 *     InvalidPasswordResponse:
 *       description: Réponse du serveur en cas de mots de passe erronés
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/InfoObject'
 *               - example:
 *                   success: false
 *                   message: Oups! Les mots de passe ne correspondent pas
 *
 *     InvalidEmailResponse:
 *       description: Réponse du serveur en cas d'email invalide
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/InfoObject'
 *               - example:
 *                   success: false
 *                   message: Votre email n'est pas reconnu
 *     InvalidLinkResponse:
 *       description: Réponse du serveur en cas de lien invalide
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/InfoObject'
 *               - example:
 *                   success: false
 *                   message: Votre lien est invalide
 *     UnknownEmailResponse:
 *       description: Erreur inattendue
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/InfoObject'
 *               - example:
 *                   success: false
 *                   message: Oups ! Une erreur est survenue lors de l'envoi du courriel. L'administrateur a été prévenu
 *     InvalidTokenResponse:
 *       description: Réponse du serveur en cas de JWT absent ou invalide
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/InfoObject'
 *               - example:
 *                   success: false
 *                   message: Vous n'êtes pas connecté, veuillez vous reconnecter
 *     UnknownErrorResponse:
 *       description: Erreur inattendue
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/InfoObject'
 *               - example:
 *                   success: false
 *                   message: Oups, un problème est survenu. L'administrateur a été prévenu.
 */

/**
 * Préfixe de la version majeure de l'API
 */
export const apiPrefix = '/api/v2'

const isDevelopment = [undefined, 'development'].includes(process.env.NODE_ENV)

const app = express()

/**
 * Use swagger-ui-express in development only
 */
if (isDevelopment) {
  /**
   * Ip de l'environnement de qualification pour l'appli candidat
   * @constant {string}
   */
  const IP_QUALIF_CANDIDAT = process.env.IP_QUALIF_CANDIDAT

  /**
   * Ip de l'environnement de qualification pour l'appli répartiteur
   * @constant {string}
   */
  const IP_QUALIF_REPARTITEUR = process.env.IP_QUALIF_REPARTITEUR

  const swaggerJsdoc = require('swagger-jsdoc')

  const options = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Candilib API',
        description: 'API Restful de Candilib',
        version: '2.0.4',
      },
      servers: [
        { url: 'http://localhost:8000/api/v2/', description: 'api-dev' },
        {
          url: 'http://localhost:8080/candilib/api/v2/',
          description: 'front-dev',
        },
        {
          url: `http://${IP_QUALIF_CANDIDAT}/candilib/api/v2/`,
          description: 'preprod candidat',
        },
        {
          url: `http://${IP_QUALIF_REPARTITEUR}/candilib-repartiteur/api/v2/`,
          description: 'preprod repartiteur',
        },
      ],
    },
    apis: ['./src/app.js', './src/routes/**/*.js'],
  }

  const specs = swaggerJsdoc(options)

  const swaggerUi = require('swagger-ui-express')
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
}

/**
 * @swagger
 *
 * /version:
 *   get:
 *     summary: Version exacte de l'API déployée (Disponible uniquement depuis l'URL répartiteur)
 *     description: Retourne la version exacte de l'API déployée
 *     responses:
 *       200:
 *         description: Numéro de version détaillée de l'API déployée
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example:
 *               2.0.0-alpha.0
 *
 */
app.get(`${apiPrefix}/version`, function getVersion (req, res) {
  res.send(npmVersion.version)
})

/**
 * Utiliser morgan pour journaliser toutes les requêtes en format JSON
 */
app.use(morgan(jsonFormat, { stream: loggerStream }))

/**
 * Analyser le corps des requêtes, des formulaires multipart et les fichiers téléversés
 */
app.use(bodyParser.json({ limit: '20mb' }))
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }))
app.use(fileupload({ limits: { fileSize: 50 * 1024 * 1024 } }))

/**
 * Traiter toutes les requêtes dont le chemin commençe par le préfix défini correspondant à la version majeure de l'API
 */
app.use(apiPrefix, routes)

export default app

/**
 * @typedef {Object} InfoObject
 *
 * @property {boolean} success - Indique si l'action a été effectuée avec succès
 * @property {string} message  - Message destiné à être affiché à l'utilisateur : message de réussite de l'action
 *                              ou message d'erreur compréhensible par un non technicien
 */
