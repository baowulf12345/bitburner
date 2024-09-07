/** @param {NS} ns */
export async function main(ns) {
	var boardstate = ns.args[0];
	var nodetable = ns.args[1];
	var possiblemoves = ns.args[2];

	function spider(boardstate, nodetable, x, y) {
		var results = {};
		const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
		for (let [dx, dy] of directions) {
			const nx = x + dx, ny = y + dy;
			if (isOnBoard(boardstate, nx, ny)) {
				results[nx + "-" + ny] = nodetable["nodes"][nx + "-" + ny];
			}
		}
		return results;
	}

	function isOnBoard(boardstate, x, y) {
		return x >= 0 && x < boardstate.length && y >= 0 && y < boardstate[0].length;
	}

	function finddisruptors(boardstate, nodetable, possiblemoves) {
		var pmoveliberties = {};
		var disruptors = {};
		var topscore = 0;
		var bestmoves = {};
		var bestmove = {};
		// we're iterating through the items in the possiblemoves table.
		for (let pmove of Object.keys(possiblemoves)) {
			ns.tprint("Assessing move to " + pmove);
			ns.tprint(possiblemoves[pmove]);
			var points = pmove.split("-");
			var i = Number(points[0]);
			var j = Number(points[1]);
			if (possiblemoves[pmove]["liberties"] == 1) {
				ns.tprint("deleting " + pmove);
				delete possiblemoves[pmove];
				continue;
			} else if (possiblemoves[pmove]) {

			}
			pmoveliberties = spider(boardstate, nodetable, i, j);
			var enemyadjacencies = 0;
			var allyadjacencies = 0;
			var enemychain = 0;
			var allychain = 0;
			var score = 0;
			var remainingliberties = 0;


			if ((Object.keys(pmoveliberties)).length > 1) {
				for (let liberty of Object.keys(pmoveliberties)) {
					var nodedata = {};

					var nodedata = nodetable["nodes"][liberty];
					ns.tprint(nodedata["claimedempties"]);
					if (nodedata["claimedempties"] == "O") {
						ns.tprint("Found a claimed empty with a BIG O");
					}
					if (nodedata["claimedempties"] == "o") {
						ns.tprint("Found a claimed empty with a little o");
					}

					// We need to see if the liberties of a possible move might disrupt an enemy chain from forming.
					if (nodedata["boardstate"] == "O" || nodedata["boardstate"] == "o") {
						//ns.tprint("Found an enemy adjacency at: " + liberty);
						enemyadjacencies++;
						if (nodedata["liberties"] = 1) {
							//ns.tprint("Found weak enemy chain");
							enemychain++;
							// This is probably our best move, because this might mean we can capture this enemy chain.
							//ns.tprint("assessing: " + liberty);
							//ns.tprint("score: " + score);
							//ns.tprint(pmoveliberties[liberty]);
						} else {
							enemychain++;
						}

						// We also need to see if the liberties of a possible move might help us establish a chain.
					} else if (nodedata["boardstate"] == "X") {
						allyadjacencies++;
						if (nodedata["chains"] > 0) {
							allychain++;
							// If the move would lead to our chain having only 1 liberty left, let's not set ourselves up for capture.
							if (nodedata["liberties"] <= 1) {
								remainingliberties = -1;
							}
						}
					} else {

					}
				}// liberty[key]
			} //liberty.length
			score = score + enemyadjacencies + allyadjacencies + enemychain + allychain;
			if (remainingliberties == 0) {
				score = 0;
			}
			if (enemyadjacencies > 0) {
				var enemyfocus = 1;
				score = score + enemyfocus;
			} else {
				var enemyfocus = 0;
			}
			if (score >= topscore) {
				topscore = score;
			}
			disruptors[pmove] = {
				"position": pmove,
				"enemyadjacencies": enemyadjacencies,
				"allyadjacencies": allyadjacencies,
				"enemychain": enemychain,
				"allychain": allychain,
				"score": score,
				"enemyfocus": enemyfocus,
				"remainingliberties": remainingliberties
			}
			disruptors[pmove]["statedata"] = possiblemoves[pmove];
		} // possiblemoves[key]

		// Narrow down our results to only the best scoring moves.
		ns.tprint(topscore);
		ns.tprint("Disruptors:\n");
		ns.tprint(JSON.stringify(disruptors, null, 2));

		if ((Object.keys(disruptors)).length > 1) {
			for (let goodmove of Object.keys(disruptors)) {
				if (disruptors[goodmove][statedata]["liberties"] = -1) {
					delete disruptors[goodmove];
				}
				//ns.tprint("In search loop " + goodmove);
				if (disruptors[goodmove]["score"] == topscore) {
					//ns.tprint("Good Move: " + goodmove);
					bestmoves[goodmove] = disruptors[goodmove];
				}
			}
			//ns.tprint(JSON.stringify(bestmoves, null, 2));
			// Further narrow down 
			if ((Object.keys(bestmoves)).length > 1) {
				for (let optimalmove of Object.keys(bestmoves)) {


					if (bestmoves[optimalmove]["enemyfocus"] > 0) {
						var bestmove = bestmoves[optimalmove];
					} else {
						var bestmove = bestmoves[optimalmove];
					}
				}
			} else {
				bestmove = bestmoves;
			}
		} else {
			bestmove = disruptors;
		} // disruptors[keys]
		return bestmove;
	} // function

	function assessment(movedata, nodetable) {

	}


	var results = finddisruptors(boardstate, nodetable, possiblemoves);
}