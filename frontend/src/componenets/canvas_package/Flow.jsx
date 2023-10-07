

export default class Flow {

    constructor(mainCanvas) {
        this.mainCanvas = mainCanvas;

        this.graph = new Map(); // <Tile, Map<String, Set<Tile>>>

        this.reverseGraph = new Map(); // <Tile, Map<String, Set<Tile>>>

        this.flow = null; // <Tile, Map<String, Set<Tile>>>
        this.reverseFlow = new Map(); // <Tile, Map<String, {tgt: Tile, dist: Float}>>

        this.globalDependencies = new Map();

        this.flowOrderMap = null;
        this.flowOrderArray = null;
    }

    // ********************Calculate flow order***********************
    getFlowOrder = () => {
        if (this.flowOrderMap !== null) {
            return this.flowOrderMap;
        }

        // Need to construct flow base on reverseFlow
        let flow = new Map();
        this.reverseFlow.forEach((varParents, tgt) => {
            varParents.forEach((srcObj, varName) => {
                this.setEdge(srcObj.tgt, tgt, varName, flow);    
            });
        });
        this.flow = flow;

        let tilesByY = this.mainCanvas.tiles.slice().sort((a, b) => a.y - b.y);
        let flowOrderArray = [];
        let discovered = new Set();

        for (let tile of tilesByY) {
            if (!discovered.has(tile)) {
                this.bfs(tile, flow, flowOrderArray, discovered);
            }
        }
        // Convert flowOrder to a tile -> tile map

        let flowOrderMap = new Map();
        for (let i = 0; i < flowOrderArray.length - 1; i++) {
            flowOrderMap.set(flowOrderArray[i], flowOrderArray[i+1]);
        }
        this.flowOrderMap = flowOrderMap;
        this.flowOrderArray = flowOrderArray;
        return flowOrderMap;
    }

    nextInFlow = (tile) => {
        if (this.flowOrderMap === null) {
            this.getFlowOrder();
        }
        return this.flowOrderMap.get(tile);
    }
    
    prevInFlow = (tile) => {
        if (this.flowOrderMap === null) {
            this.getFlowOrder();
        }
        for (let [curr, next] of this.flowOrderMap) {
            if (next === tile) {
                return curr;
            }
        }
        return null;
    }

    bfs = (src, flow, flowOrderArray, discovered) => {
        let iterList = [src];

        while (iterList.length > 0) {
            let nextIterList = [];
            for (let tile of iterList) {
                // Check if tile has already been visited
                if (!discovered.has(tile)) {
                    // Add tile to discovered
                    discovered.add(tile);
                    flowOrderArray.push(tile);

                    // Iterate through children
                    if (tile.drawFlow && flow.has(tile)) {
                        let allChildren = new Set();
                        flow.get(tile).forEach((children, _) => {
                            children.forEach(child => {
                                if (child.drawFlow) {
                                    allChildren.add(child);
                                }
                            });
                        });
                        let sortedChildren = [...allChildren].sort((a, b) => a.x - b.x);
                        nextIterList.push(...sortedChildren);
                    }
                }
            }
            iterList = nextIterList;
        }
    }

    // ********************Update Flow***********************

    updateGraph = (tile, deps, indeps, depsOld, indepsOld) => {
        this.flowOrderMap = null;
        this.flowOrderArray = null;
        let depsAdded = this.setDifference(deps, depsOld);
        let depsDeleted = this.setDifference(depsOld, deps);
        let indepsAdded = this.setDifference(indeps, indepsOld);
        let indepsDeleted = this.setDifference(indepsOld, indeps);
        
        this.mainCanvas.tiles?.forEach(nTile => {
            if (nTile !== tile) {
                if (nTile.independencies) {
                    // Process depsAdded
                    depsAdded.forEach(varName => {
                        if (nTile.independencies.has(varName)) {
                            this.setEdge(nTile, tile, varName, this.graph);
                            this.setEdge(tile, nTile, varName, this.reverseGraph);
                        }
                    });

                    // Process depsDeleted
                    depsDeleted.forEach(varName => {
                        if (nTile.independencies.has(varName)) {
                            this.removeEdge(nTile, tile, varName, this.graph);
                            this.removeEdge(tile, nTile, varName, this.reverseGraph);
                        }
                    });
                }
                if (nTile.dependencies) {
                    // Process indepsAdded
                    indepsAdded.forEach(varName => {
                        if (nTile.dependencies.has(varName)) {
                            this.setEdge(tile, nTile, varName, this.graph);
                            this.setEdge(nTile, tile, varName, this.reverseGraph);
                        }
                    });

                    // Process indepsDeleted
                    indepsDeleted.forEach(varName => {
                        if (nTile.dependencies.has(varName)) {
                            this.removeEdge(tile, nTile, varName, this.graph);
                            this.removeEdge(nTile, tile, varName, this.reverseGraph);
                        }
                    });
                }
            }
        });

        // console.log(this.graph);
        // console.log(this.mainCanvas.tiles);

        // this.updateAllFlow();
        this.updateFlowByVarChange(tile, depsAdded, depsDeleted, indepsAdded, indepsDeleted);
    }

    setDifference = (setA, setB) => {
        let difference = new Set();
        setA?.forEach(e => {
            if (!setB?.has(e)) {
                difference.add(e);
            }
        });
        return difference;
    }

