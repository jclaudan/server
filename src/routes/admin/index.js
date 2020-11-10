/**
 * Routeur concernant les requêtes que peut faire un utilisateur
 * @module routes/admin
 */

import express from 'express'

import { getCandidats, importCandidats, updateCandidats } from './candidats-controllers'
import {
  createUserController,
  archiveUserController,
  getMe,
  getUsers,
  updatedInfoUser,
} from './admin-controllers'
import {
  createIpcsr,
  getInspecteurs,
  updateIpcsr,
} from './inspecteurs-controllers'
import {
  createDepartementsController,
  getDepartementsController,
  deleteDepartementController,
  updateDepartementsController,
} from './departement-controllers'
import {
  createOrImportPlaceByAdmin,
  deleteByAdmin,
  getPlaces,
  sendScheduleInspecteurs,
  updatePlaces,
} from './places-controllers'
import {
  getCandidatsLeaveRetentionArea,
  getCandidatsLeaveRetentionAreaByWeekAndDepartement,
  getStatsPlacesExam,
  getStatsResultsExam,
} from './statistics-controllers'

import { getInfoLastSyncAurige } from './status-candilib-controllers'

import {
  getWhitelisted,
  addWhitelisted,
  removeWhitelisted,
} from './whitelisted.controllers'
import {
  getAdminCentres,
  modifyCentre,
  createCentre,
} from '../common/centre-controllers'
import {
  verifyAccessAurige,
  verifyRepartiteurDepartement,
  verifyRepartiteurLevel,
  verifyUserLevel,
  verifyDelegueLevel,
} from './middlewares'
import config from '../../config'

const router = express.Router()

router.use(verifyRepartiteurLevel())

/**
 * @swagger
 *
 * /admin/me:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération de mes infos administrateur
 *     description: Après connexion, renvoie les infos de l'administrateur connecté (id dans le JWT envoyé en header)
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInfo'
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * Après connexion, renvoie les infos de l'administrateur connecté (id dans le JWT envoyé en header)
 *
 * @callback getMe
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/get_admin_me}
 */

router.get('/me', getMe)

/**
 * @swagger
 *
 * /admin/candidats:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des infos candidat
 *     description: L'administrateur récupère les informations d'un ou plusieurs candidats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departement
 *         schema:
 *           type: number
 *           example: 93
 *         description: Un département accessible par l'admin
 *       - in: query
 *         name: matching
 *         schema:
 *           type: string
 *           example: 'Dupont'
 *         description: Une chaîne de caractères pour chercher un candidat
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           example: 'csv'
 *         description:
 *           Si `csv`, exporte les candidats au format csv.
 *           Fonctionne correctement seulement si le champ `for` est rempli avec `aurige`
 *       - in: query
 *         name: for
 *         schema:
 *           type: string
 *           example: 'aurige'
 *         description:
 *           Si `aurige`, considère que l'action aura pour but la synchronisation avec aurige.
 *           Généralement utilisé dans le cas d'un export csv.
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: Liste des candidats correspondants aux critères
 *               items:
 *                 $ref: '#/components/schemas/CandidatObject'
 *             example: [ {
 *               isValidatedByAurige: true,
 *               isValidatedEmail: true,
 *               nbEchecsPratiques: 0,
 *               _id: 5cf63145b2a7cffde20e98b7,
 *               adresse: 40 Avenue des terroirs de France 75012 Paris,
 *               codeNeph: 093496239512,
 *               email: mayswaisey@candilib.com,
 *               nomNaissance: SWAISEY,
 *               portable: 0603765291,
 *               prenom: MAY,
 *               departement: 75
 *               }]
 *           text/csv:
 *             schema:
 *               type: string
 *             example: |-
 *               Code NEPH;Nom de naissance;Nom d'usage;Prénom;email
 *               093496239512;SWAISEY;SWAISEY;MAY;mayswaisey@candilib.com
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 * /admin/candidats/{candidatId}:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des infos candidat
 *     description: L'administrateur récupère les informations d'un candidat via son id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidatId
 *         schema:
 *           type: string
 *           example: '5cf63145b2a7cffde20e98b7'
 *         required: true
 *         description: Identifiant du candidat
 *       - in: query
 *         name: departement
 *         schema:
 *           type: number
 *           example: 93
 *         description: Un département accessible par l'admin
 *     responses:
 *       200:
 *         description: Succès de la requête, retourne le candidat suivi des informations sur sa place en cours
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                   description: Status de la requête, dans ce cas `true`
 *                 candidat:
 *                   $ref: '#/components/schemas/CandidatObject'
 *             example:
 *               success: true
 *               candidat:
 *                 isValidatedByAurige: true
 *                 isValidatedEmail: true
 *                 nbEchecsPratiques: 0
 *                 _id: 5cf63145b2a7cffde20e98b7
 *                 adresse: 40 Avenue des terroirs de France 75012 Paris
 *                 codeNeph: 093496239512
 *                 email: mayswaisey@candilib.com
 *                 nomNaissance: SWAISEY
 *                 portable: 0603765291
 *                 prenom: MAY
 *                 departement: 75
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 */

/**
 * L'administrateur récupère les informations d'un ou plusieurs candidats
 *
 * @callback getCandidats
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/get_admin_candidats}
 */
