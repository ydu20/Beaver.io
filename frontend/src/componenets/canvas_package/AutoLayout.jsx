
export default class AutoLayout {

    static generateLayout = (mainCanvas) => {
        mainCanvas.flow.getFlowOrder();
        
        // Perform dfs
        let nodeDepths = new Map(); // <Tile, Integer>
        let nodeHeights = new Map(); // <Tile, Integer>
        let discovered = new Set();
        let treeRoots = [];
        let treeLevels = [];

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
            }
        }

        // Drawing
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

        if (mainCanvas.selected.tile) {
            mainCanvas.addButton.attachTo(mainCanvas.selected.tile);
        }
        mainCanvas.render();
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