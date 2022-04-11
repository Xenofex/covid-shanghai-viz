const regex = /(\d+)月(\d+)日/

export function sortDate(d1, d2) {
  const match1 = d1.match(regex)
  const match2 = d2.match(regex)

  const month1 = parseInt(match1[1], 10)
  const month2 = parseInt(match2[1], 10)

  if (month1 !== month2) {
    return month1 - month2
  } else {
    const day1 = parseInt(match1[2], 10)
    const day2 = parseInt(match2[2], 10)

    return day1 - day2
  }
}