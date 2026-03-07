import pptxgen from "pptxgenjs";
import { TemplateConfig } from "../config/templateConfig";
import { chunkText } from "../utils/chunkText";

export async function generatePresentation(text: string, config: TemplateConfig) {
  // Step 1: Initialize new PptxGenJS instance
  const pres = new pptxgen();

  // Step 2: Loop through templateConfig.slides
  for (const slideConfig of config.slides) {
    if (slideConfig.type === "static") {
      // Create new slide
      const slide = pres.addSlide();
      
      // Render all defined elements exactly as specified
      for (const element of slideConfig.elements) {
        if (element.kind === "text") {
          slide.addText(element.value, {
            x: element.x,
            y: element.y,
            w: element.w || 8,
            h: element.h || 1,
            fontSize: element.fontSize || 18,
            color: element.color || "000000",
            align: element.align || "left",
          });
        }
      }
    } else if (slideConfig.type === "dynamic") {
      // Run chunking algorithm
      const chunks = chunkText(text, 130);
      
      // For each chunk:
      for (const chunk of chunks) {
        // Create new slide
        const slide = pres.addSlide();
        
        // Add textbox using contentBox layout
        slide.addText(chunk, {
          x: slideConfig.contentBox.x,
          y: slideConfig.contentBox.y,
          w: slideConfig.contentBox.w,
          h: slideConfig.contentBox.h,
          fontSize: slideConfig.contentBox.fontSize || 18,
          color: slideConfig.contentBox.color || "000000",
          align: slideConfig.contentBox.align || "left",
        });
      }
    }
  }

  // Step 3: Export file as GeneratedPresentation.pptx
  await pres.writeFile({ fileName: "GeneratedPresentation.pptx" });
}