router.get(
  '/candidats/:id?',
  verifyRepartiteurDepartement,
  verifyAccessAurige,
  getCandidats,
)

/**
 * Mise à jour des données d'un candidat
 */
router.patch('/candidats/:id', updateCandidats)
/**
 * @swagger
 *
 * /admin/candidats:
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Ajout des candidats
 *     description: Import des candidats via le fichier délivré par aurige. Nécessite les droits administrateur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier au format JSON contenant les candidats
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - fileName
 *                 - success
 *                 - message
 *                 - candidats
 *               properties:
 *                 fileName:
 *                   type: string
 *                   description: Le nom du fichier qui a été synchronisé
 *                 success:
 *                   type: boolean
 *                   description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *                 message:
 *                   type: string
 *                   description: Un message compréhensible par l'usager
 *                 candidats:
 *                   type: array
 *                   description: La liste des candidats traités et le status du traitement
 *                   items:
 *                     type: object
 *                     required:
 *                       - nom
 *                       - neph
 *                       - status
 *                       - details
 *                       - message
 *                     properties:
 *                       nom:
 *                         type: string
 *                         description: Nom du candidat
 *                       neph:
 *                         type: string
 *                         description: NEPH du candidat
 *                       status:
 *                         type: string
 *                         description: status du traitement
 *                       details:
 *                         type: string
 *                         description: details sur le traitement
 *                       message:
 *                         type: string
 *                         description: message de retour du traitement
 *               example:
 *                   fileName: aurige.json
 *                   success: true
 *                   message: Le fichier aurige.json a été synchronisé.
 *                   candidats: [ {
 *                     nom: CANDIDAT,
 *                     neph: 0123456789,
 *                     status: error,
 *                     details: NOT_FOUND,
 *                     message: Ce candidat 0123456789/CANDIDAT est inconnu de Candilib
 *                     }]
 *
 *       400:
 *         description: Fichier manquant
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Fichier manquant
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * Import des candidats via le fichier délivré par aurige
 *
 * @callback importCandidats
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/post_admin_candidats}
 */
router.post(
  '/candidats',
  verifyUserLevel(config.userStatusLevels.admin),
  importCandidats,
)

/**
 * @swagger
 *
 * /admin/inspecteurs:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des infos inspecteur
 *     description: L'administrateur récupère les informations d'un ou plusieurs inspecteurs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: matching
 *         schema:
 *           type: string
 *           example: Dupont
 *         description: Une chaîne de caractères pour chercher un inspecteur
 *       - in: query
 *         name: departement
 *         schema:
 *           type: number
 *           example: 93
 *         description: S'il est entré comme seul paramètre, renvoie tous les inspecteurs d'un département
 *       - in: query
 *         name: centreId
 *         schema:
 *           type: string
 *           example: 5d8b7c6429cd5b2468d3f161
 *         description:
 *           Remplir pour chercher les inspecteurs affectés à un centre pendant une période donnée.
 *           Ne fonctionne que si `begin` et `end` sont aussi paramétrés
 *       - in: query
 *         name: begin
 *         schema:
 *           type: string
 *           example: 2019-09-25 14:40:36.724Z
 *         description:
 *           Début de la période de recherche d'inspecteurs.
 *           Ne fonctionne que si `centreId` et `end` sont aussi paramétrés
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           example: 2019-09-25 14:40:36.724Z
 *         description:
 *           Fin de la période de recherche d'inspecteurs.
 *           Ne fonctionne que si `centreId` et `begin` sont aussi paramétrés
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: Liste des inspecteurs correspondants aux critères
 *               items:
 *                 type: object
 *                 description: Informations de l'inspecteur
 *                 required:
 *                   - _id
 *                   - email
 *                   - matricule
 *                   - nom
 *                   - prenom
 *                   - departement
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Identifiant de l'inspecteur
 *                   email:
 *                     type: string
 *                     description: Adresse courriel de l'inspecteur
 *                   matricule:
 *                     type: string
 *                     description: Matricule de l'inspecteur
 *                   nom:
 *                     type: string
 *                     description: Nom de l'inspecteur
 *                   prenom:
 *                     type: string
 *                     description: Prénom de l'inspecteur
 *                   departement:
 *                     type: string
 *                     description: Code du département de l'inspecteur
 *             example: [ {
 *               _id: 5d970a006a503f67d254124d,
 *               email: dupond.jacques@email.fr,
 *               matricule: 01020301,
 *               nom: DUPOND,
 *               prenom: Jacques,
 *               departement: 93
 *               }]
 *
 *       400:
 *         description: Les paramètres de la requête ne conviennent pas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Certains paramètres ne sont pas définis
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * L'administrateur récupère les informations d'un ou plusieurs inspecteurs
 *
 * @callback getInspecteurs
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/get_admin_inspecteurs}
 */
router.get('/inspecteurs', getInspecteurs)

