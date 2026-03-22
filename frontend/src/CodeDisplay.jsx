import React, { useState, useEffect } from 'react'
import { Copy, Check, Download, Code2, Sparkles, CopyPlus, RefreshCw, TestTube, ShieldCheck, ShieldAlert, FileCheck, Zap, FileCode, Info, AlertCircle, CheckCircle, Play, Terminal, Wrench, Wand2 } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'
import { runTests, executeCode, fixCodeDirect } from './api'

export function CodeDisplay({ 
  code, 
  filename, 
  onGenerateTests, 
  onValidate, 
  validation, 
  showValidation = false, 
  onCopy, 
  copied,
  targetJson,
  selectedFile,
  onCodeUpdate,
  onGenerate,
}) {
  const [downloaded, setDownloaded] = useState(false)
  const [activeTab, setActiveTab] = useState('code')
  const [testsCode, setTestsCode] = useState(null)
  const [isGeneratingTests, setIsGeneratingTests] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showValidationPanel, setShowValidationPanel] = useState(showValidation)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [isFixing, setIsFixing] = useState(false)
  const [fixAttempts, setFixAttempts] = useState(0)

  useEffect(() => {
    Prism.highlightAll()
  }, [code, testsCode, activeTab])

  useEffect(() => {
    setShowValidationPanel(showValidation)
  }, [showValidation])

  const handleCopy = () => {
    const textToCopy = activeTab === 'tests' && testsCode ? testsCode : code
    navigator.clipboard.writeText(textToCopy)
    if (onCopy) onCopy()
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
      setShowValidationPanel(true)
    } catch (err) {
      console.error('Validation failed:', err)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRunTests = async () => {
    if (!testsCode || !code) return
    setIsRunningTests(true)
    setTestResults(null)
    try {
      const result = await runTests(code, testsCode, 15)
      setTestResults(result)
      setActiveTab('tests')
    } catch (err) {
      console.error('Tests failed:', err)
      setTestResults({ success: false, error: err.message })
    } finally {
      setIsRunningTests(false)
    }
  }

  const handleExecute = async () => {
    if (!code) return
    setIsExecuting(true)
    setExecutionResult(null)
    try {
      const result = await executeCode(code, 10)
      setExecutionResult(result)
      setActiveTab('code')
    } catch (err) {
      console.error('Execution failed:', err)
      setExecutionResult({ success: false, error: err.message })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleFix = async () => {
    if (!code || !targetJson) return
    
    setIsFixing(true)
    try {
      const errors = validation?.errors?.join('\n') || ''
      const testErr = testResults?.error || ''
      
      const result = await fixCodeDirect(code, targetJson, errors, testErr)
      
      if (result.success && result.typescript_code) {
        if (onCodeUpdate) {
          onCodeUpdate(result.typescript_code)
        }
        setFixAttempts(prev => prev + 1)
        
        // Автоматически валидируем новый код
        if (onValidate) {
          await onValidate()
        }
      }
    } catch (err) {
      console.error('Fix failed:', err)
    } finally {
      setIsFixing(false)
    }
  }

  const hasErrors = validation && (!validation.valid || (validation.errors && validation.errors.length > 0))
  const hasTestErrors = testResults && !testResults.success
  const canFix = hasErrors || hasTestErrors

  if (!code) return null

  const displayCode = activeTab === 'tests' && testsCode ? testsCode : code
  const displayTitle = activeTab === 'tests' ? 'Unit Tests (Vitest/Jest)' : 'Сгенерированный TypeScript код'

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'code'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Код
        </button>
        <button
          onClick={handleGenerateTests}
          disabled={isGeneratingTests}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30 scale-105'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isGeneratingTests ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGeneratingTests ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CopyPlus className="w-4 h-4" />
          )}
          {isGeneratingTests ? 'Генерация...' : 'Тесты'}
        </button>
        <button
          onClick={handleRunTests}
          disabled={!testsCode || isRunningTests}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            testResults
              ? testResults.success
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${(!testsCode || isRunningTests) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRunningTests ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : testResults ? (
            testResults.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunningTests ? 'Запуск...' : testResults ? (testResults.success ? '✓ Тесты OK' : '✕ Ошибки') : 'Запустить тесты'}
        </button>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            executionResult
              ? executionResult.success
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExecuting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : executionResult ? (
            executionResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )
          ) : (
            <Terminal className="w-4 h-4" />
          )}
          {isExecuting ? 'Выполнение...' : executionResult ? (executionResult.success ? '✓ Выполнено' : '✕ Ошибка') : 'Выполнить'}
        </button>
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            validation
              ? validation.valid
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isValidating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : validation ? (
            validation.valid ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )
          ) : (
            <FileCheck className="w-4 h-4" />
          )}
          {isValidating ? 'Проверка...' : validation ? (validation.valid ? '✓ Валидно' : '✕ Ошибки') : 'Валидация'}
        </button>
        <button
          onClick={handleFix}
          disabled={isFixing || !canFix}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            canFix
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:scale-105'
              : 'bg-white/20 backdrop-blur-sm text-white/50 cursor-not-allowed'
          } ${isFixing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={canFix ? 'Исправить код на основе ошибок' : 'Сначала запустите валидацию или тесты'}
        >
          {isFixing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {isFixing ? 'Исправление...' : 'Исправить'}
          {fixAttempts > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
              {fixAttempts}
            </span>
          )}
        </button>
        {validation && (
          <button
            onClick={() => setShowValidationPanel(!showValidationPanel)}
            className="px-5 py-3 text-sm font-semibold rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            {showValidationPanel ? 'Скрыть' : 'Детали'}
          </button>
        )}
      </div>

      {/* Test Results Panel */}
      {testResults && (
        <div className={`mb-6 p-6 rounded-2xl border-2 backdrop-blur-sm slide-in-down ${
          testResults.success
            ? 'bg-green-500/20 border-green-500/50'
            : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-start gap-4">
            {testResults.success ? (
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg scale-in">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg scale-in">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${testResults.success ? 'text-green-300' : 'text-red-300'}`}>
                {testResults.success ? 'Тесты пройдены' : 'Ошибки тестов'}
              </p>
              {testResults.execution && (
                <div className="mt-3">
                  {testResults.execution.stdout && (
                    <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-green-100 font-mono">
                      <p className="text-xs text-green-300 mb-1">✓ Вывод:</p>
                      <pre className="whitespace-pre-wrap">{testResults.execution.stdout}</pre>
                    </div>
                  )}
                  {testResults.execution.stderr && (
                    <div className="mt-2 bg-red-900/30 rounded-lg p-3 text-sm text-red-100 font-mono">
                      <p className="text-xs text-red-300 mb-1">✕ Ошибка:</p>
                      <pre className="whitespace-pre-wrap">{testResults.execution.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
              {testResults.error && (
                <div className="mt-3 bg-red-900/30 rounded-lg p-3 text-sm text-red-100 font-mono">
                  {testResults.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Panel */}
      {executionResult && (
        <div className={`mb-6 p-6 rounded-2xl border-2 backdrop-blur-sm slide-in-down ${
          executionResult.success
            ? 'bg-blue-500/20 border-blue-500/50'
            : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-start gap-4">
            {executionResult.success ? (
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg scale-in">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg scale-in">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${executionResult.success ? 'text-blue-300' : 'text-red-300'}`}>
                {executionResult.success ? 'Код выполнен' : 'Ошибка выполнения'}
              </p>
              {executionResult.execution && (
                <div className="mt-3">
                  {executionResult.execution.stdout && (
                    <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-blue-100 font-mono">
                      <p className="text-xs text-blue-300 mb-1">✓ Вывод:</p>
                      <pre className="whitespace-pre-wrap">{executionResult.execution.stdout}</pre>
                    </div>
                  )}
                  {executionResult.execution.stderr && (
                    <div className="mt-2 bg-red-900/30 rounded-lg p-3 text-sm text-red-100 font-mono">
                      <p className="text-xs text-red-300 mb-1">✕ Ошибка:</p>
                      <pre className="whitespace-pre-wrap">{executionResult.execution.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
              {executionResult.execution?.error && (
                <div className="mt-3 bg-red-900/30 rounded-lg p-3 text-sm text-red-100 font-mono">
                  {executionResult.execution.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Result Panel */}
      {showValidationPanel && validation && (
        <div className={`mb-6 p-6 rounded-2xl border-2 backdrop-blur-sm slide-in-down ${
          validation.valid
            ? 'bg-green-500/20 border-green-500/50'
            : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-start gap-4">
            {validation.valid ? (
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg scale-in">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg scale-in">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${validation.valid ? 'text-green-300' : 'text-red-300'}`}>
                {validation.valid ? 'Код валиден' : 'Обнаружены ошибки'}
              </p>
              
              {validation.metrics && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-white">
                    <span className="opacity-70">Строк:</span> {validation.metrics.lines || 0}
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-white">
                    <span className="opacity-70">Функций:</span> {validation.metrics.function_count || 0}
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-white">
                    <span className="opacity-70">Интерфейсов:</span> {validation.metrics.interface_count || 0}
                  </div>
                </div>
              )}

              {validation.errors && validation.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Ошибки ({validation.errors.length})
                  </p>
                  <ul className="text-sm text-red-100 list-disc list-inside space-y-1 bg-red-900/30 rounded-lg p-3">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-amber-200 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Предупреждения ({validation.warnings.length})
                  </p>
                  <ul className="text-sm text-amber-100 list-disc list-inside space-y-1 bg-amber-900/30 rounded-lg p-3">
                    {validation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.info && validation.info.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Информация
                  </p>
                  <ul className="text-sm text-blue-100 list-disc list-inside space-y-1 bg-blue-900/30 rounded-lg p-3">
                    {validation.info.map((info, i) => (
                      <li key={i}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Display Card */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FileCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">{displayTitle}</h3>
              <p className="text-sm text-slate-500 mt-1">TypeScript • {displayCode.length} символов</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                copied
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-slate-100 hover:bg-gradient-to-r hover:from-slate-200 hover:to-slate-300 text-slate-700'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Скопировано!' : 'Копия'}
            </button>
            <button
              onClick={handleDownload}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                downloaded
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-slate-100 hover:bg-gradient-to-r hover:from-slate-200 hover:to-slate-300 text-slate-700'
              }`}
            >
              {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              {downloaded ? 'Скачано!' : 'Скачать'}
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="code-block rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/90 border-b border-slate-700">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
            </div>
            <span className="ml-3 text-xs text-slate-400 font-mono">
              {filename ? filename.replace(/\.[^/.]+$/, '') + (activeTab === 'tests' ? '.test.ts' : '.ts') : 'generated.ts'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-slate-500">Syntax Highlighted</span>
            </div>
          </div>
          <pre className="p-0 overflow-auto max-h-[500px]">
            <code className="language-typescript block p-6 !bg-[#1e1e1e] !text-sm !leading-relaxed">
              {displayCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-16 flex flex-col items-center text-center fade-in rounded-3xl border-2 border-slate-200/50 shadow-xl">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative p-8 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 backdrop-blur-lg border-2 border-emerald-300 shadow-xl">
          <Sparkles className="w-20 h-20 text-emerald-600" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">Готов к генерации</h3>
      <p className="text-lg text-slate-600 max-w-md leading-relaxed">
        Загрузите файл с данными и укажите желаемую структуру JSON.
        AI создаст оптимальный TypeScript код.
      </p>
      <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        Ожидание входных данных
      </div>

      {/* Quick tips */}
      <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-lg">
        <div className="bg-white rounded-xl p-4 text-center border-2 border-emerald-200 shadow-md">
          <FileCode className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-slate-700 font-medium">Загрузите файл</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border-2 border-amber-200 shadow-md">
          <Code2 className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-xs text-slate-700 font-medium">Опишите схему</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border-2 border-purple-200 shadow-md">
          <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-xs text-slate-700 font-medium">Получите код</p>
        </div>
      </div>
    </div>
  )
}
