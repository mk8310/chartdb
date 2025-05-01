import type { Monaco } from '@monaco-editor/react';
import { dataTypes } from '@/lib/data/data-types/data-types';

export const setupDBMLLanguage = (monaco: Monaco) => {
    monaco.languages.register({ id: 'dbml' });

    // Define themes for DBML
    monaco.editor.defineTheme('dbml-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '569CD6' }, // Table, Ref keywords
            { token: 'string', foreground: 'CE9178' }, // Strings
            { token: 'typestring', foreground: '4EC9B0' }, // String literals that contain data types
            { token: 'annotation', foreground: '9CDCFE' }, // [annotations]
            { token: 'delimiter', foreground: 'D4D4D4' }, // Braces {}
            { token: 'operator', foreground: 'D4D4D4' }, // Operators
            { token: 'type', foreground: '4EC9B0' }, // Data types
        ],
        colors: {},
    });

    monaco.editor.defineTheme('dbml-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '0000FF' }, // Table, Ref keywords
            { token: 'string', foreground: 'A31515' }, // Strings
            { token: 'typestring', foreground: '267F99' }, // String literals that contain data types
            { token: 'annotation', foreground: '001080' }, // [annotations]
            { token: 'delimiter', foreground: '000000' }, // Braces {}
            { token: 'operator', foreground: '000000' }, // Operators
            { token: 'type', foreground: '267F99' }, // Data types
        ],
        colors: {},
    });

    const dataTypesNames = dataTypes.map((dt) => dt.name);

    monaco.languages.setMonarchTokensProvider('dbml', {
        keywords: ['Table', 'Ref', 'Indexes'],
        datatypes: dataTypesNames,
        tokenizer: {
            root: [
                [/\b(Table|Ref|Indexes)\b/, 'keyword'],
                [/\[.*?\]/, 'annotation'],

                // Match data type strings with parameters
                [/"(character varying|varchar)\([0-9]+\)"/, 'typestring'],
                [/"(character varying|varchar) *\([0-9]+\)"/, 'typestring'],

                // Match char with parentheses (both with and without space)
                [/"(char|character) *\([0-9]+\)"/, 'typestring'],
                [/"(char|character)\([0-9]+\)"/, 'typestring'],

                // Match timestamp variations
                [/"timestamp( with(out)? time zone)?"/, 'typestring'],

                // Match basic data types
                [/"(integer|bigint|smallint|uuid|text)"/, 'typestring'],

                // Other quoted strings
                [/"[^"]+"/, 'string'],

                [/'.*?'/, 'string'],
                [/[{}]/, 'delimiter'],
                [/[<>]/, 'operator'],

                // Match unquoted data types
                [
                    /\b(integer|bigint|smallint|uuid|text|char|character|varchar|character varying|timestamp|date|time|boolean|decimal|numeric|real|double precision|json|jsonb|enum|set|array|user-defined)\b( *\([^)]*\))?/i,
                    'type',
                ],
            ],
        },
    });
};
