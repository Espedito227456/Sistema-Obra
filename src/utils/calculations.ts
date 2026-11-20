import {
  ConstructionProject,
  EntryComputed,
  LaborConfig,
  LaborServiceRate,
  MaterialUnitPrices,
  MaterialsBreakdown,
  PciComputedItem,
  PciItemConfig,
  ProjectMetadata,
  ScheduleStage,
  ServiceEntry,
} from '../types/construction';

const EMPTY_MATERIALS: MaterialsBreakdown = {
  cimentoSacos50kg: 0,
  calSacos20kg: 0,
  areiaM3: 0,
  areiaSacos20kg: 0,
  britaM3: 0,
  britaSacos20kg: 0,
  tijolosFuradoUnid: 0,
  tijolosMacicoUnid: 0,
  argamassaSacos20kg: 0,
  rejunteKg: 0,
};

export function formatBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(val) ? val : 0);
}

export function formatNum(val: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(val) ? val : 0);
}

export function formatPct(val: number, decimals = 2): string {
  return `${formatNum(val, decimals)}%`;
}

export function calcLaborUnitCost(
  service: LaborServiceRate,
  config: LaborConfig
): {
  custoPedreiroUnit: number;
  custoServenteUnit: number;
  custoBaseUnit: number;
  custoComEncargosUnit: number;
} {
  const prod = Math.max(service.produtividadeDia, 0.01);
  const custoPedreiroUnit = config.diariaPedreiro / prod;
  const custoServenteUnit = config.incluirServente
    ? (config.diariaServente * service.coefServente) / prod
    : 0;
  const custoBaseUnit = custoPedreiroUnit + custoServenteUnit;
  const custoComEncargosUnit =
    custoBaseUnit * (1 + Math.max(config.encargosPercent, 0) / 100);
  return {
    custoPedreiroUnit,
    custoServenteUnit,
    custoBaseUnit,
    custoComEncargosUnit,
  };
}

// 1 saco de cimento (50 kg) ≈ 0.036 m³ aparente
const VOL_SACO_CIMENTO = 0.036;
// 1 m³ de areia ou brita ≈ 75 sacos de 20 kg (densidade aparente ~1500 kg/m³)
const SACOS_20KG_POR_M3 = 75;

function calcArgamassaPorVolume(
  volumeM3: number,
  propCimento: number,
  propCal: number,
  propAreia: number
): { cimentoSacos: number; calSacos: number; areiaM3: number } {
  if (volumeM3 <= 0 || propCimento <= 0 || propAreia <= 0) {
    return { cimentoSacos: 0, calSacos: 0, areiaM3: 0 };
  }
  // Inclui 5% de perda padrão conforme Calculadora de Materiais
  const volComPerda = volumeM3 * 1.05;
  // Rendimento prático de mistura seca para argamassa (~0.80 dos volumes aparentes somados)
  const rendimentoPorSaco =
    (propCimento + propCal * 0.65 + propAreia) * VOL_SACO_CIMENTO * 0.8;
  const cimentoSacos = volComPerda / Math.max(rendimentoPorSaco, 0.01);
  const calSacos =
    propCal > 0 ? cimentoSacos * (propCal / propCimento) : 0;
  const areiaM3 = cimentoSacos * (propAreia / propCimento) * VOL_SACO_CIMENTO;
  return { cimentoSacos, calSacos, areiaM3 };
}

function calcConcretoPorVolume(
  volumeM3: number,
  propCimento: number,
  propAreia: number,
  propBrita: number,
  fatorExtra = 1.0
): { cimentoSacos: number; areiaM3: number; britaM3: number } {
  if (volumeM3 <= 0 || propCimento <= 0) {
    return { cimentoSacos: 0, areiaM3: 0, britaM3: 0 };
  }
  // Inclui 5% de perda padrão + eventual acréscimo de 20% (pilar embutido em tijolo furado)
  const volComPerda = volumeM3 * 1.05 * fatorExtra;
  // Rendimento prático de concreto (~0.68 da soma dos volumes aparentes secos)
  const rendimentoPorSaco =
    (propCimento + propAreia + propBrita) * VOL_SACO_CIMENTO * 0.68;
  const cimentoSacos = volComPerda / Math.max(rendimentoPorSaco, 0.01);
  const areiaM3 = cimentoSacos * (propAreia / propCimento) * VOL_SACO_CIMENTO;
  const britaM3 = cimentoSacos * (propBrita / propCimento) * VOL_SACO_CIMENTO;
  return { cimentoSacos, areiaM3, britaM3 };
}

