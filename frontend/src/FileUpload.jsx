import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, X, Image, File, Table, FileCheck, CloudUpload } from 'lucide-react'

const SUPPORTED_FORMATS = ['.csv', '.xls', '.xlsx', '.pdf', '.docx', '.png', '.jpg', '.jpeg']

const formatIcons = {
  csv: Table,
  xls: FileText,
  xlsx: FileText,
  pdf: File,
  docx: File,
  png: Image,
  jpg: Image,
  jpeg: Image,
}

const formatColors = {
  csv: 'from-emerald-500 to-green-600',
  xls: 'from-blue-500 to-cyan-600',
  xlsx: 'from-blue-500 to-cyan-600',
  pdf: 'from-red-500 to-rose-600',
  docx: 'from-blue-500 to-indigo-600',
  png: 'from-purple-500 to-violet-600',
  jpg: 'from-purple-500 to-violet-600',
  jpeg: 'from-purple-500 to-violet-600',
}

export default function FileUpload({ onFileSelect, selectedFile }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(`Неподдерживаемый формат: ${ext}`)
    }
    return true
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      try {
        validateFile(files[0])
        onFileSelect(files[0])
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      try {
        validateFile(files[0])
        onFileSelect(files[0])
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onFileSelect(null)
    document.getElementById('file-input').value = ''
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  const getIcon = (ext) => formatIcons[ext] || File

  return (
    <div className="w-full">
      <input
        type="file"
        id="file-input"
        accept={SUPPORTED_FORMATS.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        className={`relative transition-all duration-300 ${
          isDragging ? 'scale-[1.02]' : ''
        }`}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
        onDragOver={(e) => { e.preventDefault() }}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        {selectedFile ? (
          <div className="dropzone border-emerald-500 bg-emerald-50/50 backdrop-blur-sm relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5" />
            
            <div className="relative flex flex-col items-center gap-4">
              {/* Icon with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative p-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border-2 border-emerald-500/30">
                  <FileCheck className="w-16 h-16 text-emerald-600" />
                </div>
              </div>

              {/* File info */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${formatColors[getFileExtension(selectedFile.name)] || 'from-slate-500 to-slate-600'} text-white shadow-lg`}>
                  {React.createElement(getIcon(getFileExtension(selectedFile.name)), { className: 'w-4 h-4' })}
                  {getFileExtension(selectedFile.name).toUpperCase()}
                </div>
                <p className="mt-4 font-bold text-slate-800 text-lg">{selectedFile.name}</p>
                <p className="text-sm text-slate-500 mt-1">{formatFileSize(selectedFile.size)}</p>
              </div>

              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-4 top-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-red-50 hover:text-red-500 transition-all duration-300 shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              <p className="text-xs text-slate-400 mt-2">Нажмите, чтобы выбрать другой файл</p>
            </div>
          </div>
        ) : (
          <div className={`dropzone ${isDragging ? 'dropzone-active border-emerald-500 bg-emerald-50/50' : 'border-slate-300/50 bg-white/50'} ${error ? 'border-red-500 bg-red-50/50' : ''} backdrop-blur-sm`}>
            <div className="flex flex-col items-center gap-5">
              {/* Upload icon */}
              <div className={`transition-all duration-300 ${error ? '' : 'hover:-translate-y-2'} relative`}>
                {isDragging && (
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                )}
                <div className={`relative p-6 rounded-full ${error ? 'bg-red-100' : 'bg-gradient-to-br from-emerald-100 to-green-100'} transition-all duration-300`}>
                  {error ? (
                    <X className="w-16 h-16 text-red-500" />
                  ) : (
                    <CloudUpload className={`w-16 h-16 ${isDragging ? 'text-emerald-600' : 'text-emerald-600'}`} />
                  )}
                </div>
              </div>

              {error ? (
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{error}</p>
                  <p className="text-sm text-slate-500 mt-1">Попробуйте другой файл</p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-700">
                      <span className="text-emerald-600">Перетащите файл</span> сюда
                    </p>
                    <p className="text-sm text-slate-500 mt-2">или кликните для выбора</p>
                  </div>

                  {/* Supported formats */}
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {['CSV', 'Excel', 'PDF', 'DOCX', 'PNG', 'JPG'].map((fmt) => (
                      <span key={fmt} className="px-3 py-1.5 text-xs font-medium bg-white/80 backdrop-blur-sm text-slate-600 rounded-lg border border-slate-200/50 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
