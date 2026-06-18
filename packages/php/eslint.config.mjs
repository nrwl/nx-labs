import baseConfig from "../../eslint.config.mjs";
import jsoncEslintParser from "jsonc-eslint-parser";

export default [
    ...baseConfig,
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        files: [
            "**/*.js",
            "**/*.jsx"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        files: [
            "**/*.json"
        ],
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: [
                        "{projectRoot}/eslint.config.{js,cjs,mjs}"
                    ],
                    ignoredDependencies: [
                        "nx",
                        "@nx/devkit"
                    ]
                }
            ]
        },
        languageOptions: {
            parser: jsoncEslintParser
        }
    },
    {
        files: [
            "./package.json",
            "./generators.json"
        ],
        rules: {
            "@nx/nx-plugin-checks": "error"
        },
        languageOptions: {
            parser: jsoncEslintParser
        }
    }
];