/**
 * @swagger
 *
 * /admin/inspecteurs/{id}:
 *   put:
 *     tags: ["Administrateur"]
 *     summary: Modification des infos d'un inspecteur
 *     description: L'administrateur modifie les informations d'un inspecteur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 456088afdaecd3462089
 *         required: true
 *         description: Identifiant de l'IPCSR dans la base de données
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departement:
 *                 type: string
 *                 example: 93
 *                 description: Valeur du département d'intervention de l'IPCSR
 *               email:
 *                 type: string
 *                 example: jacques.dupont@example.com
 *                 description: Adresse courriel de l'IPCSR
 *               matricule:
 *                 type: string
 *                 example: '059049585'
 *                 description: Matricule de l'IPCSR
 *               nom:
 *                 type: string
 *                 example: 'Dupont'
 *                 description: Nom de l'IPCSR
 *               prenom:
 *                 type: string
 *                 example: 'Jacques'
 *                 description: Prénom de l'IPCSR
 *     responses:
 *       200:
 *         description: Succès de la requête, l'IPCSR a été modifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Statut de la requête et IPCSR modifié
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 ipcsr:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Identifiant de l'IPCSR
 *                     email:
 *                       type: string
 *                       description: Adresse courriel de l'IPCSR
 *                     matricule:
 *                       type: string
 *                       description: Matricule de l'IPCSR
 *                     nom:
 *                       type: string
 *                       description: Nom de l'IPCSR
 *                     prenom:
 *                       type: string
 *                       description: Prénom de l'IPCSR
 *                     departement:
 *                       type: string
 *                       description: Code du département de l'IPCSR
 *             example: {
 *               success: true,
 *               ipcsr: {
 *                 _id: 5d970a006a503f67d254124d,
 *                 email: dupond.jacques@email.fr,
 *                 matricule: 01020301,
 *                 nom: DUPOND,
 *                 prenom: Jacques,
 *                 departement: 93
 *               }
 *             }
 *
 *       403:
 *         description: L'utilisateur n'est pas autorisé à modifier cet IPCSR
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Vous n'êtes pas autorisé à modifier cet IPCSR ${prenom} ${nom} ${matricule} (${ipcsrId})
 *
 *       409:
 *         description: L'IPCSR ne peut pas être supprimé car il est sur des places qui lui sont réservées
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: "Impossible d'archiver cet inspecteur : il est associé à des places d'examens"
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * L'administrateur modifie les informations d'un inspecteur
 *
 * @callback updateIpcsr
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/put_admin_inspecteurs}
 */
router.put('/inspecteurs/:id', verifyUserLevel(config.userStatusLevels.delegue), updateIpcsr)

// router.patch('/inspecteurs/:id', updateIpcsr) // Activer/désactiver un inspecteur

/**
 * @swagger
 *
 * /admin/inspecteurs:
 *   put:
 *     tags: ["Administrateur"]
 *     summary: Ajout d'un IPCSR dans un département
 *     description: L'administrateur crée un IPCSR dans la base de données
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departement:
 *                 type: string
 *                 required: true,
 *                 example: 93
 *                 description: Valeur du département d'intervention de l'IPCSR
 *               email:
 *                 type: string
 *                 required: true,
 *                 example: jacques.dupont@example.com
 *                 description: Adresse courriel de l'IPCSR
 *               matricule:
 *                 type: string
 *                 required: true,
 *                 example: '059049585'
 *                 description: Matricule de l'IPCSR
 *               nom:
 *                 type: string
 *                 required: true,
 *                 example: 'Dupont'
 *                 description: Nom de l'IPCSR
 *               prenom:
 *                 type: string
 *                 required: true,
 *                 example: 'Jacques'
 *                 description: Prénom de l'IPCSR
 *     responses:
 *       200:
 *         description: Succès de la requête, l'IPCSR a été créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Statut de la requête et IPCSR créé
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 ipcsr:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Identifiant de l'IPCSR
 *                     email:
 *                       type: string
 *                       description: Adresse courriel de l'IPCSR
 *                     matricule:
 *                       type: string
 *                       description: Matricule de l'IPCSR
 *                     nom:
 *                       type: string
 *                       description: Nom de l'IPCSR
 *                     prenom:
 *                       type: string
 *                       description: Prénom de l'IPCSR
 *                     departement:
 *                       type: string
 *                       description: Code du département de l'IPCSR
 *             example: {
 *               success: true,
 *               ipcsr: {
 *                 _id: 5d970a006a503f67d254124d,
 *                 email: dupond.jacques@email.fr,
 *                 matricule: 01020301,
 *                 nom: DUPOND,
 *                 prenom: Jacques,
 *                 departement: 93
 *               }
 *             }
 *
 *       400:
 *         description: Au moins un des paramètres requis est absent
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Tous les champs sont obligatoires
 *
 *
 *       403:
 *         description: L'utilisateur n'est pas autorisé à créer cet IPCSR
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Vous n'êtes pas autorisé à créer cet IPCSR dans ce département
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * L'administrateur crée un IPCSR
 *
 * @callback createIpcsr
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/post_admin_inspecteurs}
 */
router.post('/inspecteurs', verifyUserLevel(config.userStatusLevels.delegue), createIpcsr)

// TODO: swagger
router.get('/places', verifyRepartiteurDepartement, getPlaces)

