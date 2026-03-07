import PizZip from 'pizzip';
// @ts-ignore
import Docxtemplater from 'docxtemplater';
import { chunkText } from '../utils/chunkText';

export interface PptxSection {
  name: string;
  slides: string[];
  placeholders: string[];
}

export async function extractTemplateLayout(file: File): Promise<PptxSection[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new PizZip(new Uint8Array(arrayBuffer));
  
  // 1. Map rId to slide filename
  const relsXml = zip.file('ppt/_rels/presentation.xml.rels')?.asText() || '';
  const rIdToSlide = new Map<string, string>();
  const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
  let relMatch;
  while ((relMatch = relRegex.exec(relsXml)) !== null) {
    const rId = relMatch[1];
    let target = relMatch[2];
    if (target.startsWith('slides/')) {
      target = 'ppt/' + target;
    } else if (target.startsWith('/ppt/slides/')) {
      target = target.substring(1);
    }
    rIdToSlide.set(rId, target);
  }

  // 2. Map sldId to rId
  const presXml = zip.file('ppt/presentation.xml')?.asText() || '';
  const sldIdToSlide = new Map<string, string>();
  const sldRegex = /<p:sldId id="(\d+)" r:id="([^"]+)"/g;
  let sldMatch;
  while ((sldMatch = sldRegex.exec(presXml)) !== null) {
    const sldId = sldMatch[1];
    const rId = sldMatch[2];
    const slideFile = rIdToSlide.get(rId);
    if (slideFile) {
      sldIdToSlide.set(sldId, slideFile);
    }
  }

  // 3. Extract sections
  const sections: PptxSection[] = [];
  const sectionLstMatch = presXml.match(/<p14:sectionLst[^>]*>([\s\S]*?)<\/p14:sectionLst>/);
  
  const assignedSlides = new Set<string>();

  if (sectionLstMatch) {
    const sectionLstXml = sectionLstMatch[1];
    const sectionRegex = /<p14:section name="([^"]+)"[^>]*>([\s\S]*?)<\/p14:section>/g;
    let secMatch;
    while ((secMatch = sectionRegex.exec(sectionLstXml)) !== null) {
      const secName = secMatch[1];
      const sldIdLstXml = secMatch[2];
      const slides: string[] = [];
      
      const sldIdRegex = /<p14:sldId id="(\d+)"/g;
      let idMatch;
      while ((idMatch = sldIdRegex.exec(sldIdLstXml)) !== null) {
        const sldId = idMatch[1];
        const slideFile = sldIdToSlide.get(sldId);
        if (slideFile) {
          slides.push(slideFile);
          assignedSlides.add(slideFile);
        }
      }
      
      sections.push({ name: secName, slides, placeholders: [] });
    }
  }

  // Find slides not in any section (or if no sections exist)
  const unassignedSlides: string[] = [];
  for (const slideFile of sldIdToSlide.values()) {
    if (!assignedSlides.has(slideFile)) {
      unassignedSlides.push(slideFile);
    }
  }

  if (unassignedSlides.length > 0) {
    if (sections.length === 0) {
      sections.push({ name: "Main Presentation", slides: unassignedSlides, placeholders: [] });
    } else {
      sections.unshift({ name: "Default Section", slides: unassignedSlides, placeholders: [] });
    }
  }

  // 4. Extract placeholders for each slide and assign to sections
  for (const section of sections) {
    const phs = new Set<string>();
    for (const slideFile of section.slides) {
      const xml = zip.file(slideFile)?.asText() || '';
      const rawText = xml.replace(/<[^>]+>/g, '');
      const regex = /\{([A-Z]\d{2})\}/g;
      let match;
      while ((match = regex.exec(rawText)) !== null) {
        phs.add(match[1]);
      }
    }
    section.placeholders = Array.from(phs).sort();
  }

  return sections;
}

