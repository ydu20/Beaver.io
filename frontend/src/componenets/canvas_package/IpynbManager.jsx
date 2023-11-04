import AutoLayout from "./AutoLayout";



export default class IpynbManager {

    static createNotebook(mainCanvas) {

    }

    static loadFromFile(fileJson, mainCanvas) {
        console.log("HERE!!");
        console.log(fileJson);

        mainCanvas.tiles = [];

        let markdown = "";

        let lastTile = null;

        fileJson.cells.map((cell, i) => {
            if (cell.cell_type === 'markdown') {
                markdown = markdown + cell.source.join('');
            } else if (cell.cell_type === 'code') {
                let code = cell.source.join('');
                lastTile = mainCanvas.addTile(lastTile);

                mainCanvas.markdownEditor.startEditing(lastTile);
                mainCanvas.markdownEditor.draw();
                mainCanvas.markdownEditor.replaceMarkdown(markdown);
                mainCanvas.markdownEditor.endEditing();
                
                mainCanvas.codeEditor.startCoding(lastTile);
                mainCanvas.codeEditor.draw();
                mainCanvas.codeEditor.replaceCode(code);
                mainCanvas.codeEditor.endCoding();

                markdown = "";
            }
        });

        mainCanvas.flow.updateEntireGraph();
        mainCanvas.flow.updateAllFlow();
        AutoLayout.generateLayout(mainCanvas);
    }
}