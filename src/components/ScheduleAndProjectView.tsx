import React from 'react';
import { AlertCircle, Calendar, CheckCircle2, Wand2 } from 'lucide-react';
import {
  ConstructionProject,
  ProjectMetadata,
  ScheduleStage,
} from '../types/construction';
import {
  SISTEMAS_CONSTRUTIVOS_CAIXA,
  TIPOLOGIAS_CAIXA,
} from '../data/presets';
import {
  formatBRL,
  formatNum,
  formatPct,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  onChangePrazo: (meses: number) => void;
  onGenerateAutoSchedule: () => void;
  onUpdateScheduleStage: (etapa: string, percentEtapa: number) => void;
  onUpdateMetadata: (patch: Partial<ProjectMetadata>) => void;
}

export const ScheduleAndProjectView: React.FC<Props> = ({
  project,
  summary,
  onChangePrazo,
  onGenerateAutoSchedule,
  onUpdateScheduleStage,
  onUpdateMetadata,
}) => {
  const { schedule, prazoMeses, metadata } = project;

  const isInovador =
    SISTEMAS_CONSTRUTIVOS_CAIXA.find(
      (s) => s.label === metadata.sistemaConstrutivo
    )?.inovador ?? false;

  // Calcula acumulados do cronograma
  let accPct = 0;
  const rows = schedule.map((st: ScheduleStage) => {
    accPct += st.percentEtapa;
    const valorEtapa = summary.custoTotalObra * (st.percentEtapa / 100);
    const valorAcumulado = summary.custoTotalObra * (accPct / 100);
    return {
      ...st,
      percentAcumulado: accPct,
      valorEtapa,
      valorAcumulado,
    };
  });

  const totalPct = accPct;
  const pctOk = Math.abs(totalPct - 100) < 0.05;

  // Dimensões do gráfico Curva S em SVG
  const svgW = 680;
  const svgH = 210;
  const padL = 44;
  const padR = 20;
  const padT = 16;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const maxBar = Math.max(...rows.map((r) => r.percentEtapa), 20);

  const linePoints = rows
    .map((r, idx) => {
      const x =
        padL +
        ((idx + 0.5) / Math.max(rows.length, 1)) * chartW;
      const y =
        padT + chartH - (Math.min(r.percentAcumulado, 100) / 100) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const textField = (
    label: string,
    key: keyof ProjectMetadata,
    type: 'text' | 'number' | 'date' = 'text'
  ) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={String(metadata[key] ?? '')}
        onChange={(e) =>
          onUpdateMetadata({
            [key]:
              type === 'number'
                ? Math.max(parseFloat(e.target.value) || 0, 0)
                : e.target.value,
          } as Partial<ProjectMetadata>)
        }
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Cronograma Físico-Financeiro */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Calendar className="h-4 w-4 text-blue-700" />
              Cronograma Físico-Financeiro (Até 24 Meses)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Distribuição mensal automática conforme o peso de cada etapa na
              PCI CAIXA ou edição manual das parcelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-700">
                Prazo (meses):
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={prazoMeses}
                onChange={(e) =>
                  onChangePrazo(
                    Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 24)
                  )
                }
                className="w-16 rounded-md border border-slate-300 px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onGenerateAutoSchedule}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Gerar Curva S Automática
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Curva S Visual */}
          <div className="p-6 lg:col-span-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Curva S de Desembolso Acumulado
              </h3>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  pctOk ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {pctOk ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                Soma: {formatPct(totalPct, 2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="h-56 w-full min-w-[460px]"
                aria-label="Gráfico de Cronograma Físico-Financeiro"
              >
                {[0, 25, 50, 75, 100].map((tick) => {
                  const y = padT + chartH - (tick / 100) * chartH;
                  return (
                    <g key={tick}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={svgW - padR}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padL - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 font-mono text-[10px]"
                      >
                        {tick}%
                      </text>
                    </g>
                  );
                })}

                {rows.map((r, idx) => {
                  const slotW = chartW / Math.max(rows.length, 1);
                  const barW = Math.min(slotW * 0.55, 28);
                  const x = padL + idx * slotW + (slotW - barW) / 2;
                  const barH = (r.percentEtapa / maxBar) * (chartH * 0.65);
                  const y = padT + chartH - barH;
                  return (
                    <g key={r.etapa}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={Math.max(barH, 1)}
                        rx={2}
                        fill="#bfdbfe"
                      />
                      <text
                        x={padL + idx * slotW + slotW / 2}
                        y={svgH - 8}
                        textAnchor="middle"
                        className="fill-slate-500 font-mono text-[10px]"
                      >
                        {r.etapa === 'PréExc.' ? 'Pré' : `M${r.etapa}`}
                      </text>
                    </g>
                  );
                })}

                {rows.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth="2.5"
                    points={linePoints}
                  />
                )}

                {rows.map((r, idx) => {
                  const x =
                    padL +
                    ((idx + 0.5) / Math.max(rows.length, 1)) * chartW;
                  const y =
                    padT +
                    chartH -
                    (Math.min(r.percentAcumulado, 100) / 100) * chartH;
                  return (
                    <circle
                      key={r.etapa}
                      cx={x}
                      cy={y}
                      r={3.5}
                      fill="#1d4ed8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="mt-2 flex items-center gap-6 text-xs text-slate-500">
              <span>Barra azul clara: % da etapa no mês</span>
              <span>Linha azul escura: % acumulado até 100%</span>
            </div>
          </div>

          {/* Tabela Editável do Cronograma */}
          <div className="max-h-96 overflow-y-auto lg:col-span-6">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Etapa</th>
                  <th className="px-3 py-2.5 text-right">% Etapa</th>
                  <th className="px-3 py-2.5 text-right">% Acum.</th>
                  <th className="px-3 py-2.5 text-right">Parcela (R$)</th>
                  <th className="px-4 py-2.5 text-right">Acumulado (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.etapa} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {r.etapa === 'PréExc.' ? 'Pré-Execução' : `Mês ${r.etapa}`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={r.percentEtapa}
                        onChange={(e) =>
                          onUpdateScheduleStage(
                            r.etapa,
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-right font-mono tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600">
                      {formatPct(r.percentAcumulado, 2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-800">
                      {formatBRL(r.valorEtapa)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatBRL(r.valorAcumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Identificação, Projeto, Documentação & Memorial Descritivo CAIXA */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Dados do Proponente, Responsáveis Técnicos, Imóvel e Memorial Descritivo (PCI CAIXA)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Estes campos compõem a folha oficial da Proposta de Construção
            Individual para entrega e assinatura.
          </p>
        </div>

        <div className="mt-6 space-y-8">
          {/* Dados do Projeto + Sistema Construtivo */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              1. Dados Técnicos do Projeto e Terreno
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {textField('Área Construída Total (m²)', 'areaConstruidaTotal', 'number')}
              {textField('Área do Terreno (m²)', 'areaTerreno', 'number')}
              {textField('Valor do Terreno (R$)', 'valorTerreno', 'number')}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Tipologia do Imóvel
                </label>
                <select
                  value={metadata.tipologiaImovel}
                  onChange={(e) =>
                    onUpdateMetadata({ tipologiaImovel: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  {TIPOLOGIAS_CAIXA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Padrão de Acabamento
                </label>
                <select
                  value={metadata.padraoAcabamento}
                  onChange={(e) =>
                    onUpdateMetadata({
                      padraoAcabamento: e.target.value as ProjectMetadata['padraoAcabamento'],
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  <option value="Mínimo">Mínimo</option>
                  <option value="Baixo">Baixo</option>
                  <option value="Normal">Normal</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Sistema Construtivo
                </label>
                <select
                  value={metadata.sistemaConstrutivo}
                  onChange={(e) =>
                    onUpdateMetadata({ sistemaConstrutivo: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  {SISTEMAS_CONSTRUTIVOS_CAIXA.map((s) => (
                    <option key={s.label} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {textField(
                'Sistema Construtivo Outros (se aplicável)',
                'sistemaConstrutivoOutros'
              )}
            </div>

            {isInovador && (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="font-semibold">
                  Sistema Construtivo Inovador Selecionado — Documentação Extra Obrigatória CAIXA:
                </p>
                <p className="mt-1">
                  1. DATec válido · 2. Termo de Ciência e Responsabilidade de
                  Manutenção · 3. Termo de Compromisso e Garantia - Unidade
                  Isolada · 4. ART/RRT de Projeto Estrutural · 5. Manual do
                  Proprietário – Condições de Manutenção.
                </p>
              </div>
            )}
          </div>

          {/* Identificação Proponente, RTs e Imóvel */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              2. Proponente, Responsáveis Técnicos (RTP / RTE) e Imóvel
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {textField('Proponente (Cliente)', 'proponente')}
              {textField('CPF Proponente', 'cpfProp')}
              {textField('E-mail Proponente', 'emailProp')}
              {textField('Telefone Proponente', 'telefoneProp')}

              {textField('Resp. Técnico Projeto (RTP)', 'rtpNome')}
              {textField('CAU/CREA/CFT RTP', 'rtpRegistro')}
              {textField('Resp. Técnico Execução (RTE)', 'rteNome')}
              {textField('CAU/CREA/CFT RTE', 'rteRegistro')}

              {textField('Endereço do Imóvel', 'endereco')}
              {textField('Bairro', 'bairro')}
              {textField('Município', 'municipio')}
              {textField('UF', 'uf')}
              {textField('Matrícula / ORI', 'matricula')}
              {textField('Coordenadas', 'coordenadas')}
              {textField('Nº ART/RRT Projeto', 'numArtProjeto')}
              {textField('Nº ART/RRT Execução', 'numArtExecucao')}
            </div>
          </div>

          {/* Memorial Descritivo */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              3. Memorial Descritivo (Soluções Previstas em Projeto)
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {textField('Cobertura', 'cobertura')}
              {textField('Teto', 'teto')}
              {textField('Divisão Interna', 'divisaoInterna')}
              {textField('Acabamento Paredes Externas', 'acabParedesExternas')}
              {textField('Acabamento Paredes Internas', 'acabParedesInternas')}
              {textField('Louças e Metais', 'loucasMetais')}
              {textField('Revest. Parede Áreas Molhadas', 'revestParedeMolhada')}
              {textField('Revest. Piso Áreas Molhadas', 'revestPisoMolhada')}
              {textField('Revestimento Piso Áreas Secas', 'revestPisoSeca')}
              {textField('Esquadrias Internas', 'esquadriasInternas')}
              {textField('Esquadrias Externas', 'esquadriasExternas')}
              {textField('Local e Data para Assinatura', 'localData')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
