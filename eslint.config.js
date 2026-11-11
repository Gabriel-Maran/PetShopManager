// Lint do app (TEST-2): as regras do Expo (com as dos hooks) e a ordem das camadas, em que cada uma só
// importa as de baixo: view → hooks → controller → service → repository → config/domain/model.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

/** As pastas que cada camada não pode importar. */
const LAYERS = {
  "./src/domain": [
    "./src/view",
    "./src/hooks",
    "./src/controller",
    "./src/service",
    "./src/repository",
  ],
  "./src/model": [
    "./src/view",
    "./src/hooks",
    "./src/controller",
    "./src/service",
    "./src/repository",
  ],
  "./src/validation": [
    "./src/view",
    "./src/hooks",
    "./src/controller",
    "./src/service",
    "./src/repository",
  ],
  "./src/repository": ["./src/view", "./src/hooks", "./src/controller", "./src/service"],
  "./src/service": ["./src/view", "./src/hooks", "./src/controller"],
  "./src/controller": ["./src/view", "./src/hooks"],
};

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*", ".claude/*"] },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // O app declara o objeto e o tipo com o mesmo nome (petEnums.ts), de propósito.
      "@typescript-eslint/no-redeclare": "off",
    },
  },
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // Zerar a lista ou a página quando o filtro muda é de propósito; o app não usa o React Compiler.
      "react-hooks/set-state-in-effect": "off",
      "import/no-restricted-paths": [
        "error",
        {
          zones: Object.entries(LAYERS).flatMap(([target, froms]) =>
            froms.map((from) => ({ target, from, message: "Uma camada só importa as de baixo." })),
          ),
        },
      ],
    },
  },
]);
