import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Moon, Sun } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

const ACCENT_COLORS = [
  { id: 'red', class: 'accent-red', hex: '#ff5e5e' },
  { id: 'green', class: 'accent-green', hex: '#4ade80' },
  { id: 'blue', class: 'accent-blue', hex: '#60a5fa' },
  { id: 'yellow', class: 'accent-yellow', hex: '#facc15' },
  { id: 'purple', class: 'accent-purple', hex: '#c084fc' },
];

const UPDATES = `Version 2.0: Otomateks Generation
- New Teks Misa Template for Bahasa Indonesia
- New Teks Misa Template for Bahasa Jawa
- Added Template uploader for user
- Added Placeholder detection function
- Added Text chunk function
- Added Otomateks Generation function

Version 2.1: The Workflow
- Added "UPLOAD" page and it's content
- Added "SETUP" page and it's content
- Added "CREATE" page and it's content
- Added "GENERATE" page and it's content
- Updated Otomateks Generation function

Version 2.2: Rich Text
- Added "Add More" for repetitive placeholders
- Added "Paragraphify" to remove unnecessary space and enters
- Added "Image to Text"
- Updated Otomateks Generation function

Version 2.3: Advanced Image System
- Added "Add Image" (single / multiple) feature
- Added advanced crop and image duplication function
- Added image organization
- Added "Invert Color" function
- Updated Otomateks Generation function`;

