
export default class AutoLayout {


    static generateLayout = (mainCanvas) => {
        mainCanvas.flow.getFlowOrder();
        
        let nodeDepths = new Map(); // <Tile, Integer>
        let nodeHeights = new Map(); // <Tile, Integer>
        let discovered = new Set();

        for (let tile of mainCanvas.flow.flowOrderArray) {
            if (!discovered.has(tile)) {
                let height = this.dfs(
                    tile, 
                    mainCanvas.flow.flow, 
                    nodeDepths, 
                    nodeHeights, 
                    discovered
                );
                nodeHeights.set(tile, height);
            }
        }
        console.log(nodeDepths, nodeHeights);
    }

    // Function returns height as int, and sets the depth during execution
    static dfs = (src, flow, nodeDepths, nodeHeights, discovered, depth = 0) => {
        discovered.add(src);
        nodeDepths.set(src, depth);

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