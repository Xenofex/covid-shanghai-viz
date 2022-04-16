import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import fetch from 'node-fetch'
import { readdir, readFile, writeFile } from 'fs/promises'
import { WorkerPool } from './worker.mjs'

const ak = process.env.BAIDU_MAP_API_KEY

async function geocode(address) {
  return await fetch(`https://api.map.baidu.com/geocoding/v3/?address=${address}&output=json&ak=${ak}`)
}

// const data = JSON.parse(await readFile('docs/data.json'))
const dateFiles = (await readdir('docs/data')).filter(s => s.endsWith('.json'))
const addressMapFile = 'docs/addressMap.json'
const addressMap = JSON.parse(await readFile(addressMapFile))
let addressMapUpdated = false

for (const dateFile of dateFiles) {
  const dateFileFullPath = `docs/data/${dateFile}`
  const dataOfDay = JSON.parse(await readFile(dateFileFullPath, { encoding: 'utf8'}))
  
  await WorkerPool.execute(5, async (workerPool) => {
    for (const districtName in dataOfDay) {
      const district = dataOfDay[districtName]
      const { addresses } = district
      if (!addresses) continue

      delete district.addresses
      const addressWithLocation = district.addressWithLocation = []

      for (const address of addresses) {
        const fullAddress = districtName + address
        let location = addressMap[fullAddress]

        if (location) {
          addressWithLocation.push([address, location.lat, location.lng])
        } else {
          workerPool.execute(async () => {
            const address1 = address
            const response = await geocode(fullAddress)
            const {result} = await response.json()
            console.debug(`${fullAddress}: `, result)
            if (result?.location) {
              addressMap[fullAddress] = result.location
              if (!addressMapUpdated) addressMapUpdated = true
            }

            addressWithLocation.push([address1, location.lat, location.lng])
          })
        }
      }
    }
  })

  await writeFile(dateFileFullPath, JSON.stringify(dataOfDay))
}

if (addressMapUpdated) await writeFile(addressMapFile, JSON.stringify(addressMap))
await writeFile('docs/dates.json', JSON.stringify(dateFiles.map(s => s.match(/\d+月\d+日/)[0])))