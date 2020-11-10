/**
 * Model LogActionsCandidat
 * @module models/log-actions-candidat/log-actions-candidat-model
 */

import mongoose from 'mongoose'

const { Schema } = mongoose
const ObjectId = Schema.Types.ObjectId

const LogActionsCandidatSchema = new Schema(
  {
    candidat: {
      type: ObjectId,
      required: true,
      trim: true,
      ref: 'Candidat',
    },
    method: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    // params: {
    //   type: Array,
    //   required: false,
    // },
    // responseBody: {
    //   type: Array,
    //   required: false,
    // },
    status: {
      type: String,
      required: true,
    },
    // dateTime
    requestedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// LogActionsCandidatSchema.index({ date: 1, inspecteur: 1 }, { unique: true })
// LogActionsCandidatSchema.index({ candidat: 1, booked: 1 }, { unique: true, sparse: true })
// LogActionsCandidatSchema.index({ centre: 1, date: 1, inspecteur: 1 })
// LogActionsCandidatSchema.index({ createdAt: 1, visibleAt: 1, centre: 1, date: 1, candidat: 1 }, { sparse: true })

const model = mongoose.model('LogActionsCandidat', LogActionsCandidatSchema)

/**
 * @typedef {Object} LogActionsCandidatModel
 * @property {ObjectId} userId
 * @property {String} method
 * @property {String} path
 * @property {Array[String]} params
 * @property {Array[String]} responseBody
 * @property {String} status
 * @property {date} requestedAt
 */
export default model
