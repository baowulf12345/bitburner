import { disableLogs, post } from '/lib/sharedfunctions.js'

export async function main(ns) {
	const logs = ["sleep","getServerMaxRam","getHackingLevel","getServerMaxMoney","getServerRequiredHackingLevel"];
	disableLogs(ns, logs);

	// Get target server name from script argument
	const target = ns.args[0];
	post(ns, "Onboarding " + target);

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

	// Open needed ports on target server and nuke it.
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
			ns.tprint("Respawning onboard_host.js for " + target);
			ns.spawn(ns.getScriptName(), 1, target);
		}
	}

	// Copy self_target.script to target server and run it with available RAM
	const targetRam = ns.getServerMaxRam(target);
	if (targetRam > 0 && !target.includes("pserv") && !target.includes("hacknet") && target != "home") {
		ns.print(target + " has ram, and is not a purchased-server, hacknet, or home.");
		if (ns.getHackingLevel() > ns.getServerRequiredHackingLevel(target) && ns.getServerMaxMoney(target) > 0) {
			ns.print(target + " is within hacking level and has money.");
			const selfTargetScript = "self_target.js";
			const threads = parseInt(Math.floor(targetRam / ns.getScriptRam(selfTargetScript)));
			if (threads > 1) {
				ns.print(target + " has enough RAM for " + threads + " threads.");
				if (!(ns.fileExists("/batch/settings.txt", target))) {
					ns.print("Killing scripts on " + target);
					await ns.killall(target);
					ns.print("Removing old instance of Self Target Script");
					await ns.rm(selfTargetScript, target);
					ns.print("Copying new instance of self target script to " + target);
					await ns.scp(selfTargetScript, target);
					ns.print("executing self-target script on " + target + "with " + threads + " threads.");
					ns.exec(selfTargetScript, target, threads);
					post(ns, "Host " + target + " Threads: " + threads + " Used RAM: " + ns.getServerUsedRam(target) + "/" + ns.getServerMaxRam(target));
				} else {
					ns.print(target + " has batch/settings.txt - refusing to run self_target.");
				}
			}
		}
	} else {
		ns.tprint("Host Added:" + target + " Max RAM: " + ns.getServerMaxRam(target));
	}
}