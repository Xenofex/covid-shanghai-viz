import {readdir, readFile, writeFile} from 'fs/promises'
import {sortDate} from './docs/sort_date.mjs'

const files = await readdir('docs/data')
files.sort(sortDate)
const result = []
for (const filename of files) {
  const fullPath = `docs/data/${filename}`
  const rawData = JSON.parse(await readFile(fullPath, {encoding: 'utf-8'}))
  const dataOfDay = { 
    date: filename.replace('.json', ''), 
    data: {}
  }

  for (const districtName in rawData) {
    const { cases, asymptomaticCases } = rawData[districtName]
    dataOfDay.data[districtName] = { cases, asymptomaticCases }
  }
  
  result.push(dataOfDay)
}

await writeFile('docs/summary.json', JSON.stringify(result))