/**
 * @swagger
 * /admin/places:
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Chargement du planning des inspecteurs
 *     description: Permet de charger le planning des inspecteurs pour le département actif de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier au format CSV ou XLSX avec la liste des places
 *               departement:
 *                 type: string
 *                 description: le département actif selectionné par l'utilisateur
 *           example:
 *             file: planning-93.csv
 *             departement: 93
 *     responses:
 *       200:
 *         description: Retour d'une réussite de traitement de fichier
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileName:
 *                   type: string
 *                   description: Le nom de fichier en .csv ou .xlsx contenant les places
 *                 success:
 *                   type: boolean
 *                   description: vaut true
 *                 message:
 *                   type: string
 *                   description: Un message compréhensible par l'usager
 *                 places:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Les messages sur l'état de traitement des places
 *             example:
 *               fileName: planning-93.csv
 *               success: true
 *               message: Le fichier planning-93.csv a été traité pour le departement 93.
 *               places: [
 *                         {
 *                           "departement": "93",
 *                           "centre": "Bobigny",
 *                           "inspecteur": "5d9b04db0b279f003c677120",
 *                           "date": "2019-07-06T08:00:00.000+02:00",
 *                           "status": "error",
 *                           "message": "Place déjà enregistrée en base"
 *                         }, {
 *                           "departement": "93",
 *                           "centre": "Rosny sous bois",
 *                           "inspecteur": "5d9b04db0b279f003c677120",
 *                           "date": "2019-12-08T08:30:00.000+01:00",
 *                           "status": "success",
 *                           "message": "Place enregistrée en base"
 *                         },
 *                       ]
 *       400:
 *         description: Fichier manquant
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Fichier manquant
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 */
/**
 * Route pour charger le planning des inspecteurs par département
 * Cette route utilise le middleware [verifyRepartiteurDepartement]{@link module:routes/admin/middleware/verify-repartiteur-departement} et le controleur [importPlaces]{@link import('./places-controllers')..importPlaces}
 * @name Router POST '/admin/places'
 *
 * @see {@link import('./places-controllers')..importPlaces|Fonction importPlaces}
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/post_admin_places|Swagger: POST /admin/places}
 */
router.post('/places', verifyRepartiteurDepartement, createOrImportPlaceByAdmin)
// TODO: swagger
router.delete('/places/:id?', deleteByAdmin)
// TODO: swagger
router.patch('/places/:id', verifyRepartiteurDepartement, updatePlaces)

/**
 * @swagger
 *
 * /admin/bordereaux:
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Envoi des bordereaux aux inspecteurs selectionnés
 *     description: Permet d'envoyer par email, le planning de chaque inspecteurs.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departement:
 *                 type: number
 *                 example: 93
 *                 description: Valeur du département
 *               inspecteurIdListe:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['12345678909876543', '123456789098765432']
 *                 description: Liste des ids d'inspecteurs
 *               date:
 *                 type: string
 *                 example: 2019-10-10T22:00:00.000Z
 *                 description: Date sélectionnée pour l'envoi des bordereaux
 *               isForInspecteurs:
 *                 type: boolean
 *                 example: false
 *                 description: Permet de savoir si les bordereaux doivent être envoyés au répartiteur ou à l'inspecteur
 *     responses:
 *       500:
 *         description: Erreur lors de la récupération des départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Oups, un problème est survenu. L'administrateur a été prévenu.
 *       422:
 *         description: Erreur sur les paramètres qui ont été envoyés
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Les paramètres renseignés sont manquants.
 *       200:
 *         description: Stats par départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: true
 *                     message: Les bordereaux ont été envoyés.
 */

router.post(
  '/bordereaux',
  verifyRepartiteurDepartement,
  sendScheduleInspecteurs,
)

/**
 * @swagger
 *
 * /admin/stats-places-exams:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des statsKpi places
 *     description: Permet de récupérer les statistiques sur les places d'examens de chaque département.
 *     parameters:
 *       - in: query
 *         name: isCsv
 *         schema:
 *           type: string
 *           example: true
 *         description: Demande d'un fichier CSV des stats places d'examens
 *
 *     responses:
 *       500:
 *         description: Erreur lors de la récupération des départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Oups, un problème est survenu. L'administrateur a été prévenu.
 *       200:
 *         description: Stats par départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StatsKpiPlacesExams'
 */

router.get(
  '/stats-places-exams',
  verifyUserLevel(config.userStatusLevels.delegue),
  getStatsPlacesExam,
)

/**
 * @swagger
 *
 * /admin/stats-results-exams:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des statsKpi de résultats d'examens sur une période passée
 *     description: Permet de récupérer les statistiques sur les places d'examens de chaque département.
 *     parameters:
 *       - in: query
 *         name: beginPeriod
 *         schema:
 *           type: string
 *           example: 2019-10-10T22:00:00.000Z
 *         description: Date de début de période
 *         required: true
 *       - in: query
 *         name: endPeriod
 *         schema:
 *           type: string
 *           example: 2019-09-10T22:00:00.000Z
 *         description: Date de fin de période
 *         required: true
 *       - in: query
 *         name: isCsv
 *         schema:
 *           type: string
 *           example: true
 *         description: Demande d'un fichier CSV des stats résultats de place
 *
 *     responses:
 *       500:
 *         description: Erreur lors de la récupération des départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Oups, un problème est survenu. L'administrateur a été prévenu.
 *       200:
 *         description: Stats par départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StatsKpiResultsExams'
 */

