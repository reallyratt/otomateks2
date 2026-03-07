/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FileUp, FileDown, Settings, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { extractTemplateLayout, generateFromTemplate, PptxSection } from './services/templateService';

export default function App() {
  const [step, setStep] = useState(1);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState('[Tahun A/B/C] Harian/Mingguan - Bahasa Jawa/Indonesia - Nama Minggu (27 04 2007)');
  const [sections, setSections] = useState<PptxSection[]>([]);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setTemplateFile(file);
  };

  const handleNextStep1 = async () => {
    if (!templateFile) return;
    setIsExtracting(true);
    try {
      const extractedSections = await extractTemplateLayout(templateFile);
      setSections(extractedSections);
      
      const initialEnabled: Record<string, boolean> = {};
      extractedSections.forEach(sec => {
        initialEnabled[sec.name] = true;
      });
      setEnabledSections(initialEnabled);

      const initialData: Record<string, string> = {};
      extractedSections.forEach(sec => {
        sec.placeholders.forEach(p => {
          initialData[p] = formData[p] || '';
        });
      });
      setFormData(initialData);
      
      setStep(2);
    } catch (error) {
      console.error(error);
      alert("Failed to read the PPTX template.");
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

  const handleGenerate = async () => {
    if (!templateFile) return;
    
    setIsGenerating(true);
    try {
      const disabledSlideFiles: string[] = [];
      const disabledSectionNames: string[] = [];
      sections.forEach(sec => {
        if (!enabledSections[sec.name]) {
          disabledSlideFiles.push(...sec.slides);
          disabledSectionNames.push(sec.name);
        }
      });

      const blob = await generateFromTemplate(templateFile, formData, disabledSlideFiles, disabledSectionNames);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName.endsWith('.pptx') ? outputFileName : `${outputFileName}.pptx`;
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Otomateks Generator</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className={step >= 1 ? "text-indigo-600" : ""}>1. Upload</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step >= 2 ? "text-indigo-600" : ""}>2. Sections</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step >= 3 ? "text-indigo-600" : ""}>3. Content</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step >= 4 ? "text-indigo-600" : ""}>4. Generate</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Upload Template</h2>
              <p className="text-zinc-500">Start by uploading your PPTX template and setting the output file name.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Output File Name</label>
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">PPTX Template</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pptx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3
                    ${templateFile ? 'border-indigo-500 bg-indigo-50/50' : 'border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${templateFile ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {templateFile ? templateFile.name : 'Click or drag PPTX file here'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {templateFile ? `${(templateFile.size / 1024 / 1024).toFixed(2)} MB` : 'Must contain {A01}, {B02} placeholders'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextStep1}
                disabled={!templateFile || isExtracting}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                {isExtracting ? 'Reading Template...' : 'Next Step'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Select Sections</h2>
              <p className="text-zinc-500">Toggle the sections you want to include in the generated presentation.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
              {sections.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No sections detected in the template.</p>
              ) : (
                sections.map(sec => (
                  <div key={sec.name} className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                    <span className="font-medium text-lg">{sec.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={enabledSections[sec.name]} 
                        onChange={(e) => setEnabledSections(prev => ({...prev, [sec.name]: e.target.checked}))} 
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Fill Content</h2>
              <p className="text-zinc-500">Enter the content for the enabled sections.</p>
            </div>

            <div className="space-y-6">
              {sections.filter(sec => enabledSections[sec.name]).map(sec => {
                const secPlaceholders = sec.placeholders;
                return (
                  <div key={sec.name} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <h3 className="text-xl font-semibold border-b border-zinc-100 pb-3">Section {sec.name}</h3>
                    <div className="space-y-4">
                      {secPlaceholders.map(ph => {
                        const typeCode = ph.substring(1);
                        const isTextArea = typeCode === '02';
                        const label = typeCode === '01' ? 'Title' : typeCode === '02' ? 'Text Content' : typeCode === '03' ? 'Image URL' : 'Content';
                        
                        return (
                          <div key={ph}>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                              {`{${ph}}`} - {label}
                            </label>
                            {isTextArea ? (
                              <textarea
                                value={formData[ph] || ''}
                                onChange={(e) => handleInputChange(ph, e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-y"
                                placeholder={`Enter ${label.toLowerCase()}...`}
                              />
                            ) : (
                              <input
                                type="text"
                                value={formData[ph] || ''}
                                onChange={(e) => handleInputChange(ph, e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                placeholder={`Enter ${label.toLowerCase()}...`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {sections.filter(sec => enabledSections[sec.name]).length === 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center">
                  <p className="text-zinc-500">No sections enabled. Please go back and enable at least one section.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={sections.filter(sec => enabledSections[sec.name]).length === 0}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-6 py-12">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight">Ready to Generate</h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Your presentation is ready. Click the button below to generate and download the file.
                </p>
              </div>
              
              <div className="bg-white border border-zinc-200 rounded-xl p-4 inline-block text-left min-w-[300px]">
                <p className="text-sm text-zinc-500 mb-1">Output File:</p>
                <p className="font-medium">{outputFileName.endsWith('.pptx') ? outputFileName : `${outputFileName}.pptx`}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    Generate PPTX
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
