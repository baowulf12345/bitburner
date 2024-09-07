import { getServers, post, factionhosts, disableLogs, checkNsInstance, getSettings, calcAvailableRam } from '/lib/sharedfunctions.js'

export async function main(ns) {

	//ns.tail();

	const logs = ["sleep", "scan", "getHackingLevel", "getServerMoneyAvailable", "getServerMaxMoney", "getServerRequiredHackingLevel",
		"getServerMaxRam", "getServerSecurityLevel"];
	disableLogs(ns, logs);

	function startGo() {
		var homeStats = ns.getServer("home");
		var scriptRam = ns.getScriptRam("/go/manager.js", "home");
		var availRam = homeStats.maxRam - homeStats.ramUsed;
		if (homeStats.maxRam > 128 && scriptRam < availRam) {
			ns.exec("/go/manager.js", "home");
			return "Go Manager is starting.";
		} else {
			return "Insufficient home server RAM to begin Go Manager.";
		}
	}

	function monitorGo() {
		if (!(ns.isRunning("go/manager.js", "home"))) {
			startGo;
		} else {
			const settingsfile = "go/settings.txt";
			const gosettings = getSettings(ns, settingsfile);
			const statsfile = "go/stats.txt";
			const gostats = getSettings(ns, statsfile);

			var opponent = ns.go.getOpponent();
			if (gostats[opponent]["wins"]) { var wins = gostats[opponent]["wins"]; } else { var wins = 0; }
			var result = "GO: Opponent: " + opponent + " WinRate: " +
				((wins / (gostats[opponent]["losses"] + gostats[opponent]["wins"])) * 100).toFixed(2) + "% " + "Bonus: " +
				gostats[opponent]["bonusDescription"] + " Bonus%: " + (gostats[opponent]["bonusPercent"]).toFixed(2) + "%";
			return result;
		}
	}

	function getHostDetails(target) {
		var money = ns.getServerMoneyAvailable(target);
		var maxmoney = ns.getServerMaxMoney(target);
		var security = parseFloat(ns.getServerSecurityLevel(target).toFixed(2));
		var minsec = parseFloat((ns.getServer(target).minDifficulty).toFixed(2));
		var percent = parseFloat((money / maxmoney).toFixed(2)) * 100;
		var rhl = ns.getServerRequiredHackingLevel(target);
		var results = "HOST:" + target + " RHL:" + rhl + " $:" + ns.formatNumber(money) + " $MAX:" + ns.formatNumber(maxmoney) + " %of$:" + parseInt(percent) + "% SEC:" + security + " minsec:" + minsec;
		return results;
	} // getHostDetails


	function getformulas(target) {
		var hackchance = ((ns.formulas.hacking.hackChance(ns.getServer(target), ns.getPlayer()) * 100).toFixed(2) + "%");
		var hack_exp = ns.formulas.hacking.hackExp(ns.getServer(target), ns.getPlayer()).toFixed(2);
		var hackpct = ns.formulas.hacking.hackPercent(ns.getServer(target), ns.getPlayer()).toFixed(4);
		var hcktime = ((ns.formulas.hacking.hackTime(ns.getServer(target), ns.getPlayer()) / 60000).toFixed(2) + " min");
		var growtime = ((ns.formulas.hacking.growTime(ns.getServer(target), ns.getPlayer()) / 60000).toFixed(2) + " min");
		var weakntime = ((ns.formulas.hacking.weakenTime(ns.getServer(target), ns.getPlayer()) / 60000).toFixed(2) + " min");
		var formula_results = "HChance:" + hackchance + " H%: " + hackpct + "% HExp:" + hack_exp + " HTime:" + hcktime + " GTime:" + growtime + " WTime:" + weakntime;
		return formula_results;
	} // getformulas

	function startStocks(minimum) {
		if (!ns.isRunning("stockmaster.js") && ns.getServerMoneyAvailable('home') > minimum) {
			var result = "Starting Stock Master";
			ns.exec("stockmaster.js", "home");
		} else if (!ns.isRunning("stockmaster.js") && ns.getServerMoneyAvailable('home') <= minimum) {
			var result = "Waiting for " + minimum / 1e12 + "M saved before kicking off Stock Master.";
		} else {
			var result = "Stock Master is running.";
		}
		return result;
	}

		function checkBatches() {
		const hostmap = new Map();
		var hosts = getServers(ns);
		for (let host of hosts) {
			if (ns.isRunning("batch/batchmanager.js", "home", host) || ns.isRunning("batch/manager.js", "home", host)) {
				hostmap.set(host, ns.getServerMaxMoney(host));
			}
		}
		if (hostmap.size > 0) {
			const sortedHosts = [...hostmap.entries()]
				.sort((a, b) => b[1] - a[1])
				.filter(([host, servermoney]) => servermoney <= ns.getServerMaxMoney(host));

			return sortedHosts;
		} else {
			return;
		}
	}

	function getBatchStats() {
		const statsfile = "batch/stats.txt";
		const stats = getSettings(ns, statsfile);
		for (let entry of Object.keys(stats)) {
			ns.tprint("Batcher is Running: " + JSON.stringify(stats[entry]));
		}
		return;
	}

	////////////////////////////////////////////////////////////

	const hostmap = new Map();
	const minimum_for_stockmaster = 25e7;

	while (true) {
		const settingsfile = "globalsettings.txt";
		const settings = getSettings(ns, settingsfile);
		const hosts = getServers(ns);
		var homeStats = ns.getServer("home");

		for (let host of hosts) {
			hostmap.set(host, ns.getServerRequiredHackingLevel(host));
		}
		const sortedHosts = [...hostmap.entries()]
			.sort((a, b) => b[1] - a[1])
			.filter(([host, hackingLevel]) => hackingLevel <= ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)
			.slice(0, 10);


		// Start monitor displayed output.
		ns.tprint("MONITOR:");

		// calculates and prints current "TOP" and old "TOP" servers.
		// Check for a new "TOP" server. If there is one, execute quick_add and newhosttasks to nuke it.
		var current_top = sortedHosts.entries().next().value[1][0];
		if (old_top != "fulcrumassets") {
			ns.tprint("old_top: " + old_top);
			ns.tprint("current_top: " + current_top);
		}
		if (old_top !== null && current_top !== old_top) {
			ns.tprint("NEW TOP HOST FOUND: " + current_top);
			post(ns, "NEW TOP HOST FOUND: " + current_top);
			ns.exec(settings.scripts.hacking.newhost, "home", 1, current_top);
			await ns.sleep(1000);
			ns.exec(settings.scripts.hacking.backdoor, "home");
			var qathreads = Math.floor(((ns.getServerMaxRam("home") * 0.9) - ns.getServer("home").ramUsed) / ns.getScriptRam(settings.scripts.hacking.quickadd, "home"));
			if (!(ns.isRunning(settings.scripts.hacking.newhost, "home", current_top))) {
				if (qathreads > 200) { qathreads = 200; }
				if (qathreads > 1) {
					//ns.tprint("Executing quick_add against " + current_top);
					//ns.exec("quick_add.js", "home", 1, current_top, qathreads);
					await ns.sleep(1000);
				} else {
					await ns.sleep(100);
				}
			}
		}

		// Checks if the batcher is running and print stats if it is.
		var batches = checkBatches();
		if (batches) {
			getBatchStats();
		}


		// Start Go Manager and display some stats.
		var gostatus = monitorGo();
		ns.tprint(gostatus);

		// Initiates Stock Master if it isn't already running and our available funds are greater than the minimum_for_stockmaster.
		if (settings.monitor.managers.stockmanager) {
			startStocks(minimum_for_stockmaster);
		}

		// Check if Faction Manager is running. If it isn't, check if we have enough RAM to support it (early game concern) before starting it.
		if (settings.monitor.managers.factionmanager) {
			if (!ns.isRunning(settings.scripts.managers.factionmanager, "home")) {
				if (ns.getServerMaxRam("home") > 128) {
					ns.exec(settings.scripts.managers.factionmanager, "home");
				}
			}
		}

		// Check if Income Delta Monitor is running. If it isn't, start it.
		if (settings.monitor.managers.incomedelta) {
			if (!ns.isRunning(settings.scripts.managers.incomedelta, "home")) {
				if (ns.getServerMaxRam("home") > 128) {
					ns.exec(settings.scripts.managers.incomedelta, "home");
				}
			}
		}

		// If Gang Management script nor its igniter is running, start the igniter.
		// We're doing a RAM check because there's an extremely high likelihood that we'll have at least 8192GB of RAM prior to us meeting
		// the prerequisites for running Gang Management, so there's no need to waste the RAM prior to that. Once we're over 8192GB,
		// the script's RAM cost is negligible.
		if (settings.monitor.managers.gangmanager) {
			if (ns.heart.break() > 54000 * -1) {
				if ((!ns.isRunning(settings.scripts.managers.gangmanager)) && (!ns.isRunning(settings.scripts.support.gangstarter))) {
					if (ns.getServerMaxRam("home") > 8192) {
						ns.exec(settings.scripts.support.gangstarter, "home");
					}
				}
			}
		}

		// Start sleeve manager.
		if (settings.monitor.managers.sleevemanager) {
			if (!(ns.isRunning(settings.scripts.managers.sleevemanager, "home", "--disable-bladeburner"))) {
				ns.exec(settings.scripts.managers.sleevemanager, "home", 1, "--disable-bladeburner");
			}
		}

		// Start Jobs Manager.
		if (settings.monitor.managers.jobmanager) {
			if (ns.getPlayer().skills.hacking > 200) {
				if (!(ns.isRunning(settings.scripts.managers.jobmanager, "home"))) {
					//ns.exec("jobs/jobmanager.js", "home");
				}
			}
		}

		// Start Stats.
		if (ns.fileExists(settings.scripts.support.stats) && !ns.isRunning(settings.scripts.support.stats, "home")) {
			ns.exec(settings.scripts.support.stats, "home", 1);
		}

		// start the home stats upgrader, if needed.
		if (homeStats.maxRam < 2 ** 22 || homeStats.cpuCores < 8) {
			if (!ns.isRunning("/start/home-upgrade.js", "home")) {
				if (calcAvailableRam(ns, "home") > ns.getScriptRam("/start/home-upgrade.js", "home")) {
					ns.exec("/start/home-upgrade.js", "home");
				}
			}
		}

		// Run contractor to solve any outstanding contracts.
		ns.exec(settings.scripts.support.contracts, "home");

		// If we don't have root access to an accessible host, trigger newhosttasks.js to nuke it.
		// Additionally, collect data from the device for reporting in the terminal window.
		for (const [host, level] of sortedHosts) {
			if (!ns.hasRootAccess(host)) {
				if (ns.getServerMaxMoney(host) > 0) {
					ns.exec(settings.scripts.hacking.newhost, "home", 1, host);
				}
			}
			const details = getHostDetails(host);

			// This is the part that actually displays the monitor results.
			if (ns.fileExists("Formulas.exe")) {
				const formula_results = getformulas(host);
				ns.tprint(details + " " + formula_results);
			} else {
				ns.tprint(details);
			}
		} // for
		var old_top = current_top;

		await ns.sleep(120000);
	} // while
} // main