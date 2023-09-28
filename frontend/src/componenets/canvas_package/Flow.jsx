

export default class Flow {


    constructor(mainCanvas) {
        this.mainCanvas = mainCanvas;

        this.graph = new Map(); // <Tile, Map<String, Set<Tile>>>

        // Flow field might not be needed bc. very similar to edges
        // this.flow = new Map(); 
        this.reverseFlow = new Map(); // <Tile, Map<String, {Tile, Float}>>

        this.globalDependencies = new Map();
    }


    // ********************Update Flow***********************

    updateGraph = (tile, deps, indeps, depsOld, indepsOld) => {
        let depsAdded = setDifference(deps, depsOld);
        let depsDeleted = setDifference(depsOld, deps);
        let indepsAdded = setDifference(indeps, indepsOld);
        let indepsDeleted = setDifference(indepsOld, indeps);

        this.mainCanvas.tiles?.forEach(nTile => {
            if (nTile !== tile) {

                if (nTile.independencies) {
                    // Process depsAdded
                    depsAdded.forEach(varName => {
                        if (nTile.independencies.has(varName)) {
                            this.addEdge(nTile, tile, varName);
                        }
                    });

                    // Process depsDeleted
                    depsDeleted.forEach(varName => {
                        if (nTile.independencies.has(varName)) {
                            this.deleteEdge(nTile, tile, varName);
                        }
                    });
                }

                if (nTile.dependencies) {
                    // Process indepsAdded
                    indepsAdded.forEach(varName => {
                        if (nTile.dependencies.has(varName)) {
                            this.addEdge(tile, nTile, varName);
                        }
                    });

                    // Process indepsDeleted
                    indepsDeleted.forEach(varName => {
                        if (nTile.dependencies.has(varName)) {
                            this.deleteEdge(tile, nTile, varName);
                        }
                    });
                }
            }
        });
    }

    setDifference = (setA, setB) => {
        let difference = []
        for (let e of setA) {
            if (!setB.has(e)) {
                difference.push(e);
            }
        }
        return difference;
    }

    addEdge = (src, dest, varName) => {
        if (this.graph.has(src)) {
            if (this.graph.get(src).has(varName)) {
                this.graph.get(src).get(varName).add(dest);
            } else {
                let varChildren = new Set();
                varChildren.add(dest);
                this.graph.get(src).set(varName, varChildren);
            }
        } else {
            let children = new Map();
            let varChildren = new Set();
            varChildren.add(dest);
            children.set(varName, varChildren);
            this.graph.set(src, children);
        }
    }

    deleteEdge = (src, dest, varName) => {
        this.graph.get(src).get(varName).delete(dest);
        
        // Delete empty sets
        if (this.graph.get(src).get(varName).size === 0) {
            this.graph.get(src).delete(varName);
            if (this.graph.get(src).size === 0) {
                this.graph.delete(src);
            }
        }
    }

    updateEntireGraph = () => {
        console.log("Updating graph...");
        let graph = new Map();
        this.mainCanvas.tiles?.forEach((tile) => {
            // console.log("******New Tile*****");

            // console.log(tile);

            let children = new Map();

            tile.independencies.forEach(varName => {
                let varChildren = this.findChildren(varName, tile);
                if (varChildren.size > 0) {
                    children.set(varName, varChildren);
                }
            });

            // console.log(children);
            if (children.size > 0) {
                graph.set(tile, children);
            }
        });
        this.graph = graph;
        console.log(graph);
        this.updateAllFlow();
    }

    findChildren = (varName, tile) => {
        let varChildren = new Set();
        this.mainCanvas.tiles.forEach((nTile) => {
            if (nTile !== tile && nTile.dependencies.has(varName)) {
                varChildren.add(nTile);
            }
        });
        return varChildren;
    }

    updateAllFlow = () => {
        console.log("Updating reverse flow...");
        this.reverseFlow = new Map();
        this.graph.forEach((vars, src) => {
            let edgeMem = new Map();
            
            vars.forEach((tgts, varName) => {
                tgts.forEach(tgt => {
                    if (!edgeMem.has(tgt)) {
                        edgeMem.set(tgt, src.distanceTo(tgt));
                    }
                    let dist = edgeMem.get(tgt);

                    if (!(this.getReverseFlowEdge(tgt, varName)?.dist < dist)) {
                        this.setReverseFlowEdge(tgt, varName, src, dist);
                    }
                });
            })
        });

        console.log(this.reverseFlow);
    }


