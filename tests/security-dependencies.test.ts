// @para-doc [#csa-sc-12]
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @para-doc [#csa-sc-12]
describe('Dependency Supply-Chain Security & Overrides Guard (v0.13.8)', () => {
  const pkgPath = resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  it('enforces patched Astro v7+ and @astrojs/cloudflare v14+ core versions', () => {
    const astroVersion = String(pkg.dependencies?.astro || '');
    const cfAdapterVersion = String(pkg.dependencies?.['@astrojs/cloudflare'] || '');
    const wranglerVersion = String(pkg.dependencies?.wrangler || '');

    expect(astroVersion).toMatch(/^\^?7\./);
    expect(cfAdapterVersion).toMatch(/^\^?14\./);
    expect(wranglerVersion).toBe('^4.158.0');
  });

  it('removes legacy vite v7 override and applies surgical overrides for uuid and esbuild', () => {
    const overrides = pkg.overrides || {};
    expect(overrides.vite).toBeUndefined();
    expect(overrides.uuid).toBe('^11.1.1');
    expect(overrides.esbuild).toBe('^0.28.1');
  });

  it('preserves exceljs v4.4.0 and drizzle-kit v0.31.11 without destructive downgrades', () => {
    expect(pkg.dependencies?.exceljs).toBe('^4.4.0');
    expect(pkg.devDependencies?.['drizzle-kit']).toBe('^0.31.11');
  });

  it('successfully initializes ExcelJS Workbook and creates a worksheet with uuid override', async () => {
    const uuidPkgPath = resolve(process.cwd(), 'node_modules/uuid/package.json');
    const uuidPkg = JSON.parse(readFileSync(uuidPkgPath, 'utf-8'));
    expect(Number(String(uuidPkg.version).split('.')[0])).toBeGreaterThanOrEqual(11);

    if (typeof process !== 'undefined') {
      Object.defineProperty(process, 'umask', {
        value: () => 0o022,
        writable: true,
        configurable: true,
      });
    }
    const excelMod = await import('exceljs');
    const ExcelJS = (excelMod as any).default ?? excelMod;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('S1a-HKD');
    sheet.addRow(['2026-11-06', 'INV-001', 1500000]);

    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  }, 20000);
});
