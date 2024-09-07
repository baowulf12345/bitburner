import { getServers } from '/lib/sharedfunctions.js'

export async function main(ns) {
  // Get target server name from script argument
  const target = ns.args[0];

  // Identify how many port opener scripts we have.
  const portopeners = new Array(
    "bruteSSH.exe", "FTPCrack.exe", "HTTPWorm.exe", "relaySMTP.exe", "SQLInject.exe"
  )
  var openercount = 0;
  for (let opener of portopeners) {
    if (ns.fileExists(opener, "home")) {
      openercount++;
    }
  }

  // Open needed ports on target server
  if (!ns.hasRootAccess(target)) {
    if (openercount >= ns.getServerNumPortsRequired(target)) {
      if (ns.getServerNumPortsRequired(target) > 0) {
        await ns.brutessh(target);
      }
      if (ns.getServerNumPortsRequired(target) > 1) {
        await ns.ftpcrack(target);
      }
      if (ns.getServerNumPortsRequired(target) > 2) {
        await ns.relaysmtp(target);
      }
      if (ns.getServerNumPortsRequired(target) > 3) {
        await ns.httpworm(target);
      }
      if (ns.getServerNumPortsRequired(target) > 4) {
        await ns.sqlinject(target);
      }
      await ns.nuke(target);
    } else {
      while (openercount < ns.getServerNumPortsRequired(target)) {
        ns.tprint("Waiting for more port openers in order to hack " + target);
        await ns.sleep(60000);
        openercount = 0;
        for (let opener of portopeners) {
          if (ns.fileExists(opener, "home")) {
            openercount++;
          }
        }
      }
      ns.tprint("Respawning factiontasks.js for " + target);
      ns.spawn(ns.getScriptName(), 1, target);
    }
  }

  // Copy arg_target.script to target server and run it with available RAM
  if (ns.getServerMaxRam(target) > 0) {
    var limit = 10;
    const hostmap = new Map();
    const hosts = getServers(ns);
    for (let host of hosts) {
      hostmap.set(host, ns.getServerRequiredHackingLevel(host));
    }
    var sortedHosts = [...hostmap.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([host, hackingLevel]) => hackingLevel < ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)
      .slice(0, limit);

    var argScript = "arg_target.js";
    var threads = parseInt(Math.floor(ns.getServerMaxRam(target) / ns.getScriptRam(argScript)));
    if (!ns.isRunning(argScript, target, sortedHosts[5][0])) {
      await ns.killall(target);
      await ns.scp(argScript, target);
      await ns.exec(argScript, target, threads, sortedHosts[5][0]);
      ns.tprint("FactionTasks Completed on " + target + ". Threads:" + threads + " arg_target:" + sortedHosts[5][0]);
    } else {
      ns.tprint(argScript + " is already running on " + target + " with Threads:" + threads + " arg_target:" + sortedHosts[5][0]);
    }
  }

  // Sleep the script until we have a high enough hacking level to backdoor the server.
  while (ns.getServerRequiredHackingLevel(target) > ns.getHackingLevel()) {
    await ns.sleep(10000);
  }

  if (!(ns.getServer(target).backdoorInstalled)) {
    ns.tprint("Installing Backdoor on " + target);


    // Below is how to automate backdoor install if you don't have SF4.1+.
    // I can call connect.js, get the commands to connect to the target host, connect, then run backdoor.
    // This only works if I'm staring at the terminal when it is executed.
    // This also consumes a ridiculous amount of RAM.
		/*
    const terminalInput = document.getElementById('terminal-input');
    terminalInput.value = "home; run connect.js " + target;
    var handler = Object.keys(terminalInput)[1];
    terminalInput[handler].onChange({ target: terminalInput });
    terminalInput[handler].onKeyDown({ key: 'Enter', preventDefault: () => null });
    await ns.sleep(500);
    terminalInput.value = "backdoor";
    handler = Object.keys(terminalInput)[1];
    terminalInput[handler].onChange({ target: terminalInput });
    terminalInput[handler].onKeyDown({ key: 'Enter', preventDefault: () => null });
		*/
		
		//Idea #2: execute connect.js, then run the installbackdoor.
		await ns.exec("connect.js","home",1,target);
		
    await ns.singularity.installBackdoor();
    ns.tprint("Backdoor installed on " + target + ". Verify.");
  } else {
    ns.tprint("Backdoor already installed on " + target);
  }
}