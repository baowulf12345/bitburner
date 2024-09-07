/** @param {NS} ns */
export async function main(ns) {
	// Since we have a friendly hacknet server by default, we're going to wait for that to generate our first million.
	ns.exec("hacknet/onlymoney.js", "home");

	// if we've already ran the casino, we're going to skip that.
	var casinostatus = ns.read("Temp/ran-casino.txt");
	var casinominimum = 2e5;

	if (!(casinostatus)) {
		while (ns.getPlayer().money < casinominimum) {
			await ns.sleep(1000);
		}
		var casinoargs = ['--kill-all-scripts=true'];
		ns.exec("casino.js", "home", 1, casinoargs);
		ns.singularity.softReset("start/manager.js");
	}
}