// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  prettier // must be last — disables ESLint rules that conflict with Prettier
)
