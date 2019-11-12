import Bluebird from "bluebird";
import chalk from "chalk";
import fetch from "node-fetch";
import querystring from "querystring";
import { URL } from "url";

interface IResult {
  ok: boolean;
  logId: number;
  error: string;
  reason: string;
}

interface ISyncResult {
  ok: boolean;
  status: number;
  logUrl: string;
  data: IResult;
}

const sync = async (name: string): Promise<ISyncResult> => {
  const url = new URL(`${name}/sync`, "https://r.npm.taobao.org");
  url.search = querystring.stringify({ nodeps: true, publish: false });

  try {
    const resp = await fetch(url.toString(), {
      method: "PUT"
    });
    const result: IResult = await resp.json();
    const logUrl = new URL(
      `${name}/sync/log/${result.logId}`,
      "https://r.npm.taobao.org"
    ).toString();
    return {
      data: result,
      logUrl,
      ok: result.ok && resp.ok,
      status: resp.status
    };
  } catch (e) {
    return Promise.reject(e);
  }
};

const build = async () => {
  const resp = await fetch(
    "https://raw.githubusercontent.com/poooi/poi/master/assets/data/plugin.json"
  );
  const data = await resp.json();

  return Bluebird.map(
    Object.keys(data),
    async name => {
      try {
        const result = await sync(name);
        if (!result.ok || result.data.reason) {
          console.error(
            chalk.red(
              `❌ ${name} [${result.status}] ${result.data.error}: ${result.data.reason} ${result.logUrl}`
            )
          );
        } else {
          console.info(chalk.green(`✨ ${name} [OK] ${result.logUrl}`));
        }
      } catch (e) {
        console.error(e);
      }
    },
    { concurrency: 2 }
  );
};

const main = async () => {
  try {
    await build();
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
};

main();