router.get(
  '/stats-results-exams',
  verifyUserLevel(config.userStatusLevels.delegue),
  getStatsResultsExam,
)

/**
 * @swagger
 *
 * /admin/stats-candidats-retention:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des statsKpi des candidats en zone rétention sur la periode saisi
 *     description: Permet de récupérer les statistiques des candidats en zone rétention par département  sur la periode saisi.
 *     parameters:
 *       - in: query
 *         name: beginPeriod
 *         schema:
 *           type: string
 *           example: 2019-10-10T22:00:00.000Z
 *         description: Date de début de période
 *         required: true
 *       - in: query
 *         name: endPeriod
 *         schema:
 *           type: string
 *           example: 2019-09-10T22:00:00.000Z
 *         description: Date de fin de période
 *         required: true
 *       - in: query
 *         name: isCsv
 *         schema:
 *           type: string
 *           example: true
 *         description: Demande d'un fichier CSV des stats résultats de place
 *
 *     responses:
 *       500:
 *         description: Erreur lors de la récupération des départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Oups, un problème est survenu. L'administrateur a été prévenu.
 *       200:
 *         description: Stats par départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StatsKpiCandidatsLeaveRetentionArea'
 */

router.get(
  '/stats-candidats-retention',
  verifyUserLevel(config.userStatusLevels.delegue),
  getCandidatsLeaveRetentionArea,
)

/**
 * @swagger
 *
 * /admin/stats-candidats-retention-by-week:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des statsKpi des candidats en zone rétention sur 5 semaines
 *     description: Permet de récupérer les statistiques des candidats en zone rétention par département à compter de la date du jour plus 4 semaines.
 *     parameters:
 *       - in: query
 *         name: beginPeriod
 *         schema:
 *           type: string
 *           example: 2019-10-10T22:00:00.000Z
 *         description: Date de début de période
 *         required: true
 *       - in: query
 *         name: endPeriod
 *         schema:
 *           type: string
 *           example: 2019-09-10T22:00:00.000Z
 *         description: Date de fin de période
 *         required: true
 *       - in: query
 *         name: isCsv
 *         schema:
 *           type: string
 *           example: true
 *         description: Demande d'un fichier CSV des stats résultats de place
 *
 *     responses:
 *       500:
 *         description: Erreur lors de la récupération des départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Oups, un problème est survenu. L'administrateur a été prévenu.
 *       200:
 *         description: Stats par départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StatsKpiCandidatsLeaveRetentionArea'
 */

router.get(
  '/stats-candidats-retention-by-week',
  verifyUserLevel(config.userStatusLevels.delegue),
  getCandidatsLeaveRetentionAreaByWeekAndDepartement,
)

/**
 * @swagger
 *
 * /admin/last-sync-aurige-info:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération du jour et de l'heure du dernier passage du batch Aurige
 *     description: Permet de récupérer le jour et de l'heure ainsi qu'un message indiquant la derniere étape éffectué par le batch Aurige
 *     responses:
 *       500:
 *         description: Erreur lors de la récupération des informations du batch Aurige
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Oups, un problème est survenu. L'administrateur a été prévenu.
 *       200:
 *         description: Stats par départements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/lastSyncAurigeInfos'
 */

router.get('/last-sync-aurige-info', getInfoLastSyncAurige)

/**
 * @swagger
 *
 * /admin/whitelisted/{whitelistedId}:
 *   delete:
 *     tags: ["Administrateur"]
 *     summary: Suppression d'un élément de la liste blanche
 *     description: L'administrateur supprime une adresse de la liste blanche à partir de son id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: whitelistedId
 *         schema:
 *           type: string
 *           example: 5d970a082a7710570f0fd7b8
 *         required: true
 *         description: Identifiant de l'adresse à supprimer
 *       - in: query
 *         name: departement
 *         schema:
 *           type: number
 *           example: 93
 *         description: Un département accessible par l'admin
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhitelistedObject'
 *             example:
 *               _id: 5d970a082a7710570f0fd7b8
 *               email: candidat@candi.lib
 *               departement: 75
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * L'administrateur supprime une adresse de la whitelist
 *
 * @callback removeWhitelisted
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/delete_admin_whitelisted}
 */
router
  .route('/whitelisted/:id')
  .all(verifyRepartiteurDepartement)
  .delete(removeWhitelisted)

