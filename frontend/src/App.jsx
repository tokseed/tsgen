import React, { useState } from 'react'
import { Sparkles, Zap, Award, Terminal, Settings, ChevronDown, ChevronUp, Copy, Check, Download, Code2, FileText, AlertCircle, Loader, CheckCircle, X, Wifi, WifiOff, TestTube, ShieldCheck } from 'lucide-react'
import FileUpload from './FileUpload'
import JsonInput from './JsonInput'
import { CodeDisplay, EmptyState } from './CodeDisplay'
import { generateCode, checkHealth, validateCode, generateTests, fullPipeline } from './api'

function DevPanel({ logs, isOpen, onToggle }) {
  return (
    <div className={`fixed bottom-4 left-4 right-4 lg:left-auto lg:right-auto lg:w-[500px] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 z-50 ${isOpen ? 'lg:h-[400px]' : 'lg:h-auto'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent-yellow" />
          <span className="text-sm font-medium text-white">Developer Panel</span>
          <span className="px-2 py-0.5 text-xs bg-accent-yellow/20 text-accent-yellow rounded">DEV</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="h-[340px] overflow-y-auto p-4 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-slate-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-2 p-2 rounded ${
                log.type === 'success' ? 'bg-green-500/10 text-green-400' :
                log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                log.type === 'info' ? 'bg-blue-500/10 text-blue-400' :
                'bg-slate-800 text-slate-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className="uppercase font-bold">{log.type}</span>
                </div>
                <p className="whitespace-pre-wrap">{log.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ connected }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      connected 
        ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
        : 'bg-red-500/10 text-red-600 border border-red-500/20'
    }`}>
      {connected ? (
        <>
          <Wifi className="w-3 h-3" />
          API Connected
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          API Offline
        </>
      )}
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
  const [devMode, setDevMode] = useState(false)
  const [devPanelOpen, setDevPanelOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [apiConnected, setApiConnected] = useState(false)
  const [validation, setValidation] = useState(null)
  const [generatedTests, setGeneratedTests] = useState(null)

  const addLog = (message, type = 'info') => {
    if (devMode) {
      const time = new Date().toLocaleTimeString()
      setLogs(prev => [...prev, { time, message, type }])
    }
  }

  const checkApiConnection = async () => {
    try {
      await checkHealth()
      setApiConnected(true)
      addLog('API connection established', 'success')
    } catch (err) {
      setApiConnected(false)
      addLog(`API connection failed: ${err.message}`, 'error')
    }
  }

  React.useEffect(() => {
    checkApiConnection()
    const interval = setInterval(checkApiConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleGenerate = async (useFullPipeline = false) => {
    if (!selectedFile || !targetJson.trim()) return

    setIsGenerating(true)
    setError(null)
    setValidation(null)
    addLog(`Starting generation for: ${selectedFile.name}`, 'info')
    addLog(`Target JSON: ${targetJson.substring(0, 100)}...`, 'info')

    try {
      if (useFullPipeline) {
        addLog('Using full pipeline (code + tests + validation)...', 'info')
        const result = await fullPipeline(selectedFile, targetJson)
        setGeneratedCode(result.typescript_code)
        setResultFilename(result.filename.replace(/\.[^/.]+$/, '') + '.ts')
        setValidation(result.validation)
        if (result.tests_code) {
          setGeneratedTests(result.tests_code)
        }
        addLog('Full pipeline completed!', 'success')
      } else {
        addLog('Sending request to API...', 'info')
        const result = await generateCode(selectedFile, targetJson)
        setGeneratedCode(result.typescript_code)
        setResultFilename(result.filename.replace(/\.[^/.]+$/, '') + '.ts')
        addLog('Code generated successfully!', 'success')
        addLog(`Output file: ${result.filename}`, 'info')
      }
    } catch (err) {
      setError(err.message)
      addLog(`Error: ${err.message}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleValidate = async () => {
    if (!generatedCode) return
    
    try {
      const result = await validateCode(generatedCode)
      setValidation(result)
      addLog(`Validation: ${result.valid ? 'valid' : 'invalid'}`, result.valid ? 'success' : 'error')
    } catch (err) {
      setError(err.message)
      addLog(`Validation error: ${err.message}`, 'error')
    }
  }

  const handleGenerateTests = async () => {
    if (!generatedCode) return null
    
    try {
      const result = await generateTests(generatedCode, targetJson, resultFilename)
      return result.tests_code
    } catch (err) {
      setError(err.message)
      addLog(`Tests generation error: ${err.message}`, 'error')
      return null
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sber-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-yellow/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-sber-green/30 blur-xl rounded-full animate-pulse" />
            <div className="relative p-4 rounded-full bg-gradient-to-br from-sber-green to-sber-light shadow-lg shadow-sber-green/30">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -right-2 -top-2 p-2 rounded-full bg-accent-yellow shadow-lg">
              <Zap className="w-5 h-5 text-slate-900" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-sber-green via-sber-light to-sber-dark bg-clip-text text-transparent tracking-tight">
          TypeScript Code Generator
        </h1>
        
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          AI-powered сервис для генерации TypeScript-кода преобразования файлов в JSON с использованием GigaChat
        </p>

        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border-2 border-sber-green/20 bg-sber-green/5 text-sber-green">
            <Award className="w-4 h-4" />
            Хакатон Сбер 2026
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border-2 border-accent-yellow/50 bg-accent-yellow/10 text-slate-700">
            <Zap className="w-4 h-4" />
            AI-Powered
          </span>
          <StatusBadge connected={apiConnected} />
        </div>

        {/* Dev Mode Toggle */}
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={() => setDevMode(!devMode)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              devMode 
                ? 'bg-slate-800 text-accent-yellow border-2 border-accent-yellow/50' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Dev Mode {devMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto max-w-7xl px-4 pb-32">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sber-green" />
                Загрузка файла
              </h2>
              <FileUpload
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
              />
              {selectedFile && devMode && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                  <p>File: {selectedFile.name}</p>
                  <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <p>Type: {selectedFile.type || 'application/octet-stream'}</p>
                </div>
              )}
            </div>

            <div className="card p-6">
              <JsonInput
                value={targetJson}
                onChange={setTargetJson}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>

            {error && (
              <div className="card p-4 border-2 border-red-500/50 bg-red-50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-600">Ошибка генерации</p>
                  <p className="text-sm text-red-500 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isGenerating && (
              <div className="card p-6 border-2 border-sber-green/30 bg-sber-green/5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Loader className="w-8 h-8 text-sber-green animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium text-sber-green">Генерация кода...</p>
                    <p className="text-sm text-slate-500">Обращение к GigaChat API</p>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sber-green to-accent-yellow animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {generatedCode ? (
              <CodeDisplay
                code={generatedCode}
                filename={resultFilename}
                onGenerateTests={handleGenerateTests}
                onValidate={handleValidate}
                validation={validation}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 md:grid-cols-4">
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-sber-green/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-sber-green" />
            </div>
            <h3 className="font-semibold mb-2">AI-генерация</h3>
            <p className="text-sm text-slate-500">GigaChat создаёт оптимальный TypeScript код для вашего формата данных</p>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent-yellow/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent-yellow" />
            </div>
            <h3 className="font-semibold mb-2">Все форматы</h3>
            <p className="text-sm text-slate-500">Поддержка CSV, Excel, PDF, DOCX, PNG, JPG и других форматов</p>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Валидация</h3>
            <p className="text-sm text-slate-500">Автоматическая проверка кода на ошибки и best practices</p>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
              <TestTube className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Unit-тесты</h3>
            <p className="text-sm text-slate-500">Автогенерация тестов для transformData функции</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        <p>Хакатон Сбер 2026 • TypeScript Code Generator • GigaChat Powered</p>
      </footer>

      {/* Dev Panel */}
      <DevPanel
        logs={logs}
        isOpen={devPanelOpen}
        onToggle={() => setDevPanelOpen(!devPanelOpen)}
      />
    </div>
  )
}
