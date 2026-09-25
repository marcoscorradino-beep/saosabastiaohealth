# Dados reais SIAPS incorporados

Esta versão substitui os dados mockados dos painéis C1-C7 por exportações CSV do SIAPS fornecidas pelo município de São Sebastião/SP.

## Cobertura
- C1 Mais Acesso: JAN/26 a JUN/26
- C2 Desenvolvimento Infantil: JAN/26 a JUN/26
- C3 Gestação e Puerpério: JAN/26 a JUN/26
- C4 Diabetes: JAN/26 a JUN/26
- C5 Hipertensão: JAN/26 a JUN/26
- C6 Pessoa Idosa: JAN/26 a JUN/26
- C7 Prevenção do Câncer: JAN/26 a JUN/26
- 26 equipes por competência nos arquivos processados.

## Funcionalidades
- seleção de competência;
- filtro por equipe/INE;
- resultado real por equipe;
- classificação informada pelo SIAPS;
- ranking real por resultado;
- visualização das boas práticas presentes no CSV;
- impressão/PDF pelo navegador.

## Observações
Os relatórios de origem estão marcados como Dado Preliminar. A média exibida no resumo é a média simples dos resultados das equipes, e não deve ser confundida com um indicador municipal recalculado a partir de microdados.

Saúde Bucal e Vínculo/Acompanhamento Territorial permanecem como próxima etapa e não foram misturados artificialmente aos indicadores C1-C7.

## Importação administrativa ampliada
A área `/admin` reconhece os relatórios mensais C1–C7, Saúde Bucal B1–B6, Vínculo e Acompanhamento Territorial (detalhado e visão geral) e os relatórios de Avaliação do Quadrimestre (Qualidade e CVAT). Cada família usa seu próprio mapeamento de cabeçalho; o importador não tenta converter esses relatórios para o formato C1–C7.

## Importação quadrimestral — atualização 25/09/2026
O importador administrativo aceita os arquivos `Desempenho Quadrimestral - Componente Qualidade` e `Desempenho Quadrimestral - Componente Vínculo e Acompanhamento Territorial` no formato real do SIAPS. Quando um único CSV contém mais de um quadrimestre, cada período é separado e armazenado individualmente pela chave componente + quadrimestre + INE. No CVAT, `Dimensão Cadastro`, `Dimensão Acompanhamento`, `Nota Final` e `Classificação Final` são preservados. No Componente Qualidade, `Nota Final` e `Classificação Final` são preservados.