/**
 * @swagger
 *
 * /admin/whitelisted:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération d'éléments de la liste blanche
 *     description:
 *       L'administrateur récupère une ou plusieures adresses de la liste blanche.
 *       Si le paramètre `matching` n'est pas entré, cela renvoie les dernières adresses rentrées dans la base
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: matching
 *         schema:
 *           type: string
 *           example: dupont
 *         description: Une chaîne de caractères pour chercher une adresse dans la liste blanche
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description:
 *                 Liste des adresses trouvées.
 *                 Si le paramètre `matching` n'est pas entré, cette liste se trouve dans une propriétée `lastCreated`
 *               items:
 *                 $ref: '#/components/schemas/WhitelistedObject'
 *             example: [ {
 *               _id: 5d970a082a7710570f0fd7b8,
 *               email: candidat@candi.lib,
 *               departement: 75
 *               }]
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Ajout d'éléments dans la liste blanche
 *     description: L'administrateur ajoute une ou plusieures adresses dans la liste blanche.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Adresses à ajouter dans la base
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Une adresse courriel à ajouter dans la base
 *               emails:
 *                 type: array
 *                 description: Une liste d'adresses courriel à ajouter dans la base
 *                 items:
 *                   type: string
 *               departement:
 *                 type: string
 *                 description: Le département dans lequel l'adresse sera ajoutée
 *           example:
 *             email: dupont@jean.fr
 *             emails: [
 *               dupont1@jean.fr,
 *               dupont2@jean.fr
 *               ]
 *             departement: "93"
 *
 *     responses:
 *       201:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/WhitelistedObject'
 *                 - $ref: '#/components/schemas/WhitelistedInfo'
 *             examples:
 *               une seule adresse:
 *                 value:
 *                   _id: 5d970a082a7710570f0fd7b8
 *                   email: candidat@candi.lib
 *                   departement: 75
 *               plusieures adresses:
 *                 value:
 *                   code: 201
 *                   result: [{
 *                     code: 201,
 *                     email: dupont1@jean.fr,
 *                     success: true
 *                     },
 *                     {
 *                     code: 201,
 *                     email: dupont2@jean.fr,
 *                     success: true
 *                     }]
 *                   status: success
 *                   message: Tous les emails ont été ajoutés à la liste blanche
 *
 *       207:
 *         description: Succès de la requête, mais certaines adresses n'ont pu être enregistrées
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhitelistedInfo'
 *             example:
 *               code: 207
 *               result: [{
 *                 code: 201,
 *                 email: dupont1@jean.fr,
 *                 success: true
 *                 },
 *                 {
 *                 code: 400,
 *                 email: dupont,
 *                 success: false,
 *                 message: "Whitelisted validation failed: email: Path `email` is invalid (dupont)."
 *                 }]
 *               status: warning
 *               message: Certains emails n'ont pas pu être ajoutés à la liste blanche
 *
 *       400:
 *         description: Paramètres manquants
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Either "email" or "emails" parameter must be sent in body
 *
 *       401:
 *         $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       409:
 *         description: Conflit dans les paramètres
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Parameters "email" and "emails" cannot be sent in the same request

 *       422:
 *         description: Aucune adresse n'a pu être ajoutée à la liste
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhitelistedInfo'
 *             example:
 *               code: 422
 *               result: [{
 *                 code: 409,
 *                 email: dupont2@jean.fr,
 *                 success: false,
 *                 message: 'E11000 duplicate key error collection: candilib.whitelisted index: email_1 dup key: { : "dupont2@jean.fr" }'
 *                 },
 *                 {
 *                 code: 400,
 *                 email: dupont,
 *                 success: false,
 *                 message: "Whitelisted validation failed: email: Path `email` is invalid (dupont)."
 *                 }]
 *               status: error
 *               message: Aucun email n'a pu être ajouté à la liste blanche
 *
 *       500:
 *         $ref: '#/components/responses/UnknownErrorResponse'
 *
 */

/**
 * L'administrateur récupère ou ajoute une ou plusieures adresses de la liste blanche
 *
 * @callback getWhitelisted
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/get_admin_whitelisted}
 * @callback addWhitelisted
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/post_admin_whitelisted}
 */
router
  .route('/whitelisted')
  .all(verifyRepartiteurDepartement)
  .get(getWhitelisted)
  .post(addWhitelisted)

/**
 * @swagger
 *
 * /admin/users:
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Création d'un utilisateur
 *     description: Création d'un utilisateur. Seul un admin peut créer un délégué (il peut aussi créer un répartiteur) et seul un délégué peut créer un répartiteur.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du formulaire de création d'un utilisateur
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: repartiteur@example.com
 *                 description: Email de l'utilisateur
 *               departements:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: Département accessible par l'utilisateur
 *                 example: ["93"]
 *                 description: Départements de l'utilisateur
 *               status:
 *                 type: string
 *                 example: repartiteur
 *                 description: Statut de l'utilisateur
 *
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: true
 *                     message: L'utilisateur a bien été créé
 *                     user: {
 *                        "email": "répartiteur@example.com",
 *                        "id": "85958545487523245",
 *                        "departements": ["93"],
 *                        "status": "repartiteur"
 *                     }
 *
 *       400:
 *         description: Paramètre(s) manquant(s)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: L'utilisateur est déja enregistré en base
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *@see {@link http://localhost:8000/api-docs/#/Administrateur/post_admin_users}
 *
 */
router.post('/users', verifyDelegueLevel(), createUserController)

/**
 * @swagger
 *
 * /admin/users:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération d'un utilisateur
 *     description: Récupération d'un utilisateur. Seul un admin peut créer un délégué (il peut aussi créer un répartiteur) et seul un délégué peut créer un répartiteur.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du tableau de Récupération d'un utilisateur
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: repartiteur@example.com
 *                 description: Email de l'utilisateur
 *               departements:
 *                 type: array
 *                 example: ["93"]
 *                 description: Département de l'utilisateur
 *               status:
 *                 type: string
 *                 example: repartiteur
 *                 description: Statut de l'utilisateur
 *
 *
 *     responses:
 *       200:
 *         description: Utilisateur récupéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: true
 *                     message: L'utilisateur a bien été récupéré
 *                     user: {
 *                        "email": "répartiteur@example.com",
 *                        "id": "85958545487523245",
 *                        "departements": ["93"],
 *                        "status": "repartiteur"
 *                     }
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *@see {@link http://localhost:8000/api-docs/#/Administrateur/get_admin_users}
 *
 */
