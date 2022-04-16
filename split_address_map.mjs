import { readdir, readFile, writeFile } from 'fs/promises'
import { basename } from 'path'

const dateDir = 'docs/data/date'

const files = await readdir(dateDir)
const addressMap = JSON.parse(await readFile('docs/addressMap.json', { encoding: 'utf-8'}))

for (const dateJson of files) {
  const dataOfDate = JSON.parse(await readFile(dateDir + '/' + dateJson, { encoding: 'utf-8' }))

  for (const district in dataOfDate) {
    const dataOfDistrict = dataOfDate[district]

    if (dataOfDistrict.addressWithLocation) continue

    const addressWithLocation = []
  
    for (const address of dataOfDistrict.addresses) {
      const fullAddress = district + address
      const { lng, lat } = addressMap[fullAddress]
      addressWithLocation.push([address, lat, lng])
    }

    dataOfDistrict.addressWithLocation = addressWithLocation
    delete dataOfDistrict.addresses
  }

  await writeFile(`docs/data/${basename(dateJson)}`, JSON.stringify(dataOfDate))
}