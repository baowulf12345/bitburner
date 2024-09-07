/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.disableLog("sleep");
	var homeServer = ns.getServer("home");
	while (homeServer.maxRam < 2^22 || homeServer.cpuCores < 8) {
		var ramupcost = ns.singularity.getUpgradeHomeRamCost();
		var coreupcost = ns.singularity.getUpgradeHomeCoresCost();
		var homeServer = ns.getServer("home");
		var cash = ns.getPlayer().money;
		//while (cash * 0.5 > Math.max(ramupcost, coreupcost)) {
			if (cash * 0.5 > ramupcost && homeServer.maxRam < 2^22) {
				ns.toast("Upgrading home server RAM!");
				ns.print("Upgraded home server RAM.");
				ns.singularity.upgradeHomeRam();
			}
			if (cash * 0.5 > coreupcost && homeServer.cpuCores < 8) {
				ns.toast("Upgrading home cores!");
				ns.print("Upgrading home cores");
				ns.singularity.upgradeHomeCores();
			}
			await ns.sleep(100);
		//}
	}
	ns.tprint("We've reached 4PB RAM & 8 cores. Home-upgrade is dying.");
}