import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import fetch from 'node-fetch'
import { readFile, writeFile } from 'fs/promises'
import { WorkerPool } from './worker.mjs'

const ak = process.env.BAIDU_MAP_API_KEY

async function geocode(address) {
  return await fetch(`https://api.map.baidu.com/geocoding/v3/?address=${address}&output=json&ak=${ak}`)
}

const data = JSON.parse(await readFile('docs/data.json'))

const addressMapFile = 'docs/addressMap.json'

const addressMap = JSON.parse(await readFile(addressMapFile))

await WorkerPool.execute(10, async (workerPool) => {
  for (const date in data) {
    // if (date !== '3月18日') {
    //   continue
    // }

    const dataOfDay = data[date]
    
    for (const districtName in dataOfDay) {
      const district = dataOfDay[districtName]
      const { addresses } = district
      for (const address of addresses) {
        const fullAddress = districtName + address
  
        if (addressMap[fullAddress]) continue

        workerPool.execute(async () => {
          const response = await geocode(fullAddress)
          const {result} = await response.json()
          console.debug(`${fullAddress}: `, result)
          if (result?.location) {
            addressMap[fullAddress] = result.location  
          }
        })
      }
    }
  
    await writeFile(addressMapFile, JSON.stringify(addressMap))
  }
})