const PLACEHOLDERS_DATA = [
  { part: 'Lagu Pembuka', codeTitle: '{A01}', codeText: '{B01}', codeImage: '{C01}', id: '(umat berdiri) NYANYIAN PERARAKAN MASUK', jv: '(umat jumeneng) KIDUNG PAMBUKA', note: '*add plus button to add more lagu pembuka' },
  { part: 'Tuhan Kasihanilah 1', codeTitle: '{A02}', codeText: '{B02}', id: 'TUHAN KASIHANILAH KAMI', jv: 'GUSTI NYUWUN KAWELASAN' },
  { part: 'Tuhan Kasihanilah 2', codeTitle: '{A03}', codeText: '{B03}', id: 'TUHAN KASIHANILAH KAMI', jv: 'GUSTI NYUWUN KAWELASAN' },
  { part: 'Tuhan Kasihanilah 3', codeTitle: '{A04}', codeText: '{B04}', id: 'TUHAN KASIHANILAH KAMI', jv: 'GUSTI NYUWUN KAWELASAN' },
  { part: 'Doa Kolekta', codeTitle: '{A05}', codeText: '{B05}', id: '(umat berdiri) DOA KOLEKTA', jv: '(umat jumeneng) SEMBAHYANGAN KOLEKTA', note: '*add automatically text 1 for both indo jawa' },
  { part: 'Bacaan 1', codeTitle: '{A06}', codeText: '{B06}', id: '(umat duduk) BACAAN I | (Sumber)', jv: '(umat lenggah) WAOSAN I | (Sumber)' },
  { part: 'Mazmur Tanggapan Refren', codeTitle: '{A07}', codeText: '{B07}', codeImage: '{C07}', id: '(umat duduk) MAZMUR TANGGAPAN', jv: '(umat lenggah) KIDUNG PANGLIMBANG' },
  { part: 'Mazmur Tanggapan Ayat 1', codeTitle: '{A08}', codeText: '{B08}', codeImage: '{C08}', id: '(umat duduk) MAZMUR TANGGAPAN', jv: '(umat lenggah) KIDUNG PANGLIMBANG', note: '*add plus button to add more ayat' },
  { part: 'Bacaan 2', codeTitle: '{A09}', codeText: '{B09}', id: '(umat duduk) BACAAN II | (Sumber)', jv: '(umat lenggah) WAOSAN II | (Sumber)' },
  { part: 'Bait Pengantar Injil Refren', codeTitle: '{A010}', codeText: '{B010}', codeImage: '{C010}', id: '(umat berdiri) BAIT PENGANTAR INJIL', jv: '(umat jumeneng) KIDUNG CECELA' },
  { part: 'Bait Pengantar Injil Bait', codeTitle: '{A011}', codeText: '{B011}', codeImage: '{C011}', id: '(umat berdiri) BAIT PENGANTAR INJIL', jv: '(umat jumeneng) KIDUNG CECELA' },
  { part: 'Bacaan Injil', codeTitle: '{A012}', codeText: '{B012}', id: '(umat berdiri) BACAAN INJIL | (Sumber)', jv: '(umat jumeneng) INJIL SUCI | (Sumber)' },
  { part: 'Doa Umat Imam 1', codeTitle: '{A013}', codeText: '{B013}', id: '(umat berdiri) DOA UMAT', jv: '(umat jumeneng) SEMBAHYANGAN UMAT' },
  { part: 'Doa Umat Lektor 1', codeTitle: '{A014}', codeText: '{B014}', id: '(umat berdiri) DOA UMAT', jv: '(umat jumeneng) SEMBAHYANGAN UMAT', note: '*add plus button to add more doa umat (all item added after jawaban umat so itll be Lektor 1, Jawaban Umat, Lektor 2, Jawaban Umat, Lektor 3, Jawaban Umat)' },
  { part: 'Doa Umat Jawaban Umat', codeTitle: '{A015}', codeText: '{B015}', id: '(umat berdiri) DOA UMAT', jv: '(umat jumeneng) SEMBAHYANGAN UMAT' },
  { part: 'Doa Umat Imam 2', codeTitle: '{A016}', codeText: '{B016}', id: '(umat berdiri) DOA UMAT', jv: '(umat jumeneng) SEMBAHYANGAN UMAT' },
  { part: 'Lagu Persembahan', codeTitle: '{A017}', codeText: '{B017}', codeImage: '{C017}', id: '(umat duduk) NYANYIAN PERSEMBAHAN', jv: '(umat lenggah) KIDUNG PISUNGSUNG', note: '*add plus button to add more lagu persembahan' },
  { part: 'Doa Atas Persembahan', codeTitle: '{A018}', codeText: '{B018}', id: '(umat berdiri) DOA ATAS PERSEMBAHAN', jv: '(umat jumeneng) SEMBAHYANGAN PISUNGSUNG', note: '*add automatically text 1 for both indo jawa' },
  { part: 'Lagu Komuni 1', codeTitle: '{A019}', codeText: '{B019}', codeImage: '{C019}', id: '(umat duduk) MADAH PUJIAN', jv: '(umat lenggah) KIDUNG IRINGAN KOMUNI', note: '*add plus button to add more lagu komuni' },
  { part: 'Doa Sesudah Komuni', codeTitle: '{A020}', codeText: '{B020}', id: '(umat berdiri) DOA SESUDAH KOMUNI', jv: '(umat jumeneng) SEMBAHYANGAN BAKDA KOMUNI', note: '**add automatically text 1 for both indo jawa' },
  { part: 'Lagu Penutup', codeTitle: '{A021}', codeText: '{B021}', codeImage: '{C021}', id: '(umat berdiri) NYANYIAN PERARAKAN KELUAR', jv: '(umat jumeneng) KIDUNG PANUTUP', note: '*add plus button to add more lagu penutup' },
  { isHeader: true, title: 'ANNOUNCEMENT PART' },
  { part: 'Pengumuman', codeTitle: '{A100}', codeText: '{B100}', codeImage: '{C100}', id: 'PENGUMUMAN PAROKI MINGGU INI', jv: 'PAWARTOS PAROKI MINGGU MENIKA', note: '*Add add more button' },
  { part: 'Kolekte', codeTitle: '{A101}', id: 'KOLEKTE MINGGU LALU', jv: 'KOLEKTE MINGGU KAPENGKER' },
  { part: 'Kolekte 1', codeTitle: '{B101}', codeText: '{D101}', id: 'KOLEKTE PERTAMA (I)', jv: 'KOLEKTE KAPISAN (I)' },
  { part: 'Kolekte 2', codeTitle: '{B102}', codeText: '{D102}', id: 'KOLEKTE KEDUA (II)', jv: 'KOLEKTE KAPING KALIH (II)' },
  { part: 'APBU', codeTitle: '{B103}', codeText: '{D103}', id: 'APBU', jv: 'APBU' },
  { part: 'Peduli Pendidikan', codeTitle: '{B104}', codeText: '{D104}', id: 'Gerakan Peduli Pendidikan', jv: 'Gerakan Peduli Pendidikan' },
  { part: 'Persembahan', codeTitle: '{B105}', codeText: '{D105}', id: 'Persembahan', jv: 'Pisungsung', note: 'lalalala belum ada template (BESOK KALAU ADA DI UPDATE)' },
  { part: 'Kolekte Qris', codeTitle: '{A106}', id: 'PENERIMAAN KOLEKTE MELALUI QRIS', jv: 'PAMEWURING KOLEKTE LUMANTAR QRIS' },
  { part: 'Kolekte Qris 1', codeTitle: '{B106}', codeText: '{D106}', id: 'KOLEKTE PERTAMA (I)', jv: 'KOLEKTE KAPISAN (I)' },
  { part: 'Kolekte Qris 2', codeTitle: '{B107}', codeText: '{D107}', id: 'KOLEKTE KEDUA (II)', jv: 'KOLEKTE KAPING KALIH (II)' },
  { part: 'Perkawinan', codeTitle: '{A108}', codeImage: '{C108}', id: 'PENGUMUMAN PERKAWINAN YANG PERTAMA / KEDUA / KETIGA', jv: 'WARA - WARA PENGANTEN KAPISAN / KEDUA / KETIGA', note: '*Theres a MODE button to switch from Image to Text only\n*Add add more button' },
  { part: 'Perkawinan (Pria)', codeTitle: '{B108}', codeText: '{D108}', id: 'Mempelai Pria & Lingkungan', jv: 'Mempelai Pria & Lingkungan' },
  { part: 'Perkawinan (Wanita)', codeTitle: '{B109}', codeText: '{D109}', id: 'Mempelai Wanita & Lingkungan', jv: 'Mempelai Wanita & Lingkungan' },
  { part: 'Perkawinan Text Mode (Pria)', codeTitle: '{B110}', codeText: '{D110}', id: 'Mempelai Pria & Lingkungan', jv: 'Mempelai Pria & Lingkungan' },
  { part: 'Perkawinan Text Mode (Wanita)', codeTitle: '{B111}', codeText: '{D111}', id: 'Mempelai Wanita & Lingkungan', jv: 'Mempelai Wanita & Lingkungan' },
];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'placeholders' | 'updates'>('main');
  const [placeholderLang, setPlaceholderLang] = useState<'id' | 'jv'>('id');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState('red');

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const currentAccent = ACCENT_COLORS.find(c => document.body.classList.contains(c.class))?.id || 'red';
    setAccentColor(currentAccent);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeAccentColor = (colorId: string) => {
    setAccentColor(colorId);
    ACCENT_COLORS.forEach(c => document.body.classList.remove(c.class));
    const selected = ACCENT_COLORS.find(c => c.id === colorId);
    if (selected) {
      document.body.classList.add(selected.class);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="retro-box bg-retro-bg w-[90vw] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-retro-border bg-retro-box-light">
          <div className="flex items-center gap-4">
            {activeTab !== 'main' && (
              <button onClick={() => setActiveTab('main')} className="retro-button p-1 text-retro-text" title="Back">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'VT323, monospace' }}>
              {activeTab === 'main' ? 'SETTINGS' : activeTab === 'placeholders' ? 'VIEW PLACEHOLDERS' : 'UPDATES'}
            </h2>
          </div>
          <button onClick={onClose} className="retro-button p-2 text-retro-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-retro-bg flex-1 overflow-y-auto">
          {activeTab === 'main' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold uppercase mb-4">Appearance</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between retro-box-inset p-4">
                    <div>
                      <div className="font-bold uppercase">Dark Mode</div>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`retro-button p-2 ${isDarkMode ? 'bg-retro-box-dark' : ''}`}
                    >
                      {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="retro-box-inset p-4">
                    <div className="font-bold uppercase mb-3">Accent Color</div>
                    <div className="flex gap-3">
                      {ACCENT_COLORS.map(color => (
                        <button
                          key={color.id}
                          onClick={() => changeAccentColor(color.id)}
                          className={`w-10 h-10 border-2 border-retro-border transition-transform ${accentColor === color.id ? 'scale-110 shadow-[2px_2px_0px_var(--retro-border)]' : 'hover:scale-105'}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold uppercase mb-4">Reference</h3>
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="https://teksuite.netlify.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-button p-4 text-center font-bold uppercase block"
                  >
                    TekSuite
                  </a>
                  <a
                    href="https://drive.google.com/drive/folders/1mJJSr4UDhs_IdaYrLsTeXplN9VyVc4zf?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-button p-4 text-center font-bold uppercase block"
                  >
                    Master Template
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold uppercase mb-4">Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('placeholders')}
                    className="retro-button p-4 text-left font-bold uppercase"
                  >
                    View Placeholders
                  </button>
                  <button
                    onClick={() => setActiveTab('updates')}
                    className="retro-button p-4 text-left font-bold uppercase"
                  >
                    View Updates
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'placeholders' && (
            <div className="space-y-4">
              <div className="flex gap-4 border-b-2 border-retro-border pb-2">
                <button
                  onClick={() => setPlaceholderLang('id')}
                  className={`font-bold uppercase px-4 py-2 ${placeholderLang === 'id' ? 'retro-box bg-retro-box-light' : 'text-retro-muted hover:text-retro-text'}`}
                >
                  Bahasa Indonesia
                </button>
                <button
                  onClick={() => setPlaceholderLang('jv')}
                  className={`font-bold uppercase px-4 py-2 ${placeholderLang === 'jv' ? 'retro-box bg-retro-box-light' : 'text-retro-muted hover:text-retro-text'}`}
                >
                  Bahasa Jawa
                </button>
              </div>
              <div className="retro-box-inset p-4 space-y-6">
                <div className="space-y-4">
                  {PLACEHOLDERS_DATA.map((item: any, idx) => (
                    item.isHeader ? (
                      <div key={idx} className="bg-retro-box-dark p-2 text-center font-bold uppercase tracking-widest text-xs border-y-2 border-retro-border my-4">
                        {item.title}
                      </div>
                    ) : (
                      <div key={idx} className="border-b-2 border-retro-border pb-4 last:border-0 last:pb-0">
                        <div className="font-bold text-lg mb-2">{item.part}</div>
                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                          <div className="font-bold text-retro-muted">Title:</div>
                          <div>
                            <span className="bg-retro-box-dark px-1.5 py-0.5 rounded mr-2 font-mono text-xs">{item.codeTitle}</span>
                            {placeholderLang === 'id' ? item.id : item.jv}
                          </div>
                          
                          {item.codeText && (
                            <>
                              <div className="font-bold text-retro-muted">Text:</div>
                              <div>
                                <span className="bg-retro-box-dark px-1.5 py-0.5 rounded font-mono text-xs">{item.codeText}</span>
                              </div>
                            </>
                          )}
                          
                          {item.codeImage && (
                            <>
                              <div className="font-bold text-retro-muted">Image:</div>
                              <div>
                                <span className="bg-retro-box-dark px-1.5 py-0.5 rounded font-mono text-xs">{item.codeImage}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {item.note && (
                          <div className="mt-2 text-xs text-retro-accent italic whitespace-pre-wrap">
                            {item.note}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t-2 border-retro-border border-dashed">
                  <h4 className="font-bold mb-2">Automatically Text:</h4>
                  <div className="text-sm">
                    <span className="bg-retro-box-dark px-1.5 py-0.5 rounded mr-2 font-mono text-xs">1</span>
                    <span className="font-bold italic">U: Amin</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="retro-box-inset p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {UPDATES}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
