/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	while (true) {
		ns.tail();
		var upgrades = ns.hacknet.getHashUpgrades();
		var stats = ns.hacknet.numHashes();
		var num = Math.floor(stats / 4);
		ns.print("Number: " + num);
		ns.hacknet.spendHashes("Sell for Money", "home", num);
		await ns.sleep(10000);
	}
}