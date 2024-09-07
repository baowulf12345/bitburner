/** @param {NS} ns */
import { getServers, factionhosts, disableLogs, calcAvailableRam, post, getSettings } from '/lib/sharedfunctions.js'

export async function main(ns) {
	const logs = ["scan", "sleep", "getServerRequiredHackingLevel", "getServerMaxMoney", "getHackingLevel",
		"getServerMaxRam", "getScriptRam", "getServerUsedRam","getPlayer"];
	disableLogs(ns, logs);
	ns.tail();
	const targets = getServers(ns);

	// If we just started this bitnode, we need to reset our settings files.
	if (ns.getResetInfo().lastNodeReset < 300000) {
		await ns.exec("reset.js","home",1);
	}

  // Grab global settings.
	const settingsfile = "globalsettings.txt";
	const settings = getSettings(ns, settingsfile);

	// Buy Tor and get missing scripts from "darkweb".
	if ((ns.singularity.getDarkwebPrograms()).length == 0) {
		ns.tprint("Executing First Run script, since we don't have any darkweb programs yet.");
		ns.exec("/singularity/firstrun.js", "home", 1);
	}



	var targetcount = 0;
	var targetArray = [];
	var serviceHosts = {};
	for (const target of targets) {
		if (target == "home") { continue; }
		if (target.includes("pserv")) { continue; }
		if (target.includes("hacknet")) { continue; }
		if (factionhosts.includes(target)) { continue; }
		if (ns.getHackingLevel() > ns.getServerRequiredHackingLevel(target) && ns.getServerMaxMoney(target) > 0) {
			targetArray.push(target);
			targetcount++;
		}
		if (ns.getServerMaxRam(target) > 0) {
			serviceHosts[target] = ns.getServerMaxRam(target);
		}
		ns.exec(settings.scripts.hacking.newhost, "home", 1, target);
		//ns.exec("arg_target0.js", "home", 10, target);

		await ns.sleep(100);
	}
	ns.write("/Temp/servicehosts.txt", JSON.stringify(serviceHosts, null, 2), "w");

	if (ns.getServerMaxRam("home") > 65536) {

		// Clear out any existing arg_target scripts, then rerun locals.
		for (var i = 0; i < 5; i++) {
			var scriptName = "arg_target" + i + ".js";
			ns.scriptKill(scriptName, "home");
		}
		ns.exec("/local/run_locals.js", "home", 1, targetcount);
	} else {
		// take half of the available ram, divided by the ram cost of the script, then divided by the number of available targets.
		// Round down to nearest integer and that's how many threads we can get away with per host.
		var availableRam = Math.floor(calcAvailableRam(ns, "home"));
		var scriptRAM = ns.getScriptRam("arg_target0.js");
		var arrayLength = targetArray.length;
		var threadCount = Math.floor(((availableRam / 2) / scriptRAM) / arrayLength);
		post(ns, "availRAM=" + availableRam + "; scriptRAM=" + scriptRAM + "; arrLength=" + arrayLength + "; threadCount=" + threadCount);
		for (const hacktarget of targetArray) {
			if (threadCount <= 10) { threadCount = 10; }
			for (var i = 0; i < 5; i++) {
				var scriptName = "arg_target" + i + ".js";
				ns.scriptKill(scriptName, "home");
			}
			ns.exec("arg_target0.js", "home", threadCount, hacktarget);
		}
	}

	if (!ns.isRunning("monitorV3.js")) {
		ns.tprint("Running MonitorV3.js");
		ns.exec("monitorV3.js", "home");
	}

	for (let manager of Object.keys(settings.monitor.managers)) {
		availableRam = Math.floor(calcAvailableRam(ns, "home"));
		if (settings.monitor.managers[manager] == true
		&& !ns.isRunning(settings.scripts.managers[manager])
		&& availableRam > ns.getScriptRam(settings.scripts.managers[manager])) {
			post(ns, "Starting " + manager);
			ns.exec(settings.scripts.managers[manager],"home");
		}
	}

	for (const factionhost of factionhosts) {
		if (ns.getHackingLevel() > ns.getServerRequiredHackingLevel(factionhost) && !(ns.hasRootAccess(factionhost)) && (calcAvailableRam(ns, "home")) > ns.getScriptRam("factiontasks.js")) {
			ns.exec("factiontasks.js", "home", 1, factionhost);
			await ns.sleep(3000);
		}
	}
}