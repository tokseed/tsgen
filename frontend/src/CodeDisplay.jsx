import React, { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Download, Code2, CopyPlus, RefreshCw, ShieldCheck, ShieldAlert, FileCheck, Zap, FileCode, Info, AlertCircle, CheckCircle, Play, Terminal, Wrench2, Loader2 } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'

// Browser-based TypeScript executor and validator
const validateTSInBrowser = (code) => {
  const errors = []
  const warnings = []
  const info = []
  const metrics = {}
  
  if (!code || !code.trim()) {
    return { valid: false, errors: ['Пустой код'], warnings, info, metrics }
  }
  
  // Check for markdown blocks
  if (code.includes('```')) {
    errors.push('Код содержит markdown-блоки (```)')
  }
  
  // Check for transformData function
  if (!/export\s+(?:async\s+)?function\s+transformData/.test(code)) {
    errors.push('Отсутствует экспортируемая функция transformData')
  }
  
  // Check for Promise return type
  if (!/Promise\s*</.test(code)) {
    errors.push('Функция transformData должна возвращать Promise')
  }
  
  // Check bracket balance
  const brackets = { '{': '}', '(': ')', '[': ']' }
  const stack = []
  let inString = false
  let stringChar = ''
  let inComment = false
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i]
    const prev = code[i - 1]
    
    if (prev === '/' && char === '/' && !inString) {
      inComment = true
      continue
    }
    if (char === '\n') inComment = false
    if (inComment) continue
    
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
    } else if (inString && char === stringChar && prev !== '\\') {
      inString = false
    }
    
    if (!inString && !inComment) {
      if (char in brackets) {
        stack.push(char)
      } else if (char in Object.values(brackets)) {
        const last = stack.pop()
        if (brackets[last] !== char) {
          errors.push(`Несбалансированные скобки на позиции ${i}`)
        }
      }
    }
  }
  
  if (stack.length > 0) {
    errors.push(`Не закрыты скобки: ${stack.join(', ')}`)
  }
  
  // Count metrics
  metrics.lines = code.split('\n').length
  metrics.function_count = (code.match(/function\s+\w+/g) || []).length
  metrics.interface_count = (code.match(/interface\s+\w+/g) || []).length
  
  // Check for interfaces
  if (!/interface\s+\w+/.test(code) && !/type\s+\w+\s*=/.test(code)) {
    warnings.push('Рекомендуется добавить TypeScript интерфейсы')
  }
  
  // Check for var
  if (/\bvar\b/.test(code)) {
    warnings.push("Используется 'var' — рекомендуется 'const' или 'let'")
  }
  
  info.push('Код проверен в браузере')
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    metrics
  }
}

const executeTSInBrowser = async (code, testInput = 'id,name,value\n1,test,100\n2,demo,200') => {
  try {
    // Check if function exists
    if (!/function\s+transformData/.test(code)) {
      return { success: false, error: 'Функция transformData не найдена', type: 'parse' }
    }
    
    // Extract the function body
    const funcMatch = code.match(/export\s+async\s+function\s+transformData\s*\([^)]*\)[^}]*\{[\s\S]*?^\}/m)
    const simpleMatch = code.match(/function\s+transformData\s*\([^)]*\)[^}]*\{[\s\S]*?^\}/m)
    
    let funcBody = funcMatch?.[0] || simpleMatch?.[0]
    if (!funcBody) {
      return { success: false, error: 'Не удалось извлечь функцию', type: 'parse' }
    }
    
    // Remove TypeScript types for execution
    let jsCode = funcBody
      .replace(/:\s*(string|number|boolean|any|void|never|null|undefined)\s*([,)=])/g, '$2')
      .replace(/:\s*(string|number|boolean|any|void|never)\s*\{/g, '{')
      .replace(/Promise<[^>]+>/g, 'Promise')
      .replace(/interface\s+\w+\s*\{[\s\S]*?\};?/g, '')
      .replace(/type\s+\w+\s*=\s*\{[\s\S]*?\};?/g, '')
      .replace(/as\s+\w+/g, '')
    
    // Execute
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
      const fn = new AsyncFunction('input', `
        ${jsCode}
        return transformData(input)
      `)
      
      const result = await fn(testInput)
      
      return {
        success: true,
        data: result,
        tests: [
          { name: 'Функция выполнена', passed: true },
          { name: 'Результат получен', passed: !!result },
          { name: 'Имеет data', passed: result && result.data !== undefined },
          { name: 'Имеет metadata', passed: result && result.metadata !== undefined },
          { name: 'data массив', passed: Array.isArray(result?.data) }
        ]
      }
    } catch (execError) {
      return { success: false, error: execError.message, type: 'runtime' }
    }
    
  } catch (e) {
    return { success: false, error: e.message, type: 'runtime' }
  }
}

