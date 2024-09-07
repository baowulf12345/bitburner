/** @param {NS} ns */
import { getSettings, getServers, calcAvailableRam } from '/lib/sharedfunctions.js'
export async function main(ns) {


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


	// The meat and potatoes.
	if (typeof ns.args[0] == "number") {
		ns.tprint("Checking the top " + ns.args[0] + " servers.");
		const hostmap = new Map();
		const hosts = getServers(ns);
		for (let host of hosts) {
			hostmap.set(host, ns.getServerRequiredHackingLevel(host));
		}
		const sortedHosts = [...hostmap.entries()]
			.sort((a, b) => b[1] - a[1])
			.filter(([host, hackingLevel]) => hackingLevel <= ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)
			.slice(0, ns.args[0]);

		for (const [host, level] of sortedHosts) {
			const details = getHostDetails(host);
			const formula_results = getformulas(host);
			ns.tprint(details + " " + formula_results);
		}
	} else {
		var host = ns.args[0];
		const details = getHostDetails(host);
		const formula_results = getformulas(host);
		ns.tprint(details + " " + formula_results);
	}
}