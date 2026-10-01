/* Roteiro — Exames de Análises Clínicas (EAC) em farmácia e drogaria.
   Base: RDC Anvisa nº 978/2025. A farmácia só pode executar EAC como Serviço
   Tipo I (arts. 8º a 18 e 60); os capítulos gerais (qualidade, pessoal,
   processos, controle da qualidade) valem para todo serviço que executa EAC.
   Base sancionatória: Lei Municipal nº 13.725/2004 (Código Sanitário de SP).

   Formato de cada pergunta: {id, t (pergunta), r (dispositivos), c (frase de
   conformidade), nc (frase de irregularidade), na (frase do “Não se aplica”),
   inf (infrações sugeridas quando irregular), sim: 'nc' quando a resposta “Sim”
   é a irregular (ex.: “O serviço guarda material biológico?”), checks (lista
   que abre com a resposta conforme e só complementa a frase), naSe (marca
   “Não se aplica” sozinho conforme um campo)}.
   Revisão de 01/10/2026 com a equipe: respostas Sim / Não / Não se aplica;
   identificação com busca na Anvisa pelo CNPJ e leitura da certidão do CRF;
   licença inicial; licença da farmácia/drogaria (precede a do EAC); DML e
   sanitário com detalhe; imunização (RDC 63/2011, art. 43) e ASO (art. 44);
   relatório em preto e branco, sem frases “não se aplicam” em lista. */
'use strict';
const A = (art, ...resto) => ['rdc-978-2025::artigo::' + art].concat(resto.length ? [resto.join('::')] : []).join('::');
const I = (art, inc) => A(art, 'inciso', inc);
const P = (art, par) => A(art, 'paragrafo', par);
const LM = art => 'lei-municipal-13725-2004::artigo::' + art;
const R63 = art => 'rdc-63-2011::artigo::' + art;