    // Src, tgt is reversed from setflowedge
    setReverseFlowEdge =  (src, varName, tgt, dist) => {
        let child = {tgt: tgt, dist: dist};
        if (this.reverseFlow.has(src)) {
            this.reverseFlow.get(src).set(varName, child);
        } else {
            let varChildren = new Map();
            varChildren.set(varName, child);
            this.reverseFlow.set(src, varChildren);
        }
    }

    getReverseFlowEdge = (src, varName) => {
        return (this.reverseFlow.get(src)?.get(varName));
    }

    // *****************Drawing Function********************
    draw = (ctx) => {
        this.reverseFlow.forEach((vars, tgt) => {
            let dL = tgt.x;
            let dR = tgt.x + tgt.width;
            let dM = (dL + dR) / 2;

            vars.forEach((srcObj, _) => {
                let src = srcObj.tgt;
                let sL = src.x;
                let sR = src.x + src.width;
                let sM = (sL + sR) / 2;

                // Case 1
                if (dM > sL && dM < sR) {
                    if (tgt.y > src.y) {
                        this.drawArrow(
                            sM,
                            src.y + src.height,
                            dM,
                            tgt.y, 
                            ctx,
                        );
                    } else {
                        this.drawArrow(
                            sM,
                            src.y,
                            dM,
                            tgt.y + tgt.height,
                            ctx,
                        );
                    }
                } 
                // Case 2
                else if (dM <= sL && dR >= sL) {
                    if (tgt.y > src.y) {
                        this.drawArrow(
                            sL,
                            src.y + src.height / 2,
                            dM,
                            tgt.y,
                            ctx,
                        );
                    } else {
                        this.drawArrow(
                            sL,
                            src.y + src.height / 2,
                            dM,
                            tgt.y + tgt.height,
                            ctx,
                        );
                    }
                } else if (dM >= sR && dL <= sR) {
                    if (tgt.y > src.y) {
                        this.drawArrow(
                            sR,
                            src.y + src.height / 2,
                            dM,
                            tgt.y,
                            ctx,
                        );
                    } else {
                        this.drawArrow(
                            sR,
                            src.y + src.height / 2,
                            dM,
                            tgt.y + tgt.height,
                            ctx,
                        );
                    }
                }
                // Case 3
                else if (dR < sL) {
                    this.drawArrow(
                        sL,
                        src.y + src.height / 2,
                        dR,
                        tgt.y + tgt.height / 2,
                        ctx,
                    );
                } else {
                    this.drawArrow(
                        sR,
                        src.y + src.height / 2,
                        dL,
                        tgt.y + tgt.height / 2,
                        ctx,
                    );
                }
            });
        });
    }

    drawArrow(x1, y1, x2, y2, ctx) {
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';

        let headLength = 10;   // length of the arrowhead
        let headWidth = 5;     // width of the arrowhead
    
        // Calculate angle of the line
        let angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Calculate angles for the sides of the arrowhead
        let angle1 = Math.atan2(headWidth / 2, headLength);
        let angle2 = -angle1;
    
        // Draw the main line of the arrow
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    
        // Draw the arrowhead
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle + angle1), y2 - headLength * Math.sin(angle + angle1));
        ctx.lineTo(x2 - headLength * Math.cos(angle + angle2), y2 - headLength * Math.sin(angle + angle2));
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
    }




    // ********************Update Global Dependencies (Not used) ***********************
    updateGlobalDependencies = () => {
        this.globalDependencies = new Map();
        this.mainCanvas.tiles?.forEach((tile) => {
            if (tile.dependencies) {
                tile.dependencies.forEach(varName => {
                    let parent = this.findParent(varName, tile.id);
                    if (parent) {
                        if (this.globalDependencies.has(tile)) {
                            this.globalDependencies.get(tile).push(parent);
                        } else {
                            this.globalDependencies.set(tile, [parent]);
                        }
                    }
                })
            }
        });
    }

    findParent(varName, id) {
        let maxId = -1;
        let parent = null;
        this.mainCanvas.tiles.forEach((tile) => {
            if (
                tile.id !== id &&
                tile.variables &&
                tile.variables.has(varName) &&
                tile.id > maxId
            ) {
                parent = tile;
                maxId = parent.id;
            }
        })
        return parent;
    }


}