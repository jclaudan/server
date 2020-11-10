import { saveManyLogActionsCandidat } from '../../models/log-actions-candidat'

async function saveAccumulatorWithBulk () {
  try {
    // console.log(`currentAccumulator.length => ${accumulatorLog.get().length}`, { accumulatorLogGet: accumulatorLog.get() })
    if (accumulatorLog.get().length) {
      const accuClone = accumulatorLog.get().slice()
      const result = await saveManyLogActionsCandidat(accuClone)
      accumulatorLog.resetAccumulator()
      // console.log(`currentAccumulator.length => ${accumulatorLog.get().length}`, { accumulatorLogGet: accumulatorLog.get(), result })
      console.log(`-------------------------SAVE_OK[${process.pid}]_SIZE[${result.length}]-------------------------`)
      return
    }

    // console.log(`-------------------------NOK[${process.pid}]-------------------------`)
  } catch (error) {
    console.log(`-------------------------SAVE_NOK[${process.pid}]-------------------------`)
    console.log({ error })
  }
}

export function saveAccumulatorAsIntervalOf (intervalInMilscd) {
  // const intervalId = setInterval(saveAccumulatorWithBulk, intervalInMilscd)
  accumulatorLog.intervalId = setInterval(saveAccumulatorWithBulk, intervalInMilscd)
}

export const accumulatorLog = {
  intervalId: undefined,
  buffer: [],
  get () {
    return this.buffer
  },
  set (logRequest) {
    this.buffer.push(logRequest)
  },
  resetAccumulator () {
    this.buffer = []
  },
}

// TODO: Changé l'emplacement du lancement la fonction suivante
// 3min
const timerSetting = 180000
// const timerSetting = 10000
saveAccumulatorAsIntervalOf(timerSetting)

// const getBodyKeysNames = (body) => {
//   const keysNameList = []
//   for (const keyName in JSON.parse(body)) {
//     // console.log({ keyName, bodyParsed: JSON.parse(body) })
//     keysNameList.push(keyName)
//   }
//   return keysNameList
// }

export const setAccumulatorRequest = async (req, res, next) => {
  // const oldWrite = res.write
  const oldEnd = res.end

  // const chunks = []

  // res.write = function (/* chunk */) {
  //   // chunks.push(chunk)

  //   return oldWrite.apply(res, arguments)
  // }

  const {
    method,
    // params,
    path,
    userId,
  } = req

  res.end = function (/* chunk */) {
    // if (chunk) { chunks.push(chunk) }

    // const body = Buffer.concat(chunks).toString()

    accumulatorLog.set({
      // TODO: Si la reponse est un Array l prendre en compte
      // responseBody: getBodyKeysNames(body),
      method,
      // params,
      path,
      requestedAt: new Date().toJSON(),
      status: res.statusCode.toString(),
      candidat: userId,
    })

    // console.log(`PME2_NODE[ ${process.pid} ] SIZE:[${accumulatorLog.get().length}]`)
    // Permet de supprimé les résidue du `chunks`
    // chunks = []
    oldEnd.apply(res, arguments)
  }

  next()
}