export function calcMaterialsForEntry(entry: ServiceEntry): {
  materials: MaterialsBreakdown;
  quantidadeLabor: number;
  unidadeLabor: 'm²' | 'm³' | 'm';
} {
  const m: MaterialsBreakdown = { ...EMPTY_MATERIALS };
  let quantidadeLabor = entry.areaM2;
  let unidadeLabor: 'm²' | 'm³' | 'm' = 'm²';

  switch (entry.calculatorType) {
    case 'alvenaria_furado':
    case 'alvenaria_macico': {
      const comp = Math.max(entry.comprimentoCm, 1);
      const alt = Math.max(entry.alturaCm, 1);
      const larg = Math.max(entry.larguraCm, 1);
      const junta = Math.max(entry.juntaCm, 0);
      const area = Math.max(entry.areaM2, 0);

      const areaUnitComJunta = ((comp + junta) / 100) * ((alt + junta) / 100);
      // 7% perda para tijolos conforme instrução da planilha
      const qtdTijolos = (area / Math.max(areaUnitComJunta, 0.0001)) * 1.07;

      const areaUnitSemJunta = (comp / 100) * (alt / 100);
      const fracaoJunta =
        1 - Math.min(areaUnitSemJunta / Math.max(areaUnitComJunta, 0.0001), 1);
      const volArgamassa = area * (larg / 100) * fracaoJunta;

      const arg = calcArgamassaPorVolume(
        volArgamassa,
        entry.propCimento,
        entry.propCal,
        entry.propAreia
      );
      m.cimentoSacos50kg = arg.cimentoSacos;
      m.calSacos20kg = arg.calSacos;
      m.areiaM3 = arg.areiaM3;
      m.areiaSacos20kg = arg.areiaM3 * SACOS_20KG_POR_M3;
      if (entry.calculatorType === 'alvenaria_furado') {
        m.tijolosFuradoUnid = qtdTijolos;
      } else {
        m.tijolosMacicoUnid = qtdTijolos;
      }
      quantidadeLabor = area;
      unidadeLabor = 'm²';
      break;
    }

    case 'contrapiso': {
      const vol = Math.max(entry.areaM2, 0) * (Math.max(entry.espessuraCm, 0) / 100);
      const arg = calcArgamassaPorVolume(vol, entry.propCimento, 0, entry.propAreia);
      m.cimentoSacos50kg = arg.cimentoSacos;
      m.areiaM3 = arg.areiaM3;
      m.areiaSacos20kg = arg.areiaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = entry.areaM2;
      unidadeLabor = 'm²';
      break;
    }

    case 'emboco': {
      const vol = Math.max(entry.areaM2, 0) * (Math.max(entry.espessuraCm, 0) / 100);
      const arg = calcArgamassaPorVolume(
        vol,
        entry.propCimento,
        entry.propCal,
        entry.propAreia
      );
      m.cimentoSacos50kg = arg.cimentoSacos;
      m.calSacos20kg = arg.calSacos;
      m.areiaM3 = arg.areiaM3;
      m.areiaSacos20kg = arg.areiaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = entry.areaM2;
      unidadeLabor = 'm²';
      break;
    }

    case 'chapisco': {
      const vol = Math.max(entry.areaM2, 0) * (Math.max(entry.espessuraMm, 0) / 1000);
      const arg = calcArgamassaPorVolume(vol, entry.propCimento, 0, entry.propAreia);
      m.cimentoSacos50kg = arg.cimentoSacos;
      m.areiaM3 = arg.areiaM3;
      m.areiaSacos20kg = arg.areiaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = entry.areaM2;
      unidadeLabor = 'm²';
      break;
    }

    case 'piso_concreto': {
      const vol = Math.max(entry.areaM2, 0) * (Math.max(entry.espessuraCm, 0) / 100);
      const conc = calcConcretoPorVolume(
        vol,
        entry.propCimento,
        entry.propAreia,
        entry.propBrita
      );
      m.cimentoSacos50kg = conc.cimentoSacos;
      m.areiaM3 = conc.areiaM3;
      m.areiaSacos20kg = conc.areiaM3 * SACOS_20KG_POR_M3;
      m.britaM3 = conc.britaM3;
      m.britaSacos20kg = conc.britaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = entry.areaM2;
      unidadeLabor = 'm²';
      break;
    }

    case 'pilar_embutido':
    case 'pilar_isolado': {
      const vol =
        (Math.max(entry.larguraCm, 0) / 100) *
        (Math.max(entry.comprimentoCm, 0) / 100) *
        Math.max(entry.alturaM, 0) *
        Math.max(entry.quantidadeUnid, 0);
      // Pilar embutido em parede de tijolo furado considera +20% de concreto
      const fatorExtra = entry.calculatorType === 'pilar_embutido' ? 1.2 : 1.0;
      const conc = calcConcretoPorVolume(
        vol,
        entry.propCimento,
        entry.propAreia,
        entry.propBrita,
        fatorExtra
      );
      m.cimentoSacos50kg = conc.cimentoSacos;
      m.areiaM3 = conc.areiaM3;
      m.areiaSacos20kg = conc.areiaM3 * SACOS_20KG_POR_M3;
      m.britaM3 = conc.britaM3;
      m.britaSacos20kg = conc.britaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = vol;
      unidadeLabor = 'm³';
      break;
    }

    case 'vigas': {
      const vol =
        (Math.max(entry.larguraCm, 0) / 100) *
        (Math.max(entry.alturaCm, 0) / 100) *
        Math.max(entry.comprimentoM, 0);
      const conc = calcConcretoPorVolume(
        vol,
        entry.propCimento,
        entry.propAreia,
        entry.propBrita
      );
      m.cimentoSacos50kg = conc.cimentoSacos;
      m.areiaM3 = conc.areiaM3;
      m.areiaSacos20kg = conc.areiaM3 * SACOS_20KG_POR_M3;
      m.britaM3 = conc.britaM3;
      m.britaSacos20kg = conc.britaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = vol;
      unidadeLabor = 'm³';
      break;
    }

    case 'laje': {
      const vol = Math.max(entry.areaM2, 0) * (Math.max(entry.espessuraCm, 0) / 100);
      const conc = calcConcretoPorVolume(
        vol,
        entry.propCimento,
        entry.propAreia,
        entry.propBrita
      );
      m.cimentoSacos50kg = conc.cimentoSacos;
      m.areiaM3 = conc.areiaM3;
      m.areiaSacos20kg = conc.areiaM3 * SACOS_20KG_POR_M3;
      m.britaM3 = conc.britaM3;
      m.britaSacos20kg = conc.britaM3 * SACOS_20KG_POR_M3;
      quantidadeLabor = entry.areaM2;
      unidadeLabor = 'm²';
      break;
    }

    case 'ceramica': {
      const area = Math.max(entry.areaM2, 0);
      const compCm = Math.max(entry.comprimentoCm, 1);
      const largCm = Math.max(entry.larguraCm, 1);
      const espMm = Math.max(entry.espessuraMm, 1);
      const juntaMm = Math.max(entry.juntaMm, 0);

      // Consumo prático de argamassa colante: 4.5 kg/m² (pequenas) a 5.5 kg/m² (dupla colagem >= 30x30cm) + 5% perda
      const consumoArgKgM2 = compCm * largCm >= 900 ? 5.5 : 4.5;
      m.argamassaSacos20kg = (area * consumoArgKgM2 * 1.05) / 20;

      // Fórmula geométrica de rejunte (mm -> kg/m² com densidade 1.65 g/cm³) + 5% perda
      const compMm = compCm * 10;
      const largMm = largCm * 10;
      const rejunteKgM2 =
        ((compMm + largMm) / (compMm * largMm)) * espMm * juntaMm * 1.65;
      m.rejunteKg = area * rejunteKgM2 * 1.05;

      quantidadeLabor = area;
      unidadeLabor = 'm²';
      break;
    }
  }

  return { materials: m, quantidadeLabor, unidadeLabor };
}

