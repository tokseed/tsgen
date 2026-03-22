import React from 'react'
import { Bot, Zap, Sparkles } from 'lucide-react'

const PROVIDERS = [
  { id: 'auto', label: 'Auto', icon: Sparkles, description: 'Автоматический выбор' },
  { id: 'openrouter', label: 'OpenRouter', icon: Zap, description: 'Claude/Llama/GPT' },
  { id: 'gigachat', label: 'GigaChat', icon: Bot, description: 'Сбер GigaChat' },
]

export default function ProviderToggle({ provider, onToggle, disabled }) {
  return (
    <div className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
      {PROVIDERS.map((p) => {
        const Icon = p.icon
        const isActive = provider === p.id
        
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            disabled={disabled}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
              transition-all duration-300 group
              ${isActive 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'text-slate-600 hover:bg-slate-100'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={p.description}
          >
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl blur-lg opacity-50" />
            )}
            <Icon className={`w-4 h-4 ${isActive ? '' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`} />
            <span className="relative">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}
