/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import locales from '../data/static/locales.json'
import fs from 'node:fs/promises'
import { type Request, type Response, type NextFunction } from 'express'

type LanguageEntry = { key: string, lang: any, icons: string[], shortKey: string, percentage: number, gauge: string }

let cachedLanguages: LanguageEntry[] | null = null

export function getLanguageList () { // TODO Refactor and extend to also load backend translations from /i18n/*json and calculate joint percentage/gauge
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (cachedLanguages) {
        res.status(200).json(cachedLanguages)
        return
      }

      const i18nDir = 'frontend/dist/frontend/assets/i18n/'
      const [enRaw, languageFiles] = await Promise.all([
        fs.readFile(i18nDir + 'en.json', 'utf-8'),
        fs.readdir(i18nDir)
      ])
      const enContent = JSON.parse(enRaw)
      const totalStrings = Object.keys(enContent).length

      const fileContents = await Promise.all(
        languageFiles.map(async (fileName) => ({
          fileName,
          content: JSON.parse(await fs.readFile(i18nDir + fileName, 'utf-8'))
        }))
      )

      const languages: LanguageEntry[] = []
      for (const { fileName, content } of fileContents) {
        if (fileName === 'en.json' || fileName === 'tlh_AA.json') continue
        let differentStrings = 0
        for (const key in content) {
          if (Object.prototype.hasOwnProperty.call(content, key) && content[key] !== enContent[key]) {
            differentStrings++
          }
        }
        const percentage = (differentStrings / totalStrings) * 100
        const key = fileName.substring(0, fileName.indexOf('.'))
        const locale = locales.find((l) => l.key === key)
        languages.push({
          key,
          lang: content.LANGUAGE,
          icons: locale?.icons as string[],
          shortKey: locale?.shortKey as string,
          percentage,
          gauge: (percentage > 90 ? 'full' : (percentage > 70 ? 'three-quarters' : (percentage > 50 ? 'half' : (percentage > 30 ? 'quarter' : 'empty'))))
        })
      }

      languages.push({ key: 'en', icons: ['gb', 'us'], shortKey: 'EN', lang: 'English', percentage: 100, gauge: 'full' })
      languages.sort((a, b) => a.lang.localeCompare(b.lang))

      cachedLanguages = languages
      res.status(200).json(languages)
    } catch (err: any) {
      next(new Error(`Unable to retrieve language files: ${err.message}`))
    }
  }
}
