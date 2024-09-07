// Use this to import the sharedfunctions into a script. //
// import { <IMPORTED OBJECTS> } from '../lib/sharedfunctions.js'

//* Returns a helpful error message if we forgot to pass the ns instance to a function */
export function checkNsInstance(ns, fnName = "this function") {
	if (ns === undefined || !ns.print) throw new Error(`The first argument to ${fnName} should be a 'ns' instance.`);
	return ns;
}

export function getGlobalVars(ns, variable) {
	const settingsfile = "globalsettings.txt";
	var settings = getSettings(ns, settingsfile);
	return settings.vars[variable];
}

// global constants we can share.
export const factionhosts = new Array(
	"CSEC", "run4theh111z", "The-Cave", "I.I.I.I", ".", "avmnite-02h"
);

// Collect the corresponding settings file.
export function getSettings(ns, settingsfile) {
	try {
		var settings = JSON.parse(ns.read(settingsfile));
	} catch (err) {
		throw new Error("Problem with " + settingsfile + " Did you delete/move it?\n" + err.message);
	}
	return settings;
}

// Disable each log in an array.
export function disableLogs(ns, listOfLogs) {
	['disableLog'].concat(...listOfLogs).forEach(log => checkNsInstance(ns, '"disableLogs"').disableLog(log));
}

/** Formats some RAM amount as a round number of GB with thousands separators e.g. `1,028 GB` */
export function formatRam(num) { return `${Math.round(num).toLocaleString('en')} GB`; }

// Calculate available RAM on the target server.
export function calcAvailableRam(ns, server) {
	var availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
	return availableRam;
}

// Print the message to the log and create a toast.
export function post(ns, message) {
	ns.print(message);
	ns.toast(message);
}

export function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

export function joinfaction(ns, faction) {
	ns.singularity.joinFaction(faction);
}

export function getServers(ns) {
	let servers = ["home"];
	for (let i = 0; i < servers.length; i++) {
		let found = ns.scan(servers[i]);
		for (let j = 0; j < found.length; j++) {
			if (servers.indexOf(found[j]) >= 0) continue;
			servers.push(found[j]);
		}
	}
	return servers;
}


/**
 * @author modar <gist.github.com/xmodar>
 * {@link https://www.reddit.com/r/Bitburner/comments/tgtkr1/here_you_go_i_fixed_growthanalyze_and_growpercent/}
 *
 * @typedef {Partial<{
 *   moneyAvailable: number;
 *   hackDifficulty: number;
 *   ServerGrowthRate: number // ns.getBitNodeMultipliers().ServerGrowthRate
 *   ; // https://github.com/danielyxie/bitburner/blob/dev/src/BitNode/BitNode.tsx
 * }>} GrowOptions
 */

export function calculateGrowGain(ns, host, threads = 1, cores = 1, opts = {}) {
    threads = Math.max(Math.floor(threads), 0);
    const moneyMax = ns.getServerMaxMoney(host);
    const { moneyAvailable = ns.getServerMoneyAvailable(host) } = opts;
    const rate = growPercent(ns, host, threads, cores, opts);
    return Math.min(moneyMax, rate * (moneyAvailable + threads)) - moneyAvailable;
}

/** @param {number} gain money to be added to the server after grow */
export function calculateGrowThreads(ns, host, gain, cores = 1, opts = {}) {
    const moneyMax = ns.getServerMaxMoney(host);
    const { moneyAvailable = ns.getServerMoneyAvailable(host) } = opts;
    const money = Math.min(Math.max(moneyAvailable + gain, 0), moneyMax);
    const rate = Math.log(growPercent(ns, host, 1, cores, opts));
    const logX = Math.log(money * rate) + moneyAvailable * rate;
    return Math.max(lambertWLog(logX) / rate - moneyAvailable, 0);
}

function growPercent(ns, host, threads = 1, cores = 1, opts = {}) {
    const { ServerGrowthRate = 1, hackDifficulty = ns.getServerSecurityLevel(host), } = opts;
    const growth = ns.getServerGrowth(host) / 100;
    const multiplier = ns.getPlayer().hacking_grow_mult;
    const base = Math.min(1 + 0.03 / hackDifficulty, 1.0035);
    const power = growth * ServerGrowthRate * multiplier * ((cores + 15) / 16);
    return base ** (power * threads);
}

/**
 * Lambert W-function for log(x) when k = 0
 * {@link https://gist.github.com/xmodar/baa392fc2bec447d10c2c20bbdcaf687}
 */
function lambertWLog(logX) {
    if (isNaN(logX)) return NaN;
    const logXE = logX + 1;
    const logY = 0.5 * log1Exp(logXE);
    const logZ = Math.log(log1Exp(logY));
    const logN = log1Exp(0.13938040121300527 + logY);
    const logD = log1Exp(-0.7875514895451805 + logZ);
    let w = -1 + 2.036 * (logN - logD);
    w *= (logXE - Math.log(w)) / (1 + w);
    w *= (logXE - Math.log(w)) / (1 + w);
    w *= (logXE - Math.log(w)) / (1 + w);
    return isNaN(w) ? (logXE < 0 ? 0 : Infinity) : w;
}
const log1Exp = (x) => x <= 0 ? Math.log(1 + Math.exp(x)) : x + log1Exp(-x);


// convert an object to a Map.
export function objectToMap(object) {
	var map = new Map();
	for (let entry of Object.keys(object)) {
		map.set(entry, object[entry]);
	}
	return map;
}

// Convert a map to an object.
export function mapToObject(map) {
	var object = {};
	for (let [a, b] of map) {
		object[a] = b;
	}
	return object;
}