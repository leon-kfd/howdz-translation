<template>
  <div class="tranlation-wrapper">
    <div class="header">
      <div class="lang-control">
        <div class="from">{{ fromLang }}</div>
        <div class="exchange standard-icon" @click="onExchange">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M16.0503 12.0498L21 16.9996L16.0503 21.9493L14.636 20.5351L17.172 17.9988L4 17.9996V15.9996L17.172 15.9988L14.636 13.464L16.0503 12.0498ZM7.94975 2.0498L9.36396 3.46402L6.828 5.9988L20 5.99955V7.99955L6.828 7.9988L9.36396 10.5351L7.94975 11.9493L3 6.99955L7.94975 2.0498Z"></path>
          </svg>
        </div>
        <div class="to">{{ toLang }}</div>
      </div>
    </div>
    <div class="main">
      <div class="t-from">
        <div class="h-textarea-wrapper">
          <textarea v-model="source" placeholder="请输入需要翻译的文本" maxlength="100"></textarea>
          <div v-if="source.length > 0" class="clean standard-icon" @click="onClean">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path>
            </svg>
          </div>
        </div>
      </div>
      <div class="t-to">
        <div class="result-wrapper">
          <div v-if="loading" class="loading">...</div>
          <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>
          <div v-else>{{ result }}</div>

          <template v-if="!loading && !errorMsg && result">
            <div class="jump standard-icon" @click="onJump">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
              </svg>
            </div>
            <div class="copy standard-icon" @click="onCopy">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path>
              </svg>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { apiURL } from '../global'
import { execCopy } from '../utils'

type Lang = '中文' | '英文'

const LANG_MAP: Record<Lang, string> = {
  '中文': 'zh',
  '英文': 'en'
}

const fromLang = ref<Lang>('中文')
const toLang = ref<Lang>('英文')

const source = ref('')
const result = ref('')
const loading = ref(false)
const errorMsg = ref('')

const params = new URLSearchParams(location.search)
const auth = params.get('auth') || ''
const appid = params.get('appid') || ''
const key = params.get('key') || ''

const onExchange = () => {
  [fromLang.value, toLang.value] = [toLang.value, fromLang.value]
  if (result.value) {
    source.value = result.value
    result.value = ''
  }
}
const onClean = () => {
  source.value = ''
  result.value = ''
}

const onCopy = () => {
  execCopy(result.value)
}

const onJump = () => {
  const jumpURL = `https://fanyi.baidu.com/#${LANG_MAP[fromLang.value]}/${LANG_MAP[toLang.value]}/${source.value}`
  window.open(jumpURL)
}

const onTranslate = async () => {
  errorMsg.value = ''
  if (!source.value) {
    result.value = ''
    return
  }
  if (!auth && (!appid || !key)) {
    errorMsg.value = '未设置授权KEY'
    return
  }
  const target = `${apiURL}/tapi/translate/baidu`
  const params = {
    from: LANG_MAP[fromLang.value],
    to: LANG_MAP[toLang.value],
    q: source.value.slice(0, 100),
    auth,
    appid,
    key
  }
  loading.value = true
  try {
    const res = await fetch(`${target}?${new URLSearchParams(params).toString()}`)
    const json = await res.json()
    if (json.errCode === 200) {
      const { data } = json
      const { trans_result } = data
      if (trans_result && trans_result.length > 0) {
        const { dst } = trans_result[0]
        result.value = dst
      }
    } else {
      throw new Error(json.errMsg || '未知错误')
    }
  } catch (e: Error | unknown) {
    errorMsg.value = e?.toString() || '未知错误'
  } finally {
    loading.value = false
  }
}

watchDebounced(source, () => {
  onTranslate()
}, {
  debounce: 500
})

</script>

<style lang="scss" scoped>
.tranlation-wrapper {
  width: min(720px, 100vw);
  height: min(460px, 100vh);
  display: flex;
  background: #fff;
  box-shadow: 0 0 10px rgba(29, 66, 230, 0.3);
  border-radius: 8px;
  flex-direction: column;
  .header {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #eee;
    
    .lang-control {
      font-size: 18px;
      color: #4b4b4b;
      line-height: 24px;
      user-select: none;
      display: flex;
      align-items: center;
      width: 100%;
      flex: 1;
      .exchange {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 8px;
        cursor: pointer;
        border-radius: 4px;
        &:hover {
          background: rgba(0,0,0,0.04);
        }
        svg path {
          fill: currentColor
        }
      }
    }
  }
  .main {
    display: flex;
    height: 100%;
    flex: 1;
    padding: 12px;
    .t-from {
      width: 100%;
      height: 100%;
      border-right: 1px solid #eee;
      padding-right: 12px;
    }
    .t-to {
      width: 100%;
      height: 100%;
      padding-left: 12px;
    }
  }
}

.h-textarea-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #EEEDF3;
  position: relative;
  padding-bottom: 32px;
  textarea {
    width: 100%;
    height: 100%;
    padding: 12px;
    font-size: 18px;
    line-height: 1.4;
    color: #262626;
    box-sizing: border-box;
    outline: none;
    border: none;
    background: transparent;
    font-family: inherit;
    resize: none;
    &::placeholder {
      color: #aaa;
    }
  }
  .clean {
    position: absolute;
    right: 4px;
    bottom: 4px;
    color: #b66;
    width: 28px;
    height: 28px;
  }
}
.result-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #EEEDF3;
  position: relative;
  padding: 12px;
  padding-bottom: 32px;
  font-size: 18px;
  line-height: 1.4;
  color: #262626;
  .error {
    color: #b66;
  }
  .copy {
    position: absolute;
    right: 4px;
    bottom: 4px;
    color: #465464;
    width: 28px;
    height: 28px;
  }
  .jump {
    position: absolute;
    right: 32px;
    bottom: 4px;
    color: #465464;
    width: 28px;
    height: 28px;
  }
}

@media screen and (max-width: 620px) {
  .tranlation-wrapper {
    width: 100vw;
    height: 100vh;
    border-radius: none;
    box-shadow: none;
    .main {
      flex-direction: column;
      .t-from {
        padding-right: 0;
        padding-bottom: 12px;
        border-right: none;
        border-bottom: 1px solid #eee;
      }
      .t-to {
        padding-left: 0;
        padding-top: 12px;
      }
    }
  }
}

.standard-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  svg path {
    fill: currentColor
  }
  &:hover {
    background: rgba(0,0,0,0.04);
  }
}
</style>
