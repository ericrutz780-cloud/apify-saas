import React from 'react';
import { X, FileSpreadsheet, FileJson, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'json') => void;
  resultCount: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, resultCount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-brand-600 border border-brand-100">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Export Results</h3>
          <p className="text-slate-500 text-sm mt-1">
            Download <strong className="text-slate-900">{resultCount}</strong> ads for offline analysis.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onExport('csv')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
          >
            <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-brand-600 mb-3 transition-colors" />
            <span className="font-semibold text-slate-900 text-sm">CSV Format</span>
            <span className="text-xs text-slate-500 mt-1">For Excel / Sheets</span>
          </button>

          <button
            onClick={() => onExport('json')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
          >
            <FileJson className="w-8 h-8 text-slate-400 group-hover:text-brand-600 mb-3 transition-colors" />
            <span className="font-semibold text-slate-900 text-sm">JSON Format</span>
            <span className="text-xs text-slate-500 mt-1">For Developers</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;