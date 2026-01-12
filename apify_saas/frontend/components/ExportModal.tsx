
import React, { useState } from 'react';
import { X, FileSpreadsheet, FileJson, Download, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'json') => void;
  resultCount: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, resultCount }) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv');

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Clicks inside the modal content are blocked by stopPropagation.
    // Any click reaching this handler is effectively "outside" the modal.
    onClose();
  };

  const formats = [
    {
      id: 'csv',
      name: 'CSV (Comma Separated Values)',
      description: 'Best for Excel, Google Sheets, and spreadsheet analysis.',
      icon: FileSpreadsheet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      id: 'json',
      name: 'JSON (JavaScript Object Notation)',
      description: 'Structured data format for developers and API integration.',
      icon: FileJson,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[6000] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Full screen backdrop blur */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" />
      
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Export Results</h3>
              <p className="text-xs text-gray-500 font-medium">{resultCount} ads ready for export</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600 mb-2">
            Select your preferred file format for the export:
          </div>
          
          <div className="space-y-3">
            {formats.map((format) => (
              <label 
                key={format.id}
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                  selectedFormat === format.id 
                  ? 'border-brand-500 bg-brand-50/30' 
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input 
                  type="radio" 
                  name="exportFormat" 
                  className="sr-only"
                  checked={selectedFormat === format.id}
                  onChange={() => setSelectedFormat(format.id as 'csv' | 'json')}
                />
                
                <div className={`p-2.5 rounded-lg mr-4 transition-colors ${
                  selectedFormat === format.id ? 'bg-white shadow-sm' : format.bg
                }`}>
                  <format.icon className={`w-6 h-6 ${format.color}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${selectedFormat === format.id ? 'text-brand-900' : 'text-gray-900'}`}>
                      {format.name}
                    </span>
                    {selectedFormat === format.id && (
                      <CheckCircle2 className="w-5 h-5 text-brand-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {format.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl font-bold text-gray-700 text-sm hover:bg-white hover:border-gray-400 transition-all shadow-xs"
          >
            Cancel
          </button>
          <button 
            onClick={() => onExport(selectedFormat)}
            className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
