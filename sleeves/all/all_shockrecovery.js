/** @param {NS} ns */
export async function main(ns) {
	const numsleeves = ns.sleeve.getNumSleeves();
	for (let i = 0; i < numsleeves; i++) {
		ns.sleeve.setToShockRecovery(i);
	}
}