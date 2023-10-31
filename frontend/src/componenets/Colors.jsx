import { useEffect, useState} from "react";

export default function Colors() {

    const colors = {
        chalky : "#e5c07b",
        coral : "#e06c75",
        cyan : "#56b6c2",
        invalid : "#ffffff",
        ivory : "#abb2bf",
        stone : "#7d8799", 
        malibu : "#61afef",
        sage : "#98c379",
        whiskey : "#d19a66",
        violet : "#c678dd",
        mono1 : 'hsl(230, 8%, 24%)',
        mono2 : 'hsl(230, 6%, 44%)',
        mono3 : 'hsl(230, 4%, 64%)',
        hue1 : 'hsl(198, 99%, 37%)',
        hue2 : 'hsl(221, 87%, 60%)',
        hue3 : 'hsl(301, 63%, 40%)',
        hue4 : 'hsl(119, 34%, 47%)',
        hue5 : 'hsl(  5, 74%, 59%)',
        hue52 : 'hsl(344, 84%, 43%)',
        hue6 : 'hsl(41, 99%, 30%)',
        hue62 : 'hsl(41, 99%, 38%)',
    }

    const colorStyle = {
        marginTop: 50,
        height: 100,
        width: 100,
    }

    const [fonts, setFonts] = useState([]);

    function getComputedCharHeight(fontFamily, fontSize) {
        const testElement = document.createElement('span');
    
        testElement.style.fontFamily = fontFamily;
        testElement.style.fontSize = `${fontSize}px`;
        testElement.innerHTML = 'A'; 

        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        document.body.appendChild(testElement);
    
        // console.log(testElement.offsetHeight);
        // console.log(testElement.offsetWidth);

        let charHeight = testElement.offsetHeight;
        let charWidth = testElement.offsetWidth;
    
        document.body.removeChild(testElement);

        return {
            size: fontSize,
            charHeight: charHeight,
            charWidth: charWidth,
        }
    }

    useEffect(() => {
        let sizes = [];

        for (let i = 4; i <= 15; i++) {
            sizes.push(getComputedCharHeight('Arial', i * 2));
        }

        setFonts(sizes);
    }, []);

    return (
        <>
            {Object.entries(colors).map(([name, value], i) => (
                <div key = {i} style = {{...colorStyle, backgroundColor:value}}>
                    {name}
                </div>
            ))}
            {fonts.map((font, i) => (
                <div key = {i}>
                    {`Size: ${font.size}, height: ${font.charHeight}, width: ${font.charWidth}`}
                </div>
            ))}
        </>
    )
}