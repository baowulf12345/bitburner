import { getServers,disableLogs } from "/lib/sharedfunctions.js"

export async function main(ns) {
		var logs = ['sleep','getServerMoneyAvailable','getPurchasedServerMaxRam','getPurchasedServerCost',
		'getScriptRam','getServerRequiredHackingLevel','getHackingLevel'];
		disableLogs(ns, logs);
    ns.tail();
    // How much RAM each purchased server will have. In this case, it'll
    // be 8GB.
    const hostmap = new Map();
    const baseram = parseInt(64);
    if (ns.args[0] == "max") {
        var argram = ns.getPurchasedServerMaxRam();
    } else {
        var argram = parseInt(ns.args[0]);
    }
    if (argram) {
        calcram = argram;
    } else {
        var calcram = baseram;
    }
    const maxram = ns.getPurchasedServerMaxRam();
    ns.tprint("target RAM: " + calcram + " Target Cost: " + ns.formatNumber(ns.getPurchasedServerCost(calcram)));
    const script = "arg_target.js";
    const scriptram = ns.getScriptRam(script);

    // Iterator we'll use for our loop
    var i = 0;

    const hosts = getServers(ns);

    for (let host of hosts) {
        hostmap.set(host, ns.getServerRequiredHackingLevel(host));
    }
    const sortedHosts = [...hostmap.entries()]
        .sort((a, b) => b[1] - a[1])
        .filter(([host, hackingLevel]) => hackingLevel < ns.getHackingLevel() && ns.getServerMaxMoney(host) > 0)
    var sortedCount = 0;
    for (const count of sortedHosts) {
        sortedCount++;
    }
    var threads = parseInt(Math.floor(calcram / (sortedCount * scriptram)));
    if (threads < 1) { threads = 100; }

    while (i < ns.getPurchasedServerLimit()) {
        var hostname = "pserv-" + i
        if (ns.serverExists(hostname)) {
					/* The below section was used to automatically recalculate the calcram to the next higher interval if pserv-0
						was already at the calcram. This can cause more problems than it solves, like if you have to kill the process and restart it,
						it'll automatically step up your purchases, which you might not want (especially in the early game).
            if (i == 0 && ns.getServerMaxRam(hostname) >= calcram && calcram < maxram) {
								while (ns.getServerMaxRam(hostname) >= calcram && calcram < maxram) {
                    calcram = parseInt(ns.getServerMaxRam(hostname) * 2);
                    calcram = calcram > maxram ? maxram : calcram;
                    var threads = Math.floor(calcram / (sortedCount * scriptram));
                    ns.tprint("calcram too low. Updating to " + calcram);
                    await ns.sleep(10);
                } // calcram while loop
            } // calcram off of pserv-0 RAM.
					*/

            if (ns.getServerMaxRam(hostname) >= calcram) {
                ns.tprint(hostname + " already has equal to or greater RAM than target. Current value = " + ns.getServerMaxRam(hostname) + ". Calcram: " + calcram);
                i++;
                continue;
            } else if (ns.getServerMaxRam(hostname) == maxram) {
                ns.tprint(hostname + " has maximum RAM: " + ns.getServerMaxRam(hostname) + ". Moving to next host.");
                i++;
                continue;
            } else if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(calcram)) {
                ns.upgradePurchasedServer(hostname, calcram);
                ns.tprint("Upgrading " + hostname + " to " + calcram);
                ns.exec("oneserverupdate.js","home",1,hostname);
                i++;
            } // CALCRAM IF Stack
        } else if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(calcram)) {
            ns.purchaseServer(hostname, calcram);
            ns.tprint("Purchasing " + hostname + " At " + ns.formatNumber(ns.getPurchasedServerCost(calcram)));
            ns.scp(script, hostname);
            ns.exec("oneserverupdate.js","home",1,hostname);
            i++;
        } // ServerExists IF Stack
        await ns.sleep(1000);
    } // WHILE purchasedserverlimit
    ns.spawn("update4server.js", 1, threads);
} // NS.MAIN