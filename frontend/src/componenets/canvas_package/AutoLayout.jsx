
export default class AutoLayout {

    static generateLayout = (mainCanvas) => {
        mainCanvas.flow.getFlowOrder();
        
        // Perform dfs
        let nodeDepths = new Map(); // <Tile, Integer>
        let nodeHeights = new Map(); // <Tile, Integer>
        let discovered = new Set();
        let treeLevels = [];
        let treeRoots = [];

        for (let tile of mainCanvas.flow.flowOrderArray) {
            if (!discovered.has(tile)) {
                let levels = new Map(); // <Integer, Set<Tiles>>
                this.dfs(
                    tile, 
                    mainCanvas.flow.flow, 
                    nodeDepths, 
                    nodeHeights,
                    levels, 
                    discovered
                );
                treeLevels.push(levels);
                treeRoots.push(tile);
            }
        }

        // Drawing
        this.drawStyle1(treeRoots, treeLevels, nodeHeights, mainCanvas)

        if (mainCanvas.selected.tile) {
            mainCanvas.addButton.attachTo(mainCanvas.selected.tile);
        }
        mainCanvas.render();
    }

    static drawStyle1 = (treeRoots, treeLevels, nodeHeights, mainCanvas) => {
        let x = 150;
        let y = 150;

        for (let i = 0; i < treeRoots.length; i++) {
            y = this.drawStyle1Helper(treeRoots[i], x, y, treeLevels[i], nodeHeights);
        }

        mainCanvas.render();


        // let maxLeafHeight = new Map(); // Tile -> Integer

        // nodeHeights.forEach((height, tile) => {
            
        // });

        // for (let i = 0; i < treeLevels.length; i++) {
        //     let sortedLevels = Array.from(treeLevels[i]).sort((a, b) => a[0] - b[0]);

        //     sortedLevels.forEach(entry => {
        //         let level = entry[0];
        //         let sortedLevelSet = Array.from(entry[1]).sort((a, b) => nodeHeights.get(a) - nodeHeights.get(b));
        //         let maxHeight = 0;

        //         if (level === 0) {
                    
        //         }

        //         // Case 1: is leaf
        //         // Step 1: identify parent
        //         // Step 2: attach to parent

        //         // Case 2: is internal node
        //         // Step 1: put in main
        //         // Step 2: keep track of position?

        //     });
        // }
    }
    
    // DFS-based drawing function
    // Returns new y coordinate
    static drawStyle1Helper = (src, x, y, levels, nodeHeights, currDepth = 0) => {
        // Determine vertical space for this level
        let sideHeightOverflow = 100;
        let vertSpace = src.height + sideHeightOverflow;
        let vertMargin = 20;
        levels.get(currDepth + 1)?.forEach(tile => {
            if ((nodeHeights.get(tile) === 0) && (tile.height > vertSpace)) {
                vertSpace = tile.height;
            }
        });

        // Draw src
        src.x = x;
        src.y = y;
        
        // Process children
        // Edge case (should only happen when tree's a single node)
        if (!levels.has(currDepth + 1)) {
            return (y + vertSpace + vertMargin);
        }

        let nextLevelArray = Array.from(levels.get(currDepth + 1)).sort((a, b) => {            
            let heightDiff = nodeHeights.get(a) - nodeHeights.get(b);
            if (heightDiff !== 0) {
                return heightDiff;
            }
            let xDiff = a.x - b.x;
            if (xDiff !== 0) {
                return xDiff;
            }
            return a.y - b.y;
        });

        // Side initial position
        let sideMargin = 30;
        let sideX = x + src.width + sideMargin;
        let sideY = y;
        let encounteredNonLeaf = false;
        let leafCount = 0;

        // Leaf to side if more than one leaf; first leaf to bottom

        nextLevelArray.forEach((tile, i) => {
            // Draw side tiles (those with height 0)
            if (nodeHeights.get(tile) === 0) {
                leafCount++;
                // First leaf go below
                if (i === 0) {
                    tile.x = x;
                    tile.y = y + vertSpace + vertMargin;
                    return;
                }

                // Other leaves go the side
                // Start new column if overflows
                if (sideY + tile.height > y + vertSpace) {
                    sideX += tile.width + sideMargin;
                    sideY = y;
                }
                console.log(sideX, sideY);
                tile.x = sideX;
                tile.y = sideY;

                sideY += tile.height + sideMargin;
            } 
            // Recursively draw children tiles
            else {
                if (!encounteredNonLeaf) {
                    // First non-leaf tile
                    encounteredNonLeaf = true;
                    y += vertSpace + vertMargin;
                    if (leafCount !== 0) {
                        y += nextLevelArray[0].height + sideHeightOverflow + vertMargin;
                    }
                }
                y = this.drawStyle1Helper(tile, x, y, levels, nodeHeights, currDepth + 1);
            }
        });

        if (!encounteredNonLeaf) {
            // Never had non-leaf tile
            y += vertSpace + vertMargin;
        }

        return y;
    }