module.exports = {
  app: 'eac',
  titulo: 'Exames de Análises Clínicas',
  tituloCurto: 'EAC',
  store: 'med-eac-v1',
  respostas: 'simnao', naSempre: true, estilo: 'pb', ocr: true,
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA',
    subtitulo: 'Exames de Análises Clínicas (EAC) em farmácia — Serviço Tipo I (RDC Anvisa nº 978/2025)',
    objetivo: 'Verificar as condições de funcionamento do serviço de Exames de Análises Clínicas (EAC) executado pela farmácia, classificada como Serviço Tipo I, nos termos da RDC Anvisa nº 978/2025.',
    conclusao: 'Diante do exposto, o serviço de Exames de Análises Clínicas executado pelo estabelecimento foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
  },
  normas: [
    ['RDC Anvisa nº 978/2025', 'Funcionamento de serviços que executam atividades relacionadas aos Exames de Análises Clínicas (EAC).'],
    ['RDC Anvisa nº 44/2009', 'Boas práticas farmacêuticas e serviços farmacêuticos em farmácias e drogarias.'],
    ['RDC Anvisa nº 63/2011', 'Boas Práticas de Funcionamento para os Serviços de Saúde.'],
    ['RDC Anvisa nº 222/2018', 'Gerenciamento dos resíduos de serviços de saúde.'],
    ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
  ],
  secoes: [
    {
      id: 'ident', titulo: 'Identificação e exames', curto: 'Identificação', icone: 'building',
      itens: [
        {id: 'dados', titulo: 'Dados do estabelecimento e da inspeção', curto: 'Dados',
          acoes: [{id: 'anvisa_cnpj', rotulo: 'Buscar dados na Anvisa pelo CNPJ', pri: true}, {id: 'ocr_crt', rotulo: 'Ler certidão do CRF'}],
          acoesNota: 'A busca usa a base de AFE/AE da Anvisa (a mesma da Central de Consultas); a certidão do CRF é lida no próprio aparelho. Só os campos vazios são preenchidos — confira antes de seguir.',
          campos: [
          {id: 'razao', rotulo: 'Razão social'}, {id: 'fantasia', rotulo: 'Nome fantasia'},
          {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
          {id: 'afe', rotulo: 'AFE na Anvisa'},
          {id: 'licenca', rotulo: 'Licença sanitária da farmácia/drogaria (CEVS) nº'}, {id: 'cnes', rotulo: 'CNES'},
          {id: 'rl', rotulo: 'Responsável legal'}, {id: 'rt', rotulo: 'Responsável técnico (nome e CRF)'},
          {id: 'rt_subst', rotulo: 'Responsável técnico substituto (nome e CRF)'},
          {id: 'crt', rotulo: 'Certidão de Regularidade Técnica do CRF (nº e emissão)', largo: true},
          {id: 'horario', rotulo: 'Horário de assistência farmacêutica', largo: true},
          {id: 'supervisor', rotulo: 'Supervisor do pessoal técnico presente (nome e CRF)'},
          {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
          {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
        ]},
        {id: 'exames', titulo: 'Exames realizados e equipamentos', curto: 'Exames', campos: [
          {id: 'exames', rotulo: 'Exames oferecidos', tipo: 'checks', opcoes: [
            ['glicemia', 'Glicemia capilar'], ['colesterol', 'Colesterol total'], ['lipidico', 'Perfil lipídico'],
            ['triglicerides', 'Triglicerídeos'], ['hba1c', 'Hemoglobina glicada'], ['covid', 'Teste rápido de COVID-19'],
            ['influenza', 'Teste rápido de influenza'], ['dengue', 'Teste rápido de dengue'], ['hiv', 'Teste rápido de HIV'],
            ['sifilis', 'Teste rápido de sífilis'], ['hepatites', 'Testes rápidos de hepatites B e C'], ['outro', 'Outros']]},
          {id: 'exames_outros', rotulo: 'Outros exames', largo: true},
          {id: 'materiais', rotulo: 'Materiais biológicos utilizados', tipo: 'checks', opcoes: [
            ['capilar', 'Sangue por punção capilar'], ['oral', 'Cavidade oral'], ['naso', 'Nasofaringe'], ['oro', 'Orofaringe'], ['outro_mat', 'Outro material']]},
          {id: 'equipamentos', rotulo: 'Equipamentos de medição em uso (marca/modelo)', tipo: 'textarea', largo: true}
        ]}
      ]
    },
    {
      id: 'classif', titulo: 'Classificação e responsabilidade', curto: 'Classificação', icone: 'folder',
      itens: [
        {id: 'lic', titulo: 'Licenciamento e cadastro', curto: 'Licenciamento',
          campos: [{id: 'lic_inicial', rotulo: 'Trata-se de licença inicial do serviço de EAC?', tipo: 'select', rel: false, opcoes: [['sim', 'Sim — o serviço de EAC ainda não é licenciado'], ['nao', 'Não — o serviço já é licenciado']]}],
          perguntas: [
          {id: 'lic_farmacia', t: 'A farmácia ou drogaria possui licença sanitária vigente para a atividade de farmácia/drogaria (que precede a licença do serviço de EAC)?', r: [LM(90)],
            c: 'A farmácia possui licença sanitária vigente para a atividade de farmácia ou drogaria, que precede a licença do serviço de EAC.',
            nc: 'A farmácia não possui licença sanitária vigente para a atividade de farmácia ou drogaria.',
            na: 'O estabelecimento não exerce a atividade de farmácia ou drogaria.', inf: ['farm_lic']},
          {id: 'lic', t: 'A licença sanitária indica as atividades relacionadas ao EAC, além das atividades de farmácia?', r: [A(63), A(73)], naSe: {campo: 'lic_inicial', igual: 'sim'},
            c: 'A licença sanitária indica as atividades relacionadas ao EAC, além das atividades de farmácia.',
            nc: 'A licença sanitária não indica as atividades relacionadas ao EAC executadas pela farmácia.',
            na: 'Trata-se de licença inicial do serviço de EAC; a licença sanitária vigente ainda não contempla essa atividade.', inf: ['eac_lic']},
          {id: 'cnes', t: 'O estabelecimento está inscrito no Cadastro Nacional de Estabelecimentos de Saúde (CNES)?', r: [A(74)],
            c: 'O estabelecimento está inscrito no CNES.', nc: 'O estabelecimento não comprovou inscrição no CNES.',
            na: 'A inscrição no CNES ainda não é exigível, por se tratar de licença inicial do serviço.', inf: ['eac_cnes']},
          {id: 'estrutura', t: 'Há estrutura organizacional documentada do serviço de EAC?', r: [A(76)],
            c: 'A estrutura organizacional do serviço de EAC está documentada.', nc: 'Não foi apresentada a estrutura organizacional documentada do serviço de EAC.',
            na: 'O serviço de EAC ainda não está em funcionamento, e a estrutura organizacional não foi verificada.', inf: ['eac_doc']}
        ]},
        {id: 'resp', titulo: 'Responsável técnico e supervisão', curto: 'Responsáveis', perguntas: [
          {id: 'rt', t: 'Há profissional legalmente habilitado como responsável técnico, com substituto para os impedimentos?', r: [A(75), P(75, 'unico')],
            c: 'Há profissional legalmente habilitado como responsável técnico, com substituto designado para os impedimentos.',
            nc: 'Não há responsável técnico legalmente habilitado pelo serviço de EAC ou não há substituto designado para os impedimentos.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_rt']},
          {id: 'supervisor', t: 'Há supervisor do pessoal técnico, legalmente habilitado, presente durante todo o funcionamento do serviço?', r: [A(122), P(122, '3')],
            c: 'O supervisor do pessoal técnico, legalmente habilitado, permanece presente durante o funcionamento do serviço.',
            nc: 'Não há supervisor do pessoal técnico legalmente habilitado presente durante todo o funcionamento do serviço.',
            na: 'O próprio responsável técnico executa os exames, sem outro pessoal técnico a supervisionar.', inf: ['eac_rt']},
          {id: 'habilitado', t: 'Os EAC são executados exclusivamente por profissional legalmente habilitado?', r: [A(11)],
            c: 'Os EAC são executados exclusivamente por profissional legalmente habilitado.',
            nc: 'Foram constatados EAC executados por profissional não legalmente habilitado.',
            na: 'Não foram executados EAC durante a inspeção.', inf: ['eac_prof']}
        ]},
        {id: 'tipo1', titulo: 'Requisitos do Serviço Tipo I', curto: 'Serviço Tipo I', descricao: 'Requisitos obrigatórios para que a farmácia execute EAC (RDC 978/2025, art. 10). Atenção: nas perguntas sobre guarda de material, metodologia própria e água reagente, a resposta “Sim” é a irregular.', perguntas: [
          {id: 'material', t: 'Os EAC são executados apenas em material obtido por punção capilar ou coletado em cavidade oral, nasofaringe ou orofaringe?', r: [I(10, 'i')],
            c: 'Os EAC são executados apenas em material obtido por punção capilar ou coletado em cavidade oral, nasofaringe ou orofaringe.',
            nc: 'Foram constatados EAC em material biológico diverso do permitido ao Serviço Tipo I.',
            na: 'Não foram executados EAC durante a inspeção.', inf: ['eac_tipo1']},
          {id: 'inloco', t: 'Todas as fases do EAC, inclusive o controle interno e o controle externo da qualidade, são realizadas no próprio serviço?', r: [I(10, 'ii'), A(173)],
            c: 'Todas as fases do EAC, inclusive o controle interno e o controle externo da qualidade, são realizadas no próprio serviço.',
            nc: 'Nem todas as fases do EAC, ou os controles da qualidade, são realizadas no próprio serviço.',
            na: 'Não foram executados EAC durante a inspeção.', inf: ['eac_tipo1']},
          {id: 'guarda', t: 'O serviço guarda, armazena ou transporta material biológico (próprio ou de terceiro), além do material de CIQ e CEQ?', r: [I(10, 'iii')], sim: 'nc',
            c: 'O serviço não guarda, não armazena e não transporta material biológico, exceto o material de controle da qualidade.',
            nc: 'O serviço guarda, armazena ou transporta material biológico, o que não é permitido ao Serviço Tipo I.',
            na: 'Não há manuseio de material biológico além da coleta e execução imediata.', inf: ['eac_tipo1']},
          {id: 'inhouse', t: 'O serviço utiliza metodologia própria (in house)?', r: [I(10, 'iv')], sim: 'nc',
            c: 'O serviço não utiliza metodologia própria.', nc: 'O serviço utiliza metodologia própria, o que não é permitido ao Serviço Tipo I.',
            na: 'Os exames são feitos apenas com produtos regularizados, sem desenvolvimento de método.', inf: ['eac_tipo1']},
          {id: 'agua', t: 'Algum equipamento utilizado requer água reagente produzida no próprio serviço?', r: [I(10, 'v')], sim: 'nc',
            c: 'Os equipamentos utilizados não requerem água reagente produzida no serviço.',
            nc: 'O serviço utiliza equipamento que requer água reagente produzida no próprio serviço.',
            na: 'Não há equipamentos que utilizem água reagente.', inf: ['eac_tipo1']},
          {id: 'triagem', t: 'O resultado do EAC é registrado na Declaração de Serviço Farmacêutico, com finalidade de triagem?', r: [A(60), P(60, '2')],
            c: 'O resultado do EAC é registrado na Declaração de Serviço Farmacêutico, com finalidade de triagem.',
            nc: 'O resultado do EAC não é registrado na Declaração de Serviço Farmacêutico.',
            na: 'Ainda não há resultados de EAC emitidos pelo serviço.', inf: ['eac_dsf']}
        ]}
      ]
    },
    {
      id: 'infra', titulo: 'Infraestrutura', curto: 'Infraestrutura', icone: 'plan',
      descricao: 'Itens de infraestrutura exigíveis em reformas, ampliações, construções novas ou mudança de uso dos ambientes (art. 191, parágrafo único).',
      itens: [
        {id: 'ambientes', titulo: 'Ambientes', curto: 'Ambientes', perguntas: [
          {id: 'recepcao', t: 'Há área de recepção do paciente, dimensionada à demanda e separada da sala de coleta e execução?', r: [I(13, 'i'), P(13, '2')],
            c: 'A área de recepção do paciente é dimensionada à demanda e separada da sala de coleta e execução.',
            nc: 'Não há área de recepção do paciente separada da sala de coleta e execução de EAC.',
            na: 'A exigência de área de recepção separada não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.', inf: ['eac_infra']},
          {id: 'dml', t: 'Há depósito de material de limpeza (DML)?', r: [I(13, 'ii'), P(13, '1'), P(13, '2')],
            c: 'Há depósito de material de limpeza (DML).', nc: 'Não há depósito de material de limpeza.',
            na: 'A exigência de depósito de material de limpeza não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.',
            checks: {rotulo: 'Como é o DML (vai ao relatório; não gera infração)', opcoes: [['armario', 'Armário próprio'], ['sala', 'Sala própria'], ['sanitario', 'Localizado no sanitário'], ['outro', 'Outros']], outro: 'Outros — descrever'},
            inf: ['eac_infra']},
          {id: 'sanitario', t: 'Há sanitário de uso público?', r: [I(13, 'iii'), P(13, '2')],
            c: 'O estabelecimento dispõe de sanitário de uso público.', nc: 'Não há sanitário de uso público.',
            na: 'A exigência de sanitário de uso público não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.',
            checks: {rotulo: 'Como é o sanitário (vai ao relatório; não gera infração)', opcoes: [['proprio', 'Próprio'], ['compartilhado', 'Compartilhado com outras unidades do serviço'], ['outro', 'Outros']], outro: 'Outros — descrever', frase: 'O estabelecimento dispõe de sanitário de uso público, {}.'},
            inf: ['eac_infra']},
          {id: 'sala', t: 'Há sala de coleta e execução de EAC?', r: [I(13, 'iv')],
            c: 'O serviço conta com sala de coleta e execução de EAC.', nc: 'Não há sala de coleta e execução de EAC.',
            na: 'O serviço de EAC ainda não dispõe de ambiente instalado para avaliação.', inf: ['eac_infra']},
          {id: 'ventilacao', t: 'A sala de coleta e execução dispõe de ventilação natural ou de sistema de climatização?', r: [A(16)],
            c: 'A sala de coleta e execução dispõe de ventilação natural ou de climatização.',
            nc: 'A sala de coleta e execução não dispõe de ventilação natural nem de sistema de climatização.',
            na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']},
          {id: 'iluminacao', t: 'A iluminação da sala não prejudica a avaliação do exame e da coloração da pele do paciente?', r: [A(17)],
            c: 'A iluminação da sala é adequada à avaliação do exame e da coloração da pele do paciente.',
            nc: 'A iluminação da sala de coleta e execução prejudica a avaliação do exame ou da coloração da pele do paciente.',
            na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']}
        ]},
        {id: 'salacoleta', titulo: 'Sala de coleta e execução', curto: 'Sala de coleta', perguntas: [
          {id: 'lavatorio', t: 'A sala dispõe de lavatório?', r: [I(14, 'i')], c: 'A sala dispõe de lavatório.', nc: 'A sala de coleta e execução não dispõe de lavatório.',
            na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']},
          {id: 'mobiliario', t: 'A sala dispõe de bancada, mesa e cadeira para coleta?', r: [I(14, 'ii'), I(14, 'iii'), I(14, 'iv')],
            c: 'Bancada, mesa e cadeira para coleta estão disponíveis na sala.', nc: 'A sala de coleta e execução não dispõe de bancada, mesa ou cadeira para coleta.',
            na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']},
          {id: 'deposito', t: 'Há área para depósito de equipamentos e materiais?', r: [I(14, 'vi')],
            c: 'Os equipamentos e materiais são guardados em área própria.', nc: 'Não há área para depósito de equipamentos e materiais.',
            na: 'Não há equipamentos e materiais a guardar além dos de uso imediato.', inf: ['eac_infra']},
          {id: 'descarte', t: 'Há recipiente para descarte de perfurocortantes e de resíduos?', r: [I(14, 'vii')],
            c: 'Há recipiente para descarte de perfurocortantes e de resíduos.', nc: 'Não há recipiente adequado para descarte de perfurocortantes e de resíduos.',
            na: 'Os exames realizados não geram perfurocortantes nem resíduos biológicos.', inf: ['eac_residuos']},
          {id: 'refrigerador', t: 'Os produtos e controles que exigem refrigeração ficam em equipamento exclusivo (ou compartilhado só com medicamentos que não exijam equipamento exclusivo), com registro das temperaturas máxima, mínima e de momento?', r: [I(14, 'v'), P(14, '1'), A(96)],
            c: 'Os produtos para diagnóstico e os controles que exigem refrigeração ficam em equipamento adequado, com registro das temperaturas máxima, mínima e de momento.',
            nc: 'Os produtos para diagnóstico ou os controles que exigem refrigeração não ficam em equipamento adequado, ou não há registro das temperaturas máxima, mínima e de momento.',
            na: 'Não há produtos para diagnóstico nem controles que exijam refrigeração.', inf: ['eac_temp']}
        ]}
      ]
    },
    {
      id: 'qualidade', titulo: 'Gestão da qualidade', curto: 'Qualidade', icone: 'shield',
      itens: [
        {id: 'pgq', titulo: 'Programa de Garantia da Qualidade', curto: 'PGQ', perguntas: [
          {id: 'pgq', t: 'Há Programa de Garantia da Qualidade implantado, com gerenciamento das tecnologias, riscos, documentos, pessoal, processos e controle da qualidade?', r: [A(84), A(86)],
            c: 'O Programa de Garantia da Qualidade está implantado, com os componentes exigidos.', nc: 'Não há Programa de Garantia da Qualidade implantado com os componentes exigidos.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_pgq']},
          {id: 'indicadores', t: 'O responsável técnico monitora a efetividade do controle da qualidade por indicadores de desempenho?', r: [A(87)],
            c: 'O responsável técnico monitora a efetividade do controle da qualidade por indicadores de desempenho.',
            nc: 'Não há monitoramento da efetividade do controle da qualidade por indicadores de desempenho.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_pgq']},
          {id: 'notivisa', t: 'Há sistemática para identificar, investigar e notificar no Notivisa eventos adversos e queixas técnicas?', r: [A(90), P(90, '1')],
            c: 'Eventos adversos e queixas técnicas são identificados, investigados e notificados no Notivisa, conforme sistemática definida.',
            nc: 'Não há sistemática para identificar, investigar e notificar eventos adversos e queixas técnicas.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_pgq']},
          {id: 'dados', t: 'Há política de acesso e proteção dos dados dos pacientes e de controle de lançamento e alteração de resultados?', r: [A(77), A(105)],
            c: 'A política de acesso e proteção dos dados dos pacientes e de controle de lançamento e alteração de resultados está definida.',
            nc: 'Não há política de acesso e proteção dos dados dos pacientes e de controle de alteração de resultados.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_doc']}
        ]},
        {id: 'produtos', titulo: 'Produtos, equipamentos e armazenamento', curto: 'Produtos e equipamentos',
          descricao: 'Liste os testes rápidos, tiras, reagentes e analisadores em uso: busque pelo registro na Anvisa ou pelo processo, ou digite os dados. A lista sai em tabela no relatório. Atenção: na pergunta sobre validade expirada, a resposta “Sim” é a irregular.',
          campos: [{id: 'testes_lista', rotulo: 'Testes rápidos, reagentes e equipamentos em uso', tipo: 'equipamentos', perfil: 'teste', largo: true,
            tipos: ['Teste rápido', 'Tira reagente', 'Reagente / cartucho', 'Analisador / monitor portátil', 'Controle ou calibrador', 'Outro']}],
          perguntas: [
          {id: 'regularizados', t: 'Os produtos para diagnóstico in vitro, reagentes e equipamentos estão regularizados na Anvisa e são usados conforme as instruções do fabricante?', r: [A(88)],
            c: 'Os produtos para diagnóstico in vitro, reagentes e equipamentos estão regularizados na Anvisa e são usados conforme as instruções do fabricante.',
            nc: 'Foram constatados produtos para diagnóstico in vitro, reagentes ou equipamentos sem regularização ou usados fora das instruções do fabricante.',
            na: 'Não há produtos para diagnóstico em estoque ou em uso.', inf: ['eac_produto']},
          {id: 'validade', t: 'Há produtos para diagnóstico, reagentes ou insumos com validade expirada em uso ou em estoque?', r: [A(102)], sim: 'nc',
            c: 'Não foram constatados produtos para diagnóstico, reagentes ou insumos vencidos.', nc: 'Foram constatados produtos para diagnóstico, reagentes ou insumos com validade expirada.',
            na: 'Não há produtos para diagnóstico em estoque ou em uso.', inf: ['eac_produto']},
          {id: 'recebimento', t: 'O recebimento dos produtos é registrado com lote, conformidade do transporte e data?', r: [A(100), P(100, 'unico')],
            c: 'O recebimento dos produtos é registrado com lote, conformidade do transporte e data.', nc: 'O recebimento dos produtos não é registrado com lote, conformidade do transporte e data.',
            na: 'Ainda não houve recebimento de produtos para diagnóstico.', inf: ['eac_registros']},
          {id: 'armazenamento', t: 'O armazenamento garante a conservação dos produtos, com controle de temperatura e umidade conforme o fabricante, mesmo em falta de energia?', r: [A(95), A(104)],
            c: 'O armazenamento garante a conservação dos produtos, com controle de temperatura e umidade conforme o fabricante.',
            nc: 'O armazenamento não garante a conservação dos produtos ou não há controle de temperatura e umidade conforme o fabricante.',
            na: 'Não há produtos para diagnóstico em estoque.', inf: ['eac_temp']},
          {id: 'manutencao', t: 'Há registro da manutenção preventiva e corretiva dos equipamentos, no mínimo anual quando o fabricante não definir?', r: [A(92), P(92, 'unico')],
            c: 'A manutenção preventiva e corretiva dos equipamentos está registrada.', nc: 'Não há registro da manutenção preventiva e corretiva dos equipamentos.',
            na: 'Não há equipamentos que exijam manutenção (são usados apenas testes de uso único).', inf: ['eac_registros']},
          {id: 'calibracao', t: 'Há procedimento e registro da calibração dos equipamentos, na frequência do fabricante ou, na falta dela, anual?', r: [A(94), P(94, '1'), P(94, '2')],
            c: 'A calibração dos equipamentos segue procedimento e está registrada.', nc: 'Não há procedimento ou registro da calibração dos equipamentos.',
            na: 'Não há equipamentos que exijam calibração (são usados apenas testes de uso único).', inf: ['eac_registros']},
          {id: 'manuais', t: 'Há instruções escritas em português para os equipamentos (podem ser os manuais do fabricante)?', r: [A(99)],
            c: 'As instruções dos equipamentos estão disponíveis em português.', nc: 'Não há instruções escritas em português para os equipamentos.',
            na: 'Não há equipamentos em uso.', inf: ['eac_doc']}
        ]},
        {id: 'biosseg', titulo: 'Biossegurança, limpeza e resíduos', curto: 'Biossegurança', perguntas: [
          {id: 'biosseguranca', t: 'Há instruções escritas de biossegurança, uso de EPI e conduta em caso de acidentes, disponíveis aos funcionários?', r: [A(110)],
            c: 'Há instruções escritas de biossegurança, uso de EPI e conduta em caso de acidentes, disponíveis aos funcionários.',
            nc: 'Não há instruções escritas de biossegurança, uso de EPI ou conduta em caso de acidentes.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_doc']},
          {id: 'imunizacao', t: 'O serviço garante orientação aos trabalhadores sobre imunização contra tétano, difteria, hepatite B e outros agentes biológicos a que possam estar expostos?', r: [R63(43)],
            c: 'O serviço garante orientação aos trabalhadores sobre imunização contra tétano, difteria, hepatite B e outros agentes biológicos a que possam estar expostos.',
            nc: 'O serviço não garante orientação aos trabalhadores sobre imunização contra tétano, difteria, hepatite B e outros agentes biológicos a que possam estar expostos.',
            na: 'Não há trabalhadores expostos a agentes biológicos além do responsável técnico.',
            checks: {rotulo: 'O que foi verificado (vai ao relatório; não gera infração)', opcoes: [['comprovantes', 'Comprovantes de vacinação dos trabalhadores apresentados', 'comprovantes de vacinação dos trabalhadores apresentados'], ['orientacao', 'Orientação registrada (POP, treinamento ou termo)', 'orientação registrada em POP, treinamento ou termo']], outro: 'Outros — descrever'},
            inf: ['eac_saude_trab']},
          {id: 'limpeza', t: 'Há instruções escritas de limpeza e desinfecção, e a limpeza é registrada diariamente no início e no término do funcionamento?', r: [A(112), A(113)],
            c: 'A limpeza e a desinfecção seguem instruções escritas e são registradas diariamente no início e no término do funcionamento.',
            nc: 'Não há instruções escritas de limpeza e desinfecção ou a limpeza não é registrada no início e no término do funcionamento.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_limpeza']},
          {id: 'saneantes', t: 'Os saneantes utilizados estão regularizados na Anvisa?', r: [A(114)],
            c: 'Os saneantes utilizados estão regularizados na Anvisa.', nc: 'Foram constatados saneantes sem regularização na Anvisa.',
            na: 'Não havia saneantes no local no momento da inspeção.', inf: ['eac_limpeza']},
          {id: 'pgrss', t: 'Há Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS) implantado?', r: [A(111)],
            c: 'O Plano de Gerenciamento de Resíduos de Serviços de Saúde está implantado.', nc: 'Não há Plano de Gerenciamento de Resíduos de Serviços de Saúde implantado.',
            na: 'O serviço de EAC ainda não gera resíduos de serviços de saúde.', inf: ['eac_residuos']}
        ]},
        {id: 'documentos', titulo: 'Documentos e registros', curto: 'Documentos', perguntas: [
          {id: 'relacoes', t: 'Estão disponíveis a relação dos procedimentos realizados, o inventário dos produtos e a relação nominal da equipe com atribuições e cargas horárias?', r: [I(117, 'ii'), I(117, 'iii'), I(117, 'iv')],
            c: 'Estão disponíveis a relação dos procedimentos realizados, o inventário dos produtos e a relação nominal da equipe.',
            nc: 'Não estão disponíveis a relação dos procedimentos realizados, o inventário dos produtos ou a relação nominal da equipe.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_doc']},
          {id: 'prazo_registros', t: 'Os registros são mantidos por, no mínimo, 5 anos, e as alterações preservam o dado original, com data e responsável?', r: [A(115), A(116)],
            c: 'Os registros são mantidos por, no mínimo, 5 anos, e as alterações preservam o dado original.',
            nc: 'Os registros não são mantidos pelo prazo mínimo de 5 anos ou as alterações não preservam o dado original.',
            na: 'Ainda não há registros do serviço de EAC.', inf: ['eac_registros']}
        ]}
      ]
    },
    {
      id: 'pessoal', titulo: 'Pessoal', curto: 'Pessoal', icone: 'people',
      itens: [
        {id: 'equipe', titulo: 'Qualificação, educação permanente e saúde do trabalhador', curto: 'Equipe', perguntas: [
          {id: 'formacao', t: 'Há registros da formação e qualificação dos profissionais, compatíveis com as funções?', r: [A(123)],
            c: 'A formação e a qualificação dos profissionais estão registradas e são compatíveis com as funções.', nc: 'Não há registros da formação e qualificação dos profissionais.',
            na: 'O serviço de EAC ainda não tem equipe contratada.', inf: ['eac_educacao']},
          {id: 'educacao', t: 'Há Programa de Educação Permanente, com capacitações iniciais e, no mínimo, anuais?', r: [A(124), I(125, 'i')],
            c: 'O Programa de Educação Permanente prevê capacitações iniciais e anuais.', nc: 'Não há Programa de Educação Permanente com capacitações iniciais e anuais.',
            na: 'O serviço de EAC ainda não tem equipe contratada.', inf: ['eac_educacao']},
          {id: 'treinos', t: 'Os treinamentos abordam instruções escritas, segurança do paciente, riscos e o PGQ, e estão registrados com data, carga horária, conteúdo e instrutor?', r: [A(126), A(127)],
            c: 'Os treinamentos abordam os temas exigidos e estão registrados com data, carga horária, conteúdo e instrutor.',
            nc: 'Os treinamentos não abordam os temas exigidos ou não estão registrados com data, carga horária, conteúdo e instrutor.',
            na: 'Ainda não houve treinamentos, por se tratar de serviço em implantação.', inf: ['eac_educacao']},
          {id: 'aso', t: 'Os trabalhadores são avaliados periodicamente quanto à saúde ocupacional, com registro (Atestado de Saúde Ocupacional — ASO)?', r: [R63(44)],
            c: 'Os trabalhadores são avaliados periodicamente quanto à saúde ocupacional, com registro em Atestado de Saúde Ocupacional (ASO).',
            nc: 'Não foram apresentados os registros da avaliação periódica de saúde ocupacional (ASO) dos trabalhadores.',
            na: 'Não há trabalhadores com vínculo empregatício no serviço de EAC.', inf: ['eac_saude_trab']}
        ]}
      ]
    },
    {
      id: 'processos', titulo: 'Processos operacionais', curto: 'Processos', icone: 'lab',
      itens: [
        {id: 'pre', titulo: 'Fase pré-analítica', curto: 'Pré-analítica', perguntas: [
          {id: 'orientacao', t: 'O paciente recebe orientação em linguagem acessível sobre o preparo e a coleta?', r: [I(132, 'i')],
            c: 'O paciente recebe orientação em linguagem acessível sobre o preparo e a coleta.', nc: 'O paciente não recebe orientação sobre o preparo e a coleta.',
            na: 'Não houve atendimento de paciente durante a inspeção.', inf: ['eac_processo']},
          {id: 'documento', t: 'É solicitado documento com foto para identificar o paciente no cadastro?', r: [I(132, 'ii')],
            c: 'É solicitado documento com foto para identificar o paciente no cadastro.', nc: 'Não é solicitado documento com foto para identificar o paciente.',
            na: 'Não houve atendimento de paciente durante a inspeção.', inf: ['eac_processo']},
          {id: 'instrucoes_pre', t: 'Há instruções escritas e atualizadas para as atividades pré-analíticas?', r: [I(132, 'iii')],
            c: 'As atividades pré-analíticas seguem instruções escritas e atualizadas.', nc: 'Não há instruções escritas para as atividades pré-analíticas.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_doc']},
          {id: 'cadastro', t: 'O cadastro do paciente tem registro, nome, data de nascimento, sexo biológico, nome da mãe e contato?', r: [A(133), A(134)],
            c: 'O cadastro do paciente contém os dados mínimos exigidos.', nc: 'O cadastro do paciente não contém os dados mínimos exigidos.',
            na: 'Ainda não há pacientes cadastrados.', inf: ['eac_rastreab']},
          {id: 'cadastro_eac', t: 'O cadastro do exame registra solicitante, data e horário, exames, material e profissionais do cadastro e da coleta?', r: [A(135), A(136)],
            c: 'O cadastro do exame contém as informações exigidas.', nc: 'O cadastro do exame não contém as informações exigidas.',
            na: 'Ainda não há exames cadastrados.', inf: ['eac_rastreab']},
          {id: 'identificacao', t: 'O material biológico é identificado com nome do paciente e data de nascimento ou idade (identificação simplificada quando o laudo é entregue no ato)?', r: [A(138), P(129, 'unico')],
            c: 'O material biológico é identificado de forma a garantir a rastreabilidade até o paciente.',
            nc: 'O material biológico não é identificado de forma a garantir a rastreabilidade até o paciente.',
            na: 'Não houve coleta durante a inspeção.', inf: ['eac_rastreab']},
          {id: 'aceitacao', t: 'Há critérios definidos para aceitação e rejeição do material biológico?', r: [A(139)],
            c: 'Os critérios para aceitação e rejeição do material biológico estão definidos.', nc: 'Não há critérios definidos para aceitação e rejeição do material biológico.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_processo']}
        ]},
        {id: 'analitica', titulo: 'Fases analítica e pós-analítica', curto: 'Analítica e laudo', perguntas: [
          {id: 'instrucoes_an', t: 'Há instruções escritas e atualizadas para os processos analíticos (podem ser as instruções do fabricante)?', r: [I(154, 'i')],
            c: 'Os processos analíticos seguem instruções escritas e atualizadas.', nc: 'Não há instruções escritas para os processos analíticos.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_doc']},
          {id: 'criticos', t: 'Estão definidos valores críticos ou de alerta e o fluxo de comunicação ao paciente ou ao profissional de saúde?', r: [I(154, 'iii'), P(165, 'unico')],
            c: 'Estão definidos valores críticos ou de alerta e o fluxo de comunicação ao paciente ou ao profissional de saúde.',
            nc: 'Não estão definidos valores críticos ou de alerta ou o fluxo de comunicação quando há necessidade de decisão imediata.',
            na: 'Os exames oferecidos não têm valores críticos ou de alerta definidos pelo fabricante.', inf: ['eac_processo']},
          {id: 'liberacao', t: 'Há instruções escritas para liberação de resultados e assinatura dos laudos, disponíveis no local do exame?', r: [A(119), A(165)],
            c: 'A liberação de resultados e a assinatura dos laudos seguem instruções escritas, disponíveis no local do exame.', nc: 'Não há instruções escritas para liberação de resultados e assinatura dos laudos.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_doc']},
          {id: 'laudo', t: 'O laudo é legível, em português, datado e assinado por profissional habilitado, com os dados mínimos (serviço e CNES, RT, paciente, exame, método, resultado, valores de referência)?', r: [A(166), A(167), A(129)],
            c: 'O laudo é legível, em português, datado e assinado por profissional habilitado, com os dados mínimos exigidos.',
            nc: 'O laudo não contém os dados mínimos exigidos ou não é datado e assinado por profissional habilitado.',
            na: 'Ainda não há laudos emitidos pelo serviço.', inf: ['eac_laudo']},
          {id: 'dnc', t: 'Há procedimento para notificar resultados que indiquem suspeita de doença de notificação compulsória?', r: [A(66)],
            c: 'Há procedimento para notificar resultados que indiquem suspeita de doença de notificação compulsória.',
            nc: 'Não há procedimento para notificar resultados que indiquem suspeita de doença de notificação compulsória.',
            na: 'Os exames oferecidos não detectam doenças de notificação compulsória.', inf: ['eac_processo']}
        ]}
      ]
    },
    {
      id: 'cq', titulo: 'Controle da qualidade', curto: 'Controle da qualidade', icone: 'check',
      itens: [
        {id: 'gcq', titulo: 'Gestão do controle da qualidade', curto: 'Gestão', perguntas: [
          {id: 'gcq_doc', t: 'A gestão do controle da qualidade está documentada, com lista dos exames, forma e frequência dos controles, limites de aceitação e avaliação dos resultados?', r: [A(174), A(176)],
            c: 'A gestão do controle da qualidade está documentada com os elementos exigidos.', nc: 'A gestão do controle da qualidade não está documentada com os elementos exigidos.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_cq']}
        ]},
        {id: 'ciq', titulo: 'Controle interno da qualidade (CIQ)', curto: 'CIQ', perguntas: [
          {id: 'ciq', t: 'O CIQ é feito em todos os equipamentos e para todos os analitos, com registro, critério de aceitação e ação nos resultados rejeitados?', r: [A(177), A(179), A(180)],
            c: 'O controle interno da qualidade é feito em todos os equipamentos e analitos, com registros e critérios definidos.',
            nc: 'O controle interno da qualidade não é feito em todos os equipamentos e analitos ou não está registrado.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_cq']},
          {id: 'ciq_amostra', t: 'São usadas amostras controle comerciais ou de provedor de controle da qualidade regularizado?', r: [A(181), A(182)],
            c: 'As amostras controle são comerciais ou de provedor de controle da qualidade regularizado.', nc: 'Não são usadas amostras controle comerciais ou de provedor regularizado, nem forma alternativa fundamentada.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_cq']},
          {id: 'ciq_freq', t: 'Nos testes de uso único, o CIQ é feito, no mínimo, a cada troca de lote, a cada remessa e conforme o fabricante?', r: [A(183), A(184)],
            c: 'Nos testes de uso único, o controle interno é feito a cada troca de lote, a cada remessa e conforme o fabricante.',
            nc: 'Nos testes de uso único, o controle interno não é feito a cada troca de lote e a cada remessa.',
            na: 'Não são utilizados testes de uso único.', inf: ['eac_cq']}
        ]},
        {id: 'ceq', titulo: 'Controle externo da qualidade (CEQ)', curto: 'CEQ', perguntas: [
          {id: 'ceq', t: 'O serviço participa de programa de CEQ para todos os analitos e equipamentos em uso, com relatório de desempenho no mínimo anual?', r: [A(185), A(187), A(188), I(176, 'v')],
            c: 'O serviço participa de controle externo da qualidade para todos os analitos e equipamentos em uso.',
            nc: 'O serviço não participa de controle externo da qualidade para todos os analitos e equipamentos em uso.',
            na: 'O serviço de EAC ainda não está em funcionamento.', inf: ['eac_cq']},
          {id: 'ceq_alt', t: 'Para exames sem programa de CEQ disponível, há verificação anual da disponibilidade e forma alternativa de avaliação da exatidão?', r: [A(189), P(189, 'unico')],
            c: 'Para exames sem programa de controle externo, há verificação anual da disponibilidade e forma alternativa de avaliação.',
            nc: 'Para exames sem programa de controle externo, não há forma alternativa de avaliação da exatidão.',
            na: 'Todos os exames oferecidos têm programa de controle externo da qualidade disponível.', inf: ['eac_cq']}
        ]}
      ]
    }
  ],
  infracoes: [
    {id: 'farm_lic', grupo: 'Licenciamento e responsabilidade', texto: 'Exercer atividade de farmácia ou drogaria sem licença sanitária vigente.', r: [LM(90)]},
    {id: 'eac_lic', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas sem licença sanitária que indique a atividade.', r: [LM(90), LM(90) + '::paragrafo::1', A(63)]},
    {id: 'eac_cnes', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas sem inscrição no Cadastro Nacional de Estabelecimentos de Saúde.', r: [LM(50), A(74)]},
    {id: 'eac_rt', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas sem responsável técnico ou sem supervisor do pessoal técnico presente durante o funcionamento.', r: [LM(50), A(75), A(122)]},
    {id: 'eac_prof', grupo: 'Licenciamento e responsabilidade', texto: 'Permitir a execução de Exames de Análises Clínicas por profissional não legalmente habilitado.', r: [LM(50), A(11)]},
    {id: 'eac_tipo1', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas em desacordo com os requisitos do Serviço Tipo I.', r: [LM(50), A(10)]},
    {id: 'eac_dsf', grupo: 'Licenciamento e responsabilidade', texto: 'Deixar de registrar o resultado do Exame de Análises Clínicas na Declaração de Serviço Farmacêutico.', r: [LM(50), P(60, '2')]},
    {id: 'eac_infra', grupo: 'Infraestrutura', texto: 'Manter o serviço de Exames de Análises Clínicas sem os ambientes ou itens de infraestrutura obrigatórios.', r: [LM(50), A(13), A(14)]},
    {id: 'eac_temp', grupo: 'Produtos e equipamentos', texto: 'Armazenar produtos para diagnóstico in vitro ou materiais de controle sem as condições de conservação e o registro de temperatura exigidos.', r: [LM(46), I(14, 'v'), A(95), A(96)]},
    {id: 'eac_produto', grupo: 'Produtos e equipamentos', texto: 'Utilizar produto para diagnóstico in vitro, reagente ou equipamento sem regularização, com validade expirada ou fora das instruções do fabricante.', r: [LM(46), A(88), A(102)]},
    {id: 'eac_registros', grupo: 'Produtos e equipamentos', texto: 'Deixar de registrar o recebimento de produtos, a manutenção ou a calibração dos equipamentos, ou de manter os registros pelo prazo exigido.', r: [LM(46), A(92), A(94), A(100), A(115)]},
    {id: 'eac_pgq', grupo: 'Gestão da qualidade', texto: 'Deixar de implantar o Programa de Garantia da Qualidade do serviço de Exames de Análises Clínicas.', r: [LM(46), A(84), A(86)]},
    {id: 'eac_doc', grupo: 'Gestão da qualidade', texto: 'Deixar de manter as instruções escritas e os documentos exigidos para o serviço de Exames de Análises Clínicas.', r: [LM(50), A(110), A(117), A(119), I(154, 'i')]},
    {id: 'eac_limpeza', grupo: 'Gestão da qualidade', texto: 'Deixar de manter instruções de limpeza e o registro diário da limpeza, ou utilizar saneante sem regularização.', r: [LM(50), A(112), A(113), A(114)]},
    {id: 'eac_residuos', grupo: 'Gestão da qualidade', texto: 'Deixar de implantar o gerenciamento de resíduos de serviços de saúde do serviço de Exames de Análises Clínicas.', r: [LM(50), A(111), I(14, 'vii')]},
    {id: 'eac_saude_trab', grupo: 'Pessoal', texto: 'Deixar de garantir orientação sobre imunização dos trabalhadores ou a avaliação periódica de saúde ocupacional, com registro.', r: [LM(50), R63(43), R63(44)]},
    {id: 'eac_educacao', grupo: 'Pessoal', texto: 'Deixar de manter registros de qualificação e o Programa de Educação Permanente da equipe.', r: [LM(50), A(123), A(124), A(127)]},
    {id: 'eac_rastreab', grupo: 'Processos operacionais', texto: 'Deixar de garantir o cadastro do paciente e do exame e a identificação do material biológico que assegurem a rastreabilidade.', r: [LM(50), A(128), A(134), A(136), A(138)]},
    {id: 'eac_processo', grupo: 'Processos operacionais', texto: 'Executar Exames de Análises Clínicas sem as orientações, critérios e fluxos exigidos para as fases pré-analítica, analítica e pós-analítica.', r: [LM(50), A(132), A(139), A(154)]},
    {id: 'eac_laudo', grupo: 'Processos operacionais', texto: 'Emitir laudo sem os requisitos mínimos ou sem assinatura de profissional legalmente habilitado.', r: [LM(50), A(166), A(167)]},
    {id: 'eac_cq', grupo: 'Controle da qualidade', texto: 'Deixar de realizar e registrar o controle interno e o controle externo da qualidade dos Exames de Análises Clínicas.', r: [LM(46), A(171), A(176), A(177), A(185)]}
  ]
};
