/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileUp, FileDown, Settings, ChevronRight, ChevronLeft, Check, Plus, Trash2, AlignLeft } from 'lucide-react';
import { extractTemplateLayout, generateFromTemplate } from './services/templateService';
import { chunkText } from './utils/chunkText';

const getAutoText = (type: string, lang: string) => {
  if (type === 'amin') return "\n\nAmin.";
  return "";
};

const MASS_FIELDS = [
  { id: 'laguPembuka', label: 'Lagu Pembuka', type: 'dynamic', titleCode: 'A01', textCode: 'B01', imageCode: 'C01', defaultTitle: '(umat berdiri) NYANYIAN PERARAKAN MASUK', interleaveType: 'empty', itemLabel: 'Lagu Pembuka' },
  { id: 'tuhanKasihanilah1', label: 'Tuhan Kasihanilah 1', type: 'static', titleCode: 'A02', textCode: 'B02', defaultTitle: 'TUHAN KASIHANILAH KAMI' },
  { id: 'tuhanKasihanilah2', label: 'Tuhan Kasihanilah 2', type: 'static', titleCode: 'A03', textCode: 'B03', defaultTitle: 'TUHAN KASIHANILAH KAMI' },
  { id: 'tuhanKasihanilah3', label: 'Tuhan Kasihanilah 3', type: 'static', titleCode: 'A04', textCode: 'B04', defaultTitle: 'TUHAN KASIHANILAH KAMI' },
  { id: 'doaKolekta', label: 'Doa Kolekta', type: 'static', titleCode: 'A05', textCode: 'B05', defaultTitle: '(umat berdiri) DOA KOLEKTA', autoText: 'amin' },
  { id: 'bacaan1', label: 'Bacaan 1', type: 'static', titleCode: 'A06', textCode: 'B06', defaultTitle: '(umat duduk) BACAAN I | (Sumber)' },
  { id: 'mazmurRefren', label: 'Mazmur Tanggapan Refren', type: 'static', titleCode: 'A07', textCode: 'B07', imageCode: 'C07', defaultTitle: '(umat duduk) MAZMUR TANGGAPAN' },
  { id: 'mazmurAyat', label: 'Mazmur Tanggapan Ayat', type: 'dynamic', titleCode: 'A08', textCode: 'B08', imageCode: 'C08', defaultTitle: '(umat duduk) MAZMUR TANGGAPAN', interleaveType: 'refren', itemLabel: 'Ayat' },
  { id: 'bacaan2', label: 'Bacaan 2', type: 'static', titleCode: 'A09', textCode: 'B09', defaultTitle: '(umat duduk) BACAAN II | (Sumber)' },
  { id: 'baitPengantarInjilRefren', label: 'Bait Pengantar Injil Refren', type: 'static', titleCode: 'A010', textCode: 'B010', imageCode: 'C010', defaultTitle: '(umat berdiri) BAIT PENGANTAR INJIL' },
  { id: 'baitPengantarInjilBait', label: 'Bait Pengantar Injil Bait', type: 'static', titleCode: 'A011', textCode: 'B011', imageCode: 'C011', defaultTitle: '(umat berdiri) BAIT PENGANTAR INJIL' },
  { id: 'bacaanInjil', label: 'Bacaan Injil', type: 'static', titleCode: 'A012', textCode: 'B012', defaultTitle: '(umat berdiri) BACAAN INJIL | (Sumber)' },
  { id: 'doaUmatImam1', label: 'Doa Umat Imam 1', type: 'static', titleCode: 'A013', textCode: 'B013', defaultTitle: '(umat berdiri) DOA UMAT' },
  { id: 'doaUmatLektor', label: 'Doa Umat Lektor', type: 'dynamic', titleCode: 'A014', textCode: 'B014', defaultTitle: '(umat berdiri) DOA UMAT', interleaveType: 'jawabanUmat', itemLabel: 'Lektor' },
  { id: 'doaUmatJawabanUmat', label: 'Doa Umat Jawaban Umat', type: 'static', titleCode: 'A015', textCode: 'B015', defaultTitle: '(umat berdiri) DOA UMAT' },
  { id: 'doaUmatImam2', label: 'Doa Umat Imam 2', type: 'static', titleCode: 'A016', textCode: 'B016', defaultTitle: '(umat berdiri) DOA UMAT' },
  { id: 'laguPersembahan', label: 'Lagu Persembahan', type: 'dynamic', titleCode: 'A017', textCode: 'B017', imageCode: 'C017', defaultTitle: '(umat duduk) NYANYIAN PERSEMBAHAN', interleaveType: 'empty', itemLabel: 'Lagu Persembahan' },
  { id: 'doaAtasPersembahan', label: 'Doa Atas Persembahan', type: 'static', titleCode: 'A018', textCode: 'B018', defaultTitle: '(umat berdiri) DOA ATAS PERSEMBAHAN', autoText: 'amin' },
  { id: 'laguKomuni', label: 'Lagu Komuni', type: 'dynamic', titleCode: 'A019', textCode: 'B019', imageCode: 'C019', defaultTitle: '(umat duduk) MADAH PUJIAN', interleaveType: 'empty', itemLabel: 'Lagu Komuni' },
  { id: 'doaSesudahKomuni', label: 'Doa Sesudah Komuni', type: 'static', titleCode: 'A020', textCode: 'B020', defaultTitle: '(umat berdiri) DOA SESUDAH KOMUNI', autoText: 'amin' },
  { id: 'laguPenutup', label: 'Lagu Penutup', type: 'dynamic', titleCode: 'A021', textCode: 'B021', imageCode: 'C021', defaultTitle: '(umat berdiri) NYANYIAN PERARAKAN KELUAR', interleaveType: 'empty', itemLabel: 'Lagu Penutup' }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [language, setLanguage] = useState('bahasa indonesia');
  const [massType, setMassType] = useState('mass');
  const [outputFileName, setOutputFileName] = useState('');

  const [massDynamicFields, setMassDynamicFields] = useState<Record<string, any[]>>({
    laguPembuka: [{ title: '(umat berdiri) NYANYIAN PERARAKAN MASUK', text: '', image: '' }],
    mazmurAyat: [{ title: '(umat duduk) MAZMUR TANGGAPAN', text: '', image: '' }],
    doaUmatLektor: [{ title: '(umat berdiri) DOA UMAT', text: '' }],
    laguPersembahan: [{ title: '(umat duduk) NYANYIAN PERSEMBAHAN', text: '', image: '' }],
    laguKomuni: [{ title: '(umat duduk) MADAH PUJIAN', text: '', image: '' }],
    laguPenutup: [{ title: '(umat berdiri) NYANYIAN PERARAKAN KELUAR', text: '', image: '' }]
  });

  useEffect(() => {
    if (massType === 'mass') {
      setFormData(prev => {
        const newData = { ...prev };
        let changed = false;
        MASS_FIELDS.forEach(field => {
          if (field.type === 'static') {
            if (!newData[field.titleCode!]) {
              newData[field.titleCode!] = field.defaultTitle;
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
            if (!newDynamic[field.id] || newDynamic[field.id].length === 0) {
              newDynamic[field.id] = [{ title: field.defaultTitle, text: '', image: '' }];
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

  const handleInputChange = (key: string, value: string) => {
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
    if (!templateFile) return;
    
    setIsGenerating(true);
    try {
      const finalData = { ...formData };
      
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
        const refrenImage = finalData['C07'] || '';
        
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
                if (itemChunks.length === 0) itemChunks.push('');
                
                itemChunks.forEach((chunk) => {
                  titles.push(item.title || '');
                  texts.push(chunk);
                  images.push(item.image || ''); // Repeat image for chunks of the same item
                });
                
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
                  const numChunks = Math.max(1, itemChunks.length);
                  
                  // Add main chunks to slide order
                  for (let i = 0; i < numChunks; i++) {
                    const mainPhs = [];
                    if (field.textCode) mainPhs.push(`${field.textCode}_${mainChunkIndex}`);
                    if (field.titleCode) mainPhs.push(`${field.titleCode}_${mainChunkIndex}`);
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

      const blob = await generateFromTemplate(templateFile, finalData);
      
      // Download the generated file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const finalName = outputFileName.trim() ? `${outputFileName}.pptx` : `Generated_${templateFile.name}`;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to generate presentation:", error);
      alert(`Failed to generate presentation: ${error.message || String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDynamicInputChange = (fieldId: string, index: number, key: string, value: string) => {
    setMassDynamicFields(prev => {
      const newItems = [...prev[fieldId]];
      newItems[index] = { ...newItems[index], [key]: value };
      return { ...prev, [fieldId]: newItems };
    });
  };

  const addDynamicItem = (fieldId: string, defaultTitle: string) => {
    setMassDynamicFields(prev => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), { title: defaultTitle, text: '', image: '' }]
    }));
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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { id: 1, name: 'Upload PPT' },
    { id: 2, name: 'Setup' },
    { id: 3, name: 'Input Texts' },
    { id: 4, name: 'Generate' }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f8] text-[#323130] font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#323130]">
            PPTX Generator
          </h1>
          <p className="mt-2 text-base text-[#605e5c]">
            Follow the steps to generate your presentation.
          </p>
        </div>

        {/* Stepper */}
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center justify-center space-x-4 sm:space-x-8">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="relative flex items-center">
                <div className="flex items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      currentStep > step.id
                        ? 'bg-[#0f6cbd] text-white'
                        : currentStep === step.id
                        ? 'border-2 border-[#0f6cbd] text-[#0f6cbd]'
                        : 'border-2 border-[#edebe9] text-[#605e5c]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </span>
                  <span
                    className={`ml-3 text-sm font-medium hidden sm:block ${
                      currentStep >= step.id ? 'text-[#0f6cbd]' : 'text-[#605e5c]'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 ? (
                  <div className="hidden sm:block absolute top-4 left-full w-full -ml-2 mt-[-1px] h-0.5 bg-[#edebe9]" style={{ width: '2rem' }} />
                ) : null}
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col min-h-[400px]">
          <div className="flex-grow space-y-6">
            
            {/* Step 1: Upload PPT */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-semibold text-[#323130]">Step 1: Upload PPTX Template</h2>
                <p className="text-sm text-[#605e5c]">Select a PowerPoint file containing placeholders.</p>
                
                <div className="mt-4 flex justify-center rounded-lg border border-dashed border-[#8a8886] px-6 py-10 hover:bg-[#f3f2f1] transition-colors">
                  <div className="text-center">
                    <FileUp className="mx-auto h-12 w-12 text-[#8a8886]" aria-hidden="true" />
                    <div className="mt-4 flex text-sm leading-6 text-[#605e5c] justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-transparent font-semibold text-[#0f6cbd] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0f6cbd] focus-within:ring-offset-2 hover:text-[#115ea3]"
                      >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" accept=".pptx" className="sr-only" onChange={handleFileUpload} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-[#605e5c]">PPTX up to 10MB</p>
                    {templateFile && (
                      <div className="mt-4 p-3 bg-[#f3f2f1] rounded-md border border-[#edebe9] flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-[#0f6cbd]" />
                        <span className="text-sm font-medium text-[#323130]">
                          {templateFile.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {isExtracting && (
                  <div className="text-center py-4 text-[#605e5c] flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0f6cbd] border-t-transparent rounded-full animate-spin" />
                    Extracting placeholders...
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Setup */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-semibold text-[#323130]">Step 2: Setup Configuration</h2>
                <p className="text-sm text-[#605e5c]">Configure language and mass type settings.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-base font-medium text-[#323130]">Language</label>
                    <p className="text-sm text-[#605e5c] mb-3">Select the language for the presentation.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setLanguage('bahasa indonesia')}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          language === 'bahasa indonesia' 
                            ? 'border-[#0f6cbd] bg-[#f3f2f1] shadow-sm' 
                            : 'border-[#edebe9] hover:border-[#8a8886] hover:bg-[#faf9f8]'
                        }`}
                      >
                        <div className="font-medium text-[#323130]">Bahasa Indonesia</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('bahasa jawa')}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          language === 'bahasa jawa' 
                            ? 'border-[#0f6cbd] bg-[#f3f2f1] shadow-sm' 
                            : 'border-[#edebe9] hover:border-[#8a8886] hover:bg-[#faf9f8]'
                        }`}
                      >
                        <div className="font-medium text-[#323130]">Bahasa Jawa</div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#edebe9]">
                    <label className="text-base font-medium text-[#323130]">Mass Type</label>
                    <p className="text-sm text-[#605e5c] mb-3">Choose how data will be populated.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setMassType('mass')}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          massType === 'mass' 
                            ? 'border-[#0f6cbd] bg-[#f3f2f1] shadow-sm' 
                            : 'border-[#edebe9] hover:border-[#8a8886] hover:bg-[#faf9f8]'
                        }`}
                      >
                        <div className="font-medium text-[#323130]">Mass</div>
                        <div className="text-sm text-[#605e5c] mt-1">Generate multiple slides from data</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMassType('custom')}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          massType === 'custom' 
                            ? 'border-[#0f6cbd] bg-[#f3f2f1] shadow-sm' 
                            : 'border-[#edebe9] hover:border-[#8a8886] hover:bg-[#faf9f8]'
                        }`}
                      >
                        <div className="font-medium text-[#323130]">Custom Field</div>
                        <div className="text-sm text-[#605e5c] mt-1">Manually input specific fields</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Input Texts */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-semibold text-[#323130]">Step 3: Input Texts</h2>
                <p className="text-sm text-[#605e5c]">Fill in the values for the extracted placeholders.</p>
                
                {massType === 'mass' ? (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {MASS_FIELDS.map((field) => (
                      <div key={field.id} className="bg-white p-5 rounded-lg border border-[#edebe9] shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-[#323130]">{field.label}</h3>
                          {field.type === 'dynamic' && (
                            <button
                              type="button"
                              onClick={() => addDynamicItem(field.id, field.defaultTitle)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#0f6cbd] hover:text-[#115ea3]"
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
                                <label className="block text-sm font-medium text-[#605e5c] mb-1">Title {`{${field.titleCode}}`}</label>
                                <input
                                  type="text"
                                  className="block w-full rounded-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm outline-none transition-all"
                                  value={formData[field.titleCode] || ''}
                                  onChange={(e) => handleInputChange(field.titleCode!, e.target.value)}
                                />
                              </div>
                            )}
                            {field.textCode && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-sm font-medium text-[#605e5c]">Text {`{${field.textCode}}`}</label>
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange(field.textCode!, handleParagraphify(formData[field.textCode!] || ''))}
                                    className="p-1 text-[#605e5c] hover:text-[#0f6cbd] hover:bg-[#f3f2f1] rounded-md transition-colors"
                                    title="Format as single paragraph"
                                  >
                                    <AlignLeft className="w-4 h-4" />
                                  </button>
                                </div>
                                <textarea
                                  rows={4}
                                  className="block w-full rounded-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm resize-none outline-none transition-all"
                                  value={formData[field.textCode] || ''}
                                  onChange={(e) => handleInputChange(field.textCode!, e.target.value)}
                                />
                              </div>
                            )}
                            {field.imageCode && (
                              <div>
                                <label className="block text-sm font-medium text-[#605e5c] mb-1">Image {`{${field.imageCode}}`}</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="block w-full text-sm text-[#605e5c] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#f3f2f1] file:text-[#0f6cbd] hover:file:bg-[#edebe9] transition-all"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file, (base64) => handleInputChange(field.imageCode!, base64));
                                    }
                                  }}
                                />
                                {formData[field.imageCode] && (
                                  <img src={formData[field.imageCode]} alt="Preview" className="mt-2 h-20 object-contain rounded-md border border-[#edebe9]" />
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {massDynamicFields[field.id]?.map((item, index) => (
                              <div key={index} className="relative pl-4 border-l-2 border-[#0f6cbd] space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-[#0f6cbd]">
                                    {field.itemLabel || field.label} {index + 1}
                                  </h4>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDynamicItem(field.id, index)}
                                      className="p-1.5 text-[#605e5c] hover:text-[#d13438] hover:bg-[#fde7e9] rounded-md transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {field.titleCode && (
                                  <div>
                                    <label className="block text-sm font-medium text-[#605e5c] mb-1">Title {`{${field.titleCode}}`}</label>
                                    <input
                                      type="text"
                                      className="block w-full rounded-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm outline-none transition-all"
                                      value={item.title || ''}
                                      onChange={(e) => handleDynamicInputChange(field.id, index, 'title', e.target.value)}
                                    />
                                  </div>
                                )}
                                {field.textCode && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-sm font-medium text-[#605e5c]">Text {`{${field.textCode}}`}</label>
                                      <button
                                        type="button"
                                        onClick={() => handleDynamicInputChange(field.id, index, 'text', handleParagraphify(item.text || ''))}
                                        className="p-1 text-[#605e5c] hover:text-[#0f6cbd] hover:bg-[#f3f2f1] rounded-md transition-colors"
                                        title="Format as single paragraph"
                                      >
                                        <AlignLeft className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <textarea
                                      rows={4}
                                      className="block w-full rounded-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm resize-none outline-none transition-all"
                                      value={item.text || ''}
                                      onChange={(e) => handleDynamicInputChange(field.id, index, 'text', e.target.value)}
                                    />
                                  </div>
                                )}
                                {field.imageCode && (
                                  <div>
                                    <label className="block text-sm font-medium text-[#605e5c] mb-1">Image {`{${field.imageCode}}`}</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="block w-full text-sm text-[#605e5c] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#f3f2f1] file:text-[#0f6cbd] hover:file:bg-[#edebe9] transition-all"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleImageUpload(file, (base64) => handleDynamicInputChange(field.id, index, 'image', base64));
                                        }
                                      }}
                                    />
                                    {item.image && (
                                      <img src={item.image} alt="Preview" className="mt-2 h-20 object-contain rounded-md border border-[#edebe9]" />
                                    )}
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {placeholders.map((placeholder) => {
                      const typeCode = placeholder.substring(1);
                      const isTextArea = typeCode === '02';
                      
                      return (
                        <div key={placeholder} className={isTextArea ? "sm:col-span-2" : ""}>
                          <div className="flex items-center justify-between mb-1">
                            <label htmlFor={placeholder} className="block text-sm font-medium text-[#605e5c]">
                              {`{${placeholder}}`} - {
                                typeCode === '01' ? 'Title' :
                                typeCode === '02' ? 'Text Content' :
                                typeCode === '03' ? 'Image URL' : 'Content'
                              }
                            </label>
                            {isTextArea && (
                              <button
                                type="button"
                                onClick={() => handleInputChange(placeholder, handleParagraphify(formData[placeholder] || ''))}
                                className="p-1 text-[#605e5c] hover:text-[#0f6cbd] hover:bg-[#f3f2f1] rounded-md transition-colors"
                                title="Format as single paragraph"
                              >
                                <AlignLeft className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-1">
                            {isTextArea ? (
                              <textarea
                                id={placeholder}
                                rows={4}
                                className="block w-full rounded-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm resize-none outline-none transition-all"
                                value={formData[placeholder] || ''}
                                onChange={(e) => handleInputChange(placeholder, e.target.value)}
                                placeholder={`Enter text for {${placeholder}}...`}
                              />
                            ) : (
                              <input
                                type="text"
                                id={placeholder}
                                className="block w-full rounded-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm outline-none transition-all"
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
                  <div className="text-center py-12 bg-[#faf9f8] rounded-lg border border-[#edebe9]">
                    <p className="text-[#605e5c]">No placeholders found in the uploaded template.</p>
                    <p className="text-sm text-[#8a8886] mt-1">Ensure your PPTX has text like {'{A01}'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Generate */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-semibold text-[#323130]">Step 4: Generate PPTX</h2>
                <p className="text-sm text-[#605e5c]">Set the file name and download your presentation.</p>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label htmlFor="filename" className="block text-sm font-medium text-[#605e5c] mb-1">
                      Output File Name
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="filename"
                        id="filename"
                        className="block w-full min-w-0 flex-1 rounded-none rounded-l-md border border-[#8a8886] py-2 px-3 text-[#323130] focus:border-[#0f6cbd] focus:ring-1 focus:ring-[#0f6cbd] sm:text-sm outline-none transition-all"
                        placeholder="My_Presentation"
                        value={outputFileName}
                        onChange={(e) => setOutputFileName(e.target.value)}
                      />
                      <span className="inline-flex items-center rounded-r-md border border-l-0 border-[#8a8886] bg-[#f3f2f1] px-3 text-[#605e5c] sm:text-sm">
                        .pptx
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#faf9f8] p-4 rounded-lg border border-[#edebe9] mt-6 space-y-2">
                    <h4 className="text-sm font-medium text-[#323130]">Summary</h4>
                    <ul className="text-sm text-[#605e5c] space-y-1">
                      <li>• Template: <span className="font-medium text-[#323130]">{templateFile?.name || 'None'}</span></li>
                      <li>• Language: <span className="font-medium text-[#323130] capitalize">{language}</span></li>
                      <li>• Mass Type: <span className="font-medium text-[#323130] capitalize">{massType}</span></li>
                      <li>• Placeholders Filled: <span className="font-medium text-[#323130]">{(Object.values(formData) as string[]).filter(v => typeof v === 'string' && v.trim() !== '').length} / {placeholders.length}</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 mt-6 flex items-center justify-between border-t border-[#edebe9]">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#323130] border border-[#8a8886] hover:bg-[#f3f2f1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={(currentStep === 1 && (!templateFile || isExtracting))}
                className="inline-flex items-center gap-2 rounded-md bg-[#0f6cbd] px-6 py-2 text-sm font-semibold text-white hover:bg-[#115ea3] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!templateFile || isGenerating}
                className="inline-flex items-center gap-2 rounded-md bg-[#0f6cbd] px-6 py-2 text-sm font-semibold text-white hover:bg-[#115ea3] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      </div>
    </div>
  );
}
