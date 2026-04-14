import PizZip from 'pizzip';
// @ts-ignore
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import { chunkText } from '../utils/chunkText';

export async function extractTemplateLayout(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new PizZip(new Uint8Array(arrayBuffer));
  
  const placeholders = new Set<string>();
  
  for (const [filename, fileData] of Object.entries(zip.files)) {
    if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
      const xml = (fileData as any).asText();
      const rawText = xml.replace(/<[^>]+>/g, '');
      const regex = /\{([A-Z]\d{2,3})\}/g;
      let match;
      while ((match = regex.exec(rawText)) !== null) {
        placeholders.add(match[1]);
      }
    }
  }
  
  return [{
    slideIndex: 1,
    placeholders: Array.from(placeholders).map(id => ({ id }))
  }];
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
  // CRITICAL FIX: Only match <p:sldId id="..."> to avoid matching <p:sldMasterId id="2147483648">
  // PowerPoint crashes if sldId >= 2147483648
  let presXml = zip.file('ppt/presentation.xml')?.asText() || '';
  let maxSldId = 255;
  let sldMatch;
  const sldRegex = /<p:sldId id="(\d+)"/g;
  while ((sldMatch = sldRegex.exec(presXml)) !== null) {
    const val = parseInt(sldMatch[1], 10);
    maxSldId = Math.max(maxSldId, val);
  }

  // Find original rId
  const origRelMatch = new RegExp(`<Relationship[^>]+Id="([^"]+)"[^>]+Target="[^"]*slide${origSlideNum}\\.xml"`).exec(presRelsXml);
  const origRId = origRelMatch ? origRelMatch[1] : '';

  let currentRIdToInsertAfter = origRId;

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
      // CRITICAL FIX: Remove notesSlide relationships. Multiple slides cannot share the same notes slide.
      // This is a primary cause of the "Repair" prompt in PowerPoint.
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
    zip.file('ppt/presentation.xml', presXml);

    currentRIdToInsertAfter = `rId${maxRelId}`;
  }

  // CRITICAL FIX: Update docProps/app.xml to prevent "Repair" prompt
  // PowerPoint checks if the <Slides> count matches the <TitlesOfParts> vector size.
  let appXml = zip.file('docProps/app.xml')?.asText();
  if (appXml) {
    // Remove HeadingPairs and TitlesOfParts so PowerPoint regenerates them cleanly
    appXml = appXml.replace(/<HeadingPairs>[\s\S]*?<\/HeadingPairs>/g, '');
    appXml = appXml.replace(/<TitlesOfParts>[\s\S]*?<\/TitlesOfParts>/g, '');
    
    // Update the total slide count
    const slidesMatch = appXml.match(/<Slides>(\d+)<\/Slides>/);
    if (slidesMatch) {
      const currentSlides = parseInt(slidesMatch[1], 10);
      appXml = appXml.replace(`<Slides>${currentSlides}</Slides>`, `<Slides>${currentSlides + numCopies}</Slides>`);
    }
    zip.file('docProps/app.xml', appXml);
  }

  return newSlideNames;
}

function removeShapeWithText(xml: string, text: string): string {
  let idx = xml.indexOf(text);
  while (idx !== -1) {
    // Find the closest preceding <p:sp>, <p:pic>, or <p:graphicFrame>
    const tags = ['<p:sp>', '<p:sp ', '<p:pic>', '<p:pic ', '<p:graphicFrame>', '<p:graphicFrame '];
    let start = -1;
    let endTag = '';
    
    for (const tag of tags) {
      const tagIdx = xml.lastIndexOf(tag, idx);
      if (tagIdx > start) {
        start = tagIdx;
        if (tag.startsWith('<p:sp')) endTag = '</p:sp>';
        else if (tag.startsWith('<p:pic')) endTag = '</p:pic>';
        else if (tag.startsWith('<p:graphicFrame')) endTag = '</p:graphicFrame>';
      }
    }
    
    if (start !== -1 && endTag) {
      const end = xml.indexOf(endTag, idx);
      if (end !== -1) {
        xml = xml.substring(0, start) + xml.substring(end + endTag.length);
        idx = xml.indexOf(text);
        continue;
      }
    }
    break;
  }
  return xml;
}