    setEdge = (src, dest, varName, graph) => {
        if (graph.has(src)) {
            if (graph.get(src).has(varName)) {
                graph.get(src).get(varName).add(dest);
            } else {
                let varChildren = new Set();
                varChildren.add(dest);
                graph.get(src).set(varName, varChildren);
            }
        } else {
            let children = new Map();
            let varChildren = new Set();
            varChildren.add(dest);
            children.set(varName, varChildren);
            graph.set(src, children);
        }
    }

    removeEdge = (src, dest, varName, graph) => {
        graph.get(src).get(varName).delete(dest);
        
        // Delete empty sets
        if (graph.get(src).get(varName).size === 0) {
            graph.get(src).delete(varName);
            if (graph.get(src).size === 0) {
                graph.delete(src);
            }
        }
    }

    updateEntireGraph = () => {
        this.flowOrderMap = null;
        this.flowOrderArray = null;
        let graph = new Map();
        this.mainCanvas.tiles?.forEach((tile) => {
            let children = new Map();

            tile.independencies.forEach(varName => {
                let varChildren = this.findChildren(varName, tile);
                if (varChildren.size > 0) {
                    children.set(varName, varChildren);
                }
            });

            // Update reverse graph
            if (children.size > 0) {
                graph.set(tile, children);
                children.forEach((varChildren, varName) => {
                    varChildren.forEach(child => {
                        this.setEdge(child, tile, varName, this.reverseGraph);
                    });
                });
            }
        });
        this.graph = graph;
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
        this.flowOrderMap = null;
        this.flowOrderArray = null;
        this.reverseFlow = new Map();
        this.graph.forEach((vars, src) => {
            let distMem = new Map();
            
            vars.forEach((tgts, varName) => {
                tgts.forEach(tgt => {
                    if (!distMem.has(tgt)) {
                        distMem.set(tgt, src.distanceTo(tgt));
                    }
                    let dist = distMem.get(tgt);

                    if (!(this.getReverseFlowEdge(tgt, varName)?.dist < dist)) {
                        // Add Reverse Flow Edge
                        this.setReverseFlowEdge(tgt, varName, src, dist);
                    }
                });
            });
        });
    }

    updateFlowByPosChange = (tile) => {
        this.flowOrderMap = null;
        this.flowOrderArray = null;
        let distMem = new Map();
        // Update inflows
        this.updateInflows(tile, distMem);

        // Update outflows
        this.updateOutflows(tile);
    }

    updateFlowByVarChange = (tile, depsAdded, depsDeleted, indepsAdded, indepsDeleted) => {
        this.flowOrderMap = null;
        this.flowOrderArray = null;
        let distMem = new Map();

        // Process depsAdded
        this.updateInflows(tile, distMem, depsAdded);
        
        // Process depsDeleted
        let varParents = this.reverseFlow.get(tile);
        varParents?.forEach((_, varName) => {
            if (depsDeleted.has(varName)) {
                this.removeReverseFlowEdge(tile, varName);
            }
        });
        
        // Process indepsAdded
        this.updateOutflows(tile, indepsAdded);
       
        // Process indepsDeleted
        let affectedChildren = new Map(); // tile -> set(varName)

        this.reverseFlow.forEach((varParent, child) => {
            varParent.forEach((_, varName) => {
                if (indepsDeleted.has(varName)) {
                    varParent.delete(varName);
                    if (!affectedChildren.has(child)) {
                        affectedChildren.set(child, new Set([varName]));
                    } else {
                        affectedChildren.get(child).add(varName);
                    }
                }
            });

            if (varParent.size === 0) {
                this.reverseFlow.delete(child);
            }
        });

        affectedChildren.forEach((deps, child) => {
            this.updateInflows(child, new Map(), deps);
        });
    }

    updateInflows = (tile, distMem, deps = null) => {
        let varParents = this.reverseGraph.get(tile);
        let minDist = -1;

        varParents?.forEach((parents, varName) => {
            if (deps === null || deps.has(varName)) {
                parents.forEach(parent => {
                    if (!distMem.has(parent)) {
                        distMem.set(parent, tile.distanceTo(parent));
                    }
                    let dist = distMem.get(parent);
                    
                    if (minDist === -1 || dist < minDist) {
                        this.setReverseFlowEdge(tile, varName, parent, dist);
                        minDist = dist;
                    }
                });
            }
        });
    }
    
    updateOutflows = (tile, indeps = null) => {
        let varChildren = this.graph.get(tile);

        varChildren?.forEach((children, varName) => {
            if (indeps === null || indeps.has(varName)) {
                children.forEach(child => {
                    this.updateInflows(child, new Map(), indeps);
                });
            }
        });
    }

    setReverseFlowEdge = (child, varName, parent, dist) => {
        let parentDist = {tgt: parent, dist: dist};
        if (this.reverseFlow.has(child)) {
            this.reverseFlow.get(child).set(varName, parentDist);
        } else {
            let varParents = new Map();
            varParents.set(varName, parentDist);
            this.reverseFlow.set(child, varParents);
        }
    }

    getReverseFlowEdge = (child, varName) => {
        return (this.reverseFlow.get(child)?.get(varName));
    }

    removeReverseFlowEdge = (child, varName) => {
        this.reverseFlow.get(child).delete(varName);
        if (this.reverseFlow.get(child).size === 0) {
            this.reverseFlow.delete(child);
        }
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

                // Check if both source and tgt want flows drawn.
                if (!(src.drawFlow && tgt.drawFlow)) {
                    return;
                }

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
        ctx.lineWidth = 1;

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
}