export function calcMaterialsCost(
  m: MaterialsBreakdown,
  prices: MaterialUnitPrices
): number {
  return (
    m.cimentoSacos50kg * prices.cimento50kg +
    m.calSacos20kg * prices.cal20kg +
    m.areiaM3 * prices.areiaM3 +
    m.britaM3 * prices.britaM3 +
    m.tijolosFuradoUnid * prices.tijoloFuradoUnid +
    m.tijolosMacicoUnid * prices.tijoloMacicoUnid +
    m.argamassaSacos20kg * prices.argamassa20kg +
    m.rejunteKg * prices.rejunteKg
  );
}

export function calcEntryComputed(
  entry: ServiceEntry,
  laborConfig: LaborConfig,
  laborServices: LaborServiceRate[],
  prices: MaterialUnitPrices
): EntryComputed {
  const { materials, quantidadeLabor, unidadeLabor } = calcMaterialsForEntry(entry);
  const service =
    laborServices.find((s) => s.id === entry.laborServiceId) ?? laborServices[0];
  const { custoComEncargosUnit } = calcLaborUnitCost(service, laborConfig);

  const prod = Math.max(service.produtividadeDia, 0.01);
  const masonDays = quantidadeLabor / prod;
  const helperDays = laborConfig.incluirServente
    ? (quantidadeLabor * service.coefServente) / prod
    : 0;
  const laborCost = quantidadeLabor * custoComEncargosUnit;
  const materialCost = calcMaterialsCost(materials, prices);

  return {
    entryId: entry.id,
    quantidadeBase: quantidadeLabor,
    unidadeBase: unidadeLabor,
    laborUnitCost: custoComEncargosUnit,
    laborCost,
    masonDays,
    helperDays,
    materialCost,
    totalCost: laborCost + materialCost,
    materials,
  };
}

