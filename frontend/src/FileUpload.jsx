import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, X, Image, File, Table, FileCheck } from 'lucide-react'

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
  csv: 'text-green-600 bg-green-600/10',
  xls: 'text-blue-600 bg-blue-600/10',
  xlsx: 'text-blue-600 bg-blue-600/10',
  pdf: 'text-red-600 bg-red-600/10',
  docx: 'text-blue-600 bg-blue-600/10',
  png: 'text-purple-600 bg-purple-600/10',
  jpg: 'text-purple-600 bg-purple-600/10',
  jpeg: 'text-purple-600 bg-purple-600/10',
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
          <div className={`dropzone border-sber-green bg-sber-green/5 relative`}>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-sber-green/20 rounded-full blur-lg" />
                <div className="relative p-5 rounded-full bg-sber-green/10">
                  <FileCheck className="w-16 h-16 text-sber-green" />
                </div>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${formatColors[getFileExtension(selectedFile.name)] || 'text-slate-600 bg-slate-100'}`}>
                  {React.createElement(getIcon(getFileExtension(selectedFile.name)), { className: 'w-4 h-4' })}
                  {getFileExtension(selectedFile.name).toUpperCase()}
                </div>
                <p className="mt-3 font-semibold text-slate-800 text-lg">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <p className="text-xs text-slate-400">Нажмите, чтобы выбрать другой файл</p>
            </div>
          </div>
        ) : (
          <div className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${error ? 'border-red-500' : ''}`}>
            <div className="flex flex-col items-center gap-4">
              <div className={`transition-transform ${error ? '' : 'hover:-translate-y-1'}`}>
                <Upload className={`w-16 h-16 ${error ? 'text-red-500' : 'text-sber-green'}`} />
              </div>
              
              {error ? (
                <p className="text-lg font-medium text-red-500">{error}</p>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-lg font-medium">
                      <span className="text-sber-green">Перетащите файл</span> сюда
                    </p>
                    <p className="text-sm text-slate-500 mt-1">или кликните для выбора</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {['CSV', 'Excel', 'PDF', 'DOCX', 'PNG', 'JPG'].map((fmt) => (
                      <span key={fmt} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
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