    static getFirstParent = (tile, mainCanvas) => {
        let ret = null;
        let minDist = -1;
        mainCanvas.reverseFlow.get(tile).forEach((parentDist, _) => {
            if (minDist === -1 || parentDist.dist < minDist) {
                ret = parentDist.tgt;
                minDist = parentDist.dist;
            }
        });
        return ret;
    }

    static drawStyle2 = (treeLevels, nodeHeights, mainCanvas) => {
        let tileWidth = mainCanvas.tiles[0].width;
        let xStart = 150 + tileWidth / 2;
        let xMinMargin = 30;
        let yMargin = 80;
        let y = 200;

        for (let i = 0; i < treeLevels.length; i++) {
            console.log("HERE", treeLevels[i]);
            // Find widest level
            let maxLevel = -1;
            let maxLevelSize = -1;
            treeLevels[i].forEach((levelSet, level) => {
                if (levelSet.size > maxLevelSize || (levelSet.size === maxLevelSize && level < maxLevel)) {
                    maxLevel = level;
                    maxLevelSize = levelSet.size;
                }
            });

            console.log(maxLevel);
            
            let maxLevelWidth = (maxLevelSize === 1) ? tileWidth :
                (maxLevelSize-1) * (tileWidth + xMinMargin)
            ;
            console.log(maxLevelWidth);

            let maxHeight = 0;
            // Draw tree
            let sortedLevels = Array.from(treeLevels[i]).sort((a, b) => a[0] - b[0]);

            console.log(sortedLevels);

            sortedLevels.forEach(entry => {
                let level = entry[0];
                let sortedLevelSet = Array.from(entry[1]).sort((a, b) => nodeHeights.get(a) - nodeHeights.get(b));
                
                let x = xStart - tileWidth / 2;
                let xMargin = 0;
                if (level !== 0 && maxLevel !== 0) {
                    x -= (maxLevelWidth * level) / (2 * maxLevel);
                    xMargin = (maxLevelWidth * level) / (maxLevel * (sortedLevelSet.length - 1)) - tileWidth;
                }

                console.log(x);
                console.log(xMargin);

                sortedLevelSet.forEach(tile => {
                    tile.x = x;
                    tile.y = y;

                    maxHeight = Math.max(maxHeight, tile.height);
                    // Update x;
                    x += tileWidth + xMargin;
                });

                // Update y
                y += maxHeight + yMargin;
            });
        }
    }

    // Function returns height as int, and sets the depth during execution
    static dfs = (src, flow, nodeDepths, nodeHeights, levels, discovered, depth = 0) => {
        console.log(discovered);
        discovered.add(src);
        nodeDepths.set(src, depth);
        if (levels.has(depth)) {
            levels.get(depth).add(src);
        } else {
            levels.set(depth, new Set([src]));
        }

        // Base case
        if (!src.drawFlow || !flow.get(src) || flow.get(src).size === 0) {
            nodeHeights.set(src, 0);
            return 0;
        }

        // Recursive case
        let height = -1;
        flow.get(src).forEach((children, _) => {
            children.forEach(child => {
                if (!discovered.has(child) && child.drawFlow) {
                    let childHeight = this.dfs(
                        child, 
                        flow, 
                        nodeDepths, 
                        nodeHeights, 
                        levels, 
                        discovered, 
                        depth + 1
                    );
                    height = Math.max(height, childHeight);
                }
            });
        });

        height += 1;
        nodeHeights.set(src, height);
        return height;
    }

    static handleOverlap = (tile) => {

    }
}