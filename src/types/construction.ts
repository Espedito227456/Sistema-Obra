export type TabId =
  | 'quote'
  | 'labor'
  | 'report'
  | 'pci';

export interface LaborConfig {
  diariaPedreiro: number;
  diariaServente: number;
  incluirServente: boolean;
  encargosPercent: number;
  bdiPercent: number;
  materialMarginPercent?: number;
}

export interface LaborServiceRate {
  id: string;
  nome: string;
  unidade: 'm²' | 'm³' | 'm' | 'un' | 'vb';
  produtividadeDia: number; // quantidade executada por dia por equipe base
  coefServente: number; // fração de diária de servente por diária de pedreiro (ex: 1.0 = 1 servente por pedreiro)
  pciItemId: number;
  corePlanilha: boolean; // true se faz parte dos 9 serviços originais da Planilha Mão de Obra
  precoFixoUnit?: number; // valor fixo opcional por unidade (empreita), mantendo produtividadeDia para prazo
}

export interface MaterialUnitPrices {
  cimento50kg: number;
  cal20kg: number;
  areiaM3: number;
  britaM3: number;
  tijoloFuradoUnid: number;
  tijoloMacicoUnid: number;
  argamassa20kg: number;
  rejunteKg: number;
}

export type CalculatorType =
  | 'baldrame_direto'
  | 'baldrame_caixaria'
  | 'alvenaria_furado'
  | 'alvenaria_macico'
  | 'contrapiso'
  | 'emboco'
  | 'chapisco'
  | 'piso_concreto'
  | 'pilar_embutido'
  | 'pilar_isolado'
  | 'vigas'
  | 'laje'
  | 'ceramica';

export interface ServiceEntry {
  id: string;
  descricao: string;
  calculatorType: CalculatorType;
  laborServiceId: string;
  pciItemId: number;
  // Proporções (traço)
  propCimento: number;
  propCal: number;
  propAreia: number;
  propBrita: number;
  // Dimensões / Quantidades
  areaM2: number;
  larguraCm: number;
  alturaCm: number;
  comprimentoCm: number;
  alturaM: number;
  comprimentoM: number;
  espessuraCm: number;
  espessuraMm: number;
  juntaCm: number;
  juntaMm: number;
  quantidadeUnid: number;
}

export interface PciItemConfig {
  id: number;
  nome: string;
  minIncidence: number;
  maxIncidence: number;
  manualLaborCost: number;
  manualMaterialCost: number;
}

export interface ServicoAdicional {
  id: string;
  descricao: string;
  custo: number;
}

export interface ScheduleStage {
  etapa: string; // 'PréExc.' ou '1'..'24'
  percentEtapa: number;
}

export interface ProjectMetadata {
  // Identificação básica
  contrato: string;
  autorizacaoServico: string;
  proponente: string;
  emailProp: string;
  cpfProp: string;
  telefoneProp: string;
  // Responsável Técnico Projeto
  rtpNome: string;
  rtpEmail: string;
  rtpRegistro: string;
  rtpUf: string;
  rtpCpf: string;
  rtpTelefone: string;
  // Responsável Técnico Execução
  rteNome: string;
  rteEmail: string;
  rteRegistro: string;
  rteUf: string;
  rteCpf: string;
  rteTelefone: string;
  // Imóvel
  endereco: string;
  complemento: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  matricula: string;
  ori: string;
  coordenadas: string;
  construtora: string;
  cnpjConstrutora: string;
  // Documentação básica
  docMatricula: 'Sim' | 'Falta';
  docProjetoLegal: 'Sim' | 'Falta';
  docAlvara: 'Sim' | '1° desembolso';
  dataValidadeAlvara: string;
  terrenoProprio: 'Sim' | 'Não';
  docArtProjeto: 'Sim' | 'Falta';
  numArtProjeto: string;
  docArtExecucao: 'Sim' | 'Falta';
  numArtExecucao: string;
  // Projeto
  areaConstruidaTotal: number;
  areaTerreno: number;
  valorTerreno: number;
  tipologiaImovel: string;
  sistemaConstrutivo: string;
  sistemaConstrutivoOutros: string;
  // Memorial Descritivo
  cobertura: string;
  teto: string;
  divisaoInterna: string;
  acabParedesExternas: string;
  loucasMetais: string;
  acabParedesInternas: string;
  paredesAreasSecas: string;
  revestParedeMolhada: string;
  revestPisoMolhada: string;
  revestPisoSeca: string;
  esquadriasInternas: string;
  esquadriasExternas: string;
  padraoAcabamento: 'Mínimo' | 'Baixo' | 'Normal' | 'Alto';
  memorialOutros: string;
  // Justificativas e observações
  justificativasPci: string;
  obrasExecutadas: string;
  localData: string;
}

export interface ConstructionProject {
  id: string;
  nomeObra: string;
  updatedAt: string;
  laborConfig: LaborConfig;
  laborServices: LaborServiceRate[];
  materialPrices: MaterialUnitPrices;
  entries: ServiceEntry[];
  pciItems: PciItemConfig[];
  servicosAdicionais: ServicoAdicional[];
  prazoMeses: number;
  schedule: ScheduleStage[];
  metadata: ProjectMetadata;
}

export interface MaterialsBreakdown {
  cimentoSacos50kg: number;
  calSacos20kg: number;
  areiaM3: number;
  areiaSacos20kg: number;
  britaM3: number;
  britaSacos20kg: number;
  tijolosFuradoUnid: number;
  tijolosMacicoUnid: number;
  argamassaSacos20kg: number;
  rejunteKg: number;
}

export interface EntryComputed {
  entryId: string;
  quantidadeBase: number;
  unidadeBase: 'm²' | 'm³' | 'm';
  laborUnitCost: number;
  laborCost: number;
  masonDays: number;
  helperDays: number;
  materialCost: number;
  materialClientCost: number;
  totalCost: number;
  totalClientCost: number;
  materials: MaterialsBreakdown;
}

export interface PciComputedItem extends PciItemConfig {
  autoLaborCost: number;
  autoMaterialCost: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalCost: number;
  incidencePercent: number;
  cumulativePercent: number;
  status: 'ok' | 'below' | 'above';
}
