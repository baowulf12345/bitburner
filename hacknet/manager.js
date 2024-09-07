/** @param {NS} ns */
import { getSettings, getServers, post, disableLogs, getKeyByValue, getGlobalVars } from '../lib/sharedfunctions.js'

export async function main(ns) {

	function decreasesecurity(target, hashes) {
		var minseccurlvl = ns.hacknet.getHashUpgradeLevel("Reduce Minimum Security");
		var minseccost = ns.formulas.hacknetServers.hashUpgradeCost("Reduce Minimum Security", minseccurlvl);
		var weakentime = ns.getWeakenTime(target);
		if (hashes > minseccost) {
			if (weakentime > 30000 && ns.getServer(target).minDifficulty > 5) {
				post(ns, "Reducing Min Security on " + target);
				ns.hacknet.spendHashes("Reduce Minimum Security", target);
				return ns.hacknet.getHashUpgradeLevel("Reduce Minimum Security");
			} else {
				return null;
			}
		} else {
			return "wait";
		}
	}

	function increasemoney(target, hashes) {
		var mxmoneycurlvl = ns.hacknet.getHashUpgradeLevel("Increase Maximum Money");
		var mxmoneycost = ns.formulas.hacknetServers.hashUpgradeCost("Increase Maximum Money", mxmoneycurlvl);
		var targetmoney = ns.getServer(target).moneyMax;
		if (hashes > mxmoneycost) {
			if (targetmoney < 1e13) {
				post(ns, "Increasing Max Money on " + target);
				ns.hacknet.spendHashes("Increase Maximum Money", target);
				return targetmoney;
			} else {
				return null;
			}
		} else {
			return "wait";
		}

	}

	function process(target, hashes) {
		var goal = false;
		var lowsec = decreasesecurity(target, hashes);
		if (!lowsec) {
			var highmoney = increasemoney(target, hashes);
			if (!highmoney) {
				goal = true;
			}
		}
		return goal;
	}

	function companyfavor() {
		const companyfile = "/jobs/companies.txt";
		const companies = getSettings(ns, companyfile);
		var favordata = new Map();
		for (let company of companies) {
			var favor = ns.singularity.getCompanyFavor(company);
			favordata.set(company, favor);
		}
		const target = [...favordata.entries()]
			.sort((a, b) => a[1] - b[1])
			.slice(0, 1);
		return target[0][0];
	}

	function checkBatches() {
		const hostmap = new Map();
		var hosts = getServers(ns);
		for (let host of hosts) {
			if (ns.isRunning("batch/batchmanager.js", "home", host) || ns.isRunning("batch/manager.js", "home", host)) {
				if (ns.getServerMaxMoney(host) < 1e13) {
					hostmap.set(host, ns.getServerMaxMoney(host));
				}
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

	function doBatch(sortedHosts, hashes) {
		var goal = false;
		for (let [server, maxmoney] of sortedHosts) {
			goal = process(server, hashes);
			if (goal == true) {
				delete sortedHosts[server];
				if ((sortedHosts) && sortedHosts.size > 0) {
					goal = false;
					continue;
				}
			} else {
				return server;
			}
		}
		if (goal == true) {
			return goal;
		}
	}

	function corpRep(hashes) {
		var upgradecost = ns.hacknet.hashCost("Company Favor", 1);
		if (hashes > upgradecost) {
			var target = companyfavor();
			ns.hacknet.spendHashes("Company Favor", target, 1);
			post(ns, "Hacknet: Buying Favor with " + target + " for " + upgradecost + " hashes.");
		}
	}

	function getMoney(hashes) {
		var consumptionlimit = ns.hacknet.hashCapacity() * 0.9;
		var availablehashes = hashes - consumptionlimit;
		if (availablehashes > 4) {
			var num = Math.floor(availablehashes / 4);
			if (num > 1) {
				ns.hacknet.spendHashes("Sell for Money", "home", num);
			}
		}
	}

	function getNodeData() {
		const globalInfo = {
			"global": {
				"count": ns.hacknet.numNodes(),
				"Cost": ns.hacknet.getPurchaseNodeCost(),
			},
			"constants": ns.formulas.hacknetServers.constants(),
			"player": ns.getPlayer()
		}
		var nodeInfo = {};
		for (let i = 0; i < globalInfo.global.count; i++) {
			var nodeStats = ns.hacknet.getNodeStats(i);
			nodeInfo[i] = {
				"index": i,
				"stats": nodeStats,
				"nodelevelupcost": ns.hacknet.getLevelUpgradeCost(i, 1),
				"noderamupcost": ns.hacknet.getRamUpgradeCost(i, 1),
				"nodecoreupcost": ns.hacknet.getCoreUpgradeCost(i, 1)
			}
		}
		globalInfo["nodes"] = nodeInfo;
		return globalInfo;
	}

	function calcnodebest(nodeInfo, goals) {
		var nodebest = {};
		var index = nodeInfo.index;
		var nodestats = nodeInfo.stats;
		var multiplier = ns.getPlayer().mults.hacknet_node_money;
		var currentgainrate = ns.formulas.hacknetServers.hashGainRate(nodestats.level, 0, nodestats.ram, nodestats.cores, multiplier);
		if (nodestats.level < goals["level"]) {
			var nodelevelupcost = nodeInfo.nodelevelupcost;
			var nodelevelupgainrate = ns.formulas.hacknetServers.hashGainRate(nodestats.level + 1, 0, nodestats.ram, nodestats.cores, multiplier);
			var nodelevelupeffect = nodelevelupgainrate - currentgainrate;
			var nodelevelupratio = nodelevelupeffect / nodelevelupcost;
		} else {
			var nodelevelupcost = 9e20;
			var nodelevelupeffect = 0;
			var nodelevelupratio = 0;
		}
		if (nodestats.ram < goals["ram"]) {
			var noderamupcost = nodeInfo.noderamupcost;
			var noderamupgainrate = ns.formulas.hacknetServers.hashGainRate(nodestats.level, 0, nodestats.ram * 2, nodestats.cores, multiplier);
			var noderamupeffect = noderamupgainrate - currentgainrate;
			var noderamupratio = noderamupeffect / noderamupcost;
		} else {
			var noderamupcost = 9e20;
			var noderamupeffect = 0;
			var noderamupratio = 0;
		}
		if (nodestats.cores < goals["cores"]) {
			var nodecoreupcost = nodeInfo.nodecoreupcost;
			var nodecoreupgainrate = ns.formulas.hacknetServers.hashGainRate(nodestats.level, 0, nodestats.ram, nodestats.cores + 1, multiplier);
			var nodecoreupeffect = nodecoreupgainrate - currentgainrate;
			var nodecoreupratio = nodecoreupeffect / nodecoreupcost;
		} else {
			var nodecoreupcost = 9e20;
			var nodecoreupeffect = 0;
			var nodecoreupratio = 0;
		}
		var nodebestratio = Math.max(nodelevelupratio, noderamupratio, nodecoreupratio);
		var nodebestupcost = Math.min(nodelevelupcost, noderamupcost, nodecoreupcost);
		var nodebestupeffect = Math.max(nodelevelupeffect, noderamupeffect, nodecoreupeffect);
		if (nodebestupcost === 9e20) {
			nodebest = {
				"index": index,
				"action": "MAX",
				"cost": 9e20,
				"effect": 0,
				"ratio": 0
			}
		} else {
			switch (nodebestratio) {
				case nodelevelupratio:
					nodebest = {
						"index": index,
						"action": "levelup",
						"cost": nodelevelupcost,
						"effect": nodelevelupeffect,
						"ratio": nodelevelupratio
					}
					break;
				case noderamupratio:
					nodebest = {
						"index": index,
						"action": "ramup",
						"cost": noderamupcost,
						"effect": noderamupeffect,
						"ratio": noderamupratio
					}
					break;
				case nodecoreupratio:
					nodebest = {
						"index": index,
						"action": "coreup",
						"cost": nodecoreupcost,
						"effect": nodecoreupeffect,
						"ratio": nodecoreupratio
					}
					break;
			}
		}
		return nodebest;
	}

	function doUpgrade(nodebest) {
		switch (nodebest["action"]) {
			case "levelup":
				ns.hacknet.upgradeLevel(nodebest["index"], 1);
				break;
			case "ramup":
				ns.hacknet.upgradeRam(nodebest["index"], 1);
				break;
			case "coreup":
				ns.hacknet.upgradeCore(nodebest["index"], 1);
				break;
		}
	}


	function lrcUpgrader(nodeData, goals) {
		for (let node of Object.keys(nodeData.nodes)) {
			var nodebest = calcnodebest(nodeData.nodes[node], goals);
			if (nodebest["cost"] < ns.getPlayer().money * 0.01) {
				ns.print("Upgrading Index: " + nodebest["index"] + " Upgrade: " + nodebest["action"] + " Cost: " + ns.formatNumber(nodebest["cost"]));
				doUpgrade(nodebest);
			}
		}
	}

	function cacheUpgrader(nodeData, goals) {
		//ns.print ("goal: " + goals["cache"]);
		for (let node of Object.keys(nodeData.nodes)) {
			//ns.print ("node " + node + " cache level: " + nodeData.nodes[node]["stats"]["cache"]);
			if (nodeData.nodes[node]["stats"]["cache"] < goals["cache"]) {
				var gap = goals["cache"] - nodeData.nodes[node]["stats"]["cache"];
				var cost = ns.hacknet.getCacheUpgradeCost(node, gap);
				if (cost < ns.getPlayer().money * 0.01) {
					ns.print("Upgrading Cache on Index: " + node + " to: " + goals["cache"]);
					ns.hacknet.upgradeCache(node, gap);
				}
			}
		}
	}

	function buyServers(nodedata, goals) {
		if (nodedata.global.count < goals["servers"]) {
			if (nodedata.global["Cost"] < ns.getPlayer().money * 0.01) {
				ns.hacknet.purchaseNode();
			}
		}
	}

	//////////////////////////////////////////////////////////////////
	var logs = ["sleep", "hacknet.numHashes", "getPlayer", "hacknet.getCacheUpgradeCost", "formulas.hacknetServers.hashGainRate",
		"hacknet.getCoreUpgradeCost", "hacknet.getLevelUpgradeCost", "hacknet.getRamUpgradeCost", "hacknet.getNodeStats",
		"singularity.getCompanyFavor", "formulas.hacknetServers.constants", "formulas.hacknetServers.hashUpgradeCost",
		"hacknet.getHashUpgradeLevel", "getWeakenTime", "getServer", "getServerMaxMoney", "scan"];
	disableLogs(ns, logs);
	ns.tail();

	while (true) {
		const settingsfile = "/hacknet/settings.txt";
		const settings = getSettings(ns, settingsfile);
		const phase = getGlobalVars(ns, "hacknet_phase");
		var goals = settings["phasesettings"][phase]["goals"];
		var nodedata = getNodeData();
		var hashes = ns.hacknet.numHashes();
		var hosts = getServers(ns);
		if (settings.settings.dobatch == true) {
			var sortedHosts = checkBatches(hosts);
		} else {
			var sortedHosts = null;
		}

		buyServers(nodedata, goals);
		lrcUpgrader(nodedata, goals);
		cacheUpgrader(nodedata, goals);
		if (sortedHosts) {
			doBatch(sortedHosts, hashes);
		} else {
			corpRep(hashes);
		}
		await ns.sleep(50);
		if (ns.getPlayer().money < 1e15 || hashes > ns.hacknet.hashCapacity * 0.9) {
			getMoney(hashes);
		}

		await ns.sleep(100);
	}
}