import { test } from 'uvu'
import { WorkerPool } from "../worker.mjs"

test('hello', async () => {
  console.log('hello test')

  await WorkerPool.execute(10, (workerPool) => {
    for (let i = 0; i < 100; i++) {
      workerPool.execute((worker) => {
        console.log(`in `, worker.name, ' item: ', i)
      })
    }
  })
})

test.run()