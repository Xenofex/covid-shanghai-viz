export async function setupChart({onClick}={}) {
  const summary = await (await fetch('summary.json')).json()
  const categoryData = []
  const seriesDefault = {
    type: 'bar',
    stack: 'total',
    // label: { show: true },
  }
  const casesSeries = {
    ...seriesDefault,
    name: '新增确诊病例',
    data: []
  }
  const asymptomaticCasesSeries = {
    ...seriesDefault,
    name: '新增无症状',
    data: []
  }
  const seriesData = [casesSeries, asymptomaticCasesSeries]
  for (const {date, data} of summary) {
    const m = date.match(/(.*)月(.*)日/)
    categoryData.push(`${m[1]}/${m[2]}`)
    casesSeries.data.push(
      Object.values(data).reduce(
        (r, d) => r + (d.cases || 0), 0
      )
    )
    asymptomaticCasesSeries.data.push(
      Object.values(data).reduce(
        (r, d) => r + (d.asymptomaticCases || 0), 0
      )
    )
  }

  const chartDom = document.querySelector('.date-chart')
  const myChart = echarts.init(chartDom);
  window.onresize = function() {
    myChart.resize();
  };
  const option = {
    // legend: {
    //   orient: 'horizontal',
    //   bottom: 10,
    // },
    tooltip: {},
    legend:  {},
    grid: {
      left: '35px',
      top: '0px',
      bottom: '50px'
    },
    xAxis: { 
      type: 'value',
      axisLabel: { 
        rotate: 45,
        formatter: value => `${Math.round(value / 1000)}k`
      } 
    },
    yAxis: { 
      type: 'category', 
      data: categoryData,
      selectedMode: 'single',
      triggerEvent: true,
    },
    series: seriesData
  }

  myChart.setOption(option)

  if (onClick) {
    let mousedown = false
    
    myChart.on('mousedown', (e) => {
      mousedown = true
      onClick(e)
    })
  
    myChart.on('mousemove', (e) => {
      if (mousedown) {
        onClick(e)
      }
    })
  
    myChart.on('mouseup', (e) => {
      mousedown = false
      onClick(e)
    })
  }
}