export interface ProjectSummary {
  entriesComputed: Record<string, EntryComputed>;
  consolidatedMaterials: MaterialsBreakdown;
  totalMasonDays: number;
  totalHelperDays: number;
  totalAutoLabor: number;
  totalAutoMaterial: number;
  pciComputed: PciComputedItem[];
  custoDireto: number;
  valorBdi: number;
  totalServicosAdicionais: number;
  custoTotalObra: number;
  custoTotalTerrenoEdificacao: number;
  valorPorM2: number;
  pciConformCount: number;
  pciOutOfRangeCount: number;
}

export function calcProjectSummary(project: ConstructionProject): ProjectSummary {
  const entriesComputed: Record<string, EntryComputed> = {};
  const consolidatedMaterials: MaterialsBreakdown = { ...EMPTY_MATERIALS };
  let totalMasonDays = 0;
  let totalHelperDays = 0;
  let totalAutoLabor = 0;
  let totalAutoMaterial = 0;

  const autoByPci: Record<number, { labor: number; mat: number }> = {};

  for (const entry of project.entries) {
    const comp = calcEntryComputed(
      entry,
      project.laborConfig,
      project.laborServices,
      project.materialPrices
    );
    entriesComputed[entry.id] = comp;

    totalMasonDays += comp.masonDays;
    totalHelperDays += comp.helperDays;
    totalAutoLabor += comp.laborCost;
    totalAutoMaterial += comp.materialCost;

    consolidatedMaterials.cimentoSacos50kg += comp.materials.cimentoSacos50kg;
    consolidatedMaterials.calSacos20kg += comp.materials.calSacos20kg;
    consolidatedMaterials.areiaM3 += comp.materials.areiaM3;
    consolidatedMaterials.areiaSacos20kg += comp.materials.areiaSacos20kg;
    consolidatedMaterials.britaM3 += comp.materials.britaM3;
    consolidatedMaterials.britaSacos20kg += comp.materials.britaSacos20kg;
    consolidatedMaterials.tijolosFuradoUnid += comp.materials.tijolosFuradoUnid;
    consolidatedMaterials.tijolosMacicoUnid += comp.materials.tijolosMacicoUnid;
    consolidatedMaterials.argamassaSacos20kg += comp.materials.argamassaSacos20kg;
    consolidatedMaterials.rejunteKg += comp.materials.rejunteKg;

    if (!autoByPci[entry.pciItemId]) {
      autoByPci[entry.pciItemId] = { labor: 0, mat: 0 };
    }
    autoByPci[entry.pciItemId].labor += comp.laborCost;
    autoByPci[entry.pciItemId].mat += comp.materialCost;
  }

  const totalServicosAdicionais = project.servicosAdicionais.reduce(
    (acc, s) => acc + Math.max(s.custo, 0),
    0
  );

  // Soma do item 20 inclui serviços adicionais caso usuário lance lá
  const preItems = project.pciItems.map((item) => {
    const auto = autoByPci[item.id] ?? { labor: 0, mat: 0 };
    const extraOutros = item.id === 20 ? totalServicosAdicionais : 0;
    const totalLaborCost = auto.labor + Math.max(item.manualLaborCost, 0);
    const totalMaterialCost =
      auto.mat + Math.max(item.manualMaterialCost, 0) + extraOutros;
    const totalCost = totalLaborCost + totalMaterialCost;
    return {
      ...item,
      autoLaborCost: auto.labor,
      autoMaterialCost: auto.mat,
      totalLaborCost,
      totalMaterialCost,
      totalCost,
    };
  });

  const custoDireto = preItems.reduce((acc, i) => acc + i.totalCost, 0);
  const bdiPct = Math.max(project.laborConfig.bdiPercent, 0);
  const valorBdi = custoDireto * (bdiPct / 100);
  const custoTotalObra = custoDireto + valorBdi;

  let cumulativePercent = 0;
  let pciConformCount = 0;
  let pciOutOfRangeCount = 0;

  const pciComputed: PciComputedItem[] = preItems.map((item) => {
    const incidencePercent =
      custoDireto > 0 ? (item.totalCost / custoDireto) * 100 : 0;
    cumulativePercent += incidencePercent;

    let status: 'ok' | 'below' | 'above' = 'ok';
    if (custoDireto > 0) {
      if (incidencePercent < item.minIncidence - 0.005) {
        status = 'below';
        pciOutOfRangeCount++;
      } else if (incidencePercent > item.maxIncidence + 0.005) {
        status = 'above';
        pciOutOfRangeCount++;
      } else {
        pciConformCount++;
      }
    }

    return {
      ...item,
      incidencePercent,
      cumulativePercent,
      status,
    };
  });

  const area = Math.max(project.metadata.areaConstruidaTotal, 0);
  const valorPorM2 = area > 0 ? custoTotalObra / area : 0;
  const custoTotalTerrenoEdificacao =
    custoTotalObra + Math.max(project.metadata.valorTerreno, 0);

  return {
    entriesComputed,
    consolidatedMaterials,
    totalMasonDays,
    totalHelperDays,
    totalAutoLabor,
    totalAutoMaterial,
    pciComputed,
    custoDireto,
    valorBdi,
    totalServicosAdicionais,
    custoTotalObra,
    custoTotalTerrenoEdificacao,
    valorPorM2,
    pciConformCount,
    pciOutOfRangeCount,
  };
}