function deleteSlide(zip: any, slideFileName: string) {
  const origSlideNumMatch = slideFileName.match(/slide(\d+)\.xml/);
  if (!origSlideNumMatch) return;
  const slideNum = origSlideNumMatch[1];

  zip.remove(slideFileName);
  zip.remove(`ppt/slides/_rels/slide${slideNum}.xml.rels`);

  let contentTypes = zip.file('[Content_Types].xml')?.asText() || '';
  const ctRegex = new RegExp(`<Override PartName="/${slideFileName.replace(/\//g, '\\/')}"[^>]*/>`, 'g');
  contentTypes = contentTypes.replace(ctRegex, '');
  zip.file('[Content_Types].xml', contentTypes);

  let presRelsXml = zip.file('ppt/_rels/presentation.xml.rels')?.asText() || '';
  const relRegex = new RegExp(`<Relationship Id="([^"]+)"[^>]+Target="[^"]*slide${slideNum}\\.xml"[^>]*/>`);
  const relMatch = relRegex.exec(presRelsXml);
  let rId = '';
  if (relMatch) {
    rId = relMatch[1];
    presRelsXml = presRelsXml.replace(relMatch[0], '');
    zip.file('ppt/_rels/presentation.xml.rels', presRelsXml);
  }

  if (rId) {
    let presXml = zip.file('ppt/presentation.xml')?.asText() || '';
    
    const sldIdMatch = new RegExp(`<p:sldId id="(\\d+)" r:id="${rId}"\\s*/>`).exec(presXml);
    const sldId = sldIdMatch ? sldIdMatch[1] : null;

    const sldIdRegex = new RegExp(`<p:sldId id="\\d+" r:id="${rId}"\\s*/>`);
    presXml = presXml.replace(sldIdRegex, '');

    if (sldId) {
      const p14SldIdRegex = new RegExp(`<p14:sldId id="${sldId}"\\s*/>`, 'g');
      presXml = presXml.replace(p14SldIdRegex, '');
    }

    zip.file('ppt/presentation.xml', presXml);
  }
}

