import {HighlightStyle} from "@codemirror/language"
import {tags as t} from "@lezer/highlight"


const chalky = "#e5c07b",
  coral = "#e06c75",
  cyan = "#56b6c2",
  invalid = "#ffffff",
  ivory = "#abb2bf",
  stone = "#7d8799", 
  malibu = "#61afef",
  sage = "#98c379",
  whiskey = "#d19a66",
  violet = "#c678dd"

  
const colors = {
  mono1: '#383a42', //blackish
  mono2: '#696c77', //grey
  mono3: '#a0a1a7', //lightgrey
  hue1: '#0184bc', //cyan
  hue2: '#4078f2', //blue
  hue3: '#a626a4', //purple
  hue4: '#50a14f', //green
  hue5: '#e45649', //red1
  hue52: '#ca1243', //red2
  hue6: '#986801', //orange1
  hue62: '#c18401', //orange2
}


export const highlightStyle = HighlightStyle.define([
    {tag: t.keyword,
     color: colors.hue3},
    {tag: [t.self],
     color: colors.hue5,
    },
    {tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
     color: colors.mono1},
    {tag: [t.function(t.variableName), t.labelName],
     color: colors.hue1},
    {tag: [t.color, t.constant(t.name), t.standard(t.name)],
     color: colors.hue6},
    {tag: [t.definition(t.name), t.separator],
     color: colors.mono1},
    {tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.namespace],
     color: colors.hue62},
    {tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
     color: colors.hue1},
    {tag: [t.meta, t.comment],
     color: colors.mono3},
    {tag: t.strong,
     fontWeight: "bold"},
    {tag: t.emphasis,
     fontStyle: "italic"},
    {tag: t.strikethrough,
     textDecoration: "line-through"},
    {tag: t.link,
     color: colors.mono3,
     textDecoration: "underline"},
    {tag: t.heading,
     fontWeight: "bold",
     color: colors.hue5},
    {tag: [t.atom, t.bool, t.special(t.variableName)],
     color: colors.hue6},
    {tag: [t.processingInstruction, t.string, t.inserted],
     color: colors.hue4},
    {tag: t.invalid,
     color: colors.mono1},
])
