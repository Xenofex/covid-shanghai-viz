// https://api.map.baidu.com/geocoding/v3/?address=北京市海淀区上地十街10号&output=json&ak=您的ak

import fetch from 'node-fetch'
import { readFile, writeFile } from 'fs/promises'

const ak = 'xbFGU3Ikuc2Gmu4Od2cdriVZ6wKpTczl'

async function geocode(address) {
  return await fetch(`https://api.map.baidu.com/geocoding/v3/?address=${address}&output=json&ak=${ak}`)
}

const data = JSON.parse(await readFile('www/data.json'))

const addressMapFile = 'www/addressMap.json'

const addressMap = JSON.parse(await readFile(addressMapFile))

for (const date in data) {
  const dataOfDay = data[date]
  for (const districtName in dataOfDay) {
    const district = dataOfDay[districtName]
    const { addresses } = district
    for (const address of addresses) {
      const fullAddress = districtName + address

      if (addressMap[fullAddress]) continue

      const response = await geocode(fullAddress)
      const {result} = await response.json()
      console.debug(`${fullAddress}: `, result)
      if (result?.location) {
        addressMap[fullAddress] = result.location  
      }
    }
  }

  await writeFile(addressMapFile, JSON.stringify(addressMap))
}