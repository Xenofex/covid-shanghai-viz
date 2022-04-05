import { JSDOM } from 'jsdom'
import { readdir, readFile, writeFile } from 'fs/promises'

const dataFile = 'www/data.json'

const data = JSON.parse(await readFile(dataFile))

async function parseFile(path) {
  const content = await readFile(`html/${path}`)
  const dom = new JSDOM(content)
  const title = dom.window.document.querySelector('.Article-title, #activity-name').textContent
  const date = title.match(/\d+月\d+日/)[0]

  if (data[date]) {
    return
  }

  data[date] = {}

  const article = dom.window.document.querySelector('.Article_content, #js_content')
  let district, m, addressStart = false

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

      data[date][district.name] = district

    }

    if (text.match(/^.*区$/)) {
      setDistrict(text)
      continue
    }

    if (text.indexOf('分别居住于') >= 0) {
      if ((m = text.match(/，(.*?区)新增\d+例本土确诊病例/))) {
        setDistrict(m[1])
      }

      if (m = text.match(/(\d+)例本土确诊病例/)) {
        district.cases = parseInt(m[1], 10)
      }
  
      if (m = text.match(/(\d+)例本土无症状感染者/)) {
        district.asymptomaticCases = parseInt(m[1], 10)
      }

      continue
    }

    if (district && text.indexOf('消毒') < 0) district.addresses.push(text)
  }
}

const files = await readdir('html')

for (let file of files) {
  await parseFile(file)
}

await writeFile(dataFile, JSON.stringify(data))