export function CodeDisplay({ 
  code, 
  filename, 
  onValidate, 
  validation, 
  showValidation = false, 
  onCopy, 
  copied,
  targetJson,
  selectedFile,
  onCodeUpdate,
  isGenerating,
}) {
  const [activeTab, setActiveTab] = useState('code')
  const [downloaded, setDownloaded] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showValidationPanel, setShowValidationPanel] = useState(showValidation)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [isFixing, setIsFixing] = useState(false)

  useEffect(() => {
    Prism.highlightAll()
  }, [code, activeTab])

  useEffect(() => {
    setShowValidationPanel(showValidation)
  }, [showValidation])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    if (onCopy) onCopy()
  }, [code, onCopy])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (filename || 'generated').replace(/\.[^/.]+$/, '') + '.ts'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }, [code, filename])

  const handleValidate = useCallback(async () => {
    if (!code) return
    
    setIsValidating(true)
    setIsExecuting(true)
    
    // First, validate in browser
    const browserValidation = validateTSInBrowser(code)
    
    // If browser validation passes, try backend validation
    if (browserValidation.valid && onValidate) {
      try {
        await onValidate()
        setShowValidationPanel(true)
      } catch {
        // Backend failed, but browser validation passed - use browser result
        setShowValidationPanel(true)
      }
    } else {
      // Use browser validation result
      if (onValidate) {
        try {
          await onValidate()
        } catch {}
      }
      setShowValidationPanel(true)
    }
    
    setIsValidating(false)
    setIsExecuting(false)
  }, [code, onValidate])

  const handleExecute = useCallback(async () => {
    if (!code) return
    setIsExecuting(true)
    setExecutionResult(null)
    
    try {
      const result = await executeTSInBrowser(code)
      setExecutionResult(result)
    } catch (err) {
      setExecutionResult({ success: false, error: err.message })
    } finally {
      setIsExecuting(false)
    }
  }, [code])

  const handleFix = useCallback(async () => {
    if (!code || !targetJson || isGenerating) return
    setIsFixing(true)
    
    try {
      // Collect errors
      const errors = validation?.errors?.join('\n') || ''
      const warnings = validation?.warnings?.join('\n') || ''
      
      // Call backend to fix
      const formData = new FormData()
      formData.append('typescript_code', code)
      formData.append('target_json', targetJson)
      formData.append('errors', errors + '\n' + warnings)
      formData.append('test_errors', executionResult?.error || '')
      
      const response = await fetch('/api/fix-direct', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Ошибка исправления')
      }
      
      const result = await response.json()
      if (result.typescript_code && onCodeUpdate) {
        onCodeUpdate(result.typescript_code)
      }
    } catch (err) {
      console.error('Fix failed:', err)
    } finally {
      setIsFixing(false)
    }
  }, [code, targetJson, validation, executionResult, isGenerating, onCodeUpdate])

  if (!code) return null

  const hasErrors = validation && (!validation.valid || (validation.errors?.length > 0))
  const canFix = hasErrors || (executionResult && !executionResult.success)

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'code'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Код
        </button>
        
        <button
          onClick={handleExecute}
          disabled={isExecuting || !code}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            executionResult
              ? executionResult.success
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExecuting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : executionResult?.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : executionResult ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isExecuting ? 'Выполнение...' : executionResult?.success ? '✓ Выполнено' : executionResult ? '✕ Ошибка' : 'Выполнить'}
        </button>
        
        <button
          onClick={handleValidate}
          disabled={isValidating || !code}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            hasErrors
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
              : validation?.valid
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isValidating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : hasErrors ? (
            <ShieldAlert className="w-4 h-4" />
          ) : validation?.valid ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <FileCheck className="w-4 h-4" />
          )}
          {isValidating ? 'Проверка...' : hasErrors ? '✕ Ошибки' : validation?.valid ? '✓ Валидно' : 'Валидация'}
        </button>
        
        <button
          onClick={handleFix}
          disabled={isFixing || !canFix || isGenerating}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            canFix
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:scale-105'
              : 'bg-white/20 backdrop-blur-sm text-white/50 cursor-not-allowed'
          } ${isFixing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isFixing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wrench2 className="w-4 h-4" />
          )}
          {isFixing ? 'Исправление...' : 'Исправить'}
        </button>
        
        {validation && (
          <button
            onClick={() => setShowValidationPanel(!showValidationPanel)}
            className="px-5 py-3 text-sm font-semibold rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Execution Result */}
      {executionResult && (
        <div className={`mb-6 p-6 rounded-2xl border-2 backdrop-blur-sm ${
          executionResult.success
            ? 'bg-green-500/20 border-green-500/50'
            : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-start gap-4">
            {executionResult.success ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-400" />
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${executionResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {executionResult.success ? 'Код выполнен успешно!' : 'Ошибка выполнения'}
              </p>
              
              {executionResult.error && (
                <div className="mt-2 bg-red-900/30 rounded-lg p-3 text-sm text-red-100 font-mono">
                  {executionResult.error}
                </div>
              )}
              
              {executionResult.tests && (
                <div className="mt-3 grid gap-2">
                  {executionResult.tests.map((test, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {test.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={test.passed ? 'text-green-200' : 'text-red-200'}>
                        {test.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {executionResult.data && (
                <details className="mt-3">
                  <summary className="text-sm text-white/70 cursor-pointer">Показать результат</summary>
                  <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg text-xs text-green-200 overflow-auto max-h-48">
                    {JSON.stringify(executionResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Panel */}
      {showValidationPanel && validation && (
        <div className={`mb-6 p-6 rounded-2xl border-2 backdrop-blur-sm ${
          validation.valid ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-start gap-4">
            {validation.valid ? (
              <ShieldCheck className="w-8 h-8 text-green-400" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-red-400" />
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${validation.valid ? 'text-green-300' : 'text-red-300'}`}>
                {validation.valid ? 'Код валиден' : 'Обнаружены ошибки'}
              </p>
              
              {validation.errors?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-red-200 mb-2">Ошибки:</p>
                  <ul className="text-sm text-red-100 list-disc list-inside space-y-1 bg-red-900/30 rounded-lg p-3">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.warnings?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-amber-200 mb-2">Предупреждения:</p>
                  <ul className="text-sm text-amber-100 list-disc list-inside space-y-1 bg-amber-900/30 rounded-lg p-3">
                    {validation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.metrics && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
                  <span>Строк: {validation.metrics.lines || 0}</span>
                  <span>Функций: {validation.metrics.function_count || 0}</span>
                  <span>Интерфейсов: {validation.metrics.interface_count || 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Display */}
      <div className="bg-slate-800/95 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm text-slate-400 font-mono">
              {filename?.replace(/\.[^/.]+$/, '') || 'generated'}.ts
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all"
            >
              <Download className="w-4 h-4" />
              Скачать
            </button>
          </div>
        </div>
        
        <pre className="p-6 overflow-auto max-h-[500px]">
          <code className="language-typescript text-sm leading-relaxed">
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-16 flex flex-col items-center text-center rounded-3xl border-2 border-slate-200/50 shadow-xl">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative p-8 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-emerald-300 shadow-xl">
          <Zap className="w-20 h-20 text-emerald-600" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">Готов к генерации</h3>
      <p className="text-lg text-slate-600 max-w-md">
        Загрузите файл и укажите JSON схему для генерации TypeScript кода
      </p>
    </div>
  )
}