// Distribuição automática em curva S realista dos 20 itens PCI ao longo de N meses + Pré-Execução
export function generateAutoSchedule(
  pciComputed: PciComputedItem[],
  prazoMeses: number
): ScheduleStage[] {
  const meses = Math.min(Math.max(Math.round(prazoMeses), 1), 24);
  // Posição relativa (0 = início, 1 = fim) onde cada item PCI se concentra
  const stageTiming: Record<number, { start: number; end: number }> = {
    1: { start: 0.0, end: 0.12 }, // Barracão / projetos (Pré-Execução + início)
    2: { start: 0.05, end: 0.25 }, // Infraestrutura
    3: { start: 0.15, end: 0.45 }, // Supraestrutura
    4: { start: 0.25, end: 0.55 }, // Paredes
    5: { start: 0.55, end: 0.85 }, // Esquadrias
    6: { start: 0.75, end: 0.95 }, // Vidros
    7: { start: 0.38, end: 0.62 }, // Coberturas
    8: { start: 0.2, end: 0.65 }, // Impermeabilizações
    9: { start: 0.45, end: 0.72 }, // Revestimentos Internos
    10: { start: 0.6, end: 0.82 }, // Forros
    11: { start: 0.5, end: 0.78 }, // Revestimentos Externos
    12: { start: 0.62, end: 0.88 }, // Pisos
    13: { start: 0.78, end: 0.98 }, // Pinturas
    14: { start: 0.72, end: 0.92 }, // Acabamentos
    15: { start: 0.4, end: 0.88 }, // Elétrica
    16: { start: 0.35, end: 0.85 }, // Hidráulica
    17: { start: 0.25, end: 0.75 }, // Esgoto
    18: { start: 0.82, end: 0.98 }, // Louças e Metais
    19: { start: 0.9, end: 1.0 }, // Complementos
    20: { start: 0.3, end: 0.8 }, // Outros
  };

  const monthBuckets = new Array(meses + 1).fill(0); // index 0 = PréExc., 1..meses = meses

  const totalCost = pciComputed.reduce((a, b) => a + b.totalCost, 0);

  if (totalCost <= 0) {
    // Curva S padrão se orçamento estiver zerado
    const pre = 3.0;
    const rem = 100 - pre;
    const weights = Array.from({ length: meses }, (_, i) => {
      const t = (i + 0.5) / meses;
      return Math.sin(Math.PI * t) + 0.35;
    });
    const sumW = weights.reduce((a, b) => a + b, 0);
    return [
      { etapa: 'PréExc.', percentEtapa: pre },
      ...weights.map((w, i) => ({
        etapa: String(i + 1),
        percentEtapa: Number(((w / sumW) * rem).toFixed(2)),
      })),
    ];
  }

  for (const item of pciComputed) {
    if (item.totalCost <= 0) continue;
    const timing = stageTiming[item.id] ?? { start: 0.2, end: 0.8 };
    if (item.id === 1) {
      // 65% do item 1 vai para Pré-Execução
      monthBuckets[0] += item.totalCost * 0.65;
      monthBuckets[1] += item.totalCost * 0.35;
      continue;
    }

    const weights = Array.from({ length: meses }, (_, idx) => {
      const mStart = idx / meses;
      const mEnd = (idx + 1) / meses;
      const overlap = Math.max(
        0,
        Math.min(mEnd, timing.end) - Math.max(mStart, timing.start)
      );
      return overlap;
    });
    const sumW = weights.reduce((a, b) => a + b, 0);
    if (sumW > 0) {
      weights.forEach((w, idx) => {
        monthBuckets[idx + 1] += item.totalCost * (w / sumW);
      });
    } else {
      const midIdx = Math.min(
        meses,
        Math.max(1, Math.round(((timing.start + timing.end) / 2) * meses))
      );
      monthBuckets[midIdx] += item.totalCost;
    }
  }

  const rawPercents = monthBuckets.map((val) =>
    Number(((val / totalCost) * 100).toFixed(2))
  );
  // Ajusta arredondamento para fechar exatamente em 100.00%
  const sum = rawPercents.reduce((a, b) => a + b, 0);
  const diff = Number((100 - sum).toFixed(2));
  if (Math.abs(diff) > 0 && rawPercents.length > 1) {
    // Ajusta no mês de maior peso
    let maxIdx = 1;
    for (let i = 1; i < rawPercents.length; i++) {
      if (rawPercents[i] > rawPercents[maxIdx]) maxIdx = i;
    }
    rawPercents[maxIdx] = Number((rawPercents[maxIdx] + diff).toFixed(2));
  }

  return rawPercents.map((pct, idx) => ({
    etapa: idx === 0 ? 'PréExc.' : String(idx),
    percentEtapa: pct,
  }));
}

