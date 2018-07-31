import Promise from "bluebird";
import chalk from "chalk";
import childProcess from "child_process";
import { each, padEnd, split, truncate } from "lodash";
import fetch from "node-fetch";
import util from "util";

const execAsync = util.promisify(childProcess.exec);

const LENGTH = 16;

const build = async () => {
  const resp = await fetch(
    "https://raw.githubusercontent.com/poooi/poi/master/assets/data/plugin.json"
  );
  const data = await resp.json();

  return Promise.map(
    Object.keys(data),
    async name => {
      try {
        const { stdout, stderr } = await execAsync(`yarn cnpm sync ${name}`);
        const prefix = padEnd(
          truncate(name.replace("poi-plugin-", ""), { length: LENGTH }),
          LENGTH
        );
        if (stderr) {
          each(split(stderr, "\n"), word =>
            console.error(chalk.bgRed(prefix), word)
          );
        } else {
          each(split(stdout, "\n"), word =>
            console.info(chalk.bgBlue(prefix), word)
          );
        }
      } catch (e) {
        console.error(e);
      }
    },
    { concurrency: 3 }
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
