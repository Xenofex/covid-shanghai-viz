import { JSDOM } from 'jsdom'
import { readdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

const districtRegex = /(浦东新|黄浦|静安|徐汇|长宁|普陀|虹口|杨浦|宝山|闵行|嘉定|金山|松江|青浦|奉贤|崇明).*(?:确诊病例|无症状感染者)/
const symptomaticRegex = /(\d+例|无新增)[^，]*?确诊病例|确诊病例(\d+例)/
const asymptomaticRegex = /((?<=新增)\d+|无新增)[^，]*无症状感染者|无症状感染者(\d+例)/

async function parseFile(path) {
  let date = path.match(/\d+月\d+日/)?.[0]
  const dateFile = `docs/data/${date}.json`
  const skipDates = ['4月17日', '4月18日']
  if (existsSync(dateFile) && !skipDates.includes(date)) return

  const content = await readFile(`html/${path}`)
  const dom = new JSDOM(content)
  const title = dom.window.document.querySelector('.Article-title, #activity-name').textContent
  date = title.match(/\d+月\d+日/)[0]

  const data = {}

  const article = dom.window.document.querySelector('.Article_content, #js_content')
  let district, m

  for (let node of article.querySelectorAll('p')) {
    if (node.querySelector('section[data-role]')) {
      continue
    }

    const text = node.textContent.trim()

    if (!text) continue

    function setDistrict(name) {
      district = {
        name: name,
        cases: undefined,
        asymptomaticCases: undefined,
        addresses: []
      }

      data[district.name] = district
    }

    if (m = text.match(districtRegex)) {
      setDistrict(m[1] + '区')

      if (m = text.match(symptomaticRegex)) {
        district.cases = parseInt(m[1] || m[2], 10) || 0
      }

      if (m = text.match(asymptomaticRegex)) {
        district.asymptomaticCases = parseInt(m[1] || m[2], 10) || 0
      }

      continue
    }

    if (district && !text.match(/消毒|编辑|资料/)) {
      text.split(/、|，/).forEach((address) => {
        address = address.trim()
        if (address) {
          district.addresses.push(address.replace(/(、|，|。)$/, ''))
        }
      })
    }
  }

  await writeFile(dateFile, JSON.stringify(data))
}

const files = await readdir('html')

for (let file of files) {
  if (file.endsWith('.html')) {
    await parseFile(file)
  }
}
