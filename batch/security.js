/** @param {NS} ns */
import { getServers,getSettings,disableLogs } from '../lib/sharedfunctions.js'

export async function main(ns) {
	ns.tail();
	const logs = ["sleep","getHackingLevel","getServerMaxRam","getServerRequiredHackingLevel","scan"];
	disableLogs(ns, logs);


	// The purpose of this script is to ensure that, if the batcher is running, no other scripts are targeting the same target.
	var settings = getSettings(ns, "../globalsettings.txt");
	var exceptions = [];
	for (let batchentry of Object.values(settings.scripts.hacking.batch)) {
		exceptions.push(batchentry);
	}
	for (let managerentry of Object.values(settings.scripts.hacking.manager)) {
		if (managerentry == "manager/manager.js") { continue; }
		exceptions.push(managerentry);
	}
	exceptions.push(settings.scripts.managers.batchmanager);
	exceptions.push(settings.scripts.managers.hacknetmanager);

	function killothers(target, server, exceptions) {
		var serverscripts = ns.ps(server);
		for (let script of serverscripts) {
			var bscheck = false;
			for (let bscript of exceptions) {
				if (script.filename == bscript || script.filename == ns.getScriptName()) {
					bscheck = true;
					break;
				}
			}
			if (!(bscheck)) {
				if (script.args == target) {
					ns.print("Possible script for kill.");
					ns.print(script);
					ns.kill(script.pid);
				}
			}
		}
	}

	while (true) {
		const hostmap = new Map();
		const hosts = getServers(ns);
		for (let host of hosts) {
			hostmap.set(host, ns.getServerRequiredHackingLevel(host));
		}
		const sortedHostsWithRam = [...hostmap.entries()]
			.sort((a, b) => b[1] - a[1])
			.filter(([host, hackingLevel]) => hackingLevel <= ns.getHackingLevel() && ns.getServerMaxRam(host) > 0)


		for (const [host, level] of sortedHostsWithRam) {
			killothers(ns.args[0], host, exceptions);
		}
		await ns.sleep(15000);
	}
}