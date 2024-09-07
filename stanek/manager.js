import {
	getSettings, disableLogs, formatRam, calcAvailableRam, post
} from '../lib/sharedfunctions.js'

export async function main(ns) {
	var logs = ["sleep", "getHostname", "getServerMaxRam", "getScriptRam", "stanek.activeFragments",
		"isRunning", "getServerUsedRam", "scp", "exec", "rm"];
	disableLogs(ns, logs);

  const sharedfunctions = "lib/sharedfunctions.js";
	const settingsfile = "/stanek/settings.txt";
	var settings = getSettings(ns, settingsfile);

	var currentserver = ns.getHostname();
	var chargescript = settings.scripts.charge;

	if (currentserver == "home") {
		ns.tail();
	}

	// In most cases, we're running this from home. Just in case we aren't, verify that the charge script is moved over.
	if (!(ns.fileExists(chargescript, currentserver))) {
		ns.scp(chargescript, currentserver, "home");
	}

	// Tweak settings>limit to adjust the maximum charge we're going for.
	var limit = settings.settings.limit;
	var progress = 0;


	// Collect fragment data. If Stanek's Gift isn't populated, die.
	var fragments = ns.stanek.activeFragments();
	if (fragments.length == 0) {
		throw new Error("Make sure that Stanek's Gift is filled in before executing the Stanek Manager script.");
	}




	while (progress < fragments.length) {
		progress = 0;

		const settingsfile = "/stanek/settings.txt";
		var settings = getSettings(ns, settingsfile);

		// Tweak settings>limit to adjust the maximum charge we're going for.
		var limit = settings.settings.limit;

		// Tweak settings>maxusage>home or pserv to adjust the maximum RAM we're going for.
		if (currentserver == "home") {
			var maxRamUsage = settings.settings.maxusage.home;
		} else if (currentserver.includes("pserv")) {
			var maxRamUsage = settings.settings.maxusage.pserv;
		} else {
			var maxRamUsage = settings.settings.maxusage.other;
		}

		if (settings.use_pservers == true && currentserver == "home") {
			var pservList = ns.getPurchasedServers();
			if (pservList) {
				for (let pserv of pservList) {
					for (let script of Object.values(settings.scripts)) {
						if (!ns.fileExists(script, pserv)) {
							ns.print("Copied script for first time to " + pserv);
							ns.scp(script, pserv, "home");
						} else {
							ns.rm(script, pserv);
							ns.scp(script, pserv, "home");
						}
						if (!ns.fileExists(sharedfunctions,pserv)) {
							ns.print("copying shared functions over.");
							ns.scp(sharedfunctions, pserv, "home");
						} else {
							ns.rm(sharedfunctions, pserv);
							ns.scp(sharedfunctions, pserv, "home");
						}
					}
					if (!ns.isRunning(settings.scripts.manager, pserv)) {
						ns.exec(settings.scripts.manager, pserv);
					}
				}
			}
		}

		if (settings.use_otherservs == true && currentserver == "home") {
			const otherServerList = JSON.parse(ns.read("../Temp/servicehosts.txt"));
			for (let otherserver of Object.keys(otherServerList)) {
				for (let script of Object.values(settings.scripts)) {
					if (!ns.fileExists(script, otherserver)) {
						ns.print("Copied " + script + " for first time to " + otherserver);
						ns.scp(script, otherserver, "home");
					} else {
						ns.rm(script, otherserver);
						ns.scp(script, otherserver, "home");
					}
				}
				if (!ns.isRunning(settings.scripts.manager, otherserver)) {
					ns.exec(settings.scripts.manager, otherserver);
				}
			}
		}

		if (settings.use_home == false && currentserver == "home") {
			ns.print("use_home is false. killing Stanek Manager on Home.");
			return;
		}

		for (let fragment of fragments) {
			if (fragment.effect == "1.1x adjacent fragment power") { progress++; continue; }
			if (fragment.highestCharge < limit) {

				// Adjust settings>Maxusage to control the percentage of total RAM on the target server that the script can use. Initial settings is 0.9 (90%).
				var availableram = (ns.getServerMaxRam(ns.getHostname()) * maxRamUsage) - ns.getServerUsedRam(ns.getHostname());
				var threads = Math.floor(availableram / ns.getScriptRam(chargescript, currentserver));

				// execute the chargescript and wait until it finishes.
				if (threads > 1) {
					const pid = ns.run(chargescript, threads, fragment.x, fragment.y);
					if (!pid) {
						post(ns, "WARNING: Failed to charge Stanek with " + threads + " threads thinking there was " + formatRam(availableram) + " free on " +
							currentserver + ". Check if another script is fighting stanek.js for RAM. Will try again later...");
						continue;
					} else {
						while (ns.isRunning(pid, currentserver)) {
							await ns.sleep(100);
						}
					}
				} else {
					//ns.print("Insufficient RAM to support even 1 thread. Sleeping.");
					await ns.sleep(100);
				}
			} else {
				ns.print("Fragment " + fragment.id + " has reached limit (" + limit + "). Skipping.");
				progress++;
			}
		}
		var fragments = ns.stanek.activeFragments();
	}
	post(ns, "Stanek's Gift has hit the set limit (" + limit + "). Closing.");
}