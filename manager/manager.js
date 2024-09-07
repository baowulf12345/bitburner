/** @param {NS} ns */
import { getSettings, post, disableLogs } from '../lib/sharedfunctions.js'

export async function main(ns) {
		const logs = ["getScriptRam","getServerMaxMoney","getServerMinSecurityLevel","getServerMaxRam",
		"getHackTime","getGrowTime","getWeakenTime","getServerSecurityLevel","weakenAnalyze",
		"getServerMoneyAvailable","hackAnalyzeThreads","growthAnalyze","getServerUsedRam","sleep"
		]
		disableLogs(ns, logs);

    const target = ns.args[0];


    // No point recalculating these in the loop, they are constant
    const hackRam = ns.getScriptRam("/manager/managed_hack.js");
    const growRam = ns.getScriptRam("/manager/managed_grow.js");
    const weakenRam = ns.getScriptRam("/manager/managed_weaken.js");


    const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    const securityThresh = ns.getServerMinSecurityLevel(target) + 5;


    // Infinite loop that continuously hacks/grows/weakens the target server
    while (true) {
        const homeMaxRam = ns.getServerMaxRam("home"); // Doing it in the loop since we might update home ram while the script is running


        // We recalculate times each loop, because the security will go up and down as we go, affecting those times
        const hackTime = ns.getHackTime(target);
        const growTime = ns.getGrowTime(target);
        const weakenTime = ns.getWeakenTime(target);


        // Weaken thread calculation:
        const minSec = ns.getServerMinSecurityLevel(target);
        const sec = ns.getServerSecurityLevel(target);
        let weakenThreads = Math.floor(Math.ceil((sec - minSec) / ns.weakenAnalyze(1)));


        // Hack thread calculation:
        let money = ns.getServerMoneyAvailable(target);
        if (money <= 0) money = 1; // division by zero safety
        let hackThreads = Math.floor(Math.ceil(ns.hackAnalyzeThreads(target, money)));


        // Grow thread calculation:
        let maxMoney = ns.getServerMaxMoney(target);
        let growThreads = Math.floor(Math.ceil(ns.growthAnalyze(target, maxMoney / money)));


        // Maximum threads calculation
        let homeUsedRam = ns.getServerUsedRam("home");
        let availableRam = homeMaxRam - homeUsedRam;
        let maxThreads = Math.floor(availableRam * 0.75 / Math.max(hackRam, growRam, weakenRam));


        if (ns.getServerSecurityLevel(target) > securityThresh) {
            // If the server's security level is above our threshold, weaken it
            weakenThreads = Math.floor(Math.min(maxThreads, weakenThreads));
            ns.exec("/manager/managed_weaken.js", "home", weakenThreads, target);
            await ns.sleep(weakenTime + 100);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            // If the server's money is less than our threshold, grow it
            growThreads = Math.floor(Math.min(maxThreads, growThreads));
            ns.exec("/manager/managed_grow.js", "home", growThreads, target);
            await ns.sleep(growTime + 100);
        } else {
            // Otherwise, hack it
            hackThreads = Math.floor(Math.min(maxThreads, hackThreads));
            ns.exec("/manager/managed_hack.js", "home", hackThreads, target);
            await ns.sleep(hackTime + 100);
        }
    }
}