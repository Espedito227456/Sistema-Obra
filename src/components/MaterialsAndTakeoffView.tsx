import React, { useMemo, useState } from 'react';
import { BookOpen, Calculator, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  CalculatorType,
  ConstructionProject,
  ServiceEntry,
} from '../types/construction';
import {
  PCI_REFERENCE_ITEMS,
  TRACOS_ARGAMASSA,
  TRACOS_CONCRETO,
} from '../data/presets';
import {
  calcEntryComputed,
  formatBRL,
  formatNum,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  onAddEntry: (entry: ServiceEntry) => void;
  onUpdateEntry: (id: string, patch: Partial<ServiceEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

interface CalcPresetMeta {
  type: CalculatorType;
  label: string;
  shortLabel: string;
  defaultLaborId: string;
  defaultPciId: number;
  note: string;
  template: Omit<ServiceEntry, 'id'>;
}

const CALCULATOR_PRESETS: CalcPresetMeta[] = [
  {
    type: 'alvenaria_furado',
    label: 'Assentamento de Tijolo Furado',
    shortLabel: 'Tijolo Furado',
    defaultLaborId: 'alvenaria_9',
    defaultPciId: 4,
    note: 'Inclui 7% de perda para tijolos e 5% para argamassa. Desconte vãos de portas e janelas da área.',
    template: {
      descricao: 'Alvenaria de tijolo furado (9x19x19 cm)',
      calculatorType: 'alvenaria_furado',
      laborServiceId: 'alvenaria_9',
      pciItemId: 4,
      propCimento: 1,
      propCal: 2,
      propAreia: 9,
      propBrita: 0,
      areaM2: 60,
      larguraCm: 9,
      alturaCm: 19,
      comprimentoCm: 19,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 1.5,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'alvenaria_macico',
    label: 'Alvenaria de Tijolo Maciço',
    shortLabel: 'Tijolo Maciço',
    defaultLaborId: 'alvenaria_macico',
    defaultPciId: 4,
    note: 'Inclui 7% de perda para tijolos maciços e 5% para argamassa.',
    template: {
      descricao: 'Alvenaria de tijolo maciço à vista (9 cm)',
      calculatorType: 'alvenaria_macico',
      laborServiceId: 'alvenaria_macico',
      pciItemId: 4,
      propCimento: 1,
      propCal: 1,
      propAreia: 6,
      propBrita: 0,
      areaM2: 35,
      larguraCm: 9,
      alturaCm: 5.5,
      comprimentoCm: 19,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 1.2,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'chapisco',
    label: 'Chapisco (Cimento e Areia)',
    shortLabel: 'Chapisco',
    defaultLaborId: 'chapisco',
    defaultPciId: 9,
    note: 'Espessura de 3 mm para chapisco fino ou 5 mm para chapisco grosso. Inclui 5% de perda.',
    template: {
      descricao: 'Chapisco em parede (traço 1:4, espessura 4 mm)',
      calculatorType: 'chapisco',
      laborServiceId: 'chapisco',
      pciItemId: 9,
      propCimento: 1,
      propCal: 0,
      propAreia: 4,
      propBrita: 0,
      areaM2: 120,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 4,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'emboco',
    label: 'Emboço / Reboco',
    shortLabel: 'Emboço/Reboco',
    defaultLaborId: 'emboco_interno',
    defaultPciId: 9,
    note: 'Espessura usual entre 1,5 cm e 2,5 cm (mais frequente 2,0 cm). Descontar portas e janelas.',
    template: {
      descricao: 'Emboço interno em paredes (espessura 2,0 cm)',
      calculatorType: 'emboco',
      laborServiceId: 'emboco_interno',
      pciItemId: 9,
      propCimento: 1,
      propCal: 2,
      propAreia: 9,
      propBrita: 0,
      areaM2: 120,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 2,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'contrapiso',
    label: 'Contrapiso de Cimento e Areia',
    shortLabel: 'Contrapiso',
    defaultLaborId: 'contrapiso',
    defaultPciId: 12,
    note: 'Espessura varia entre 2 e 7 cm (geralmente 3 cm). Inclui 5% de perda de material.',
    template: {
      descricao: 'Contrapiso de cimento e areia (3 cm)',
      calculatorType: 'contrapiso',
      laborServiceId: 'contrapiso',
      pciItemId: 12,
      propCimento: 1,
      propCal: 0,
      propAreia: 5,
      propBrita: 0,
      areaM2: 80,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 3,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'piso_concreto',
    label: 'Piso de Concreto',
    shortLabel: 'Piso Concreto',
    defaultLaborId: 'piso_concreto',
    defaultPciId: 12,
    note: 'Espessura varia entre 6 e 12 cm (padrão comum 7 cm). Inclui 5% de perda.',
    template: {
      descricao: 'Piso de concreto armado/sarrafeado (7 cm)',
      calculatorType: 'piso_concreto',
      laborServiceId: 'piso_concreto',
      pciItemId: 12,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3.5,
      areaM2: 50,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 7,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'pilar_embutido',
    label: 'Pilar Embutido (Tijolo Furado)',
    shortLabel: 'Pilar Embutido',
    defaultLaborId: 'pilares_concreto',
    defaultPciId: 3,
    note: 'Considera acréscimo automático de 20% no concreto para preenchimento dos furos dos tijolos + 5% de perda.',
    template: {
      descricao: 'Pilares embutidos em parede de tijolo furado',
      calculatorType: 'pilar_embutido',
      laborServiceId: 'pilares_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 0,
      larguraCm: 14,
      alturaCm: 0,
      comprimentoCm: 25,
      alturaM: 3,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 10,
    },
  },
  {
    type: 'pilar_isolado',
    label: 'Pilar Isolado ou Bloco/Maciço',
    shortLabel: 'Pilar Isolado',
    defaultLaborId: 'pilares_concreto',
    defaultPciId: 3,
    note: 'Sem acréscimo de furos (apenas 5% de perda padrão do concreto).',
    template: {
      descricao: 'Pilares isolados em concreto armado',
      calculatorType: 'pilar_isolado',
      laborServiceId: 'pilares_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2,
      propBrita: 3,
      areaM2: 0,
      larguraCm: 20,
      alturaCm: 0,
      comprimentoCm: 30,
      alturaM: 3,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 6,
    },
  },
  {
    type: 'vigas',
    label: 'Vigas e Cintas',
    shortLabel: 'Vigas',
    defaultLaborId: 'vigas_concreto',
    defaultPciId: 3,
    note: 'Informe largura e altura em centímetros e o comprimento total em metros lineares.',
    template: {
      descricao: 'Vigas superiores e baldrames',
      calculatorType: 'vigas',
      laborServiceId: 'vigas_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 0,
      larguraCm: 14,
      alturaCm: 30,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 60,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'laje',
    label: 'Laje de Concreto',
    shortLabel: 'Laje',
    defaultLaborId: 'laje_concreto',
    defaultPciId: 3,
    note: 'Consulte o fornecedor da laje pré-moldada para confirmar a espessura da capa de concreto (geralmente 4–5 cm).',
    template: {
      descricao: 'Capa de concreto para laje',
      calculatorType: 'laje',
      laborServiceId: 'laje_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 85,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 5,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    type: 'ceramica',
    label: 'Cerâmica (Argamassa e Rejunte)',
    shortLabel: 'Cerâmica',
    defaultLaborId: 'ceramica_grande',
    defaultPciId: 12,
    note: 'Espessura padrão da peça: 8 mm; junta usual entre 3 e 5 mm. Calcula argamassa colante (20 kg) e rejunte (kg).',
    template: {
      descricao: 'Assentamento de revestimento cerâmico',
      calculatorType: 'ceramica',
      laborServiceId: 'ceramica_grande',
      pciItemId: 12,
      propCimento: 0,
      propCal: 0,
      propAreia: 0,
      propBrita: 0,
      areaM2: 65,
      larguraCm: 60,
      alturaCm: 0,
      comprimentoCm: 60,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 8,
      juntaCm: 0,
      juntaMm: 4,
      quantidadeUnid: 0,
    },
  },
];

export const MaterialsAndTakeoffView: React.FC<Props> = ({
  project,
  summary,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [selectedType, setSelectedType] =
    useState<CalculatorType>('alvenaria_furado');
  const [draft, setDraft] = useState<Omit<ServiceEntry, 'id'>>(
    CALCULATOR_PRESETS[0].template
  );
  const [showTracos, setShowTracos] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [pciFilter, setPciFilter] = useState<number | 'all'>('all');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);

  const activeMeta =
    CALCULATOR_PRESETS.find((p) => p.type === selectedType) ??
    CALCULATOR_PRESETS[0];

  const handleSelectCalc = (type: CalculatorType) => {
    setEditingEntryId(null);
    setSelectedType(type);
    const meta = CALCULATOR_PRESETS.find((p) => p.type === type);
    if (meta) {
      setDraft({ ...meta.template });
    }
  };

  const handleStartEditEntry = (entry: ServiceEntry) => {
    const { id, ...rest } = entry;
    setEditingEntryId(id);
    setConfirmDeleteEntryId(null);
    setSelectedType(entry.calculatorType);
    setDraft({ ...rest });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditEntry = () => {
    setEditingEntryId(null);
    const meta = CALCULATOR_PRESETS.find((p) => p.type === selectedType);
    if (meta) {
      setDraft({ ...meta.template });
    }
  };

  const draftPreview = useMemo(() => {
    const tempEntry: ServiceEntry = { id: 'preview', ...draft };
    return calcEntryComputed(
      tempEntry,
      project.laborConfig,
      project.laborServices,
      project.materialPrices
    );
  }, [
    draft,
    project.laborConfig,
    project.laborServices,
    project.materialPrices,
  ]);

  const handleAddDraftToProject = () => {
    if (editingEntryId) {
      onUpdateEntry(editingEntryId, { ...draft });
      setEditingEntryId(null);
      return;
    }
    const newEntry: ServiceEntry = {
      ...draft,
      id: `srv-${Date.now()}`,
    };
    onAddEntry(newEntry);
  };

  const filteredEntries = useMemo(() => {
    return project.entries.filter((e) => {
      const matchesPci = pciFilter === 'all' || e.pciItemId === pciFilter;
      const matchesSearch =
        !searchFilter.trim() ||
        e.descricao.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesPci && matchesSearch;
    });
  }, [project.entries, pciFilter, searchFilter]);

  const isConcrete = [
    'piso_concreto',
    'pilar_embutido',
    'pilar_isolado',
    'vigas',
    'laje',
  ].includes(selectedType);
  const usesCal = ['alvenaria_furado', 'alvenaria_macico', 'emboco'].includes(
    selectedType
  );
  const isMasonry = ['alvenaria_furado', 'alvenaria_macico'].includes(
    selectedType
  );
  const isPillar = ['pilar_embutido', 'pilar_isolado'].includes(selectedType);

  const renderField = (
    label: string,
    unit: string,
    value: number,
    onChange: (v: number) => void,
    step = '0.5'
  ) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label} {unit ? <span className="text-slate-400">({unit})</span> : null}
      </label>
      <input
        type="number"
        step={step}
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          onChange(Number.isFinite(parsed) ? Math.max(parsed, 0) : 0);
        }}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Estúdio Integrado: Calculadora de Materiais + Mão de Obra */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Calculator className="h-4 w-4 text-blue-700" />
              Calculadora Integrada (Materiais + Mão de Obra → PCI)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Selecione o módulo da Calculadora de Materiais, ajuste o traço e
              as dimensões e adicione o serviço diretamente ao orçamento PCI.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTracos((v) => !v)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-700" />
            {showTracos
              ? 'Ocultar Tabela de Traços'
              : 'Tabela Prática de Traços'}
          </button>
        </div>

        {/* Drawer / Tabela de Traços de Referência */}
        {showTracos && (
          <div className="border-b border-slate-200 bg-slate-50 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Tabelas de Proporções para Argamassa e Concreto (clique para
                aplicar no cálculo atual)
              </h3>
              <button
                type="button"
                onClick={() => setShowTracos(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800">
                  Traços para Concreto (Cimento : Areia : Brita)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {TRACOS_CONCRETO.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-4 py-2"
                    >
                      <span className="text-slate-700">{t.aplicacao}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            propCimento: t.cimento,
                            propAreia: t.areia,
                            propBrita: t.brita,
                          }))
                        }
                        className="whitespace-nowrap shrink-0 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono font-medium text-blue-700 hover:bg-blue-50"
                      >
                        {t.cimento} : {t.areia} : {t.brita}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800">
                  Traços para Argamassa (Cimento : Cal : Areia)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {TRACOS_ARGAMASSA.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-4 py-2"
                    >
                      <span className="text-slate-700">{t.aplicacao}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            propCimento: t.cimento,
                            propCal: t.cal,
                            propAreia: t.areia,
                          }))
                        }
                        className="whitespace-nowrap shrink-0 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono font-medium text-blue-700 hover:bg-blue-50"
                      >
                        {t.nota}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seletor dos 11 Módulos */}
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-3">
          <div className="flex flex-wrap gap-1.5">
            {CALCULATOR_PRESETS.map((preset) => (
              <button
                key={preset.type}
                type="button"
                onClick={() => handleSelectCalc(preset.type)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === preset.type
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Corpo da Calculadora */}
        <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Inputs (7 cols) */}
          <div className="p-6 lg:col-span-7">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {activeMeta.label}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{activeMeta.note}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Descrição do Serviço no Orçamento
                </label>
                <input
                  type="text"
                  value={draft.descricao}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, descricao: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>

              {/* Proporções (Traço) - exceto cerâmica */}
              {selectedType !== 'ceramica' && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Proporção do Traço em Volume
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {renderField(
                      'Proporção Cimento',
                      'parte',
                      draft.propCimento,
                      (v) => setDraft((d) => ({ ...d, propCimento: v })),
                      '0.5'
                    )}
                    {usesCal &&
                      renderField(
                        'Proporção Cal',
                        '0 s/ cal',
                        draft.propCal,
                        (v) => setDraft((d) => ({ ...d, propCal: v })),
                        '0.5'
                      )}
                    {renderField(
                      'Proporção Areia',
                      'parte',
                      draft.propAreia,
                      (v) => setDraft((d) => ({ ...d, propAreia: v })),
                      '0.5'
                    )}
                    {isConcrete &&
                      renderField(
                        'Proporção Brita',
                        'parte',
                        draft.propBrita,
                        (v) => setDraft((d) => ({ ...d, propBrita: v })),
                        '0.5'
                      )}
                  </div>
                </div>
              )}

              {/* Dimensões específicas por módulo */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  Dimensões e Quantidade
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {isMasonry && (
                    <>
                      {renderField(
                        'Largura da Junta',
                        'cm',
                        draft.juntaCm,
                        (v) => setDraft((d) => ({ ...d, juntaCm: v })),
                        '0.1'
                      )}
                      {renderField(
                        'Largura Tijolo',
                        'cm',
                        draft.larguraCm,
                        (v) => setDraft((d) => ({ ...d, larguraCm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Altura Tijolo',
                        'cm',
                        draft.alturaCm,
                        (v) => setDraft((d) => ({ ...d, alturaCm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Comprimento Tijolo',
                        'cm',
                        draft.comprimentoCm,
                        (v) => setDraft((d) => ({ ...d, comprimentoCm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Área da Parede',
                        'm²',
                        draft.areaM2,
                        (v) => setDraft((d) => ({ ...d, areaM2: v })),
                        '1'
                      )}
                    </>
                  )}

                  {(selectedType === 'contrapiso' ||
                    selectedType === 'emboco' ||
                    selectedType === 'piso_concreto' ||
                    selectedType === 'laje') && (
                    <>
                      {renderField(
                        selectedType === 'laje'
                          ? 'Espessura da Capa'
                          : 'Espessura',
                        'cm',
                        draft.espessuraCm,
                        (v) => setDraft((d) => ({ ...d, espessuraCm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Área Total',
                        'm²',
                        draft.areaM2,
                        (v) => setDraft((d) => ({ ...d, areaM2: v })),
                        '1'
                      )}
                    </>
                  )}

                  {selectedType === 'chapisco' && (
                    <>
                      {renderField(
                        'Espessura do Chapisco',
                        'mm',
                        draft.espessuraMm,
                        (v) => setDraft((d) => ({ ...d, espessuraMm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Área do Chapisco',
                        'm²',
                        draft.areaM2,
                        (v) => setDraft((d) => ({ ...d, areaM2: v })),
                        '1'
                      )}
                    </>
                  )}

                  {isPillar && (
                    <>
                      {renderField(
                        'Largura Pilar',
                        'cm',
                        draft.larguraCm,
                        (v) => setDraft((d) => ({ ...d, larguraCm: v })),
                        '1'
                      )}
                      {renderField(
                        'Comprimento Pilar',
                        'cm',
                        draft.comprimentoCm,
                        (v) => setDraft((d) => ({ ...d, comprimentoCm: v })),
                        '1'
                      )}
                      {renderField(
                        'Altura Pilar',
                        'm',
                        draft.alturaM,
                        (v) => setDraft((d) => ({ ...d, alturaM: v })),
                        '0.1'
                      )}
                      {renderField(
                        'Quantidade de Pilares',
                        'unid',
                        draft.quantidadeUnid,
                        (v) => setDraft((d) => ({ ...d, quantidadeUnid: v })),
                        '1'
                      )}
                    </>
                  )}

                  {selectedType === 'vigas' && (
                    <>
                      {renderField(
                        'Largura Viga',
                        'cm',
                        draft.larguraCm,
                        (v) => setDraft((d) => ({ ...d, larguraCm: v })),
                        '1'
                      )}
                      {renderField(
                        'Altura Viga',
                        'cm',
                        draft.alturaCm,
                        (v) => setDraft((d) => ({ ...d, alturaCm: v })),
                        '1'
                      )}
                      {renderField(
                        'Comprimento Total Vigas',
                        'm',
                        draft.comprimentoM,
                        (v) => setDraft((d) => ({ ...d, comprimentoM: v })),
                        '1'
                      )}
                    </>
                  )}

                  {selectedType === 'ceramica' && (
                    <>
                      {renderField(
                        'Comprimento Peça',
                        'cm',
                        draft.comprimentoCm,
                        (v) => setDraft((d) => ({ ...d, comprimentoCm: v })),
                        '1'
                      )}
                      {renderField(
                        'Largura Peça',
                        'cm',
                        draft.larguraCm,
                        (v) => setDraft((d) => ({ ...d, larguraCm: v })),
                        '1'
                      )}
                      {renderField(
                        'Espessura Peça',
                        'mm',
                        draft.espessuraMm,
                        (v) => setDraft((d) => ({ ...d, espessuraMm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Largura da Junta',
                        'mm',
                        draft.juntaMm,
                        (v) => setDraft((d) => ({ ...d, juntaMm: v })),
                        '0.5'
                      )}
                      {renderField(
                        'Área Total Cerâmica',
                        'm²',
                        draft.areaM2,
                        (v) => setDraft((d) => ({ ...d, areaM2: v })),
                        '1'
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Vínculo com Mão de Obra e PCI CAIXA */}
              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Composição de Mão de Obra
                  </label>
                  <select
                    value={draft.laborServiceId}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, laborServiceId: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {project.laborServices.map((ls) => (
                      <option key={ls.id} value={ls.id}>
                        {ls.nome} ({ls.unidade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Vincular ao Item da PCI CAIXA
                  </label>
                  <select
                    value={draft.pciItemId}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        pciItemId: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {PCI_REFERENCE_ITEMS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id}. {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resultado Simultâneo Materiais + Mão de Obra (5 cols) */}
          <div className="flex flex-col justify-between bg-slate-50/70 p-6 lg:col-span-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Resultado Automático Integrado
                </h3>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  Base: {formatNum(draftPreview.quantidadeBase, 2)}{' '}
                  {draftPreview.unidadeBase}
                </span>
              </div>

              {/* Lista de Materiais Calculados */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Quantitativo de Materiais (c/ perdas técnicas)
                </p>
                <div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white text-xs">
                  {draftPreview.materials.cimentoSacos50kg > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">Cimento (saco 50 kg)</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.cimentoSacos50kg, 1)} sc
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.calSacos20kg > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">Cal (saco 20 kg)</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.calSacos20kg, 1)} sc
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.areiaM3 > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">Areia</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.areiaM3, 2)} m³ ·{' '}
                        {formatNum(draftPreview.materials.areiaSacos20kg, 0)} sc
                        20kg
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.britaM3 > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">Brita</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.britaM3, 2)} m³ ·{' '}
                        {formatNum(draftPreview.materials.britaSacos20kg, 0)} sc
                        20kg
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.tijolosFuradoUnid > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">
                        Tijolos Furados (c/ 7% perda)
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.tijolosFuradoUnid, 0)}{' '}
                        unid
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.tijolosMacicoUnid > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">
                        Tijolos Maciços (c/ 7% perda)
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.tijolosMacicoUnid, 0)}{' '}
                        unid
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.argamassaSacos20kg > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">
                        Argamassa Colante (saco 20 kg)
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.argamassaSacos20kg, 1)}{' '}
                        sc
                      </span>
                    </div>
                  )}
                  {draftPreview.materials.rejunteKg > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-slate-700">Rejunte</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatNum(draftPreview.materials.rejunteKg, 1)} kg
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo Financeiro Mão de Obra + Material */}
              <div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white text-xs">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-slate-600">
                    Mão de Obra ({formatBRL(draftPreview.laborUnitCost)}/
                    {draftPreview.unidadeBase})
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatBRL(draftPreview.laborCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-slate-600">
                    Diárias estimadas (Pedreiro / Servente)
                  </span>
                  <span className="font-mono text-slate-700 tabular-nums">
                    {formatNum(draftPreview.masonDays, 1)}d /{' '}
                    {formatNum(draftPreview.helperDays, 1)}d
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-slate-600">Materiais Básicos</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatBRL(draftPreview.materialCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-blue-50/60 px-3.5 py-3">
                  <span className="font-semibold text-slate-900">
                    Total Integrado para PCI (Item {draft.pciItemId})
                  </span>
                  <span className="font-mono text-base font-bold text-blue-700 tabular-nums">
                    {formatBRL(draftPreview.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddDraftToProject}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                {editingEntryId ? (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar Alterações no Serviço
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Adicionar Serviço à Obra & PCI
                  </>
                )}
              </button>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={handleCancelEditEntry}
                  className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabela de Lançamentos da Obra */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Serviços Lançados na Obra ({project.entries.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Edite a área ou comprimento diretamente na tabela para recalcular
              materiais, diárias e incidência na PCI CAIXA em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar serviço..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-48 rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
            <select
              value={pciFilter}
              onChange={(e) =>
                setPciFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
            >
              <option value="all">Todos os itens PCI</option>
              {PCI_REFERENCE_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  Item {item.id}: {item.nome.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhum serviço encontrado com este filtro.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Use a calculadora acima para adicionar serviços de alvenaria,
              estrutura, revestimento ou piso.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Descrição do Serviço</th>
                  <th className="px-3 py-3">Item PCI</th>
                  <th className="px-3 py-3 text-right">Dimensão Editável</th>
                  <th className="px-3 py-3 text-right">Diárias (Ped/Serv)</th>
                  <th className="px-3 py-3 text-right">Mão de Obra</th>
                  <th className="px-3 py-3 text-right">Materiais</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => {
                  const comp = summary.entriesComputed[entry.id];
                  if (!comp) return null;
                  const pci = PCI_REFERENCE_ITEMS.find(
                    (p) => p.id === entry.pciItemId
                  );

                  const isPillarRow =
                    entry.calculatorType === 'pilar_embutido' ||
                    entry.calculatorType === 'pilar_isolado';
                  const isVigaRow = entry.calculatorType === 'vigas';

                  return (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">
                          {entry.descricao}
                        </div>
                        <div className="text-xs text-slate-500">
                          {comp.materials.cimentoSacos50kg > 0 &&
                            `${formatNum(comp.materials.cimentoSacos50kg, 1)} sc cimento`}
                          {comp.materials.areiaM3 > 0 &&
                            ` · ${formatNum(comp.materials.areiaM3, 2)} m³ areia`}
                          {comp.materials.britaM3 > 0 &&
                            ` · ${formatNum(comp.materials.britaM3, 2)} m³ brita`}
                          {comp.materials.tijolosFuradoUnid > 0 &&
                            ` · ${formatNum(comp.materials.tijolosFuradoUnid, 0)} tijolos`}
                          {comp.materials.argamassaSacos20kg > 0 &&
                            `${formatNum(comp.materials.argamassaSacos20kg, 1)} sc argamassa · ${formatNum(comp.materials.rejunteKg, 1)} kg rejunte`}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {pci ? `${pci.id}. ${pci.nome.split('(')[0]}` : `Item ${entry.pciItemId}`}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {isPillarRow ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={entry.quantidadeUnid}
                              onChange={(e) =>
                                onUpdateEntry(entry.id, {
                                  quantidadeUnid: Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  ),
                                })
                              }
                              className="w-16 rounded border border-slate-200 px-2 py-1 text-right font-mono text-xs tabular-nums"
                            />
                            <span className="text-xs text-slate-500">un</span>
                          </div>
                        ) : isVigaRow ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={entry.comprimentoM}
                              onChange={(e) =>
                                onUpdateEntry(entry.id, {
                                  comprimentoM: Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  ),
                                })
                              }
                              className="w-16 rounded border border-slate-200 px-2 py-1 text-right font-mono text-xs tabular-nums"
                            />
                            <span className="text-xs text-slate-500">m</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={entry.areaM2}
                              onChange={(e) =>
                                onUpdateEntry(entry.id, {
                                  areaM2: Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  ),
                                })
                              }
                              className="w-20 rounded border border-slate-200 px-2 py-1 text-right font-mono text-xs tabular-nums"
                            />
                            <span className="text-xs text-slate-500">m²</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-600">
                        {formatNum(comp.masonDays, 1)}d /{' '}
                        {formatNum(comp.helperDays, 1)}d
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-800">
                        {formatBRL(comp.laborCost)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-800">
                        {formatBRL(comp.materialCost)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-blue-700">
                        {formatBRL(comp.totalCost)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {confirmDeleteEntryId === entry.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (editingEntryId === entry.id) {
                                  setEditingEntryId(null);
                                }
                                onDeleteEntry(entry.id);
                                setConfirmDeleteEntryId(null);
                              }}
                              className="whitespace-nowrap rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Excluir
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEntryId(null)}
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditEntry(entry)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                              title="Editar serviço completo"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEntryId(entry.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Excluir serviço"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
