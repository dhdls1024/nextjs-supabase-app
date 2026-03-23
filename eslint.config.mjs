import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import typescriptParser from "@typescript-eslint/parser"
import typescriptPlugin from "@typescript-eslint/eslint-plugin"
// Prettier와 충돌하는 ESLint 포맷 규칙을 모두 비활성화
import prettierConfig from "eslint-config-prettier"
// import 순서 및 중복 방지 규칙 플러그인
import importPlugin from "eslint-plugin-import"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// FlatCompat: eslint-config-next가 아직 순수 flat config를 지원하지 않아 어댑터 사용
const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  // Next.js 기본 규칙 (core-web-vitals + typescript)
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // TypeScript 파일 전용 상세 설정
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        // 타입 인식 규칙(type-aware rules) 활성화를 위해 tsconfig 경로 지정
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      import: importPlugin,
    },
    settings: {
      // @/ 절대경로 별칭을 import 플러그인이 올바르게 인식하도록 설정
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      // any 타입 사용 시 경고 (에러 대신 경고로 점진적 개선 유도)
      "@typescript-eslint/no-explicit-any": "warn",
      // 미사용 변수: _ 접두사는 의도적 무시로 허용
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // type import 일관성 강제 — 번들 최적화에 도움
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // import 순서: builtin → external → internal(@/) → parent → sibling → index
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [
            // @/로 시작하는 절대경로를 internal 그룹으로 분류
            { pattern: "@/**", group: "internal", position: "before" },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          // 그룹 사이 빈 줄 강제 — 가독성 향상
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      // 중복 import 금지
      "import/no-duplicates": "error",

      // console.log 경고 (console.warn, console.error는 허용)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-var": "error",
      "prefer-const": "error",
    },
  },

  // Prettier 충돌 규칙 비활성화 — 반드시 배열 마지막에 위치해야 함
  prettierConfig,

  // 검사 제외 대상
  {
    ignores: [".next/**", "node_modules/**", "out/**", "public/**"],
  },
]

export default eslintConfig
