import React, { useState, useEffect } from 'react'
import { Copy, Check, Download, Code2, Sparkles, CopyPlus, RefreshCw, TestTube, ShieldCheck, ShieldAlert, FileCheck } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'

export function CodeDisplay({ code, filename, onGenerateTests, onValidate, validation }) {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [activeTab, setActiveTab] = useState('code')
  const [testsCode, setTestsCode] = useState(null)
  const [isGeneratingTests, setIsGeneratingTests] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    Prism.highlightAll()
  }, [code, testsCode, activeTab])

  const handleCopy = () => {
    const textToCopy = activeTab === 'tests' && testsCode ? testsCode : code
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const textToDownload = activeTab === 'tests' && testsCode ? testsCode : code
    const ext = activeTab === 'tests' ? '.test.ts' : '.ts'
    const downloadFilename = (filename || 'generated').replace(/\.[^/.]+$/, '') + ext
    
    const blob = new Blob([textToDownload], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const handleGenerateTests = async () => {
    if (!onGenerateTests) return
    setIsGeneratingTests(true)
    try {
      const tests = await onGenerateTests()
      setTestsCode(tests)
      setActiveTab('tests')
    } catch (err) {
      console.error('Failed to generate tests:', err)
    } finally {
      setIsGeneratingTests(false)
    }
  }

  const handleValidate = async () => {
    if (!onValidate) return
    setIsValidating(true)
    try {
      await onValidate()
    } catch (err) {
      console.error('Validation failed:', err)
    } finally {
      setIsValidating(false)
    }
  }

  if (!code) return null

  const displayCode = activeTab === 'tests' && testsCode ? testsCode : code
  const displayTitle = activeTab === 'tests' ? 'Unit Tests (Vitest/Jest)' : 'Сгенерированный TypeScript код'

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'code'
              ? 'bg-sber-green text-white shadow-lg shadow-sber-green/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4 inline mr-2" />
          Код
        </button>
        <button
          onClick={handleGenerateTests}
          disabled={isGeneratingTests}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'tests'
              ? 'bg-accent-yellow text-slate-900 shadow-lg shadow-accent-yellow/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } ${isGeneratingTests ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGeneratingTests ? (
            <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
          ) : (
            <CopyPlus className="w-4 h-4 inline mr-2" />
          )}
          {isGeneratingTests ? 'Генерация...' : 'Сгенерировать тесты'}
        </button>
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            validation
              ? validation.valid
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isValidating ? (
            <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
          ) : validation ? (
            validation.valid ? (
              <ShieldCheck className="w-4 h-4 inline mr-2" />
            ) : (
              <ShieldAlert className="w-4 h-4 inline mr-2" />
            )
          ) : (
            <FileCheck className="w-4 h-4 inline mr-2" />
          )}
          {isValidating ? 'Проверка...' : validation ? (validation.valid ? 'Валидно' : 'Есть ошибки') : 'Валидация'}
        </button>
      </div>

      {/* Validation Result */}
      {validation && (
        <div className={`mb-4 p-4 rounded-xl border-2 ${
          validation.valid
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-start gap-3">
            {validation.valid ? (
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${validation.valid ? 'text-green-800' : 'text-red-800'}`}>
                {validation.valid ? 'Код валиден' : 'Обнаружены ошибки'}
              </p>
              {validation.errors && validation.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validation.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
              {validation.warnings && validation.warnings.length > 0 && (
                <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                  {validation.warnings.slice(0, 3).map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Display */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sber-green/20 to-sber-light/20">
              <Code2 className="w-6 h-6 text-sber-green" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{displayTitle}</h3>
              <p className="text-xs text-slate-500">TypeScript • {displayCode.length} символов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-2 rounded-xl transition-all ${
                copied
                  ? 'border-sber-green/50 text-sber-green bg-sber-green/5'
                  : 'border-slate-200 hover:border-sber-green hover:bg-sber-green/5'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
            <button
              onClick={handleDownload}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-2 rounded-xl transition-all ${
                downloaded
                  ? 'border-sber-green/50 text-sber-green bg-sber-green/5'
                  : 'border-slate-200 hover:border-sber-green hover:bg-sber-green/5'
              }`}
            >
              {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {downloaded ? 'Скачано!' : `Скачать ${activeTab === 'tests' ? '.test.ts' : '.ts'}`}
            </button>
          </div>
        </div>
      </div>

      <div className="code-block rounded-2xl overflow-hidden shadow-xl relative">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-2 text-xs text-slate-400">
            {filename ? filename.replace(/\.[^/.]+$/, '') + (activeTab === 'tests' ? '.test.ts' : '.ts') : 'generated.ts'}
          </span>
        </div>
        <pre className="p-0 overflow-auto max-h-[500px]">
          <code className="language-typescript block p-6 !bg-[#1e1e1e] !text-sm !leading-relaxed">
            {displayCode}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-slate-200 rounded-full blur-xl" />
        <div className="relative p-6 rounded-full bg-slate-100">
          <Sparkles className="w-16 h-16 text-slate-400" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">Готов к генерации</h3>
      <p className="text-slate-500 max-w-sm">
        Загрузите файл с данными и укажите желаемую структуру JSON. GigaChat AI создаст оптимальный TypeScript код.
      </p>
      <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
        <div className="w-2 h-2 rounded-full bg-sber-green animate-pulse" />
        Ожидание входных данных
      </div>
    </div>
  )
}