router.get('/users', verifyDelegueLevel(), getUsers)

/**
 * @swagger
 *
 * /admin/users:
 *   patch:
 *     tags: ["Administrateur"]
 *     summary: Modification d'un utilisateur
 *     description: Modification d'un utilisateur. Seul un admin peut modifier un délégué (il peut aussi modifier un répartiteur) et seul un délégué peut modifier un répartiteur.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du formulaire de modification d'un utilisateur
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: repartiteur@example.com
 *                 description: Email de l'utilisateur
 *               departements:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: Département accessible par l'utilisateur
 *                 example: ["93"]
 *                 description: Départements de l'utilisateur
 *               status:
 *                 type: string
 *                 example: repartiteur
 *                 description: Statut de l'utilisateur
 *
 *     responses:
 *       200:
 *         description: Utilisateur modifié
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: true
 *                     message: Les informations de l'utilisateur a bien été modifié
 *                     user: {
 *                        "email": "répartiteur@example.com",
 *                        "id": "85958545487523245",
 *                        "departements": ["93"],
 *                        "status": "repartiteur"
 *                     }
 *
 *       400:
 *         description: Paramètre(s) manquant(s)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: L'adresse courriel n'est pas valide
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/patch_admin_users}
 */

router.patch('/users', verifyDelegueLevel(), updatedInfoUser)

/**
 * @swagger
 *
 * /admin/users:
 *   delete:
 *     tags: ["Administrateur"]
 *     summary: Suppression d'un utilisateur
 *     description: Supression d'un utilisateur. Seul un admin peut supprimer un délégué (il peut aussi supprimer un répartiteur) et seul un délégué peut supprimer un répartiteur.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du formulaire de suppression d'un utilisateur
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: repartiteur@example.com
 *                 description: Email de l'utilisateur
 *               departements:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: Département accessible par l'utilisateur
 *                 example: ["93"]
 *                 description: Départements de l'utilisateur
 *
 *     responses:
 *       200:
 *         description: Département créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: true
 *                     message: L'utilisateur a bien été supprimé
 *                     user: {
 *                        "email": "répartiteur@example.com",
 *                        "id": "85958545487523245",
 *                        "departements": ["93"],
 *                        "status": "repartiteur"
 *                     }
 *
 *       400:
 *         description: Paramètre(s) manquant(s)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: L'utilisateur n'existe pas
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/delete_admin_users }
 */
router.delete('/users', verifyDelegueLevel(), archiveUserController)

/**
 * @swagger
 *
 * /admin/centres:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération des centres pour l'administrateur
 *     description: Retourne la liste complète des centres accessible par l'administrateur
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *                 centres:
 *                   type: array
 *                   description: Liste des centres
 *                   items:
 *                     $ref: '#/components/schemas/CenterObject'
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 */
router.get(
  '/centres',
  verifyUserLevel(config.userStatusLevels.delegue),
  getAdminCentres,
)

/**
 * @swagger
 *
 * /admin/centres:
 *   patch:
 *     tags: ["Administrateur"]
 *     summary: Modification d'un centre par l'administrateur
 *     description: Permet à un administrateur de modifier ou désactiver un centre
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du formulaire
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               centreId:
 *                 type: string
 *                 example: 5dce6ec901353671dead8959
 *                 description: Identifiant du centre affecté
 *               nom:
 *                 type: string
 *                 description: Nom du centre (de la ville du centre)
 *                 example: Noisy le Grand
 *               label:
 *                 type: string
 *                 description: Information complémentaire pour retrouver le point de rencontre du centre
 *                 example: Centre d'examen du permis de conduire de Noisy le Grand
 *               adresse:
 *                 type: string
 *                 description: Adresse du centre
 *                 example: 5 boulevard de Champs Richardets 93160 Noisy le Grand
 *               lon:
 *                 type: number
 *                 description: Longitude géographique du centre
 *                 example: 2.473647
 *               lat:
 *                 type: number
 *                 description: Latitude géographique du centre
 *                 example: 48.883956
 *               active:
 *                 type: boolean
 *                 description: État à donner au centre
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *                 message:
 *                   type: string
 *                   description: informations sur l'état de la requête
 *                   example: Le centre a bien été modifié
 *                 centre:
 *                   $ref: '#/components/schemas/CenterObject'
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       403:
 *         description: L'utilisateur n'a pas accès au centre
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Vous n'avez pas accès à ce centre
 *
 *       404:
 *         description: Le centre n'existe pas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Centre introuvable
 *
 *       409:
 *         description: Un centre avec le nouveau nom existe déjà, la modification ne peut donc pas s'effectuer
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Centre déjà présent dans la base de données
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 */
router.patch(
  '/centres',
  verifyUserLevel(config.userStatusLevels.delegue),
  modifyCentre,
)

