// 复制文本
export function execCopy(text: string) {
  const input = document.createElement('input') as HTMLInputElement
  input.style.opacity = '0'
  input.style.position = 'absolute'
  input.style.left = '-100000px'
  document.body.appendChild(input)
  input.value = text
  input.select()
  input.setSelectionRange(0, text.length)
  document.execCommand('copy')
  document.body.removeChild(input)
  return true
}