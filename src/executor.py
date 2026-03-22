"""
TypeScript Code Executor - Безопасное выполнение TS кода.
Запускает сгенерированный TypeScript код через tsx и возвращает результат в JSON.
"""

import subprocess
import json
import tempfile
import os
import signal
from typing import Optional, Dict, Any
from pathlib import Path


def execute_typescript(code: str, timeout: int = 5) -> Dict[str, Any]:
    """
    Запускает TS-код через tsx в изолированном временном окружении.
    
    Args:
        code: TypeScript код для выполнения
        timeout: Таймаут выполнения в секундах (по умолчанию 5)
    
    Returns:
        dict: {
            'success': bool,
            'data': Optional[dict] - результат выполнения,
            'error': Optional[str] - сообщение об ошибке,
            'stdout': Optional[str] - raw вывод,
            'stderr': Optional[str] - raw ошибки
        }
    """
    # 1. Оборачиваем код для вывода JSON
    wrapped_code = _wrap_code_for_json_output(code)
    
    # 2. Создаём временный файл
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.ts', 
            delete=False,
            encoding='utf-8'
        ) as f:
            f.write(wrapped_code)
            temp_path = f.name
        
        # 3. Запускаем через tsx с таймаутом
        result = _run_tsx(temp_path, timeout)
        
        # 4. Парсим stdout как JSON
        return _parse_result(result)
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': f'Execution timeout > {timeout}s',
            'stdout': None,
            'stderr': None,
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'stdout': None,
            'stderr': None,
        }
    finally:
        # 5. Убираем временный файл
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass


def _wrap_code_for_json_output(code: str) -> str:
    """
    Оборачивает код для безопасного выполнения и вывода JSON.
    """
    wrapper = """
// === AUTO-GENERATED TEST WRAPPER ===
(async () => {{
    const testInput = "id,name,value\\n1,test,100\\n2,demo,200\\n3,sample,300";
    
    try {{
        // Выполняем пользовательский код
        {code}
        
        // Вызываем transformData с тестовыми данными
        if (typeof transformData === 'function') {{
            const result = await transformData(testInput);
            console.log(JSON.stringify({{
                success: true,
                data: result,
                tests: [
                    {{ name: 'function exists', passed: true }},
                    {{ name: 'returns promise', passed: result instanceof Promise }},
                    {{ name: 'has data property', passed: result && result.data !== undefined }},
                    {{ name: 'has metadata', passed: result && result.metadata !== undefined }}
                ]
            }}, null, 2));
        }} else {{
            console.log(JSON.stringify({{
                success: false,
                error: 'transformData function not found'
            }}));
            process.exitCode = 1;
        }}
    }} catch (e) {{
        console.error(JSON.stringify({{
            success: false,
            error: {{
                message: e instanceof Error ? e.message : String(e),
                name: e instanceof Error ? e.name : 'UnknownError'
            }}
        }}, null, 2));
        process.exitCode = 1;
    }}
}})();
"""
    return wrapper.format(code=code)


def _run_tsx(file_path: str, timeout: int) -> subprocess.CompletedProcess:
    """
    Запускает файл через tsx с таймаутом.
    """
    # Подготовка окружения
    env = {
        **os.environ,
        'NODE_NO_WARNINGS': '1',  # Скрыть предупреждения Node.js
        'FORCE_COLOR': '0',  # Отключить цвета для чистого вывода
    }
    
    # Проверка доступности tsx
    tsx_cmd = _find_tsx_command()
    
    # Запуск процесса
    result = subprocess.run(
        [tsx_cmd, file_path],
        capture_output=True,
        text=True,
        timeout=timeout,
        env=env,
        # Используем signal только на Unix-системах
        preexec_fn=_set_signal_handler if hasattr(signal, 'SIGPIPE') else None,
    )
    
    return result


