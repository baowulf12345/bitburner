/** @param {NS} ns */
export async function main(ns) {
	var ram = ns.args[0];
	if (ram == "max") { ram = ns.getPurchasedServerMaxRam(); }
	var perServerCost = ns.formatNumber(ns.getPurchasedServerCost(ram));
	var totalServerCost = ns.formatNumber(ns.getPurchasedServerCost(ram) * ns.getPurchasedServerLimit());
	if (ns.serverExists("pserv-0")) {
		var currentserverram = ns.getServer("pserv-0");
		ns.tprint("Current Server RAM: " + currentserverram.maxRam);
	}

	ns.tprint("Per Server: " + perServerCost);
	ns.tprint("For " + ns.getPurchasedServerLimit() + ": " + totalServerCost);
}