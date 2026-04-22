/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileUp, FileDown, Settings, ChevronRight, ChevronLeft, Check, Plus, Trash2, AlignLeft, X, Type } from 'lucide-react';
import { extractTemplateLayout, generateFromTemplate } from './services/templateService';
import { chunkText } from './utils/chunkText';
import { ImageUploadList, ImageItem } from './components/ImageUploadList';
import { SettingsModal } from './components/SettingsModal';
import { TextifyModal } from './components/TextifyModal';

const getAutoText = (type: string, lang: string) => {
  if (type === 'amin') return "\n\nU: Amin";
  return "";
};

const MASS_FIELDS = [
  { id: 'laguPembuka', label: 'Lagu Pembuka', type: 'dynamic', titleCode: 'A01', textCode: 'B01', imageCode: 'C01', defaultTitleId: '(umat berdiri) NYANYIAN PERARAKAN MASUK', defaultTitleJv: '(umat jumeneng) KIDUNG PAMBUKA', interleaveType: 'empty', itemLabel: 'Lagu Pembuka' },
  { id: 'tuhanKasihanilah1', label: 'Tuhan Kasihanilah 1', type: 'static', titleCode: 'A02', textCode: 'B02', defaultTitleId: 'TUHAN KASIHANILAH KAMI', defaultTitleJv: 'GUSTI NYUWUN KAWELASAN' },
  { id: 'tuhanKasihanilah2', label: 'Tuhan Kasihanilah 2', type: 'static', titleCode: 'A03', textCode: 'B03', defaultTitleId: 'TUHAN KASIHANILAH KAMI', defaultTitleJv: 'GUSTI NYUWUN KAWELASAN' },
  { id: 'tuhanKasihanilah3', label: 'Tuhan Kasihanilah 3', type: 'static', titleCode: 'A04', textCode: 'B04', defaultTitleId: 'TUHAN KASIHANILAH KAMI', defaultTitleJv: 'GUSTI NYUWUN KAWELASAN' },
  { id: 'doaKolekta', label: 'Doa Kolekta', type: 'static', titleCode: 'A05', textCode: 'B05', defaultTitleId: '(umat berdiri) DOA KOLEKTA', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN KOLEKTA', autoText: 'amin' },
  { id: 'bacaan1', label: 'Bacaan 1', type: 'static', titleCode: 'A06', textCode: 'B06', defaultTitleId: '(umat duduk) BACAAN I | (Sumber)', defaultTitleJv: '(umat lenggah) WAOSAN I | (Sumber)' },
  { id: 'mazmurRefren', label: 'Mazmur Tanggapan Refren', type: 'static', titleCode: 'A07', textCode: 'B07', imageCode: 'C07', defaultTitleId: '(umat duduk) MAZMUR TANGGAPAN', defaultTitleJv: '(umat lenggah) KIDUNG PANGLIMBANG' },
  { id: 'mazmurAyat', label: 'Mazmur Tanggapan Ayat', type: 'dynamic', titleCode: 'A08', textCode: 'B08', imageCode: 'C08', defaultTitleId: '(umat duduk) MAZMUR TANGGAPAN', defaultTitleJv: '(umat lenggah) KIDUNG PANGLIMBANG', interleaveType: 'refren', itemLabel: 'Ayat' },
  { id: 'bacaan2', label: 'Bacaan 2', type: 'static', titleCode: 'A09', textCode: 'B09', defaultTitleId: '(umat duduk) BACAAN II | (Sumber)', defaultTitleJv: '(umat lenggah) WAOSAN II | (Sumber)' },
  { id: 'baitPengantarInjilRefren', label: 'Bait Pengantar Injil Refren', type: 'static', titleCode: 'A010', textCode: 'B010', imageCode: 'C010', defaultTitleId: '(umat berdiri) BAIT PENGANTAR INJIL', defaultTitleJv: '(umat jumeneng) KIDUNG CECELA' },
  { id: 'baitPengantarInjilBait', label: 'Bait Pengantar Injil Bait', type: 'static', titleCode: 'A011', textCode: 'B011', imageCode: 'C011', defaultTitleId: '(umat berdiri) BAIT PENGANTAR INJIL', defaultTitleJv: '(umat jumeneng) KIDUNG CECELA' },
  { id: 'bacaanInjil', label: 'Bacaan Injil', type: 'static', titleCode: 'A012', textCode: 'B012', defaultTitleId: '(umat berdiri) BACAAN INJIL | (Sumber)', defaultTitleJv: '(umat jumeneng) INJIL SUCI | (Sumber)' },
  { id: 'doaUmatImam1', label: 'Doa Umat Imam 1', type: 'static', titleCode: 'A013', textCode: 'B013', defaultTitleId: '(umat berdiri) DOA UMAT', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN UMAT' },
  { id: 'doaUmatLektor', label: 'Doa Umat Lektor', type: 'dynamic', titleCode: 'A014', textCode: 'B014', defaultTitleId: '(umat berdiri) DOA UMAT', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN UMAT', interleaveType: 'jawabanUmat', itemLabel: 'Lektor' },
  { id: 'doaUmatJawabanUmat', label: 'Doa Umat Jawaban Umat', type: 'static', titleCode: 'A015', textCode: 'B015', defaultTitleId: '(umat berdiri) DOA UMAT', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN UMAT' },
  { id: 'doaUmatImam2', label: 'Doa Umat Imam 2', type: 'static', titleCode: 'A016', textCode: 'B016', defaultTitleId: '(umat berdiri) DOA UMAT', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN UMAT' },
  { id: 'laguPersembahan', label: 'Lagu Persembahan', type: 'dynamic', titleCode: 'A017', textCode: 'B017', imageCode: 'C017', defaultTitleId: '(umat duduk) NYANYIAN PERSEMBAHAN', defaultTitleJv: '(umat lenggah) KIDUNG PISUNGSUNG', interleaveType: 'empty', itemLabel: 'Lagu Persembahan' },
  { id: 'doaAtasPersembahan', label: 'Doa Atas Persembahan', type: 'static', titleCode: 'A018', textCode: 'B018', defaultTitleId: '(umat berdiri) DOA ATAS PERSEMBAHAN', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN PISUNGSUNG', autoText: 'amin' },
  { id: 'laguKomuni', label: 'Lagu Komuni', type: 'dynamic', titleCode: 'A019', textCode: 'B019', imageCode: 'C019', defaultTitleId: '(umat duduk) MADAH PUJIAN', defaultTitleJv: '(umat lenggah) KIDUNG IRINGAN KOMUNI', interleaveType: 'empty', itemLabel: 'Lagu Komuni' },
  { id: 'doaSesudahKomuni', label: 'Doa Sesudah Komuni', type: 'static', titleCode: 'A020', textCode: 'B020', defaultTitleId: '(umat berdiri) DOA SESUDAH KOMUNI', defaultTitleJv: '(umat jumeneng) SEMBAHYANGAN BAKDA KOMUNI', autoText: 'amin' },
  { id: 'laguPenutup', label: 'Lagu Penutup', type: 'dynamic', titleCode: 'A021', textCode: 'B021', imageCode: 'C021', defaultTitleId: '(umat berdiri) NYANYIAN PERARAKAN KELUAR', defaultTitleJv: '(umat jumeneng) KIDUNG PANUTUP', interleaveType: 'empty', itemLabel: 'Lagu Penutup' }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [openingFile, setOpeningFile] = useState<File | null>(null);
  const [closingFile, setClosingFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [textifyTarget, setTextifyTarget] = useState<{ type: 'static' | 'custom', key: string } | { type: 'dynamic', fieldId: string, index: number } | null>(null);
  
  const [language, setLanguage] = useState('bahasa indonesia');
  const [massType, setMassType] = useState('mass'); // 'mass', 'custom', or 'announcement'
  const [outputFileName, setOutputFileName] = useState('');
  const [openingOutputName, setOpeningOutputName] = useState('');
  const [closingOutputName, setClosingOutputName] = useState('');

  const [massDynamicFields, setMassDynamicFields] = useState<Record<string, any[]>>({});
  const [announcementData, setAnnouncementData] = useState<any>({
    pengumuman: [{ title: '', text: '', images: [] }],
    perkawinan: [{ mode: 'image', title: '', pria: '', lingkPria: '', wanita: '', lingkWanita: '', images: [] }],
    kolekte: {},
    kolekteQris: {}
  });

  useEffect(() => {
    if (massType === 'announcement') {
      const isJv = language === 'bahasa jawa';
      setAnnouncementData((prev: any) => ({
        ...prev,
        pengumuman: prev.pengumuman.map((item: any) => ({
          ...item,
          title: item.title || (isJv ? 'PAWARTOS PAROKI MINGGU MENIKA' : 'PENGUMUMAN PAROKI MINGGU INI')
        })),
        kolekte: {
          A101: isJv ? 'KOLEKTE MINGGU KAPENGKER' : 'KOLEKTE MINGGU LALU',
          B101: isJv ? 'KOLEKTE KAPISAN (I)' : 'KOLEKTE PERTAMA (I)',
          B102: isJv ? 'KOLEKTE KAPING KALIH (II)' : 'KOLEKTE KEDUA (II)',
          B103: 'APBU',
          B104: 'Gerakan Peduli Pendidikan',
          B105: 'lalalala belum ada template',
          ...prev.kolekte
        },
        kolekteQris: {
          A106: 'PENERIMAAN KOLEKTE MELALUI QRIS',
          B106: isJv ? 'KOLEKTE KAPISAN (I)' : 'KOLEKTE PERTAMA (I)',
          B107: isJv ? 'KOLEKTE KAPING KALIH (II)' : 'KOLEKTE KEDUA (II)',
          ...prev.kolekteQris
        },
        perkawinan: prev.perkawinan.map((item: any) => ({
          ...item,
          title: item.title || (isJv ? 'WARA - WARA PENGANTEN KAPISAN / KEDUA / KETIGA' : 'PENGUMUMAN PERKAWINAN YANG PERTAMA / KEDUA / KETIGA')
        }))
      }));
    }
  }, [massType, language]);

  useEffect(() => {
    if (massType === 'mass') {
      setFormData(prev => {
        const newData = { ...prev };
        let changed = false;
        MASS_FIELDS.forEach(field => {
          if (field.type === 'static') {
            if (!newData[field.titleCode!]) {
              newData[field.titleCode!] = language === 'bahasa jawa' ? field.defaultTitleJv : field.defaultTitleId;
              changed = true;
            } else if (newData[field.titleCode!] === field.defaultTitleId || newData[field.titleCode!] === field.defaultTitleJv) {
              newData[field.titleCode!] = language === 'bahasa jawa' ? field.defaultTitleJv : field.defaultTitleId;
              changed = true;
            }
          }
        });
        return changed ? newData : prev;
      });

      setMassDynamicFields(prev => {
        const newDynamic = { ...prev };
        let changed = false;
        MASS_FIELDS.forEach(field => {
          if (field.type === 'dynamic') {
            const defaultTitle = language === 'bahasa jawa' ? field.defaultTitleJv : field.defaultTitleId;
            if (!newDynamic[field.id] || newDynamic[field.id].length === 0) {
              newDynamic[field.id] = [{ title: defaultTitle, text: '', images: [] }];
              changed = true;
            } else {
              newDynamic[field.id] = newDynamic[field.id].map((item: any) => {
                if (item.title === field.defaultTitleId || item.title === field.defaultTitleJv) {
                  return { ...item, title: defaultTitle };
                }
                return item;
              });
              changed = true;
            }
          }
        });
        return changed ? newDynamic : prev;
      });
    }
  }, [massType, language, placeholders]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    setOutputFileName(file.name.replace('.pptx', ''));
    setIsExtracting(true);
    
    try {
      const extractedLayouts = await extractTemplateLayout(file);
      
      const phs = new Set<string>();
      extractedLayouts.forEach(l => l.placeholders.forEach((p: any) => phs.add(p.id)));
      const extracted = Array.from(phs).sort();
      
      setPlaceholders(extracted);
      
      // Initialize form data
      const initialData: Record<string, string> = {};
      extracted.forEach(p => {
        initialData[p] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Failed to extract placeholders:", error);
      alert("Failed to read the PPTX template. Please ensure it is a valid file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    const isAnnouncement = massType === 'announcement';
    if (!isAnnouncement && !templateFile) return;
    if (isAnnouncement && (!openingFile || !closingFile)) return;
    
    setIsGenerating(true);
    try {
      const finalData: Record<string, any> = {};
      
      if (isAnnouncement) {
        // Build Announcement data
        finalData._skipChunking = true;
        
        // Pengumuman
        finalData['A100'] = announcementData.pengumuman.map((p: any) => p.title);
        finalData['B100'] = announcementData.pengumuman.map((p: any) => p.text);
        finalData['C100'] = announcementData.pengumuman.map((p: any) => p.images[0] ? JSON.stringify(p.images[0]) : '');
        
        // Kolekte
        Object.entries(announcementData.kolekte).forEach(([k, v]) => {
          finalData[k] = v;
        });
        
        // Kolekte Qris
        Object.entries(announcementData.kolekteQris).forEach(([k, v]) => {
          finalData[k] = v;
        });
        
        // Perkawinan
        finalData['A108'] = announcementData.perkawinan.map((p: any) => p.title);
        finalData['C108'] = announcementData.perkawinan.map((p: any) => p.mode === 'image' ? (p.images[0] ? JSON.stringify(p.images[0]) : '') : '');
        finalData['B108'] = announcementData.perkawinan.map((p: any) => p.mode === 'image' ? p.pria : '');
        finalData['D108'] = announcementData.perkawinan.map((p: any) => p.mode === 'image' ? p.lingkPria : '');
        finalData['B109'] = announcementData.perkawinan.map((p: any) => p.mode === 'image' ? p.wanita : '');
        finalData['D109'] = announcementData.perkawinan.map((p: any) => p.mode === 'image' ? p.lingkWanita : '');
        finalData['B110'] = announcementData.perkawinan.map((p: any) => p.mode === 'text' ? p.pria : '');
        finalData['D110'] = announcementData.perkawinan.map((p: any) => p.mode === 'text' ? p.lingkPria : '');
        finalData['B111'] = announcementData.perkawinan.map((p: any) => p.mode === 'text' ? p.wanita : '');
        finalData['D111'] = announcementData.perkawinan.map((p: any) => p.mode === 'text' ? p.lingkWanita : '');

        // Generate Opening
        const openingBlob = await generateFromTemplate(openingFile!, finalData);
        downloadFile(openingBlob, openingOutputName.trim() ? `${openingOutputName}.pptx` : openingFile!.name);
        
        // Generate Closing
        const closingBlob = await generateFromTemplate(closingFile!, finalData);
        downloadFile(closingBlob, closingOutputName.trim() ? `${closingOutputName}.pptx` : closingFile!.name);

      } else {
        // Pre-process formData to convert ImageItem arrays to JSON string arrays
        Object.keys(formData).forEach(key => {
          if (Array.isArray(formData[key])) {
            finalData[key] = formData[key].map((img: any) => JSON.stringify(img));
          } else {
            finalData[key] = formData[key];
          }
        });
        
        if (massType === 'mass') {
          // Append auto text for static fields
          MASS_FIELDS.forEach(field => {
            if (field.type === 'static' && field.autoText && field.textCode) {
              const autoText = getAutoText(field.autoText, language);
              const currentText = finalData[field.textCode] || '';
              if (currentText && !currentText.includes(autoText.trim())) {
                 finalData[field.textCode] = currentText + autoText;
              } else if (!currentText) {
                 finalData[field.textCode] = autoText.trim();
              }
            }
          });

          const jawabanUmatTitle = finalData['A015'] || '(umat berdiri) DOA UMAT';
          const jawabanUmatText = finalData['B015'] || '';
          const refrenTitle = finalData['A07'] || '(umat duduk) MAZMUR TANGGAPAN';
          const refrenText = finalData['B07'] || '';
          const refrenImages = Array.isArray(finalData['C07']) ? finalData['C07'] : [finalData['C07']].filter(Boolean);
          const refrenImage = refrenImages[0] || '';
          
          const slideOrderGroups: any[] = [];

          MASS_FIELDS.forEach(field => {
            if (field.type === 'dynamic') {
              const items = massDynamicFields[field.id];
              if (items && items.length > 0) {
                const titles: string[] = [];
                const texts: string[] = [];
                const images: string[] = [];
                
                items.forEach((item, index) => {
                  // Chunk the text for this item
                  const itemChunks = chunkText(item.text || '', 130);
                  const itemImages = item.images || [];
                  const numChunks = Math.max(1, itemChunks.length, itemImages.length);
                  
                  for (let i = 0; i < numChunks; i++) {
                    titles.push(item.title || '');
                    texts.push(itemChunks[i] || itemChunks[0] || '');
                    if (field.imageCode) {
                      const img = itemImages[i] || itemImages[0];
                      images.push(img ? JSON.stringify(img) : '');
                    }
                  }
                  
                  // Add the separator for 'empty'
                  if (field.interleaveType === 'empty') {
                    titles.push('');
                    texts.push('');
                    images.push('');
                  }
                });
                
                if (field.titleCode) finalData[field.titleCode] = titles;
                if (field.textCode) finalData[field.textCode] = texts;
                if (field.imageCode) finalData[field.imageCode] = images;

                // Handle structural interleaving (using exact slides)
                if (field.interleaveType === 'jawabanUmat' || field.interleaveType === 'refren') {
                  const isJU = field.interleaveType === 'jawabanUmat';
                  const targetTitleCode = isJU ? 'A015' : 'A07';
                  const targetTextCode = isJU ? 'B015' : 'B07';
                  const targetImageCode = isJU ? '' : 'C07';
                  
                  const targetTitle = isJU ? jawabanUmatTitle : refrenTitle;
                  const targetText = isJU ? jawabanUmatText : refrenText;
                  const targetImage = isJU ? '' : refrenImage;

                  const targetTitles: string[] = [];
                  const targetTexts: string[] = [];
                  const targetImages: string[] = [];

                  const slideOrder: string[][] = [];
                  let mainChunkIndex = 0;
                  let targetIndex = 0;

                  if (!isJU) {
                    // For Mazmur (Refren), we want the initial Refren first
                    targetTitles.push(targetTitle);
                    targetTexts.push(targetText);
                    if (targetImageCode) targetImages.push(targetImage);
                    
                    const targetPhs = [];
                    if (targetTextCode) targetPhs.push(`${targetTextCode}_${targetIndex}`);
                    if (targetTitleCode) targetPhs.push(`${targetTitleCode}_${targetIndex}`);
                    slideOrder.push(targetPhs);
                    targetIndex++;
                  }

                  items.forEach((item) => {
                    const itemChunks = chunkText(item.text || '', 130);
                    const itemImages = item.images || [];
                    const numChunks = Math.max(1, itemChunks.length, itemImages.length);
                    
                    // Add main chunks to slide order
                    for (let i = 0; i < numChunks; i++) {
                      const mainPhs = [];
                      if (field.textCode) mainPhs.push(`${field.textCode}_${mainChunkIndex}`);
                      if (field.titleCode) mainPhs.push(`${field.titleCode}_${mainChunkIndex}`);
                      if (field.imageCode) mainPhs.push(`${field.imageCode}_${mainChunkIndex}`);
                      slideOrder.push(mainPhs);
                      mainChunkIndex++;
                    }

                    // Add target (interleaved) slide
                    targetTitles.push(targetTitle);
                    targetTexts.push(targetText);
                    if (targetImageCode) targetImages.push(targetImage);
                    
                    const targetPhs = [];
                    if (targetTextCode) targetPhs.push(`${targetTextCode}_${targetIndex}`);
                    if (targetTitleCode) targetPhs.push(`${targetTitleCode}_${targetIndex}`);
                    slideOrder.push(targetPhs);
                    targetIndex++;
                  });

                  finalData[targetTitleCode] = targetTitles;
                  finalData[targetTextCode] = targetTexts;
                  if (targetImageCode) finalData[targetImageCode] = targetImages;

                  if (field.titleCode) {
                    slideOrderGroups.push(slideOrder);
                  }
                }
              }
            }
          });

          if (slideOrderGroups.length > 0) {
            finalData['_slideOrder'] = slideOrderGroups;
          }
        }

        const blob = await generateFromTemplate(templateFile!, finalData);
        const finalName = outputFileName.trim() ? `${outputFileName}.pptx` : templateFile!.name;
        downloadFile(blob, finalName);
      }
    } catch (error: any) {
      console.error("Failed to generate presentation:", error);
      alert(`Failed to generate presentation: ${error.message || String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDynamicInputChange = (fieldId: string, index: number, key: string, value: any) => {
    setMassDynamicFields(prev => {
      const newItems = [...prev[fieldId]];
      newItems[index] = { ...newItems[index], [key]: value };
      return { ...prev, [fieldId]: newItems };
    });
  };

  const addDynamicItem = (fieldId: string, defaultTitleId: string, defaultTitleJv: string) => {
    setMassDynamicFields(prev => {
      const items = prev[fieldId] || [];
      const firstItemTitle = items.length > 0 ? items[0].title : (language === 'bahasa jawa' ? defaultTitleJv : defaultTitleId);
      return {
        ...prev,
        [fieldId]: [...items, { title: firstItemTitle, text: '', images: [] }]
      };
    });
  };

  const removeDynamicItem = (fieldId: string, index: number) => {
    setMassDynamicFields(prev => {
      const newItems = [...prev[fieldId]];
      newItems.splice(index, 1);
      return { ...prev, [fieldId]: newItems };
    });
  };

  const handleParagraphify = (text: string) => {
    if (!text) return '';
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(' ');
  };

  const handleTextifyInsert = (text: string) => {
    if (!textifyTarget) return;
    
    if (textifyTarget.type === 'static' || textifyTarget.type === 'custom') {
      const currentText = formData[textifyTarget.key] || '';
      handleInputChange(textifyTarget.key, currentText ? currentText + '\n\n' + text : text);
    } else if (textifyTarget.type === 'dynamic') {
      const items = massDynamicFields[textifyTarget.fieldId];
      if (items && items[textifyTarget.index]) {
        const currentText = items[textifyTarget.index].text || '';
        handleDynamicInputChange(textifyTarget.fieldId, textifyTarget.index, 'text', currentText ? currentText + '\n\n' + text : text);
      }
    }
    
    setTextifyTarget(null);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { id: 1, name: 'Setup' },
    { id: 2, name: 'Upload' },
    { id: 3, name: 'Workspace' },
    { id: 4, name: 'Download' }
  ];

  return (
    <div className="min-h-screen font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center retro-box p-6 bg-retro-bg relative">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-4 right-4 retro-button p-2 text-retro-text"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-bold tracking-tight uppercase" style={{ fontFamily: 'VT323, monospace' }}>
            OTOMATEKS
          </h1>
          <p className="mt-2 text-base font-bold">
            v2.3 - Stable
          </p>
        </div>

        <div className="flex flex-col h-[600px] max-h-[75vh] retro-box p-6 bg-retro-bg">
          <div className="flex-grow space-y-6 overflow-y-auto pr-2">
            
            {/* Step 1: Setup */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'VT323, monospace' }}>1. SETUP</h2>
                <p className="text-sm font-bold">Default setting for the Generated PPTx.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-base font-bold uppercase">Language</label>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <button
                        type="button"
                        onClick={() => setLanguage('bahasa indonesia')}
                        className={`p-4 text-left transition-all ${
                          language === 'bahasa indonesia' 
                            ? 'retro-box bg-retro-box-light' 
                            : 'retro-button'
                        }`}
                      >
                        <div className="font-bold uppercase">Bahasa Indonesia</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('bahasa jawa')}
                        className={`p-4 text-left transition-all ${
                          language === 'bahasa jawa' 
                            ? 'retro-box bg-retro-box-light' 
                            : 'retro-button'
                        }`}
                      >
                        <div className="font-bold uppercase">Bahasa Jawa</div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-retro-border border-dashed">
                    <label className="text-base font-bold uppercase">TYPE</label>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <button
                        type="button"
                        onClick={() => setMassType('mass')}
                        className={`p-4 text-left transition-all ${
                          massType === 'mass' 
                            ? 'retro-box bg-retro-box-light' 
                            : 'retro-button'
                        }`}
                      >
                        <div className="font-bold uppercase text-xs">Mass</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMassType('announcement')}
                        className={`p-4 text-left transition-all ${
                          massType === 'announcement' 
                            ? 'retro-box bg-retro-box-light' 
                            : 'retro-button'
                        }`}
                      >
                        <div className="font-bold uppercase text-xs">Announcement</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMassType('custom')}
                        className={`p-4 text-left transition-all ${
                          massType === 'custom' 
                            ? 'retro-box bg-retro-box-light' 
                            : 'retro-button'
                        }`}
                      >
                        <div className="font-bold uppercase text-xs">Custom Field</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Upload PPT */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'VT323, monospace' }}>2. UPLOAD</h2>
                <p className="text-sm font-bold">
                  {massType === 'announcement' 
                    ? 'Select Opening and Closing Master PowerPoint files.' 
                    : 'Select a Master PowerPoint file.'}
                </p>
                
                {massType === 'announcement' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opening Upload */}
                    <div className="retro-box-inset p-4 hover:bg-retro-box-dark transition-colors text-center">
                      <label htmlFor="opening-upload" className="cursor-pointer block">
                        <FileUp className="mx-auto h-8 w-8 text-retro-text mb-2" />
                        <span className="text-sm font-bold block uppercase underline">Opening Slide</span>
                        <input id="opening-upload" type="file" accept=".pptx" className="sr-only" 
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setOpeningFile(f);
                              const name = f.name.replace('.pptx', '');
                              if (!outputFileName) setOutputFileName(name);
                              if (!openingOutputName) setOpeningOutputName(name);
                            }
                          }} 
                        />
                      </label>
                      {openingFile && (
                        <div className="mt-2 p-1 retro-box text-xs bg-retro-box-light flex items-center justify-center gap-1">
                          <Check className="w-3 h-3 text-retro-accent" />
                          <span className="truncate max-w-[150px]">{openingFile.name}</span>
                        </div>
                      )}
                    </div>
                    {/* Closing Upload */}
                    <div className="retro-box-inset p-4 hover:bg-retro-box-dark transition-colors text-center">
                      <label htmlFor="closing-upload" className="cursor-pointer block">
                        <FileUp className="mx-auto h-8 w-8 text-retro-text mb-2" />
                        <span className="text-sm font-bold block uppercase underline">Closing Slide</span>
                        <input id="closing-upload" type="file" accept=".pptx" className="sr-only" 
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setClosingFile(f);
                              const name = f.name.replace('.pptx', '');
                              if (!closingOutputName) setClosingOutputName(name);
                            }
                          }} 
                        />
                      </label>
                      {closingFile && (
                        <div className="mt-2 p-1 retro-box text-xs bg-retro-box-light flex items-center justify-center gap-1">
                          <Check className="w-3 h-3 text-retro-accent" />
                          <span className="truncate max-w-[150px]">{closingFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center retro-box-inset px-6 py-10 hover:bg-retro-box-dark transition-colors">
                    <div className="text-center">
                      <FileUp className="mx-auto h-12 w-12 text-retro-text" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 justify-center font-bold">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-transparent text-retro-accent hover:text-retro-accent-hover underline decoration-2 underline-offset-2"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" accept=".pptx" className="sr-only" onChange={handleFileUpload} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 font-bold mt-2">PPTX up to 10MB</p>
                      {templateFile && (
                        <div className="mt-4 p-3 retro-box flex items-center justify-center gap-2 bg-retro-box-light">
                          <Check className="w-4 h-4 text-retro-accent" />
                          <span className="text-sm font-bold">
                            {templateFile.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isExtracting && (
                  <div className="text-center py-4 font-bold flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-retro-border border-t-transparent rounded-full animate-spin" />
                    Extracting placeholders...
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Workspace */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'VT323, monospace' }}>3. CONFIGURATION</h2>
                <p className="text-sm font-bold">Start creating.</p>
                
                {massType === 'announcement' ? (
                  <div className="space-y-8">
                    {/* Pengumuman Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b-2 border-retro-border pb-2">
                        <h3 className="text-xl font-bold uppercase">Pengumuman</h3>
                        <button
                          type="button"
                          onClick={() => setAnnouncementData((prev: any) => ({
                            ...prev,
                            pengumuman: [...prev.pengumuman, { title: prev.pengumuman[0]?.title || '', text: '', images: [] }]
                          }))}
                          className="retro-button px-3 py-1 text-sm font-bold flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add More
                        </button>
                      </div>
                      <div className="space-y-6">
                        {announcementData.pengumuman.map((item: any, index: number) => (
                          <div key={index} className="retro-box p-4 bg-retro-box-light space-y-4 relative">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => setAnnouncementData((prev: any) => ({
                                  ...prev,
                                  pengumuman: prev.pengumuman.filter((_: any, i: number) => i !== index)
                                }))}
                                className="absolute top-2 right-2 retro-button p-1 text-retro-accent"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <div>
                              <label className="block text-sm font-bold uppercase mb-1">Title</label>
                              <input
                                type="text"
                                className="block w-full retro-box-inset py-2 px-3 text-sm"
                                value={item.title}
                                onChange={(e) => {
                                  const newList = [...announcementData.pengumuman];
                                  newList[index].title = e.target.value;
                                  setAnnouncementData((prev: any) => ({ ...prev, pengumuman: newList }));
                                }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-bold uppercase">Text</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newList = [...announcementData.pengumuman];
                                    newList[index].text = handleParagraphify(newList[index].text || '');
                                    setAnnouncementData((prev: any) => ({ ...prev, pengumuman: newList }));
                                  }}
                                  className="retro-button p-1"
                                >
                                  <AlignLeft className="w-4 h-4" />
                                </button>
                              </div>
                              <textarea
                                rows={3}
                                className="block w-full retro-box-inset py-2 px-3 text-sm resize-none"
                                value={item.text}
                                onChange={(e) => {
                                  const newList = [...announcementData.pengumuman];
                                  newList[index].text = e.target.value;
                                  setAnnouncementData((prev: any) => ({ ...prev, pengumuman: newList }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold uppercase mb-1">Image</label>
                              <ImageUploadList 
                                images={item.images || []} 
                                onChange={(imgs) => {
                                  const newList = [...announcementData.pengumuman];
                                  newList[index].images = imgs;
                                  setAnnouncementData((prev: any) => ({ ...prev, pengumuman: newList }));
                                }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Kolekte Section */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-retro-border pb-2">
                        <h3 className="text-xl font-bold uppercase">Kolekte</h3>
                      </div>
                      <div className="retro-box p-4 bg-retro-box-light space-y-4">
                        <div>
                          <label className="block text-sm font-bold uppercase mb-1">Kolekte Title</label>
                          <input type="text" className="block w-full retro-box-inset py-2 px-3 text-sm" value={announcementData.kolekte.A101 || ''} onChange={(e) => setAnnouncementData((prev: any) => ({ ...prev, kolekte: { ...prev.kolekte, A101: e.target.value } }))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'B101', label: 'Kolekte 1 Title', text: 'D101', textLabel: 'Kolekte 1 Text' },
                            { id: 'B102', label: 'Kolekte 2 Title', text: 'D102', textLabel: 'Kolekte 2 Text' },
                            { id: 'B103', label: 'APBU Title', text: 'D103', textLabel: 'APBU Text' },
                            { id: 'B104', label: 'Peduli Pendidikan Title', text: 'D104', textLabel: 'Peduli Pendidikan Text' },
                            { id: 'B105', label: 'Persembahan Title', text: 'D105', textLabel: 'Persembahan Text' },
                          ].map(f => (
                            <div key={f.id} className="space-y-4 border-t border-retro-border pt-4 md:border-t-0 md:pt-0">
                              <div>
                                <label className="block text-xs font-bold uppercase mb-1">{f.label}</label>
                                <input type="text" className="block w-full retro-box-inset py-1 px-2 text-xs" value={announcementData.kolekte[f.id] || ''} onChange={(e) => setAnnouncementData((prev: any) => ({ ...prev, kolekte: { ...prev.kolekte, [f.id]: e.target.value } }))} />
                              </div>
                              <div>
                                <label className="block text-xs font-bold uppercase mb-1">{f.textLabel}</label>
                                <textarea rows={2} className="block w-full retro-box-inset py-1 px-2 text-xs resize-none" value={announcementData.kolekte[f.text] || ''} onChange={(e) => setAnnouncementData((prev: any) => ({ ...prev, kolekte: { ...prev.kolekte, [f.text]: e.target.value } }))} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Kolekte Qris Section */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-retro-border pb-2">
                        <h3 className="text-xl font-bold uppercase">Kolekte Qris</h3>
                      </div>
                      <div className="retro-box p-4 bg-retro-box-light space-y-4">
                        <div>
                          <label className="block text-sm font-bold uppercase mb-1">Title</label>
                          <input type="text" className="block w-full retro-box-inset py-2 px-3 text-sm" value={announcementData.kolekteQris.A106 || ''} onChange={(e) => setAnnouncementData((prev: any) => ({ ...prev, kolekteQris: { ...prev.kolekteQris, A106: e.target.value } }))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'B106', label: 'Kolekte Qris 1 Title', text: 'D106', textLabel: 'Text 1' },
                            { id: 'B107', label: 'Kolekte Qris 2 Title', text: 'D107', textLabel: 'Text 2' },
                          ].map(f => (
                            <div key={f.id} className="space-y-2">
                              <div>
                                <label className="block text-xs font-bold uppercase mb-1">{f.label}</label>
                                <input type="text" className="block w-full retro-box-inset py-1 px-2 text-xs" value={announcementData.kolekteQris[f.id] || ''} onChange={(e) => setAnnouncementData((prev: any) => ({ ...prev, kolekteQris: { ...prev.kolekteQris, [f.id]: e.target.value } }))} />
                              </div>
                              <div>
                                <label className="block text-xs font-bold uppercase mb-1">{f.textLabel}</label>
                                <textarea rows={2} className="block w-full retro-box-inset py-1 px-2 text-xs resize-none" value={announcementData.kolekteQris[f.text] || ''} onChange={(e) => setAnnouncementData((prev: any) => ({ ...prev, kolekteQris: { ...prev.kolekteQris, [f.text]: e.target.value } }))} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Perkawinan Section */}
                    <div className="space-y-4 pb-8">
                      <div className="flex items-center justify-between border-b-2 border-retro-border pb-2">
                        <h3 className="text-xl font-bold uppercase">Perkawinan</h3>
                        <button
                          type="button"
                          onClick={() => setAnnouncementData((prev: any) => ({
                            ...prev,
                            perkawinan: [...prev.perkawinan, { mode: 'image', title: prev.perkawinan[0]?.title || '', pria: '', lingkPria: '', wanita: '', lingkWanita: '', images: [] }]
                          }))}
                          className="retro-button px-3 py-1 text-sm font-bold flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add More
                        </button>
                      </div>
                      <div className="space-y-6">
                        {announcementData.perkawinan.map((item: any, index: number) => (
                          <div key={index} className="retro-box p-4 bg-retro-box-light space-y-4 relative">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => setAnnouncementData((prev: any) => ({
                                  ...prev,
                                  perkawinan: prev.perkawinan.filter((_: any, i: number) => i !== index)
                                }))}
                                className="absolute top-2 right-2 retro-button p-1 text-retro-accent"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex-grow">
                                <label className="block text-sm font-bold uppercase mb-1">Title</label>
                                <input
                                  type="text"
                                  className="block w-full retro-box-inset py-2 px-3 text-sm"
                                  value={item.title}
                                  onChange={(e) => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].title = e.target.value;
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }}
                                />
                              </div>
                              <div className="flex bg-retro-box-dark p-1 retro-box">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].mode = 'image';
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }}
                                  className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${item.mode === 'image' ? 'bg-retro-accent text-white' : 'hover:bg-retro-box-light'}`}
                                >
                                  Image
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].mode = 'text';
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }}
                                  className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${item.mode === 'text' ? 'bg-retro-accent text-white' : 'hover:bg-retro-box-light'}`}
                                >
                                  Text
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-bold uppercase mb-1">Mempelai Pria</label>
                                  <input type="text" className="block w-full retro-box-inset py-2 px-3 text-xs" value={item.pria} onChange={(e) => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].pria = e.target.value;
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }} />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold uppercase mb-1">Lingkungan Pria</label>
                                  <input type="text" className="block w-full retro-box-inset py-2 px-3 text-xs" value={item.lingkPria} onChange={(e) => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].lingkPria = e.target.value;
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }} />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-bold uppercase mb-1">Mempelai Wanita</label>
                                  <input type="text" className="block w-full retro-box-inset py-2 px-3 text-xs" value={item.wanita} onChange={(e) => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].wanita = e.target.value;
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }} />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold uppercase mb-1">Lingkungan Wanita</label>
                                  <input type="text" className="block w-full retro-box-inset py-2 px-3 text-xs" value={item.lingkWanita} onChange={(e) => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].lingkWanita = e.target.value;
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }} />
                                </div>
                              </div>
                            </div>

                            {item.mode === 'image' && (
                              <div>
                                <label className="block text-sm font-bold uppercase mb-1">Image</label>
                                <ImageUploadList 
                                  images={item.images || []} 
                                  onChange={(imgs) => {
                                    const newList = [...announcementData.perkawinan];
                                    newList[index].images = imgs;
                                    setAnnouncementData((prev: any) => ({ ...prev, perkawinan: newList }));
                                  }} 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : massType === 'mass' ? (
                  <div className="space-y-6">
                    {MASS_FIELDS.map((field) => (
                      <div key={field.id} className="retro-box p-5 bg-retro-box-light">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-retro-border pb-2">
                          <h3 className="text-lg font-bold uppercase">{field.label}</h3>
                          {field.type === 'dynamic' && (
                            <button
                              type="button"
                              onClick={() => addDynamicItem(field.id, field.defaultTitleId!, field.defaultTitleJv!)}
                              className="retro-button px-3 py-1 text-sm font-bold flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Add More
                            </button>
                          )}
                        </div>
                        
                        {field.type === 'static' ? (
                          <div className="space-y-4">
                            {field.titleCode && (
                              <div>
                                <label className="block text-sm font-bold mb-1 uppercase">Title</label>
                                <input
                                  type="text"
                                  className="block w-full retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm"
                                  value={formData[field.titleCode] || ''}
                                  onChange={(e) => handleInputChange(field.titleCode!, e.target.value)}
                                />
                              </div>
                            )}
                            {field.textCode && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-sm font-bold uppercase">Text</label>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setTextifyTarget({ type: 'static', key: field.textCode! })}
                                      className="retro-button p-1"
                                      title="Image to Text"
                                    >
                                      <Type className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInputChange(field.textCode!, handleParagraphify(formData[field.textCode!] || ''))}
                                      className="retro-button p-1"
                                      title="Format as single paragraph"
                                    >
                                      <AlignLeft className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <textarea
                                  rows={4}
                                  className="block w-full retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm resize-none"
                                  value={formData[field.textCode] || ''}
                                  onChange={(e) => handleInputChange(field.textCode!, e.target.value)}
                                />
                              </div>
                            )}
                            {field.imageCode && (
                              <div>
                                <label className="block text-sm font-bold mb-1 uppercase">Image</label>
                                <ImageUploadList 
                                  images={formData[field.imageCode] || []} 
                                  onChange={(imgs) => handleInputChange(field.imageCode!, imgs)} 
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {massDynamicFields[field.id]?.map((item, index) => (
                              <div key={index} className="relative pl-4 border-l-4 border-retro-border space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold uppercase bg-retro-text text-retro-bg px-2 py-1 inline-block">
                                    {field.itemLabel || field.label} {index + 1}
                                  </h4>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDynamicItem(field.id, index)}
                                      className="retro-button p-1.5 text-retro-accent"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {field.titleCode && (
                                  <div>
                                    <label className="block text-sm font-bold mb-1 uppercase">Title</label>
                                    <input
                                      type="text"
                                      className="block w-full retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm"
                                      value={item.title || ''}
                                      onChange={(e) => handleDynamicInputChange(field.id, index, 'title', e.target.value)}
                                    />
                                  </div>
                                )}
                                {field.textCode && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-sm font-bold uppercase">Text</label>
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setTextifyTarget({ type: 'dynamic', fieldId: field.id, index })}
                                          className="retro-button p-1"
                                          title="Image to Text"
                                        >
                                          <Type className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDynamicInputChange(field.id, index, 'text', handleParagraphify(item.text || ''))}
                                          className="retro-button p-1"
                                          title="Format as single paragraph"
                                        >
                                          <AlignLeft className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <textarea
                                      rows={4}
                                      className="block w-full retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm resize-none"
                                      value={item.text || ''}
                                      onChange={(e) => handleDynamicInputChange(field.id, index, 'text', e.target.value)}
                                    />
                                  </div>
                                )}
                                {field.imageCode && (
                                  <div>
                                    <label className="block text-sm font-bold mb-1 uppercase">Image</label>
                                    <ImageUploadList 
                                      images={item.images || []} 
                                      onChange={(imgs) => handleDynamicInputChange(field.id, index, 'images', imgs)} 
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : placeholders.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {placeholders.map((placeholder) => {
                      const typeCode = placeholder.substring(1);
                      const isTextArea = typeCode === '02';
                      const isImage = typeCode === '03';
                      
                      return (
                        <div key={placeholder} className={isTextArea ? "sm:col-span-2" : ""}>
                          <div className="flex items-center justify-between mb-1">
                            <label htmlFor={placeholder} className="block text-sm font-bold uppercase">
                              {
                                typeCode === '01' ? 'Title' :
                                typeCode === '02' ? 'Text Content' :
                                typeCode === '03' ? 'Image' : 'Content'
                              }
                            </label>
                            {isTextArea && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setTextifyTarget({ type: 'custom', key: placeholder })}
                                  className="retro-button p-1"
                                  title="Image to Text"
                                >
                                  <Type className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInputChange(placeholder, handleParagraphify(formData[placeholder] || ''))}
                                  className="retro-button p-1"
                                  title="Format as single paragraph"
                                >
                                  <AlignLeft className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="mt-1">
                            {isImage ? (
                              <ImageUploadList 
                                images={formData[placeholder] || []} 
                                onChange={(imgs) => handleInputChange(placeholder, imgs)} 
                              />
                            ) : isTextArea ? (
                              <textarea
                                id={placeholder}
                                rows={4}
                                className="block w-full retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm resize-none"
                                value={formData[placeholder] || ''}
                                onChange={(e) => handleInputChange(placeholder, e.target.value)}
                                placeholder={`Enter text for {${placeholder}}...`}
                              />
                            ) : (
                              <input
                                type="text"
                                id={placeholder}
                                className="block w-full retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm"
                                value={formData[placeholder] || ''}
                                onChange={(e) => handleInputChange(placeholder, e.target.value)}
                                placeholder={`Enter value for {${placeholder}}...`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 retro-box bg-retro-box-light">
                    <p className="font-bold">No placeholders found in the uploaded template.</p>
                    <p className="text-sm mt-1">Ensure your PPTX has text like {'{A01}'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Download */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'VT323, monospace' }}>4. DOWNLOAD</h2>
                <p className="text-sm font-bold">Pick a name and your work is done. Thank you.</p>
                
                <div className="space-y-4 w-full">
                  {massType === 'announcement' ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="openingFilename" className="block text-sm font-bold mb-1 uppercase">
                          Opening Output Name
                        </label>
                        <div className="mt-1 flex">
                          <input
                            type="text"
                            name="openingFilename"
                            id="openingFilename"
                            className="block w-full min-w-0 flex-1 retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm"
                            value={openingOutputName}
                            onChange={(e) => setOpeningOutputName(e.target.value)}
                          />
                          <span className="inline-flex items-center retro-box bg-retro-box-dark px-3 font-bold sm:text-sm border-l-0">
                            .pptx
                          </span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="closingFilename" className="block text-sm font-bold mb-1 uppercase">
                          Closing Output Name
                        </label>
                        <div className="mt-1 flex">
                          <input
                            type="text"
                            name="closingFilename"
                            id="closingFilename"
                            className="block w-full min-w-0 flex-1 retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm"
                            value={closingOutputName}
                            onChange={(e) => setClosingOutputName(e.target.value)}
                          />
                          <span className="inline-flex items-center retro-box bg-retro-box-dark px-3 font-bold sm:text-sm border-l-0">
                            .pptx
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="filename" className="block text-sm font-bold mb-1 uppercase">
                        Output File Name
                      </label>
                      <div className="mt-1 flex">
                        <input
                          type="text"
                          name="filename"
                          id="filename"
                          className="block w-full min-w-0 flex-1 retro-box-inset py-2 px-3 text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-border sm:text-sm"
                          placeholder="My_Presentation"
                          value={outputFileName}
                          onChange={(e) => setOutputFileName(e.target.value)}
                        />
                        <span className="inline-flex items-center retro-box bg-retro-box-dark px-3 font-bold sm:text-sm border-l-0">
                          .pptx
                        </span>
                      </div>
                    </div>
                  )}

                   <div className="retro-box bg-retro-box-light p-4 mt-6 space-y-2">
                    <h4 className="text-sm font-bold uppercase border-b-2 border-retro-border pb-1">Summary</h4>
                    <ul className="text-sm font-bold space-y-1 mt-2">
                      {massType === 'announcement' ? (
                        <>
                          <li>&gt; Opening: <span className="text-retro-accent">{openingFile?.name || 'None'}</span></li>
                          <li>&gt; Closing: <span className="text-retro-accent">{closingFile?.name || 'None'}</span></li>
                        </>
                      ) : (
                        <li>&gt; Template: <span className="text-retro-accent">{templateFile?.name || 'None'}</span></li>
                      )}
                      <li>&gt; Language: <span className="text-retro-accent capitalize">{language}</span></li>
                      <li>&gt; Type: <span className="text-retro-accent capitalize">{massType}</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 mt-4 shrink-0 flex items-center justify-between border-t-2 border-retro-border border-dashed">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="retro-button inline-flex items-center justify-center p-2 text-sm font-bold uppercase"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !massType) || 
                  (currentStep === 2 && massType === 'announcement' && (!openingFile || !closingFile)) ||
                  (currentStep === 2 && massType !== 'announcement' && (!templateFile || isExtracting))
                }
                className="retro-button retro-button-primary inline-flex items-center justify-center p-2 text-sm font-bold uppercase"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={((massType === 'announcement' ? (!openingFile || !closingFile) : !templateFile)) || isGenerating}
                className="retro-button retro-button-primary inline-flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Generate PPTX
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="text-center font-bold text-sm mt-8 pb-8">
          @reallyratt
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {textifyTarget && (
        <TextifyModal 
          onClose={() => setTextifyTarget(null)} 
          onInsert={handleTextifyInsert} 
        />
      )}
    </div>
  );
}
