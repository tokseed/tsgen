import React, { useState, useEffect } from 'react'
import { Zap, Award, Copy, Check, Download, Code2, FileText, AlertCircle, Loader, CheckCircle, ShieldCheck, TestTube, Brain, FileCode, BarChart3, Send } from 'lucide-react'
import FileUpload from './FileUpload'
import JsonInput from './JsonInput'
import { CodeDisplay, EmptyState } from './CodeDisplay'
import { generateCode, checkHealth, validateCode, generateTests, fullPipeline } from './api'
import ProviderToggle from './ProviderToggle'

function StatusBadge({ connected, provider }) {
  const providerColors = {
    gigachat: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 shadow-emerald-500/20',
    openrouter: 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30 shadow-indigo-500/20',
    mock: 'bg-amber-500/20 text-amber-700 border-amber-500/30 shadow-amber-500/20',
  }

  const dotColors = {
    gigachat: 'bg-emerald-500',
    openrouter: 'bg-indigo-500',
    mock: 'bg-amber-500',
  }

  const colorClass = connected ? providerColors[provider] || providerColors.mock : 'bg-red-500/20 text-red-700 border-red-500/30 shadow-red-500/20'
  const dotColorClass = connected ? dotColors[provider] || dotColors.mock : 'bg-red-500'

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border shadow-lg ${colorClass}`}>
      <div className={`w-2 h-2 rounded-full ${dotColorClass} ${connected ? 'animate-pulse' : ''}`} />
      {connected ? `AI: ${provider === 'gigachat' ? 'GigaChat' : provider === 'openrouter' ? 'OpenRouter' : 'Auto'}` : 'API Оффлайн'}
    </div>
  )
}

function CacheStats({ stats }) {
  if (!stats || !stats.enabled) return null

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-2xl border border-slate-200/50 text-xs">
      <div className="flex items-center gap-1 text-emerald-600">
        <BarChart3 className="w-4 h-4" />
        <span className="font-semibold">Cache: {stats.hit_rate}%</span>
      </div>
      <div className="text-slate-500">
        {stats.hits} hits / {stats.misses} misses
      </div>
      <div className="text-slate-400">
        {stats.total_size_mb} MB
      </div>
    </div>
  )
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [targetJson, setTargetJson] = useState('')
  const [generatedCode, setGeneratedCode] = useState(null)
  const [resultFilename, setResultFilename] = useState(null)
  const [error, setError] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiConnected, setApiConnected] = useState(false)
  const [apiProvider, setApiProvider] = useState('auto')
  const [selectedProvider, setSelectedProvider] = useState('auto')
  const [validation, setValidation] = useState(null)
  const [generatedTests, setGeneratedTests] = useState(null)
  const [copied, setCopied] = useState(false)
  const [cacheStats, setCacheStats] = useState(null)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    checkApiConnection()
    const interval = setInterval(checkApiConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkApiConnection = async () => {
    try {
      const result = await checkHealth()
      setApiConnected(true)
      setApiProvider(result.llm_provider || 'auto')
      setCacheStats(result.cache || null)
    } catch (err) {
      setApiConnected(false)
    }
  }

  const handleGenerate = async (useFullPipeline = false) => {
    if (!selectedFile || !targetJson.trim()) return

    setIsGenerating(true)
    setError(null)
    setValidation(null)
    setShowValidation(false)

    try {
      if (useFullPipeline) {
        const result = await fullPipeline(selectedFile, targetJson, selectedProvider)
        setGeneratedCode(result.typescript_code)
        setResultFilename(result.filename.replace(/\.[^/.]+$/, '') + '.ts')
        setValidation(result.validation)
        if (result.tests_code) {
          setGeneratedTests(result.tests_code)
        }
      } else {
        const result = await generateCode(selectedFile, targetJson, selectedProvider)
        setGeneratedCode(result.typescript_code)
        setResultFilename(result.filename.replace(/\.[^/.]+$/, '') + '.ts')
      }
      // Обновить статистику кэша после генерации
      checkApiConnection()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleValidate = async () => {
    if (!generatedCode) return

    try {
      const result = await validateCode(generatedCode, targetJson)
      setValidation(result)
      setShowValidation(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGenerateTests = async () => {
    if (!generatedCode) return null

    try {
      const result = await generateTests(generatedCode, targetJson, resultFilename)
      return result.tests_code
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const handleCopy = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-400/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-lime-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(#21a038 1px, transparent 1px), linear-gradient(90deg, #21a038 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

            {/* Header */}
      <header className="relative py-8 text-center px-4 slide-in-down">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#21a038] to-[#2ecc71] rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative bg-white p-3 rounded-2xl border-2 border-emerald-500/30 shadow-xl hover:scale-105 transition-transform duration-300">
              <svg width="64" height="64" viewBox="0 0 100 100" className="drop-shadow-lg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#21a038',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#27ae60',stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />
                <path d="M35 35 L50 35 L55 50 L50 65 L35 65 L30 50 Z" fill="white" opacity="0.9"/>
                <path d="M50 30 L65 35 L65 65 L50 70 L45 50 Z" fill="white" opacity="0.85"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-[#21a038] via-[#2ecc71] to-[#27ae60] bg-clip-text text-transparent">TypeScript</span>
            <br />
            <span className="text-slate-800">Code Generator</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-сервис для генерации TypeScript-кода преобразования файлов в JSON
          </p>
        </div>

        {/* Badges & Provider Toggle */}
        <div className="flex flex-col items-center gap-4 mt-6">
          <ProviderToggle 
            provider={selectedProvider} 
            onToggle={setSelectedProvider}
            disabled={!apiConnected}
          />
          
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 text-emerald-700 backdrop-blur-sm hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
              Хакатон Сбер 2026
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-700 backdrop-blur-sm hover:scale-105 transition-transform">
              <Brain className="w-4 h-4" />
              AI-Powered
            </div>
            <StatusBadge connected={apiConnected} provider={apiProvider} />
            <CacheStats stats={cacheStats} />
          </div>
        </div>
      </header>

      {/* Main Content - New Layout */}
      <main className="relative container mx-auto max-w-7xl px-4 pb-20">
        {/* Top Section - Input Controls */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Left Column - File Upload */}
          <div className="space-y-6 slide-in-left">
            {/* File Upload Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-8 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#21a038] to-[#2ecc71] flex items-center justify-center shadow-lg">
                  <FileCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Загрузка файла</h2>
                  <p className="text-sm text-slate-500">CSV, Excel, PDF, DOCX, PNG, JPG</p>
                </div>
              </div>
              <FileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50/90 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-red-500/50 p-6 flex items-start gap-4 slide-in-up">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg scale-in">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-700 text-lg">Ошибка генерации</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="bg-emerald-50/90 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-emerald-500/50 p-8 slide-in-up">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
                    <Loader className="w-10 h-10 text-emerald-600 animate-spin relative" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-700 text-lg">Генерация кода...</p>
                    <p className="text-sm text-slate-600">
                      {selectedProvider === 'gigachat' && 'GigaChat создаёт оптимальное решение'}
                      {selectedProvider === 'openrouter' && 'OpenRouter AI генерирует код'}
                      {selectedProvider === 'auto' && 'AI создаёт оптимальное решение'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - JSON Input */}
          <div className="slide-in-right">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-8 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Целевая схема</h2>
                  <p className="text-sm text-slate-500">Опишите формат JSON</p>
                </div>
              </div>
              <JsonInput
                value={targetJson}
                onChange={setTargetJson}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section - Output */}
        <div className="slide-in-up" style={{ animationDelay: '200ms' }}>
          {generatedCode ? (
            <CodeDisplay
              code={generatedCode}
              filename={resultFilename}
              onGenerateTests={handleGenerateTests}
              onValidate={handleValidate}
              validation={validation}
              showValidation={showValidation}
              onCopy={handleCopy}
              copied={copied}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-200/50 py-8 bg-white/50 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-700 text-sm">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 100 100" className="drop-shadow">
                  <defs>
                    <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#21a038',stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#27ae60',stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="45" fill="url(#footerLogoGradient)" />
                  <path d="M35 35 L50 35 L55 50 L50 65 L35 65 L30 50 Z" fill="white" opacity="0.9"/>
                  <path d="M50 30 L65 35 L65 65 L50 70 L45 50 Z" fill="white" opacity="0.85"/>
                </svg>
                <span className="font-bold">Хакатон Сбер 2026</span>
              </div>
              <span className="text-slate-400">•</span>
              <span>TypeScript Code Generator</span>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://t.me/m3rcin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 text-blue-600 hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 font-medium text-sm"
                title="Telegram автора"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>

            <div className="text-slate-500 text-sm">
              © 2026 TypeScript Generator. All rights reserved.
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}
