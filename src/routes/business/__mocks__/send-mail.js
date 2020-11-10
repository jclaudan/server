import getMailData from '../message-templates'
import { AURIGE_OK } from '../../../util'

let mails = []
let mail

export const getMails = () => mails
export const getMail = () => mail

export const __initMail = () => (mail = undefined)
export const deleteMails = () => (mails = [])

export const sendMail = async (to, { subject, content: html } = {}) => {
  mails.push({ to, subject, html })
  mail = { to, subject, html }
  return true
}

export const sendMailToAccount = async (candidat, flag) => {
  const message = await getMailData(candidat, flag)
  return sendMail(candidat.email, message)
}

export const sendMagicLink = async candidat => {
  const message = await getMailData(candidat, AURIGE_OK)
  return sendMail(candidat.email, message)
}
