/**
 * Parse Vagaro Embed Codes CSV
 *
 * This script reads the CSV file containing Vagaro embed codes for each service
 * and extracts the service codes to update the database.
 *
 * Usage: npx tsx scripts/parse-vagaro-embed-codes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Business prefix that's constant across all services
const VAGARO_BUSINESS_PREFIX = 'OZqsEJatCoPqFJ1y6BuSdBuOc1WJD1wOc1WO61Ctdg4tjxMG9pUxapkUcvCu7gCmjZcoapOUc9CvdfQOapkvdfoR';

interface ServiceMapping {
  name: string;
  serviceCode: string;
  fullUrl: string;
}

function extractServiceCode(embedCode: string): string | null {
  // Find the WidgetEmbeddedLoader URL in the embed code
  const urlMatch = embedCode.match(/WidgetEmbeddedLoader\/([^"?#]+)/);
  if (!urlMatch) return null;

  const fullPath = urlMatch[1];

  // Extract the service code (everything after the business prefix)
  if (fullPath.startsWith(VAGARO_BUSINESS_PREFIX)) {
    return fullPath.slice(VAGARO_BUSINESS_PREFIX.length);
  }

  return null;
}

function parseCSV(csvContent: string): ServiceMapping[] {
  const lines = csvContent.split('\n');
  const mappings: ServiceMapping[] = [];

  // Skip header line
  let currentName = '';
  let currentEmbed = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV format: name,embed_code
    // But embed_code spans multiple lines due to HTML content
    // Name is at the start of a "record"

    // Check if this line starts a new record (has a name followed by embed code start)
    if (line.includes(',"<div id=\'frameTitle\'')) {
      // This is the start of a new record
      // Save previous record if exists
      if (currentName && currentEmbed) {
        const serviceCode = extractServiceCode(currentEmbed);
        if (serviceCode) {
          mappings.push({
            name: currentName,
            serviceCode,
            fullUrl: `https://www.vagaro.com//resources/WidgetEmbeddedLoader/${VAGARO_BUSINESS_PREFIX}${serviceCode}`
          });
        }
      }

      // Parse new record
      const commaIndex = line.indexOf(',"<div');
      currentName = line.slice(0, commaIndex);
      currentEmbed = line.slice(commaIndex + 1);
    } else if (currentName) {
      // This is a continuation of the embed code
      currentEmbed += line;
    }
  }

  // Don't forget the last record
  if (currentName && currentEmbed) {
    const serviceCode = extractServiceCode(currentEmbed);
    if (serviceCode) {
      mappings.push({
        name: currentName,
        serviceCode,
        fullUrl: `https://www.vagaro.com//resources/WidgetEmbeddedLoader/${VAGARO_BUSINESS_PREFIX}${serviceCode}`
      });
    }
  }

  return mappings;
}

function generateSQL(mappings: ServiceMapping[]): string {
  let sql = `-- Generated SQL to update services with Vagaro service codes
-- Run this after the 0022_add_vagaro_service_code.sql migration

`;

  for (const mapping of mappings) {
    // Escape single quotes in service name
    const escapedName = mapping.name.replace(/'/g, "''");
    sql += `UPDATE services SET vagaro_service_code = '${mapping.serviceCode}' WHERE name = '${escapedName}';\n`;
  }

  return sql;
}

function generateJSON(mappings: ServiceMapping[]): string {
  return JSON.stringify(mappings, null, 2);
}

async function main() {
  // Check for CSV file path argument or use default
  const csvPath = process.argv[2] || path.join(process.env.HOME || '', 'Desktop', 'vagaro_embed_codes.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error('Usage: npx tsx scripts/parse-vagaro-embed-codes.ts [path-to-csv]');
    process.exit(1);
  }

  console.log(`Reading CSV from: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const mappings = parseCSV(csvContent);

  console.log(`\nParsed ${mappings.length} services:\n`);

  // Print summary table
  console.log('Service Name'.padEnd(50) + 'Code');
  console.log('-'.repeat(60));
  for (const mapping of mappings) {
    console.log(mapping.name.slice(0, 48).padEnd(50) + mapping.serviceCode);
  }

  // Generate output files
  const outputDir = path.join(__dirname, '..', 'drizzle');

  // SQL file
  const sqlPath = path.join(outputDir, '0023_update_vagaro_service_codes.sql');
  fs.writeFileSync(sqlPath, generateSQL(mappings));
  console.log(`\nSQL file written to: ${sqlPath}`);

  // JSON file for reference
  const jsonPath = path.join(__dirname, 'vagaro-service-codes.json');
  fs.writeFileSync(jsonPath, generateJSON(mappings));
  console.log(`JSON file written to: ${jsonPath}`);

  console.log('\nNext steps:');
  console.log('1. Run migration: npx drizzle-kit push');
  console.log('2. Or apply SQL directly to your database');
}

main().catch(console.error);