/**
 * @swagger
 *
 * /admin/centres:
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Ajout d'un centre par un administrateur
 *     description: Permet à un administrateur d'ajouter un centre dans la base de données
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du formulaire
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom du centre (de la ville du centre)
 *                 example: Noisy le Grand
 *               label:
 *                 type: string
 *                 description: Information complémentaire pour retrouver le point de rencontre du centre
 *                 example: Centre d'examen du permis de conduire de Noisy le Grand
 *               adresse:
 *                 type: string
 *                 description: Adresse du centre
 *                 example: 5 boulevard de Champs Richardets 93160 Noisy le Grand
 *               lon:
 *                 type: number
 *                 description: Longitude géographique du centre
 *                 example: 2.473647
 *               lat:
 *                 type: number
 *                 description: Latitude géographique du centre
 *                 example: 48.883956
 *               departement:
 *                 type: string
 *                 description: Département du centre
 *                 example: "75"
 *
 *     responses:
 *       200:
 *         description: Succès de la requête
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Booléen à `true` si l'action a été effectuée en entier et correctement, à `false` sinon.
 *                 message:
 *                   type: string
 *                   description: informations sur l'état de la requête
 *                   example: Le centre a bien été créé
 *                 centre:
 *                   $ref: '#/components/schemas/CenterObject'
 *
 *       400:
 *         description: Certaines informations sont manquantes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Tous les paramètres doivent être correctement renseignés
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       403:
 *         description: L'utilisateur n'a pas accès au département dans lequel il veut créer le centre
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Vous n'avez pas accès à ce département
 *
 *       409:
 *         description: Le centre existe déjà dans la base de données
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Centre déjà présent dans la base de données
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 */
router.post(
  '/centres',
  verifyUserLevel(config.userStatusLevels.delegue),
  createCentre,
)

/**
 * @swagger
 *
 * /admin/departements:
 *   post:
 *     tags: ["Administrateur"]
 *     summary: Création d'un departement
 *     description: Permet de créer un département
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données du formulaire de création de département
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: departement94@example.com
 *                 description: Email du département
 *               departement:
 *                 type: string
 *                 example: "93"
 *                 description: Nom du département
 *
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: true
 *                     message: Le département 93 a bien été créé avec l'adresse courriel emaildepartement:@:example.com
 *
 *       400:
 *         description: Paramètre(s) manquant(s) ou le département est déjà existant
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Numéro de département non renseigné
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/post_admin_departements }
 */

router.post(
  '/departements',
  verifyUserLevel(config.userStatusLevels.admin),
  createDepartementsController,
)

/**
 * @swagger
 *
 * /admin/departements:
 *   get:
 *     tags: ["Administrateur"]
 *     summary: Récupération de tous les départements ou d'un seul
 *     description: Permet de créer un département
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Numéro du département ou sans paramètre
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: departement94@example.com
 *                 description: Email du département
 *               departement:
 *                 type: string
 *                 example: "93"
 *                 description: Nom du département
 *
 *     responses:
 *       200:
 *         description: Département créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                       success: true
 *                       result: [{
 *                          "email": "répartiteur@example.com",
 *                          "id": "93",
 *                       }]
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/get_admin_departements }
 */

router.get(
  '/departements/:id?',
  verifyUserLevel(config.userStatusLevels.delegue),
  getDepartementsController,
)

/**
 * @swagger
 *
 * /admin/departements:
 *   patch:
 *     tags: ["Administrateur"]
 *     summary: Mise à jour du département
 *     description: Permet de mettre à jour l'adresse email du département
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Numéro du département et nouvelle adresse courriel
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEmail:
 *                 type: string
 *                 example: departement94@example.com
 *                 description: Email du département
 *               departement:
 *                 type: string
 *                 example: "93"
 *                 description: Nom du département
 *
 *     responses:
 *       200:
 *         description: Département créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                       success: true
 *                       result: {
 *                          "email": "répartiteur@example.com",
 *                          "id": "93",
 *                       }
 *
 *       400:
 *         description: Paramètre(s) manquant(s)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                     success: false
 *                     message: Adresse courriel du département manquante, saisie invalide
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/patch_admin_departements }
 */

router.patch(
  '/departements/:id?',
  verifyUserLevel(config.userStatusLevels.admin),
  updateDepartementsController,
)

/**
 * @swagger
 *
 * /admin/departements:
 *   delete:
 *     tags: ["Administrateur"]
 *     summary: supprimer le département par son Id
 *     description: Permet de supprimer un département
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Numéro du département
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departement:
 *                 type: string
 *                 example: "93"
 *                 description: Nom du département
 *
 *     responses:
 *       200:
 *         description: Département créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/InfoObject'
 *                 - example:
 *                       success: true
 *                       message: Le département a bien été supprimé
 *
 *       401:
 *        $ref: '#/components/responses/InvalidTokenResponse'
 *
 *       500:
 *          $ref: '#/components/responses/UnknownErrorResponse'
 *
 * @see {@link http://localhost:8000/api-docs/#/Administrateur/delete_admin_departements }
 */

router.delete(
  '/departements/:id?',
  verifyUserLevel(config.userStatusLevels.admin),
  deleteDepartementController,
)
export default router
