/** @param {NS} ns */
import { getSettings, post } from '../lib/sharedfunctions.js'

export async function main(ns) {
	// if we don't have formulas, die gracefully.
	ns.disableLog("ALL");
	ns.tail();
	if (!ns.fileExists("Formulas.exe", "home")) {
		throw new Error("This script requires Formulas.exe.");
	}

	var settingsfile = "batch/settings.txt";
	var settings = getSettings(ns, settingsfile);
	ns.print("Initial Settings loaded.");

	if (settings.overridetarget == "true") {
		ns.print("target override from settings: " + settings.newtarget);
		var target = settings.newtarget;
	} else {
		var target = ns.args[0];
		ns.print("Target set by arg: " + target);
	}

	var batchcount = 0;
	var beginlooptime = Date.now();
	var estprofit = 0;
	var loops = 0;
	var peakLoop = 0;


	ns.print("Beginning loop.");
	while (true) {
		batchcount++;
		settings = getSettings(ns, settingsfile);

		//ns.print(JSON.stringify(settings));

		if (settings.overridetarget == "true") {
			post(ns, "Batch target override from settings: " + settings.newtarget);
			var target = settings.newtarget;
		} else {
			var target = ns.args[0];
		}

		var seedfilename = "batch/seeds/" + target + "_seeddata.txt";
		if (ns.fileExists(seedfilename, "home")) {
			var hostsettings = (getSettings(ns, seedfilename))["settings"];
		} else {
			var hostsettings = settings;
		}

		if (!(ns.isRunning("batch/security.js", "home", target))) {
			ns.exec("batch/security.js", "home", 1, target);
		}

		// collecting some static data and defining some constants.
		var serverStats = ns.getServer(target);
		var homeservstats = ns.getServer("home");

		// This dictates the percent of money from the target host we're going to try to steal.
		var multiplier = hostsettings.multiplier;

		function hackdata(target, availablemoney, multiplier) {
			var results = {};
			results["anhack"] = availablemoney / ns.hackAnalyze(target);
			results["anhackthreads"] = Math.ceil(ns.hackAnalyzeThreads(target, availablemoney * multiplier / 100));
			results["anhacksec"] = ns.hackAnalyzeSecurity(results["anhackthreads"], target);
			results["hacktime"] = ns.getHackTime(target);
			return results;
		}

		var weakeninfo = {};
		var growinfo = {};
		var execinfo = {};
		var seeddata = {};
		var batchmon = {};
		var stats = {};
		serverStats = ns.getServer(target);
		var growscript = hostsettings.scripts.growscript;
		var hackscript = hostsettings.scripts.hackscript;
		var weakenscript = hostsettings.scripts.weakenscript;
		var growscheduler = hostsettings.scripts.sched_grow;
		var hackscheduler = hostsettings.scripts.sched_hack;
		var weakenscheduler = hostsettings.scripts.sched_weaken;
		var homeavailableRam = (ns.getServerMaxRam("home") * 0.8) - ns.getServerUsedRam("home");
		var growthtime = ns.getGrowTime(target);
		var hacktime = ns.getHackTime(target);
		var weakentime = ns.getWeakenTime(target);
		var growram = ns.getScriptRam(growscript, "home");
		var hackram = ns.getScriptRam(hackscript, "home");
		var weakram = ns.getScriptRam(weakenscript, "home");
		var schedulerram = ns.getScriptRam(hostsettings.scripts.scheduler, "home");


		// seeing if we can tweak the serverStats for a hypothetical.
		if (serverStats.moneyAvailable === serverStats.moneyMax) {
			//ns.print("server is currently at max money, so we're fudging some numbers to do calcs.");
			serverStats.moneyAvailable = serverStats.moneyMax * ((100 - multiplier) / 100);
		}

		var missingmoney = serverStats.moneyMax - serverStats.moneyAvailable;
		var testnumber = missingmoney / serverStats.moneyMax + 1;
		//ns.print("testnumber: " + testnumber);
		//ns.print("missingmoney: " + missingmoney);
		//ns.print("maxmoney: " + serverStats.moneyMax);

		var hackinfo = hackdata(target, serverStats.moneyAvailable, multiplier);


		var growthreads = ns.formulas.hacking.growThreads(serverStats, ns.getPlayer(), serverStats.moneyMax, homeservstats.cpuCores);
		var growamount = ns.formulas.hacking.growAmount(serverStats, ns.getPlayer(), growthreads, homeservstats.cpuCores);
		var growpercent = ns.formulas.hacking.growPercent(serverStats, growthreads, ns.getPlayer(), homeservstats.cpuCores);
		var growsec = ns.growthAnalyzeSecurity(Math.ceil(growthreads), target, homeservstats.cpuCores);
		var hackpercent = ns.formulas.hacking.hackPercent(serverStats, ns.getPlayer());
		var maxthreads = Math.floor(execinfo.homeavailableRAM / Math.max(hackinfo.hackRAM, growinfo.growRAM, weakeninfo.weakenRAM, execinfo.schedulerram));
		if (maxthreads < 1) { maxthreads = 1; }
		var weakan = ns.weakenAnalyze(1, homeservstats.cpuCores);
		var secdiff = serverStats.hackDifficulty - serverStats.minDifficulty;

		if (serverStats.hackDifficulty === serverStats.minDifficulty) {
			//ns.print("weak Threads is going to be 0. server is at min sec.(" + serverStats.minDifficulty + ")");
			var weakthreads = Math.ceil((growsec + hackinfo.anhacksec) / weakan);
		} else {
			var weakthreads = Math.ceil(secdiff / weakan);
		}

		estprofit = hackinfo["anhackthreads"] * (serverStats.moneyAvailable * ns.hackAnalyze(target));

		//restoring getServer to accurate info after we've done hypotheticals.
		serverStats = ns.getServer(target);

		hackinfo["hackRAM"] = hackram;
		var hackthreads = Math.floor((multiplier / 100) / hackpercent);
		if (hackthreads < 1) { hackthreads = 1; }
		hackinfo["hackthreads"] = hackthreads;
		weakeninfo["weakanalyze"] = weakan;
		if (weakthreads < 1) { weakthreads = 1; }
		weakeninfo["weakthreads"] = weakthreads;
		weakeninfo["weakentime"] = weakentime;
		weakeninfo["weakenRAM"] = weakram;
		if (growthreads < 1) { growthreads = 1; }
		growinfo["growthreads"] = growthreads;
		growinfo["growper"] = growpercent;
		growinfo["growsec"] = growsec;
		growinfo["growtime"] = growthtime;
		growinfo["growRAM"] = growram;
		execinfo["schedulerram"] = schedulerram;
		execinfo["target"] = target;
		execinfo["multiplier"] = multiplier;
		execinfo["growscript"] = growscript;
		execinfo["hackscript"] = hackscript;
		execinfo["weakenscript"] = weakenscript;
		execinfo["homeavailableRAM"] = homeavailableRam;
		execinfo["maxthreads"] = maxthreads;
		execinfo["growscheduler"] = growscheduler;
		execinfo["hackscheduler"] = hackscheduler;
		execinfo["weakenscheduler"] = weakenscheduler;
		stats["target"] = target;
		stats["multiplier"] = multiplier;
		stats["delay"] = settings["delay"];
		stats["maxthreads"] = maxthreads;
		stats["count"] = ns.formatNumber(batchcount);
		stats["runtime"] = ns.formatNumber((Date.now() - beginlooptime) / 60000) + " minutes";
		stats["preparer"] = false;
		seeddata["execinfo"] = execinfo;
		seeddata["serverstats"] = serverStats;
		seeddata["homeservstats"] = homeservstats;
		seeddata["hackinfo"] = hackinfo;
		seeddata["growinfo"] = growinfo;
		seeddata["weakeninfo"] = weakeninfo;
		seeddata["settings"] = settings;
		seeddata["stats"] = stats;

		ns.write("/batch/seeds/" + target + "_seeddata.txt", JSON.stringify(seeddata, null, 2), "w");

		function serverDataCollection(target, server, settings) {
			var data = {};
			if (ns.serverExists(server)) {
				var serverStats = ns.getServer(server);
				var availableram = serverStats.maxRam * 0.8 - serverStats.ramUsed;
				serverData[server] = {
					"availableram": availableram,
					"maxthreads": Math.floor(availableram / Math.max(hackinfo.hackRAM, growinfo.growRAM, weakeninfo.weakenRAM, execinfo.schedulerram))
				}
				if (!(server == "home")) {
					for (let copyscript of Object.keys(settings.scripts)) {
						if (!(ns.fileExists(settings.scripts[copyscript], server))) {
							ns.scp(settings.scripts[copyscript], server, "home");
						}
					}
					if (!(ns.fileExists("/batch/seeds/" + target + "_seeddata.txt", server))) {
						ns.scp("/batch/seeds/" + target + "_seeddata.txt", server, "home");
					} else {
						ns.rm("/batch/seeds/" + target + "_seeddata.txt", server);
						ns.scp("/batch/seeds/" + target + "_seeddata.txt", server, "home");
					}
				}
			}
			return serverData;
		}

		var serverData = {};
		var priorityMap = new Map();
		var requiredRam = growinfo.growRAM + hackinfo.hackRAM + weakeninfo.weakenRAM + execinfo.schedulerram;
		serverData["home"] = serverDataCollection(target, "home", settings)["home"];
		if (settings.use_home == "true") {
			priorityMap.set("home", 3);
		}
		if (settings.use_pservers == "true") {
			var pservList = ns.getPurchasedServers();
			if (pservList) {
				for (let pserv of pservList) {
					if (ns.getServer(pserv).maxRam < requiredRam) { continue; }
					serverData[pserv] = serverDataCollection(target, pserv, settings)[pserv];
					priorityMap.set(pserv, 2);
				}
			}
		}
		if (settings.use_otherservs == "true") {
			const otherServerList = JSON.parse(ns.read("../Temp/servicehosts.txt"));
			for (let otherserver of Object.keys(otherServerList)) {
				if (otherServerList[otherserver] < requiredRam) { continue; }
				serverData[otherserver] = serverDataCollection(target, otherserver, settings)[otherserver];
				priorityMap.set(otherserver, 1);
			}
		}
		if (settings.use_hacknet == "true") {
			var hacknetservers = ns.hacknet.numNodes();
			if (hacknetservers > 0) {
				for (let i = 0; i < hacknetservers; i++) {
					var hacknetserver = "hacknet-server-" + i;
					if (ns.getServer(hacknetserver).maxRam < requiredRam) { continue; }
					serverData[hacknetserver] = serverDataCollection(target, hacknetserver, settings)[hacknetserver];
					priorityMap.set(hacknetserver, 0);
				}
			}
		}

		var fullServers = 0;
		var serverCount = (Object.keys(serverData)).length;
		const sortedHosts = [...priorityMap.entries()]
			.sort((a, b) => b[1] - a[1])

		for (let [host, priority] of sortedHosts) {
			//for (let host of Object.keys(serverData)) {
			if (serverData[host]["availableram"] > requiredRam) {
				ns.exec("batch/scheduler.js", host, 1, target);
				loops++;
				break;
			} else {
				//ns.print(host);
				//ns.print(serverData[host]["availableram"]);
				fullServers++;
			}
		}
		if (loops > peakLoop) { peakLoop = loops; }
		const outOfRamMessage = "Batcher out of RAM! Sleeping for " + (weakeninfo["weakentime"] / 60000).toFixed(2) + " minutes.\nLoops Before Stall: " + loops + "\nPeak Count: " + peakLoop + "\nTotal: " + batchcount;
		const resumingMessage = "Batcher resuming.";
		if (fullServers == serverCount) {
			post(ns, outOfRamMessage);
			loops = 0;
			await ns.sleep(weakeninfo["weakentime"]);
			post(ns, resumingMessage);
		}

		batchmon[target] = stats;
		var foundstats = false;
		const batchstatsfile = "batch/stats.txt";
		if (ns.fileExists(batchstatsfile, "home")) {
			var current_stats = getSettings(ns, batchstatsfile);
			for (let entry of Object.keys(current_stats)) {
				if (entry == target) {
					current_stats[entry] = stats;
					foundstats = true;
				}
			}
			if (foundstats == false) {
				current_stats[target] = stats;
			}
			ns.write(batchstatsfile, JSON.stringify(current_stats, null, 2), "w");
		} else {
			ns.write(batchstatsfile, JSON.stringify(batchmon, null, 2), "w");
		}


		if (settings.delay > 200) {
			var sleeptime = 200;
		} else {
			var sleeptime = settings.delay;
		}
		await ns.sleep(sleeptime);
	} // while loop.
}