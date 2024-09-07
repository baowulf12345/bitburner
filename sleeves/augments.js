/** @param {NS} ns */
export async function main(ns) {
	var limit = ns.args[0];
	var sleeves = ns.sleeve.getNumSleeves();
	for (let i = 0; i < sleeves; i++) {
		var augs = ns.sleeve.getSleevePurchasableAugs(i);
		for (let aug of augs) {
			var augprice = ns.sleeve.getSleeveAugmentationPrice(aug.name);
			if (augprice < limit) {
				ns.sleeve.purchaseSleeveAug(i, aug.name);
			}
		}
	}
}