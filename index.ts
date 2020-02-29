import chalk from 'chalk'
import fetch from 'node-fetch'
import pMap from 'p-map'
import querystring from 'querystring'
import { URL } from 'url'
import 'console.table'

interface Result {
  ok: boolean
  logId: number
  error: string
  reason: string
}

interface SyncResult {
  ok: boolean
  status: number
  logUrl: string
  data: Result
}

const sync = async (name: string): Promise<SyncResult> => {
  const url = new URL(`${name}/sync`, 'https://r.npm.taobao.org')
  url.search = querystring.stringify({ nodeps: true, publish: false })

  try {
    const resp = await fetch(url.toString(), {
      method: 'PUT',
    })
    const result: Result = await resp.json()
    const logUrl = new URL(
      `${name}/sync/log/${result.logId}`,
      'https://r.npm.taobao.org',
    ).toString()
    return {
      data: result,
      logUrl,
      ok: result.ok && resp.ok,
      status: resp.status,
    }
  } catch (e) {
    return Promise.reject(e)
  }
}

const build = async (): Promise<void> => {
  const resp = await fetch(
    'https://raw.githubusercontent.com/poooi/poi/master/assets/data/plugin.json',
  )
  const data = await resp.json()

  const results = await pMap(
    Object.keys(data),
    async name => {
      try {
        const result = await sync(name)
        if (!result.ok || result.data.reason) {
          console.error(
            chalk.red(
              `${name}: ${result.data.error}: ${result.data.reason}`,
            ),
          )
          return {
            name,
            status: '❌',
            url: result.logUrl,
          }
        }


        return {
          name,
          status: '✨',
          url: result.logUrl,
        }

      } catch (e) {
        console.error(e)
        return {
          name,
          status: '❌',
          url: 'N/A',
        }
      }
    },
    { concurrency: 2 },
  )

  console.table(results)
}

const main = async (): Promise<void> => {
  try {
    await build()
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
}

if (require.main === module) {
  main()
}
