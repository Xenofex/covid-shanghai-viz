export class Worker {
  static STOP = Symbol('stop')

  constructor(name) {
    this.name = name
  }

  queue = []
  start() {
    return new Promise(async resolve => {
      while(true) {
        if (this.queue.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }

        const job = this.queue.shift()
        if (job === Worker.STOP) {
          break
        }

        await job(this)
      }

      resolve()
    })
  }

  push(job) {
    this.queue.push(job)
  }

  stop() {
    this.queue.push(Worker.STOP)
  }
}

export class WorkerPool {
  static async execute(workerCount, executor) {
    const workerPool = new WorkerPool(workerCount)
    const promise = workerPool.start()
    await executor(workerPool)
    workerPool.stop()
    
    return promise
  }

  constructor(number) {
    this.pool = []
    for (let i = 0; i < number; i++) {
      this.pool.push(new Worker(`worker ${i}`))
    }
    this.cursor = 0
  }

  start() {
    return Promise.all(
      this.pool.map(worker => worker.start())
    )
  }

  stop() {
    this.pool.map(worker => worker.stop())
  }

  execute(job) {
    this._nextWorker().push(job)
  }

  _nextWorker() {
    const worker = this.pool[this.cursor]
    if (++this.cursor >= this.pool.length) {
      this.cursor = 0
    }

    return worker
  }
}