import React, { useState, useEffect } from 'react'
import { Sparkles, Zap, Award, Copy, Check, Download, Code2, FileText, AlertCircle, Loader, CheckCircle, ShieldCheck, TestTube, ChevronRight, Layers, Brain, FileCode, ArrowRight } from 'lucide-react'
import FileUpload from './FileUpload'
import JsonInput from './JsonInput'
import { CodeDisplay, EmptyState } from './CodeDisplay'
import { generateCode, checkHealth, validateCode, generateTests, fullPipeline } from './api'

function StatusBadge({ connected }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
      connected
        ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 shadow-lg shadow-emerald-500/20'
        : 'bg-red-500/20 text-red-700 border border-red-500/30 shadow-lg shadow-red-500/20'
    }`}>
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {connected ? 'API Активен' : 'API Оффлайн'}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, gradient }) {
  return (
    <div className="card-glass p-6 text-center hover:scale-105 group">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/80 leading-relaxed">{description}</p>
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
  const [validation, setValidation] = useState(null)
  const [generatedTests, setGeneratedTests] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkApiConnection()
    const interval = setInterval(checkApiConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkApiConnection = async () => {
    try {
      await checkHealth()
      setApiConnected(true)
    } catch (err) {
      setApiConnected(false)
    }
  }

  const handleGenerate = async (useFullPipeline = false) => {
    if (!selectedFile || !targetJson.trim()) return

    setIsGenerating(true)
    setError(null)
    setValidation(null)

    try {
      if (useFullPipeline) {
        const result = await fullPipeline(selectedFile, targetJson)
        setGeneratedCode(result.typescript_code)
        setResultFilename(result.filename.replace(/\.[^/.]+$/, '') + '.ts')
        setValidation(result.validation)
        if (result.tests_code) {
          setGeneratedTests(result.tests_code)
        }
      } else {
        const result = await generateCode(selectedFile, targetJson)
        setGeneratedCode(result.typescript_code)
        setResultFilename(result.filename.replace(/\.[^/.]+$/, '') + '.ts')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleValidate = async () => {
    if (!generatedCode) return

    try {
      const result = await validateCode(generatedCode)
      setValidation(result)
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl float" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-3xl float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative py-16 text-center px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 glow" />
            <div className="relative bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl">
              <img src="/logo.svg" alt="TS Generator Logo" className="w-32 h-32 drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-6xl md:text-7xl font-black mb-4">
            <span className="gradient-text">TypeScript</span>
            <br />
            <span className="text-white drop-shadow-lg">Code Generator</span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            AI-powered сервис для генерации TypeScript-кода преобразования файлов в JSON
            <br />
            <span className="gradient-text-accent font-semibold">с использованием GigaChat</span>
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
          <div className="badge">
            <Award className="w-4 h-4" />
            Хакатон Сбер 2026
          </div>
          <div className="badge-accent">
            <Brain className="w-4 h-4" />
            AI-Powered
          </div>
          <StatusBadge connected={apiConnected} />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* File Upload Card */}
            <div className="card p-8 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
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

            {/* JSON Input Card */}
            <div className="card p-8 fade-in" style={{ animationDelay: '0.1s' }}>
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

            {/* Error Display */}
            {error && (
              <div className="card p-6 border-2 border-red-500/50 bg-red-50/80 backdrop-blur-sm flex items-start gap-4 fade-in">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg">
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
              <div className="card p-8 border-2 border-emerald-500/50 bg-emerald-50/80 backdrop-blur-sm fade-in">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
                    <Loader className="w-10 h-10 text-emerald-600 animate-spin relative" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-700 text-lg">Генерация кода...</p>
                    <p className="text-sm text-slate-600">GigaChat создаёт оптимальное решение</p>
                  </div>
                </div>
                <div className="mt-6 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-amber-500 animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Output */}
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            {generatedCode ? (
              <CodeDisplay
                code={generatedCode}
                filename={resultFilename}
                onGenerateTests={handleGenerateTests}
                onValidate={handleValidate}
                validation={validation}
                onCopy={handleCopy}
                copied={copied}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Возможности сервиса</h2>
            <p className="text-lg text-white/80">Всё необходимое для работы с данными</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Brain}
              title="AI-генерация"
              description="GigaChat создаёт оптимальный TypeScript код для вашего формата данных"
              gradient="from-emerald-500 to-green-600"
            />
            <FeatureCard
              icon={Layers}
              title="Все форматы"
              description="CSV, Excel, PDF, DOCX, PNG, JPG — поддержка всех популярных форматов"
              gradient="from-amber-500 to-yellow-600"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Валидация"
              description="Автоматическая проверка кода на ошибки и best practices"
              gradient="from-purple-500 to-violet-600"
            />
            <FeatureCard
              icon={TestTube}
              title="Unit-тесты"
              description="Автогенерация тестов для transformData функции"
              gradient="from-pink-500 to-rose-600"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="card-glass p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Готовы начать?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Загрузите файл, опишите целевую схему и получите готовый TypeScript код за секунды
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-white/70">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Бесплатно</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Быстро</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Безопасно</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Хакатон Сбер 2026 • TypeScript Code Generator • GigaChat Powered</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
