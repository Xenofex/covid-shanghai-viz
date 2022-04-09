import { JSDOM } from 'jsdom'
import { readdir, readFile, writeFile } from 'fs/promises'

const dataFile = 'docs/data.json'

const data = JSON.parse(await readFile(dataFile))

async function parseFile(path) {
  const content = await readFile(`html/${path}`)
  const dom = new JSDOM(content)
  const title = dom.window.document.querySelector('.Article-title, #activity-name').textContent
  const date = title.match(/\d+月\d+日/)[0]

  // if (!date.match(/4月4日/) && data[date]) {
  //   return
  // }

  data[date] = {}

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

      data[date][district.name] = district

    }

    if (text.match(/^.*区$/)) {
      setDistrict(text)
      continue
    }

    if (text.indexOf('分别居住于') >= 0) {
      if ((m = text.match(/，(.*?区?)(?:无)?新增.*?确诊病例/))) {
        let districtName = m[1]
        if (!districtName.endsWith("区")) {
          districtName += "区"
        }
        setDistrict(districtName)
      }

      if (m = text.match(/(?:(\d+例)|无新增).*?确诊病例.*?(?:(\d+例)|无新增).*?无症状感染者/)) {
        district.cases = parseInt(m[1], 10) || 0
        district.asymptomaticCases = parseInt(m[2], 10) || 0
      }

      // if (m = text.match(/无新增.*?确诊病例/)) {
      //   district.cases = 0
      // } else if (m = text.match(/新增(\d+)例.*?确诊病例/)) {
      //   district.cases = parseInt(m[1], 10)
      // }

      // if (m = text.match(/(\d+)例[^，、]*?无症状感染者/)) {
      //   district.asymptomaticCases = parseInt(m[1], 10)
      // } else if (m = text.match(/无新增.*?无症状感染者/)) {
      //   district.asymptomaticCases = 0
      // }

      continue
    }

    if (district && !text.match(/消毒|编辑/)) {
      if (text.includes('、')) {
        district.addresses.concat(text.split("、"))
      } else {
        district.addresses.push(text)
      }
    }
  }
}

const files = await readdir('html')

for (let file of files) {
  await parseFile(file)
}

await writeFile(dataFile, JSON.stringify(data))