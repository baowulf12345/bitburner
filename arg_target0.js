/** @param {NS} ns */
export async function main(ns) {
	// Defines the "target server", which is the server
	// that we're going to hack. In this case, it's "n00dles"
	var target = ns.args[0];

	// Defines how much money a server should have before we hack it
	// In this case, it is set to 75% of the server's max money
	var moneyThresh = ns.getServerMaxMoney(target) * 0.60;

	// Defines the maximum security level the target server can
	// have. If the target's security level is higher than this,
	// we'll weaken it before doing anything else
	var securityThresh = ns.getServerMinSecurityLevel(target) + 5;

	// Infinite loop that continously hacks/grows/weakens the target server
	while(true) {
			if (ns.getServerSecurityLevel(target) > securityThresh) {
					// If the server's security level is above our threshold, weaken it
					await ns.weaken(target);
			} else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
					// If the server's money is less than our threshold, grow it
					await ns.grow(target,{stock:true});
			} else {
					// Otherwise, hack it
					await ns.hack(target);
			}
			await ns.sleep(1000);
	}
}