export type StaticElement = {
  kind: "text";
  value: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
};

export type StaticSlide = {
  type: "static";
  elements: StaticElement[];
};

export type DynamicSlide = {
  type: "dynamic";
  contentBox: {
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize?: number;
    color?: string;
    align?: "left" | "center" | "right";
  };
};

export type SlideConfig = StaticSlide | DynamicSlide;

export type TemplateConfig = {
  slides: SlideConfig[];
};

export const templateConfig: TemplateConfig = {
  slides: [
    {
      type: "static",
      elements: [
        { kind: "text", value: "Welcome", x: 1, y: 1, w: 8, h: 1, fontSize: 32, align: "center" },
        { kind: "text", value: "Subtitle", x: 1, y: 2, w: 8, h: 1, fontSize: 18, align: "center" }
      ]
    },
    {
      type: "dynamic",
      contentBox: {
        x: 1,
        y: 1.5,
        w: 8,
        h: 4,
        fontSize: 20,
        align: "center"
      }
    },
    {
      type: "static",
      elements: [
        { kind: "text", value: "Closing", x: 1, y: 2, w: 8, h: 1, fontSize: 32, align: "center" }
      ]
    }
  ]
};
