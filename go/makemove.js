/** @param {NS} ns */
export async function main(ns) {
    await ns.go.makeMove(ns.args[0], ns.args[1]);
    }