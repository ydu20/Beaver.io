

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

    return (
        <>
            {Object.entries(colors).map(([name, value], i) => (
                <div key = {i} style = {{...colorStyle, backgroundColor:value}}>
                    {name}
                </div>
            ))}
        </>
    )
}