function duplicateSlide(zip: any, slideFileName: string, numCopies: number): string[] {
  if (numCopies <= 0) return [];

  const newSlideNames: string[] = [];
  const origSlideNumMatch = slideFileName.match(/slide(\d+)\.xml/);
  if (!origSlideNumMatch) return [];
  const origSlideNum = parseInt(origSlideNumMatch[1], 10);

  // 1. Find max slide number
  let maxSlideNum = 0;
  for (const fname of Object.keys(zip.files)) {
    const m = fname.match(/ppt\/slides\/slide(\d+)\.xml/);
    if (m) maxSlideNum = Math.max(maxSlideNum, parseInt(m[1], 10));
  }

  // 2. Find max rId in presentation.xml.rels
  let presRelsXml = zip.file('ppt/_rels/presentation.xml.rels')?.asText() || '';
  let maxRelId = 0;
  let relMatch;
  const relRegex = /Id="rId(\d+)"/g;
  while ((relMatch = relRegex.exec(presRelsXml)) !== null) {
    maxRelId = Math.max(maxRelId, parseInt(relMatch[1], 10));
  }

  // 3. Find max sldId in presentation.xml
  let presXml = zip.file('ppt/presentation.xml')?.asText() || '';
  let maxSldId = 255;
  let sldMatch;
  const sldRegex = /<p:sldId id="(\d+)"/g;
  while ((sldMatch = sldRegex.exec(presXml)) !== null) {
    const val = parseInt(sldMatch[1], 10);
    maxSldId = Math.max(maxSldId, val);
  }

  // Find original rId and sldId
  const origRelMatch = new RegExp(`<Relationship[^>]+Id="([^"]+)"[^>]+Target="[^"]*slide${origSlideNum}\\.xml"`).exec(presRelsXml);
  const origRId = origRelMatch ? origRelMatch[1] : '';

  let origSldId = '';
  if (origRId) {
    const sldMatch2 = new RegExp(`<p:sldId id="(\\d+)" r:id="${origRId}"`).exec(presXml);
    if (sldMatch2) {
      origSldId = sldMatch2[1];
    }
  }

  let currentRIdToInsertAfter = origRId;
  let currentP14SldIdToInsertAfter = origSldId;

  for (let i = 0; i < numCopies; i++) {
    maxSlideNum++;
    maxRelId++;
    maxSldId++;

    const newSlideName = `ppt/slides/slide${maxSlideNum}.xml`;
    const newRelName = `ppt/slides/_rels/slide${maxSlideNum}.xml.rels`;
    newSlideNames.push(newSlideName);

    // Copy slide XML
    let slideXml = zip.file(slideFileName)?.asText() || '';
    zip.file(newSlideName, slideXml);

    // Copy rels XML if exists
    const origRelName = `ppt/slides/_rels/slide${origSlideNum}.xml.rels`;
    const origRelXml = zip.file(origRelName)?.asText();
    if (origRelXml) {
      const newRelXml = origRelXml.replace(/<Relationship[^>]+Type="[^"]*notesSlide"[^>]+\/?>/g, '');
      zip.file(newRelName, newRelXml);
    }

    // Update [Content_Types].xml
    let contentTypes = zip.file('[Content_Types].xml')?.asText() || '';
    if (contentTypes.includes('</Types>')) {
      contentTypes = contentTypes.replace('</Types>', `<Override PartName="/${newSlideName}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
      zip.file('[Content_Types].xml', contentTypes);
    }

    // Update presentation.xml.rels
    if (presRelsXml.includes('</Relationships>')) {
      const newRelStr = `<Relationship Id="rId${maxRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${maxSlideNum}.xml"/>`;
      presRelsXml = presRelsXml.replace('</Relationships>', `${newRelStr}</Relationships>`);
      zip.file('ppt/_rels/presentation.xml.rels', presRelsXml);
    }

    // Update presentation.xml
    const newSldStr = `<p:sldId id="${maxSldId}" r:id="rId${maxRelId}"/>`;
    if (currentRIdToInsertAfter) {
      const searchStr = `r:id="${currentRIdToInsertAfter}"`;
      const idx = presXml.indexOf(searchStr);
      if (idx !== -1) {
        const closeIdx = presXml.indexOf('>', idx);
        if (closeIdx !== -1) {
          let insertPos = closeIdx + 1;
          if (presXml.substring(insertPos, insertPos + 10) === '</p:sldId>') {
            insertPos += 10;
          }
          presXml = presXml.substring(0, insertPos) + newSldStr + presXml.substring(insertPos);
        }
      } else {
        presXml = presXml.replace('</p:sldIdLst>', `${newSldStr}</p:sldIdLst>`);
      }
    } else {
      presXml = presXml.replace('</p:sldIdLst>', `${newSldStr}</p:sldIdLst>`);
    }

    if (currentP14SldIdToInsertAfter) {
      const searchStrP14 = `<p14:sldId id="${currentP14SldIdToInsertAfter}"`;
      const idxP14 = presXml.indexOf(searchStrP14);
      if (idxP14 !== -1) {
        const closeIdxP14 = presXml.indexOf('/>', idxP14);
        if (closeIdxP14 !== -1) {
          const insertPosP14 = closeIdxP14 + 2;
          const newP14SldStr = `<p14:sldId id="${maxSldId}"/>`;
          presXml = presXml.substring(0, insertPosP14) + newP14SldStr + presXml.substring(insertPosP14);
        }
      }
    }

    zip.file('ppt/presentation.xml', presXml);

    currentRIdToInsertAfter = `rId${maxRelId}`;
    currentP14SldIdToInsertAfter = maxSldId.toString();
  }

  return newSlideNames;
}

export async function generateFromExtractedLayout(
  layouts: any[], 
  data: Record<string, string>
): Promise<Blob> {
  throw new Error("Use generateFromTemplate instead");
}

export async function generateFromTemplate(file: File, data: Record<string, string>, disabledSlideFiles: string[] = [], disabledSectionNames: string[] = []): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new PizZip(new Uint8Array(arrayBuffer));
  
  const slideToPlaceholders = new Map<string, string[]>();

  // Pre-process XML files to fix common typos and map placeholders to slides
  for (const [filename, fileData] of Object.entries(zip.files)) {
    if (filename.endsWith('.xml')) {
      let xml = (fileData as any).asText();
      
      // Fix duplicate open/close tags
      xml = xml.replace(/\{\{([A-Z]\d{2})/g, '{$1');
      xml = xml.replace(/([A-Z]\d{2})\}\}/g, '$1}');
      
      // Clean up split tags: sometimes PowerPoint splits {A01} into {</a:t><a:t>A01}</a:t>
      // This regex removes any XML tags that are stuck exactly between the { and the A01
      xml = xml.replace(/\{(<[^>]+>)+([A-Z]\d{2})/g, '{$2');
      xml = xml.replace(/([A-Z]\d{2})(<[^>]+>)+\}/g, '$1}');
      
      zip.file(filename, xml);

      // Map placeholders for slides
      if (filename.startsWith('ppt/slides/slide')) {
        const rawText = xml.replace(/<[^>]+>/g, '');
        const regex = /\{([A-Z]\d{2})\}/g;
        let match;
        const phs = new Set<string>();
        while ((match = regex.exec(rawText)) !== null) {
          phs.add(match[1]);
        }
        if (phs.size > 0) {
          slideToPlaceholders.set(filename, Array.from(phs));
        }
      }
    }
  }

  // Delete slides for disabled sections
  for (const slideName of disabledSlideFiles) {
    deleteSlide(zip, slideName);
    slideToPlaceholders.delete(slideName);
  }

  // Chunk the data
  const chunkedData: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith('02')) {
      // Text content gets chunked
      chunkedData[key] = chunkText(value, 130);
    } else {
      // Titles and images don't get chunked
      chunkedData[key] = [value];
    }
  }

  const flatData: Record<string, string> = {};

  // Duplicate slides and rename placeholders
  for (const [slideName, phs] of slideToPlaceholders.entries()) {
    let maxChunks = 1;
    for (const ph of phs) {
      if (chunkedData[ph]) {
        maxChunks = Math.max(maxChunks, chunkedData[ph].length);
      }
    }

    // Duplicate the slide if we have more than 1 chunk
    const newSlideNames = duplicateSlide(zip, slideName, maxChunks - 1);
    const allSlides = [slideName, ...newSlideNames];

    for (let i = 0; i < allSlides.length; i++) {
      const currentSlide = allSlides[i];
      let xml = zip.file(currentSlide)?.asText() || '';

      for (const ph of phs) {
        // CRITICAL FIX: PowerPoint often splits {A01} into multiple XML tags like <a:t>{</a:t><a:t>A01</a:t><a:t>}</a:t>
        // A simple string replace fails to find it. We use a regex that allows any XML tags between the characters.
        const chars = ph.split('');
        const regexStr = '\\{' + '(?:<[^>]+>)*' + chars.join('(?:<[^>]+>)*') + '(?:<[^>]+>)*' + '\\}';
        const regex = new RegExp(regexStr, 'g');
        
        // Rename placeholder in XML (e.g., {A01} -> {A01_0})
        xml = xml.replace(regex, `{${ph}_${i}}`);
        
        // Populate flatData for docxtemplater
        const val = chunkedData[ph]?.[i];
        if (val !== undefined) {
          flatData[`${ph}_${i}`] = val;
        } else {
          // If we run out of chunks for this specific placeholder
          if (ph.endsWith('02')) {
            flatData[`${ph}_${i}`] = ""; // Empty text for extra slides
          } else {
            flatData[`${ph}_${i}`] = chunkedData[ph]?.[0] || ""; // Repeat title/image
          }
        }
      }
      zip.file(currentSlide, xml);
    }
  }

  // Update docProps/app.xml to prevent "Repair" prompt
  let presXmlFinal = zip.file('ppt/presentation.xml')?.asText() || '';
  
  // Remove disabled sections from <p14:sectionLst>
  if (disabledSectionNames.length > 0) {
    for (const secName of disabledSectionNames) {
      const escapedSecName = secName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const secRegex = new RegExp(`<p14:section name="${escapedSecName}"[^>]*>[\\s\\S]*?<\\/p14:section>`, 'g');
      presXmlFinal = presXmlFinal.replace(secRegex, '');
    }
    // Clean up empty section list
    presXmlFinal = presXmlFinal.replace(/<p14:sectionLst[^>]*>\s*<\/p14:sectionLst>/g, '');
  }

  const finalSlideCount = (presXmlFinal.match(/<p:sldId /g) || []).length;
  zip.file('ppt/presentation.xml', presXmlFinal);

  let appXml = zip.file('docProps/app.xml')?.asText();
  if (appXml) {
    // Remove HeadingPairs and TitlesOfParts so PowerPoint regenerates them cleanly
    appXml = appXml.replace(/<HeadingPairs>[\s\S]*?<\/HeadingPairs>/g, '');
    appXml = appXml.replace(/<TitlesOfParts>[\s\S]*?<\/TitlesOfParts>/g, '');
    
    // Update the total slide count
    appXml = appXml.replace(/<Slides>\d+<\/Slides>/, `<Slides>${finalSlideCount}</Slides>`);
    zip.file('docProps/app.xml', appXml);
  }
  
  const DocxtemplaterConstructor = typeof Docxtemplater === 'function' 
    ? Docxtemplater 
    : (Docxtemplater as any).default || Docxtemplater;
  
  const doc = new DocxtemplaterConstructor(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
    nullGetter: function(part: any) {
      if (!part.module) {
        return "{" + part.value + "}";
      }
      if (part.module === "rawxml") {
        return "";
      }
      return "";
    }
  });
  
  // Render the document with the flattened data
  doc.render(flatData);
  
  // Generate the new PPTX
  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  
  return out;
}

