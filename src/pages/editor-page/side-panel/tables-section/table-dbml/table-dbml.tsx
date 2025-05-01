import React, { useMemo } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import { importer } from '@dbml/core';
import { exportBaseSQL } from '@/lib/data/export-metadata/export-sql-script';
import type { Diagram } from '@/lib/domain/diagram';
import { useToast } from '@/components/toast/use-toast';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { DatabaseType } from '@/lib/domain/database-type';

export interface TableDBMLProps {
    filteredTables: DBTable[];
}

const getEditorTheme = (theme: EffectiveTheme) => {
    return theme === 'dark' ? 'dbml-dark' : 'dbml-light';
};

const databaseTypeToImportFormat = (
    type: DatabaseType
): 'mysql' | 'postgres' | 'mssql' => {
    switch (type) {
        case DatabaseType.SQL_SERVER:
            return 'mssql';
        case DatabaseType.MYSQL:
        case DatabaseType.MARIADB:
            return 'mysql';
        case DatabaseType.POSTGRESQL:
        case DatabaseType.COCKROACHDB:
        case DatabaseType.SQLITE:
            return 'postgres';
        default:
            return 'postgres';
    }
};

// Fix DBML formatting to ensure consistent display of char and varchar types
const normalizeCharTypeFormat = (dbml: string): string => {
    // Replace "char (N)" with "char(N)" to match varchar's formatting
    return dbml
        .replace(/"char "/g, 'char')
        .replace(/"char \(([0-9]+)\)"/g, 'char($1)')
        .replace(/"character \(([0-9]+)\)"/g, 'character($1)');
};

export const TableDBML: React.FC<TableDBMLProps> = ({ filteredTables }) => {
    const { currentDiagram } = useChartDB();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();

    const generateDBML = useMemo(() => {
        // Filter out fields with empty names and track if any were found
        let foundInvalidFields = false;
        const invalidTableNames = new Set<string>(); // Use a Set to store unique table names

        const sanitizedTables = filteredTables.map((table) => {
            const validFields = table.fields.filter((field) => {
                if (field.name === '') {
                    foundInvalidFields = true;
                    invalidTableNames.add(table.name); // Add table name to the set
                    return false; // Exclude this field
                }
                return true; // Keep this field
            });
            return {
                ...table,
                fields: validFields,
            };
        });

        if (foundInvalidFields) {
            const tableNamesString = Array.from(invalidTableNames).join(', ');
            toast({
                title: 'Warning',
                description: `Some fields had empty names in tables: [${tableNamesString}] and were excluded from the DBML export.`,
                variant: 'default',
            });
        }

        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: sanitizedTables, // Use sanitized tables
            relationships:
                currentDiagram.relationships?.filter((rel) => {
                    // Update relationship filtering to use sanitizedTables
                    const sourceTable = sanitizedTables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = sanitizedTables.find(
                        (t) => t.id === rel.targetTableId
                    );
                    // Also check if the related fields still exist after sanitization
                    const sourceFieldExists = sourceTable?.fields.some(
                        (f) => f.id === rel.sourceFieldId
                    );
                    const targetFieldExists = targetTable?.fields.some(
                        (f) => f.id === rel.targetFieldId
                    );

                    return (
                        sourceTable &&
                        targetTable &&
                        sourceFieldExists &&
                        targetFieldExists
                    );
                }) ?? [],
        } satisfies Diagram;

        const filteredDiagramWithoutSpaces: Diagram = {
            ...filteredDiagram,
            tables:
                filteredDiagram.tables?.map((table) => ({
                    ...table,
                    name: table.name.replace(/\s/g, '_'),
                    fields: table.fields.map((field) => ({
                        ...field,
                        name: field.name.replace(/\s/g, '_'),
                    })),
                    indexes: table.indexes?.map((index) => ({
                        ...index,
                        name: index.name.replace(/\s/g, '_'),
                    })),
                })) ?? [],
        } satisfies Diagram;

        const baseScript = exportBaseSQL({
            diagram: filteredDiagramWithoutSpaces,
            targetDatabaseType: currentDiagram.databaseType,
            isDBMLFlow: true,
        });

        try {
            const importFormat = databaseTypeToImportFormat(
                currentDiagram.databaseType
            );
            // Apply the normalization function to fix char type formatting
            const dbml = importer.import(baseScript, importFormat);
            return normalizeCharTypeFormat(dbml);
        } catch (e) {
            console.error(e);

            toast({
                title: 'Error',
                description:
                    'Failed to generate DBML. We would appreciate if you could report this issue!',
                variant: 'destructive',
            });

            return '';
        }
    }, [currentDiagram, filteredTables, toast]);

    return (
        <CodeSnippet
            code={generateDBML}
            className="my-0.5"
            editorProps={{
                height: '100%',
                defaultLanguage: 'dbml',
                beforeMount: setupDBMLLanguage,
                loading: false,
                theme: getEditorTheme(effectiveTheme),
                options: {
                    wordWrap: 'off',
                    mouseWheelZoom: false,
                    domReadOnly: true,
                },
            }}
        />
    );
};
