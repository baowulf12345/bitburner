/** @param {NS} ns */
export async function main(ns) {
	var target = ns.args[0];

	while (true) {
		await ns.grow(target);
		await ns.sleep(1000);
	}
}