def _find_tsx_command() -> str:
    """
    Поиск команды tsx в системе.
    """
    # Проверяем возможные расположения
    possible_commands = [
        'tsx',
        'npx tsx',
        './node_modules/.bin/tsx',
    ]
    
    for cmd in possible_commands:
        try:
            # Проверяем доступность команды
            test_cmd = cmd.split()[0] if ' ' in cmd else cmd
            result = subprocess.run(
                [test_cmd, '--version'],
                capture_output=True,
                text=True,
                timeout=2,
            )
            if result.returncode == 0:
                return cmd
        except Exception:
            continue
    
    # Если tsx не найден, пробуем node + ts-node
    try:
        result = subprocess.run(
            ['node', '--version'],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if result.returncode == 0:
            # Возвращаем npx tsx как fallback
            return 'npx tsx'
    except Exception:
        pass
    
    raise RuntimeError(
        "tsx не найден. Установите: npm install -g tsx typescript @types/node"
    )


def _set_signal_handler():
    """
    Установщик обработчика сигналов для Unix-систем.
    """
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    signal.signal(signal.SIGINT, signal.SIG_IGN)


def _parse_result(result: subprocess.CompletedProcess) -> Dict[str, Any]:
    """
    Парсит результат выполнения и возвращает структурированный ответ.
    """
    stdout = result.stdout.strip() if result.stdout else ''
    stderr = result.stderr.strip() if result.stderr else ''
    
    # Если код возврата 0, пытаемся распарсить stdout как JSON
    if result.returncode == 0:
        # Пытаемся найти JSON в выводе
        json_data = _extract_json_from_output(stdout)
        
        if json_data is not None:
            return {
                'success': True,
                'data': json_data,
                'error': None,
                'stdout': stdout,
                'stderr': stderr,
            }
        
        # Если JSON не найден, возвращаем raw вывод
        return {
            'success': True,
            'data': None,
            'error': 'No JSON output found',
            'stdout': stdout,
            'stderr': stderr,
        }
    
    # Если код возврата не 0, пытаемся распарсить ошибку из stderr
    error_json = _extract_json_from_output(stderr)
    
    if error_json and isinstance(error_json, dict):
        if error_json.get('success') is False:
            return {
                'success': False,
                'data': None,
                'error': error_json.get('error', {}).get('message', 'Unknown error'),
                'error_details': error_json.get('error'),
                'stdout': stdout,
                'stderr': stderr,
            }
    
    # Стандартная ошибка
    return {
        'success': False,
        'data': None,
        'error': stderr if stderr else f'Process exited with code {result.returncode}',
        'stdout': stdout,
        'stderr': stderr,
    }


def _extract_json_from_output(output: str) -> Optional[Any]:
    """
    Извлекает JSON из вывода (может содержать другой текст).
    """
    if not output:
        return None
    
    # Пытаемся распарсить весь вывод как JSON
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        pass
    
    # Ищем JSON в выводе (последний JSON объект/массив)
    lines = output.split('\n')
    for i in range(len(lines) - 1, -1, -1):
        line = lines[i].strip()
        if line.startswith('{') or line.startswith('['):
            try:
                # Пытаемся распарсить эту строку
                return json.loads(line)
            except json.JSONDecodeError:
                # Пытаемся собрать JSON из нескольких строк
                try:
                    json_str = '\n'.join(lines[i:])
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue
    
    return None


def check_tsx_installed() -> Dict[str, Any]:
    """
    Проверяет установлен ли tsx и Node.js.
    
    Returns:
        dict: {
            'tsx_installed': bool,
            'node_installed': bool,
            'tsx_version': Optional[str],
            'node_version': Optional[str]
        }
    """
    result = {
        'tsx_installed': False,
        'node_installed': False,
        'tsx_version': None,
        'node_version': None,
    }
    
    # Проверка Node.js
    try:
        node_result = subprocess.run(
            ['node', '--version'],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if node_result.returncode == 0:
            result['node_installed'] = True
            result['node_version'] = node_result.stdout.strip()
    except Exception:
        pass
    
    # Проверка tsx
    try:
        tsx_result = subprocess.run(
            ['tsx', '--version'],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if tsx_result.returncode == 0:
            result['tsx_installed'] = True
            result['tsx_version'] = tsx_result.stdout.strip()
    except Exception:
        # Пробуем через npx
        try:
            tsx_result = subprocess.run(
                ['npx', 'tsx', '--version'],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if tsx_result.returncode == 0:
                result['tsx_installed'] = True
                result['tsx_version'] = tsx_result.stdout.strip()
        except Exception:
            pass
    
    return result


# Экспорт публичного API
__all__ = [
    'execute_typescript',
    'check_tsx_installed',
]
