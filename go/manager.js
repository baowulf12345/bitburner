/** @param {NS} ns */
import { disableLogs, calcAvailableRam, post, getSettings } from '/lib/sharedfunctions.js'

export async function main(ns) {

	function buildnodetable(boardstate, chains, liberties, claimedempties) {
		var gonodes = {};
		var nodes = {};
		// Iterate through the array
		for (let i = 0; i < boardstate.length; i++) {
			for (let j = 0; j < boardstate[i].length; j++) {
				var xmlstring = i + "-" + j;
				nodes[xmlstring] = {
					"position": xmlstring,
					"boardstate": boardstate[i][j],
					"chains": chains[i][j],
					"liberties": liberties[i][j],
					"claimedempties": claimedempties[i][j]
				}
				gonodes["nodes"] = nodes;
			}
		}
		return gonodes; // All values are "0" or null
	}

	function findpossiblemoves(nodetable) {
		var exclusions = {};
		var options = {};
		var validmoves = ns.go.analysis.getValidMoves();
		for (let i = 0; i < boardstate.length; i++) {
			//ns.tprint("i = " + i);
			for (let j = 0; j < boardstate[i].length; j++) {
				//ns.tprint("j = " + j);
				if (nodetable["nodes"][i + "-" + j]["boardstate"] == "O" ||
					nodetable["nodes"][i + "-" + j]["boardstate"] == "X" ||
					nodetable["nodes"][i + "-" + j]["boardstate"] == "#" ||
					validmoves[i][j] == false
				) {
					// Can't move to these nodes because there's already a piece here or the node is dead.
					exclusions[i + " - " + j] = nodetable["nodes"][i + "-" + j];

				} else {
					// empty nodes that are contested.
					options[i + " - " + j] = nodetable["nodes"][i + "-" + j];
				}
			}
		}
		return options;
	}

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

	function checkNewGame(boardstate) {
		// Iterate through the array
		for (let i = 0; i < boardstate.length; i++) {
			for (let j = 0; j < boardstate[i].length; j++) {
				// Check if current value is not "0" or null
				if (boardstate[i][j] !== "." && boardstate[i][j] !== "#") {
					return false; // Not all values are "0" or null
				}
			}
		}
		return true; // All values are "0" or null
	}

	function countNodesInChain(chains, x, y) {
		var value = chains[x][y];
		var count = 0;
		for (let column of chains) {
			for (let row of column) {
				if (row == value) {
					count++;
				}
			}
		}
		return count;
	}

	function finddisruptors(boardstate, nodetable, possiblemoves, chains) {
		var pmoveliberties = {};
		var disruptors = {};
		var topscore = 0;
		var bestmoves = {};
		var bestmove = {};
		// we're iterating through the items in the possiblemoves table.
		for (let pmove of Object.keys(possiblemoves)) {
			var score = 0;
			//ns.print("*************************Assessing move to " + pmove);
			//ns.print(possiblemoves[pmove]);
			//ns.print(possiblemoves[pmove]["claimedempties"]);
			var points = pmove.split("-");
			var i = Number(points[0]);
			var j = Number(points[1]);
			if (possiblemoves[pmove]["liberties"] <= 2 && possiblemoves[pmove]["claimedempties"] == "X") {
				//ns.tprint("deleting " + pmove);
				delete possiblemoves[pmove];
				continue;
			}
			if (possiblemoves[pmove]["claimedempties"] == "O") {
				score = score - 2;
				//ns.tprint("This point is an enemy claimed empty, so we're lowering it's score, which is now " + score);

			} else if (possiblemoves[pmove]["claimedempties"] == "X") {
				score = score - 2;
				//ns.tprint("This point is an ally claimed empty, so we're lowering it's score, which is now " + score);
			}
			pmoveliberties = spider(boardstate, nodetable, i, j);
			var enemyadjacencies = 0;
			var allyadjacencies = 0;
			var enemychain = 0;
			var allychain = 0;


			if ((Object.keys(pmoveliberties)).length > 1) {
				for (let liberty of Object.keys(pmoveliberties)) {
					var chainsize = 0;
					var libertycount = 0;
					//ns.tprint("liberty of " + pmove + ": " + liberty);
					//ns.tprint("Liberties of asssessed liberty " + liberty + ": " + JSON.stringify(pmoveliberties[liberty]));
					var nodedata = nodetable["nodes"][liberty];
					var lx = nodedata["position"].split("-")[0];
					var ly = nodedata["position"].split("-")[1];

					// We need to see if the liberties of a possible move might disrupt an enemy chain from forming.
					if (nodedata["boardstate"] == "O" || nodedata["boardstate"] == "o") {
						//ns.tprint("Found an enemy adjacency at: " + liberty);
						enemyadjacencies++;
						if (nodedata["liberties"] == 1) {
							//ns.tprint("Found weak enemy chain");
							enemychain++;
							// This is probably our best move, because this means we might be able to capture this enemy chain.
							var chainsize = countNodesInChain(chains, lx, ly);
							//ns.tprint("chain size: " + chainsize);
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
								score = score - 5;
							}
						}
					} else {
						libertycount++;
					}
				}// liberty[key]
			} //liberty.length
			score = (score + enemyadjacencies + allyadjacencies + enemychain + allychain + chainsize) - libertycount;
			if (enemyadjacencies > 0) {
				var enemyfocus = 1;
				var score = score + 1;
				//ns.tprint("After tally, final score is: " + score);
			} else {
				var enemyfocus = 0;
				//ns.tprint("After tally, final score is: " + score);
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
				"remainingliberties": libertycount,
				"chainsize": chainsize
			}
			disruptors[pmove]["statedata"] = possiblemoves[pmove];
		} // possiblemoves[key]

		// Narrow down our results to only the best scoring moves.
		//ns.tprint(topscore);
		//ns.tprint("Disruptors:\n");
		//ns.tprint(JSON.stringify(disruptors, null, 2));

		if ((Object.keys(disruptors)).length > 1) {
			for (let goodmove of Object.keys(disruptors)) {
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

	function startStats() {
		if (ns.fileExists("go/stats.txt", "home")) {
			ns.rm("/go/stats.txt", "home");
			var stats = ns.go.analysis.getStats();
			ns.write("/go/stats.txt", JSON.stringify(stats, null, 2), "w");
		} else {
			var stats = ns.go.analysis.getStats();
			ns.write("/go/stats.txt", JSON.stringify(stats, null, 2), "w");
		}
	}

	function selectOpponent(settings) {
		if (settings.gameoptions.automation.active == false) {
			return settings.gameoptions.preferredopponent;
		} else {
			var oppoMap = new Map();
			var stats = ns.go.analysis.getStats();
			for (let opponent of Object.keys(settings["opponents"])) {
				if (opponent == "????????????") { continue; }
				oppoMap.set(opponent, settings["opponents"][opponent]["goal"]);
			}
			for (let [target, goal] of oppoMap) {
				if (stats[target]) {
					if (stats[target]["bonusPercent"] > goal) {
						continue;
					} else {
						return target;
					}
				} else {
					return target;
				}
			}
				// If we get to this entry, then all opponents have hit goal.
				return settings.gameoptions.preferredopponent;
		}
	}

	///////////////////////////////////////////////////////////////

	if (ns.args[0]) {
		var loop = ns.args[0];
	} else {
		var loop = true;
	}
	ns.tail();

	startStats;

	var dislog = ["go.makeMove", "go.opponentNextTurn", "go.passTurn", "go.resetBoardState"];
	disableLogs(ns, dislog);

	while (loop == true) {
		const settingsfile = "go/settings.txt";
		const settings = getSettings(ns, settingsfile);
		var verbose = false;

		var gamestate = ns.go.getGameState();
		var boardstate = ns.go.getBoardState();
		var chains = ns.go.analysis.getChains();
		var liberties = ns.go.analysis.getLiberties();
		var claimedempties = ns.go.analysis.getControlledEmptyNodes();
		var stats = ns.go.analysis.getStats();
		var nextOpponent = selectOpponent(settings);
		ns.write("/go/stats.txt", JSON.stringify(stats, null, 2), "w");


		var status = buildnodetable(boardstate, chains, liberties, claimedempties);
		var newgame = checkNewGame(boardstate);
		ns.write("/go/game/nodes.txt", JSON.stringify(status, null, 2), "w");
		var possiblemoves = findpossiblemoves(status);
		ns.write("/go/game/moves.txt", JSON.stringify(possiblemoves, null, 2), "w");
		var movetomake = finddisruptors(boardstate, status, possiblemoves, chains);
		//var time = Date.now();
		//ns.write("/go/game/nodes_" + time + ".txt", JSON.stringify(status, null, 2), "w");
		//ns.write("/go/game/moves_" + time + ".txt", JSON.stringify(possiblemoves, null, 2), "w");
		//ns.tprint(JSON.stringify(status, null, 2));
		//ns.tprint(JSON.stringify(possiblemoves, null, 2));
		var movetomakekeys = Object.keys(movetomake);
		if (newgame) {
			ns.print("Started a new game against " + nextOpponent);
			await ns.go.makeMove(2, 2);
		} else if (movetomakekeys.includes("position")) {
			//ns.print(JSON.stringify(movetomake["position"]));
			var mx = (movetomake["position"]).split("-")[0];
			var my = (movetomake["position"]).split("-")[1];
			if (verbose) { ns.print("V2: MX: " + mx + "; MY: " + my); }
			await ns.go.makeMove(mx, my);
		} else {
			//ns.print(JSON.stringify(movetomake, null, 2));
			if (_.isEmpty(movetomake)) {
				var endgame = await ns.go.passTurn();
				if (endgame["type"] == "gameOver") {
					ns.go.resetBoardState(nextOpponent, settings.gameoptions.boardsize);
				}
			} else {
				var mx = (movetomake[movetomakekeys[0]]["position"]).split("-")[0];
				var my = (movetomake[movetomakekeys[0]]["position"]).split("-")[1];
				if (verbose) { ns.print("V1: MX: " + mx + "; MY: " + my); }
				await ns.go.makeMove(mx, my);
			}
			var opponentmove = await ns.go.opponentNextTurn(true);
			if (verbose) { ns.print("Opponent Response: " + JSON.stringify(opponentmove)); }

			// Ending the game.
			gamestate = ns.go.getGameState();
			if (gamestate["blackScore"] > gamestate["whiteScore"]) {
				if (opponentmove["type"] = "pass") {
					if (verbose) { ns.print("I think we won...passing turn."); }
					var endgame = await ns.go.passTurn();
					if (verbose) { ns.print(endgame); }
					if (endgame["type"] == "gameOver") {
						ns.print("Possible win, results: BLACK: " + gamestate.blackScore + " WHITE: " + gamestate.whiteScore);
						ns.go.resetBoardState(nextOpponent, settings.gameoptions.boardsize);
					}
				}
			}
		}
	}
}

/*

nodetable["nodes"][i + "-" + j]["boardstate"] == "." && nodetable["nodes"][i + "-" + j]["controlledempties"] == "?"

					nodetable["nodes"][i + "-" + j]["boardstate"] == "O" ||
					nodetable["nodes"][i + "-" + j]["boardstate"] == "X" ||
					nodetable["nodes"][i + "-" + j]["boardstate"] == "#" ||
					nodetable["nodes"][i + "-" + j]["controlledempties"] == "O" ||
					nodetable["nodes"][i + "-" + j]["controlledempties"] == "X" ||
					nodetable["nodes"][i + "-" + j]["controlledempties"] == "#"
*/