export async function generateFromExtractedLayout(
  layouts: any[], 
  data: Record<string, string>
): Promise<Blob> {
  throw new Error("Use generateFromTemplate instead");
}

export async function generateFromTemplate(file: File, data: Record<string, any>): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new PizZip(new Uint8Array(arrayBuffer));
  
  const slideToPlaceholders = new Map<string, string[]>();
  const shapeSizes: Record<string, {width: number, height: number}> = {};

  // Pre-process XML files to fix common typos and map placeholders to slides
  for (const [filename, fileData] of Object.entries(zip.files)) {
    if (filename.endsWith('.xml')) {
      let xml = (fileData as any).asText();
      
      // Fix duplicate open/close tags
      xml = xml.replace(/\{\{([A-Z]\d{2,3})/g, '{$1');
      xml = xml.replace(/([A-Z]\d{2,3})\}\}/g, '$1}');
      
      // Fix docxtemplater duplicate close tags issue where it sees "B010}}"
      // This happens when we replace {B01} with {B01_0} and there was already a stray }
      xml = xml.replace(/\}\}/g, '}');
      
      zip.file(filename, xml);

      // Map placeholders for slides
      if (filename.startsWith('ppt/slides/slide')) {
        const rawText = xml.replace(/<[^>]+>/g, '');
        const regex = /\{([A-Z]\d{2,3})\}/g;
        let match;
        const phs = new Set<string>();
        while ((match = regex.exec(rawText)) !== null) {
          phs.add(match[1]);
        }
        if (phs.size > 0) {
          slideToPlaceholders.set(filename, Array.from(phs));
        }

        // Extract shape sizes for image placeholders and force center alignment
        const spRegex = /<p:sp[\s>][\s\S]*?<\/p:sp>/g;
        let spMatch;
        while ((spMatch = spRegex.exec(xml)) !== null) {
          const spXml = spMatch[0];
          const rawSpText = spXml.replace(/<[^>]+>/g, '');
          const phRegex = /\{([A-Z]\d{2,3})\}/g;
          let phMatch;
          let isImageShape = false;
          while ((phMatch = phRegex.exec(rawSpText)) !== null) {
            const ph = phMatch[1];
            if (ph.startsWith('C')) {
              isImageShape = true;
              const extMatch = /<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/.exec(spXml);
              if (extMatch) {
                const cx = parseInt(extMatch[1], 10);
                const cy = parseInt(extMatch[2], 10);
                shapeSizes[ph] = { width: Math.round(cx / 9525), height: Math.round(cy / 9525) };
              }
            }
          }
          
          if (isImageShape) {
            // Force vertical centering (anchor="ctr")
            let newSpXml = spXml;
            if (/<a:bodyPr[^>]*anchor="[^"]*"/.test(newSpXml)) {
              newSpXml = newSpXml.replace(/(<a:bodyPr[^>]*anchor=")[^"]*(")/, '$1ctr$2');
            } else if (/<a:bodyPr/.test(newSpXml)) {
              newSpXml = newSpXml.replace(/<a:bodyPr/, '<a:bodyPr anchor="ctr"');
            }
            
            // Force horizontal centering (algn="ctr")
            if (/<a:pPr[^>]*algn="[^"]*"/.test(newSpXml)) {
              newSpXml = newSpXml.replace(/(<a:pPr[^>]*algn=")[^"]*(")/g, '$1ctr$2');
            } else if (/<a:pPr/.test(newSpXml)) {
              newSpXml = newSpXml.replace(/<a:pPr/g, '<a:pPr algn="ctr"');
            } else if (/<a:p>/.test(newSpXml)) {
              newSpXml = newSpXml.replace(/<a:p>/g, '<a:p><a:pPr algn="ctr"/>');
            }
            
            if (newSpXml !== spXml) {
              xml = xml.replace(spXml, newSpXml);
            }
          }
        }
      }
    }
  }

  // Chunk the data
  const chunkedData: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      chunkedData[key] = value;
    } else if (key.startsWith('B') && typeof value === 'string') {
      // Text content gets chunked
      chunkedData[key] = chunkText(value, 130);
    } else {
      // Titles and images don't get chunked
      chunkedData[key] = [String(value || '')];
    }
  }

  const flatData: Record<string, string> = {};
  const slideGroups: Record<string, string[]> = {};

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
    slideGroups[slideName] = allSlides;

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
        let newPh = `{${ph}_${i}}`;
        if (ph.startsWith('C')) {
          newPh = `{%${ph}_${i}}`;
        }
        xml = xml.replace(regex, newPh);
        
        // Populate flatData for docxtemplater
        const val = chunkedData[ph]?.[i];
        let finalVal = "";
        if (val !== undefined) {
          finalVal = val;
        } else {
          // If we run out of chunks for this specific placeholder
          if (ph.startsWith('B')) {
            finalVal = ""; // Empty text for extra slides
          } else {
            finalVal = chunkedData[ph]?.[0] || ""; // Repeat title/image
          }
        }
        
        if (ph.startsWith('C') && !finalVal) {
          // Remove the shape if it's an image placeholder and the value is empty
          xml = removeShapeWithText(xml, newPh);
        } else {
          flatData[`${ph}_${i}`] = finalVal;
        }
      }
      zip.file(currentSlide, xml);
    }
  }

  // Handle slide interleaving/reordering
  if (data._slideOrder && Array.isArray(data._slideOrder)) {
    let presRelsXml = zip.file('ppt/_rels/presentation.xml.rels')?.asText() || '';
    let presXml = zip.file('ppt/presentation.xml')?.asText() || '';
    
    // Map slideName to rId
    const slideToRId: Record<string, string> = {};
    const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
    let relMatch;
    while ((relMatch = relRegex.exec(presRelsXml)) !== null) {
      const rId = relMatch[1];
      let target = relMatch[2];
      const slideMatch = target.match(/slide\d+\.xml/);
      if (slideMatch) {
        target = 'ppt/slides/' + slideMatch[0];
      }
      slideToRId[target] = rId;
    }

    // Map placeholder instances (e.g., 'A014_0') to rIds (array to handle placeholders on multiple slides)
    const phInstanceToRIds: Record<string, string[]> = {};
    for (const [slideName, phs] of slideToPlaceholders.entries()) {
      const rIds = slideGroups[slideName]?.map(s => slideToRId[s]).filter(Boolean) || [];
      for (const ph of phs) {
        for (let i = 0; i < rIds.length; i++) {
          const key = `${ph}_${i}`;
          if (!phInstanceToRIds[key]) phInstanceToRIds[key] = [];
          phInstanceToRIds[key].push(rIds[i]);
        }
      }
    }

    // Extract sldId tags
    const sldIdLstMatch = presXml.match(/<p:sldIdLst[^>]*>([\s\S]*?)<\/p:sldIdLst>/);
    if (sldIdLstMatch) {
      const sldIdLstInner = sldIdLstMatch[1];
      const sldTags = sldIdLstInner.match(/<p:sldId[^>]+r:id="[^"]+"[^>]*>(?:<\/p:sldId>)?/g) || [];
      
      let newSldTags = [...sldTags];

      for (const orderGroup of data._slideOrder) {
        // orderGroup is an array of placeholder instances, e.g., ['A014_0', 'A014_1', 'A015_0']
        // or an array of arrays of placeholder instances, e.g., [['B07_0', 'A07_0'], ['B06_0', 'A06_0']]
        const groupRIds: string[] = [];
        const seenRIds = new Set<string>();
        const allPossibleRIds = new Set<string>();
        
        for (const phItem of orderGroup) {
          let rIdToAdd: string | null = null;
          
          const tryAddRId = (phInstance: string) => {
            const possibleRIds = phInstanceToRIds[phInstance];
            if (possibleRIds) {
              possibleRIds.forEach(id => allPossibleRIds.add(id));
              for (const rId of possibleRIds) {
                if (!seenRIds.has(rId)) {
                  return rId;
                }
              }
            }
            return null;
          };

          if (Array.isArray(phItem)) {
            for (const phInstance of phItem) {
              rIdToAdd = tryAddRId(phInstance);
              if (rIdToAdd) break;
            }
            // Also collect all possible rIds for the other phInstances in the array
            // even if we already found a match, so we can clean them up
            for (const phInstance of phItem) {
               const possibleRIds = phInstanceToRIds[phInstance];
               if (possibleRIds) {
                 possibleRIds.forEach(id => allPossibleRIds.add(id));
               }
            }
          } else {
            rIdToAdd = tryAddRId(phItem);
          }
          
          if (rIdToAdd) {
            groupRIds.push(rIdToAdd);
            seenRIds.add(rIdToAdd);
          }
        }

        // Remove unused duplicate slides
        newSldTags = newSldTags.filter(tag => {
          const match = tag.match(/r:id="([^"]+)"/);
          if (match) {
            const rId = match[1];
            if (allPossibleRIds.has(rId) && !seenRIds.has(rId)) {
              return false; // Remove this unused slide
            }
          }
          return true;
        });

        if (groupRIds.length > 1) {
          // Find the minimum index in newSldTags for all these rIds
          let minIdx = newSldTags.length;
          const allRIdsToOrder = new Set(groupRIds);
          
          for (const rId of groupRIds) {
            const idx = newSldTags.findIndex(tag => {
              const match = tag.match(/r:id="([^"]+)"/);
              return match && match[1] === rId;
            });
            if (idx !== -1 && idx < minIdx) {
              minIdx = idx;
            }
          }

          if (minIdx < newSldTags.length) {
            // Remove all these tags from newSldTags
            const extractedTags: Record<string, string> = {};
            newSldTags = newSldTags.filter(tag => {
              const match = tag.match(/r:id="([^"]+)"/);
              if (match && allRIdsToOrder.has(match[1])) {
                extractedTags[match[1]] = tag;
                return false;
              }
              return true;
            });

            // Build the ordered sequence
            const orderedSequence: string[] = [];
            for (const rId of groupRIds) {
              if (extractedTags[rId]) {
                orderedSequence.push(extractedTags[rId]);
              }
            }

            // Insert the ordered sequence at minIdx
            newSldTags.splice(minIdx, 0, ...orderedSequence);
          }
        }
      }

      // Replace in presXml
      presXml = presXml.replace(/(<p:sldIdLst[^>]*>)[\s\S]*?(<\/p:sldIdLst>)/, `$1${newSldTags.join('')}$2`);
      zip.file('ppt/presentation.xml', presXml);
    }
  }

  const DocxtemplaterConstructor = typeof Docxtemplater === 'function' 
    ? Docxtemplater 
    : (Docxtemplater as any).default || Docxtemplater;

  const opts = {
    centered: true,
    getImage: function (tagValue: string) {
      if (!tagValue) return null;
      let url = tagValue;
      if (tagValue.startsWith('{')) {
        try {
          const data = JSON.parse(tagValue);
          url = data.url;
        } catch (e) {
          // ignore
        }
      }
      if (url && url.startsWith('data:image')) {
        const base64Data = url.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
      return null;
    },
    getSize: function (img: any, tagValue: string, tagName: string) {
      let maxWidth = 800;
      let maxHeight = 500;
      
      // Try to get the exact shape size from the template
      const basePh = tagName.split('_')[0];
      if (shapeSizes[basePh]) {
        maxWidth = shapeSizes[basePh].width;
        maxHeight = shapeSizes[basePh].height;
      }

      if (tagValue && tagValue.startsWith('{')) {
        try {
          const data = JSON.parse(tagValue);
          if (data.width && data.height) {
            const ratio = Math.min(maxWidth / data.width, maxHeight / data.height);
            return [Math.round(data.width * ratio), Math.round(data.height * ratio)];
          }
        } catch (e) {
          // ignore
        }
      }
      return [maxWidth, maxHeight];
    }
  };
  const imageModule = new ImageModule(opts);
  
  const doc = new DocxtemplaterConstructor(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
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

