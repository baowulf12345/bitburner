/** @param {NS} ns */
import { getKeyByValue } from '../lib/sharedfunctions.js'

export async function main(ns) {

	function companyfavor() {
		try {
			var companies = JSON.parse(ns.read("/jobs/companies.txt"));
		} catch (err) {
			throw new Error("Problem with jobs/companies.txt. Did you delete/move it?\n" + err.message);
		}
		let favordata = {};
		for (let company of companies) {
			favordata[company] = ns.singularity.getCompanyFavor(company);
		}
		let values = Object.values(favordata);
		let minimum = Math.min(...values);
		let list = getKeyByValue(favordata, minimum);
		return list;
	}

	ns.disableLog("sleep");
	ns.tail();

	while (true) {
		var hashes = ns.hacknet.numHashes();
		var upgradecost = ns.hacknet.hashCost("Company Favor", 1);
		if (hashes > upgradecost) {
			var target = companyfavor();
			ns.hacknet.spendHashes("Company Favor", target, 1);
			ns.toast("Hacknet: Buying Favor with " + target + " for " + upgradecost + " hashes.");
			ns.print("Hacknet: Buying Favor with " + target + " for " + upgradecost + " hashes.");
		}
		await ns.sleep(1000);
	}
}