// Estimativa paramétrica inteligente baseada na área construída (m²) e padrão para preencher custos diretos restantes da PCI
export function applyParametricEstimateToPci(
  project: ConstructionProject,
  summary: ProjectSummary
): PciItemConfig[] {
  const area = Math.max(project.metadata.areaConstruidaTotal, 30);
  const custoM2Base: Record<ProjectMetadata['padraoAcabamento'], number> = {
    Mínimo: 1790,
    Baixo: 2090,
    Normal: 2350,
    Alto: 3100,
  };
  const bdiFactor = 1 + Math.max(project.laborConfig.bdiPercent, 0) / 100;
  const targetDireto = (area * custoM2Base[project.metadata.padraoAcabamento]) / bdiFactor;

  return project.pciItems.map((item) => {
    const computed = summary.pciComputed.find((c) => c.id === item.id);
    const autoLabor = computed?.autoLaborCost ?? 0;
    const autoMat = computed?.autoMaterialCost ?? 0;
    const autoTotal = autoLabor + autoMat;

    if (item.id === 20) {
      return { ...item, manualLaborCost: 0, manualMaterialCost: 0 };
    }

    // Ponto médio da faixa CAIXA como alvo paramétrico
    const midInc = (item.minIncidence + item.maxIncidence) / 2;
    const targetItemTotal = targetDireto * (midInc / 100);
    const remaining = Math.max(targetItemTotal - autoTotal, 0);

    // Razão típica mão de obra / material por etapa
    const laborShare = [1, 2, 3, 4, 9, 10, 11, 13, 19].includes(item.id)
      ? 0.45
      : [5, 6, 18].includes(item.id)
      ? 0.22
      : 0.35;

    return {
      ...item,
      manualLaborCost: Math.round(remaining * laborShare),
      manualMaterialCost: Math.round(remaining * (1 - laborShare)),
    };
  });
}
